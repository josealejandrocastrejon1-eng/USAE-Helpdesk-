import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  buildTicketsCsv,
  calculateBusinessAwareSlaDeadlines,
  canPlanCoverCategory,
  canTransitionTicketStatus,
  extractDriveFileId,
  formatMXN,
  isSlaBreached,
  isSubscriptionActive,
  SLA_POLICIES,
  sortTicketsByPriorityAndDate,
  stripInternalTicketFieldsForClient,
  TICKET_CATEGORIES,
  TICKET_DEPARTMENTS,
  TICKET_PRIORITIES,
  USAE_CONTACT,
  validateAttachmentMeta,
  validatePasswordStrength,
  validateTicketInput,
  type AccountStatus,
  type AuthUser,
  type ContactInquiryRecord,
  type CorporateClient,
  type CreateTicketInput,
  type EquipmentAsset,
  type MaintenanceRecord,
  type ModuleDocRecord,
  type NotificationRecord,
  type PaymentMethodType,
  type PaymentRecord,
  type PaymentStatus,
  type ServicePlan,
  type StaffMember,
  type SubscriptionRecord,
  type SubscriptionStatus,
  type SystemSettings,
  type Ticket,
  type TicketActivity,
  type TicketAttachment,
  type TicketCategory,
  type TicketComment,
  type TicketDepartment,
  type TicketHistoryEntry,
  type TicketPriority,
  type TicketStatus,
  type UserRole,
} from '../src/utils/helpdesk.ts';
import {
  DEV_DEMO_ACCOUNTS,
  expireOverdueSubscriptions,
  generateAtomicFolio,
  isDemoModeEnabled,
} from './db.ts';
import {
  buildUsaeInstitutionalEmailHtml,
  createMercadoPagoPreference,
  fetchMercadoPagoPaymentServerToServer,
  getIntegrationsReadiness,
  verifyMercadoPagoWebhookSignature,
} from './integrations.ts';
import {
  clearSessionCookie,
  generateOpaqueToken,
  getClientIp,
  hashPassword,
  hashToken,
  parseCookies,
  sendApiError,
  sendApiSuccess,
  SESSION_COOKIE_NAME,
  setSessionCookie,
  SlidingRateLimiter,
  verifyPassword,
} from './security.ts';

export interface AppCreationOptions {
  uploadsDir: string;
  mercadoPagoFetcher?: typeof fetchMercadoPagoPaymentServerToServer;
}

interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  csrfToken?: string;
  sessionId?: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getSettingValue(db: DatabaseSync, key: string, fallback = ''): string {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? row.value : fallback;
}

function getSystemSettings(db: DatabaseSync): SystemSettings {
  let holidays: string[] = [];
  try {
    holidays = JSON.parse(getSettingValue(db, 'holidays', '[]')) as string[];
  } catch {
    holidays = [];
  }
  const clabeRaw = process.env.SPEI_CLABE?.trim() || getSettingValue(db, 'speiClabe', '');
  return {
    companyName: getSettingValue(db, 'companyName', USAE_CONTACT.company),
    systemName: getSettingValue(db, 'systemName', USAE_CONTACT.systemName),
    timezone: getSettingValue(db, 'timezone', USAE_CONTACT.timezone),
    currency: getSettingValue(db, 'currency', USAE_CONTACT.currency),
    workStartHour: Number(getSettingValue(db, 'workStartHour', '9')) || 9,
    workEndHour: Number(getSettingValue(db, 'workEndHour', '18')) || 18,
    saturdayEndHour: Number(getSettingValue(db, 'saturdayEndHour', '14')) || 14,
    holidays,
    maxUploadMb: Number(getSettingValue(db, 'maxUploadMb', '10')) || 10,
    sessionIdleMinutes: Number(getSettingValue(db, 'sessionIdleMinutes', '120')) || 120,
    policyVersion: getSettingValue(db, 'policyVersion', USAE_CONTACT.policyVersion),
    prorationPolicy: getSettingValue(db, 'prorationPolicy', ''),
    speiBankName: process.env.SPEI_BANK_NAME?.trim() || getSettingValue(db, 'speiBankName', ''),
    speiAccountHolder:
      process.env.SPEI_ACCOUNT_HOLDER?.trim() || getSettingValue(db, 'speiAccountHolder', ''),
    speiClabeMasked: clabeRaw ? `****${clabeRaw.slice(-4)}` : 'Pendiente de configurar',
  };
}

function mapPlanRow(row: Record<string, unknown>): ServicePlan {
  return {
    code: String(row.code),
    category: row.category as ServicePlan['category'],
    title: String(row.title),
    priceMXN: row.price_mxn === null || row.price_mxn === undefined ? null : Number(row.price_mxn),
    priceLabel: String(row.price_label),
    includesIva: Boolean(row.includes_iva),
    billingPeriod: row.billing_period as ServicePlan['billingPeriod'],
    minMonths: Number(row.min_months),
    maxEquipments: Number(row.max_equipments),
    monthlyVisitsIncluded: Number(row.monthly_visits_included),
    is24_7: Boolean(row.is_24_7),
    alternativePriceNote: String(row.alternative_price_note ?? ''),
    priceConfirmedByAdmin: Boolean(row.price_confirmed_by_admin),
    duration: String(row.duration),
    slaSummary: String(row.sla_summary),
    coveredCategories: JSON.parse(String(row.covered_categories_json || '[]')) as TicketCategory[],
    scope: JSON.parse(String(row.scope_json || '[]')) as string[],
    contractTerms: String(row.contract_terms),
    cancellationRule: String(row.cancellation_rule),
    guaranteeRule: String(row.guarantee_rule),
    isPublished: Boolean(row.is_published),
    version: Number(row.version),
    updatedAt: String(row.updated_at),
  };
}

function mapUserRow(row: Record<string, unknown>, clientCompany?: string | null, rfc?: string | null): AuthUser {
  return {
    id: Number(row.id),
    email: String(row.email),
    fullName: String(row.full_name),
    phone: String(row.phone ?? ''),
    role: row.role as UserRole,
    department: String(row.department ?? ''),
    accountStatus: row.account_status as AccountStatus,
    emailVerified: Boolean(row.email_verified),
    mustChangePassword: Boolean(row.must_change_password),
    clientId: row.client_id ? String(row.client_id) : null,
    clientCompany: clientCompany ?? null,
    rfc: rfc ?? null,
    employeeId: row.employee_id ? String(row.employee_id) : null,
    privacyAcceptedAt: row.privacy_accepted_at ? String(row.privacy_accepted_at) : null,
    termsAcceptedAt: row.terms_accepted_at ? String(row.terms_accepted_at) : null,
    acceptedPolicyVersion: row.accepted_policy_version ? String(row.accepted_policy_version) : null,
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : null,
  };
}

function mapSubscriptionRow(row: Record<string, unknown>): SubscriptionRecord {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    clientId: row.client_id ? String(row.client_id) : null,
    planCode: String(row.plan_code),
    planTitle: row.plan_title ? String(row.plan_title) : undefined,
    status: row.status as SubscriptionStatus,
    startsAt: row.starts_at ? String(row.starts_at) : null,
    endsAt: row.ends_at ? String(row.ends_at) : null,
    priceVersion: Number(row.price_version),
    amountMxn: Number(row.amount_mxn),
    maxEquipments: Number(row.max_equipments),
    monthlyVisitsIncluded: Number(row.monthly_visits_included),
    is24_7: Boolean(row.is_24_7),
    autoRenewConsent: Boolean(row.auto_renew_consent),
    cancellationRequestedAt: row.cancellation_requested_at ? String(row.cancellation_requested_at) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPaymentRow(row: Record<string, unknown>, includeBankDetails = false): PaymentRecord {
  return {
    paymentId: String(row.payment_id),
    userId: Number(row.user_id),
    clientId: row.client_id ? String(row.client_id) : null,
    clientEmail: String(row.client_email),
    clientCompany: String(row.client_company),
    planCode: String(row.plan_code),
    planTitle: row.plan_title ? String(row.plan_title) : undefined,
    amountMXN: Number(row.amount_mxn),
    currency: 'MXN',
    period: String(row.period),
    method: row.method as PaymentMethodType,
    status: row.status as PaymentStatus,
    mpPreferenceId: row.mp_preference_id ? String(row.mp_preference_id) : null,
    mpInitPoint: row.mp_init_point ? String(row.mp_init_point) : null,
    mpPaymentId: row.mp_payment_id ? String(row.mp_payment_id) : null,
    mpPaymentStatus: row.mp_payment_status ? String(row.mp_payment_status) : null,
    mpStatusDetail: row.mp_status_detail ? String(row.mp_status_detail) : null,
    transferReference: row.transfer_reference ? String(row.transfer_reference) : null,
    transferConcept: row.transfer_concept ? String(row.transfer_concept) : null,
    bankName: includeBankDetails && row.bank_name ? String(row.bank_name) : null,
    clabe: includeBankDetails && row.clabe ? String(row.clabe) : null,
    accountHolder: includeBankDetails && row.account_holder ? String(row.account_holder) : null,
    approvedByEmail: row.approved_by_email ? String(row.approved_by_email) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    termsVersionAccepted: String(row.terms_version_accepted),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapEquipmentRow(row: Record<string, unknown>): EquipmentAsset {
  return {
    equipmentCode: String(row.equipment_code),
    hostname: String(row.hostname),
    assignedUser: String(row.assigned_user),
    clientCode: String(row.client_code),
    brandModel: String(row.brand_model),
    osName: String(row.os_name),
    architecture: String(row.architecture),
    biosInfo: String(row.bios_info),
    firmwareVersion: String(row.firmware_version ?? ''),
    secureBoot: Boolean(row.secure_boot),
    processor: String(row.processor),
    ramInfo: String(row.ram_info),
    gpuInfo: String(row.gpu_info),
    storageInfo: String(row.storage_info),
    batteryPercent: String(row.battery_percent),
    antivirusStatus: String(row.antivirus_status),
    firewallStatus: String(row.firewall_status),
    uacStatus: String(row.uac_status),
    vbsStatus: String(row.vbs_status),
    remoteTool: String(row.remote_tool ?? ''),
    remoteId: String(row.remote_id ?? ''),
    perfmonSummary: String(row.perfmon_summary),
    diskResponseMs: Number(row.disk_response_ms),
    healthStatus: row.health_status as EquipmentAsset['healthStatus'],
    lastSecurityAudit: String(row.last_security_audit ?? ''),
    lastReportDate: String(row.last_report_date),
  };
}

function hydrateTicket(db: DatabaseSync, row: Record<string, unknown>): Ticket {
  const folio = String(row.folio);

  const commentsRows = db
    .prepare('SELECT * FROM ticket_comments WHERE ticket_folio = ? ORDER BY created_at ASC')
    .all(folio) as Record<string, unknown>[];
  const comments: TicketComment[] = commentsRows.map((c) => ({
    id: String(c.id),
    author: String(c.author),
    authorEmail: String(c.author_email),
    role: c.role as UserRole,
    isInternal: Boolean(c.is_internal),
    message: String(c.message),
    createdAt: String(c.created_at),
  }));

  const activitiesRows = db
    .prepare('SELECT * FROM ticket_activities WHERE ticket_folio = ? ORDER BY created_at ASC')
    .all(folio) as Record<string, unknown>[];
  const activities: TicketActivity[] = activitiesRows.map((a) => ({
    id: String(a.id),
    ticketFolio: folio,
    actorName: String(a.actor_name),
    actorRole: a.actor_role as UserRole,
    activityType: String(a.activity_type),
    description: String(a.description),
    durationMinutes: Number(a.duration_minutes),
    resultSummary: String(a.result_summary ?? ''),
    nextStep: String(a.next_step ?? ''),
    isInternal: Boolean(a.is_internal),
    createdAt: String(a.created_at),
  }));

  const histRows = db
    .prepare('SELECT * FROM ticket_history WHERE ticket_folio = ? ORDER BY created_at ASC')
    .all(folio) as Record<string, unknown>[];
  const history: TicketHistoryEntry[] = histRows.map((h) => ({
    id: String(h.id),
    actor: String(h.actor),
    action: String(h.action),
    previousState: h.previous_state ? String(h.previous_state) : undefined,
    newState: h.new_state ? String(h.new_state) : undefined,
    reason: h.reason ? String(h.reason) : undefined,
    createdAt: String(h.created_at),
  }));

  const attRows = db
    .prepare(
      'SELECT * FROM ticket_attachments WHERE ticket_folio = ? AND is_deleted = 0 ORDER BY created_at ASC'
    )
    .all(folio) as Record<string, unknown>[];
  const attachments: TicketAttachment[] = attRows.map((a) => ({
    id: String(a.id),
    ticketFolio: folio,
    uploadedByEmail: String(a.uploaded_by_email),
    fileName: String(a.file_name),
    fileSizeBytes: Number(a.file_size_bytes),
    fileSizeKb: Math.max(1, Math.round(Number(a.file_size_bytes) / 1024)),
    fileType: String(a.file_type),
    category: String(a.category),
    driveFileId: a.drive_file_id ? String(a.drive_file_id) : null,
    driveUrl: a.drive_url ? String(a.drive_url) : null,
    downloadUrl: `/api/attachments/${encodeURIComponent(String(a.id))}/download`,
    createdAt: String(a.created_at),
  }));

  let diagnosisChecklist = {
    reproduced: false,
    rootCauseIdentified: false,
    securityVerified: false,
    backupVerified: false,
  };
  try {
    const parsed = JSON.parse(String(row.diagnosis_checklist_json || '{}')) as Partial<typeof diagnosisChecklist>;
    diagnosisChecklist = { ...diagnosisChecklist, ...parsed };
  } catch {
    // default
  }

  return {
    id: Number(row.id),
    folio,
    userId: row.user_id ? Number(row.user_id) : undefined,
    requesterName: String(row.requester_name),
    requesterEmail: String(row.requester_email),
    requesterPhone: String(row.requester_phone ?? ''),
    clientCompany: String(row.client_company),
    clientCode: row.client_code ? String(row.client_code) : undefined,
    department: row.department as TicketDepartment,
    category: row.category as TicketCategory,
    subcategory: String(row.subcategory ?? ''),
    equipmentCode: row.equipment_code ? String(row.equipment_code) : undefined,
    serviceMode: (row.service_mode as 'REMOTO' | 'EN SITIO') || 'REMOTO',
    location: String(row.location ?? ''),
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    subject: String(row.subject),
    description: String(row.description),
    assignedTech: String(row.assigned_tech),
    assignedTechId: row.assigned_tech_id ? Number(row.assigned_tech_id) : null,
    slaVersion: Number(row.sla_version ?? 1),
    slaPlanCode: String(row.sla_plan_code ?? ''),
    slaIs24_7: Boolean(row.sla_is_24_7),
    slaDueResponse: String(row.sla_due_response),
    slaDueResolution: String(row.sla_due_resolution),
    pausedAt: row.paused_at ? String(row.paused_at) : null,
    pausedMinutes: Number(row.paused_minutes ?? 0),
    pauseReason: row.pause_reason ? String(row.pause_reason) : null,
    diagnosisChecklist,
    rootCause: String(row.root_cause ?? ''),
    activitiesPerformed: String(row.activities_performed ?? ''),
    solutionDetails: String(row.solution_details ?? ''),
    recommendations: String(row.recommendations ?? ''),
    solutionTimeMinutes: row.solution_time_minutes ? Number(row.solution_time_minutes) : undefined,
    satisfactionScore: row.satisfaction_score ? Number(row.satisfaction_score) : undefined,
    reopenReason: row.reopen_reason ? String(row.reopen_reason) : undefined,
    clientConfirmedAt: row.client_confirmed_at ? String(row.client_confirmed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    closedAt: row.closed_at ? String(row.closed_at) : undefined,
    comments,
    activities,
    history,
    attachments,
  };
}

function recordAudit(
  db: DatabaseSync,
  params: {
    actorEmail: string;
    actorRole: string;
    event: string;
    targetType?: string;
    targetId?: string;
    description: string;
    ipAddress: string;
  }
): void {
  db.prepare(`
    INSERT INTO audit_logs (id, actor_email, actor_role, event, target_type, target_id, description, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `aud-${crypto.randomUUID()}`,
    params.actorEmail,
    params.actorRole,
    params.event,
    params.targetType ?? '',
    params.targetId ?? '',
    params.description,
    params.ipAddress,
    new Date().toISOString()
  );
}

function enqueueNotification(
  db: DatabaseSync,
  params: {
    userId?: number | null;
    recipientEmail: string;
    eventType: string;
    subject: string;
    headline: string;
    paragraphs: string[];
    actionLabel?: string;
    actionUrl?: string;
  }
): void {
  const html = buildUsaeInstitutionalEmailHtml({
    title: params.subject,
    headline: params.headline,
    bodyParagraphs: params.paragraphs,
    actionLabel: params.actionLabel,
    actionUrl: params.actionUrl,
  });
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, recipient_email, channel, event_type, subject, body_preview, email_html, delivery_status, is_read, created_at)
    VALUES (?, ?, ?, 'PORTAL', ?, ?, ?, ?, ?, 0, ?)
  `).run(
    `notif-${crypto.randomUUID()}`,
    params.userId ?? null,
    params.recipientEmail,
    params.eventType,
    params.subject,
    params.paragraphs[0] ?? params.subject,
    html,
    smtpConfigured ? 'QUEUED_SMTP' : 'PORTAL_LOCAL (SMTP pendiente)',
    new Date().toISOString()
  );
}

function getLatestSubscriptionForUser(db: DatabaseSync, userId: number): SubscriptionRecord | null {
  expireOverdueSubscriptions(db);
  const activeRow = db
    .prepare(
      `SELECT s.*, p.title AS plan_title FROM subscriptions s
       LEFT JOIN plans p ON p.code = s.plan_code
       WHERE s.user_id = ? AND s.status = 'ACTIVO'
       ORDER BY s.ends_at DESC, s.id DESC LIMIT 1`
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (activeRow) return mapSubscriptionRow(activeRow);

  const latestRow = db
    .prepare(
      `SELECT s.*, p.title AS plan_title FROM subscriptions s
       LEFT JOIN plans p ON p.code = s.plan_code
       WHERE s.user_id = ?
       ORDER BY s.id DESC LIMIT 1`
    )
    .get(userId) as Record<string, unknown> | undefined;

  return latestRow ? mapSubscriptionRow(latestRow) : null;
}

function activateSubscriptionForPayment(
  db: DatabaseSync,
  params: {
    paymentId: string;
    actorEmail: string;
    actorRole: string;
    approvedByUserId?: number | null;
    ipAddress: string;
    mpPaymentId?: string;
    mpPaymentStatus?: string;
    mpStatusDetail?: string;
  }
): { alreadyProcessed: boolean; subscription: SubscriptionRecord } {
  const now = new Date().toISOString();
  const paymentRow = db
    .prepare('SELECT * FROM payments WHERE payment_id = ?')
    .get(params.paymentId) as Record<string, unknown> | undefined;

  if (!paymentRow) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  if (paymentRow.status === 'APROBADO') {
    const existingSub = getLatestSubscriptionForUser(db, Number(paymentRow.user_id));
    if (existingSub) {
      return { alreadyProcessed: true, subscription: existingSub };
    }
  }

  const planRow = db
    .prepare('SELECT * FROM plans WHERE code = ?')
    .get(String(paymentRow.plan_code)) as Record<string, unknown> | undefined;
  if (!planRow) {
    throw new Error('PLAN_NOT_FOUND');
  }
  const plan = mapPlanRow(planRow);

  const userId = Number(paymentRow.user_id);
  const clientId = paymentRow.client_id ? String(paymentRow.client_id) : null;

  // Determine start & end window (extend if currently active on same plan, otherwise start now)
  const currentActive = db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'ACTIVO' ORDER BY id DESC LIMIT 1")
    .get(userId) as Record<string, unknown> | undefined;

  const baseDate =
    currentActive?.ends_at && new Date(String(currentActive.ends_at)).getTime() > Date.now()
      ? new Date(String(currentActive.ends_at))
      : new Date();
  const durationDays = plan.billingPeriod === 'PROYECTO_UNICO' ? 90 : 30;
  const startsAt =
    currentActive?.starts_at && currentActive.plan_code === plan.code
      ? String(currentActive.starts_at)
      : now;
  const endsAt = new Date(baseDate.getTime() + durationDays * 86400_000).toISOString();

  db.exec('BEGIN IMMEDIATE;');
  try {
    // Re-check inside lock for concurrency idempotency
    if (params.mpPaymentId) {
      const dupMp = db
        .prepare("SELECT payment_id FROM payments WHERE mp_payment_id = ? AND status = 'APROBADO'")
        .get(params.mpPaymentId) as { payment_id: string } | undefined;
      if (dupMp) {
        db.exec('COMMIT;');
        const sub = getLatestSubscriptionForUser(db, userId)!;
        return { alreadyProcessed: true, subscription: sub };
      }
    }

    db.prepare(`
      UPDATE payments SET
        status = 'APROBADO',
        mp_payment_id = COALESCE(?, mp_payment_id),
        mp_payment_status = COALESCE(?, mp_payment_status),
        mp_status_detail = COALESCE(?, mp_status_detail),
        approved_by_user_id = ?,
        approved_by_email = ?,
        approved_at = ?,
        updated_at = ?
      WHERE payment_id = ?
    `).run(
      params.mpPaymentId ?? null,
      params.mpPaymentStatus ?? null,
      params.mpStatusDetail ?? null,
      params.approvedByUserId ?? null,
      params.actorEmail,
      now,
      now,
      params.paymentId
    );

    // Supersede older pending/active subscriptions cleanly while keeping history rows
    db.prepare(
      "UPDATE subscriptions SET status = 'CANCELADO', updated_at = ? WHERE user_id = ? AND status IN ('PENDIENTE_PAGO', 'PAGO_EN_REVISION')"
    ).run(now, userId);

    if (currentActive) {
      db.prepare("UPDATE subscriptions SET status = 'CANCELADO', updated_at = ? WHERE id = ?").run(
        now,
        Number(currentActive.id)
      );
    }

    const subRes = db
      .prepare(`
        INSERT INTO subscriptions (
          user_id, client_id, plan_code, status, starts_at, ends_at,
          price_version, amount_mxn, max_equipments, monthly_visits_included,
          is_24_7, auto_renew_consent, notes, created_at, updated_at
        ) VALUES (?, ?, ?, 'ACTIVO', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `)
      .run(
        userId,
        clientId,
        plan.code,
        startsAt,
        endsAt,
        plan.version,
        Number(paymentRow.amount_mxn),
        plan.maxEquipments,
        plan.monthlyVisitsIncluded,
        plan.is24_7 ? 1 : 0,
        `Activado tras confirmación de pago ${params.paymentId}`,
        now,
        now
      );

    if (clientId) {
      db.prepare(`
        UPDATE clients SET
          plan_code = ?,
          plan_status = 'ACTIVO',
          commercial_status = 'Activo',
          contract_start = ?,
          contract_end = ?,
          updated_at = ?
        WHERE client_id = ?
      `).run(plan.code, startsAt.slice(0, 10), endsAt.slice(0, 10), now, clientId);
    }

    recordAudit(db, {
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      event: 'SUBSCRIPTION_ACTIVATED',
      targetType: 'PAYMENT',
      targetId: params.paymentId,
      description: `Pago ${params.paymentId} aprobado. Plan ${plan.code} activo hasta ${endsAt.slice(0, 10)}.`,
      ipAddress: params.ipAddress,
    });

    enqueueNotification(db, {
      userId,
      recipientEmail: String(paymentRow.client_email),
      eventType: 'PAYMENT_APPROVED',
      subject: `USAE Helpdesk — Pago confirmado y plan ${plan.title} activado`,
      headline: `Tu suscripción ${plan.title} ya está activa`,
      paragraphs: [
        `Confirmamos tu pago ${params.paymentId} por ${formatMXN(Number(paymentRow.amount_mxn))} MXN.`,
        `Vigencia activa hasta el ${endsAt.slice(0, 10)}. Ya puedes registrar tus equipos (hasta ${plan.maxEquipments}) y levantar tickets de soporte en el portal.`,
      ],
    });

    db.exec('COMMIT;');
    const createdSubRow = db
      .prepare('SELECT s.*, p.title AS plan_title FROM subscriptions s LEFT JOIN plans p ON p.code = s.plan_code WHERE s.id = ?')
      .get(Number(subRes.lastInsertRowid)) as Record<string, unknown>;
    return { alreadyProcessed: false, subscription: mapSubscriptionRow(createdSubRow) };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

function canUserAccessTicket(user: AuthUser, ticket: Ticket): boolean {
  if (user.role === 'ADMINISTRADOR') return true;
  if (user.role === 'SUPERVISOR') {
    return ticket.department === user.department || ticket.assignedTechId === user.id;
  }
  if (user.role === 'TÉCNICO') {
    return ticket.assignedTechId === user.id;
  }
  // USUARIO: strictly own tickets or own client_code
  if (ticket.userId && ticket.userId === user.id) return true;
  if (user.clientId && ticket.clientCode && ticket.clientCode === user.clientId) return true;
  return false;
}

export function createHelpdeskApp(db: DatabaseSync, options: AppCreationOptions) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(express.json({ limit: '16mb' }));

  const loginLimiter = new SlidingRateLimiter(15 * 60_000, 15);
  const authActionLimiter = new SlidingRateLimiter(15 * 60_000, 20);

  // Middleware: Attach session if valid
  function attachSession(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const cookies = parseCookies(req.headers.cookie);
    const rawSid = cookies[SESSION_COOKIE_NAME];
    if (!rawSid) {
      next();
      return;
    }

    const tokenHash = hashToken(rawSid);
    const sessionRow = db
      .prepare('SELECT * FROM sessions WHERE token_hash = ? AND revoked_at IS NULL')
      .get(tokenHash) as Record<string, unknown> | undefined;

    if (!sessionRow) {
      next();
      return;
    }

    const nowMs = Date.now();
    const expiresMs = new Date(String(sessionRow.expires_at)).getTime();
    const settings = getSystemSettings(db);
    const lastActMs = new Date(String(sessionRow.last_activity_at)).getTime();
    const idleLimitMs = settings.sessionIdleMinutes * 60_000;

    if (!Number.isFinite(expiresMs) || nowMs > expiresMs || nowMs - lastActMs > idleLimitMs) {
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(
        new Date(nowMs).toISOString(),
        Number(sessionRow.id)
      );
      next();
      return;
    }

    const userRow = db
      .prepare(`
        SELECT u.*, c.trade_name AS client_trade_name, c.rfc AS client_rfc
        FROM users u
        LEFT JOIN clients c ON c.client_id = u.client_id
        WHERE u.id = ?
      `)
      .get(Number(sessionRow.user_id)) as Record<string, unknown> | undefined;

    if (!userRow || userRow.account_status !== 'ACTIVA') {
      next();
      return;
    }

    db.prepare('UPDATE sessions SET last_activity_at = ? WHERE id = ?').run(
      new Date(nowMs).toISOString(),
      Number(sessionRow.id)
    );

    req.authUser = mapUserRow(
      userRow,
      userRow.client_trade_name ? String(userRow.client_trade_name) : null,
      userRow.client_rfc ? String(userRow.client_rfc) : null
    );
    req.csrfToken = String(sessionRow.csrf_token);
    req.sessionId = Number(sessionRow.id);
    next();
  }

  function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.authUser) {
      sendApiError(res, 401, 'Debes iniciar sesión para acceder a esta sección.', 'UNAUTHENTICATED');
      return;
    }
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const provided = String(req.headers['x-csrf-token'] ?? '');
      const expected = req.csrfToken ?? '';
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        sendApiError(res, 403, 'Token de seguridad CSRF inválido o ausente.', 'CSRF_INVALID');
        return;
      }
    }
    next();
  }

  function requireRole(...roles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.authUser) {
        sendApiError(res, 401, 'Autenticación requerida.', 'UNAUTHENTICATED');
        return;
      }
      if (!roles.includes(req.authUser.role)) {
        sendApiError(
          res,
          403,
          'No cuentas con permisos suficientes para realizar esta operación.',
          'FORBIDDEN'
        );
        return;
      }
      next();
    };
  }

  app.use('/api', attachSession);

  // ==============================================================
  // 1. PUBLIC COMMERCIAL & AUTH ROUTES
  // ==============================================================

  app.get('/api/health', (_req, res) => {
    sendApiSuccess(res, 'Servicio operativo', {
      ok: true,
      service: 'usae-helpdesk',
      timezone: USAE_CONTACT.timezone,
      currency: USAE_CONTACT.currency,
    });
  });

  app.get('/api/public/config', (req: AuthenticatedRequest, res) => {
    const settings = getSystemSettings(db);
    const demoEnabled = isDemoModeEnabled();
    sendApiSuccess(res, 'Configuración pública obtenida', {
      authenticated: Boolean(req.authUser),
      contact: USAE_CONTACT,
      policyVersion: settings.policyVersion,
      maxUploadMb: settings.maxUploadMb,
      demoMode: demoEnabled,
      demoAccounts: demoEnabled
        ? DEV_DEMO_ACCOUNTS.map((a) => ({
            email: a.email,
            password: a.password,
            role: a.role,
            label: a.label,
            planStateLabel: a.planStateLabel,
          }))
        : [],
    });
  });

  app.get('/api/catalog/plans', (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM plans WHERE is_published = 1 ORDER BY code ASC')
      .all() as Record<string, unknown>[];
    const order = [
      'INF-ESENCIAL',
      'INF-EMPRESARIAL',
      'INF-CORPORATIVO',
      'DEV-BASICO',
      'DEV-PRO',
      'SEC-BASICO',
      'SEC-TOTAL',
      'CUSTOM',
    ];
    const plans = rows
      .map(mapPlanRow)
      .sort((a, b) => {
        const ia = order.indexOf(a.code);
        const ib = order.indexOf(b.code);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    sendApiSuccess(res, 'Catálogo público de planes', { plans });
  });

  app.post('/api/public/contact', (req, res) => {
    const ip = getClientIp(req);
    const rate = authActionLimiter.check(`contact:${ip}`);
    if (!rate.allowed) {
      sendApiError(res, 429, 'Demasiadas solicitudes. Intenta en unos minutos.', 'RATE_LIMITED');
      return;
    }

    const { fullName, email, phone, company, planCode, subject, message, consentAccepted } =
      req.body as Record<string, unknown>;

    if (!consentAccepted) {
      sendApiError(
        res,
        400,
        'Debes aceptar el Aviso de Privacidad y los Términos antes de enviar tu solicitud.',
        'CONSENT_REQUIRED'
      );
      return;
    }
    if (typeof fullName !== 'string' || fullName.trim().length < 3) {
      sendApiError(res, 400, 'Ingresa tu nombre completo.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      sendApiError(res, 400, 'Ingresa un correo electrónico válido.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof subject !== 'string' || subject.trim().length < 4) {
      sendApiError(res, 400, 'Indica el asunto o servicio de interés.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof message !== 'string' || message.trim().length < 15) {
      sendApiError(res, 400, 'Describe tu requerimiento (mínimo 15 caracteres).', 'VALIDATION_ERROR');
      return;
    }

    const now = new Date().toISOString();
    const id = `INQ-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    db.prepare(`
      INSERT INTO contact_inquiries (id, full_name, email, phone, company, plan_code, subject, message, consent_accepted, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'NUEVA', ?)
    `).run(
      id,
      fullName.trim(),
      email.trim().toLowerCase(),
      typeof phone === 'string' ? phone.trim() : '',
      typeof company === 'string' ? company.trim() : '',
      typeof planCode === 'string' && planCode.trim() ? planCode.trim() : null,
      subject.trim(),
      message.trim(),
      now
    );

    recordAudit(db, {
      actorEmail: email.trim().toLowerCase(),
      actorRole: 'VISITANTE',
      event: 'CONTACT_INQUIRY_CREATED',
      targetType: 'INQUIRY',
      targetId: id,
      description: `Solicitud comercial / cotización recibida (${planCode || 'GENERAL'}).`,
      ipAddress: ip,
    });

    sendApiSuccess(
      res,
      'Solicitud enviada correctamente. Nuestro equipo comercial te responderá en horario hábil.',
      { inquiryId: id },
      201
    );
  });

  app.post('/api/auth/register', (req, res) => {
    const ip = getClientIp(req);
    const rate = authActionLimiter.check(`register:${ip}`);
    if (!rate.allowed) {
      sendApiError(res, 429, 'Demasiados intentos de registro. Intenta más tarde.', 'RATE_LIMITED');
      return;
    }

    const {
      fullName,
      email,
      phone,
      companyName,
      rfc,
      password,
      confirmPassword,
      privacyAccepted,
      termsAccepted,
    } = req.body as Record<string, unknown>;

    if (typeof fullName !== 'string' || fullName.trim().length < 3) {
      sendApiError(res, 400, 'Ingresa nombre y apellidos del contacto.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      sendApiError(res, 400, 'Ingresa un correo electrónico válido.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof phone !== 'string' || phone.trim().length < 8) {
      sendApiError(res, 400, 'Ingresa un teléfono de contacto válido.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof companyName !== 'string' || companyName.trim().length < 2) {
      sendApiError(res, 400, 'Ingresa tu razón social o nombre comercial.', 'VALIDATION_ERROR');
      return;
    }
    if (typeof password !== 'string') {
      sendApiError(res, 400, 'Ingresa una contraseña segura.', 'VALIDATION_ERROR');
      return;
    }
    const pwError = validatePasswordStrength(password);
    if (pwError) {
      sendApiError(res, 400, pwError, 'WEAK_PASSWORD');
      return;
    }
    if (password !== confirmPassword) {
      sendApiError(res, 400, 'Las contraseñas no coinciden.', 'PASSWORD_MISMATCH');
      return;
    }
    if (!privacyAccepted || !termsAccepted) {
      sendApiError(
        res,
        400,
        'Debes aceptar expresamente el Aviso de Privacidad y los Términos y Condiciones.',
        'LEGAL_CONSENT_REQUIRED'
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      sendApiError(
        res,
        409,
        'No fue posible completar el registro con los datos proporcionados.',
        'REGISTER_CONFLICT'
      );
      return;
    }

    const settings = getSystemSettings(db);
    const now = new Date().toISOString();
    const rawVerifyToken = generateOpaqueToken(24);
    const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
    const clientSeq =
      ((db.prepare('SELECT COUNT(*) AS c FROM clients').get() as { c: number }).c || 0) + 100;
    const clientId = `CLI-${String(clientSeq).padStart(3, '0')}`;

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare(`
        INSERT INTO clients (
          client_id, legal_name, trade_name, person_type, industry, website,
          account_executive, commercial_status, decision_maker, decision_maker_email,
          decision_maker_phone, billing_contact, billing_email, rfc, tax_regime,
          cfdi_use, postal_code, payment_method, plan_code, plan_status,
          contract_start, contract_end, legal_checklist_json, created_at, updated_at
        ) VALUES (?, ?, ?, 'Moral', 'Por definir', '', 'Mariana Ríos', 'Prospecto', ?, ?, ?, ?, ?, ?, '601 - General de Ley Personas Morales', 'G03 - Gastos en general', '', 'PUE', 'SIN_PLAN', 'SIN_PLAN', '', '', '{}', ?, ?)
      `).run(
        clientId,
        companyName.trim(),
        companyName.trim(),
        fullName.trim(),
        normalizedEmail,
        phone.trim(),
        fullName.trim(),
        normalizedEmail,
        typeof rfc === 'string' ? rfc.trim().toUpperCase() : '',
        now,
        now
      );

      const userRes = db
        .prepare(`
          INSERT INTO users (
            email, password_hash, full_name, phone, role, department,
            account_status, email_verified, must_change_password, client_id,
            privacy_accepted_at, terms_accepted_at, accepted_policy_version,
            accepted_ip, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'USUARIO', 'Cliente Corporativo', 'PENDIENTE_VERIFICACION', 0, 0, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          normalizedEmail,
          hashPassword(password),
          fullName.trim(),
          phone.trim(),
          clientId,
          now,
          now,
          settings.policyVersion,
          ip,
          now,
          now
        );

      const userId = Number(userRes.lastInsertRowid);
      db.prepare(`
        INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at, created_at)
        VALUES (?, ?, 'EMAIL_VERIFY', ?, ?)
      `).run(userId, hashToken(rawVerifyToken), expiresAt, now);

      enqueueNotification(db, {
        userId,
        recipientEmail: normalizedEmail,
        eventType: 'EMAIL_VERIFICATION',
        subject: 'USAE Helpdesk — Verifica tu correo electrónico',
        headline: 'Confirma tu cuenta para acceder al portal',
        paragraphs: [
          `Hola ${fullName.trim()}, recibimos tu registro para ${companyName.trim()}.`,
          'Usa el token de verificación enviado para activar tu cuenta. Tu estado inicial de servicio es SIN_PLAN hasta contratar un plan vigente.',
        ],
      });

      recordAudit(db, {
        actorEmail: normalizedEmail,
        actorRole: 'USUARIO',
        event: 'USER_REGISTERED',
        targetType: 'USER',
        targetId: String(userId),
        description: `Registro creado con estado SIN_PLAN y aceptación legal v${settings.policyVersion}.`,
        ipAddress: ip,
      });

      db.exec('COMMIT;');

      const smtpConfigured = Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim());
      sendApiSuccess(
        res,
        'Cuenta creada. Verifica tu correo electrónico antes de iniciar sesión.',
        {
          email: normalizedEmail,
          accountStatus: 'PENDIENTE_VERIFICACION',
          planStatus: 'SIN_PLAN',
          // Only expose local verification token in dev/non-SMTP mode so local testing works honestly
          ...(!smtpConfigured && isDemoModeEnabled() ? { devVerificationToken: rawVerifyToken } : {}),
        },
        201
      );
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Register error:', err);
      sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.');
    }
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const { token } = req.body as { token?: string };
    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      sendApiError(res, 400, 'Token de verificación inválido o expirado.', 'INVALID_TOKEN');
      return;
    }

    const tokenHash = hashToken(token.trim());
    const row = db
      .prepare("SELECT * FROM verification_tokens WHERE token_hash = ? AND purpose = 'EMAIL_VERIFY'")
      .get(tokenHash) as Record<string, unknown> | undefined;

    if (!row || row.used_at || new Date(String(row.expires_at)).getTime() < Date.now()) {
      sendApiError(res, 400, 'El enlace o token de verificación es inválido o ya expiró.', 'INVALID_TOKEN');
      return;
    }

    const now = new Date().toISOString();
    const userId = Number(row.user_id);
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as
      | { email: string }
      | undefined;

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare('UPDATE verification_tokens SET used_at = ? WHERE id = ?').run(now, Number(row.id));
      db.prepare(
        "UPDATE users SET email_verified = 1, email_verified_at = ?, account_status = 'ACTIVA', updated_at = ? WHERE id = ?"
      ).run(now, now, userId);

      recordAudit(db, {
        actorEmail: user?.email ?? 'usuario',
        actorRole: 'USUARIO',
        event: 'EMAIL_VERIFIED',
        targetType: 'USER',
        targetId: String(userId),
        description: 'Verificación de correo completada; cuenta activada (plan SIN_PLAN).',
        ipAddress: getClientIp(req),
      });
      db.exec('COMMIT;');
      sendApiSuccess(res, 'Correo verificado correctamente. Ya puedes iniciar sesión.', {
        verified: true,
      });
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Verify email error:', err);
      sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.');
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const ip = getClientIp(req);
    const { email, password } = req.body as { email?: string; password?: string };
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    const rate = loginLimiter.check(`login:${ip}:${normalizedEmail}`);
    if (!rate.allowed) {
      sendApiError(
        res,
        429,
        `Demasiados intentos fallidos. Espera ${rate.retryAfterSeconds} segundos e intenta nuevamente.`,
        'TOO_MANY_ATTEMPTS'
      );
      return;
    }

    if (!normalizedEmail || !password) {
      sendApiError(res, 400, 'Ingresa tu correo y contraseña.', 'VALIDATION_ERROR');
      return;
    }

    const userRow = db
      .prepare(`
        SELECT u.*, c.trade_name AS client_trade_name, c.rfc AS client_rfc
        FROM users u
        LEFT JOIN clients c ON c.client_id = u.client_id
        WHERE u.email = ?
      `)
      .get(normalizedEmail) as Record<string, unknown> | undefined;

    if (!userRow) {
      sendApiError(res, 401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
      return;
    }

    if (userRow.locked_until && new Date(String(userRow.locked_until)).getTime() > Date.now()) {
      sendApiError(
        res,
        423,
        'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta más tarde.',
        'ACCOUNT_LOCKED'
      );
      return;
    }

    if (!verifyPassword(password, String(userRow.password_hash))) {
      const nextFails = Number(userRow.failed_login_attempts ?? 0) + 1;
      const lockUntil =
        nextFails >= 5 ? new Date(Date.now() + 10 * 60_000).toISOString() : null;
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?').run(
        nextFails,
        lockUntil,
        new Date().toISOString(),
        Number(userRow.id)
      );
      recordAudit(db, {
        actorEmail: normalizedEmail,
        actorRole: String(userRow.role),
        event: 'LOGIN_FAILED',
        targetType: 'USER',
        targetId: String(userRow.id),
        description: `Intento de acceso fallido (${nextFails}/5).`,
        ipAddress: ip,
      });
      sendApiError(res, 401, 'Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
      return;
    }

    if (userRow.account_status === 'PENDIENTE_VERIFICACION') {
      sendApiError(
        res,
        403,
        'Tu cuenta aún requiere verificar el correo electrónico antes de iniciar sesión.',
        'EMAIL_NOT_VERIFIED'
      );
      return;
    }

    if (userRow.account_status !== 'ACTIVA') {
      sendApiError(
        res,
        403,
        'Tu cuenta no se encuentra activa. Contacta a soporte administrativo.',
        'ACCOUNT_INACTIVE'
      );
      return;
    }

    // Regenerate session cleanly (rotate session token)
    const now = new Date().toISOString();
    const rawSessionToken = generateOpaqueToken(32);
    const csrfToken = generateOpaqueToken(24);
    const maxHours = 6;
    const expiresAt = new Date(Date.now() + maxHours * 3600_000).toISOString();

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?'
      ).run(now, now, Number(userRow.id));

      db.prepare(`
        INSERT INTO sessions (token_hash, csrf_token, user_id, ip_address, user_agent, last_activity_at, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        hashToken(rawSessionToken),
        csrfToken,
        Number(userRow.id),
        ip,
        String(req.headers['user-agent'] ?? '').slice(0, 200),
        now,
        expiresAt,
        now
      );

      recordAudit(db, {
        actorEmail: normalizedEmail,
        actorRole: String(userRow.role),
        event: 'LOGIN_SUCCESS',
        targetType: 'USER',
        targetId: String(userRow.id),
        description: 'Inicio de sesión exitoso con rotación de identificador.',
        ipAddress: ip,
      });
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Login error:', err);
      sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.');
      return;
    }

    loginLimiter.reset(`login:${ip}:${normalizedEmail}`);
    setSessionCookie(req, res, rawSessionToken, maxHours * 3600);

    const authUser = mapUserRow(
      userRow,
      userRow.client_trade_name ? String(userRow.client_trade_name) : null,
      userRow.client_rfc ? String(userRow.client_rfc) : null
    );
    const subscription = getLatestSubscriptionForUser(db, authUser.id);

    sendApiSuccess(res, 'Sesión iniciada correctamente.', {
      user: authUser,
      csrfToken,
      subscription,
    });
  });

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const rawSid = cookies[SESSION_COOKIE_NAME];
    if (rawSid) {
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').run(
        new Date().toISOString(),
        hashToken(rawSid)
      );
    }
    if (req.authUser) {
      recordAudit(db, {
        actorEmail: req.authUser.email,
        actorRole: req.authUser.role,
        event: 'LOGOUT',
        description: 'Cierre de sesión explícito.',
        ipAddress: getClientIp(req),
      });
    }
    clearSessionCookie(req, res);
    sendApiSuccess(res, 'Sesión cerrada correctamente.', { loggedOut: true });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const ip = getClientIp(req);
    const rate = authActionLimiter.check(`forgot:${ip}`);
    if (!rate.allowed) {
      sendApiError(res, 429, 'Demasiadas solicitudes. Intenta más tarde.', 'RATE_LIMITED');
      return;
    }

    const { email } = req.body as { email?: string };
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const genericMsg =
      'Si el correo corresponde a una cuenta registrada, se generaron las instrucciones de recuperación.';

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      sendApiSuccess(res, genericMsg, { sent: true });
      return;
    }

    const user = db.prepare('SELECT id, email, full_name FROM users WHERE email = ?').get(normalizedEmail) as
      | { id: number; email: string; full_name: string }
      | undefined;

    let devResetToken: string | undefined;
    if (user) {
      const rawToken = generateOpaqueToken(24);
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at, created_at)
        VALUES (?, ?, 'PASSWORD_RESET', ?, ?)
      `).run(user.id, hashToken(rawToken), expiresAt, now);

      enqueueNotification(db, {
        userId: user.id,
        recipientEmail: user.email,
        eventType: 'PASSWORD_RESET',
        subject: 'USAE Helpdesk — Restablecimiento de contraseña',
        headline: 'Solicitud de recuperación de contraseña',
        paragraphs: [
          `Hola ${user.full_name}, recibimos una solicitud para restablecer tu contraseña.`,
          'El enlace/token de recuperación es de un solo uso y expira en 30 minutos.',
        ],
      });

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: 'SISTEMA',
        event: 'PASSWORD_RESET_REQUESTED',
        targetType: 'USER',
        targetId: String(user.id),
        description: 'Token temporal de un solo uso generado para restablecimiento.',
        ipAddress: ip,
      });

      const smtpConfigured = Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim());
      if (!smtpConfigured && isDemoModeEnabled()) {
        devResetToken = rawToken;
      }
    }

    sendApiSuccess(res, genericMsg, {
      sent: true,
      ...(devResetToken ? { devResetToken } : {}),
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword, confirmPassword } = req.body as {
      token?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!token || token.trim().length < 10) {
      sendApiError(res, 400, 'Token de restablecimiento inválido o expirado.', 'INVALID_TOKEN');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      sendApiError(res, 400, 'Las contraseñas no coinciden.', 'PASSWORD_MISMATCH');
      return;
    }
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) {
      sendApiError(res, 400, pwErr, 'WEAK_PASSWORD');
      return;
    }

    const row = db
      .prepare("SELECT * FROM verification_tokens WHERE token_hash = ? AND purpose = 'PASSWORD_RESET'")
      .get(hashToken(token.trim())) as Record<string, unknown> | undefined;

    if (!row || row.used_at || new Date(String(row.expires_at)).getTime() < Date.now()) {
      sendApiError(res, 400, 'El token de restablecimiento es inválido o ya expiró.', 'INVALID_TOKEN');
      return;
    }

    const now = new Date().toISOString();
    const userId = Number(row.user_id);
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as
      | { email: string }
      | undefined;

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare('UPDATE verification_tokens SET used_at = ? WHERE id = ?').run(now, Number(row.id));
      db.prepare(
        'UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?'
      ).run(hashPassword(newPassword), now, now, userId);
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
        now,
        userId
      );
      recordAudit(db, {
        actorEmail: user?.email ?? 'usuario',
        actorRole: 'SISTEMA',
        event: 'PASSWORD_RESET_COMPLETED',
        targetType: 'USER',
        targetId: String(userId),
        description: 'Contraseña restablecida y sesiones previas revocadas.',
        ipAddress: getClientIp(req),
      });
      db.exec('COMMIT;');
      sendApiSuccess(res, 'Contraseña actualizada. Ya puedes iniciar sesión.', { reset: true });
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Reset password error:', err);
      sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.');
    }
  });

  // Mercado Pago Webhook Handler (?hook=mp OR /api/webhooks/mercadopago)
  async function handleMercadoPagoWebhook(req: Request, res: Response) {
    const ip = getClientIp(req);
    const body = req.body as {
      type?: string;
      action?: string;
      data?: { id?: string | number };
      id?: string | number;
    };
    const dataId = String(body?.data?.id ?? body?.id ?? req.query['data.id'] ?? '');
    const sigValid = verifyMercadoPagoWebhookSignature({
      xSignatureHeader: req.headers['x-signature'] as string | undefined,
      xRequestIdHeader: req.headers['x-request-id'] as string | undefined,
      dataId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    });

    if (!sigValid) {
      recordAudit(db, {
        actorEmail: 'mercadopago-webhook',
        actorRole: 'WEBHOOK',
        event: 'WEBHOOK_SIGNATURE_REJECTED',
        targetType: 'PAYMENT',
        targetId: dataId,
        description: 'Webhook de Mercado Pago rechazado por firma inválida o secreto faltante.',
        ipAddress: ip,
      });
      sendApiError(res, 401, 'Firma de webhook inválida.', 'INVALID_WEBHOOK_SIGNATURE');
      return;
    }

    const fetcher = options.mercadoPagoFetcher ?? fetchMercadoPagoPaymentServerToServer;
    const mpRes = await fetcher(dataId);
    if (!mpRes.ok || !mpRes.payment) {
      sendApiError(res, 422, 'No fue posible verificar el pago ante Mercado Pago.', 'MP_LOOKUP_FAILED');
      return;
    }

    const mpPay = mpRes.payment;
    const localPayment = db
      .prepare('SELECT * FROM payments WHERE payment_id = ?')
      .get(mpPay.external_reference) as Record<string, unknown> | undefined;

    if (!localPayment) {
      sendApiError(res, 404, 'Referencia de pago no encontrada.', 'PAYMENT_NOT_FOUND');
      return;
    }

    // Verify amount & currency integrity
    if (
      mpPay.currency_id !== 'MXN' ||
      Math.abs(Number(localPayment.amount_mxn) - mpPay.transaction_amount) > 0.01
    ) {
      recordAudit(db, {
        actorEmail: 'mercadopago-webhook',
        actorRole: 'WEBHOOK',
        event: 'WEBHOOK_AMOUNT_MISMATCH',
        targetType: 'PAYMENT',
        targetId: String(localPayment.payment_id),
        description: `Discrepancia en monto/moneda reportada por MP (${mpPay.transaction_amount} ${mpPay.currency_id}).`,
        ipAddress: ip,
      });
      sendApiError(res, 400, 'El monto o moneda del pago no coincide con la orden.', 'AMOUNT_MISMATCH');
      return;
    }

    const now = new Date().toISOString();
    if (mpPay.status !== 'approved') {
      const mappedStatus: PaymentStatus =
        mpPay.status === 'rejected'
          ? 'RECHAZADO'
          : mpPay.status === 'cancelled'
            ? 'CANCELADO'
            : mpPay.status === 'refunded'
              ? 'REEMBOLSADO'
              : 'PENDIENTE';
      db.prepare(`
        UPDATE payments SET
          status = ?, mp_payment_id = ?, mp_payment_status = ?, mp_status_detail = ?, updated_at = ?
        WHERE payment_id = ?
      `).run(
        mappedStatus,
        mpPay.id,
        mpPay.status,
        mpPay.status_detail,
        now,
        String(localPayment.payment_id)
      );
      sendApiSuccess(res, 'Estado de pago actualizado sin activación.', {
        paymentId: localPayment.payment_id,
        status: mappedStatus,
        activated: false,
      });
      return;
    }

    // Idempotent check by mp_payment_id
    const alreadyByMpId = db
      .prepare("SELECT payment_id FROM payments WHERE mp_payment_id = ? AND status = 'APROBADO'")
      .get(mpPay.id) as { payment_id: string } | undefined;

    if (alreadyByMpId) {
      sendApiSuccess(res, 'Evento procesado idempotentemente (ya estaba aprobado).', {
        paymentId: alreadyByMpId.payment_id,
        alreadyProcessed: true,
      });
      return;
    }

    const result = activateSubscriptionForPayment(db, {
      paymentId: String(localPayment.payment_id),
      actorEmail: 'mercadopago-webhook',
      actorRole: 'WEBHOOK',
      ipAddress: ip,
      mpPaymentId: mpPay.id,
      mpPaymentStatus: mpPay.status,
      mpStatusDetail: mpPay.status_detail,
    });

    sendApiSuccess(res, 'Pago verificado y suscripción activada.', {
      paymentId: localPayment.payment_id,
      alreadyProcessed: result.alreadyProcessed,
      subscription: result.subscription,
    });
  }

  app.post('/api/webhooks/mercadopago', (req, res) => {
    void handleMercadoPagoWebhook(req, res);
  });

  app.post('/', (req, res, next) => {
    if (req.query.hook === 'mp') {
      void handleMercadoPagoWebhook(req, res);
      return;
    }
    next();
  });

  // ==============================================================
  // 2. AUTHENTICATED USER, ACCOUNT, SUBSCRIPTION & CHECKOUT
  // ==============================================================

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const subscription = getLatestSubscriptionForUser(db, user.id);
    const settings = getSystemSettings(db);
    sendApiSuccess(res, 'Sesión activa', {
      user,
      csrfToken: req.csrfToken,
      subscription,
      settings,
    });
  });

  app.get('/api/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const subscription = getLatestSubscriptionForUser(db, user.id);
    const clientRow = user.clientId
      ? (db.prepare('SELECT * FROM clients WHERE client_id = ?').get(user.clientId) as
          | Record<string, unknown>
          | undefined)
      : undefined;

    const notifications = db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25')
      .all(user.id) as Record<string, unknown>[];

    const subHistory = db
      .prepare(
        `SELECT s.*, p.title AS plan_title FROM subscriptions s
         LEFT JOIN plans p ON p.code = s.plan_code
         WHERE s.user_id = ? ORDER BY s.created_at DESC`
      )
      .all(user.id) as Record<string, unknown>[];

    sendApiSuccess(res, 'Resumen de cuenta', {
      user,
      subscription,
      subscriptionHistory: subHistory.map(mapSubscriptionRow),
      client: clientRow
        ? {
            clientId: String(clientRow.client_id),
            legalName: String(clientRow.legal_name),
            tradeName: String(clientRow.trade_name),
            rfc: String(clientRow.rfc),
            taxRegime: String(clientRow.tax_regime),
            cfdiUse: String(clientRow.cfdi_use),
            postalCode: String(clientRow.postal_code),
            billingEmail: String(clientRow.billing_email),
            billingContact: String(clientRow.billing_contact),
            commercialStatus: String(clientRow.commercial_status),
          }
        : null,
      notifications: notifications.map(
        (n): NotificationRecord => ({
          id: String(n.id),
          userId: n.user_id ? Number(n.user_id) : null,
          recipientEmail: String(n.recipient_email),
          channel: n.channel as NotificationRecord['channel'],
          eventType: String(n.event_type),
          subject: String(n.subject),
          bodyPreview: String(n.body_preview),
          deliveryStatus: String(n.delivery_status),
          isRead: Boolean(n.is_read),
          createdAt: String(n.created_at),
        })
      ),
      integrations: getIntegrationsReadiness(),
    });
  });

  app.patch('/api/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const { fullName, phone, rfc, billingEmail, postalCode, currentPassword, newPassword } =
      req.body as Record<string, string | undefined>;
    const now = new Date().toISOString();

    if (newPassword) {
      const pwErr = validatePasswordStrength(newPassword);
      if (pwErr) {
        sendApiError(res, 400, pwErr, 'WEAK_PASSWORD');
        return;
      }
      const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as {
        password_hash: string;
      };
      if (!currentPassword || !verifyPassword(currentPassword, row.password_hash)) {
        sendApiError(res, 400, 'La contraseña actual es incorrecta.', 'INVALID_PASSWORD');
        return;
      }
      db.prepare(
        'UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ?, updated_at = ? WHERE id = ?'
      ).run(hashPassword(newPassword), now, now, user.id);
      db.prepare(
        'UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id != ? AND revoked_at IS NULL'
      ).run(now, user.id, req.sessionId ?? -1);
    }

    if (fullName && fullName.trim().length >= 3) {
      db.prepare('UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?').run(
        fullName.trim(),
        now,
        user.id
      );
    }
    if (typeof phone === 'string' && phone.trim().length >= 8) {
      db.prepare('UPDATE users SET phone = ?, updated_at = ? WHERE id = ?').run(
        phone.trim(),
        now,
        user.id
      );
    }

    if (user.clientId) {
      if (typeof rfc === 'string') {
        db.prepare('UPDATE clients SET rfc = ?, updated_at = ? WHERE client_id = ?').run(
          rfc.trim().toUpperCase(),
          now,
          user.clientId
        );
      }
      if (typeof billingEmail === 'string' && EMAIL_REGEX.test(billingEmail.trim())) {
        db.prepare('UPDATE clients SET billing_email = ?, updated_at = ? WHERE client_id = ?').run(
          billingEmail.trim().toLowerCase(),
          now,
          user.clientId
        );
      }
      if (typeof postalCode === 'string') {
        db.prepare('UPDATE clients SET postal_code = ?, updated_at = ? WHERE client_id = ?').run(
          postalCode.trim(),
          now,
          user.clientId
        );
      }
    }

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'ACCOUNT_UPDATED',
      targetType: 'USER',
      targetId: String(user.id),
      description: newPassword ? 'Actualización de contraseña y perfil.' : 'Actualización de datos de cuenta.',
      ipAddress: getClientIp(req),
    });

    sendApiSuccess(res, 'Datos de cuenta actualizados.', { updated: true });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
      req.params.id,
      user.id
    );
    sendApiSuccess(res, 'Notificación marcada como leída.', { read: true });
  });

  app.get('/api/subscription', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const current = getLatestSubscriptionForUser(db, user.id);
    const historyRows = db
      .prepare(
        `SELECT s.*, p.title AS plan_title FROM subscriptions s
         LEFT JOIN plans p ON p.code = s.plan_code
         WHERE s.user_id = ? ORDER BY s.created_at DESC`
      )
      .all(user.id) as Record<string, unknown>[];
    sendApiSuccess(res, 'Estado de suscripción', {
      current,
      active: isSubscriptionActive(current),
      history: historyRows.map(mapSubscriptionRow),
    });
  });

  app.post('/api/checkout', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role !== 'USUARIO') {
      sendApiError(
        res,
        403,
        'Solo las cuentas de cliente pueden contratar suscripciones comerciales.',
        'FORBIDDEN'
      );
      return;
    }

    const { planCode, method, termsAccepted, transferReference } = req.body as {
      planCode?: string;
      method?: PaymentMethodType;
      termsAccepted?: boolean;
      transferReference?: string;
    };

    if (!termsAccepted) {
      sendApiError(
        res,
        400,
        'Debes confirmar la aceptación de las condiciones comerciales del plan.',
        'TERMS_REQUIRED'
      );
      return;
    }

    const planRow = db
      .prepare('SELECT * FROM plans WHERE code = ? AND is_published = 1')
      .get(planCode ?? '') as Record<string, unknown> | undefined;
    if (!planRow) {
      sendApiError(res, 404, 'Plan no encontrado o no disponible.', 'PLAN_NOT_FOUND');
      return;
    }
    const plan = mapPlanRow(planRow);

    if (plan.priceMXN === null || plan.billingPeriod === 'COTIZACION') {
      sendApiError(
        res,
        400,
        'Este servicio es a cotización. Envía una solicitud comercial para recibir propuesta.',
        'QUOTE_ONLY_PLAN'
      );
      return;
    }

    const chosenMethod: PaymentMethodType = method === 'SPEI' ? 'SPEI' : 'MERCADO_PAGO';
    const settings = getSystemSettings(db);
    const now = new Date().toISOString();
    const paymentId = `PAY-${new Date().getFullYear()}-${String(
      ((db.prepare('SELECT COUNT(*) AS c FROM payments').get() as { c: number }).c || 0) + 1
    ).padStart(4, '0')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    const speiBankName = process.env.SPEI_BANK_NAME?.trim() || getSettingValue(db, 'speiBankName', 'Banco receptor USAE');
    const speiClabe = process.env.SPEI_CLABE?.trim() || getSettingValue(db, 'speiClabe', 'Pendiente de configurar por Admin');
    const speiHolder =
      process.env.SPEI_ACCOUNT_HOLDER?.trim() || getSettingValue(db, 'speiAccountHolder', 'USAE Soluciones Tecnológicas');

    const initialPayStatus: PaymentStatus = chosenMethod === 'SPEI' ? 'PAGO_EN_REVISION' : 'PENDIENTE';
    const transferConcept = `USAE ${plan.code} ${user.clientId ?? user.id}`;

    let mpPrefId: string | null = null;
    let mpInitPoint: string | null = null;
    let mpConfigured = false;
    let gatewayNotice: string | undefined;

    if (chosenMethod === 'MERCADO_PAGO') {
      const envAppUrl = process.env.APP_URL?.trim();
      const validEnvUrl =
        envAppUrl && (envAppUrl.startsWith('https://') || envAppUrl.startsWith('http://'))
          ? envAppUrl.replace(/\/+$/, '')
          : null;
      const appBaseUrl = validEnvUrl || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const mpRes = await createMercadoPagoPreference({
        paymentId,
        planCode: plan.code,
        planTitle: plan.title,
        amountMxn: plan.priceMXN,
        payerEmail: user.email,
        appBaseUrl,
      });
      mpConfigured = mpRes.configured;
      mpPrefId = mpRes.preferenceId ?? null;
      mpInitPoint = mpRes.initPoint ?? null;
      gatewayNotice = mpRes.errorMessage;
    }

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare(`
        INSERT INTO payments (
          payment_id, user_id, client_id, client_email, client_company, plan_code,
          amount_mxn, currency, period, method, status, mp_preference_id, mp_init_point,
          transfer_reference, transfer_concept, bank_name, clabe, account_holder,
          terms_version_accepted, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'MXN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        user.id,
        user.clientId ?? null,
        user.email,
        user.clientCompany ?? user.fullName,
        plan.code,
        plan.priceMXN,
        plan.billingPeriod,
        chosenMethod,
        initialPayStatus,
        mpPrefId,
        mpInitPoint,
        chosenMethod === 'SPEI' ? (transferReference?.trim() || null) : null,
        chosenMethod === 'SPEI' ? transferConcept : null,
        chosenMethod === 'SPEI' ? speiBankName : null,
        chosenMethod === 'SPEI' ? speiClabe : null,
        chosenMethod === 'SPEI' ? speiHolder : null,
        `${settings.policyVersion}-v${plan.version}`,
        now,
        now
      );

      // Update client's non-active subscription indicator only (NEVER activates!)
      const activeSub = getLatestSubscriptionForUser(db, user.id);
      if (!isSubscriptionActive(activeSub)) {
        const nextSubStatus: SubscriptionStatus =
          chosenMethod === 'SPEI' ? 'PAGO_EN_REVISION' : 'PENDIENTE_PAGO';
        db.prepare(`
          INSERT INTO subscriptions (
            user_id, client_id, plan_code, status, price_version, amount_mxn,
            max_equipments, monthly_visits_included, is_24_7, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          user.clientId ?? null,
          plan.code,
          nextSubStatus,
          plan.version,
          plan.priceMXN,
          plan.maxEquipments,
          plan.monthlyVisitsIncluded,
          plan.is24_7 ? 1 : 0,
          `Orden ${paymentId} en espera de confirmación (${chosenMethod}).`,
          now,
          now
        );
      }

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'PAYMENT_CHECKOUT_CREATED',
        targetType: 'PAYMENT',
        targetId: paymentId,
        description: `Orden ${paymentId} (${chosenMethod}) para ${plan.code} por ${plan.priceMXN} MXN en estado ${initialPayStatus}.`,
        ipAddress: getClientIp(req),
      });

      enqueueNotification(db, {
        userId: user.id,
        recipientEmail: user.email,
        eventType: 'PAYMENT_INITIATED',
        subject: `USAE Helpdesk — Orden de pago ${paymentId} registrada`,
        headline: `Orden ${paymentId} pendiente de confirmación`,
        paragraphs: [
          `Registramos tu intención de contratación para ${plan.title} (${formatMXN(plan.priceMXN)} MXN).`,
          chosenMethod === 'SPEI'
            ? 'Tu transferencia quedó en revisión administrativa (PAGO_EN_REVISION). El plan se activará cuando Administración valide el abono.'
            : 'El plan se activará únicamente cuando el servidor reciba y valide la confirmación de pago por Mercado Pago.',
        ],
      });

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('Checkout error:', err);
      sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.');
      return;
    }

    const row = db
      .prepare(
        `SELECT pay.*, p.title AS plan_title FROM payments pay
         LEFT JOIN plans p ON p.code = pay.plan_code
         WHERE pay.payment_id = ?`
      )
      .get(paymentId) as Record<string, unknown>;

    sendApiSuccess(
      res,
      chosenMethod === 'SPEI'
        ? 'Orden SPEI generada en estado PAGO_EN_REVISION. Un administrador validará tu abono.'
        : gatewayNotice || 'Preferencia de pago generada. Completa el pago para activar tu plan.',
      {
        payment: mapPaymentRow(row, chosenMethod === 'SPEI'),
        mercadoPagoConfigured: mpConfigured,
      },
      201
    );
  });

  app.post('/api/payments/:paymentId/spei-reference', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const { transferReference } = req.body as { transferReference?: string };
    if (!transferReference || transferReference.trim().length < 4) {
      sendApiError(res, 400, 'Ingresa una referencia o clave de rastreo SPEI válida.', 'VALIDATION_ERROR');
      return;
    }

    const payment = db
      .prepare('SELECT * FROM payments WHERE payment_id = ?')
      .get(req.params.paymentId) as Record<string, unknown> | undefined;
    if (!payment || Number(payment.user_id) !== user.id) {
      sendApiError(res, 404, 'Pago no encontrado.', 'NOT_FOUND');
      return;
    }
    if (payment.method !== 'SPEI' || payment.status === 'APROBADO') {
      sendApiError(res, 400, 'Este pago no admite actualización de referencia SPEI.', 'INVALID_STATE');
      return;
    }

    const now = new Date().toISOString();
    db.prepare(
      "UPDATE payments SET transfer_reference = ?, status = 'PAGO_EN_REVISION', updated_at = ? WHERE payment_id = ?"
    ).run(transferReference.trim(), now, req.params.paymentId);

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'SPEI_REFERENCE_SUBMITTED',
      targetType: 'PAYMENT',
      targetId: req.params.paymentId,
      description: `Referencia SPEI actualizada (${transferReference.trim()}); pendiente de validación administrativa.`,
      ipAddress: getClientIp(req),
    });

    sendApiSuccess(res, 'Referencia SPEI guardada para verificación administrativa.', {
      paymentId: req.params.paymentId,
      status: 'PAGO_EN_REVISION',
    });
  });

  app.get('/api/payments', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role === 'TÉCNICO') {
      sendApiError(res, 403, 'El rol técnico no tiene acceso a información financiera.', 'FORBIDDEN');
      return;
    }

    const rows =
      user.role === 'USUARIO'
        ? (db
            .prepare(
              `SELECT pay.*, p.title AS plan_title FROM payments pay
               LEFT JOIN plans p ON p.code = pay.plan_code
               WHERE pay.user_id = ? ORDER BY pay.created_at DESC`
            )
            .all(user.id) as Record<string, unknown>[])
        : (db
            .prepare(
              `SELECT pay.*, p.title AS plan_title FROM payments pay
               LEFT JOIN plans p ON p.code = pay.plan_code
               ORDER BY pay.created_at DESC`
            )
            .all() as Record<string, unknown>[]);

    sendApiSuccess(res, 'Historial de pagos', {
      payments: rows.map((r) => mapPaymentRow(r, true)),
    });
  });

  // ==============================================================
  // 3. TICKETS, SLA & MODULES 01-04
  // ==============================================================

  app.get('/api/tickets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const rows = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[];
    let tickets = rows.map((r) => hydrateTicket(db, r));

    if (user.role === 'USUARIO') {
      tickets = tickets
        .filter((t) => canUserAccessTicket(user, t))
        .map(stripInternalTicketFieldsForClient);
    } else if (user.role === 'TÉCNICO') {
      tickets = tickets.filter((t) => canUserAccessTicket(user, t));
    } else if (user.role === 'SUPERVISOR') {
      tickets = tickets.filter((t) => canUserAccessTicket(user, t));
    }

    sendApiSuccess(res, 'Tickets autorizados', {
      tickets: sortTicketsByPriorityAndDate(tickets),
    });
  });

  app.post('/api/tickets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role !== 'USUARIO') {
      sendApiError(
        res,
        403,
        'Solo las cuentas de cliente con suscripción vigente pueden levantar tickets de servicio.',
        'CLIENT_ROLE_REQUIRED'
      );
      return;
    }

    // Enforce active, paid, non-expired subscription
    const subscription = getLatestSubscriptionForUser(db, user.id);
    if (!subscription || subscription.status === 'SIN_PLAN') {
      sendApiError(
        res,
        403,
        'No cuentas con un plan activo. Contrata un plan en la sección Planes para abrir tickets de soporte.',
        'SUBSCRIPTION_REQUIRED'
      );
      return;
    }
    if (!isSubscriptionActive(subscription)) {
      const code = subscription.status === 'VENCIDO' ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_NOT_ACTIVE';
      const msg =
        subscription.status === 'VENCIDO'
          ? 'Tu plan ha vencido. Conservas acceso a tu historial, pero debes renovar tu suscripción para crear nuevos tickets.'
          : `Tu suscripción se encuentra en estado ${subscription.status}. Podrás crear tickets cuando el pago sea confirmado.`;
      sendApiError(res, 403, msg, code);
      return;
    }

    const payload = req.body as Partial<CreateTicketInput>;
    const errors = validateTicketInput(payload);
    if (Object.keys(errors).length > 0) {
      sendApiError(res, 400, 'Revisa los campos obligatorios antes de enviar el ticket.', 'VALIDATION_ERROR', {
        fieldErrors: errors,
      });
      return;
    }

    const planRow = db.prepare('SELECT * FROM plans WHERE code = ?').get(subscription.planCode) as
      | Record<string, unknown>
      | undefined;
    const plan = planRow ? mapPlanRow(planRow) : null;
    if (!canPlanCoverCategory(plan, payload.category!)) {
      sendApiError(
        res,
        403,
        `Tu plan actual (${subscription.planCode}) no cubre la categoría "${payload.category}". Solicita una cotización o actualiza tu plan.`,
        'CATEGORY_NOT_COVERED'
      );
      return;
    }

    // Validate linked equipment belongs to this client & respects equipment cap
    let validatedEqpCode: string | null = null;
    if (payload.equipmentCode && payload.equipmentCode.trim()) {
      const eqCode = payload.equipmentCode.trim().toUpperCase();
      const eqRow = db
        .prepare('SELECT client_code FROM equipments WHERE equipment_code = ?')
        .get(eqCode) as { client_code: string } | undefined;
      if (!eqRow) {
        sendApiError(res, 404, `Equipo ${eqCode} no encontrado.`, 'EQUIPMENT_NOT_FOUND');
        return;
      }
      if (!user.clientId || eqRow.client_code !== user.clientId) {
        sendApiError(
          res,
          403,
          'No puedes vincular un equipo que no pertenece a tu empresa.',
          'FORBIDDEN_ASSET'
        );
        return;
      }
      validatedEqpCode = eqCode;
    }

    if (user.clientId && plan) {
      const eqCount = (
        db
          .prepare('SELECT COUNT(*) AS c FROM equipments WHERE client_code = ?')
          .get(user.clientId) as { c: number }
      ).c;
      if (eqCount > plan.maxEquipments) {
        sendApiError(
          res,
          403,
          `Tu empresa excede el límite de ${plan.maxEquipments} equipos cubiertos por tu plan (${eqCount} registrados). Actualiza tu plan para continuar.`,
          'EQUIPMENT_LIMIT_EXCEEDED'
        );
        return;
      }
    }

    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const folio = generateAtomicFolio(db, year);
    const settings = getSystemSettings(db);

    const slaRow = db
      .prepare('SELECT response_minutes, resolution_minutes FROM sla_policies WHERE priority = ?')
      .get(payload.priority!) as { response_minutes: number; resolution_minutes: number } | undefined;

    const { slaDueResponse, slaDueResolution } = calculateBusinessAwareSlaDeadlines(
      payload.priority!,
      now,
      {
        is24_7: Boolean(plan?.is24_7),
        workStartHour: settings.workStartHour,
        workEndHour: settings.workEndHour,
        saturdayEndHour: settings.saturdayEndHour,
        holidays: settings.holidays,
        responseMinutesOverride: slaRow?.response_minutes,
        resolutionMinutesOverride: slaRow?.resolution_minutes,
      }
    );

    const serviceMode =
      payload.serviceMode === 'EN SITIO' && (plan?.monthlyVisitsIncluded ?? 0) > 0
        ? 'EN SITIO'
        : 'REMOTO';

    db.prepare(`
      INSERT INTO tickets (
        folio, user_id, requester_name, requester_email, requester_phone,
        client_company, client_code, department, category, subcategory,
        equipment_code, service_mode, location, priority, status, subject,
        description, assigned_tech, sla_version, sla_plan_code, sla_is_24_7,
        sla_due_response, sla_due_resolution, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NUEVO', ?, ?, 'Sin asignar', 1, ?, ?, ?, ?, ?, ?)
    `).run(
      folio,
      user.id,
      user.fullName,
      user.email,
      user.phone,
      user.clientCompany ?? user.fullName,
      user.clientId ?? null,
      payload.department!,
      payload.category!,
      payload.subcategory?.trim() ?? '',
      validatedEqpCode,
      serviceMode,
      payload.location?.trim() ?? '',
      payload.priority!,
      payload.subject!.trim(),
      payload.description!.trim(),
      subscription.planCode,
      plan?.is24_7 ? 1 : 0,
      slaDueResponse,
      slaDueResolution,
      now,
      now
    );

    db.prepare(`
      INSERT INTO ticket_history (id, ticket_folio, actor, action, new_state, created_at)
      VALUES (?, ?, ?, 'TICKET_CREADO', 'NUEVO', ?)
    `).run(`h-${crypto.randomUUID()}`, folio, user.fullName, now);

    enqueueNotification(db, {
      userId: user.id,
      recipientEmail: user.email,
      eventType: 'TICKET_CREATED',
      subject: `USAE Helpdesk — Ticket ${folio} registrado`,
      headline: `Tu solicitud ${folio} fue recibida`,
      paragraphs: [
        `Asunto: ${payload.subject!.trim()}`,
        `Prioridad: ${payload.priority!} (${SLA_POLICIES[payload.priority!].code}) · Compromiso de resolución: ${slaDueResolution.slice(0, 16).replace('T', ' ')} UTC.`,
      ],
    });

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'TICKET_CREATED',
      targetType: 'TICKET',
      targetId: folio,
      description: `Ticket ${folio} creado bajo plan ${subscription.planCode} (${payload.priority}).`,
      ipAddress: getClientIp(req),
    });

    const createdRow = db.prepare('SELECT * FROM tickets WHERE folio = ?').get(folio) as Record<
      string,
      unknown
    >;
    const ticket = stripInternalTicketFieldsForClient(hydrateTicket(db, createdRow));
    sendApiSuccess(res, `Ticket ${folio} creado correctamente.`, { ticket }, 201);
  });

  app.get('/api/tickets/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const target = req.params.id.trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
      .get(target) as Record<string, unknown> | undefined;

    if (!row) {
      sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }

    const hydrated = hydrateTicket(db, row);
    if (!canUserAccessTicket(user, hydrated)) {
      sendApiError(res, 403, 'No tienes autorización para consultar este ticket.', 'FORBIDDEN');
      return;
    }

    const finalTicket =
      user.role === 'USUARIO' ? stripInternalTicketFieldsForClient(hydrated) : hydrated;
    sendApiSuccess(res, 'Detalle de ticket', { ticket: finalTicket });
  });

  app.post('/api/tickets/:id/comments', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const target = req.params.id.trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
      .get(target) as Record<string, unknown> | undefined;
    if (!row) {
      sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }
    const ticket = hydrateTicket(db, row);
    if (!canUserAccessTicket(user, ticket)) {
      sendApiError(res, 403, 'No tienes autorización para comentar este ticket.', 'FORBIDDEN');
      return;
    }

    const { message, isInternal } = req.body as { message?: string; isInternal?: boolean };
    if (!message || message.trim().length < 2) {
      sendApiError(res, 400, 'El comentario debe contener al menos 2 caracteres.', 'VALIDATION_ERROR');
      return;
    }

    const internalFlag = user.role === 'USUARIO' ? false : Boolean(isInternal);
    const now = new Date().toISOString();
    const commentId = `c-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO ticket_comments (id, ticket_folio, author, author_email, role, is_internal, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      commentId,
      ticket.folio,
      user.fullName,
      user.email,
      user.role,
      internalFlag ? 1 : 0,
      message.trim(),
      now
    );

    db.prepare('UPDATE tickets SET updated_at = ? WHERE folio = ?').run(now, ticket.folio);

    if (!internalFlag && user.role !== 'USUARIO' && ticket.userId) {
      enqueueNotification(db, {
        userId: ticket.userId,
        recipientEmail: ticket.requesterEmail,
        eventType: 'TICKET_COMMENT',
        subject: `USAE Helpdesk — Nuevo comentario en ${ticket.folio}`,
        headline: `Actualización pública en tu ticket ${ticket.folio}`,
        paragraphs: [`${user.fullName} escribió: "${message.trim()}"`],
      });
    }

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: internalFlag ? 'TICKET_INTERNAL_NOTE' : 'TICKET_PUBLIC_COMMENT',
      targetType: 'TICKET',
      targetId: ticket.folio,
      description: internalFlag ? 'Nota interna agregada por personal técnico.' : 'Comentario público agregado.',
      ipAddress: getClientIp(req),
    });

    const updated = hydrateTicket(
      db,
      db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
    );
    sendApiSuccess(
      res,
      internalFlag ? 'Nota interna registrada.' : 'Comentario publicado.',
      { ticket: user.role === 'USUARIO' ? stripInternalTicketFieldsForClient(updated) : updated },
      201
    );
  });

  app.post(
    '/api/tickets/:id/activities',
    requireAuth,
    requireRole('TÉCNICO', 'SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const target = req.params.id.trim().toUpperCase();
      const row = db
        .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
        .get(target) as Record<string, unknown> | undefined;
      if (!row) {
        sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
        return;
      }
      const ticket = hydrateTicket(db, row);
      if (!canUserAccessTicket(user, ticket)) {
        sendApiError(res, 403, 'No tienes autorización sobre este ticket.', 'FORBIDDEN');
        return;
      }

      const { activityType, description, durationMinutes, resultSummary, nextStep, isInternal } =
        req.body as {
          activityType?: string;
          description?: string;
          durationMinutes?: number;
          resultSummary?: string;
          nextStep?: string;
          isInternal?: boolean;
        };

      if (!description || description.trim().length < 4) {
        sendApiError(res, 400, 'Describe la actividad realizada.', 'VALIDATION_ERROR');
        return;
      }

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO ticket_activities (
          id, ticket_folio, actor_name, actor_role, activity_type, description,
          duration_minutes, result_summary, next_step, is_internal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `act-${crypto.randomUUID()}`,
        ticket.folio,
        user.fullName,
        user.role,
        (activityType || 'SEGUIMIENTO').trim(),
        description.trim(),
        Math.max(0, Number(durationMinutes) || 0),
        (resultSummary || '').trim(),
        (nextStep || '').trim(),
        isInternal ? 1 : 0,
        now
      );
      db.prepare('UPDATE tickets SET updated_at = ? WHERE folio = ?').run(now, ticket.folio);

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'TICKET_ACTIVITY_LOGGED',
        targetType: 'TICKET',
        targetId: ticket.folio,
        description: `Actividad ${activityType || 'SEGUIMIENTO'} (${Number(durationMinutes) || 0} min) registrada.`,
        ipAddress: getClientIp(req),
      });

      const updated = hydrateTicket(
        db,
        db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
      );
      sendApiSuccess(res, 'Actividad registrada en bitácora (Módulo 02).', { ticket: updated }, 201);
    }
  );

  app.post(
    '/api/tickets/:id/assign',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const target = req.params.id.trim().toUpperCase();
      const row = db
        .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
        .get(target) as Record<string, unknown> | undefined;
      if (!row) {
        sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
        return;
      }
      const ticket = hydrateTicket(db, row);
      if (!canUserAccessTicket(user, ticket)) {
        sendApiError(res, 403, 'Fuera de tu ámbito departamental.', 'FORBIDDEN');
        return;
      }

      const { techUserId, reason } = req.body as { techUserId?: number; reason?: string };
      const techRow = db
        .prepare("SELECT id, full_name, email, employee_id, role FROM users WHERE id = ? AND role IN ('TÉCNICO', 'SUPERVISOR', 'ADMINISTRADOR') AND account_status = 'ACTIVA'")
        .get(Number(techUserId)) as
        | { id: number; full_name: string; email: string; employee_id: string | null; role: UserRole }
        | undefined;

      if (!techRow) {
        sendApiError(res, 400, 'Selecciona un ingeniero técnico activo válido.', 'INVALID_TECHNICIAN');
        return;
      }

      const isReassign = ticket.assignedTech !== 'Sin asignar' && ticket.assignedTechId !== techRow.id;
      if (isReassign && (!reason || reason.trim().length < 5)) {
        sendApiError(
          res,
          400,
          'El Módulo 01 exige indicar un motivo obligatorio al reasignar un ticket.',
          'REASSIGN_REASON_REQUIRED'
        );
        return;
      }

      const now = new Date().toISOString();
      const techLabel = techRow.employee_id
        ? `${techRow.full_name} (${techRow.employee_id})`
        : techRow.full_name;
      const nextStatus: TicketStatus = ticket.status === 'NUEVO' ? 'ASIGNADO' : ticket.status;

      db.prepare(`
        UPDATE tickets SET assigned_tech = ?, assigned_tech_id = ?, status = ?, updated_at = ?
        WHERE folio = ?
      `).run(techLabel, techRow.id, nextStatus, now, ticket.folio);

      db.prepare(`
        INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `h-${crypto.randomUUID()}`,
        ticket.folio,
        user.fullName,
        isReassign ? 'REASIGNACION_TECNICO' : 'ASIGNACION_TECNICO',
        ticket.assignedTech,
        techLabel,
        reason?.trim() ?? null,
        now
      );

      enqueueNotification(db, {
        userId: techRow.id,
        recipientEmail: techRow.email,
        eventType: 'TICKET_ASSIGNED',
        subject: `USAE Helpdesk — Ticket ${ticket.folio} asignado`,
        headline: `Se te asignó el ticket ${ticket.folio}`,
        paragraphs: [
          `Cliente: ${ticket.clientCompany} · Prioridad: ${ticket.priority}`,
          `Asunto: ${ticket.subject}`,
        ],
      });

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: isReassign ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED',
        targetType: 'TICKET',
        targetId: ticket.folio,
        description: `Asignado a ${techLabel}.${reason ? ` Motivo: ${reason.trim()}` : ''}`,
        ipAddress: getClientIp(req),
      });

      const updated = hydrateTicket(
        db,
        db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
      );
      sendApiSuccess(res, `Ticket asignado a ${techLabel}.`, { ticket: updated });
    }
  );

  app.post(
    '/api/tickets/:id/status',
    requireAuth,
    requireRole('TÉCNICO', 'SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const target = req.params.id.trim().toUpperCase();
      const row = db
        .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
        .get(target) as Record<string, unknown> | undefined;
      if (!row) {
        sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
        return;
      }
      const ticket = hydrateTicket(db, row);
      if (!canUserAccessTicket(user, ticket)) {
        sendApiError(res, 403, 'No tienes autorización sobre este ticket.', 'FORBIDDEN');
        return;
      }

      const { status, priority, pauseReason } = req.body as {
        status?: TicketStatus;
        priority?: TicketPriority;
        pauseReason?: string;
      };

      const now = new Date().toISOString();
      let nextStatus = ticket.status;
      let pausedAt = ticket.pausedAt ?? null;
      let pausedMinutes = ticket.pausedMinutes ?? 0;
      let nextPauseReason = ticket.pauseReason ?? null;

      if (status && status !== ticket.status) {
        const trans = canTransitionTicketStatus(ticket.status, status, user.role);
        if (!trans.allowed) {
          sendApiError(res, 400, trans.reason || 'Transición inválida.', 'INVALID_STATUS_TRANSITION');
          return;
        }
        if (status === 'EN ESPERA') {
          if (!pauseReason || pauseReason.trim().length < 4) {
            sendApiError(
              res,
              400,
              'Indica el motivo de espera para pausar el cómputo SLA.',
              'PAUSE_REASON_REQUIRED'
            );
            return;
          }
          pausedAt = now;
          nextPauseReason = pauseReason.trim();
        } else if (ticket.status === 'EN ESPERA' && ticket.pausedAt) {
          const deltaMins = Math.max(
            0,
            Math.round((Date.now() - new Date(ticket.pausedAt).getTime()) / 60_000)
          );
          pausedMinutes += deltaMins;
          pausedAt = null;
        }
        nextStatus = status;

        db.prepare(`
          INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, reason, created_at)
          VALUES (?, ?, ?, 'CAMBIO_ESTADO', ?, ?, ?, ?)
        `).run(
          `h-${crypto.randomUUID()}`,
          ticket.folio,
          user.fullName,
          ticket.status,
          nextStatus,
          pauseReason?.trim() ?? null,
          now
        );
      }

      let nextPriority = ticket.priority;
      if (
        priority &&
        TICKET_PRIORITIES.includes(priority) &&
        priority !== ticket.priority &&
        (user.role === 'SUPERVISOR' || user.role === 'ADMINISTRADOR')
      ) {
        nextPriority = priority;
        db.prepare(`
          INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, created_at)
          VALUES (?, ?, ?, 'RECALIBRACION_PRIORIDAD', ?, ?, ?)
        `).run(`h-${crypto.randomUUID()}`, ticket.folio, user.fullName, ticket.priority, nextPriority, now);
      }

      db.prepare(`
        UPDATE tickets SET
          status = ?, priority = ?, paused_at = ?, paused_minutes = ?, pause_reason = ?, updated_at = ?
        WHERE folio = ?
      `).run(nextStatus, nextPriority, pausedAt, pausedMinutes, nextPauseReason, now, ticket.folio);

      if (ticket.userId && nextStatus !== ticket.status) {
        enqueueNotification(db, {
          userId: ticket.userId,
          recipientEmail: ticket.requesterEmail,
          eventType: 'TICKET_STATUS_CHANGED',
          subject: `USAE Helpdesk — Ticket ${ticket.folio} ahora está ${nextStatus}`,
          headline: `Cambio de estado en ${ticket.folio}`,
          paragraphs: [
            `Estado actualizado de ${ticket.status} a ${nextStatus}.`,
            nextPauseReason && nextStatus === 'EN ESPERA'
              ? `Motivo de espera: ${nextPauseReason}`
              : 'Consulta el detalle en tu portal para ver el avance.',
          ],
        });
      }

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'TICKET_STATUS_UPDATED',
        targetType: 'TICKET',
        targetId: ticket.folio,
        description: `Estado ${ticket.status} -> ${nextStatus}, Prioridad ${nextPriority}.`,
        ipAddress: getClientIp(req),
      });

      const updated = hydrateTicket(
        db,
        db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
      );
      sendApiSuccess(res, 'Ticket actualizado.', { ticket: updated });
    }
  );

  // Module 04 — Close / Resolve Ticket
  app.post('/api/tickets/:id/close', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const target = req.params.id.trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
      .get(target) as Record<string, unknown> | undefined;
    if (!row) {
      sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }
    const ticket = hydrateTicket(db, row);
    if (!canUserAccessTicket(user, ticket)) {
      sendApiError(res, 403, 'No tienes autorización sobre este ticket.', 'FORBIDDEN');
      return;
    }

    const now = new Date().toISOString();

    if (user.role === 'USUARIO') {
      if (ticket.status !== 'RESUELTO') {
        sendApiError(
          res,
          400,
          'Solo puedes confirmar el cierre cuando el ticket haya sido marcado como RESUELTO por el equipo técnico.',
          'INVALID_CLOSE_STATE'
        );
        return;
      }
      const { satisfactionScore } = req.body as { satisfactionScore?: number };
      const score =
        typeof satisfactionScore === 'number' && satisfactionScore >= 1 && satisfactionScore <= 5
          ? Math.round(satisfactionScore)
          : 5;

      db.prepare(`
        UPDATE tickets SET
          status = 'CERRADO', satisfaction_score = ?, client_confirmed_at = ?, closed_at = ?, updated_at = ?
        WHERE folio = ?
      `).run(score, now, now, now, ticket.folio);

      db.prepare(`
        INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, reason, created_at)
        VALUES (?, ?, ?, 'CIERRE_CONFIRMADO_CLIENTE', 'RESUELTO', 'CERRADO', ?, ?)
      `).run(
        `h-${crypto.randomUUID()}`,
        ticket.folio,
        user.fullName,
        `Calificación otorgada: ${score}/5`,
        now
      );

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'TICKET_CLOSED_BY_CLIENT',
        targetType: 'TICKET',
        targetId: ticket.folio,
        description: `Cliente confirmó cierre de ${ticket.folio} con calificación ${score}/5.`,
        ipAddress: getClientIp(req),
      });

      const updated = stripInternalTicketFieldsForClient(
        hydrateTicket(
          db,
          db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
        )
      );
      sendApiSuccess(res, 'Ticket cerrado y encuesta registrada. ¡Gracias!', { ticket: updated });
      return;
    }

    // Technical resolution / closure by staff (Module 04 mandatory fields)
    const {
      rootCause,
      activitiesPerformed,
      solutionDetails,
      recommendations,
      diagnosisChecklist,
      finalStatus,
    } = req.body as {
      rootCause?: string;
      activitiesPerformed?: string;
      solutionDetails?: string;
      recommendations?: string;
      diagnosisChecklist?: Record<string, boolean>;
      finalStatus?: 'RESUELTO' | 'CERRADO';
    };

    if (!rootCause || rootCause.trim().length < 5) {
      sendApiError(res, 400, 'Registra la causa raíz antes de resolver el ticket (Módulo 04).', 'ROOT_CAUSE_REQUIRED');
      return;
    }
    if (!solutionDetails || solutionDetails.trim().length < 8) {
      sendApiError(res, 400, 'Registra el detalle de la solución aplicada (Módulo 04).', 'SOLUTION_REQUIRED');
      return;
    }
    if (!activitiesPerformed || activitiesPerformed.trim().length < 5) {
      sendApiError(res, 400, 'Registra las actividades ejecutadas (Módulo 04).', 'ACTIVITIES_REQUIRED');
      return;
    }

    const nextStatus: TicketStatus =
      finalStatus === 'CERRADO' && (user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR')
        ? 'CERRADO'
        : 'RESUELTO';
    const solMins = Math.max(
      1,
      Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60_000) - (ticket.pausedMinutes ?? 0)
    );

    db.prepare(`
      UPDATE tickets SET
        status = ?, root_cause = ?, activities_performed = ?, solution_details = ?,
        recommendations = ?, diagnosis_checklist_json = ?, solution_time_minutes = ?,
        resolved_at = COALESCE(resolved_at, ?),
        closed_at = CASE WHEN ? = 'CERRADO' THEN COALESCE(closed_at, ?) ELSE closed_at END,
        paused_at = NULL,
        updated_at = ?
      WHERE folio = ?
    `).run(
      nextStatus,
      rootCause.trim(),
      activitiesPerformed.trim(),
      solutionDetails.trim(),
      (recommendations || '').trim(),
      JSON.stringify(diagnosisChecklist || {}),
      solMins,
      now,
      nextStatus,
      now,
      now,
      ticket.folio
    );

    db.prepare(`
      INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, created_at)
      VALUES (?, ?, ?, 'RESOLUCION_TECNICA', ?, ?, ?)
    `).run(`h-${crypto.randomUUID()}`, ticket.folio, user.fullName, ticket.status, nextStatus, now);

    if (ticket.userId) {
      enqueueNotification(db, {
        userId: ticket.userId,
        recipientEmail: ticket.requesterEmail,
        eventType: 'TICKET_RESOLVED',
        subject: `USAE Helpdesk — Ticket ${ticket.folio} resuelto`,
        headline: `Tu ticket ${ticket.folio} fue resuelto`,
        paragraphs: [
          `Solución aplicada: ${solutionDetails.trim()}`,
          'Ingresa a tu portal para confirmar el cierre y calificar la atención (1 a 5 estrellas).',
        ],
      });
    }

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'TICKET_RESOLVED',
      targetType: 'TICKET',
      targetId: ticket.folio,
      description: `Ticket marcado como ${nextStatus}. Tiempo de solución: ${solMins} min.`,
      ipAddress: getClientIp(req),
    });

    const updated = hydrateTicket(
      db,
      db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
    );
    sendApiSuccess(res, `Ticket marcado como ${nextStatus}.`, { ticket: updated });
  });

  app.post('/api/tickets/:id/reopen', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const target = req.params.id.trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
      .get(target) as Record<string, unknown> | undefined;
    if (!row) {
      sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }
    const ticket = hydrateTicket(db, row);
    if (!canUserAccessTicket(user, ticket)) {
      sendApiError(res, 403, 'No tienes autorización sobre este ticket.', 'FORBIDDEN');
      return;
    }
    if (ticket.status !== 'RESUELTO' && ticket.status !== 'CERRADO') {
      sendApiError(res, 400, 'Solo es posible reabrir un ticket resuelto o cerrado.', 'INVALID_REOPEN');
      return;
    }

    const { reason } = req.body as { reason?: string };
    if (!reason || reason.trim().length < 10) {
      sendApiError(
        res,
        400,
        'Debes indicar el motivo de la reapertura (mínimo 10 caracteres).',
        'REOPEN_REASON_REQUIRED'
      );
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE tickets SET status = 'EN PROCESO', reopen_reason = ?, closed_at = NULL, updated_at = ?
      WHERE folio = ?
    `).run(reason.trim(), now, ticket.folio);

    db.prepare(`
      INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, reason, created_at)
      VALUES (?, ?, ?, 'REAPERTURA_CONTROLADA', ?, 'EN PROCESO', ?, ?)
    `).run(`h-${crypto.randomUUID()}`, ticket.folio, user.fullName, ticket.status, reason.trim(), now);

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'TICKET_REOPENED',
      targetType: 'TICKET',
      targetId: ticket.folio,
      description: `Reapertura controlada solicitada. Motivo: ${reason.trim()}`,
      ipAddress: getClientIp(req),
    });

    const updated = hydrateTicket(
      db,
      db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
    );
    sendApiSuccess(res, 'Ticket reabierto y canalizado a seguimiento.', {
      ticket: user.role === 'USUARIO' ? stripInternalTicketFieldsForClient(updated) : updated,
    });
  });

  // Module 03 — Protected Attachments Upload & Download
  app.post('/api/tickets/:id/attachments', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const target = req.params.id.trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM tickets WHERE UPPER(folio) = ?')
      .get(target) as Record<string, unknown> | undefined;
    if (!row) {
      sendApiError(res, 404, 'Ticket no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }
    const ticket = hydrateTicket(db, row);
    if (!canUserAccessTicket(user, ticket)) {
      sendApiError(res, 403, 'No tienes autorización sobre este ticket.', 'FORBIDDEN');
      return;
    }

    const { fileName, mimeType, contentBase64, category, driveUrl } = req.body as {
      fileName?: string;
      mimeType?: string;
      contentBase64?: string;
      category?: string;
      driveUrl?: string;
    };

    const settings = getSystemSettings(db);
    let fileBuffer: Buffer;
    try {
      const cleanB64 = String(contentBase64 || '').replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(cleanB64, 'base64');
    } catch {
      sendApiError(res, 400, 'Contenido del archivo inválido.', 'INVALID_FILE');
      return;
    }

    const check = validateAttachmentMeta(
      fileName || '',
      mimeType || 'application/octet-stream',
      fileBuffer.length,
      settings.maxUploadMb
    );
    if (!check.valid) {
      sendApiError(res, 400, check.reason || 'Archivo rechazado por política de seguridad.', 'INVALID_ATTACHMENT');
      return;
    }

    const safeFileName = path.basename(fileName!).replace(/[^a-zA-Z0-9._-]/g, '_');
    const attId = `att-${crypto.randomUUID()}`;
    const storageKey = `${ticket.folio}/${attId}_${safeFileName}`;
    const fullDiskPath = path.resolve(options.uploadsDir, storageKey);

    await fs.mkdir(path.dirname(fullDiskPath), { recursive: true });
    await fs.writeFile(fullDiskPath, fileBuffer);

    const driveId = driveUrl ? extractDriveFileId(driveUrl) : '';
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ticket_attachments (
        id, ticket_folio, uploaded_by_email, file_name, storage_key,
        file_size_bytes, file_type, category, drive_file_id, drive_url, is_deleted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      attId,
      ticket.folio,
      user.email,
      safeFileName,
      storageKey,
      fileBuffer.length,
      (mimeType || 'application/octet-stream').split(';')[0].trim(),
      (category || 'EVIDENCIA').trim(),
      driveId || null,
      driveUrl?.trim() || null,
      now
    );

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'ATTACHMENT_UPLOADED',
      targetType: 'TICKET',
      targetId: ticket.folio,
      description: `Evidencia segura cargada (${safeFileName}, ${fileBuffer.length} bytes).`,
      ipAddress: getClientIp(req),
    });

    const updated = hydrateTicket(
      db,
      db.prepare('SELECT * FROM tickets WHERE folio = ?').get(ticket.folio) as Record<string, unknown>
    );
    sendApiSuccess(
      res,
      'Evidencia cargada con resguardo privado.',
      { ticket: user.role === 'USUARIO' ? stripInternalTicketFieldsForClient(updated) : updated },
      201
    );
  });

  app.get('/api/attachments/:attId/download', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const attRow = db
      .prepare('SELECT * FROM ticket_attachments WHERE id = ? AND is_deleted = 0')
      .get(req.params.attId) as Record<string, unknown> | undefined;

    if (!attRow) {
      sendApiError(res, 404, 'Archivo no encontrado.', 'ATTACHMENT_NOT_FOUND');
      return;
    }

    const ticketRow = db
      .prepare('SELECT * FROM tickets WHERE folio = ?')
      .get(String(attRow.ticket_folio)) as Record<string, unknown> | undefined;
    if (!ticketRow) {
      sendApiError(res, 404, 'Ticket asociado no encontrado.', 'TICKET_NOT_FOUND');
      return;
    }
    const ticket = hydrateTicket(db, ticketRow);
    if (!canUserAccessTicket(user, ticket)) {
      sendApiError(res, 403, 'No tienes autorización para descargar este archivo.', 'FORBIDDEN');
      return;
    }

    const fullPath = path.resolve(options.uploadsDir, String(attRow.storage_key));
    const resolvedRoot = path.resolve(options.uploadsDir);
    if (fullPath !== resolvedRoot && !fullPath.startsWith(resolvedRoot + path.sep)) {
      sendApiError(res, 403, 'Ruta de archivo inválida.', 'FORBIDDEN');
      return;
    }

    try {
      const data = await fs.readFile(fullPath);
      const safeFileName = String(attRow.file_name || 'archivo').replace(/["\r\n\\]/g, '_');
      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'ATTACHMENT_DOWNLOADED',
        targetType: 'ATTACHMENT',
        targetId: String(attRow.id),
        description: `Descarga autorizada de ${attRow.file_name} (${ticket.folio}).`,
        ipAddress: getClientIp(req),
      });
      res.setHeader('Content-Type', String(attRow.file_type || 'application/octet-stream'));
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(data);
    } catch {
      sendApiError(res, 404, 'Archivo no disponible en almacenamiento.', 'FILE_MISSING');
    }
  });

  // ==============================================================
  // 4. ASSETS, MAINTENANCES (MOD 05), MODULES (00-07), REPORTS (MOD 07)
  // ==============================================================

  app.get('/api/assets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    let rows: Record<string, unknown>[] = [];
    if (user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR') {
      rows = db.prepare('SELECT * FROM equipments ORDER BY equipment_code ASC').all() as Record<
        string,
        unknown
      >[];
    } else if (user.role === 'TÉCNICO') {
      rows = db
        .prepare(`
          SELECT DISTINCT e.* FROM equipments e
          INNER JOIN tickets t ON t.equipment_code = e.equipment_code
          WHERE t.assigned_tech_id = ?
          ORDER BY e.equipment_code ASC
        `)
        .all(user.id) as Record<string, unknown>[];
    } else if (user.clientId) {
      rows = db
        .prepare('SELECT * FROM equipments WHERE client_code = ? ORDER BY equipment_code ASC')
        .all(user.clientId) as Record<string, unknown>[];
    }

    sendApiSuccess(res, 'Activos autorizados', { equipments: rows.map(mapEquipmentRow) });
  });

  app.post('/api/assets', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const {
      hostname,
      assignedUser,
      clientCode,
      brandModel,
      osName,
      processor,
      ramInfo,
      storageInfo,
      antivirusStatus,
      firewallStatus,
      secureBoot,
    } = req.body as Record<string, unknown>;

    const targetClientCode = user.role === 'USUARIO' ? user.clientId : String(clientCode || '');
    if (!targetClientCode) {
      sendApiError(res, 400, 'Cliente propietario requerido para registrar el equipo.', 'CLIENT_REQUIRED');
      return;
    }

    if (user.role === 'USUARIO') {
      const sub = getLatestSubscriptionForUser(db, user.id);
      if (!isSubscriptionActive(sub)) {
        sendApiError(
          res,
          403,
          'Necesitas un plan activo para dar de alta nuevos equipos bajo cobertura.',
          'SUBSCRIPTION_REQUIRED'
        );
        return;
      }
      const count = (
        db
          .prepare('SELECT COUNT(*) AS c FROM equipments WHERE client_code = ?')
          .get(targetClientCode) as { c: number }
      ).c;
      if (count >= sub!.maxEquipments) {
        sendApiError(
          res,
          403,
          `Tu plan permite hasta ${sub!.maxEquipments} equipos. Actualiza tu plan para registrar más.`,
          'EQUIPMENT_LIMIT_EXCEEDED'
        );
        return;
      }
    }

    if (typeof hostname !== 'string' || hostname.trim().length < 3 || typeof brandModel !== 'string') {
      sendApiError(res, 400, 'Ingresa hostname y marca/modelo del equipo.', 'VALIDATION_ERROR');
      return;
    }

    const total = (db.prepare('SELECT COUNT(*) AS c FROM equipments').get() as { c: number }).c + 1;
    const equipmentCode = `EQP-${String(total).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const av = String(antivirusStatus || 'Activo / Actualizado');
    const fw = String(firewallStatus || 'Activo');
    const health =
      av.toLowerCase().includes('inactivo') || fw.toLowerCase().includes('inactivo')
        ? 'CRÍTICO'
        : !secureBoot
          ? 'ATENCIÓN REQUERIDA'
          : 'ÓPTIMO';

    db.prepare(`
      INSERT INTO equipments (
        equipment_code, hostname, assigned_user, client_code, brand_model, os_name,
        architecture, bios_info, secure_boot, processor, ram_info, gpu_info,
        storage_info, battery_percent, antivirus_status, firewall_status, uac_status,
        vbs_status, perfmon_summary, disk_response_ms, health_status, last_security_audit, last_report_date
      ) VALUES (?, ?, ?, ?, ?, ?, 'x64', 'UEFI Verificado', ?, ?, ?, 'Integrada', ?, 'N/A', ?, ?, 'Habilitado', 'Habilitada', 'Alta inicial desde portal', 1.5, ?, ?, ?)
    `).run(
      equipmentCode,
      hostname.trim().toUpperCase(),
      String(assignedUser || user.fullName).trim(),
      targetClientCode,
      brandModel.trim(),
      String(osName || 'Windows 11 Pro').trim(),
      secureBoot === false ? 0 : 1,
      String(processor || 'Por inventariar').trim(),
      String(ramInfo || '16 GB').trim(),
      String(storageInfo || '512 GB SSD').trim(),
      av,
      fw,
      health,
      today,
      today
    );

    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'ASSET_CREATED',
      targetType: 'EQUIPMENT',
      targetId: equipmentCode,
      description: `Equipo ${equipmentCode} (${hostname.trim()}) registrado para ${targetClientCode}.`,
      ipAddress: getClientIp(req),
    });

    const created = db
      .prepare('SELECT * FROM equipments WHERE equipment_code = ?')
      .get(equipmentCode) as Record<string, unknown>;
    sendApiSuccess(res, `Equipo ${equipmentCode} registrado.`, { equipment: mapEquipmentRow(created) }, 201);
  });

  // Module 05 — Maintenances
  app.get('/api/maintenances', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    let rows: Record<string, unknown>[] = [];
    if (user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR') {
      rows = db.prepare('SELECT * FROM maintenances ORDER BY scheduled_start ASC').all() as Record<
        string,
        unknown
      >[];
    } else if (user.role === 'TÉCNICO') {
      rows = db
        .prepare('SELECT * FROM maintenances WHERE assigned_tech_name LIKE ? ORDER BY scheduled_start ASC')
        .all(`%${user.fullName.split(' ')[0]}%`) as Record<string, unknown>[];
    } else if (user.clientId) {
      rows = db
        .prepare('SELECT * FROM maintenances WHERE client_code = ? ORDER BY scheduled_start ASC')
        .all(user.clientId) as Record<string, unknown>[];
    }

    const maintenances: MaintenanceRecord[] = rows.map((r) => ({
      id: String(r.id),
      clientCode: String(r.client_code),
      clientCompany: String(r.client_company),
      equipmentCode: r.equipment_code ? String(r.equipment_code) : null,
      assignedTechName: String(r.assigned_tech_name),
      maintenanceType: r.maintenance_type as MaintenanceRecord['maintenanceType'],
      siteLocation: String(r.site_location),
      scheduledStart: String(r.scheduled_start),
      scheduledEnd: String(r.scheduled_end),
      status: r.status as MaintenanceRecord['status'],
      checklistSummary: String(r.checklist_summary),
      notes: String(r.notes ?? ''),
      cancellationReason: r.cancellation_reason ? String(r.cancellation_reason) : null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
    sendApiSuccess(res, 'Calendario de mantenimientos', { maintenances });
  });

  app.post(
    '/api/maintenances',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const {
        clientCode,
        equipmentCode,
        assignedTechName,
        maintenanceType,
        siteLocation,
        scheduledStart,
        scheduledEnd,
        checklistSummary,
        notes,
      } = req.body as Record<string, string | undefined>;

      if (!clientCode || !scheduledStart || !scheduledEnd || !assignedTechName) {
        sendApiError(res, 400, 'Completa cliente, técnico y ventana horaria.', 'VALIDATION_ERROR');
        return;
      }

      const clientRow = db
        .prepare('SELECT trade_name, plan_code FROM clients WHERE client_id = ?')
        .get(clientCode) as { trade_name: string; plan_code: string } | undefined;
      if (!clientRow) {
        sendApiError(res, 404, 'Cliente no encontrado.', 'CLIENT_NOT_FOUND');
        return;
      }

      const id = `MNT-${new Date().getFullYear()}-${String(
        ((db.prepare('SELECT COUNT(*) AS c FROM maintenances').get() as { c: number }).c || 0) + 1
      ).padStart(3, '0')}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO maintenances (
          id, client_code, client_company, equipment_code, assigned_tech_name,
          maintenance_type, site_location, scheduled_start, scheduled_end,
          status, checklist_summary, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROGRAMADO', ?, ?, ?, ?)
      `).run(
        id,
        clientCode,
        clientRow.trade_name,
        equipmentCode || null,
        assignedTechName.trim(),
        maintenanceType || 'PREVENTIVO',
        (siteLocation || 'Remoto / Sitio').trim(),
        scheduledStart,
        scheduledEnd,
        (checklistSummary || 'Checklist estándar preventivo USAE').trim(),
        (notes || '').trim(),
        now,
        now
      );

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'MAINTENANCE_SCHEDULED',
        targetType: 'MAINTENANCE',
        targetId: id,
        description: `Mantenimiento ${id} programado para ${clientRow.trade_name} (${scheduledStart}).`,
        ipAddress: getClientIp(req),
      });

      sendApiSuccess(res, 'Mantenimiento programado correctamente.', { id }, 201);
    }
  );

  app.patch(
    '/api/maintenances/:id',
    requireAuth,
    requireRole('TÉCNICO', 'SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const { status, cancellationReason, notes } = req.body as {
        status?: MaintenanceRecord['status'];
        cancellationReason?: string;
        notes?: string;
      };
      if (status === 'CANCELADO' && (!cancellationReason || cancellationReason.trim().length < 5)) {
        sendApiError(res, 400, 'La cancelación requiere un motivo obligatorio.', 'REASON_REQUIRED');
        return;
      }
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE maintenances SET
          status = COALESCE(?, status),
          cancellation_reason = COALESCE(?, cancellation_reason),
          notes = COALESCE(?, notes),
          updated_at = ?
        WHERE id = ?
      `).run(status ?? null, cancellationReason?.trim() ?? null, notes?.trim() ?? null, now, req.params.id);

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'MAINTENANCE_UPDATED',
        targetType: 'MAINTENANCE',
        targetId: req.params.id,
        description: `Mantenimiento actualizado a estado ${status || 'sin cambio'}.`,
        ipAddress: getClientIp(req),
      });
      sendApiSuccess(res, 'Mantenimiento actualizado.', { id: req.params.id });
    }
  );

  // Module 00-07 Docs
  app.get('/api/modules', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const rows = db.prepare('SELECT * FROM module_docs ORDER BY module_code ASC').all() as Record<
      string,
      unknown
    >[];
    const docs: ModuleDocRecord[] = rows
      .map((r) => ({
        moduleCode: String(r.module_code),
        title: String(r.title),
        fileName: String(r.file_name),
        version: String(r.version),
        updatedDate: String(r.updated_date),
        owner: String(r.owner),
        status: r.status as ModuleDocRecord['status'],
        allowedRoles: JSON.parse(String(r.allowed_roles_json || '[]')) as UserRole[],
        summary: String(r.summary),
        operationalChecklist: JSON.parse(String(r.operational_checklist_json || '[]')) as string[],
      }))
      .filter((d) => d.allowedRoles.includes(user.role));

    sendApiSuccess(res, 'Índice de módulos documentales 00–07', { modules: docs });
  });

  app.post('/api/modules/:code/view', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    recordAudit(db, {
      actorEmail: user.email,
      actorRole: user.role,
      event: 'MODULE_DOC_CONSULTED',
      targetType: 'MODULE_DOC',
      targetId: req.params.code,
      description: `Consulta del documento operativo ${req.params.code}.`,
      ipAddress: getClientIp(req),
    });
    sendApiSuccess(res, 'Consulta registrada.', { logged: true });
  });

  // Module 07 — Reports & Authorized CSV Export
  function queryAuthorizedTicketsForReport(user: AuthUser, query: Record<string, string | undefined>) {
    let rows = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all() as Record<
      string,
      unknown
    >[];
    let tickets = rows.map((r) => hydrateTicket(db, r));
    if (user.role === 'SUPERVISOR') {
      tickets = tickets.filter((t) => canUserAccessTicket(user, t));
    }
    if (query.status && query.status !== 'Todos') {
      tickets = tickets.filter((t) => t.status === query.status);
    }
    if (query.priority && query.priority !== 'Todas') {
      tickets = tickets.filter((t) => t.priority === query.priority);
    }
    if (query.department && query.department !== 'Todos') {
      tickets = tickets.filter((t) => t.department === query.department);
    }
    if (query.from) {
      const fromMs = new Date(query.from).getTime();
      if (Number.isFinite(fromMs)) {
        tickets = tickets.filter((t) => new Date(t.createdAt).getTime() >= fromMs);
      }
    }
    if (query.to) {
      const toMs = new Date(query.to).getTime() + 86400_000;
      if (Number.isFinite(toMs)) {
        tickets = tickets.filter((t) => new Date(t.createdAt).getTime() <= toMs);
      }
    }
    return tickets;
  }

  app.get(
    '/api/reports/summary',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const tickets = queryAuthorizedTicketsForReport(
        user,
        req.query as Record<string, string | undefined>
      );
      const breached = tickets.filter((t) => isSlaBreached(t)).length;
      const resolvedTimes = tickets
        .map((t) => t.solutionTimeMinutes)
        .filter((v): v is number => typeof v === 'number' && v > 0);
      const avgResolutionMinutes =
        resolvedTimes.length > 0
          ? Math.round(resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length)
          : 0;
      const satScores = tickets
        .map((t) => t.satisfactionScore)
        .filter((v): v is number => typeof v === 'number');
      const avgSatisfaction =
        satScores.length > 0
          ? Math.round((satScores.reduce((a, b) => a + b, 0) / satScores.length) * 10) / 10
          : 5;

      const byTech: Record<string, number> = {};
      const byPriority: Record<string, number> = { CRÍTICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 };
      for (const t of tickets) {
        byTech[t.assignedTech] = (byTech[t.assignedTech] ?? 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
      }

      sendApiSuccess(res, 'Resumen analítico de SLA y tickets', {
        total: tickets.length,
        breached,
        compliancePercent:
          tickets.length > 0 ? Math.round(((tickets.length - breached) / tickets.length) * 100) : 100,
        avgResolutionMinutes,
        avgSatisfaction,
        byTech,
        byPriority,
        tickets,
      });
    }
  );

  app.get(
    '/api/reports/export',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const tickets = queryAuthorizedTicketsForReport(
        user,
        req.query as Record<string, string | undefined>
      );
      const format = String(req.query.format || 'csv').toLowerCase();
      const csv = buildTicketsCsv(tickets);

      recordAudit(db, {
        actorEmail: user.email,
        actorRole: user.role,
        event: 'REPORT_EXPORTED',
        targetType: 'REPORT',
        targetId: format.toUpperCase(),
        description: `Exportación autorizada (${format.toUpperCase()}) con ${tickets.length} registros de tickets.`,
        ipAddress: getClientIp(req),
      });

      if (format === 'xls' || format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="usae-reporte-sla.csv"');
        res.send(`\uFEFF${csv}`);
        return;
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="usae-reporte-sla.csv"');
      res.send(`\uFEFF${csv}`);
    }
  );

  // ==============================================================
  // 5. ADMINISTRATIVE ROUTES (ADMINISTRADOR / LIMITED SUPERVISOR)
  // ==============================================================

  app.get(
    '/api/admin/staff',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (_req, res) => {
      const staffRows = db.prepare('SELECT * FROM staff_profiles ORDER BY employee_id ASC').all() as Record<
        string,
        unknown
      >[];
      const staff: StaffMember[] = staffRows.map((s) => ({
        employeeId: String(s.employee_id),
        userId: s.user_id ? Number(s.user_id) : undefined,
        fullName: String(s.full_name),
        roleTitle: String(s.role_title),
        rbacRole: s.rbac_role as UserRole,
        department: String(s.department),
        workMode: s.work_mode as StaffMember['workMode'],
        corporateEmail: String(s.corporate_email),
        phone: String(s.phone),
        smartCampusCertified: Boolean(s.smart_campus_certified),
        ndaSigned: Boolean(s.nda_signed),
        inductionProgress: String(s.induction_progress),
        status: s.status as StaffMember['status'],
      }));
      sendApiSuccess(res, 'Personal técnico y operativo', { staff });
    }
  );

  app.get(
    '/api/admin/clients',
    requireAuth,
    requireRole('SUPERVISOR', 'ADMINISTRADOR'),
    (_req, res) => {
      const rows = db.prepare('SELECT * FROM clients ORDER BY client_id ASC').all() as Record<
        string,
        unknown
      >[];
      const clients: CorporateClient[] = rows.map((c) => ({
        clientId: String(c.client_id),
        legalName: String(c.legal_name),
        tradeName: String(c.trade_name),
        personType: c.person_type as CorporateClient['personType'],
        industry: String(c.industry),
        website: String(c.website),
        accountExecutive: String(c.account_executive),
        commercialStatus: c.commercial_status as CorporateClient['commercialStatus'],
        decisionMaker: String(c.decision_maker),
        decisionMakerEmail: String(c.decision_maker_email),
        decisionMakerPhone: String(c.decision_maker_phone),
        billingContact: String(c.billing_contact),
        billingEmail: String(c.billing_email),
        rfc: String(c.rfc),
        taxRegime: String(c.tax_regime),
        cfdiUse: String(c.cfdi_use),
        postalCode: String(c.postal_code),
        paymentMethod: c.payment_method as 'PUE' | 'PPD',
        planCode: String(c.plan_code),
        planStatus: String(c.plan_status),
        contractStart: String(c.contract_start),
        contractEnd: String(c.contract_end),
        legalChecklist: JSON.parse(String(c.legal_checklist_json || '{}')),
      }));
      sendApiSuccess(res, 'Expedientes de clientes corporativos', { clients });
    }
  );

  app.get(
    '/api/admin/users',
    requireAuth,
    requireRole('ADMINISTRADOR'),
    (_req, res) => {
      const rows = db
        .prepare(`
          SELECT u.*, c.trade_name AS client_trade_name, c.rfc AS client_rfc
          FROM users u LEFT JOIN clients c ON c.client_id = u.client_id
          ORDER BY u.id ASC
        `)
        .all() as Record<string, unknown>[];
      sendApiSuccess(res, 'Usuarios registrados', {
        users: rows.map((r) =>
          mapUserRow(
            r,
            r.client_trade_name ? String(r.client_trade_name) : null,
            r.client_rfc ? String(r.client_rfc) : null
          )
        ),
      });
    }
  );

  app.patch(
    '/api/admin/users/:id',
    requireAuth,
    requireRole('ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const admin = req.authUser!;
      const targetId = Number(req.params.id);
      const { role, department, accountStatus, mustChangePassword } = req.body as {
        role?: UserRole;
        department?: string;
        accountStatus?: AccountStatus;
        mustChangePassword?: boolean;
      };

      const targetRow = db.prepare('SELECT email, role, account_status FROM users WHERE id = ?').get(targetId) as
        | { email: string; role: string; account_status: string }
        | undefined;
      if (!targetRow) {
        sendApiError(res, 404, 'Usuario no encontrado.', 'USER_NOT_FOUND');
        return;
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE users SET
          role = COALESCE(?, role),
          department = COALESCE(?, department),
          account_status = COALESCE(?, account_status),
          must_change_password = COALESCE(?, must_change_password),
          updated_at = ?
        WHERE id = ?
      `).run(
        role ?? null,
        department?.trim() ?? null,
        accountStatus ?? null,
        typeof mustChangePassword === 'boolean' ? (mustChangePassword ? 1 : 0) : null,
        now,
        targetId
      );

      if (accountStatus && accountStatus !== 'ACTIVA') {
        db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
          now,
          targetId
        );
      }

      recordAudit(db, {
        actorEmail: admin.email,
        actorRole: admin.role,
        event: 'ADMIN_USER_UPDATED',
        targetType: 'USER',
        targetId: String(targetId),
        description: `Usuario ${targetRow.email}: rol=${role ?? targetRow.role}, estado=${accountStatus ?? targetRow.account_status}, forzarCambioPw=${Boolean(mustChangePassword)}.`,
        ipAddress: getClientIp(req),
      });

      sendApiSuccess(res, 'Usuario actualizado correctamente.', { updated: true });
    }
  );

  app.get('/api/admin/plans', requireAuth, requireRole('ADMINISTRADOR'), (_req, res) => {
    const rows = db.prepare('SELECT * FROM plans ORDER BY code ASC').all() as Record<string, unknown>[];
    sendApiSuccess(res, 'Catálogo maestro editable', { plans: rows.map(mapPlanRow) });
  });

  app.put(
    '/api/admin/plans/:code',
    requireAuth,
    requireRole('ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const admin = req.authUser!;
      const code = req.params.code.trim().toUpperCase();
      const existing = db.prepare('SELECT * FROM plans WHERE code = ?').get(code) as
        | Record<string, unknown>
        | undefined;
      if (!existing) {
        sendApiError(res, 404, 'Plan no encontrado.', 'PLAN_NOT_FOUND');
        return;
      }

      const {
        title,
        priceMXN,
        priceLabel,
        includesIva,
        priceConfirmedByAdmin,
        alternativePriceNote,
        maxEquipments,
        monthlyVisitsIncluded,
        is24_7,
        slaSummary,
        contractTerms,
        isPublished,
      } = req.body as Partial<ServicePlan>;

      const now = new Date().toISOString();
      const nextVersion = Number(existing.version) + 1;

      db.prepare(`
        UPDATE plans SET
          title = COALESCE(?, title),
          price_mxn = ?,
          price_label = COALESCE(?, price_label),
          includes_iva = COALESCE(?, includes_iva),
          price_confirmed_by_admin = COALESCE(?, price_confirmed_by_admin),
          alternative_price_note = COALESCE(?, alternative_price_note),
          max_equipments = COALESCE(?, max_equipments),
          monthly_visits_included = COALESCE(?, monthly_visits_included),
          is_24_7 = COALESCE(?, is_24_7),
          sla_summary = COALESCE(?, sla_summary),
          contract_terms = COALESCE(?, contract_terms),
          is_published = COALESCE(?, is_published),
          version = ?,
          updated_at = ?
        WHERE code = ?
      `).run(
        title?.trim() ?? null,
        priceMXN === undefined ? (existing.price_mxn as number | null) : priceMXN,
        priceLabel?.trim() ?? null,
        typeof includesIva === 'boolean' ? (includesIva ? 1 : 0) : null,
        typeof priceConfirmedByAdmin === 'boolean' ? (priceConfirmedByAdmin ? 1 : 0) : null,
        alternativePriceNote ?? null,
        typeof maxEquipments === 'number' ? maxEquipments : null,
        typeof monthlyVisitsIncluded === 'number' ? monthlyVisitsIncluded : null,
        typeof is24_7 === 'boolean' ? (is24_7 ? 1 : 0) : null,
        slaSummary?.trim() ?? null,
        contractTerms?.trim() ?? null,
        typeof isPublished === 'boolean' ? (isPublished ? 1 : 0) : null,
        nextVersion,
        now,
        code
      );

      recordAudit(db, {
        actorEmail: admin.email,
        actorRole: admin.role,
        event: 'PLAN_CATALOG_UPDATED',
        targetType: 'PLAN',
        targetId: code,
        description: `Plan ${code} actualizado a versión v${nextVersion} (precio=${priceMXN ?? existing.price_mxn} MXN).`,
        ipAddress: getClientIp(req),
      });

      const updated = mapPlanRow(
        db.prepare('SELECT * FROM plans WHERE code = ?').get(code) as Record<string, unknown>
      );
      sendApiSuccess(res, `Plan ${code} actualizado (v${nextVersion}).`, { plan: updated });
    }
  );

  // Admin SPEI Approval / Rejection
  app.post(
    '/api/admin/payments/:paymentId/approve',
    requireAuth,
    requireRole('ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const admin = req.authUser!;
      try {
        const result = activateSubscriptionForPayment(db, {
          paymentId: req.params.paymentId,
          actorEmail: admin.email,
          actorRole: admin.role,
          approvedByUserId: admin.id,
          ipAddress: getClientIp(req),
        });
        sendApiSuccess(res, 'Pago aprobado y suscripción activada correctamente.', result);
      } catch (err) {
        if (err instanceof Error && err.message === 'PAYMENT_NOT_FOUND') {
          sendApiError(res, 404, 'Pago no encontrado.', 'PAYMENT_NOT_FOUND');
          return;
        }
        sendApiError(res, 500, 'No fue posible aprobar el pago.');
      }
    }
  );

  app.post(
    '/api/admin/payments/:paymentId/reject',
    requireAuth,
    requireRole('ADMINISTRADOR'),
    (req: AuthenticatedRequest, res) => {
      const admin = req.authUser!;
      const { reason } = req.body as { reason?: string };
      if (!reason || reason.trim().length < 5) {
        sendApiError(res, 400, 'Indica el motivo del rechazo del pago.', 'REASON_REQUIRED');
        return;
      }

      const paymentRow = db
        .prepare('SELECT * FROM payments WHERE payment_id = ?')
        .get(req.params.paymentId) as Record<string, unknown> | undefined;
      if (!paymentRow) {
        sendApiError(res, 404, 'Pago no encontrado.', 'PAYMENT_NOT_FOUND');
        return;
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE payments SET status = 'RECHAZADO', rejection_reason = ?, approved_by_user_id = ?, approved_by_email = ?, updated_at = ?
        WHERE payment_id = ?
      `).run(reason.trim(), admin.id, admin.email, now, req.params.paymentId);

      db.prepare(
        "UPDATE subscriptions SET status = 'CANCELADO', updated_at = ? WHERE user_id = ? AND status IN ('PENDIENTE_PAGO', 'PAGO_EN_REVISION')"
      ).run(now, Number(paymentRow.user_id));

      enqueueNotification(db, {
        userId: Number(paymentRow.user_id),
        recipientEmail: String(paymentRow.client_email),
        eventType: 'PAYMENT_REJECTED',
        subject: `USAE Helpdesk — Pago ${req.params.paymentId} rechazado`,
        headline: `Revisión de pago ${req.params.paymentId}`,
        paragraphs: [
          `Tu registro de pago ${req.params.paymentId} no pudo confirmarse.`,
          `Motivo: ${reason.trim()}`,
        ],
      });

      recordAudit(db, {
        actorEmail: admin.email,
        actorRole: admin.role,
        event: 'PAYMENT_REJECTED',
        targetType: 'PAYMENT',
        targetId: req.params.paymentId,
        description: `Pago rechazado. Motivo: ${reason.trim()}`,
        ipAddress: getClientIp(req),
      });

      sendApiSuccess(res, 'Pago rechazado sin activar plan.', {
        paymentId: req.params.paymentId,
        status: 'RECHAZADO',
      });
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAuth,
    requireRole('ADMINISTRADOR', 'SUPERVISOR'),
    (req: AuthenticatedRequest, res) => {
      const user = req.authUser!;
      const rows =
        user.role === 'ADMINISTRADOR'
          ? (db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all() as Record<
              string,
              unknown
            >[])
          : (db
              .prepare(
                "SELECT * FROM audit_logs WHERE target_type IN ('TICKET', 'MAINTENANCE', 'REPORT') ORDER BY created_at DESC LIMIT 80"
              )
              .all() as Record<string, unknown>[]);

      sendApiSuccess(res, 'Bitácora de auditoría', {
        auditLogs: rows.map((r) => ({
          id: String(r.id),
          actorEmail: String(r.actor_email),
          actorRole: String(r.actor_role),
          event: String(r.event),
          targetType: String(r.target_type),
          targetId: String(r.target_id),
          description: String(r.description),
          ipAddress: String(r.ip_address),
          createdAt: String(r.created_at),
        })),
      });
    }
  );

  app.get('/api/admin/settings', requireAuth, requireRole('ADMINISTRADOR'), (_req, res) => {
    const settings = getSystemSettings(db);
    const integrations = getIntegrationsReadiness({
      speiBankName: settings.speiBankName,
      speiAccountHolder: settings.speiAccountHolder,
      speiClabe: getSettingValue(db, 'speiClabe', ''),
    });
    const slaRows = db.prepare('SELECT * FROM sla_policies').all() as Record<string, unknown>[];
    const inquiries = db
      .prepare('SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 50')
      .all() as Record<string, unknown>[];

    sendApiSuccess(res, 'Configuración del sistema e integraciones', {
      settings,
      integrations,
      slaPolicies: slaRows,
      inquiries: inquiries.map(
        (q): ContactInquiryRecord => ({
          id: String(q.id),
          fullName: String(q.full_name),
          email: String(q.email),
          phone: String(q.phone),
          company: String(q.company),
          planCode: q.plan_code ? String(q.plan_code) : null,
          subject: String(q.subject),
          message: String(q.message),
          consentAccepted: Boolean(q.consent_accepted),
          status: q.status as ContactInquiryRecord['status'],
          createdAt: String(q.created_at),
        })
      ),
    });
  });

  app.put('/api/admin/settings', requireAuth, requireRole('ADMINISTRADOR'), (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const body = req.body as Partial<SystemSettings> & { speiClabe?: string };
    const now = new Date().toISOString();
    const upd = db.prepare(
      'INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    );

    if (typeof body.workStartHour === 'number') upd.run('workStartHour', String(body.workStartHour), now);
    if (typeof body.workEndHour === 'number') upd.run('workEndHour', String(body.workEndHour), now);
    if (typeof body.saturdayEndHour === 'number')
      upd.run('saturdayEndHour', String(body.saturdayEndHour), now);
    if (Array.isArray(body.holidays)) upd.run('holidays', JSON.stringify(body.holidays), now);
    if (typeof body.maxUploadMb === 'number') upd.run('maxUploadMb', String(body.maxUploadMb), now);
    if (typeof body.sessionIdleMinutes === 'number')
      upd.run('sessionIdleMinutes', String(body.sessionIdleMinutes), now);
    if (typeof body.prorationPolicy === 'string')
      upd.run('prorationPolicy', body.prorationPolicy.trim(), now);
    if (typeof body.speiBankName === 'string') upd.run('speiBankName', body.speiBankName.trim(), now);
    if (typeof body.speiAccountHolder === 'string')
      upd.run('speiAccountHolder', body.speiAccountHolder.trim(), now);
    if (typeof body.speiClabe === 'string' && body.speiClabe.trim())
      upd.run('speiClabe', body.speiClabe.trim(), now);

    recordAudit(db, {
      actorEmail: admin.email,
      actorRole: admin.role,
      event: 'SYSTEM_SETTINGS_UPDATED',
      targetType: 'SETTINGS',
      targetId: 'GLOBAL',
      description: 'Parámetros operativos, calendario o SPEI actualizados por Administración.',
      ipAddress: getClientIp(req),
    });

    sendApiSuccess(res, 'Configuración actualizada.', { settings: getSystemSettings(db) });
  });

  // Safe catch-all for unknown /api/* routes (never fall through to SPA HTML or leak errors)
  app.use('/api', (_req, res) => {
    sendApiError(res, 404, 'Recurso API no encontrado.', 'ENDPOINT_NOT_FOUND');
  });

  // Safe Express error handler (never exposes stack trace or SQLSTATE)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled API error:', err);
    sendApiError(res, 500, 'No fue posible completar la operación. Intente nuevamente.', 'INTERNAL_ERROR');
  });

  return app;
}

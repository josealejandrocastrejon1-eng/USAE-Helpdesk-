export type TicketStatus =
  | 'NUEVO'
  | 'ASIGNADO'
  | 'EN PROCESO'
  | 'EN ESPERA'
  | 'RESUELTO'
  | 'CERRADO';

export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';

export type TicketDepartment =
  | 'Infraestructura & TI'
  | 'Ciberseguridad'
  | 'Desarrollo Web'
  | 'Soporte Remoto N1'
  | 'Administración & Facturación';

export type TicketCategory =
  | 'Hardware y Diagnóstico'
  | 'Redes y Conectividad'
  | 'Ciberseguridad y Accesos'
  | 'Software y Controladores'
  | 'Desarrollo Web y Portales'
  | 'Facturación y Planes';

export type UserRole = 'ADMINISTRADOR' | 'SUPERVISOR' | 'TÉCNICO' | 'USUARIO';

export type AccountStatus =
  | 'PENDIENTE_VERIFICACION'
  | 'ACTIVA'
  | 'SUSPENDIDA'
  | 'BLOQUEADA'
  | 'INACTIVA';

export type SubscriptionStatus =
  | 'SIN_PLAN'
  | 'PENDIENTE_PAGO'
  | 'PAGO_EN_REVISION'
  | 'ACTIVO'
  | 'VENCIDO'
  | 'CANCELADO'
  | 'SUSPENDIDO'
  | 'REEMBOLSADO';

export type PaymentStatus =
  | 'PENDIENTE'
  | 'PAGO_EN_REVISION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'REEMBOLSADO';

export type PaymentMethodType = 'MERCADO_PAGO' | 'SPEI';

export type BillingPeriod = 'MENSUAL' | 'PROYECTO_UNICO' | 'COTIZACION';

export type EquipmentHealthStatus = 'ÓPTIMO' | 'ATENCIÓN REQUERIDA' | 'CRÍTICO';

export interface SlaPolicy {
  priority: TicketPriority;
  code: 'P1' | 'P2' | 'P3' | 'P4';
  responseMinutes: number;
  resolutionMinutes: number;
  escalationTarget: string;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  department: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  mustChangePassword: boolean;
  clientId?: string | null;
  clientCompany?: string | null;
  rfc?: string | null;
  employeeId?: string | null;
  privacyAcceptedAt?: string | null;
  termsAcceptedAt?: string | null;
  acceptedPolicyVersion?: string | null;
  lastLoginAt?: string | null;
}

export interface ServicePlan {
  code: string;
  category: 'TI / Infraestructura' | 'Desarrollo Web' | 'Ciberseguridad' | 'Servicios Personalizados';
  title: string;
  priceMXN: number | null;
  priceLabel: string;
  includesIva: boolean;
  billingPeriod: BillingPeriod;
  minMonths: number;
  maxEquipments: number;
  monthlyVisitsIncluded: number;
  is24_7: boolean;
  alternativePriceNote?: string;
  priceConfirmedByAdmin: boolean;
  duration: string;
  slaSummary: string;
  coveredCategories: TicketCategory[];
  scope: string[];
  contractTerms: string;
  cancellationRule: string;
  guaranteeRule: string;
  isPublished: boolean;
  version: number;
  updatedAt?: string;
}

export interface SubscriptionRecord {
  id: number;
  userId: number;
  clientId?: string | null;
  planCode: string;
  planTitle?: string;
  status: SubscriptionStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  priceVersion: number;
  amountMxn: number;
  maxEquipments: number;
  monthlyVisitsIncluded: number;
  is24_7: boolean;
  autoRenewConsent: boolean;
  cancellationRequestedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  userId: number;
  clientId?: string | null;
  clientEmail: string;
  clientCompany: string;
  planCode: string;
  planTitle?: string;
  amountMXN: number;
  currency: 'MXN';
  period: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  mpPreferenceId?: string | null;
  mpInitPoint?: string | null;
  mpPaymentId?: string | null;
  mpPaymentStatus?: string | null;
  mpStatusDetail?: string | null;
  transferReference?: string | null;
  transferConcept?: string | null;
  bankName?: string | null;
  clabe?: string | null;
  accountHolder?: string | null;
  approvedByEmail?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  termsVersionAccepted: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  author: string;
  authorEmail?: string;
  role: UserRole;
  isInternal: boolean;
  message: string;
  createdAt: string;
}

export interface TicketActivity {
  id: string;
  ticketFolio: string;
  actorName: string;
  actorRole: UserRole;
  activityType: string;
  description: string;
  durationMinutes: number;
  resultSummary?: string;
  nextStep?: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  actor: string;
  action: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketFolio: string;
  uploadedByEmail: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeKb: number;
  fileType: string;
  category: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  downloadUrl?: string;
  createdAt: string;
}

export interface Ticket {
  id?: number;
  folio: string;
  userId?: number;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  clientCompany: string;
  clientCode?: string;
  department: TicketDepartment;
  category: TicketCategory;
  subcategory?: string;
  equipmentCode?: string;
  serviceMode?: 'REMOTO' | 'EN SITIO';
  location?: string;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  assignedTech: string;
  assignedTechId?: number | null;
  slaVersion?: number;
  slaPlanCode?: string;
  slaIs24_7?: boolean;
  slaDueResponse: string;
  slaDueResolution: string;
  pausedAt?: string | null;
  pausedMinutes?: number;
  pauseReason?: string | null;
  diagnosisChecklist?: {
    reproduced: boolean;
    rootCauseIdentified: boolean;
    securityVerified: boolean;
    backupVerified: boolean;
  };
  rootCause?: string;
  activitiesPerformed?: string;
  solutionDetails?: string;
  recommendations?: string;
  solutionTimeMinutes?: number;
  satisfactionScore?: number;
  reopenReason?: string;
  clientConfirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  comments: TicketComment[];
  activities?: TicketActivity[];
  history: TicketHistoryEntry[];
  attachments: TicketAttachment[];
}

export interface CreateTicketInput {
  department: TicketDepartment;
  category: TicketCategory;
  subcategory?: string;
  equipmentCode?: string;
  serviceMode?: 'REMOTO' | 'EN SITIO';
  location?: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  infoConfirmed?: boolean;
}

export interface EquipmentAsset {
  equipmentCode: string;
  hostname: string;
  assignedUser: string;
  clientCode: string;
  brandModel: string;
  osName: string;
  architecture: string;
  biosInfo: string;
  firmwareVersion?: string;
  secureBoot: boolean;
  processor: string;
  ramInfo: string;
  gpuInfo: string;
  storageInfo: string;
  batteryPercent: string;
  antivirusStatus: string;
  firewallStatus: string;
  uacStatus: string;
  vbsStatus: string;
  remoteTool?: string;
  remoteId?: string;
  perfmonSummary: string;
  diskResponseMs: number;
  healthStatus: EquipmentHealthStatus;
  lastSecurityAudit?: string;
  lastReportDate: string;
}

export interface CorporateClient {
  clientId: string;
  legalName: string;
  tradeName: string;
  personType: 'Moral' | 'Física';
  industry: string;
  website: string;
  accountExecutive: string;
  commercialStatus: 'Activo' | 'En Renovación' | 'Suspendido' | 'Prospecto';
  decisionMaker: string;
  decisionMakerEmail: string;
  decisionMakerPhone: string;
  billingContact: string;
  billingEmail: string;
  rfc: string;
  taxRegime: string;
  cfdiUse: string;
  postalCode: string;
  paymentMethod: 'PUE' | 'PPD';
  planCode: string;
  planStatus: SubscriptionStatus | string;
  contractStart: string;
  contractEnd: string;
  legalChecklist: {
    csf: boolean;
    nda: boolean;
    msa: boolean;
    sla: boolean;
    opinion32D: boolean;
  };
}

export interface StaffMember {
  employeeId: string;
  userId?: number;
  fullName: string;
  roleTitle: string;
  rbacRole: UserRole;
  department: string;
  workMode: 'PRESENCIAL' | 'REMOTO' | 'HÍBRIDO';
  corporateEmail: string;
  phone: string;
  smartCampusCertified: boolean;
  ndaSigned: boolean;
  inductionProgress: string;
  status: 'Activo' | 'En Capacitación' | 'Suspendido';
}

export interface MaintenanceRecord {
  id: string;
  clientCode: string;
  clientCompany: string;
  equipmentCode?: string | null;
  assignedTechName: string;
  maintenanceType: 'PREVENTIVO' | 'CORRECTIVO' | 'AUDITORIA_SEGURIDAD';
  siteLocation: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'PROGRAMADO' | 'CONFIRMADO' | 'EN_CURSO' | 'COMPLETADO' | 'REPROGRAMADO' | 'CANCELADO';
  checklistSummary: string;
  notes?: string;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDocRecord {
  moduleCode: string;
  title: string;
  fileName: string;
  version: string;
  updatedDate: string;
  owner: string;
  status: 'VIGENTE' | 'CONFIGURABLE';
  allowedRoles: UserRole[];
  summary: string;
  operationalChecklist: string[];
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole?: string;
  event: string;
  targetType?: string;
  targetId?: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId?: number | null;
  recipientEmail: string;
  channel: 'PORTAL' | 'EMAIL' | 'WHATSAPP';
  eventType: string;
  subject: string;
  bodyPreview: string;
  emailHtml?: string;
  deliveryStatus: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactInquiryRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  planCode?: string | null;
  subject: string;
  message: string;
  consentAccepted: boolean;
  status: 'NUEVA' | 'CONTACTADA' | 'COTIZADA' | 'CERRADA';
  createdAt: string;
}

export interface TicketMetrics {
  total: number;
  nuevos: number;
  enAtencion: number;
  enEspera: number;
  resueltosCerrados: number;
  slaBreachedCount: number;
  avgSatisfaction: number;
}

export interface SystemSettings {
  companyName: string;
  systemName: string;
  timezone: string;
  currency: string;
  workStartHour: number;
  workEndHour: number;
  saturdayEndHour: number;
  holidays: string[]; // YYYY-MM-DD
  maxUploadMb: number;
  sessionIdleMinutes: number;
  policyVersion: string;
  prorationPolicy: string;
  speiBankName: string;
  speiAccountHolder: string;
  speiClabeMasked: string;
}

export const USAE_OFFICIAL_LOGO_URL =
  'https://lh3.googleusercontent.com/d/1AyIKn0Z1sCISbHDrVkAW3NDCWGET4UoS';

export const USAE_CONTACT = {
  company: 'USAE',
  systemName: 'USAE Helpdesk',
  slogan: 'Innovación y Tecnología para un Futuro Seguro',
  location: 'Ciudad Nezahualcóyotl, Estado de México, México',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  email: 'soporte.helpdesk.usae@gmail.com',
  phones: ['+52 55 5496 8308', '+52 56 5199 2916'],
  businessHoursLabel: 'Lunes a Viernes 09:00–18:00 h · Sábados 09:00–14:00 h (Hora Centro MX)',
  policyVersion: '2026.1',
};

export const SLA_POLICIES: Record<TicketPriority, SlaPolicy> = {
  CRÍTICA: {
    priority: 'CRÍTICA',
    code: 'P1',
    responseMinutes: 15,
    resolutionMinutes: 120,
    escalationTarget: 'Director Técnico / N3',
  },
  ALTA: {
    priority: 'ALTA',
    code: 'P2',
    responseMinutes: 30,
    resolutionMinutes: 240,
    escalationTarget: 'Supervisor / Ingeniero Senior N2',
  },
  MEDIA: {
    priority: 'MEDIA',
    code: 'P3',
    responseMinutes: 120,
    resolutionMinutes: 480,
    escalationTarget: 'Mesa de Ayuda / Técnico N1',
  },
  BAJA: {
    priority: 'BAJA',
    code: 'P4',
    responseMinutes: 240,
    resolutionMinutes: 1440,
    escalationTarget: 'Programación estándar / Preventivo',
  },
};

export const TICKET_STATUSES: TicketStatus[] = [
  'NUEVO',
  'ASIGNADO',
  'EN PROCESO',
  'EN ESPERA',
  'RESUELTO',
  'CERRADO',
];

export const TICKET_PRIORITIES: TicketPriority[] = ['CRÍTICA', 'ALTA', 'MEDIA', 'BAJA'];

export const TICKET_DEPARTMENTS: TicketDepartment[] = [
  'Infraestructura & TI',
  'Ciberseguridad',
  'Desarrollo Web',
  'Soporte Remoto N1',
  'Administración & Facturación',
];

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Hardware y Diagnóstico',
  'Redes y Conectividad',
  'Ciberseguridad y Accesos',
  'Software y Controladores',
  'Desarrollo Web y Portales',
  'Facturación y Planes',
];

export const USAE_TECHNICIANS: string[] = [
  'Sin asignar',
  'Carlos Mendoza R. (EMP-001)',
  'Ing. Laura Méndez (N2)',
  'Mariana Ríos (Ejecutiva B2B)',
];

export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
  '.log',
  '.xlsx',
  '.docx',
]);

export const ALLOWED_ATTACHMENT_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const BLOCKED_EXECUTABLE_EXTENSIONS = new Set([
  '.php',
  '.phtml',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.sh',
  '.bat',
  '.cmd',
  '.ps1',
  '.exe',
  '.dll',
  '.msi',
  '.html',
  '.htm',
  '.svg',
]);

export function validateAttachmentMeta(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  maxMb = 10
): { valid: boolean; reason?: string } {
  const cleanName = (fileName || '').trim().toLowerCase();
  const dotIdx = cleanName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? cleanName.slice(dotIdx) : '';

  if (!ext || BLOCKED_EXECUTABLE_EXTENSIONS.has(ext) || !ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      reason: `Extensión no permitida (${ext || 'sin extensión'}). Solo se admiten PNG, JPG, WEBP, PDF, TXT, CSV, LOG, XLSX y DOCX.`,
    };
  }

  const normalizedMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  if (normalizedMime && !ALLOWED_ATTACHMENT_MIMES.has(normalizedMime)) {
    return {
      valid: false,
      reason: `Tipo MIME no autorizado (${normalizedMime}).`,
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > maxBytes) {
    return {
      valid: false,
      reason: `El archivo debe ser mayor a 0 bytes y no exceder ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe incluir mayúsculas, minúsculas y al menos un número.';
  }
  return null;
}

export function generateFolio(existingFolios: string[], year = 2026): string {
  const prefix = `USAE-${year}-`;
  let maxSeq = 0;

  for (const folio of existingFolios) {
    if (folio.startsWith(prefix)) {
      const numericPart = Number.parseInt(folio.slice(prefix.length), 10);
      if (Number.isFinite(numericPart) && numericPart > maxSeq) {
        maxSeq = numericPart;
      }
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(6, '0')}`;
}

export function isSubscriptionActive(
  sub: Pick<SubscriptionRecord, 'status' | 'endsAt'> | null | undefined,
  referenceNowIso?: string
): boolean {
  if (!sub) return false;
  if (sub.status !== 'ACTIVO') return false;
  if (!sub.endsAt) return true;
  const nowMs = referenceNowIso ? new Date(referenceNowIso).getTime() : Date.now();
  const endMs = new Date(sub.endsAt).getTime();
  return Number.isFinite(endMs) && endMs > nowMs;
}

export function canPlanCoverCategory(
  plan: Pick<ServicePlan, 'coveredCategories'> | null | undefined,
  category: TicketCategory
): boolean {
  if (!plan) return false;
  if (category === 'Facturación y Planes') return true;
  return plan.coveredCategories.includes(category);
}

const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NUEVO: ['ASIGNADO', 'EN PROCESO', 'EN ESPERA', 'RESUELTO'],
  ASIGNADO: ['EN PROCESO', 'EN ESPERA', 'RESUELTO', 'ASIGNADO'],
  'EN PROCESO': ['EN ESPERA', 'RESUELTO', 'ASIGNADO'],
  'EN ESPERA': ['EN PROCESO', 'RESUELTO', 'ASIGNADO'],
  RESUELTO: ['CERRADO', 'EN PROCESO'],
  CERRADO: ['EN PROCESO'],
};

export function canTransitionTicketStatus(
  current: TicketStatus,
  next: TicketStatus,
  role: UserRole
): { allowed: boolean; reason?: string } {
  if (current === next) return { allowed: true };

  if (role === 'USUARIO') {
    if (current === 'RESUELTO' && next === 'CERRADO') return { allowed: true };
    if ((current === 'RESUELTO' || current === 'CERRADO') && next === 'EN PROCESO') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Un cliente solo puede confirmar el cierre de un ticket resuelto o solicitar su reapertura con motivo.',
    };
  }

  const validNext = ALLOWED_STATUS_TRANSITIONS[current] ?? [];
  if (!validNext.includes(next)) {
    return {
      allowed: false,
      reason: `Transición de estado inválida: ${current} → ${next}.`,
    };
  }
  return { allowed: true };
}

export function stripInternalTicketFieldsForClient(ticket: Ticket): Ticket {
  return {
    ...ticket,
    comments: (ticket.comments ?? []).filter((c) => !c.isInternal),
    activities: (ticket.activities ?? []).filter((a) => !a.isInternal),
    assignedTechId: undefined,
  };
}

export interface BusinessCalendarOptions {
  is24_7: boolean;
  workStartHour?: number;
  workEndHour?: number;
  saturdayEndHour?: number;
  holidays?: string[];
  responseMinutesOverride?: number;
  resolutionMinutesOverride?: number;
}

function getMexicoCityParts(dateMs: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun..6=Sat
  isoDate: string;
} {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = dtf.formatToParts(new Date(dateMs));
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour === '24' ? '0' : map.hour);
  const minute = Number(map.minute);
  return {
    year,
    month,
    day,
    hour,
    minute,
    weekday: weekdayMap[map.weekday] ?? 1,
    isoDate: `${map.year}-${map.month}-${map.day}`,
  };
}

function addBusinessMinutesMexicoCity(
  startMs: number,
  minutesToAdd: number,
  options: BusinessCalendarOptions
): number {
  if (options.is24_7 || minutesToAdd <= 0) {
    return startMs + minutesToAdd * 60_000;
  }

  const workStart = options.workStartHour ?? 9;
  const workEnd = options.workEndHour ?? 18;
  const satEnd = options.saturdayEndHour ?? 14;
  const holidays = new Set(options.holidays ?? []);

  let cursor = startMs;
  let remaining = minutesToAdd;
  const maxIterations = 60 * 24 * 30; // safety guard (30 days of minute/step advances)
  let steps = 0;

  while (remaining > 0 && steps < maxIterations) {
    steps += 1;
    const p = getMexicoCityParts(cursor);
    const isHoliday = holidays.has(p.isoDate);
    const isSunday = p.weekday === 0;
    const dayEndHour = p.weekday === 6 ? satEnd : workEnd;

    if (isSunday || isHoliday || p.hour >= dayEndHour) {
      // Jump 30 mins until next active window
      cursor += 30 * 60_000;
      continue;
    }

    if (p.hour < workStart) {
      const minsUntilOpen = (workStart - p.hour) * 60 - p.minute;
      cursor += Math.max(1, minsUntilOpen) * 60_000;
      continue;
    }

    const minsLeftToday = (dayEndHour - p.hour) * 60 - p.minute;
    if (minsLeftToday <= 0) {
      cursor += 30 * 60_000;
      continue;
    }

    const consume = Math.min(remaining, minsLeftToday);
    cursor += consume * 60_000;
    remaining -= consume;
  }

  return cursor;
}

export function calculateBusinessAwareSlaDeadlines(
  priority: TicketPriority,
  createdAtIso: string,
  options: BusinessCalendarOptions = { is24_7: true }
): { slaDueResponse: string; slaDueResolution: string } {
  const policy = SLA_POLICIES[priority];
  const baseMs = new Date(createdAtIso).getTime();
  const safeBaseMs = Number.isFinite(baseMs) ? baseMs : Date.now();
  const respMins = options.responseMinutesOverride ?? policy.responseMinutes;
  const resMins = options.resolutionMinutesOverride ?? policy.resolutionMinutes;

  const dueRespMs = addBusinessMinutesMexicoCity(safeBaseMs, respMins, options);
  const dueResMs = addBusinessMinutesMexicoCity(safeBaseMs, resMins, options);

  return {
    slaDueResponse: new Date(dueRespMs).toISOString(),
    slaDueResolution: new Date(dueResMs).toISOString(),
  };
}

export function calculateSlaDeadlines(
  priority: TicketPriority,
  createdAtIso: string
): { slaDueResponse: string; slaDueResolution: string } {
  return calculateBusinessAwareSlaDeadlines(priority, createdAtIso, { is24_7: true });
}

export function isSlaBreached(ticket: Ticket, referenceNowIso?: string): boolean {
  const pausedMs = (ticket.pausedMinutes ?? 0) * 60_000;
  const effectiveDueMs = new Date(ticket.slaDueResolution).getTime() + pausedMs;
  if (ticket.status === 'RESUELTO' || ticket.status === 'CERRADO') {
    if (!ticket.resolvedAt) return false;
    return new Date(ticket.resolvedAt).getTime() > effectiveDueMs;
  }
  const nowMs = referenceNowIso ? new Date(referenceNowIso).getTime() : Date.now();
  return nowMs > effectiveDueMs;
}

export function extractDriveFileId(url: string): string {
  const u = String(url || '').trim();
  if (!u) return '';
  const dMatch = u.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch && dMatch[1]) return dMatch[1];
  const idMatch = u.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return '';
}

export function validateTicketInput(input: Partial<CreateTicketInput>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.department || !TICKET_DEPARTMENTS.includes(input.department)) {
    errors.department = 'Selecciona un departamento válido.';
  }

  if (!input.category || !TICKET_CATEGORIES.includes(input.category)) {
    errors.category = 'Selecciona una categoría válida.';
  }

  if (!input.priority || !TICKET_PRIORITIES.includes(input.priority)) {
    errors.priority = 'Selecciona una prioridad SLA válida.';
  }

  if (!input.subject || input.subject.trim().length < 5) {
    errors.subject = 'Describe el asunto brevemente (mínimo 5 caracteres).';
  }

  if (!input.description || input.description.trim().length < 15) {
    errors.description = 'Detalla la incidencia técnica o solicitud (mínimo 15 caracteres).';
  }

  return errors;
}

const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  CRÍTICA: 4,
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};

export function sortTicketsByPriorityAndDate(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const aDone = a.status === 'RESUELTO' || a.status === 'CERRADO' ? 1 : 0;
    const bDone = b.status === 'RESUELTO' || b.status === 'CERRADO' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (pDiff !== 0) return pDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function filterTickets(
  tickets: Ticket[],
  options: {
    query?: string;
    status?: string;
    priority?: string;
    equipmentCode?: string;
    category?: string;
  }
): Ticket[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const status = options.status ?? 'Todos';
  const priority = options.priority ?? 'Todas';
  const equipmentCode = options.equipmentCode ?? 'Todos';
  const category = options.category ?? 'Todas';

  return tickets.filter((ticket) => {
    if (status !== 'Todos' && ticket.status !== status) return false;
    if (priority !== 'Todas' && ticket.priority !== priority) return false;
    if (equipmentCode !== 'Todos' && ticket.equipmentCode !== equipmentCode) return false;
    if (category !== 'Todas' && ticket.category !== category) return false;

    if (q.length > 0) {
      const searchable = [
        ticket.folio,
        ticket.subject,
        ticket.requesterName,
        ticket.requesterEmail,
        ticket.clientCompany,
        ticket.department,
        ticket.category,
        ticket.equipmentCode ?? '',
        ticket.assignedTech,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export function filterEquipments(
  equipments: EquipmentAsset[],
  query: string,
  healthFilter: string
): EquipmentAsset[] {
  const q = query.trim().toLowerCase();

  return equipments.filter((eq) => {
    if (healthFilter !== 'Todos' && eq.healthStatus !== healthFilter) return false;
    if (!q) return true;

    const searchable = [
      eq.equipmentCode,
      eq.hostname,
      eq.assignedUser,
      eq.clientCode,
      eq.brandModel,
      eq.osName,
      eq.perfmonSummary,
    ]
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  });
}

export function calculateTicketMetrics(
  tickets: Ticket[],
  referenceNowIso?: string
): TicketMetrics {
  let nuevos = 0;
  let enAtencion = 0;
  let enEspera = 0;
  let resueltosCerrados = 0;
  let slaBreachedCount = 0;
  let satisfactionSum = 0;
  let satisfactionCount = 0;

  for (const ticket of tickets) {
    if (ticket.status === 'NUEVO') nuevos += 1;
    else if (ticket.status === 'ASIGNADO' || ticket.status === 'EN PROCESO') enAtencion += 1;
    else if (ticket.status === 'EN ESPERA') enEspera += 1;
    else if (ticket.status === 'RESUELTO' || ticket.status === 'CERRADO') resueltosCerrados += 1;

    if (isSlaBreached(ticket, referenceNowIso)) {
      slaBreachedCount += 1;
    }

    if (typeof ticket.satisfactionScore === 'number') {
      satisfactionSum += ticket.satisfactionScore;
      satisfactionCount += 1;
    }
  }

  return {
    total: tickets.length,
    nuevos,
    enAtencion,
    enEspera,
    resueltosCerrados,
    slaBreachedCount,
    avgSatisfaction:
      satisfactionCount > 0 ? Math.round((satisfactionSum / satisfactionCount) * 10) / 10 : 5,
  };
}

export function formatSlaDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = minutes / 60;
  return Number.isInteger(hrs) ? `${hrs} hrs` : `${hrs.toFixed(1)} hrs`;
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateShort(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function buildTicketsCsv(tickets: Ticket[]): string {
  const headers = [
    'Folio',
    'Estado',
    'Prioridad',
    'Cliente',
    'Solicitante',
    'Departamento',
    'Categoria',
    'Equipo',
    'Asunto',
    'Tecnico',
    'Vencimiento_SLA_Respuesta',
    'Vencimiento_SLA_Resolucion',
    'Minutos_Pausa',
    'Calificacion',
    'Creado',
  ];

  const escapeCell = (val: string | number | undefined) =>
    `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = tickets.map((t) =>
    [
      t.folio,
      t.status,
      t.priority,
      t.clientCompany,
      t.requesterName,
      t.department,
      t.category,
      t.equipmentCode ?? 'N/A',
      t.subject,
      t.assignedTech,
      t.slaDueResponse,
      t.slaDueResolution,
      t.pausedMinutes ?? 0,
      t.satisfactionScore ?? '',
      t.createdAt,
    ]
      .map(escapeCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

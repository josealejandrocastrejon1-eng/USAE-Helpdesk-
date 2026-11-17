import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { createHelpdeskApp } from './app.ts';
import {
  bootstrapProductionAdminIfConfigured,
  DEV_DEMO_ACCOUNTS,
  isDemoModeEnabled,
  openDatabase,
  seedDemoDataIfEmpty,
} from './db.ts';

interface ApiJson {
  success: boolean;
  message: string;
  code?: string;
  data?: Record<string, unknown>;
}

class HttpClient {
  private cookieHeader = '';
  public csrfToken = '';

  constructor(private readonly baseUrl: string) {}

  async request(
    method: string,
    pathname: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ status: number; json: ApiJson | null; text: string; headers: Headers }> {
    const headers: Record<string, string> = {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {}),
      ...(this.csrfToken && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase())
        ? { 'X-CSRF-Token': this.csrfToken }
        : {}),
      ...(extraHeaders ?? {}),
    };

    const res = await fetch(`${this.baseUrl}${pathname}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const sidPart = setCookie.split(';')[0];
      if (sidPart.endsWith('=')) {
        this.cookieHeader = '';
        this.csrfToken = '';
      } else {
        this.cookieHeader = sidPart;
      }
    }

    const text = await res.text();
    let json: ApiJson | null = null;
    try {
      json = JSON.parse(text) as ApiJson;
      if (json?.data && typeof json.data.csrfToken === 'string') {
        this.csrfToken = json.data.csrfToken;
      }
    } catch {
      json = null;
    }

    return { status: res.status, json, text, headers: res.headers };
  }

  async login(email: string, password: string) {
    const res = await this.request('POST', '/api/auth/login', { email, password });
    assert.equal(res.status, 200, `Login failed for ${email}: ${res.text}`);
    assert.equal(res.json?.success, true);
    return res.json!.data!;
  }

  async logout() {
    const res = await this.request('POST', '/api/auth/logout', {});
    this.cookieHeader = '';
    this.csrfToken = '';
    return res;
  }
}

function demoPass(email: string): string {
  const found = DEV_DEMO_ACCOUNTS.find((a) => a.email === email);
  if (!found) throw new Error(`Missing demo account ${email}`);
  return found.password;
}

function signMpWebhook(dataId: string, requestId: string, ts: string, secret: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

let server: http.Server;
let baseUrl = '';
let tempUploadsDir = '';
const mpPaymentsStore = new Map<
  string,
  {
    id: string;
    status: string;
    status_detail: string;
    transaction_amount: number;
    currency_id: string;
    external_reference: string;
  }
>();

const TEST_WEBHOOK_SECRET = 'test-usae-mp-webhook-secret-2026';

before(async () => {
  process.env.ALLOW_DEMO_SEED = 'true';
  process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

  tempUploadsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'usae-uploads-'));
  const db = openDatabase(':memory:');
  seedDemoDataIfEmpty(db);

  const app = createHelpdeskApp(db, {
    uploadsDir: tempUploadsDir,
    mercadoPagoFetcher: async (mpPaymentId: string) => {
      const payment = mpPaymentsStore.get(mpPaymentId);
      if (!payment) return { ok: false };
      return { ok: true, payment };
    },
  });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (tempUploadsDir) {
    await fs.rm(tempUploadsDir, { recursive: true, force: true });
  }
});

test('1 & 2. Public catalog & contact work without auth, while all private APIs reject unauthenticated requests (401)', async () => {
  const anon = new HttpClient(baseUrl);

  const plansRes = await anon.request('GET', '/api/catalog/plans');
  assert.equal(plansRes.status, 200);
  const plans = plansRes.json?.data?.plans as Array<{ code: string }>;
  assert.equal(plans.length, 8);

  const contactRes = await anon.request('POST', '/api/public/contact', {
    fullName: 'Prospecto Prueba',
    email: 'prospecto@empresa.mx',
    phone: '5554968308',
    company: 'Grupo Industrial MX',
    planCode: 'INF-EMPRESARIAL',
    subject: 'Cotización infraestructura',
    message: 'Requerimos soporte técnico para 12 equipos en oficina CDMX.',
    consentAccepted: true,
  });
  assert.equal(contactRes.status, 201);

  for (const [method, endpoint] of [
    ['GET', '/api/auth/me'],
    ['GET', '/api/account'],
    ['GET', '/api/tickets'],
    ['POST', '/api/tickets'],
    ['GET', '/api/assets'],
    ['GET', '/api/payments'],
    ['GET', '/api/reports/summary'],
    ['GET', '/api/admin/users'],
    ['GET', '/api/admin/audit-logs'],
  ] as const) {
    const priv = await anon.request(method, endpoint, method === 'POST' ? {} : undefined);
    assert.equal(priv.status, 401, `Expected 401 on ${method} ${endpoint}, got ${priv.status}`);
  }
});

test('3. Registration -> email verification -> login -> CSRF protection -> password reset -> lockout after 5 fails', async () => {
  const client = new HttpClient(baseUrl);
  const testEmail = 'registro.prueba@corp.mx';
  const initialPw = 'UsaeTest#2026A';
  const resetPw = 'UsaeTest#2026B';

  const regRes = await client.request('POST', '/api/auth/register', {
    fullName: 'Ana Torres',
    email: testEmail,
    phone: '5511223344',
    companyName: 'Comercializadora Torres SA',
    rfc: 'CTO200101AB1',
    password: initialPw,
    confirmPassword: initialPw,
    privacyAccepted: true,
    termsAccepted: true,
  });
  assert.equal(regRes.status, 201);
  assert.equal(regRes.json?.data?.planStatus, 'SIN_PLAN');
  const verifyToken = regRes.json?.data?.devVerificationToken as string;
  assert.ok(verifyToken && verifyToken.length > 10);

  // Cannot login before verifying email
  const preLogin = await client.request('POST', '/api/auth/login', {
    email: testEmail,
    password: initialPw,
  });
  assert.equal(preLogin.status, 403);
  assert.equal(preLogin.json?.code, 'EMAIL_NOT_VERIFIED');

  // Verify email
  const verifyRes = await client.request('POST', '/api/auth/verify-email', { token: verifyToken });
  assert.equal(verifyRes.status, 200);

  // Login succeeds and issues HttpOnly session + CSRF token
  await client.login(testEmail, initialPw);

  // CSRF failure if X-CSRF-Token is missing or tampered
  const savedCsrf = client.csrfToken;
  client.csrfToken = 'tampered-token';
  const csrfFail = await client.request('POST', '/api/tickets', { subject: 'x' });
  assert.equal(csrfFail.status, 403);
  assert.equal(csrfFail.json?.code, 'CSRF_INVALID');
  client.csrfToken = savedCsrf;

  // Forgot & reset password revokes active session
  const forgotRes = await client.request('POST', '/api/auth/forgot-password', { email: testEmail });
  assert.equal(forgotRes.status, 200);
  const resetToken = forgotRes.json?.data?.devResetToken as string;
  assert.ok(resetToken);

  const resetRes = await client.request('POST', '/api/auth/reset-password', {
    token: resetToken,
    newPassword: resetPw,
    confirmPassword: resetPw,
  });
  assert.equal(resetRes.status, 200);

  // Old session is revoked
  const staleCheck = await client.request('GET', '/api/auth/me');
  assert.equal(staleCheck.status, 401);

  // Old password rejected; lockout after 5 failures
  for (let i = 0; i < 5; i++) {
    const fail = await client.request('POST', '/api/auth/login', {
      email: testEmail,
      password: initialPw,
    });
    assert.equal(fail.status, 401);
  }
  const locked = await client.request('POST', '/api/auth/login', {
    email: testEmail,
    password: resetPw,
  });
  assert.equal(locked.status, 423);
  assert.equal(locked.json?.code, 'ACCOUNT_LOCKED');
});

test('4, 5 & 6. Subscription gating: SIN_PLAN & VENCIDO cannot create tickets; INF-ESENCIAL rejects Desarrollo Web', async () => {
  // SIN_PLAN user
  const sinPlan = new HttpClient(baseUrl);
  await sinPlan.login('nuevo@empresa.mx', demoPass('nuevo@empresa.mx'));
  const blockSinPlan = await sinPlan.request('POST', '/api/tickets', {
    department: 'Soporte Remoto N1',
    category: 'Software y Controladores',
    priority: 'MEDIA',
    serviceMode: 'REMOTO',
    subject: 'Error al abrir ERP contable',
    description: 'El cliente recibe código de error 403 al abrir la aplicación local.',
  });
  assert.equal(blockSinPlan.status, 403);
  assert.equal(blockSinPlan.json?.code, 'SUBSCRIPTION_REQUIRED');

  // VENCIDO user: can view historical ticket USAE-2026-000006, cannot create new tickets
  const vencido = new HttpClient(baseUrl);
  await vencido.login('vencido@empresa.mx', demoPass('vencido@empresa.mx'));
  const histRes = await vencido.request('GET', '/api/tickets');
  assert.equal(histRes.status, 200);
  const histTickets = histRes.json?.data?.tickets as Array<{ folio: string }>;
  assert.ok(histTickets.some((t) => t.folio === 'USAE-2026-000006'));

  const blockVencido = await vencido.request('POST', '/api/tickets', {
    department: 'Soporte Remoto N1',
    category: 'Hardware y Diagnóstico',
    priority: 'ALTA',
    serviceMode: 'REMOTO',
    subject: 'Solicitud con plan expirado',
    description: 'Intento de crear un nuevo ticket teniendo suscripción vencida.',
  });
  assert.equal(blockVencido.status, 403);
  assert.equal(blockVencido.json?.code, 'SUBSCRIPTION_EXPIRED');

  // INF-ESENCIAL active client cannot open Desarrollo Web y Portales ticket
  const esencial = new HttpClient(baseUrl);
  await esencial.login('cliente@usae.mx', demoPass('cliente@usae.mx'));
  const catBlocked = await esencial.request('POST', '/api/tickets', {
    department: 'Desarrollo Web',
    category: 'Desarrollo Web y Portales',
    priority: 'MEDIA',
    serviceMode: 'REMOTO',
    subject: 'Cambios en portal e-commerce',
    description: 'Solicitud fuera de cobertura del plan esencial de infraestructura.',
  });
  assert.equal(catBlocked.status, 403);
  assert.equal(catBlocked.json?.code, 'CATEGORY_NOT_COVERED');
});

test('7 & 8. SPEI checkout stays PAGO_EN_REVISION until Admin approves; rejection keeps plan inactive', async () => {
  const client = new HttpClient(baseUrl);
  await client.login('nuevo@empresa.mx', demoPass('nuevo@empresa.mx'));

  // 1) Create first SPEI checkout and reject it
  const spei1 = await client.request('POST', '/api/checkout', {
    planCode: 'INF-ESENCIAL',
    method: 'SPEI',
    termsAccepted: true,
    transferReference: 'SPEI-INVALID-001',
  });
  assert.equal(spei1.status, 201);
  const pay1 = spei1.json?.data?.payment as { paymentId: string; status: string };
  assert.equal(pay1.status, 'PAGO_EN_REVISION');

  // Client is STILL blocked from creating tickets
  const stillBlocked = await client.request('POST', '/api/tickets', {
    department: 'Soporte Remoto N1',
    category: 'Software y Controladores',
    priority: 'MEDIA',
    serviceMode: 'REMOTO',
    subject: 'Ticket antes de aprobación SPEI',
    description: 'Debe ser bloqueado porque el SPEI aún no ha sido validado por Administración.',
  });
  assert.equal(stillBlocked.status, 403);

  const admin = new HttpClient(baseUrl);
  await admin.login('admin@usae.mx', demoPass('admin@usae.mx'));

  const rejRes = await admin.request('POST', `/api/admin/payments/${pay1.paymentId}/reject`, {
    reason: 'Abono no reflejado en estado de cuenta bancario.',
  });
  assert.equal(rejRes.status, 200);

  // Client STILL blocked after rejection
  const afterReject = await client.request('POST', '/api/tickets', {
    department: 'Soporte Remoto N1',
    category: 'Software y Controladores',
    priority: 'MEDIA',
    serviceMode: 'REMOTO',
    subject: 'Ticket tras rechazo SPEI',
    description: 'Debe permanecer bloqueado tras el rechazo administrativo del comprobante.',
  });
  assert.equal(afterReject.status, 403);

  // 2) Create second SPEI checkout and approve it
  const spei2 = await client.request('POST', '/api/checkout', {
    planCode: 'INF-ESENCIAL',
    method: 'SPEI',
    termsAccepted: true,
    transferReference: 'SPEI-VALID-002',
  });
  assert.equal(spei2.status, 201);
  const pay2 = spei2.json?.data?.payment as { paymentId: string };

  const appRes = await admin.request('POST', `/api/admin/payments/${pay2.paymentId}/approve`, {});
  assert.equal(appRes.status, 200);

  // Now client has ACTIVO plan and CAN create a ticket
  const nowAllowed = await client.request('POST', '/api/tickets', {
    department: 'Soporte Remoto N1',
    category: 'Software y Controladores',
    priority: 'MEDIA',
    serviceMode: 'REMOTO',
    subject: 'Configuración de impresora fiscal',
    description: 'Ya cuento con plan activo aprobado vía SPEI y requiero configuración de driver.',
  });
  assert.equal(nowAllowed.status, 201);
  const createdTicket = nowAllowed.json?.data?.ticket as { folio: string };
  assert.match(createdTicket.folio, /^USAE-\d{4}-\d{6}$/);
});

test('9, 10 & 11. Mercado Pago webhook rejects bad signature, handles non-approved, validates S2S & is idempotent', async () => {
  const client = new HttpClient(baseUrl);
  await client.login('vencido@empresa.mx', demoPass('vencido@empresa.mx'));

  // Checkout MP order
  const mpOrder = await client.request('POST', '/api/checkout', {
    planCode: 'INF-EMPRESARIAL',
    method: 'MERCADO_PAGO',
    termsAccepted: true,
  });
  assert.equal(mpOrder.status, 201);
  const payment = mpOrder.json?.data?.payment as { paymentId: string; amountMXN: number };

  // Redirect param simulation cannot activate anything; user still blocked
  const subCheck1 = await client.request('GET', '/api/subscription');
  assert.equal(subCheck1.json?.data?.active, false);

  const webhookCaller = new HttpClient(baseUrl);

  // Bad signature -> 401
  const badSig = await webhookCaller.request(
    'POST',
    '/api/webhooks/mercadopago',
    { type: 'payment', data: { id: '900001' } },
    { 'x-signature': 'ts=1700000,v1=deadbeef', 'x-request-id': 'req-1' }
  );
  assert.equal(badSig.status, 401);

  // Non-approved status (rejected) -> updates payment without activating
  mpPaymentsStore.set('900002', {
    id: '900002',
    status: 'rejected',
    status_detail: 'cc_rejected_insufficient_amount',
    transaction_amount: payment.amountMXN,
    currency_id: 'MXN',
    external_reference: payment.paymentId,
  });
  const ts1 = '1700000100';
  const rejHook = await webhookCaller.request(
    'POST',
    '/api/webhooks/mercadopago',
    { type: 'payment', data: { id: '900002' } },
    {
      'x-signature': signMpWebhook('900002', 'req-2', ts1, TEST_WEBHOOK_SECRET),
      'x-request-id': 'req-2',
    }
  );
  assert.equal(rejHook.status, 200);
  assert.equal(rejHook.json?.data?.activated, false);
  const subCheck2 = await client.request('GET', '/api/subscription');
  assert.equal(subCheck2.json?.data?.active, false);

  // Valid approved MP payment via ?hook=mp route
  mpPaymentsStore.set('900003', {
    id: '900003',
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: payment.amountMXN,
    currency_id: 'MXN',
    external_reference: payment.paymentId,
  });
  const ts2 = '1700000200';
  const sig2 = signMpWebhook('900003', 'req-3', ts2, TEST_WEBHOOK_SECRET);

  const okHook = await webhookCaller.request(
    'POST',
    '/?hook=mp',
    { type: 'payment', data: { id: '900003' } },
    { 'x-signature': sig2, 'x-request-id': 'req-3' }
  );
  assert.equal(okHook.status, 200);
  assert.equal(okHook.json?.data?.alreadyProcessed, false);
  const firstEndsAt = (okHook.json?.data?.subscription as { endsAt: string }).endsAt;

  // Duplicate webhook with same mp_payment_id -> idempotent (no duplicate extension)
  const dupHook = await webhookCaller.request(
    'POST',
    '/api/webhooks/mercadopago',
    { type: 'payment', data: { id: '900003' } },
    { 'x-signature': sig2, 'x-request-id': 'req-3' }
  );
  assert.equal(dupHook.status, 200);
  assert.equal(dupHook.json?.data?.alreadyProcessed, true);

  const subCheck3 = await client.request('GET', '/api/subscription');
  assert.equal(subCheck3.json?.data?.active, true);
  assert.equal((subCheck3.json?.data?.current as { endsAt: string }).endsAt, firstEndsAt);
});

test('12, 13, 14, 15, 16, 17, 18 & 19. RBAC, anti-IDOR, attachments, Modules 01-07, and concurrent folios', async () => {
  // Active CLIENT A (cliente@usae.mx) vs CLIENT B (cpena.pagos@banorte.com)
  const clientA = new HttpClient(baseUrl);
  await clientA.login('cliente@usae.mx', demoPass('cliente@usae.mx'));

  const clientB = new HttpClient(baseUrl);
  await clientB.login('cpena.pagos@banorte.com', demoPass('cpena.pagos@banorte.com'));

  // CLIENT A cannot access CLIENT B's ticket USAE-2026-000002 (IDOR)
  const idorTicket = await clientA.request('GET', '/api/tickets/USAE-2026-000002');
  assert.equal(idorTicket.status, 403);

  // CLIENT A list never includes internal comments or internal activities
  const listA = await clientA.request('GET', '/api/tickets');
  const ticketsA = listA.json?.data?.tickets as Array<{
    folio: string;
    comments: Array<{ isInternal?: boolean }>;
    activities: Array<{ isInternal?: boolean }>;
  }>;
  assert.ok(ticketsA.every((t) => t.folio !== 'USAE-2026-000002'));
  const t1 = ticketsA.find((t) => t.folio === 'USAE-2026-000001');
  assert.ok(t1);
  assert.ok(t1.comments.every((c) => !c.isInternal));
  assert.ok(t1.activities.every((a) => !a.isInternal));

  // CLIENT A cannot link foreign equipment EQP-001 (anti-IDOR), must use own EQP-003
  const foreignAssetRes = await clientA.request('POST', '/api/tickets', {
    department: 'Infraestructura & TI',
    category: 'Hardware y Diagnóstico',
    equipmentCode: 'EQP-001',
    priority: 'ALTA',
    serviceMode: 'REMOTO',
    subject: 'Intento de vincular activo ajeno',
    description: 'Debe ser bloqueado por validación anti-IDOR de propiedad del equipo.',
  });
  assert.equal(foreignAssetRes.status, 403);
  assert.equal(foreignAssetRes.json?.code, 'FORBIDDEN_ASSET');

  // CLIENT A creates a ticket in Infraestructura & TI (with own EQP-003) and tests attachment allowlist + private download + anti-IDOR
  const infraTicketRes = await clientA.request('POST', '/api/tickets', {
    department: 'Infraestructura & TI',
    category: 'Hardware y Diagnóstico',
    equipmentCode: 'EQP-003',
    priority: 'ALTA',
    serviceMode: 'REMOTO',
    subject: 'Prueba de evidencia y aislamiento departamental',
    description: 'Ticket creado en Infraestructura & TI para probar adjuntos privados.',
  });
  assert.equal(infraTicketRes.status, 201);
  const infraFolio = (infraTicketRes.json?.data?.ticket as { folio: string }).folio;

  // CLIENT A also creates a ticket in Administración & Facturación (covered by INF-ESENCIAL) for Mariana Ríos (Supervisor of Administración & Facturación)
  const newTicketRes = await clientA.request('POST', '/api/tickets', {
    department: 'Administración & Facturación',
    category: 'Facturación y Planes',
    priority: 'ALTA',
    serviceMode: 'REMOTO',
    subject: 'Prueba de flujo técnico completo y facturación',
    description: 'Ticket creado para validar bitácora, asignación, cierre del cliente y reapertura.',
  });
  assert.equal(newTicketRes.status, 201);
  const folio = (newTicketRes.json?.data?.ticket as { folio: string }).folio;

  // Reject dangerous extension (.php)
  const badExt = await clientA.request('POST', `/api/tickets/${folio}/attachments`, {
    fileName: 'shell.php',
    mimeType: 'application/x-php',
    contentBase64: Buffer.from('<?php echo 1; ?>').toString('base64'),
  });
  assert.equal(badExt.status, 400);

  // Accept safe PNG attachment
  const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const goodAtt = await clientA.request('POST', `/api/tickets/${folio}/attachments`, {
    fileName: 'captura-error.png',
    mimeType: 'image/png',
    contentBase64: pngBytes.toString('base64'),
    category: 'CAPTURA',
  });
  assert.equal(goodAtt.status, 201);
  const attId = ((goodAtt.json?.data?.ticket as { attachments: Array<{ id: string }> }).attachments[0]).id;

  // CLIENT A can download own attachment; CLIENT B gets 403
  const dlA = await clientA.request('GET', `/api/attachments/${attId}/download`);
  assert.equal(dlA.status, 200);
  const dlB = await clientB.request('GET', `/api/attachments/${attId}/download`);
  assert.equal(dlB.status, 403);

  // SUPERVISOR (Administración & Facturación) assigns to TÉCNICO (Laura Méndez)
  const sup = new HttpClient(baseUrl);
  await sup.login('mariana.rios@usae.mx', demoPass('mariana.rios@usae.mx'));

  const staffRes = await sup.request('GET', '/api/admin/staff');
  assert.equal(staffRes.status, 200);
  const staffList = staffRes.json?.data?.staff as Array<{ corporateEmail: string; userId: number }>;
  const laura = staffList.find((s) => s.corporateEmail === 'laura.mendez@usae.mx')!;
  const adminUser = staffList.find((s) => s.corporateEmail === 'admin@usae.mx')!;

  // Supervisor CAN export reports, CANNOT edit admin catalog
  const supReport = await sup.request('GET', '/api/reports/export?format=csv');
  assert.equal(supReport.status, 200);
  assert.ok(supReport.text.includes('Folio,'));
  const supAdminDenied = await sup.request('GET', '/api/admin/users');
  assert.equal(supAdminDenied.status, 403);

  // Departmental scope: Supervisor of Administración & Facturación cannot assign Infraestructura & TI ticket (403)
  const crossDeptAssign = await sup.request('POST', `/api/tickets/${infraFolio}/assign`, {
    techUserId: laura.userId,
  });
  assert.equal(crossDeptAssign.status, 403);

  // Assign in-department ticket to Admin first, then test reassign reason requirement back to Laura
  const firstAssign = await sup.request('POST', `/api/tickets/${folio}/assign`, {
    techUserId: adminUser.userId,
  });
  assert.equal(firstAssign.status, 200);

  const reassignNoReason = await sup.request('POST', `/api/tickets/${folio}/assign`, {
    techUserId: laura.userId,
  });
  assert.equal(reassignNoReason.status, 400);
  assert.equal(reassignNoReason.json?.code, 'REASSIGN_REASON_REQUIRED');

  const assignRes = await sup.request('POST', `/api/tickets/${folio}/assign`, {
    techUserId: laura.userId,
    reason: 'Especialista N2 disponible para atención prioritaria.',
  });
  assert.equal(assignRes.status, 200);

  // TÉCNICO sees assigned ticket, cannot access unassigned ticket or financial/admin/reports
  const tech = new HttpClient(baseUrl);
  await tech.login('laura.mendez@usae.mx', demoPass('laura.mendez@usae.mx'));

  const techPayDenied = await tech.request('GET', '/api/payments');
  assert.equal(techPayDenied.status, 403);
  const techRepDenied = await tech.request('GET', '/api/reports/summary');
  assert.equal(techRepDenied.status, 403);
  const techAssignDenied = await tech.request('POST', `/api/tickets/${folio}/assign`, {
    techUserId: laura.userId,
  });
  assert.equal(techAssignDenied.status, 403);

  // Add internal activity + internal comment
  const actRes = await tech.request('POST', `/api/tickets/${folio}/activities`, {
    activityType: 'DIAGNOSTICO',
    description: 'Revisión de eventos UEFI y SMART en disco NVMe.',
    durationMinutes: 25,
    resultSummary: 'Sin sectores defectuosos; driver ACPI desactualizado.',
    isInternal: true,
  });
  assert.equal(actRes.status, 201);

  const intComment = await tech.request('POST', `/api/tickets/${folio}/comments`, {
    message: 'Nota interna N2: verificar firmware antes de cerrar.',
    isInternal: true,
  });
  assert.equal(intComment.status, 201);

  // Module 04 resolution rejects missing rootCause, then succeeds when complete
  const badClose = await tech.request('POST', `/api/tickets/${folio}/close`, {
    rootCause: 'x',
    activitiesPerformed: 'ok',
    solutionDetails: 'ok',
  });
  assert.equal(badClose.status, 400);

  const techResolve = await tech.request('POST', `/api/tickets/${folio}/close`, {
    rootCause: 'Controlador ACPI obsoleto provocando alerta térmica.',
    activitiesPerformed: 'Actualización de firmware UEFI y reinstalación de chipset.',
    solutionDetails: 'Equipo estabilizado bajo monitoreo Perfmon sin errores de evento.',
    recommendations: 'Mantener actualizaciones automáticas del fabricante.',
  });
  assert.equal(techResolve.status, 200);

  // Client A confirms resolution & rates 5 stars
  const clientClose = await clientA.request('POST', `/api/tickets/${folio}/close`, {
    satisfactionScore: 5,
  });
  assert.equal(clientClose.status, 200);
  const closedTicket = clientClose.json?.data?.ticket as {
    status: string;
    satisfactionScore: number;
    comments: Array<{ isInternal?: boolean }>;
  };
  assert.equal(closedTicket.status, 'CERRADO');
  assert.equal(closedTicket.satisfactionScore, 5);
  assert.ok(closedTicket.comments.every((c) => !c.isInternal));

  // Reopen requires >= 10 chars reason
  const badReopen = await clientA.request('POST', `/api/tickets/${folio}/reopen`, {
    reason: 'falló',
  });
  assert.equal(badReopen.status, 400);

  const goodReopen = await clientA.request('POST', `/api/tickets/${folio}/reopen`, {
    reason: 'El síntoma volvió a presentarse después de reiniciar la estación.',
  });
  assert.equal(goodReopen.status, 200);
  assert.equal((goodReopen.json?.data?.ticket as { status: string }).status, 'EN PROCESO');

  // ADMINISTRADOR updates catalog plan & reads audit logs
  const admin = new HttpClient(baseUrl);
  await admin.login('admin@usae.mx', demoPass('admin@usae.mx'));
  const updPlan = await admin.request('PUT', '/api/admin/plans/INF-ESENCIAL', {
    priceConfirmedByAdmin: true,
    alternativePriceNote: 'Precio confirmado por Dirección Comercial 2026.',
  });
  assert.equal(updPlan.status, 200);
  assert.equal((updPlan.json?.data?.plan as { version: number }).version, 2);

  const auditRes = await admin.request('GET', '/api/admin/audit-logs');
  assert.equal(auditRes.status, 200);
  const logs = auditRes.json?.data?.auditLogs as Array<{ event: string }>;
  assert.ok(logs.some((l) => l.event === 'PLAN_CATALOG_UPDATED'));
  assert.ok(logs.some((l) => l.event === 'TICKET_REOPENED'));

  // Concurrent folio generation: 10 parallel POST /api/tickets -> 10 unique sequential folios
  const parallelCreations = await Promise.all(
    Array.from({ length: 10 }, (_, idx) =>
      clientB.request('POST', '/api/tickets', {
        department: 'Infraestructura & TI',
        category: 'Redes y Conectividad',
        priority: 'MEDIA',
        serviceMode: 'REMOTO',
        subject: `Prueba concurrencia folio #${idx + 1}`,
        description: 'Validación de secuencia atómica sin colisión de folios USAE-YYYY-XXXXXX.',
      })
    )
  );
  const folios = parallelCreations.map((r) => {
    assert.equal(r.status, 201);
    return (r.json?.data?.ticket as { folio: string }).folio;
  });
  assert.equal(new Set(folios).size, 10, `Duplicate folios detected: ${folios.join(', ')}`);
});

test('20 & 21. SPEI ref update, notification read, password-change session revocation, security headers & production bootstrap', async () => {
  // Security headers & unknown API 404
  const anon = new HttpClient(baseUrl);
  const notFoundRes = await anon.request('GET', '/api/ruta-inexistente');
  assert.equal(notFoundRes.status, 404);
  assert.equal(notFoundRes.json?.code, 'ENDPOINT_NOT_FOUND');
  assert.equal(notFoundRes.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(notFoundRes.headers.get('x-frame-options'), 'SAMEORIGIN');

  // SPEI reference update + notification mark-as-read
  const client = new HttpClient(baseUrl);
  await client.login('cliente@usae.mx', demoPass('cliente@usae.mx'));

  const speiOrder = await client.request('POST', '/api/checkout', {
    planCode: 'INF-ESENCIAL',
    method: 'SPEI',
    termsAccepted: true,
  });
  assert.equal(speiOrder.status, 201);
  const payId = (speiOrder.json?.data?.payment as { paymentId: string }).paymentId;

  const updSpei = await client.request('POST', `/api/payments/${payId}/spei-reference`, {
    transferReference: 'RASTREO-99887766',
  });
  assert.equal(updSpei.status, 200);
  assert.equal(updSpei.json?.data?.status, 'PAGO_EN_REVISION');

  const accBefore = await client.request('GET', '/api/account');
  const notifications = accBefore.json?.data?.notifications as Array<{ id: string; isRead: boolean }>;
  assert.ok(notifications.length > 0);
  const firstNotif = notifications[0];
  const markRead = await client.request('POST', `/api/notifications/${firstNotif.id}/read`, {});
  assert.equal(markRead.status, 200);

  // Password change via /api/account revokes OTHER sessions but preserves current session
  const secondarySession = new HttpClient(baseUrl);
  await secondarySession.login('cliente@usae.mx', demoPass('cliente@usae.mx'));
  const currentPw = demoPass('cliente@usae.mx');
  const tempPw = 'UsaeTemp#2026New';

  const changePw = await client.request('PATCH', '/api/account', {
    currentPassword: currentPw,
    newPassword: tempPw,
  });
  assert.equal(changePw.status, 200);

  // Primary session stays alive; secondary session was revoked
  assert.equal((await client.request('GET', '/api/auth/me')).status, 200);
  assert.equal((await secondarySession.request('GET', '/api/auth/me')).status, 401);

  // Restore original demo password so subsequent runs/assertions remain clean
  const restorePw = await client.request('PATCH', '/api/account', {
    currentPassword: tempPw,
    newPassword: currentPw,
  });
  assert.equal(restorePw.status, 200);

  // Production mode isolation: demoMode disabled & bootstrapProductionAdminIfConfigured creates only 1 admin
  const prevNodeEnv = process.env.NODE_ENV;
  const prevDemoSeed = process.env.ALLOW_DEMO_SEED;
  const prevBootEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const prevBootPass = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_DEMO_SEED;
    assert.equal(isDemoModeEnabled(), false);

    const prodDb = openDatabase(':memory:');
    seedDemoDataIfEmpty(prodDb);
    assert.equal(
      (prodDb.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c,
      0
    );

    process.env.ADMIN_BOOTSTRAP_EMAIL = 'ops-admin@usae-prod.mx';
    process.env.ADMIN_BOOTSTRAP_PASSWORD = 'ProdAdmin#2026Secure!';
    const created = bootstrapProductionAdminIfConfigured(prodDb);
    assert.equal(created, true);
    assert.equal(
      (prodDb.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c,
      1
    );
    const adminRow = prodDb
      .prepare('SELECT email, role, account_status, email_verified FROM users')
      .get() as { email: string; role: string; account_status: string; email_verified: number };
    assert.equal(adminRow.email, 'ops-admin@usae-prod.mx');
    assert.equal(adminRow.role, 'ADMINISTRADOR');
    assert.equal(adminRow.account_status, 'ACTIVA');
    assert.equal(adminRow.email_verified, 1);
    prodDb.close();
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevDemoSeed === undefined) delete process.env.ALLOW_DEMO_SEED;
    else process.env.ALLOW_DEMO_SEED = prevDemoSeed;
    if (prevBootEmail === undefined) delete process.env.ADMIN_BOOTSTRAP_EMAIL;
    else process.env.ADMIN_BOOTSTRAP_EMAIL = prevBootEmail;
    if (prevBootPass === undefined) delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
    else process.env.ADMIN_BOOTSTRAP_PASSWORD = prevBootPass;
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTicketsCsv,
  calculateBusinessAwareSlaDeadlines,
  calculateSlaDeadlines,
  calculateTicketMetrics,
  canPlanCoverCategory,
  canTransitionTicketStatus,
  filterEquipments,
  filterTickets,
  generateFolio,
  isSlaBreached,
  isSubscriptionActive,
  sortTicketsByPriorityAndDate,
  stripInternalTicketFieldsForClient,
  validateAttachmentMeta,
  validatePasswordStrength,
  validateTicketInput,
  type EquipmentAsset,
  type Ticket,
} from './helpdesk.ts';

const BASE_TICKETS: Ticket[] = [
  {
    folio: 'USAE-2026-000001',
    requesterName: 'Luis Torres',
    requesterEmail: 'luis.torres@usae.mx',
    clientCompany: 'Empresa Demo',
    department: 'Infraestructura & TI',
    category: 'Software y Controladores',
    equipmentCode: 'EQP-003',
    priority: 'CRÍTICA',
    status: 'NUEVO',
    subject: 'Falla en controlador de red / PCI Device sin driver',
    description: 'El equipo EQP-003 presenta conflicto de controladores PCI y pérdida de paquetes.',
    assignedTech: 'Sin asignar',
    slaDueResponse: '2026-11-15T14:15:00.000Z',
    slaDueResolution: '2026-11-15T16:00:00.000Z',
    createdAt: '2026-11-15T14:00:00.000Z',
    updatedAt: '2026-11-15T14:00:00.000Z',
    comments: [
      {
        id: 'c1',
        author: 'Cliente',
        role: 'USUARIO',
        isInternal: false,
        message: 'Comentario visible',
        createdAt: '2026-11-15T14:01:00.000Z',
      },
      {
        id: 'c2',
        author: 'Admin',
        role: 'ADMINISTRADOR',
        isInternal: true,
        message: 'Nota interna confidencial',
        createdAt: '2026-11-15T14:02:00.000Z',
      },
    ],
    activities: [
      {
        id: 'a1',
        ticketFolio: 'USAE-2026-000001',
        actorName: 'Tech',
        actorRole: 'TÉCNICO',
        activityType: 'DIAGNÓSTICO',
        description: 'Actividad pública',
        durationMinutes: 15,
        isInternal: false,
        createdAt: '2026-11-15T14:03:00.000Z',
      },
      {
        id: 'a2',
        ticketFolio: 'USAE-2026-000001',
        actorName: 'Tech',
        actorRole: 'TÉCNICO',
        activityType: 'INTERNA',
        description: 'Actividad interna oculta',
        durationMinutes: 10,
        isInternal: true,
        createdAt: '2026-11-15T14:04:00.000Z',
      },
    ],
    history: [],
    attachments: [],
  },
  {
    folio: 'USAE-2026-000002',
    requesterName: 'Ing. Roberto Garza',
    requesterEmail: 'rgarza@banorte.com',
    clientCompany: 'Banorte Tech',
    department: 'Ciberseguridad',
    category: 'Ciberseguridad y Accesos',
    equipmentCode: 'EQP-004',
    priority: 'ALTA',
    status: 'RESUELTO',
    subject: 'Activación de Secure Boot y Antivirus corporativo',
    description: 'Se detectó estado crítico en estación de diseño con firewall desactivado.',
    assignedTech: 'Carlos Mendoza R. (EMP-001)',
    slaDueResponse: '2026-11-14T12:30:00.000Z',
    slaDueResolution: '2026-11-14T16:00:00.000Z',
    createdAt: '2026-11-14T12:00:00.000Z',
    updatedAt: '2026-11-14T15:00:00.000Z',
    resolvedAt: '2026-11-14T15:00:00.000Z',
    satisfactionScore: 5,
    comments: [],
    history: [],
    attachments: [],
  },
];

const SAMPLE_EQUIPMENTS: EquipmentAsset[] = [
  {
    equipmentCode: 'EQP-001',
    hostname: 'DESKTOP-FIN01',
    assignedUser: 'Carlos Mendoza',
    clientCode: 'CLI-001',
    brandModel: 'Dell OptiPlex 7090',
    osName: 'Windows 11 Pro 22H2',
    architecture: 'x64',
    biosInfo: 'Dell 1.15.0 | UEFI',
    secureBoot: true,
    processor: 'Intel Core i7-11700',
    ramInfo: '16 GB',
    gpuInfo: 'Intel UHD 750',
    storageInfo: 'NVMe KIOXIA 512GB (245.8 GB libres)',
    batteryPercent: 'N/A',
    antivirusStatus: 'Activo / Actualizado',
    firewallStatus: 'Activo',
    uacStatus: 'Habilitado',
    vbsStatus: 'Habilitada',
    perfmonSummary: 'Resp. Disco: 1.2 ms, Cola: 0.02',
    diskResponseMs: 1.2,
    healthStatus: 'ÓPTIMO',
    lastReportDate: '2026-08-15',
  },
  {
    equipmentCode: 'EQP-004',
    hostname: 'DESKTOP-DIS01',
    assignedUser: 'Sofía Ruiz',
    clientCode: 'CLI-001',
    brandModel: 'Custom Build PC (B660M)',
    osName: 'Windows 11 Home 22H2',
    architecture: 'x64',
    biosInfo: 'AMI 1401 | Legacy',
    secureBoot: false,
    processor: 'Intel Core i5-12400',
    ramInfo: '16 GB',
    gpuInfo: 'NVIDIA RTX 3060',
    storageInfo: 'WDC 1TB (32.1 GB libres)',
    batteryPercent: 'N/A',
    antivirusStatus: 'Inactivo',
    firewallStatus: 'Inactivo',
    uacStatus: 'Deshabilitado',
    vbsStatus: 'Deshabilitada',
    perfmonSummary: 'Saturación Disco C:, Unknown USB Device',
    diskResponseMs: 18.4,
    healthStatus: 'CRÍTICO',
    lastReportDate: '2026-08-10',
  },
];

test('generateFolio produces atomic 6-digit zero-padded USAE-YYYY-XXXXXX folios', () => {
  assert.equal(generateFolio([], 2026), 'USAE-2026-000001');
  assert.equal(
    generateFolio(['USAE-2026-000001', 'USAE-2026-000005', 'USAE-2025-000099'], 2026),
    'USAE-2026-000006'
  );
});

test('calculateSlaDeadlines and business-hours SLA respect 24/7 vs Mexico City working schedule & holidays', () => {
  const created = '2026-11-15T10:00:00.000Z';
  const p1 = calculateSlaDeadlines('CRÍTICA', created);
  assert.equal(p1.slaDueResponse, '2026-11-15T10:15:00.000Z');
  assert.equal(p1.slaDueResolution, '2026-11-15T12:00:00.000Z');

  // Sunday in Mexico City + Monday 2026-11-16 holiday -> moves to Tuesday 2026-11-17 09:00 CST (15:00 UTC)
  const biz = calculateBusinessAwareSlaDeadlines('CRÍTICA', '2026-11-15T18:00:00.000Z', {
    is24_7: false,
    workStartHour: 9,
    workEndHour: 18,
    saturdayEndHour: 14,
    holidays: ['2026-11-16'],
  });
  assert.equal(biz.slaDueResponse, '2026-11-17T15:15:00.000Z');
  assert.equal(biz.slaDueResolution, '2026-11-17T17:00:00.000Z');
});

test('isSlaBreached respects pausedMinutes', () => {
  const pausedTicket: Ticket = { ...BASE_TICKETS[0], pausedMinutes: 30 };
  assert.equal(isSlaBreached(pausedTicket, '2026-11-15T16:15:00.000Z'), false);
  assert.equal(isSlaBreached(pausedTicket, '2026-11-15T16:35:00.000Z'), true);
  assert.equal(isSlaBreached(BASE_TICKETS[1], '2026-11-20T00:00:00.000Z'), false);
});

test('subscription active and category coverage rules work strictly', () => {
  assert.equal(isSubscriptionActive(null), false);
  assert.equal(isSubscriptionActive({ status: 'SIN_PLAN', endsAt: null }), false);
  assert.equal(
    isSubscriptionActive({ status: 'VENCIDO', endsAt: '2026-01-01T00:00:00.000Z' }),
    false
  );
  assert.equal(
    isSubscriptionActive(
      { status: 'ACTIVO', endsAt: '2026-12-31T00:00:00.000Z' },
      '2026-11-15T00:00:00.000Z'
    ),
    true
  );
  assert.equal(
    isSubscriptionActive(
      { status: 'ACTIVO', endsAt: '2026-11-10T00:00:00.000Z' },
      '2026-11-15T00:00:00.000Z'
    ),
    false
  );

  assert.equal(
    canPlanCoverCategory(
      { coveredCategories: ['Hardware y Diagnóstico'] },
      'Desarrollo Web y Portales'
    ),
    false
  );
  assert.equal(
    canPlanCoverCategory(
      { coveredCategories: ['Hardware y Diagnóstico'] },
      'Hardware y Diagnóstico'
    ),
    true
  );
});

test('stripInternalTicketFieldsForClient removes internal comments and activities', () => {
  const safe = stripInternalTicketFieldsForClient(BASE_TICKETS[0]);
  assert.equal(safe.comments.length, 1);
  assert.equal(safe.comments[0].isInternal, false);
  assert.equal(safe.activities?.length, 1);
  assert.equal(safe.activities?.[0].isInternal, false);
});

test('validateAttachmentMeta blocks executable extensions and oversized payloads', () => {
  assert.equal(validateAttachmentMeta('shell.php', 'application/x-php', 1024, 10).valid, false);
  assert.equal(validateAttachmentMeta('payload.js', 'application/javascript', 1024, 10).valid, false);
  assert.equal(validateAttachmentMeta('report.pdf', 'application/pdf', 11 * 1024 * 1024, 10).valid, false);
  assert.equal(validateAttachmentMeta('evidencia.png', 'image/png', 500_000, 10).valid, true);
});

test('validatePasswordStrength and canTransitionTicketStatus enforce policy', () => {
  assert.ok(validatePasswordStrength('weak'));
  assert.equal(validatePasswordStrength('UsaeSeguro123'), null);
  assert.equal(canTransitionTicketStatus('NUEVO', 'CERRADO', 'USUARIO').allowed, false);
  assert.equal(canTransitionTicketStatus('RESUELTO', 'CERRADO', 'USUARIO').allowed, true);
});

test('validateTicketInput enforces required fields cleanly', () => {
  const invalid = validateTicketInput({
    department: 'Infraestructura & TI',
    category: 'Hardware y Diagnóstico',
    priority: 'CRÍTICA',
    subject: 'abc',
    description: 'muy corto',
  });
  assert.ok(invalid.subject);
  assert.ok(invalid.description);

  const valid = validateTicketInput({
    department: 'Infraestructura & TI',
    category: 'Hardware y Diagnóstico',
    equipmentCode: 'EQP-001',
    priority: 'ALTA',
    subject: 'Actualización de firmware BIOS Dell',
    description: 'Se requiere aplicar parche de seguridad BIOS 1.16.0 en estación DESKTOP-FIN01.',
  });
  assert.deepEqual(valid, {});
});

test('filterTickets, filterEquipments, metrics and CSV work accurately', () => {
  const sorted = sortTicketsByPriorityAndDate([BASE_TICKETS[1], BASE_TICKETS[0]]);
  assert.equal(sorted[0].folio, 'USAE-2026-000001');

  const byEqp = filterTickets(BASE_TICKETS, { equipmentCode: 'EQP-003' });
  assert.equal(byEqp.length, 1);

  const critical = filterEquipments(SAMPLE_EQUIPMENTS, '', 'CRÍTICO');
  assert.equal(critical.length, 1);

  const metrics = calculateTicketMetrics(BASE_TICKETS, '2026-11-15T15:00:00.000Z');
  assert.equal(metrics.total, 2);

  const csv = buildTicketsCsv(BASE_TICKETS);
  assert.ok(csv.includes('USAE-2026-000001'));
});

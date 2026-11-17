import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  SEED_CLIENTS,
  SEED_EQUIPMENTS,
  SEED_STAFF,
  SEED_TICKETS,
} from '../src/data/seedData.ts';
import {
  SLA_POLICIES,
  USAE_CONTACT,
  validatePasswordStrength,
  type ModuleDocRecord,
  type ServicePlan,
  type SystemSettings,
  type TicketCategory,
  type UserRole,
} from '../src/utils/helpdesk.ts';
import { hashPassword } from './security.ts';

export const DEFAULT_CATALOG_PLANS: ServicePlan[] = [
  {
    code: 'INF-ESENCIAL',
    category: 'TI / Infraestructura',
    title: 'Plan Esencial',
    priceMXN: 2000,
    priceLabel: '$2,000 MXN / mes',
    includesIva: false,
    billingPeriod: 'MENSUAL',
    minMonths: 6,
    maxEquipments: 5,
    monthlyVisitsIncluded: 0,
    is24_7: false,
    alternativePriceNote:
      'Referencia promocional en catálogo fuente: $1,000 MXN + IVA por 2 meses (sujeta a validación comercial).',
    priceConfirmedByAdmin: false,
    duration: '6 meses mínimo (ref. promocional: 2 meses)',
    slaSummary: 'Horario laboral · Respuesta crítica indicada en 8 h',
    coveredCategories: [
      'Hardware y Diagnóstico',
      'Redes y Conectividad',
      'Software y Controladores',
      'Facturación y Planes',
    ],
    scope: [
      'Soporte remoto institucional (Mesa N1/N2)',
      'Mantenimiento mensual preventivo y monitoreo básico',
      'Respaldo programado y soporte hasta 5 equipos registrados',
      'Cancelación anticipada con 30 días naturales de aviso',
    ],
    contractTerms:
      'Activación y renovación mediante pago confirmado por Mercado Pago o transferencia SPEI validada.',
    cancellationRule: 'Aviso previo de 30 días naturales; plazo mínimo inicial de 6 meses.',
    guaranteeRule: 'Cobertura continua durante la vigencia pagada según horario laboral.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'INF-EMPRESARIAL',
    category: 'TI / Infraestructura',
    title: 'Plan Empresarial',
    priceMXN: 4500,
    priceLabel: '$4,500 MXN / mes',
    includesIva: false,
    billingPeriod: 'MENSUAL',
    minMonths: 6,
    maxEquipments: 15,
    monthlyVisitsIncluded: 2,
    is24_7: false,
    alternativePriceNote:
      'Referencia contractual alternativa en fuente: $4,000 MXN + IVA por 3 meses (sujeta a validación comercial).',
    priceConfirmedByAdmin: false,
    duration: '6 meses mínimo (ref. alternativa: 3 meses)',
    slaSummary: 'Horario laboral · Respuesta crítica 4 h / normales 1 día hábil',
    coveredCategories: [
      'Hardware y Diagnóstico',
      'Redes y Conectividad',
      'Software y Controladores',
      'Ciberseguridad y Accesos',
      'Facturación y Planes',
    ],
    scope: [
      'Todo lo del Plan Esencial + monitoreo continuo de red y equipos',
      'Administración de servidores Windows / Linux',
      '2 visitas presenciales al mes con hoja de servicio imprimible',
      'Gestión de usuarios, respaldos y permisos hasta 15 equipos',
    ],
    contractTerms:
      'Incluye vinculación completa de inventario EQP-XXX, programación de visitas y bitácora SLA.',
    cancellationRule: 'Aviso previo de 30 días naturales tras cumplimiento de plazo mínimo.',
    guaranteeRule: 'Incluye 2 visitas presenciales mensuales acumulables solo bajo acuerdo escrito.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'INF-CORPORATIVO',
    category: 'TI / Infraestructura',
    title: 'Plan Corporativo',
    priceMXN: 8500,
    priceLabel: '$8,500 MXN / mes',
    includesIva: false,
    billingPeriod: 'MENSUAL',
    minMonths: 12,
    maxEquipments: 40,
    monthlyVisitsIncluded: 4,
    is24_7: true,
    alternativePriceNote:
      'Referencia unificada en catálogo fuente: $12,000 MXN (sujeta a validación comercial antes de campaña).',
    priceConfirmedByAdmin: false,
    duration: '12 meses mínimo',
    slaSummary: 'Atención 24/7 · SLA P1 15 min / 2 hrs',
    coveredCategories: [
      'Hardware y Diagnóstico',
      'Redes y Conectividad',
      'Software y Controladores',
      'Ciberseguridad y Accesos',
      'Desarrollo Web y Portales',
      'Facturación y Planes',
    ],
    scope: [
      'Incluye Plan Empresarial + cobertura 24/7 para infraestructura crítica',
      'Soporte de redes y operación multisucursal hasta 40 equipos',
      'Monitoreo continuo Perfmon, auditoría y escalamiento directo N3',
      'Reportes ejecutivos mensuales en CSV / PDF de cumplimiento SLA',
    ],
    contractTerms: 'Requiere NDA corporativo vigente y carátula MSA/SLA autorizada.',
    cancellationRule: 'Plazo mínimo de 12 meses; condiciones particulares en MSA prevalecen.',
    guaranteeRule: 'Cobertura de guardia 24/7 y escalamiento inmediato a Dirección Técnica.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'DEV-BASICO',
    category: 'Desarrollo Web',
    title: 'Plan Básico de Desarrollo Web',
    priceMXN: 5000,
    priceLabel: '$5,000 MXN · Proyecto único',
    includesIva: false,
    billingPeriod: 'PROYECTO_UNICO',
    minMonths: 1,
    maxEquipments: 1,
    monthlyVisitsIncluded: 0,
    is24_7: false,
    alternativePriceNote:
      'Referencia alternativa en código fuente: $3,000 MXN (sujeta a validación comercial).',
    priceConfirmedByAdmin: false,
    duration: '7–10 días hábiles (proyecto único)',
    slaSummary: 'Proyecto único · Garantía 30 días por errores posteriores',
    coveredCategories: ['Desarrollo Web y Portales', 'Facturación y Planes'],
    scope: [
      'Sitio web de una sola página (Landing page) con diseño responsive',
      'Integración directa con WhatsApp (+52) y formulario de contacto',
      'Esquema de pago: 50% anticipo / 50% contra entrega',
      'Garantía de 30 días por errores técnicos posteriores a la entrega',
    ],
    contractTerms: 'Anticipo no reembolsable una vez iniciado el desarrollo.',
    cancellationRule: 'Anticipo del 50% no reembolsable tras inicio de diseño/desarrollo.',
    guaranteeRule: 'Garantía correctiva de 30 días naturales sobre entregables aprobados.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'DEV-PRO',
    category: 'Desarrollo Web',
    title: 'Plan Profesional de Desarrollo Web',
    priceMXN: 12000,
    priceLabel: '$12,000 MXN · Proyecto único',
    includesIva: false,
    billingPeriod: 'PROYECTO_UNICO',
    minMonths: 2,
    maxEquipments: 3,
    monthlyVisitsIncluded: 0,
    is24_7: false,
    alternativePriceNote:
      'Referencia alternativa en código fuente: $8,000 MXN (sujeta a validación comercial).',
    priceConfirmedByAdmin: false,
    duration: '3–6 semanas (proyecto único)',
    slaSummary: 'Proyecto único · Garantía técnica 60 días',
    coveredCategories: ['Desarrollo Web y Portales', 'Facturación y Planes'],
    scope: [
      'Hasta 8 secciones corporativas con arquitectura y diseño a medida',
      'Panel administrativo, Google Analytics y formularios avanzados',
      'SEO técnico básico y sesión de capacitación operativa',
      'Pago 50% anticipo / 50% contra entrega · Garantía técnica de 60 días',
    ],
    contractTerms: 'Cesión de entregables tras liquidación del 100% del proyecto.',
    cancellationRule: 'Anticipo no reembolsable una vez iniciada la fase de arquitectura.',
    guaranteeRule: 'Garantía técnica de 60 días naturales por defectos funcionales.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'SEC-BASICO',
    category: 'Ciberseguridad',
    title: 'Plan Seguridad Básico',
    priceMXN: 3500,
    priceLabel: '$3,500 MXN / mes',
    includesIva: false,
    billingPeriod: 'MENSUAL',
    minMonths: 3,
    maxEquipments: 10,
    monthlyVisitsIncluded: 0,
    is24_7: false,
    alternativePriceNote: '',
    priceConfirmedByAdmin: true,
    duration: '3 meses mínimo',
    slaSummary: 'Horario laboral · Atención prioritaria P2',
    coveredCategories: [
      'Ciberseguridad y Accesos',
      'Software y Controladores',
      'Facturación y Planes',
    ],
    scope: [
      'Hardening de estaciones Windows/Linux (UEFI, Secure Boot, UAC)',
      'Despliegue y verificación de antimalware y firewall perimetral/local',
      'Revisión de accesos, privilegios RBAC y escaneo mensual de vulnerabilidades',
    ],
    contractTerms: 'Alineado a buenas prácticas OWASP y control de activos EQP.',
    cancellationRule: 'Plazo mínimo de 3 meses; renovación mediante pago confirmado.',
    guaranteeRule: 'Informe mensual de estado de seguridad por endpoint registrado.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'SEC-TOTAL',
    category: 'Ciberseguridad',
    title: 'Plan Protección Total',
    priceMXN: 7000,
    priceLabel: '$7,000 MXN / mes',
    includesIva: false,
    billingPeriod: 'MENSUAL',
    minMonths: 6,
    maxEquipments: 25,
    monthlyVisitsIncluded: 1,
    is24_7: true,
    alternativePriceNote: '',
    priceConfirmedByAdmin: true,
    duration: '6 meses mínimo',
    slaSummary: 'Monitoreo y respuesta a incidentes 24/7 (P1 15 min)',
    coveredCategories: [
      'Ciberseguridad y Accesos',
      'Redes y Conectividad',
      'Software y Controladores',
      'Hardware y Diagnóstico',
      'Facturación y Planes',
    ],
    scope: [
      'Incluye Seguridad Básico + monitoreo continuo de endpoints',
      'Auditorías periódicas de cumplimiento y contención de incidentes',
      'Respuesta inmediata 24/7 ante incidentes críticos P1 (15 min)',
    ],
    contractTerms: 'Cobertura bajo acuerdo de confidencialidad (NDA a 5 años).',
    cancellationRule: 'Plazo mínimo de 6 meses; aviso previo de 30 días naturales.',
    guaranteeRule: 'Guardia de contención de incidentes 24/7 durante vigencia activa.',
    isPublished: true,
    version: 1,
  },
  {
    code: 'CUSTOM',
    category: 'Servicios Personalizados',
    title: 'Consultoría / Proyecto a medida',
    priceMXN: null,
    priceLabel: 'A cotización',
    includesIva: false,
    billingPeriod: 'COTIZACION',
    minMonths: 1,
    maxEquipments: 100,
    monthlyVisitsIncluded: 0,
    is24_7: false,
    alternativePriceNote: 'Requiere levantamiento técnico y propuesta comercial aprobada.',
    priceConfirmedByAdmin: true,
    duration: 'Variable según alcance',
    slaSummary: 'Según propuesta técnica y acuerdo del proyecto',
    coveredCategories: [
      'Hardware y Diagnóstico',
      'Redes y Conectividad',
      'Ciberseguridad y Accesos',
      'Software y Controladores',
      'Desarrollo Web y Portales',
      'Facturación y Planes',
    ],
    scope: [
      'Levantamiento de requerimientos y arquitectura dedicada',
      'Integración SMTP/IMAP, WhatsApp Business, Moodle o automatización',
      'Propuesta técnica, implementación por fases, capacitación y soporte',
    ],
    contractTerms: 'NDA disponible bajo solicitud y registro comercial en CRM.',
    cancellationRule: 'Definida en propuesta técnica y contrato particular firmado.',
    guaranteeRule: 'Definida por entregables de cada fase contractual.',
    isPublished: true,
    version: 1,
  },
];

export const DEFAULT_MODULE_DOCS: ModuleDocRecord[] = [
  {
    moduleCode: 'MOD-00',
    title: 'Módulo 00 — Índice de Módulos Funcionales',
    fileName: '00_Indice_Modulos_Funcionales_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Dirección Técnica USAE',
    status: 'VIGENTE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Mapa maestro de los módulos documentales 01–07, control de versiones, permisos de consulta por rol y trazabilidad de consulta.',
    operationalChecklist: [
      'Consultar matriz de vigencia y responsable por módulo',
      'Validar permisos de acceso diferenciados por rol RBAC',
      'Registrar consulta/descarga en auditoría institucional',
    ],
  },
  {
    moduleCode: 'MOD-01',
    title: 'Módulo 01 — Asignación de Ingenieros',
    fileName: '01_Asignacion_de_Ingenieros_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Mariana Ríos (Supervisión)',
    status: 'CONFIGURABLE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO'],
    summary:
      'Bandeja de tickets nuevos sin asignar, asignación manual/por carga/especialidad N1–N3, reasignación con motivo obligatorio y escalamiento SLA.',
    operationalChecklist: [
      'Revisar cola de tickets NUEVO y validar prioridad P1–P4',
      'Asignar ingeniero N1/N2/N3 verificando carga operativa',
      'Registrar motivo obligatorio en cada reasignación o escalamiento',
    ],
  },
  {
    moduleCode: 'MOD-02',
    title: 'Módulo 02 — Seguimiento de Actividades',
    fileName: '02_Seguimiento_de_Actividades_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Mesa de Ayuda N1/N2',
    status: 'VIGENTE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Bitácora cronológica por ticket con duración en minutos, pausas por espera del cliente, resultado y separación estricta entre comentarios públicos y notas internas.',
    operationalChecklist: [
      'Registrar actividad técnica con duración y siguiente paso',
      'Marcar isInternal=true para notas exclusivas entre ingenieros',
      'Documentar motivo cuando el ticket pase a estado EN ESPERA',
    ],
  },
  {
    moduleCode: 'MOD-03',
    title: 'Módulo 03 — Carga de Evidencias y Resguardo',
    fileName: '03_Carga_de_Evidencias_Google_Drive_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Infraestructura & Seguridad',
    status: 'CONFIGURABLE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Carga segura de capturas, logs y reportes (máx. 10 MB, validación MIME/extensión, sin acceso público por defecto) y sincronización opcional con Google Drive.',
    operationalChecklist: [
      'Verificar extensión permitida y tamaño <= 10 MB antes de guardar',
      'Servir archivos únicamente por endpoint autenticado previa validación de propiedad',
      'Configurar GOOGLE_DRIVE_FOLDER_ID y credenciales para respaldo externo',
    ],
  },
  {
    moduleCode: 'MOD-04',
    title: 'Módulo 04 — Cierre y Validación del Ticket',
    fileName: '04_Cierre_y_Validacion_del_Ticket_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Dirección Técnica USAE',
    status: 'VIGENTE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Checklist obligatorio de diagnóstico/causa raíz/solución, confirmación del cliente, encuesta 1–5, reapertura controlada con motivo y Hoja de Servicio imprimible.',
    operationalChecklist: [
      'Completar diagnóstico, causa raíz y solución aplicada antes de marcar RESUELTO',
      'Recabar conformidad del cliente y encuesta de satisfacción (1 a 5)',
      'Generar Hoja de Servicio imprimible con firmas para atenciones en sitio',
    ],
  },
  {
    moduleCode: 'MOD-05',
    title: 'Módulo 05 — Programación de Mantenimientos',
    fileName: '05_Programacion_de_Mantenimientos_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Soporte Técnico & Campo',
    status: 'CONFIGURABLE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Calendario preventivo/correctivo por cliente, equipo EQP, técnico y sede respetando las visitas mensuales incluidas en cada plan contratado.',
    operationalChecklist: [
      'Validar visitas incluidas en el plan vigente (ej. Empresarial = 2 visitas/mes)',
      'Programar ventana horaria en zona America/Mexico_City y técnico responsable',
      'Registrar checklist antes/después o motivo obligatorio de cancelación/reprogramación',
    ],
  },
  {
    moduleCode: 'MOD-06',
    title: 'Módulo 06 — Paneles por Tipo de Usuario',
    fileName: '06_Paneles_por_Tipo_de_Usuario_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Arquitectura RBAC USAE',
    status: 'VIGENTE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TÉCNICO', 'USUARIO'],
    summary:
      'Separación estricta entre Sitio Público Comercial y portales autenticados por rol: Cliente (USUARIO), Técnico, Supervisor y Administrador.',
    operationalChecklist: [
      'Asegurar denegación por defecto en toda ruta privada de API y frontend',
      'Bloquear creación de tickets a clientes SIN_PLAN o VENCIDO',
      'Aislar expedientes de empleados y datos fiscales entre cuentas',
    ],
  },
  {
    moduleCode: 'MOD-07',
    title: 'Módulo 07 — Reportes y Control de SLA',
    fileName: '07_Reportes_y_Control_de_SLA_USAE_Helpdesk.docx',
    version: 'v1.0',
    updatedDate: '2026-07-27',
    owner: 'Dirección Técnica & Supervisión',
    status: 'VIGENTE',
    allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR'],
    summary:
      'Reportes operativos por rango de fechas, cliente, plan, técnico, prioridad y equipo; semáforos SLA, promedios y exportación CSV/Excel/PDF autorizada.',
    operationalChecklist: [
      'Aplicar filtros de periodo, departamento, técnico y prioridad SLA',
      'Exportar únicamente datos autorizados según el rol solicitante',
      'Auditar cada descarga o exportación de reporte en audit_logs',
    ],
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  companyName: USAE_CONTACT.company,
  systemName: USAE_CONTACT.systemName,
  timezone: USAE_CONTACT.timezone,
  currency: USAE_CONTACT.currency,
  workStartHour: 9,
  workEndHour: 18,
  saturdayEndHour: 14,
  holidays: ['2026-01-01', '2026-02-02', '2026-03-16', '2026-05-01', '2026-09-16', '2026-11-16', '2026-12-25'],
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 10,
  sessionIdleMinutes: 120,
  policyVersion: USAE_CONTACT.policyVersion,
  prorationPolicy:
    'Los cambios a un plan superior aplican al confirmar el pago del nuevo plan iniciando un nuevo periodo de vigencia; cambios especiales o prorrateos se gestionan por administración bajo revisión contractual.',
  speiBankName: process.env.SPEI_BANK_NAME?.trim() || 'Banco receptor (configurar en Admin/.env)',
  speiAccountHolder: process.env.SPEI_ACCOUNT_HOLDER?.trim() || 'USAE Soluciones Tecnológicas',
  speiClabeMasked: process.env.SPEI_CLABE?.trim()
    ? `****${process.env.SPEI_CLABE.trim().slice(-4)}`
    : 'Pendiente de configurar',
};

export function openDatabase(dbFilePath: string): DatabaseSync {
  const dir = path.dirname(dbFilePath);
  if (dbFilePath !== ':memory:' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(dbFilePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  runMigrations(db);
  return db;
}

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get('001_initial_usae_schema') as { version: string } | undefined;

  if (!applied) {
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS roles (
          code TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          role TEXT NOT NULL,
          department TEXT NOT NULL DEFAULT 'General',
          account_status TEXT NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
          email_verified INTEGER NOT NULL DEFAULT 0,
          email_verified_at TEXT,
          must_change_password INTEGER NOT NULL DEFAULT 0,
          password_changed_at TEXT,
          client_id TEXT,
          employee_id TEXT,
          privacy_accepted_at TEXT,
          terms_accepted_at TEXT,
          accepted_policy_version TEXT,
          accepted_ip TEXT,
          failed_login_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TEXT,
          last_login_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token_hash TEXT NOT NULL UNIQUE,
          csrf_token TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          ip_address TEXT NOT NULL,
          user_agent TEXT NOT NULL DEFAULT '',
          last_activity_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          revoked_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          purpose TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS clients (
          client_id TEXT PRIMARY KEY,
          legal_name TEXT NOT NULL,
          trade_name TEXT NOT NULL,
          person_type TEXT NOT NULL DEFAULT 'Moral',
          industry TEXT NOT NULL DEFAULT 'Servicios',
          website TEXT NOT NULL DEFAULT '',
          account_executive TEXT NOT NULL DEFAULT 'Mariana Ríos',
          commercial_status TEXT NOT NULL DEFAULT 'Activo',
          decision_maker TEXT NOT NULL DEFAULT '',
          decision_maker_email TEXT NOT NULL DEFAULT '',
          decision_maker_phone TEXT NOT NULL DEFAULT '',
          billing_contact TEXT NOT NULL DEFAULT '',
          billing_email TEXT NOT NULL DEFAULT '',
          rfc TEXT NOT NULL DEFAULT '',
          tax_regime TEXT NOT NULL DEFAULT '601 - General de Ley Personas Morales',
          cfdi_use TEXT NOT NULL DEFAULT 'G03 - Gastos en general',
          postal_code TEXT NOT NULL DEFAULT '',
          payment_method TEXT NOT NULL DEFAULT 'PUE',
          plan_code TEXT NOT NULL DEFAULT 'SIN_PLAN',
          plan_status TEXT NOT NULL DEFAULT 'SIN_PLAN',
          contract_start TEXT NOT NULL DEFAULT '',
          contract_end TEXT NOT NULL DEFAULT '',
          legal_checklist_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_profiles (
          employee_id TEXT PRIMARY KEY,
          user_id INTEGER,
          full_name TEXT NOT NULL,
          role_title TEXT NOT NULL,
          rbac_role TEXT NOT NULL,
          department TEXT NOT NULL,
          work_mode TEXT NOT NULL DEFAULT 'REMOTO',
          corporate_email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL DEFAULT '',
          smart_campus_certified INTEGER NOT NULL DEFAULT 0,
          nda_signed INTEGER NOT NULL DEFAULT 0,
          induction_progress TEXT NOT NULL DEFAULT '1/4 módulos',
          status TEXT NOT NULL DEFAULT 'Activo',
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS plans (
          code TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          price_mxn REAL,
          price_label TEXT NOT NULL,
          includes_iva INTEGER NOT NULL DEFAULT 0,
          billing_period TEXT NOT NULL DEFAULT 'MENSUAL',
          min_months INTEGER NOT NULL DEFAULT 1,
          max_equipments INTEGER NOT NULL DEFAULT 5,
          monthly_visits_included INTEGER NOT NULL DEFAULT 0,
          is_24_7 INTEGER NOT NULL DEFAULT 0,
          alternative_price_note TEXT NOT NULL DEFAULT '',
          price_confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
          duration TEXT NOT NULL,
          sla_summary TEXT NOT NULL,
          covered_categories_json TEXT NOT NULL,
          scope_json TEXT NOT NULL,
          contract_terms TEXT NOT NULL,
          cancellation_rule TEXT NOT NULL,
          guarantee_rule TEXT NOT NULL,
          is_published INTEGER NOT NULL DEFAULT 1,
          version INTEGER NOT NULL DEFAULT 1,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          client_id TEXT,
          plan_code TEXT NOT NULL,
          status TEXT NOT NULL,
          starts_at TEXT,
          ends_at TEXT,
          price_version INTEGER NOT NULL DEFAULT 1,
          amount_mxn REAL NOT NULL DEFAULT 0,
          max_equipments INTEGER NOT NULL DEFAULT 0,
          monthly_visits_included INTEGER NOT NULL DEFAULT 0,
          is_24_7 INTEGER NOT NULL DEFAULT 0,
          auto_renew_consent INTEGER NOT NULL DEFAULT 0,
          cancellation_requested_at TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS payments (
          payment_id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          client_id TEXT,
          client_email TEXT NOT NULL,
          client_company TEXT NOT NULL,
          plan_code TEXT NOT NULL,
          amount_mxn REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'MXN',
          period TEXT NOT NULL DEFAULT 'MENSUAL',
          method TEXT NOT NULL,
          status TEXT NOT NULL,
          mp_preference_id TEXT,
          mp_init_point TEXT,
          mp_payment_id TEXT UNIQUE,
          mp_payment_status TEXT,
          mp_status_detail TEXT,
          transfer_reference TEXT,
          transfer_concept TEXT,
          bank_name TEXT,
          clabe TEXT,
          account_holder TEXT,
          approved_by_user_id INTEGER,
          approved_by_email TEXT,
          approved_at TEXT,
          rejection_reason TEXT,
          terms_version_accepted TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS equipments (
          equipment_code TEXT PRIMARY KEY,
          hostname TEXT NOT NULL,
          assigned_user TEXT NOT NULL,
          client_code TEXT NOT NULL,
          brand_model TEXT NOT NULL,
          os_name TEXT NOT NULL,
          architecture TEXT NOT NULL DEFAULT 'x64',
          bios_info TEXT NOT NULL DEFAULT '',
          firmware_version TEXT NOT NULL DEFAULT '',
          secure_boot INTEGER NOT NULL DEFAULT 1,
          processor TEXT NOT NULL DEFAULT '',
          ram_info TEXT NOT NULL DEFAULT '',
          gpu_info TEXT NOT NULL DEFAULT '',
          storage_info TEXT NOT NULL DEFAULT '',
          battery_percent TEXT NOT NULL DEFAULT 'N/A',
          antivirus_status TEXT NOT NULL DEFAULT 'Activo / Actualizado',
          firewall_status TEXT NOT NULL DEFAULT 'Activo',
          uac_status TEXT NOT NULL DEFAULT 'Habilitado',
          vbs_status TEXT NOT NULL DEFAULT 'Habilitada',
          remote_tool TEXT NOT NULL DEFAULT '',
          remote_id TEXT NOT NULL DEFAULT '',
          perfmon_summary TEXT NOT NULL DEFAULT '',
          disk_response_ms REAL NOT NULL DEFAULT 1.5,
          health_status TEXT NOT NULL DEFAULT 'ÓPTIMO',
          last_security_audit TEXT NOT NULL DEFAULT '',
          last_report_date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ticket_sequences (
          year INTEGER PRIMARY KEY,
          last_seq INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sla_policies (
          priority TEXT PRIMARY KEY,
          code TEXT NOT NULL,
          response_minutes INTEGER NOT NULL,
          resolution_minutes INTEGER NOT NULL,
          escalation_target TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          folio TEXT NOT NULL UNIQUE,
          user_id INTEGER,
          requester_name TEXT NOT NULL,
          requester_email TEXT NOT NULL,
          requester_phone TEXT DEFAULT '',
          client_company TEXT NOT NULL,
          client_code TEXT,
          department TEXT NOT NULL,
          category TEXT NOT NULL,
          subcategory TEXT DEFAULT '',
          equipment_code TEXT,
          service_mode TEXT NOT NULL DEFAULT 'REMOTO',
          location TEXT DEFAULT '',
          priority TEXT NOT NULL,
          status TEXT NOT NULL,
          subject TEXT NOT NULL,
          description TEXT NOT NULL,
          assigned_tech TEXT NOT NULL DEFAULT 'Sin asignar',
          assigned_tech_id INTEGER,
          sla_version INTEGER NOT NULL DEFAULT 1,
          sla_plan_code TEXT DEFAULT '',
          sla_is_24_7 INTEGER NOT NULL DEFAULT 0,
          sla_due_response TEXT NOT NULL,
          sla_due_resolution TEXT NOT NULL,
          paused_at TEXT,
          paused_minutes INTEGER NOT NULL DEFAULT 0,
          pause_reason TEXT,
          diagnosis_checklist_json TEXT NOT NULL DEFAULT '{}',
          root_cause TEXT DEFAULT '',
          activities_performed TEXT DEFAULT '',
          solution_details TEXT DEFAULT '',
          recommendations TEXT DEFAULT '',
          solution_time_minutes INTEGER,
          satisfaction_score INTEGER,
          reopen_reason TEXT,
          client_confirmed_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          resolved_at TEXT,
          closed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ticket_comments (
          id TEXT PRIMARY KEY,
          ticket_folio TEXT NOT NULL,
          author TEXT NOT NULL,
          author_email TEXT NOT NULL,
          role TEXT NOT NULL,
          is_internal INTEGER NOT NULL DEFAULT 0,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (ticket_folio) REFERENCES tickets(folio) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ticket_activities (
          id TEXT PRIMARY KEY,
          ticket_folio TEXT NOT NULL,
          actor_name TEXT NOT NULL,
          actor_role TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          description TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL DEFAULT 0,
          result_summary TEXT DEFAULT '',
          next_step TEXT DEFAULT '',
          is_internal INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (ticket_folio) REFERENCES tickets(folio) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ticket_attachments (
          id TEXT PRIMARY KEY,
          ticket_folio TEXT NOT NULL,
          uploaded_by_email TEXT NOT NULL,
          file_name TEXT NOT NULL,
          storage_key TEXT NOT NULL,
          file_size_bytes INTEGER NOT NULL,
          file_type TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'EVIDENCIA',
          drive_file_id TEXT,
          drive_url TEXT,
          is_deleted INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY (ticket_folio) REFERENCES tickets(folio) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ticket_history (
          id TEXT PRIMARY KEY,
          ticket_folio TEXT NOT NULL,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          previous_state TEXT,
          new_state TEXT,
          reason TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (ticket_folio) REFERENCES tickets(folio) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS maintenances (
          id TEXT PRIMARY KEY,
          client_code TEXT NOT NULL,
          client_company TEXT NOT NULL,
          equipment_code TEXT,
          assigned_tech_name TEXT NOT NULL,
          maintenance_type TEXT NOT NULL,
          site_location TEXT NOT NULL,
          scheduled_start TEXT NOT NULL,
          scheduled_end TEXT NOT NULL,
          status TEXT NOT NULL,
          checklist_summary TEXT NOT NULL,
          notes TEXT DEFAULT '',
          cancellation_reason TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS module_docs (
          module_code TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          file_name TEXT NOT NULL,
          version TEXT NOT NULL,
          updated_date TEXT NOT NULL,
          owner TEXT NOT NULL,
          status TEXT NOT NULL,
          allowed_roles_json TEXT NOT NULL,
          summary TEXT NOT NULL,
          operational_checklist_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          actor_email TEXT NOT NULL,
          actor_role TEXT NOT NULL DEFAULT 'SISTEMA',
          event TEXT NOT NULL,
          target_type TEXT DEFAULT '',
          target_id TEXT DEFAULT '',
          description TEXT NOT NULL,
          ip_address TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          recipient_email TEXT NOT NULL,
          channel TEXT NOT NULL,
          event_type TEXT NOT NULL,
          subject TEXT NOT NULL,
          body_preview TEXT NOT NULL,
          email_html TEXT DEFAULT '',
          delivery_status TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          company TEXT NOT NULL DEFAULT '',
          plan_code TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          consent_accepted INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'NUEVA',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        '001_initial_usae_schema',
        new Date().toISOString()
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  seedCoreReferenceTables(db);
}

function seedCoreReferenceTables(db: DatabaseSync): void {
  const now = new Date().toISOString();

  // Roles
  const roleStmt = db.prepare(
    'INSERT OR IGNORE INTO roles (code, label, description) VALUES (?, ?, ?)'
  );
  const roles: [UserRole, string, string][] = [
    ['ADMINISTRADOR', 'Administrador General', 'Control total del sistema, usuarios, catálogo, pagos y auditoría'],
    ['SUPERVISOR', 'Supervisor Operativo', 'Gestión departamental, asignación de ingenieros, escalamiento y reportes'],
    ['TÉCNICO', 'Ingeniero / Técnico TI', 'Atención de tickets asignados, bitácora de actividades, activos y mantenimientos'],
    ['USUARIO', 'Cliente / Usuario Final', 'Consulta de cuenta, contratación de planes, tickets propios y activos propios'],
  ];
  for (const [code, label, description] of roles) {
    roleStmt.run(code, label, description);
  }

  // Departments
  const deptStmt = db.prepare(
    'INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)'
  );
  for (const dept of [
    ['Infraestructura & TI', 'Redes, servidores, hardware, respaldos y monitoreo Perfmon'],
    ['Ciberseguridad', 'Hardening UEFI/Secure Boot, antivirus, firewall y contención P1'],
    ['Desarrollo Web', 'Landing pages, portales corporativos y proyectos web a medida'],
    ['Soporte Remoto N1', 'Atención de primera línea, software y mesa de ayuda'],
    ['Administración & Facturación', 'Pagos, planes, renovaciones, contratos y datos fiscales'],
  ]) {
    deptStmt.run(dept[0], dept[1]);
  }

  // SLA Policies
  const slaStmt = db.prepare(
    'INSERT OR IGNORE INTO sla_policies (priority, code, response_minutes, resolution_minutes, escalation_target, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const policy of Object.values(SLA_POLICIES)) {
    slaStmt.run(
      policy.priority,
      policy.code,
      policy.responseMinutes,
      policy.resolutionMinutes,
      policy.escalationTarget,
      now
    );
  }

  // Catalog Plans (insert if empty)
  const planCount = (db.prepare('SELECT COUNT(*) AS c FROM plans').get() as { c: number }).c;
  if (planCount === 0) {
    const insPlan = db.prepare(`
      INSERT INTO plans (
        code, category, title, price_mxn, price_label, includes_iva, billing_period,
        min_months, max_equipments, monthly_visits_included, is_24_7,
        alternative_price_note, price_confirmed_by_admin, duration, sla_summary,
        covered_categories_json, scope_json, contract_terms, cancellation_rule,
        guarantee_rule, is_published, version, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of DEFAULT_CATALOG_PLANS) {
      insPlan.run(
        p.code,
        p.category,
        p.title,
        p.priceMXN,
        p.priceLabel,
        p.includesIva ? 1 : 0,
        p.billingPeriod,
        p.minMonths,
        p.maxEquipments,
        p.monthlyVisitsIncluded,
        p.is24_7 ? 1 : 0,
        p.alternativePriceNote ?? '',
        p.priceConfirmedByAdmin ? 1 : 0,
        p.duration,
        p.slaSummary,
        JSON.stringify(p.coveredCategories),
        JSON.stringify(p.scope),
        p.contractTerms,
        p.cancellationRule,
        p.guaranteeRule,
        p.isPublished ? 1 : 0,
        p.version,
        now
      );
    }
  }

  // Module Docs 00-07
  const modStmt = db.prepare(`
    INSERT OR IGNORE INTO module_docs (
      module_code, title, file_name, version, updated_date, owner, status,
      allowed_roles_json, summary, operational_checklist_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of DEFAULT_MODULE_DOCS) {
    modStmt.run(
      m.moduleCode,
      m.title,
      m.fileName,
      m.version,
      m.updatedDate,
      m.owner,
      m.status,
      JSON.stringify(m.allowedRoles),
      m.summary,
      JSON.stringify(m.operationalChecklist)
    );
  }

  // Default System Settings
  const setStmt = db.prepare(
    'INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)'
  );
  const settingsMap: Record<string, string> = {
    companyName: DEFAULT_SYSTEM_SETTINGS.companyName,
    systemName: DEFAULT_SYSTEM_SETTINGS.systemName,
    timezone: DEFAULT_SYSTEM_SETTINGS.timezone,
    currency: DEFAULT_SYSTEM_SETTINGS.currency,
    workStartHour: String(DEFAULT_SYSTEM_SETTINGS.workStartHour),
    workEndHour: String(DEFAULT_SYSTEM_SETTINGS.workEndHour),
    saturdayEndHour: String(DEFAULT_SYSTEM_SETTINGS.saturdayEndHour),
    holidays: JSON.stringify(DEFAULT_SYSTEM_SETTINGS.holidays),
    maxUploadMb: String(DEFAULT_SYSTEM_SETTINGS.maxUploadMb),
    sessionIdleMinutes: String(DEFAULT_SYSTEM_SETTINGS.sessionIdleMinutes),
    policyVersion: DEFAULT_SYSTEM_SETTINGS.policyVersion,
    prorationPolicy: DEFAULT_SYSTEM_SETTINGS.prorationPolicy,
    speiBankName: process.env.SPEI_BANK_NAME?.trim() || 'Banco receptor (configurar en Admin/.env)',
    speiAccountHolder: process.env.SPEI_ACCOUNT_HOLDER?.trim() || 'USAE Soluciones Tecnológicas',
    speiClabe: process.env.SPEI_CLABE?.trim() || '',
  };
  for (const [k, v] of Object.entries(settingsMap)) {
    setStmt.run(k, v, now);
  }
}

export interface DemoAccountDescriptor {
  email: string;
  password: string;
  role: UserRole;
  label: string;
  planStateLabel: string;
}

// Development/demo passwords generated dynamically per installation or well-known dev-only values
// NEVER active when NODE_ENV === 'production' unless explicitly allowed by owner.
export const DEV_DEMO_ACCOUNTS: DemoAccountDescriptor[] = [
  {
    email: 'admin@usae.mx',
    password: 'UsaeDemo#2026Admin',
    role: 'ADMINISTRADOR',
    label: 'Carlos Mendoza R. (Admin N3)',
    planStateLabel: 'Personal Interno',
  },
  {
    email: 'mariana.rios@usae.mx',
    password: 'UsaeDemo#2026Sup',
    role: 'SUPERVISOR',
    label: 'Mariana Ríos (Supervisora B2B)',
    planStateLabel: 'Personal Interno',
  },
  {
    email: 'laura.mendez@usae.mx',
    password: 'UsaeDemo#2026Tech',
    role: 'TÉCNICO',
    label: 'Ing. Laura Méndez (Técnico N2)',
    planStateLabel: 'Personal Interno',
  },
  {
    email: 'cliente@usae.mx',
    password: 'UsaeDemo#2026Client',
    role: 'USUARIO',
    label: 'Empresa Demo (Plan Esencial Activo)',
    planStateLabel: 'ACTIVO · INF-ESENCIAL',
  },
  {
    email: 'cpena.pagos@banorte.com',
    password: 'UsaeDemo#2026Corp',
    role: 'USUARIO',
    label: 'Banorte Tech (Plan Corporativo Activo)',
    planStateLabel: 'ACTIVO · INF-CORPORATIVO',
  },
  {
    email: 'nuevo@empresa.mx',
    password: 'UsaeDemo#2026SinPlan',
    role: 'USUARIO',
    label: 'Cliente Nuevo (Sin Plan Activo)',
    planStateLabel: 'SIN_PLAN',
  },
  {
    email: 'vencido@empresa.mx',
    password: 'UsaeDemo#2026Vencido',
    role: 'USUARIO',
    label: 'Cliente Expirado (Plan Vencido)',
    planStateLabel: 'VENCIDO',
  },
];

export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOW_DEMO_SEED === 'true';
  }
  return process.env.ALLOW_DEMO_SEED !== 'false';
}

export function seedDemoDataIfEmpty(db: DatabaseSync): void {
  if (!isDemoModeEnabled()) return;

  const userCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  if (userCount > 0) return;

  const now = new Date().toISOString();
  const futureEnd = new Date(Date.now() + 180 * 86400_000).toISOString();
  const pastStart = new Date(Date.now() - 210 * 86400_000).toISOString();
  const pastExpired = new Date(Date.now() - 10 * 86400_000).toISOString();

  db.exec('BEGIN IMMEDIATE;');
  try {
    // 1. Seed Clients CLI-001..CLI-005
    const insClient = db.prepare(`
      INSERT INTO clients (
        client_id, legal_name, trade_name, person_type, industry, website,
        account_executive, commercial_status, decision_maker, decision_maker_email,
        decision_maker_phone, billing_contact, billing_email, rfc, tax_regime,
        cfdi_use, postal_code, payment_method, plan_code, plan_status,
        contract_start, contract_end, legal_checklist_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of SEED_CLIENTS) {
      insClient.run(
        c.clientId,
        c.legalName,
        c.tradeName,
        c.personType,
        c.industry,
        c.website,
        c.accountExecutive,
        c.commercialStatus,
        c.decisionMaker,
        c.decisionMakerEmail,
        c.decisionMakerPhone,
        c.billingContact,
        c.billingEmail,
        c.rfc,
        c.taxRegime,
        c.cfdiUse,
        c.postalCode,
        c.paymentMethod,
        c.planCode,
        c.planStatus,
        c.contractStart,
        futureEnd.slice(0, 10),
        JSON.stringify(c.legalChecklist),
        now,
        now
      );
    }

    insClient.run(
      'CLI-004',
      'Comercializadora del Valle S.A. de C.V.',
      'Comercializadora del Valle',
      'Moral',
      'Comercio',
      'www.delvalle-ejemplo.mx',
      'Mariana Ríos',
      'Prospecto',
      'Andrea López',
      'nuevo@empresa.mx',
      '5512345678',
      'Andrea López',
      'nuevo@empresa.mx',
      'CDV250101AAA',
      '601 - General de Ley Personas Morales',
      'G03 - Gastos en general',
      '57000',
      'PUE',
      'SIN_PLAN',
      'SIN_PLAN',
      '',
      '',
      JSON.stringify({ csf: false, nda: false, msa: false, sla: false, opinion32D: false }),
      now,
      now
    );

    insClient.run(
      'CLI-005',
      'Consultoría Oriente Integrada S.C.',
      'Consultoría Oriente',
      'Moral',
      'Servicios Profesionales',
      'www.oriente-ejemplo.mx',
      'Mariana Ríos',
      'En Renovación',
      'Roberto Silva',
      'vencido@empresa.mx',
      '5587654321',
      'Roberto Silva',
      'vencido@empresa.mx',
      'COI220303BBB',
      '601 - General de Ley Personas Morales',
      'G03 - Gastos en general',
      '57700',
      'PUE',
      'INF-ESENCIAL',
      'VENCIDO',
      pastStart.slice(0, 10),
      pastExpired.slice(0, 10),
      JSON.stringify({ csf: true, nda: true, msa: true, sla: true, opinion32D: true }),
      now,
      now
    );

    // 2. Seed Users
    const insUser = db.prepare(`
      INSERT INTO users (
        email, password_hash, full_name, phone, role, department,
        account_status, email_verified, email_verified_at, must_change_password,
        client_id, employee_id, privacy_accepted_at, terms_accepted_at,
        accepted_policy_version, accepted_ip, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVA', 1, ?, 0, ?, ?, ?, ?, ?, '127.0.0.1', ?, ?)
    `);

    const userSpecs: {
      email: string;
      pw: string;
      fullName: string;
      phone: string;
      role: UserRole;
      dept: string;
      clientId: string | null;
      employeeId: string | null;
    }[] = [
      {
        email: 'admin@usae.mx',
        pw: 'UsaeDemo#2026Admin',
        fullName: 'Carlos Mendoza R.',
        phone: '+52 55 5496 8308',
        role: 'ADMINISTRADOR',
        dept: 'Infraestructura & TI',
        clientId: null,
        employeeId: 'EMP-001',
      },
      {
        email: 'mariana.rios@usae.mx',
        pw: 'UsaeDemo#2026Sup',
        fullName: 'Mariana Ríos',
        phone: '+52 56 5199 2916',
        role: 'SUPERVISOR',
        dept: 'Administración & Facturación',
        clientId: null,
        employeeId: 'EMP-002',
      },
      {
        email: 'laura.mendez@usae.mx',
        pw: 'UsaeDemo#2026Tech',
        fullName: 'Ing. Laura Méndez',
        phone: '+52 55 5496 8308',
        role: 'TÉCNICO',
        dept: 'Infraestructura & TI',
        clientId: null,
        employeeId: 'EMP-003',
      },
      {
        email: 'cliente@usae.mx',
        pw: 'UsaeDemo#2026Client',
        fullName: 'Luis Torres (Empresa Demo)',
        phone: '+52 55 5496 8308',
        role: 'USUARIO',
        dept: 'Cliente Corporativo',
        clientId: 'CLI-002',
        employeeId: null,
      },
      {
        email: 'cpena.pagos@banorte.com',
        pw: 'UsaeDemo#2026Corp',
        fullName: 'Lic. Claudia Peña',
        phone: '+52 81 8123 4567',
        role: 'USUARIO',
        dept: 'Cliente Corporativo',
        clientId: 'CLI-001',
        employeeId: null,
      },
      {
        email: 'nuevo@empresa.mx',
        pw: 'UsaeDemo#2026SinPlan',
        fullName: 'Andrea López',
        phone: '+52 55 1234 5678',
        role: 'USUARIO',
        dept: 'Cliente Corporativo',
        clientId: 'CLI-004',
        employeeId: null,
      },
      {
        email: 'vencido@empresa.mx',
        pw: 'UsaeDemo#2026Vencido',
        fullName: 'Roberto Silva',
        phone: '+52 55 8765 4321',
        role: 'USUARIO',
        dept: 'Cliente Corporativo',
        clientId: 'CLI-005',
        employeeId: null,
      },
    ];

    const userIdByEmail = new Map<string, number>();
    for (const u of userSpecs) {
      const result = insUser.run(
        u.email,
        hashPassword(u.pw),
        u.fullName,
        u.phone,
        u.role,
        u.dept,
        now,
        u.clientId,
        u.employeeId,
        now,
        now,
        USAE_CONTACT.policyVersion,
        now,
        now
      );
      userIdByEmail.set(u.email, Number(result.lastInsertRowid));
    }

    // 3. Seed Staff Profiles
    const insStaff = db.prepare(`
      INSERT INTO staff_profiles (
        employee_id, user_id, full_name, role_title, rbac_role, department,
        work_mode, corporate_email, phone, smart_campus_certified, nda_signed,
        induction_progress, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of SEED_STAFF) {
      insStaff.run(
        s.employeeId,
        userIdByEmail.get(s.corporateEmail) ?? null,
        s.fullName,
        s.roleTitle,
        s.rbacRole,
        s.department,
        s.workMode,
        s.corporateEmail,
        s.phone,
        s.smartCampusCertified ? 1 : 0,
        s.ndaSigned ? 1 : 0,
        s.inductionProgress,
        s.status,
        now
      );
    }

    // 4. Seed Subscriptions
    const insSub = db.prepare(`
      INSERT INTO subscriptions (
        user_id, client_id, plan_code, status, starts_at, ends_at,
        price_version, amount_mxn, max_equipments, monthly_visits_included,
        is_24_7, auto_renew_consent, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 0, ?, ?, ?)
    `);

    insSub.run(
      userIdByEmail.get('cliente@usae.mx')!,
      'CLI-002',
      'INF-ESENCIAL',
      'ACTIVO',
      now,
      futureEnd,
      2000,
      5,
      0,
      0,
      'Suscripción demo activa (Plan Esencial)',
      now,
      now
    );

    insSub.run(
      userIdByEmail.get('cpena.pagos@banorte.com')!,
      'CLI-001',
      'INF-CORPORATIVO',
      'ACTIVO',
      now,
      futureEnd,
      8500,
      40,
      4,
      1,
      'Suscripción demo activa (Plan Corporativo 24/7)',
      now,
      now
    );

    insSub.run(
      userIdByEmail.get('vencido@empresa.mx')!,
      'CLI-005',
      'INF-ESENCIAL',
      'VENCIDO',
      pastStart,
      pastExpired,
      2000,
      5,
      0,
      0,
      'Suscripción demo expirada para validar bloqueo de creación de tickets',
      pastStart,
      now
    );

    // 5. Seed Payments
    const insPay = db.prepare(`
      INSERT INTO payments (
        payment_id, user_id, client_id, client_email, client_company, plan_code,
        amount_mxn, currency, period, method, status, mp_payment_id, mp_payment_status,
        terms_version_accepted, approved_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'MXN', 'MENSUAL', 'MERCADO_PAGO', 'APROBADO', ?, 'approved', ?, ?, ?, ?)
    `);
    insPay.run(
      'PAY-2026-0001',
      userIdByEmail.get('cpena.pagos@banorte.com')!,
      'CLI-001',
      'cpena.pagos@banorte.com',
      'Banorte Tech',
      'INF-CORPORATIVO',
      8500,
      'DEMO-MP-98412031',
      USAE_CONTACT.policyVersion,
      now,
      now,
      now
    );
    insPay.run(
      'PAY-2026-0002',
      userIdByEmail.get('cliente@usae.mx')!,
      'CLI-002',
      'cliente@usae.mx',
      'Empresa Demo',
      'INF-ESENCIAL',
      2000,
      'DEMO-MP-98421004',
      USAE_CONTACT.policyVersion,
      now,
      now,
      now
    );

    // 6. Seed Equipments EQP-001..EQP-005
    const insEqp = db.prepare(`
      INSERT INTO equipments (
        equipment_code, hostname, assigned_user, client_code, brand_model,
        os_name, architecture, bios_info, firmware_version, secure_boot,
        processor, ram_info, gpu_info, storage_info, battery_percent,
        antivirus_status, firewall_status, uac_status, vbs_status,
        remote_tool, remote_id, perfmon_summary, disk_response_ms,
        health_status, last_security_audit, last_report_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const eq of SEED_EQUIPMENTS) {
      insEqp.run(
        eq.equipmentCode,
        eq.hostname,
        eq.assignedUser,
        eq.clientCode,
        eq.brandModel,
        eq.osName,
        eq.architecture,
        eq.biosInfo,
        eq.biosInfo.split('·')[0].trim(),
        eq.secureBoot ? 1 : 0,
        eq.processor,
        eq.ramInfo,
        eq.gpuInfo,
        eq.storageInfo,
        eq.batteryPercent,
        eq.antivirusStatus,
        eq.firewallStatus,
        eq.uacStatus,
        eq.vbsStatus,
        'AnyDesk / SSH',
        `USAE-${eq.equipmentCode}`,
        eq.perfmonSummary,
        eq.diskResponseMs,
        eq.healthStatus,
        eq.lastReportDate,
        eq.lastReportDate
      );
    }

    // 7. Seed Tickets & Sequence
    const insTkt = db.prepare(`
      INSERT INTO tickets (
        folio, user_id, requester_name, requester_email, requester_phone,
        client_company, client_code, department, category, equipment_code,
        service_mode, priority, status, subject, description, assigned_tech,
        assigned_tech_id, sla_version, sla_plan_code, sla_is_24_7,
        sla_due_response, sla_due_resolution, solution_details, satisfaction_score,
        created_at, updated_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REMOTO', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insComm = db.prepare(`
      INSERT INTO ticket_comments (id, ticket_folio, author, author_email, role, is_internal, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insHist = db.prepare(`
      INSERT INTO ticket_history (id, ticket_folio, actor, action, previous_state, new_state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insAct = db.prepare(`
      INSERT INTO ticket_activities (
        id, ticket_folio, actor_name, actor_role, activity_type, description,
        duration_minutes, result_summary, next_step, is_internal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const lauraId = userIdByEmail.get('laura.mendez@usae.mx')!;
    const adminId = userIdByEmail.get('admin@usae.mx')!;

    for (const t of SEED_TICKETS) {
      const ownerId =
        t.clientCode === 'CLI-002'
          ? userIdByEmail.get('cliente@usae.mx')!
          : t.clientCode === 'CLI-001'
            ? userIdByEmail.get('cpena.pagos@banorte.com')!
            : null;
      const techId = t.assignedTech.includes('Laura')
        ? lauraId
        : t.assignedTech.includes('Carlos')
          ? adminId
          : null;

      insTkt.run(
        t.folio,
        ownerId,
        t.requesterName,
        t.requesterEmail,
        t.requesterPhone ?? '',
        t.clientCompany,
        t.clientCode ?? null,
        t.department,
        t.category,
        t.equipmentCode ?? null,
        t.priority,
        t.status,
        t.subject,
        t.description,
        t.assignedTech,
        techId,
        t.clientCode === 'CLI-001' ? 'INF-CORPORATIVO' : 'INF-ESENCIAL',
        t.clientCode === 'CLI-001' ? 1 : 0,
        t.slaDueResponse,
        t.slaDueResolution,
        t.solutionDetails ?? '',
        t.satisfactionScore ?? null,
        t.createdAt,
        t.updatedAt,
        t.resolvedAt ?? null
      );

      for (const c of t.comments) {
        insComm.run(
          c.id,
          t.folio,
          c.author,
          c.isInternal ? 'admin@usae.mx' : t.requesterEmail,
          c.role,
          c.isInternal ? 1 : 0,
          c.message,
          c.createdAt
        );
      }

      for (const h of t.history) {
        insHist.run(
          h.id,
          t.folio,
          h.actor,
          h.action,
          h.previousState ?? null,
          h.newState ?? null,
          h.createdAt
        );
      }

      insAct.run(
        `act-${t.folio}-1`,
        t.folio,
        t.assignedTech !== 'Sin asignar' ? t.assignedTech : 'Mesa de Ayuda USAE',
        'TÉCNICO',
        'DIAGNÓSTICO',
        'Validación inicial de expediente y métricas del activo vinculado.',
        20,
        'Verificación preliminar completada.',
        'Continuar seguimiento conforme a matriz SLA.',
        0,
        t.createdAt
      );
    }

    // Add a historical resolved ticket for CLI-005 (VENCIDO) so Acceptance Test #9 can verify history access
    insTkt.run(
      'USAE-2026-000006',
      userIdByEmail.get('vencido@empresa.mx')!,
      'Roberto Silva',
      'vencido@empresa.mx',
      '+52 55 8765 4321',
      'Consultoría Oriente',
      'CLI-005',
      'Soporte Remoto N1',
      'Software y Controladores',
      null,
      'MEDIA',
      'CERRADO',
      'Actualización de suite ofimática y respaldo previo a vencimiento',
      'Ticket histórico cerrado durante periodo de vigencia anterior del plan Esencial.',
      'Ing. Laura Méndez (N2)',
      lauraId,
      'INF-ESENCIAL',
      0,
      pastStart,
      pastStart,
      'Actualización completada y confirmada por el usuario.',
      5,
      pastStart,
      pastExpired,
      pastExpired
    );

    db.prepare('INSERT OR REPLACE INTO ticket_sequences (year, last_seq) VALUES (2026, 6)').run();

    // 8. Seed Maintenances (Module 05)
    const insMaint = db.prepare(`
      INSERT INTO maintenances (
        id, client_code, client_company, equipment_code, assigned_tech_name,
        maintenance_type, site_location, scheduled_start, scheduled_end,
        status, checklist_summary, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const nextWeek = new Date(Date.now() + 5 * 86400_000).toISOString();
    const nextWeekEnd = new Date(Date.now() + 5 * 86400_000 + 2 * 3600_000).toISOString();
    insMaint.run(
      'MNT-2026-001',
      'CLI-002',
      'Empresa Demo',
      'EQP-003',
      'Ing. Laura Méndez (N2)',
      'PREVENTIVO',
      'Sede Cd. Nezahualcóyotl / Remoto',
      nextWeek,
      nextWeekEnd,
      'PROGRAMADO',
      'Limpieza lógica, actualización de controladores PCI, revisión de antivirus y disco.',
      'Visita preventiva mensual conforme a Plan Esencial.',
      now,
      now
    );
    insMaint.run(
      'MNT-2026-002',
      'CLI-001',
      'Banorte Tech',
      'EQP-004',
      'Carlos Mendoza R. (EMP-001)',
      'AUDITORIA_SEGURIDAD',
      'Sede Corporativa Monterrey / Remoto',
      nextWeek,
      nextWeekEnd,
      'CONFIRMADO',
      'Conversión UEFI/Secure Boot, habilitación Firewall/UAC y depuración de USB no autorizados.',
      'Atención prioritaria derivada de hallazgo crítico en EQP-004.',
      now,
      now
    );

    // 9. Seed Audit Logs
    const insAud = db.prepare(`
      INSERT INTO audit_logs (id, actor_email, actor_role, event, target_type, target_id, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insAud.run(
      'aud-seed-1',
      'admin@usae.mx',
      'ADMINISTRADOR',
      'SYSTEM_DEMO_SEEDED',
      'DATABASE',
      '001',
      'Inicialización de datos de demostración USAE Helpdesk (no usar credenciales demo en producción).',
      '127.0.0.1',
      now
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function bootstrapProductionAdminIfConfigured(db: DatabaseSync): boolean {
  const userCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  if (userCount > 0) return false;

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Administrador USAE';
  if (!email || !password) return false;

  const pwError = validatePasswordStrength(password);
  if (pwError) {
    console.warn(`[USAE] ADMIN_BOOTSTRAP_PASSWORD rechazada: ${pwError}`);
    return false;
  }

  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const userRes = db
      .prepare(`
        INSERT INTO users (
          email, password_hash, full_name, phone, role, department, account_status,
          email_verified, must_change_password, client_id, employee_id,
          privacy_accepted_at, terms_accepted_at, accepted_policy_version,
          accepted_ip, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ADMINISTRADOR', 'Infraestructura & TI', 'ACTIVA', 1, 0, NULL, 'EMP-001', ?, ?, ?, '127.0.0.1', ?, ?)
      `)
      .run(
        email,
        hashPassword(password),
        fullName,
        USAE_CONTACT.phones[0],
        now,
        now,
        USAE_CONTACT.policyVersion,
        now,
        now
      );

    db.prepare(`
      INSERT OR IGNORE INTO staff_profiles (
        employee_id, user_id, full_name, role_title, rbac_role, department,
        work_mode, corporate_email, phone, smart_campus_certified, nda_signed,
        induction_progress, status, updated_at
      ) VALUES (?, ?, ?, ?, 'ADMINISTRADOR', 'Infraestructura & TI', 'HÍBRIDO', ?, ?, 1, 1, '4/4 módulos', 'Activo', ?)
    `).run(
      'EMP-001',
      Number(userRes.lastInsertRowid),
      fullName,
      'Administrador General',
      email,
      USAE_CONTACT.phones[0],
      now
    );

    db.prepare(`
      INSERT INTO audit_logs (id, actor_email, actor_role, event, target_type, target_id, description, ip_address, created_at)
      VALUES (?, ?, 'ADMINISTRADOR', 'PRODUCTION_ADMIN_BOOTSTRAPPED', 'USER', 'EMP-001', ?, '127.0.0.1', ?)
    `).run(
      `aud-boot-${Date.now()}`,
      email,
      'Cuenta inicial de administrador creada mediante variables de entorno de producción.',
      now
    );

    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function generateAtomicFolio(db: DatabaseSync, year?: number): string {
  const targetYear = year ?? new Date().getFullYear();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const seqRow = db
      .prepare('SELECT last_seq FROM ticket_sequences WHERE year = ?')
      .get(targetYear) as { last_seq: number } | undefined;

    let currentSeq = seqRow ? Number(seqRow.last_seq) : 0;

    // Also inspect max existing folio for the year so sequence never lags behind imported rows
    const prefix = `USAE-${targetYear}-`;
    const maxRow = db
      .prepare("SELECT folio FROM tickets WHERE folio LIKE ? ORDER BY folio DESC LIMIT 1")
      .get(`${prefix}%`) as { folio: string } | undefined;

    if (maxRow?.folio) {
      const num = Number.parseInt(maxRow.folio.slice(prefix.length), 10);
      if (Number.isFinite(num) && num > currentSeq) {
        currentSeq = num;
      }
    }

    const nextSeq = currentSeq + 1;
    db.prepare(
      'INSERT INTO ticket_sequences (year, last_seq) VALUES (?, ?) ON CONFLICT(year) DO UPDATE SET last_seq = excluded.last_seq'
    ).run(targetYear, nextSeq);

    db.exec('COMMIT;');
    return `${prefix}${String(nextSeq).padStart(6, '0')}`;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function expireOverdueSubscriptions(db: DatabaseSync): number {
  const now = new Date().toISOString();
  const overdue = db
    .prepare("SELECT id, user_id, client_id, plan_code FROM subscriptions WHERE status = 'ACTIVO' AND ends_at IS NOT NULL AND ends_at <= ?")
    .all(now) as { id: number; user_id: number; client_id: string | null; plan_code: string }[];

  if (overdue.length === 0) return 0;

  db.exec('BEGIN IMMEDIATE;');
  try {
    const updSub = db.prepare("UPDATE subscriptions SET status = 'VENCIDO', updated_at = ? WHERE id = ?");
    const updClient = db.prepare("UPDATE clients SET plan_status = 'VENCIDO', updated_at = ? WHERE client_id = ?");
    const insNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, recipient_email, channel, event_type, subject, body_preview, delivery_status, is_read, created_at)
      VALUES (?, ?, ?, 'PORTAL', 'SUBSCRIPTION_EXPIRED', ?, ?, 'LOCAL_PORTAL', 0, ?)
    `);
    const getUser = db.prepare('SELECT email FROM users WHERE id = ?');

    for (const sub of overdue) {
      updSub.run(now, sub.id);
      if (sub.client_id) {
        updClient.run(now, sub.client_id);
      }
      const user = getUser.get(sub.user_id) as { email: string } | undefined;
      if (user) {
        insNotif.run(
          `notif-exp-${sub.id}-${Date.now()}`,
          sub.user_id,
          user.email,
          `Tu plan ${sub.plan_code} ha vencido`,
          'Tu periodo contratado finalizó. Conservas acceso a tu historial, pero debes renovar para abrir nuevos tickets.',
          now
        );
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  return overdue.length;
}

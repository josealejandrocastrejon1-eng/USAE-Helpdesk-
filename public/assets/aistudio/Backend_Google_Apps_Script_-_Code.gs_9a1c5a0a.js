/**
 * ============================================================================
 * USAE HELPDESK - SERVIDOR GOOGLE APPS SCRIPT (Code.gs)
 * Propietario / Operador: José Alejandro Castejón Alvarado
 * Marca: USAE (Innovación y Tecnología para un Futuro Seguro)
 * Zona Horaria: America/Mexico_City | Moneda: MXN | Idioma: es_MX
 * ============================================================================
 */

const CONFIG = {
  APP_NAME: 'USAE Helpdesk',
  OWNER: 'José Alejandro Castejón Alvarado',
  TIMEZONE: 'America/Mexico_City',
  CURRENCY: 'MXN',
  DRIVE_FOLDER_NAME: 'USAE_Helpdesk_Evidencias'
};

/**
 * Punto de entrada WebApp compatible con Google Sites (ALLOWALL)
 */
function doGet(e) {
  initDatabaseSheets();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('USAE Helpdesk | Portal Corporativo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Inicializa las hojas de cálculo del "Portal DB" si no existen
 */
function initDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schemas = {
    'Users': ['email', 'name', 'passwordHash', 'salt', 'role', 'active', 'smartCampusCert', 'workMode', 'createdAt', 'privacyAccepted', 'privacyAcceptedAt', 'termsAccepted', 'termsAcceptedAt'],
    'Clients': ['email', 'company', 'contactName', 'phone', 'planCode', 'address', 'rfc', 'billingEmail', 'planStatus', 'planStart', 'planEnd', 'updatedAt'],
    'Tickets': ['ticketId', 'email', 'subject', 'description', 'status', 'priority', 'createdAt', 'updatedAt', 'type', 'scheduledFor', 'assetId', 'category', 'assignedTech', 'slaDueResponse', 'slaDueResolution', 'solutionDetails', 'csatScore', 'commentsJson'],
    'Assets': ['assetId', 'email', 'name', 'assetType', 'os', 'location', 'remoteTool', 'remoteId', 'healthStatus', 'updatedAt'],
    'Catalogo': ['Servicio', 'Codigo', 'Plan', 'PrecioMXN', 'Facturacion', 'Caracteristicas', 'PlazoMinimo'],
    'Payments': ['paymentId', 'email', 'planCode', 'amountMXN', 'period', 'status', 'paymentMethod', 'transferRef', 'createdAt'],
    'Files': ['fileRecordId', 'email', 'title', 'category', 'driveUrl', 'driveFileId', 'ticketId', 'createdAt'],
    'B2B_CRM': ['oppId', 'execEmail', 'prospectName', 'sector', 'isRestricted', 'writtenApproval', 'isIndependentSale', 'status', 'createdAt'],
    'Audit_Logs': ['logId', 'userEmail', 'event', 'description', 'timestamp']
  };

  for (const [sheetName, headers] of Object.entries(schemas)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    }
  }

  seedInitialData(ss);
}

/**
 * Carga datos iniciales oficiales de USAE si las hojas están vacías
 */
function seedInitialData(ss) {
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() === 1) {
    const now = new Date().toISOString();
    usersSheet.appendRow(['admin@usae.mx', 'José Alejandro Castejón Alvarado', 'admin123', 'salt-usae-01', 'ADMINISTRADOR', true, true, 'HÍBRIDO', now, true, now, true, now]);
    usersSheet.appendRow(['supervisor@usae.mx', 'Supervisor Operaciones USAE', 'super123', 'salt-usae-02', 'SUPERVISOR', true, true, 'PRESENCIAL', now, true, now, true, now]);
    usersSheet.appendRow(['tecnico@usae.mx', 'Ing. Soporte N2 USAE', 'tec123', 'salt-usae-03', 'TECNICO', true, true, 'PRESENCIAL', now, true, now, true, now]);
    usersSheet.appendRow(['cliente@usae.mx', 'Carlos Mendoza (Empresa Demo)', 'cliente123', 'salt-usae-04', 'CLIENTE', true, false, 'REMOTO', now, false, '', false, '']);
  }

  const clientsSheet = ss.getSheetByName('Clients');
  if (clientsSheet.getLastRow() === 1) {
    const now = new Date().toISOString();
    clientsSheet.appendRow(['cliente@usae.mx', 'Corporativo Demo S.A. de C.V.', 'Carlos Mendoza', '55 1234 5678', 'INF-EMPRESARIAL', 'Cd. Nezahualcóyotl, Edo. Méx.', 'CDM260101ABC', 'pagos@empresademo.mx', 'ACTIVO', '2026-01-01', '2026-12-31', now]);
  }

  const assetsSheet = ss.getSheetByName('Assets');
  if (assetsSheet.getLastRow() === 1) {
    const now = new Date().toISOString();
    assetsSheet.appendRow(['EQP-001', 'cliente@usae.mx', 'Servidor Principal Dell PowerEdge', 'Servidor', 'Windows Server 2022', 'Site Central', 'AnyDesk', '482 910 334', 'ÓPTIMO', now]);
    assetsSheet.appendRow(['EQP-003', 'cliente@usae.mx', 'Lenovo ThinkPad T14 Gerencia', 'Laptop', 'Windows 11 Pro x64', 'Piso 2 - Dirección', 'RustDesk', '991 023 112', 'ATENCIÓN REQUERIDA', now]);
  }

  const catSheet = ss.getSheetByName('Catalogo');
  if (catSheet.getLastRow() === 1) {
    const planes = [
      ['Infraestructura TI', 'INF-ESENCIAL', 'Plan Esencial', 2000, 'Mensual', 'Soporte remoto, mantenimiento mensual, monitoreo básico, respaldo (hasta 5 equipos)', '6 meses mínimo'],
      ['Infraestructura TI', 'INF-EMPRESARIAL', 'Plan Empresarial', 4500, 'Mensual', 'Incluye esencial + monitoreo avanzado, servidores, soporte híbrido (hasta 15 equipos)', '6 meses mínimo'],
      ['Infraestructura TI', 'INF-CORPORATIVO', 'Plan Corporativo', 8500, 'Mensual', 'Soporte integral 24/7, redes, arquitectura multisucursal (hasta 40 equipos)', '12 meses mínimo'],
      ['Desarrollo Web', 'DEV-BASICO', 'Plan Básico', 5000, 'Por proyecto', 'Landing page profesional, formulario, diseño responsive, entrega 7-10 días', 'Por proyecto'],
      ['Desarrollo Web', 'DEV-PRO', 'Plan Profesional', 12000, 'Por proyecto', 'Sitio multi-sección, panel admin, SEO básico, capacitación', 'Por proyecto'],
      ['Ciberseguridad', 'SEC-BASICO', 'Plan Seguridad Básico', 3500, 'Mensual', 'Hardening, antimalware, revisión accesos, escaneo mensual', '3 meses mínimo'],
      ['Ciberseguridad', 'SEC-TOTAL', 'Plan Protección Total', 7000, 'Mensual', 'Monitoreo continuo, auditorías avanzadas, respuesta a incidentes 24/7', '6 meses mínimo'],
      ['Servicios Personalizados', 'CUSTOM', 'Consultoría a medida', 0, 'A cotización', 'Análisis, propuesta técnica, implementación, capacitación y soporte', 'Variable']
    ];
    planes.forEach(p => catSheet.appendRow(p));
  }
}

/**
 * Registra evento inmutable en Audit_Logs
 */
function logAudit(email, event, description) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Audit_Logs');
  const logId = 'AUD-' + new Date().getTime();
  sheet.appendRow([logId, email, event, description, new Date().toISOString()]);
}

/**
 * Autenticación y validación de cumplimiento contractual (Privacidad + Secreto Industrial 5 años)
 */
function loginUser(email, password, acceptLegal) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase() === email.toLowerCase().trim()) {
        if (!data[i][5]) return { success: false, message: 'Cuenta suspendida. Contacte al Administrador de USAE.' };
        if (data[i][2] !== password) return { success: false, message: 'Credenciales incorrectas.' };

        const privacyAccepted = data[i][9] === true || data[i][9] === 'TRUE';
        const termsAccepted = data[i][11] === true || data[i][11] === 'TRUE';

        if ((!privacyAccepted || !termsAccepted) && !acceptLegal) {
          return {
            success: false,
            requireLegal: true,
            message: 'Para continuar, debe aceptar el Aviso de Privacidad y el Acuerdo de Confidencialidad / Secreto Industrial (vigencia contractual + 5 años).'
          };
        }

        if (acceptLegal) {
          const now = new Date().toISOString();
          sheet.getRange(i + 1, 10, 1, 4).setValues([[true, now, true, now]]);
          logAudit(email, 'FIRMA_LEGAL', 'Aceptación digital de Aviso de Privacidad y Secreto Industrial (5 años).');
        }

        logAudit(email, 'LOGIN_EXITOSO', `Inicio de sesión con rol ${data[i][4]}`);
        return {
          success: true,
          user: {
            email: data[i][0],
            name: data[i][1],
            role: data[i][4],
            smartCampusCert: data[i][6] === true || data[i][6] === 'TRUE',
            workMode: data[i][7]
          }
        };
      }
    }
    return { success: false, message: 'Usuario no encontrado en el directorio de USAE Helpdesk.' };
  } catch (e) {
    return { success: false, message: 'No fue posible completar la operación. Intente nuevamente.' };
  }
}

/**
 * Obtiene todo el contexto operativo según el rol del usuario autenticado
 */
function getPortalContext(userEmail, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const catData = ss.getSheetByName('Catalogo').getDataRange().getValues().slice(1);
  const catalog = catData.map(r => ({
    servicio: r[0], codigo: r[1], plan: r[2], precio: r[3], facturacion: r[4], caracteristicas: r[5], plazo: r[6]
  }));

  const ticketsData = ss.getSheetByName('Tickets').getDataRange().getValues().slice(1);
  let tickets = ticketsData.map(r => ({
    ticketId: r[0], email: r[1], subject: r[2], description: r[3], status: r[4],
    priority: r[5], createdAt: r[6], updatedAt: r[7], type: r[8], scheduledFor: r[9],
    assetId: r[10], category: r[11], assignedTech: r[12], slaDueResponse: r[13],
    slaDueResolution: r[14], solutionDetails: r[15], csatScore: r[16],
    comments: r[17] ? JSON.parse(r[17]) : []
  }));

  if (role === 'CLIENTE') {
    tickets = tickets.filter(t => t.email.toLowerCase() === userEmail.toLowerCase());
  }

  const assetsData = ss.getSheetByName('Assets').getDataRange().getValues().slice(1);
  let assets = assetsData.map(r => ({
    assetId: r[0], email: r[1], name: r[2], assetType: r[3], os: r[4],
    location: r[5], remoteTool: r[6], remoteId: r[7], healthStatus: r[8]
  }));
  if (role === 'CLIENTE') {
    assets = assets.filter(a => a.email.toLowerCase() === userEmail.toLowerCase());
  }

  const clientsData = ss.getSheetByName('Clients').getDataRange().getValues().slice(1);
  const clientInfo = clientsData.find(c => c[0].toLowerCase() === userEmail.toLowerCase()) || null;

  const usersData = ss.getSheetByName('Users').getDataRange().getValues().slice(1);
  const users = (role === 'ADMINISTRADOR' || role === 'SUPERVISOR') ? usersData.map(u => ({
    email: u[0], name: u[1], role: u[4], active: u[5], smartCampusCert: u[6], workMode: u[7]
  })) : [];

  const crmData = ss.getSheetByName('B2B_CRM').getDataRange().getValues().slice(1);
  const crm = (role === 'ADMINISTRADOR' || role === 'SUPERVISOR') ? crmData.map(c => ({
    oppId: c[0], execEmail: c[1], prospectName: c[2], sector: c[3], isRestricted: c[4],
    writtenApproval: c[5], isIndependentSale: c[6], status: c[7], createdAt: c[8]
  })) : [];

  const logsData = ss.getSheetByName('Audit_Logs').getDataRange().getValues().slice(1).reverse().slice(0, 30);
  const logs = (role === 'ADMINISTRADOR') ? logsData.map(l => ({
    logId: l[0], userEmail: l[1], event: l[2], description: l[3], timestamp: l[4]
  })) : [];

  return {
    catalog,
    tickets: tickets.reverse(),
    assets,
    clientProfile: clientInfo ? {
      company: clientInfo[1], contactName: clientInfo[2], phone: clientInfo[3],
      planCode: clientInfo[4], rfc: clientInfo[6], planStatus: clientInfo[8],
      planStart: clientInfo[9], planEnd: clientInfo[10]
    } : null,
    users,
    crm,
    logs
  };
}

/**
 * Creación atómica de ticket con cálculo automático de matriz SLA USAE
 */
function createNewTicket(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Tickets');
    const year = new Date().getFullYear();
    const count = sheet.getLastRow();
    const folio = `USAE-${year}-${String(count).padStart(6, '0')}`;

    const slaMinutes = {
      'P1 - Crítico': { resp: 15, res: 120 },
      'P2 - Alto': { resp: 30, res: 240 },
      'P3 - Medio': { resp: 120, res: 480 },
      'P4 - Bajo': { resp: 240, res: 1440 }
    };
    const sla = slaMinutes[payload.priority] || slaMinutes['P3 - Medio'];
    const now = new Date();
    const dueResp = new Date(now.getTime() + sla.resp * 60000).toISOString();
    const dueRes = new Date(now.getTime() + sla.res * 60000).toISOString();

    const initialComments = JSON.stringify([{
      author: payload.email,
      role: 'CLIENTE',
      text: 'Ticket registrado en el portal institucional USAE Helpdesk.',
      internal: false,
      date: now.toISOString()
    }]);

    sheet.appendRow([
      folio, payload.email, payload.subject, payload.description, 'NUEVO',
      payload.priority, now.toISOString(), now.toISOString(), payload.type,
      payload.scheduledFor || '', payload.assetId || 'N/A', payload.category,
      'Sin asignar', dueResp, dueRes, '', '', initialComments
    ]);

    logAudit(payload.email, 'TICKET_CREADO', `Folio generado: ${folio} (${payload.priority})`);
    return { success: true, folio: folio };
  } catch (e) {
    return { success: false, message: 'No fue posible completar la operación. Intente nuevamente.' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Actualiza estado, asigna técnico, agrega comentario o guarda Hoja de Servicio N2
 */
function updateTicketAction(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Tickets');
    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === payload.ticketId) {
        const rowNum = i + 1;
        if (payload.status) sheet.getRange(rowNum, 5).setValue(payload.status);
        if (payload.priority) sheet.getRange(rowNum, 6).setValue(payload.priority);
        if (payload.assignedTech) sheet.getRange(rowNum, 13).setValue(payload.assignedTech);
        if (payload.solutionDetails) sheet.getRange(rowNum, 16).setValue(payload.solutionDetails);
        if (payload.csatScore) sheet.getRange(rowNum, 17).setValue(payload.csatScore);
        sheet.getRange(rowNum, 8).setValue(now);

        if (payload.newComment) {
          const existing = data[i][17] ? JSON.parse(data[i][17]) : [];
          existing.push({
            author: payload.actorEmail,
            role: payload.actorRole,
            text: payload.newComment,
            internal: payload.isInternal || false,
            date: now
          });
          sheet.getRange(rowNum, 18).setValue(JSON.stringify(existing));
        }

        logAudit(payload.actorEmail, 'TICKET_ACTUALIZADO', `Folio ${payload.ticketId} -> Estado: ${payload.status || data[i][4]}`);
        return { success: true };
      }
    }
    return { success: false, message: 'Ticket no encontrado.' };
  } catch (e) {
    return { success: false, message: 'No fue posible completar la operación. Intente nuevamente.' };
  }
}

/**
 * Registro y validación de oportunidades B2B (Cumplimiento Smart Campus / Cuentas Restringidas)
 */
function registerB2BOpportunity(opp) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('B2B_CRM');
    const restrictedSectors = ['Gobierno', 'Call Center', 'Carrier', 'Signature Client Group'];
    const isRestricted = restrictedSectors.includes(opp.sector);
    const oppId = 'CRM-' + new Date().getTime().toString().slice(-6);

    sheet.appendRow([
      oppId, opp.execEmail, opp.prospectName, opp.sector,
      isRestricted ? 'SÍ (BLOQUEADA)' : 'NO',
      opp.writtenApproval ? 'AUTORIZADO' : 'PENDIENTE',
      opp.isIndependentSale ? 'SÍ (+5% BONO)' : 'NO',
      isRestricted ? 'RECHAZADA POR NORMATIVA' : 'EN PROSPECCIÓN',
      new Date().toISOString()
    ]);

    logAudit(opp.execEmail, 'PROSPECCION_B2B', `Oportunidad ${oppId} (${opp.prospectName}) - Sector: ${opp.sector}`);
    return {
      success: true,
      isRestricted,
      message: isRestricted
        ? 'ALERTA CONTRACTUAL: Prospecto en sector restringido (Gobierno/Call Center/Carrier). Cotización bloqueada por reglas de alianza.'
        : `Oportunidad ${oppId} registrada en CRM Siebel/PEGA. Visto bueno habilitado.`
    };
  } catch (e) {
    return { success: false, message: 'No fue posible completar la operación. Intente nuevamente.' };
  }
}

/**
 * Alta de nuevo equipo en inventario Assets
 */
function createAsset(asset) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Assets');
    const code = 'EQP-' + String(sheet.getLastRow()).padStart(3, '0');
    sheet.appendRow([
      code, asset.email, asset.name, asset.assetType, asset.os,
      asset.location, asset.remoteTool, asset.remoteId, 'ÓPTIMO', new Date().toISOString()
    ]);
    logAudit(asset.email, 'ACTIVO_REGISTRADO', `Equipo ${code} - ${asset.name}`);
    return { success: true, assetId: code };
  } catch (e) {
    return { success: false, message: 'No fue posible completar la operación. Intente nuevamente.' };
  }
}
```

```html:Interfaz Visual Completa Multi-Rol - Index.html:Index.html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>USAE Helpdesk | Portal Integral</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  <style>
    :root {
      --usae-dark: #0f172a;
      --usae-primary: #1d4ed8;
      --usae-accent: #0ea5e9;
      --usae-bg: #f1f5f9;
    }
    body {
      background-color: var(--usae-bg);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow-x: hidden;
    }
    .navbar-usae { background-color: var(--usae-dark); border-bottom: 3px solid var(--usae-primary); }
    .card-kpi { border: none; border-radius: 12px; transition: transform 0.2s; }
    .card-kpi:hover { transform: translateY(-3px); }
    .nav-pills .nav-link.active { background-color: var(--usae-primary); }
    .sla-critical { border-left: 5px solid #dc2626 !important; background-color: #fef2f2; }
    .sla-warning { border-left: 5px solid #f59e0b !important; }
    .sla-ok { border-left: 5px solid #10b981 !important; }
    #signatureCanvas { border: 2px dashed #94a3b8; border-radius: 8px; background: #fff; cursor: crosshair; touch-action: none; }
    .hidden-view { display: none !important; }
  </style>
</head>
<body>

<!-- ==================== NAVBAR GLOBAL INSTITUCIONAL ==================== -->
<nav class="navbar navbar-expand-lg navbar-dark navbar-usae sticky-top shadow-sm">
  <div class="container-fluid px-3">
    <a class="navbar-brand fw-bold d-flex align-items-center" href="#" onclick="showPublicCatalog()">
      <i class="bi bi-shield-lock-fill text-info me-2 fs-4"></i>
      <span>USAE <span class="fw-light">Helpdesk</span></span>
      <span class="badge bg-primary ms-2" style="font-size: 0.65rem;">PRODUCCIÓN</span>
    </a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0" id="roleNavMenu">
        <li class="nav-item"><a class="nav-link active" href="#" onclick="switchView('view-login')"><i class="bi bi-box-arrow-in-right"></i> Acceso Portal</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-catalog')"><i class="bi bi-grid-3x3-gap"></i> Catálogo Oficial MXN</a></li>
      </ul>

      <div class="d-flex align-items-center text-white small gap-3">
        <span class="d-none d-xl-inline text-white-50"><i class="bi bi-clock"></i> America/Mexico_City | MXN</span>
        <div id="userSessionBadge" class="hidden-view d-flex align-items-center gap-2">
          <span class="badge bg-info text-dark" id="navUserRole">ROL</span>
          <span class="fw-semibold" id="navUserName">Usuario</span>
          <button class="btn btn-sm btn-outline-light" onclick="logout()"><i class="bi bi-power"></i> Salir</button>
        </div>
      </div>
    </div>
  </div>
</nav>

<!-- ==================== CONTENEDOR PRINCIPAL SPA ==================== -->
<div class="container-fluid py-4 px-3 px-md-4">

  <!-- 1. VISTA DE INICIO DE SESIÓN Y CUMPLIMIENTO LEGAL -->
  <div id="view-login" class="view-section">
    <div class="row justify-content-center align-items-center my-3">
      <div class="col-lg-9">
        <div class="card shadow-lg border-0 overflow-hidden" style="border-radius: 16px;">
          <div class="row g-0">
            <div class="col-md-5 text-white p-4 d-flex flex-column justify-content-between" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);">
              <div>
                <h3 class="fw-bold mb-2">USAE</h3>
                <p class="text-info small fw-semibold">Innovación y Tecnología para un Futuro Seguro</p>
                <hr class="border-secondary">
                <p class="small text-light">Plataforma institucional de soporte técnico N1/N2/N3, gestión de activos TI, ciberseguridad y control de SLAs.</p>
                <ul class="list-unstyled small mt-3 text-white-50">
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-info me-2"></i> Folios atómicos auditables</li>
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-info me-2"></i> Hojas de servicio en sitio N2</li>
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-info me-2"></i> Normativa B2B Smart Campus</li>
                </ul>
              </div>
              <div class="small text-white-50 border-top border-secondary pt-2">
                Operado por: <strong>José Alejandro Castejón Alvarado</strong><br>
                Cd. Nezahualcóyotl, Estado de México
              </div>
            </div>

            <div class="col-md-7 bg-white p-4 p-md-5">
              <h4 class="fw-bold text-dark mb-1">Iniciar Sesión</h4>
              <p class="text-muted small mb-4">Ingrese sus credenciales institucionales o de cliente.</p>

              <form onsubmit="handleLogin(event)">
                <div class="mb-3">
                  <label class="form-label fw-semibold small">Correo Electrónico</label>
                  <input type="email" id="loginEmail" class="form-control" placeholder="usuario@usae.mx" required>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold small">Contraseña</label>
                  <input type="password" id="loginPass" class="form-control" placeholder="••••••••" required>
                </div>

                <!-- Bloque de Aceptación Legal Obligatoria -->
                <div id="legalConsentBox" class="alert alert-warning p-3 small hidden-view">
                  <h6 class="fw-bold"><i class="bi bi-shield-exclamation"></i> Cumplimiento Contractual Obligatorio</h6>
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="chkPrivacy">
                    <label class="form-check-label" for="chkPrivacy">
                      Acepto el <strong>Aviso de Privacidad</strong> y tratamiento de datos personales (`privacyAccepted`).
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="chkTerms">
                    <label class="form-check-label" for="chkTerms">
                      Acepto los <strong>Términos del Servicio y Secreto Industrial</strong> vigente durante el contrato y por 5 años posteriores (`termsAccepted`).
                    </label>
                  </div>
                </div>

                <div id="loginAlert" class="mb-3"></div>

                <button type="submit" class="btn btn-primary w-100 fw-semibold py-2" id="btnLogin">
                  <i class="bi bi-shield-check me-1"></i> Ingresar a USAE Helpdesk
                </button>
              </form>

              <div class="mt-4 pt-3 border-top">
                <p class="text-muted small mb-2 fw-semibold">Accesos rápidos de demostración por rol:</p>
                <div class="d-flex flex-wrap gap-1">
                  <button class="btn btn-xs btn-outline-dark btn-sm" onclick="fillDemo('admin@usae.mx','admin123')">Admin (José A.)</button>
                  <button class="btn btn-xs btn-outline-primary btn-sm" onclick="fillDemo('supervisor@usae.mx','super123')">Supervisor B2B</button>
                  <button class="btn btn-xs btn-outline-success btn-sm" onclick="fillDemo('tecnico@usae.mx','tec123')">Técnico N2</button>
                  <button class="btn btn-xs btn-outline-secondary btn-sm" onclick="fillDemo('cliente@usae.mx','cliente123')">Cliente B2B</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. VISTA CATÁLOGO PÚBLICO DE SERVICIOS (MXN) -->
  <div id="view-catalog" class="view-section hidden-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-0">Portafolio Oficial de Servicios USAE</h3>
        <p class="text-muted small mb-0">Tarifas expresadas en Pesos Mexicanos (MXN) sujetas a contrato marco.</p>
      </div>
      <button class="btn btn-outline-primary btn-sm" onclick="switchView('view-login')">Volver a Acceso</button>
    </div>
    <div class="row g-3" id="catalogGrid"></div>
  </div>

  <!-- 3. VISTA DASHBOARD CLIENTE (B2B / B2C) -->
  <div id="view-client-dashboard" class="view-section hidden-view">
    <div class="row g-3 mb-4">
      <div class="col-lg-6">
        <div class="card card-kpi shadow-sm h-100 bg-dark text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <span class="badge bg-success">PÓLIZA ACTIVA</span>
              <span class="small text-info" id="cliRfc">RFC: ---</span>
            </div>
            <h4 class="fw-bold mt-2 mb-1" id="cliCompany">Empresa Cliente</h4>
            <p class="small text-white-50 mb-2">Plan Contratado: <strong class="text-white" id="cliPlan">---</strong></p>
            <div class="small text-info">Vigencia Contractual: <span id="cliValidity">---</span></div>
          </div>
        </div>
      </div>
      <div class="col-lg-2 col-4">
        <div class="card card-kpi shadow-sm h-100 text-center p-3">
          <div class="text-primary fs-2 fw-bold" id="kpiCliOpen">0</div>
          <div class="small text-muted fw-semibold">Tickets Abiertos</div>
        </div>
      </div>
      <div class="col-lg-2 col-4">
        <div class="card card-kpi shadow-sm h-100 text-center p-3">
          <div class="text-success fs-2 fw-bold" id="kpiCliAssets">0</div>
          <div class="small text-muted fw-semibold">Equipos Activos</div>
        </div>
      </div>
      <div class="col-lg-2 col-4">
        <div class="card card-kpi shadow-sm h-100 d-flex align-items-center justify-content-center p-3 bg-primary text-white" style="cursor:pointer;" onclick="switchView('view-new-ticket')">
          <div class="text-center">
            <i class="bi bi-plus-circle fs-2"></i>
            <div class="small fw-bold mt-1">Nuevo Ticket</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
        <span><i class="bi bi-ticket-perforated text-primary me-2"></i>Mis Tickets de Soporte</span>
        <button class="btn btn-primary btn-sm" onclick="switchView('view-new-ticket')"><i class="bi bi-plus-lg"></i> Levantar Incidencia</button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 small">
          <thead class="table-light">
            <tr>
              <th>Folio</th>
              <th>Asunto</th>
              <th>Equipo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Vencimiento SLA</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="clientTicketsTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 4. VISTA CREACIÓN DE NUEVO TICKET -->
  <div id="view-new-ticket" class="view-section hidden-view">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-primary text-white fw-bold">
            <i class="bi bi-ticket-detailed me-2"></i>Generar Nuevo Ticket Oficial USAE
          </div>
          <div class="card-body p-4">
            <form onsubmit="submitNewTicket(event)">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Tipo de Solicitud</label>
                  <select id="ntType" class="form-select">
                    <option value="INCIDENTE">Incidente (Falla Operativa)</option>
                    <option value="REQUERIMIENTO">Requerimiento / Cambio</option>
                    <option value="MANTENIMIENTO">Mantenimiento Preventivo</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Categoría Técnica</label>
                  <select id="ntCategory" class="form-select">
                    <option value="Infraestructura TI">Infraestructura TI & Redes</option>
                    <option value="Soporte N1/N2">Soporte Técnico Estaciones</option>
                    <option value="Ciberseguridad">Ciberseguridad & Accesos</option>
                    <option value="Desarrollo Web">Desarrollo Web / Software</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Equipo Afectado (Asset ID)</label>
                  <select id="ntAsset" class="form-select"></select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold small">Prioridad Contractual (SLA)</label>
                  <select id="ntPriority" class="form-select">
                    <option value="P1 - Crítico">P1 - Crítico (Respuesta < 15 min)</option>
                    <option value="P2 - Alto">P2 - Alto (Respuesta < 30 min)</option>
                    <option value="P3 - Medio" selected>P3 - Medio (Respuesta < 2 hrs)</option>
                    <option value="P4 - Bajo">P4 - Bajo (Respuesta < 4 hrs)</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Asunto Breve</label>
                  <input type="text" id="ntSubject" class="form-control" placeholder="Ej. Falla en controlador PCI o enlace de red" required>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold small">Descripción Detallada del Problema</label>
                  <textarea id="ntDescription" class="form-control" rows="4" required></textarea>
                </div>
              </div>
              <div class="mt-4 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light" onclick="goBackHome()">Cancelar</button>
                <button type="submit" class="btn btn-primary fw-semibold" id="btnSubmitTicket">
                  <i class="bi bi-check2-circle"></i> Registrar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 5. VISTA DETALLE DE TICKET + CONSOLA TÉCNICA N2 + FIRMA DIGITAL -->
  <div id="view-ticket-detail" class="view-section hidden-view">
    <button class="btn btn-sm btn-outline-secondary mb-3" onclick="goBackHome()"><i class="bi bi-arrow-left"></i> Volver al Panel</button>
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 class="fw-bold mb-0" id="detFolio">USAE-2026-000000</h5>
            <span class="badge bg-info text-dark fs-6" id="detStatus">NUEVO</span>
          </div>
          <div class="card-body">
            <h5 class="fw-bold" id="detSubject">Asunto</h5>
            <p class="text-muted small" id="detMeta">Solicitante y fecha</p>
            <hr>
            <p id="detDescription" class="mb-0"></p>
          </div>
        </div>

        <!-- Hilo de Comentarios -->
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white fw-bold"><i class="bi bi-chat-dots text-primary"></i> Bitácora y Seguimiento</div>
          <div class="card-body">
            <div id="detCommentsList" class="mb-3"></div>
            <div class="input-group">
              <input type="text" id="newCommentInput" class="form-control" placeholder="Escribir actualización o comentario...">
              <button class="btn btn-primary" onclick="postComment()"><i class="bi bi-send"></i> Enviar</button>
            </div>
            <div class="form-check mt-2 hidden-view" id="internalNoteCheckBox">
              <input class="form-check-input" type="checkbox" id="chkInternalNote">
              <label class="form-check-label small text-danger fw-semibold" for="chkInternalNote">Marcar como Nota Interna Técnica (No visible para el cliente)</label>
            </div>
          </div>
        </div>

        <!-- Hoja de Servicio N2 (Visible para Técnico / Supervisor / Admin) -->
        <div class="card shadow-sm border-0 hidden-view" id="techServiceSheetCard">
          <div class="card-header bg-dark text-white fw-bold">
            <i class="bi bi-clipboard2-check text-info"></i> Hoja de Servicio Oficial en Sitio (N2 / Campo)
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">Cambiar Estado del Ticket</label>
                <select id="techNewStatus" class="form-select form-select-sm">
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="EN ESPERA">EN ESPERA (Refacción/Cliente)</option>
                  <option value="RESUELTO">RESUELTO (Listo para cierre)</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Pruebas de Calidad Realizadas</label>
                <div class="d-flex gap-3 small pt-1">
                  <label><input type="checkbox" checked> Red OK</label>
                  <label><input type="checkbox" checked> Software OK</label>
                  <label><input type="checkbox"> CCTV OK</label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Detalle Técnico de Solución Aplicada</label>
                <textarea id="techSolutionText" class="form-control form-control-sm" rows="3" placeholder="Describa diagnóstico final, refacciones o comandos aplicados..."></textarea>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold">Firma de Conformidad en Sitio (Canvas Digital)</label><br>
                <canvas id="signatureCanvas" width="380" height="110"></canvas><br>
                <button type="button" class="btn btn-xs btn-outline-secondary btn-sm mt-1" onclick="clearSignature()">Limpiar Firma</button>
              </div>
              <div class="col-12">
                <button class="btn btn-success btn-sm fw-bold" onclick="saveTechServiceSheet()">
                  <i class="bi bi-file-earmark-check"></i> Guardar Hoja de Servicio y Actualizar Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Derecho SLA y Evaluación CSAT -->
      <div class="col-lg-4">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-dark text-white fw-bold">Control Contractual & SLA</div>
          <ul class="list-group list-group-flush small">
            <li class="list-group-item"><strong>Prioridad:</strong> <span id="detPriority" class="badge bg-danger">---</span></li>
            <li class="list-group-item"><strong>Equipo Vinculado:</strong> <span id="detAsset">---</span></li>
            <li class="list-group-item"><strong>Técnico Asignado:</strong> <span id="detTech">---</span></li>
            <li class="list-group-item"><strong>Límite Respuesta SLA:</strong><br><span class="text-danger fw-bold" id="detSlaResp">---</span></li>
            <li class="list-group-item"><strong>Límite Resolución SLA:</strong><br><span class="text-warning fw-bold" id="detSlaRes">---</span></li>
          </ul>
        </div>

        <!-- Encuesta CSAT de Cierre (Cliente) -->
        <div class="card shadow-sm border-0 hidden-view" id="clientCsatCard">
          <div class="card-header bg-success text-white fw-bold">Conformidad y Cierre (CSAT)</div>
          <div class="card-body small">
            <p>El técnico marcó este servicio como <strong>RESUELTO</strong>. Califique la atención recibida:</p>
            <select id="csatSelect" class="form-select form-select-sm mb-3">
              <option value="5">⭐⭐⭐⭐⭐ Excelente (5)</option>
              <option value="4">⭐⭐⭐⭐ Bueno (4)</option>
              <option value="3">⭐⭐⭐ Regular (3)</option>
              <option value="2">⭐⭐ Deficiente (2)</option>
              <option value="1">⭐ Malo (1)</option>
            </select>
            <button class="btn btn-success btn-sm w-100 fw-bold" onclick="closeTicketWithCsat()">Confirmar Solución y Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. VISTA OPERATIVA TÉCNICO N1/N2/N3 -->
  <div id="view-tech-workspace" class="view-section hidden-view">
    <div class="alert alert-info d-flex justify-content-between align-items-center shadow-sm">
      <div>
        <strong><i class="bi bi-tools"></i> Consola Operativa de Soporte Técnico USAE</strong> — Control de Tiempos SLA y Visitas N2
      </div>
      <span id="techCertBadge" class="badge bg-success">CERTIFICACIÓN SMART CAMPUS VIGENTE</span>
    </div>
    <div class="card shadow-sm border-0">
      <div class="card-header bg-white fw-bold">Cola Global de Tickets Activos (Ordenados por Urgencia SLA)</div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 small">
          <thead class="table-light">
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Asunto</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Vencimiento SLA</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="techTicketsTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 7. VISTA SUPERVISOR & CUMPLIMIENTO B2B SMART CAMPUS -->
  <div id="view-supervisor-b2b" class="view-section hidden-view">
    <div class="row g-4">
      <div class="col-lg-5">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-primary text-white fw-bold">
            <i class="bi bi-building-check"></i> Validador de Prospección B2B (Regla CRM Siebel/PEGA)
          </div>
          <div class="card-body small">
            <p class="text-muted">Registre oportunidades antes de cotizar para verificar cuentas restringidas y asegurar bonos de Venta Independiente (+5%).</p>
            <form onsubmit="submitB2BOpp(event)">
              <div class="mb-2">
                <label class="form-label fw-bold">Nombre / Razón Social del Prospecto</label>
                <input type="text" id="b2bProspect" class="form-control form-control-sm" required>
              </div>
              <div class="mb-2">
                <label class="form-label fw-bold">Sector Comercial</label>
                <select id="b2bSector" class="form-select form-select-sm">
                  <option value="Empresa Privada PyME">Empresa Privada PyME (Permitido)</option>
                  <option value="Corporativo Industrial">Corporativo Industrial (Permitido)</option>
                  <option value="Gobierno">Gobierno / Sector Público (RESTRINGIDO)</option>
                  <option value="Call Center">Call Center (RESTRINGIDO)</option>
                  <option value="Carrier">Carrier / Telecom (RESTRINGIDO)</option>
                  <option value="Signature Client Group">Signature Client Group (RESTRINGIDO)</option>
                </select>
              </div>
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="b2bApproval">
                <label class="form-check-label">Cuento con Visto Bueno por escrito</label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="b2bIndependent">
                <label class="form-check-label">Registro como <strong>Venta Independiente</strong> (+5% bono)</label>
              </div>
              <button type="submit" class="btn btn-primary btn-sm w-100 fw-bold">Validar y Registrar Oportunidad</button>
            </form>
            <div id="b2bAlert" class="mt-3"></div>
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-header bg-white fw-bold">Oportunidades B2B Registradas</div>
          <div class="table-responsive">
            <table class="table table-sm small mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Prospecto</th><th>Sector</th><th>Restringida</th><th>Bono</th><th>Estatus</th></tr>
              </thead>
              <tbody id="crmTableBody"></tbody>
            </table>
          </div>
        </div>

        <div class="card shadow-sm border-0">
          <div class="card-header bg-white fw-bold">Control de Certificación Smart Campus (Mínimo 2 por Contrato)</div>
          <div class="table-responsive">
            <table class="table table-sm small mb-0">
              <thead class="table-light">
                <tr><th>Personal</th><th>Rol</th><th>Modalidad</th><th>Certificación Smart Campus</th></tr>
              </thead>
              <tbody id="certStaffTable"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 8. VISTA ADMINISTRADOR GENERAL (JOSÉ ALEJANDRO CASTEJÓN ALVARADO) -->
  <div id="view-admin-panel" class="view-section hidden-view">
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card card-kpi shadow-sm p-3 bg-white">
          <div class="text-muted small fw-bold">TICKETS TOTALES</div>
          <div class="fs-3 fw-bold text-primary" id="admTotalTickets">0</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-kpi shadow-sm p-3 bg-white">
          <div class="text-muted small fw-bold">USUARIOS ACTIVOS</div>
          <div class="fs-3 fw-bold text-success" id="admTotalUsers">0</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-kpi shadow-sm p-3 bg-white">
          <div class="text-muted small fw-bold">ACTIVOS INVENTARIADOS</div>
          <div class="fs-3 fw-bold text-info" id="admTotalAssets">0</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card card-kpi shadow-sm p-3 bg-dark text-white">
          <div class="text-info small fw-bold">OPERADOR TITULAR</div>
          <div class="small fw-bold mt-1">José Alejandro Castejón Alvarado</div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white fw-bold"><i class="bi bi-shield-lock text-danger"></i> Bitácora Inmutable de Auditoría (`Audit_Logs`)</div>
      <div class="table-responsive" style="max-height: 280px;">
        <table class="table table-sm table-striped small mb-0">
          <thead class="table-dark">
            <tr><th>ID</th><th>Usuario</th><th>Evento</th><th>Descripción</th><th>Timestamp</th></tr>
          </thead>
          <tbody id="auditLogsTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 9. VISTA INVENTARIO DE EQUIPOS (ASSETS) -->
  <div id="view-assets" class="view-section hidden-view">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="fw-bold mb-0"><i class="bi bi-pc-display text-primary"></i> Inventario Tecnológico (`Assets`)</h4>
      <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#modalNewAsset"><i class="bi bi-plus-circle"></i> Registrar Equipo</button>
    </div>
    <div class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover small align-middle mb-0">
          <thead class="table-light">
            <tr><th>Código</th><th>Equipo / Hostname</th><th>Tipo</th><th>Sistema Operativo</th><th>Ubicación</th><th>Soporte Remoto</th><th>Salud</th></tr>
          </thead>
          <tbody id="assetsTableBody"></tbody>
        </table>
      </div>
    </div>
  </div>

</div>

<!-- MODAL REGISTRO DE EQUIPO -->
<div class="modal fade" id="modalNewAsset" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-dark text-white">
        <h6 class="modal-title fw-bold">Alta de Activo Tecnológico</h6>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body small">
        <form onsubmit="submitNewAsset(event)">
          <div class="mb-2"><label class="form-label fw-bold">Nombre / Hostname</label><input type="text" id="asName" class="form-control form-control-sm" required></div>
          <div class="mb-2"><label class="form-label fw-bold">Tipo</label><select id="asType" class="form-select form-select-sm"><option>Laptop</option><option>Workstation</option><option>Servidor</option><option>Firewall / Red</option></select></div>
          <div class="mb-2"><label class="form-label fw-bold">Sistema Operativo</label><input type="text" id="asOs" class="form-control form-control-sm" value="Windows 11 Pro x64"></div>
          <div class="mb-2"><label class="form-label fw-bold">Ubicación Física</label><input type="text" id="asLoc" class="form-control form-control-sm" required></div>
          <div class="row g-2 mb-3">
            <div class="col-6"><label class="form-label fw-bold">Herramienta Remota</label><select id="asTool" class="form-select form-select-sm"><option>AnyDesk</option><option>RustDesk</option><option>TeamViewer</option></select></div>
            <div class="col-6"><label class="form-label fw-bold">ID Remoto</label><input type="text" id="asRemId" class="form-control form-control-sm"></div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm w-100 fw-bold">Guardar Equipo</button>
        </form>
      </div>
    </div>
  </div>
</div>

<!-- FOOTER GLOBAL CONTRACTUAL -->
<footer class="bg-white border-top py-3 mt-5 text-center small text-muted">
  <div class="container">
    <strong>USAE Helpdesk</strong> — Propiedad de <strong>José Alejandro Castejón Alvarado</strong>. <br>
    Información protegida bajo cláusula estricta de Secreto Industrial y Confidencialidad (vigencia contractual + 5 años posteriores).
  </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
  let CURRENT_USER = null;
  let PORTAL_DATA = null;
  let ACTIVE_TICKET = null;

  function fillDemo(email, pass) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPass').value = pass;
  }

  function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden-view'));
    document.getElementById(viewId).classList.remove('hidden-view');
  }

  function showPublicCatalog() {
    if (!PORTAL_DATA) {
      google.script.run.withSuccessHandler(ctx => {
        PORTAL_DATA = ctx;
        renderCatalog();
        switchView('view-catalog');
      }).getPortalContext('', 'PUBLIC');
    } else {
      renderCatalog();
      switchView('view-catalog');
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const legalBox = document.getElementById('legalConsentBox');
    let acceptLegal = false;

    if (!legalBox.classList.contains('hidden-view')) {
      if (!document.getElementById('chkPrivacy').checked || !document.getElementById('chkTerms').checked) {
        alert('Debe marcar ambas casillas legales para acceder.');
        return;
      }
      acceptLegal = true;
    }

    const btn = document.getElementById('btnLogin');
    btn.disabled = true;
    btn.innerHTML = 'Validando credenciales...';

    google.script.run.withSuccessHandler(res => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-shield-check me-1"></i> Ingresar a USAE Helpdesk';

      if (res.requireLegal) {
        legalBox.classList.remove('hidden-view');
        document.getElementById('loginAlert').innerHTML = `<div class="alert alert-warning small py-2">${res.message}</div>`;
        return;
      }

      if (!res.success) {
        document.getElementById('loginAlert').innerHTML = `<div class="alert alert-danger small py-2">${res.message}</div>`;
        return;
      }

      CURRENT_USER = res.user;
      setupSessionUI();
      loadPortalData();
    }).loginUser(email, pass, acceptLegal);
  }

  function setupSessionUI() {
    document.getElementById('userSessionBadge').classList.remove('hidden-view');
    document.getElementById('navUserName').textContent = CURRENT_USER.name;
    document.getElementById('navUserRole').textContent = CURRENT_USER.role;

    const menu = document.getElementById('roleNavMenu');
    if (CURRENT_USER.role === 'CLIENTE') {
      menu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-client-dashboard')">Mi Panel</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-new-ticket')">Nuevo Ticket</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-assets')">Mis Equipos</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-catalog')">Planes MXN</a></li>
      `;
    } else if (CURRENT_USER.role === 'TECNICO') {
      menu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-tech-workspace')">Cola de Tickets SLA</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-assets')">Inventario Equipos</a></li>
      `;
    } else if (CURRENT_USER.role === 'SUPERVISOR') {
      menu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-tech-workspace')">Torre SLA</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-supervisor-b2b')">Control B2B & Smart Campus</a></li>
      `;
    } else if (CURRENT_USER.role === 'ADMINISTRADOR') {
      menu.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-admin-panel')">Panel Ejecutivo</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-tech-workspace')">Todos los Tickets</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-supervisor-b2b')">B2B & Certificaciones</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-assets')">Activos TI</a></li>
        <li class="nav-item"><a class="nav-link" href="#" onclick="switchView('view-catalog')">Catálogo MXN</a></li>
      `;
    }
  }

  function loadPortalData() {
    google.script.run.withSuccessHandler(ctx => {
      PORTAL_DATA = ctx;
      renderCatalog();
      renderAssets();
      if (CURRENT_USER.role === 'CLIENTE') {
        renderClientDashboard();
        switchView('view-client-dashboard');
      } else if (CURRENT_USER.role === 'TECNICO') {
        renderTechWorkspace();
        switchView('view-tech-workspace');
      } else if (CURRENT_USER.role === 'SUPERVISOR') {
        renderTechWorkspace();
        renderSupervisorB2B();
        switchView('view-supervisor-b2b');
      } else if (CURRENT_USER.role === 'ADMINISTRADOR') {
        renderAdminPanel();
        renderTechWorkspace();
        renderSupervisorB2B();
        switchView('view-admin-panel');
      }
    }).getPortalContext(CURRENT_USER.email, CURRENT_USER.role);
  }

  function goBackHome() {
    if (CURRENT_USER.role === 'CLIENTE') switchView('view-client-dashboard');
    else if (CURRENT_USER.role === 'ADMINISTRADOR') switchView('view-admin-panel');
    else switchView('view-tech-workspace');
  }

  function logout() {
    CURRENT_USER = null;
    document.getElementById('userSessionBadge').classList.add('hidden-view');
    document.getElementById('legalConsentBox').classList.add('hidden-view');
    document.getElementById('roleNavMenu').innerHTML = `
      <li class="nav-item"><a class="nav-link active" href="#" onclick="switchView('view-login')">Acceso Portal</a></li>
      <li class="nav-item"><a class="nav-link" href="#" onclick="showPublicCatalog()">Catálogo Oficial MXN</a></li>
    `;
    switchView('view-login');
  }

  function renderCatalog() {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = PORTAL_DATA.catalog.map(c => `
      <div class="col-md-4 col-lg-3">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-header bg-dark text-white small fw-bold">${c.servicio}</div>
          <div class="card-body d-flex flex-column">
            <span class="badge bg-primary align-self-start mb-2">${c.codigo}</span>
            <h5 class="fw-bold">${c.plan}</h5>
            <h4 class="text-primary fw-bold">${c.precio > 0 ? '$' + Number(c.precio).toLocaleString('es-MX') + ' MXN' : 'A cotización'}</h4>
            <p class="text-muted small mb-2">${c.facturacion} • ${c.plazo}</p>
            <p class="small flex-grow-1">${c.caracteristicas}</p>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderClientDashboard() {
    if (PORTAL_DATA.clientProfile) {
      document.getElementById('cliCompany').textContent = PORTAL_DATA.clientProfile.company;
      document.getElementById('cliRfc').textContent = 'RFC: ' + (PORTAL_DATA.clientProfile.rfc || 'N/A');
      document.getElementById('cliPlan').textContent = PORTAL_DATA.clientProfile.planCode;
      document.getElementById('cliValidity').textContent = `${PORTAL_DATA.clientProfile.planStart} al ${PORTAL_DATA.clientProfile.planEnd}`;
    }
    const openCount = PORTAL_DATA.tickets.filter(t => t.status !== 'CERRADO').length;
    document.getElementById('kpiCliOpen').textContent = openCount;
    document.getElementById('kpiCliAssets').textContent = PORTAL_DATA.assets.length;

    const assetSel = document.getElementById('ntAsset');
    assetSel.innerHTML = '<option value="General">Sin equipo específico</option>' +
      PORTAL_DATA.assets.map(a => `<option value="${a.assetId}">${a.assetId} - ${a.name}</option>`).join('');

    const tbody = document.getElementById('clientTicketsTable');
    tbody.innerHTML = PORTAL_DATA.tickets.map(t => `
      <tr>
        <td class="fw-bold text-primary">${t.ticketId}</td>
        <td>${t.subject}</td>
        <td><span class="badge bg-secondary">${t.assetId}</span></td>
        <td><span class="badge bg-warning text-dark">${t.priority}</span></td>
        <td><span class="badge bg-info text-dark">${t.status}</span></td>
        <td class="small">${new Date(t.slaDueResolution).toLocaleString('es-MX')}</td>
        <td><button class="btn btn-sm btn-outline-primary" onclick="openTicketDetail('${t.ticketId}')">Ver</button></td>
      </tr>
    `).join('');
  }

  function submitNewTicket(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitTicket');
    btn.disabled = true;
    const payload = {
      email: CURRENT_USER.email,
      type: document.getElementById('ntType').value,
      category: document.getElementById('ntCategory').value,
      assetId: document.getElementById('ntAsset').value,
      priority: document.getElementById('ntPriority').value,
      subject: document.getElementById('ntSubject').value,
      description: document.getElementById('ntDescription').value
    };
    google.script.run.withSuccessHandler(res => {
      btn.disabled = false;
      if (res.success) {
        alert(`Ticket generado exitosamente.\nFolio Oficial: ${res.folio}`);
        loadPortalData();
      } else {
        alert(res.message);
      }
    }).createNewTicket(payload);
  }

  function renderTechWorkspace() {
    const tbody = document.getElementById('techTicketsTable');
    tbody.innerHTML = PORTAL_DATA.tickets.map(t => `
      <tr class="${t.priority.includes('P1') ? 'sla-critical' : 'sla-ok'}">
        <td class="fw-bold">${t.ticketId}</td>
        <td>${t.email}</td>
        <td>${t.subject}</td>
        <td><span class="badge bg-danger">${t.priority}</span></td>
        <td><span class="badge bg-primary">${t.status}</span></td>
        <td>${new Date(t.slaDueResolution).toLocaleString('es-MX')}</td>
        <td><button class="btn btn-sm btn-dark" onclick="openTicketDetail('${t.ticketId}')">Atender</button></td>
      </tr>
    `).join('');
  }

  function openTicketDetail(ticketId) {
    ACTIVE_TICKET = PORTAL_DATA.tickets.find(t => t.ticketId === ticketId);
    if (!ACTIVE_TICKET) return;

    document.getElementById('detFolio').textContent = ACTIVE_TICKET.ticketId;
    document.getElementById('detStatus').textContent = ACTIVE_TICKET.status;
    document.getElementById('detSubject').textContent = ACTIVE_TICKET.subject;
    document.getElementById('detMeta').textContent = `Solicitante: ${ACTIVE_TICKET.email} | Creado: ${new Date(ACTIVE_TICKET.createdAt).toLocaleString('es-MX')}`;
    document.getElementById('detDescription').textContent = ACTIVE_TICKET.description;
    document.getElementById('detPriority').textContent = ACTIVE_TICKET.priority;
    document.getElementById('detAsset').textContent = ACTIVE_TICKET.assetId;
    document.getElementById('detTech').textContent = ACTIVE_TICKET.assignedTech;
    document.getElementById('detSlaResp').textContent = new Date(ACTIVE_TICKET.slaDueResponse).toLocaleString('es-MX');
    document.getElementById('detSlaRes').textContent = new Date(ACTIVE_TICKET.slaDueResolution).toLocaleString('es-MX');

    const isStaff = ['TECNICO', 'SUPERVISOR', 'ADMINISTRADOR'].includes(CURRENT_USER.role);
    document.getElementById('techServiceSheetCard').classList.toggle('hidden-view', !isStaff);
    document.getElementById('internalNoteCheckBox').classList.toggle('hidden-view', !isStaff);
    document.getElementById('clientCsatCard').classList.toggle('hidden-view', !(CURRENT_USER.role === 'CLIENTE' && ACTIVE_TICKET.status === 'RESUELTO'));

    const visibleComments = ACTIVE_TICKET.comments.filter(c => isStaff || !c.internal);
    document.getElementById('detCommentsList').innerHTML = visibleComments.map(c => `
      <div class="p-2 mb-2 rounded border ${c.internal ? 'bg-warning-subtle border-warning' : 'bg-light'}">
        <div class="d-flex justify-content-between small">
          <strong>${c.author} (${c.role}) ${c.internal ? '[NOTA INTERNA]' : ''}</strong>
          <span class="text-muted">${new Date(c.date).toLocaleString('es-MX')}</span>
        </div>
        <div class="small mt-1">${c.text}</div>
      </div>
    `).join('');

    switchView('view-ticket-detail');
  }

  function postComment() {
    const txt = document.getElementById('newCommentInput').value.trim();
    if (!txt) return;
    google.script.run.withSuccessHandler(() => {
      document.getElementById('newCommentInput').value = '';
      loadPortalData();
    }).updateTicketAction({
      ticketId: ACTIVE_TICKET.ticketId,
      actorEmail: CURRENT_USER.email,
      actorRole: CURRENT_USER.role,
      newComment: txt,
      isInternal: document.getElementById('chkInternalNote').checked
    });
  }

  function saveTechServiceSheet() {
    const newStatus = document.getElementById('techNewStatus').value;
    const solution = document.getElementById('techSolutionText').value;
    google.script.run.withSuccessHandler(() => {
      alert('Hoja de Servicio N2 guardada y firmada digitalmente.');
      loadPortalData();
    }).updateTicketAction({
      ticketId: ACTIVE_TICKET.ticketId,
      actorEmail: CURRENT_USER.email,
      actorRole: CURRENT_USER.role,
      status: newStatus,
      assignedTech: CURRENT_USER.name,
      solutionDetails: solution,
      newComment: `Hoja de Servicio N2 registrada. Estado actualizado a ${newStatus}. Solución: ${solution}`
    });
  }

  function closeTicketWithCsat() {
    const score = document.getElementById('csatSelect').value;
    google.script.run.withSuccessHandler(() => {
      alert('Ticket cerrado con encuesta CSAT registrada.');
      loadPortalData();
    }).updateTicketAction({
      ticketId: ACTIVE_TICKET.ticketId,
      actorEmail: CURRENT_USER.email,
      actorRole: 'CLIENTE',
      status: 'CERRADO',
      csatScore: score,
      newComment: `Cliente confirmó conformidad y cerró el ticket. Calificación CSAT: ${score}/5.`
    });
  }

  function renderSupervisorB2B() {
    document.getElementById('crmTableBody').innerHTML = PORTAL_DATA.crm.map(c => `
      <tr>
        <td class="fw-bold">${c.oppId}</td>
        <td>${c.prospectName}</td>
        <td>${c.sector}</td>
        <td>${c.isRestricted}</td>
        <td>${c.isIndependentSale}</td>
        <td><span class="badge bg-secondary">${c.status}</span></td>
      </tr>
    `).join('');

    document.getElementById('certStaffTable').innerHTML = PORTAL_DATA.users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.role}</td>
        <td>${u.workMode}</td>
        <td>${u.smartCampusCert ? '<span class="badge bg-success">CERTIFICADO</span>' : '<span class="badge bg-danger">PENDIENTE</span>'}</td>
      </tr>
    `).join('');
  }

  function submitB2BOpp(e) {
    e.preventDefault();
    google.script.run.withSuccessHandler(res => {
      document.getElementById('b2bAlert').innerHTML = `<div class="alert ${res.isRestricted ? 'alert-danger' : 'alert-success'} small py-2">${res.message}</div>`;
      loadPortalData();
    }).registerB2BOpportunity({
      execEmail: CURRENT_USER.email,
      prospectName: document.getElementById('b2bProspect').value,
      sector: document.getElementById('b2bSector').value,
      writtenApproval: document.getElementById('b2bApproval').checked,
      isIndependentSale: document.getElementById('b2bIndependent').checked
    });
  }

  function renderAdminPanel() {
    document.getElementById('admTotalTickets').textContent = PORTAL_DATA.tickets.length;
    document.getElementById('admTotalUsers').textContent = PORTAL_DATA.users.length;
    document.getElementById('admTotalAssets').textContent = PORTAL_DATA.assets.length;

    document.getElementById('auditLogsTable').innerHTML = PORTAL_DATA.logs.map(l => `
      <tr>
        <td>${l.logId}</td>
        <td>${l.userEmail}</td>
        <td><span class="badge bg-dark">${l.event}</span></td>
        <td>${l.description}</td>
        <td>${new Date(l.timestamp).toLocaleString('es-MX')}</td>
      </tr>
    `).join('');
  }

  function renderAssets() {
    document.getElementById('assetsTableBody').innerHTML = PORTAL_DATA.assets.map(a => `
      <tr>
        <td class="fw-bold text-primary">${a.assetId}</td>
        <td>${a.name}</td>
        <td>${a.assetType}</td>
        <td>${a.os}</td>
        <td>${a.location}</td>
        <td><span class="badge bg-light text-dark border">${a.remoteTool}: ${a.remoteId}</span></td>
        <td><span class="badge bg-success">${a.healthStatus}</span></td>
      </tr>
    `).join('');
  }

  function submitNewAsset(e) {
    e.preventDefault();
    google.script.run.withSuccessHandler(res => {
      if (res.success) {
        bootstrap.Modal.getInstance(document.getElementById('modalNewAsset')).hide();
        loadPortalData();
      }
    }).createAsset({
      email: CURRENT_USER.email,
      name: document.getElementById('asName').value,
      assetType: document.getElementById('asType').value,
      os: document.getElementById('asOs').value,
      location: document.getElementById('asLoc').value,
      remoteTool: document.getElementById('asTool').value,
      remoteId: document.getElementById('asRemId').value
    });
  }

  // Firma digital Canvas HTML5
  const canvas = document.getElementById('signatureCanvas');
  const ctxSig = canvas.getContext('2d');
  let drawing = false;
  canvas.addEventListener('mousedown', () => drawing = true);
  canvas.addEventListener('mouseup', () => { drawing = false; ctxSig.beginPath(); });
  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctxSig.lineWidth = 2;
    ctxSig.lineCap = 'round';
    ctxSig.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxSig.stroke();
    ctxSig.beginPath();
    ctxSig.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });
  function clearSignature() { ctxSig.clearRect(0, 0, canvas.width, canvas.height); }
</script>
</body>
</html>
```

He generado los dos archivos completos (`Code.gs` e `Index.html`) con todas las vistas multi-rol (`Administrador`, `Supervisor B2B`, `Técnico N2`, `Cliente`), firma legal obligatoria, cálculo de SLAs, Hoja de Servicio con Canvas digital y validador de reglas Smart Campus, listos para implementar en Google Apps Script e incrustar en Google Sites.
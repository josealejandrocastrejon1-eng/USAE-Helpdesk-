# Fuentes del Cuaderno — USAE Helpdesk

## 1. Historial de Conversaciones del Cuaderno

### Interacción 1 (2026-11-13 08:06:23)
* **Usuario:** Basándonos en ese cuaderno y en este chat, realizarlo completo y como queremos que sea USAE Helpdesk.
* **Respuesta:** Se presentó la especificación completa, arquitectura MVC, esquema de base de datos MySQL (`usae_helpdesk_db`), backend PDO en PHP, catálogo oficial de servicios B2B/B2C y formato de hoja de servicio en sitio.

### Interacción 2 (2026-11-13 08:07:41)
* **Usuario:** Yo no me llamo emilio mi nombre es José Alejandro Castejón Alvarado, y crea todo implementado en appscript y Google sites.
* **Respuesta:** Se reestructuró la implementación completa de **USAE Helpdesk** para operar bajo **José Alejandro Castejón Alvarado** (Marca: USAE) utilizando **Google Apps Script** (`Code.gs`, `Index.html`), Google Sheets como base de datos en la nube e integración directa mediante URL embebida en **Google Sites**.

### Interacción 3 (2026-11-13 08:08:44)
* **Usuario:** Muéstrame.
* **Respuesta:** Compilación técnica maestra generada en el documento interactivo.

---

## 2. Especificación Técnica Maestra (Master Spec)

### Identidad y Parámetros Generales
* **Nombre de la Aplicación:** USAE Helpdesk
* **Organización / Marca:** USAE (Soporte Técnico, Infraestructura TI, Ciberseguridad y Desarrollo Web)
* **Idioma Principal:** Español (México - `es_MX`)
* **Zona Horaria:** `America/Mexico_City`
* **Moneda:** `MXN`
* **Versión:** 1.0.0 (Master Release)

### Roles del Sistema (RBAC)
1. **ADMINISTRADOR:** Acceso total a configuraciones, usuarios, técnicos, departamentos, catálogos, tarifas, auditoría y reportes globales.
2. **SUPERVISOR:** Supervisión de tickets por departamento, reasignaciones, prioridades y métricas SLA.
3. **TÉCNICO:** Diagnóstico, atención en sitio/remota, actualización de estados, registro de soluciones y evidencias.
4. **USUARIO / CLIENTE:** Creación de tickets, consulta de estado, comentarios, archivos adjuntos, cierre y encuesta de satisfacción.

### Ciclo de Vida del Ticket
`NUEVO` ➔ `ASIGNADO` ➔ `EN PROCESO` ➔ `EN ESPERA` ➔ `RESUELTO` ➔ `CERRADO` *(con opción de `REABIERTO` dentro de 48 hrs).*

### Matriz de Prioridades y Tiempos SLA
* **CRÍTICA (P1):** Respuesta < 15 min | Resolución N1/N2: 2 hrs | N3: 4 hrs
* **ALTA (P2):** Respuesta < 30 min | Resolución N1/N2: 4 hrs | N3: 8 hrs
* **MEDIA (P3):** Respuesta < 2 hrs | Resolución N1/N2: 8 hrs | N3: 24 hrs
* **BAJA (P4):** Respuesta < 4 hrs | Resolución: 24 a 48 hrs

---

## 3. Bases de Datos Vinculadas en Google Sheets

### A. USAE Helpdesk - Portal DB (Hojas de Cálculo)
* **Tickets:** `ticketId`, `email`, `subject`, `description`, `status`, `priority`, `createdAt`, `updatedAt`, `type`, `scheduledFor`, `assetId`, `category`, `serviceCode`, `serviceName`, `detailsJson`, `planAtCreation`
* **Catalogo / catalog_service:**
  * `INF-ESENCIAL` — Plan Esencial ($2,000 MXN / Mensual)
  * `INF-EMPRESARIAL` — Plan Empresarial ($4,500 MXN / Mensual)
  * `INF-CORPORATIVO` — Plan Corporativo ($8,500 MXN / Mensual)
  * `DEV-BASICO` — Plan Básico Desarrollo Web ($5,000 MXN / Proyecto)
  * `DEV-PRO` — Plan Profesional Desarrollo Web ($12,000 MXN / Proyecto)
  * `SEC-BASICO` — Plan Seguridad Básico ($3,500 MXN / Mensual)
  * `SEC-TOTAL` — Plan Protección Total ($7,000 MXN / Mensual)
  * `CUSTOM` — Consultoría / Proyecto a medida (A cotización)
* **Users:** `email`, `name`, `passwordHash`, `salt`, `role`, `active`, `createdAt`, `createdBy` (Registros: `admin@usae.mx`, `cliente@usae.mx`).
* **Clients:** `email`, `company`, `contactName`, `phone`, `planCode`, `address`, `notes`, `updatedAt`, `rfc`, `billingEmail`, `planStatus`, `planStart`, `planEnd`.
* **Payments, Assets, Files:** Tablas estructuradas para pagos (MercadoPago / Transferencia), inventario de activos y documentos en Google Drive.

### B. USAE WebApp - Base de Datos (Joyería Artesanal USAE)
* **Productos:** Catálogo de 121 artículos de joyería (`JOY-001` a `JOY-121` en plata .925 y acero inoxidable).
* **Pedidos y Clientes:** Registro de prueba a nombre de *Jose Alejandro castrejon alvarado* (`PED-20260720-232852-6020`, `CLI-20260720-232852-7227`, Ciudad Nezahualcóyotl, Estado de México).
* **Configuración:** Nombre de tienda, moneda (`MXN`), envío gratis desde `$1,500`, costo de envío `$149`.

---

## 4. Plan de Inducción Interna y Capacitación Obligatoria

1. **Módulo 1 (4 hrs):** Inducción Corporativa y Cultura USAE, confidencialidad (vigente hasta 5 años post-contrato) y firma digital de términos.
2. **Módulo 2 (16 hrs):** Certificación **Smart Campus** y Normativa B2B (Axtel/Alestra), reglas de prospección en CRM (Siebel/PEGA), identificación de cuentas restringidas y esquema de comisiones.
3. **Módulo 3 (12 hrs):** Operación de Mesa de Ayuda, folios correlativos (`USAE-YYYY-XXXXXX`), vinculación de activos (`EQP-001`), control de SLAs y llenado de Hoja de Servicio N2.
4. **Módulo 4 (4 hrs):** Evaluación de permanencia (mínimo 85/100), integración de expediente y recertificación anual.

---

## 5. Registros de Prueba (Mensajes)
Contiene 9 registros de prueba del `8/6/2025` con el usuario `hhi` (`fyfy@hff.mx`).
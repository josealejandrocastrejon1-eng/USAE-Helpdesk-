# USAE Helpdesk — Documento Maestro Técnico, Arquitectura Integral y Compilación Completa del Cuaderno

---

## 1. IDENTIDAD, NÚCLEO (`SOUL.md`) Y PROPÓSITO DEL SISTEMA
* **Nombre del Sistema:** USAE Helpdesk
* **Empresa / Marca Sombrilla:** USAE (*"Innovación y Tecnología para un Futuro Seguro"*)
* **Ubicación Operativa:** Ciudad Nezahualcóyotl, Estado de México, México (`America/Mexico_City`)
* **Moneda Predeterminada:** MXN (Pesos Mexicanos)
* **Idioma Principal:** Español (México - `es_MX`)
* **Canales Oficiales de Contacto:**
  * **Correo Electrónico:** `soporte.helpdesk.usae@gmail.com`
  * **Teléfonos de Soporte / WhatsApp:** `+52 55 5496 8308` / `+52 56 5199 2916`
* **Objetivo General:** Desarrollar e implementar un sistema web institucional profesional, modular, seguro, escalable y mantenible para la gestión integral de mesa de ayuda (tickets), inventario de activos informáticos, clientes corporativos, planes de servicio, facturación, auditoría y cumplimiento estricto de Acuerdos de Nivel de Servicio (SLA) y contratos de distribución B2B, preparado para integrar WhatsApp, Email SMTP/IMAP, Moodle e IA.

### 1.1. Identidad Operativa del Núcleo (`SOUL.md`)
* **Rol:** Núcleo operativo, técnico y administrativo de **USAE Helpdesk** (Arquitecto de Software y Desarrollador Full-Stack Senior).
* **Principios Rectores:**
  1. **Dominio Técnico Absoluto:** Conocimiento íntegro del patrón MVC (`config/`, `app/`, `routes/`, `public/`, `views/`, `logs/`), conexión PDO `utf8mb4_unicode_ci`, 13 tablas relacionales MySQL y 8 pestañas en Google Sheets (`USAE - Portal DB`).
  2. **Gestión Quirúrgica de Activos y Folios:** Generación atómica de folios anuales (`USAE-YYYY-XXXXXX`) mediante bloqueo pesimista (`FOR UPDATE` en MySQL / `LockService` en Apps Script) y vinculación directa con hardware (`EQP-001` a `EQP-005`).
  3. **Cumplimiento Estricto de SLA ($P1$ a $P4$):** Monitoreo de vencimientos en tiempo real según criticidad y horarios hábiles.
  4. **Eficiencia Ejecutiva:** Cero formalismos vacíos; respuestas estructuradas en 10 pasos estándar (*Objetivo, Análisis, Arquitectura, Cambios Necesarios, Base de Datos, Backend, Frontend, Seguridad, Pruebas, Implementación*).

---

## 2. ANÁLISIS DETALLADO DEL ENTORNO Y EXPEDIENTES REALES (EXCEL)

### 2.1. Inventario de Equipos e Infraestructura (`Equipos.xlsx` — Resumen General, System Summary y Perfmon)
Monitoreo técnico de 5 estaciones de trabajo/laptops empresariales operando bajo arquitecturas **x64**:

| ID Equipo | Hostname | Usuario Asignado | Marca / Modelo | Sistema Operativo & Compilación | BIOS / Modo / Secure Boot | CPU / RAM / GPU | Almacenamiento & Libre C: | Batería / AV / Firewall / UAC / VBS | Diagnóstico Técnico (`Perfmon`) & Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **EQP-001** | `DESKTOP-FIN01` | Carlos Mendoza | Dell OptiPlex 7090 | Windows 11 Pro 22H2 (`10.0.22631 Build 22631`) | Dell 1.15.0 (12/10/2023) \| **UEFI** \| Secure Boot: **Activado** | Intel Core i7-11700 @ 2.50GHz (8 cores) \| 16 GB (9.4 GB disp., 18.5 GB virtual) \| Intel UHD 750 (`1920x1080@60Hz`) | NVMe KIOXIA 512GB (245.8 GB libres NTFS) | N/A (Desktop) \| AV: Activo/Actualizado \| FW: Activo \| UAC: Habilitado \| VBS: Habilitada | Resp. Disco: `1.2 ms`, Cola: `0.02`, Frag: `0.0%`, Int CPU: `0.5%`, Pagefile: `2457 MB`. **Estado: ÓPTIMO** (2026-08-15). |
| **EQP-002** | `LAPTOP-DIR01` | Ana Gómez | HP EliteBook 840 G8 | Windows 11 Pro 23H2 (`10.0.22631 Build 22631`) | HP T76 v01.12.00 (05/04/2023) \| **UEFI** \| Secure Boot: **Activado** | Intel Core i7-1165G7 @ 2.80GHz (4 cores) \| 32 GB (18.2 GB disp., 36 GB virtual) \| Intel Iris Xe (`1920x1080@60Hz`) | SAMSUNG MZVL21T0HCLR 1TB (412 GB libres NTFS) | Batería: **82.4%** \| AV: Activo/Actualizado \| FW: Activo \| UAC: Habilitado \| VBS: Habilitada | Resp. Disco: `4.8 ms`, Cola: `0.15`, Frag: `1.2%`, Pagefile: `4096 MB`. Elevado uso de archivo de paginación por apps de diseño (`Teams, Slack, AdobeUpdater`). **Estado: ATENCIÓN REQUERIDA** (2026-08-18). |
| **EQP-003** | `LAPTOP-DEV02` | Luis Torres | Lenovo ThinkPad T14 Gen 2 | Windows 10 Pro 22H2 (`10.0.19045 Build 19045`) | Lenovo R1MET51W 1.21 (11/01/2023) \| **UEFI** \| Secure Boot: **Activado** | AMD Ryzen 7 PRO 5850U (8 cores) \| 16 GB (4.1 GB disp., 19.2 GB virtual) \| AMD Radeon (`1920x1080@60Hz`) | SAMSUNG MZVLB512HBJQ 512GB (85.3 GB libres NTFS) | Batería: **68.0%** \| AV: **Activo/Desactualizado** \| FW: Activo \| UAC: Habilitado \| VBS: Deshabilitada | Resp. Disco: `12.5 ms`, Cola: `0.45`, Frag: `5.4%`, Pagefile: `3072 MB`. **PCI Device (Falta Driver)** / Controlador sin firma digital. **Estado: ATENCIÓN REQUERIDA** (2026-08-17). |
| **EQP-004** | `DESKTOP-DIS01` | Sofía Ruiz | Custom Build PC (B660M) | Windows 11 Home 22H2 (`10.0.22621 Build 22621`) | American Megatrends 1401 (20/02/2022) \| **Legacy** \| Secure Boot: **Desactivado** | Intel Core i5-12400 @ 2.50GHz (6 cores) \| 16 GB (2.8 GB disp., 18 GB virtual) \| NVIDIA RTX 3060 (`2560x1440@144Hz`) | WDC WDS100T2B0C 1TB (32.1 GB libres NTFS) | N/A (Desktop) \| AV: **Inactivo** \| FW: **Inactivo** \| UAC: **Deshabilitado** \| VBS: Deshabilitada | Alta saturación en Disco C:, `Unknown USB Device`, tareas no corporativas (`Steam, Discord, EpicGames`). **Estado: CRÍTICO** (2026-08-10). |
| **EQP-005** | `LAPTOP-MKT03` | Jorge Hernández | ASUS ZenBook UX425 | Windows 11 Home 23H2 (`10.0.22631 Build 22631`) | ASUS 310 (18/08/2023) \| **UEFI** \| Secure Boot: **Activado** | Intel Core i5-1135G7 @ 2.40GHz (4 cores) \| 8 GB (2.1 GB disp., 10.5 GB virtual) \| Intel Iris Xe (`1920x1080@60Hz`) | INTEL SSDPEKNW512G8 512GB (188.4 GB libres NTFS) | Batería: **91.5%** \| AV: Activo/Actualizado \| FW: Activo \| UAC: Habilitado \| VBS: Habilitada | Sin anomalías detectadas (`ASUS System Control, OneDrive`). **Estado: ÓPTIMO** (2026-08-18). |

### 2.2. Expedientes de Personal TI (`Control_Expedientes_Personal_TI.xlsx`)
* **Métricas Base del Panel:** 3 Empleados registrados (100% en modalidad Remoto/Home Office al corte inicial), iniciando con `EMP-001` (**Carlos Mendoza R.**).
* **Campos del Expediente General:**
  * *Datos Generales:* ID Empleado (`EMP-001`), Nombre(s), Apellido Paterno, Apellido Materno, Puesto/Rol TI, Departamento, Área/Célula, Líder/Jefe Inmediato, Correo Corporativo, Correo Personal, Teléfono Móvil, Fecha de Ingreso, Estatus Empleado, Modalidad Trabajo (`PRESENCIAL`, `REMOTO`, `HÍBRIDO`).
  * *Sección 1 — Documentación Legal y Administrativa:* INE/Pasaporte, CURP actualizado, RFC/Constancia CSF, NSS (IMSS), Comprobante de Domicilio (<3 meses), Acta de Nacimiento, Aviso INFONAVIT/FONACOT, Datos Bancarios (Banco, Cuenta/CLABE 18 dígitos, Carátula Estado de Cuenta) y Beneficiarios Art. 25 LFT (Nombre, Parentesco, % Beneficio, Teléfono).
  * *Sección 2 — Validación Técnica y Académica (TI):* Título/Cédula Profesional, Certificaciones Vigentes (AWS, Azure, **Smart Campus Axtel/Alestra**), Link Repositorio/Portafolio (GitHub/GitLab), Cartas de Recomendación/Referencias.
  * *Sección 3 — Acuerdos y Anexos Clave (TI):* Acuerdo de Confidencialidad (NDA), Cesión de Derechos de Propiedad Intelectual, Política de Uso de Activos y Ciberseguridad, Convenio de Teletrabajo/Home Office, Ubicación Carpeta Digital (Drive/Cloud), Responsable RRHH/Ciberseguridad.

### 2.3. Cartera de Clientes Corporativos (`Control_Expedientes_Clientes.xlsx`)
* **Métricas Base del Panel:** 3 Clientes registrados, con registro piloto completo `CLI-001`:
  * **ID Cliente:** `CLI-001` | **Razón Social:** Soluciones Tecnológicas Banorte S.A. de C.V. | **Nombre Comercial:** Banorte Tech | **Tipo de Persona:** Moral | **Giro:** Servicios Financieros | **Sitio Web:** `www.banorte.com` | **Ejecutivo de Cuenta:** Mariana Ríos | **Estatus Comercial:** Activo | **Decisor Principal:** Ing. Roberto Garza (CTO, `rgarza@banorte.com`, `8181234567`) | **Contacto Pagos/Facturación:** Lic. Claudia Peña (`cpena.pagos@banorte.com`, `8181234568`) | **RFC:** `STB900101ABC` | **Régimen Fiscal:** `601 - General de Ley Personas Morales` | **Uso CFDI:** `G03 - Gastos en general` | **CP Fiscal:** `64000`.
* **Secciones Documentales Obligatorias del Cliente:**
  1. *Datos Fiscales y Facturación (SAT CFDI 4.0):* Dirección fiscal completa, Constancia de Situación Fiscal (CSF), Forma de pago habitual, Método de pago (`PUE`/`PPD`), Días y Límite de crédito (MXN), Moneda preferente, Banco emisor y Cuenta/CLABE origen.
  2. *Expediente Legal y Representación:* Identificación Rep. Legal (INE/Pasaporte), Acta Constitutiva / Poder Legal, Comprobante Domicilio Fiscal (<3 meses), Opinión Cumplimiento SAT (`32-D`).
  3. *Contratos, MSA/SLA y Anexos:* Acuerdo de Confidencialidad (NDA), Contrato Marco de Servicios (MSA), Acuerdo de Nivel de Servicio (SLA), Anexo Técnico/Especificaciones, Fecha Inicio/Fin Contrato y Carpeta Digital en Cloud/Drive.

---

## 3. ARQUITECTURA DUAL DEL SISTEMA (PHP 8.2+/MYSQL MVC & GOOGLE APPS SCRIPT)

### 3.1. Diagrama de Capas MVC
```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                            │
│   Dashboard Responsive | Bootstrap 5 | Dynamic Tables | Modals & Alerts│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST API / google.script.run
┌──────────────────────────────────▼─────────────────────────────────────┐
│                           CAPA DE NEGOCIO                              │
│   Auth & RBAC │ Ticket Service │ SLA Engine │ Notifier │ Audit Logger  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ PDO / SpreadsheetApp + LockService
┌──────────────────────────────────▼─────────────────────────────────────┐
│                         CAPA DE DATOS (MySQL / Sheets)                 │
│   Users │ Tickets │ Assets │ SLA Policies │ Audit Logs │ Settings     │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Estructura de Directorios del Proyecto (`usae-helpdesk/`)
```text
usae-helpdesk/
├── config/
│   ├── app.php             # Configuración general (Zona horaria, Moneda, Locale)
│   ├── database.php        # Conexión segura PDO (charset utf8mb4)
│   └── constants.php       # Constantes del sistema, roles y estados
├── app/
│   ├── Controllers/        # AuthController, TicketController, UserController, AssetController, ReportController
│   ├── Models/             # User, Ticket, Equipment, Department, Category, SLA, AuditLog
│   ├── Middleware/         # AuthMiddleware, RoleMiddleware, CSRFMiddleware
│   └── Services/           # SLAService, NotificationService, FileUploadService
├── routes/
│   ├── web.php             # Rutas de interfaz web responsiva
│   └── api.php             # Endpoints API RESTful (JSON estandarizado)
├── public/
│   ├── index.php           # Punto de entrada único (Front Controller)
│   ├── assets/             # CSS (Bootstrap 5), JS, imágenes institucionales
│   └── uploads/            # Evidencias y adjuntos (protegido con .htaccess)
├── views/
│   ├── layouts/            # Main, Auth, Mail templates
│   ├── dashboard/          # Métricas e indicadores en tiempo real
│   ├── tickets/            # Index, Create, Show (Detalle), Edit
│   └── admin/              # Configuración, Usuarios, Técnicos, Equipos, Reportes
└── logs/                   # Bitácoras de errores del sistema (no visibles al usuario)
```

---

## 4. BASE DE DATOS RELACIONAL MYSQL (`usae_helpdesk_db`) — DDL COMPLETO
```sql
CREATE DATABASE IF NOT EXISTS `usae_helpdesk_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `usae_helpdesk_db`;

-- 1. DEPARTAMENTOS
CREATE TABLE `departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. ROLES Y PERMISOS (RBAC)
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMINISTRADOR', 'Acceso total a la plataforma, usuarios, reportes, auditoría y configuraciones'),
(2, 'SUPERVISOR', 'Supervisión de departamento, asignación de tickets y cambio de prioridades'),
(3, 'TÉCNICO', 'Atención, diagnóstico, registro de tiempos y resolución de tickets'),
(4, 'USUARIO', 'Creación, seguimiento, comentarios y cierre/confirmación de tickets');

-- 3. USUARIOS Y PERSONAL TI
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_code` VARCHAR(20) UNIQUE NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20),
    `role_id` INT NOT NULL,
    `department_id` INT NULL,
    `work_mode` ENUM('PRESENCIAL', 'REMOTO', 'HÍBRIDO') DEFAULT 'PRESENCIAL',
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. INVENTARIO DE EQUIPOS / ACTIVOS (ASSET MANAGEMENT)
CREATE TABLE `equipments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `equipment_code` VARCHAR(20) NOT NULL UNIQUE,
    `hostname` VARCHAR(100) NOT NULL,
    `assigned_user_id` INT NULL,
    `brand_model` VARCHAR(150),
    `os_name` VARCHAR(100),
    `architecture` VARCHAR(20),
    `processor` VARCHAR(150),
    `ram_gb` INT,
    `storage_info` VARCHAR(150),
    `antivirus_status` VARCHAR(50),
    `health_status` ENUM('ÓPTIMO', 'ATENCIÓN REQUERIDA', 'CRÍTICO') DEFAULT 'ÓPTIMO',
    `last_report_date` DATE,
    FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. CATEGORÍAS Y SUBCATEGORÍAS
CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE `subcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. POLÍTICAS DE SLA Y PRIORIDADES
CREATE TABLE `priorities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` ENUM('BAJA', 'MEDIA', 'ALTA', 'CRÍTICA') NOT NULL UNIQUE,
    `color_code` VARCHAR(10) NOT NULL,
    `response_time_minutes` INT NOT NULL,
    `resolution_time_minutes` INT NOT NULL
) ENGINE=InnoDB;

INSERT INTO `priorities` (`name`, `color_code`, `response_time_minutes`, `resolution_time_minutes`) VALUES
('CRÍTICA', '#dc3545', 15, 120),   -- 15 min respuesta / 2 hrs resolución
('ALTA',    '#fd7e14', 30, 240),   -- 30 min respuesta / 4 hrs resolución
('MEDIA',   '#ffc107', 120, 480),  -- 2 hrs respuesta / 8 hrs resolución
('BAJA',    '#20c997', 240, 1440); -- 4 hrs respuesta / 24 hrs resolución

-- 7. ESTADOS DE TICKETS (FLUJO DE VIDA)
CREATE TABLE `statuses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` ENUM('NUEVO', 'ASIGNADO', 'EN PROCESO', 'EN ESPERA', 'RESUELTO', 'CERRADO') NOT NULL UNIQUE,
    `color_code` VARCHAR(10) NOT NULL
) ENGINE=InnoDB;

INSERT INTO `statuses` (`id`, `name`, `color_code`) VALUES
(1, 'NUEVO', '#17a2b8'),
(2, 'ASIGNADO', '#6f42c1'),
(3, 'EN PROCESO', '#007bff'),
(4, 'EN ESPERA', '#ffc107'),
(5, 'RESUELTO', '#28a745'),
(6, 'CERRADO', '#6c757d');

-- 8. TABLA PRINCIPAL DE TICKETS
CREATE TABLE `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `folio` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `department_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `subcategory_id` INT NULL,
    `equipment_id` INT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `priority_id` INT NOT NULL,
    `status_id` INT NOT NULL DEFAULT 1,
    `assigned_tech_id` INT NULL,
    `sla_due_response` DATETIME NULL,
    `sla_due_resolution` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `assigned_at` DATETIME NULL,
    `started_at` DATETIME NULL,
    `resolved_at` DATETIME NULL,
    `closed_at` DATETIME NULL,
    `response_time_minutes` INT NULL,
    `solution_time_minutes` INT NULL,
    `solution_details` TEXT NULL,
    `satisfaction_score` TINYINT NULL CHECK (`satisfaction_score` BETWEEN 1 AND 5),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
    FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`id`),
    FOREIGN KEY (`priority_id`) REFERENCES `priorities`(`id`),
    FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`),
    FOREIGN KEY (`assigned_tech_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 9. COMENTARIOS Y NOTAS INTERNAS
CREATE TABLE `ticket_comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment` TEXT NOT NULL,
    `is_internal` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 10. ADJUNTOS Y EVIDENCIAS
CREATE TABLE `ticket_attachments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `uploaded_by` INT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size_kb` INT NOT NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 11. HISTORIAL Y TRAZABILIDAD DE TICKETS
CREATE TABLE `ticket_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `previous_state` VARCHAR(100) NULL,
    `new_state` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 12. LOGS DE AUDITORÍA Y SEGURIDAD
CREATE TABLE `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `event` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE `system_settings` (
    `setting_key` VARCHAR(50) PRIMARY KEY,
    `setting_value` TEXT NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('company_name', 'USAE'),
('app_title', 'USAE Helpdesk'),
('default_timezone', 'America/Mexico_City'),
('default_currency', 'MXN'),
('max_upload_size_mb', '10');
```

---

## 5. ESQUEMA DE BASE DE DATOS EN GOOGLE SHEETS (`USAE - Portal DB`)
* **ID de Hoja de Cálculo Principal (`defaultSpreadsheetId`):** `1Q9aCnyXUqoyLt_mZxnf0vXYJWq0Sumwlh2a00vue0uY`
* **URL de Web App (Apps Script):** `https://script.google.com/macros/s/AKfycbwdYa-EZtJo8Tf9bgnFtDQ2FZD9BKvDBJ60QvBnnctyGn-u46MNhQYPqEEDLu9ob_8/exec`
* **Logo Corporativo en Drive:** `https://lh3.googleusercontent.com/d/1AyIKn0Z1sCISbHDrVkAW3NDCWGET4UoS`

### 5.1. Pestaña `Users` (Con Registros Semilla y Auditoría Legal)
| email | name | passwordHash | salt | role | active | createdAt | createdBy | privacyAccepted | privacyAcceptedAt | termsAccepted | termsAcceptedAt | emailVerified | emailVerifiedAt | mustChangePassword | passwordChangedAt | resetIssuedAt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `admin@usae.mx` | Administrador | `frUm6+nZkVbFjk2mKfxnUhh6UPsk1WwUVV1QrO0tOyU=` | `5e11446a-5adf-4b66-8fe6-2ec0a61edcce` | `admin` | `true` | `2026-03-18T05:40:26.227Z` | | `true` | `2026-05-22T08:12:30.425Z` | `true` | `2026-05-22T08:12:30.425Z` | | | | | |
| `cliente@usae.mx` | Cliente Demo | `gvXIZKiGz1gVUcwP5suUBB3yqc3kA3iwIvoUE6rL22g=` | `46de79bc-cea4-479c-b17c-b7492ea9b525` | `client` | `TRUE` | `2026-03-18T05:40:26.227Z` | | | | | | | | | | |

### 5.2. Pestaña `Clients` (Con Registros Semilla)
| email | company | contactName | phone | planCode | address | notes | updatedAt | rfc | billingEmail | planStatus | planStart | planEnd |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cliente@usae.mx` | Empresa Demo | Cliente Demo | | `INF-ESENCIAL` | | Registro demo. | `2026-03-18T05:40:26.227Z` | | | | | |
| `admin@usae.mx` | | Administrador | | | | | `2026-03-18T05:43:43.681Z` | | `admin@usae.mx` | `ACTIVO` | | |

### 5.3. Pestaña `Payments` (Pasarela Mercado Pago y Transferencias SPEI)
Columnas exactas:
`paymentId` | `email` | `planCode` | `amountMXN` | `period` | `status` | `createdAt` | `updatedAt` | `mpPreferenceId` | `mpInitPoint` | `mpPaymentId` | `mpPaymentStatus` | `mpStatusDetail` | `paymentMethod` | `transferReference` | `transferConcept` | `bankName` | `clabe` | `accountHolder`
*(Regla de Negocio Portal: Los clientes solo pueden renovar o cambiar su plan pagando por Mercado Pago; el plan se activa/renueva automáticamente al ser confirmado el pago).*

### 5.4. Pestaña `Assets` (Activos Remotos y Auditoría de Ciberseguridad)
Columnas exactas:
`assetId` | `email` | `name` | `assetType` | `os` | `location` | `remoteTool` | `remoteId` | `firmwareVersion` | `lastSecurityAudit` | `notes` | `updatedAt`

### 5.5. Pestaña `Files` (Repositorio de Evidencias en Google Drive)
Columnas exactas:
`fileRecordId` | `email` | `title` | `category` | `driveUrl` | `driveFileId` | `ticketId` | `notes` | `createdAt`

### 5.6. Pestaña `catalog_service` (Feed Completo de Servicios, Precios y Cláusulas Contractuales)
| Código (`id`) | Categoría | Plan (`title`) | Precio (`price`) | Duración / Plazo | Horario / SLA | Alcance, Garantías y Condiciones Contractuales |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `INF-ESENCIAL` | TI / Infraestructura | Plan Esencial | `2000 MXN` *(Promocional código: $1,000 + IVA)* | 6 meses mínimo *(Promo: 2 meses)* | Horario laboral (Resp. crítica 8h) | Soporte remoto, mantenimiento mensual, monitoreo básico, respaldo, hasta 5 equipos. Cancelación con 30 días naturales. |
| `INF-EMPRESARIAL` | TI / Infraestructura | Plan Empresarial | `4500 MXN` *(Código contrato: $4,000 + IVA)* | 6 meses mínimo *(Contrato: 3 meses)* | Horario laboral (Resp. crítica 4h, normales 1 día hábil) | Todo lo del Plan Esencial + monitoreo continuo de red/equipos, administración de servidores Windows/Linux, **2 visitas presenciales al mes**, gestión de usuarios/respaldos/permisos, hasta 15 equipos registrados. |
| `INF-CORPORATIVO` | TI / Infraestructura | Plan Corporativo | `8500 MXN` *(Unificado: $12,000 MXN)* | 12 meses mínimo | `24/7` | Incluye empresarial + soporte 24/7, redes, multisucursal, hasta 40 equipos. |
| `DEV-BASICO` | Desarrollo Web | Plan Básico | `5000 MXN` *(Unificado código: $3,000 MXN)* | 7-10 días | Proyecto único | Sitio de una sola página (Landing page), integración WhatsApp y formulario, diseño responsive. **Pago:** 50% anticipo / 50% contra entrega. **Garantía:** 30 días por errores posteriores. Anticipo no reembolsable una vez iniciado. |
| `DEV-PRO` | Desarrollo Web | Plan Profesional | `12000 MXN` *(Unificado código: $8,000 MXN)* | 3-6 semanas | Proyecto único | Hasta 8 secciones, panel administrativo, Google Analytics, formularios avanzados, SEO básico y capacitación. **Pago:** 50% anticipo / 50% entrega. **Garantía:** 60 días técnica. |
| `SEC-BASICO` | Ciberseguridad | Plan Seguridad Básico | `3500 MXN` | 3 meses mínimo | Prioritario | Hardening, antimalware, revisión de accesos, escaneo mensual. |
| `SEC-TOTAL` | Ciberseguridad | Plan Protección Total | `7000 MXN` | 6 meses mínimo | `24/7` | Incluye básico + monitoreo continuo, auditorías y respuesta a incidentes. |
| `CUSTOM` | Servicios Personalizados | Consultoría / Proyecto a medida | `A cotización` | Variable | Según proyecto | Levantamiento de requerimientos, propuesta técnica, implementación por fases, capacitación y soporte. NDA disponible bajo solicitud. |

---

## 6. IMPLEMENTACIÓN DE CÓDIGO FUENTE (PHP 8.2+ & GOOGLE APPS SCRIPT)

### 6.1. Backend PHP — Configuración Global (`config/app.php`)
```php
<?php
date_default_timezone_set('America/Mexico_City');

return [
    'app_name' => 'USAE Helpdesk',
    'company' => 'USAE',
    'timezone' => 'America/Mexico_City',
    'currency' => 'MXN',
    'language' => 'es_MX',
    'upload_max_bytes' => 10485760, // 10 MB
    'allowed_file_types' => ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'zip', 'txt']
];
```

### 6.2. Backend PHP — Conexión Segura PDO (`config/database.php`)
```php
<?php
class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $db   = getenv('DB_NAME') ?: 'usae_helpdesk_db';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $charset = 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            die("No fue posible completar la operación. Intente nuevamente.");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance->pdo;
    }
}
```

### 6.3. Backend PHP — Controlador de Autenticación (`app/Controllers/AuthController.php`)
```php
<?php
require_once __DIR__ . '/../Models/User.php';

class AuthController {
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';

            $userModel = new User();
            $user = $userModel->findByEmail($email);

            if ($user && password_verify($password, $user['password_hash'])) {
                if ($user['is_active'] != 1) {
                    return ['success' => false, 'message' => 'La cuenta se encuentra inactiva.'];
                }

                session_start();
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role_id'] = $user['role_id'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['last_activity'] = time();

                header('Location: /dashboard');
                exit;
            } else {
                return ['success' => false, 'message' => 'Credenciales inválidas. Verifique sus datos.'];
            }
        }
    }

    public function logout() {
        session_start();
        session_unset();
        session_destroy();
        header('Location: /login');
        exit;
    }
}
```

### 6.4. Backend PHP — Modelo de Tickets, Folios Atómicos y SLA (`app/Models/Ticket.php`)
```php
<?php
require_once __DIR__ . '/../../config/database.php';

class Ticket {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function createTicket($data) {
        try {
            $this->db->beginTransaction();

            $year = date('Y');
            
            // Bloqueo pesimista para garantizar unicidad de folio anual (USAE-YYYY-XXXXXX)
            $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM tickets WHERE YEAR(created_at) = :year FOR UPDATE");
            $stmt->execute(['year' => $year]);
            $count = $stmt->fetch()['total'] + 1;
            
            $folio = sprintf("USAE-%s-%06d", $year, $count);

            // Cálculo automático de vencimientos SLA según prioridad
            $stmtSla = $this->db->prepare("SELECT response_time_minutes, resolution_time_minutes FROM priorities WHERE id = :id");
            $stmtSla->execute(['id' => $data['priority_id']]);
            $sla = $stmtSla->fetch();

            $now = new DateTime();
            $dueResponse = (clone $now)->modify("+{$sla['response_time_minutes']} minutes")->format('Y-m-d H:i:s');
            $dueResolution = (clone $now)->modify("+{$sla['resolution_time_minutes']} minutes")->format('Y-m-d H:i:s');

            $sql = "INSERT INTO tickets 
                (folio, user_id, department_id, category_id, subcategory_id, equipment_id, subject, description, priority_id, status_id, sla_due_response, sla_due_resolution, created_at) 
                VALUES 
                (:folio, :user_id, :department_id, :category_id, :subcategory_id, :equipment_id, :subject, :description, :priority_id, 1, :sla_response, :sla_resolution, NOW())";

            $stmtInsert = $this->db->prepare($sql);
            $stmtInsert->execute([
                'folio'          => $folio,
                'user_id'        => $data['user_id'],
                'department_id'  => $data['department_id'],
                'category_id'    => $data['category_id'],
                'subcategory_id' => $data['subcategory_id'] ?? null,
                'equipment_id'   => $data['equipment_id'] ?? null,
                'subject'        => $data['subject'],
                'description'    => $data['description'],
                'priority_id'    => $data['priority_id'],
                'sla_response'   => $dueResponse,
                'sla_resolution' => $dueResolution
            ]);

            $ticketId = $this->db->lastInsertId();

            // Registro de Auditoría en ticket_history
            $stmtHist = $this->db->prepare("INSERT INTO ticket_history (ticket_id, user_id, action, new_state) VALUES (:ticket_id, :user_id, 'TICKET_CREADO', 'NUEVO')");
            $stmtHist->execute(['ticket_id' => $ticketId, 'user_id' => $data['user_id']]);

            $this->db->commit();
            return ['success' => true, 'ticket_id' => $ticketId, 'folio' => $folio];

        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Error al crear ticket: " . $e->getMessage());
            return ['success' => false, 'message' => 'No fue posible completar la operación. Intente nuevamente.'];
        }
    }
}
```

### 6.5. Backend Google Apps Script — Enrutador, LockService, Webhooks y Extractor Drive (`main.gs`)
```javascript
const APP_ = {
  name: 'USAE',
  version: '0.1.1',
  tokenStorageKey: 'USAE_PORTAL_TOKEN',
  cacheSeconds: 60,
  baseUrl: 'https://script.google.com/macros/s/AKfycbwdYa-EZtJo8Tf9bgnFtDQ2FZD9BKvDBJ60QvBnnctyGn-u46MNhQYPqEEDLu9ob_8/exec',
};

const DB_ = {
  spreadsheetPropKey: '1Q9aCnyXUqoyLt_mZxnf0vXYJWq0Sumwlh2a00vue0uY',
  spreadsheetName: 'USAE - Portal DB',
  defaultSpreadsheetId: '1Q9aCnyXUqoyLt_mZxnf0vXYJWq0Sumwlh2a00vue0uY',
  sheets: {
    Users: ['email', 'name', 'passwordHash', 'salt', 'role', 'active', 'createdAt', 'createdBy', 'privacyAccepted', 'privacyAcceptedAt', 'termsAccepted', 'termsAcceptedAt', 'emailVerified', 'emailVerifiedAt', 'mustChangePassword', 'passwordChangedAt', 'resetIssuedAt'],
    Clients: ['email', 'company', 'contactName', 'phone', 'planCode', 'address', 'notes', 'updatedAt', 'rfc', 'billingEmail', 'planStatus', 'planStart', 'planEnd'],
    Payments: ['paymentId', 'email', 'planCode', 'amountMXN', 'period', 'status', 'createdAt', 'updatedAt', 'mpPreferenceId', 'mpInitPoint', 'mpPaymentId', 'mpPaymentStatus', 'mpStatusDetail', 'paymentMethod', 'transferReference', 'transferConcept', 'bankName', 'clabe', 'accountHolder'],
    Assets: ['assetId', 'email', 'name', 'assetType', 'os', 'location', 'remoteTool', 'remoteId', 'firmwareVersion', 'lastSecurityAudit', 'notes', 'updatedAt'],
    Files: ['fileRecordId', 'email', 'title', 'category', 'driveUrl', 'driveFileId', 'ticketId', 'notes', 'createdAt']
  }
};

function app_getClientConfig_() {
  return {
    name: APP_.name,
    version: APP_.version,
    tokenStorageKey: APP_.tokenStorageKey,
    baseUrl: APP_.baseUrl,
  };
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  const rawPage = e && e.parameter && e.parameter.page ? String(e.parameter.page) : 'index';
  const page = rawPage === 'itfirm' ? 'index' : rawPage;
  const allowedPages = ['index', 'contacto', 'login', 'dashboard', 'tickets', 'planes'];
  const view = allowedPages.indexOf(page) >= 0 ? page : 'index';

  const titles = {
    index: 'Inicio',
    login: 'Iniciar sesión',
    dashboard: 'Panel',
    tickets: 'Tickets',
    planes: 'Planes',
    contacto: 'Contacto',
  };

  const template = HtmlService.createTemplateFromFile(view);
  template.app = app_getClientConfig_();
  template.catalog = catalog_get();

  return template
    .evaluate()
    .setTitle(`${APP_.name} - ${titles[view] || 'Inicio'}`)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const hook = e && e.parameter && e.parameter.hook ? String(e.parameter.hook) : '';
  if (hook === 'mp') {
    const result = payments_handleMercadoPagoWebhook(e);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

// Upsert con bloqueo de concurrencia (LockService)
function db_upsertObject_(sheetName, keyField, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = db_getSheet_(sheetName);
    const headers = DB_.sheets[sheetName];
    const row = headers.map((h) => (h in obj ? obj[h] : ''));
    const keyValue = obj[keyField];
    const rowIndex = db_findRowIndexByField_(sheet, keyField, keyValue);
    if (rowIndex < 0) {
      sheet.appendRow(row);
    } else {
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
    }
  } finally {
    lock.releaseLock();
  }
}

// Extractor robusto de ID de archivo de Google Drive desde URL
function extractDriveFileId_(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  const dMatch = u.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch && dMatch[1]) return dMatch[1];

  const idMarker = 'id=';
  const idIdx = u.indexOf(idMarker);
  if (idIdx >= 0) {
    const start = idIdx + idMarker.length;
    let end = u.length;
    ['&', '#', '/', '?'].forEach((delim) => {
      const i = u.indexOf(delim, start);
      if (i >= 0 && i < end) end = i;
    });
    const id = u.substring(start, end).trim();
    if (id.length >= 10) return id;
  }
  return '';
}

// Gestión de Activos por Cliente
function assets_listMine(token) {
  const session = auth_require_(token);
  const email = session.user.email;
  const sheet = db_getSheet_('Assets');
  const all = db_sheetToObjects_(sheet);
  return all
    .filter((a) => String(a.email || '').trim().toLowerCase() === email.toLowerCase())
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}
```

### 6.6. Frontend — Vista Institucional de Detalle de Ticket (`views/tickets/show.php`)
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalle Ticket - USAE Helpdesk</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
</head>
<body class="bg-light">

<nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">USAE Helpdesk</a>
        <span class="navbar-text text-white">
            Zona Horaria: America/Mexico_City | Moneda: MXN
        </span>
    </div>
</nav>

<div class="container my-4">
    <div class="row">
        <div class="col-lg-8">
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold" id="ticketFolio">Folio: USAE-2026-000001</h5>
                    <span class="badge bg-info text-dark fs-6" id="statusBadge">NUEVO</span>
                </div>
                <div class="card-body">
                    <h4 class="card-title" id="ticketSubject">Falla en controlador de red / PCI Device sin driver</h4>
                    <p class="text-muted small">
                        Solicitado por: <strong id="userName">Carlos Mendoza</strong> | Fecha: 2026-08-20 08:30:00
                    </p>
                    <hr>
                    <h6><strong>Descripción de la Incidencia:</strong></h6>
                    <p id="ticketDescription" class="card-text">
                        El equipo EQP-003 presenta conflicto de controladores en tarjeta PCI y pérdida de paquetes hacia el servidor central. Se requiere asistencia técnica en sitio.
                    </p>
                    <div class="mt-4">
                        <h6><strong>Evidencias Adjuntas:</strong></h6>
                        <ul class="list-group list-group-flush" id="attachmentsList">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <span><i class="bi bi-paperclip"></i> capturas_log_error.png (1.2 MB)</span>
                                <a href="#" class="btn btn-sm btn-outline-primary">Descargar</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white fw-bold">
                    <i class="bi bi-chat-left-dots"></i> Historial de Comentarios
                </div>
                <div class="card-body" id="commentsContainer">
                    <div class="p-3 mb-3 bg-white border rounded">
                        <div class="d-flex justify-content-between">
                            <strong>Mesa de Ayuda (Soporte TI)</strong>
                            <small class="text-muted">2026-08-20 08:45:00</small>
                        </div>
                        <p class="mb-0 text-secondary mt-1">Ticket recibido. Se asignó al área de Ciberseguridad e Infraestructura.</p>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <form id="commentForm">
                        <div class="mb-3">
                            <textarea class="form-control" rows="3" placeholder="Escriba un comentario o respuesta..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="bi bi-send"></i> Enviar Comentario</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white fw-bold">
                    Detalles de Atención & SLA
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Prioridad:</strong> <span class="badge bg-danger">CRÍTICA</span></li>
                    <li class="list-group-item"><strong>Departamento:</strong> Infraestructura & TI</li>
                    <li class="list-group-item"><strong>Equipo Afectado:</strong> EQP-003 (Lenovo ThinkPad T14)</li>
                    <li class="list-group-item"><strong>Técnico Asignado:</strong> No asignado</li>
                    <li class="list-group-item"><strong>Vencimiento Respuesta SLA:</strong><br><small class="text-danger fw-bold">2026-08-20 08:45:00 (15 min)</small></li>
                    <li class="list-group-item"><strong>Vencimiento Resolución SLA:</strong><br><small class="text-warning fw-bold">2026-08-20 10:30:00 (2 hrs)</small></li>
                </ul>
            </div>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### 6.7. Frontend Apps Script — Componentes de Catálogo, Login y Alertas (`views/*.html`)
```html
<!-- Renderizado de Planes y Reglas de Servicio (Tailwind CSS + FontAwesome) -->
<div class="lg:col-span-5">
  <div class="bg-blue-50 p-8 rounded-3xl border-2 border-blue-100">
    <h3 class="font-bold text-blue-900 text-xs uppercase tracking-wider mb-3">
      <i class="fas fa-info-circle mr-1" aria-hidden="true"></i> Importante
    </h3>
    <p class="text-slate-700 text-sm mb-6">
      Los clientes solo pueden renovar o cambiar su plan pagando por Mercado Pago. El plan se activa/renueva al ser confirmado el pago.
    </p>
    <button type="button" class="w-full bg-white text-blue-900 border border-blue-200 font-bold py-3 rounded-xl hover:bg-blue-100 transition text-sm focus:ring-2 focus:ring-blue-500" id="btnPlanRules">
      Ver reglas del servicio
    </button>
  </div>
</div>

<!-- Contenedor de Alertas de Login y Footer Dinámico -->
<div id="msg" class="hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"></div>
<footer class="py-6 text-center text-gray-400 text-sm bg-white border-t border-gray-100 font-medium">
  © <?= catalog.company.name ?> • v<?!= app.version ?>
</footer>
<a href="#inicio" class="fixed bottom-6 right-6 z-[90] bg-blue-900 text-white h-12 w-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-400" aria-label="Volver arriba">
  <i class="fa-solid fa-arrow-up" aria-hidden="true"></i>
</a>
<script>
  const APP = <?!= JSON.stringify(app) ?>;
  const tokenKey = APP.tokenStorageKey;
</script>
```

### 6.8. Plantilla HTML de Correo Corporativo (Header & Footer Responsivo)
```html
<!-- HEADER -->
<tr>
  <td align="center" style="background-color:#16345f; padding:35px 30px;">
    <img src="https://lh3.googleusercontent.com/d/1AyIKn0Z1sCISbHDrVkAW3NDCWGET4UoS" alt="USAE Helpdesk" width="300" style="display:block; margin:0 auto 20px auto; border:0;">
    <h1 style="margin:0; color:#ffffff; font-size:30px; font-weight:500; letter-spacing:-0.5px;">Tecnología Profesional para tu Negocio</h1>
    <p style="margin:15px 0 0 0; color:#b8d8ff; font-size:15px; line-height:1.6;">Soluciones modernas, soporte confiable y atención personalizada.</p>
  </td>
</tr>
<!-- FOOTER -->
<tr>
  <td align="center" style="background-color:#0f172a; padding:35px 30px;">
    <p style="margin:0; color:#ffffff; font-size:15px; font-weight:600;">USAE Helpdesk</p>
    <p style="margin:10px 0 0 0; color:#94a3b8; font-size:13px; line-height:1.7;">Soporte y Soluciones Tecnológicas<br>Cd. Nezahualcóyotl, Estado de México</p>
  </td>
</tr>
```

---

## 7. MAPA COMPLETO DE LAS 19 VISTAS Y 7 MÓDULOS FUNCIONALES

### 7.1. Las 19 Vistas / Módulos del Sitio Web
1. **Configuración Global:** `config/app.php` / `main.gs` (Parámetros regionales, moneda MXN, zona horaria).
2. **Gestión de Autenticación:** `AuthController.php` / Pantalla de Login con hashing seguro y sesiones de 6 horas.
3. **Administración de Usuarios:** `UserController.gs` / Gestión de empleados y clientes.
4. **Aviso de Privacidad y Términos:** Funciones públicas `auth_getPrivacyNotice`, `auth_getTermsAndConditions` y `auth_acceptLegalTerms` con timestamp (`privacyAcceptedAt`, `termsAcceptedAt`).
5. **Gestión de Esquemas:** DDL MySQL y sincronización resiliente de columnas (`db_ensureHeaders_`) en `USAE - Portal DB`.
6. **Catálogo de Servicios:** `CATALOG_` con planes mensuales, por proyecto y cotizaciones a medida.
7. **Enrutamiento de Peticiones:** `routes/web.php`, `routes/api.php` y manejador `doGet(e)` con vistas permitidas (`index`, `contacto`, `login`, `dashboard`, `tickets`, `planes`).
8. **Integración de Pasarelas y Endpoints:** Receptor `doPost(e)` con webhook Mercado Pago (`?hook=mp`) y respuestas JSON uniformes (`{ "success": true, "message": "...", "data": {} }`).
9. **Menú Personalizado e Interfaz de Administración:** Navegación lateral y barra superior responsive en Bootstrap 5.
10. **Dashboard Administrativo:** KPIs de tickets abiertos, nuevos, en proceso, resueltos, cerrados, vencidos por SLA, tiempos promedio y rendimiento por técnico.
11. **Gestión y Flujo de Tickets:** Vistas *Mis Tickets*, *Crear Ticket*, *Detalle del Ticket*, *Tickets Asignados* y *Todos los Tickets* bajo flujo estricto: `NUEVO → ASIGNADO → EN PROCESO → EN ESPERA → RESUELTO → CERRADO` (con opción de reapertura).
12. **Gestión de Inventario y Equipos:** Control de hardware (`equipments` / `Assets`) vinculado a los tickets.
13. **Motor de SLA, Prioridades y Tiempos:** Semáforos dinámicos por criticidad ($P1$ a $P4$).
14. **Seguimiento, Comentarios e Historial:** Notas públicas para cliente y notas internas (`is_internal = 1`) entre ingenieros.
15. **Notificaciones y Alertas:** Envío automatizado por correo y alertas internas por asignación, cambio de estado y vencimiento de SLA.
16. **Reportes, Exportación y Métricas:** Exportación a **Excel, CSV y PDF** con filtros por periodo, departamento, técnico y cumplimiento de SLA.
17. **Auditoría, Historial y Logs del Sistema:** Trazabilidad de acciones (`audit_logs`) e historial de errores en `logs/` sin exponer `SQLSTATE` al usuario.
18. **Arquitectura del Sistema:** Documentación viva del ecosistema MVC.
19. **Capacitación, Certificación y Plan de Inducción:** Repositorio de constancias Smart Campus y manuales de operación.

### 7.2. Cuaderno de Trabajo (Módulos Documentales 00–07 — v1.0, 27 de julio de 2026)
* **Módulo 00:** Índice de módulos funcionales (`Google Apps Script, Google Sheets y Google Drive`).
* **Módulo 01:** Asignación de Ingenieros (`01_Asignacion_de_Ingenieros_USAE_Helpdesk.docx`).
* **Módulo 02:** Seguimiento de Actividades (`02_Seguimiento_de_Actividades_USAE_Helpdesk.docx`).
* **Módulo 03:** Carga de Evidencias Google Drive (`03_Carga_de_Evidencias_Google_Drive_USAE_Helpdesk.docx`).
* **Módulo 04:** Cierre y Validación del Ticket (`04_Cierre_y_Validacion_del_Ticket_USAE_Helpdesk.docx`).
* **Módulo 05:** Programación de Mantenimientos (`05_Programacion_de_Mantenimientos_USAE_Helpdesk.docx`).
* **Módulo 06:** Paneles por Tipo de Usuario (`06_Paneles_por_Tipo_de_Usuario_USAE_Helpdesk.docx`).
* **Módulo 07:** Reportes y Control de SLA (`07_Reportes_y_Control_de_SLA_USAE_Helpdesk.docx`).

---

## 8. REGLAS CONTRACTUALES B2B (AXTEL / ALESTRA), CERTIFICACIÓN SMART CAMPUS E INDUCCIÓN

### 8.1. Cumplimiento Contractual y Protección de Comisiones
1. **Certificación Obligatoria Smart Campus:** Es condición contractual indispensable que **al menos dos elementos del personal de USAE** acrediten la capacitación oficial en la plataforma *Smart Campus* (Axtel/Alestra) y cuenten con constancia escrita. Sin esta certificación, las ventas no generan comisiones y el contrato puede rescindirse.
2. **Registro Previo en CRM (Siebel / PEGA):** Ningún ejecutivo puede prospectar una cuenta corporativa sin registrarla previamente en el CRM y obtener autorización escrita por correo electrónico (*Venta Independiente*).
3. **Cuentas Restringidas (Exclusiones):** Prohibida la prospección independiente sin autorización expresa en Sector Gobierno, *Call Centers*, *Signature Client Groups* o cuentas registradas por otro canal en los últimos 3 meses.
4. **Esquema de Ingresos, Bonos y Retenciones:**
   * Comisión base del **10%** y bonos adicionales por desempeño/volumen mensual (hasta **+5% adicional** al superar metas de captación como 5 o más clientes nuevos/facturación mensual).
   * **Comisiones por Renovación:** Seguimiento obligatorio a los 12, 24 y 36 meses para asegurar prórrogas de contratos.
   * **Plazo de Reclamación y Retenciones:** Plazo máximo de **6 meses** para facturar/reclamar comisiones. Si un cliente cancela anticipadamente o cae en morosidad >3 meses, Axtel retiene o recupera la comisión.
5. **Confidencialidad (NDA):** Resguardo estricto de la información técnica y comercial hasta por **5 años** posteriores a la terminación del contrato.

### 8.2. Estructura del Equipo Operativo (Modelo 2 Líderes) & Plan de Inducción (4 Módulos)
* **Director Comercial & Relaciones B2B (Front-Office Lead):** Prospección B2B, registro en CRM Siebel/PEGA, presentación del catálogo de planes USAE, gestión de contratos y seguimiento de renovaciones.
* **Director Técnico & Operaciones TI (Back-Office Lead):** Administración del sistema USAE Helpdesk, soporte $N1$/$N2$/$N3$, diagnóstico de activos (`EQP-001`..`EQP-005`), ciberseguridad y cumplimiento de SLAs.
* **Plan de Inducción Interna (4 Módulos):**
  1. *Módulo 1 — Organización, Roles ($N1, N2, N3$), RBAC, NDA y Auditoría (`audit_logs`).*
  2. *Módulo 2 — Certificación Smart Campus, Prospección CRM (Siebel/PEGA) y Protección de Comisiones.*
  3. *Módulo 3 — Operación del Helpdesk, Matriz de SLA ($P1$–$P4$), Folios Atómicos y Vinculación de Activos (`EQP-XXX`).*
  4. *Módulo 4 — Checklist de Verificación, Evaluación de Permanencia Anual y Firmas de Conformidad.*

---

## 9. MATRIZ DE SLA, HOJA DE SERVICIO EN SITIO Y DIRECTRICES DE CIBERSEGURIDAD

### 9.1. Matriz Oficial de Niveles de Servicio (SLA)
| Nivel | Prioridad | Tiempo Máx. Respuesta | Tiempo Máx. Resolución | Color Indicador | Escalamiento |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | **CRÍTICA** | 15 minutos | 2 horas | `#dc3545` (Rojo) | Inmediato a Director Técnico / $N3$ |
| **P2** | **ALTA** | 30 minutos | 4 horas | `#fd7e14` (Naranja) | Supervisor / Ingeniero Senior $N2$ |
| **P3** | **MEDIA** | 2 horas | 8 horas | `#ffc107` (Amarillo) | Mesa de Ayuda / Técnico $N1$ |
| **P4** | **BAJA** | 4 horas | 24 horas | `#20c997` (Verde) | Programación estándar / Preventivo |

### 9.2. Formato de Hoja de Servicio en Sitio (Imprimible)
* **Encabezado:** Logo USAE (`https://lh3.googleusercontent.com/d/1AyIKn0Z1sCISbHDrVkAW3NDCWGET4UoS`) | Folio de Ticket (`USAE-YYYY-XXXXXX`) | Fecha y Hora de Llegada / Salida.
* **Datos del Cliente / Usuario:** Empresa / Departamento | Nombre del Solicitante | Correo | Teléfono.
* **Datos del Activo Atendido:** Código de Equipo (`EQP-XXX`) | Hostname | Marca/Modelo | Sistema Operativo | Estado Antivirus/Firewall.
* **Diagnóstico y Actividades Realizadas:** Descripción de la falla reportada, causa raíz identificada, acciones correctivas/preventivas ejecutadas y refacciones/licencias aplicadas.
* **Validación y Conformidad:** Encuesta rápida de satisfacción (1 a 5 estrellas), Nombre y Firma del Técnico USAE, y Nombre y Firma de Conformidad del Cliente.

### 9.3. Directrices de Ciberseguridad, Pruebas y Despliegue (OWASP)
1. **Contraseñas:** Uso exclusivo de `PASSWORD_ARGON2ID` o `PASSWORD_BCRYPT` (PHP) y hashing con `salt` único UUIDv4 (Apps Script).
2. **Protección de Archivos (`public/uploads/.htaccess`):**
   ```apache
   php_flag engine off
   RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps
   ```
3. **Manejo Seguro de Errores:** Nunca exponer errores SQL (`SQLSTATE`) al cliente; registrar internamente en `logs/` y mostrar únicamente: *"No fue posible completar la operación. Intente nuevamente."*
4. **Plan de Pruebas:**
   * *Concurrencia de Folios:* Verificar que transacciones simultáneas no dupliquen `USAE-2026-XXXXXX`.
   * *Vencimientos SLA:* Validar alertas automáticas al superar los umbrales de minutos por prioridad.
   * *Aislamiento RBAC:* Verificar que el rol `USUARIO` no acceda a rutas administrativas ni de reasignación.
5. **Prompt Maestro de Contexto para IA / ChatGPT:**
   ```markdown
   Actúa como Arquitecto de Software Senior y Desarrollador Full-Stack experto en PHP 8.2+, MySQL, Bootstrap 5, Google Apps Script y Arquitectura MVC. Tu objetivo es desarrollar, mantener y escalar el sistema web institucional "USAE Helpdesk" bajo zona horaria 'America/Mexico_City', moneda 'MXN', folios atómicos 'USAE-YYYY-XXXXXX', motor SLA (P1-P4) y vinculación de activos (EQP-XXX).
   ```

---

## 10. COMPILACIÓN DE INTERACCIONES Y REQUERIMIENTOS DEL CUADERNO
* **Sesión 1 — Arquitectura Base y Expedientes Excel:** Integración de `Control_Expedientes_Clientes.xlsx` (`CLI-001` Banorte Tech), `Control_Expedientes_Personal_TI.xlsx` (`EMP-001` Carlos Mendoza R.) y `Equipos.xlsx` (`EQP-001` a `EQP-005` con métricas `System Summary` y `Perfmon`) hacia la base de datos relacional `usae_helpdesk_db` (13 tablas) y proyecto MVC `usae-helpdesk/`.
* **Sesión 2 — Definición de Identidad (`SOUL.md`):** Consolidación del asistente como núcleo técnico y operativo de USAE Helpdesk con dominio de arquitectura, folios, activos y SLA.
* **Sesión 3 — Optimización Google Apps Script y Google Sheets (`Portal DB`):** Unificación de `APP_`, `DB_` (`1Q9aCnyXUqoyLt_mZxnf0vXYJWq0Sumwlh2a00vue0uY`), `CATALOG_`, webhooks de Mercado Pago (`doPost`), concurrencia (`LockService`), extractor de archivos Drive (`extractDriveFileId_`), auditoría legal en `Users` (`privacyAccepted`, `termsAccepted`) y ciberseguridad en `Assets` (`firmwareVersion`, `lastSecurityAudit`).
* **Sesión 4 — Mapa de 19 Vistas e Índice de Módulos 00–07:** Estructuración completa de las 19 vistas del sistema web, plantilla HTML de correo institucional y los 7 módulos documentales de operación en Google Workspace.
* **Sesión 5 — Manual Operativo B2B y Plan de Inducción (PDF):** Incorporación de reglas contractuales Axtel/Alestra, certificación obligatoria *Smart Campus* (mínimo 2 elementos), registro previo en CRM Siebel/PEGA, esquema de comisiones (10% base + hasta 5% bono + renovaciones a 12/24/36 meses), NDA a 5 años, hoja de servicio en sitio imprimible y plan de inducción en 4 módulos con firmas de conformidad.

---

# 11. ESPECIFICACIÓN MAESTRA PARA CONSTRUIR EL SITIO COMPLETO EN GOOGLE AI STUDIO

> **Instrucción principal para el generador:** Construye un producto web funcional de extremo a extremo llamado **USAE Helpdesk**, no una maqueta estática. Implementa frontend, backend, persistencia, autenticación, autorización, pagos, paneles, tickets, inventario, reportes y administración. Si el entorno de despliegue no proporciona alguno de estos servicios, crea una capa de integración configurable, documenta la variable requerida y muestra claramente que la integración está pendiente; nunca simules pagos aprobados ni guardes información sensible en el navegador.

## 11.1. Objetivo de producto y regla de acceso

El sitio tendrá dos grandes zonas:

1. **Sitio público comercial**, accesible sin iniciar sesión. Cualquier visitante podrá conocer USAE, los servicios, todos los planes, precios publicados, alcance, límites, duración, SLA, garantías, condiciones de pago, preguntas frecuentes y medios de contacto.
2. **Portal privado**, que exige autenticación para acceder al panel, consultar activos, ver tickets, documentos, pagos y datos de la cuenta.

Reglas obligatorias de acceso:

- Todos los usuarios deben iniciar sesión con correo/usuario y contraseña para entrar al panel privado.
- Un visitante sin cuenta puede consultar libremente el catálogo, comparar planes, registrarse, iniciar sesión y contactar a USAE.
- Un cliente autenticado sin plan activo puede ver su perfil, el catálogo completo, cotizaciones, historial de pagos y opciones para comprar/renovar; **no puede crear tickets ni solicitar atención cubierta por un plan**.
- Un cliente puede crear tickets cuando tenga un plan compatible, pagado, confirmado y vigente. El backend debe comprobarlo en cada solicitud, no confiar en botones ocultos del frontend.
- Un cliente cuyo plan haya vencido conserva acceso a su cuenta y al historial de tickets, pero no puede crear nuevos tickets hasta renovar o contratar otro plan.
- Los usuarios internos autorizados (administrador, supervisor y técnico) acceden según su rol y no requieren comprar un plan.
- La compra no crea una sesión privilegiada por sí sola. Después del pago el cliente debe autenticarse; si aún no tiene cuenta, primero debe completar el registro y verificar su correo.
- No permitir que el cliente se asigne a sí mismo un plan, modifique el estado de pago o cambie la fecha de vigencia desde el navegador.
- La interfaz debe explicar por qué una acción está bloqueada y ofrecer el camino correcto: iniciar sesión, completar registro, contratar/renovar o contactar a soporte.

### Matriz de permisos de alto nivel

| Función | Visitante | Cliente autenticado sin plan activo | Cliente con plan activo | Técnico | Supervisor | Administrador |
|---|---:|---:|---:|---:|---:|---:|
| Ver sitio y catálogo completo | Sí | Sí | Sí | Sí | Sí | Sí |
| Registrarse / iniciar sesión | Sí | Sí | Sí | Según política | Según política | Según política |
| Ver panel privado | No | Sí, limitado a cuenta/compra | Sí | Sí | Sí | Sí |
| Consultar sus tickets | No | Solo historial propio, si existe | Sí | Asignados/autorizados | Departamento/autorizados | Todos |
| Crear ticket de soporte | No | No | Sí, según cobertura | No como cliente | Según permiso explícito | Según permiso explícito |
| Ver activos propios | No | Sí, si están registrados | Sí | Asignados/autorizados | Departamento/autorizados | Todos |
| Gestionar usuarios y roles | No | No | No | No | Limitado | Sí |
| Gestionar planes/precios | No | No | No | No | No | Sí |
| Ver notas internas | No | No | No | En tickets autorizados | En ámbito autorizado | Sí |
| Ver auditoría global | No | No | No | No | Limitado | Sí |

Implementar RBAC en backend con denegación por defecto, validación de propiedad del recurso y separación estricta entre comentarios públicos e internos.

## 11.2. Experiencia pública: páginas y navegación

Crear un encabezado responsive con logo USAE, navegación clara y CTA visibles:

- Inicio
- Servicios
- Planes y precios
- Cómo funciona
- Nosotros
- Preguntas frecuentes
- Contacto
- Iniciar sesión
- **Contratar un plan**

La página de inicio debe comunicar: “Innovación y Tecnología para un Futuro Seguro”, soporte profesional, soluciones de TI, desarrollo web y ciberseguridad. Incluir llamadas a la acción para comparar planes, solicitar cotización y entrar al portal.

Páginas públicas requeridas:

1. **Inicio:** propuesta de valor, categorías de servicio, beneficios, proceso de contratación, planes destacados, preguntas frecuentes y contacto.
2. **Servicios:** TI e infraestructura, desarrollo web, ciberseguridad y consultoría personalizada.
3. **Planes y precios:** catálogo completo de la sección 5.6, con filtros por categoría, tarjetas comparables y detalle contractual desplegable. No ocultar condiciones relevantes.
4. **Detalle de plan:** precio, periodicidad o plazo, impuestos, cobertura, límites de equipos, SLA, exclusiones, garantías, forma de pago, cancelación y botón de contratación.
5. **Cómo funciona:** selección del plan, registro, pago, activación, acceso al portal, alta de activos, creación de tickets, seguimiento y cierre.
6. **Nosotros:** identidad USAE y ubicación operativa en Ciudad Nezahualcóyotl, Estado de México.
7. **FAQ:** compra, pagos, activación, renovación, vigencia, SLA, evidencias, soporte remoto/presencial y cancelaciones.
8. **Contacto:** correo y teléfonos oficiales, WhatsApp, formulario con consentimiento y horario de atención publicado. No prometer disponibilidad 24/7 salvo que el plan contratado lo incluya.
9. **Aviso de privacidad** y **Términos y condiciones:** visibles antes de enviar formularios y durante el registro/compra.

Datos oficiales:
- Marca: USAE / USAE Helpdesk.
- Lema: “Innovación y Tecnología para un Futuro Seguro”.
- Correo: soporte.helpdesk.usae@gmail.com.
- Teléfonos/WhatsApp: +52 55 5496 8308 y +52 56 5199 2916.
- Zona operativa: Ciudad Nezahualcóyotl, Estado de México, México.
- Idioma: español de México.
- Moneda: MXN.
- Zona horaria: America/Mexico_City.

## 11.3. Catálogo público completo de planes

Mostrar los ocho productos/servicios siguientes, sin omitir límites ni condiciones. Los importes se deben mantener en una tabla maestra editable por administración. La fuente original contiene importes de lista y referencias promocionales/contractuales diferentes; por ello, **no inventar cuál precio alternativo está vigente**. En el lanzamiento, el administrador debe confirmar el precio comercial autorizado, marcar si incluye IVA o si es “más IVA” y publicar un solo precio vigente por plan. Mientras no se confirme, mostrar el precio de referencia de catálogo y etiquetar claramente cualquier promoción como “sujeta a validación comercial”.

| Código | Plan | Precio de referencia del catálogo | Plazo / duración | Horario y SLA publicado | Alcance y condiciones |
|---|---|---:|---|---|---|
| INF-ESENCIAL | Plan Esencial | $2,000 MXN | 6 meses mínimo; referencia promocional: 2 meses | Horario laboral; respuesta crítica indicada en 8 h | Soporte remoto, mantenimiento mensual, monitoreo básico, respaldo y hasta 5 equipos. Cancelación con 30 días naturales. Referencia comercial alternativa: promoción $1,000 + IVA. |
| INF-EMPRESARIAL | Plan Empresarial | $4,500 MXN | 6 meses mínimo; referencia contractual alternativa: 3 meses | Horario laboral; respuesta crítica 4 h y normales 1 día hábil | Todo lo del Esencial, monitoreo continuo de red/equipos, administración de servidores Windows/Linux, 2 visitas presenciales al mes, gestión de usuarios, respaldos y permisos, hasta 15 equipos. Referencia contractual alternativa: $4,000 + IVA. |
| INF-CORPORATIVO | Plan Corporativo | $8,500 MXN | 12 meses mínimo | 24/7 | Incluye Empresarial, soporte 24/7, redes, multisucursal y hasta 40 equipos. La fuente también contiene referencia unificada de $12,000 MXN; confirmar precio antes de publicar. |
| DEV-BASICO | Plan Básico de Desarrollo Web | $5,000 MXN | 7–10 días; proyecto único | Proyecto único | Landing page de una sola página, integración WhatsApp, formulario y diseño responsive. Pago 50% anticipo / 50% contra entrega. Garantía de 30 días por errores posteriores. Anticipo no reembolsable una vez iniciado. Referencia alternativa del código: $3,000 MXN. |
| DEV-PRO | Plan Profesional de Desarrollo Web | $12,000 MXN | 3–6 semanas; proyecto único | Proyecto único | Hasta 8 secciones, panel administrativo, Google Analytics, formularios avanzados, SEO básico y capacitación. Pago 50% anticipo / 50% entrega. Garantía técnica de 60 días. Referencia alternativa del código: $8,000 MXN. |
| SEC-BASICO | Plan Seguridad Básico | $3,500 MXN | 3 meses mínimo | Prioritario | Hardening, antimalware, revisión de accesos y escaneo mensual. |
| SEC-TOTAL | Plan Protección Total | $7,000 MXN | 6 meses mínimo | 24/7 | Incluye Seguridad Básico, monitoreo continuo, auditorías y respuesta a incidentes. |
| CUSTOM | Consultoría / Proyecto a medida | A cotización | Variable | Según proyecto | Levantamiento de requerimientos, propuesta técnica, implementación por fases, capacitación y soporte. NDA disponible bajo solicitud. |

Cada tarjeta debe permitir:
- Ver descripción y alcance completo.
- Comparar límites y SLA.
- Consultar plazo mínimo, forma de pago, garantías y cancelación.
- Solicitar cotización (especialmente CUSTOM).
- Contratar o renovar.
- Descargar o consultar términos del plan.

**Reglas de transparencia comercial:**
- Mostrar si el precio es mensual, por periodo, por proyecto o cotización; no asumir periodicidad que el catálogo no especifica.
- Mostrar claramente “MXN” e indicar “más IVA” únicamente en planes/promociones cuya condición fuente lo establece o cuando administración lo confirme.
- No convertir un plazo mínimo en una renovación mensual automática sin consentimiento expreso.
- Registrar la versión del precio y condiciones aceptadas en cada compra.
- Las condiciones particulares de contrato firmado prevalecen sobre textos genéricos del sitio, previa revisión administrativa.

## 11.4. Registro, verificación y autenticación

Implementar los flujos completos:

### Registro de cliente
Campos mínimos:
- Nombre y apellidos del contacto.
- Correo electrónico (único).
- Teléfono.
- Razón social / nombre comercial.
- RFC (cuando corresponda a facturación).
- Contraseña y confirmación.
- Aceptación expresa de Aviso de Privacidad y Términos, con fecha, hora, versión e IP.
- Verificación de correo mediante token de un solo uso y expiración.

El registro crea una cuenta de cliente sin conceder un plan pagado. El cliente puede iniciar sesión y consultar su cuenta, pero el estado inicial del plan es `SIN_PLAN`.

### Inicio de sesión
- Login por correo y contraseña.
- Hash de contraseña con Argon2id preferente o bcrypt.
- Mensajes genéricos para no revelar si un correo existe.
- Limitación de intentos, enfriamiento progresivo y protección contra fuerza bruta.
- Regenerar ID de sesión al autenticar.
- Cookies `HttpOnly`, `Secure` y `SameSite`; protección CSRF.
- Expiración por inactividad y cierre de sesión seguro.
- Registro de último acceso y eventos de seguridad.
- Recuperación de contraseña con token aleatorio, de un solo uso, expiración corta y respuesta genérica.
- No enviar contraseñas por correo ni almacenarlas en texto plano.
- Forzar cambio de contraseña cuando administración lo marque.

### Estados de cuenta
`PENDIENTE_VERIFICACION`, `ACTIVA`, `SUSPENDIDA`, `BLOQUEADA`, `INACTIVA`.

### Estados de suscripción/plan
`SIN_PLAN`, `PENDIENTE_PAGO`, `PAGO_EN_REVISION`, `ACTIVO`, `VENCIDO`, `CANCELADO`, `SUSPENDIDO`, `REEMBOLSADO`.

La autenticación y la vigencia comercial son conceptos separados: una cuenta puede estar activa y no tener un plan vigente.

## 11.5. Compra, Mercado Pago y activación de planes

Implementar Mercado Pago como pasarela principal para compra, renovación y cambio de plan, respetando el esquema del documento maestro.

Flujo requerido:
1. Cliente inicia sesión y selecciona un plan.
2. Backend obtiene precio, vigencia y condiciones desde catálogo confiable.
3. Mostrar resumen: plan, importe, impuestos, periodo, plazo mínimo, alcance y términos.
4. Cliente confirma aceptación de términos comerciales.
5. Backend crea registro `Payments` con estado `PENDIENTE` y crea preferencia de Mercado Pago mediante credenciales guardadas en variables/secret manager.
6. Redirigir al `init_point` oficial devuelto por Mercado Pago.
7. Recibir webhook en endpoint dedicado `?hook=mp`.
8. Validar autenticidad del webhook según mecanismo oficial vigente, consultar el pago directamente a Mercado Pago y verificar importe, moneda, referencia, cuenta y estado.
9. Procesar idempotentemente: el mismo evento/pago no puede activar dos veces ni duplicar periodos.
10. Solo cuando el backend confirme que el pago está aprobado, cambiar pago a `APROBADO` y activar/renovar el plan.
11. Guardar `mpPreferenceId`, `mpInitPoint`, `mpPaymentId`, `mpPaymentStatus`, `mpStatusDetail`, fechas, importe, moneda y usuario.
12. Enviar confirmación al cliente y registrar auditoría.

Nunca activar un plan por regresar a una URL de “éxito”; la confirmación autoritativa es el webhook validado y la consulta servidor-a-servidor.

### Transferencia SPEI
La hoja `Payments` contempla datos de transferencia (referencia, concepto, banco, CLABE y titular). Si se habilita este medio:
- El pago debe quedar `PAGO_EN_REVISION`.
- No activar el plan automáticamente por una captura o comprobante.
- Un administrador autorizado debe verificar el abono y aprobarlo.
- Guardar quién aprobó, cuándo y evidencia.
- No mostrar CLABE ni datos bancarios sensibles públicamente; presentarlos solo en el flujo seguro de pago y tras autorización.

### Renovaciones, cambios y vencimientos
- Registrar inicio y fin de cada periodo.
- Definir política de prorrateo y cambio de plan como parámetro comercial explícito; no inventarla.
- Notificar antes del vencimiento y al vencer.
- Si el pago de renovación no se confirma, el plan pasa a `VENCIDO` al llegar la fecha final.
- Mantener historial de suscripciones y pagos, incluso si el cliente cambia de plan.
- Permitir descargar recibos/comprobantes disponibles. No afirmar que el sistema emite CFDI si no existe integración fiscal real.

## 11.6. Portal del cliente

El portal autenticado del cliente debe incluir:

- Resumen de cuenta y empresa.
- Plan actual, estado, fecha de inicio y vencimiento.
- Cobertura y límites del plan.
- Avisos de renovación y pago.
- Botón de comprar/renovar/cambiar plan.
- Historial de pagos y transacciones.
- Mis tickets, detalle, comentarios públicos y adjuntos.
- Mis activos/equipos registrados.
- Evidencias y archivos propios.
- Datos de contacto y facturación.
- Aviso de privacidad y términos aceptados.
- Centro de ayuda y contacto.

Si no hay plan activo, el portal debe seguir siendo útil: mostrar el catálogo, el estado “Sin plan activo”, el historial de tickets permitido, pagos y el CTA para contratar. Bloquear solo las funciones sujetas a cobertura, especialmente la creación de nuevos tickets.

## 11.7. Sistema integral de tickets

### Crear ticket
Solo cliente autenticado con plan vigente y cobertura compatible podrá crear un ticket. El formulario debe capturar:
- Categoría y subcategoría.
- Asunto.
- Descripción detallada.
- Prioridad sugerida (el sistema puede recalibrarla según reglas).
- Activo afectado, si existe.
- Ubicación / modalidad remota o en sitio, según plan.
- Archivos adjuntos y evidencias.
- Consentimiento/confirmación de que la información enviada es correcta.

El backend debe validar propiedad del activo, vigencia del plan, límite de equipos, categoría cubierta, tamaño y tipo de archivo, y permisos. Si el plan no cubre el servicio, mostrar solicitud de cotización en lugar de crear un ticket cubierto.

### Folios
Formato: `USAE-YYYY-XXXXXX`. Generación transaccional y segura frente a concurrencia, con tabla de secuencias por año o mecanismo equivalente con restricción única. No utilizar `COUNT(*) + 1` como único mecanismo de unicidad. En Apps Script, usar `LockService` y verificar la secuencia dentro del bloqueo.

### Flujo de estados
`NUEVO → ASIGNADO → EN PROCESO → EN ESPERA → RESUELTO → CERRADO`, con reapertura controlada y motivo obligatorio. Toda transición debe validar rol, estado anterior y reglas del flujo.

### Comentarios e historial
- Comentarios públicos visibles para cliente y personal autorizado.
- Notas internas solo visibles para personal técnico autorizado.
- Historial inmutable de asignaciones, cambios de prioridad, estados, SLA, archivos y acciones.
- El cliente nunca debe recibir notas internas ni metadatos privados.

### Cierre y validación
- Técnico registra diagnóstico, causa raíz, actividades, solución y tiempos.
- Cliente confirma resolución o solicita reapertura con motivo.
- Encuesta de satisfacción de 1 a 5.
- Generar hoja de servicio imprimible cuando aplique, con folio, cliente, activo, técnico, llegada/salida, actividades y firmas de conformidad.
- Registrar `resolved_at`, `closed_at`, `solution_time_minutes` y satisfacción.

## 11.8. Módulos operativos del cuaderno 00–07

Incorporar como funcionalidades del producto los módulos enumerados en el documento maestro. La descripción disponible del archivo fuente identifica sus objetivos y nombres; los procedimientos internos completos de cada DOCX no están incluidos en el Markdown recibido, por lo que el generador no debe inventar formatos o políticas no documentadas. Implementar las capacidades siguientes y dejar los campos operativos configurables:

### Módulo 00 — Índice de módulos funcionales
- Centro de documentación con enlaces a los módulos 01–07.
- Control de versión, fecha, responsable, estado y permisos.
- Acceso diferenciado para administrador, supervisor, técnico y cliente.
- Descarga de manuales autorizados y registro de consulta.

### Módulo 01 — Asignación de Ingenieros
- Bandeja de tickets nuevos y sin asignar.
- Asignación manual por supervisor y reglas opcionales por categoría, carga, especialidad y disponibilidad.
- Reasignación con motivo obligatorio.
- Registro de ingeniero responsable, nivel N1/N2/N3, fecha/hora y usuario que asigna.
- Escalamiento a supervisor o director técnico por prioridad/SLA.
- Vista de carga de trabajo por ingeniero.

### Módulo 02 — Seguimiento de Actividades
- Bitácora cronológica por ticket.
- Registro de actividad, responsable, fecha/hora, duración, resultado y siguiente paso.
- Separación entre comentario visible y nota interna.
- Temporizador/registro de tiempos, pausas y motivo de espera.
- Evidencia asociada a cada actividad.
- Trazabilidad completa y exportable.

### Módulo 03 — Carga de Evidencias Google Drive
- Adjuntar capturas, documentos, fotografías, logs y reportes.
- Integración con Google Drive mediante OAuth/credenciales de servidor.
- Guardar `driveFileId`, URL, propietario, categoría, ticket, fecha y permisos.
- Validar MIME real, extensión, tamaño máximo de 10 MB por archivo (configurable), antivirus/escaneo cuando exista servicio disponible.
- Evitar enlaces públicos por defecto; conceder acceso mínimo necesario.
- Descargar/visualizar solo si el usuario tiene permiso sobre el ticket o expediente.
- Registrar carga, consulta, sustitución y eliminación lógica.

### Módulo 04 — Cierre y Validación del Ticket
- Checklist de diagnóstico y resolución.
- Campos de solución, causa raíz, recomendaciones y actividades realizadas.
- Confirmación del cliente, encuesta de satisfacción y reapertura controlada.
- Hoja de servicio en sitio imprimible con firmas.
- Validación de que no se cierre un ticket sin los campos obligatorios definidos por administración.

### Módulo 05 — Programación de Mantenimientos
- Calendario de mantenimientos preventivos y correctivos.
- Programación por cliente, activo, técnico, sede, fecha y ventana horaria.
- Frecuencia configurable y relación con el plan contratado.
- Notificaciones previas, confirmación, reprogramación y cancelación con motivo.
- Checklist por tipo de mantenimiento y evidencia antes/después.
- Historial por activo y próxima fecha recomendada.
- Respetar el número de visitas incluidas en cada plan; el Empresarial incluye 2 visitas presenciales mensuales según el catálogo.

### Módulo 06 — Paneles por Tipo de Usuario
- Panel público/comercial para visitantes: catálogo, comparación, FAQ y contacto.
- Panel cliente: plan, pagos, tickets propios, activos, evidencias y mantenimientos autorizados.
- Panel técnico: tickets asignados, SLA, actividades, activos y agenda.
- Panel supervisor: cola departamental, asignaciones, escalamiento, cargas, cumplimiento y reportes.
- Panel administrador: KPIs globales, usuarios, clientes, planes, pagos, catálogo, configuración, auditoría e integraciones.
- Cada panel muestra exclusivamente datos permitidos por rol y pertenencia.

### Módulo 07 — Reportes y Control de SLA
- Reportes por fechas, cliente, plan, departamento, categoría, técnico, prioridad, estado y activo.
- Cumplimiento de SLA de primera respuesta y resolución.
- Tickets próximos a vencer, vencidos y pausados por causas autorizadas.
- Tiempos promedio, percentiles, reincidencias, volumen y satisfacción.
- Exportación CSV, Excel y PDF con filtros aplicados y marca temporal.
- Restringir datos personales y financieros según rol.

## 11.9. SLA, calendario hábil y escalamiento

Mantener la matriz de prioridad del documento:

| Nivel | Prioridad | Respuesta máxima | Resolución máxima | Escalamiento |
|---|---|---:|---:|---|
| P1 | CRÍTICA | 15 min | 2 h | Inmediato a Director Técnico / N3 |
| P2 | ALTA | 30 min | 4 h | Supervisor / Ingeniero Senior N2 |
| P3 | MEDIA | 2 h | 8 h | Mesa de Ayuda / Técnico N1 |
| P4 | BAJA | 4 h | 24 h | Programación estándar / preventivo |

Reglas de implementación:
- El documento define estos tiempos, pero también menciona horarios laborales para ciertos planes. Implementar calendario por plan, días festivos, horario, zona horaria y excepciones.
- No contar tiempo fuera de horario como tiempo hábil cuando el contrato así lo determine.
- El plan Corporativo y SEC-TOTAL indican 24/7; los demás deben respetar el horario contractual publicado.
- El motor debe calcular vencimientos y pausas con base en la política del plan, prioridad y calendario configurado.
- Mostrar temporizador y semáforo al personal; al cliente mostrar el compromiso de servicio aplicable sin revelar notas internas.
- Notificar antes del vencimiento, al vencer y al escalar.
- Guardar el cálculo aplicado al momento de crear el ticket para que cambios futuros de configuración no alteren retroactivamente el compromiso.

**Importante:** la matriz global P1–P4 y los tiempos específicos por plan pueden diferir. La regla efectiva debe ser la condición contractual del plan del cliente y la política de SLA versionada que se aplicó al ticket. Si hay ambigüedad, escalar a configuración administrativa y no prometer un tiempo que el contrato no respalde.

## 11.10. Inventario, clientes, personal y expedientes

Incorporar los expedientes descritos en las secciones 2.1–2.3 del documento:
- Activos EQP-001 a EQP-005 con hostname, usuario asignado, marca/modelo, sistema operativo, BIOS/UEFI, Secure Boot, CPU, RAM, GPU, almacenamiento, seguridad, diagnóstico Perfmon y estado.
- Expedientes de empleados EMP-001 en adelante con datos laborales, rol, departamento, modalidad, documentación administrativa, certificaciones, NDA, propiedad intelectual, políticas y teletrabajo.
- Expedientes de clientes CLI-001 en adelante con razón social, contactos, datos fiscales, RFC, régimen, uso CFDI, dirección, representante legal, contratos, MSA, SLA, anexos y carpeta documental.
- Los datos personales y documentos legales deben almacenarse con acceso restringido, cifrado y registro de consulta. No mostrar expedientes de empleados o documentos fiscales en páginas públicas.
- Los registros de ejemplo del documento son datos semilla/demostrativos y deben poder editarse; validar antes de tratarlos como clientes o usuarios reales.

## 11.11. Panel administrativo y configuración

El administrador podrá:
- Crear, editar, suspender y desactivar usuarios.
- Asignar roles y departamentos con bitácora.
- Gestionar clientes y expedientes.
- Crear/editar planes, precios, impuestos, plazos, límites, SLA y condiciones.
- Publicar/despublicar planes y promociones con fecha de vigencia.
- Consultar pagos, revisar transferencias y resolver incidencias.
- Gestionar tickets, categorías, subcategorías, prioridades, estados y calendario.
- Gestionar inventario, activos, asignaciones y auditorías de seguridad.
- Programar mantenimientos.
- Gestionar documentos, plantillas y avisos legales versionados.
- Consultar reportes y exportaciones.
- Configurar correo SMTP/IMAP, WhatsApp, Google Drive, Mercado Pago, Moodle e IA cuando existan credenciales.
- Consultar logs y auditoría sin exponer secretos.
- Configurar datos institucionales, horario, moneda, límites de carga y políticas de sesión.

## 11.12. Notificaciones y comunicaciones

Preparar plantillas responsive de correo corporativo con identidad visual USAE. Eventos mínimos:
- Verificación de correo.
- Bienvenida y alta de cuenta.
- Recuperación/cambio de contraseña.
- Compra iniciada, pago pendiente, pago aprobado, pago rechazado y reembolso.
- Activación, renovación y vencimiento de plan.
- Ticket creado, asignado, comentario público, cambio de estado, solicitud de información, resolución, cierre y reapertura.
- SLA próximo a vencer, vencido y escalado.
- Mantenimiento programado, recordatorio, cambio y cancelación.

Canales previstos: correo electrónico, alertas dentro del portal y WhatsApp. WhatsApp requiere integración oficial y consentimiento aplicable. No simular envíos si las credenciales no están configuradas.

## 11.13. Seguridad, privacidad y cumplimiento

Aplicar controles de seguridad de producción:
- HTTPS obligatorio.
- OWASP Top 10: validación de entrada, consultas preparadas, escape de salida, control de acceso, CSRF, XSS, SSRF, subida segura de archivos y gestión de secretos.
- Hash Argon2id o bcrypt; nunca almacenar contraseñas reversibles.
- Sesiones seguras, rotación de identificador, expiración y revocación.
- Rate limiting, protección contra enumeración de cuentas y fuerza bruta.
- RBAC y autorización por objeto (evitar IDOR).
- Cifrado en tránsito y, para datos sensibles, en reposo.
- Secretos de Mercado Pago, correo, Google y servicios externos solo en variables de entorno/secret manager.
- Auditoría de acceso, pagos, cambios de roles, acciones administrativas, archivos y cambios de plan.
- Backups cifrados, política de retención y pruebas de restauración.
- Aviso de privacidad y consentimiento informado; retención y eliminación conforme a política aplicable.
- Separar datos de producción, pruebas y demostración.
- Nunca usar hashes, salts, tokens ni credenciales semilla del documento como credenciales de producción. Rotar cualquier secreto que haya sido expuesto.
- No exponer stack traces, rutas internas, SQLSTATE, tokens, IDs de pago privados ni documentos de otros clientes.

## 11.14. Arquitectura y decisiones de implementación

El documento maestro contempla dos alternativas: PHP 8.2+/MySQL MVC y Google Apps Script/Google Sheets. Para evitar dos fuentes de verdad, el desarrollo debe seleccionar y documentar una arquitectura de producción:

**Arquitectura recomendada para el portal transaccional:** PHP 8.2+ con MySQL/InnoDB como fuente de verdad para usuarios, suscripciones, pagos, tickets, SLA, activos y auditoría. Google Workspace/Drive puede integrarse como servicio documental y Apps Script como automatización auxiliar, no como duplicado independiente de datos críticos.

Si se elige Google Apps Script + Sheets como backend inicial:
- Centralizar acceso en funciones de servidor.
- Usar LockService para operaciones concurrentes.
- Validar sesión, rol, propiedad y plan en cada función.
- Proteger hojas y Drive; nunca confiar en el frontend.
- Considerar límites de concurrencia, cuotas, escalabilidad y transacciones de Sheets.
- Diseñar migración posterior a MySQL sin cambiar los contratos API.

No mezclar simultáneamente ambas fuentes para la misma entidad sin reglas de sincronización, idempotencia, reconciliación y resolución de conflictos.

### Contratos API sugeridos
Usar respuestas JSON consistentes:
`{ "success": true, "message": "Operación realizada", "data": {} }`
y errores con código controlado:
`{ "success": false, "message": "No fue posible completar la operación.", "code": "OPERATION_FAILED" }`.

Endpoints lógicos mínimos:
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/catalog/plans`
- `GET /api/account`
- `GET /api/subscription`
- `POST /api/checkout`
- `POST /api/webhooks/mercadopago`
- `GET /api/payments`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/{id}`
- `POST /api/tickets/{id}/comments`
- `POST /api/tickets/{id}/attachments`
- `POST /api/tickets/{id}/close`
- `POST /api/tickets/{id}/reopen`
- `GET /api/assets`
- `GET /api/reports/*` (solo roles autorizados).

## 11.15. Diseño visual y accesibilidad

- Diseño institucional moderno, profesional, tecnológico y confiable.
- Usar el logo USAE proporcionado como identidad oficial; no sustituirlo por un logotipo inventado.
- Paleta base sugerida coherente con los ejemplos del documento: azul marino institucional, azul tecnológico, blanco y grises neutros; usar colores de prioridad únicamente para estados/SLA.
- Diseño responsive mobile-first, navegación accesible y formularios claros.
- Tipografía legible, contraste WCAG AA, foco visible, etiquetas y mensajes de error accesibles.
- Tablas con filtros, búsqueda, paginación y vistas móviles.
- Estados vacíos con instrucciones y CTA.
- Confirmaciones para acciones destructivas.
- Fechas en zona `America/Mexico_City`; importes en formato MXN.
- No incluir información de muestra como si fuera información real en producción.

## 11.16. Datos iniciales y migración

Crear migraciones versionadas para:
- Departamentos, roles, usuarios.
- Clientes y expedientes.
- Planes y versiones de precios/condiciones.
- Suscripciones y pagos.
- Categorías, subcategorías, prioridades, estados y políticas SLA.
- Tickets, comentarios, adjuntos, historial y auditoría.
- Equipos/activos, mantenimientos y evidencias.
- Configuración del sistema y plantillas.

Importar los datos semilla descritos en el documento solo en entorno de desarrollo o tras validación del propietario. No importar contraseñas/hash de ejemplo a producción. Proporcionar comandos de instalación, `.env.example`, migraciones y usuario administrador inicial creado mediante proceso seguro de setup.

## 11.17. Pruebas de aceptación obligatorias

No considerar terminado el producto hasta demostrar:

1. Un visitante puede consultar todos los planes y sus condiciones sin iniciar sesión.
2. Un visitante no puede acceder directamente a rutas privadas ni a endpoints privados.
3. Un usuario puede registrarse, verificar correo, iniciar sesión, cerrar sesión y recuperar contraseña.
4. Todos los usuarios deben autenticarse para entrar al panel.
5. Un cliente sin plan activo puede ver catálogo, cuenta y opciones de compra, pero el backend rechaza la creación de tickets.
6. Un cliente con pago aprobado y plan vigente puede crear tickets dentro de su cobertura.
7. Un pago pendiente, rechazado, cancelado o con webhook inválido nunca activa un plan.
8. Un webhook repetido no duplica la activación ni el periodo.
9. Un plan vencido impide nuevos tickets, pero conserva acceso al historial propio.
10. Un técnico ve solo tickets asignados/autorizados; un supervisor ve su ámbito; el administrador puede auditar todo.
11. Un cliente no puede consultar tickets, archivos, activos o pagos de otra empresa modificando IDs.
12. Las notas internas nunca aparecen en el portal del cliente ni en notificaciones externas.
13. Los folios no se duplican bajo concurrencia.
14. Los SLA respetan prioridad, calendario, zona horaria y plan aplicable.
15. Adjuntos no ejecutan código y no son públicos por defecto.
16. Los módulos 01–07 operan con trazabilidad y permisos.
17. Los reportes exportan únicamente información autorizada.
18. Se registra auditoría de operaciones sensibles.
19. La interfaz funciona en móvil, tablet y escritorio.
20. El sistema no muestra credenciales, secretos, errores internos ni datos personales de otros usuarios.

## 11.18. Entregables que debe generar el constructor

Solicitar al generador de Google AI Studio que entregue:
- Aplicación web completa, no solo prototipo visual.
- Código fuente organizado y comentado.
- Frontend público y portal privado.
- Backend/API con autenticación, RBAC y validaciones.
- Esquema y migraciones de base de datos.
- Integración Mercado Pago con webhook validado e idempotencia.
- Catálogo de planes editable y visible públicamente.
- Módulos de tickets, SLA, activos, evidencias, mantenimientos, reportes y auditoría.
- Plantillas de correo.
- `.env.example` sin secretos reales.
- Instrucciones paso a paso para instalación, configuración y despliegue.
- Lista de credenciales/servicios externos que el propietario debe configurar.
- Pruebas automatizadas y checklist de aceptación.
- Documentación de limitaciones y funcionalidades que dependan de credenciales o servicios externos.

**No declarar el sitio “listo para producción” mientras falten credenciales, validación de pagos, HTTPS, políticas legales revisadas, backups, pruebas de permisos y configuración de dominio.**

---

# 12. NOTAS DE INTEGRIDAD DE FUENTES Y PUNTOS QUE REQUIEREN VALIDACIÓN DEL PROPIETARIO

1. El documento maestro recibido contiene el inventario de equipos, expedientes resumidos, esquema MySQL, esquema de Google Sheets, catálogo de servicios, código de referencia, mapa de 19 vistas y los nombres/objetivos de los módulos documentales 00–07.
2. El documento recibido **enumera** los archivos DOCX de los módulos 01–07, pero no incluye el texto íntegro de esos documentos. Por tanto, esta compilación incorpora todas las funciones descritas y las convierte en requisitos implementables, sin atribuir al cuaderno procedimientos específicos que no aparecen en la fuente.
3. El catálogo contiene importes alternativos para INF-ESENCIAL, INF-EMPRESARIAL, INF-CORPORATIVO, DEV-BASICO y DEV-PRO. Antes de publicar campañas o activar cobros, el propietario debe confirmar precio vigente, impuestos, periodicidad y plazo contractual.
4. El documento combina MySQL/PHP y Google Sheets/Apps Script. La aplicación debe elegir una fuente de verdad para datos transaccionales y definir integraciones explícitas.
5. Los tiempos P1–P4 globales y los tiempos específicos indicados por algunos planes requieren una matriz contractual versionada para resolver qué SLA aplica a cada cliente.
6. Los datos de Banorte Tech, empleados y equipos se consideran registros de referencia del documento y requieren autorización/validación antes de cargarse en un entorno productivo.
7. Los ejemplos de hashes, salts, IDs, URLs y configuración presentes en el documento no deben tratarse como secretos de producción. Las credenciales reales deben configurarse fuera del código y rotarse cuando corresponda.

# 13. PROMPT FINAL DE EJECUCIÓN PARA GOOGLE AI STUDIO

Construye USAE Helpdesk conforme a todo este documento. Antes de escribir código, presenta un plan de implementación por fases y un mapa de rutas/pantallas; después implementa el sistema completo. Prioriza que el catálogo público muestre **todos** los planes y sus condiciones, y que el acceso privado esté protegido por autenticación y autorización del lado servidor. Ningún visitante puede entrar al panel ni crear tickets. Todos los usuarios deben iniciar sesión para entrar al panel. Los clientes solo pueden crear tickets si su plan está pagado, confirmado, vigente y cubre el servicio; los usuarios internos acceden conforme a su rol. Un cliente sin plan puede registrarse, iniciar sesión, consultar su cuenta, ver el catálogo, comprar un plan y consultar su historial, pero no abrir nuevos tickets hasta activar una suscripción válida. La activación se realiza únicamente tras confirmación de pago verificable del servidor. Implementa los módulos documentados, la matriz SLA, inventario, expedientes, mantenimiento, evidencias, reportes, auditoría, privacidad, responsive design y todas las pruebas de aceptación. No inventes precios, contratos, credenciales ni integraciones completadas. Si falta información, utiliza parámetros administrables y documenta la decisión pendiente. Entrega código, base de datos, instrucciones de despliegue y pruebas; no entregues solamente una maqueta.

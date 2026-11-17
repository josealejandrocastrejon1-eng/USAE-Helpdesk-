# USAE Helpdesk — Arquitectura, Plan por Fases, Rutas y Despliegue

> **Estado de madurez:** Sistema funcional de extremo a extremo en entorno local/desarrollo con base de datos relacional SQLite (`node:sqlite`), autenticación real, RBAC estricto y pasarela configurable. **No declarar listo para producción** hasta configurar las variables externas listadas en la sección 5, confirmar precios comerciales definitivos en el catálogo y habilitar HTTPS/respaldos cifrados.

---

## 1. Arquitectura de Fuente de Verdad Única

Para cumplir la Sección 11.14 (evitar dos fuentes de verdad conflictivas):
- **Fuente transaccional única:** Base de datos relacional **SQLite (`data/usae_helpdesk.db`)** operada mediante `node:sqlite` con modo `WAL`, llaves foráneas activas y migraciones versionadas (`schema_migrations`).
- **Backend API:** Node.js + Express (`server/app.ts` y `server.ts`) con sesiones `HttpOnly`, tokens CSRF, hashing `scrypt` con sal aleatoria por usuario, limitador de intentos, folios atómicos (`ticket_sequences` dentro de `BEGIN IMMEDIATE`) y almacenamiento privado de adjuntos fuera de carpetas públicas (`uploads/` servido solo vía endpoint autorizado `/api/attachments/:id/download`).
- **Adaptadores externos opcionales (`server/integrations.ts`):** Mercado Pago, SMTP, Google Drive (Módulo 03) y WhatsApp Business se conectan únicamente cuando existen credenciales reales en `.env`; cuando faltan, el sistema lo reporta con transparencia en el Panel de Integraciones y nunca simula un pago aprobado ni un envío externo.

---

## 2. Plan de Implementación por Fases

1. **Fase 1 — Fundamentos, Esquema SQL y Seguridad:** Migraciones relacionales, hashing `scrypt`, sesiones `HttpOnly`, CSRF, rate limiting, bloqueo progresivo y sanitización de errores.
2. **Fase 2 — Catálogo Comercial, Suscripciones y Pagos:** Tabla maestra editable `plans`, validación comercial transparente, flujo Mercado Pago con verificación HMAC + consulta S2S idempotente (`mp_payment_id` único), y flujo SPEI con revisión manual administrativa.
3. **Fase 3 — Motor SLA, Tickets y Módulos 00–07:** Folios atómicos `USAE-YYYY-XXXXXX`, calendario hábil vs 24/7 (`America/Mexico_City`), aislamiento de notas internas, evidencias protegidas (máx. 10 MB), mantenimientos, hoja de servicio imprimible y exportaciones autorizadas CSV/Excel/PDF.
4. **Fase 4 — Frontend Dual (Público Comercial + Portal Privado RBAC):** Sitio público accesible sin login + portales autenticados diferenciados para `USUARIO`, `TÉCNICO`, `SUPERVISOR` y `ADMINISTRADOR`.
5. **Fase 5 — Pruebas Automatizadas y Verificación Browser:** Suite `node:test` cubriendo los 20 criterios de aceptación de la Sección 11.17 y verificación en navegador desktop/móvil.

---

## 3. Mapa de Rutas y Pantallas

### Zona A — Sitio Público Comercial (Sin autenticación)
| Ruta / Vista | Propósito |
|---|---|
| `/` (`inicio`) | Propuesta de valor *"Innovación y Tecnología para un Futuro Seguro"*, pilares, planes destacados y CTAs |
| `/servicios` (`servicios`) | TI e Infraestructura, Desarrollo Web, Ciberseguridad y Consultoría a medida |
| `/planes` (`planes`) | Catálogo completo de los 8 planes en MXN, filtros, comparativa, detalle contractual y cotizaciones |
| `/como-funciona` (`como-funciona`) | Flujo paso a paso: selección, registro, pago, activación, activos, tickets y cierre |
| `/nosotros` (`nosotros`) | Identidad USAE, cobertura y sede operativa en Ciudad Nezahualcóyotl, Estado de México |
| `/faq` (`faq`) | Preguntas frecuentes sobre pagos, vigencia, SLA, cancelaciones, evidencias y soporte |
| `/contacto` (`contacto`) | Correo oficial, teléfonos/WhatsApp, horario publicado, formulario con consentimiento legal |
| `/auth` (`login`, `registro`, `verificar`, `recuperar`) | Inicio de sesión, registro con aceptación de Aviso/Términos + IP, verificación de correo y recuperación |

### Zona B — Portal Privado (Requiere sesión autenticada + RBAC)
| Ruta / Vista | Roles Permitidos | Alcance |
|---|---|---|
| `/portal` (`mi-portal`) | `USUARIO` (y personal si consulta vista general) | Resumen de cuenta, estado de suscripción (`SIN_PLAN` / `ACTIVO` / `VENCIDO`), checkout MP/SPEI, pagos, tickets propios, activos propios, mantenimientos y notificaciones |
| `/portal/tickets/:folio` (`ticket-detalle`) | Propietario o personal autorizado | Bitácora Módulo 02, comentarios públicos, notas internas (solo personal), adjuntos Módulo 03, cierre/encuesta/reapertura Módulo 04 y Hoja de Servicio imprimible |
| `/operacion` (`consola-operativa`) | `TÉCNICO`, `SUPERVISOR`, `ADMINISTRADOR` | Módulo 01 asignación/cargas, cola SLA, inventario `EQP`, Módulo 05 mantenimientos, Módulo 07 reportes/exportación y Módulo 00–07 documentos |
| `/admin` (`administracion`) | `ADMINISTRADOR` | Gestión de usuarios/roles, expedientes `CLI`/`EMP`, editor maestro de planes/precios, aprobación de pagos SPEI, calendario/festivos SLA, integraciones y `audit_logs` |

---

## 4. Instalación, Comandos y Pruebas

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Ejecutar servidor de desarrollo (puerto 3000)
npm run dev

# 4. Ejecutar pruebas automatizadas (lógica pura + API de aceptación 11.17)
npx --yes tsx --test src/utils/helpdesk.test.ts server/api.test.ts

# 5. Validar TypeScript y build de producción
npm run lint
npm run build
npm start
```

---

## 5. Credenciales Externas y Validaciones Pendientes para Producción

1. **Mercado Pago:** Configurar `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET`, apuntando el webhook a `https://tu-dominio.com/api/webhooks/mercadopago` (o `/?hook=mp`).
2. **Correo Transaccional (SMTP):** Configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` para envío real de verificación de correo, restablecimiento de contraseña y alertas SLA.
3. **Google Drive (Módulo 03) y WhatsApp Business:** Configurar `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID` y `WHATSAPP_TOKEN` si se requiere sincronización externa de evidencias y mensajería.
4. **Datos Bancarios SPEI y CFDI:** Definir `SPEI_CLABE` / banco en `.env` o en Configuración del Sistema. El sistema **no emite CFDI timbrado ante el SAT** sin un proveedor PAC externo.
5. **Confirmación Comercial de Catálogo (Sección 12.3):** El administrador debe confirmar desde el panel los importes definitivos (tarifas estándar vs referencias promocionales) y si incluyen o son más IVA antes de abrir cobros reales.
6. **Seguridad de Producción:** Establecer `NODE_ENV=production`, `ALLOW_DEMO_SEED=false`, rotar `SESSION_SECRET`, habilitar HTTPS/TLS en el proxy inverso, configurar respaldos cifrados de `data/usae_helpdesk.db` y `uploads/`, y crear el administrador inicial mediante el flujo seguro de configuración.

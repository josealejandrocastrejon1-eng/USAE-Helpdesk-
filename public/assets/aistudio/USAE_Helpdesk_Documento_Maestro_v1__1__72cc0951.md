# USAE HELPDESK

## Documento maestro de arquitectura, requisitos y despliegue

**Versión:** 1.0 --- Consolidación documental\
**Fecha de consolidación:** 13 de noviembre de 2026\
**Estado:** Borrador rector basado en la documentación disponible\
**Zona horaria de referencia:** `America/Mexico_City`\
**Moneda de referencia:** MXN\
**Codificación:** `utf8mb4`\
**Collation indicada en la fuente:** `utf8mb4_unicode_ci`

------------------------------------------------------------------------

## Control documental

  -------------------------------------------------------------------------
  Campo                               Definición
  ----------------------------------- -------------------------------------
  Sistema                             USAE Helpdesk

  Organización / marca                USAE

  Tipo de documento                   Especificación maestra técnica y
                                      funcional

  Fuente base                         `usae_helpdesk_master_spec (1).md`,
                                      archivos compartidos y referencias
                                      NotebookLM indicadas por el usuario

  Versión                             1.0

  Estado                              Consolidación inicial; requiere
                                      validación de decisiones pendientes

  Uso                                 Referencia central para análisis,
                                      desarrollo, pruebas y despliegue
  -------------------------------------------------------------------------

### Alcance y límites de esta versión

Este documento consolida el contenido que se pudo leer directamente en
la guía maestra compartida. Los dos enlaces de NotebookLM fueron
recibidos, pero no fue posible recuperar su contenido desde esta sesión.
Por tanto, no se les atribuyen requisitos ni decisiones que no hayan
podido verificarse.

Los archivos adicionales mencionados en la conversación (incluidos CRM,
catálogo CSV, código y logotipo) no estuvieron disponibles para lectura
directa en el entorno de consolidación. Deben incorporarse en una
revisión posterior. No se inventan registros de catálogo, campos ni
funcionalidades para cubrir esa ausencia.

Se distingue entre:

-   **Requisito de fuente:** aparece expresamente en la documentación
    disponible.
-   **Observación técnica:** problema o inconsistencia detectada en el
    código o esquema de referencia.
-   **Recomendación pendiente de aprobación:** mejora propuesta para
    llevar el sistema a un nivel apto para producción; no debe
    considerarse requisito aprobado hasta validación.

------------------------------------------------------------------------

# 1. Identidad, propósito y alcance

## 1.1 Identidad

El sistema se denomina **USAE Helpdesk** y se plantea como una
plataforma de gestión corporativa y soporte técnico para la marca USAE.

## 1.2 Propósito documentado

La guía base plantea un sistema para:

-   Gestionar solicitudes e incidencias de soporte.
-   Administrar usuarios y departamentos.
-   Clasificar incidencias mediante categorías y prioridades.
-   Controlar equipos y activos.
-   Registrar el historial de atención de tickets.
-   Calcular tiempos objetivo de respuesta y resolución (SLA).
-   Presentar paneles con métricas de soporte, control de activos y
    detalle de incidencias.
-   Integrar, según se requiera, Google Apps Script y Google Sheets.
-   Gestionar un catálogo que contempla soporte de infraestructura IT,
    mantenimiento de equipos de cómputo y redes, seguridad informática,
    y marcas de productos químicos y de limpieza, incluida ALCA Clean.

## 1.3 Alcance funcional identificado

  -----------------------------------------------------------------------
  Dominio                             Alcance documentado
  ----------------------------------- -----------------------------------
  Autenticación y usuarios            Usuarios, roles y departamentos

  Mesa de ayuda                       Creación y consulta de tickets

  Clasificación                       Categorías y prioridades

  SLA                                 Tiempo objetivo de respuesta y
                                      resolución

  Activos                             Registro básico de equipos

  Auditoría operativa                 Historial de tickets

  Panel de control                    Métricas de soporte y activos

  Catálogo                            Servicios de TI, redes, seguridad y
                                      productos/servicios de limpieza

  Integraciones                       Google Apps Script y Google Sheets,
                                      cuando se requiera
  -----------------------------------------------------------------------

## 1.4 Fuera de alcance confirmado

La fuente disponible no define con suficiente detalle: facturación,
compras, almacenes, nómina, CRM comercial completo, gestión de
contratos, portal de clientes multiempresa, aplicación móvil nativa ni
contabilidad. No deben darse por incluidos sin aprobación expresa.

------------------------------------------------------------------------

# 2. Parámetros y principios tecnológicos

  Parámetro                      Definición de la fuente
  ------------------------------ ------------------------------------
  Backend                        PHP 8.x
  Arquitectura                   MVC puro
  Acceso a datos                 PDO seguro
  Base de datos                  MySQL relacional
  Motor recomendado por el DDL   InnoDB
  Charset                        `utf8mb4`
  Collation                      `utf8mb4_unicode_ci`
  Frontend                       Bootstrap 5
  Iconografía                    Bootstrap Icons
  Zona horaria                   `America/Mexico_City`
  Moneda                         MXN
  Registro de errores            Bitácoras limpias en `logs/`
  Punto de entrada               `public/index.php`
  Integraciones contempladas     Google Apps Script y Google Sheets

## 2.1 Principios de implementación

1.  Mantener separación entre controladores, modelos, servicios,
    middleware y vistas.
2.  Utilizar consultas preparadas PDO y parámetros enlazados.
3.  No exponer mensajes internos, credenciales ni trazas al usuario
    final.
4.  Mantener las evidencias y archivos subidos fuera del acceso
    ejecutable público o aplicar controles equivalentes.
5.  Mantener consistencia de zona horaria en PHP, MySQL y procesos
    externos.
6.  Registrar acciones relevantes de tickets y operaciones
    administrativas.
7.  No introducir dependencias o servicios externos obligatorios sin
    documentar su función y configuración.

------------------------------------------------------------------------

# 3. Arquitectura de aplicación

## 3.1 Estructura de directorios de referencia

``` text
usae-helpdesk/
├── config/
│   ├── app.php
│   ├── database.php
│   └── constants.php
├── app/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   ├── TicketController.php
│   │   └── UserController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Ticket.php
│   │   ├── Equipment.php
│   │   └── SLA.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   └── CSRFMiddleware.php
│   └── Services/
│       ├── SLAService.php
│       ├── NotificationService.php
│       └── FileUploadService.php
├── routes/
│   ├── web.php
│   └── api.php
├── public/
│   ├── index.php
│   ├── assets/
│   └── uploads/
├── views/
│   ├── layouts/
│   ├── dashboard/
│   ├── tickets/
│   └── admin/
└── logs/
```

La estructura anterior es la propuesta original. La separación adicional
de vistas, rutas y servicios puede ampliarse conforme se incorporen
módulos aprobados.

## 3.2 Responsabilidades

-   **config/**: parámetros de aplicación, conexión y constantes.
-   **Controllers/**: reciben solicitudes, validan el flujo y coordinan
    modelos/servicios.
-   **Models/**: encapsulan persistencia y consultas de dominio.
-   **Middleware/**: autenticación, autorización y protección CSRF.
-   **Services/**: lógica transversal como SLA, notificaciones y carga
    de archivos.
-   **routes/**: definición de rutas web y API.
-   **public/**: único punto de entrada web y recursos públicos.
-   **views/**: presentación HTML.
-   **logs/**: registros restringidos de errores y eventos técnicos.

------------------------------------------------------------------------

# 4. Módulos funcionales

## 4.1 Autenticación y usuarios

La fuente contempla usuarios con nombre, correo electrónico, contraseña,
rol, departamento y fecha de creación.

**Funciones base identificadas:**

-   Registro administrativo de usuarios.
-   Asociación de usuario a un rol.
-   Asociación opcional a un departamento.
-   Acceso autenticado al sistema.

**Pendiente de especificación:** recuperación de contraseña, bloqueo por
intentos, MFA, invitaciones, baja lógica, políticas de contraseña y
cierre de sesiones.

## 4.2 Roles y permisos

La tabla `roles` contiene nombre único y descripción. La fuente menciona
`RoleMiddleware`, pero no proporciona una matriz de permisos ni los
roles concretos que deben existir.

**Recomendación pendiente de aprobación:** definir permisos por módulo y
acción (consultar, crear, asignar, editar, cerrar, reabrir,
administrar), evitando basar toda la autorización únicamente en nombres
de rol.

## 4.3 Departamentos

La tabla `departments` contiene un identificador y nombre único. Los
usuarios y tickets se relacionan con departamentos.

**Pendiente:** catálogo oficial de departamentos, responsables,
jerarquías y reglas de visibilidad entre departamentos.

## 4.4 Mesa de ayuda y tickets

La tabla `tickets` propuesta contiene:

-   Folio único.
-   Usuario solicitante.
-   Departamento.
-   Categoría.
-   Equipo relacionado, opcional.
-   Asunto y descripción.
-   Prioridad y estado.
-   Fecha límite de respuesta y resolución SLA.
-   Fecha de creación.

El ejemplo visual muestra una ficha de ticket con folio, estado, asunto,
solicitante, fecha, descripción, prioridad, departamento, equipo y
vencimientos SLA.

**Flujos mínimos sugeridos para especificación:** crear, consultar,
asignar, actualizar, registrar seguimiento, resolver y cerrar. La fuente
no define aún el catálogo completo de estados ni las reglas de
transición.

## 4.5 Prioridades y SLA

La tabla `priorities` define:

-   Nombre de prioridad.
-   `response_time_minutes`.
-   `resolution_time_minutes`.

La lógica de ejemplo calcula fechas límite sumando minutos a la
fecha/hora de creación.

El ejemplo visual usa prioridad "CRÍTICA", un objetivo de respuesta de
15 minutos y un objetivo de resolución de 2 horas. Es un ejemplo de
interfaz y no debe asumirse como política SLA general hasta su
aprobación.

**Pendiente:** catálogo oficial de prioridades, minutos para cada
prioridad, calendario hábil, días festivos, horario de servicio, pausas
de SLA, reglas de escalamiento y tratamiento de tickets fuera de
horario.

## 4.6 Equipos y activos

La tabla `equipments` contempla:

-   Código único.
-   Nombre.
-   Número de serie.
-   Estado, con valor por defecto `ACTIVO`.

La fuente plantea control de activos y asociación opcional de un equipo
a un ticket.

**Pendiente:** marca, modelo, tipo, ubicación, responsable, fecha de
adquisición, garantía, proveedor, mantenimiento, baja, documentos y
etiquetas patrimoniales.

## 4.7 Historial de tickets

La tabla `ticket_history` registra ticket, usuario, acción, nuevo estado
y fecha de creación. Se define borrado en cascada al eliminar el ticket.

**Recomendación pendiente:** conservar auditoría inmutable y evaluar si
los tickets deben cancelarse o archivarse en vez de eliminarse
físicamente, para no perder trazabilidad.

## 4.8 Catálogo de servicios

La guía identifica estos grupos:

-   Soporte de infraestructura IT.
-   Mantenimiento de equipos de cómputo.
-   Redes.
-   Seguridad informática.
-   Gestión de marcas de productos químicos y de limpieza, incluida ALCA
    Clean.

No se dispone en la guía leída de un catálogo detallado con SKU,
presentaciones, precios, unidades, existencias, fichas técnicas o reglas
comerciales. Esos datos deben extraerse del archivo de catálogo original
cuando esté accesible y validarse antes de integrarse.

------------------------------------------------------------------------

# 5. Modelo de datos relacional

## 5.1 Entidades identificadas

  Tabla              Propósito
  ------------------ ---------------------------------
  `roles`            Catálogo de roles
  `departments`      Catálogo de departamentos
  `users`            Usuarios del sistema
  `priorities`       Prioridades y tiempos SLA
  `equipments`       Equipos y activos
  `tickets`          Incidencias y solicitudes
  `ticket_history`   Historial de acciones y estados

## 5.2 DDL recibido como referencia

El siguiente esquema conserva la intención del DDL compartido. Antes de
ejecutarlo en producción deben atenderse las observaciones del apartado
5.3.

``` sql
CREATE DATABASE IF NOT EXISTS `usae_helpdesk_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `usae_helpdesk_db`;

CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `department_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`)
) ENGINE=InnoDB;

CREATE TABLE `priorities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `response_time_minutes` INT NOT NULL,
  `resolution_time_minutes` INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `equipments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `serial_number` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT 'ACTIVO'
) ENGINE=InnoDB;

CREATE TABLE `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `folio` VARCHAR(30) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `equipment_id` INT,
  `subject` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `priority_id` INT NOT NULL,
  `status_id` INT DEFAULT 1,
  `sla_due_response` DATETIME NOT NULL,
  `sla_due_resolution` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
  FOREIGN KEY (`priority_id`) REFERENCES `priorities`(`id`),
  FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`id`)
) ENGINE=InnoDB;

CREATE TABLE `ticket_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `new_state` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;
```

## 5.3 Hallazgos técnicos obligatorios antes de producción

1.  **Falta la tabla `categories`:** `tickets.category_id` es
    obligatorio, pero no existe una tabla ni una clave foránea que lo
    respalde en el DDL proporcionado.
2.  **Falta el catálogo de estados:** `status_id` está presente, pero no
    existe tabla `statuses` ni una definición formal de estados.
3.  **Clave foránea de categoría:** debe añadirse cuando se defina el
    catálogo de categorías.
4.  **Consistencia del folio:** no debe generarse mediante un `COUNT(*)`
    simple como mecanismo de concurrencia.
5.  **Bloqueo transaccional:** `SELECT COUNT(*) ... FOR UPDATE` no
    garantiza por sí solo una secuencia segura en todos los escenarios
    de concurrencia; debe utilizarse un contador anual bloqueable o una
    estrategia equivalente con restricción única y reintento controlado.
6.  **Integridad de SLA:** el código no comprueba que la prioridad
    exista antes de acceder a sus tiempos.
7.  **Manejo de excepciones:** el rollback debe ejecutarse solo si
    existe una transacción activa y el manejo debe contemplar errores de
    ejecución (`Throwable`) sin revelar detalles al usuario.
8.  **Eliminación y auditoría:** `ON DELETE CASCADE` elimina el
    historial si se borra el ticket; validar política de retención y
    auditoría.
9.  **Índices:** deben añadirse índices para consultas frecuentes por
    folio, estado, departamento, solicitante, prioridad, responsable y
    fechas.
10. **Restricciones:** validar rangos no negativos para minutos SLA y
    unicidad adecuada para catálogos.
11. **Fechas y zona horaria:** definir política única para
    almacenamiento y presentación de fechas.
12. **Campos operativos faltantes:** la fuente no incluye
    responsable/técnico asignado, fecha de primera respuesta, fecha de
    resolución, fecha de cierre ni marca de cumplimiento SLA. Su
    necesidad debe decidirse para que las métricas puedan calcularse de
    forma verificable.

------------------------------------------------------------------------

# 6. Reglas de negocio documentadas

## 6.1 Folio

Formato requerido por la guía:

`USAE-YYYY-XXXXXX`

Donde:

-   `USAE` es el prefijo fijo.
-   `YYYY` representa el año.
-   `XXXXXX` es una secuencia de seis dígitos.

El folio debe ser único. La guía solicita generación atómica.

**Decisión pendiente:** confirmar si la secuencia se reinicia cada año y
si el año corresponde a la fecha local de creación.

## 6.2 Cálculo SLA

El ejemplo de código obtiene los minutos de respuesta y resolución desde
la prioridad, toma la fecha/hora actual y calcula:

-   `sla_due_response`
-   `sla_due_resolution`

La implementación mostrada suma minutos naturales. No hay evidencia en
la fuente de calendario laboral ni pausas.

## 6.3 Historial

Al crear el ticket, el ejemplo registra:

-   Acción: `TICKET_CREADO`
-   Nuevo estado: `NUEVO`

La fecha se genera mediante el valor por defecto de la base de datos.

## 6.4 Estado inicial

El DDL asigna `status_id` por defecto a `1`; la vista de ejemplo
presenta el estado `NUEVO`. Debe confirmarse que el registro de estado
con ID 1 sea precisamente `NUEVO`.

------------------------------------------------------------------------

# 7. Backend PHP y acceso a datos

## 7.1 Conexión PDO recibida

La fuente utiliza variables de entorno:

-   `DB_HOST`
-   `DB_NAME`
-   `DB_USER`
-   `DB_PASS`

Y configura PDO con:

-   `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`
-   `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC`
-   `PDO::ATTR_EMULATE_PREPARES => false`

## 7.2 Recomendaciones de endurecimiento

-   No usar credenciales predeterminadas de `root` en producción.
-   No guardar secretos en el repositorio.
-   Configurar usuario MySQL con privilegios mínimos.
-   Mantener mensajes técnicos en logs privados y mensajes genéricos al
    usuario.
-   Configurar rotación y retención de logs.
-   Evitar `die()` dentro de la clase de conexión; propagar una
    excepción controlada al manejador central.
-   Configurar explícitamente zona horaria de PHP y conexión/base de
    datos.
-   Añadir pruebas de conexión y manejo de indisponibilidad.

## 7.3 Corrección de sintaxis detectada en el ejemplo

En el arreglo enviado a `execute()` aparece:

``` php
`department_id`  => $data['department_id'],
```

Los acentos graves no son válidos para declarar una clave de arreglo
PHP. La forma correcta es:

``` php
'department_id' => $data['department_id'],
```

Este documento identifica el defecto; no considera el fragmento original
listo para producción.

------------------------------------------------------------------------

# 8. Frontend e interfaz institucional

## 8.1 Tecnologías indicadas

-   Bootstrap 5.
-   Bootstrap Icons.
-   HTML responsivo.
-   Paneles de métricas de soporte.
-   Control de activos.
-   Vistas de detalle de incidencias.

## 8.2 Vista de detalle de ticket

La muestra de `views/tickets/show.php` presenta:

-   Barra superior con marca USAE Helpdesk.
-   Zona horaria y moneda.
-   Folio y estado.
-   Asunto.
-   Solicitante y fecha.
-   Descripción de incidencia.
-   Prioridad.
-   Departamento.
-   Equipo afectado.
-   Vencimiento SLA de respuesta.
-   Vencimiento SLA de resolución.

Los datos fijos del ejemplo (folio, persona, fechas, equipo y
descripción) son demostrativos y deben sustituirse por datos obtenidos
de la base de datos con escape de salida apropiado.

## 8.3 Pendientes de diseño

No están especificados en la fuente: paleta institucional exacta,
tipografía, navegación final, accesibilidad, estados vacíos,
validaciones visuales, diseño móvil detallado ni lineamientos de marca.
El logotipo compartido debe incorporarse una vez que el archivo esté
disponible para inspección.

------------------------------------------------------------------------

# 9. Seguridad y protección de datos

La guía menciona middleware de autenticación, roles y CSRF, así como
carga de archivos y protección de `uploads/`.

Para cerrar la especificación de producción se recomienda aprobar y
documentar:

-   Contraseñas almacenadas mediante `password_hash()` y verificadas con
    `password_verify()`.
-   Protección CSRF en operaciones que cambian datos.
-   Validación de autorización en servidor para cada recurso y acción.
-   Escape contextual de salida HTML.
-   Validación estricta de entradas y consultas preparadas.
-   Cookies de sesión `HttpOnly`, `Secure` bajo HTTPS y `SameSite`.
-   Regeneración del ID de sesión al autenticar.
-   Límites de tamaño y tipo de archivos; comprobación MIME real.
-   Nombres de archivo aleatorios y almacenamiento no ejecutable.
-   Protección contra acceso directo a logs y archivos privados.
-   HTTPS obligatorio en despliegue público.
-   Copias de seguridad cifradas y pruebas de restauración.
-   Política de retención y eliminación de datos.
-   Registro de eventos administrativos y accesos relevantes.

Estos puntos son recomendaciones de endurecimiento, no políticas ya
aprobadas en la fuente.

------------------------------------------------------------------------

# 10. Integraciones

## 10.1 Google Apps Script

La guía solicita que la arquitectura esté preparada para integración con
Google Apps Script según se requiera.

No define todavía endpoints, autenticación, eventos, cuotas,
sincronización ni dirección del flujo de datos.

## 10.2 Google Sheets

La guía menciona Google Sheets como posible apoyo de integración. Debe
decidirse si funcionará como:

-   Reporte/exportación.
-   Captura auxiliar.
-   Sincronización unidireccional.
-   Sincronización bidireccional.

**Recomendación:** conservar MySQL como fuente transaccional principal
si así se aprueba, y evitar que una hoja de cálculo modifique
directamente datos críticos sin autenticación, validación, trazabilidad
y control de conflictos.

------------------------------------------------------------------------

# 11. Dashboard, reportes e indicadores

La fuente requiere paneles orientados a métricas de soporte y control de
activos, pero no especifica fórmulas ni objetivos.

Indicadores candidatos sujetos a aprobación:

-   Tickets nuevos, abiertos, en proceso y cerrados.
-   Tickets por prioridad, categoría y departamento.
-   Tickets asignados por técnico.
-   Tiempo promedio de primera respuesta.
-   Tiempo promedio de resolución.
-   Porcentaje de cumplimiento SLA de respuesta y resolución.
-   Tickets vencidos y próximos a vencer.
-   Incidencias por equipo.
-   Activos por estado.

No se deben publicar indicadores SLA hasta definir qué evento marca la
primera respuesta, qué estados detienen el reloj y qué calendario
aplica.

------------------------------------------------------------------------

# 12. Despliegue y operación

## 12.1 Elementos requeridos por la arquitectura

-   PHP 8.x.
-   MySQL.
-   Servidor web configurado para que el document root apunte a
    `public/`.
-   Variables de entorno de conexión.
-   Directorio de logs restringido.
-   Directorio de evidencias protegido.
-   Recursos Bootstrap 5 y Bootstrap Icons.

## 12.2 Lista de preparación para producción

-   [ ] Configurar dominio y HTTPS.
-   [ ] Configurar PHP y extensiones requeridas por PDO MySQL.
-   [ ] Crear base de datos con charset/collation acordados.
-   [ ] Crear usuario de base de datos con privilegios mínimos.
-   [ ] Configurar variables de entorno.
-   [ ] Ejecutar migraciones revisadas.
-   [ ] Cargar catálogos iniciales aprobados.
-   [ ] Crear usuario administrador mediante procedimiento seguro.
-   [ ] Configurar permisos de logs y archivos.
-   [ ] Deshabilitar exposición pública de archivos privados.
-   [ ] Configurar respaldos automáticos.
-   [ ] Probar restauración.
-   [ ] Ejecutar pruebas funcionales y de seguridad.
-   [ ] Verificar folios bajo concurrencia.
-   [ ] Verificar cálculo SLA y zona horaria.
-   [ ] Documentar monitoreo y procedimiento de incidentes.

------------------------------------------------------------------------

# 13. Pruebas y criterios de aceptación

## 13.1 Pruebas funcionales mínimas

1.  Inicio y cierre de sesión.
2.  Control de acceso por rol.
3.  Alta, consulta y actualización de usuarios.
4.  Alta y consulta de departamentos.
5.  Creación de ticket con campos válidos.
6.  Rechazo de tickets con categoría/prioridad inexistentes.
7.  Generación de folio único, incluso con solicitudes simultáneas.
8.  Cálculo correcto de vencimientos SLA.
9.  Registro de historial al crear y modificar ticket.
10. Asociación opcional de equipo.
11. Consulta de tickets por filtros.
12. Protección de operaciones contra CSRF.
13. Carga segura de evidencias, si se habilita.
14. Exportación o integración con Google, cuando se implemente.

## 13.2 Criterios de aceptación

Una funcionalidad se considera aceptada cuando:

-   Cumple el requisito aprobado.
-   Persiste datos consistentes.
-   Respeta autenticación y autorización.
-   Registra los eventos de auditoría requeridos.
-   Presenta errores comprensibles sin filtrar información interna.
-   Tiene pruebas reproducibles.
-   Cuenta con documentación de operación cuando corresponda.

------------------------------------------------------------------------

# 14. Decisiones pendientes y registro de riesgos

  ---------------------------------------------------------------------------
  ID                Tema              Situación             Acción necesaria
  ----------------- ----------------- --------------------- -----------------
  D-01              NotebookLM        Contenido no          Incorporar
                                      recuperado            exportaciones o
                                                            texto de ambos
                                                            cuadernos

  D-02              Archivos          CRM, CSV, código y    Reincorporar y
                    auxiliares        logo no               validar esos
                                      inspeccionados en     archivos
                                      esta sesión           

  D-03              Categorías        `category_id` sin     Definir catálogo
                                      tabla referenciada    y relación

  D-04              Estados           `status_id` sin tabla Aprobar estados y
                                      catálogo              transiciones

  D-05              Roles             No existe matriz de   Definir roles y
                                      permisos              permisos

  D-06              SLA               Solo minutos          Definir
                                      naturales en ejemplo  calendario,
                                                            pausas y
                                                            escalamiento

  D-07              Folios            Algoritmo de ejemplo  Diseñar secuencia
                                      no es seguro ante     transaccional
                                      concurrencia          

  D-08              Asignación        No hay campo de       Confirmar modelo
                                      técnico asignado en   de asignación
                                      el DDL                

  D-09              Auditoría         Historial limitado a  Definir retención
                                      acción/estado         y detalle de
                                                            eventos

  D-10              Catálogo          Sin detalle de        Importar y
                    comercial         productos/servicios   validar catálogo
                                                            fuente

  D-11              Integraciones     Sin contratos API     Especificar
                                      definidos             autenticación y
                                                            flujos

  D-12              Despliegue        Infraestructura no    Seleccionar
                                      definida              hosting y
                                                            procedimiento
  ---------------------------------------------------------------------------

------------------------------------------------------------------------

# 15. Plan de trabajo recomendado

## Fase 1 --- Cierre de requisitos

-   Recuperar y revisar las dos fuentes NotebookLM.
-   Incorporar archivos CRM, catálogo CSV, código y logotipo.
-   Aprobar alcance, roles, estados, categorías y prioridades.
-   Definir reglas SLA.

## Fase 2 --- Diseño técnico

-   Cerrar modelo entidad-relación.
-   Corregir y versionar DDL/migraciones.
-   Definir contratos de rutas web y API.
-   Definir seguridad, auditoría y carga de archivos.

## Fase 3 --- Núcleo del sistema

-   Configuración y conexión PDO.
-   Autenticación y autorización.
-   Usuarios y departamentos.
-   Categorías, prioridades y estados.
-   Tickets, folios, SLA e historial.

## Fase 4 --- Operación y activos

-   Inventario de equipos.
-   Asignación y seguimiento.
-   Dashboard y reportes.
-   Catálogo de servicios.

## Fase 5 --- Integraciones y puesta en marcha

-   Google Apps Script/Sheets según alcance aprobado.
-   Pruebas de seguridad y concurrencia.
-   Respaldos y restauración.
-   Despliegue controlado y aceptación.

------------------------------------------------------------------------

# 16. Anexo A --- Referencia del generador de tickets

La guía original propone un método `createTicket($data)` que inicia una
transacción, calcula folio, consulta la prioridad, calcula vencimientos
SLA, inserta el ticket, registra el historial y confirma la transacción.

**Advertencia:** el fragmento de origen contiene un error de sintaxis en
la clave `department_id` y una estrategia de secuencia por conteo que no
debe considerarse atómica. Se conserva aquí la descripción funcional, no
como código listo para producción.

La implementación definitiva deberá:

1.  Validar todos los campos y relaciones.
2.  Confirmar que la prioridad existe y está activa.
3.  Obtener el siguiente folio mediante mecanismo concurrente seguro.
4.  Calcular fechas usando la política SLA aprobada.
5.  Insertar ticket e historial en una misma transacción.
6.  Confirmar la transacción solo si todas las operaciones terminan
    correctamente.
7.  Revertirla de forma segura ante cualquier error.
8.  Registrar detalles técnicos en logs privados y devolver un mensaje
    genérico.

------------------------------------------------------------------------

# 17. Anexo B --- Ejemplo de interfaz de ticket

La vista de referencia es `views/tickets/show.php` y utiliza Bootstrap
5.3.0 y Bootstrap Icons 1.11.0 mediante CDN. Presenta un ticket
demostrativo con folio `USAE-2026-000001`, estado `NUEVO`, prioridad
`CRÍTICA` y datos de ejemplo.

Los valores de muestra no constituyen datos reales ni políticas
generales. En la implementación deben renderizarse datos dinámicos
escapados, con control de acceso al ticket.

------------------------------------------------------------------------

# 18. Anexo C --- Fuentes y trazabilidad

  ------------------------------------------------------------------------------------
  Fuente                               Uso en este documento   Estado
  ------------------------------------ ----------------------- -----------------------
  `usae_helpdesk_master_spec (1).md`   Base de arquitectura,   Leída
                                       DDL, PHP y vista        

  Enlace NotebookLM 1                  Fuente complementaria   Recibido; contenido no
                                                               recuperado

  Enlace NotebookLM 2                  Fuente complementaria   Recibido; contenido no
                                                               recuperado

  USAE_HELPDESK_CRM                    Posible fuente CRM      Pendiente de inspección

  USAE                                 Material complementario Pendiente de inspección

  `catalog_service.csv`                Catálogo de servicios   Pendiente de inspección

  `Code`                               Código fuente adicional Pendiente de inspección

  `LOGO_USAE_HELPDESK.png`             Identidad visual        Pendiente de inspección
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Cierre

Esta versión establece una base documental única y trazable a partir del
material que pudo verificarse. No equivale todavía a una especificación
final aprobada para producción: las decisiones del apartado 14 y las
fuentes pendientes del apartado 18 deben cerrarse antes de congelar
arquitectura y construir el despliegue definitivo.

**Documento rector:** USAE Helpdesk --- Documento maestro de
arquitectura, requisitos y despliegue, versión 1.0.

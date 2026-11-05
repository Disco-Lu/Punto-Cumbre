# 🏔️ Punto Cumbre — Estado del Proyecto

**Fecha de corte:** 22 de Octubre de 2026  
**Metodología:** SDD (Specification-Driven Development)  
**Rol:** Agente Orquestador  

---

## 📌 1. Resumen Ejecutivo

El proyecto **Punto Cumbre** es una plataforma web para el **arriendo de equipamiento de montaña** y solicitud de servicios de reparación.

Hasta este punto, se ha completado en su totalidad la **Fase 0 (Análisis y Definición)** y la **Fase 1 (Especificación SDD)**.  
**No se ha escrito ni modificado código fuente de la aplicación** (FastAPI o Next.js); se han generado exclusivamente los artefactos de especificación que sirven como única fuente de la verdad (*Single Source of Truth*).

---

## 🏗️ 2. Arquitectura y Decisiones Técnicas Acordadas

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                   │
│          Tipos estricto vía openapi-typescript         │
│     Catálogo | Cotizador | Consulta | Panel Admin      │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                    │
│      Validación Pydantic | Lógica de Negocio | Auth    │
└───────────────────────────┬────────────────────────────┘
                            │ Conexión PostgreSQL directa
                            ▼
┌────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                 │
│         Base de datos relacional centralizada          │
└────────────────────────────────────────────────────────┘
```

1. **Arquitectura desacoplada y unificada:** El frontend se comunica **únicamente con FastAPI**. FastAPI es el único que interactúa con la base de datos PostgreSQL en Supabase.
2. **Supabase sin sobrecarga:** Se utilizará Supabase exclusivamente como motor PostgreSQL (sin depender de sus SDKs de cliente, Auth o Realtime en el frontend), preservando el principio SDD.
3. **Flujo de Arriendo:**
   - Cliente consulta disponibilidad por fechas (retiro y devolución).
   - Cliente genera solicitud de cotización automática (`precio_diario × cantidad × días`).
   - Cliente confirma la cotización → Se genera automáticamente la reserva en estado `pendiente`.
   - El cliente no requiere registrarse con contraseña: opera mediante datos de contacto (nombre, email, teléfono) y hace seguimiento con su email y código de rastreo.
4. **Ciclo de Vida de Reservas:**
   `Pendiente` ➔ `Confirmada` ➔ `En arriendo` ➔ `Devuelta`  
   *(Cualquiera de los estados activos puede transicionar a `Cancelada`).*
5. **Seguridad Admin (RNF 002):**
   Ruta oculta de administración protegida por login (usuario/contraseña con emisión de JWT Bearer Token).
6. **Servicios de Reparación:**
   Página informativa con formulario web para ingresar solicitudes de reparación de equipamiento.
7. **Notificaciones (HU11):**
   Canal dual: alerta visual / contador en dashboard administrativo y envío de correos electrónicos.

---

## 📁 3. Archivos Generados en el Repositorio

El workspace cuenta actualmente con la siguiente estructura de especificaciones:

```text
Punto cumbre/
│
├── .gitignore
├── ESTADO_PROYECTO.md                      <-- Este documento de seguimiento
│
├── docs/
│   └── specs/
│       └── gherkin/
│           └── features.md                 <-- 102 escenarios de prueba BDD (1,264 líneas)
│
└── specs/
    └── openapi.yaml                        <-- Contrato OpenAPI 3.1.0 formal (2,342 líneas)
```

---

## 🔍 4. Detalle de los Documentos de Especificación Creados

### A. Especificaciones Gherkin (`docs/specs/gherkin/features.md`)
Contiene **102 escenarios** redactados en sintaxis formal `Given / When / Then` en español, cubriendo rutas felices, validaciones y casos borde organizados en 7 módulos:

1. **Módulo Catálogo (HU01, HU02):** 13 escenarios. Navegación por categorías, fichas técnicas completas, manejo de estados vacíos y equipos sin imágenes.
2. **Módulo Disponibilidad (HU03):** 10 escenarios. Cálculo de stock disponible entre fechas, rangos inválidos, fechas en el pasado y solapamiento de arriendos.
3. **Módulo Cotización (HU04, HU05):** 14 escenarios. Cotizaciones unitarias y múltiples, fórmula matemática de cobro, validación de datos de contacto y expiración de cotizaciones.
4. **Módulo Reservas (HU10, HU12):** 18 escenarios. Consulta por código/email, máquina de estados completa y bloqueo estricto de transiciones inválidas (ej. no saltar de `pendiente` a `en arriendo`).
5. **Módulo Administración (HU07, HU08, HU09):** 30 escenarios. Login seguro en ruta oculta, CRUD de equipos, subida de imágenes, administración de categorías, vista de resumen en dashboard y ajuste de stock.
6. **Módulo Reparación (HU06):** 8 escenarios. Vista de información y envío de formulario de servicio técnico con validaciones de campos requeridos.
7. **Módulo Notificaciones (HU11):** 9 escenarios. Alertas en dashboard (contador/no leídas), marcado individual/masivo y disparadores de correo para nuevas cotizaciones y reparaciones.

### B. Contrato OpenAPI 3.1.0 (`specs/openapi.yaml`)
Especificación técnica rigurosa de **2,342 líneas**, compatible con `openapi-typescript` y generadores Pydantic:

- **Componentes y Entidades:**
  - `Category`: Categorización de equipos.
  - `Equipment`: Ficha técnica, precio por día, stock, condiciones y URL de imagen.
  - `Quote` & `QuoteItem`: Cabecera y detalle de cotización con cálculo de subtotales.
  - `Reservation`: Instancia de reserva con estados (`pendiente`, `confirmada`, `en_arriendo`, `devuelta`, `cancelada`).
  - `RepairRequest`: Solicitud de reparación y diagnóstico.
  - `AdminUser`: Credenciales y autenticación.
  - `Notification`: Alertas internas con referencia polimórfica.
  - `ErrorResponse` y schemas de validación HTTP estándar (400, 401, 403, 404, 422).
- **Seguridad:**
  - Esquema `AdminAuth` (Bearer JWT) aplicado a todas las rutas bajo `/api/v1/admin/*`.
- **Rutas Públicas:**
  - Catálogo (`GET /api/v1/categories`, `GET /api/v1/equipment`, `GET /api/v1/equipment/{id}`).
  - Disponibilidad (`GET /api/v1/equipment/{id}/availability`).
  - Cotizaciones (`POST /api/v1/quotes`, `GET /api/v1/quotes/{tracking_code}`, `POST /api/v1/quotes/{tracking_code}/confirm`).
  - Consulta de reservas (`GET /api/v1/reservations`, `GET /api/v1/reservations/{tracking_code}`).
  - Servicios de reparación (`GET /api/v1/repair-services`, `POST /api/v1/repair-requests`).
- **Rutas de Administración:**
  - Sesión (`POST /api/v1/admin/login`, `POST /api/v1/admin/logout`).
  - Equipos (`POST`, `PUT`, `DELETE /api/v1/admin/equipment/{id}`, `POST /upload-image`).
  - Categorías (`POST`, `PUT`, `DELETE /api/v1/admin/categories/{id}`).
  - Reservas y Dashboard (`GET /api/v1/admin/dashboard`, `PATCH /reservations/{id}/status`).
  - Notificaciones (`GET`, `PATCH /notifications/{id}/read`, `PATCH /read-all`).

---

## 🚦 5. Punto Exacto de Detención

El proyecto se encuentra al **100% en la fase de especificación y diseño del contrato**.  
**Próxima acción cuando decidas continuar:**
Comenzar la **Fase 2 (Estructuración de carpetas y dependencias de Frontend y Backend)** y la **Fase 3 (Generación automática de tipos TypeScript a partir de `specs/openapi.yaml`)**.

---

## 📋 6. Tabla de Control de Fases

| Fase | Descripción | Estado |
| :--- | :--- | :---: |
| **Fase 0** | Análisis de requerimientos funcionales y no funcionales | ✅ Completada |
| **Fase 1** | Especificaciones Gherkin (BDD) y Contrato OpenAPI 3.1 (SDD) | ✅ Completada |
| **Fase 2** | Scaffolding de proyectos (Next.js + FastAPI) | ⏸️ En pausa (Siguiente paso) |
| **Fase 3** | Generación de tipos TypeScript vía `openapi-typescript` | ⏸️ En pausa |
| **Fase 4** | Setup de base de datos Supabase (DDL / Migraciones SQL) | ⏸️ En pausa |
| **Fase 5** | Implementación Backend FastAPI (routers, schemas, DB) | ⏸️ En pausa |
| **Fase 6** | Implementación Frontend Next.js (UI, hooks, consumo tipado) | ⏸️ En pausa |
| **Fase 7** | Pruebas de integración, validación BDD y despliegue | ⏸️ En pausa |

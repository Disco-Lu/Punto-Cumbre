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

## 🚦 5. Estado Actual del Proyecto

- **Fase 0 (Análisis):** ✅ Completada al 100%.
- **Fase 1 (Especificación SDD):** ✅ Completada al 100% (Contrato OpenAPI 3.1.0 corregido con `AdminUser` + 88 escenarios BDD Gherkin).
- **Fase 2 (Scaffolding Backend FastAPI + Green Software):** ✅ **Completada**.
  - Estructura limpia y pragmática creada en `backend/`.
  - Servidor FastAPI con ciclo de vida asíncrono (`lifespan`) y respuesta ultrarrápida `orjson`.
  - Configuración centralizada con `@lru_cache` (cero I/O redundante a disco).
  - Motor de base de datos SQLAlchemy 2.0 asíncrono con *Connection Pooling* estricto para Supabase.
  - Endpoint de diagnóstico y salud operativo en `GET /api/v1/health`.
  - Entorno listo para despliegue local o con contenedor `Dockerfile` (Python 3.12-slim) y `docker-compose.yml`.
  - Instrucciones documentadas para el Frontend en `backend/README.md`.
- **Fase 3 (Setup Base de Datos Supabase):** ✅ **Completada**.
  - Scripts DDL (`schema.sql`) y datos semilla (`seed.sql`) ejecutados en Supabase bajo el modelo ER definido (9 tablas relacionales con PKs seriales e índices Green Software).
- **Fase 4 (Modelos ORM SQLAlchemy 2.0 y Schemas Pydantic v2):** ✅ **Completada**.
  - Mapeo 1:1 de las 9 entidades de la base de datos en `backend/app/models/`.
  - Esquemas de validación y DTOs (Create, Update, Response) construidos en `backend/app/schemas/` con validación Rust-backed (Pydantic v2) y `from_attributes = True`.
- **Fase 5 (Servicios de Lógica y Routers FastAPI):** ✅ **Completada**.
  - **Servicios:** `auth.py`, `disponibilidad.py`, `cotizacion.py`, `dashboard.py`.
  - **Routers Públicos:**
    - `categorias.py`: Listado y detalle de categorías de equipamiento (HU01).
    - `equipos.py`: Catálogo filtrable por categoría o texto, ficha técnica y disponibilidad por fechas (HU01, HU02, HU03).
    - `cotizaciones.py`: Solicitud y cálculo automático de cotizaciones con resumen (HU04, HU05).
    - `reservas.py`: Consulta de reservas e historial por correo del cliente (HU12).
  - **Routers Administrativos (Ruta oculta protegida por JWT):**
    - `admin/auth.py`: Login administrativo con emisión de Bearer Token JWT y verificación de sesión (RNF 002).
    - `admin/categorias.py`: CRUD completo de categorías con verificación de integridad referencial.
    - `admin/equipos.py`: CRUD de equipos y gestión de stock (RF 008, HU07, HU09).
    - `admin/reservas.py`: Listado de reservas con filtro y transición estricta de estados (`pendiente` ➔ `confirmada` ➔ `en_arriendo` ➔ `devuelta` / `cancelada`) (HU10).
    - `admin/pagos.py`: Registro de pagos y confirmación de arriendos.
    - `admin/dashboard.py`: KPIs en tiempo real y consolidación de ingresos diarios (RF 009).
  - **Ensamblaje central en `main.py`:** Todos los routers registrados bajo el prefijo `/api/v1` con serialización ultrarrápida `orjson`.
- **Fase 6.1 (Capa de Cliente API y Configuración Frontend):** ✅ **Completada**.
  - Configuración de entorno con `front/.env` y `front/.env.example` apuntando a `http://localhost:8000/api/v1`.
  - Definición de tipos TypeScript sincronizados con los esquemas del backend en `front/src/api/types.ts`.
  - Creación del cliente HTTP modular `front/src/api/client.ts` con manejo automático de Bearer Token JWT y extracción de errores.
  - Implementación de servicios de consumo por dominio:
    - `equipos.ts`: Catálogo de equipos, detalle y verificación de disponibilidad de stock.
    - `cotizaciones.ts`: Solicitud y consulta de cotizaciones.
    - `reservas.ts`: Consulta de historial de reservas por correo.
    - `admin.ts`: Login administrativo, KPIs de dashboard, gestión de reservas y CRUD de inventario.
  - Verificación exitosa de compilación Vite + TypeScript sin errores.
- **Fase 6.2 (Integración de Vista Pública: Catálogo, Disponibilidad y Cotizaciones):** ✅ **Completada**.
  - Eliminado el catálogo hardcodeado (`RENTAL_ITEMS`) en `front/src/App.tsx`; ahora carga en tiempo real desde `GET /api/v1/equipos` con estados de carga, error (con reintento) y catálogo vacío.
  - Verificación de disponibilidad en vivo al seleccionar fechas mediante `GET /api/v1/equipos/{id}/disponibilidad`, bloqueando el envío si no hay stock disponible.
  - Formulario de cotización conectado a `POST /api/v1/cotizaciones` (se incorporó el campo obligatorio `Teléfono` requerido por la base de datos) y se sincronizó el cálculo de días con la fórmula del backend (`max(1, devolución - retiro)`).
  - Ajustes de compatibilidad en backend: `CORS_ORIGINS` para el puerto 5173 en `.env.example` y `email-validator==2.2.0` agregado en `requirements.txt` para `EmailStr`.
  - Verificación exitosa con `tsc --noEmit` (exit 0) y `vite build`.
- **Fase 6.3 (Integración de Autenticación Administrativa JWT):** ✅ **Completada**.
  - Eliminadas las credenciales hardcodeadas (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) en `front/src/App.tsx`.
  - Modal `AdminLogin` conectado a `POST /api/v1/admin/auth/login` (campo `Usuario` + `Contraseña`, con estado de carga y manejo de errores reales de la API) y verificación del perfil vía `GET /api/v1/admin/auth/me`.
  - Persistencia y validación automática del token JWT en `sessionStorage` al recargar la página (si expira o es inválido, se limpia automáticamente).
  - Vista `AdminView` protegida estrictamente por sesión válida (`adminOpen && adminUser`), mostrando el usuario autenticado y sumando botón dedicado de **Cerrar sesión** además de **Volver al sitio**.
  - Verificación exitosa con `tsc --noEmit` (exit 0) y `vite build`.
- **Frontend (React 19 + TypeScript + Vite):** Ubicado en `front/`.

---

## 📋 6. Tabla de Control de Fases

| Fase | Descripción | Estado |
| :--- | :--- | :---: |
| **Fase 0** | Análisis de requerimientos funcionales y no funcionales | ✅ Completada |
| **Fase 1** | Especificaciones Gherkin (BDD) y Contrato OpenAPI 3.1 (SDD) | ✅ Completada |
| **Fase 2** | Scaffolding Backend FastAPI (Arquitectura limpia + Green Software) | ✅ Completada |
| **Fase 3** | Setup de Base de Datos Supabase (DDL + Seed + Índices Green) | ✅ Completada |
| **Fase 4** | Implementación de Modelos SQLAlchemy y Schemas Pydantic v2 | ✅ Completada |
| **Fase 5** | Implementación de Endpoints y Servicios FastAPI (según OpenAPI) | ✅ Completada |
| **Fase 6.1** | Capa de Cliente API y Tipos TypeScript en Frontend | ✅ Completada |
| **Fase 6.2** | Integración de Vista Pública (Catálogo y Cotizaciones reales) | ✅ Completada |
| **Fase 6.3** | Integración de Autenticación Administrativa (JWT) | ✅ Completada |
| **Fase 6.4** | Integración del Panel Admin en Tiempo Real (Dashboard y CRUD) | ⏳ Siguiente paso |
| **Fase 6.5** | Verificación E2E de Flujo Completo (Cliente ➔ Admin ➔ DB) | ⏸️ Pendiente |
| **Fase 7** | Pruebas de integración, validación BDD y contrato | ⏸️ Pendiente |


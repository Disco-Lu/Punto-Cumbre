-- ==============================================================================
-- PUNTO CUMBRE — DDL Schema Maestro (PostgreSQL / Supabase)
-- ==============================================================================
-- Metodología: SDD (Specification-Driven Development)
-- Fuente: Modelo Entidad-Relación diseñado por el equipo
-- Green Software: Índices quirúrgicos para evitar Full Table Scans
--
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en https://supabase.com/dashboard
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Pega TODO este archivo y presiona "Run"
-- ==============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Limpieza previa (si necesitas recrear las tablas)
-- ─────────────────────────────────────────────────────────────────────────────
-- Descomentar SOLO si necesitas borrar y volver a crear todo:
-- DROP TABLE IF EXISTS ingreso_diario CASCADE;
-- DROP TABLE IF EXISTS pago CASCADE;
-- DROP TABLE IF EXISTS reserva_cotizacion CASCADE;
-- DROP TABLE IF EXISTS detalle_reserva CASCADE;
-- DROP TABLE IF EXISTS reserva CASCADE;
-- DROP TABLE IF EXISTS cliente CASCADE;
-- DROP TABLE IF EXISTS equipo CASCADE;
-- DROP TABLE IF EXISTS categoria CASCADE;
-- DROP TABLE IF EXISTS administrador CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLA: administrador
-- ─────────────────────────────────────────────────────────────────────────────
-- Gestiona el acceso al panel de administración (ruta oculta, RNF 002).
-- Nota: atributo "corre" del diagrama ignorado por indicación del usuario.
CREATE TABLE administrador (
    id_admin        SERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA: categoria
-- ─────────────────────────────────────────────────────────────────────────────
-- Categorización de equipos de montaña (RF 001, HU01).
CREATE TABLE categoria (
    id_categoria        SERIAL PRIMARY KEY,
    nombre_categoria    VARCHAR(100) NOT NULL UNIQUE,
    descripcion         TEXT,
    id_admin            INT NOT NULL REFERENCES administrador(id_admin)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLA: equipo
-- ─────────────────────────────────────────────────────────────────────────────
-- Equipos de montaña disponibles para arriendo (RF 002, RF 008, HU02, HU07).
CREATE TABLE equipo (
    id_equipo           SERIAL PRIMARY KEY,
    id_categoria        INT NOT NULL REFERENCES categoria(id_categoria) ON DELETE RESTRICT,
    nombre_equipo       VARCHAR(200) NOT NULL,
    caracteristicas     TEXT NOT NULL,
    precio_arriendo     NUMERIC(10,2) NOT NULL CHECK (precio_arriendo > 0),
    cantidad            INT NOT NULL CHECK (cantidad >= 0),
    id_admin            INT NOT NULL REFERENCES administrador(id_admin)
);

-- Green Software: Índice para filtro de catálogo por categoría (evita seq scan)
CREATE INDEX idx_equipo_id_categoria ON equipo(id_categoria);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TABLA: cliente
-- ─────────────────────────────────────────────────────────────────────────────
-- Datos de contacto del cliente (sin cuenta, identificación por datos).
CREATE TABLE cliente (
    id_cliente      SERIAL PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL,
    correo          VARCHAR(320) NOT NULL,
    telefono        VARCHAR(20) NOT NULL,
    fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Green Software: Índice para consulta de reservas por correo del cliente
CREATE INDEX idx_cliente_correo ON cliente(correo);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TABLA: reserva
-- ─────────────────────────────────────────────────────────────────────────────
-- Reservas de arriendo de equipamiento (RF 003, RF 007, HU03, HU10, HU12).
-- Estados: pendiente → confirmada → en_arriendo → devuelta (+ cancelada).
CREATE TABLE reserva (
    id_reserva          SERIAL PRIMARY KEY,
    id_cliente          INT NOT NULL REFERENCES cliente(id_cliente),
    fecha_retiro        TIMESTAMPTZ NOT NULL,
    fecha_devolucion    TIMESTAMPTZ NOT NULL,
    estado_reserva      VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    -- Regla de negocio: fecha de devolución debe ser >= fecha de retiro
    CONSTRAINT chk_fechas CHECK (fecha_devolucion >= fecha_retiro),
    -- Regla de negocio: solo estados válidos
    CONSTRAINT chk_estado_reserva CHECK (
        estado_reserva IN ('pendiente', 'confirmada', 'en_arriendo', 'devuelta', 'cancelada')
    )
);

-- Green Software: Índice para filtro admin por estado
CREATE INDEX idx_reserva_estado ON reserva(estado_reserva);
-- Green Software: Índice para buscar reservas por cliente
CREATE INDEX idx_reserva_id_cliente ON reserva(id_cliente);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TABLA: detalle_reserva
-- ─────────────────────────────────────────────────────────────────────────────
-- Relación N:M entre reserva y equipo (qué equipos incluye cada reserva).
CREATE TABLE detalle_reserva (
    id_detalle      SERIAL PRIMARY KEY,
    id_reserva      INT NOT NULL REFERENCES reserva(id_reserva) ON DELETE CASCADE,
    id_equipo       INT NOT NULL REFERENCES equipo(id_equipo) ON DELETE RESTRICT
);

-- Green Software: Índice para obtener detalles de una reserva
CREATE INDEX idx_detalle_reserva_id_reserva ON detalle_reserva(id_reserva);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TABLA: reserva_cotizacion
-- ─────────────────────────────────────────────────────────────────────────────
-- Cotizaciones asociadas a una reserva (RF 004, RF 005, HU04, HU05).
CREATE TABLE reserva_cotizacion (
    id_cotizacion       SERIAL PRIMARY KEY,
    id_reserva          INT NOT NULL REFERENCES reserva(id_reserva),
    fecha_solicitud     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado_cotizacion   VARCHAR(20) NOT NULL DEFAULT 'pendiente',

    -- Regla de negocio: solo estados válidos
    CONSTRAINT chk_estado_cotizacion CHECK (
        estado_cotizacion IN ('pendiente', 'confirmada', 'cancelada')
    )
);

-- Green Software: Índice para buscar cotizaciones por reserva
CREATE INDEX idx_reserva_cotizacion_id_reserva ON reserva_cotizacion(id_reserva);
-- Green Software: Índice para filtro admin por estado
CREATE INDEX idx_reserva_cotizacion_estado ON reserva_cotizacion(estado_cotizacion);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. TABLA: pago
-- ─────────────────────────────────────────────────────────────────────────────
-- Registro de pagos asociados a reservas.
CREATE TABLE pago (
    id_pago         SERIAL PRIMARY KEY,
    id_reserva      INT NOT NULL REFERENCES reserva(id_reserva),
    monto_pagado    NUMERIC(12,2) NOT NULL CHECK (monto_pagado > 0),
    fecha_pago      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metodo_pago     VARCHAR(50) NOT NULL
);

-- Green Software: Índice para consultar pagos por reserva
CREATE INDEX idx_pago_id_reserva ON pago(id_reserva);


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. TABLA: ingreso_diario
-- ─────────────────────────────────────────────────────────────────────────────
-- Registro consolidado de ingresos por día para el dashboard administrativo (RF 009).
CREATE TABLE ingreso_diario (
    id_ingreso          SERIAL PRIMARY KEY,
    fecha               DATE NOT NULL,
    total_ingresos      NUMERIC(14,2) NOT NULL DEFAULT 0,
    transacciones_count INT NOT NULL DEFAULT 0,
    id_admin            INT NOT NULL REFERENCES administrador(id_admin)
);

-- Green Software: Índice para consulta por fecha (reporte del dashboard)
CREATE INDEX idx_ingreso_diario_fecha ON ingreso_diario(fecha);


-- ==============================================================================
-- FIN DEL SCHEMA DDL
-- ==============================================================================
-- Tablas creadas:  9 (administrador, categoria, equipo, cliente, reserva,
--                     detalle_reserva, reserva_cotizacion, pago, ingreso_diario)
-- Índices:         10
-- Check Constraints: 4 (precio > 0, cantidad >= 0, estados válidos, fechas)
-- ==============================================================================

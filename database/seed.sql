-- ==============================================================================
-- PUNTO CUMBRE — Datos Semilla (Seed Data)
-- ==============================================================================
-- Ejecutar DESPUÉS de schema.sql en el SQL Editor de Supabase
--
-- Contenido:
-- 1. Usuario administrador inicial (contraseña: admin123)
-- 2. Categoría inicial: "Crampones y piolets" (confirmada por el usuario)
-- ==============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Usuario administrador inicial
-- ─────────────────────────────────────────────────────────────────────────────
-- Contraseña: admin123
-- Hash generado con bcrypt (passlib compatible)
-- IMPORTANTE: Cambia esta contraseña en producción
INSERT INTO administrador (username, password_hash) VALUES
    ('admin', '$2b$12$LJ3m4ys3Lz0QHxPdOKCiGeVJx1EHfBFVR1S7tVA3MdBaVxRdKcW4C');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Categoría inicial (requiere id_admin del administrador creado arriba)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO categoria (nombre_categoria, descripcion, id_admin) VALUES
    ('Crampones y piolets', 'Equipos esenciales para escalada en hielo y nieve', 1);


-- ==============================================================================
-- FIN DE DATOS SEMILLA
-- ==============================================================================
-- Para verificar que todo se insertó correctamente, ejecuta:
--   SELECT * FROM administrador;
--   SELECT * FROM categoria;
-- ==============================================================================

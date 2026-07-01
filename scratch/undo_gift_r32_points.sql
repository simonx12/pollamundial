-- 🔧 SQL SCRIPT: UNDO GIFT R32 POINTS (RESTORE INDEPENDENCE)
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Realizará dos tareas:
-- 1. Elimina todos los pronósticos de R32 que fueron forzados/creados por el script de regalo (identificables por tener exactamente 3 puntos de compensación en la fase de R32).
-- 2. Elimina la función `gift_r32_points()` de la base de datos para no dejar rastro de la compensación automática.

-- ─────────────────────────────────────────────────────────────────────
-- 1. ELIMINAR LOS PRONÓSTICOS REGALADOS (COMPENSACIÓN DE 3 PUNTOS EN R32)
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM predictions 
WHERE match_id LIKE 'KO-R32-%' AND points_earned = 3;

-- ─────────────────────────────────────────────────────────────────────
-- 2. ELIMINAR LA FUNCIÓN RPC DE LA BASE DE DATOS
-- ─────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS gift_r32_points();

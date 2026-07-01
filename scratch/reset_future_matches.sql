-- 🔧 SQL SCRIPT: CORREGIR DIECISEISAVOS (KO-R32) Y RESTABLECER BRACKET
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Realizará tres tareas:
-- 1. Elimina resultados de los partidos R32 que aún no se han jugado (KO-R32-9 y del 11 al 16).
-- 2. Restablece a NULL los puntos ganados por las predicciones de estos partidos que se eliminaron.
-- 3. Corrige los resultados reales de los partidos de R32 que sí han finalizado para que coincidan con la API oficial.

-- ─────────────────────────────────────────────────────────────────────
-- 1. ELIMINAR PARTIDOS DEL FUTURO QUE SE MARCARON COMO FINALIZADOS ERRÓNEAMENTE
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM match_results 
WHERE match_id IN (
  'KO-R32-9', 
  'KO-R32-11', 
  'KO-R32-12', 
  'KO-R32-13', 
  'KO-R32-14', 
  'KO-R32-15', 
  'KO-R32-16'
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. RESTABLECER PUNTOS A NULL PARA LAS PREDICCIONES DE ESOS PARTIDOS
-- ─────────────────────────────────────────────────────────────────────
UPDATE predictions 
SET points_earned = NULL 
WHERE match_id IN (
  'KO-R32-9', 
  'KO-R32-11', 
  'KO-R32-12', 
  'KO-R32-13', 
  'KO-R32-14', 
  'KO-R32-15', 
  'KO-R32-16'
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. CORREGIR MARCADORES DE LOS PARTIDOS QUE SÍ SE JUGARON
-- ─────────────────────────────────────────────────────────────────────

-- KO-R32-1 (Sudáfrica vs Canadá) - Oficial: 0 - 1
INSERT INTO match_results (match_id, home_score, away_score, status, updated_at)
VALUES ('KO-R32-1', 0, 1, 'FINISHED', now())
ON CONFLICT (match_id) DO UPDATE SET 
    home_score = EXCLUDED.home_score, 
    away_score = EXCLUDED.away_score, 
    status = EXCLUDED.status, 
    updated_at = now();

-- KO-R32-2 (Alemania vs Paraguay) - Oficial: 4 - 5
INSERT INTO match_results (match_id, home_score, away_score, status, updated_at)
VALUES ('KO-R32-2', 4, 5, 'FINISHED', now())
ON CONFLICT (match_id) DO UPDATE SET 
    home_score = EXCLUDED.home_score, 
    away_score = EXCLUDED.away_score, 
    status = EXCLUDED.status, 
    updated_at = now();

-- KO-R32-3 (Países Bajos vs Marruecos) - Oficial: 3 - 4
INSERT INTO match_results (match_id, home_score, away_score, status, updated_at)
VALUES ('KO-R32-3', 3, 4, 'FINISHED', now())
ON CONFLICT (match_id) DO UPDATE SET 
    home_score = EXCLUDED.home_score, 
    away_score = EXCLUDED.away_score, 
    status = EXCLUDED.status, 
    updated_at = now();

-- KO-R32-5 (Francia vs Suecia) - Oficial: 3 - 0
INSERT INTO match_results (match_id, home_score, away_score, status, updated_at)
VALUES ('KO-R32-5', 3, 0, 'FINISHED', now())
ON CONFLICT (match_id) DO UPDATE SET 
    home_score = EXCLUDED.home_score, 
    away_score = EXCLUDED.away_score, 
    status = EXCLUDED.status, 
    updated_at = now();

-- Forzar recalculo de puntos para los partidos que actualizamos
-- El trigger trg_calculate_points recalculará los puntos automáticamente al hacer el upsert de arriba.

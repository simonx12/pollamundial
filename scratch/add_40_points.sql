-- 🎁 SQL SCRIPT: ASIGNAR 40 PUNTOS DE COMPENSACIÓN A TODOS LOS PARTICIPANTES
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Creará un registro de predicción virtual e invisible para cada usuario 
-- con 40 puntos de bonificación/compensación.
-- Dado que este registro no corresponde a ningún partido real en el calendario,
-- no interferirá con la visualización de los partidos, pero se sumará automáticamente
-- a sus puntos totales en el Leaderboard y en el Dashboard de cada jugador.

INSERT INTO predictions (user_id, match_id, home_score, away_score, points_earned, created_at, updated_at)
SELECT id, 'COMPENSATION_ERROR_APP', 0, 0, 40, now(), now()
FROM profiles
ON CONFLICT (user_id, match_id) 
DO UPDATE SET 
    points_earned = 40,
    updated_at = now();

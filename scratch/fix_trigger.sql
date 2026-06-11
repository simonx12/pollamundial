-- =====================================================================
-- 🔧 FIX: RLS Policies + Recalcular Puntos + Insertar resultado México
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase

-- ─────────────────────────────────────────────────────────────────────
-- 1. FIX: Permitir a usuarios autenticados insertar/actualizar match_results
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Permitir guardar y editar resultados oficiales a autenticados" ON match_results;
CREATE POLICY "Permitir guardar y editar resultados oficiales a autenticados" ON match_results
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- También asegurar que SELECT sea público (incluyendo anon)
DROP POLICY IF EXISTS "Match results are viewable by everyone" ON match_results;
CREATE POLICY "Match results are viewable by everyone" ON match_results
    FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 2. FIX: Permitir lectura pública de predictions (necesario para el leaderboard)
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Predictions are viewable by everyone" ON predictions;
CREATE POLICY "Predictions are viewable by everyone" ON predictions
    FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Verificar/actualizar el trigger de cálculo de puntos (5-3-1 con multiplicadores)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_predictions_points_on_result()
RETURNS TRIGGER AS $$
DECLARE
    pred_row RECORD;
    calculated_points INTEGER;
    multiplier INTEGER;
BEGIN
    -- Determinar el multiplicador de la fase basándose en el prefijo del match_id
    IF NEW.match_id LIKE 'GS-%' THEN
        multiplier := 1;
    ELSIF NEW.match_id LIKE 'KO-R32-%' OR NEW.match_id LIKE 'KO-R16-%' OR NEW.match_id LIKE 'KO-QF-%' THEN
        multiplier := 2;
    ELSIF NEW.match_id LIKE 'KO-SF-%' OR NEW.match_id LIKE 'KO-3RD-%' THEN
        multiplier := 3;
    ELSIF NEW.match_id LIKE 'KO-F-%' THEN
        multiplier := 4;
    ELSE
        multiplier := 1;
    END IF;

    -- Buscar todas las predicciones para el partido que cambió
    FOR pred_row IN 
        SELECT id, home_score, away_score 
        FROM predictions 
        WHERE match_id = NEW.match_id
    LOOP
        -- Calcular puntos obtenidos
        IF pred_row.home_score = NEW.home_score AND pred_row.away_score = NEW.away_score THEN
            calculated_points := 5 * multiplier; -- Marcador exacto
        ELSIF sign(pred_row.home_score - pred_row.away_score) != 0
              AND (pred_row.home_score - pred_row.away_score) = (NEW.home_score - NEW.away_score) THEN
            calculated_points := 3 * multiplier; -- Ganador + diferencia de goles exacta
        ELSIF sign(pred_row.home_score - pred_row.away_score) = sign(NEW.home_score - NEW.away_score) THEN
            calculated_points := 1 * multiplier; -- Solo ganador o empate
        ELSE
            calculated_points := 0; -- Falló
        END IF;

        -- Actualizar la predicción correspondiente
        UPDATE predictions 
        SET points_earned = calculated_points 
        WHERE id = pred_row.id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trg_calculate_points ON match_results;
CREATE TRIGGER trg_calculate_points
AFTER INSERT OR UPDATE ON match_results
FOR EACH ROW EXECUTE FUNCTION calculate_predictions_points_on_result();

-- ─────────────────────────────────────────────────────────────────────
-- 4. Insertar resultado de México 2-0 Sudáfrica (GS-A-1)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO match_results (match_id, home_score, away_score, status, updated_at)
VALUES ('GS-A-1', 2, 0, 'FINISHED', NOW())
ON CONFLICT (match_id) DO UPDATE SET
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────
-- 5. Verificación: ver los resultados y predicciones con puntos
-- ─────────────────────────────────────────────────────────────────────
SELECT 'match_results' as tabla, match_id, home_score, away_score, status 
FROM match_results;

SELECT 'predictions_with_points' as tabla, p.match_id, p.home_score, p.away_score, p.points_earned, pr.username
FROM predictions p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.match_id = 'GS-A-1';

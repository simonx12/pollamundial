-- =====================================================================
-- 🔧 SQL SCRIPT: RECALCULAR PUNTOS AUTOMÁTICAMENTE Y ARREGLAR NULOS 🔧
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Realizará tres tareas:
-- 1. Crear un trigger en la tabla `predictions` que calcula los puntos 
--    automáticamente si el resultado ya está registrado.
-- 2. Recalcular y actualizar todas las predicciones pasadas que quedaron con puntos NULL.
-- 3. Asegurar que las políticas de lectura pública estén correctas.

-- ─────────────────────────────────────────────────────────────────────
-- 1. CREAR FUNCIÓN Y TRIGGER EN LA TABLA DE PREDICCIONES (PREDICTIONS)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_single_prediction_points()
RETURNS TRIGGER AS $$
DECLARE
    real_match RECORD;
    multiplier INTEGER;
    calculated_points INTEGER;
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

    -- Buscar si ya existe el resultado real para este partido
    SELECT home_score, away_score, status 
    INTO real_match 
    FROM match_results 
    WHERE match_id = NEW.match_id;

    IF FOUND AND real_match.home_score IS NOT NULL AND real_match.away_score IS NOT NULL THEN
        -- Calcular puntos obtenidos
        IF NEW.home_score = real_match.home_score AND NEW.away_score = real_match.away_score THEN
            calculated_points := 5 * multiplier; -- Marcador exacto
        ELSIF sign(NEW.home_score - NEW.away_score) != 0
              AND (NEW.home_score - NEW.away_score) = (real_match.home_score - real_match.away_score) THEN
            calculated_points := 3 * multiplier; -- Ganador + diferencia de goles exacta
        ELSIF sign(NEW.home_score - NEW.away_score) = sign(real_match.home_score - real_match.away_score) THEN
            calculated_points := 1 * multiplier; -- Solo ganador o empate
        ELSE
            calculated_points := 0; -- Falló
        END IF;
        
        NEW.points_earned := calculated_points;
    ELSE
        NEW.points_earned := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger en la tabla predictions
DROP TRIGGER IF EXISTS trg_calculate_points_pred ON predictions;
CREATE TRIGGER trg_calculate_points_pred
BEFORE INSERT OR UPDATE ON predictions
FOR EACH ROW EXECUTE FUNCTION calculate_single_prediction_points();


-- ─────────────────────────────────────────────────────────────────────
-- 2. RECALCULAR PUNTOS DE TODAS LAS PREDICCIONES CON VALOR NULL
-- ─────────────────────────────────────────────────────────────────────
UPDATE predictions p
SET points_earned = (
    CASE 
        -- Marcador exacto
        WHEN p.home_score = r.home_score AND p.away_score = r.away_score THEN 5 * (
            CASE WHEN p.match_id LIKE 'GS-%' THEN 1
                 WHEN p.match_id LIKE 'KO-R32-%' OR p.match_id LIKE 'KO-R16-%' OR p.match_id LIKE 'KO-QF-%' THEN 2
                 WHEN p.match_id LIKE 'KO-SF-%' OR p.match_id LIKE 'KO-3RD-%' THEN 3
                 WHEN p.match_id LIKE 'KO-F-%' THEN 4
                 ELSE 1 END
        )
        -- Ganador + diferencia de goles exacta (solo para partidos no empatados)
        WHEN sign(p.home_score - p.away_score) != 0 AND (p.home_score - p.away_score) = (r.home_score - r.away_score) THEN 3 * (
            CASE WHEN p.match_id LIKE 'GS-%' THEN 1
                 WHEN p.match_id LIKE 'KO-R32-%' OR p.match_id LIKE 'KO-R16-%' OR p.match_id LIKE 'KO-QF-%' THEN 2
                 WHEN p.match_id LIKE 'KO-SF-%' OR p.match_id LIKE 'KO-3RD-%' THEN 3
                 WHEN p.match_id LIKE 'KO-F-%' THEN 4
                 ELSE 1 END
        )
        -- Solo ganador o empate
        WHEN sign(p.home_score - p.away_score) = sign(r.home_score - r.away_score) THEN 1 * (
            CASE WHEN p.match_id LIKE 'GS-%' THEN 1
                 WHEN p.match_id LIKE 'KO-R32-%' OR p.match_id LIKE 'KO-R16-%' OR p.match_id LIKE 'KO-QF-%' THEN 2
                 WHEN p.match_id LIKE 'KO-SF-%' OR p.match_id LIKE 'KO-3RD-%' THEN 3
                 WHEN p.match_id LIKE 'KO-F-%' THEN 4
                 ELSE 1 END
        )
        ELSE 0
    END
)
FROM match_results r
WHERE p.match_id = r.match_id 
  AND r.home_score IS NOT NULL 
  AND r.away_score IS NOT NULL
  AND p.points_earned IS NULL;


-- ─────────────────────────────────────────────────────────────────────
-- 3. REAFIRMAR POLÍTICAS DE LECTURA PÚBLICA PARA EVITAR ERRORES DE LECTURA
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Predictions are viewable by everyone" ON predictions;
CREATE POLICY "Predictions are viewable by everyone" ON predictions
    FOR SELECT USING (true);

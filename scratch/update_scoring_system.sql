-- =====================================================================
-- 🏆 ACTUALIZACIÓN DEL SISTEMA DE PUNTOS, MULTIPLICADORES Y CORRECCIÓN DE TRIGGERS 🏆
-- =====================================================================
-- Ejecuta este script completo en el "SQL Editor" de Supabase.
-- Corregirá el error RLS/compilación "record 'new' has no field 'user_id'"
-- y actualizará las reglas de puntuación a 5-3-1 con multiplicadores de fase.

-- ─────────────────────────────────────────────────────────────────────
-- 1. CORRECCIÓN DE TRIGGERS DE AUDITORÍA (Evita error 'user_id' en match_results)
-- ─────────────────────────────────────────────────────────────────────

-- Función de auditoría específica para predicciones
CREATE OR REPLACE FUNCTION process_predictions_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_record_id TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.user_id::text || '_' || OLD.match_id::text;
        INSERT INTO audit_logs (table_name, action, record_id, old_data, performed_by)
        VALUES ('predictions', 'DELETE', v_record_id, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.user_id::text || '_' || NEW.match_id::text;
        INSERT INTO audit_logs (table_name, action, record_id, new_data, performed_by)
        VALUES ('predictions', 'INSERT', v_record_id, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.user_id::text || '_' || NEW.match_id::text;
        INSERT INTO audit_logs (table_name, action, record_id, old_data, new_data, performed_by)
        VALUES ('predictions', 'UPDATE', v_record_id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función de auditoría específica para resultados de partidos
CREATE OR REPLACE FUNCTION process_match_results_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_record_id TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.match_id;
        INSERT INTO audit_logs (table_name, action, record_id, old_data, performed_by)
        VALUES ('match_results', 'DELETE', v_record_id, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.match_id;
        INSERT INTO audit_logs (table_name, action, record_id, new_data, performed_by)
        VALUES ('match_results', 'INSERT', v_record_id, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.match_id;
        INSERT INTO audit_logs (table_name, action, record_id, old_data, new_data, performed_by)
        VALUES ('match_results', 'UPDATE', v_record_id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Desvincular antiguos triggers
DROP TRIGGER IF EXISTS predictions_audit_trigger ON predictions;
DROP TRIGGER IF EXISTS match_results_audit_trigger ON match_results;

-- Re-vincular los triggers corregidos e independientes
CREATE TRIGGER predictions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON predictions
FOR EACH ROW EXECUTE FUNCTION process_predictions_audit_log();

CREATE TRIGGER match_results_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON match_results
FOR EACH ROW EXECUTE FUNCTION process_match_results_audit_log();


-- ─────────────────────────────────────────────────────────────────────
-- 2. SISTEMA DE PUNTOS Y MULTIPLICADORES POR FASE (5-3-1)
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
        -- Calcular puntos obtenidos (regla 5-3-1)
        IF pred_row.home_score = NEW.home_score AND pred_row.away_score = NEW.away_score THEN
            calculated_points := 5 * multiplier; -- Marcador exacto
        ELSIF (pred_row.home_score - pred_row.away_score) = (NEW.home_score - NEW.away_score) 
              AND sign(pred_row.home_score - pred_row.away_score) = sign(NEW.home_score - NEW.away_score)
              AND sign(pred_row.home_score - pred_row.away_score) <> 0 THEN
            calculated_points := 3 * multiplier; -- Ganador + diferencia exacta (no empates)
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

-- Re-vincular el trigger de cálculo de puntos por seguridad
DROP TRIGGER IF EXISTS trg_calculate_points ON match_results;
CREATE TRIGGER trg_calculate_points
AFTER INSERT OR UPDATE ON match_results
FOR EACH ROW EXECUTE FUNCTION calculate_predictions_points_on_result();

-- Forzar recalculo general si ya hay datos ingresados
UPDATE match_results SET updated_at = now();

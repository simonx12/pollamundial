-- =====================================================================
-- 🛠️ SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS PARA SUPABASE 🛠️
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase
-- para corregir los errores 404 (tabla inexistente) y 403 (permisos RLS).

-- ─────────────────────────────────────────────────────────────────────
-- 1. CREACIÓN DE LA TABLA DE AUDITORÍA (Soluciona el error 404)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar seguridad de RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Crear políticas de lectura para usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura de logs a usuarios autenticados" ON audit_logs;
CREATE POLICY "Permitir lectura de logs a usuarios autenticados" ON audit_logs
    FOR SELECT TO authenticated USING (true);


-- ─────────────────────────────────────────────────────────────────────
-- 2. PERMISOS DE ESCRITURA EN RESULTADOS REALES (Soluciona el error 403)
-- ─────────────────────────────────────────────────────────────────────
-- Habilitar RLS en la tabla de resultados
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados ver los resultados reales
DROP POLICY IF EXISTS "Match results are viewable by everyone" ON match_results;
CREATE POLICY "Match results are viewable by everyone" ON match_results
    FOR SELECT USING (true);

-- Permitir a los usuarios autenticados registrar/modificar resultados oficiales (Guardar Real)
DROP POLICY IF EXISTS "Permitir guardar y editar resultados oficiales a autenticados" ON match_results;
CREATE POLICY "Permitir guardar y editar resultados oficiales a autenticados" ON match_results
    FOR ALL TO authenticated USING (true);


-- ─────────────────────────────────────────────────────────────────────
-- 3. CALCULO AUTOMÁTICO DE PUNTOS EN EL SERVIDOR (Mejora y soluciona RLS en predictions)
-- ─────────────────────────────────────────────────────────────────────
-- Esta función se ejecuta automáticamente con privilegios de administrador (SECURITY DEFINER)
-- cuando se guarda un resultado real. Calcula los puntos y actualiza las predicciones de todos
-- los usuarios sin requerir permisos de escritura de los jugadores sobre otros registros.
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
        ELSIF (pred_row.home_score - pred_row.away_score) = (NEW.home_score - NEW.away_score) AND sign(pred_row.home_score - pred_row.away_score) = sign(NEW.home_score - NEW.away_score) THEN
            calculated_points := 3 * multiplier; -- Ganador + diferencia exacta
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

-- Crear el trigger en la tabla match_results
DROP TRIGGER IF EXISTS trg_calculate_points ON match_results;
CREATE TRIGGER trg_calculate_points
AFTER INSERT OR UPDATE ON match_results
FOR EACH ROW EXECUTE FUNCTION calculate_predictions_points_on_result();


-- ─────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS DE REGISTRO EN LA BITÁCORA DE AUDITORÍA
-- ─────────────────────────────────────────────────────────────────────
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

-- Vincular triggers de auditoría
DROP TRIGGER IF EXISTS predictions_audit_trigger ON predictions;
CREATE TRIGGER predictions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON predictions
FOR EACH ROW EXECUTE FUNCTION process_predictions_audit_log();

DROP TRIGGER IF EXISTS match_results_audit_trigger ON match_results;
CREATE TRIGGER match_results_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON match_results
FOR EACH ROW EXECUTE FUNCTION process_match_results_audit_log();

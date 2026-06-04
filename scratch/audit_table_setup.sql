-- ==========================================
-- SCRIPT DE CREACIÓN DE TABLA DE AUDITORÍA
-- ==========================================

-- 1. Crear la tabla de auditoría
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

-- 2. Habilitar seguridad de RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de lectura para usuarios autenticados
-- Nota: Puedes ajustar esto para restringirlo solo a administradores si fuera necesario
CREATE POLICY "Permitir lectura de logs a usuarios autenticados" ON audit_logs
    FOR SELECT TO authenticated USING (true);

-- 4. Crear la función de trigger de auditoría genérica
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, action, record_id, new_data, performed_by)
        VALUES (
            TG_TABLE_NAME,
            'INSERT',
            COALESCE(NEW.id::text, (NEW.user_id::text || '_' || NEW.match_id::text)),
            to_jsonb(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, action, record_id, old_data, new_data, performed_by)
        VALUES (
            TG_TABLE_NAME,
            'UPDATE',
            COALESCE(NEW.id::text, (NEW.user_id::text || '_' || NEW.match_id::text)),
            to_jsonb(OLD),
            to_jsonb(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, action, record_id, old_data, performed_by)
        VALUES (
            TG_TABLE_NAME,
            'DELETE',
            COALESCE(OLD.id::text, (OLD.user_id::text || '_' || OLD.match_id::text)),
            to_jsonb(OLD),
            auth.uid()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vincular el trigger a la tabla de predicciones (predictions)
DROP TRIGGER IF EXISTS predictions_audit_trigger ON predictions;
CREATE TRIGGER predictions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON predictions
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 6. Vincular el trigger a la tabla de resultados (match_results)
DROP TRIGGER IF EXISTS match_results_audit_trigger ON match_results;
CREATE TRIGGER match_results_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON match_results
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

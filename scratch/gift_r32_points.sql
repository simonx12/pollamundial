-- =====================================================================
-- 🎁 SQL SCRIPT: REGALAR PUNTOS DE DIECISEISAVOS (KO-R32) JUGADOS 🎁
-- =====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Creará la función RPC `gift_r32_points()` que otorga marcador exacto
-- (10 puntos) a todos los usuarios para los partidos de 16avos finalizados.

CREATE OR REPLACE FUNCTION gift_r32_points()
RETURNS jsonb AS $$
DECLARE
    r RECORD;
    p RECORD;
    v_multiplier INTEGER;
    v_points INTEGER;
    v_count INTEGER := 0;
    v_players INTEGER := 0;
BEGIN
    -- Multiplicador para KO-R32 es 2, marcador exacto (5) * 2 = 10 puntos
    v_multiplier := 2;
    v_points := 5 * v_multiplier;

    -- Contar jugadores
    SELECT COUNT(*) INTO v_players FROM profiles;

    -- Iterar sobre todos los resultados de partidos de dieciseisavos terminados
    FOR r IN 
        SELECT match_id, home_score, away_score 
        FROM match_results 
        WHERE match_id LIKE 'KO-R32-%' AND status = 'FINISHED'
    LOOP
        -- Iterar sobre todos los usuarios (profiles)
        FOR p IN 
            SELECT id FROM profiles
        LOOP
            -- Hacer upsert de la predicción con el marcador exacto y los puntos correspondientes
            INSERT INTO predictions (user_id, match_id, home_score, away_score, points_earned, updated_at)
            VALUES (p.id, r.match_id, r.home_score, r.away_score, v_points, now())
            ON CONFLICT (user_id, match_id) 
            DO UPDATE SET 
                home_score = EXCLUDED.home_score,
                away_score = EXCLUDED.away_score,
                points_earned = EXCLUDED.points_earned,
                updated_at = now();
                
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    -- Retornar información resumida
    RETURN jsonb_build_object(
        'success', true,
        'predictions_updated', v_count,
        'total_players', v_players
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

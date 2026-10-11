-- ==============================================================================
-- CARVLAK GROUP - MIGRACIÓN DETAILVLAK OPERATIVO (004_detailvlak_operativo.sql)
-- ==============================================================================
-- 1. Numeración atómica de comprobantes (SEQUENCE + RPC)
-- 2. Eliminación de DEFAULTs de datos de empresa en detailing_receipts
-- 3. Tabla detailing_payments para pagos simultáneos concurrentes
-- 4. Extensión de detailing_quotes (quote_sent_at, confirmed_at)
-- 5. Migración de datos hacia el flujo de estados unificado:
--    Presupuesto → Agendado → En taller → Listo para retirar → Entregado
-- 6. Ajuste de permisos RLS para personal de detailing (Romina / Detailers)
-- 7. Función del servidor detailvlak_auto_ingreso() para ingreso automático a la hora del turno
-- 8. Script seguro de limpieza de datos de prueba ("Empezar de cero")
-- ==============================================================================

-- 1. SECUENCIA ATÓMICA DE COMPROBANTES Y FUNCIÓN RPC
CREATE SEQUENCE IF NOT EXISTS detailing_receipt_seq START WITH 1 INCREMENT BY 1;

-- Función atómica para obtener el próximo número de comprobante (ej: DV-000001)
CREATE OR REPLACE FUNCTION next_detailing_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix TEXT := 'DV-';
    v_seq_val BIGINT;
    v_cfg RECORD;
BEGIN
    -- Intentar leer el prefijo de la configuración guardada
    SELECT config INTO v_cfg FROM detailing_configs WHERE id = 'default' LIMIT 1;
    IF FOUND AND v_cfg.config IS NOT NULL AND v_cfg.config ? 'receipt_config' THEN
        v_prefix := COALESCE(v_cfg.config->'receipt_config'->>'prefix', 'DV-');
    END IF;

    -- Obtener siguiente valor de la secuencia
    v_seq_val := nextval('detailing_receipt_seq');

    RETURN v_prefix || LPAD(v_seq_val::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_detailing_receipt_number() TO authenticated, anon;

-- Función para fijar el número inicial de la secuencia desde la Configuración
CREATE OR REPLACE FUNCTION set_detailing_receipt_seq(p_val BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_val < 1 THEN
        p_val := 1;
    END IF;
    PERFORM setval('detailing_receipt_seq', p_val, false);
END;
$$;

GRANT EXECUTE ON FUNCTION set_detailing_receipt_seq(BIGINT) TO authenticated;


-- 2. ELIMINAR DEFAULTS ESCRITOS A MANO DE EMPRESA EN detailing_receipts
DO $$
BEGIN
    ALTER TABLE detailing_receipts ALTER COLUMN company_trade_name DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_legal_name DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_rut DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_address DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_phone DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_instagram DROP DEFAULT;
    ALTER TABLE detailing_receipts ALTER COLUMN company_logo_url DROP DEFAULT;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;


-- 3. TABLA detailing_payments PARA PAGOS SIMULTÁNEOS
CREATE TABLE IF NOT EXISTS detailing_payments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL REFERENCES detailing_quotes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'saldo', -- 'seña', 'saldo', 'total'
    notes TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_detailing_payments_quote_id ON detailing_payments(quote_id);
CREATE INDEX IF NOT EXISTS idx_detailing_payments_date ON detailing_payments(date);

ALTER TABLE detailing_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detailing_payments_staff_read" ON detailing_payments;
CREATE POLICY "detailing_payments_staff_read" ON detailing_payments
    FOR SELECT TO authenticated
    USING (is_active_staff());

DROP POLICY IF EXISTS "detailing_payments_staff_write" ON detailing_payments;
CREATE POLICY "detailing_payments_staff_write" ON detailing_payments
    FOR ALL TO authenticated
    USING (is_active_staff())
    WITH CHECK (is_active_staff());

-- Migrar pagos previos desde el campo JSONB de detailing_quotes hacia detailing_payments
DO $$
DECLARE
    r RECORD;
    p JSONB;
BEGIN
    FOR r IN SELECT id, payments FROM detailing_quotes WHERE payments IS NOT NULL AND jsonb_array_length(payments) > 0 LOOP
        FOR p IN SELECT * FROM jsonb_array_elements(r.payments) LOOP
            IF NOT EXISTS (SELECT 1 FROM detailing_payments WHERE id = (p->>'id')) THEN
                INSERT INTO detailing_payments (
                    id,
                    quote_id,
                    date,
                    amount,
                    method,
                    type,
                    notes,
                    is_voided,
                    created_by,
                    created_at
                ) VALUES (
                    COALESCE(p->>'id', 'pay-' || gen_random_uuid()),
                    r.id,
                    COALESCE((p->>'date')::DATE, CURRENT_DATE),
                    COALESCE((p->>'amount')::NUMERIC, 0),
                    COALESCE(p->>'payment_method', p->>'method', 'Efectivo'),
                    COALESCE(p->>'type', 'saldo'),
                    p->>'notes',
                    COALESCE((p->>'is_voided')::BOOLEAN, FALSE),
                    p->>'registered_by',
                    TIMEZONE('utc', NOW())
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;


-- 4. EXTENSIÓN DE TABLA detailing_quotes (quote_sent_at, confirmed_at)
DO $$
BEGIN
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS quote_sent_at TIMESTAMPTZ;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
END $$;


-- 5. MIGRACIÓN DE DATOS HACIA EL FLUJO DE ESTADOS UNIFICADO
-- Presupuesto → Agendado → En taller → Listo para retirar → Entregado
DO $$
BEGIN
    -- Por Cotizar / Presupuesto Enviado → Presupuesto
    UPDATE detailing_quotes
    SET quote_sent_at = COALESCE(quote_sent_at, updated_at),
        status = 'Presupuesto'
    WHERE status = 'Presupuesto Enviado';

    UPDATE detailing_quotes
    SET status = 'Presupuesto'
    WHERE status = 'Por Cotizar';

    -- Turno Confirmado / Confirmado → Agendado con confirmed_at
    UPDATE detailing_quotes
    SET confirmed_at = COALESCE(confirmed_at, updated_at),
        status = 'Agendado'
    WHERE status IN ('Turno Confirmado', 'Confirmado');

    -- Recibido / En proceso / Control de calidad → En taller
    UPDATE detailing_quotes
    SET status = 'En taller'
    WHERE status IN ('Recibido', 'En proceso', 'Control de calidad');

    -- Trabajo Completado / Entregado y cobrado → Entregado
    UPDATE detailing_quotes
    SET status = 'Entregado'
    WHERE status IN ('Trabajo Completado', 'Entregado y cobrado');

    -- Sincronizar también etapas en appointments
    UPDATE appointments
    SET stage = 'En taller'
    WHERE business = 'detailing' AND stage IN ('Recibido', 'En proceso', 'Control de calidad');

    UPDATE appointments
    SET stage = 'Entregado'
    WHERE business = 'detailing' AND stage IN ('Trabajo Completado', 'Entregado y cobrado');

    UPDATE appointments
    SET stage = 'Agendado'
    WHERE business = 'detailing' AND stage IN ('Turno Confirmado', 'Confirmado');
END $$;


-- 6. AJUSTE DE POLÍTICAS RLS PARA PERMISOS DE ROMINA Y DETAILERS
-- Los detailers pueden crear/editar turnos, presupuestos, pagos y comprobantes.
-- Solo admin ve comisiones de terceros y gastos.

-- RLS: detailing_quotes
DROP POLICY IF EXISTS "detailing_quotes_write" ON detailing_quotes;
CREATE POLICY "detailing_quotes_write" ON detailing_quotes
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'));

-- RLS: appointments
DROP POLICY IF EXISTS "appointments_detailing_write" ON appointments;
CREATE POLICY "appointments_detailing_write" ON appointments
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'));

-- RLS: detailing_receipts
DROP POLICY IF EXISTS "detailing_receipts_staff_write" ON detailing_receipts;
CREATE POLICY "detailing_receipts_staff_write" ON detailing_receipts
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing') OR has_role('detailer') OR has_role('encargado'));

-- RLS: commissions (cada empleado ve solo las suyas, admin ve todas)
DROP POLICY IF EXISTS "commissions_select" ON commissions;
CREATE POLICY "commissions_select" ON commissions
    FOR SELECT TO authenticated
    USING (
        is_admin() OR
        employee_id = auth.uid()::TEXT OR
        employee_id IN (SELECT id FROM profiles WHERE email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "commissions_write" ON commissions;
CREATE POLICY "commissions_write" ON commissions
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());


-- 7. FUNCIÓN DEL SERVIDOR: INGRESO AUTOMÁTICO A LA HORA DEL TURNO
CREATE OR REPLACE FUNCTION detailvlak_auto_ingreso()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cfg RECORD;
    v_auto_enabled BOOLEAN := TRUE;
    v_tolerance_min INTEGER := 0;
    v_updated_count INTEGER := 0;
    v_now_uy TIMESTAMPTZ := TIMEZONE('America/Montevideo', NOW());
    v_cutoff TIMESTAMPTZ;
    r RECORD;
BEGIN
    -- Leer switch de la configuración
    SELECT config INTO v_cfg FROM detailing_configs WHERE id = 'default' LIMIT 1;
    IF FOUND AND v_cfg.config IS NOT NULL THEN
        IF v_cfg.config ? 'auto_ingreso_enabled' THEN
            v_auto_enabled := COALESCE((v_cfg.config->>'auto_ingreso_enabled')::BOOLEAN, TRUE);
        END IF;
        IF v_cfg.config ? 'auto_ingreso_tolerance_minutes' THEN
            v_tolerance_min := COALESCE((v_cfg.config->>'auto_ingreso_tolerance_minutes')::INTEGER, 0);
        END IF;
    END IF;

    IF NOT v_auto_enabled THEN
        RETURN 0;
    END IF;

    -- Calcular hora límite con tolerancia
    v_cutoff := v_now_uy - (v_tolerance_min || ' minutes')::INTERVAL;

    -- Buscar turnos de detailing agendados que ya debieron iniciar
    FOR r IN
        SELECT a.id AS appt_id, a.quote_id, a.start_time, a.title
        FROM appointments a
        WHERE a.business = 'detailing'
          AND COALESCE(a.stage, a.status) = 'Agendado'
          AND a.start_time <= v_cutoff
          AND a.voided_at IS NULL
          AND NOT COALESCE(a.is_blocked, FALSE)
    LOOP
        -- Pasar appointment a 'En taller'
        UPDATE appointments
        SET stage = 'En taller',
            status = 'En taller',
            history = COALESCE(history, '[]'::jsonb) || jsonb_build_array(
                jsonb_build_object(
                    'timestamp', TIMEZONE('utc', NOW()),
                    'from_status', 'Agendado',
                    'to_status', 'En taller',
                    'user_id', 'sistema',
                    'user_name', 'Ingreso automático',
                    'note', 'Ingreso automático por horario del turno cumplido'
                )
            )
        WHERE id = r.appt_id;

        -- Pasar quote asociada a 'En taller'
        IF r.quote_id IS NOT NULL THEN
            UPDATE detailing_quotes
            SET status = 'En taller',
                history = COALESCE(history, '[]'::jsonb) || jsonb_build_array(
                    jsonb_build_object(
                        'timestamp', TIMEZONE('utc', NOW()),
                        'from_status', 'Agendado',
                        'to_status', 'En taller',
                        'user_id', 'sistema',
                        'user_name', 'Ingreso automático',
                        'note', 'Ingreso automático por horario del turno cumplido'
                    )
                )
            WHERE id = r.quote_id AND status = 'Agendado';
        END IF;

        v_updated_count := v_updated_count + 1;
    END LOOP;

    RETURN v_updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION detailvlak_auto_ingreso() TO authenticated, anon;

-- Configuración de pg_cron (ejecutar si la extensión pg_cron está activada):
-- SELECT cron.schedule('detailvlak_auto_ingreso_job', '*/5 * * * *', 'SELECT detailvlak_auto_ingreso();');


-- ==============================================================================
-- 8. SCRIPT SEGURO DE LIMPIEZA DE DATOS DE PRUEBA ("Empezar de cero")
-- ==============================================================================
-- NOTA:
-- Criterio estricto:
-- - Un cliente se borra SOLO si no aparece en: dealership_vehicles.buyer_client_id,
--   dealership_inquiries.client_id, inspections.client_id, ni en ninguna otra tabla.
-- - Un vehículo se borra SOLO si su ID está en detailing_quotes y no aparece en
--   dealership_vehicles ni inspections (comparando por ID).
-- ==============================================================================

/*
-- PASO 1: VERIFICAR QUÉ SE VA A BORRAR
SELECT 'detailing_quotes' AS tabla, COUNT(*) AS registros FROM detailing_quotes;
SELECT 'detailing_payments' AS tabla, COUNT(*) AS registros FROM detailing_payments;
SELECT 'appointments (detailing)' AS tabla, COUNT(*) AS registros FROM appointments WHERE business = 'detailing';
SELECT 'commissions (detailing)' AS tabla, COUNT(*) AS registros FROM commissions WHERE business = 'detailing';
SELECT 'expenses (detailing)' AS tabla, COUNT(*) AS registros FROM expenses WHERE business = 'detailing';
SELECT 'detailing_receipts' AS tabla, COUNT(*) AS registros FROM detailing_receipts;

-- Vehículos protegidos vs vehículos a borrar:
SELECT COUNT(*) AS vehiculos_a_borrar
FROM vehicles v
WHERE v.id IN (SELECT DISTINCT vehicle_id FROM detailing_quotes WHERE vehicle_id IS NOT NULL)
  AND v.id NOT IN (SELECT DISTINCT id FROM dealership_vehicles)
  AND v.id NOT IN (SELECT DISTINCT vehicle_id FROM inspections WHERE vehicle_id IS NOT NULL);

-- Clientes protegidos vs clientes a borrar:
SELECT COUNT(*) AS clientes_a_borrar
FROM clients c
WHERE c.id IN (SELECT DISTINCT client_id FROM detailing_quotes WHERE client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT buyer_client_id FROM dealership_vehicles WHERE buyer_client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT client_id FROM inspections WHERE client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT client_id FROM dealership_inquiries WHERE client_id IS NOT NULL);

-- PASO 2: EJECUCIÓN (DESCOMENTAR PARA CORRER EN SUPABASE SQL EDITOR)
-- DO $$
-- DECLARE
--     v_veh_ids TEXT[];
--     v_cli_ids TEXT[];
-- BEGIN
--     -- Guardar IDs de vehículos y clientes exclusivos de detailing ANTES de borrar las quotes
--     SELECT ARRAY_AGG(id) INTO v_veh_ids
--     FROM vehicles
--     WHERE id IN (SELECT DISTINCT vehicle_id FROM detailing_quotes WHERE vehicle_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT id FROM dealership_vehicles)
--       AND id NOT IN (SELECT DISTINCT vehicle_id FROM inspections WHERE vehicle_id IS NOT NULL);
--
--     SELECT ARRAY_AGG(id) INTO v_cli_ids
--     FROM clients
--     WHERE id IN (SELECT DISTINCT client_id FROM detailing_quotes WHERE client_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT buyer_client_id FROM dealership_vehicles WHERE buyer_client_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT client_id FROM inspections WHERE client_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT client_id FROM dealership_inquiries WHERE client_id IS NOT NULL);
--
--     DELETE FROM detailing_payments;
--     DELETE FROM detailing_receipts;
--     DELETE FROM commissions WHERE business = 'detailing';
--     DELETE FROM appointments WHERE business = 'detailing';
--     DELETE FROM detailing_quotes;
--     DELETE FROM expenses WHERE business = 'detailing';
--
--     -- Borrar SOLO vehículos exclusivos de detailing
--     IF v_veh_ids IS NOT NULL AND array_length(v_veh_ids, 1) > 0 THEN
--         DELETE FROM vehicles WHERE id = ANY(v_veh_ids);
--     END IF;
--
--     -- Borrar SOLO clientes exclusivos de detailing
--     IF v_cli_ids IS NOT NULL AND array_length(v_cli_ids, 1) > 0 THEN
--         DELETE FROM clients WHERE id = ANY(v_cli_ids);
--     END IF;
--
--     -- Reiniciar secuencia de comprobantes
--     PERFORM setval('detailing_receipt_seq', 1, false);
-- END $$;
*/

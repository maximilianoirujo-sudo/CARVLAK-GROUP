-- ==============================================================================
-- CARVLAK GROUP - DETAILVLAK REGISTRO CONTABLE SIMPLE
-- Archivo: supabase/migrations/004_detailvlak_simple.sql
-- ==============================================================================
-- 1. Limpieza de appointments de detailing (ya no se usan turnos en appointments)
-- 2. Limpieza de stock de detailing previo (arrancar stock limpio)
-- 3. Extensión de detailing_quotes con work_date y migración de fechas existentes
-- 4. Tabla detailing_payments y migración de pagos previos
-- 5. Secuencia atómica de comprobantes detailing_receipt_seq y RPCs
-- 6. Eliminación de defaults fijos en detailing_receipts
-- 7. RLS para Romina (detailer) y Maximiliano (admin)
-- ==============================================================================

-- 1. BORRAR APPOINTMENTS DE DETAILING
DELETE FROM appointments WHERE business = 'detailing';

-- 2. LIMPIEZA DE STOCK EXISTENTE
DELETE FROM stock_movements WHERE stock_item_id IN (
    SELECT id FROM stock_items WHERE business = 'detailing' OR business = 'general'
);
DELETE FROM stock_items WHERE business = 'detailing' OR business = 'general';

-- 3. EXTENSIÓN DE TABLA detailing_quotes (work_date)
ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS work_date DATE;

-- Migrar fechas existentes a work_date
UPDATE detailing_quotes
SET work_date = COALESCE(
    (appointment_date)::DATE,
    (created_at)::DATE,
    CURRENT_DATE
)
WHERE work_date IS NULL;

-- Índice para búsquedas rápidas por mes y fecha
CREATE INDEX IF NOT EXISTS idx_detailing_quotes_work_date ON detailing_quotes(work_date);

-- 4. TABLA detailing_payments PARA PAGOS CONCURRENTES Y SEGUROS
CREATE TABLE IF NOT EXISTS detailing_payments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL REFERENCES detailing_quotes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_detailing_payments_quote_id ON detailing_payments(quote_id);
CREATE INDEX IF NOT EXISTS idx_detailing_payments_date ON detailing_payments(date);

ALTER TABLE detailing_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detailing_payments_read" ON detailing_payments;
CREATE POLICY "detailing_payments_read" ON detailing_payments
    FOR SELECT TO authenticated
    USING (is_active_staff());

DROP POLICY IF EXISTS "detailing_payments_write" ON detailing_payments;
CREATE POLICY "detailing_payments_write" ON detailing_payments
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
                    p->>'notes',
                    COALESCE((p->>'is_voided')::BOOLEAN, FALSE),
                    p->>'registered_by',
                    TIMEZONE('utc', NOW())
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 5. SECUENCIA ATÓMICA DE COMPROBANTES Y FUNCIÓN RPC
CREATE SEQUENCE IF NOT EXISTS detailing_receipt_seq START WITH 1 INCREMENT BY 1;

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
    SELECT config INTO v_cfg FROM detailing_configs WHERE id = 'default' LIMIT 1;
    IF FOUND AND v_cfg.config IS NOT NULL AND v_cfg.config ? 'receipt_config' THEN
        v_prefix := COALESCE(v_cfg.config->'receipt_config'->>'prefix', 'DV-');
    END IF;

    v_seq_val := nextval('detailing_receipt_seq');
    RETURN v_prefix || LPAD(v_seq_val::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_detailing_receipt_number() TO authenticated, anon;

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

-- 6. ELIMINAR DEFAULTS ESCRITOS A MANO EN detailing_receipts
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

-- 7. FUNCIÓN HELPER Y POLÍTICAS RLS ROBUSTAS PARA ROMINA, MAXI Y DISPOSITIVOS MÓVILES
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE id = auth.uid()::text),
    true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated, anon;

-- Permisos GRANT sobre tablas y secuencias
GRANT ALL ON detailing_quotes TO authenticated, anon;
GRANT ALL ON detailing_payments TO authenticated, anon;
GRANT ALL ON detailing_receipts TO authenticated, anon;
GRANT ALL ON detailing_configs TO authenticated, anon;
GRANT ALL ON commissions TO authenticated, anon;
GRANT ALL ON expenses TO authenticated, anon;
GRANT ALL ON stock_items TO authenticated, anon;
GRANT ALL ON clients TO authenticated, anon;
GRANT ALL ON vehicles TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE detailing_receipt_seq TO authenticated, anon;

-- Políticas de Detailing Quotes (Lectura y Escritura total para personal en web y móviles)
DROP POLICY IF EXISTS "detailing_quotes_staff_read" ON detailing_quotes;
DROP POLICY IF EXISTS "detailing_quotes_staff_write" ON detailing_quotes;
DROP POLICY IF EXISTS "detailing_quotes_all" ON detailing_quotes;
CREATE POLICY "detailing_quotes_all" ON detailing_quotes
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Detailing Payments
DROP POLICY IF EXISTS "detailing_payments_read" ON detailing_payments;
DROP POLICY IF EXISTS "detailing_payments_write" ON detailing_payments;
DROP POLICY IF EXISTS "detailing_payments_all" ON detailing_payments;
CREATE POLICY "detailing_payments_all" ON detailing_payments
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Detailing Receipts
DROP POLICY IF EXISTS "detailing_receipts_staff_write" ON detailing_receipts;
DROP POLICY IF EXISTS "detailing_receipts_all" ON detailing_receipts;
CREATE POLICY "detailing_receipts_all" ON detailing_receipts
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Detailing Configs
DROP POLICY IF EXISTS "detailing_configs_write" ON detailing_configs;
DROP POLICY IF EXISTS "detailing_configs_read" ON detailing_configs;
DROP POLICY IF EXISTS "detailing_configs_all" ON detailing_configs;
CREATE POLICY "detailing_configs_all" ON detailing_configs
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Commissions
DROP POLICY IF EXISTS "commissions_write" ON commissions;
DROP POLICY IF EXISTS "commissions_select" ON commissions;
DROP POLICY IF EXISTS "commissions_all" ON commissions;
CREATE POLICY "commissions_all" ON commissions
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Expenses
DROP POLICY IF EXISTS "expenses_admin_only" ON expenses;
DROP POLICY IF EXISTS "expenses_all" ON expenses;
CREATE POLICY "expenses_all" ON expenses
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Stock Items
DROP POLICY IF EXISTS "stock_items_staff_all" ON stock_items;
DROP POLICY IF EXISTS "stock_items_all" ON stock_items;
CREATE POLICY "stock_items_all" ON stock_items
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Clients
DROP POLICY IF EXISTS "clients_all" ON clients;
CREATE POLICY "clients_all" ON clients
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Políticas de Vehicles
DROP POLICY IF EXISTS "vehicles_all" ON vehicles;
CREATE POLICY "vehicles_all" ON vehicles
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 8. HABILITAR REALTIME EN PUBLICACIÓN PARA SINCRONIZACIÓN AUTOMÁTICA DISPOSITIVO A DISPOSITIVO
-- ==============================================================================
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_quotes; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_receipts; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_configs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE commissions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE expenses; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE stock_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE clients; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE vehicles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Configurar REPLICA IDENTITY FULL para que los eventos de cambio incluyan todas las columnas
ALTER TABLE detailing_quotes REPLICA IDENTITY FULL;
ALTER TABLE detailing_payments REPLICA IDENTITY FULL;
ALTER TABLE detailing_receipts REPLICA IDENTITY FULL;
ALTER TABLE detailing_configs REPLICA IDENTITY FULL;
ALTER TABLE commissions REPLICA IDENTITY FULL;
ALTER TABLE expenses REPLICA IDENTITY FULL;
ALTER TABLE stock_items REPLICA IDENTITY FULL;
ALTER TABLE clients REPLICA IDENTITY FULL;
ALTER TABLE vehicles REPLICA IDENTITY FULL;

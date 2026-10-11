-- ==============================================================================
-- CARVLAK GROUP - MIGRACIÓN FASE DETAILVLAK (002_detailvlak.sql)
-- ==============================================================================
-- Nuevas tablas y columnas para el módulo de Taller Detailing Profesional:
-- 1. Tabla detailing_configs (Puestos de trabajo, horarios, feriados, plantillas WhatsApp, etc.)
-- 2. Tabla detailing_cash_closures (Cierre de caja y arqueos diarios)
-- 3. Nuevos campos en detailing_quotes (check-in, QC, pagos, auditoría y anulación)
-- 4. Nuevos campos en appointments (puesto de trabajo, etapas de flujo, bloqueo)
-- 5. Nuevos campos en expenses (proveedor, recurrencia, auditoría y anulación)
-- 6. Políticas RLS correspondientes
-- ==============================================================================

-- 1. TABLA: detailing_configs
CREATE TABLE IF NOT EXISTS detailing_configs (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE detailing_configs ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios activos del personal
DROP POLICY IF EXISTS "detailing_configs_read" ON detailing_configs;
CREATE POLICY "detailing_configs_read" ON detailing_configs
    FOR SELECT TO authenticated
    USING (is_active_staff());

-- Escritura solo para administradores y encargados de detailing
DROP POLICY IF EXISTS "detailing_configs_write" ON detailing_configs;
CREATE POLICY "detailing_configs_write" ON detailing_configs
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing'));


-- 2. TABLA: detailing_cash_closures
CREATE TABLE IF NOT EXISTS detailing_cash_closures (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    opening_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_collected NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cash_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    actual_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    closed_by TEXT,
    closed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE detailing_cash_closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detailing_cash_closures_read" ON detailing_cash_closures;
CREATE POLICY "detailing_cash_closures_read" ON detailing_cash_closures
    FOR SELECT TO authenticated
    USING (is_active_staff());

DROP POLICY IF EXISTS "detailing_cash_closures_write" ON detailing_cash_closures;
CREATE POLICY "detailing_cash_closures_write" ON detailing_cash_closures
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing'));


-- 3. EXTENSIÓN DE TABLA detailing_quotes
DO $$
BEGIN
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS work_bay_id TEXT;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS checkin_data JSONB;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS quality_control_data JSONB;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS materials_consumed JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS whatsapp_sent_log JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS voided_by TEXT;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS void_reason TEXT;
END $$;


-- 4. EXTENSIÓN DE TABLA appointments
DO $$
BEGIN
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS work_bay_id TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS quote_id TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stage TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS block_reason TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_sent_log JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS voided_by TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS void_reason TEXT;
END $$;


-- 5. EXTENSIÓN DE TABLA expenses
DO $$
BEGIN
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier TEXT;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_rule TEXT;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pagado';
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_date DATE;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS voided_by TEXT;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS void_reason TEXT;
END $$;

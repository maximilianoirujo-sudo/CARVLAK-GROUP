-- ==============================================================================
-- CARVLAK GROUP - DETAILVLAK SERVICIOS ESPECIALES Y PAGOS AGRUPADOS EMPRESAS
-- Archivo: supabase/migrations/006_detailvlak_empresas_extra.sql
-- ==============================================================================
-- 1. Tabla detailing_company_services (catálogo de servicios especiales B2B)
-- 2. Permisos RLS (personal activo lee; admin crea, edita y borra)
-- 3. Precarga de los 6 servicios de ejemplo sin precio (idempotente)
-- 4. Columna payment_group_id en detailing_payments para pagos simultáneos
-- 5. Publicación en supabase_realtime
-- ==============================================================================

-- 1. TABLA detailing_company_services
CREATE TABLE IF NOT EXISTS detailing_company_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    pricing_mode TEXT NOT NULL DEFAULT 'por_tamaño' CHECK (pricing_mode IN ('por_tamaño', 'unico', 'porcentaje')),
    prices JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb,
    base_price NUMERIC(12, 2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_detailing_company_services_active ON detailing_company_services(is_active);
CREATE INDEX IF NOT EXISTS idx_detailing_company_services_order ON detailing_company_services(sort_order);

-- 2. SEGURIDAD A NIVEL DE FILAS (RLS)
ALTER TABLE detailing_company_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detailing_company_services_select" ON detailing_company_services;
DROP POLICY IF EXISTS "detailing_company_services_insert" ON detailing_company_services;
DROP POLICY IF EXISTS "detailing_company_services_update" ON detailing_company_services;
DROP POLICY IF EXISTS "detailing_company_services_delete" ON detailing_company_services;

-- Leer: personal activo logueado
CREATE POLICY "detailing_company_services_select" ON detailing_company_services
    FOR SELECT TO authenticated
    USING (is_active_staff());

-- Crear, editar y borrar: solo admin
CREATE POLICY "detailing_company_services_insert" ON detailing_company_services
    FOR INSERT TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "detailing_company_services_update" ON detailing_company_services
    FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "detailing_company_services_delete" ON detailing_company_services
    FOR DELETE TO authenticated
    USING (is_admin());

-- 3. PRECARGAR LOS 6 SERVICIOS DE EJEMPLO SIN PRECIO (Una sola vez, sin duplicar)
INSERT INTO detailing_company_services (id, name, description, pricing_mode, prices, base_price, sort_order, is_active)
VALUES
    ('cs-faros', 'Pulido de faros', 'Restauración y pulido de ópticas delanteras', 'unico', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 1, TRUE),
    ('cs-motor', 'Lavado de motor', 'Lavado técnico a vapor y acondicionado de plásticos de vano motor', 'unico', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 2, TRUE),
    ('cs-descontaminado', 'Descontaminado de pintura', 'Tratamiento con clay bar y descontaminante ferroso en toda la carrocería', 'por_tamaño', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 3, TRUE),
    ('cs-pulido', 'Pulido de pintura', 'Abrillantado o corrección preventiva de barniz', 'por_tamaño', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 4, TRUE),
    ('cs-plasticos', 'Tratamiento de plásticos', 'Hidratación y sellado UV de paragolpes, molduras y zócalos', 'unico', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 5, TRUE),
    ('cs-olores', 'Eliminación de olores', 'Generador de ozono / termonebulización desinfectante en cabina', 'unico', '{"1": 0, "2": 0, "3": 0, "4": 0}'::jsonb, 0, 6, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. COLUMNA payment_group_id EN detailing_payments
ALTER TABLE detailing_payments 
    ADD COLUMN IF NOT EXISTS payment_group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_detailing_payments_group_id ON detailing_payments(payment_group_id);

-- 5. REALTIME Y SINCRONIZACIÓN
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_company_services; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE detailing_company_services REPLICA IDENTITY FULL;

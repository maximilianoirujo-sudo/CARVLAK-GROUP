-- ==============================================================================
-- CARVLAK GROUP - DETAILVLAK MÓDULO EMPRESAS Y PREVENTA
-- Archivo: supabase/migrations/005_detailvlak_empresas.sql
-- ==============================================================================
-- 1. Tabla detailing_companies para automotoras y clientes corporativos
-- 2. Modificaciones en detailing_quotes (customer_type, company_id, vehicle_size)
-- 3. Índices optimizados para búsquedas, cuentas y filtros
-- 4. Políticas de seguridad RLS (Admin edita tarifas/borra; Staff/Romina carga y edita)
-- 5. Publicación en supabase_realtime y REPLICA IDENTITY FULL
-- ==============================================================================

-- 1. TABLA detailing_companies
CREATE TABLE IF NOT EXISTS detailing_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rut TEXT,
    legal_name TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    billing_mode TEXT NOT NULL DEFAULT 'mensual' CHECK (billing_mode IN ('por trabajo', 'mensual')),
    pricing_override JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by TEXT
);

-- Índices en detailing_companies
CREATE INDEX IF NOT EXISTS idx_detailing_companies_name ON detailing_companies(name);
CREATE INDEX IF NOT EXISTS idx_detailing_companies_is_active ON detailing_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_detailing_companies_created_at ON detailing_companies(created_at);

-- 2. EXTENSIÓN DE TABLA detailing_quotes PARA TRABAJOS DE EMPRESAS
ALTER TABLE detailing_quotes 
    ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'particular' CHECK (customer_type IN ('particular', 'empresa')),
    ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES detailing_companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_size SMALLINT CHECK (vehicle_size IS NULL OR (vehicle_size >= 1 AND vehicle_size <= 4));

-- Índices en detailing_quotes para consultas de empresas y filtros
CREATE INDEX IF NOT EXISTS idx_detailing_quotes_customer_type ON detailing_quotes(customer_type);
CREATE INDEX IF NOT EXISTS idx_detailing_quotes_company_id ON detailing_quotes(company_id);

-- 3. FUNCIÓN Y TRIGGER PARA IMPEDIR BORRADO DE EMPRESAS CON TRABAJOS ASOCIADOS
CREATE OR REPLACE FUNCTION prevent_detailing_company_delete_with_jobs()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM detailing_quotes WHERE company_id = OLD.id) THEN
        RAISE EXCEPTION 'No se puede eliminar una empresa que tiene trabajos asociados. Desactívela en su lugar.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_detailing_company_delete ON detailing_companies;
CREATE TRIGGER trg_prevent_detailing_company_delete
    BEFORE DELETE ON detailing_companies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_detailing_company_delete_with_jobs();

-- 4. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)
ALTER TABLE detailing_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE detailing_companies ALTER COLUMN created_by SET DEFAULT auth.uid()::text;

DROP POLICY IF EXISTS "detailing_companies_select" ON detailing_companies;
DROP POLICY IF EXISTS "detailing_companies_insert" ON detailing_companies;
DROP POLICY IF EXISTS "detailing_companies_update" ON detailing_companies;
DROP POLICY IF EXISTS "detailing_companies_delete" ON detailing_companies;

-- Leer: solo personal activo logueado (nunca anónimos)
CREATE POLICY "detailing_companies_select" ON detailing_companies
    FOR SELECT TO authenticated
    USING (is_active_staff());

-- Crear: personal activo (para poder crear una empresa desde "Trabajo de empresa")
CREATE POLICY "detailing_companies_insert" ON detailing_companies
    FOR INSERT TO authenticated
    WITH CHECK (is_active_staff());

-- Editar y borrar: solo admin
CREATE POLICY "detailing_companies_update" ON detailing_companies
    FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "detailing_companies_delete" ON detailing_companies
    FOR DELETE TO authenticated
    USING (is_admin());

-- 5. REALTIME Y SINCRONIZACIÓN
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_companies; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE detailing_companies REPLICA IDENTITY FULL;

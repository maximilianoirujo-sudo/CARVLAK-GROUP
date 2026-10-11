-- ==============================================================================
-- CARVLAK GROUP - MIGRACIÓN DETAILVLAK PRODUCCIÓN (003_detailvlak_produccion.sql)
-- ==============================================================================
-- 1. Extensión de columnas en detailing_quotes y commissions
-- 2. Creación de tabla oficial detailing_receipts (Comprobantes numerados)
-- 3. Índices de alta velocidad y función de correlativo
-- 4. Función segura para acceso público al comprobante (SECURITY DEFINER)
-- 5. Políticas RLS estrictas
-- 6. Script SQL de limpieza de datos de prueba ("Empezar de cero") comentado y seguro
-- ==============================================================================

-- 1. EXTENSIÓN DE TABLAS EXISTENTES
DO $$
BEGIN
    -- detailing_quotes: enlace a comprobante y participantes de comisión
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS receipt_id TEXT;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    ALTER TABLE detailing_quotes ADD COLUMN IF NOT EXISTS commission_participants JSONB DEFAULT '[]'::jsonb;

    -- commissions: origen del cliente, número de comprobante y auditoría de ajustes
    ALTER TABLE commissions ADD COLUMN IF NOT EXISTS origin TEXT;
    ALTER TABLE commissions ADD COLUMN IF NOT EXISTS receipt_number TEXT;
    ALTER TABLE commissions ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;
    ALTER TABLE commissions ADD COLUMN IF NOT EXISTS adjusted_at TIMESTAMPTZ;
END $$;


-- 2. TABLA: detailing_receipts
CREATE TABLE IF NOT EXISTS detailing_receipts (
    id TEXT PRIMARY KEY,
    quote_id TEXT REFERENCES detailing_quotes(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    issue_date DATE NOT NULL,
    service_date DATE NOT NULL,
    token TEXT NOT NULL UNIQUE,

    -- Datos del emisor
    company_trade_name TEXT NOT NULL DEFAULT 'CARVLAK DetailVlak',
    company_legal_name TEXT NOT NULL DEFAULT 'CARVLAK GROUP S.A.S.',
    company_rut TEXT NOT NULL DEFAULT '219988770014',
    company_address TEXT NOT NULL DEFAULT 'Av. Giannattasio & Calcagno, Shangrilá, Canelones',
    company_phone TEXT NOT NULL DEFAULT '+598 99 267 964',
    company_instagram TEXT NOT NULL DEFAULT '@car.vlak',
    company_logo_url TEXT DEFAULT '/carvlak-logo-negro.png',

    -- Datos del cliente y vehículo
    client_id TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_doc TEXT,
    vehicle_info TEXT NOT NULL,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_color TEXT,
    vehicle_plate TEXT,
    reception_mileage NUMERIC,

    -- Operador responsable
    detailer_id TEXT,
    detailer_name TEXT NOT NULL DEFAULT 'Detailer Oficial',

    -- Detalle económico
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_label TEXT,
    surcharge_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_pending NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payments JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Pagado',

    -- Cuidados, fotos y leyendas
    care_instructions TEXT,
    observations TEXT,
    include_photos BOOLEAN NOT NULL DEFAULT FALSE,
    photos_before JSONB DEFAULT '[]'::jsonb,
    photos_after JSONB DEFAULT '[]'::jsonb,
    footer_legend TEXT DEFAULT 'Comprobante de servicio. No válido como factura electrónica (CFE).',

    -- Estado de anulación y auditoría
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by TEXT
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_detailing_receipts_token ON detailing_receipts(token);
CREATE INDEX IF NOT EXISTS idx_detailing_receipts_quote_id ON detailing_receipts(quote_id);
CREATE INDEX IF NOT EXISTS idx_detailing_receipts_issue_date ON detailing_receipts(issue_date);
CREATE INDEX IF NOT EXISTS idx_detailing_receipts_receipt_num ON detailing_receipts(receipt_number);


-- 3. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE detailing_receipts ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados del staff
DROP POLICY IF EXISTS "detailing_receipts_staff_read" ON detailing_receipts;
CREATE POLICY "detailing_receipts_staff_read" ON detailing_receipts
    FOR SELECT TO authenticated
    USING (is_active_staff());

-- Creación y edición para administradores y encargados de detailing
DROP POLICY IF EXISTS "detailing_receipts_staff_write" ON detailing_receipts;
CREATE POLICY "detailing_receipts_staff_write" ON detailing_receipts
    FOR ALL TO authenticated
    USING (is_admin() OR has_role('encargado_detailing'))
    WITH CHECK (is_admin() OR has_role('encargado_detailing'));


-- 4. FUNCIÓN PÚBLICA PARA CONSULTAR COMPROBANTE POR TOKEN
-- Permite que los clientes vean su comprobante web sin estar autenticados,
-- devolviendo únicamente la información pública necesaria.
CREATE OR REPLACE FUNCTION get_public_detailing_receipt(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_receipt RECORD;
BEGIN
    SELECT * INTO v_receipt
    FROM detailing_receipts
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'id', v_receipt.id,
        'receipt_number', v_receipt.receipt_number,
        'version', v_receipt.version,
        'issue_date', v_receipt.issue_date,
        'service_date', v_receipt.service_date,
        'token', v_receipt.token,
        'company_trade_name', v_receipt.company_trade_name,
        'company_legal_name', v_receipt.company_legal_name,
        'company_rut', v_receipt.company_rut,
        'company_address', v_receipt.company_address,
        'company_phone', v_receipt.company_phone,
        'company_instagram', v_receipt.company_instagram,
        'company_logo_url', v_receipt.company_logo_url,
        'client_name', v_receipt.client_name,
        'client_phone', v_receipt.client_phone,
        'vehicle_info', v_receipt.vehicle_info,
        'vehicle_plate', v_receipt.vehicle_plate,
        'reception_mileage', v_receipt.reception_mileage,
        'detailer_name', v_receipt.detailer_name,
        'services', v_receipt.services,
        'subtotal', v_receipt.subtotal,
        'discount_amount', v_receipt.discount_amount,
        'discount_label', v_receipt.discount_label,
        'surcharge_amount', v_receipt.surcharge_amount,
        'total_amount', v_receipt.total_amount,
        'deposit_amount', v_receipt.deposit_amount,
        'balance_pending', v_receipt.balance_pending,
        'payments', v_receipt.payments,
        'status', v_receipt.status,
        'care_instructions', v_receipt.care_instructions,
        'observations', v_receipt.observations,
        'include_photos', v_receipt.include_photos,
        'photos_before', v_receipt.photos_before,
        'photos_after', v_receipt.photos_after,
        'footer_legend', v_receipt.footer_legend,
        'is_voided', v_receipt.is_voided,
        'voided_at', v_receipt.voided_at,
        'void_reason', v_receipt.void_reason
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_detailing_receipt(TEXT) TO anon, authenticated;


-- ==============================================================================
-- 5. HERRAMIENTA SQL: LIMPIEZA DE DATOS DE PRUEBA ("Empezar de cero")
-- ==============================================================================
-- NOTA: Este bloque está comentado. Para ejecutarlo manualmente en Supabase SQL Editor:
-- Paso A: Ejecutar primero las consultas SELECT para ver qué se borraría.
-- Paso B: Descomentar y ejecutar el bloque DO $$ BEGIN ... END $$;.
-- GARANTÍA: Los clientes y autos vinculados a la automotora o peritajes están protegidos.
-- ==============================================================================

/*
-- PASO A: VERIFICACIÓN PREVIA (Cuántos registros de prueba existen)
SELECT 'detailing_quotes' AS tabla, COUNT(*) AS registros FROM detailing_quotes;
SELECT 'appointments (detailing)' AS tabla, COUNT(*) AS registros FROM appointments WHERE business = 'detailing';
SELECT 'commissions (detailing)' AS tabla, COUNT(*) AS registros FROM commissions WHERE business = 'detailing';
SELECT 'expenses (detailing)' AS tabla, COUNT(*) AS registros FROM expenses WHERE business = 'detailing';
SELECT 'detailing_receipts' AS tabla, COUNT(*) AS registros FROM detailing_receipts;

-- Vehículos y clientes que SOLO tienen relación con Detailing (se borrarían):
SELECT COUNT(*) AS vehiculos_solo_detailing
FROM vehicles v
WHERE v.id IN (SELECT DISTINCT vehicle_id FROM detailing_quotes WHERE vehicle_id IS NOT NULL)
  AND v.id NOT IN (SELECT DISTINCT id FROM dealership_vehicles)
  AND v.id NOT IN (SELECT DISTINCT vehicle_id FROM inspections WHERE vehicle_id IS NOT NULL);

SELECT COUNT(*) AS clientes_solo_detailing
FROM clients c
WHERE c.id IN (SELECT DISTINCT client_id FROM detailing_quotes WHERE client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT buyer_client_id FROM dealership_vehicles WHERE buyer_client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT client_id FROM inspections WHERE client_id IS NOT NULL)
  AND c.id NOT IN (SELECT DISTINCT client_id FROM dealership_inquiries WHERE client_id IS NOT NULL);


-- PASO B: EJECUCIÓN DEL BORRADO DE PRUEBA (DESCOMENTAR SI SE DESEA EJECUTAR DIRECTO)
-- DO $$
-- BEGIN
--     -- 1. Borrar comprobantes de detailing
--     DELETE FROM detailing_receipts;
--
--     -- 2. Borrar comisiones de detailing
--     DELETE FROM commissions WHERE business = 'detailing';
--
--     -- 3. Borrar turnos de calendario de detailing
--     DELETE FROM appointments WHERE business = 'detailing';
--
--     -- 4. Borrar cotizaciones y trabajos de detailing
--     DELETE FROM detailing_quotes;
--
--     -- 5. Borrar gastos operativos de detailing
--     DELETE FROM expenses WHERE business = 'detailing';
--
--     -- 6. Borrar vehículos que solo pertenecían a trabajos de detailing (no automotora ni peritajes)
--     DELETE FROM vehicles
--     WHERE id NOT IN (SELECT DISTINCT id FROM dealership_vehicles)
--       AND id NOT IN (SELECT DISTINCT vehicle_id FROM inspections WHERE vehicle_id IS NOT NULL);
--
--     -- 7. Borrar clientes que solo pertenecían a detailing
--     DELETE FROM clients
--     WHERE id NOT IN (SELECT DISTINCT buyer_client_id FROM dealership_vehicles WHERE buyer_client_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT client_id FROM inspections WHERE client_id IS NOT NULL)
--       AND id NOT IN (SELECT DISTINCT client_id FROM dealership_inquiries WHERE client_id IS NOT NULL);
--
--     -- 8. Resetear correlativo de comprobantes a 1 en detailing_configs
--     UPDATE detailing_configs
--     SET config = jsonb_set(
--         COALESCE(config, '{}'::jsonb),
--         '{receipt_config,next_number}',
--         '1'::jsonb
--     )
--     WHERE id = 'default';
-- END $$;
*/

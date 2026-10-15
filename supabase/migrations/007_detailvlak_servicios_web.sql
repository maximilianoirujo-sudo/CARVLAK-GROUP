-- ==============================================================================
-- CARVLAK GROUP - DETAILVLAK SERVICIOS WEB Y BANDEJA DE SOLICITUDES
-- Archivo: supabase/migrations/007_detailvlak_servicios_web.sql
-- ==============================================================================
-- 1. Extensión de detailing_tariffs (video_url, steps, products, featured, order, cover_photo)
-- 2. Tabla detailing_web_requests (solicitudes de presupuestos web)
-- 3. Permisos RLS (público anónimo inserta solicitud; staff lee y gestiona; admin borra)
-- 4. RPC segura submit_quote_request para clientes anónimos
-- 5. Publicación en supabase_realtime
-- ==============================================================================

-- 1. EXTENSIÓN DE TABLA detailing_tariffs PARA CATÁLOGO WEB Y TIME-LAPSE
ALTER TABLE detailing_tariffs
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cover_photo TEXT;

-- Permitir a usuarios anónimos leer los servicios activos en la web pública
DROP POLICY IF EXISTS "anon_select_active_tariffs" ON detailing_tariffs;
CREATE POLICY "anon_select_active_tariffs" ON detailing_tariffs
    FOR SELECT TO anon
    USING (is_active = TRUE);

-- 2. TABLA detailing_web_requests (Bandeja de Presupuestos Web)
CREATE TABLE IF NOT EXISTS detailing_web_requests (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    vehicle_brand TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INT,
    vehicle_plate TEXT,
    vehicle_category TEXT DEFAULT 'Mediano',
    preferred_date DATE,
    comments TEXT,
    selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    origin TEXT NOT NULL DEFAULT 'Web',
    is_paid_ad BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'nueva' CHECK (status IN ('nueva', 'contactado', 'confirmado', 'descartado')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_detailing_web_requests_status ON detailing_web_requests(status);
CREATE INDEX IF NOT EXISTS idx_detailing_web_requests_created_at ON detailing_web_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detailing_web_requests_phone ON detailing_web_requests(client_phone);
CREATE INDEX IF NOT EXISTS idx_detailing_web_requests_ad ON detailing_web_requests(is_paid_ad);

-- 3. SEGURIDAD A NIVEL DE FILAS (RLS)
ALTER TABLE detailing_web_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "detailing_web_requests_anon_insert" ON detailing_web_requests;
DROP POLICY IF EXISTS "detailing_web_requests_staff_select" ON detailing_web_requests;
DROP POLICY IF EXISTS "detailing_web_requests_staff_update" ON detailing_web_requests;
DROP POLICY IF EXISTS "detailing_web_requests_admin_delete" ON detailing_web_requests;

-- Permitir que cualquier visitante de la web pública pueda enviar una solicitud
CREATE POLICY "detailing_web_requests_anon_insert" ON detailing_web_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

-- Personal activo logueado puede ver todas las solicitudes
CREATE POLICY "detailing_web_requests_staff_select" ON detailing_web_requests
    FOR SELECT TO authenticated
    USING (is_active_staff());

-- Personal activo logueado puede cambiar estado (nueva/contactado/confirmado/descartado)
CREATE POLICY "detailing_web_requests_staff_update" ON detailing_web_requests
    FOR UPDATE TO authenticated
    USING (is_active_staff())
    WITH CHECK (is_active_staff());

-- Solo admin puede borrar definitivamente solicitudes
CREATE POLICY "detailing_web_requests_admin_delete" ON detailing_web_requests
    FOR DELETE TO authenticated
    USING (is_admin());

-- 4. RPC SEGURA submit_quote_request
CREATE OR REPLACE FUNCTION submit_quote_request(payload JSONB)
RETURNS JSONB AS $$
DECLARE
    new_id TEXT := 'webreq-' || gen_random_uuid();
    new_code TEXT := COALESCE(payload->>'code', 'DV-26-' || (1000 + floor(random() * 9000)::int));
BEGIN
    INSERT INTO detailing_web_requests (
        id,
        code,
        client_name,
        client_phone,
        client_email,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        vehicle_plate,
        vehicle_category,
        preferred_date,
        comments,
        selected_services,
        total_amount,
        origin,
        is_paid_ad,
        status,
        created_at,
        updated_at
    ) VALUES (
        new_id,
        new_code,
        COALESCE(payload->>'client_name', 'Sin nombre'),
        COALESCE(payload->>'client_phone', ''),
        payload->>'client_email',
        COALESCE(payload->>'vehicle_brand', ''),
        COALESCE(payload->>'vehicle_model', ''),
        (payload->>'vehicle_year')::INT,
        payload->>'vehicle_plate',
        COALESCE(payload->>'vehicle_category', 'Mediano'),
        (payload->>'preferred_date')::DATE,
        payload->>'comments',
        COALESCE(payload->'selected_services', '[]'::jsonb),
        COALESCE((payload->>'total_amount')::NUMERIC, 0),
        COALESCE(payload->>'origin', 'Web'),
        COALESCE((payload->>'is_paid_ad')::BOOLEAN, FALSE),
        'nueva',
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    );

    RETURN jsonb_build_object('success', TRUE, 'id', new_id, 'code', new_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_quote_request(JSONB) TO anon, authenticated;

-- 5. PUBLICACIÓN EN SUPABASE REALTIME
DO $$
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE detailing_web_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE detailing_web_requests REPLICA IDENTITY FULL;

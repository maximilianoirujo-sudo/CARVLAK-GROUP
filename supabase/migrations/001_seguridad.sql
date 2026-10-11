-- ==============================================================================
-- CARVLAK GROUP - MIGRACIÓN FASE 1: SEGURIDAD, RLS & PÁGINAS PÚBLICAS
-- Archivo: supabase/migrations/001_seguridad.sql
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. FUNCIONES DE ROLES Y SEGURIDAD (SECURITY DEFINER)
-- ==============================================================================

-- Verifica si el usuario actual autenticado está activo en profiles
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND is_active = true
  );
$$;

-- Verifica si el usuario actual activo posee un rol específico
CREATE OR REPLACE FUNCTION public.has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND is_active = true
      AND p_role = ANY(roles)
  );
$$;

-- Verifica si el usuario actual activo es Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
      AND is_active = true
      AND 'admin' = ANY(roles)
  );
$$;

-- Otorgar permisos de ejecución sobre las funciones de chequeo
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ==============================================================================
-- 3. ACTIVAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ==============================================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'general_configs', 'profiles', 'clients', 'vehicles', 'vehicle_history',
    'appointments', 'tasks', 'dealership_configs', 'dealership_vehicles',
    'dealership_inquiries', 'detailing_tariffs', 'detailing_quotes',
    'stock_items', 'stock_movements', 'expenses', 'commissions',
    'whatsapp_templates', 'inspection_tariffs', 'vehicle_inspections',
    'social_media_configs', 'social_templates', 'social_post_records',
    'activity_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 4. REVOCAR ACCESO DIRECTO DE TABLAS A USUARIOS ANÓNIMOS
-- El usuario anónimo NO tiene acceso directo a ninguna tabla interna
-- ==============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Eliminar políticas anónimas previas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND (policyname ILIKE '%anon%' OR roles @> ARRAY['anon']::name[])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ==============================================================================
-- 5. POLÍTICAS PARA TABLAS INTERNAS (SOLO USUARIOS AUTENTICADOS Y ACTIVOS)
-- ==============================================================================

-- 5.1 Políticas estándar para tablas operativas internas del equipo
DO $$
DECLARE
  t text;
  std_tables text[] := ARRAY[
    'general_configs', 'profiles', 'clients', 'vehicles', 'vehicle_history',
    'appointments', 'tasks', 'dealership_configs', 'dealership_inquiries',
    'detailing_tariffs', 'detailing_quotes', 'stock_items', 'stock_movements',
    'expenses', 'whatsapp_templates', 'inspection_tariffs', 'vehicle_inspections',
    'social_media_configs', 'social_templates', 'social_post_records',
    'activity_logs'
  ];
BEGIN
  FOREACH t IN ARRAY std_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "auth_active_all_%I" ON public.%I', t, t);
      EXECUTE format('CREATE POLICY "auth_active_all_%I" ON public.%I FOR ALL TO authenticated USING (public.is_active_user()) WITH CHECK (public.is_active_user())', t, t);
    END IF;
  END LOOP;
END $$;

-- 5.2 commissions: El admin ve todas; cada empleado ve solo las suyas
DROP POLICY IF EXISTS "auth_active_all_commissions" ON public.commissions;
DROP POLICY IF EXISTS "commissions_select_policy" ON public.commissions;
DROP POLICY IF EXISTS "commissions_write_policy" ON public.commissions;

CREATE POLICY "commissions_select_policy" ON public.commissions
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR 
    (public.is_active_user() AND employee_id = auth.uid()::text)
  );

CREATE POLICY "commissions_write_policy" ON public.commissions
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR 
    (public.is_active_user() AND (public.has_role('encargado') OR employee_id = auth.uid()::text))
  )
  WITH CHECK (
    public.is_admin() OR 
    (public.is_active_user() AND (public.has_role('encargado') OR employee_id = auth.uid()::text))
  );

-- ==============================================================================
-- 6. dealership_vehicles: VISTA DE STAFF Y SEGURIDAD DE COSTOS
-- ==============================================================================

-- Solo el admin lee la tabla base dealership_vehicles completa
DROP POLICY IF EXISTS "auth_active_all_dealership_vehicles" ON public.dealership_vehicles;
DROP POLICY IF EXISTS "dealership_vehicles_admin_read" ON public.dealership_vehicles;
DROP POLICY IF EXISTS "dealership_vehicles_admin_all" ON public.dealership_vehicles;

CREATE POLICY "dealership_vehicles_admin_all" ON public.dealership_vehicles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Vista dealership_vehicles_staff para personal sin columnas confidenciales de costos y márgenes
CREATE OR REPLACE VIEW public.dealership_vehicles_staff AS
SELECT
  id,
  empresa_id,
  vehicle_id,
  condition,
  plate,
  chassis_vin,
  autonomy_km,
  brand,
  model,
  version,
  year,
  mileage,
  category,
  body_type,
  engine,
  doors,
  transmission,
  fuel,
  color_exterior,
  padron,
  vin,
  tiendanube_id,
  incomplete_data,
  status,
  is_featured,
  features,
  images,
  flyer_images,
  cover_image,
  catalog_description,
  purchase_date,
  purchase_origin,
  docs_received,
  sale_price,
  sale_currency,
  financing_available,
  min_down_payment_usd,
  monthly_installment_estimate_usd,
  inspection_id,
  inspection_score,
  inspection_traffic_light,
  detailing_quote_id,
  prep_checklist,
  prep_assigned_to,
  delivery_checklist,
  reservation,
  sale_record,
  custom_fields,
  history,
  is_archived,
  tiendanube_synced_at,
  tiendanube_sync_status,
  tiendanube_sync_error,
  created_at,
  updated_at
FROM public.dealership_vehicles;

-- Permisos de lectura para staff sobre la vista
GRANT SELECT ON public.dealership_vehicles_staff TO authenticated;

-- Permisos por columna y política para que encargados y vendedores puedan actualizar datos comerciales
GRANT UPDATE (
  status, sale_price, sale_currency, plate, brand, model, version, year, mileage,
  category, body_type, engine, doors, transmission, fuel, color_exterior, padron, vin, chassis_vin,
  autonomy_km, is_featured, features, images, flyer_images, cover_image, catalog_description,
  docs_received, prep_checklist, prep_assigned_to, delivery_checklist, reservation,
  sale_record, custom_fields, history, incomplete_data, updated_at
) ON public.dealership_vehicles TO authenticated;

DROP POLICY IF EXISTS "dealership_vehicles_staff_update" ON public.dealership_vehicles;
CREATE POLICY "dealership_vehicles_staff_update" ON public.dealership_vehicles
  FOR UPDATE TO authenticated
  USING (
    public.is_active_user() AND (
      public.is_admin() OR 
      public.has_role('encargado') OR 
      public.has_role('vendedor')
    )
  )
  WITH CHECK (
    public.is_active_user() AND (
      public.is_admin() OR 
      public.has_role('encargado') OR 
      public.has_role('vendedor')
    )
  );

-- Función RPC para actualizar datos comerciales garantizando que los costos permanezcan inalterables
CREATE OR REPLACE FUNCTION public.update_dealership_vehicle_staff(
  p_id TEXT,
  p_patch JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_authorized BOOLEAN;
BEGIN
  v_authorized := public.is_admin() OR public.has_role('encargado') OR public.has_role('vendedor');
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'No posee autorización para actualizar vehículos en stock';
  END IF;

  UPDATE public.dealership_vehicles
  SET
    status = COALESCE((p_patch->>'status')::text, status),
    sale_price = COALESCE((p_patch->>'sale_price')::numeric, sale_price),
    sale_currency = COALESCE((p_patch->>'sale_currency')::text, sale_currency),
    plate = COALESCE((p_patch->>'plate')::text, plate),
    brand = COALESCE((p_patch->>'brand')::text, brand),
    model = COALESCE((p_patch->>'model')::text, model),
    version = COALESCE((p_patch->>'version')::text, version),
    year = COALESCE((p_patch->>'year')::integer, year),
    mileage = COALESCE((p_patch->>'mileage')::integer, mileage),
    category = COALESCE((p_patch->>'category')::text, category),
    body_type = COALESCE((p_patch->>'body_type')::text, body_type),
    transmission = COALESCE((p_patch->>'transmission')::text, transmission),
    fuel = COALESCE((p_patch->>'fuel')::text, fuel),
    color_exterior = COALESCE((p_patch->>'color_exterior')::text, color_exterior),
    padron = COALESCE((p_patch->>'padron')::text, padron),
    vin = COALESCE((p_patch->>'vin')::text, vin),
    chassis_vin = COALESCE((p_patch->>'chassis_vin')::text, chassis_vin),
    autonomy_km = COALESCE((p_patch->>'autonomy_km')::integer, autonomy_km),
    is_featured = COALESCE((p_patch->>'is_featured')::boolean, is_featured),
    features = CASE WHEN p_patch ? 'features' THEN (p_patch->'features') ELSE features END,
    images = CASE WHEN p_patch ? 'images' THEN (p_patch->'images') ELSE images END,
    flyer_images = CASE WHEN p_patch ? 'flyer_images' THEN (p_patch->'flyer_images') ELSE flyer_images END,
    cover_image = COALESCE((p_patch->>'cover_image')::text, cover_image),
    catalog_description = COALESCE((p_patch->>'catalog_description')::text, catalog_description),
    docs_received = CASE WHEN p_patch ? 'docs_received' THEN (p_patch->'docs_received') ELSE docs_received END,
    prep_checklist = CASE WHEN p_patch ? 'prep_checklist' THEN (p_patch->'prep_checklist') ELSE prep_checklist END,
    prep_assigned_to = COALESCE((p_patch->>'prep_assigned_to')::text, prep_assigned_to),
    delivery_checklist = CASE WHEN p_patch ? 'delivery_checklist' THEN (p_patch->'delivery_checklist') ELSE delivery_checklist END,
    reservation = CASE WHEN p_patch ? 'reservation' THEN (p_patch->'reservation') ELSE reservation END,
    sale_record = CASE WHEN p_patch ? 'sale_record' THEN (p_patch->'sale_record') ELSE sale_record END,
    custom_fields = CASE WHEN p_patch ? 'custom_fields' THEN (p_patch->'custom_fields') ELSE custom_fields END,
    history = CASE WHEN p_patch ? 'history' THEN (p_patch->'history') ELSE history END,
    incomplete_data = COALESCE((p_patch->>'incomplete_data')::boolean, incomplete_data),
    updated_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'id', p_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_dealership_vehicle_staff(TEXT, JSONB) TO authenticated;

-- ==============================================================================
-- 7. PÁGINAS PÚBLICAS SEGURAS (SIN ACCESO DIRECTO A TABLAS)
-- ==============================================================================

-- 7.1 Vista dealership_public_catalog_view (solo autos publicados y columnas públicas)
CREATE OR REPLACE VIEW public.dealership_public_catalog_view AS
SELECT
  id,
  empresa_id,
  condition,
  brand,
  model,
  version,
  year,
  mileage,
  category,
  body_type,
  engine,
  doors,
  transmission,
  fuel,
  color_exterior,
  is_featured,
  features,
  images,
  flyer_images,
  cover_image,
  catalog_description,
  sale_price,
  sale_currency,
  financing_available,
  min_down_payment_usd,
  monthly_installment_estimate_usd,
  autonomy_km,
  status
FROM public.dealership_vehicles
WHERE status = 'publicado' AND is_archived = false;

GRANT SELECT ON public.dealership_public_catalog_view TO anon, authenticated;

-- 7.2 RPC SECURITY DEFINER submit_quote_request(payload)
CREATE OR REPLACE FUNCTION public.submit_quote_request(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_clean_phone TEXT;
  v_name TEXT;
  v_brand TEXT;
  v_model TEXT;
  v_year INT;
  v_plate TEXT;
  v_category TEXT;
  v_comments TEXT;
  v_photo_url TEXT;
  v_services JSONB;
  v_subtotal NUMERIC;
  v_total NUMERIC;
  v_client_id TEXT;
  v_vehicle_id TEXT;
  v_quote_id TEXT;
BEGIN
  v_name := COALESCE(NULLIF(trim(payload->>'client_name'), ''), 'Cliente Web');
  v_phone := COALESCE(NULLIF(trim(payload->>'client_phone'), ''), '');
  IF v_phone = '' THEN
    RAISE EXCEPTION 'El teléfono es obligatorio para enviar la cotización';
  END IF;

  -- Normalización de teléfono a formato WhatsApp
  v_clean_phone := regexp_replace(v_phone, '\D', '', 'g');
  IF length(v_clean_phone) > 8 AND v_clean_phone NOT LIKE '598%' THEN
    IF v_clean_phone LIKE '0%' THEN
      v_clean_phone := '598' || substr(v_clean_phone, 2);
    ELSE
      v_clean_phone := '598' || v_clean_phone;
    END IF;
  END IF;

  v_brand := COALESCE(NULLIF(trim(payload->>'vehicle_brand'), ''), 'Vehículo');
  v_model := COALESCE(NULLIF(trim(payload->>'vehicle_model'), ''), 'Sin modelo');
  v_year := NULLIF(payload->>'vehicle_year', '')::integer;
  v_plate := upper(trim(COALESCE(payload->>'vehicle_plate', '')));
  v_category := COALESCE(NULLIF(trim(payload->>'vehicle_category'), ''), 'Mediano');
  v_comments := payload->>'comments';
  v_photo_url := payload->>'photo_url';
  v_services := COALESCE(payload->'selected_services', '[]'::jsonb);
  v_subtotal := COALESCE((payload->>'subtotal')::numeric, 0);
  v_total := COALESCE((payload->>'total_amount')::numeric, v_subtotal);

  -- 1. Buscar cliente existente por teléfono normalizado o crearlo
  SELECT id INTO v_client_id
  FROM public.clients
  WHERE regexp_replace(phone, '\D', '', 'g') = v_clean_phone
     OR phone = v_phone
  LIMIT 1;

  IF v_client_id IS NULL THEN
    v_client_id := 'cli-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    INSERT INTO public.clients (
      id, full_name, phone, origin, notes, created_at, updated_at
    ) VALUES (
      v_client_id, v_name, v_phone, 'Google Form', 'Solicitud desde cotizador público web', now(), now()
    );
  END IF;

  -- 2. Registrar vehículo asociado
  v_vehicle_id := 'veh-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  INSERT INTO public.vehicles (
    id, client_id, brand, model, year, plate, category, ownership, photos, created_at, updated_at
  ) VALUES (
    v_vehicle_id, v_client_id, v_brand, v_model, v_year, v_plate, v_category, 'client',
    CASE WHEN v_photo_url IS NOT NULL AND v_photo_url <> '' THEN ARRAY[v_photo_url] ELSE '{}'::text[] END,
    now(), now()
  );

  -- 3. Crear cotización 'Por Cotizar'
  v_quote_id := 'quo-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  INSERT INTO public.detailing_quotes (
    id, client_id, vehicle_id, client_name, client_phone,
    vehicle_info, vehicle_plate, vehicle_category, selected_services,
    subtotal, total_amount, notes, status, origin,
    photos_before, created_at, updated_at
  ) VALUES (
    v_quote_id, v_client_id, v_vehicle_id, v_name, v_phone,
    v_brand || ' ' || v_model || CASE WHEN v_year IS NOT NULL THEN ' (' || v_year || ')' ELSE '' END,
    v_plate, v_category, v_services,
    v_subtotal, v_total,
    COALESCE(NULLIF(trim(v_comments), ''), 'Solicitud enviada desde cotizador web'),
    'Por Cotizar', 'Form Web',
    CASE WHEN v_photo_url IS NOT NULL AND v_photo_url <> '' THEN ARRAY[v_photo_url] ELSE '{}'::text[] END,
    now(), now()
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quote_request(JSONB) TO anon, authenticated;

-- 7.3 RPC SECURITY DEFINER get_inspection_report(token)
CREATE OR REPLACE FUNCTION public.get_inspection_report(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'token', token,
    'vehicle_plate', vehicle_plate,
    'vehicle_info', vehicle_info,
    'vehicle_category', vehicle_category,
    'buyer_name', buyer_name,
    'status', status,
    'scheduled_at', scheduled_at,
    'completed_at', completed_at,
    'checklist', checklist,
    'panels', panels,
    'obd_codes', obd_codes,
    'obd_notes', obd_notes,
    'sucive_debt', sucive_debt,
    'sucive_status', sucive_status,
    'mileage_declared', mileage_declared,
    'mileage_observed', mileage_observed,
    'mileage_tampered', mileage_tampered,
    'score', score,
    'traffic_light', traffic_light,
    'inspector_conclusion', inspector_conclusion,
    'estimated_repair_cost', estimated_repair_cost,
    'repair_details', repair_details,
    'photos', photos,
    'inspector_signature', inspector_signature,
    'created_at', created_at
  ) INTO v_report
  FROM public.vehicle_inspections
  WHERE token = p_token
    AND status = 'Completada'
    AND is_archived = false
  LIMIT 1;

  RETURN v_report;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inspection_report(TEXT) TO anon, authenticated;

-- 7.4 RPC SECURITY DEFINER para configuración pública
CREATE OR REPLACE FUNCTION public.get_public_config()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'company_name', company_name,
    'company_phone', company_phone,
    'company_phone_formatted', company_phone_formatted,
    'address', address,
    'instagram_handle', instagram_handle,
    'catalog_url', catalog_url
  )
  FROM public.general_configs
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_config() TO anon, authenticated;

-- ==============================================================================
-- 8. STORAGE: BUCKET MEDIA (Lectura pública, escritura solo autenticados)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_authenticated_insert" ON storage.objects;
CREATE POLICY "media_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_active_user());

DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
CREATE POLICY "media_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_active_user())
  WITH CHECK (bucket_id = 'media' AND public.is_active_user());

DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
CREATE POLICY "media_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_active_user());

-- ==============================================================================
-- 9. MIGRACIÓN DE FECHAS EN UTC "Z" A ZONA HORARIA DE URUGUAY
-- ==============================================================================
-- Ajustar appointments, cotizaciones e inspecciones para asegurar coherencia en PostgreSQL
UPDATE public.appointments
SET start_time = (start_time AT TIME ZONE 'America/Montevideo') AT TIME ZONE 'America/Montevideo'
WHERE start_time IS NOT NULL;

UPDATE public.vehicle_inspections
SET scheduled_at = (scheduled_at AT TIME ZONE 'America/Montevideo') AT TIME ZONE 'America/Montevideo'
WHERE scheduled_at IS NOT NULL;

UPDATE public.detailing_quotes
SET appointment_date = (appointment_date AT TIME ZONE 'America/Montevideo') AT TIME ZONE 'America/Montevideo'
WHERE appointment_date IS NOT NULL;

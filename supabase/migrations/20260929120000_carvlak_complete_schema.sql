-- ==============================================================================
-- CARVLAK GROUP - ESQUEMA INTEGRAL SUPABASE & SEGURIDAD RLS
-- Migración 20260929120000_carvlak_complete_schema.sql
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: CONFIGURACIÓN GENERAL (Datos de contacto, dirección, teléfonos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.general_configs (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'CARVLAK Group',
  company_phone TEXT NOT NULL DEFAULT '59899267964',
  company_phone_formatted TEXT NOT NULL DEFAULT '099 267 964',
  jonathan_phone TEXT NOT NULL DEFAULT '59899267964',
  address TEXT NOT NULL DEFAULT 'Av. Giannattasio & Calcagno, Shangrilá, Canelones',
  instagram_handle TEXT NOT NULL DEFAULT '@car.vlak',
  catalog_url TEXT NOT NULL DEFAULT 'https://carvlak.com/?catalogo=autos',
  default_exchange_rate NUMERIC NOT NULL DEFAULT 43.50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.general_configs (id, company_name, company_phone, company_phone_formatted, jonathan_phone, address, instagram_handle, default_exchange_rate)
VALUES ('default', 'CARVLAK Group', '59899267964', '099 267 964', '59899267964', 'Av. Giannattasio & Calcagno, Shangrilá, Canelones', '@car.vlak', 43.50)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. TABLA: PROFILES (Perfiles de empleados y usuarios de sistema)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Soporta UUID de auth.users o ID de usuario 'user-maxi', etc.
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  roles TEXT[] NOT NULL DEFAULT '{detailer}', -- 'admin', 'encargado', 'detailer', 'inspector', 'vendedor'
  businesses TEXT[] NOT NULL DEFAULT '{detailing}', -- 'automotora', 'detailing', 'inspeccion'
  is_active BOOLEAN NOT NULL DEFAULT true,
  commissions JSONB NOT NULL DEFAULT '{"automotora": 0, "detailing": 0, "inspeccion": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. TABLA: CLIENTES (Directorio compartido de clientes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cedula TEXT,
  origin TEXT NOT NULL DEFAULT 'WhatsApp',
  notes TEXT,
  social_media_consent BOOLEAN DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_archived ON public.clients(is_archived);

-- ==============================================================================
-- 5. TABLA: VEHÍCULOS (Ficha vehicular centralizada)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL, -- Normalizada en mayúsculas (puede ser vacía si es 0km sin matricular)
  chassis_vin TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  mileage INTEGER DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Mediano', -- 'Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'
  ownership TEXT NOT NULL DEFAULT 'client', -- 'client', 'dealership'
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  photos TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis ON public.vehicles(chassis_vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles(client_id);

-- ==============================================================================
-- 6. TABLA: HISTORIAL DE VEHÍCULOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicle_history (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  business TEXT NOT NULL, -- 'automotora', 'detailing', 'inspeccion'
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle ON public.vehicle_history(vehicle_id);

-- ==============================================================================
-- 7. TABLA: AGENDA / APPOINTMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  business TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  title TEXT,
  notes TEXT,
  price_amount NUMERIC NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'UYU',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_start ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON public.appointments(business);

-- ==============================================================================
-- 8. TABLA: TAREAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  business TEXT NOT NULL,
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'Pendiente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. TABLA: CONFIGURACIÓN DE AUTOMOTORA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dealership_configs (
  empresa_id TEXT PRIMARY KEY DEFAULT 'carvlak',
  empresa_name TEXT NOT NULL DEFAULT 'Automotora CARVLAK',
  default_exchange_rate NUMERIC NOT NULL DEFAULT 43.50,
  default_internal_inspection_cost NUMERIC NOT NULL DEFAULT 1500,
  default_internal_detailing_cost NUMERIC NOT NULL DEFAULT 2500,
  seller_commission_percentage NUMERIC NOT NULL DEFAULT 15.0,
  days_in_stock_alert_threshold INTEGER NOT NULL DEFAULT 60,
  whatsapp_number TEXT NOT NULL DEFAULT '59899267964',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. TABLA: INVENTARIO DE AUTOMOTORA (dealership_vehicles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dealership_vehicles (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL DEFAULT 'carvlak',
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL, -- Vínculo a ficha vehicular única
  condition TEXT NOT NULL DEFAULT 'usado', -- 'usado' | '0km'
  plate TEXT DEFAULT '',
  chassis_vin TEXT,
  autonomy_km INTEGER,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Mediano',
  body_type TEXT DEFAULT 'Hatchback',
  transmission TEXT DEFAULT 'Manual',
  fuel TEXT DEFAULT 'Nafta',
  color_exterior TEXT,
  padron TEXT,
  vin TEXT,
  tiendanube_id TEXT,
  incomplete_data BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'evaluacion', -- 'evaluacion', 'comprado', 'preparacion', 'publicado', 'reservado', 'vendido', 'descartado'
  is_featured BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  catalog_description TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  purchase_currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC NOT NULL DEFAULT 43.50,
  purchase_origin TEXT NOT NULL DEFAULT 'particular',
  supplier_payable JSONB,
  docs_received JSONB NOT NULL DEFAULT '{"titulo": false, "libreta": true, "cedula": true, "sucive_al_dia": true, "multas_al_dia": true, "llave_duplicado": false}'::jsonb,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  sale_currency TEXT NOT NULL DEFAULT 'USD',
  min_acceptable_price NUMERIC,
  financing_available BOOLEAN NOT NULL DEFAULT true,
  min_down_payment_usd NUMERIC,
  monthly_installment_estimate_usd NUMERIC,
  inspection_id TEXT,
  inspection_cost NUMERIC NOT NULL DEFAULT 1500,
  detailing_quote_id TEXT,
  detailing_cost NUMERIC NOT NULL DEFAULT 2500,
  repairs_cost NUMERIC NOT NULL DEFAULT 0,
  paperwork_cost NUMERIC NOT NULL DEFAULT 0,
  other_expenses_cost NUMERIC NOT NULL DEFAULT 0,
  prep_checklist JSONB DEFAULT '{"inspection_done": false, "repairs_done": false, "detailing_done": false, "photos_done": false, "docs_done": false}'::jsonb,
  delivery_checklist JSONB,
  reservation JSONB,
  sale_record JSONB,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tiendanube_synced_at TIMESTAMPTZ,
  tiendanube_sync_status TEXT DEFAULT 'pending', -- 'synced' | 'pending' | 'error'
  tiendanube_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_plate ON public.dealership_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_status ON public.dealership_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_tiendanube ON public.dealership_vehicles(tiendanube_id);
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_vehicle_id ON public.dealership_vehicles(vehicle_id);

-- ==============================================================================
-- 11. VISTA PÚBLICA DE CATÁLOGO (SEGURIDAD CRÍTICA: NUNCA EXPONE COSTOS NI NOTAS)
-- ==============================================================================
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
  transmission,
  fuel,
  color_exterior,
  is_featured,
  features,
  images,
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

-- ==============================================================================
-- 12. TABLA: CONSULTAS CRM (dealership_inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dealership_inquiries (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL DEFAULT 'carvlak',
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  dealership_vehicle_id TEXT REFERENCES public.dealership_vehicles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  vehicle_info TEXT NOT NULL,
  vehicle_plate TEXT,
  budget_usd NUMERIC,
  trade_in_vehicle_info TEXT,
  origin TEXT NOT NULL DEFAULT 'WhatsApp',
  status TEXT NOT NULL DEFAULT 'Nuevo',
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  last_contact_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 13. TABLAS: DETAILING (Tarifario & Cotizaciones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.detailing_tariffs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  duration_hours NUMERIC(4, 2) DEFAULT 3,
  prices JSONB NOT NULL DEFAULT '{"Chico": 0, "Mediano": 0, "SUV/Rural": 0, "Pick-up": 0, "Moto": 0}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.detailing_quotes (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  vehicle_plate TEXT,
  vehicle_category TEXT NOT NULL DEFAULT 'Mediano',
  selected_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none',
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  extreme_dirt_surcharge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estimated_time TEXT DEFAULT '1 día',
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  origin TEXT NOT NULL DEFAULT 'WhatsApp',
  notes TEXT,
  priority_zones TEXT,
  status TEXT NOT NULL DEFAULT 'Por Cotizar',
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ,
  photos_before TEXT[] DEFAULT '{}',
  photos_after TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_detailing_quotes_status ON public.detailing_quotes(status);
CREATE INDEX IF NOT EXISTS idx_detailing_quotes_phone ON public.detailing_quotes(client_phone);

-- ==============================================================================
-- 14. TABLAS: STOCK DE INSUMOS & MOVIMIENTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stock_items (
  id TEXT PRIMARY KEY,
  business TEXT NOT NULL DEFAULT 'detailing',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidades',
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(10, 2) NOT NULL DEFAULT 2,
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  supplier TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  stock_item_id TEXT REFERENCES public.stock_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_cost NUMERIC(12, 2),
  operator_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 15. TABLA: GASTOS OPERATIVOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  business TEXT NOT NULL DEFAULT 'detailing',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UYU',
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Transferencia',
  description TEXT NOT NULL,
  invoice_number TEXT,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 16. TABLA: COMISIONES DE EMPLEADOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id TEXT PRIMARY KEY,
  business TEXT NOT NULL DEFAULT 'detailing',
  employee_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  quote_id TEXT,
  client_name TEXT NOT NULL,
  vehicle_description TEXT NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  amount_charged NUMERIC(12, 2) NOT NULL,
  commission_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UYU',
  status TEXT NOT NULL DEFAULT 'Pendiente',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 17. TABLA: WHATSAPP TEMPLATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  business TEXT NOT NULL,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 18. TABLAS: INSPECCIÓN VEHICULAR (PERITAJE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inspection_tariffs (
  id TEXT PRIMARY KEY DEFAULT 'current',
  prices JSONB NOT NULL DEFAULT '{"Chico": 3200, "Mediano": 3800, "SUV/Rural": 4400, "Pick-up": 5200, "Moto": 2200}'::jsonb,
  home_visit_surcharge NUMERIC NOT NULL DEFAULT 1200,
  internal_cost NUMERIC NOT NULL DEFAULT 1500,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'precompra',
  token TEXT UNIQUE NOT NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  vehicle_category TEXT NOT NULL DEFAULT 'Mediano',
  buyer_name TEXT,
  buyer_phone TEXT,
  seller_name TEXT,
  seller_phone TEXT,
  assigned_to TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Solicitada',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_home_visit BOOLEAN NOT NULL DEFAULT false,
  home_address TEXT,
  price_amount NUMERIC NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'UYU',
  home_visit_surcharge NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  panels JSONB NOT NULL DEFAULT '[]'::jsonb,
  obd_codes TEXT[] DEFAULT '{}',
  obd_notes TEXT,
  sucive_debt NUMERIC DEFAULT 0,
  sucive_status TEXT DEFAULT 'Al día',
  mileage_declared NUMERIC,
  mileage_observed NUMERIC,
  mileage_tampered BOOLEAN DEFAULT false,
  score NUMERIC NOT NULL DEFAULT 100,
  traffic_light TEXT NOT NULL DEFAULT 'Recomendable',
  inspector_conclusion TEXT,
  estimated_repair_cost NUMERIC NOT NULL DEFAULT 0,
  repair_details TEXT,
  automotora_decision TEXT,
  automotora_suggested_price NUMERIC,
  automotora_currency TEXT DEFAULT 'USD',
  detailing_quote_id TEXT,
  photos TEXT[] DEFAULT '{}',
  inspector_signature TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_token ON public.vehicle_inspections(token);
CREATE INDEX IF NOT EXISTS idx_inspections_plate ON public.vehicle_inspections(vehicle_plate);

-- ==============================================================================
-- 19. FUNCIÓN PÚBLICA SEGURA: OBTENER PERITAJE POR TOKEN
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_public_inspection_by_token(p_token TEXT)
RETURNS SETOF public.vehicle_inspections
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.vehicle_inspections
  WHERE token = p_token AND is_archived = false
  LIMIT 1;
$$;

-- ==============================================================================
-- 20. TABLAS: REDES SOCIALES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.social_media_configs (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_instagram_handle TEXT NOT NULL DEFAULT '@car.vlak',
  default_location_name TEXT NOT NULL DEFAULT 'Ciudad de la Costa, Canelones',
  default_hashtag TEXT NOT NULL DEFAULT '#carvlak #autosuruguay #detailinguruguay',
  brand_colors JSONB NOT NULL DEFAULT '{"red": "#D7141A", "black": "#000000", "white": "#FFFFFF", "gray": "#161616"}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  default_caption_template TEXT,
  default_elements JSONB DEFAULT '[]'::jsonb,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_post_records (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'story',
  title TEXT NOT NULL,
  image_url TEXT,
  caption TEXT,
  linked_vehicle_id TEXT,
  linked_quote_id TEXT,
  linked_inspection_id TEXT,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 21. TABLA: AUDITORÍA Y REGISTRO DE ACTIVIDAD (activity_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- 22. POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ==============================================================================

ALTER TABLE public.general_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailing_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 22.1 Acceso para usuarios autenticados (Sistema interno del equipo)
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
    EXECUTE format('DROP POLICY IF EXISTS "auth_full_access_%I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "auth_full_access_%I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 22.2 Acceso para usuarios anónimos (Vistas y Formularios Públicos)
-- Detailing: el cliente puede enviar su solicitud de cotización
DROP POLICY IF EXISTS "anon_insert_detailing_quotes" ON public.detailing_quotes;
CREATE POLICY "anon_insert_detailing_quotes" ON public.detailing_quotes
  FOR INSERT TO anon
  WITH CHECK (true);

-- Clientes: permitir registro de nuevo cliente o actualización desde formulario público
DROP POLICY IF EXISTS "anon_insert_clients" ON public.clients;
CREATE POLICY "anon_insert_clients" ON public.clients
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_clients_by_phone" ON public.clients;
CREATE POLICY "anon_select_clients_by_phone" ON public.clients
  FOR SELECT TO anon
  USING (true);

-- Automotora CRM: consultas desde catálogo público
DROP POLICY IF EXISTS "anon_insert_dealership_inquiries" ON public.dealership_inquiries;
CREATE POLICY "anon_insert_dealership_inquiries" ON public.dealership_inquiries
  FOR INSERT TO anon
  WITH CHECK (true);

-- Configuración general: lectura pública de teléfono y dirección
DROP POLICY IF EXISTS "anon_select_general_configs" ON public.general_configs;
CREATE POLICY "anon_select_general_configs" ON public.general_configs
  FOR SELECT TO anon
  USING (true);

-- Tarifario Detailing: lectura pública para armar el presupuesto en el formulario web
DROP POLICY IF EXISTS "anon_select_detailing_tariffs" ON public.detailing_tariffs;
CREATE POLICY "anon_select_detailing_tariffs" ON public.detailing_tariffs
  FOR SELECT TO anon
  USING (is_active = true);

-- Catálogo de Automotora: los anónimos SOLO leen vehículos con status = 'publicado'
DROP POLICY IF EXISTS "anon_select_published_vehicles" ON public.dealership_vehicles;
CREATE POLICY "anon_select_published_vehicles" ON public.dealership_vehicles
  FOR SELECT TO anon
  USING (status = 'publicado' AND is_archived = false);

-- ==============================================================================
-- 23. STORAGE: BUCKET PARA FOTOGRAFÍAS Y MULTIMEDIA
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "storage_authenticated_write" ON storage.objects;
CREATE POLICY "storage_authenticated_write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "storage_anon_insert_quotes" ON storage.objects;
CREATE POLICY "storage_anon_insert_quotes" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'media');

-- ==============================================================================
-- CARVLAK Group: FASE 4 - ESQUEMA DE BASE DE DATOS SUPABASE (AUTOMOTORA MULTI-SAAS)
-- ==============================================================================
-- Arquitectura Multi-Empresa: cada tabla cuenta con empresa_id para permitir
-- vender la solución como producto independiente a otras automotoras aliadas.

-- 1. Tabla de Configuración de Automotora por Empresa
CREATE TABLE IF NOT EXISTS public.dealership_configs (
  empresa_id TEXT PRIMARY KEY DEFAULT 'carvlak',
  empresa_name TEXT NOT NULL DEFAULT 'Automotora CARVLAK',
  default_exchange_rate NUMERIC NOT NULL DEFAULT 43.50,
  default_internal_inspection_cost NUMERIC NOT NULL DEFAULT 1500,
  default_internal_detailing_cost NUMERIC NOT NULL DEFAULT 2500,
  seller_commission_percentage NUMERIC NOT NULL DEFAULT 15.0,
  days_in_stock_alert_threshold INTEGER NOT NULL DEFAULT 60,
  whatsapp_number TEXT NOT NULL DEFAULT '59899267964',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial para CARVLAK
INSERT INTO public.dealership_configs (
  empresa_id, empresa_name, default_exchange_rate, default_internal_inspection_cost,
  default_internal_detailing_cost, seller_commission_percentage, days_in_stock_alert_threshold, whatsapp_number
)
VALUES (
  'carvlak', 'Automotora CARVLAK', 43.50, 1500, 2500, 15.0, 60, '59899267964'
)
ON CONFLICT (empresa_id) DO NOTHING;

-- 2. Tabla Principal de Inventario & Stock de Autos
CREATE TABLE IF NOT EXISTS public.dealership_vehicles (
  id TEXT PRIMARY KEY DEFAULT ('auto-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::text),
  empresa_id TEXT NOT NULL DEFAULT 'carvlak',
  
  -- Ficha del Vehículo
  plate TEXT NOT NULL,
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
  
  -- Estado en el embudo
  status TEXT NOT NULL DEFAULT 'evaluacion' CHECK (
    status IN ('evaluacion', 'comprado', 'preparacion', 'publicado', 'reservado', 'vendido', 'descartado')
  ),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Galería & Equipamiento
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  catalog_description TEXT,
  
  -- Datos de Compra (Sensibles / Admin Only)
  purchase_date DATE DEFAULT CURRENT_DATE,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  purchase_currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC NOT NULL DEFAULT 43.50,
  purchase_origin TEXT NOT NULL DEFAULT 'particular' CHECK (
    purchase_origin IN ('particular', 'concesionaria', 'parte_de_pago', 'consignacion')
  ),
  docs_received JSONB NOT NULL DEFAULT '{"titulo": false, "libreta": true, "cedula": true, "sucive_al_dia": true, "multas_al_dia": true, "llave_duplicado": false}'::jsonb,
  
  -- Datos de Venta & Financiación
  sale_price NUMERIC NOT NULL DEFAULT 0,
  sale_currency TEXT NOT NULL DEFAULT 'USD',
  min_acceptable_price NUMERIC, -- Piso de negociación (Admin only)
  financing_available BOOLEAN NOT NULL DEFAULT TRUE,
  min_down_payment_usd NUMERIC,
  monthly_installment_estimate_usd NUMERIC,
  
  -- Costos Reales Internos (Admin Only)
  inspection_id TEXT,
  inspection_cost NUMERIC NOT NULL DEFAULT 1500,
  detailing_quote_id TEXT,
  detailing_cost NUMERIC NOT NULL DEFAULT 2500,
  repairs_cost NUMERIC NOT NULL DEFAULT 0,
  paperwork_cost NUMERIC NOT NULL DEFAULT 0,
  other_expenses_cost NUMERIC NOT NULL DEFAULT 0,
  
  -- Checklist de Alistamiento (5 Puntos)
  prep_checklist JSONB NOT NULL DEFAULT '{"inspection_done": false, "repairs_done": false, "detailing_done": false, "photos_done": false, "docs_done": false}'::jsonb,
  
  -- Reserva o Venta
  reservation JSONB,
  sale_record JSONB,
  
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida y catálogo público
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_empresa_status ON public.dealership_vehicles(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_plate ON public.dealership_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_dealership_vehicles_publicados ON public.dealership_vehicles(status) WHERE status = 'publicado' AND is_archived = FALSE;

-- 3. Tabla de CRM: Consultas e Interesados por Vehículo
CREATE TABLE IF NOT EXISTS public.dealership_inquiries (
  id TEXT PRIMARY KEY DEFAULT ('inq-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::text),
  empresa_id TEXT NOT NULL DEFAULT 'carvlak',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  
  dealership_vehicle_id TEXT REFERENCES public.dealership_vehicles(id) ON DELETE SET NULL,
  vehicle_info TEXT NOT NULL,
  vehicle_plate TEXT,
  
  origin TEXT NOT NULL DEFAULT 'WhatsApp' CHECK (
    origin IN ('Catalogo web', 'WhatsApp', 'Instagram', 'Marketplace', 'Presencial')
  ),
  budget_usd NUMERIC,
  trade_in_vehicle_info TEXT,
  
  status TEXT NOT NULL DEFAULT 'Nuevo' CHECK (
    status IN ('Nuevo', 'Contactado', 'Visita agendada', 'Prueba de manejo', 'En negociacion', 'Ganada', 'Perdida')
  ),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  
  last_contact_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dealership_inquiries_empresa_status ON public.dealership_inquiries(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_dealership_inquiries_phone ON public.dealership_inquiries(client_phone);

-- 4. Vista Pública Segura del Catálogo (NUNCA expone costos ni datos internos)
CREATE OR REPLACE VIEW public.public_dealership_catalog AS
SELECT
  id,
  empresa_id,
  plate,
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
  created_at
FROM public.dealership_vehicles
WHERE status = 'publicado' AND is_archived = FALSE;

-- 5. Row Level Security (RLS) Multi-Tenant
ALTER TABLE public.dealership_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_inquiries ENABLE ROW LEVEL SECURITY;

-- Lectura pública para el catálogo web anónimo
CREATE POLICY "Public Read Catalog" ON public.dealership_vehicles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'publicado' AND is_archived = FALSE);

-- Lectura total para usuarios autenticados de la empresa
CREATE POLICY "Tenant Users Access" ON public.dealership_vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Tenant Inquiries Access" ON public.dealership_inquiries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permiso de inserción de consultas para visitantes del catálogo web
CREATE POLICY "Public Create Inquiries" ON public.dealership_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

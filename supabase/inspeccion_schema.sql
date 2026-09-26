-- ==============================================================================
-- CARVLAK Group: FASE 3 - ESQUEMA DE BASE DE DATOS SUPABASE (PERITAJE E INSPECCIÓN)
-- ==============================================================================

-- 1. Tabla de Tarifario de Inspecciones
CREATE TABLE IF NOT EXISTS public.inspection_tariffs (
  id TEXT PRIMARY KEY DEFAULT 'current',
  prices JSONB NOT NULL DEFAULT '{"Chico": 3200, "Mediano": 3800, "SUV/Rural": 4400, "Pick-up": 5200, "Moto": 2200}'::jsonb,
  home_visit_surcharge NUMERIC NOT NULL DEFAULT 1200,
  internal_cost NUMERIC NOT NULL DEFAULT 1500,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO public.inspection_tariffs (id, prices, home_visit_surcharge, internal_cost)
VALUES (
  'current',
  '{"Chico": 3200, "Mediano": 3800, "SUV/Rural": 4400, "Pick-up": 5200, "Moto": 2200}'::jsonb,
  1200,
  1500
)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla Principal de Inspecciones Vehiculares (Peritaje)
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id TEXT PRIMARY KEY DEFAULT ('insp-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::text),
  type TEXT NOT NULL CHECK (type IN ('precompra', 'interna')),
  token TEXT UNIQUE NOT NULL,
  
  -- Vinculaciones opcionales a base común (Fase 1)
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  
  -- Datos directos del vehículo y las partes
  vehicle_plate TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  vehicle_category TEXT NOT NULL DEFAULT 'Mediano',
  
  buyer_name TEXT,
  buyer_phone TEXT,
  seller_name TEXT,
  seller_phone TEXT,
  
  -- Inspector & Fechas
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Solicitada' CHECK (status IN ('Solicitada', 'Agendada', 'En curso', 'Completada', 'Cancelada')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Traslado
  is_home_visit BOOLEAN NOT NULL DEFAULT FALSE,
  home_address TEXT,
  
  -- Facturación ($UYU)
  price_amount NUMERIC NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'UYU',
  home_visit_surcharge NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  
  -- Checklist táctil y 15 paneles de carrocería (JSONB)
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  panels JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Diagnóstico Electrónico & Odómetro
  obd_codes TEXT[] DEFAULT '{}',
  obd_notes TEXT,
  sucive_debt NUMERIC DEFAULT 0,
  sucive_status TEXT DEFAULT 'Al día',
  mileage_declared NUMERIC,
  mileage_observed NUMERIC,
  mileage_tampered BOOLEAN DEFAULT FALSE,
  
  -- Puntaje y Semáforo Técnico
  score NUMERIC NOT NULL DEFAULT 100,
  traffic_light TEXT NOT NULL DEFAULT 'Recomendable' CHECK (traffic_light IN ('Recomendable', 'Con reparos', 'No recomendable')),
  inspector_conclusion TEXT,
  estimated_repair_cost NUMERIC NOT NULL DEFAULT 0,
  repair_details TEXT,
  
  -- Conexión Automotora (Fase 4 Ready)
  automotora_decision TEXT CHECK (automotora_decision IN ('comprar', 'negociar', 'no_comprar')),
  automotora_suggested_price NUMERIC,
  automotora_currency TEXT DEFAULT 'USD',
  
  -- Conexión Detailing (Fase 2 Cross-selling)
  detailing_quote_id TEXT,
  
  -- Fotos y Auditoría
  photos TEXT[] DEFAULT '{}',
  inspector_signature TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_inspections_token ON public.vehicle_inspections(token);
CREATE INDEX IF NOT EXISTS idx_inspections_plate ON public.vehicle_inspections(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.vehicle_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_assigned ON public.vehicle_inspections(assigned_to);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_tariffs ENABLE ROW LEVEL SECURITY;

-- Políticas para inspection_tariffs:
-- Lectura pública o autenticada
CREATE POLICY "Permitir lectura de tarifas para todos los usuarios"
ON public.inspection_tariffs FOR SELECT
USING (true);

-- Edición solo para administradores
CREATE POLICY "Solo admin puede modificar tarifas de inspeccion"
ON public.inspection_tariffs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND 'admin' = ANY(roles)
  )
);

-- Políticas para vehicle_inspections:
-- A) Lectura Pública con Token: un cliente puede ver su informe online sin estar logueado
CREATE POLICY "Ver informe público con token"
ON public.vehicle_inspections FOR SELECT
USING (
  token IS NOT NULL AND is_archived = FALSE
);

-- B) Empleados/Inspectores: ven sus inspecciones asignadas o si son admin/encargado
CREATE POLICY "Inspectores y Admin ven inspecciones"
ON public.vehicle_inspections FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND ('admin' = ANY(roles) OR 'encargado' = ANY(roles))
  )
);

-- C) Insertar inspecciones: cualquier usuario autenticado
CREATE POLICY "Usuarios autenticados pueden crear inspecciones"
ON public.vehicle_inspections FOR INSERT
TO authenticated
WITH CHECK (true);

-- D) Actualizar inspecciones: el inspector asignado o Admin/Encargado
CREATE POLICY "Inspectores asignados y Admin pueden actualizar peritaje"
ON public.vehicle_inspections FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND ('admin' = ANY(roles) OR 'encargado' = ANY(roles))
  )
);

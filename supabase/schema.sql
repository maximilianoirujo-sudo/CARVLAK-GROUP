-- ==============================================================================
-- CARVLAK GROUP - ESQUEMA DE BASE DE DATOS Y RLS (FASE 1)
-- PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROFILES (Extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  roles TEXT[] NOT NULL DEFAULT '{detailer}', -- 'admin', 'encargado', 'detailer', 'inspector', 'vendedor'
  businesses TEXT[] NOT NULL DEFAULT '{detailing}', -- 'automotora', 'detailing', 'inspeccion'
  is_active BOOLEAN NOT NULL DEFAULT true,
  commissions JSONB NOT NULL DEFAULT '{"automotora": 0, "detailing": 0, "inspeccion": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: ACTIVITY_LOGS (Auditoría de acciones)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- 'cliente', 'vehiculo', 'turno', 'tarea', 'empleado'
  entity_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'archive', 'status_change'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: CLIENTS (Directorio compartido entre los 3 negocios)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cedula TEXT,
  origin TEXT NOT NULL DEFAULT 'WhatsApp', -- 'Presencial', 'WhatsApp', 'Instagram', 'Referido', 'Google Form'
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_archived ON public.clients (is_archived);

-- 5. TABLA: VEHICLES (Ficha única por matrícula)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE, -- Matrícula normalizada en mayúsculas
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  mileage INTEGER DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Mediano', -- 'Chico', 'Mediano', 'SUV/Rural', 'Pick-up', 'Moto'
  ownership TEXT NOT NULL DEFAULT 'client', -- 'client', 'dealership'
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  photos TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles (plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON public.vehicles (client_id);

-- 6. TABLA: VEHICLE_HISTORY (Línea de tiempo entre los 3 negocios)
CREATE TABLE IF NOT EXISTS public.vehicle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  business TEXT NOT NULL, -- 'automotora', 'detailing', 'inspeccion'
  event_type TEXT NOT NULL, -- 'inspeccion_ingreso', 'tratamiento_ceramico', 'cambio_dueno', 'servicio_general'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle_id ON public.vehicle_history (vehicle_id);

-- 7. TABLA: APPOINTMENTS (Agenda unificada)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business TEXT NOT NULL, -- 'automotora', 'detailing', 'inspeccion'
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Confirmado', 'En curso', 'Finalizado', 'Cancelado'
  title TEXT,
  notes TEXT,
  price_amount NUMERIC NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'UYU', -- 'UYU', 'USD'
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business ON public.appointments (business);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments (start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON public.appointments (assigned_to);

-- 8. TABLA: TASKS (Gestor de tareas operativas)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  business TEXT NOT NULL DEFAULT 'general', -- 'automotora', 'detailing', 'inspeccion', 'general'
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'En curso', 'Hecha'
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);

-- ==============================================================================
-- 9. FUNCIONES DE SEGURIDAD & HELPERS (RLS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND 'admin' = ANY(roles) AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_encargado()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND ('admin' = ANY(roles) OR 'encargado' = ANY(roles)) AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (required_role = ANY(roles) OR 'admin' = ANY(roles)) AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Profiles son visibles para empleados activos"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo Admin puede insertar o modificar perfiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CLIENTS RLS
CREATE POLICY "Clientes visibles para empleados autenticados"
  ON public.clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Empleados pueden crear y actualizar clientes"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Empleados pueden editar clientes"
  ON public.clients FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- VEHICLES RLS
CREATE POLICY "Vehiculos visibles para empleados autenticados"
  ON public.vehicles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Empleados pueden crear y editar vehiculos"
  ON public.vehicles FOR ALL
  USING (auth.uid() IS NOT NULL);

-- VEHICLE HISTORY RLS
CREATE POLICY "Historial vehicular visible para todos los empleados"
  ON public.vehicle_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Empleados pueden insertar eventos en historial vehicular"
  ON public.vehicle_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- APPOINTMENTS RLS
CREATE POLICY "Turnos visibles segun permisos"
  ON public.appointments FOR SELECT
  USING (
    public.is_encargado() OR
    assigned_to = auth.uid() OR
    (business = 'detailing' AND public.has_role('detailer')) OR
    (business = 'inspeccion' AND public.has_role('inspector')) OR
    (business = 'automotora' AND public.has_role('vendedor'))
  );

CREATE POLICY "Creacion de turnos permitida para empleados activos"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Edicion de turnos permitida"
  ON public.appointments FOR UPDATE
  USING (public.is_encargado() OR assigned_to = auth.uid());

-- TASKS RLS
CREATE POLICY "Tareas visibles para asignado o encargado"
  ON public.tasks FOR SELECT
  USING (public.is_encargado() OR assigned_to = auth.uid());

CREATE POLICY "Admin y encargado pueden crear tareas"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_encargado());

CREATE POLICY "Actualizar tareas (estado para asignado, todo para encargado)"
  ON public.tasks FOR UPDATE
  USING (public.is_encargado() OR assigned_to = auth.uid());

-- ACTIVITY LOGS RLS
CREATE POLICY "Auditoria visible para Admin y Encargado"
  ON public.activity_logs FOR SELECT
  USING (public.is_encargado());

CREATE POLICY "Insercion automatica en auditoria"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 11. STORAGE BUCKET PARA FOTOS DE VEHÍCULOS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Fotos de vehiculos de acceso publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Empleados pueden subir fotos de vehiculos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid() IS NOT NULL);

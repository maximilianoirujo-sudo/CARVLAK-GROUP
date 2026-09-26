-- ==============================================================================
-- CARVLAK GROUP - FASE 2: DETAILVLAK PRO ESQUEMA SQL & RLS
-- ==============================================================================

-- 1. TABLA: TARIFARIO DE DETAILING
CREATE TABLE IF NOT EXISTS public.detailing_tariffs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT,
    duration_hours NUMERIC(4, 2) DEFAULT 3,
    prices JSONB NOT NULL DEFAULT '{"chico": 0, "mediano": 0, "suv": 0, "pickup": 0, "moto": 0}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: COTIZACIONES Y TRABAJOS DE DETAILING
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
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    origin TEXT NOT NULL DEFAULT 'WhatsApp',
    notes TEXT,
    priority_zones TEXT,
    status TEXT NOT NULL DEFAULT 'Por Cotizar',
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    appointment_date TIMESTAMPTZ,
    photos_before TEXT[] DEFAULT '{}',
    photos_after TEXT[] DEFAULT '{}',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: STOCK GENÉRICO (Detailing, Automotora, Inspección, General)
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
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: MOVIMIENTOS DE STOCK (Historial de Entradas y Salidas)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    stock_item_id TEXT REFERENCES public.stock_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'Entrada' | 'Salida'
    quantity NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(12, 2),
    operator_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: GASTOS OPERATIVOS GENÉRICOS
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
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: COMISIONES DE EMPLEADOS
CREATE TABLE IF NOT EXISTS public.commissions (
    id TEXT PRIMARY KEY,
    business TEXT NOT NULL DEFAULT 'detailing',
    employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    quote_id TEXT REFERENCES public.detailing_quotes(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    vehicle_description TEXT NOT NULL,
    amount_charged NUMERIC(12, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) NOT NULL,
    commission_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente' | 'Pagada'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 7. TABLA: PLANTILLAS DE WHATSAPP
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ==============================================================================

ALTER TABLE public.detailing_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailing_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Tarifario: lectura para todos los usuarios autenticados, escritura solo Admin
CREATE POLICY "Tarifario visible para autenticados" ON public.detailing_tariffs FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Tarifario editable solo por Admin" ON public.detailing_tariffs FOR ALL TO authenticated USING (public.is_admin());

-- Cotizaciones:
-- Permitir INSERT anónimo para la página pública de presupuestos (sin login)
CREATE POLICY "Cotizaciones anon insert publico" ON public.detailing_quotes FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "Cotizaciones visible para autenticados" ON public.detailing_quotes FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Cotizaciones editable para autenticados" ON public.detailing_quotes FOR ALL TO authenticated USING (TRUE);

-- Stock y Movimientos:
CREATE POLICY "Stock visible para autenticados" ON public.stock_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Stock editable para autenticados" ON public.stock_items FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "Movimientos stock visible para autenticados" ON public.stock_movements FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Movimientos stock editable para autenticados" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Gastos:
CREATE POLICY "Gastos visibles para autenticados" ON public.expenses FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Gastos administrables por encargado o admin" ON public.expenses FOR ALL TO authenticated USING (public.is_encargado());

-- Comisiones: PROTECCIÓN ESTRICTA
-- Un empleado solo ve sus propias comisiones; Admin ve todas.
CREATE POLICY "Comisiones visibles por admin o dueño" ON public.commissions FOR SELECT TO authenticated
    USING (public.is_admin() OR employee_id = auth.uid());

CREATE POLICY "Comisiones editables solo por Admin" ON public.commissions FOR ALL TO authenticated
    USING (public.is_admin());

-- Plantillas WhatsApp:
CREATE POLICY "Plantillas visibles para autenticados" ON public.whatsapp_templates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Plantillas editables solo por Admin" ON public.whatsapp_templates FOR ALL TO authenticated USING (public.is_admin());

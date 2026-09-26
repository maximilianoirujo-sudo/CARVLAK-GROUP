// ==============================================================================
// CARVLAK GROUP - TIPOS TYPESCRIPT
// ==============================================================================

export type Business = 'automotora' | 'detailing' | 'inspeccion';

export type Role = 'admin' | 'encargado' | 'detailer' | 'inspector' | 'vendedor';

export type Currency = 'UYU' | 'USD';

export type VehicleCategory = 'Chico' | 'Mediano' | 'SUV/Rural' | 'Pick-up' | 'Moto';

export type VehicleOwnership = 'client' | 'dealership';

export type ClientOrigin = 'Presencial' | 'WhatsApp' | 'Instagram' | 'Referido' | 'Google Form';

export type AppointmentStatus = 'Pendiente' | 'Confirmado' | 'En curso' | 'Finalizado' | 'Cancelado';

export type TaskStatus = 'Pendiente' | 'En curso' | 'Hecha';

export interface CommissionsConfig {
  automotora: number; // Porcentaje (0 - 100)
  detailing: number;  // Porcentaje (0 - 100, ej: 30 para Maximiliano)
  inspeccion: number; // Porcentaje (0 - 100)
}

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  phone?: string;
  roles: Role[];
  businesses: Business[];
  is_active: boolean;
  commissions: CommissionsConfig;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  cedula?: string;
  origin: ClientOrigin;
  notes?: string;
  is_archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  plate: string; // Normalizada en mayúsculas (ej: "SBX 1234")
  brand: string;
  model: string;
  year?: number;
  color?: string;
  mileage?: number;
  category: VehicleCategory;
  ownership: VehicleOwnership;
  client_id?: string;
  client?: Client;
  photos: string[];
  is_archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleHistoryEvent {
  id: string;
  vehicle_id: string;
  business: Business;
  event_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  business: Business;
  client_id: string;
  client?: Client;
  vehicle_id?: string;
  vehicle?: Vehicle;
  assigned_to?: string;
  assignee?: Profile;
  start_time: string; // ISO string
  duration_minutes: number;
  status: AppointmentStatus;
  title?: string;
  notes?: string;
  price_amount: number;
  price_currency: Currency;
  is_archived?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  business: Business | 'general';
  assigned_to?: string;
  assignee?: Profile;
  due_date?: string; // YYYY-MM-DD
  status: TaskStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  entity_type: 'cliente' | 'vehiculo' | 'turno' | 'tarea' | 'empleado' | 'cotizacion_detailing' | 'stock' | 'gasto';
  entity_id?: string;
  action: 'create' | 'update' | 'archive' | 'status_change';
  details?: Record<string, any>;
  created_at: string;
}

// ==============================================================================
// FASE 2: DETAILVLAK PRO - TIPOS
// ==============================================================================

export interface DetailingTariffPrices {
  chico: number;
  mediano: number;
  suv: number;
  pickup: number;
  moto: number;
}

export interface DetailingTariff {
  id: string;
  name: string;
  shortName: string;
  description: string;
  durationHours: number;
  prices: DetailingTariffPrices;
  isActive?: boolean;
}

export type DetailingDiscountType = 'none' | 'combo_10' | 'special_15' | 'fixed';

export type DetailingQuoteStatus = 
  | 'Por Cotizar' 
  | 'Presupuesto Enviado' 
  | 'Turno Confirmado' 
  | 'Trabajo Completado' 
  | 'Cancelado';

export interface DetailingQuoteServiceItem {
  serviceId: string;
  serviceName: string;
  price: number;
}

export interface DetailingQuote {
  id: string;
  client_id: string;
  client?: Client;
  vehicle_id?: string;
  vehicle?: Vehicle;
  client_name: string;
  client_phone: string;
  vehicle_info: string;
  vehicle_plate?: string;
  vehicle_category: VehicleCategory;
  selected_services: DetailingQuoteServiceItem[];
  subtotal: number;
  discount_type: DetailingDiscountType;
  discount_amount: number;
  extreme_dirt_surcharge: number;
  total_amount: number;
  estimated_time?: string;
  assigned_to?: string; // ID del empleado (atendido por)
  assignee?: Profile;
  origin: ClientOrigin | 'Llamada' | 'Form Web';
  notes?: string;
  priority_zones?: string;
  status: DetailingQuoteStatus;
  appointment_id?: string; // Id del turno creado en la Agenda Unificada
  appointment_date?: string; // ISO string de cuando se agendó
  photos_before?: string[];
  photos_after?: string[];
  is_archived?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// MÓDULOS GENÉRICOS: STOCK, GASTOS Y COMISIONES (Detailing / Reutilizables)
// ==============================================================================

export type StockCategory = 
  | 'Químicos' 
  | 'Pads' 
  | 'Paños/Microfibras' 
  | 'Selladores' 
  | 'Herramientas' 
  | 'Accesorios' 
  | 'Otros';

export interface StockMovement {
  id: string;
  stock_item_id: string;
  type: 'Entrada' | 'Salida';
  quantity: number;
  unit_cost?: number;
  operator_name: string;
  notes?: string;
  created_at: string;
}

export interface StockItem {
  id: string;
  business: Business | 'general';
  name: string;
  category: StockCategory;
  unit: 'litros' | 'unidades' | 'botellas' | 'pack' | 'gramos';
  quantity: number;
  min_stock: number;
  unit_cost: number;
  supplier?: string;
  is_archived?: boolean;
  movements?: StockMovement[];
  updated_at: string;
}

export type ExpenseCategory = 
  | 'Insumos' 
  | 'Alquiler/Servicios' 
  | 'Herramientas/Maquinaria' 
  | 'Marketing/Publicidad' 
  | 'Sueldos/Adelantos' 
  | 'Varios';

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta';

export interface Expense {
  id: string;
  business: Business | 'general';
  date: string; // YYYY-MM-DD
  amount: number; // en $UYU
  currency: Currency;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  description: string;
  invoice_number?: string;
  created_by?: string;
  is_archived?: boolean;
  created_at: string;
}

export interface CommissionRecord {
  id: string;
  business: Business;
  employee_id: string;
  employee_name: string;
  quote_id: string;
  client_name: string;
  vehicle_description: string;
  amount_charged: number; // Monto total cobrado al cliente
  commission_rate: number; // Porcentaje (ej: 30 para Maximiliano)
  commission_amount: number; // Monto a pagar en $UYU
  status: 'Pendiente' | 'Pagada';
  created_at: string;
  paid_at?: string;
}

export type WhatsAppTemplateKey = 'formal' | 'promo' | 'fotos' | 'seguimiento' | 'turno';

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey;
  title: string;
  description: string;
  template: string;
}

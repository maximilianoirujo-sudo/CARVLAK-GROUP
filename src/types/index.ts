// ==============================================================================
// CARVLAK GROUP - TIPOS TYPESCRIPT
// ==============================================================================

export type Business = 'automotora' | 'detailing' | 'inspeccion';

export type Role = 'admin' | 'encargado' | 'detailer' | 'inspector' | 'vendedor' | 'encargado_detailing';

export type Currency = 'UYU' | 'USD';

export type VehicleCategory = 'Chico' | 'Mediano' | 'SUV/Rural' | 'Pick-up' | 'Moto';

export type VehicleOwnership = 'client' | 'dealership';

export type ClientOrigin = 'Presencial' | 'WhatsApp' | 'Instagram' | 'Referido' | 'Google Form';

export type AppointmentStatus = 'Pendiente' | 'Confirmado' | 'En curso' | 'Finalizado' | 'Cancelado' | 'confirmed' | 'completed' | 'cancelled';

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
  social_media_consent?: boolean; // Consentimiento para fotos y felicitaciones en redes sociales
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
  vin?: string;
  fuel?: string;
  transmission?: string;
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
  work_bay_id?: string; // Puesto de trabajo (Box 1, Box 2...)
  quote_id?: string; // Cotización de detailing asociada
  stage?: string; // Estado en el flujo de taller (ej. 'Agendado', 'Recibido', 'En proceso', etc.)
  is_blocked?: boolean; // Bloqueo de tiempo (almuerzo, mantenimiento, día libre)
  block_reason?: string;
  whatsapp_sent_log?: { template_key: string; sent_at: string; phone: string }[];
  history?: { timestamp: string; from_status?: string; to_status: string; user_id?: string; user_name?: string; note?: string }[];
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
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
  entity_type: 'cliente' | 'vehiculo' | 'turno' | 'tarea' | 'empleado' | 'cotizacion_detailing' | 'stock' | 'gasto' | 'inspeccion' | 'automotora' | 'consulta_automotora' | 'venta_automotora' | 'marketing' | 'configuracion' | 'comision' | 'sistema';
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

export type DetailingDiscountType = 'none' | 'combo_10' | 'special_15' | 'fixed' | string;

export type DetailingQuoteStatus = 
  | 'Por Cotizar' 
  | 'Presupuesto Enviado' 
  | 'Turno Confirmado' 
  | 'Agendado'
  | 'Confirmado'
  | 'Recibido'
  | 'En proceso'
  | 'Control de calidad'
  | 'Listo para retirar'
  | 'Entregado y cobrado'
  | 'Trabajo Completado' 
  | 'Cancelado'
  | 'No vino'
  | 'Anulado';

export interface DetailingQuoteServiceItem {
  serviceId: string;
  serviceName: string;
  description?: string;
  price: number;
}

export interface DetailingPayment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  payment_method: string;
  type: 'seña' | 'saldo' | 'total';
  notes?: string;
  registered_by?: string;
  is_voided?: boolean;
}

export interface DetailingCheckinData {
  mileage?: number;
  fuel_level?: 'Reserva' | '1/4' | '1/2' | '3/4' | 'Lleno';
  valuables?: string;
  pre_existing_damages?: string;
  photos?: string[];
  client_agreed?: boolean;
  checkin_at?: string;
  checkin_by?: string;
}

export interface DetailingQualityControlData {
  checklist?: { id: string; label: string; passed: boolean; notes?: string }[];
  photos_after?: string[];
  completed_at?: string;
  completed_by?: string;
}

export interface DetailingMaterialsConsumed {
  stock_item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
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
  assigned_to?: string; // ID del empleado (detailer)
  assignee?: Profile;
  commission_participants?: {
    employee_id: string;
    employee_name: string;
    rate: number;
    custom_rate?: number;
    manual_adjustment?: number;
    adjustment_reason?: string;
  }[];
  origin: string; // Origen del cliente (obligatorio)
  notes?: string;
  priority_zones?: string;
  status: DetailingQuoteStatus;
  appointment_id?: string; // Id del turno creado en la Agenda
  appointment_date?: string; // ISO string de cuando se agendó
  work_bay_id?: string; // Box o puesto de trabajo asignado
  receipt_id?: string; // ID del comprobante oficial generado
  receipt_number?: string; // Número correlativo (ej. DV-000001)
  payments?: DetailingPayment[];
  checkin_data?: DetailingCheckinData;
  quality_control_data?: DetailingQualityControlData;
  materials_cost?: number;
  materials_consumed?: DetailingMaterialsConsumed[];
  whatsapp_sent_log?: { template_key: string; sent_at: string; phone: string }[];
  history?: { timestamp: string; from_status?: string; to_status: string; user_id?: string; user_name?: string; note?: string }[];
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
  photos_before?: string[];
  photos_after?: string[];
  is_archived?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Cierre de caja diario
export interface DetailingCashClosure {
  id: string;
  date: string; // YYYY-MM-DD
  closed_at: string;
  closed_by: string;
  closed_by_name?: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  breakdown_income_by_method: Record<string, number>;
  breakdown_expense_by_method: Record<string, number>;
  notes?: string;
  created_at?: string;
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
  category: ExpenseCategory | string;
  payment_method: PaymentMethod | string;
  description: string;
  supplier?: string;
  invoice_number?: string;
  receipt_url?: string; // Comprobante o factura (foto / PDF) en Supabase Storage
  is_recurring?: boolean; // Es gasto fijo recurrente
  recurring_rule?: {
    frequency: 'mensual';
    due_day: number;
    recurring_expense_id?: string;
  };
  status?: 'Pendiente' | 'Pagado';
  payment_date?: string;
  voided_at?: string;
  voided_by?: string;
  void_reason?: string;
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
  commission_amount: number; // Monto a pagar (UYU o USD según negocio)
  currency?: Currency; // Moneda explícita: 'USD' para automotora, 'UYU' para detailing/inspección
  status: 'Pendiente' | 'Pagada';
  created_at: string;
  paid_at?: string;
  origin?: string;
  receipt_number?: string;
  adjustment_reason?: string;
  adjusted_at?: string;
}

export type WhatsAppTemplateKey = 'formal' | 'promo' | 'fotos' | 'seguimiento' | 'turno';

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey;
  title: string;
  description: string;
  template: string;
}

// ==============================================================================
// FASE 3: INSPECCIONES & PERITAJE VEHICULAR - TIPOS
// ==============================================================================

export type InspectionType = 'precompra' | 'interna';

export type InspectionStatus = 
  | 'Solicitada' 
  | 'Agendada' 
  | 'En curso' 
  | 'Completada' 
  | 'Cancelada';

export type InspectionTrafficLight = 'Recomendable' | 'Con reparos' | 'No recomendable';

export type InspectionItemStatus = 'ok' | 'observacion' | 'falla';

export type InspectionChecklistSection = 
  | 'Documentación' 
  | 'Carrocería y pintura' 
  | 'Motor' 
  | 'Transmisión' 
  | 'Suspensión y dirección' 
  | 'Frenos' 
  | 'Neumáticos' 
  | 'Interior' 
  | 'Electricidad' 
  | 'Prueba de manejo';

export interface InspectionChecklistItem {
  id: string;
  section: InspectionChecklistSection;
  name: string;
  status: InspectionItemStatus;
  comment?: string;
  photos?: string[];
  isCosmetic?: boolean; // Para sugerir Detailing
  isCritical?: boolean; // Puntas de chasis, airbags, motor fundido
}

export type CarPanelId = 
  | 'capot' 
  | 'techo' 
  | 'baul' 
  | 'guardabarro_del_izq' 
  | 'guardabarro_del_der' 
  | 'puerta_del_izq' 
  | 'puerta_del_der' 
  | 'puerta_tras_izq' 
  | 'puerta_tras_der' 
  | 'guardabarro_tras_izq' 
  | 'guardabarro_tras_der' 
  | 'paragolpe_del' 
  | 'paragolpe_tras' 
  | 'zocalo_izq' 
  | 'zocalo_der';

export type CarPanelState = 'original' | 'repintado' | 'masillado' | 'danado';

export interface CarPanelInspection {
  panelId: CarPanelId;
  name: string;
  state: CarPanelState;
  thicknessMicrons?: number; // Ej: 110 µm original, 220 µm repintado, 500 µm masilla
  notes?: string;
}

export type AutomotoraDecision = 'comprar' | 'negociar' | 'no_comprar';

export interface VehicleInspection {
  id: string;
  type: InspectionType;
  token: string; // Token único seguro para el informe público (ej: 'tk_9f82a1...')
  client_id?: string;
  client?: Client;
  vehicle_id?: string;
  vehicle?: Vehicle;
  vehicle_plate: string;
  vehicle_info: string;
  vehicle_category: VehicleCategory;
  buyer_name?: string;
  buyer_phone?: string;
  seller_name?: string;
  seller_phone?: string;
  assigned_to?: string; // ID del inspector
  assignee?: Profile;
  status: InspectionStatus;
  scheduled_at?: string; // ISO string
  completed_at?: string; // ISO string
  is_home_visit: boolean;
  home_address?: string;
  price_amount: number; // Precio precompra o costo interno
  price_currency: Currency;
  home_visit_surcharge: number;
  total_price: number;
  checklist: InspectionChecklistItem[];
  panels: CarPanelInspection[];
  obd_codes: string[]; // Códigos OBD-II
  obd_notes?: string;
  sucive_debt?: number;
  sucive_status?: string;
  mileage_declared?: number;
  mileage_observed?: number;
  mileage_tampered?: boolean;
  score: number; // 0 - 100
  traffic_light: InspectionTrafficLight;
  inspector_conclusion: string;
  estimated_repair_cost: number;
  repair_details?: string;
  automotora_decision?: AutomotoraDecision;
  automotora_suggested_price?: number;
  automotora_currency?: Currency;
  detailing_quote_id?: string; // Enlace si se generó cotización de detailing
  photos?: string[];
  inspector_signature?: string;
  is_archived?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionTariffConfig {
  prices: Record<VehicleCategory, number>;
  homeVisitSurcharge: number;
  internalCost: number;
}

// ==============================================================================
// FASE 4: AUTOMOTORA CARVLAK (MULTI-EMPRESA SAAS READY)
// ==============================================================================

export type DealershipVehicleStatus =
  | 'evaluacion'
  | 'comprado'
  | 'preparacion'
  | 'publicado'
  | 'reservado'
  | 'vendido'
  | 'descartado';

export type PurchaseOrigin = 'particular' | 'concesionaria' | 'parte_de_pago' | 'consignacion' | 'importador' | 'mayorista';

export type DealershipPaymentMethod =
  | 'contado'
  | 'transferencia'
  | 'financiacion'
  | 'permuta'
  | 'combinado';

export type DealershipInquiryOrigin =
  | 'Catalogo web'
  | 'WhatsApp'
  | 'Instagram'
  | 'Marketplace'
  | 'Presencial';

export type DealershipInquiryStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Visita agendada'
  | 'Prueba de manejo'
  | 'Negociando'
  | 'En negociacion'
  | 'Perdido'
  | 'Perdida'
  | 'Vendido'
  | 'Ganada';

export interface DealershipPrepChecklist {
  inspection_done: boolean;
  repairs_done: boolean;
  detailing_done: boolean;
  photos_done: boolean;
  docs_done: boolean;
}

export interface DealershipDocsReceived {
  titulo: boolean;
  libreta: boolean;
  cedula: boolean;
  sucive_al_dia: boolean;
  multas_al_dia: boolean;
  llave_duplicado: boolean;
  convenio_pago?: boolean;
}

export interface DealershipReservation {
  amount?: number;
  currency?: Currency;
  deposit_amount?: number;
  deposit_currency?: Currency;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  buyer_name?: string;
  buyer_phone?: string;
  date?: string;
  reserved_at?: string;
  expiration_date?: string;
  expires_at?: string;
  notes?: string;
}

export interface DealershipSaleRecord {
  sale_date: string;
  buyer_client_id?: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email?: string;
  buyer_document?: string;
  final_price?: number;
  sale_price?: number;
  currency?: Currency;
  sale_currency?: Currency;
  exchange_rate?: number;
  payment_method: DealershipPaymentMethod;
  gross_profit_usd?: number;
  commission_amount?: number;
  commission_paid?: boolean;
  trade_in?: {
    brand?: string;
    model?: string;
    year?: number;
    plate?: string;
    mileage?: number;
    trade_in_valuation_usd?: number;
  };
  trade_in_vehicle_id?: string;
  trade_in_plate?: string;
  trade_in_valuation?: number;
  seller_id?: string;
  seller_employee_id?: string;
  seller_employee_name?: string;
  seller_commission_amount?: number;
  paperwork_status?: 'pendiente' | 'en_tramite' | 'completado';
  notes?: string;
}

export type DealershipVehicleCondition = 'usado' | '0km';
export type DealershipVehicleType = 'Hatchback' | 'Sedán' | 'SUV' | 'Pick-up' | 'Coupé' | 'Utilitario' | 'Moto' | 'Auto' | 'Todoterreno' | string;

export interface DealershipDeliveryChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface DealershipDeliveryChecklist {
  items: DealershipDeliveryChecklistItem[];
  completed: boolean;
  delivery_date?: string;
  notes?: string;
}

export interface DealershipVehicleHistoryEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  user_name: string;
  field: string;
  field_label: string;
  old_value: any;
  new_value: any;
}

export interface DealershipCustomFieldDef {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  show_in_catalog: boolean; // Si se muestra en Tiendanube/catálogo público o es solo interno
  required?: boolean;
}

export interface DealershipVehicle {
  id: string;
  empresa_id: string; // Multi-tenant SaaS ready, default 'carvlak'
  vehicle_id?: string; // Vinculación opcional a base común
  plate?: string; // En 0km es opcional hasta que se empadrona
  chassis_vin?: string; // Identificador principal si no hay matrícula en 0km
  condition: DealershipVehicleCondition; // 'usado' | '0km'
  vehicle_type?: DealershipVehicleType; // 'auto' | 'moto' | 'todoterreno'
  autonomy_km?: number; // Autonomía en km para eléctricos
  tiendanube_id?: string; // ID de producto en Tiendanube
  tiendanube_synced_at?: string; // Última sincronización con Tiendanube
  tiendanube_sync_status?: 'synced' | 'pending' | 'error';
  tiendanube_sync_error?: string;
  incomplete_data?: boolean; // Flag para completar datos faltantes desde el celular
  brand: string;
  model: string;
  version?: string;
  year: number;
  mileage: number; // 0 por defecto para 0km
  category: VehicleCategory;
  body_type?: string; // Hatchback, Sedán, SUV, Pick-up, etc.
  engine?: string; // Motorización (ej: 1.4 TSI, 1.0 Turbo, 160kW Dual Motor)
  doors?: number; // Cantidad de puertas (ej: 2, 4, 5)
  transmission?: 'Manual' | 'Automática' | string;
  fuel?: 'Nafta' | 'Diesel' | 'Híbrido' | 'Eléctrico' | string;
  color_exterior?: string;
  padron?: string;
  vin?: string;
  status: DealershipVehicleStatus;
  is_featured?: boolean;
  features: string[];
  images: string[];
  flyer_images?: string[]; // URLs de fotos marcadas como 'Flyer / con texto'
  cover_image?: string;
  catalog_description?: string;
  internal_notes?: string; // Notas internas confidenciales de taller o directiva
  custom_fields?: Record<string, any>; // Valores dinámicos de campos personalizados

  // Datos de compra
  purchase_date?: string;
  purchase_origin?: PurchaseOrigin;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_price: number;
  purchase_currency: Currency;
  exchange_rate: number; // Ej: 43.50 UYU por USD
  docs_received: DealershipDocsReceived;
  supplier_payable?: {
    supplier_name: string;
    due_date: string;
    amount: number;
    is_paid: boolean;
    payment_date?: string;
    account?: string;
  };

  // Datos de venta
  sale_price: number; // Precio de lista en USD o UYU
  sale_currency: Currency;
  currency?: Currency; // Alias opcional para compatibilidad
  min_acceptable_price: number; // Solo Admin
  financing_available?: boolean;
  min_down_payment_usd?: number;
  monthly_installment_estimate_usd?: number;

  // Costos e Integraciones
  inspection_id?: string; // Vinculado a Fase 3
  inspection_cost: number; // Costo interno
  inspection_score?: number;
  inspection_traffic_light?: InspectionTrafficLight;

  detailing_quote_id?: string; // Vinculado a Fase 2
  detailing_cost: number; // Costo interno

  repairs_cost: number;
  paperwork_cost: number;
  other_expenses_cost: number;

  total_real_cost_usd?: number;
  estimated_margin_usd?: number;
  estimated_margin_percent?: number;

  // Preparación (Usados) o Entrega (0km)
  prep_checklist?: DealershipPrepChecklist;
  prep_assigned_to?: string;
  delivery_checklist?: DealershipDeliveryChecklist;

  // Reserva y Venta
  reservation?: DealershipReservation;
  sale_record?: DealershipSaleRecord;

  // Historial de Cambios / Auditoría
  history?: DealershipVehicleHistoryEntry[];

  // Auditoría
  is_archived: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DealershipInquiry {
  id: string;
  empresa_id: string;
  dealership_vehicle_id?: string;
  vehicle_info: string;
  vehicle_plate?: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  origin: DealershipInquiryOrigin;
  status: DealershipInquiryStatus;
  budget_usd?: number;
  trade_in_vehicle_info?: string;
  notes?: string;
  assigned_to?: string;
  appointment_id?: string; // Vinculado a turno en Agenda Unificada
  last_contact_at?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealershipConfig {
  empresa_id: string;
  company_name: string;
  days_alert_threshold: number; // Ej: 60 días
  days_in_stock_alert_threshold?: number;
  default_exchange_rate: number; // Ej: 43.50
  default_internal_inspection_cost: number; // Ej: 1500
  default_internal_detailing_cost: number; // Ej: 2500
  commission_basis: 'total_sale' | 'margin';
  default_commission_rate: number; // % ej: 1.5%
  seller_commission_percentage?: number;
  sellers_can_edit: boolean; // ¿Los vendedores tienen permiso para editar stock?

  // Listas editables
  brands: string[];
  models_by_brand: Record<string, string[]>;
  vehicle_types: string[];
  fuel_types: string[];
  transmission_types: string[];
  colors: string[];
  equipment_items: string[];
  required_documents: Array<{ key: string; label: string; default_required: boolean }>;
  statuses: Array<{ id: DealershipVehicleStatus; label: string; icon: string; description: string }>;

  // Campos personalizados
  custom_fields: DealershipCustomFieldDef[];
}

// ==============================================================================
// FASE 5: REDES SOCIALES & MARKETING STUDIO - TIPOS
// ==============================================================================

export type SocialMediaFormat = 'story' | 'post'; // Story: 1080x1920 (9:16), Post: 1080x1350 (4:5)

export type SocialMediaCategory = 'automotora' | 'detailing' | 'inspeccion';

export type SocialMediaTemplateId =
  // Automotora
  | 'auto-vendido'
  | 'auto-descuento'
  | 'auto-nuevo-ingreso'
  | 'auto-reservado'
  | 'auto-ficha-carrusel'
  | 'auto-catalogo-semana'
  | 'auto-rango-precio'
  | 'auto-electricos-0km'
  | 'auto-entrega'
  // Detailing & Inspección
  | 'detailing-antes-despues'
  | 'detailing-promo'
  | 'agenda-turnos-disponibles'
  | 'inspeccion-precompra';

export interface SocialMediaPostRecord {
  id: string;
  template_id: string;
  template_title: string;
  category: SocialMediaCategory;
  format: SocialMediaFormat;
  item_id?: string; // ID del auto, cotización o cliente
  item_title: string; // ej: "Volkswagen Golf 1.4 TSI 2018"
  thumbnail_data?: string; // Data URL miniatura para vista previa rápida
  image_url?: string; // URL pública en Supabase Storage (bucket media/social)
  editor_state?: any; // Estado guardado para re-editar en Estudio
  suggested_caption: string;
  is_published: boolean;
  published_at?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export type TemplateBackgroundMode = 'full_photo' | 'photo_with_band' | 'flat_color';
export type TemplateLogoVersion = 'blanco' | 'negro' | 'auto';
export type TemplateFontFamily = 'Archivo Narrow' | 'Barlow Condensed' | 'system-ui';
export type TemplateFontWeight = 'normal' | 'semibold' | 'bold' | 'black';

export type TextBackgroundType = 'none' | 'box' | 'banner';

export interface CanvasTextElement {
  id: string; // e.g. 'sello', 'modelo', 'precio', 'precio_anterior', 'subtitulo', 'specs_km', etc.
  label: string; // Friendly name: "Sello", "Modelo", "Precio", etc.
  text: string;
  visible: boolean;
  color: string; // Brand color or hex
  fontSize: number; // in px on 1080px base canvas
  fontWeight: 'normal' | 'semibold' | 'bold' | 'black';
  fontFamily: TemplateFontFamily;
  rotation: number; // degrees (-45 to 45)
  x: number; // center or left X
  y: number; // baseline or center Y
  align: 'left' | 'center' | 'right';
  bgType: TextBackgroundType;
  bgColor: string;
  bgOpacity: number; // 0 to 1
  isSpec?: boolean;
  specKey?: string;
}

export interface FormatLayoutConfig {
  backgroundMode: TemplateBackgroundMode;
  backgroundColor?: string;
  vignetteOpacity: number; // 0 to 1
  logoVersion: TemplateLogoVersion;
  logoPosition: LogoPosition;
  coverPlateDefault: boolean;
  showStamp: boolean;
  stampText?: string;
  stampColor?: string; // Brand palette: #D7141A, #EAB308, #22C55E, #FFFFFF, #000000
  stampRotation?: number; // e.g. -12, 0, 14
  headlineTemplate?: string;
  subtitleTemplate?: string;
  fontFamily?: TemplateFontFamily;
  fontScale?: 'normal' | 'large' | 'xlarge';
  showPrice: boolean;
  showOriginalPrice: boolean;
  priceColor?: string;
  specsSelection?: string[]; // e.g. ['year', 'mileage', 'fuel', 'transmission', 'engine', 'autonomy']
  specsOrder?: string[];
  ctaText?: string;
  phoneText?: string;
  textElements?: CanvasTextElement[];
}

export interface SocialMediaTemplateConfig {
  id: string; // SocialMediaTemplateId or custom string ID
  title: string;
  category: SocialMediaCategory;
  description: string;
  is_active?: boolean;
  is_custom?: boolean;
  badge_tag?: string; // ej: "ENTREGA CONFIRMADA", "DESTACADO DE LA SEMANA"
  stamp_text?: string; // ej: "VENDIDO", "OPORTUNIDAD", "RESERVADO"
  headline_default?: string;
  subtitle_default?: string;
  show_price?: boolean;
  logo_position: LogoPosition;
  default_caption_template: string;
  default_hashtags?: string;
  location_name?: string;
  layout_story?: FormatLayoutConfig;
  layout_post?: FormatLayoutConfig;
}

export interface MetaInstagramConfig {
  enabled: boolean;
  businessAccountId: string;
  appId: string;
  defaultPublishAction: 'download' | 'share' | 'instagram_direct';
  hasBackendProxy: boolean;
  backendEndpoint?: string;
  autoSchedule: boolean;
}

export interface SocialAutoTriggersConfig {
  onVehicleSold: boolean;
  onVehicleSoldTemplateId: string;
  onVehicleNewEntry: boolean;
  onVehicleNewEntryTemplateId: string;
  onVehicleStaleStock: boolean;
  onVehicleStaleStockDays: number;
  onVehicleStaleStockTemplateId: string;
  onDetailingDone: boolean;
  onDetailingDoneTemplateId: string;
  onMondayCatalog: boolean;
  onMondayCatalogTemplateId: string;
}

export interface SocialMediaConfig {
  allow_vendedor: boolean; // ¿Los vendedores tienen permiso para crear y compartir piezas?
  vendedor_can_publish?: boolean; // ¿Los vendedores pueden publicar directamente o solo descargar/compartir?
  instagram_handle: string; // ej: "@car.vlak"
  location_name: string; // ej: "Ciudad de la Costa, Canelones"
  whatsapp_number: string; // ej: "099 123 456"
  default_hashtag?: string; // ej: "#TuPróximoAuto"
  unified_version?: string; // Version stamp to migrate and reset old template layouts
  meta_instagram?: MetaInstagramConfig;
  auto_triggers?: SocialAutoTriggersConfig;
  templates: Record<string, SocialMediaTemplateConfig>;
}

// ==============================================================================
// CONFIGURACIÓN GENERAL DEL HUB CARVLAK
// ==============================================================================
export interface GeneralConfig {
  company_name: string;
  company_phone: string; // ej: "59899267964"
  company_phone_formatted: string; // ej: "099 267 964"
  jonathan_phone: string; // ej: "59899267964"
  address: string; // ej: "Av. Giannattasio & Calcagno, Shangrilá, Canelones"
  instagram_handle: string; // ej: "@car.vlak"
  catalog_url?: string;
  is_demo_mode: boolean; // Modo demostración (muestra datos de ejemplo o datos reales)
}

// ==============================================================================
// CONFIGURACIÓN AVANZADA DETAILVLAK (TALLER SHANGRILÁ)
// ==============================================================================

export interface DetailingWorkBay {
  id: string;
  name: string;
  color?: string;
  supported_services?: string[];
  is_active: boolean;
}

export interface DetailingFlowStatus {
  id: string;
  name: string;
  label?: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface DetailingAlertThresholds {
  unconfirmed_hours_before: number; // Turno de mañana sin confirmar (hs antes)
  late_checkin_minutes: number; // Turno que ya empezó y no fue recibido (minutos después)
  delayed_work_hours: number; // Trabajo atrasado (hs después de hora de fin)
  ready_not_notified_hours: number; // Auto listo sin avisar al cliente (hs)
  delivered_unpaid_hours: number; // Auto entregado sin cobro (hs)
  quote_followup_days: number; // Cotización sin respuesta (días)
  past_unclosed_hours: number; // Turno pasado sin cerrar (hs)
  stock_lead_days: number; // Insumo por debajo de lo necesario (días de anticipación)
}

export interface DetailingScheduleDay {
  open: string; // HH:mm
  close: string; // HH:mm
  open_time?: string;
  close_time?: string;
  is_open: boolean;
}

export interface DetailingSchedule {
  monday: DetailingScheduleDay;
  tuesday: DetailingScheduleDay;
  wednesday: DetailingScheduleDay;
  thursday: DetailingScheduleDay;
  friday: DetailingScheduleDay;
  saturday: DetailingScheduleDay;
  sunday: DetailingScheduleDay;
}

export interface DetailingHoliday {
  date: string; // YYYY-MM-DD
  reason: string;
  name?: string;
  is_closed?: boolean;
}

export interface DetailingChecklistItem {
  id: string;
  label: string;
  is_required?: boolean;
}

export interface DetailingRecipeItem {
  stock_item_id: string;
  quantity: number;
}

export type DetailingServiceRecipe = Record<string, DetailingRecipeItem[]>;

export interface DetailingRecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number; // 1..31
  frequency: 'mensual';
  payment_method?: string;
  notes?: string;
}

export interface DetailingDiscountConfig {
  id: string;
  label: string;
  percentage: number;
}

export interface DetailingCommissionOriginRule {
  origin: string; // ej. 'Anuncios pagos'
  percentage: number; // ej. 12.5
}

export interface DetailingCommissionEmployeeRule {
  employee_id: string;
  employee_name: string;
  base_percentage: number; // ej. 30
  origin_rules: DetailingCommissionOriginRule[];
  is_default_participant?: boolean;
}

export interface DetailingCommissionGlobalConfig {
  calculation_base: 'total_after_discounts' | 'exclude_surcharges' | 'subtract_supplies';
  default_participants: string[]; // employee_ids
  employee_rules: DetailingCommissionEmployeeRule[];
}

export interface DetailingReceiptConfig {
  prefix: string; // 'DV-'
  next_number: number; // 1
  company_trade_name: string;
  company_legal_name: string;
  company_rut: string;
  company_address: string;
  company_phone: string;
  company_instagram: string;
  company_logo_url?: string;
  footer_legend: string;
  service_care_warranties: Record<string, string>; // service_id o service_name -> texto
}

export interface DetailingReceipt {
  id: string;
  quote_id: string;
  receipt_number: string; // ej. DV-000001
  version: number;
  issue_date: string; // YYYY-MM-DD
  service_date: string; // YYYY-MM-DD
  token: string; // token público para ?comprobante=tk_...

  company_trade_name: string;
  company_legal_name: string;
  company_rut: string;
  company_address: string;
  company_phone: string;
  company_instagram: string;
  company_logo_url?: string;

  client_id?: string;
  client_name: string;
  client_phone: string;
  client_doc?: string;

  vehicle_info: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_plate?: string;
  reception_mileage?: number;

  detailer_id?: string;
  detailer_name: string;

  services: { serviceId: string; serviceName: string; description?: string; price: number }[];
  subtotal: number;
  discount_amount: number;
  discount_label?: string;
  surcharge_amount: number;
  total_amount: number;
  deposit_amount: number;
  balance_pending: number;
  payments: { amount: number; payment_method: string; date: string; notes?: string }[];
  status: 'Pagado' | 'Saldo pendiente' | 'Anulado';

  care_instructions: string;
  observations?: string;
  include_photos?: boolean;
  photos_before?: string[];
  photos_after?: string[];
  footer_legend: string;

  is_voided: boolean;
  voided_at?: string;
  void_reason?: string;
  created_at: string;
  created_by?: string;
}

export interface DetailingConfig {
  empresa_id: string;
  work_bays: DetailingWorkBay[];
  schedule: DetailingSchedule;
  buffer_between_appointments_min: number;
  holidays: DetailingHoliday[];
  flow_statuses: DetailingFlowStatus[];
  alert_thresholds: DetailingAlertThresholds;
  whatsapp_templates: {
    confirm_appointment: string;
    day_before_reminder: string;
    car_ready: string;
    quote_followup: string;
  };
  reception_checklist: DetailingChecklistItem[];
  quality_checklists_by_service: Record<string, DetailingChecklistItem[]>;
  quality_checklists?: Record<string, DetailingChecklistItem[]>;
  recipes_by_service: Record<string, DetailingServiceRecipe>;
  recurring_expenses: DetailingRecurringExpense[];
  monthly_budgets: Record<string, number>; // categoría -> monto UYU
  discounts_available: DetailingDiscountConfig[];
  extreme_dirt_surcharge_amount: number;
  expense_categories: string[];
  payment_methods: string[];
  suppliers: string[];
  stock_units: string[];
  void_reasons: string[];
  client_origins?: string[];
  commission_config?: DetailingCommissionGlobalConfig;
  receipt_config?: DetailingReceiptConfig;
}

export interface DetailingCleanSelection {
  quotes: boolean;
  appointments: boolean;
  commissions: boolean;
  payments: boolean;
  expenses: boolean;
  stock_movements: boolean;
  only_detailing_clients_vehicles: boolean;
}

export const isActiveJob = (job?: { voided_at?: string | null; is_voided?: boolean; status?: string; is_archived?: boolean } | null): boolean => {
  if (!job) return false;
  if (job.voided_at) return false;
  if (job.is_voided) return false;
  if (job.is_archived) return false;
  if (job.status === 'Anulado') return false;
  return true;
};

export const isActiveExpense = (exp?: { voided_at?: string | null; is_voided?: boolean; status?: string; is_archived?: boolean } | null): boolean => {
  if (!exp) return false;
  if (exp.voided_at) return false;
  if (exp.is_voided) return false;
  if (exp.is_archived) return false;
  if (exp.status === 'Anulado') return false;
  return true;
};



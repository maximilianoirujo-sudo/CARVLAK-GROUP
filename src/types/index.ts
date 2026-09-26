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
  entity_type: 'cliente' | 'vehiculo' | 'turno' | 'tarea' | 'empleado' | 'cotizacion_detailing' | 'stock' | 'gasto' | 'inspeccion' | 'automotora' | 'consulta_automotora' | 'venta_automotora' | 'orden_0km' | 'marca_0km' | 'caja_0km';
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

export type PurchaseOrigin = 'particular' | 'concesionaria' | 'parte_de_pago' | 'consignacion';

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

export interface DealershipVehicle {
  id: string;
  empresa_id: string; // Multi-tenant SaaS ready, default 'carvlak'
  vehicle_id?: string; // Vinculación opcional a base común
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  mileage: number;
  category: VehicleCategory;
  body_type?: string; // Hatchback, Sedán, SUV, Pick-up, etc.
  transmission?: 'Manual' | 'Automática' | string;
  fuel?: 'Nafta' | 'Diesel' | 'Híbrido' | 'Eléctrico' | string;
  color_exterior?: string;
  padron?: string;
  vin?: string;
  status: DealershipVehicleStatus;
  is_featured?: boolean;
  features: string[];
  images: string[];
  cover_image?: string;
  catalog_description?: string;

  // Datos de compra
  purchase_date?: string;
  purchase_origin?: PurchaseOrigin;
  supplier_name?: string;
  supplier_phone?: string;
  purchase_price: number;
  purchase_currency: Currency;
  exchange_rate: number; // Ej: 43.50 UYU por USD
  docs_received: DealershipDocsReceived;

  // Datos de venta
  sale_price: number; // Precio de lista en USD o UYU
  sale_currency: Currency;
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

  total_real_cost_usd: number;
  estimated_margin_usd: number;
  estimated_margin_percent: number;

  // Preparación
  prep_checklist: DealershipPrepChecklist;
  prep_assigned_to?: string;

  // Reserva y Venta
  reservation?: DealershipReservation;
  sale_record?: DealershipSaleRecord;

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
}

// ==============================================================================
// COMPLEMENTO 0KM: MODELO DE GANANCIA POR MARCA, CAJA & FONDOS A RENDIR
// ==============================================================================

export type ZeroKmProfitScheme = 'margen' | 'comision_aparte';

export interface ZeroKmBrandConfig {
  id: string;
  brand: string;
  importer_name: string;
  profit_scheme: ZeroKmProfitScheme;
  default_commission_type?: 'percentage' | 'fixed_amount';
  default_commission_value?: number; // e.g. 4.5% o USD 1200
  payment_terms_days: number; // e.g. 15 o 30 días
  contact_person?: string;
  contact_phone?: string;
}

export type ZeroKmDeliveryStatus =
  | 'pedido_confirmado'
  | 'en_transito'
  | 'en_salon_preparacion'
  | 'entregado'
  | 'cancelado';

export type ZeroKmPaymentStatus =
  | 'pendiente'
  | 'sena_cobrada'
  | 'saldo_pendiente'
  | 'cobrado_total';

export type ZeroKmImporterPaymentStatus =
  | 'pendiente'
  | 'pagado_parcial'
  | 'pagado_total';

export type ZeroKmCashMovementTag =
  | 'Cobro 0km – fondos a rendir'
  | 'Pago a importador 0km'
  | 'Comisión cobrada de importador';

export interface ZeroKmCashMovement {
  id: string;
  order_id: string;
  order_info: string;
  type: 'ingreso' | 'egreso';
  tag: ZeroKmCashMovementTag;
  amount: number;
  currency: Currency;
  account: string; // e.g. 'Santander USD', 'Itaú USD', 'Caja Efectivo USD'
  date: string;
  receipt_number?: string;
  notes?: string;
  created_at: string;
}

export interface ZeroKmOrder {
  id: string;
  empresa_id: string; // Multi-tenant SaaS ready, default 'carvlak'
  brand: string;
  model: string;
  version: string;
  color?: string;
  chassis_vin?: string;
  year: number;

  // Cliente
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;

  // Importador & Esquema
  importer_name: string;
  importer_scheme: ZeroKmProfitScheme;

  // Números comerciales (USD)
  sale_price_client: number; // Precio de venta total acordado con cliente
  amount_to_pay_importer: number; // Monto a pagar al importador
  resulting_profit: number; // Ganancia computable para CARVLAK (Margen o Comisión)

  // En Opción B: Comisión del importador
  commission_from_importer?: number;
  commission_status_from_importer?: 'pendiente' | 'cobrado';
  commission_collected_date?: string;

  // Cobranzas al cliente (Seña y Saldo)
  client_deposit_amount: number;
  client_deposit_account?: string;
  client_deposit_date?: string;
  client_balance_amount: number;
  client_balance_account?: string;
  client_balance_date?: string;
  client_total_collected: number;
  client_payment_status: ZeroKmPaymentStatus;

  // Pagos al importador (Cuentas por Pagar)
  importer_payment_due_date: string;
  importer_payment_status: ZeroKmImporterPaymentStatus;
  amount_paid_to_importer: number;
  importer_payment_date?: string;
  importer_payment_account?: string;

  // Estado físico de la unidad
  unit_delivery_status: ZeroKmDeliveryStatus;
  unit_delivery_date?: string;

  // Vendedor & Auditoría
  seller_id?: string;
  seller_name?: string;
  seller_commission?: number;
  notes?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}


// ==============================================================================
// CARVLAK GROUP - DATOS SEMILLA & DEMO LOCAL
// ==============================================================================

import { 
  Profile, 
  Client, 
  Vehicle, 
  Appointment, 
  Task, 
  VehicleHistoryEvent, 
  ActivityLog,
  DetailingTariff,
  DetailingQuote,
  StockItem,
  Expense,
  CommissionRecord,
  WhatsAppTemplate,
  VehicleInspection,
  InspectionChecklistItem,
  CarPanelInspection,
  InspectionTariffConfig,
  DealershipVehicle,
  DealershipInquiry,
  DealershipConfig,
  ZeroKmBrandConfig,
  ZeroKmOrder,
  ZeroKmCashMovement
} from '../types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-maxi',
    email: 'maxi@carvlak.com',
    full_name: 'Maximiliano Irujo',
    phone: '099 267 964',
    roles: ['admin', 'encargado', 'detailer', 'inspector', 'vendedor'],
    businesses: ['automotora', 'detailing', 'inspeccion'],
    is_active: true,
    commissions: { automotora: 0, detailing: 30, inspeccion: 0 },
    created_at: new Date().toISOString()
  },
  {
    id: 'user-jonathan',
    email: 'jonathan@carvlak.com',
    full_name: 'Jonathan Kaitazoff',
    phone: '099 267 964',
    roles: ['encargado', 'vendedor', 'inspector'],
    businesses: ['automotora', 'inspeccion'],
    is_active: true,
    commissions: { automotora: 15, detailing: 0, inspeccion: 10 },
    created_at: new Date().toISOString()
  },
  {
    id: 'user-romina',
    email: 'romina@detailvlak.com',
    full_name: 'Romina',
    phone: '099 123 456',
    roles: ['encargado', 'detailer'],
    businesses: ['detailing'],
    is_active: true,
    commissions: { automotora: 0, detailing: 20, inspeccion: 0 },
    created_at: new Date().toISOString()
  },
  {
    id: 'user-matias',
    email: 'matias@detailvlak.com',
    full_name: 'Matías Rodríguez',
    phone: '098 765 432',
    roles: ['detailer'],
    businesses: ['detailing'],
    is_active: true,
    commissions: { automotora: 0, detailing: 10, inspeccion: 0 },
    created_at: new Date().toISOString()
  },
  {
    id: 'user-diego',
    email: 'diego@carvlak.com',
    full_name: 'Diego Silva',
    phone: '091 888 999',
    roles: ['inspector'],
    businesses: ['inspeccion'],
    is_active: true,
    commissions: { automotora: 0, detailing: 0, inspeccion: 15 },
    created_at: new Date().toISOString()
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    full_name: 'Gonzalo Herosa',
    phone: '093 492 241',
    email: 'gonzalo.herosa@gmail.com',
    cedula: '4.582.119-4',
    origin: 'Instagram',
    notes: 'Interesado en permutar su vehículo y contratar cerámico.',
    is_archived: false,
    created_by: 'user-maxi',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-20T10:00:00Z'
  },
  {
    id: 'cli-2',
    full_name: 'Nicolás Varela',
    phone: '099 456 789',
    email: 'nicolas.varela@hotmail.com',
    cedula: '3.912.845-1',
    origin: 'WhatsApp',
    notes: 'Cliente premium con BMW Serie 3. Cuidadoso con el estado de la laca.',
    is_archived: false,
    created_by: 'user-maxi',
    created_at: '2026-09-21T11:30:00Z',
    updated_at: '2026-09-21T11:30:00Z'
  },
  {
    id: 'cli-3',
    full_name: 'Camila Rodríguez',
    phone: '098 123 456',
    email: 'camila.rod@gmail.com',
    cedula: '5.102.394-0',
    origin: 'Presencial',
    notes: 'Vino al taller en Shangrilá. Consulta por limpieza integral y pulido.',
    is_archived: false,
    created_by: 'user-romina',
    created_at: '2026-09-22T14:15:00Z',
    updated_at: '2026-09-22T14:15:00Z'
  },
  {
    id: 'cli-4',
    full_name: 'Martín Méndez',
    phone: '091 234 890',
    email: 'martin.mendez@outlook.com',
    cedula: '4.201.789-3',
    origin: 'Referido',
    notes: 'Recomendado por Jonathan. Hilux para lavado técnico de motor y chasis.',
    is_archived: false,
    created_by: 'user-jonathan',
    created_at: '2026-09-23T09:00:00Z',
    updated_at: '2026-09-23T09:00:00Z'
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    plate: 'SBX 1234',
    brand: 'BMW',
    model: 'Serie 3 320i',
    year: 2021,
    color: 'Negro Zafiro Metalizado',
    mileage: 38500,
    category: 'Mediano',
    ownership: 'client',
    client_id: 'cli-2',
    photos: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop'
    ],
    is_archived: false,
    created_by: 'user-maxi',
    created_at: '2026-09-21T11:35:00Z',
    updated_at: '2026-09-21T11:35:00Z'
  },
  {
    id: 'veh-2',
    plate: 'AAT 8920',
    brand: 'Toyota',
    model: 'Hilux SRX 4x4',
    year: 2022,
    color: 'Blanco Perlado',
    mileage: 54000,
    category: 'Pick-up',
    ownership: 'client',
    client_id: 'cli-4',
    photos: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop'
    ],
    is_archived: false,
    created_by: 'user-jonathan',
    created_at: '2026-09-23T09:10:00Z',
    updated_at: '2026-09-23T09:10:00Z'
  },
  {
    id: 'veh-3',
    plate: 'BCA 5412',
    brand: 'Volkswagen',
    model: 'Golf GTI 2.0 TSI',
    year: 2019,
    color: 'Gris Carbón Metalizado',
    mileage: 62000,
    category: 'Chico',
    ownership: 'dealership',
    client_id: undefined,
    photos: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop'
    ],
    is_archived: false,
    created_by: 'user-maxi',
    created_at: '2026-09-18T16:00:00Z',
    updated_at: '2026-09-18T16:00:00Z'
  },
  {
    id: 'veh-4',
    plate: 'SAY 7741',
    brand: 'Jeep',
    model: 'Renegade Trailhawk 4x4',
    year: 2022,
    color: 'Rojo Colorado',
    mileage: 29800,
    category: 'SUV/Rural',
    ownership: 'client',
    client_id: 'cli-3',
    photos: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop'
    ],
    is_archived: false,
    created_by: 'user-romina',
    created_at: '2026-09-22T14:20:00Z',
    updated_at: '2026-09-22T14:20:00Z'
  }
];

export const INITIAL_VEHICLE_HISTORY: VehicleHistoryEvent[] = [
  {
    id: 'vh-1',
    vehicle_id: 'veh-1',
    business: 'detailing',
    event_type: 'Tratamiento Cerámico',
    description: 'Coating cerámico nanotecnológico 3 años y corrección de pintura en 2 pasos.',
    created_by: 'user-maxi',
    created_at: '2026-09-22T17:00:00Z'
  },
  {
    id: 'vh-2',
    vehicle_id: 'veh-2',
    business: 'inspeccion',
    event_type: 'Peritaje en Patio',
    description: 'Inspección de 15 paneles: 100% original, sin deformaciones ni daño de chasis.',
    created_by: 'user-jonathan',
    created_at: '2026-09-23T10:30:00Z'
  },
  {
    id: 'vh-3',
    vehicle_id: 'veh-3',
    business: 'automotora',
    event_type: 'Ingreso al Stock',
    description: 'Unidad recibida para comercialización en showroom. Documentación verificada en SUCIVE.',
    created_by: 'user-maxi',
    created_at: '2026-09-18T16:15:00Z'
  }
];

const now = new Date();
const todayIso = now.toISOString().slice(0, 10);

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    business: 'detailing',
    client_id: 'cli-2',
    vehicle_id: 'veh-1',
    assigned_to: 'user-maxi',
    start_time: `${todayIso}T10:00:00Z`,
    duration_minutes: 180,
    status: 'Confirmado',
    title: 'Tratamiento Cerámico Vidrio Líquido',
    notes: 'El cliente solicita especial cuidado con la laca piano black del techo.',
    price_amount: 18500,
    price_currency: 'UYU',
    created_by: 'user-maxi',
    created_at: '2026-09-24T12:00:00Z',
    updated_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'app-2',
    business: 'inspeccion',
    client_id: 'cli-1',
    vehicle_id: 'veh-2',
    assigned_to: 'user-jonathan',
    start_time: `${todayIso}T14:30:00Z`,
    duration_minutes: 45,
    status: 'Pendiente',
    title: 'Peritaje Rápido en Patio (Trade-In)',
    notes: 'Revisar espesores de pintura en el lateral derecho por posible repintado.',
    price_amount: 2200,
    price_currency: 'UYU',
    created_by: 'user-jonathan',
    created_at: '2026-09-24T15:00:00Z',
    updated_at: '2026-09-24T15:00:00Z'
  },
  {
    id: 'app-3',
    business: 'automotora',
    client_id: 'cli-3',
    vehicle_id: 'veh-3',
    assigned_to: 'user-maxi',
    start_time: `${todayIso}T16:30:00Z`,
    duration_minutes: 60,
    status: 'Confirmado',
    title: 'Test Drive & Coordinación de Seña',
    notes: 'Interesada en entrega de USD 7.000 y saldo financiado en 36 cuotas.',
    price_amount: 24500,
    price_currency: 'USD',
    created_by: 'user-maxi',
    created_at: '2026-09-24T16:00:00Z',
    updated_at: '2026-09-24T16:00:00Z'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Preparar productos cerámicos Gyeon y microfibras',
    description: 'Verificar stock de pads de pulido y sellador nanotecnológico para el BMW 320i.',
    business: 'detailing',
    assigned_to: 'user-matias',
    due_date: todayIso,
    status: 'En curso',
    created_by: 'user-maxi',
    created_at: '2026-09-24T08:00:00Z',
    updated_at: '2026-09-24T08:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Revisión de títulos en escribanía para Golf GTI',
    description: 'Solicitar certificados de libre prenda y comprobante de patente paga en SUCIVE.',
    business: 'automotora',
    assigned_to: 'user-jonathan',
    due_date: todayIso,
    status: 'Pendiente',
    created_by: 'user-maxi',
    created_at: '2026-09-24T09:30:00Z',
    updated_at: '2026-09-24T09:30:00Z'
  },
  {
    id: 'task-3',
    title: 'Calibrar sensor de espesores magnético',
    description: 'Dejar el medidor listo con pilas cargadas para los peritajes del fin de semana.',
    business: 'inspeccion',
    assigned_to: 'user-diego',
    due_date: todayIso,
    status: 'Hecha',
    created_by: 'user-jonathan',
    created_at: '2026-09-24T11:00:00Z',
    updated_at: '2026-09-24T11:00:00Z'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_name: 'Maximiliano Irujo',
    entity_type: 'turno',
    action: 'create',
    details: { title: 'Tratamiento Cerámico Vidrio Líquido', client: 'Nicolás Varela' },
    created_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'log-2',
    user_name: 'Jonathan Kaitazoff',
    entity_type: 'vehiculo',
    action: 'update',
    details: { plate: 'AAT 8920', action: 'Peritaje aprobado' },
    created_at: '2026-09-24T10:35:00Z'
  }
];

// ==============================================================================
// FASE 2: DETAILVLAK PRO - DATOS SEMILLA
// ==============================================================================

export const INITIAL_DETAILING_TARIFFS: DetailingTariff[] = [
  {
    id: 'interior',
    name: 'Limpieza profunda de interiores (Tapizados, alfombras, techo, paneles y desinfección)',
    shortName: 'Limpieza profunda de interior',
    description: 'Inyección y extracción de tapizados, limpieza profunda a vapor, techo, alfombras y desinfección total.',
    durationHours: 5,
    prices: { chico: 3500, mediano: 4200, suv: 4900, pickup: 5800, moto: 2000 },
    isActive: true
  },
  {
    id: 'cuero',
    name: 'Nutrición y restauración de tapizados de cuero',
    shortName: 'Tratamiento de cuero',
    description: 'Limpieza técnica de poros y nutrición profunda con acondicionadores mate de pH neutro.',
    durationHours: 3,
    prices: { chico: 2200, mediano: 2600, suv: 3200, pickup: 3800, moto: 1500 },
    isActive: true
  },
  {
    id: 'motor',
    name: 'Lavado y detallado técnico de motor (Vapor / dieléctrico + acondicionador de plásticos)',
    shortName: 'Detallado de motor',
    description: 'Limpieza técnica segura con vapor, desengrasante dieléctrico y acondicionamiento satinado de mangueras y plásticos.',
    durationHours: 2.5,
    prices: { chico: 1800, mediano: 1800, suv: 2000, pickup: 2200, moto: 1500 },
    isActive: true
  },
  {
    id: 'opticas',
    name: 'Pulido y restauración de ópticas / faros (Lijado + pulido + protección UV)',
    shortName: 'Restauración de ópticas',
    description: 'Lijado al agua en varios pasos, pulido de alta transparencia y sellado de protección contra rayos UV.',
    durationHours: 2,
    prices: { chico: 2000, mediano: 2000, suv: 2000, pickup: 2000, moto: 1200 },
    isActive: true
  },
  {
    id: 'lavado_exterior',
    name: 'Lavado técnico exterior & descontaminado de pintura',
    shortName: 'Lavado al detalle exterior',
    description: 'Lavado con guante de microfibra en 2 baldes, descontaminado químico y mecánico con clay bar.',
    durationHours: 2.5,
    prices: { chico: 1800, mediano: 2200, suv: 2600, pickup: 3200, moto: 1400 },
    isActive: true
  },
  {
    id: 'pulido',
    name: 'Pulido / Corrección de pintura (Eliminación de microrayones / swirls)',
    shortName: 'Corrección de pintura / Pulido',
    description: 'Corte, pulido y abrillantado técnico para devolver el brillo espejo y eliminar marcas de lavado.',
    durationHours: 8,
    prices: { chico: 6800, mediano: 7900, suv: 9200, pickup: 10800, moto: 3800 },
    isActive: true
  },
  {
    id: 'ceramico',
    name: 'Tratamiento Acrílico o Cerámico (Sellado de alto brillo y protección)',
    shortName: 'Sellado Cerámico / Acrílico',
    description: 'Protección hidrofóbica de larga duración contra rayos UV, lluvia ácida y contaminación.',
    durationHours: 8,
    prices: { chico: 8500, mediano: 9800, suv: 11500, pickup: 13200, moto: 4500 },
    isActive: true
  },
  {
    id: 'llantas',
    name: 'Detallado profundo de llantas, cálipers y pasarruedas',
    shortName: 'Detallado de llantas y chasis',
    description: 'Descontaminado férrico de llantas, limpieza de pasarruedas y sellado protector.',
    durationHours: 2,
    prices: { chico: 1600, mediano: 1800, suv: 2200, pickup: 2500, moto: 1200 },
    isActive: true
  }
];

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-1',
    business: 'detailing',
    name: 'Shampoo pH Neutro Concentrado',
    category: 'Químicos',
    unit: 'litros',
    quantity: 4.5,
    min_stock: 2.0,
    unit_cost: 850,
    supplier: 'Detailing Pro UY',
    updated_at: '2026-09-24T10:00:00Z',
    movements: [
      {
        id: 'mov-1',
        stock_item_id: 'stk-1',
        type: 'Entrada',
        quantity: 5.0,
        unit_cost: 850,
        operator_name: 'Maximiliano Irujo',
        notes: 'Compra bidón 5L',
        created_at: '2026-09-20T10:00:00Z'
      }
    ]
  },
  {
    id: 'stk-2',
    business: 'detailing',
    name: 'APC Limpiador Multiuso (Interior/Motor)',
    category: 'Químicos',
    unit: 'litros',
    quantity: 1.5,
    min_stock: 2.0, // Alerta stock bajo
    unit_cost: 790,
    supplier: 'Detailing Pro UY',
    updated_at: '2026-09-24T10:00:00Z',
    movements: []
  },
  {
    id: 'stk-3',
    business: 'detailing',
    name: 'Coating Cerámico 9H (Frasco 30ml)',
    category: 'Selladores',
    unit: 'unidades',
    quantity: 1, // Alerta stock bajo
    min_stock: 2,
    unit_cost: 2400,
    supplier: 'Importador CarCare',
    updated_at: '2026-09-24T10:00:00Z',
    movements: []
  },
  {
    id: 'stk-4',
    business: 'detailing',
    name: 'Paños Microfibra Sin Costura 40x40 (400gsm)',
    category: 'Paños/Microfibras',
    unit: 'unidades',
    quantity: 18,
    min_stock: 10,
    unit_cost: 190,
    supplier: 'Detailing Pro UY',
    updated_at: '2026-09-24T10:00:00Z',
    movements: []
  },
  {
    id: 'stk-5',
    business: 'detailing',
    name: 'Pads de Corte Pesado Cordero / Espuma 5.5"',
    category: 'Pads',
    unit: 'unidades',
    quantity: 4,
    min_stock: 3,
    unit_cost: 650,
    supplier: 'Koch Chemie UY',
    updated_at: '2026-09-24T10:00:00Z',
    movements: []
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    business: 'detailing',
    date: '2026-09-20',
    amount: 4250,
    currency: 'UYU',
    category: 'Insumos',
    payment_method: 'Transferencia',
    description: 'Compra de shampoo concentrado y microfibras en Detailing Pro UY',
    created_by: 'user-maxi',
    created_at: '2026-09-20T10:30:00Z'
  },
  {
    id: 'exp-2',
    business: 'detailing',
    date: '2026-09-22',
    amount: 1800,
    currency: 'UYU',
    category: 'Herramientas/Maquinaria',
    payment_method: 'Efectivo',
    description: 'Mantenimiento de compresor y mangueras neumáticas',
    created_by: 'user-maxi',
    created_at: '2026-09-22T15:00:00Z'
  },
  {
    id: 'exp-3',
    business: 'detailing',
    date: '2026-09-23',
    amount: 3500,
    currency: 'UYU',
    category: 'Marketing/Publicidad',
    payment_method: 'Tarjeta',
    description: 'Pauta Instagram campaña tratamientos cerámicos primavera',
    created_by: 'user-maxi',
    created_at: '2026-09-23T12:00:00Z'
  }
];

export const INITIAL_DETAILING_QUOTES: DetailingQuote[] = [
  {
    id: 'quote-1',
    client_id: 'cli-2',
    vehicle_id: 'veh-1',
    client_name: 'Nicolás Varela',
    client_phone: '098 765 432',
    vehicle_info: 'BMW 320i M-Sport (2021)',
    vehicle_plate: 'SBX 1234',
    vehicle_category: 'Mediano',
    selected_services: [
      { serviceId: 'ceramico', serviceName: 'Sellado Cerámico / Acrílico', price: 9800 },
      { serviceId: 'interior', serviceName: 'Limpieza profunda de interior', price: 4200 }
    ],
    subtotal: 14000,
    discount_type: 'combo_10',
    discount_amount: 1400,
    extreme_dirt_surcharge: 0,
    total_amount: 12600,
    estimated_time: '2 días',
    assigned_to: 'user-maxi',
    origin: 'WhatsApp',
    notes: 'Priorizar protección contra microrayones en laca negra.',
    priority_zones: 'Capot y techo negro piano',
    status: 'Turno Confirmado',
    appointment_id: 'app-1',
    appointment_date: `${todayIso}T10:00:00Z`,
    created_by: 'user-maxi',
    created_at: '2026-09-23T11:00:00Z',
    updated_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'quote-2',
    client_id: 'cli-1',
    vehicle_id: 'veh-2',
    client_name: 'Estudio Jurídico Alvear (Martín)',
    client_phone: '099 123 456',
    vehicle_info: 'Toyota Hilux SRV 4x4 (2023)',
    vehicle_plate: 'AAT 8920',
    vehicle_category: 'Pick-up',
    selected_services: [
      { serviceId: 'lavado_exterior', serviceName: 'Lavado al detalle exterior', price: 3200 },
      { serviceId: 'interior', serviceName: 'Limpieza profunda de interior', price: 5800 }
    ],
    subtotal: 9000,
    discount_type: 'none',
    discount_amount: 0,
    extreme_dirt_surcharge: 1500, // Suciedad de campo
    total_amount: 10500,
    estimated_time: '1 día',
    assigned_to: 'user-matias',
    origin: 'Presencial',
    notes: 'Camioneta con barro seco en chasis y tapizados con tierra.',
    priority_zones: 'Tapizados de tela y chasis',
    status: 'Por Cotizar',
    created_by: 'user-maxi',
    created_at: '2026-09-24T09:30:00Z',
    updated_at: '2026-09-24T09:30:00Z'
  },
  {
    id: 'quote-3',
    client_id: 'cli-3',
    vehicle_id: 'veh-3',
    client_name: 'Lucía Fernández',
    client_phone: '094 555 789',
    vehicle_info: 'Volkswagen Golf GTI Mk7 (2018)',
    vehicle_plate: 'SCA 4321',
    vehicle_category: 'Chico',
    selected_services: [
      { serviceId: 'pulido', serviceName: 'Corrección de pintura / Pulido', price: 6800 },
      { serviceId: 'opticas', serviceName: 'Restauración de ópticas', price: 2000 }
    ],
    subtotal: 8800,
    discount_type: 'special_15',
    discount_amount: 1320,
    extreme_dirt_surcharge: 0,
    total_amount: 7480,
    estimated_time: '8 horas',
    assigned_to: 'user-maxi',
    origin: 'Instagram',
    notes: 'Trabajo terminado y entregado a entera conformidad.',
    priority_zones: 'Ópticas delanteras y pulido capot',
    status: 'Trabajo Completado',
    created_by: 'user-maxi',
    created_at: '2026-09-21T14:00:00Z',
    updated_at: '2026-09-22T18:00:00Z'
  }
];

export const INITIAL_COMMISSIONS: CommissionRecord[] = [
  {
    id: 'comm-1',
    business: 'detailing',
    employee_id: 'user-maxi',
    employee_name: 'Maximiliano Irujo',
    quote_id: 'quote-3',
    client_name: 'Lucía Fernández',
    vehicle_description: 'VW Golf GTI (SCA 4321)',
    amount_charged: 7480,
    commission_rate: 30,
    commission_amount: 2244, // 30% de 7480
    status: 'Pendiente',
    created_at: '2026-09-22T18:00:00Z'
  }
];

export const INITIAL_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: 'formal',
    title: 'Formal Detallada',
    description: 'Presupuesto completo y profesional con desglose de servicios, tiempo y medios de pago.',
    template: `¡Hola {{cliente}}! Te escribe {{operador}} de *DetailVlak* 🚗✨

Recibimos tu consulta para tu *{{vehiculo}}* y con gusto te pasamos la cotización detallada:

📋 *Servicios presupuestados:*
{{servicios}}

⏱️ *Tiempo estimado de trabajo:* {{tiempo}}
💰 *Total Final:* *{{total}}*
💳 *Formas de pago:* Efectivo, Transferencia o Tarjetas de Crédito / Débito.

📍 *Ubicación del taller:* Av. Giannattasio y, Shangrilá, Canelones

¿Te gustaría que veamos disponibilidad de días para agendar tu turno esta semana?`
  },
  {
    key: 'promo',
    title: 'Promo Combo',
    description: 'Enfocada en el valor del combo y beneficio por confirmación rápida en 48hs.',
    template: `¡Hola {{cliente}}! 👋 Te saluda {{operador}} de *DetailVlak* (Shangrilá).

Para tu *{{vehiculo}}*, el paquete completo de *{{servicios_resumen}}* queda en un total de *{{total}}*.

🎁 *Beneficio exclusivo:* Si confirmamos el turno en las próximas 48hs, te bonificamos sin costo el sellado y acondicionado protector de gomas y plásticos exteriores.

¿Querés que te guardemos un lugar para esta semana?`
  },
  {
    key: 'fotos',
    title: 'Pedir Fotos',
    description: 'Solicitud amable de fotos o video para evaluar la pintura antes de cotizar.',
    template: `¡Hola {{cliente}}! ¿Cómo estás? Te escribe {{operador}} de *DetailVlak* 🚗

Estuvimos revisando tu solicitud para tu *{{vehiculo}}* ({{servicios_resumen}}). 

Para darte el presupuesto más exacto y asesorarte con precisión:
📸 ¿Podrías enviarnos por acá 2 o 3 fotos o un video corto del estado actual?

Así lo evaluamos enseguida y te pasamos los números exactos. ¡Muchas gracias!`
  },
  {
    key: 'seguimiento',
    title: 'Seguimiento',
    description: 'Recordatorio para presupuestos enviados sin respuesta para cerrar turnos de la semana.',
    template: `¡Hola {{cliente}}! ¿Cómo estás? Te saluda {{operador}} de *DetailVlak* 🚗

Te escribo para saber si pudiste revisar el presupuesto que te enviamos para tu *{{vehiculo}}*.

Estamos cerrando la agenda de la semana y nos quedan los últimos cupos disponibles en taller. ¿Querés que te reservemos un lugar?`
  },
  {
    key: 'turno',
    title: 'Confirmar Turno',
    description: 'Confirmación oficial de fecha agendada con dirección y recordatorio de objetos personales.',
    template: `¡Excelente {{cliente}}! Turno confirmado con éxito en *DetailVlak* 🗓️✅

🚗 *Vehículo:* {{vehiculo}}
🛠️ *Trabajo a realizar:* {{servicios_resumen}}
💰 *Presupuesto acordado:* {{total}}
📍 *Dirección:* Av. Giannattasio y, Shangrilá, Canelones

⚠️ *Recomendación:* Por favor retirar objetos personales de valor antes de ingresar el vehículo al taller.

¡Muchas gracias por confiar en nosotros! Nos vemos pronto.`
  }
];

// ==============================================================================
// FASE 3: INSPECCIONES & PERITAJE VEHICULAR - DATOS SEMILLA
// ==============================================================================

export const DEFAULT_CHECKLIST_TEMPLATE: InspectionChecklistItem[] = [
  // 1. Documentación
  { id: 'doc-1', section: 'Documentación', name: 'Título de propiedad y libreta municipal', status: 'ok' },
  { id: 'doc-2', section: 'Documentación', name: 'Deuda de patente y multas SUCIVE al día', status: 'ok' },
  { id: 'doc-3', section: 'Documentación', name: 'Kilometraje declarado vs. desgaste observable', status: 'ok' },

  // 2. Carrocería y pintura
  { id: 'car-1', section: 'Carrocería y pintura', name: 'Alineación de luces, capot, puertas y portón', status: 'ok' },
  { id: 'car-2', section: 'Carrocería y pintura', name: 'Estado de pintura, microrayones y brillo', status: 'observacion', isCosmetic: true, comment: 'Microrayones de lavado en laca y marcas de agua en capot.' },
  { id: 'car-3', section: 'Carrocería y pintura', name: 'Ópticas delanteras y faros traseros (sin opacidad)', status: 'ok', isCosmetic: true },
  { id: 'car-4', section: 'Carrocería y pintura', name: 'Parabrisas, luneta y cristales (grabado reglamentario)', status: 'ok' },

  // 3. Motor
  { id: 'mot-1', section: 'Motor', name: 'Fugas visibles de aceite, refrigerante o líquido hidráulico', status: 'ok' },
  { id: 'mot-2', section: 'Motor', name: 'Nivel y color de aceite y líquido refrigerante', status: 'ok' },
  { id: 'mot-3', section: 'Motor', name: 'Ralentí parejo, sin ruidos de taqués ni humo de escape', status: 'ok' },
  { id: 'mot-4', section: 'Motor', name: 'Estado de correas, mangueras y bornes de batería', status: 'ok' },

  // 4. Transmisión
  { id: 'tra-1', section: 'Transmisión', name: 'Acople y tacto de embrague (sin patinar)', status: 'ok' },
  { id: 'tra-2', section: 'Transmisión', name: 'Paso fluido de marchas (manual o caja automática)', status: 'ok' },
  { id: 'tra-3', section: 'Transmisión', name: 'Semiejes, fuelles y homocinéticas sin juego', status: 'ok' },

  // 5. Suspensión y dirección
  { id: 'sus-1', section: 'Suspensión y dirección', name: 'Amortiguadores y espirales (sin pérdidas ni rebotes)', status: 'ok' },
  { id: 'sus-2', section: 'Suspensión y dirección', name: 'Juego de dirección, extremos y cremallera', status: 'ok' },
  { id: 'sus-3', section: 'Suspensión y dirección', name: 'Bujes de parrilla y bieletas estabilizadoras', status: 'ok' },

  // 6. Frenos
  { id: 'fre-1', section: 'Frenos', name: 'Espesor de pastillas y estado de discos delanteros', status: 'ok' },
  { id: 'fre-2', section: 'Frenos', name: 'Tacto firme de pedal y líquido de frenos', status: 'ok' },
  { id: 'fre-3', section: 'Frenos', name: 'Freno de mano y respuesta del módulo ABS', status: 'ok' },

  // 7. Neumáticos
  { id: 'neu-1', section: 'Neumáticos', name: 'Profundidad de dibujo (> 2.5 mm parejo)', status: 'ok' },
  { id: 'neu-2', section: 'Neumáticos', name: 'Desgaste simétrico (sin problemas de alineación)', status: 'ok' },
  { id: 'neu-3', section: 'Neumáticos', name: 'Antigüedad DOT y rueda de auxilio con herramientas', status: 'ok' },

  // 8. Interior
  { id: 'int-1', section: 'Interior', name: 'Estado de tapizados, butacas y techo', status: 'observacion', isCosmetic: true, comment: 'Tapizado de tela con aureolas de humedad que requieren limpieza a vapor.' },
  { id: 'int-2', section: 'Interior', name: 'Aire acondicionado y calefacción en funcionamiento', status: 'ok' },
  { id: 'int-3', section: 'Interior', name: 'Cinturones de seguridad, anclajes y testigos de airbag', status: 'ok' },
  { id: 'int-4', section: 'Interior', name: 'Levantavidrios, espejos eléctricos y cierre centralizado', status: 'ok' },

  // 9. Electricidad
  { id: 'ele-1', section: 'Electricidad', name: 'Luces altas, bajas, señaleros y luces de freno', status: 'ok' },
  { id: 'ele-2', section: 'Electricidad', name: 'Carga de alternador y estado de batería', status: 'ok' },
  { id: 'ele-3', section: 'Electricidad', name: 'Escaneo computarizado OBD-II (sin códigos activos)', status: 'ok' },

  // 10. Prueba de manejo
  { id: 'pru-1', section: 'Prueba de manejo', name: 'Respuesta en aceleración y entrega de potencia', status: 'ok' },
  { id: 'pru-2', section: 'Prueba de manejo', name: 'Frenada en línea recta sin desviaciones', status: 'ok' },
  { id: 'pru-3', section: 'Prueba de manejo', name: 'Ausencia de vibraciones a velocidad y ruidos de rodaje', status: 'ok' }
];

export const DEFAULT_CAR_PANELS: CarPanelInspection[] = [
  { panelId: 'capot', name: 'Capot', state: 'original', thicknessMicrons: 115 },
  { panelId: 'techo', name: 'Techo', state: 'original', thicknessMicrons: 110 },
  { panelId: 'baul', name: 'Baúl / Portón', state: 'original', thicknessMicrons: 120 },
  { panelId: 'guardabarro_del_izq', name: 'Guardabarro Del. Izq.', state: 'original', thicknessMicrons: 125 },
  { panelId: 'guardabarro_del_der', name: 'Guardabarro Del. Der.', state: 'original', thicknessMicrons: 118 },
  { panelId: 'puerta_del_izq', name: 'Puerta Del. Izq.', state: 'original', thicknessMicrons: 120 },
  { panelId: 'puerta_del_der', name: 'Puerta Del. Der.', state: 'repintado', thicknessMicrons: 235, notes: 'Repintado superficial sin masilla' },
  { panelId: 'puerta_tras_izq', name: 'Puerta Tras. Izq.', state: 'original', thicknessMicrons: 115 },
  { panelId: 'puerta_tras_der', name: 'Puerta Tras. Der.', state: 'original', thicknessMicrons: 122 },
  { panelId: 'guardabarro_tras_izq', name: 'Guardabarro Tras. Izq.', state: 'original', thicknessMicrons: 118 },
  { panelId: 'guardabarro_tras_der', name: 'Guardabarro Tras. Der.', state: 'original', thicknessMicrons: 125 },
  { panelId: 'paragolpe_del', name: 'Paragolpe Delantero', state: 'original', notes: 'Pequeño raspón de estacionamiento' },
  { panelId: 'paragolpe_tras', name: 'Paragolpe Trasero', state: 'original' },
  { panelId: 'zocalo_izq', name: 'Zócalo Izquierdo', state: 'original' },
  { panelId: 'zocalo_der', name: 'Zócalo Derecho', state: 'original' }
];

export const INITIAL_INSPECTION_TARIFFS: InspectionTariffConfig = {
  prices: {
    'Chico': 3200,
    'Mediano': 3800,
    'SUV/Rural': 4400,
    'Pick-up': 5200,
    'Moto': 2200
  },
  homeVisitSurcharge: 1200,
  internalCost: 1500
};

export const INITIAL_INSPECTIONS: VehicleInspection[] = [
  {
    id: 'insp-1',
    type: 'precompra',
    token: 'tk_precompra_varela_bmw_78a',
    client_id: 'cli-2',
    client: undefined,
    vehicle_id: 'veh-1',
    vehicle_plate: 'SBX 1234',
    vehicle_info: 'BMW 320i M-Sport (2021)',
    vehicle_category: 'Mediano',
    buyer_name: 'Nicolás Varela',
    buyer_phone: '098 765 432',
    seller_name: 'Martín Cabrera',
    seller_phone: '099 111 222',
    assigned_to: 'user-diego',
    status: 'Completada',
    scheduled_at: '2026-09-23T10:00:00Z',
    completed_at: '2026-09-23T11:45:00Z',
    is_home_visit: false,
    price_amount: 3800,
    price_currency: 'UYU',
    home_visit_surcharge: 0,
    total_price: 3800,
    checklist: DEFAULT_CHECKLIST_TEMPLATE,
    panels: DEFAULT_CAR_PANELS,
    obd_codes: ['Sin códigos de falla'],
    obd_notes: 'Escáner Launch X431: ECM, TCM y ABS sin errores registrados.',
    sucive_debt: 0,
    sucive_status: 'Al día (Patente y multas canceladas)',
    mileage_declared: 45000,
    mileage_observed: 45210,
    mileage_tampered: false,
    score: 89,
    traffic_light: 'Recomendable',
    inspector_conclusion: 'Unidad en excelente estado mecánico y estructural. Mantenimientos oficiales comprobables. Presenta única repintada estética en puerta delantera derecha sin daño de chasis ni airbags disparados. Muy recomendable.',
    estimated_repair_cost: 0,
    photos: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop'
    ],
    inspector_signature: 'Diego Silva (Perito CARVLAK)',
    created_by: 'user-maxi',
    created_at: '2026-09-22T16:00:00Z',
    updated_at: '2026-09-23T11:45:00Z'
  },
  {
    id: 'insp-2',
    type: 'interna',
    token: 'tk_interna_hilux_patio_42b',
    client_id: 'cli-1',
    vehicle_id: 'veh-2',
    vehicle_plate: 'AAT 8920',
    vehicle_info: 'Toyota Hilux SRV 4x4 (2023)',
    vehicle_category: 'Pick-up',
    buyer_name: 'Automotora CARVLAK',
    buyer_phone: '099 267 964',
    seller_name: 'Estudio Jurídico Alvear',
    seller_phone: '099 123 456',
    assigned_to: 'user-jonathan',
    status: 'En curso',
    scheduled_at: `${todayIso}T14:30:00Z`,
    is_home_visit: false,
    price_amount: 1500, // Costo interno
    price_currency: 'UYU',
    home_visit_surcharge: 0,
    total_price: 1500,
    checklist: DEFAULT_CHECKLIST_TEMPLATE,
    panels: DEFAULT_CAR_PANELS,
    obd_codes: [],
    score: 94,
    traffic_light: 'Recomendable',
    inspector_conclusion: 'Peritaje en patio para toma de trade-in. Chasis intacto, 4x4 operando impecable.',
    estimated_repair_cost: 4500,
    repair_details: 'Detallado de chasis y tapizados antes de entrar a showroom.',
    automotora_decision: 'comprar',
    automotora_suggested_price: 36500,
    automotora_currency: 'USD',
    created_by: 'user-jonathan',
    created_at: '2026-09-24T12:00:00Z',
    updated_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'insp-3',
    type: 'precompra',
    token: 'tk_precompra_golf_solicitada_99c',
    client_id: 'cli-3',
    vehicle_id: 'veh-3',
    vehicle_plate: 'SCA 4321',
    vehicle_info: 'Volkswagen Golf GTI Mk7 (2018)',
    vehicle_category: 'Chico',
    buyer_name: 'Lucía Fernández',
    buyer_phone: '094 555 789',
    assigned_to: 'user-diego',
    status: 'Solicitada',
    scheduled_at: `${todayIso}T16:00:00Z`,
    is_home_visit: true,
    home_address: 'Rambla República de México 5420, Carrasco',
    price_amount: 3200,
    price_currency: 'UYU',
    home_visit_surcharge: 1200,
    total_price: 4400,
    checklist: DEFAULT_CHECKLIST_TEMPLATE,
    panels: DEFAULT_CAR_PANELS,
    obd_codes: [],
    score: 0,
    traffic_light: 'Recomendable',
    inspector_conclusion: '',
    estimated_repair_cost: 0,
    created_by: 'user-maxi',
    created_at: '2026-09-24T14:00:00Z',
    updated_at: '2026-09-24T14:00:00Z'
  }
];

// ==============================================================================
// FASE 4: AUTOMOTORA CARVLAK - MOCK DATA
// ==============================================================================

export const INITIAL_DEALERSHIP_CONFIG: DealershipConfig = {
  empresa_id: 'carvlak',
  company_name: 'Automotora CARVLAK',
  days_alert_threshold: 60,
  default_exchange_rate: 43.50,
  default_internal_inspection_cost: 1500,
  default_internal_detailing_cost: 2500,
  commission_basis: 'margin',
  default_commission_rate: 15 // 15% sobre margen o 1.5% sobre venta total
};

export const INITIAL_DEALERSHIP_VEHICLES: DealershipVehicle[] = [
  {
    id: 'dveh-1',
    empresa_id: 'carvlak',
    vehicle_id: 'veh-1',
    plate: 'SBX 1234',
    brand: 'Fiat',
    model: 'Uno Way',
    version: '1.4 EVO Way',
    year: 2014,
    mileage: 152000,
    category: 'Chico',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    status: 'publicado',
    is_featured: true,
    features: [
      'Motor Fire 1.4 EVO',
      'Aire acondicionado',
      'Dirección asistida',
      'Vidrios eléctricos delanteros',
      'Faros antiniebla camineros',
      'Barras de techo originales'
    ],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/fiat-uno-way-2014-blanco-ce4009d9f7d94168a517774703389288-1024-1024.webp',
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/whatsapp-image-2026-04-28-at-11-06-30-am-f525ee231b2f14b37b17774703274551-1024-1024.webp',
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/whatsapp-image-2026-04-28-at-11-06-33-am-1-1071a68d53a631e50917774703272053-1024-1024.webp'
    ],
    cover_image: 'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/fiat-uno-way-2014-blanco-ce4009d9f7d94168a517774703389288-1024-1024.webp',
    catalog_description: 'Excelente estado general. Unidad seleccionada con services oficiales. Cubiertas con 80% de vida útil, interior impecable y mecánica sin detalles.',
    purchase_date: '2026-09-01',
    purchase_origin: 'particular',
    supplier_name: 'Martín Cabrera',
    supplier_phone: '099 111 222',
    purchase_price: 5200,
    purchase_currency: 'USD',
    exchange_rate: 43.50,
    docs_received: {
      titulo: true,
      libreta: true,
      cedula: true,
      sucive_al_dia: true,
      multas_al_dia: true,
      llave_duplicado: true
    },
    sale_price: 6870,
    sale_currency: 'USD',
    min_acceptable_price: 6500,
    inspection_id: 'insp-1',
    inspection_cost: 1500, // $U 1.500 (~34.5 USD)
    inspection_score: 89,
    inspection_traffic_light: 'Recomendable',
    detailing_cost: 2500, // $U 2.500 (~57.5 USD)
    repairs_cost: 3200, // $U 3.200 (~73.5 USD)
    paperwork_cost: 2000, // $U 2.000 (~46 USD)
    other_expenses_cost: 0,
    total_real_cost_usd: 5411,
    estimated_margin_usd: 1459,
    estimated_margin_percent: 21.2,
    prep_checklist: {
      inspection_done: true,
      repairs_done: true,
      detailing_done: true,
      photos_done: true,
      docs_done: true
    },
    prep_assigned_to: 'user-maxi',
    is_archived: false,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'dveh-2',
    empresa_id: 'carvlak',
    vehicle_id: 'veh-2',
    plate: 'AAT 8920',
    brand: 'Faw',
    model: 'N7',
    version: '1.3 16V Extra Full',
    year: 2017,
    mileage: 89000,
    category: 'Chico',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    status: 'preparacion',
    is_featured: false,
    features: [
      'Motor 1.3 16V eficiente',
      'Aire acondicionado',
      'Doble airbag frontal',
      'Frenos ABS + EBD',
      'Llantas de aleación'
    ],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-n7-2017-blanco-6e03eba2e1b2e3c99117889646778099-1024-1024.webp',
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/20260908_172926-jpg-dadaab636ac09500e817889646924198-1024-1024.webp'
    ],
    cover_image: 'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-n7-2017-blanco-6e03eba2e1b2e3c99117889646778099-1024-1024.webp',
    catalog_description: 'Económico y espacioso. Ideal para primer auto o uso diario en ciudad. Bajo consumo comprobado.',
    purchase_date: '2026-09-18',
    purchase_origin: 'particular',
    supplier_name: 'Estudio Jurídico Alvear',
    supplier_phone: '099 123 456',
    purchase_price: 6000,
    purchase_currency: 'USD',
    exchange_rate: 43.50,
    docs_received: {
      titulo: true,
      libreta: true,
      cedula: true,
      sucive_al_dia: true,
      multas_al_dia: true,
      llave_duplicado: false
    },
    sale_price: 7500,
    sale_currency: 'USD',
    min_acceptable_price: 7200,
    inspection_cost: 1500,
    detailing_cost: 2500,
    repairs_cost: 1800,
    paperwork_cost: 0,
    other_expenses_cost: 0,
    total_real_cost_usd: 6133,
    estimated_margin_usd: 1367,
    estimated_margin_percent: 18.2,
    prep_checklist: {
      inspection_done: true,
      repairs_done: true,
      detailing_done: false, // En detailing
      photos_done: false,
      docs_done: true
    },
    prep_assigned_to: 'user-matias',
    is_archived: false,
    created_at: '2026-09-18T14:30:00Z',
    updated_at: '2026-09-24T12:00:00Z'
  },
  {
    id: 'dveh-3',
    empresa_id: 'carvlak',
    vehicle_id: 'veh-3',
    plate: 'SCA 4321',
    brand: 'Faw',
    model: 'Oley',
    version: '1.5 VCT Sedán',
    year: 2015,
    mileage: 149000,
    category: 'Mediano',
    body_type: 'Sedán',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    status: 'reservado',
    is_featured: false,
    features: [
      'Motor 1.5 VCT',
      'Gran baúl familiar',
      'Aire acondicionado',
      'Frenos ABS',
      'Vidrios en 4 puertas'
    ],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-oley-26589ebfbcbbc106a017857881393392-1024-1024.webp'
    ],
    cover_image: 'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-oley-26589ebfbcbbc106a017857881393392-1024-1024.webp',
    purchase_date: '2026-08-10',
    purchase_origin: 'concesionaria',
    purchase_price: 6300,
    purchase_currency: 'USD',
    exchange_rate: 43.50,
    docs_received: {
      titulo: true,
      libreta: true,
      cedula: true,
      sucive_al_dia: true,
      multas_al_dia: true,
      llave_duplicado: true
    },
    sale_price: 7900,
    sale_currency: 'USD',
    min_acceptable_price: 7500,
    inspection_cost: 1500,
    detailing_cost: 2500,
    repairs_cost: 0,
    paperwork_cost: 1800,
    other_expenses_cost: 0,
    total_real_cost_usd: 6433,
    estimated_margin_usd: 1467,
    estimated_margin_percent: 18.5,
    prep_checklist: {
      inspection_done: true,
      repairs_done: true,
      detailing_done: true,
      photos_done: true,
      docs_done: true
    },
    reservation: {
      amount: 500,
      currency: 'USD',
      client_name: 'Lucía Fernández',
      client_phone: '094 555 789',
      date: '2026-09-23',
      expiration_date: '2026-09-30',
      notes: 'Seña de USD 500 por transferencia Itaú. Esperando resolución de crédito bancario.'
    },
    is_archived: false,
    created_at: '2026-08-10T11:00:00Z',
    updated_at: '2026-09-23T15:00:00Z'
  },
  {
    id: 'dveh-4',
    empresa_id: 'carvlak',
    plate: 'SBZ 9988',
    brand: 'BYD',
    model: 'F0 GLX-i',
    version: '1.0 GLX-I Extra Full',
    year: 2015,
    mileage: 91000,
    category: 'Chico',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    status: 'vendido',
    is_featured: false,
    features: ['Motor 1.0 súper rendidor', 'Dirección asistida', 'Vidrios eléctricos', 'Aire acondicionado'],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/byf-f0-rojo-3b6ca2b621c5a440a417794684652785-1024-1024.webp'
    ],
    cover_image: 'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/byf-f0-rojo-3b6ca2b621c5a440a417794684652785-1024-1024.webp',
    purchase_date: '2026-08-25',
    purchase_origin: 'particular',
    purchase_price: 6400,
    purchase_currency: 'USD',
    exchange_rate: 43.50,
    docs_received: {
      titulo: true,
      libreta: true,
      cedula: true,
      sucive_al_dia: true,
      multas_al_dia: true,
      llave_duplicado: true
    },
    sale_price: 7900,
    sale_currency: 'USD',
    min_acceptable_price: 7600,
    inspection_cost: 1500,
    detailing_cost: 2500,
    repairs_cost: 0,
    paperwork_cost: 1500,
    other_expenses_cost: 0,
    total_real_cost_usd: 6526,
    estimated_margin_usd: 1274,
    estimated_margin_percent: 16.3,
    prep_checklist: {
      inspection_done: true,
      repairs_done: true,
      detailing_done: true,
      photos_done: true,
      docs_done: true
    },
    sale_record: {
      sale_date: '2026-09-22',
      buyer_name: 'Santiago Morales',
      buyer_phone: '098 333 444',
      final_price: 7800,
      currency: 'USD',
      exchange_rate: 43.50,
      payment_method: 'contado',
      seller_employee_id: 'user-diego',
      seller_employee_name: 'Diego Silva',
      seller_commission_amount: 191, // 15% sobre margen de USD 1.274
      paperwork_status: 'en_tramite',
      notes: 'Transferencia inmediata realizada ante Escribanía Bonilla.'
    },
    is_archived: false,
    created_at: '2026-08-25T09:00:00Z',
    updated_at: '2026-09-22T17:00:00Z'
  },
  {
    id: 'dveh-5',
    empresa_id: 'carvlak',
    plate: 'SAD 5566',
    brand: 'Volkswagen',
    model: 'Gol Trend',
    version: '1.6 MSI Trendline',
    year: 2019,
    mileage: 68000,
    category: 'Chico',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Gris Plata',
    status: 'evaluacion',
    is_featured: false,
    features: ['Motor 1.6 MSI', 'Doble airbag', 'Frenos ABS', 'Bluetooth', 'Computadora de abordo'],
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop'
    ],
    cover_image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop',
    catalog_description: 'Propuesta de toma en parte de pago. Pendiente peritaje técnico en patio.',
    purchase_origin: 'parte_de_pago',
    supplier_name: 'Carlos Benítez',
    supplier_phone: '099 888 777',
    purchase_price: 9800,
    purchase_currency: 'USD',
    exchange_rate: 43.50,
    docs_received: {
      titulo: true,
      libreta: true,
      cedula: true,
      sucive_al_dia: true,
      multas_al_dia: true,
      llave_duplicado: false
    },
    sale_price: 11900,
    sale_currency: 'USD',
    min_acceptable_price: 11200,
    inspection_id: 'insp-2',
    inspection_cost: 1500,
    inspection_score: 94,
    inspection_traffic_light: 'Recomendable',
    detailing_cost: 0,
    repairs_cost: 0,
    paperwork_cost: 0,
    other_expenses_cost: 0,
    total_real_cost_usd: 9834,
    estimated_margin_usd: 2066,
    estimated_margin_percent: 17.3,
    prep_checklist: {
      inspection_done: true,
      repairs_done: false,
      detailing_done: false,
      photos_done: false,
      docs_done: false
    },
    prep_assigned_to: 'user-jonathan',
    is_archived: false,
    created_at: '2026-09-24T10:00:00Z',
    updated_at: '2026-09-24T10:00:00Z'
  }
];

export const INITIAL_DEALERSHIP_INQUIRIES: DealershipInquiry[] = [
  {
    id: 'inq-1',
    empresa_id: 'carvlak',
    dealership_vehicle_id: 'dveh-1',
    vehicle_info: 'Fiat Uno Way (2014)',
    vehicle_plate: 'SBX 1234',
    client_name: 'Pablo Techera',
    client_phone: '099 444 555',
    origin: 'Catalogo web',
    status: 'Nuevo',
    notes: 'Consulta recibida desde el catálogo web: ¿Aceptan permuta por moto Honda 125 y diferencia contado?',
    assigned_to: 'user-diego',
    is_archived: false,
    created_at: '2026-09-24T12:30:00Z',
    updated_at: '2026-09-24T12:30:00Z'
  },
  {
    id: 'inq-2',
    empresa_id: 'carvlak',
    dealership_vehicle_id: 'dveh-2',
    vehicle_info: 'Faw N7 1.3 (2017)',
    vehicle_plate: 'AAT 8920',
    client_name: 'Mariana Duarte',
    client_phone: '098 777 888',
    origin: 'WhatsApp',
    status: 'Visita agendada',
    notes: 'Viene el sábado de tarde a probar el auto en Shangrilá. Busca financiación bancaria.',
    assigned_to: 'user-diego',
    appointment_id: 'app-1',
    is_archived: false,
    created_at: '2026-09-23T16:00:00Z',
    updated_at: '2026-09-24T10:00:00Z'
  },
  {
    id: 'inq-3',
    empresa_id: 'carvlak',
    dealership_vehicle_id: 'dveh-3',
    vehicle_info: 'Faw Oley 1.5 (2015)',
    vehicle_plate: 'SCA 4321',
    client_name: 'Lucía Fernández',
    client_phone: '094 555 789',
    origin: 'Instagram',
    status: 'Negociando',
    notes: 'Dejó seña de USD 500 para reservar la unidad hasta fin de mes.',
    assigned_to: 'user-maxi',
    is_archived: false,
    created_at: '2026-09-22T11:00:00Z',
    updated_at: '2026-09-23T15:00:00Z'
  }
];

// 44 autos oficiales de CARVLAK extraídos de appauto para importación instantánea
export const APPAUTO_OFFICIAL_CATALOG: Partial<DealershipVehicle>[] = [
  {
    plate: 'SBU 101',
    brand: 'Fiat',
    model: 'Uno Way',
    version: '1.4 EVO Way',
    category: 'Chico',
    year: 2014,
    mileage: 152000,
    sale_price: 6870,
    sale_currency: 'USD',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    features: ['Motor Fire 1.4 EVO', 'Aire acondicionado', 'Dirección hidráulica', 'Vidrios eléctricos delanteros', 'Faros antiniebla'],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/fiat-uno-way-2014-blanco-ce4009d9f7d94168a517774703389288-1024-1024.webp',
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/whatsapp-image-2026-04-28-at-11-06-30-am-f525ee231b2f14b37b17774703274551-1024-1024.webp'
    ]
  },
  {
    plate: 'SBU 102',
    brand: 'Faw',
    model: 'N7',
    version: '1.3 16V Extra Full',
    category: 'Chico',
    year: 2017,
    mileage: 89000,
    sale_price: 7500,
    sale_currency: 'USD',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    features: ['Motor 1.3 16V eficiente', 'Aire acondicionado', 'Doble airbag frontal', 'Frenos ABS + EBD'],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-n7-2017-blanco-6e03eba2e1b2e3c99117889646778099-1024-1024.webp'
    ]
  },
  {
    plate: 'SBU 103',
    brand: 'Faw',
    model: 'Oley',
    version: '1.5 VCT Sedán',
    category: 'Mediano',
    year: 2015,
    mileage: 149000,
    sale_price: 7900,
    sale_currency: 'USD',
    body_type: 'Sedán',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    features: ['Motor 1.5 VCT', 'Gran capacidad de baúl', 'Aire acondicionado', 'Frenos ABS'],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/faw-oley-26589ebfbcbbc106a017857881393392-1024-1024.webp'
    ]
  },
  {
    plate: 'SBU 104',
    brand: 'BYD',
    model: 'F0 GLX-i',
    version: '1.0 GLX-I Extra Full',
    category: 'Chico',
    year: 2015,
    mileage: 91000,
    sale_price: 7900,
    sale_currency: 'USD',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Blanco',
    features: ['Motor 1.0 12V muy económico', 'Aire acondicionado', 'Dirección asistida'],
    images: [
      'https://dcdn-us.mitiendanube.com/stores/006/928/264/products/byf-f0-rojo-3b6ca2b621c5a440a417794684652785-1024-1024.webp'
    ]
  },
  {
    plate: 'SBU 105',
    brand: 'Chevrolet',
    model: 'Prisma Joy',
    version: '1.0 Sedán',
    category: 'Mediano',
    year: 2018,
    mileage: 110000,
    sale_price: 11800,
    sale_currency: 'USD',
    body_type: 'Sedán',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Gris Plata',
    features: ['Motor 1.0 económico', 'Doble airbag', 'Frenos ABS', 'Gran baúl'],
    images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop']
  },
  {
    plate: 'SBU 106',
    brand: 'Volkswagen',
    model: 'Up!',
    version: '1.0 Take Up!',
    category: 'Chico',
    year: 2016,
    mileage: 95000,
    sale_price: 9900,
    sale_currency: 'USD',
    body_type: 'Hatchback',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Rojo',
    features: ['Motor 1.0 3 cilindros', '5 estrellas Latin NCAP', 'Aire acondicionado'],
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop']
  },
  {
    plate: 'SBU 107',
    brand: 'Renault',
    model: 'Duster',
    version: '1.6 Expression 4x2',
    category: 'SUV/Rural',
    year: 2017,
    mileage: 115000,
    sale_price: 13900,
    sale_currency: 'USD',
    body_type: 'SUV',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Marrón Safari',
    features: ['Excelente despeje del suelo', 'Gran espacio interior', 'Doble airbag', 'ABS'],
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop']
  },
  {
    plate: 'SBU 108',
    brand: 'Nissan',
    model: 'Versa',
    version: '1.6 Advance MT',
    category: 'Mediano',
    year: 2019,
    mileage: 72000,
    sale_price: 14500,
    sale_currency: 'USD',
    body_type: 'Sedán',
    transmission: 'Manual',
    fuel: 'Nafta',
    color_exterior: 'Gris Oscuro',
    features: ['Pantalla táctil con cámara', 'Llave inteligente', 'Control de velocidad crucero'],
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop']
  }
];

// ==============================================================================
// COMPLEMENTO 0KM: MARCAS, ÓRDENES Y FONDOS A RENDIR
// ==============================================================================

export const INITIAL_ZERO_KM_BRANDS: ZeroKmBrandConfig[] = [
  {
    id: 'brand-gm',
    brand: 'Chevrolet',
    importer_name: 'General Motors Uruguay',
    profit_scheme: 'margen',
    payment_terms_days: 15,
    contact_person: 'Gonzalo Silva (Ventas Concesionarios)',
    contact_phone: '099 112 233'
  },
  {
    id: 'brand-lestido',
    brand: 'Volkswagen',
    importer_name: 'Julio César Lestido S.A.',
    profit_scheme: 'margen',
    payment_terms_days: 20,
    contact_person: 'Federico Rivas',
    contact_phone: '099 334 455'
  },
  {
    id: 'brand-ayax',
    brand: 'Toyota',
    importer_name: 'Ayax S.A.',
    profit_scheme: 'comision_aparte',
    default_commission_type: 'percentage',
    default_commission_value: 4.5,
    payment_terms_days: 10,
    contact_person: 'Marcelo Rossi',
    contact_phone: '098 776 554'
  },
  {
    id: 'brand-byd',
    brand: 'BYD',
    importer_name: 'Sadar S.A.',
    profit_scheme: 'comision_aparte',
    default_commission_type: 'fixed_amount',
    default_commission_value: 1500,
    payment_terms_days: 15,
    contact_person: 'Alejandro Techera',
    contact_phone: '099 881 223'
  },
  {
    id: 'brand-suzuki',
    brand: 'Suzuki',
    importer_name: 'Curcio Capital',
    profit_scheme: 'margen',
    payment_terms_days: 15,
    contact_person: 'Sebastián Curcio',
    contact_phone: '099 554 332'
  },
  {
    id: 'brand-peugeot',
    brand: 'Peugeot',
    importer_name: 'Sadar S.A.',
    profit_scheme: 'margen',
    payment_terms_days: 15,
    contact_person: 'Rodrigo Varela',
    contact_phone: '099 667 889'
  }
];

export const INITIAL_ZERO_KM_ORDERS: ZeroKmOrder[] = [
  {
    id: 'ord-0km-101',
    empresa_id: 'carvlak',
    brand: 'Volkswagen',
    model: 'T-Cross',
    version: '1.0 TSI Trendline AT',
    color: 'Blanco Puro',
    year: 2026,
    client_id: 'cli-1',
    client_name: 'Martín Varela',
    client_phone: '099 444 888',
    client_email: 'mvarela@gmail.com',
    importer_name: 'Julio César Lestido S.A.',
    importer_scheme: 'margen',
    sale_price_client: 30500,
    amount_to_pay_importer: 27800,
    resulting_profit: 2700,
    client_deposit_amount: 5000,
    client_deposit_account: 'Banco Santander USD',
    client_deposit_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    client_balance_amount: 25500,
    client_balance_account: 'Banco Santander USD',
    client_balance_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    client_total_collected: 30500,
    client_payment_status: 'cobrado_total',
    importer_payment_due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), // Vence en 3 días (Aviso)
    importer_payment_status: 'pendiente',
    amount_paid_to_importer: 0,
    unit_delivery_status: 'en_transito',
    seller_id: 'user-maxi',
    seller_name: 'Maximiliano Irujo',
    seller_commission: 405, // 15% sobre margen
    notes: 'Cliente transfirió el 100% a la cuenta Santander. Unidad asignada por Lestido, pendiente pago mayorista.',
    is_archived: false,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'ord-0km-102',
    empresa_id: 'carvlak',
    brand: 'Toyota',
    model: 'Hilux',
    version: '2.4 D/C 4x4 SRV AT',
    color: 'Plata Metalizado',
    year: 2026,
    client_name: 'Agropecuaria El Ombú / Carlos Méndez',
    client_phone: '098 765 432',
    importer_name: 'Ayax S.A.',
    importer_scheme: 'comision_aparte',
    sale_price_client: 48000,
    amount_to_pay_importer: 48000,
    resulting_profit: 2160, // 4.5% de comisión
    commission_from_importer: 2160,
    commission_status_from_importer: 'pendiente',
    client_deposit_amount: 10000,
    client_deposit_account: 'Banco Itaú USD',
    client_deposit_date: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
    client_balance_amount: 38000,
    client_balance_account: 'Banco Itaú USD',
    client_balance_date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    client_total_collected: 48000,
    client_payment_status: 'cobrado_total',
    importer_payment_due_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    importer_payment_status: 'pagado_total',
    amount_paid_to_importer: 48000,
    importer_payment_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    importer_payment_account: 'Banco Itaú USD',
    unit_delivery_status: 'entregado',
    unit_delivery_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    seller_id: 'user-diego',
    seller_name: 'Diego Silva',
    seller_commission: 324,
    notes: 'Hilux entregada en salón. Pago a Ayax rendido y cancelado. Pendiente cobrar comisión de USD 2,160 a fin de mes.',
    is_archived: false,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'ord-0km-103',
    empresa_id: 'carvlak',
    brand: 'Chevrolet',
    model: 'Tracker',
    version: '1.2 Turbo Premier AT',
    color: 'Gris Carbón',
    year: 2026,
    client_name: 'Valentina Morales',
    client_phone: '091 223 344',
    importer_name: 'General Motors Uruguay',
    importer_scheme: 'margen',
    sale_price_client: 28400,
    amount_to_pay_importer: 25900,
    resulting_profit: 2500,
    client_deposit_amount: 4000,
    client_deposit_account: 'Banco Santander USD',
    client_deposit_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    client_balance_amount: 0,
    client_total_collected: 4000,
    client_payment_status: 'saldo_pendiente',
    importer_payment_due_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    importer_payment_status: 'pendiente',
    amount_paid_to_importer: 0,
    unit_delivery_status: 'en_salon_preparacion',
    seller_id: 'user-maxi',
    seller_name: 'Maximiliano Irujo',
    seller_commission: 375,
    notes: 'Seña de USD 4,000 ingresada a Santander (fondos a rendir). Saldo de USD 24,400 a cancelar contra entrega de padrón.',
    is_archived: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

export const INITIAL_ZERO_KM_CASH_MOVEMENTS: ZeroKmCashMovement[] = [
  {
    id: 'mov-0km-1',
    order_id: 'ord-0km-101',
    order_info: 'Volkswagen T-Cross 0km (Martín Varela)',
    type: 'ingreso',
    tag: 'Cobro 0km – fondos a rendir',
    amount: 5000,
    currency: 'USD',
    account: 'Banco Santander USD',
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'REC-00129',
    notes: 'Seña inicial de reserva',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'mov-0km-2',
    order_id: 'ord-0km-101',
    order_info: 'Volkswagen T-Cross 0km (Martín Varela)',
    type: 'ingreso',
    tag: 'Cobro 0km – fondos a rendir',
    amount: 25500,
    currency: 'USD',
    account: 'Banco Santander USD',
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'REC-00142',
    notes: 'Saldo total del vehículo transferido',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'mov-0km-3',
    order_id: 'ord-0km-102',
    order_info: 'Toyota Hilux 0km (Agropecuaria El Ombú)',
    type: 'ingreso',
    tag: 'Cobro 0km – fondos a rendir',
    amount: 10000,
    currency: 'USD',
    account: 'Banco Itaú USD',
    date: new Date(Date.now() - 12 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'REC-00115',
    notes: 'Seña reserva pick-up',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: 'mov-0km-4',
    order_id: 'ord-0km-102',
    order_info: 'Toyota Hilux 0km (Agropecuaria El Ombú)',
    type: 'ingreso',
    tag: 'Cobro 0km – fondos a rendir',
    amount: 38000,
    currency: 'USD',
    account: 'Banco Itaú USD',
    date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'REC-00138',
    notes: 'Cancelación saldo por transferencia bancaria',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'mov-0km-5',
    order_id: 'ord-0km-102',
    order_info: 'Toyota Hilux 0km (Pago Ayax S.A.)',
    type: 'egreso',
    tag: 'Pago a importador 0km',
    amount: 48000,
    currency: 'USD',
    account: 'Banco Itaú USD',
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'TRF-AYAX-491',
    notes: 'Transferencia total del valor mayorista de lista a Ayax S.A.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'mov-0km-6',
    order_id: 'ord-0km-103',
    order_info: 'Chevrolet Tracker 0km (Valentina Morales)',
    type: 'ingreso',
    tag: 'Cobro 0km – fondos a rendir',
    amount: 4000,
    currency: 'USD',
    account: 'Banco Santander USD',
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    receipt_number: 'REC-00140',
    notes: 'Seña reserva unidad',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];





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
  WhatsAppTemplate
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


// ==============================================================================
// CARVLAK GROUP - DATOS SEMILLA & DEMO LOCAL
// ==============================================================================

import { Profile, Client, Vehicle, Appointment, Task, VehicleHistoryEvent, ActivityLog } from '../types';

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

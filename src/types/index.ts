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
  entity_type: 'cliente' | 'vehiculo' | 'turno' | 'tarea' | 'empleado';
  entity_id?: string;
  action: 'create' | 'update' | 'archive' | 'status_change';
  details?: Record<string, any>;
  created_at: string;
}

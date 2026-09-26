import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client,
  Vehicle,
  Appointment,
  Task,
  VehicleHistoryEvent,
  ActivityLog,
  AppointmentStatus,
  TaskStatus
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_VEHICLES,
  INITIAL_APPOINTMENTS,
  INITIAL_TASKS,
  INITIAL_VEHICLE_HISTORY,
  INITIAL_ACTIVITY_LOGS
} from '../lib/mockData';
import { normalizePlate, sanitizePhoneForWhatsApp } from '../lib/formatters';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  tasks: Task[];
  vehicleHistory: VehicleHistoryEvent[];
  activityLogs: ActivityLog[];
  
  // Clientes
  addClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => { client: Client; duplicateWarning?: string };
  updateClient: (id: string, data: Partial<Client>) => void;
  archiveClient: (id: string) => void;
  checkPhoneDuplicate: (phone: string, currentClientId?: string) => Client | null;

  // Vehículos
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => { vehicle: Vehicle; error?: string };
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  archiveVehicle: (id: string) => void;
  getVehicleByPlate: (plate: string) => Vehicle | undefined;
  addVehicleHistory: (vehicleId: string, business: 'automotora' | 'detailing' | 'inspeccion', eventType: string, description: string) => void;

  // Agenda
  addAppointment: (appData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => Appointment;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  // Tareas
  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTask: (id: string, data: Partial<Task>) => void;

  // Auditoría
  logActivity: (entityType: ActivityLog['entity_type'], entityId: string, action: ActivityLog['action'], details?: Record<string, any>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();

  // Estados con carga inicial desde localStorage o seed
  const [clients, setClients] = useState<Client[]>(() => {
    const s = localStorage.getItem('carvlak_clients');
    return s ? JSON.parse(s) : INITIAL_CLIENTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const s = localStorage.getItem('carvlak_vehicles');
    return s ? JSON.parse(s) : INITIAL_VEHICLES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const s = localStorage.getItem('carvlak_appointments');
    return s ? JSON.parse(s) : INITIAL_APPOINTMENTS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const s = localStorage.getItem('carvlak_tasks');
    return s ? JSON.parse(s) : INITIAL_TASKS;
  });

  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistoryEvent[]>(() => {
    const s = localStorage.getItem('carvlak_vehicle_history');
    return s ? JSON.parse(s) : INITIAL_VEHICLE_HISTORY;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const s = localStorage.getItem('carvlak_activity_logs');
    return s ? JSON.parse(s) : INITIAL_ACTIVITY_LOGS;
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('carvlak_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('carvlak_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('carvlak_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('carvlak_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('carvlak_vehicle_history', JSON.stringify(vehicleHistory));
  }, [vehicleHistory]);

  useEffect(() => {
    localStorage.setItem('carvlak_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Si Supabase está configurado, sincronizar con la nube
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      loadSupabaseData();
    }
  }, []);

  const loadSupabaseData = async () => {
    if (!supabase) return;
    try {
      const [resClients, resVehicles, resAppts, resTasks] = await Promise.all([
        supabase.from('clients').select('*').eq('is_archived', false),
        supabase.from('vehicles').select('*').eq('is_archived', false),
        supabase.from('appointments').select('*').eq('is_archived', false),
        supabase.from('tasks').select('*')
      ]);

      if (resClients.data && resClients.data.length > 0) setClients(resClients.data as Client[]);
      if (resVehicles.data && resVehicles.data.length > 0) setVehicles(resVehicles.data as Vehicle[]);
      if (resAppts.data && resAppts.data.length > 0) setAppointments(resAppts.data as Appointment[]);
      if (resTasks.data && resTasks.data.length > 0) setTasks(resTasks.data as Task[]);
    } catch (err) {
      console.warn('Conexión con Supabase en curso...', err);
    }
  };

  // AUDITORÍA
  const logActivity = (entityType: ActivityLog['entity_type'], entityId: string, action: ActivityLog['action'], details?: Record<string, any>) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: profile?.id,
      user_name: profile?.full_name || 'Usuario',
      entity_type: entityType,
      entity_id: entityId,
      action,
      details,
      created_at: new Date().toISOString()
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('activity_logs').insert({
        user_id: profile?.id,
        entity_type: entityType,
        entity_id: entityId,
        action,
        details
      }).then();
    }
  };

  // CLIENTES & DETECCIÓN DE DUPLICADOS POR TELÉFONO
  const checkPhoneDuplicate = (phone: string, currentClientId?: string): Client | null => {
    if (!phone) return null;
    const sanitized = sanitizePhoneForWhatsApp(phone);
    const found = clients.find(
      (c) => !c.is_archived && c.id !== currentClientId && sanitizePhoneForWhatsApp(c.phone) === sanitized
    );
    return found || null;
  };

  const addClient = (data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => {
    const dup = checkPhoneDuplicate(data.phone);
    const newClient: Client = {
      ...data,
      id: `cli-${Date.now()}`,
      is_archived: false,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setClients((prev) => [newClient, ...prev]);
    logActivity('cliente', newClient.id, 'create', { name: newClient.full_name, phone: newClient.phone });

    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').insert(newClient).then();
    }

    return {
      client: newClient,
      duplicateWarning: dup ? `Atención: Ya existe un cliente con este teléfono (${dup.full_name}).` : undefined
    };
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c))
    );
    logActivity('cliente', id, 'update', data);

    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const archiveClient = (id: string) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, is_archived: true } : c)));
    logActivity('cliente', id, 'archive');

    if (isSupabaseConfigured && supabase) {
      supabase.from('clients').update({ is_archived: true }).eq('id', id).then();
    }
  };

  // VEHÍCULOS
  const getVehicleByPlate = (plate: string): Vehicle | undefined => {
    const norm = normalizePlate(plate);
    return vehicles.find((v) => !v.is_archived && normalizePlate(v.plate) === norm);
  };

  const addVehicle = (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => {
    const normalizedPlate = normalizePlate(data.plate);
    const existing = getVehicleByPlate(normalizedPlate);
    if (existing) {
      return { vehicle: existing, error: `Ya existe un vehículo registrado con la matrícula ${normalizedPlate}.` };
    }

    const newVehicle: Vehicle = {
      ...data,
      plate: normalizedPlate,
      id: `veh-${Date.now()}`,
      is_archived: false,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    logActivity('vehiculo', newVehicle.id, 'create', { plate: newVehicle.plate, model: newVehicle.model });

    // Registro inicial en historial
    addVehicleHistory(newVehicle.id, 'automotora', 'Registro Inicial', `Vehículo ${newVehicle.brand} ${newVehicle.model} registrado en CARVLAK Group.`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('vehicles').insert(newVehicle).then();
    }

    return { vehicle: newVehicle };
  };

  const updateVehicle = (id: string, data: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data, updated_at: new Date().toISOString() } : v))
    );
    logActivity('vehiculo', id, 'update', data);

    if (isSupabaseConfigured && supabase) {
      supabase.from('vehicles').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const archiveVehicle = (id: string) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, is_archived: true } : v)));
    logActivity('vehiculo', id, 'archive');

    if (isSupabaseConfigured && supabase) {
      supabase.from('vehicles').update({ is_archived: true }).eq('id', id).then();
    }
  };

  const addVehicleHistory = (vehicleId: string, business: 'automotora' | 'detailing' | 'inspeccion', eventType: string, description: string) => {
    const newEvent: VehicleHistoryEvent = {
      id: `vh-${Date.now()}`,
      vehicle_id: vehicleId,
      business,
      event_type: eventType,
      description,
      created_by: profile?.id,
      created_at: new Date().toISOString()
    };
    setVehicleHistory((prev) => [newEvent, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('vehicle_history').insert(newEvent).then();
    }
  };

  // AGENDA & TURNOS
  const addAppointment = (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Appointment => {
    const newAppt: Appointment = {
      ...data,
      id: `app-${Date.now()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAppointments((prev) => [newAppt, ...prev]);
    logActivity('turno', newAppt.id, 'create', { business: newAppt.business, time: newAppt.start_time });

    // Si tiene vehículo asignado, agregar a su historial
    if (newAppt.vehicle_id) {
      addVehicleHistory(
        newAppt.vehicle_id,
        newAppt.business,
        `Turno de ${newAppt.business.toUpperCase()}`,
        `Servicio agendado: ${newAppt.title || 'Atención en taller/showroom'}`
      );
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('appointments').insert(newAppt).then();
    }

    return newAppt;
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a))
    );
    logActivity('turno', id, 'update', data);

    if (isSupabaseConfigured && supabase) {
      supabase.from('appointments').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
  };

  // TAREAS
  const addTask = (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    logActivity('tarea', newTask.id, 'create', { title: newTask.title, business: newTask.business });

    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').insert(newTask).then();
    }

    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
    );
    logActivity('tarea', id, 'update', data);

    if (isSupabaseConfigured && supabase) {
      supabase.from('tasks').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).then();
    }
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
  };

  return (
    <DataContext.Provider
      value={{
        clients: clients.filter((c) => !c.is_archived),
        vehicles: vehicles.filter((v) => !v.is_archived),
        appointments: appointments.filter((a) => !a.is_archived),
        tasks,
        vehicleHistory,
        activityLogs,
        addClient,
        updateClient,
        archiveClient,
        checkPhoneDuplicate,
        addVehicle,
        updateVehicle,
        archiveVehicle,
        getVehicleByPlate,
        addVehicleHistory,
        addAppointment,
        updateAppointment,
        updateAppointmentStatus,
        addTask,
        updateTask,
        updateTaskStatus,
        logActivity
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

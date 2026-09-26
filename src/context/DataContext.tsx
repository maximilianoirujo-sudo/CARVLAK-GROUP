import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client,
  Vehicle,
  Appointment,
  Task,
  VehicleHistoryEvent,
  ActivityLog,
  AppointmentStatus,
  TaskStatus,
  DetailingTariff,
  DetailingTariffPrices,
  DetailingQuote,
  DetailingQuoteStatus,
  StockItem,
  StockMovement,
  Expense,
  CommissionRecord,
  WhatsAppTemplate,
  WhatsAppTemplateKey
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_VEHICLES,
  INITIAL_APPOINTMENTS,
  INITIAL_TASKS,
  INITIAL_VEHICLE_HISTORY,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DETAILING_TARIFFS,
  INITIAL_STOCK_ITEMS,
  INITIAL_EXPENSES,
  INITIAL_DETAILING_QUOTES,
  INITIAL_COMMISSIONS,
  INITIAL_WHATSAPP_TEMPLATES,
  INITIAL_PROFILES
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

  // FASE 2: DETAILING (DETAILVLAK)
  detailingTariffs: DetailingTariff[];
  updateDetailingTariff: (id: string, prices: DetailingTariffPrices, isActive?: boolean) => void;
  addDetailingTariff: (tariff: Omit<DetailingTariff, 'id'>) => DetailingTariff;

  detailingQuotes: DetailingQuote[];
  addDetailingQuote: (quoteData: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'>) => DetailingQuote;
  updateDetailingQuote: (id: string, data: Partial<DetailingQuote>) => void;
  updateDetailingQuoteStatus: (id: string, newStatus: DetailingQuoteStatus, appointmentDetails?: { date: string; assigned_to?: string }) => void;
  archiveDetailingQuote: (id: string) => void;

  stockItems: StockItem[];
  addStockItem: (itemData: Omit<StockItem, 'id' | 'updated_at' | 'movements'>) => StockItem;
  updateStockItem: (id: string, data: Partial<StockItem>) => void;
  archiveStockItem: (id: string) => void;
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>, createExpense?: boolean) => void;

  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  commissions: CommissionRecord[];
  markCommissionPaid: (id: string) => void;

  whatsappTemplates: WhatsAppTemplate[];
  updateWhatsAppTemplate: (key: WhatsAppTemplateKey, templateText: string) => void;

  importDetailVlakData: (payload: {
    leads?: any[];
    stock?: any[];
    expenses?: any[];
    commissions?: any[];
    tariffs?: any[];
  }) => {
    importedClientsCount: number;
    importedVehiclesCount: number;
    importedQuotesCount: number;
    importedStockCount: number;
    importedExpensesCount: number;
    duplicatesDetected: number;
  };
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

  // FASE 2: Estados Detailing, Stock, Gastos, Comisiones y WhatsApp
  const [detailingTariffs, setDetailingTariffs] = useState<DetailingTariff[]>(() => {
    const s = localStorage.getItem('carvlak_detailing_tariffs');
    return s ? JSON.parse(s) : INITIAL_DETAILING_TARIFFS;
  });

  const [detailingQuotes, setDetailingQuotes] = useState<DetailingQuote[]>(() => {
    const s = localStorage.getItem('carvlak_detailing_quotes');
    return s ? JSON.parse(s) : INITIAL_DETAILING_QUOTES;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const s = localStorage.getItem('carvlak_stock_items');
    return s ? JSON.parse(s) : INITIAL_STOCK_ITEMS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const s = localStorage.getItem('carvlak_expenses');
    return s ? JSON.parse(s) : INITIAL_EXPENSES;
  });

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    const s = localStorage.getItem('carvlak_commissions');
    return s ? JSON.parse(s) : INITIAL_COMMISSIONS;
  });

  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>(() => {
    const s = localStorage.getItem('carvlak_whatsapp_templates');
    return s ? JSON.parse(s) : INITIAL_WHATSAPP_TEMPLATES;
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

  useEffect(() => {
    localStorage.setItem('carvlak_detailing_tariffs', JSON.stringify(detailingTariffs));
  }, [detailingTariffs]);

  useEffect(() => {
    localStorage.setItem('carvlak_detailing_quotes', JSON.stringify(detailingQuotes));
  }, [detailingQuotes]);

  useEffect(() => {
    localStorage.setItem('carvlak_stock_items', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('carvlak_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('carvlak_commissions', JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('carvlak_whatsapp_templates', JSON.stringify(whatsappTemplates));
  }, [whatsappTemplates]);

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

  // ============================================================================
  // FASE 2: DETAILVLAK PRO IMPLEMENTACIÓN
  // ============================================================================

  // Tarifario
  const updateDetailingTariff = (id: string, prices: DetailingTariffPrices, isActive?: boolean) => {
    setDetailingTariffs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, prices, isActive: isActive !== undefined ? isActive : t.isActive } : t))
    );
    logActivity('cotizacion_detailing', id, 'update', { action: 'Actualización de tarifario' });
  };

  const addDetailingTariff = (tariffData: Omit<DetailingTariff, 'id'>): DetailingTariff => {
    const newTariff: DetailingTariff = {
      ...tariffData,
      id: `tariff-${Date.now()}`
    };
    setDetailingTariffs((prev) => [...prev, newTariff]);
    return newTariff;
  };

  // Cotizaciones / Trabajos
  const addDetailingQuote = (quoteData: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'>): DetailingQuote => {
    const newQuote: DetailingQuote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setDetailingQuotes((prev) => [newQuote, ...prev]);
    logActivity('cotizacion_detailing', newQuote.id, 'create', {
      client: newQuote.client_name,
      total: newQuote.total_amount,
      status: newQuote.status
    });
    return newQuote;
  };

  const updateDetailingQuote = (id: string, data: Partial<DetailingQuote>) => {
    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data, updated_at: new Date().toISOString() } : q))
    );
    logActivity('cotizacion_detailing', id, 'update', data);
  };

  const archiveDetailingQuote = (id: string) => {
    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_archived: true, updated_at: new Date().toISOString() } : q))
    );
    logActivity('cotizacion_detailing', id, 'archive', { is_archived: true });
  };

  const updateDetailingQuoteStatus = (
    id: string,
    newStatus: DetailingQuoteStatus,
    appointmentDetails?: { date: string; assigned_to?: string }
  ) => {
    const currentQuote = detailingQuotes.find((q) => q.id === id);
    if (!currentQuote) return;

    const updatedFields: Partial<DetailingQuote> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // 1. Al pasar a "Turno Confirmado" -> Crear turno en Agenda Unificada
    if (newStatus === 'Turno Confirmado') {
      const apptDate = appointmentDetails?.date || currentQuote.appointment_date || new Date().toISOString();
      const assignedEmployeeId = appointmentDetails?.assigned_to || currentQuote.assigned_to || profile?.id;
      
      const newAppt = addAppointment({
        business: 'detailing',
        client_id: currentQuote.client_id,
        vehicle_id: currentQuote.vehicle_id,
        assigned_to: assignedEmployeeId,
        start_time: apptDate,
        duration_minutes: 180,
        status: 'Confirmado',
        title: `Detailing: ${currentQuote.selected_services.map((s) => s.serviceName).join(' + ') || 'Servicios Varios'}`,
        notes: `Origen: ${currentQuote.origin}. Zonas a priorizar: ${currentQuote.priority_zones || 'Estándar'}. ${currentQuote.notes || ''}`,
        price_amount: currentQuote.total_amount,
        price_currency: 'UYU'
      });

      updatedFields.appointment_id = newAppt.id;
      updatedFields.appointment_date = apptDate;
      if (assignedEmployeeId) updatedFields.assigned_to = assignedEmployeeId;
    }

    // 2. Al pasar a "Trabajo Completado" -> Historial y Liquidación de Comisión
    if (newStatus === 'Trabajo Completado') {
      // Historial en Vehículo
      if (currentQuote.vehicle_id) {
        addVehicleHistory(
          currentQuote.vehicle_id,
          'detailing',
          'Trabajo de Detailing Completado',
          `Servicios realizados: ${currentQuote.selected_services.map((s) => s.serviceName).join(', ')}. Monto cobrado: $U ${currentQuote.total_amount.toLocaleString('es-UY')}`
        );
      }

      // Generar comisión para el empleado asignado (usando la tasa configurada en Fase 1)
      const employeeId = currentQuote.assigned_to || profile?.id;
      const employee = INITIAL_PROFILES.find((p) => p.id === employeeId) || profile;
      const rate = employee?.commissions?.detailing ?? (employeeId === 'user-maxi' ? 30 : 0);

      if (rate > 0) {
        const commAmount = Math.round(currentQuote.total_amount * (rate / 100));
        const newComm: CommissionRecord = {
          id: `comm-${Date.now()}`,
          business: 'detailing',
          employee_id: employeeId || 'user-maxi',
          employee_name: employee?.full_name || 'Maximiliano Irujo',
          quote_id: currentQuote.id,
          client_name: currentQuote.client_name,
          vehicle_description: `${currentQuote.vehicle_info}${currentQuote.vehicle_plate ? ` (${currentQuote.vehicle_plate})` : ''}`,
          amount_charged: currentQuote.total_amount,
          commission_rate: rate,
          commission_amount: commAmount,
          status: 'Pendiente',
          created_at: new Date().toISOString()
        };
        setCommissions((prev) => [...prev.filter((c) => c.quote_id !== currentQuote.id), newComm]);
      }
    } else if (currentQuote.status === 'Trabajo Completado') {
      // Si el trabajo vuelve atrás o se cancela, se elimina la comisión generada
      setCommissions((prev) => prev.filter((c) => c.quote_id !== currentQuote.id));
    }

    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updatedFields } : q))
    );
    logActivity('cotizacion_detailing', id, 'status_change', { from: currentQuote.status, to: newStatus });
  };

  // Stock Genérico
  const addStockItem = (itemData: Omit<StockItem, 'id' | 'updated_at' | 'movements'>): StockItem => {
    const newItem: StockItem = {
      ...itemData,
      id: `stk-${Date.now()}`,
      movements: [],
      updated_at: new Date().toISOString()
    };
    setStockItems((prev) => [newItem, ...prev]);
    logActivity('stock', newItem.id, 'create', { name: newItem.name, qty: newItem.quantity });
    return newItem;
  };

  const updateStockItem = (id: string, data: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s))
    );
    logActivity('stock', id, 'update', data);
  };

  const archiveStockItem = (id: string) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_archived: true, updated_at: new Date().toISOString() } : s))
    );
    logActivity('stock', id, 'archive', { is_archived: true });
  };

  const recordStockMovement = (movement: Omit<StockMovement, 'id' | 'created_at'>, createExpense = false) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== movement.stock_item_id) return item;
        const delta = movement.type === 'Entrada' ? movement.quantity : -movement.quantity;
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          movements: [newMovement, ...(item.movements || [])],
          updated_at: new Date().toISOString()
        };
      })
    );

    // Registro opcional como gasto al reponer stock
    if (createExpense && movement.type === 'Entrada' && movement.unit_cost && movement.unit_cost > 0) {
      const item = stockItems.find((s) => s.id === movement.stock_item_id);
      const totalCost = Math.round(movement.unit_cost * movement.quantity);
      addExpense({
        business: item?.business || 'detailing',
        date: new Date().toISOString().slice(0, 10),
        amount: totalCost,
        currency: 'UYU',
        category: 'Insumos',
        payment_method: 'Transferencia',
        description: `Reposición stock: ${movement.quantity} ${item?.unit || 'un.'} de ${item?.name || 'Insumo'} (${movement.operator_name})`
      });
    }

    logActivity('stock', movement.stock_item_id, 'update', {
      type: movement.type,
      quantity: movement.quantity,
      operator: movement.operator_name
    });
  };

  // Gastos Genéricos
  const addExpense = (expenseData: Omit<Expense, 'id' | 'created_at'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString()
    };
    setExpenses((prev) => [newExpense, ...prev]);
    logActivity('gasto', newExpense.id, 'create', { amount: newExpense.amount, category: newExpense.category });
    return newExpense;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
    logActivity('gasto', id, 'update', data);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('gasto', id, 'archive', { deleted: true });
  };

  // Comisiones
  const markCommissionPaid = (id: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Pagada', paid_at: new Date().toISOString() } : c))
    );
  };

  // Plantillas WhatsApp
  const updateWhatsAppTemplate = (key: WhatsAppTemplateKey, templateText: string) => {
    setWhatsappTemplates((prev) =>
      prev.map((t) => (t.key === key ? { ...t, template: templateText } : t))
    );
  };

  // Migración desde DetailVlak
  const importDetailVlakData = (payload: {
    leads?: any[];
    stock?: any[];
    expenses?: any[];
    commissions?: any[];
    tariffs?: any[];
  }) => {
    let importedClientsCount = 0;
    let importedVehiclesCount = 0;
    let importedQuotesCount = 0;
    let importedStockCount = 0;
    let importedExpensesCount = 0;
    let duplicatesDetected = 0;

    // Leads / Cotizaciones
    if (Array.isArray(payload.leads)) {
      payload.leads.forEach((l) => {
        if (!l.name && !l.phone && !l.vehicle) return;
        const cleanPhone = sanitizePhoneForWhatsApp(l.phone || '');
        let existingClient = clients.find((c) => sanitizePhoneForWhatsApp(c.phone) === cleanPhone);
        
        let clientId = existingClient?.id;
        if (!existingClient && l.name) {
          const newC = addClient({
            full_name: l.name,
            phone: l.phone || '',
            origin: (l.source === 'Google Forms' ? 'Google Form' : l.source || 'WhatsApp') as any,
            notes: l.notes || 'Importado de DetailVlak'
          });
          existingClient = newC.client;
          clientId = newC.client.id;
          importedClientsCount++;
        } else if (existingClient) {
          duplicatesDetected++;
        }

        // Vehículo
        let vehicleId = undefined;
        if (l.vehicle) {
          const plateCandidate = normalizePlate(l.plate || '');
          const existingVeh = plateCandidate ? vehicles.find((v) => normalizePlate(v.plate) === plateCandidate) : undefined;
          if (existingVeh) {
            vehicleId = existingVeh.id;
          } else {
            const newVehRes = addVehicle({
              brand: l.vehicle.split(' ')[0] || 'Vehículo',
              model: l.vehicle.split(' ').slice(1).join(' ') || 'Detailing',
              plate: plateCandidate || `UY-${Math.floor(1000 + Math.random() * 9000)}`,
              category: (l.category === 'pickup' ? 'Pick-up' : l.category === 'suv' ? 'SUV/Rural' : l.category === 'mediano' ? 'Mediano' : l.category === 'moto' ? 'Moto' : 'Chico'),
              ownership: 'client',
              client_id: clientId,
              photos: []
            });
            vehicleId = newVehRes.vehicle.id;
            importedVehiclesCount++;
          }
        }

        // Cotización
        const quoteStatus: DetailingQuoteStatus = 
          l.status === 'COMPLETADO' ? 'Trabajo Completado' :
          l.status === 'TURNO' ? 'Turno Confirmado' :
          l.status === 'COTIZADO' ? 'Presupuesto Enviado' : 'Por Cotizar';

        const newQuote: DetailingQuote = {
          id: `quote-mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          client_id: clientId || 'cli-anon',
          client_name: l.name || 'Cliente Importado',
          client_phone: l.phone || '',
          vehicle_id: vehicleId,
          vehicle_info: l.vehicle || 'Vehículo',
          vehicle_category: (l.category === 'pickup' ? 'Pick-up' : l.category === 'suv' ? 'SUV/Rural' : l.category === 'mediano' ? 'Mediano' : l.category === 'moto' ? 'Moto' : 'Chico'),
          selected_services: Array.isArray(l.quotedServices) ? l.quotedServices.map((sid: string) => ({
            serviceId: sid,
            serviceName: sid,
            price: 0
          })) : [],
          subtotal: l.quotedTotal || 0,
          discount_type: 'none',
          discount_amount: 0,
          extreme_dirt_surcharge: 0,
          total_amount: l.quotedTotal || 0,
          origin: (l.source || 'WhatsApp') as any,
          notes: l.notes || '',
          status: quoteStatus,
          created_at: l.timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setDetailingQuotes((prev) => [newQuote, ...prev]);
        importedQuotesCount++;
      });
    }

    // Stock
    if (Array.isArray(payload.stock)) {
      payload.stock.forEach((s) => {
        if (!s.name) return;
        const exists = stockItems.some((item) => item.name.toLowerCase() === s.name.toLowerCase());
        if (exists) {
          duplicatesDetected++;
        } else {
          addStockItem({
            business: 'detailing',
            name: s.name,
            category: s.category || 'Químicos',
            unit: s.unit || 'unidades',
            quantity: Number(s.quantity) || 0,
            min_stock: Number(s.minStock) || 2,
            unit_cost: Number(s.unitCost) || 0,
            supplier: s.supplier || 'DetailVlak'
          });
          importedStockCount++;
        }
      });
    }

    // Gastos
    if (Array.isArray(payload.expenses)) {
      payload.expenses.forEach((e) => {
        if (!e.amount) return;
        addExpense({
          business: 'detailing',
          date: e.date || new Date().toISOString().slice(0, 10),
          amount: Number(e.amount) || 0,
          currency: 'UYU',
          category: (e.category || 'Varios') as any,
          payment_method: (e.paymentMethod || 'Efectivo') as any,
          description: e.description || 'Gasto importado DetailVlak'
        });
        importedExpensesCount++;
      });
    }

    return {
      importedClientsCount,
      importedVehiclesCount,
      importedQuotesCount,
      importedStockCount,
      importedExpensesCount,
      duplicatesDetected
    };
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
        logActivity,

        // Detailing
        detailingTariffs,
        updateDetailingTariff,
        addDetailingTariff,
        detailingQuotes: detailingQuotes.filter((q) => !q.is_archived),
        addDetailingQuote,
        updateDetailingQuote,
        updateDetailingQuoteStatus,
        archiveDetailingQuote,
        stockItems: stockItems.filter((s) => !s.is_archived),
        addStockItem,
        updateStockItem,
        archiveStockItem,
        recordStockMovement,
        expenses: expenses.filter((e) => !e.is_archived),
        addExpense,
        updateExpense,
        deleteExpense,
        commissions,
        markCommissionPaid,
        whatsappTemplates,
        updateWhatsAppTemplate,
        importDetailVlakData
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

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  WhatsAppTemplateKey,
  VehicleInspection,
  InspectionTariffConfig,
  InspectionStatus,
  InspectionTrafficLight,
  InspectionChecklistItem,
  CarPanelInspection,
  Role,
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipVehicleHistoryEntry,
  DealershipInquiry,
  DealershipInquiryStatus,
  DealershipConfig,
  SocialMediaConfig,
  SocialMediaPostRecord
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
  INITIAL_PROFILES,
  INITIAL_INSPECTIONS,
  INITIAL_INSPECTION_TARIFFS,
  DEFAULT_CHECKLIST_TEMPLATE,
  DEFAULT_CAR_PANELS,
  INITIAL_DEALERSHIP_CONFIG,
  INITIAL_DEALERSHIP_VEHICLES,
  INITIAL_DEALERSHIP_INQUIRIES,
  APPAUTO_OFFICIAL_CATALOG,
  INITIAL_SOCIAL_MEDIA_CONFIG,
  INITIAL_SOCIAL_MEDIA_POSTS
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

  // FASE 3: INSPECCIÓN VEHICULAR (PERITAJE)
  inspections: VehicleInspection[];
  inspectionTariffs: InspectionTariffConfig;
  addInspection: (
    data: Omit<VehicleInspection, 'id' | 'created_at' | 'updated_at' | 'token' | 'checklist' | 'panels'> & {
      token?: string;
      checklist?: InspectionChecklistItem[];
      panels?: CarPanelInspection[];
    }
  ) => VehicleInspection;
  updateInspection: (id: string, data: Partial<VehicleInspection>) => void;
  updateInspectionStatus: (id: string, newStatus: InspectionStatus, appointmentDetails?: { date: string; assigned_to?: string }) => void;
  archiveInspection: (id: string) => void;
  updateInspectionTariffs: (tariffs: Partial<InspectionTariffConfig>) => void;
  getInspectionByToken: (token: string) => VehicleInspection | undefined;
  createDetailingQuoteFromInspection: (inspectionId: string) => string | null;

  // FASE 4: AUTOMOTORA CARVLAK
  dealershipVehicles: DealershipVehicle[];
  dealershipInquiries: DealershipInquiry[];
  dealershipConfig: DealershipConfig;
  canEditDealershipStock: (userRoles?: Role[]) => boolean;
  addDealershipVehicle: (data: Omit<DealershipVehicle, 'id' | 'created_at' | 'updated_at' | 'total_real_cost_usd' | 'estimated_margin_usd' | 'estimated_margin_percent'>) => DealershipVehicle;
  updateDealershipVehicle: (id: string, data: Partial<DealershipVehicle>) => void;
  duplicateDealershipVehicle: (id: string) => DealershipVehicle | null;
  bulkUpdateDealershipVehicles: (ids: string[], updates: Partial<DealershipVehicle>) => void;
  bulkAdjustVehiclePrices: (ids: string[], adjustmentType: 'percent' | 'fixed', amount: number) => void;
  updateDealershipVehicleStatus: (id: string, newStatus: DealershipVehicleStatus, extraData?: Record<string, any>) => void;
  archiveDealershipVehicle: (id: string) => void;
  addDealershipInquiry: (data: Omit<DealershipInquiry, 'id' | 'created_at' | 'updated_at'>) => DealershipInquiry;
  updateDealershipInquiry: (id: string, data: Partial<DealershipInquiry>) => void;
  updateDealershipInquiryStatus: (id: string, newStatus: DealershipInquiryStatus, appointmentDetails?: { date: string; assigned_to?: string; title?: string }) => void;
  archiveDealershipInquiry: (id: string) => void;
  updateDealershipConfig: (config: Partial<DealershipConfig>) => void;
  importAppAutoCatalog: () => { importedCount: number; duplicatesCount: number };
  importTiendanubeCatalog: () => { importedCount: number; duplicatesCount: number };
  createPosventaDetailingQuote: (dealershipVehicleId: string, buyerName?: string, buyerPhone?: string) => string | null;

  // FASE 5: REDES SOCIALES & MARKETING STUDIO
  socialMediaPosts: SocialMediaPostRecord[];
  socialMediaConfig: SocialMediaConfig;
  addSocialMediaPost: (data: Omit<SocialMediaPostRecord, 'id' | 'created_at' | 'created_by'>) => SocialMediaPostRecord;
  updateSocialMediaPost: (id: string, data: Partial<SocialMediaPostRecord>) => void;
  deleteSocialMediaPost: (id: string) => void;
  updateSocialMediaConfig: (config: Partial<SocialMediaConfig>) => void;
  updateClientConsent: (clientId: string, consent: boolean) => void;
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

  // FASE 3: Estados Inspecciones Vehiculares (Peritaje)
  const [inspections, setInspections] = useState<VehicleInspection[]>(() => {
    const s = localStorage.getItem('carvlak_inspections');
    return s ? JSON.parse(s) : INITIAL_INSPECTIONS;
  });

  const [inspectionTariffs, setInspectionTariffs] = useState<InspectionTariffConfig>(() => {
    const s = localStorage.getItem('carvlak_inspection_tariffs');
    return s ? JSON.parse(s) : INITIAL_INSPECTION_TARIFFS;
  });

  // FASE 4: Estados Automotora CARVLAK
  const [dealershipVehicles, setDealershipVehicles] = useState<DealershipVehicle[]>(() => {
    const s = localStorage.getItem('carvlak_dealership_vehicles_v3');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length >= 40) return parsed;
      } catch (e) {}
    }
    return INITIAL_DEALERSHIP_VEHICLES;
  });

  const [dealershipInquiries, setDealershipInquiries] = useState<DealershipInquiry[]>(() => {
    const s = localStorage.getItem('carvlak_dealership_inquiries');
    return s ? JSON.parse(s) : INITIAL_DEALERSHIP_INQUIRIES;
  });

  const [dealershipConfig, setDealershipConfig] = useState<DealershipConfig>(() => {
    const s = localStorage.getItem('carvlak_dealership_config');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        return { ...INITIAL_DEALERSHIP_CONFIG, ...parsed };
      } catch {
        return INITIAL_DEALERSHIP_CONFIG;
      }
    }
    return INITIAL_DEALERSHIP_CONFIG;
  });

  // FASE 5: Estados Redes Sociales & Marketing Studio
  const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPostRecord[]>(() => {
    const s = localStorage.getItem('carvlak_social_media_posts');
    if (s) {
      try {
        return JSON.parse(s);
      } catch (e) {}
    }
    return INITIAL_SOCIAL_MEDIA_POSTS;
  });

  const [socialMediaConfig, setSocialMediaConfig] = useState<SocialMediaConfig>(() => {
    const s = localStorage.getItem('carvlak_social_media_config');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        return {
          ...INITIAL_SOCIAL_MEDIA_CONFIG,
          ...parsed,
          templates: { ...INITIAL_SOCIAL_MEDIA_CONFIG.templates, ...(parsed.templates || {}) }
        };
      } catch (e) {}
    }
    return INITIAL_SOCIAL_MEDIA_CONFIG;
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

  useEffect(() => {
    localStorage.setItem('carvlak_inspections', JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem('carvlak_inspection_tariffs', JSON.stringify(inspectionTariffs));
  }, [inspectionTariffs]);

  useEffect(() => {
    localStorage.setItem('carvlak_dealership_vehicles_v3', JSON.stringify(dealershipVehicles));
    localStorage.setItem('carvlak_dealership_vehicles', JSON.stringify(dealershipVehicles));
  }, [dealershipVehicles]);

  useEffect(() => {
    localStorage.setItem('carvlak_dealership_inquiries', JSON.stringify(dealershipInquiries));
  }, [dealershipInquiries]);

  useEffect(() => {
    localStorage.setItem('carvlak_dealership_config', JSON.stringify(dealershipConfig));
  }, [dealershipConfig]);

  useEffect(() => {
    localStorage.setItem('carvlak_social_media_posts', JSON.stringify(socialMediaPosts));
  }, [socialMediaPosts]);

  useEffect(() => {
    localStorage.setItem('carvlak_social_media_config', JSON.stringify(socialMediaConfig));
  }, [socialMediaConfig]);

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

  // Helper para cálculo automático de puntaje y semáforo
  const calculateScoreAndTraffic = (
    checklist: InspectionChecklistItem[],
    panels: CarPanelInspection[]
  ): { score: number; traffic_light: InspectionTrafficLight } => {
    let score = 100;
    let hasCriticalFail = false;

    checklist.forEach((item) => {
      if (item.status === 'falla') {
        if (item.isCritical) {
          score -= 15;
          hasCriticalFail = true;
        } else {
          score -= 6;
        }
      } else if (item.status === 'observacion') {
        score -= 2.5;
      }
    });

    panels.forEach((p) => {
      if (p.state === 'repintado') score -= 2;
      else if (p.state === 'masillado') score -= 4;
      else if (p.state === 'danado') score -= 5;
    });

    score = Math.max(0, Math.min(100, Math.round(score)));
    let traffic_light: InspectionTrafficLight = 'Recomendable';
    if (score < 65 || hasCriticalFail) {
      traffic_light = 'No recomendable';
    } else if (score < 85) {
      traffic_light = 'Con reparos';
    }
    return { score, traffic_light };
  };

  // FASE 3: INSPECCIONES
  const addInspection = (
    data: Omit<VehicleInspection, 'id' | 'created_at' | 'updated_at' | 'token' | 'checklist' | 'panels'> & {
      token?: string;
      checklist?: InspectionChecklistItem[];
      panels?: CarPanelInspection[];
    }
  ): VehicleInspection => {
    const generatedToken = data.token || `tk_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const initialChecklist = data.checklist && data.checklist.length > 0
      ? data.checklist
      : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_TEMPLATE));
    const initialPanels = data.panels && data.panels.length > 0
      ? data.panels
      : JSON.parse(JSON.stringify(DEFAULT_CAR_PANELS));

    const { score, traffic_light } = calculateScoreAndTraffic(initialChecklist, initialPanels);

    const newInsp: VehicleInspection = {
      ...data,
      id: `insp-${Date.now()}`,
      token: generatedToken,
      checklist: initialChecklist,
      panels: initialPanels,
      score: data.score !== undefined && data.score > 0 ? data.score : score,
      traffic_light: data.traffic_light || traffic_light,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setInspections((prev) => [newInsp, ...prev]);
    logActivity('inspeccion', newInsp.id, 'create', {
      type: newInsp.type,
      plate: newInsp.vehicle_plate,
      status: newInsp.status,
      total_price: newInsp.total_price
    });
    return newInsp;
  };

  const updateInspection = (id: string, data: Partial<VehicleInspection>) => {
    setInspections((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...data, updated_at: new Date().toISOString() };
        if ((data.checklist || data.panels) && data.score === undefined) {
          const calc = calculateScoreAndTraffic(updated.checklist, updated.panels);
          updated.score = calc.score;
          if (!data.traffic_light) {
            updated.traffic_light = calc.traffic_light;
          }
        }
        return updated;
      })
    );
    logActivity('inspeccion', id, 'update', { updatedKeys: Object.keys(data) });
  };

  const updateInspectionStatus = (
    id: string,
    newStatus: InspectionStatus,
    appointmentDetails?: { date: string; assigned_to?: string }
  ) => {
    const current = inspections.find((i) => i.id === id);
    if (!current) return;

    const updatedFields: Partial<VehicleInspection> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // 1. Al pasar a 'Agendada' -> crear turno en Agenda Unificada
    if (newStatus === 'Agendada') {
      const apptDate = appointmentDetails?.date || current.scheduled_at || new Date().toISOString();
      const inspectorId = appointmentDetails?.assigned_to || current.assigned_to || profile?.id;

      addAppointment({
        business: 'inspeccion',
        client_id: current.client_id,
        vehicle_id: current.vehicle_id,
        assigned_to: inspectorId,
        start_time: apptDate,
        duration_minutes: 120,
        status: 'Confirmado',
        title: `Peritaje: ${current.vehicle_info || current.vehicle_plate} (${current.type === 'precompra' ? 'Precompra' : 'Interna'})`,
        notes: `Ubicación: ${current.is_home_visit ? `A domicilio: ${current.home_address || ''}` : 'Taller Shangrilá'}. ${current.inspector_conclusion || ''}`,
        price_amount: current.total_price,
        price_currency: current.price_currency
      });

      updatedFields.scheduled_at = apptDate;
      if (inspectorId) updatedFields.assigned_to = inspectorId;
    }

    // 2. Al pasar a 'Completada' -> Registro en historial de vehículo y comisión para inspector
    if (newStatus === 'Completada') {
      updatedFields.completed_at = new Date().toISOString();

      if (current.vehicle_id) {
        addVehicleHistory(
          current.vehicle_id,
          'inspeccion',
          'Peritaje Vehicular Completado',
          `Tipo: ${current.type === 'precompra' ? 'Precompra' : 'Interna CARVLAK'}. Puntaje: ${current.score}/100 (${current.traffic_light}). ${current.automotora_decision ? `Dictamen compra: ${current.automotora_decision.toUpperCase()}` : ''}`
        );
      }

      if (current.type === 'precompra' && current.total_price > 0) {
        const inspectorId = current.assigned_to || profile?.id;
        const inspectorProfile = INITIAL_PROFILES.find((p) => p.id === inspectorId) || profile;
        const rate = inspectorProfile?.commissions?.inspeccion ?? (inspectorId === 'user-diego' ? 15 : 0);

        if (rate > 0) {
          const commAmount = Math.round(current.total_price * (rate / 100));
          const newComm: CommissionRecord = {
            id: `comm-insp-${Date.now()}`,
            business: 'inspeccion',
            employee_id: inspectorId || 'user-diego',
            employee_name: inspectorProfile?.full_name || 'Inspector Peritaje',
            quote_id: current.id,
            client_name: current.buyer_name || 'Cliente Inspección',
            vehicle_description: `${current.vehicle_info} (${current.vehicle_plate})`,
            amount_charged: current.total_price,
            commission_rate: rate,
            commission_amount: commAmount,
            status: 'Pendiente',
            created_at: new Date().toISOString()
          };
          setCommissions((prev) => [...prev.filter((c) => c.quote_id !== current.id), newComm]);
        }
      }
    } else if (current.status === 'Completada') {
      setCommissions((prev) => prev.filter((c) => c.quote_id !== current.id));
    }

    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updatedFields } : i))
    );
    logActivity('inspeccion', id, 'status_change', { from: current.status, to: newStatus });
  };

  const archiveInspection = (id: string) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_archived: true, updated_at: new Date().toISOString() } : i))
    );
    logActivity('inspeccion', id, 'archive', { is_archived: true });
  };

  const updateInspectionTariffs = (newTariffs: Partial<InspectionTariffConfig>) => {
    setInspectionTariffs((prev) => ({
      ...prev,
      ...newTariffs,
      prices: {
        ...prev.prices,
        ...(newTariffs.prices || {})
      }
    }));
    logActivity('inspeccion', 'tariffs', 'update', newTariffs);
  };

  const getInspectionByToken = (token: string): VehicleInspection | undefined => {
    return inspections.find((i) => i.token === token && !i.is_archived);
  };

  const createDetailingQuoteFromInspection = (inspectionId: string): string | null => {
    const inspection = inspections.find((i) => i.id === inspectionId);
    if (!inspection) return null;

    if (inspection.detailing_quote_id) {
      return inspection.detailing_quote_id;
    }

    const suggestedServices: { serviceId: string; serviceName: string; price: number }[] = [];
    const cat = inspection.vehicle_category || 'Mediano';

    const hasPaintIssue = inspection.panels.some((p) => p.state === 'repintado' || p.state === 'masillado' || p.state === 'danado')
      || inspection.checklist.some((c) => c.section === 'Carrocería y pintura' && (c.status === 'observacion' || c.status === 'falla'));
    
    const hasInteriorIssue = inspection.checklist.some((c) => c.section === 'Interior' && (c.status === 'observacion' || c.status === 'falla'));

    const hasOpticsIssue = inspection.checklist.some((c) => (c.name.toLowerCase().includes('óptica') || c.name.toLowerCase().includes('faros')) && (c.status === 'observacion' || c.status === 'falla'));

    if (hasPaintIssue) {
      const t = detailingTariffs.find((tar) => tar.id === 'ceramico' || tar.id === 'pulido');
      if (t) {
        suggestedServices.push({
          serviceId: t.id,
          serviceName: t.name,
          price: t.prices[cat] || 8500
        });
      }
    }

    if (hasInteriorIssue) {
      const t = detailingTariffs.find((tar) => tar.id === 'interior');
      if (t) {
        suggestedServices.push({
          serviceId: t.id,
          serviceName: t.name,
          price: t.prices[cat] || 4200
        });
      }
    }

    if (hasOpticsIssue) {
      const t = detailingTariffs.find((tar) => tar.id === 'opticas');
      if (t) {
        suggestedServices.push({
          serviceId: t.id,
          serviceName: t.name,
          price: t.prices[cat] || 2500
        });
      }
    }

    if (suggestedServices.length === 0) {
      const t1 = detailingTariffs.find((tar) => tar.id === 'ceramico');
      const t2 = detailingTariffs.find((tar) => tar.id === 'interior');
      if (t1) suggestedServices.push({ serviceId: t1.id, serviceName: t1.name, price: t1.prices[cat] || 8500 });
      if (t2) suggestedServices.push({ serviceId: t2.id, serviceName: t2.name, price: t2.prices[cat] || 4200 });
    }

    const subtotal = suggestedServices.reduce((sum, s) => sum + s.price, 0);
    const discountAmount = Math.round(subtotal * 0.1);
    const totalAmount = subtotal - discountAmount;

    const newQuote = addDetailingQuote({
      client_id: inspection.client_id,
      vehicle_id: inspection.vehicle_id,
      client_name: inspection.buyer_name || inspection.client?.full_name || 'Cliente CARVLAK',
      client_phone: inspection.buyer_phone || inspection.client?.phone || '',
      vehicle_info: inspection.vehicle_info,
      vehicle_plate: inspection.vehicle_plate,
      vehicle_category: inspection.vehicle_category,
      selected_services: suggestedServices,
      subtotal,
      discount_type: 'combo_10',
      discount_amount: discountAmount,
      extreme_dirt_surcharge: 0,
      total_amount: totalAmount,
      estimated_time: '1 a 2 días',
      assigned_to: profile?.id || 'user-maxi',
      origin: 'Presencial',
      notes: `Generado automáticamente desde Peritaje #${inspection.id}. Hallazgos estéticos derivados para embellecimiento.`,
      priority_zones: 'Zonas observadas en peritaje técnico',
      status: 'Por Cotizar'
    });

    updateInspection(inspection.id, { detailing_quote_id: newQuote.id });

    logActivity('inspeccion', inspection.id, 'update', {
      action: 'Cross-selling Detailing generado',
      quote_id: newQuote.id
    });

    return newQuote.id;
  };

  // ============================================================================
  // FASE 4: AUTOMOTORA CARVLAK
  // ============================================================================

  // Helper de cálculo de costo real y margen
  const calculateVehicleFinancials = (
    v: Partial<DealershipVehicle>,
    cfg: DealershipConfig = dealershipConfig
  ) => {
    const rate = v.exchange_rate || cfg.default_exchange_rate || 43.50;

    const purchaseUsd = v.purchase_currency === 'USD'
      ? (v.purchase_price || 0)
      : Math.round(((v.purchase_price || 0) / rate) * 100) / 100;

    const internalCostsUyu =
      (v.inspection_cost || 0) +
      (v.detailing_cost || 0) +
      (v.repairs_cost || 0) +
      (v.paperwork_cost || 0) +
      (v.other_expenses_cost || 0);

    const internalCostsUsd = Math.round((internalCostsUyu / rate) * 100) / 100;
    const totalRealCostUsd = Math.round((purchaseUsd + internalCostsUsd) * 100) / 100;

    const saleUsd = v.sale_currency === 'USD'
      ? (v.sale_price || 0)
      : Math.round(((v.sale_price || 0) / rate) * 100) / 100;

    const estimatedMarginUsd = Math.round((saleUsd - totalRealCostUsd) * 100) / 100;
    const estimatedMarginPercent = saleUsd > 0
      ? Math.round((estimatedMarginUsd / saleUsd) * 1000) / 10
      : 0;

    return { totalRealCostUsd, estimatedMarginUsd, estimatedMarginPercent };
  };

  const addDealershipVehicle = (
    data: Omit<DealershipVehicle, 'id' | 'created_at' | 'updated_at' | 'total_real_cost_usd' | 'estimated_margin_usd' | 'estimated_margin_percent'>
  ): DealershipVehicle => {
    const financials = calculateVehicleFinancials(data);

    const newVehicle: DealershipVehicle = {
      ...data,
      id: `dveh-${Date.now()}`,
      empresa_id: data.empresa_id || 'carvlak',
      status: data.status || 'evaluacion',
      total_real_cost_usd: financials.totalRealCostUsd,
      estimated_margin_usd: financials.estimatedMarginUsd,
      estimated_margin_percent: financials.estimatedMarginPercent,
      prep_checklist: data.prep_checklist || {
        inspection_done: false,
        repairs_done: false,
        detailing_done: false,
        photos_done: false,
        docs_done: false
      },
      is_archived: false,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setDealershipVehicles((prev) => [newVehicle, ...prev]);
    logActivity('automotora', newVehicle.id, 'create', {
      plate: newVehicle.plate,
      brand: newVehicle.brand,
      model: newVehicle.model,
      status: newVehicle.status
    });
    return newVehicle;
  };

  const DEALERSHIP_FIELD_LABELS: Record<string, string> = {
    brand: 'Marca',
    model: 'Modelo',
    version: 'Versión',
    year: 'Año',
    condition: 'Condición',
    vehicle_type: 'Tipo de vehículo',
    plate: 'Matrícula',
    chassis_vin: 'Chasis / VIN',
    color_exterior: 'Color exterior',
    color_interior: 'Color interior',
    mileage: 'Kilometraje',
    fuel: 'Combustible',
    transmission: 'Transmisión',
    range_km: 'Autonomía',
    engine: 'Motorización',
    doors: 'Puertas',
    features: 'Equipamiento',
    catalog_description: 'Descripción pública',
    sale_price: 'Precio de venta',
    sale_currency: 'Moneda de venta',
    min_acceptable_price: 'Precio mínimo aceptable',
    purchase_price: 'Precio de compra',
    status: 'Estado',
    docs_received: 'Documentación',
    internal_notes: 'Notas internas',
    images: 'Fotos',
    cover_image: 'Foto de portada',
    custom_fields: 'Campos personalizados',
    is_featured: 'Destacado'
  };

  const canEditDealershipStock = (userRoles?: Role[]): boolean => {
    const roles = userRoles || profile?.roles || [];
    if (roles.includes('admin') || roles.includes('encargado')) return true;
    if (roles.includes('vendedor') && dealershipConfig.sellers_can_edit) return true;
    return false;
  };

  const updateDealershipVehicle = (id: string, data: Partial<DealershipVehicle>) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;

        // Diff tracking
        const newHistoryEntries: DealershipVehicleHistoryEntry[] = [];
        const ignoredKeys = new Set([
          'history',
          'updated_at',
          'created_at',
          'id',
          'total_real_cost_usd',
          'estimated_margin_usd',
          'estimated_margin_percent',
          'tiendanube_synced_at'
        ]);

        for (const [key, newVal] of Object.entries(data)) {
          if (ignoredKeys.has(key)) continue;
          const oldVal = (v as any)[key];
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            newHistoryEntries.push({
              id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
              user_id: profile?.id,
              user_name: profile?.full_name || 'Usuario',
              field: key,
              field_label: DEALERSHIP_FIELD_LABELS[key] || key,
              old_value: oldVal ?? '—',
              new_value: newVal ?? '—'
            });
          }
        }

        // Detectar si cambió algún dato público para simular sync con Tiendanube
        const publicKeys = [
          'brand', 'model', 'version', 'year', 'condition', 'vehicle_type',
          'color_exterior', 'mileage', 'fuel', 'transmission', 'autonomy_km',
          'engine', 'doors', 'features', 'catalog_description', 'sale_price',
          'sale_currency', 'images', 'cover_image', 'status', 'is_featured'
        ];
        const isPublicChanged = Object.keys(data).some(
          (k) => publicKeys.includes(k) && JSON.stringify((v as any)[k]) !== JSON.stringify((data as any)[k])
        );

        const updatedHistory = [...newHistoryEntries, ...(v.history || [])].slice(0, 50);

        const merged: DealershipVehicle = {
          ...v,
          ...data,
          history: updatedHistory,
          tiendanube_synced_at: isPublicChanged
            ? new Date().toISOString()
            : (data.tiendanube_synced_at || v.tiendanube_synced_at),
          updated_at: new Date().toISOString()
        };
        const financials = calculateVehicleFinancials(merged);
        return {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
      })
    );
    logActivity('automotora', id, 'update', data);
  };

  const duplicateDealershipVehicle = (id: string): DealershipVehicle | null => {
    const original = dealershipVehicles.find((v) => v.id === id);
    if (!original) return null;

    const newVehicleData: Omit<DealershipVehicle, 'id' | 'created_at' | 'updated_at' | 'total_real_cost_usd' | 'estimated_margin_usd' | 'estimated_margin_percent'> = {
      empresa_id: original.empresa_id || 'carvlak',
      condition: original.condition,
      vehicle_type: original.vehicle_type,
      plate: '',
      chassis_vin: '',
      brand: original.brand,
      model: `${original.model} (Copia)`,
      version: original.version,
      year: original.year,
      mileage: 0,
      engine: original.engine,
      doors: original.doors,
      category: original.category,
      body_type: original.body_type,
      transmission: original.transmission,
      fuel: original.fuel,
      autonomy_km: original.autonomy_km,
      color_exterior: original.color_exterior,
      status: 'evaluacion',
      is_featured: false,
      features: [...(original.features || [])],
      images: [],
      cover_image: undefined,
      catalog_description: original.catalog_description,
      purchase_price: original.purchase_price,
      purchase_currency: original.purchase_currency,
      exchange_rate: original.exchange_rate,
      purchase_origin: original.purchase_origin,
      supplier_name: original.supplier_name,
      supplier_phone: original.supplier_phone,
      docs_received: {
        titulo: false,
        libreta: false,
        cedula: false,
        sucive_al_dia: false,
        multas_al_dia: false,
        llave_duplicado: false
      },
      sale_price: original.sale_price,
      sale_currency: original.sale_currency,
      min_acceptable_price: original.min_acceptable_price,
      inspection_cost: 0,
      detailing_cost: 0,
      repairs_cost: 0,
      paperwork_cost: 0,
      other_expenses_cost: 0,
      prep_checklist: {
        inspection_done: false,
        repairs_done: false,
        detailing_done: false,
        photos_done: false,
        docs_done: false
      },
      custom_fields: original.custom_fields ? { ...original.custom_fields } : {},
      internal_notes: `Duplicado a partir de ${original.brand} ${original.model} (${original.plate || 'sin matrícula'}).`,
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user_id: profile?.id,
          user_name: profile?.full_name || 'Usuario',
          field: 'status',
          field_label: 'Vehículo duplicado',
          old_value: '—',
          new_value: `Copia creada a partir de ${original.brand} ${original.model} (${original.plate || 'sin matrícula'})`
        }
      ],
      is_archived: false
    };

    return addDealershipVehicle(newVehicleData);
  };

  const bulkUpdateDealershipVehicles = (ids: string[], updates: Partial<DealershipVehicle>) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => {
        if (!ids.includes(v.id)) return v;

        const newHistoryEntries: DealershipVehicleHistoryEntry[] = [];
        for (const [key, newVal] of Object.entries(updates)) {
          const oldVal = (v as any)[key];
          if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            newHistoryEntries.push({
              id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
              user_id: profile?.id,
              user_name: profile?.full_name || 'Usuario',
              field: key,
              field_label: DEALERSHIP_FIELD_LABELS[key] || key,
              old_value: oldVal ?? '—',
              new_value: newVal ?? '—'
            });
          }
        }

        const merged: DealershipVehicle = {
          ...v,
          ...updates,
          history: [...newHistoryEntries, ...(v.history || [])].slice(0, 50),
          tiendanube_synced_at: updates.status || updates.sale_price ? new Date().toISOString() : v.tiendanube_synced_at,
          updated_at: new Date().toISOString()
        };
        const financials = calculateVehicleFinancials(merged);
        return {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
      })
    );
    ids.forEach((id) => {
      logActivity('automotora', id, 'update', updates);
    });
  };

  const bulkAdjustVehiclePrices = (
    ids: string[],
    adjustmentType: 'percent' | 'fixed',
    amount: number
  ) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => {
        if (!ids.includes(v.id)) return v;
        const oldPrice = v.sale_price;
        let newPrice = oldPrice;
        if (adjustmentType === 'percent') {
          newPrice = Math.round(oldPrice * (1 + amount / 100));
        } else {
          newPrice = Math.max(0, Math.round(oldPrice + amount));
        }

        const historyEntry: DealershipVehicleHistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          user_id: profile?.id,
          user_name: profile?.full_name || 'Usuario',
          field: 'sale_price',
          field_label: 'Precio de venta (Ajuste masivo)',
          old_value: `$ ${oldPrice.toLocaleString('es-UY')}`,
          new_value: `$ ${newPrice.toLocaleString('es-UY')} (${
            adjustmentType === 'percent'
              ? (amount >= 0 ? `+${amount}%` : `${amount}%`)
              : (amount >= 0 ? `+USD ${amount}` : `-USD ${Math.abs(amount)}`)
          })`
        };

        const merged: DealershipVehicle = {
          ...v,
          sale_price: newPrice,
          history: [historyEntry, ...(v.history || [])].slice(0, 50),
          tiendanube_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const financials = calculateVehicleFinancials(merged);
        return {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
      })
    );
    ids.forEach((id) => {
      logActivity('automotora', id, 'update', { bulkPriceAdjustment: { adjustmentType, amount } });
    });
  };

  const updateDealershipVehicleStatus = (
    id: string,
    newStatus: DealershipVehicleStatus,
    extraData?: Record<string, any>
  ) => {
    const current = dealershipVehicles.find((v) => v.id === id);
    if (!current) return;

    const updatedFields: Partial<DealershipVehicle> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // 1. Al pasar a 'evaluacion' -> Ofrecer peritaje interno de Fase 3
    if (newStatus === 'evaluacion') {
      if (extraData?.triggerInspection && !current.inspection_id) {
        const newInsp = addInspection({
          type: 'interna',
          status: 'Solicitada',
          vehicle_plate: current.plate,
          vehicle_info: `${current.brand} ${current.model} (${current.year})`,
          vehicle_category: current.category,
          price_amount: dealershipConfig.default_internal_inspection_cost,
          price_currency: 'UYU',
          home_visit_surcharge: 0,
          total_price: dealershipConfig.default_internal_inspection_cost,
          buyer_name: 'Automotora CARVLAK',
          assigned_to: extraData.inspector_id || 'user-diego',
          is_home_visit: false,
          score: 0,
          traffic_light: 'Recomendable',
          inspector_conclusion: 'Pendiente de inspección técnica interna',
          estimated_repair_cost: 0,
          obd_codes: []
        });
        updatedFields.inspection_id = newInsp.id;
        updatedFields.inspection_cost = dealershipConfig.default_internal_inspection_cost;
      }
    }

    // 2. Al pasar a 'comprado' -> Crear orden de detailing interna a costo interno y tareas de alistamiento
    if (newStatus === 'comprado') {
      const detailingCost = dealershipConfig.default_internal_detailing_cost || 2500;
      updatedFields.detailing_cost = detailingCost;

      // Crear cotización interna de detailing
      const newDetailingQuote = addDetailingQuote({
        client_id: 'client-carvlak-automotora',
        client_name: 'Automotora CARVLAK (Stock)',
        client_phone: '099 267 964',
        vehicle_info: `${current.brand} ${current.model} (${current.year})`,
        vehicle_plate: current.plate,
        vehicle_category: current.category,
        selected_services: [
          { serviceId: 'interior', serviceName: 'Limpieza profunda de interior (Alistamiento)', price: detailingCost }
        ],
        subtotal: detailingCost,
        discount_type: 'none',
        discount_amount: 0,
        extreme_dirt_surcharge: 0,
        total_amount: detailingCost,
        estimated_time: '1 día',
        assigned_to: 'user-matias',
        origin: 'Presencial',
        notes: `Alistamiento interno para showroom de Automotora: ${current.plate}`,
        priority_zones: 'Todo el habitáculo y vano motor',
        status: 'Turno Confirmado'
      });
      updatedFields.detailing_quote_id = newDetailingQuote.id;

      // Tareas de preparación para el equipo
      addTask({
        title: `Alistamiento mecánico & revisión de fluidos: ${current.brand} ${current.model} (${current.plate})`,
        business: 'automotora',
        assigned_to: 'user-maxi',
        due_date: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
        status: 'Pendiente'
      });

      addTask({
        title: `Sesión de fotos HD para catálogo web: ${current.brand} ${current.model} (${current.plate})`,
        business: 'automotora',
        assigned_to: 'user-matias',
        due_date: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
        status: 'Pendiente'
      });
    }

    // 3. Al pasar a 'reservado'
    if (newStatus === 'reservado' && extraData?.reservation) {
      updatedFields.reservation = extraData.reservation;
    }

    // 4. Al pasar a 'vendido' -> Liquidar comisión, historial y auto en permuta si corresponde
    if (newStatus === 'vendido') {
      if (extraData?.saleRecord) {
        updatedFields.sale_record = extraData.saleRecord;

        // Generar comisión del vendedor
        const sellerId = extraData.saleRecord.seller_employee_id || profile?.id || 'user-diego';
        const sellerProfile = INITIAL_PROFILES.find((p) => p.id === sellerId) || profile;
        const commRate = sellerProfile?.commissions?.automotora || dealershipConfig.default_commission_rate || 15;

        // Comisión sobre margen o sobre venta
        let commAmount = 0;
        if (dealershipConfig.commission_basis === 'margin') {
          const marginUsd = current.estimated_margin_usd || 1000;
          commAmount = Math.round(marginUsd * (commRate / 100));
        } else {
          const saleUsd = extraData.saleRecord.final_price || current.sale_price || 0;
          commAmount = Math.round(saleUsd * (commRate / 100));
        }

        const newComm: CommissionRecord = {
          id: `comm-auto-${Date.now()}`,
          business: 'automotora',
          employee_id: sellerId,
          employee_name: sellerProfile?.full_name || 'Vendedor Automotora',
          quote_id: current.id,
          client_name: extraData.saleRecord.buyer_name,
          vehicle_description: `${current.brand} ${current.model} (${current.plate})`,
          amount_charged: extraData.saleRecord.final_price,
          commission_rate: commRate,
          commission_amount: commAmount,
          status: 'Pendiente',
          created_at: new Date().toISOString()
        };
        setCommissions((prev) => [...prev.filter((c) => c.quote_id !== current.id), newComm]);

        // Si se recibió un auto en parte de pago (permuta), crear automáticamente en stock como 'evaluacion'
        if (extraData.tradeIn && extraData.tradeIn.plate) {
          addDealershipVehicle({
            empresa_id: current.empresa_id || 'carvlak',
            condition: 'usado',
            plate: extraData.tradeIn.plate.toUpperCase(),
            brand: extraData.tradeIn.brand || 'Vehículo',
            model: extraData.tradeIn.model || 'Parte de pago',
            year: extraData.tradeIn.year || new Date().getFullYear(),
            mileage: extraData.tradeIn.mileage || 0,
            category: extraData.tradeIn.category || 'Mediano',
            status: 'evaluacion',
            features: [],
            images: extraData.tradeIn.photos || [],
            purchase_origin: 'parte_de_pago',
            supplier_name: extraData.saleRecord.buyer_name,
            supplier_phone: extraData.saleRecord.buyer_phone,
            purchase_price: extraData.tradeIn.valuation || 0,
            purchase_currency: 'USD',
            exchange_rate: current.exchange_rate || 43.50,
            docs_received: {
              titulo: false,
              libreta: true,
              cedula: true,
              sucive_al_dia: true,
              multas_al_dia: true,
              llave_duplicado: false
            },
            sale_price: Math.round((extraData.tradeIn.valuation || 0) * 1.22),
            sale_currency: 'USD',
            min_acceptable_price: extraData.tradeIn.valuation || 0,
            inspection_cost: 0,
            detailing_cost: 0,
            repairs_cost: 0,
            paperwork_cost: 0,
            other_expenses_cost: 0,
            prep_checklist: {
              inspection_done: false,
              repairs_done: false,
              detailing_done: false,
              photos_done: false,
              docs_done: false
            },
            catalog_description: `Tomado en parte de pago de ${current.brand} ${current.model}. Pendiente peritaje técnico y preparación.`,
            is_archived: false
          });
        }

        // Historial en Vehículo y Cliente
        addVehicleHistory(
          current.vehicle_id || current.plate,
          'automotora',
          'Venta de Vehículo Concretada',
          `Vendido a ${extraData.saleRecord.buyer_name} por USD ${extraData.saleRecord.final_price?.toLocaleString('es-UY')}. Vendedor: ${sellerProfile?.full_name}. Trámite: ${extraData.saleRecord.paperwork_status}.`
        );
      }
    } else if (current.status === 'vendido') {
      // Reversión de venta: eliminar comisión generada
      setCommissions((prev) => prev.filter((c) => c.quote_id !== current.id));
    }

    setDealershipVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const merged = { ...v, ...updatedFields };
        const financials = calculateVehicleFinancials(merged);
        return {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
      })
    );

    logActivity('automotora', id, 'status_change', { from: current.status, to: newStatus });
  };

  const archiveDealershipVehicle = (id: string) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_archived: true, updated_at: new Date().toISOString() } : v))
    );
    logActivity('automotora', id, 'archive', { is_archived: true });
  };

  // CRM Interesados
  const addDealershipInquiry = (
    data: Omit<DealershipInquiry, 'id' | 'created_at' | 'updated_at'>
  ): DealershipInquiry => {
    const newInq: DealershipInquiry = {
      ...data,
      id: `inq-${Date.now()}`,
      empresa_id: data.empresa_id || 'carvlak',
      status: data.status || 'Nuevo',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setDealershipInquiries((prev) => [newInq, ...prev]);
    logActivity('consulta_automotora', newInq.id, 'create', {
      client: newInq.client_name,
      vehicle: newInq.vehicle_info,
      origin: newInq.origin
    });
    return newInq;
  };

  const updateDealershipInquiry = (id: string, data: Partial<DealershipInquiry>) => {
    setDealershipInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, ...data, updated_at: new Date().toISOString() } : inq))
    );
    logActivity('consulta_automotora', id, 'update', data);
  };

  const updateDealershipInquiryStatus = (
    id: string,
    newStatus: DealershipInquiryStatus,
    appointmentDetails?: { date: string; assigned_to?: string; title?: string }
  ) => {
    const current = dealershipInquiries.find((inq) => inq.id === id);
    if (!current) return;

    const updatedFields: Partial<DealershipInquiry> = {
      status: newStatus,
      last_contact_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Si pasa a Visita agendada o Prueba de manejo, agendar en Agenda Unificada
    if (newStatus === 'Visita agendada' || newStatus === 'Prueba de manejo') {
      const apptDate = appointmentDetails?.date || new Date().toISOString();
      const newAppt = addAppointment({
        business: 'automotora',
        client_id: current.client_id || 'client-walkin',
        start_time: apptDate,
        duration_minutes: 60,
        status: 'Confirmado',
        title: `${newStatus}: ${current.vehicle_info} con ${current.client_name}`,
        notes: `Interesado: ${current.client_name} (${current.client_phone}). Origen: ${current.origin}. ${current.notes || ''}`,
        assigned_to: appointmentDetails?.assigned_to || current.assigned_to || profile?.id,
        price_amount: 0,
        price_currency: 'USD'
      });
      updatedFields.appointment_id = newAppt.id;
    }

    setDealershipInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, ...updatedFields } : inq))
    );
    logActivity('consulta_automotora', id, 'status_change', { from: current.status, to: newStatus });
  };

  const archiveDealershipInquiry = (id: string) => {
    setDealershipInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, is_archived: true, updated_at: new Date().toISOString() } : inq))
    );
    logActivity('consulta_automotora', id, 'archive', { is_archived: true });
  };

  const updateDealershipConfig = (config: Partial<DealershipConfig>) => {
    setDealershipConfig((prev) => ({ ...prev, ...config }));
    logActivity('automotora', 'config', 'update', config);
  };

  // Importar catálogo oficial de AppAuto (44 autos)
  const importAppAutoCatalog = (): { importedCount: number; duplicatesCount: number } => {
    let importedCount = 0;
    let duplicatesCount = 0;

    APPAUTO_OFFICIAL_CATALOG.forEach((car, index) => {
      const plate = (car.plate || `CAR-${100 + index}`).toUpperCase();
      const exists = dealershipVehicles.some((v) => v.plate.toUpperCase() === plate);

      if (exists) {
        duplicatesCount++;
      } else {
        const purchasePrice = Math.round((car.sale_price || 8000) * 0.78);
        addDealershipVehicle({
          empresa_id: 'carvlak',
          condition: 'usado',
          plate,
          brand: car.brand || 'Vehículo',
          model: car.model || '',
          version: car.version || '',
          year: car.year || 2017,
          mileage: car.mileage || 100000,
          category: car.category || 'Mediano',
          body_type: car.body_type || 'Hatchback',
          transmission: car.transmission || 'Manual',
          fuel: car.fuel || 'Nafta',
          color_exterior: car.color_exterior || 'Blanco',
          status: 'publicado',
          is_featured: index < 4,
          features: car.features || [],
          images: car.images || [],
          cover_image: car.images && car.images[0] ? car.images[0] : undefined,
          catalog_description: `${car.brand} ${car.model} ${car.version || ''} (${car.year}). Excelente oportunidad en CARVLAK. Garantía técnica y documentación en regla.`,
          purchase_price: purchasePrice,
          purchase_currency: 'USD',
          exchange_rate: 43.50,
          purchase_origin: 'particular',
          docs_received: {
            titulo: true,
            libreta: true,
            cedula: true,
            sucive_al_dia: true,
            multas_al_dia: true,
            llave_duplicado: true
          },
          sale_price: car.sale_price || 8000,
          sale_currency: 'USD',
          min_acceptable_price: Math.round((car.sale_price || 8000) * 0.95),
          inspection_cost: 1500,
          detailing_cost: 2500,
          repairs_cost: 0,
          paperwork_cost: 1500,
          other_expenses_cost: 0,
          prep_checklist: {
            inspection_done: true,
            repairs_done: true,
            detailing_done: true,
            photos_done: true,
            docs_done: true
          },
          is_archived: false
        });
        importedCount++;
      }
    });

    return { importedCount, duplicatesCount };
  };

  // Posventa: Crear cotización de detailing con descuento (20% OFF)
  const createPosventaDetailingQuote = (
    dealershipVehicleId: string,
    buyerName?: string,
    buyerPhone?: string
  ): string | null => {
    const car = dealershipVehicles.find((v) => v.id === dealershipVehicleId);
    if (!car) return null;

    const t = detailingTariffs.find((tar) => tar.id === 'ceramico') || detailingTariffs[0];
    const cat = car.category || 'Mediano';
    const basePrice = t ? (t.prices[cat] || 8500) : 8500;
    const discount = Math.round(basePrice * 0.2); // 20% descuento posventa

    const newQuote = addDetailingQuote({
      client_id: 'client-carvlak-automotora',
      client_name: buyerName || car.sale_record?.buyer_name || 'Comprador CARVLAK',
      client_phone: buyerPhone || car.sale_record?.buyer_phone || '',
      vehicle_info: `${car.brand} ${car.model} (${car.year})`,
      vehicle_plate: car.plate,
      vehicle_category: car.category,
      selected_services: [
        {
          serviceId: t ? t.id : 'ceramico',
          serviceName: t ? t.name : 'Sellado Cerámico Posventa',
          price: basePrice
        }
      ],
      subtotal: basePrice,
      discount_type: 'special_15',
      discount_amount: discount,
      extreme_dirt_surcharge: 0,
      total_amount: basePrice - discount,
      estimated_time: '1 a 2 días',
      assigned_to: profile?.id || 'user-maxi',
      origin: 'Presencial',
      notes: `Beneficio fidelización posventa 20% OFF por compra de unidad ${car.plate} en Automotora CARVLAK.`,
      priority_zones: 'Todo el exterior y protección de pintura',
      status: 'Por Cotizar'
    });

    return newQuote.id;
  };

  const importTiendanubeCatalog = (): { importedCount: number; duplicatesCount: number } => {
    let importedCount = 0;
    let duplicatesCount = 0;

    const toAdd = [];
    INITIAL_DEALERSHIP_VEHICLES.forEach((catalogCar) => {
      const exists = dealershipVehicles.some(
        (v) =>
          (v.tiendanube_id && catalogCar.tiendanube_id && v.tiendanube_id === catalogCar.tiendanube_id) ||
          (v.plate && catalogCar.plate && v.plate.toUpperCase() === catalogCar.plate.toUpperCase())
      );

      if (exists) {
        duplicatesCount++;
      } else {
        toAdd.push(catalogCar);
        importedCount++;
      }
    });

    if (toAdd.length > 0) {
      setDealershipVehicles((prev) => [...toAdd, ...prev]);
    }

    return { importedCount, duplicatesCount };
  };

  // FASE 5: Handlers Redes Sociales & Marketing Studio
  const addSocialMediaPost = (data: Omit<SocialMediaPostRecord, 'id' | 'created_at' | 'created_by'>): SocialMediaPostRecord => {
    const newPost: SocialMediaPostRecord = {
      ...data,
      id: `post-${Date.now()}`,
      created_by: profile?.id || 'admin',
      created_by_name: profile?.full_name || data.created_by_name || 'Admin',
      created_at: new Date().toISOString()
    };
    setSocialMediaPosts((prev) => [newPost, ...prev]);
    logActivity('marketing', newPost.id, 'create', {
      title: newPost.item_title,
      template_id: newPost.template_id,
      format: newPost.format
    });
    return newPost;
  };

  const updateSocialMediaPost = (id: string, updates: Partial<SocialMediaPostRecord>) => {
    setSocialMediaPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteSocialMediaPost = (id: string) => {
    setSocialMediaPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateSocialMediaConfig = (updates: Partial<SocialMediaConfig>) => {
    setSocialMediaConfig((prev) => ({
      ...prev,
      ...updates,
      templates: {
        ...prev.templates,
        ...(updates.templates || {})
      }
    }));
  };

  const updateClientConsent = (clientId: string, consent: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, social_media_consent: consent, updated_at: new Date().toISOString() } : c))
    );
    logActivity('cliente', clientId, 'update', { social_media_consent: consent });
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
        importDetailVlakData,

        // FASE 3: Inspecciones
        inspections: inspections.filter((i) => !i.is_archived),
        inspectionTariffs,
        addInspection,
        updateInspection,
        updateInspectionStatus,
        archiveInspection,
        updateInspectionTariffs,
        getInspectionByToken,
        createDetailingQuoteFromInspection,

        // FASE 4: Automotora
        dealershipVehicles: dealershipVehicles.filter((v) => !v.is_archived),
        dealershipInquiries: dealershipInquiries.filter((inq) => !inq.is_archived),
        dealershipConfig,
        canEditDealershipStock,
        addDealershipVehicle,
        updateDealershipVehicle,
        duplicateDealershipVehicle,
        bulkUpdateDealershipVehicles,
        bulkAdjustVehiclePrices,
        updateDealershipVehicleStatus,
        archiveDealershipVehicle,
        addDealershipInquiry,
        updateDealershipInquiry,
        updateDealershipInquiryStatus,
        archiveDealershipInquiry,
        updateDealershipConfig,
        importAppAutoCatalog,
        importTiendanubeCatalog,
        createPosventaDetailingQuote,

        // FASE 5: Redes Sociales & Marketing Studio
        socialMediaPosts,
        socialMediaConfig,
        addSocialMediaPost,
        updateSocialMediaPost,
        deleteSocialMediaPost,
        updateSocialMediaConfig,
        updateClientConsent
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

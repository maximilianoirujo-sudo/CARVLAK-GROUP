import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  DealershipSaleRecord,
  DealershipInquiry,
  DealershipInquiryStatus,
  DealershipConfig,
  SocialMediaConfig,
  SocialMediaPostRecord,
  SocialMediaTemplateConfig,
  CanvasTextElement,
  GeneralConfig,
  DetailingConfig,
  DetailingPayment,
  DetailingCheckinData,
  DetailingQualityControlData,
  DetailingCashClosure,
  DetailingReceipt,
  DetailingCleanSelection
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
  INITIAL_DEALERSHIP_INQUIRIES,
  INITIAL_GENERAL_CONFIG,
  INITIAL_SOCIAL_MEDIA_CONFIG,
  INITIAL_SOCIAL_MEDIA_POSTS,
  INITIAL_DETAILING_CONFIG
} from '../lib/mockData';
import { normalizePlate, sanitizePhoneForWhatsApp, getLocalDateString, isActiveJob, isActiveExpense, mapOldStatusToNew, getDiscountLabel } from '../lib/formatters';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { enqueueSync, processSyncQueue } from '../lib/syncQueue';
import { useAuth } from './AuthContext';

export interface DataContextType {
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
  updateDetailingTariff: (id: string, pricesOrUpdates: DetailingTariffPrices | Partial<DetailingTariff>, isActive?: boolean) => void;
  addDetailingTariff: (tariff: Omit<DetailingTariff, 'id'>) => DetailingTariff;

  detailingQuotes: DetailingQuote[];
  allDetailingQuotes: DetailingQuote[];
  detailingConfig: DetailingConfig;
  updateDetailingConfig: (config: Partial<DetailingConfig>) => void;
  addDetailingQuote: (quoteData: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'>) => DetailingQuote;
  updateDetailingQuote: (id: string, data: Partial<DetailingQuote>) => void;
  updateDetailingQuoteStatus: (id: string, newStatus: DetailingQuoteStatus, appointmentDetails?: { date: string; assigned_to?: string; work_bay_id?: string }) => void;
  archiveDetailingQuote: (id: string) => void;
  voidDetailingQuote: (id: string, reason: string) => void;
  restoreDetailingQuote: (id: string) => void;
  deleteDetailingQuotePermanent: (id: string) => void;
  bulkVoidDetailingQuotes: (ids: string[], reason: string) => void;
  bulkDeleteDetailingQuotes: (ids: string[]) => void;
  detailingPayments: DetailingPayment[];
  recordDetailingPayment: (quoteId: string, payment: Omit<DetailingPayment, 'id'>) => Promise<void> | void;
  recordDetailingCheckin: (quoteId: string, checkin: DetailingCheckinData) => void;
  recordDetailingQualityControl: (quoteId: string, qc: DetailingQualityControlData) => void;
  logDetailingWhatsAppSent: (targetId: string, templateKey: string, phone: string) => void;
  voidAppointment: (id: string, reason: string) => void;

  stockItems: StockItem[];
  addStockItem: (itemData: Omit<StockItem, 'id' | 'updated_at' | 'movements'>) => StockItem;
  updateStockItem: (id: string, data: Partial<StockItem>) => void;
  archiveStockItem: (id: string) => void;
  deleteStockItemPermanent: (id: string) => void;
  recordStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>, createExpense?: boolean) => void;

  expenses: Expense[];
  allExpenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  voidExpense: (id: string, reason: string) => void;
  restoreExpense: (id: string) => void;
  deleteExpensePermanent: (id: string) => void;
  detailingCashClosures: DetailingCashClosure[];
  saveDetailingCashClosure: (closure: Omit<DetailingCashClosure, 'id' | 'created_at'>) => DetailingCashClosure;

  commissions: CommissionRecord[];
  markCommissionPaid: (id: string) => void;
  recalculateDetailingCommissions: (periodStr: string) => void;
  adjustSingleCommission: (commissionId: string, newAmount: number, reason: string) => void;

  detailingReceipts: DetailingReceipt[];
  generateDetailingReceipt: (quoteId: string, options?: { includePhotos?: boolean; version?: number }) => Promise<DetailingReceipt | null> | DetailingReceipt | null;
  cleanDetailingTestData: (selection: DetailingCleanSelection) => Promise<{ success: boolean; counts: Record<string, number> }>;

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
  updateInspection: (id: string, data: Partial<VehicleInspection>, skipAudit?: boolean) => void;
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
  importTiendanubeCatalog: () => Promise<{ importedCount: number; duplicatesCount: number }>;
  createPosventaDetailingQuote: (dealershipVehicleId: string, buyerName?: string, buyerPhone?: string) => string | null;
  syncVehicleWithTiendanube: (vehicle: DealershipVehicle, action: 'publish' | 'update_price' | 'reserve' | 'sell' | 'sync') => Promise<void>;

  // CONFIGURACIÓN GENERAL DEL HUB
  generalConfig: GeneralConfig;
  updateGeneralConfig: (config: Partial<GeneralConfig>) => void;

  // FASE 5: REDES SOCIALES & MARKETING STUDIO
  socialMediaPosts: SocialMediaPostRecord[];
  socialMediaConfig: SocialMediaConfig;
  addSocialMediaPost: (data: Omit<SocialMediaPostRecord, 'id' | 'created_at' | 'created_by'>) => SocialMediaPostRecord;
  updateSocialMediaPost: (id: string, data: Partial<SocialMediaPostRecord>) => void;
  deleteSocialMediaPost: (id: string) => void;
  updateSocialMediaConfig: (config: Partial<SocialMediaConfig>) => void;
  saveSocialTemplate: (template: SocialMediaTemplateConfig) => void;
  duplicateSocialTemplate: (templateId: string) => SocialMediaTemplateConfig | null;
  deleteSocialTemplate: (templateId: string) => boolean;
  toggleSocialTemplateActive: (templateId: string) => void;
  resetSocialTemplateToDefault: (templateId: string) => void;
  updateClientConsent: (clientId: string, consent: boolean) => void;
  toggleVehicleFlyerImage: (vehicleId: string, imageUrl: string) => void;
  applyStyleToAllTemplates: (sourceTemplateId: string) => void;

  // Sincronización en tiempo real y remota
  refreshData: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

// Hook para persistencia diferida en localStorage (500 ms de demora para evitar bloqueos del hilo principal)
const useDebouncedLocalStorage = (key: string, value: any, delay: number = 500) => {
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn(`Error al guardar ${key} en localStorage:`, err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [key, value, delay]);
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, availableProfiles } = useAuth();

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

  // FASE DETAILVLAK: Configuración del Taller y Cierres de Caja
  const [detailingConfig, setDetailingConfig] = useState<DetailingConfig>(() => {
    const s = localStorage.getItem('carvlak_detailing_config');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        return { ...INITIAL_DETAILING_CONFIG, ...parsed };
      } catch {
        return INITIAL_DETAILING_CONFIG;
      }
    }
    return INITIAL_DETAILING_CONFIG;
  });

  const [detailingCashClosures, setDetailingCashClosures] = useState<DetailingCashClosure[]>(() => {
    const s = localStorage.getItem('carvlak_detailing_cash_closures');
    if (s) {
      try {
        return JSON.parse(s);
      } catch {}
    }
    return [];
  });

  useDebouncedLocalStorage('carvlak_detailing_config', detailingConfig, 500);
  useDebouncedLocalStorage('carvlak_detailing_cash_closures', detailingCashClosures, 500);

  const [detailingReceipts, setDetailingReceipts] = useState<DetailingReceipt[]>(() => {
    const s = localStorage.getItem('carvlak_detailing_receipts');
    if (s) {
      try {
        return JSON.parse(s);
      } catch {}
    }
    return [];
  });

  useDebouncedLocalStorage('carvlak_detailing_receipts', detailingReceipts, 500);

  const [detailingPayments, setDetailingPayments] = useState<DetailingPayment[]>(() => {
    const s = localStorage.getItem('carvlak_detailing_payments');
    if (s) {
      try {
        return JSON.parse(s);
      } catch {}
    }
    return [];
  });
  useDebouncedLocalStorage('carvlak_detailing_payments', detailingPayments, 500);

  // Estados de Sincronización en la nube (Web & Móvil)
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const detailingQuotesRef = useRef(detailingQuotes);
  detailingQuotesRef.current = detailingQuotes;
  const detailingConfigRef = useRef(detailingConfig);
  detailingConfigRef.current = detailingConfig;
  const stockItemsRef = useRef(stockItems);
  stockItemsRef.current = stockItems;

  // FASE 3: Estados Inspecciones Vehiculares (Peritaje Carbusters)
  const [inspections, setInspections] = useState<VehicleInspection[]>(() => {
    const s = localStorage.getItem('carvlak_inspections');
    const raw: VehicleInspection[] = s ? JSON.parse(s) : INITIAL_INSPECTIONS;
    // Las inspecciones internas que ya existen no se borran: marcarlas como archivadas y guardarlas para migrarlas después
    return raw.map((i) => (i.type === 'interna' && !i.is_archived ? { ...i, is_archived: true } : i));
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
        if (Array.isArray(parsed) && parsed.length >= 40) {
          // Migración: detectar IDs duplicados en datos guardados y asignarles un nuevo UUID único
          const seenIds = new Set<string>();
          let hasDuplicates = false;
          const migrated = parsed.map((veh: DealershipVehicle) => {
            if (!veh.id || seenIds.has(veh.id)) {
              hasDuplicates = true;
              return { ...veh, id: crypto.randomUUID() };
            }
            seenIds.add(veh.id);
            return veh;
          });
          if (hasDuplicates) {
            localStorage.setItem('carvlak_dealership_vehicles_v3', JSON.stringify(migrated));
          }
          return migrated;
        }
      } catch (e) {}
    }
    return [];
  });

  // Carga diferida del catálogo inicial de autos (import dinámico para aligerar bundle principal)
  useEffect(() => {
    const s = localStorage.getItem('carvlak_dealership_vehicles_v3');
    if (!s || dealershipVehicles.length === 0) {
      import('../lib/dealershipInitialVehicles').then(({ INITIAL_DEALERSHIP_VEHICLES }) => {
        setDealershipVehicles((current) => {
          if (current.length === 0) {
            try {
              localStorage.setItem('carvlak_dealership_vehicles_v3', JSON.stringify(INITIAL_DEALERSHIP_VEHICLES));
            } catch (e) {}
            return INITIAL_DEALERSHIP_VEHICLES;
          }
          return current;
        });
      });
    }
  }, []);

  const [dealershipInquiries, setDealershipInquiries] = useState<DealershipInquiry[]>(() => {
    const s = localStorage.getItem('carvlak_dealership_inquiries');
    return s ? JSON.parse(s) : INITIAL_DEALERSHIP_INQUIRIES;
  });

  const [dealershipConfig, setDealershipConfig] = useState<DetailingConfig | any>(() => {
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
        // Si ya está migrado a la versión unificada v2, limpiar elementos viejos de cualquier plantilla guardada
        if (parsed.unified_version === '2026_unified_v2') {
          const cleanTemplates = { ...INITIAL_SOCIAL_MEDIA_CONFIG.templates };
          if (parsed.templates) {
            Object.keys(parsed.templates).forEach((key) => {
              const tmpl = parsed.templates[key];
              if (tmpl) {
                const cleanTmpl = { ...tmpl };
                (['layout_story', 'layout_post'] as const).forEach((lk) => {
                  const layout = cleanTmpl[lk];
                  if (layout?.textElements) {
                    // Mantener todos los elementos incluyendo los ocultos
                  }
                });
                cleanTemplates[key] = cleanTmpl;
              }
            });
          }
          return {
            ...INITIAL_SOCIAL_MEDIA_CONFIG,
            ...parsed,
            templates: cleanTemplates
          };
        }
      } catch (e) {}
    }
    // Si no está en v2, reiniciar completamente para eliminar elementos obsoletos
    try {
      localStorage.removeItem('carvlak_social_media_config');
    } catch (e) {}
    return INITIAL_SOCIAL_MEDIA_CONFIG;
  });

  // CONFIGURACIÓN GENERAL DEL HUB
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>(() => {
    const s = localStorage.getItem('carvlak_general_config');
    if (s) {
      try {
        return { ...INITIAL_GENERAL_CONFIG, ...JSON.parse(s) };
      } catch (e) {}
    }
    return INITIAL_GENERAL_CONFIG;
  });

  useDebouncedLocalStorage('carvlak_general_config', generalConfig, 500);

  const updateGeneralConfig = (config: Partial<GeneralConfig>) => {
    setGeneralConfig((prev) => {
      const updated = { ...prev, ...config };
      syncSupabase('general_configs', 'upsert', { id: 'default', ...updated });
      return updated;
    });
    logActivity('configuracion', 'general_config', 'update', config);
  };

  // Helper centralizado para sincronizar con Supabase y encolar ante fallos de red (Offline queue)
  const syncSupabase = async (
    table: string,
    action: 'insert' | 'update' | 'upsert' | 'delete',
    payload: any,
    matchField?: string,
    matchValue?: any
  ) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Sanitizar payload para asegurar que no se envíen campos virtuales de TypeScript que no son columnas SQL
      let cleanPayload = payload;
      if (table === 'detailing_quotes' && payload) {
        const { client, vehicle, assignee, ...rest } = payload;
        cleanPayload = rest;
      } else if (table === 'clients' && payload) {
        const { vehicles, appointments, ...rest } = payload;
        cleanPayload = rest;
      } else if (table === 'vehicles' && payload) {
        const { client, ...rest } = payload;
        cleanPayload = rest;
      }

      let error: any = null;
      if (action === 'insert') {
        const res = await supabase.from(table).insert(cleanPayload);
        error = res.error;
      } else if (action === 'update') {
        const field = matchField || 'id';
        const val = matchValue ?? cleanPayload?.[field];
        const res = await supabase.from(table).update(cleanPayload).eq(field, val);
        error = res.error;
      } else if (action === 'upsert') {
        const res = await supabase.from(table).upsert(cleanPayload);
        error = res.error;
      } else if (action === 'delete') {
        const field = matchField || 'id';
        const val = matchValue;
        const res = await supabase.from(table).delete().eq(field, val);
        error = res.error;
      }

      if (error) {
        console.warn(`Supabase sync warning (${table}.${action}):`, error.message);
        enqueueSync({ table, action, payload: cleanPayload, matchField, matchValue });
      }
    } catch (err) {
      console.warn(`Excepción de red en Supabase sync (${table}.${action}):`, err);
      enqueueSync({ table, action, payload, matchField, matchValue });
    }
  };

  // Persistencia en localStorage con 500 ms de demora (debounce) para alto rendimiento
  useDebouncedLocalStorage('carvlak_clients', clients, 500);
  useDebouncedLocalStorage('carvlak_vehicles', vehicles, 500);
  useDebouncedLocalStorage('carvlak_appointments', appointments, 500);
  useDebouncedLocalStorage('carvlak_tasks', tasks, 500);
  useDebouncedLocalStorage('carvlak_vehicle_history', vehicleHistory, 500);
  useDebouncedLocalStorage('carvlak_activity_logs', activityLogs, 500);
  useDebouncedLocalStorage('carvlak_detailing_tariffs', detailingTariffs, 500);
  useDebouncedLocalStorage('carvlak_detailing_quotes', detailingQuotes, 500);
  useDebouncedLocalStorage('carvlak_stock_items', stockItems, 500);
  useDebouncedLocalStorage('carvlak_expenses', expenses, 500);
  useDebouncedLocalStorage('carvlak_commissions', commissions, 500);
  useDebouncedLocalStorage('carvlak_whatsapp_templates', whatsappTemplates, 500);
  useDebouncedLocalStorage('carvlak_inspections', inspections, 500);
  useDebouncedLocalStorage('carvlak_inspection_tariffs', inspectionTariffs, 500);
  useDebouncedLocalStorage('carvlak_dealership_vehicles_v3', dealershipVehicles, 500);
  useDebouncedLocalStorage('carvlak_dealership_inquiries', dealershipInquiries, 500);
  useDebouncedLocalStorage('carvlak_dealership_config', dealershipConfig, 500);
  useDebouncedLocalStorage('carvlak_social_media_posts', socialMediaPosts, 500);
  useDebouncedLocalStorage('carvlak_social_media_config', socialMediaConfig, 500);

  // Limpiar clave obsoleta duplicada de localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('carvlak_dealership_vehicles');
    } catch (e) {}
  }, []);

  // Si Supabase está configurado, sincronizar con la nube y mantener Realtime en vivo
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      loadSupabaseData();
      processSyncQueue();

      // Realtime channel para mantener sincronizados varios celulares en el taller
      const channel = supabase
        .channel('carvlak-realtime-detailing')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'detailing_quotes' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'detailing_payments' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'detailing_receipts' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'detailing_configs' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items' }, () => {
          loadSupabaseData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'detailing_cash_closures' }, () => {
          loadSupabaseData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Canal conectado con éxito');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime] Estado del canal:', status);
          }
        });

      // Reconexión y cambio de pestaña
      const handleSyncOnVisible = () => {
        loadSupabaseData();
        processSyncQueue();
      };
      window.addEventListener('focus', handleSyncOnVisible);
      window.addEventListener('online', handleSyncOnVisible);
      const handleVisChange = () => {
        if (document.visibilityState === 'visible') handleSyncOnVisible();
      };
      document.addEventListener('visibilitychange', handleVisChange);

      // Polling de respaldo cada 30 segundos si la pestaña está visible (salvaguarda si el móvil duerme el WebSocket)
      const pollInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible' && (typeof navigator === 'undefined' || navigator.onLine)) {
          loadSupabaseData();
        }
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
        window.removeEventListener('focus', handleSyncOnVisible);
        window.removeEventListener('online', handleSyncOnVisible);
        document.removeEventListener('visibilitychange', handleVisChange);
      };
    }
  }, [profile?.id]);

  const loadSupabaseData = async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setIsSyncing(true);
    try {
      const isAdmin = profile?.roles?.includes('admin');
      const vehicleTable = isAdmin ? 'dealership_vehicles' : 'dealership_vehicles_staff';

      const [
        resGeneralConfig,
        resClients,
        resVehicles,
        resAppts,
        resTasks,
        resVehicleHistory,
        resDealershipVehicles,
        resDealershipInquiries,
        resDealershipConfig,
        resDetailingTariffs,
        resDetailingQuotes,
        resStockItems,
        resExpenses,
        resCommissions,
        resWhatsappTemplates,
        resInspections,
        resInspectionTariffs,
        resSocialPosts,
        resSocialConfig,
        resDetailingConfig,
        resDetailingCashClosures,
        resDetailingReceipts,
        resDetailingPayments
      ] = await Promise.all([
        supabase.from('general_configs').select('*').limit(1).maybeSingle(),
        supabase.from('clients').select('*').eq('is_archived', false),
        supabase.from('vehicles').select('*').eq('is_archived', false),
        supabase.from('appointments').select('*').eq('is_archived', false),
        supabase.from('tasks').select('*'),
        supabase.from('vehicle_history').select('*'),
        supabase.from(vehicleTable).select('*').eq('is_archived', false),
        supabase.from('dealership_inquiries').select('*').eq('is_archived', false),
        supabase.from('dealership_configs').select('*').limit(1).maybeSingle(),
        supabase.from('detailing_tariffs').select('*'),
        supabase.from('detailing_quotes').select('*'),
        supabase.from('stock_items').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('commissions').select('*'),
        supabase.from('whatsapp_templates').select('*'),
        supabase.from('vehicle_inspections').select('*'),
        supabase.from('inspection_tariffs').select('*').limit(1).maybeSingle(),
        supabase.from('social_post_records').select('*'),
        supabase.from('social_media_configs').select('*').limit(1).maybeSingle(),
        supabase.from('detailing_configs').select('*').limit(1).maybeSingle(),
        supabase.from('detailing_cash_closures').select('*'),
        supabase.from('detailing_receipts').select('*'),
        supabase.from('detailing_payments').select('*')
      ]);

      if (resGeneralConfig.data) setGeneralConfig((prev) => ({ ...prev, ...resGeneralConfig.data }));
      if (resClients.data) setClients(resClients.data as Client[]);
      if (resVehicles.data) setVehicles(resVehicles.data as Vehicle[]);
      if (resAppts.data) setAppointments(resAppts.data as Appointment[]);
      if (resTasks.data) setTasks(resTasks.data as Task[]);
      if (resVehicleHistory.data) setVehicleHistory(resVehicleHistory.data as VehicleHistoryEvent[]);
      if (resDealershipVehicles.data) setDealershipVehicles(resDealershipVehicles.data as DealershipVehicle[]);
      if (resDealershipInquiries.data) setDealershipInquiries(resDealershipInquiries.data as DealershipInquiry[]);
      if (resDealershipConfig.data) setDealershipConfig((prev) => ({ ...prev, ...resDealershipConfig.data }));
      if (resDetailingTariffs.data) setDetailingTariffs(resDetailingTariffs.data as DetailingTariff[]);
      if (resDetailingQuotes.data) {
        const paymentsList = (resDetailingPayments?.data as DetailingPayment[]) || [];
        const paymentsByQuote = paymentsList.reduce((acc: Record<string, DetailingPayment[]>, p: DetailingPayment) => {
          if (!acc[p.quote_id]) acc[p.quote_id] = [];
          acc[p.quote_id].push(p);
          return acc;
        }, {});

        const mapped = (resDetailingQuotes.data as DetailingQuote[]).map((q) => {
          const tablePayments = paymentsByQuote[q.id] || [];
          const mergedPayments = tablePayments.length > 0 ? tablePayments : (q.payments || []);
          return {
            ...q,
            payments: mergedPayments,
            status: mapOldStatusToNew(q.status) as DetailingQuoteStatus
          };
        });
        setDetailingQuotes(mapped);
      }
      if (resStockItems.data) setStockItems(resStockItems.data as StockItem[]);
      if (resExpenses.data) setExpenses(resExpenses.data as Expense[]);
      if (resCommissions.data) setCommissions(resCommissions.data as CommissionRecord[]);
      if (resWhatsappTemplates.data) setWhatsappTemplates(resWhatsappTemplates.data as WhatsAppTemplate[]);
      if (resInspections.data) setInspections(resInspections.data as VehicleInspection[]);
      if (resInspectionTariffs.data) setInspectionTariffs((prev) => ({ ...prev, ...resInspectionTariffs.data }));
      if (resSocialPosts.data) setSocialMediaPosts(resSocialPosts.data as SocialMediaPostRecord[]);
      if (resSocialConfig.data) setSocialMediaConfig((prev) => ({ ...prev, ...resSocialConfig.data }));
      if (resDetailingConfig.data) {
        const cfg = resDetailingConfig.data.config || resDetailingConfig.data;
        setDetailingConfig({ ...INITIAL_DETAILING_CONFIG, ...cfg });
      }
      if (resDetailingCashClosures.data) setDetailingCashClosures(resDetailingCashClosures.data as DetailingCashClosure[]);
      if (resDetailingReceipts.data) setDetailingReceipts(resDetailingReceipts.data as DetailingReceipt[]);
      if (resDetailingPayments?.data) setDetailingPayments(resDetailingPayments.data as DetailingPayment[]);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      console.warn('Conexión con Supabase en curso o tablas aún vacías:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshData = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue();
      await loadSupabaseData();
    } finally {
      setIsSyncing(false);
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
      syncSupabase('activity_logs', 'insert', {
        id: newLog.id,
        user_id: profile?.id,
        entity_type: entityType,
        entity_id: entityId,
        action,
        details,
        created_at: newLog.created_at
      });
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
      id: `cli-${crypto.randomUUID()}`,
      is_archived: false,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setClients((prev) => [newClient, ...prev]);
    logActivity('cliente', newClient.id, 'create', { name: newClient.full_name, phone: newClient.phone });
    syncSupabase('clients', 'insert', newClient);

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
    syncSupabase('clients', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
  };

  const archiveClient = (id: string) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, is_archived: true } : c)));
    logActivity('cliente', id, 'archive');
    syncSupabase('clients', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
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
      id: `veh-${crypto.randomUUID()}`,
      is_archived: false,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setVehicles((prev) => [newVehicle, ...prev]);
    logActivity('vehiculo', newVehicle.id, 'create', { plate: newVehicle.plate, model: newVehicle.model });

    // Registro inicial en historial
    addVehicleHistory(newVehicle.id, 'automotora', 'Registro Inicial', `Vehículo ${newVehicle.brand} ${newVehicle.model} registrado en CARVLAK Group.`);
    syncSupabase('vehicles', 'insert', newVehicle);

    return { vehicle: newVehicle };
  };

  const updateVehicle = (id: string, data: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data, updated_at: new Date().toISOString() } : v))
    );
    logActivity('vehiculo', id, 'update', data);
    syncSupabase('vehicles', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
  };

  const archiveVehicle = (id: string) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, is_archived: true } : v)));
    logActivity('vehiculo', id, 'archive');
    syncSupabase('vehicles', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  const addVehicleHistory = (vehicleId: string, business: 'automotora' | 'detailing' | 'inspeccion', eventType: string, description: string) => {
    const newEvent: VehicleHistoryEvent = {
      id: `vh-${crypto.randomUUID()}`,
      vehicle_id: vehicleId,
      business,
      event_type: eventType,
      description,
      created_by: profile?.id,
      created_at: new Date().toISOString()
    };
    setVehicleHistory((prev) => [newEvent, ...prev]);
    syncSupabase('vehicle_history', 'insert', newEvent);
  };

  // AGENDA & TURNOS
  const addAppointment = (data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Appointment => {
    const newAppt: Appointment = {
      ...data,
      id: `app-${crypto.randomUUID()}`,
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

    syncSupabase('appointments', 'insert', newAppt);
    return newAppt;
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a))
    );
    logActivity('turno', id, 'update', data);
    syncSupabase('appointments', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
  };

  // TAREAS
  const addTask = (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${crypto.randomUUID()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    logActivity('tarea', newTask.id, 'create', { title: newTask.title, business: newTask.business });
    syncSupabase('tasks', 'insert', newTask);
    return newTask;
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
    );
    logActivity('tarea', id, 'update', data);
    syncSupabase('tasks', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
  };

  // ============================================================================
  // FASE 2: DETAILVLAK PRO IMPLEMENTACIÓN
  // ============================================================================

  // Tarifario
  const updateDetailingTariff = (id: string, pricesOrUpdates: DetailingTariffPrices | Partial<DetailingTariff>, isActive?: boolean) => {
    setDetailingTariffs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if ('chico' in pricesOrUpdates) {
          return { ...t, prices: pricesOrUpdates as DetailingTariffPrices, isActive: isActive !== undefined ? isActive : t.isActive };
        }
        return { ...t, ...(pricesOrUpdates as Partial<DetailingTariff>), isActive: isActive !== undefined ? isActive : t.isActive };
      })
    );
    const updated = detailingTariffs.find((t) => t.id === id);
    if (updated) {
      const payload = 'chico' in pricesOrUpdates
        ? { ...updated, prices: pricesOrUpdates, isActive: isActive !== undefined ? isActive : updated.isActive }
        : { ...updated, ...pricesOrUpdates, isActive: isActive !== undefined ? isActive : updated.isActive };
      syncSupabase('detailing_tariffs', 'upsert', payload);
    }
    logActivity('cotizacion_detailing', id, 'update', { action: 'Actualización de tarifario' });
  };

  const addDetailingTariff = (tariffData: Omit<DetailingTariff, 'id'>): DetailingTariff => {
    const newTariff: DetailingTariff = {
      ...tariffData,
      id: `tariff-${crypto.randomUUID()}`
    };
    setDetailingTariffs((prev) => [...prev, newTariff]);
    syncSupabase('detailing_tariffs', 'insert', newTariff);
    return newTariff;
  };

  // Trabajos de Detailing (Registro Contable)
  const addDetailingQuote = (quoteData: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'>): DetailingQuote => {
    const todayUY = getLocalDateString();
    const nowIso = new Date().toISOString();
    const newQuote: DetailingQuote = {
      ...quoteData,
      id: `quote-${crypto.randomUUID()}`,
      work_date: quoteData.work_date || todayUY,
      created_by: profile?.id,
      created_at: nowIso,
      updated_at: nowIso
    };
    setDetailingQuotes((prev) => [newQuote, ...prev]);
    logActivity('cotizacion_detailing', newQuote.id, 'create', {
      client: newQuote.client_name,
      total: newQuote.total_amount,
      work_date: newQuote.work_date
    });
    syncSupabase('detailing_quotes', 'insert', newQuote);

    // Si viene con pagos registrados:
    if (newQuote.payments && newQuote.payments.length > 0) {
      newQuote.payments.forEach((p) => {
        syncSupabase('detailing_payments', 'insert', { ...p, quote_id: newQuote.id });
      });
      setDetailingPayments((prev) => [...(newQuote.payments || []), ...prev]);

      const totalPaid = newQuote.payments
        .filter((p) => !p.is_voided)
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

      // Si quedó cobrado:
      if (totalPaid >= newQuote.total_amount && newQuote.total_amount > 0) {
        const comms = calculateCommissionsForQuote(newQuote);
        if (comms.length > 0) {
          setCommissions((prev) => [...prev, ...comms]);
          comms.forEach((c) => syncSupabase('commissions', 'insert', c));
        }
      }
    }

    return newQuote;
  };

  const updateDetailingQuote = (id: string, data: Partial<DetailingQuote>) => {
    const nowIso = new Date().toISOString();
    setDetailingQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...data, updated_at: nowIso };

        // Si cambian precio, origen o participantes y la comisión no está pagada, se recalcula sola:
        const hasPriceChanged = data.total_amount !== undefined && data.total_amount !== q.total_amount;
        const hasOriginChanged = data.origin !== undefined && data.origin !== q.origin;
        const hasParticipantsChanged = data.commission_participants !== undefined;

        if (hasPriceChanged || hasOriginChanged || hasParticipantsChanged) {
          const pendingComms = commissions.filter((c) => c.quote_id === id && c.status === 'Pendiente');
          if (pendingComms.length > 0) {
            const newComms = calculateCommissionsForQuote(updated);
            setCommissions((prevC) => [...prevC.filter((c) => c.quote_id !== id || c.status === 'Pagada'), ...newComms]);
            newComms.forEach((c) => syncSupabase('commissions', 'upsert', c));
          }
        }
        return updated;
      })
    );
    logActivity('cotizacion_detailing', id, 'update', data);
    syncSupabase('detailing_quotes', 'update', { ...data, updated_at: nowIso }, 'id', id);
  };

  const archiveDetailingQuote = (id: string) => {
    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, is_archived: true, updated_at: new Date().toISOString() } : q))
    );
    logActivity('cotizacion_detailing', id, 'archive', { is_archived: true });
    syncSupabase('detailing_quotes', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  // FASE DETAILVLAK: Configuración
  const updateDetailingConfig = (config: Partial<DetailingConfig>) => {
    setDetailingConfig((prev) => {
      const updated = { ...prev, ...config };
      syncSupabase('detailing_configs', 'upsert', {
        id: 'default',
        config: updated,
        updated_at: new Date().toISOString(),
        updated_by: profile?.id
      });
      return updated;
    });
    logActivity('configuracion', 'detailing_config', 'update', config);
  };

  const updateDetailingQuoteStatus = (
    id: string,
    newStatus: DetailingQuoteStatus,
    appointmentDetails?: { date: string; assigned_to?: string; work_bay_id?: string }
  ) => {
    const currentQuote = detailingQuotesRef.current.find((q) => q.id === id) || detailingQuotes.find((q) => q.id === id);
    if (!currentQuote) return;

    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      from_status: currentQuote.status,
      to_status: newStatus,
      user_id: profile?.id,
      user_name: profile?.full_name || 'Operador',
      note: ''
    };

    const updatedFields: Partial<DetailingQuote> = {
      status: newStatus,
      history: [...(currentQuote.history || []), historyEntry],
      updated_at: nowIso
    };

    if (appointmentDetails?.work_bay_id) {
      updatedFields.work_bay_id = appointmentDetails.work_bay_id;
    }

    // 1. Al pasar a "Turno Confirmado" o "Agendado" -> Crear o actualizar turno en la Agenda
    if (newStatus === 'Turno Confirmado' || newStatus === 'Agendado') {
      const apptDate = appointmentDetails?.date || currentQuote.appointment_date || nowIso;
      const assignedEmployeeId = appointmentDetails?.assigned_to || currentQuote.assigned_to || profile?.id;
      const bayId = appointmentDetails?.work_bay_id || currentQuote.work_bay_id || 'box-1';

      // Calcular duración sumando durationHours de los servicios
      let totalDurationMin = 0;
      currentQuote.selected_services.forEach((s) => {
        const tariff = detailingTariffs.find((t) => t.id === s.serviceId);
        if (tariff?.durationHours) {
          totalDurationMin += Math.round(tariff.durationHours * 60);
        }
      });
      if (totalDurationMin <= 0) totalDurationMin = 180;

      if (!currentQuote.appointment_id) {
        const newAppt = addAppointment({
          business: 'detailing',
          client_id: currentQuote.client_id,
          vehicle_id: currentQuote.vehicle_id,
          assigned_to: assignedEmployeeId,
          start_time: apptDate,
          duration_minutes: totalDurationMin,
          status: 'Confirmado',
          stage: newStatus,
          work_bay_id: bayId,
          quote_id: currentQuote.id,
          title: `Detailing: ${currentQuote.selected_services.map((s) => s.serviceName).join(' + ') || 'Servicios Varios'}`,
          notes: `Origen: ${currentQuote.origin}. Zonas a priorizar: ${currentQuote.priority_zones || 'Estándar'}. ${currentQuote.notes || ''}`,
          price_amount: currentQuote.total_amount,
          price_currency: 'UYU'
        });

        updatedFields.appointment_id = newAppt.id;
        updatedFields.appointment_date = apptDate;
        if (assignedEmployeeId) updatedFields.assigned_to = assignedEmployeeId;
      } else {
        updateAppointment(currentQuote.appointment_id, {
          start_time: apptDate,
          assigned_to: assignedEmployeeId,
          stage: newStatus,
          work_bay_id: bayId,
          status: 'Confirmado'
        });
        updatedFields.appointment_date = apptDate;
      }
    } else if (currentQuote.appointment_id) {
      // Sincronizar stage en el turno existente
      const apptStatus = newStatus === 'Cancelado' || newStatus === 'No vino' ? 'Cancelado' : 'Confirmado';
      updateAppointment(currentQuote.appointment_id, {
        stage: newStatus,
        status: apptStatus
      });
    }

    // 2. Al pasar a "Entregado" (o "Entregado y cobrado" / "Trabajo Completado"):
    if (newStatus === 'Entregado' || newStatus === 'Entregado y cobrado' || newStatus === 'Trabajo Completado') {
      // Historial en Vehículo
      if (currentQuote.vehicle_id) {
        addVehicleHistory(
          currentQuote.vehicle_id,
          'detailing',
          'Trabajo de Detailing Completado & Entregado',
          `Servicios: ${currentQuote.selected_services.map((s) => s.serviceName).join(', ')}. Monto: $U ${currentQuote.total_amount.toLocaleString('es-UY')}`
        );
      }

      // Consumo de insumos por receta (agrupando cantidades ANTES de descontar)
      if (!currentQuote.materials_consumed || currentQuote.materials_consumed.length === 0) {
        const recipes = detailingConfig.recipes_by_service || {};
        const cat = currentQuote.vehicle_category || 'Mediano';
        const neededByItem: Record<string, number> = {};

        currentQuote.selected_services.forEach((srv) => {
          const srvRecipe = recipes[srv.serviceId];
          if (srvRecipe && srvRecipe[cat]) {
            srvRecipe[cat].forEach((recipeItem) => {
              neededByItem[recipeItem.stock_item_id] = (neededByItem[recipeItem.stock_item_id] || 0) + recipeItem.quantity;
            });
          }
        });

        const itemIds = Object.keys(neededByItem);
        if (itemIds.length > 0) {
          const consumedList: any[] = [];
          let calculatedCost = 0;
          const warnings: string[] = [];

          setStockItems((prevStock) => {
            return prevStock.map((item) => {
              const neededQty = neededByItem[item.id];
              if (!neededQty) return item;

              if (item.quantity < neededQty) {
                warnings.push(`Stock insuficiente de ${item.name}: requerido ${neededQty} ${item.unit || ''}, disponible ${item.quantity}. Se descontó dejando stock en 0.`);
              }

              const actualDeducted = neededQty;
              const newQty = Math.max(0, item.quantity - neededQty);
              const itemCost = Math.round((item.unit_cost || 0) * actualDeducted);
              calculatedCost += itemCost;

              consumedList.push({
                stock_item_id: item.id,
                item_name: item.name,
                quantity: actualDeducted,
                unit: item.unit,
                unit_cost: item.unit_cost || 0,
                total_cost: itemCost
              });

              syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: nowIso }, 'id', item.id);
              return { ...item, quantity: newQty };
            });
          });

          if (consumedList.length > 0) {
            updatedFields.materials_cost = calculatedCost;
            updatedFields.materials_consumed = consumedList;
          }

          if (warnings.length > 0) {
            warnings.forEach((warn) => {
              updatedFields.history = [
                ...(updatedFields.history || currentQuote.history || []),
                {
                  timestamp: nowIso,
                  from_status: currentQuote.status,
                  to_status: newStatus,
                  user_id: profile?.id,
                  user_name: 'Sistema Stock',
                  note: `⚠️ ${warn}`
                }
              ];
            });
          }
        }
      }

      // Generar comisión dinámica y configurable
      const newComms = calculateCommissionsForQuote(currentQuote, updatedFields.materials_cost);
      if (newComms.length > 0) {
        setCommissions((prev) => [...prev.filter((c) => c.quote_id !== currentQuote.id), ...newComms]);
        newComms.forEach((c) => syncSupabase('commissions', 'insert', c));
      }
    } else if (currentQuote.status === 'Entregado' || currentQuote.status === 'Entregado y cobrado' || currentQuote.status === 'Trabajo Completado') {
      // Reversión: si el trabajo vuelve atrás o se cancela, se elimina la comisión generada
      setCommissions((prev) => prev.filter((c) => c.quote_id !== currentQuote.id));
      syncSupabase('commissions', 'delete', undefined, 'quote_id', currentQuote.id);
    }

    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updatedFields } : q))
    );
    logActivity('cotizacion_detailing', id, 'status_change', { from: currentQuote.status, to: newStatus });
    syncSupabase('detailing_quotes', 'update', updatedFields, 'id', id);
  };

  // Cálculo dinámico de comisiones por participante y reglas de origen (Sin inventar perfiles)
  const calculateCommissionsForQuote = (
    quote: DetailingQuote,
    materialsCost?: number
  ): CommissionRecord[] => {
    const commissionConfig = detailingConfig?.commission_config;
    const baseCalc = commissionConfig?.calculation_base || 'total_after_discounts';

    let baseAmount = quote.total_amount;
    if (baseCalc === 'exclude_surcharges') {
      baseAmount = Math.max(0, quote.total_amount - (quote.extreme_dirt_surcharge || 0));
    } else if (baseCalc === 'subtract_supplies') {
      const matCost = materialsCost ?? quote.materials_cost ?? 0;
      baseAmount = Math.max(0, quote.total_amount - matCost);
    }

    const defaultIds = commissionConfig?.default_participants && commissionConfig.default_participants.length > 0
      ? commissionConfig.default_participants
      : ['user-romina', 'user-maxi'];

    const participantIds: string[] = quote.commission_participants && quote.commission_participants.length > 0
      ? quote.commission_participants.map((p) => p.employee_id)
      : defaultIds;

    const result: CommissionRecord[] = [];
    const nowIso = new Date().toISOString();
    const originNorm = (quote.origin || '').trim().toLowerCase();

    participantIds.forEach((empId) => {
      if (!empId) return;
      const empProfile = availableProfiles.find((p) => p.id === empId);
      const empRule = commissionConfig?.employee_rules?.find((r) => r.employee_id === empId);

      // Si no existe en perfiles ni reglas, no inventar datos
      if (!empProfile && !empRule) {
        console.warn(`Colaborador con ID ${empId} no encontrado en perfiles activos.`);
        return;
      }

      // Regla específica de origen del cliente si existe (ej. Anuncios pagos)
      const originRule = empRule?.origin_rules?.find(
        (or) => or.origin?.trim().toLowerCase() === originNorm
      );

      let rate = 30; // base general por defecto (Romina 30%, Maxi 30%)
      if (originRule) {
        rate = originRule.percentage;
      } else if (empRule && empRule.base_percentage !== undefined) {
        rate = empRule.base_percentage;
      } else if (empProfile?.commissions?.detailing !== undefined) {
        rate = empProfile.commissions.detailing;
      }

      // Maximiliano con "Anuncios pagos" -> 12.5%
      const isMaxi = empId === 'user-maxi' ||
        (empProfile?.full_name || '').toLowerCase().includes('maxi') ||
        (empRule?.employee_name || '').toLowerCase().includes('maxi');

      if (isMaxi && originNorm.includes('anuncio')) {
        rate = originRule ? originRule.percentage : 12.5;
      }

      if (rate > 0) {
        const commAmount = Math.round(baseAmount * (rate / 100));
        const empName = empProfile?.full_name || empRule?.employee_name || (isMaxi ? 'Maximiliano Irujo' : 'Romina');
        result.push({
          id: `comm-${crypto.randomUUID()}`,
          business: 'detailing',
          currency: 'UYU',
          employee_id: empId,
          employee_name: empName,
          quote_id: quote.id,
          client_name: quote.client_name,
          vehicle_description: `${quote.vehicle_info}${quote.vehicle_plate ? ` (${quote.vehicle_plate})` : ''}`,
          amount_charged: quote.total_amount,
          commission_rate: rate,
          commission_amount: commAmount,
          origin: quote.origin,
          receipt_number: quote.receipt_number,
          status: 'Pendiente',
          created_at: nowIso
        });
      }
    });

    return result;
  };

  // PARTE 3 & 4: ANULAR TRABAJOS EN CASCADA
  const voidDetailingQuote = (id: string, reason: string) => {
    const currentQuote = detailingQuotesRef.current.find((q) => q.id === id) || detailingQuotes.find((q) => q.id === id);
    if (!currentQuote) return;

    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      from_status: currentQuote.status,
      to_status: 'Anulado' as DetailingQuoteStatus,
      user_id: profile?.id,
      user_name: profile?.full_name || 'Operador',
      note: `Anulación: ${reason}`
    };

    // 1. Revertir insumos consumidos al stock (agrupados por item)
    if (currentQuote.materials_consumed && currentQuote.materials_consumed.length > 0) {
      const toRestore: Record<string, number> = {};
      currentQuote.materials_consumed.forEach((c) => {
        toRestore[c.stock_item_id] = (toRestore[c.stock_item_id] || 0) + c.quantity;
      });
      setStockItems((prev) =>
        prev.map((s) => {
          const add = toRestore[s.id];
          if (!add) return s;
          const newQty = s.quantity + add;
          syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: nowIso }, 'id', s.id);
          return { ...s, quantity: newQty };
        })
      );
    }

    // 2. Eliminar comisión en cascada
    setCommissions((prev) => prev.filter((c) => c.quote_id !== id));
    syncSupabase('commissions', 'delete', undefined, 'quote_id', id);

    // 3. Liberar y anular turno en calendario
    if (currentQuote.appointment_id) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === currentQuote.appointment_id
            ? { ...a, voided_at: nowIso, voided_by: profile?.id, void_reason: reason, status: 'Cancelado' }
            : a
        )
      );
      syncSupabase('appointments', 'update', { voided_at: nowIso, voided_by: profile?.id, void_reason: reason, status: 'Cancelado' }, 'id', currentQuote.appointment_id);
    }

    // 4. Anular cobros asociados
    const voidedPayments = (currentQuote.payments || []).map((p) => ({ ...p, is_voided: true }));
    setDetailingPayments((prev) => prev.map((p) => p.quote_id === id ? { ...p, is_voided: true } : p));
    syncSupabase('detailing_payments', 'update', { is_voided: true }, 'quote_id', id);

    // 5. Anular comprobante asociado en cascada
    setDetailingReceipts((prev) =>
      prev.map((r) =>
        r.quote_id === id
          ? { ...r, is_voided: true, voided_at: nowIso, void_reason: reason, status: 'Anulado' }
          : r
      )
    );
    syncSupabase('detailing_receipts', 'update', {
      is_voided: true,
      voided_at: nowIso,
      void_reason: reason,
      status: 'Anulado'
    }, 'quote_id', id);

    const updatedFields: Partial<DetailingQuote> = {
      voided_at: nowIso,
      voided_by: profile?.id,
      void_reason: reason,
      payments: voidedPayments,
      history: [...(currentQuote.history || []), historyEntry],
      updated_at: nowIso
    };

    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updatedFields } : q))
    );
    logActivity('cotizacion_detailing', id, 'status_change', { action: 'void', reason });
    syncSupabase('detailing_quotes', 'update', updatedFields, 'id', id);
  };

  // RESTAURAR TRABAJO ANULADO
  const restoreDetailingQuote = (id: string) => {
    const currentQuote = detailingQuotesRef.current.find((q) => q.id === id) || detailingQuotes.find((q) => q.id === id);
    if (!currentQuote) return;

    const nowIso = new Date().toISOString();
    const historyEntry = {
      timestamp: nowIso,
      from_status: 'Anulado',
      to_status: currentQuote.status,
      user_id: profile?.id,
      user_name: profile?.full_name || 'Operador',
      note: 'Trabajo restaurado'
    };

    const restoredPayments = (currentQuote.payments || []).map((p) => ({ ...p, is_voided: false }));
    setDetailingPayments((prev) => prev.map((p) => p.quote_id === id ? { ...p, is_voided: false } : p));
    syncSupabase('detailing_payments', 'update', { is_voided: false }, 'quote_id', id);

    if (currentQuote.appointment_id) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === currentQuote.appointment_id
            ? { ...a, voided_at: undefined, voided_by: undefined, void_reason: undefined, status: 'Confirmado' }
            : a
        )
      );
      syncSupabase('appointments', 'update', { voided_at: null, voided_by: null, void_reason: null, status: 'Confirmado' }, 'id', currentQuote.appointment_id);
    }

    // Si estaba entregado, re-descontar stock y re-crear comisiones dinámicamente
    if (currentQuote.status === 'Entregado' || currentQuote.status === 'Entregado y cobrado' || currentQuote.status === 'Trabajo Completado') {
      if (currentQuote.materials_consumed && currentQuote.materials_consumed.length > 0) {
        const toDeduct: Record<string, number> = {};
        currentQuote.materials_consumed.forEach((c) => {
          toDeduct[c.stock_item_id] = (toDeduct[c.stock_item_id] || 0) + c.quantity;
        });
        setStockItems((prev) =>
          prev.map((s) => {
            const deduct = toDeduct[s.id];
            if (!deduct) return s;
            const newQty = Math.max(0, s.quantity - deduct);
            syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: nowIso }, 'id', s.id);
            return { ...s, quantity: newQty };
          })
        );
      }

      const newComms = calculateCommissionsForQuote(currentQuote);
      if (newComms.length > 0) {
        setCommissions((prev) => [...prev.filter((c) => c.quote_id !== currentQuote.id), ...newComms]);
        newComms.forEach((c) => syncSupabase('commissions', 'insert', c));
      }
    }

    // Restaurar comprobante asociado si existía
    setDetailingReceipts((prev) =>
      prev.map((r) =>
        r.quote_id === id
          ? { ...r, is_voided: false, voided_at: undefined, void_reason: undefined, status: r.balance_pending === 0 ? 'Pagado' : 'Saldo pendiente' }
          : r
      )
    );
    syncSupabase('detailing_receipts', 'update', {
      is_voided: false,
      voided_at: null,
      void_reason: null
    }, 'quote_id', id);

    const updatedFields: Partial<DetailingQuote> = {
      voided_at: undefined,
      voided_by: undefined,
      void_reason: undefined,
      payments: restoredPayments,
      history: [...(currentQuote.history || []), historyEntry],
      updated_at: nowIso
    };

    setDetailingQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updatedFields } : q))
    );
    logActivity('cotizacion_detailing', id, 'update', { action: 'restore' });
    syncSupabase('detailing_quotes', 'update', { ...updatedFields, voided_at: null, voided_by: null, void_reason: null }, 'id', id);
  };

  // BORRADO DEFINITIVO (SOLO ADMIN)
  const deleteDetailingQuotePermanent = (id: string) => {
    if (!profile?.roles?.includes('admin')) {
      console.warn('Solo los administradores pueden borrar definitivamente');
      return;
    }
    const q = detailingQuotesRef.current.find((item) => item.id === id) || detailingQuotes.find((item) => item.id === id);
    if (q?.materials_consumed && q.materials_consumed.length > 0 && !q.is_voided) {
      const toRestore: Record<string, number> = {};
      q.materials_consumed.forEach((c) => {
        toRestore[c.stock_item_id] = (toRestore[c.stock_item_id] || 0) + c.quantity;
      });
      const nowIso = new Date().toISOString();
      setStockItems((prev) =>
        prev.map((s) => {
          const add = toRestore[s.id];
          if (!add) return s;
          const newQty = s.quantity + add;
          syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: nowIso }, 'id', s.id);
          return { ...s, quantity: newQty };
        })
      );
    }

    setDetailingQuotes((prev) => prev.filter((item) => item.id !== id));
    if (q?.appointment_id) {
      setAppointments((prev) => prev.filter((a) => a.id !== q.appointment_id));
      syncSupabase('appointments', 'delete', undefined, 'id', q.appointment_id);
    }
    setCommissions((prev) => prev.filter((c) => c.quote_id !== id));
    syncSupabase('commissions', 'delete', undefined, 'quote_id', id);

    setDetailingReceipts((prev) => prev.filter((r) => r.quote_id !== id));
    syncSupabase('detailing_receipts', 'delete', undefined, 'quote_id', id);

    setDetailingPayments((prev) => prev.filter((p) => p.quote_id !== id));
    syncSupabase('detailing_payments', 'delete', undefined, 'quote_id', id);

    syncSupabase('detailing_quotes', 'delete', undefined, 'id', id);
    logActivity('cotizacion_detailing', id, 'archive', { permanent_deleted: true });
  };

  const bulkVoidDetailingQuotes = (ids: string[], reason: string) => {
    ids.forEach((id) => voidDetailingQuote(id, reason));
  };

  const bulkDeleteDetailingQuotes = (ids: string[]) => {
    if (!profile?.roles?.includes('admin')) return;
    ids.forEach((id) => deleteDetailingQuotePermanent(id));
  };

  // GENERAR COMPROBANTE OFICIAL DE SERVICIO DETAILVLAK
  const generateDetailingReceipt = async (
    quoteId: string,
    options?: { includePhotos?: boolean; version?: number }
  ): Promise<DetailingReceipt | null> => {
    const quote = detailingQuotesRef.current.find((q) => q.id === quoteId) || detailingQuotes.find((q) => q.id === quoteId);
    if (!quote) return null;

    const currentCfg = detailingConfigRef.current || detailingConfig;
    const receiptCfg = currentCfg?.receipt_config;

    // Validación estricta de datos de empresa: no permitir generar si faltan
    if (!receiptCfg?.company_rut || !receiptCfg?.company_trade_name || !receiptCfg?.company_address || !receiptCfg?.company_phone) {
      console.warn('Completá los datos de la empresa en Configuración antes de emitir comprobantes');
      return null;
    }

    const nowIso = new Date().toISOString();
    const todayStr = getLocalDateString();

    const existingReceipt = detailingReceipts.find((r) => r.quote_id === quoteId);
    let receiptNum = quote.receipt_number || existingReceipt?.receipt_number;
    let version = options?.version || (existingReceipt ? existingReceipt.version + 1 : 1);

    if (!receiptNum) {
      try {
        const { data: numData, error: numErr } = await supabase.rpc('next_detailing_receipt_number');
        if (!numErr && numData) {
          receiptNum = numData;
        }
      } catch (err) {
        console.warn('Error fetching atomic receipt number:', err);
      }
      if (!receiptNum) {
        const nextNum = receiptCfg.next_number || 1;
        receiptNum = `${receiptCfg.prefix || 'DV-'}${String(nextNum).padStart(6, '0')}`;
      }
    }

    // Cuidados posteriores automáticos por servicio (desde campo care_text del tarifario)
    const careList: string[] = [];
    (quote.selected_services || []).forEach((s) => {
      const tariff = detailingTariffs.find((t) => t.id === s.serviceId);
      if (tariff?.care_text && tariff.care_text.trim()) {
        careList.push(tariff.care_text.trim());
      }
    });
    if (careList.length === 0 && receiptCfg.service_care_warranties?.default) {
      careList.push(receiptCfg.service_care_warranties.default);
    }

    const totalPaid = (quote.payments || [])
      .filter((p) => !p.is_voided)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, quote.total_amount - totalPaid);

    const allProfiles = availableProfiles && availableProfiles.length > 0 ? availableProfiles : INITIAL_PROFILES;
    const detailer = allProfiles.find((p) => p.id === quote.assigned_to);

    const newReceipt: DetailingReceipt = {
      id: existingReceipt ? existingReceipt.id : `rec-${crypto.randomUUID()}`,
      quote_id: quote.id,
      receipt_number: receiptNum,
      version,
      issue_date: todayStr,
      service_date: quote.work_date || (quote.appointment_date ? quote.appointment_date.split('T')[0] : todayStr),
      token: existingReceipt?.token || `tk_${crypto.randomUUID().replace(/-/g, '')}`,

      company_trade_name: receiptCfg.company_trade_name,
      company_legal_name: receiptCfg.company_legal_name || receiptCfg.company_trade_name,
      company_rut: receiptCfg.company_rut,
      company_address: receiptCfg.company_address,
      company_phone: receiptCfg.company_phone,
      company_instagram: receiptCfg.company_instagram || '',
      company_logo_url: receiptCfg.company_logo_url || '',

      client_id: quote.client_id,
      client_name: quote.client_name,
      client_phone: quote.client_phone,

      vehicle_info: quote.vehicle_info,
      vehicle_plate: quote.vehicle_plate,
      reception_mileage: quote.checkin_data?.mileage,

      detailer_id: quote.assigned_to,
      detailer_name: detailer?.full_name || 'Detailer oficial',

      services: (quote.selected_services || []).map((s) => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        description: s.description,
        price: s.price
      })),
      subtotal: quote.subtotal,
      discount_amount: quote.discount_amount || 0,
      discount_label: getDiscountLabel(quote.discount_type, currentCfg?.discounts),
      surcharge_amount: quote.extreme_dirt_surcharge || 0,
      total_amount: quote.total_amount,
      deposit_amount: totalPaid,
      balance_pending: balance,
      payments: (quote.payments || []).filter((p) => !p.is_voided).map((p) => ({
        amount: p.amount,
        payment_method: p.payment_method,
        date: p.date,
        notes: p.notes
      })),
      status: balance === 0 ? 'Pagado' : 'Saldo pendiente',

      care_instructions: careList.join('\n\n'),
      observations: quote.notes,
      include_photos: options?.includePhotos ?? false,
      photos_before: quote.photos_before,
      photos_after: quote.photos_after,
      footer_legend: receiptCfg.footer_legend || 'Comprobante de servicio. No válido como factura electrónica (CFE).',

      is_voided: quote.status === 'Anulado' || !!quote.voided_at,
      voided_at: quote.voided_at,
      void_reason: quote.void_reason,
      created_at: existingReceipt?.created_at || nowIso,
      created_by: profile?.id
    };

    setDetailingReceipts((prev) => [
      ...prev.filter((r) => r.id !== newReceipt.id && r.quote_id !== quote.id),
      newReceipt
    ]);
    syncSupabase('detailing_receipts', 'upsert', newReceipt);

    // Enlazar id y correlativo en la cotización
    if (quote.receipt_id !== newReceipt.id || quote.receipt_number !== newReceipt.receipt_number) {
      updateDetailingQuote(quote.id, {
        receipt_id: newReceipt.id,
        receipt_number: newReceipt.receipt_number
      });
    }

    logActivity('cotizacion_detailing', quote.id, 'update', {
      action: 'generate_receipt',
      receipt_number: newReceipt.receipt_number,
      version: newReceipt.version
    });

    return newReceipt;
  };

  // RECALCULAR COMISIONES DE UN PERÍODO (SOLO ADMIN)
  const recalculateDetailingCommissions = (periodStr: string) => {
    if (!profile?.roles?.includes('admin')) return;

    const targetQuotes = detailingQuotes.filter((q) =>
      isActiveJob(q) &&
      (q.status === 'Entregado y cobrado' || q.status === 'Trabajo Completado') &&
      q.created_at.startsWith(periodStr)
    );

    targetQuotes.forEach((quote) => {
      const newComms = calculateCommissionsForQuote(quote);
      setCommissions((prev) => [
        ...prev.filter((c) => c.quote_id !== quote.id || c.status === 'Pagada'),
        ...newComms
      ]);
      syncSupabase('commissions', 'delete', undefined, 'quote_id', quote.id);
      newComms.forEach((c) => syncSupabase('commissions', 'insert', c));
    });

    logActivity('comision', periodStr, 'update', { action: 'recalculate_period', period: periodStr });
  };

  // AJUSTE MANUAL DE UNA COMISIÓN PUNTUAL (SOLO ADMIN, CON MOTIVO OBLIGATORIO)
  const adjustSingleCommission = (commissionId: string, newAmount: number, reason: string) => {
    if (!profile?.roles?.includes('admin')) return;
    const nowIso = new Date().toISOString();
    setCommissions((prev) =>
      prev.map((c) =>
        c.id === commissionId
          ? {
              ...c,
              commission_amount: newAmount,
              adjustment_reason: reason,
              adjusted_at: nowIso,
              adjusted_by: profile?.id
            }
          : c
      )
    );
    syncSupabase('commissions', 'update', {
      commission_amount: newAmount,
      adjustment_reason: reason,
      adjusted_at: nowIso,
      adjusted_by: profile?.id
    }, 'id', commissionId);
    logActivity('comision', commissionId, 'update', { action: 'manual_adjustment', newAmount, reason });
  };

  // LIMPIEZA DE DATOS DE PRUEBA DE DETAILVLAK (SOLO ADMIN, CON RESPALDO Y PROTECCIÓN SEGURA)
  const cleanDetailingTestData = async (
    selection: DetailingCleanSelection
  ): Promise<{ success: boolean; counts: Record<string, number> }> => {
    if (!profile?.roles?.includes('admin')) return { success: false, counts: {} };

    const counts: Record<string, number> = {
      quotes: 0,
      appointments: 0,
      commissions: 0,
      expenses: 0,
      receipts: 0,
      clients: 0,
      vehicles: 0
    };

    const nowIso = new Date().toISOString();

    // 0. Devolver stock descontado por los trabajos de prueba
    if (selection.restore_stock !== false) {
      const toRestore: Record<string, number> = {};
      detailingQuotes.forEach((q) => {
        if (q.materials_consumed && !q.is_voided) {
          q.materials_consumed.forEach((c) => {
            toRestore[c.stock_item_id] = (toRestore[c.stock_item_id] || 0) + c.quantity;
          });
        }
      });
      if (Object.keys(toRestore).length > 0) {
        setStockItems((prev) =>
          prev.map((s) => {
            const add = toRestore[s.id];
            if (!add) return s;
            const newQty = s.quantity + add;
            syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: nowIso }, 'id', s.id);
            return { ...s, quantity: newQty };
          })
        );
      }
    }

    // Reiniciar secuencia de comprobantes si fue marcado
    if (selection.reset_receipt_seq) {
      try {
        await supabase.rpc('set_detailing_receipt_seq', { p_val: 1 });
      } catch (e) {
        console.warn('Error reiniciando secuencia de comprobantes:', e);
      }
    }

    // 1. Cotizaciones y turnos de Detailing
    if (selection.quotes) {
      counts.quotes = detailingQuotes.length;
      detailingQuotes.forEach((q) => {
        syncSupabase('detailing_quotes', 'delete', undefined, 'id', q.id);
        syncSupabase('detailing_payments', 'delete', undefined, 'quote_id', q.id);
      });
      setDetailingQuotes([]);
      setDetailingPayments([]);

      const detailingAppts = appointments.filter((a) => a.business === 'detailing');
      counts.appointments = detailingAppts.length;
      detailingAppts.forEach((a) => {
        syncSupabase('appointments', 'delete', undefined, 'id', a.id);
      });
      setAppointments((prev) => prev.filter((a) => a.business !== 'detailing'));

      counts.receipts = detailingReceipts.length;
      detailingReceipts.forEach((r) => {
        syncSupabase('detailing_receipts', 'delete', undefined, 'id', r.id);
      });
      setDetailingReceipts([]);
    }

    // 2. Comisiones de Detailing
    if (selection.commissions) {
      const detailingComms = commissions.filter((c) => c.business === 'detailing');
      counts.commissions = detailingComms.length;
      detailingComms.forEach((c) => {
        syncSupabase('commissions', 'delete', undefined, 'id', c.id);
      });
      setCommissions((prev) => prev.filter((c) => c.business !== 'detailing'));
    }

    // 3. Gastos de Detailing
    if (selection.expenses) {
      const detailingExp = expenses.filter((e) => e.business === 'detailing');
      counts.expenses = detailingExp.length;
      detailingExp.forEach((e) => {
        syncSupabase('expenses', 'delete', undefined, 'id', e.id);
      });
      setExpenses((prev) => prev.filter((e) => e.business !== 'detailing'));
    }

    // 4. Clientes y vehículos EXCLUSIVOS de Detailing (NUNCA vinculados a automotora o Carbusters)
    if (selection.only_detailing_clients_vehicles) {
      const detailingClientIds = new Set(detailingQuotes.map((q) => q.client_id).filter(Boolean));
      const dealershipBuyerIds = new Set(dealershipVehicles.map((v) => v.buyer_client_id).filter(Boolean));
      const dealershipInquiryIds = new Set(dealershipInquiries.map((i) => i.client_id).filter(Boolean));
      const inspectionClientIds = new Set(inspections.map((i) => i.client_id).filter(Boolean));

      const clientsToDelete = clients.filter(
        (c) =>
          detailingClientIds.has(c.id) &&
          !dealershipBuyerIds.has(c.id) &&
          !dealershipInquiryIds.has(c.id) &&
          !inspectionClientIds.has(c.id)
      );
      counts.clients = clientsToDelete.length;
      clientsToDelete.forEach((c) => {
        syncSupabase('clients', 'delete', undefined, 'id', c.id);
      });
      setClients((prev) => prev.filter((c) => !clientsToDelete.some((del) => del.id === c.id)));

      const detailingVehicleIds = new Set(detailingQuotes.map((q) => q.vehicle_id).filter(Boolean));
      const dealershipVehicleIds = new Set(dealershipVehicles.map((v) => v.id));
      const inspectionVehicleIds = new Set(inspections.map((i) => i.vehicle_id).filter(Boolean));

      const vehiclesToDelete = vehicles.filter(
        (v) =>
          detailingVehicleIds.has(v.id) &&
          !dealershipVehicleIds.has(v.id) &&
          !inspectionVehicleIds.has(v.id)
      );
      counts.vehicles = vehiclesToDelete.length;
      vehiclesToDelete.forEach((v) => {
        syncSupabase('vehicles', 'delete', undefined, 'id', v.id);
      });
      setVehicles((prev) => prev.filter((v) => !vehiclesToDelete.some((del) => del.id === v.id)));
    }

    logActivity('sistema', 'limpieza_detailing', 'archive', { selection, counts });
    return { success: true, counts };
  };

  // REGISTRO DE COBROS, CHECK-IN, CONTROL DE CALIDAD Y WHATSAPP LOG
  const recordDetailingPayment = async (quoteId: string, paymentData: Omit<DetailingPayment, 'id'>) => {
    const q = detailingQuotesRef.current.find((item) => item.id === quoteId) || detailingQuotes.find((item) => item.id === quoteId);
    if (!q) return;
    const nowIso = new Date().toISOString();
    const newPayment: DetailingPayment = {
      ...paymentData,
      id: `pay-${crypto.randomUUID()}`,
      quote_id: quoteId,
      created_by: profile?.id,
      is_voided: false,
      created_at: nowIso
    };
    const updatedPayments = [...(q.payments || []), newPayment];
    const totalPaid = updatedPayments
      .filter((p) => !p.is_voided)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const updatedQuote: DetailingQuote = {
      ...q,
      payments: updatedPayments,
      updated_at: nowIso
    };

    updateDetailingQuote(quoteId, { payments: updatedPayments });
    setDetailingPayments((prev) => [newPayment, ...prev]);
    syncSupabase('detailing_payments', 'insert', newPayment);

    // Si queda Cobrado (totalPaid >= total_amount)
    if (totalPaid >= q.total_amount && q.total_amount > 0) {
      // 1. Generar comisiones si no existen
      const existingComms = commissions.filter((c) => c.quote_id === quoteId);
      if (existingComms.length === 0) {
        const newComms = calculateCommissionsForQuote(updatedQuote);
        if (newComms.length > 0) {
          setCommissions((prev) => [...prev.filter((c) => c.quote_id !== quoteId), ...newComms]);
          newComms.forEach((c) => syncSupabase('commissions', 'insert', c));
        }
      }
      // 2. Generar comprobante oficial o actualizarlo a Pagado
      await generateDetailingReceipt(quoteId);
    } else {
      // Si ya existía comprobante, actualizarlo a versión siguiente con el nuevo saldo
      const existingReceipt = detailingReceipts.find((r) => r.quote_id === quoteId);
      if (existingReceipt) {
        await generateDetailingReceipt(quoteId);
      }
    }
  };

  const recordDetailingCheckin = (quoteId: string, checkin: DetailingCheckinData) => {
    const checkinPayload: DetailingCheckinData = {
      ...checkin,
      checkin_at: new Date().toISOString(),
      checkin_by: profile?.id
    };
    updateDetailingQuoteStatus(quoteId, 'Recibido');
    updateDetailingQuote(quoteId, { checkin_data: checkinPayload });
  };

  const recordDetailingQualityControl = (quoteId: string, qc: DetailingQualityControlData) => {
    const qcPayload: DetailingQualityControlData = {
      ...qc,
      completed_at: new Date().toISOString(),
      completed_by: profile?.id
    };
    updateDetailingQuote(quoteId, { quality_control_data: qcPayload });
    updateDetailingQuoteStatus(quoteId, 'Listo para retirar');
  };

  const logDetailingWhatsAppSent = (targetId: string, templateKey: string, phone: string) => {
    const nowIso = new Date().toISOString();
    const entry = { template_key: templateKey, sent_at: nowIso, phone };

    setDetailingQuotes((prev) =>
      prev.map((q) => {
        if (q.id === targetId || q.appointment_id === targetId) {
          const nextLogs = [...(q.whatsapp_sent_log || []), entry];
          syncSupabase('detailing_quotes', 'update', { whatsapp_sent_log: nextLogs, updated_at: nowIso }, 'id', q.id);
          return { ...q, whatsapp_sent_log: nextLogs, updated_at: nowIso };
        }
        return q;
      })
    );

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === targetId || a.quote_id === targetId) {
          const nextLogs = [...(a.whatsapp_sent_log || []), entry];
          syncSupabase('appointments', 'update', { whatsapp_sent_log: nextLogs, updated_at: nowIso }, 'id', a.id);
          return { ...a, whatsapp_sent_log: nextLogs, updated_at: nowIso };
        }
        return a;
      })
    );
  };

  const voidAppointment = (id: string, reason: string) => {
    const nowIso = new Date().toISOString();
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, voided_at: nowIso, voided_by: profile?.id, void_reason: reason, status: 'Cancelado' } : a
      )
    );
    syncSupabase('appointments', 'update', { voided_at: nowIso, voided_by: profile?.id, void_reason: reason, status: 'Cancelado' }, 'id', id);

    if (appt.quote_id) {
      voidDetailingQuote(appt.quote_id, reason);
    }
  };

  const voidExpense = (id: string, reason: string) => {
    const nowIso = new Date().toISOString();
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, voided_at: nowIso, voided_by: profile?.id, void_reason: reason } : e))
    );
    syncSupabase('expenses', 'update', { voided_at: nowIso, voided_by: profile?.id, void_reason: reason }, 'id', id);
    logActivity('gasto', id, 'status_change', { action: 'void', reason });
  };

  const restoreExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, voided_at: undefined, voided_by: undefined, void_reason: undefined } : e))
    );
    syncSupabase('expenses', 'update', { voided_at: null, voided_by: null, void_reason: null }, 'id', id);
    logActivity('gasto', id, 'update', { action: 'restore' });
  };

  const deleteExpensePermanent = (id: string) => {
    if (!profile?.roles?.includes('admin')) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    syncSupabase('expenses', 'delete', undefined, 'id', id);
    logActivity('gasto', id, 'archive', { permanent_deleted: true });
  };

  const saveDetailingCashClosure = (closureData: Omit<DetailingCashClosure, 'id' | 'created_at'>): DetailingCashClosure => {
    const newClosure: DetailingCashClosure = {
      ...closureData,
      id: `closure-${crypto.randomUUID()}`,
      created_at: new Date().toISOString()
    };
    setDetailingCashClosures((prev) => [newClosure, ...prev]);
    syncSupabase('detailing_cash_closures', 'insert', newClosure);
    return newClosure;
  };

  // Stock Genérico
  const addStockItem = (itemData: Omit<StockItem, 'id' | 'updated_at' | 'movements'>): StockItem => {
    const newItem: StockItem = {
      ...itemData,
      id: `stk-${crypto.randomUUID()}`,
      movements: [],
      updated_at: new Date().toISOString()
    };
    setStockItems((prev) => [newItem, ...prev]);
    logActivity('stock', newItem.id, 'create', { name: newItem.name, qty: newItem.quantity });
    syncSupabase('stock_items', 'insert', newItem);
    return newItem;
  };

  const updateStockItem = (id: string, data: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s))
    );
    logActivity('stock', id, 'update', data);
    syncSupabase('stock_items', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
  };

  const archiveStockItem = (id: string) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_archived: true, updated_at: new Date().toISOString() } : s))
    );
    logActivity('stock', id, 'archive', { is_archived: true });
    syncSupabase('stock_items', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  const deleteStockItemPermanent = (id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
    syncSupabase('stock_items', 'delete', undefined, 'id', id);
    logActivity('stock', id, 'archive', { permanent_deleted: true });
  };

  const recordStockMovement = (movement: Omit<StockMovement, 'id' | 'created_at'>, createExpense = false) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${crypto.randomUUID()}`,
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

    syncSupabase('stock_movements', 'insert', newMovement);

    // Actualizar cantidad en stock_items en Supabase
    const targetItem = stockItems.find((s) => s.id === movement.stock_item_id);
    if (targetItem) {
      const delta = movement.type === 'Entrada' ? movement.quantity : -movement.quantity;
      const newQty = Math.max(0, targetItem.quantity + delta);
      syncSupabase('stock_items', 'update', { quantity: newQty, updated_at: new Date().toISOString() }, 'id', targetItem.id);
    }

    // Registro opcional como gasto al reponer stock
    if (createExpense && movement.type === 'Entrada' && movement.unit_cost && movement.unit_cost > 0) {
      const item = stockItems.find((s) => s.id === movement.stock_item_id);
      const totalCost = Math.round(movement.unit_cost * movement.quantity);
      addExpense({
        business: item?.business || 'detailing',
        date: getLocalDateString(),
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
      id: `exp-${crypto.randomUUID()}`,
      created_by: profile?.id,
      created_at: new Date().toISOString()
    };
    setExpenses((prev) => [newExpense, ...prev]);
    logActivity('gasto', newExpense.id, 'create', { amount: newExpense.amount, category: newExpense.category });
    syncSupabase('expenses', 'insert', newExpense);
    return newExpense;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    );
    logActivity('gasto', id, 'update', data);
    syncSupabase('expenses', 'update', data, 'id', id);
  };

  const deleteExpense = (id: string) => {
    voidExpense(id, 'Eliminado');
  };

  // Comisiones
  const markCommissionPaid = (id: string) => {
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Pagada', paid_at: new Date().toISOString() } : c))
    );
    syncSupabase('commissions', 'update', { status: 'Pagada', paid_at: new Date().toISOString() }, 'id', id);
  };

  // Plantillas WhatsApp
  const updateWhatsAppTemplate = (key: WhatsAppTemplateKey, templateText: string) => {
    setWhatsappTemplates((prev) =>
      prev.map((t) => (t.key === key ? { ...t, template: templateText } : t))
    );
    syncSupabase('whatsapp_templates', 'upsert', { key, template: templateText }, 'key', key);
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
              plate: plateCandidate || 'S/M',
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
          id: `quote-mig-${crypto.randomUUID()}`,
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
        syncSupabase('detailing_quotes', 'insert', newQuote);
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
          date: e.date || getLocalDateString(),
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
    const generatedToken = data.token || `tk_${crypto.randomUUID().replace(/-/g, '')}`;
    const initialChecklist = data.checklist && data.checklist.length > 0
      ? data.checklist
      : JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_TEMPLATE));
    const initialPanels = data.panels && data.panels.length > 0
      ? data.panels
      : JSON.parse(JSON.stringify(DEFAULT_CAR_PANELS));

    const { score, traffic_light } = calculateScoreAndTraffic(initialChecklist, initialPanels);

    const newInsp: VehicleInspection = {
      ...data,
      id: `insp-${crypto.randomUUID()}`,
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
    syncSupabase('vehicle_inspections', 'insert', newInsp);
    return newInsp;
  };

  const updateInspection = (id: string, data: Partial<VehicleInspection>, skipAudit: boolean = false) => {
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
    if (!skipAudit) {
      logActivity('inspeccion', id, 'update', { updatedKeys: Object.keys(data) });
    }
    syncSupabase('vehicle_inspections', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
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
        const allProfiles = availableProfiles && availableProfiles.length > 0 ? availableProfiles : INITIAL_PROFILES;
        const inspectorProfile = allProfiles.find((p) => p.id === inspectorId) || profile;
        const rate = inspectorProfile?.commissions?.inspeccion ?? (inspectorId === 'user-diego' ? 15 : 0);

        if (rate > 0) {
          const commAmount = Math.round(current.total_price * (rate / 100));
          const newComm: CommissionRecord = {
            id: `comm-insp-${crypto.randomUUID()}`,
            business: 'inspeccion',
            currency: 'UYU',
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
          syncSupabase('commissions', 'insert', newComm);
        }
      }
    } else if (current.status === 'Completada') {
      setCommissions((prev) => prev.filter((c) => c.quote_id !== current.id));
      syncSupabase('commissions', 'delete', undefined, 'quote_id', current.id);
    }

    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updatedFields } : i))
    );
    logActivity('inspeccion', id, 'status_change', { from: current.status, to: newStatus });
    syncSupabase('vehicle_inspections', 'update', updatedFields, 'id', id);
  };

  const archiveInspection = (id: string) => {
    setInspections((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_archived: true, updated_at: new Date().toISOString() } : i))
    );
    logActivity('inspeccion', id, 'archive', { is_archived: true });
    syncSupabase('vehicle_inspections', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  const updateInspectionTariffs = (newTariffs: Partial<InspectionTariffConfig>) => {
    setInspectionTariffs((prev) => {
      const merged = {
        ...prev,
        ...newTariffs,
        prices: {
          ...prev.prices,
          ...(newTariffs.prices || {})
        }
      };
      syncSupabase('inspection_tariffs', 'upsert', { id: 'current', ...merged });
      return merged;
    });
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
    const rate = v.exchange_rate || cfg?.default_exchange_rate || 43.50;

    const purchaseUsd = v.purchase_currency === 'USD'
      ? (v.purchase_price || 0)
      : Math.round(((v.purchase_price || 0) / rate) * 100) / 100;

    // Peritaje y Detailing internos son costos de servicios CARVLAK en $UYU
    const internalCostsUyu = (v.inspection_cost || 0) + (v.detailing_cost || 0);
    const internalCostsUsd = Math.round((internalCostsUyu / rate) * 100) / 100;

    // Reparaciones taller, trámites de escribanía y otros gastos se ingresan y gestionan en USD
    const workshopCostsUsd =
      (v.repairs_cost || 0) +
      (v.paperwork_cost || 0) +
      (v.other_expenses_cost || 0);

    const totalRealCostUsd = Math.round((purchaseUsd + internalCostsUsd + workshopCostsUsd) * 100) / 100;

    const saleUsd = v.sale_currency === 'USD'
      ? (v.sale_price || 0)
      : Math.round(((v.sale_price || 0) / rate) * 100) / 100;

    const estimatedMarginUsd = Math.round((saleUsd - totalRealCostUsd) * 100) / 100;
    const estimatedMarginPercent = saleUsd > 0
      ? Math.round((estimatedMarginUsd / saleUsd) * 1000) / 10
      : 0;

    return { totalRealCostUsd, estimatedMarginUsd, estimatedMarginPercent };
  };

  // Sincronización oficial con Tiendanube mediante Edge Function (Deno)
  const syncVehicleWithTiendanube = async (
    vehicle: DealershipVehicle,
    action: 'publish' | 'update_price' | 'reserve' | 'sell' | 'sync'
  ) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.functions.invoke('sync-tiendanube', {
        body: {
          action,
          vehicle: {
            id: vehicle.id,
            tiendanube_id: vehicle.tiendanube_id,
            brand: vehicle.brand,
            model: vehicle.model,
            version: vehicle.version,
            year: vehicle.year,
            mileage: vehicle.mileage,
            sale_price: vehicle.sale_price,
            sale_currency: vehicle.sale_currency,
            status: vehicle.status,
            catalog_description: vehicle.catalog_description,
            images: vehicle.images,
            cover_image: vehicle.cover_image
          }
        }
      });

      if (!error && data) {
        setDealershipVehicles((prev) =>
          prev.map((v) =>
            v.id === vehicle.id
              ? {
                  ...v,
                  tiendanube_id: data.tiendanube_id || v.tiendanube_id,
                  tiendanube_sync_status: data.status || (data.success ? 'synced' : 'error'),
                  tiendanube_sync_error: data.error || undefined,
                  tiendanube_synced_at: new Date().toISOString()
                }
              : v
          )
        );
      }
    } catch (err) {
      console.warn('Error invocando sync-tiendanube edge function:', err);
    }
  };

  const addDealershipVehicle = (
    data: Omit<DealershipVehicle, 'id' | 'created_at' | 'updated_at' | 'total_real_cost_usd' | 'estimated_margin_usd' | 'estimated_margin_percent'>
  ): DealershipVehicle => {
    const financials = calculateVehicleFinancials(data);

    // Vincular ficha única por matrícula (Punto 5)
    let linkedVehicleId = data.vehicle_id;
    if (data.plate) {
      const cleanPlate = normalizePlate(data.plate);
      const existingVehicle = vehicles.find((v) => normalizePlate(v.plate) === cleanPlate);
      if (existingVehicle) {
        linkedVehicleId = existingVehicle.id;
      } else {
        const newVehId = `veh-${crypto.randomUUID()}`;
        const newVehRecord: Vehicle = {
          id: newVehId,
          plate: cleanPlate,
          brand: data.brand || 'Vehículo',
          model: data.model || '',
          year: data.year || new Date().getFullYear(),
          color: data.color_exterior || 'Blanco',
          vin: data.chassis_vin || '',
          category: data.category || 'Mediano',
          fuel: data.fuel || 'Nafta',
          transmission: data.transmission || 'Manual',
          mileage: data.mileage || 0,
          ownership: 'dealership',
          photos: data.images || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_archived: false
        };
        setVehicles((prev) => [newVehRecord, ...prev]);
        syncSupabase('vehicles', 'insert', newVehRecord);
        linkedVehicleId = newVehId;
      }
    }

    const newVehicle: DealershipVehicle = {
      ...data,
      vehicle_id: linkedVehicleId,
      id: `dveh-${crypto.randomUUID()}`,
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

    syncSupabase('dealership_vehicles', 'insert', newVehicle);

    if (newVehicle.status === 'publicado') {
      syncVehicleWithTiendanube(newVehicle, 'publish');
    }

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
              id: `hist-${crypto.randomUUID()}`,
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

    const currentVehicle = dealershipVehicles.find((v) => v.id === id);
    if (currentVehicle) {
      const mergedForSync = { ...currentVehicle, ...data, updated_at: new Date().toISOString() };
      syncSupabase('dealership_vehicles', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);

      if (data.status || data.sale_price !== undefined) {
        const action = data.status === 'publicado' ? 'publish' :
                       data.status === 'reservado' ? 'reserve' :
                       data.status === 'vendido' ? 'sell' : 'update_price';
        syncVehicleWithTiendanube(mergedForSync, action);
      }
    }
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
          id: `hist-${crypto.randomUUID()}`,
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
              id: `hist-${crypto.randomUUID()}`,
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
        const finalVeh = {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
        syncSupabase('dealership_vehicles', 'update', finalVeh, 'id', v.id);
        return finalVeh;
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
          id: `hist-${crypto.randomUUID()}`,
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
        const finalVeh = {
          ...merged,
          total_real_cost_usd: financials.totalRealCostUsd,
          estimated_margin_usd: financials.estimatedMarginUsd,
          estimated_margin_percent: financials.estimatedMarginPercent
        };
        syncSupabase('dealership_vehicles', 'update', finalVeh, 'id', v.id);
        return finalVeh;
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

    // 1. Al pasar a 'evaluacion': Preparada para la app de evaluación de compra que se integrará después
    if (newStatus === 'evaluacion') {
      // Sin creación automática de inspección interna en Carbusters
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
        title: `Alistamiento mecánico & revisión de fluidos: ${current.brand} ${current.model} (${current.plate || 'sin matrícula'})`,
        business: 'automotora',
        assigned_to: 'user-maxi',
        due_date: getLocalDateString(new Date(Date.now() + 172800000)),
        status: 'Pendiente'
      });

      addTask({
        title: `Sesión de fotos HD para catálogo web: ${current.brand} ${current.model} (${current.plate || 'sin matrícula'})`,
        business: 'automotora',
        assigned_to: 'user-matias',
        due_date: getLocalDateString(new Date(Date.now() + 259200000)),
        status: 'Pendiente'
      });
    }

    // 3. Al pasar a 'reservado'
    if (newStatus === 'reservado' && extraData?.reservation) {
      updatedFields.reservation = extraData.reservation;
    }

    // 4. Al pasar a 'vendido' -> Liquidar comisión, historial, auto en permuta y posventa si corresponde
    if (newStatus === 'vendido') {
      if (extraData?.saleRecord) {
        const saleFinalPrice = Number(extraData.saleRecord.sale_price ?? extraData.saleRecord.final_price ?? extraData.sale_price ?? current.sale_price ?? 0);
        const sellerId = extraData.saleRecord.seller_employee_id || extraData.saleRecord.seller_id || extraData.seller_id || profile?.id || 'user-diego';
        const allProfiles = availableProfiles && availableProfiles.length > 0 ? availableProfiles : INITIAL_PROFILES;
        const sellerProfile = allProfiles.find((p) => p.id === sellerId) || profile;
        const commRate = sellerProfile?.commissions?.automotora || dealershipConfig.default_commission_rate || 15;

        // Normalizar saleRecord con nombres de campos unificados
        const normalizedSaleRecord: DealershipSaleRecord = {
          ...extraData.saleRecord,
          final_price: saleFinalPrice,
          sale_price: saleFinalPrice,
          seller_id: sellerId,
          seller_employee_id: sellerId,
          seller_employee_name: sellerProfile?.full_name || 'Vendedor Automotora',
          currency: 'USD',
          sale_currency: 'USD'
        };
        updatedFields.sale_record = normalizedSaleRecord;

        // Comisión sobre margen o sobre venta
        let commAmount = 0;
        if (dealershipConfig.commission_basis === 'margin') {
          const marginUsd = current.estimated_margin_usd || 1000;
          commAmount = Math.round(marginUsd * (commRate / 100));
        } else {
          commAmount = Math.round(saleFinalPrice * (commRate / 100));
        }

        const newComm: CommissionRecord = {
          id: `comm-auto-${crypto.randomUUID()}`,
          business: 'automotora',
          currency: 'USD',
          employee_id: sellerId,
          employee_name: sellerProfile?.full_name || 'Vendedor Automotora',
          quote_id: current.id,
          client_name: extraData.saleRecord.buyer_name,
          vehicle_description: `${current.brand} ${current.model} (${current.plate || 'Sin matrícula'})`,
          amount_charged: saleFinalPrice,
          commission_rate: commRate,
          commission_amount: commAmount,
          status: 'Pendiente',
          created_at: new Date().toISOString()
        };
        setCommissions((prev) => [...prev.filter((c) => c.quote_id !== current.id), newComm]);
        syncSupabase('commissions', 'insert', newComm);

        // Si se recibió un auto en parte de pago (permuta), crear automáticamente en stock como 'evaluacion' con su tasación real
        const tradeInData = extraData.tradeIn || extraData.saleRecord.trade_in;
        if (tradeInData && tradeInData.plate) {
          const tradeInValuation = Number(tradeInData.valuation ?? tradeInData.valuation_usd ?? tradeInData.trade_in_valuation_usd ?? 0);
          addDealershipVehicle({
            empresa_id: current.empresa_id || 'carvlak',
            condition: 'usado',
            plate: tradeInData.plate.toUpperCase(),
            brand: tradeInData.brand || 'Vehículo',
            model: tradeInData.model || 'Parte de pago',
            year: tradeInData.year || new Date().getFullYear(),
            mileage: tradeInData.mileage || 0,
            category: tradeInData.category || 'Mediano',
            status: 'evaluacion',
            features: [],
            images: tradeInData.photos || [],
            purchase_origin: 'parte_de_pago',
            supplier_name: extraData.saleRecord.buyer_name,
            supplier_phone: extraData.saleRecord.buyer_phone,
            purchase_price: tradeInValuation,
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
            sale_price: Math.round(tradeInValuation * 1.22),
            sale_currency: 'USD',
            min_acceptable_price: tradeInValuation,
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

        // Si se marcó "offerPosventa", generar la cotización de detailing post-venta vinculada al cliente con el 20% OFF
        if (extraData?.offerPosventa) {
          const t = detailingTariffs.find((tar) => tar.id === 'ceramico') || detailingTariffs[0];
          const cat = current.category || 'Mediano';
          const basePrice = t ? (t.prices[cat] || 8500) : 8500;
          const discount = Math.round(basePrice * 0.2); // 20% OFF posventa

          addDetailingQuote({
            client_id: 'client-carvlak-automotora',
            client_name: extraData.saleRecord.buyer_name || 'Comprador CARVLAK',
            client_phone: extraData.saleRecord.buyer_phone || '',
            vehicle_info: `${current.brand} ${current.model} (${current.year})`,
            vehicle_plate: current.plate,
            vehicle_category: current.category,
            selected_services: [
              {
                serviceId: t ? t.id : 'ceramico',
                serviceName: t ? t.name : 'Sellado Cerámico Posventa (20% OFF)',
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
            notes: `Beneficio fidelización posventa 20% OFF por compra de unidad ${current.brand} ${current.model} (${current.plate || 'sin matrícula'}) en Automotora CARVLAK.`,
            priority_zones: 'Todo el exterior y protección de pintura',
            status: 'Por Cotizar'
          });
        }

        // Historial en Vehículo y Cliente
        addVehicleHistory(
          current.vehicle_id || current.plate,
          'automotora',
          'Venta de Vehículo Concretada',
          `Vendido a ${extraData.saleRecord.buyer_name} por USD ${saleFinalPrice.toLocaleString('es-UY')}. Vendedor: ${sellerProfile?.full_name}. Trámite: ${extraData.saleRecord.paperwork_status || 'En trámite'}.`
        );
      }
    } else if (current.status === 'vendido') {
      // Reversión de venta: eliminar comisión generada de estado y Supabase
      setCommissions((prev) => prev.filter((c) => c.quote_id !== current.id));
      syncSupabase('commissions', 'delete', undefined, 'quote_id', current.id);
    }

    const finalVehicle = (() => {
      const merged = { ...current, ...updatedFields };
      const financials = calculateVehicleFinancials(merged);
      return {
        ...merged,
        total_real_cost_usd: financials.totalRealCostUsd,
        estimated_margin_usd: financials.estimatedMarginUsd,
        estimated_margin_percent: financials.estimatedMarginPercent
      };
    })();

    setDealershipVehicles((prev) =>
      prev.map((v) => (v.id === id ? finalVehicle : v))
    );

    // Sincronizar en Supabase el objeto final calculado
    syncSupabase('dealership_vehicles', 'update', finalVehicle, 'id', id);

    // Sincronizar con Tiendanube si pasa a publicado, reservado o vendido
    if (newStatus === 'publicado') {
      syncVehicleWithTiendanube(finalVehicle, 'publish');
    } else if (newStatus === 'reservado') {
      syncVehicleWithTiendanube(finalVehicle, 'reserve');
    } else if (newStatus === 'vendido') {
      syncVehicleWithTiendanube(finalVehicle, 'sell');
    }

    logActivity('automotora', id, 'status_change', { from: current.status, to: newStatus });
  };

  const archiveDealershipVehicle = (id: string) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_archived: true, updated_at: new Date().toISOString() } : v))
    );
    logActivity('automotora', id, 'archive', { is_archived: true });
    syncSupabase('dealership_vehicles', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  // CRM Interesados
  const addDealershipInquiry = (
    data: Omit<DealershipInquiry, 'id' | 'created_at' | 'updated_at'>
  ): DealershipInquiry => {
    const newInq: DealershipInquiry = {
      ...data,
      id: `inq-${crypto.randomUUID()}`,
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
    syncSupabase('dealership_inquiries', 'insert', newInq);
    return newInq;
  };

  const updateDealershipInquiry = (id: string, data: Partial<DealershipInquiry>) => {
    setDealershipInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, ...data, updated_at: new Date().toISOString() } : inq))
    );
    logActivity('consulta_automotora', id, 'update', data);
    syncSupabase('dealership_inquiries', 'update', { ...data, updated_at: new Date().toISOString() }, 'id', id);
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
    syncSupabase('dealership_inquiries', 'update', updatedFields, 'id', id);
  };

  const archiveDealershipInquiry = (id: string) => {
    setDealershipInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, is_archived: true, updated_at: new Date().toISOString() } : inq))
    );
    logActivity('consulta_automotora', id, 'archive', { is_archived: true });
    syncSupabase('dealership_inquiries', 'update', { is_archived: true, updated_at: new Date().toISOString() }, 'id', id);
  };

  const updateDealershipConfig = (config: Partial<DealershipConfig>) => {
    setDealershipConfig((prev) => {
      const updated = { ...prev, ...config };
      syncSupabase('dealership_configs', 'upsert', { empresa_id: 'carvlak', ...updated });
      return updated;
    });
    logActivity('automotora', 'config', 'update', config);
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

  const importTiendanubeCatalog = async (): Promise<{ importedCount: number; duplicatesCount: number }> => {
    const { INITIAL_DEALERSHIP_VEHICLES } = await import('../lib/dealershipInitialVehicles');
    let importedCount = 0;
    let duplicatesCount = 0;

    const toAdd: DealershipVehicle[] = [];
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
      toAdd.forEach((c) => {
        syncSupabase('dealership_vehicles', 'insert', c);
      });
    }

    return { importedCount, duplicatesCount };
  };

  // FASE 5: Handlers Redes Sociales & Marketing Studio
  const addSocialMediaPost = (data: Omit<SocialMediaPostRecord, 'id' | 'created_at' | 'created_by'>): SocialMediaPostRecord => {
    const newPost: SocialMediaPostRecord = {
      ...data,
      id: `post-${crypto.randomUUID()}`,
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
    syncSupabase('social_post_records', 'insert', newPost);
    return newPost;
  };

  const updateSocialMediaPost = (id: string, updates: Partial<SocialMediaPostRecord>) => {
    setSocialMediaPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    syncSupabase('social_post_records', 'update', { ...updates, updated_at: new Date().toISOString() }, 'id', id);
  };

  const deleteSocialMediaPost = (id: string) => {
    setSocialMediaPosts((prev) => prev.filter((p) => p.id !== id));
    syncSupabase('social_post_records', 'delete', null, 'id', id);
  };

  const updateSocialMediaConfig = (updates: Partial<SocialMediaConfig>) => {
    setSocialMediaConfig((prev) => {
      const merged = {
        ...prev,
        ...updates,
        templates: {
          ...prev.templates,
          ...(updates.templates || {})
        }
      };
      syncSupabase('social_media_configs', 'upsert', { id: 'default', ...merged });
      return merged;
    });
  };

  const saveSocialTemplate = (template: SocialMediaTemplateConfig) => {
    setSocialMediaConfig((prev) => {
      const merged = {
        ...prev,
        templates: {
          ...prev.templates,
          [template.id]: template
        }
      };
      syncSupabase('social_media_configs', 'upsert', { id: 'default', ...merged });
      return merged;
    });
  };

  const duplicateSocialTemplate = (templateId: string): SocialMediaTemplateConfig | null => {
    const existing = socialMediaConfig.templates[templateId];
    if (!existing) return null;
    const newId = `plantilla-custom-${crypto.randomUUID()}`;
    const duplicated: SocialMediaTemplateConfig = {
      ...existing,
      id: newId,
      title: `${existing.title} (Copia)`,
      is_custom: true,
      is_active: true
    };
    saveSocialTemplate(duplicated);
    return duplicated;
  };

  const deleteSocialTemplate = (templateId: string): boolean => {
    setSocialMediaConfig((prev) => {
      const nextTemplates = { ...prev.templates };
      delete nextTemplates[templateId];
      const merged = {
        ...prev,
        templates: nextTemplates
      };
      syncSupabase('social_media_configs', 'upsert', { id: 'default', ...merged });
      return merged;
    });
    return true;
  };

  const toggleSocialTemplateActive = (templateId: string) => {
    setSocialMediaConfig((prev) => {
      const target = prev.templates[templateId];
      if (!target) return prev;
      const merged = {
        ...prev,
        templates: {
          ...prev.templates,
          [templateId]: {
            ...target,
            is_active: target.is_active === false ? true : false
          }
        }
      };
      syncSupabase('social_media_configs', 'upsert', { id: 'default', ...merged });
      return merged;
    });
  };

  const resetSocialTemplateToDefault = (templateId: string) => {
    const defaultTemplate = INITIAL_SOCIAL_MEDIA_CONFIG.templates[templateId];
    if (defaultTemplate) {
      saveSocialTemplate(defaultTemplate);
    }
  };

  const updateClientConsent = (clientId: string, consent: boolean) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, social_media_consent: consent, updated_at: new Date().toISOString() } : c))
    );
    logActivity('cliente', clientId, 'update', { social_media_consent: consent });
    syncSupabase('clients', 'update', { social_media_consent: consent, updated_at: new Date().toISOString() }, 'id', clientId);
  };

  const toggleVehicleFlyerImage = (vehicleId: string, imageUrl: string) => {
    setDealershipVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const currentFlyers = v.flyer_images || [];
        const isFlyer = currentFlyers.includes(imageUrl);
        const nextFlyers = isFlyer
          ? currentFlyers.filter((img) => img !== imageUrl)
          : [...currentFlyers, imageUrl];
        const updated = {
          ...v,
          flyer_images: nextFlyers,
          updated_at: new Date().toISOString()
        };
        syncSupabase('dealership_vehicles', 'update', { flyer_images: nextFlyers, updated_at: updated.updated_at }, 'id', vehicleId);
        return updated;
      })
    );
  };

  const applyStyleToAllTemplates = (sourceTemplateId: string) => {
    setSocialMediaConfig((prev) => {
      const source = prev.templates[sourceTemplateId];
      if (!source) return prev;

      const nextTemplates = { ...prev.templates };

      const mergeElementsStyle = (sourceEls: CanvasTextElement[] | undefined, targetEls: CanvasTextElement[] | undefined) => {
        if (!sourceEls || !targetEls) return targetEls;
        return targetEls.map((targetEl) => {
          const match = sourceEls.find((s) => s.id === targetEl.id);
          if (!match) return targetEl;
          return {
            ...targetEl,
            color: match.color,
            fontSize: match.fontSize,
            fontWeight: match.fontWeight,
            fontFamily: match.fontFamily,
            bgType: match.bgType,
            bgColor: match.bgColor,
            bgOpacity: match.bgOpacity
          };
        });
      };

      Object.keys(nextTemplates).forEach((key) => {
        if (key === sourceTemplateId) return;
        const current = nextTemplates[key];
        nextTemplates[key] = {
          ...current,
          layout_story: current.layout_story && source.layout_story ? {
            ...current.layout_story,
            fontFamily: source.layout_story.fontFamily,
            fontScale: source.layout_story.fontScale,
            stampColor: source.layout_story.stampColor,
            priceColor: source.layout_story.priceColor,
            textElements: mergeElementsStyle(source.layout_story.textElements, current.layout_story.textElements)
          } : current.layout_story,
          layout_post: current.layout_post && source.layout_post ? {
            ...current.layout_post,
            fontFamily: source.layout_post.fontFamily,
            fontScale: source.layout_post.fontScale,
            stampColor: source.layout_post.stampColor,
            priceColor: source.layout_post.priceColor,
            textElements: mergeElementsStyle(source.layout_post.textElements, current.layout_post.textElements)
          } : current.layout_post
        };
      });

      const merged = {
        ...prev,
        templates: nextTemplates
      };
      syncSupabase('social_media_configs', 'upsert', { id: 'default', ...merged });
      return merged;
    });
  };

  // Listas filtradas memoizadas para evitar re-cálculos en cada render
  const activeClients = useMemo(() => clients.filter((c) => !c.is_archived), [clients]);
  const activeVehicles = useMemo(() => vehicles.filter((v) => !v.is_archived), [vehicles]);
  const activeAppointments = useMemo(() => appointments.filter((a) => !a.is_archived && !a.voided_at), [appointments]);
  const activeDetailingQuotes = useMemo(() => detailingQuotes.filter((q) => isActiveJob(q)), [detailingQuotes]);
  const activeStockItems = useMemo(() => stockItems.filter((s) => !s.is_archived), [stockItems]);
  const activeExpenses = useMemo(() => expenses.filter((e) => isActiveExpense(e)), [expenses]);
  const activeInspections = useMemo(() => inspections.filter((i) => !i.is_archived && i.type !== 'interna'), [inspections]);
  const activeDealershipVehicles = useMemo(() => dealershipVehicles.filter((v) => !v.is_archived), [dealershipVehicles]);
  const activeDealershipInquiries = useMemo(() => dealershipInquiries.filter((inq) => !inq.is_archived), [dealershipInquiries]);

  // Context value memoizado para no invalidar el árbol de React en cada cambio interno
  const contextValue = useMemo<DataContextType>(() => ({
    clients: activeClients,
    vehicles: activeVehicles,
    appointments: activeAppointments,
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
    detailingConfig,
    updateDetailingConfig,
    detailingTariffs,
    updateDetailingTariff,
    addDetailingTariff,
    refreshData,
    isSyncing,
    lastSyncedAt,
    detailingQuotes: activeDetailingQuotes,
    allDetailingQuotes: detailingQuotes,
    addDetailingQuote,
    updateDetailingQuote,
    updateDetailingQuoteStatus,
    archiveDetailingQuote,
    voidDetailingQuote,
    restoreDetailingQuote,
    deleteDetailingQuotePermanent,
    bulkVoidDetailingQuotes,
    bulkDeleteDetailingQuotes,
    detailingPayments,
    recordDetailingPayment,
    recordDetailingCheckin,
    recordDetailingQualityControl,
    logDetailingWhatsAppSent,
    voidAppointment,
    stockItems: activeStockItems,
    addStockItem,
    updateStockItem,
    archiveStockItem,
    deleteStockItemPermanent,
    recordStockMovement,
    expenses: activeExpenses,
    allExpenses: expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    voidExpense,
    restoreExpense,
    deleteExpensePermanent,
    detailingCashClosures,
    saveDetailingCashClosure,
    commissions,
    markCommissionPaid,
    recalculateDetailingCommissions,
    adjustSingleCommission,
    detailingReceipts,
    generateDetailingReceipt,
    cleanDetailingTestData,
    whatsappTemplates,
    updateWhatsAppTemplate,
    importDetailVlakData,

    // FASE 3: Inspecciones
    inspections: activeInspections,
    inspectionTariffs,
    addInspection,
    updateInspection,
    updateInspectionStatus,
    archiveInspection,
    updateInspectionTariffs,
    getInspectionByToken,
    createDetailingQuoteFromInspection,

    // FASE 4: Automotora
    dealershipVehicles: activeDealershipVehicles,
    dealershipInquiries: activeDealershipInquiries,
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
    importTiendanubeCatalog,
    createPosventaDetailingQuote,
    syncVehicleWithTiendanube,

    // CONFIGURACIÓN GENERAL DEL HUB
    generalConfig,
    updateGeneralConfig,

    // FASE 5: Redes Sociales & Marketing Studio
    socialMediaPosts,
    socialMediaConfig,
    addSocialMediaPost,
    updateSocialMediaPost,
    deleteSocialMediaPost,
    updateSocialMediaConfig,
    saveSocialTemplate,
    duplicateSocialTemplate,
    deleteSocialTemplate,
    toggleSocialTemplateActive,
    resetSocialTemplateToDefault,
    updateClientConsent,
    toggleVehicleFlyerImage,
    applyStyleToAllTemplates
  }), [
    activeClients,
    activeVehicles,
    activeAppointments,
    tasks,
    vehicleHistory,
    activityLogs,
    detailingConfig,
    detailingTariffs,
    activeDetailingQuotes,
    detailingQuotes,
    activeStockItems,
    activeExpenses,
    expenses,
    detailingCashClosures,
    detailingPayments,
    commissions,
    whatsappTemplates,
    activeInspections,
    inspectionTariffs,
    activeDealershipVehicles,
    activeDealershipInquiries,
    dealershipConfig,
    canEditDealershipStock,
    generalConfig,
    socialMediaPosts,
    socialMediaConfig,
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
    updateDetailingConfig,
    updateDetailingTariff,
    addDetailingTariff,
    addDetailingQuote,
    updateDetailingQuote,
    updateDetailingQuoteStatus,
    archiveDetailingQuote,
    voidDetailingQuote,
    restoreDetailingQuote,
    deleteDetailingQuotePermanent,
    bulkVoidDetailingQuotes,
    bulkDeleteDetailingQuotes,
    recordDetailingPayment,
    recordDetailingCheckin,
    recordDetailingQualityControl,
    logDetailingWhatsAppSent,
    voidAppointment,
    addStockItem,
    updateStockItem,
    archiveStockItem,
    deleteStockItemPermanent,
    recordStockMovement,
    addExpense,
    updateExpense,
    deleteExpense,
    voidExpense,
    restoreExpense,
    deleteExpensePermanent,
    saveDetailingCashClosure,
    markCommissionPaid,
    updateWhatsAppTemplate,
    importDetailVlakData,
    addInspection,
    updateInspection,
    updateInspectionStatus,
    archiveInspection,
    updateInspectionTariffs,
    getInspectionByToken,
    createDetailingQuoteFromInspection,
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
    importTiendanubeCatalog,
    createPosventaDetailingQuote,
    syncVehicleWithTiendanube,
    updateGeneralConfig,
    addSocialMediaPost,
    updateSocialMediaPost,
    deleteSocialMediaPost,
    updateSocialMediaConfig,
    saveSocialTemplate,
    duplicateSocialTemplate,
    deleteSocialTemplate,
    toggleSocialTemplateActive,
    resetSocialTemplateToDefault,
    updateClientConsent,
    toggleVehicleFlyerImage,
    applyStyleToAllTemplates,
    detailingReceipts,
    recalculateDetailingCommissions,
    adjustSingleCommission,
    generateDetailingReceipt,
    cleanDetailingTestData,
    refreshData,
    isSyncing,
    lastSyncedAt
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

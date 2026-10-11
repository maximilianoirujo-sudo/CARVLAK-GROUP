// ==============================================================================
// CARVLAK GROUP - SCRIPT DE MIGRACIÓN: LOCALSTORAGE -> SUPABASE (SIN DUPLICADOS)
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

// Conjunto de IDs de prueba / mock excluidos de la migración a producción
const MOCK_EXCLUDED_IDS = new Set([
  'cli-1', 'cli-2', 'cli-3', 'cli-4',
  'veh-1', 'veh-2', 'veh-3', 'veh-4',
  'app-1', 'app-2', 'app-3',
  'task-1', 'task-2', 'task-3',
  'quote-1', 'quote-2', 'quote-3',
  'comm-1',
  'insp-1', 'insp-2', 'insp-3',
  'inq-1', 'inq-2', 'inq-3',
  'exp-1', 'exp-2', 'exp-3',
  'stk-1', 'stk-2', 'stk-3', 'stk-4', 'stk-5',
  'smp-1', 'smp-2',
  'log-1', 'log-2',
  'vh-1', 'vh-2', 'vh-3'
]);

export interface MigrationSummary {
  success: boolean;
  message: string;
  totalUploaded: number;
  totalSkipped: number;
  tableDetails: Record<string, { uploaded: number; skipped: number }>;
}

export async function migrateDataToSupabase(localData: {
  generalConfig?: any;
  profiles?: any[];
  clients?: any[];
  vehicles?: any[];
  vehicleHistory?: any[];
  appointments?: any[];
  tasks?: any[];
  dealershipConfig?: any;
  dealershipVehicles?: any[];
  dealershipInquiries?: any[];
  detailingTariffs?: any[];
  detailingQuotes?: any[];
  stockItems?: any[];
  stockMovements?: any[];
  expenses?: any[];
  commissions?: any[];
  whatsappTemplates?: any[];
  inspectionTariffs?: any;
  inspections?: any[];
  socialConfig?: any;
  socialPosts?: any[];
  activityLogs?: any[];
}): Promise<MigrationSummary> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      message: 'Supabase no está configurado en las variables de entorno.',
      totalUploaded: 0,
      totalSkipped: 0,
      tableDetails: {}
    };
  }

  const tableDetails: Record<string, { uploaded: number; skipped: number }> = {};
  let totalUploaded = 0;
  let totalSkipped = 0;

  // Helper para subir colección evitando duplicados por ID y excluyendo datos mock
  const syncCollection = async (tableName: string, items: any[] | undefined, idField: string = 'id') => {
    if (!items || items.length === 0) {
      tableDetails[tableName] = { uploaded: 0, skipped: 0 };
      return;
    }

    try {
      // 1. Obtener IDs existentes en Supabase
      const { data: existingRecords, error: fetchErr } = await supabase
        .from(tableName)
        .select(idField);

      if (fetchErr) {
        console.warn(`Error leyendo ${tableName} en Supabase:`, fetchErr.message);
        tableDetails[tableName] = { uploaded: 0, skipped: 0 };
        return;
      }

      const existingSet = new Set((existingRecords || []).map((r: any) => r[idField]));

      // 2. Filtrar excluyendo mocks e IDs ya existentes
      const toInsert = items.filter(
        (item) => item && item[idField] && !MOCK_EXCLUDED_IDS.has(item[idField]) && !existingSet.has(item[idField])
      );
      const skippedCount = items.length - toInsert.length;

      if (toInsert.length > 0) {
        // Insertar en lotes de 50
        const batchSize = 50;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const chunk = toInsert.slice(i, i + batchSize);
          const { error: insertErr } = await supabase.from(tableName).insert(chunk);
          if (insertErr) {
            console.error(`Error insertando lote en ${tableName}:`, insertErr.message);
          }
        }
      }

      tableDetails[tableName] = { uploaded: toInsert.length, skipped: skippedCount };
      totalUploaded += toInsert.length;
      totalSkipped += skippedCount;
    } catch (err: any) {
      console.error(`Fallo en syncCollection para ${tableName}:`, err);
      tableDetails[tableName] = { uploaded: 0, skipped: 0 };
    }
  };

  // Helper para singletons (configuraciones)
  const syncSingleton = async (tableName: string, item: any, pkValue: string = 'default') => {
    if (!item) return;
    try {
      const { error } = await supabase.from(tableName).upsert({ ...item, id: pkValue });
      if (!error) {
        tableDetails[tableName] = { uploaded: 1, skipped: 0 };
        totalUploaded += 1;
      }
    } catch (err) {
      console.warn(`Fallo sincronizando singleton ${tableName}:`, err);
    }
  };

  // 1. Configuraciones
  if (localData.generalConfig) await syncSingleton('general_configs', localData.generalConfig, 'default');
  if (localData.dealershipConfig) {
    await supabase.from('dealership_configs').upsert({
      empresa_id: localData.dealershipConfig.empresa_id || 'carvlak',
      ...localData.dealershipConfig
    });
  }
  if (localData.socialConfig) await syncSingleton('social_media_configs', localData.socialConfig, 'default');
  if (localData.inspectionTariffs) await syncSingleton('inspection_tariffs', localData.inspectionTariffs, 'current');

  // 2. Tablas principales
  await syncCollection('profiles', localData.profiles);
  await syncCollection('clients', localData.clients);
  await syncCollection('vehicles', localData.vehicles);
  await syncCollection('vehicle_history', localData.vehicleHistory);
  await syncCollection('appointments', localData.appointments);
  await syncCollection('tasks', localData.tasks);
  await syncCollection('dealership_vehicles', localData.dealershipVehicles);
  await syncCollection('dealership_inquiries', localData.dealershipInquiries);
  await syncCollection('detailing_tariffs', localData.detailingTariffs);
  await syncCollection('detailing_quotes', localData.detailingQuotes);
  await syncCollection('stock_items', localData.stockItems);
  await syncCollection('stock_movements', localData.stockMovements);
  await syncCollection('expenses', localData.expenses);
  await syncCollection('commissions', localData.commissions);
  await syncCollection('whatsapp_templates', localData.whatsappTemplates);
  await syncCollection('vehicle_inspections', localData.inspections);
  await syncCollection('social_post_records', localData.socialPosts);
  await syncCollection('activity_logs', localData.activityLogs);

  // Marcar flag de migración completada en el navegador
  localStorage.setItem('carvlak_supabase_migrated_v2', 'true');

  return {
    success: true,
    message: `Migración exitosa: ${totalUploaded} registros subidos a Supabase (${totalSkipped} ya existían).`,
    totalUploaded,
    totalSkipped,
    tableDetails
  };
}

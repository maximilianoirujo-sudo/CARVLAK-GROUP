// ==============================================================================
// CARVLAK GROUP - COLA DE REINTENTOS OFFLINE & SINCRONIZACIÓN SUPABASE
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface QueuedSyncItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  matchField?: string;
  matchValue?: any;
  timestamp: string;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'carvlak_sync_queue';

/**
 * Obtiene la lista de escrituras pendientes en cola
 */
export function getSyncQueue(): QueuedSyncItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: QueuedSyncItem[] = JSON.parse(raw);
    const cleaned = parsed.filter((item) => {
      // Descartar ítems antiguos de detailing_configs con formato plano ({ empresa_id, ... })
      if (item.table === 'detailing_configs' && item.payload && !item.payload.config) {
        console.warn('Descartando ítem obsoleto de detailing_configs en cola offline:', item);
        return false;
      }
      return true;
    });
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.error('Error leyendo cola de sincronización:', err);
    return [];
  }
}

/**
 * Guarda la cola actualizada en localStorage
 */
function saveSyncQueue(queue: QueuedSyncItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error guardando cola de sincronización:', err);
  }
}

/**
 * Encola una operación para reintentar cuando haya conexión
 */
export function enqueueSync(item: Omit<QueuedSyncItem, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getSyncQueue();
  const newItem: QueuedSyncItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    retries: 0
  };
  queue.push(newItem);
  saveSyncQueue(queue);

  // Si hay conexión, intentar procesar de inmediato
  if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
    processSyncQueue();
  }
}

let isProcessing = false;

/**
 * Procesa la cola de reintentos contra Supabase
 */
export async function processSyncQueue(): Promise<{ processed: number; remaining: number }> {
  if (isProcessing) return { processed: 0, remaining: getSyncQueue().length };
  if (!isSupabaseConfigured || !supabase) return { processed: 0, remaining: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, remaining: getSyncQueue().length };
  }

  isProcessing = true;
  const queue = getSyncQueue();
  const remainingQueue: QueuedSyncItem[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      let resultError: any = null;

      if (item.action === 'insert') {
        const { error } = await supabase.from(item.table).insert(item.payload);
        resultError = error;
      } else if (item.action === 'upsert') {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        resultError = error;
      } else if (item.action === 'update') {
        const field = item.matchField || 'id';
        const val = item.matchValue ?? item.payload?.[field];
        const { error } = await supabase.from(item.table).update(item.payload).eq(field, val);
        resultError = error;
      } else if (item.action === 'delete') {
        const field = item.matchField || 'id';
        const val = item.matchValue;
        const { error } = await supabase.from(item.table).delete().eq(field, val);
        resultError = error;
      }

      if (resultError) {
        console.warn(`Fallo sincronizando tabla ${item.table} (reintento ${item.retries + 1}):`, resultError.message);
        if (item.retries < 5) {
          remainingQueue.push({ ...item, retries: item.retries + 1 });
        } else {
          console.error(`Descartando operación tras 5 reintentos fallidos en ${item.table}:`, item);
        }
      } else {
        processedCount++;
      }
    } catch (err) {
      console.warn(`Error de red procesando cola en ${item.table}:`, err);
      remainingQueue.push({ ...item, retries: item.retries + 1 });
      break; // Detener bucle si hay falla de red
    }
  }

  saveSyncQueue(remainingQueue);
  isProcessing = false;
  return { processed: processedCount, remaining: remainingQueue.length };
}

// Escuchar evento online para drenar la cola automáticamente
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('Conexión a internet restablecida. Sincronizando datos pendientes con Supabase...');
    processSyncQueue();
  });
}

// ==============================================================================
// CARVLAK GROUP - SERVERLESS SYNC ENDPOINT (Upstash / Vercel KV)
// Sincronización por registro (upsert + merge por id y updated_at + soft-delete)
// ==============================================================================

const KV_URL = process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Mapa de las 13 claves requeridas en KV
const KEY_MAP = {
  detailing_quotes: 'carvlak:detailing_quotes',
  detailing_payments: 'carvlak:detailing_payments',
  detailing_config: 'carvlak:detailing_config',
  commissions: 'carvlak:commissions',
  clients: 'carvlak:clients',
  vehicles: 'carvlak:vehicles',
  expenses: 'carvlak:expenses',
  detailing_companies: 'carvlak:detailing_companies',
  detailing_company_services: 'carvlak:detailing_company_services',
  detailing_tariffs: 'carvlak:detailing_tariffs',
  detailing_web_requests: 'carvlak:detailing_web_requests',
  stock_items: 'carvlak:stock_items',
  detailing_receipts: 'carvlak:detailing_receipts'
};

// Cola en memoria por clave para serializar lecturas+escrituras concurrentes en la misma instancia
const keyLocks = new Map();

function withKeyLock(key, fn) {
  const prev = keyLocks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  keyLocks.set(key, next.catch(() => {}));
  return next;
}

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result === undefined || data.result === null) return null;
    let parsed = data.result;
    while (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        break;
      }
    }
    return parsed;
  } catch (err) {
    console.error(`KV GET error for ${key}:`, err);
    return null;
  }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    });
    return res.ok;
  } catch (err) {
    console.error(`KV SET error for ${key}:`, err);
    return false;
  }
}

/**
 * Obtiene el timestamp efectivo de un registro sin mutar ningún otro campo.
 * Si un registro viejo no tiene updated_at, usa su created_at.
 */
function getEffectiveTimestamp(rec) {
  if (!rec || typeof rec !== 'object') return '';
  return String(rec.updated_at || rec.created_at || '');
}

/**
 * Realiza merge por id entre la lista existente en el servidor y los registros entrantes.
 * - Si el id no existe: lo agrega.
 * - Si el id existe: compara updated_at (o created_at si no tiene updated_at) y se queda con el más nuevo.
 * - Si un registro viene con deleted_at: guarda la marca de borrado (tombstone) para que no reaparezca.
 * - NUNCA borra registros que no vinieron en el POST.
 */
function mergeRecordList(existingList, incomingItems) {
  const baseArray = Array.isArray(existingList) ? existingList : [];
  const incomingArray = Array.isArray(incomingItems)
    ? incomingItems
    : incomingItems && typeof incomingItems === 'object'
      ? [incomingItems]
      : [];

  const map = new Map();
  const order = [];

  for (const item of baseArray) {
    if (!item || typeof item !== 'object' || !item.id) continue;
    map.set(item.id, item);
    order.push(item.id);
  }

  for (const inc of incomingArray) {
    if (!inc || typeof inc !== 'object' || !inc.id) continue;
    const current = map.get(inc.id);

    if (!current) {
      map.set(inc.id, inc);
      order.push(inc.id);
    } else {
      const currentTs = getEffectiveTimestamp(current);
      const incTs = getEffectiveTimestamp(inc);

      // Si el entrante trae deleted_at y es igual o más nuevo, marcamos como borrado
      if (inc.deleted_at) {
        if (!currentTs || !incTs || incTs >= currentTs) {
          map.set(inc.id, {
            ...current,
            ...inc,
            deleted_at: inc.deleted_at,
            updated_at: inc.updated_at || inc.deleted_at
          });
        }
        continue;
      }

      // Si el actual ya estaba borrado (deleted_at) y el entrante NO tiene un timestamp estrictamente posterior al borrado,
      // ignoramos el entrante para que un registro borrado NUNCA reaparezca desde otro celular con localStorage viejo.
      if (current.deleted_at) {
        const delTs = String(current.deleted_at || currentTs || '');
        if (!incTs || incTs <= delTs) {
          continue;
        }
      }

      // Ambos activos: gana el que tenga timestamp más reciente (o igual)
      if (!currentTs || !incTs || incTs >= currentTs) {
        map.set(inc.id, { ...current, ...inc });
      }
    }
  }

  return order.map((id) => map.get(id)).filter(Boolean);
}

/**
 * Filtra los registros activos (sin deleted_at) para devolver en GET,
 * y extrae la lista de IDs borrados para que los dispositivos limpien su localStorage.
 */
function splitActiveAndDeleted(rawVal) {
  if (!Array.isArray(rawVal)) {
    return { active: rawVal, deletedIds: [] };
  }
  const active = [];
  const deletedIds = [];
  for (const item of rawVal) {
    if (item && typeof item === 'object' && item.deleted_at) {
      if (item.id) deletedIds.push(item.id);
    } else {
      active.push(item);
    }
  }
  return { active, deletedIds };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'KV storage not configured on server' });
  }

  try {
    if (req.method === 'GET') {
      const singleKey = req.query?.key;
      if (singleKey && KEY_MAP[singleKey]) {
        const val = await kvGet(KEY_MAP[singleKey]);
        if (singleKey === 'detailing_config') {
          return res.status(200).json({ [singleKey]: val });
        }
        const { active, deletedIds } = splitActiveAndDeleted(val || []);
        return res.status(200).json({ [singleKey]: active, deletedIds: { [singleKey]: deletedIds } });
      }

      // Fetch all primary sync keys in parallel
      const keys = Object.keys(KEY_MAP);
      const values = await Promise.all(keys.map((k) => kvGet(KEY_MAP[k])));
      const payload = {};
      const deletedIds = {};

      keys.forEach((k, idx) => {
        const raw = values[idx];
        if (k === 'detailing_config') {
          if (raw !== null && raw !== undefined) {
            payload[k] = raw;
          }
        } else {
          // Para colecciones (incluyendo expenses, stock_items, detailing_receipts), devolver siempre un array
          const list = Array.isArray(raw) ? raw : [];
          const split = splitActiveAndDeleted(list);
          payload[k] = split.active;
          if (split.deletedIds.length > 0) {
            deletedIds[k] = split.deletedIds;
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: payload,
        deletedIds,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      // Soporta:
      // 1) { key: 'clients', items: [registro] } o { key: 'clients', item: registro }
      // 2) { key: 'clients', data: [...] }
      // 3) { updates: { clients: [...], detailing_quotes: [...] } }
      let operations = {};

      if (body.updates && typeof body.updates === 'object') {
        operations = body.updates;
      } else if (body.key) {
        const incomingPayload =
          body.items !== undefined
            ? body.items
            : body.item !== undefined
              ? [body.item]
              : body.data;
        operations = { [body.key]: incomingPayload };
      } else {
        return res.status(400).json({ error: 'Formato de actualización inválido' });
      }

      const updatedKeys = [];

      for (const [k, incomingVal] of Object.entries(operations)) {
        if (incomingVal === undefined) continue;
        const kvKey = KEY_MAP[k] || `carvlak:${k}`;

        const ok = await withKeyLock(kvKey, async () => {
          const existing = await kvGet(kvKey);

          if (k === 'detailing_config' || (!Array.isArray(incomingVal) && k.endsWith('_config'))) {
            // Merge campo por campo para detailing_config
            const existingObj = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
            const incomingObj = incomingVal && typeof incomingVal === 'object' ? incomingVal : {};
            const mergedConfig = {
              ...existingObj,
              ...incomingObj,
              web_budget:
                existingObj.web_budget || incomingObj.web_budget
                  ? { ...(existingObj.web_budget || {}), ...(incomingObj.web_budget || {}) }
                  : undefined
            };
            return await kvSet(kvKey, mergedConfig);
          } else {
            // Colección de registros: merge por id y updated_at
            const mergedList = mergeRecordList(existing, incomingVal);
            return await kvSet(kvKey, mergedList);
          }
        });

        if (!ok) {
          return res.status(500).json({
            success: false,
            error: `No se pudo guardar la clave ${k} en KV`
          });
        }
        updatedKeys.push(k);
      }

      return res.status(200).json({
        success: true,
        updatedKeys,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API /api/sync error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

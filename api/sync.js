// ==============================================================================
// CARVLAK GROUP - SERVERLESS SYNC ENDPOINT (Upstash / Vercel KV)
// Permite sincronizar en tiempo real presupuestos, cobros, comisiones y configuración
// entre la computadora de Maximiliano y los celulares de Romina y el equipo.
// ==============================================================================

const KV_URL = process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Mapa de claves de la app a prefijo namespaced en KV
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
  detailing_web_requests: 'carvlak:detailing_web_requests'
};

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
      const singleKey = req.query.key;
      if (singleKey && KEY_MAP[singleKey]) {
        const val = await kvGet(KEY_MAP[singleKey]);
        return res.status(200).json({ [singleKey]: val });
      }

      // Fetch all primary sync keys in parallel
      const keys = Object.keys(KEY_MAP);
      const values = await Promise.all(keys.map(k => kvGet(KEY_MAP[k])));
      const payload = {};
      keys.forEach((k, idx) => {
        if (values[idx] !== null && values[idx] !== undefined) {
          payload[k] = values[idx];
        }
      });

      return res.status(200).json({
        success: true,
        data: payload,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      
      // Puede recibir { updates: { detailing_quotes: [...], ... } } o { key: 'detailing_quotes', data: [...] }
      const updates = body.updates || (body.key ? { [body.key]: body.data } : null);

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Formato de actualización inválido' });
      }

      const savePromises = [];
      for (const [k, val] of Object.entries(updates)) {
        const kvKey = KEY_MAP[k] || `carvlak:${k}`;
        if (val !== undefined) {
          savePromises.push(kvSet(kvKey, val));
        }
      }

      await Promise.all(savePromises);

      return res.status(200).json({
        success: true,
        updatedKeys: Object.keys(updates),
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('API /api/sync error:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

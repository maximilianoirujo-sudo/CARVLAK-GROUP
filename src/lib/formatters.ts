// ==============================================================================
// CARVLAK GROUP - FORMATEADORES & UTILIDADES
// ==============================================================================

import { Currency, Business, DetailingOriginCommissionRule, DetailingConfig, DetailingQuote, CommissionRecord } from '../types';

/**
 * Formatea montos en Pesos Uruguayos ($UYU) con separadores de miles estándar uruguayo
 * Ejemplo: 15000 -> "$U 15.000"
 * En USD: 24500 -> "USD 24.500"
 */
export function formatCurrency(amount: number, currency: Currency = 'UYU'): string {
  const rounded = Math.round(amount || 0);
  const formatted = rounded.toLocaleString('es-UY');

  if (currency === 'USD') {
    return `USD ${formatted}`;
  }
  return `$U ${formatted}`;
}

/**
 * Normaliza matrículas uruguayas (mayúsculas, con espacio estándar entre letras y números)
 * Ejemplo: "sbx1234" -> "SBX 1234", "s-b-x 1234" -> "SBX 1234"
 */
export function normalizePlate(input: string): string {
  if (!input) return '';
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length > 3) {
    const letters = clean.slice(0, 3);
    const numbers = clean.slice(3, 7);
    return `${letters} ${numbers}`.trim();
  }
  return clean;
}

/**
 * Normaliza teléfonos celulares de Uruguay a formato internacional de WhatsApp
 * Ejemplo: "099 123 456" -> "59899123456"
 * Ejemplo: "+598 98 123456" -> "59898123456"
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');

  if (digits.startsWith('09')) {
    digits = '598' + digits.substring(1);
  } else if (digits.startsWith('9') && digits.length === 8) {
    digits = '598' + digits;
  }
  return digits;
}

/**
 * Genera el mensaje oficial pre-armado de recordatorio de turno para WhatsApp
 */
export function generateAppointmentWhatsAppMessage(
  business: Business,
  clientName: string,
  vehicleInfo: string,
  dateStr: string,
  timeStr: string,
  serviceName: string
): string {
  const businessNames = {
    automotora: 'CARVLAK Automotores',
    detailing: 'DetailVlak',
    inspeccion: 'Carbusters'
  };

  const businessName = businessNames[business] || 'CARVLAK Group';
  const address = 'Av. Giannattasio, Shangrilá, Canelones';

  return `¡Hola ${clientName}! Te escribimos de *${businessName}* 🚗✨\n\nTe recordamos tu turno agendado para tu *${vehicleInfo}*:\n📅 *Fecha:* ${dateStr}\n⏰ *Hora:* ${timeStr} hs\n📌 *Servicio:* ${serviceName}\n📍 *Ubicación:* ${address}\n\n¿Nos confirmas tu asistencia? ¡Quedamos a las órdenes!\n\n*Equipo de ${businessName}*`;
}

/**
 * Configuración visual por negocio: Sin colores individuales, diferenciados por ícono y tonos de gris
 */
export const BUSINESS_CONFIG: Record<Business, { name: string; shortName: string; color: string; bgLight: string; textClass: string; borderClass: string; iconName: string }> = {
  automotora: {
    name: 'CARVLAK Automotores',
    shortName: 'Automotora',
    color: '#161616',
    bgLight: 'bg-[#F5F5F4]',
    textClass: 'text-[#161616]',
    borderClass: 'border-[#E5E5E3]',
    iconName: 'Car'
  },
  detailing: {
    name: 'DetailVlak Shangrilá',
    shortName: 'Detailing',
    color: '#161616',
    bgLight: 'bg-[#F5F5F4]',
    textClass: 'text-[#161616]',
    borderClass: 'border-[#E5E5E3]',
    iconName: 'Droplets'
  },
  inspeccion: {
    name: 'Carbusters',
    shortName: 'Carbusters',
    color: '#161616',
    bgLight: 'bg-[#F5F5F4]',
    textClass: 'text-[#161616]',
    borderClass: 'border-[#E5E5E3]',
    iconName: 'ClipboardCheck'
  }
};

/**
 * Extrae partes de fecha y hora directamente en la zona horaria 'America/Montevideo' (-03:00)
 * garantizando cero desfases sin importar la zona horaria del navegador o del servidor.
 */
export function getUruguayParts(inputDate?: Date | string | number) {
  let d: Date;
  if (!inputDate) {
    d = new Date();
  } else if (typeof inputDate === 'string' && inputDate.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    // Para YYYY-MM-DD forzamos mediodía de Uruguay para evitar saltos
    d = new Date(`${inputDate}T12:00:00-03:00`);
  } else {
    d = new Date(inputDate);
  }
  if (isNaN(d.getTime())) d = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  return {
    year: map.year || '2026',
    month: map.month || '01',
    day: map.day || '01',
    hour: map.hour === '24' ? '00' : map.hour || '00',
    minute: map.minute || '00',
    second: map.second || '00'
  };
}

/**
 * Obtiene la fecha en formato YYYY-MM-DD en la zona horaria de Uruguay (America/Montevideo, UTC-3),
 * evitando el desfase de toISOString() que después de las 21:00 hs salta al día siguiente.
 */
export function getLocalDateString(inputDate?: Date | string | number): string {
  const p = getUruguayParts(inputDate);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Obtiene el mes actual o de la fecha en formato YYYY-MM en zona horaria de Uruguay
 */
export function getLocalMonthString(inputDate?: Date | string | number): string {
  const p = getUruguayParts(inputDate);
  return `${p.year}-${p.month}`;
}

/**
 * Obtiene el rango de fechas (inicio y fin) de un mes en formato YYYY-MM-DD local
 */
export function getLocalMonthRange(monthString?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const [yearStr, monthStr] = (monthString || getLocalMonthString(now)).split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Combina fecha (YYYY-MM-DD) y hora (HH:mm) en un string ISO con zona horaria de Uruguay (-03:00).
 * Se guarda como YYYY-MM-DDTHH:mm:00-03:00 para garantizar coherencia en PostgreSQL y Supabase.
 */
export function combineLocalDateAndTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim().slice(0, 10);
  const cleanTime = timeStr.trim();
  const timeWithSec = cleanTime.length === 5 
    ? `${cleanTime}:00` 
    : cleanTime.length >= 8 
      ? cleanTime.slice(0, 8) 
      : `${cleanTime.padStart(5, '0')}:00`;
  return `${cleanDate}T${timeWithSec}-03:00`;
}

/**
 * Formatea una hora en formato HH:mm utilizando explícitamente la zona horaria 'America/Montevideo'.
 */
export function formatLocalTime(inputDate: Date | string | number): string {
  if (!inputDate) return '';
  const p = getUruguayParts(inputDate);
  return `${p.hour}:${p.minute}`;
}

/**
 * Formatea una fecha local para visualización en español de Uruguay
 */
export function formatLocalDate(inputDate: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  if (!inputDate) return '';
  const d = typeof inputDate === 'string' && inputDate.length === 10
    ? new Date(inputDate + 'T12:00:00')
    : new Date(inputDate);
  return d.toLocaleDateString('es-UY', {
    timeZone: 'America/Montevideo',
    ...(options || { day: '2-digit', month: '2-digit', year: 'numeric' })
  });
}

/**
 * Valida si un número corresponde a un teléfono móvil o fijo de Uruguay
 * Celular: 09X XXX XXX (9 dígitos) o +598 9X XXX XXX
 * Fijo: 2XXX XXXX o 4XXX XXXX (8 dígitos)
 */
export function validateUruguayanPhone(phone: string): { isValid: boolean; error?: string } {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: false, error: 'El teléfono es obligatorio' };
  }
  const digits = trimmed.replace(/[^0-9]/g, '');

  // Celular con 09 (9 dígitos)
  if (digits.startsWith('09') && digits.length === 9) {
    return { isValid: true };
  }
  // Celular con prefijo internacional 5989 (11 dígitos)
  if (digits.startsWith('5989') && digits.length === 11) {
    return { isValid: true };
  }
  // Celular sin 0 inicial (8 dígitos: 9X XXX XXX)
  if (digits.startsWith('9') && digits.length === 8) {
    return { isValid: true };
  }
  // Fijo Montevideo/Canelones (2XXX XXXX, 8 dígitos) o Interior (4XXX XXXX, 8 dígitos)
  if ((digits.startsWith('2') || digits.startsWith('4')) && digits.length === 8) {
    return { isValid: true };
  }
  // Fijo con código país 598 (10 dígitos)
  if (digits.startsWith('598') && (digits.length === 10 || digits.length === 11)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Ingresá un teléfono uruguayo válido (ej: 099 123 456 o 2682 1234)'
  };
}

/**
 * Valida matrícula uruguaya estándar (3 letras y 4 números, o 3 y 3 para motos)
 * Ej: SBX 1234 o SBC 123
 */
export function validateUruguayanPlate(plate: string): { isValid: boolean; error?: string } {
  const trimmed = plate.trim();
  if (!trimmed) {
    return { isValid: false, error: 'La matrícula es obligatoria' };
  }
  const clean = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 3 letras y 4 números (autos estándar y Mercosur)
  if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    return { isValid: true };
  }
  // 3 letras y 3 números (motos)
  if (/^[A-Z]{3}[0-9]{3}$/.test(clean)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Formato de matrícula uruguaya inválido (ej: SBX 1234)'
  };
}

/**
 * Valida cédula de identidad uruguaya mediante algoritmo oficial del dígito verificador
 * Coeficientes: 2, 9, 8, 7, 6, 3, 4
 */
export function validateUruguayanCedula(cedula: string): { isValid: boolean; error?: string } {
  const trimmed = cedula.trim();
  if (!trimmed) {
    return { isValid: true }; // Opcional si está vacía
  }
  const digits = trimmed.replace(/[^0-9]/g, '');

  if (digits.length < 7 || digits.length > 8) {
    return {
      isValid: false,
      error: 'La cédula debe contener entre 7 y 8 dígitos (ej: 4.582.119-4)'
    };
  }

  const clean = digits.padStart(8, '0');
  const coef = [2, 9, 8, 7, 6, 3, 4];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(clean[i], 10) * coef[i];
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(clean[7], 10);

  if (checkDigit !== lastDigit) {
    return {
      isValid: false,
      error: 'Cédula uruguaya inválida (dígito verificador incorrecto)'
    };
  }

  return { isValid: true };
}

/**
 * Helper universal para verificar si un trabajo o cotización está activo (no archivado y no anulado)
 */
export function isActiveJob(job: { is_archived?: boolean; voided_at?: string; is_voided?: boolean; status?: string } | null | undefined): boolean {
  if (!job) return false;
  return !job.is_archived && !job.voided_at && !job.is_voided && job.status !== 'Anulado';
}

/**
 * Helper universal para verificar si un gasto está activo (no archivado y no anulado)
 */
export function isActiveExpense(expense: { is_archived?: boolean; voided_at?: string; is_voided?: boolean; status?: string } | null | undefined): boolean {
  if (!expense) return false;
  return !expense.is_archived && !expense.voided_at && !expense.is_voided && expense.status !== 'Anulado';
}

/**
 * Helper universal para verificar si un pago o cobro está activo (no anulado, no archivado, status no anulado)
 */
export function isActivePayment(payment: { is_archived?: boolean; voided_at?: string; is_voided?: boolean; status?: string } | null | undefined): boolean {
  if (!payment) return false;
  return !payment.is_archived && !payment.voided_at && !payment.is_voided && payment.status !== 'Anulado' && payment.status !== 'voided';
}

/**
 * Convierte "HH:mm" a minutos desde medianoche (ej: "08:30" -> 510)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a "HH:mm" (ej: 510 -> "08:30")
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(Math.max(0, minutes) / 60) % 24;
  const m = Math.floor(Math.max(0, minutes) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Suma minutos a un ISO string de fecha u hora y devuelve un nuevo ISO en hora de Uruguay (-03:00)
 */
export function addMinutesToIso(isoString: string, minutesToAdd: number): string {
  const d = new Date(isoString);
  const updated = new Date(d.getTime() + minutesToAdd * 60000);
  const p = getUruguayParts(updated);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00-03:00`;
}

/**
 * Obtiene la clave del día de la semana en inglés para el schedule (monday..sunday)
 */
export function getDayOfWeekKey(dateStr: string): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' {
  // Asegurar formato YYYY-MM-DD
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const dayIdx = dateObj.getDay(); // 0 es domingo
  const keys: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return keys[dayIdx] as any;
}

/**
 * Mapea cualquier estado antiguo o legado hacia el nuevo flujo unificado:
 * Presupuesto → Agendado → En taller → Listo para retirar → Entregado (Cancelado / No vino / Anulado)
 */
export function mapOldStatusToNew(oldStatus?: string | null): string {
  if (!oldStatus) return 'Presupuesto';
  switch (oldStatus) {
    case 'Por Cotizar':
    case 'Presupuesto Enviado':
      return 'Presupuesto';
    case 'Turno Confirmado':
    case 'Confirmado':
      return 'Agendado';
    case 'Recibido':
    case 'En proceso':
    case 'Control de calidad':
      return 'En taller';
    case 'Trabajo Completado':
    case 'Entregado y cobrado':
      return 'Entregado';
    default:
      return oldStatus;
  }
}

/**
 * Devuelve un texto legible para el tipo de descuento aplicado
 * Ej: 'combo_10' -> 'Combo 10%'
 */
export function getDiscountLabel(discountType?: string, discountsConfig?: { id: string; label: string }[]): string {
  if (!discountType || discountType === 'none') return '';
  if (discountsConfig && discountsConfig.length > 0) {
    const found = discountsConfig.find((d) => d.id === discountType);
    if (found) return found.label;
  }
  if (discountType === 'combo_10') return 'Combo 10%';
  if (discountType === 'special_15') return 'Especial 15%';
  if (discountType === 'fixed') return 'Descuento fijo';
  return discountType;
}

/**
 * Calcula el estado de cobro automático de un trabajo:
 * "Cobrado" (pagado >= total), "Cobro parcial" (pagado > 0 y < total), "Pendiente de cobro" (pagado == 0)
 */
export function getDetailingPaymentStatus(quote: { total_amount: number; payments?: { amount: number; is_voided?: boolean; voided_at?: string; is_archived?: boolean; status?: string }[] }): 'Cobrado' | 'Cobro parcial' | 'Pendiente de cobro' {
  if (!quote) return 'Pendiente de cobro';
  const total = Number(quote.total_amount) || 0;
  const paid = (quote.payments || [])
    .filter(isActivePayment)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  if (paid >= total && total > 0) return 'Cobrado';
  if (paid > 0) return 'Cobro parcial';
  return 'Pendiente de cobro';
}

/**
 * Devuelve el total efectivamente cobrado (no anulado) de un trabajo
 */
export function getDetailingPaidAmount(quote: { payments?: { amount: number; is_voided?: boolean; voided_at?: string; is_archived?: boolean; status?: string }[] }): number {
  if (!quote?.payments) return 0;
  return quote.payments
    .filter(isActivePayment)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/**
 * Verifica si un trabajo tiene fecha futura respecto al día de hoy en Uruguay
 */
export function isJobScheduled(workDate?: string): boolean {
  if (!workDate) return false;
  const today = getLocalDateString();
  return workDate.slice(0, 10) > today;
}

/**
 * Normaliza la configuración de comisiones de DetailVlak garantizando que:
 * - Cada persona tenga sus reglas en `commission_config.employee_rules`.
 * - La regla de 'Anuncios pagos' sea EXCLUSIVA de Maximiliano (nunca se aplica a Romina).
 * - 'Empresa' mantenga el porcentaje configurado para empresas de cada persona.
 */
export function normalizeDetailingCommissionConfig<T extends Partial<DetailingConfig>>(config: T): T {
  if (!config || typeof config !== 'object') return config;
  const cc: any = config.commission_config || {};
  const baseRate = typeof cc.base_rate === 'number' ? cc.base_rate : 30;
  const adsRate = typeof cc.ads_rate === 'number' ? cc.ads_rate : 12.5;
  const companyRate = typeof cc.company_rate === 'number' ? cc.company_rate : 12.5;

  const empRules: any[] = Array.isArray(cc.employee_rules) ? cc.employee_rules : [];
  const existingRomina = empRules.find(
    (r) => r.employee_id === 'user-romina' || String(r.employee_name || '').toLowerCase().includes('romina')
  );
  const existingMaxi = empRules.find(
    (r) => r.employee_id === 'user-maxi' || String(r.employee_name || '').toLowerCase().includes('maxi')
  );

  const rominaBase = typeof existingRomina?.base_percentage === 'number' ? existingRomina.base_percentage : baseRate;
  const maxiBase = typeof existingMaxi?.base_percentage === 'number' ? existingMaxi.base_percentage : baseRate;

  // Regla de Empresa por persona (desde employee_rules o origin_commission_rules)
  const originTable = Array.isArray(config.origin_commission_rules) ? config.origin_commission_rules : [];
  const companyRow = originTable.find((r) => String(r.origin || '').trim().toLowerCase() === 'empresa');
  const adsRow = originTable.find((r) => String(r.origin || '').trim().toLowerCase().includes('anuncio'));

  const rominaCompanyRule = existingRomina?.origin_rules?.find(
    (or: any) => String(or.origin || '').trim().toLowerCase() === 'empresa'
  );
  const maxiCompanyRule = existingMaxi?.origin_rules?.find(
    (or: any) => String(or.origin || '').trim().toLowerCase() === 'empresa'
  );
  const maxiAdsRule = existingMaxi?.origin_rules?.find(
    (or: any) => String(or.origin || '').trim().toLowerCase().includes('anuncio')
  );

  const rominaCompanyPct =
    rominaCompanyRule && typeof rominaCompanyRule.percentage === 'number'
      ? rominaCompanyRule.percentage
      : typeof companyRow?.romina_percentage === 'number'
        ? companyRow.romina_percentage
        : companyRate;

  const maxiCompanyPct =
    maxiCompanyRule && typeof maxiCompanyRule.percentage === 'number'
      ? maxiCompanyRule.percentage
      : typeof companyRow?.maxi_percentage === 'number'
        ? companyRow.maxi_percentage
        : companyRate;

  const maxiAdsPct =
    maxiAdsRule && typeof maxiAdsRule.percentage === 'number'
      ? maxiAdsRule.percentage
      : typeof adsRow?.maxi_percentage === 'number'
        ? adsRow.maxi_percentage
        : adsRate;

  // Romina: SOLO tiene reglas propias (p.ej. Empresa), NUNCA 'Anuncios pagos'
  const rominaOtherOriginRules = (existingRomina?.origin_rules || []).filter((or: any) => {
    const o = String(or.origin || '').trim().toLowerCase();
    return !o.includes('anuncio') && o !== 'empresa';
  });

  const maxiOtherOriginRules = (existingMaxi?.origin_rules || []).filter((or: any) => {
    const o = String(or.origin || '').trim().toLowerCase();
    return !o.includes('anuncio') && o !== 'empresa';
  });

  const normalizedEmployeeRules = [
    {
      employee_id: 'user-romina',
      employee_name: 'Romina',
      base_percentage: rominaBase,
      origin_rules: [
        { origin: 'Empresa', percentage: rominaCompanyPct },
        ...rominaOtherOriginRules
      ]
    },
    {
      employee_id: 'user-maxi',
      employee_name: 'Maximiliano',
      base_percentage: maxiBase,
      origin_rules: [
        { origin: 'Anuncios pagos', percentage: maxiAdsPct },
        { origin: 'Empresa', percentage: maxiCompanyPct },
        ...maxiOtherOriginRules
      ]
    }
  ];

  const normalizedOriginCommissionRules: DetailingOriginCommissionRule[] = [
    { origin: 'WhatsApp', romina_percentage: rominaBase, maxi_percentage: maxiBase },
    { origin: 'Instagram', romina_percentage: rominaBase, maxi_percentage: maxiBase },
    { origin: 'Recomendación', romina_percentage: rominaBase, maxi_percentage: maxiBase },
    { origin: 'Anuncios pagos', romina_percentage: rominaBase, maxi_percentage: maxiAdsPct },
    { origin: 'Otro', romina_percentage: rominaBase, maxi_percentage: maxiBase },
    { origin: 'Empresa', romina_percentage: rominaCompanyPct, maxi_percentage: maxiCompanyPct }
  ];

  return {
    ...config,
    commission_config: {
      ...cc,
      base_rate: baseRate,
      ads_rate: maxiAdsPct,
      company_rate: maxiCompanyPct,
      employee_rules: normalizedEmployeeRules
    },
    origin_commission_rules: normalizedOriginCommissionRules
  };
}

/**
 * Obtiene los porcentajes de comisión automáticos para Maximiliano y Romina según las reglas
 * de Configuración > Comisiones (`commission_config.employee_rules` / `origin_commission_rules`):
 * - Romina: su % base (30% siempre para particulares, incluido 'Anuncios pagos').
 * - Maximiliano: su % base (30%), o su % configurado si el origen es 'Anuncios pagos' (12,5%).
 * - Origen 'Empresa': el % configurado para empresas de cada persona.
 * - La regla de origen se aplica SOLO a la persona que la tiene configurada ('Anuncios pagos' es solo de Maximiliano, nunca a Romina).
 */
export function getOriginCommissionRates(
  config?: DetailingConfig | {
    origin_commission_rules?: DetailingOriginCommissionRule[];
    commission_config?: any;
  } | null,
  origin?: string | null
): { maxi: number; romina: number } {
  const cc: any = config?.commission_config || {};
  const empRules: any[] = Array.isArray(cc.employee_rules) ? cc.employee_rules : [];
  const maxiRule = empRules.find(
    (r) => r.employee_id === 'user-maxi' || (r.employee_name || '').toLowerCase().includes('maxi')
  );
  const rominaRule = empRules.find(
    (r) => r.employee_id === 'user-romina' || (r.employee_name || '').toLowerCase().includes('romina')
  );

  const fallbackBase = typeof cc.base_rate === 'number' ? cc.base_rate : 30;
  const maxiBase = typeof maxiRule?.base_percentage === 'number' ? maxiRule.base_percentage : fallbackBase;
  const rominaBase = typeof rominaRule?.base_percentage === 'number' ? rominaRule.base_percentage : fallbackBase;

  if (!origin) {
    return { maxi: maxiBase, romina: rominaBase };
  }

  const originNorm = origin.trim().toLowerCase();
  const isAds = originNorm.includes('anuncio');

  // Regla de origen para Maximiliano
  let maxiRate = maxiBase;
  const maxiOriginRule = maxiRule?.origin_rules?.find(
    (or: any) => (or.origin || '').trim().toLowerCase() === originNorm || (isAds && (or.origin || '').trim().toLowerCase().includes('anuncio'))
  );
  if (maxiOriginRule && typeof maxiOriginRule.percentage === 'number') {
    maxiRate = Number(maxiOriginRule.percentage);
  } else if (config?.origin_commission_rules && config.origin_commission_rules.length > 0) {
    const found = config.origin_commission_rules.find(
      (r) => (r.origin || '').trim().toLowerCase() === originNorm
    );
    if (found && typeof found.maxi_percentage === 'number') {
      maxiRate = Number(found.maxi_percentage);
    } else if (isAds) {
      maxiRate = typeof cc.ads_rate === 'number' ? cc.ads_rate : 12.5;
    }
  } else if (isAds) {
    maxiRate = typeof cc.ads_rate === 'number' ? cc.ads_rate : 12.5;
  }

  // Regla de origen para Romina:
  // IMPORTANTE: La regla de 'Anuncios pagos' es EXCLUSIVA de Maximiliano, NUNCA se aplica a Romina.
  let rominaRate = rominaBase;
  if (!isAds) {
    const rominaOriginRule = rominaRule?.origin_rules?.find(
      (or: any) => (or.origin || '').trim().toLowerCase() === originNorm && !(or.origin || '').trim().toLowerCase().includes('anuncio')
    );
    if (rominaOriginRule && typeof rominaOriginRule.percentage === 'number') {
      rominaRate = Number(rominaOriginRule.percentage);
    } else if (originNorm === 'empresa' && config?.origin_commission_rules && config.origin_commission_rules.length > 0) {
      const found = config.origin_commission_rules.find(
        (r) => (r.origin || '').trim().toLowerCase() === 'empresa'
      );
      if (found && typeof found.romina_percentage === 'number') {
        rominaRate = Number(found.romina_percentage);
      }
    }
  }

  return {
    maxi: maxiRate,
    romina: rominaRate
  };
}

export interface JobPerformerItem {
  employee_id: 'user-maxi' | 'user-romina' | string;
  employee_name: string;
  short_name: 'M' | 'R' | string;
  short: 'M' | 'R' | string;
  rate: number;
  amount: number;
  status?: 'Pendiente' | 'Pagada';
  adjustment_reason?: string;
}

/**
 * Calcula el resumen de quién hizo el trabajo (M / R / M+R) y la comisión de cada participante.
 * - Si existen registros en `commissions` para este trabajo (ej. trabajos ya cobrados o históricos),
 *   usa exactamente los montos y tasas guardados en `commissions` sin recalcular nada (REGLA Nº 1).
 * - Si aún no se generaron comisiones (ej. trabajo nuevo pendiente de cobro), usa `quote.commission_participants`.
 */
export function getJobPerformersSummary(
  quote: DetailingQuote | null | undefined,
  commissions?: CommissionRecord[]
): {
  badge: 'M' | 'R' | 'M+R' | 'Sin asignar';
  label: string;
  items: JobPerformerItem[];
  totalCommission: number;
} {
  if (!quote) {
    return { badge: 'Sin asignar', label: 'Sin asignar', items: [], totalCommission: 0 };
  }

  const jobCommissions = (commissions || []).filter(
    (c) => c && !c.deleted_at && c.quote_id === quote.id
  );

  const participants = (quote.commission_participants || []).filter(
    (p) => p && typeof p.rate === 'number' && p.rate > 0
  );

  const itemsMap = new Map<string, JobPerformerItem>();

  // 1. Primero poblar desde participants del trabajo
  for (const p of participants) {
    const isMaxi = p.employee_id === 'user-maxi' || (p.employee_name || '').toLowerCase().includes('maxi');
    const empId = isMaxi ? 'user-maxi' : 'user-romina';
    const empName = isMaxi ? 'Maximiliano' : 'Romina';
    const shortName = isMaxi ? 'M' : 'R';
    const existingComm: any = jobCommissions.find(
      (c) => c.employee_id === empId || (isMaxi && (c.employee_name || '').toLowerCase().includes('maxi')) || (!isMaxi && (c.employee_name || '').toLowerCase().includes('romina'))
    );

    const rate = existingComm
      ? Number(existingComm.rate ?? existingComm.commission_rate)
      : Number(p.rate);
    const amount = existingComm
      ? Number(existingComm.amount ?? existingComm.commission_amount)
      : Math.round((Number(quote.total_amount) || 0) * (rate / 100));

    itemsMap.set(empId, {
      employee_id: empId,
      employee_name: empName,
      short_name: shortName,
      short: shortName,
      rate,
      amount,
      status: existingComm?.status,
      adjustment_reason: p.adjustment_reason || existingComm?.adjustment_reason
    });
  }

  // 2. Asegurar que cualquier comisión activa existente en `commissions` esté reflejada con su monto exacto
  for (const c of jobCommissions as any[]) {
    const isMaxi = c.employee_id === 'user-maxi' || (c.employee_name || '').toLowerCase().includes('maxi');
    const empId = isMaxi ? 'user-maxi' : 'user-romina';
    const shortName = isMaxi ? 'M' : 'R';
    if (!itemsMap.has(empId)) {
      itemsMap.set(empId, {
        employee_id: empId,
        employee_name: isMaxi ? 'Maximiliano' : 'Romina',
        short_name: shortName,
        short: shortName,
        rate: Number(c.rate ?? c.commission_rate) || 0,
        amount: Number(c.amount ?? c.commission_amount) || 0,
        status: c.status,
        adjustment_reason: c.adjustment_reason
      });
    }
  }

  const items = Array.from(itemsMap.values());
  const hasMaxi = items.some((i) => i.employee_id === 'user-maxi');
  const hasRomina = items.some((i) => i.employee_id === 'user-romina');

  let badge: 'M' | 'R' | 'M+R' | 'Sin asignar' = 'Sin asignar';
  let label = 'Sin asignar';

  if (hasMaxi && hasRomina) {
    badge = 'M+R';
    label = 'Los dos (M+R)';
  } else if (hasMaxi) {
    badge = 'M';
    label = 'Maximiliano (M)';
  } else if (hasRomina) {
    badge = 'R';
    label = 'Romina (R)';
  } else if (quote.assigned_to) {
    const assignedArr: string[] = Array.isArray(quote.assigned_to)
      ? quote.assigned_to
      : [String(quote.assigned_to)];
    const aMaxi = assignedArr.some((a) => a === 'user-maxi' || a.toLowerCase().includes('maxi'));
    const aRom = assignedArr.some((a) => a === 'user-romina' || a.toLowerCase().includes('romina'));
    if (aMaxi && aRom) {
      badge = 'M+R';
      label = 'Los dos (M+R)';
    } else if (aMaxi) {
      badge = 'M';
      label = 'Maximiliano (M)';
    } else if (aRom) {
      badge = 'R';
      label = 'Romina (R)';
    }
  }

  const totalCommission = items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  return { badge, label, items, totalCommission };
}

/**
 * Obtiene el timestamp efectivo de un registro para merge (updated_at o created_at como respaldo)
 */
export function getEffectiveTimestamp(rec: any): string {
  if (!rec || typeof rec !== 'object') return '';
  return String(rec.updated_at || rec.created_at || '');
}

/**
 * Normaliza de forma segura un cliente para que ningún campo sea null o undefined en render,
 * mapeando tanto `full_name` como `name` sin alterar campos originales.
 */
export function normalizeClient(raw: any): any {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      full_name: '',
      name: '',
      phone: '',
      email: '',
      cedula: '',
      origin: 'WhatsApp',
      notes: '',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  const fullName = String(raw.full_name ?? raw.name ?? '');
  const name = String(raw.name ?? raw.full_name ?? '');
  return {
    ...raw,
    id: String(raw.id ?? ''),
    full_name: fullName,
    name: name,
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    cedula: String(raw.cedula ?? ''),
    origin: raw.origin || 'WhatsApp',
    notes: String(raw.notes ?? ''),
    is_archived: Boolean(raw.is_archived),
    created_at: raw.created_at || raw.updated_at || '1970-01-01T00:00:00.000Z',
    updated_at: raw.updated_at || raw.created_at || '1970-01-01T00:00:00.000Z'
  };
}

/**
 * Normaliza de forma segura un vehículo para que ningún campo sea null o undefined en render.
 */
export function normalizeVehicle(raw: any): any {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      plate: '',
      brand: '',
      model: '',
      category: 'Mediano',
      ownership: 'client',
      client_id: '',
      photos: [],
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  return {
    ...raw,
    id: String(raw.id ?? ''),
    plate: String(raw.plate ?? ''),
    brand: String(raw.brand ?? ''),
    model: String(raw.model ?? ''),
    category: raw.category || 'Mediano',
    ownership: raw.ownership || 'client',
    client_id: String(raw.client_id ?? ''),
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    is_archived: Boolean(raw.is_archived),
    created_at: raw.created_at || raw.updated_at || '1970-01-01T00:00:00.000Z',
    updated_at: raw.updated_at || raw.created_at || '1970-01-01T00:00:00.000Z'
  };
}

/**
 * Normaliza de forma segura una empresa de detailing.
 */
export function normalizeCompany(raw: any): any {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: '',
      phone: '',
      billing_mode: 'mensual',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  return {
    ...raw,
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    contact_name: String(raw.contact_name ?? ''),
    billing_mode: raw.billing_mode || 'mensual',
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    created_at: raw.created_at || raw.updated_at || '1970-01-01T00:00:00.000Z',
    updated_at: raw.updated_at || raw.created_at || '1970-01-01T00:00:00.000Z'
  };
}

/**
 * Une dos listas de registros por `id` usando `updated_at` (o `created_at` si no tiene `updated_at`),
 * respetando `deleted_at` (borrado lógico) y sin borrar registros que falten en una de las listas.
 */
export function mergeRecordsById<T extends { id?: string }>(
  localList: T[],
  remoteList: T[],
  deletedIds?: string[],
  normalizer?: (item: any) => T
): T[] {
  const map = new Map<string, any>();
  const deletedSet = new Set<string>(Array.isArray(deletedIds) ? deletedIds : []);

  const safeLocal = Array.isArray(localList) ? localList : [];
  const safeRemote = Array.isArray(remoteList) ? remoteList : [];

  for (const item of safeLocal) {
    if (!item || !item.id) continue;
    if ((item as any).deleted_at) {
      deletedSet.add(item.id);
      continue;
    }
    map.set(item.id, normalizer ? normalizer(item) : item);
  }

  for (const remoteItem of safeRemote) {
    if (!remoteItem || !remoteItem.id) continue;
    if ((remoteItem as any).deleted_at) {
      deletedSet.add(remoteItem.id);
      map.delete(remoteItem.id);
      continue;
    }
    if (deletedSet.has(remoteItem.id)) {
      map.delete(remoteItem.id);
      continue;
    }

    const existing = map.get(remoteItem.id);
    if (!existing) {
      map.set(remoteItem.id, normalizer ? normalizer(remoteItem) : remoteItem);
    } else {
      const localTs = getEffectiveTimestamp(existing);
      const remoteTs = getEffectiveTimestamp(remoteItem);
      // Si el remoto es más nuevo o igual, gana el remoto
      if (!localTs || (remoteTs && remoteTs >= localTs)) {
        map.set(remoteItem.id, normalizer ? normalizer({ ...existing, ...remoteItem }) : { ...existing, ...remoteItem });
      }
    }
  }

  // Eliminar cualquier ID marcado como borrado
  for (const delId of deletedSet) {
    map.delete(delId);
  }

  return Array.from(map.values());
}

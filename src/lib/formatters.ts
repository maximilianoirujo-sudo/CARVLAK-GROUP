// ==============================================================================
// CARVLAK GROUP - FORMATEADORES & UTILIDADES
// ==============================================================================

import { Currency, Business } from '../types';

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
 * Obtiene la fecha en formato YYYY-MM-DD en la zona horaria local (Uruguay UTC-3),
 * evitando el desfase de toISOString() que después de las 21:00 hs salta al día siguiente.
 */
export function getLocalDateString(inputDate?: Date | string | number): string {
  const d = inputDate ? new Date(inputDate) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el mes actual o de la fecha en formato YYYY-MM en zona horaria local
 */
export function getLocalMonthString(inputDate?: Date | string | number): string {
  const d = inputDate ? new Date(inputDate) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr.trim();
  const timeWithSec = cleanTime.length === 5 
    ? `${cleanTime}:00` 
    : cleanTime.length >= 8 
      ? cleanTime.slice(0, 8) 
      : `${cleanTime}:00`;
  return `${cleanDate}T${timeWithSec}-03:00`;
}

/**
 * Formatea una hora en formato HH:mm utilizando explícitamente la zona horaria 'America/Montevideo'.
 */
export function formatLocalTime(inputDate: Date | string | number): string {
  if (!inputDate) return '';
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Montevideo'
  });
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
  const year = updated.getFullYear();
  const month = String(updated.getMonth() + 1).padStart(2, '0');
  const day = String(updated.getDate()).padStart(2, '0');
  const hours = String(updated.getHours()).padStart(2, '0');
  const mins = String(updated.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}:00-03:00`;
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




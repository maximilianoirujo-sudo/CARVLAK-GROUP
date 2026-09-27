// ==============================================================================
// CARVLAK GROUP - FORMATEADORES & UTILIDADES
// ==============================================================================

import { Currency, Business } from '../types';

/**
 * Formatea montos en Pesos Uruguayos ($UYU) con separadores de miles estándar uruguayo
 * Ejemplo: 15000 -> "$U 15.000"
 * En USD: 24500 -> "USD $24.500"
 */
export function formatCurrency(amount: number, currency: Currency = 'UYU'): string {
  const rounded = Math.round(amount || 0);
  const formatted = rounded.toLocaleString('es-UY');

  if (currency === 'USD') {
    return `USD $${formatted}`;
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
    inspeccion: 'CARVLAK Inspección Vehicular'
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
    color: '#000000',
    bgLight: 'bg-[#F2F2F2] dark:bg-[#1A1A1A]',
    textClass: 'text-black dark:text-white',
    borderClass: 'border-[#D9D9D9] dark:border-[#333333]',
    iconName: 'Car'
  },
  detailing: {
    name: 'DetailVlak Shangrilá',
    shortName: 'Detailing',
    color: '#000000',
    bgLight: 'bg-[#F2F2F2] dark:bg-[#1E1E1E]',
    textClass: 'text-black dark:text-white',
    borderClass: 'border-[#D9D9D9] dark:border-[#404040]',
    iconName: 'Droplets'
  },
  inspeccion: {
    name: 'Inspección Vehicular',
    shortName: 'Inspección',
    color: '#000000',
    bgLight: 'bg-[#F2F2F2] dark:bg-[#161616]',
    textClass: 'text-black dark:text-white',
    borderClass: 'border-[#D9D9D9] dark:border-[#2A2A2A]',
    iconName: 'ClipboardCheck'
  }
};


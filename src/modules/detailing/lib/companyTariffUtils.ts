import {
  DetailingPreventaTariff,
  DetailingCompanySpecialService,
  DetailingCompany,
  DetailingConfig,
  PreventaRounding,
  PreventaCalculationMode
} from '../../../types';

export const DEFAULT_PREVENTA_TARIFF: DetailingPreventaTariff = {
  base_price_size_1: 6000,
  increase_percentage: 15,
  calculation_mode: 'acumulado',
  rounding: 'none',
  sizes: [
    { size: 1, name: 'Chico', examples: 'Onix, HB20, Up, Gol, Kwid, C3' },
    { size: 2, name: 'Mediano', examples: 'Corolla, Cruze, Vento, Focus, Civic' },
    { size: 3, name: 'SUV', examples: 'Compass, Tracker, Duster, Kicks, HR-V' },
    { size: 4, name: 'Grande / Pick-up', examples: 'Hilux, Ranger, Amarok, RAM, S10' }
  ],
  category_mapping: {
    'Chico': 1,
    'Mediano': 2,
    'SUV/Rural': 3,
    'SUV': 3,
    'Pick-up': 4,
    'Grande': 4,
    'Moto': 1
  }
};

export const DEFAULT_COMPANY_SPECIAL_SERVICES: DetailingCompanySpecialService[] = [
  {
    id: 'cs-faros',
    name: 'Pulido de faros',
    description: 'Restauración y pulido de ópticas delanteras',
    pricing_mode: 'unico',
    price_mode: 'unique',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 1,
    order: 1,
    is_active: true
  },
  {
    id: 'cs-motor',
    name: 'Lavado de motor',
    description: 'Lavado técnico a vapor y acondicionado de plásticos de vano motor',
    pricing_mode: 'unico',
    price_mode: 'unique',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 2,
    order: 2,
    is_active: true
  },
  {
    id: 'cs-descontaminado',
    name: 'Descontaminado de pintura',
    description: 'Tratamiento con clay bar y descontaminante ferroso en toda la carrocería',
    pricing_mode: 'por_tamaño',
    price_mode: 'per_size',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    prices_per_size: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 3,
    order: 3,
    is_active: true
  },
  {
    id: 'cs-pulido',
    name: 'Pulido de pintura',
    description: 'Abrillantado o corrección preventiva de barniz',
    pricing_mode: 'por_tamaño',
    price_mode: 'per_size',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    prices_per_size: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 4,
    order: 4,
    is_active: true
  },
  {
    id: 'cs-plasticos',
    name: 'Tratamiento de plásticos',
    description: 'Hidratación y sellado UV de paragolpes, molduras y zócalos',
    pricing_mode: 'unico',
    price_mode: 'unique',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 5,
    order: 5,
    is_active: true
  },
  {
    id: 'cs-olores',
    name: 'Eliminación de olores',
    description: 'Generador de ozono / termonebulización desinfectante en cabina',
    pricing_mode: 'unico',
    price_mode: 'unique',
    base_price: 0,
    unique_price: 0,
    prices: { 1: 0, 2: 0, 3: 0, 4: 0 },
    sort_order: 6,
    order: 6,
    is_active: true
  }
];

export function applyRounding(val: number, rounding?: PreventaRounding): number {
  if (rounding === '10') return Math.round(val / 10) * 10;
  if (rounding === '50') return Math.round(val / 50) * 50;
  if (rounding === '100') return Math.round(val / 100) * 100;
  return Math.round(val);
}

/**
 * Calcula los 4 precios de preventa según la tarifa provista.
 * Cumple estrictamente con:
 * - Acumulado: cada tamaño = tamaño anterior × (1 + pct / 100)
 *   Ej. base 6.000, 15% -> 6.000 / 6.900 / 7.935 / 9.125
 * - Sobre la base: tamaño n = base × (1 + (pct / 100) * (n - 1))
 *   Ej. base 6.000, 15% -> 6.000 / 6.900 / 7.800 / 8.700
 * - Respeta manual_price_override si está definido para cualquier tamaño.
 */
export function calculatePreventaPrices(tariff?: DetailingPreventaTariff): Record<1 | 2 | 3 | 4, number> {
  const t = tariff || DEFAULT_PREVENTA_TARIFF;
  const base = Number(t.base_price_size_1) || 6000;
  const pct = Number(t.increase_percentage) || 15;
  const mode: PreventaCalculationMode = t.calculation_mode || 'acumulado';
  const rounding: PreventaRounding = t.rounding || 'none';

  const overrides: Record<number, number | null | undefined> = {};
  (t.sizes || []).forEach((s) => {
    overrides[s.size] = s.manual_price_override;
  });

  const prices: Record<1 | 2 | 3 | 4, number> = {
    1: base,
    2: 0,
    3: 0,
    4: 0
  };

  if (mode === 'sobre_la_base') {
    for (let n = 1; n <= 4; n++) {
      const calculated = base * (1 + (pct / 100) * (n - 1));
      const rounded = applyRounding(calculated, rounding);
      const manual = overrides[n];
      prices[n as 1 | 2 | 3 | 4] = manual != null && Number(manual) > 0 ? Number(manual) : rounded;
    }
  } else {
    // Modo acumulado
    let currentCalc = base;
    for (let n = 1; n <= 4; n++) {
      if (n > 1) {
        currentCalc = currentCalc * (1 + pct / 100);
      }
      const rounded = applyRounding(currentCalc, rounding);
      const manual = overrides[n];
      prices[n as 1 | 2 | 3 | 4] = manual != null && Number(manual) > 0 ? Number(manual) : rounded;
    }
  }

  return prices;
}

/**
 * Obtiene la tarifa efectiva de una empresa:
 * Si la empresa tiene pricing_override.preventa_tariff, mezcla con la general.
 */
export function getCompanyEffectiveTariff(
  company?: DetailingCompany | null,
  generalConfig?: DetailingConfig | null
): DetailingPreventaTariff {
  const baseTariff: DetailingPreventaTariff = generalConfig?.preventa_tariff || DEFAULT_PREVENTA_TARIFF;
  if (!company?.pricing_override?.preventa_tariff) {
    return baseTariff;
  }

  const override = company.pricing_override.preventa_tariff;
  return {
    ...baseTariff,
    ...override,
    base_price_size_1: override.base_price_size_1 ?? baseTariff.base_price_size_1,
    increase_percentage: override.increase_percentage ?? baseTariff.increase_percentage,
    calculation_mode: override.calculation_mode ?? baseTariff.calculation_mode,
    rounding: override.rounding ?? baseTariff.rounding,
    sizes: (baseTariff.sizes || []).map((s) => {
      const ovSize = override.sizes?.find((os) => os.size === s.size);
      return ovSize ? { ...s, ...ovSize } : s;
    }),
    category_mapping: { ...baseTariff.category_mapping, ...override.category_mapping }
  };
}

/**
 * Obtiene el precio de un servicio especial según el tamaño seleccionado
 */
export function getSpecialServicePrice(
  service: DetailingCompanySpecialService,
  size: 1 | 2 | 3 | 4,
  preventaTariff: DetailingPreventaTariff,
  companyOverride?: { price_mode?: any; pricing_mode?: any; unique_price?: number; base_price?: number; prices_per_size?: Record<number, number>; prices?: Record<string | number, number> }
): number {
  const effService = companyOverride ? { ...service, ...companyOverride } : service;
  const mode = (effService.pricing_mode || effService.price_mode || 'unico').toLowerCase();

  // Modo único
  if (mode === 'unico' || mode === 'unique') {
    return Number(effService.base_price ?? effService.unique_price) || 0;
  }

  // Modo por tamaño
  if (mode === 'por_tamaño' || mode === 'per_size' || mode === 'por_tamano') {
    const bySize: any = effService.prices || effService.prices_per_size || (effService as any).prices_by_size;
    if (bySize) {
      const val = bySize[size] ?? bySize[String(size)];
      if (val !== undefined && val !== null) return Number(val) || 0;
    }
    return 0;
  }

  // Modo porcentaje sobre la tarifa o base
  if (mode === 'porcentaje' || mode === 'percentage_size') {
    const base = Number(effService.base_price ?? effService.unique_price) || 0;
    if (base <= 0) return 0;
    const pct = preventaTariff.increase_percentage ?? 15;
    const calcMode = preventaTariff.calculation_mode ?? 'acumulado';
    const rounding = preventaTariff.rounding ?? 'none';

    let calc = base;
    if (size === 1) {
      calc = base;
    } else if (calcMode === 'acumulado') {
      calc = base * Math.pow(1 + pct / 100, size - 1);
    } else {
      calc = base * (1 + (pct / 100) * (size - 1));
    }
    return applyRounding(calc, rounding);
  }

  return 0;
}

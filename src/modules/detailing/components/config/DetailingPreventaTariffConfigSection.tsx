import React, { useMemo } from 'react';
import {
  Car,
  TrendingUp,
  Percent,
  Sliders,
  DollarSign,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  DetailingPreventaTariff,
  PreventaCalculationMode,
  PreventaRounding
} from '../../../../types';
import {
  calculatePreventaPrices,
  DEFAULT_PREVENTA_TARIFF
} from '../../lib/companyTariffUtils';
import { formatCurrency } from '../../../../lib/formatters';

import { useData } from '../../../../context/DataContext';

interface DetailingPreventaTariffConfigSectionProps {
  tariff?: DetailingPreventaTariff;
  onChange?: (updatedTariff: DetailingPreventaTariff) => void;
}

export const DetailingPreventaTariffConfigSection: React.FC<DetailingPreventaTariffConfigSectionProps> = ({
  tariff: propTariff,
  onChange
}) => {
  const { detailingConfig, updateDetailingConfig } = useData();
  const tariff = propTariff || detailingConfig?.preventa_tariff;

  const currentTariff: DetailingPreventaTariff = useMemo(() => {
    return {
      ...DEFAULT_PREVENTA_TARIFF,
      ...(tariff || {}),
      sizes: tariff?.sizes && tariff.sizes.length === 4 ? tariff.sizes : DEFAULT_PREVENTA_TARIFF.sizes,
      category_mapping: {
        ...DEFAULT_PREVENTA_TARIFF.category_mapping,
        ...(tariff?.category_mapping || {})
      }
    };
  }, [tariff]);

  // Precios calculados en vivo con la fórmula y redondeos
  const livePrices = useMemo(() => {
    return calculatePreventaPrices(currentTariff);
  }, [currentTariff]);

  const handleEmitChange = (updated: DetailingPreventaTariff) => {
    if (onChange) {
      onChange(updated);
    } else {
      updateDetailingConfig({
        ...detailingConfig,
        preventa_tariff: updated,
        company_pricing: updated
      });
    }
  };

  const updateField = <K extends keyof DetailingPreventaTariff>(key: K, value: DetailingPreventaTariff[K]) => {
    handleEmitChange({
      ...currentTariff,
      [key]: value
    });
  };

  const updateSize = (sizeNum: 1 | 2 | 3 | 4, field: 'name' | 'examples' | 'manual_price_override', val: any) => {
    const nextSizes = (currentTariff.sizes || []).map((s) => {
      if (s.size === sizeNum) {
        return { ...s, [field]: val };
      }
      return s;
    });
    handleEmitChange({
      ...currentTariff,
      sizes: nextSizes
    });
  };

  const updateCategoryMapping = (categoryName: string, sizeNum: 1 | 2 | 3 | 4) => {
    handleEmitChange({
      ...currentTariff,
      category_mapping: {
        ...(currentTariff.category_mapping || {}),
        [categoryName]: sizeNum
      }
    });
  };

  const handleResetToDefaults = () => {
    handleEmitChange(JSON.parse(JSON.stringify(DEFAULT_PREVENTA_TARIFF)));
  };

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h4 className="text-sm font-bold text-[#161616]">
            Tarifa Preventa por Tamaño para Empresas
          </h4>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Configuración de precios de "Preparación Preventa" para automotoras según los 4 tamaños de vehículos
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="text-xs text-[#6B6B6B] hover:text-[#D7141A] font-semibold flex items-center gap-1.5 cursor-pointer self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer valores por defecto</span>
        </button>
      </div>

      {/* VISTA PREVIA EN VIVO DE LOS 4 PRECIOS RESULTANTES */}
      <div className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-2xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#161616] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D7141A]"></span>
            Vista previa en vivo de precios preventa
          </span>
          <span className="text-[10px] text-[#6B6B6B] font-mono">
            Modo: {currentTariff.calculation_mode === 'acumulado' ? 'Acumulado (× 1,15)' : 'Sobre la base'} · Redondeo: {currentTariff.rounding}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((sizeNum) => {
            const sz = currentTariff.sizes.find((s) => s.size === sizeNum) || {
              size: sizeNum as 1 | 2 | 3 | 4,
              name: `Tamaño ${sizeNum}`,
              examples: ''
            };
            const price = livePrices[sizeNum as 1 | 2 | 3 | 4];
            const hasManualOverride = sz.manual_price_override != null && sz.manual_price_override > 0;

            return (
              <div
                key={sizeNum}
                className="bg-white border border-[#E5E5E3] rounded-xl p-3 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D7141A]">
                      Tamaño {sizeNum}
                    </span>
                    {hasManualOverride && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        Manual
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs text-[#161616] block mt-0.5 truncate">
                    {sz.name}
                  </span>
                  <p className="text-[10px] text-[#6B6B6B] line-clamp-1 mt-0.5">
                    {sz.examples || '-'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E5E5E3]">
                  <span className="text-base sm:text-lg font-black font-mono text-[#161616]">
                    {formatCurrency(price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PARÁMETROS GENERALES DE LA FÓRMULA */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-xs">
        {/* Precio Base Tamaño 1 */}
        <div>
          <label className="block text-xs font-bold text-[#161616] mb-1">
            Precio Base Tamaño 1 ($U)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={currentTariff.base_price_size_1 || ''}
            onChange={(e) => updateField('base_price_size_1', Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#161616] focus:bg-white focus:border-[#161616]"
          />
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">Por defecto $6.000 UYU</span>
        </div>

        {/* Porcentaje de aumento por tamaño */}
        <div>
          <label className="block text-xs font-bold text-[#161616] mb-1">
            % Aumento por Tamaño
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={currentTariff.increase_percentage ?? 15}
              onChange={(e) => updateField('increase_percentage', Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-3 pr-7 py-2 text-xs font-mono font-bold text-[#161616] focus:bg-white focus:border-[#161616]"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-[#6B6B6B]">%</span>
          </div>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">Por defecto 15%</span>
        </div>

        {/* Modo de Cálculo */}
        <div>
          <label className="block text-xs font-bold text-[#161616] mb-1">
            Modo de Cálculo
          </label>
          <select
            value={currentTariff.calculation_mode || 'acumulado'}
            onChange={(e) => updateField('calculation_mode', e.target.value as PreventaCalculationMode)}
            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#161616] focus:bg-white focus:border-[#161616]"
          >
            <option value="acumulado">Acumulado (anterior × 1,15)</option>
            <option value="sobre_la_base">Sobre la base (base × (1 + %×n))</option>
          </select>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
            {currentTariff.calculation_mode === 'acumulado'
              ? '6.000 → 6.900 → 7.935 → 9.125'
              : '6.000 → 6.900 → 7.800 → 8.700'}
          </span>
        </div>

        {/* Redondeo */}
        <div>
          <label className="block text-xs font-bold text-[#161616] mb-1">
            Redondeo Opcional
          </label>
          <select
            value={currentTariff.rounding || 'none'}
            onChange={(e) => updateField('rounding', e.target.value as PreventaRounding)}
            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#161616] focus:bg-white focus:border-[#161616]"
          >
            <option value="none">Sin redondeo (exacto al peso)</option>
            <option value="10">A $10 más cercano</option>
            <option value="50">A $50 más cercano</option>
            <option value="100">A $100 más cercano</option>
          </select>
          <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">Para números redondos</span>
        </div>
      </div>

      {/* EDICIÓN DE LOS 4 TAMAÑOS & PISADO MANUAL */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
          <div>
            <h5 className="font-bold text-xs text-[#161616]">
              Configuración de los 4 Tamaños y Pisado Manual de Precios
            </h5>
            <p className="text-[11px] text-[#6B6B6B]">
              Podés cambiar el nombre del tamaño, los ejemplos de modelos y pisar manualmente el precio si querés fijar uno puntual.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((sizeNum) => {
            const sz = currentTariff.sizes.find((s) => s.size === sizeNum) || {
              size: sizeNum as 1 | 2 | 3 | 4,
              name: `Tamaño ${sizeNum}`,
              examples: ''
            };

            return (
              <div
                key={sizeNum}
                className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                {/* Badge y Nombre */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#161616] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {sizeNum}
                  </span>
                  <input
                    type="text"
                    value={sz.name}
                    onChange={(e) => updateSize(sizeNum as 1 | 2 | 3 | 4, 'name', e.target.value)}
                    placeholder="Nombre del tamaño"
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs font-bold text-[#161616]"
                  />
                </div>

                {/* Modelos de Ejemplo */}
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={sz.examples || ''}
                    onChange={(e) => updateSize(sizeNum as 1 | 2 | 3 | 4, 'examples', e.target.value)}
                    placeholder="Modelos de ejemplo (ej. Onix, Up, Gol)"
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs text-[#161616]"
                  />
                </div>

                {/* Pisado Manual de Precio */}
                <div className="sm:col-span-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1 text-[10px] text-[#6B6B6B]">$U</span>
                    <input
                      type="number"
                      placeholder="Pisar precio (opc.)"
                      value={sz.manual_price_override != null ? sz.manual_price_override : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        updateSize(sizeNum as 1 | 2 | 3 | 4, 'manual_price_override', val);
                      }}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg pl-7 pr-2 py-1 text-xs font-mono font-bold text-[#161616] text-right"
                    />
                  </div>
                  {sz.manual_price_override != null && (
                    <button
                      type="button"
                      onClick={() => updateSize(sizeNum as 1 | 2 | 3 | 4, 'manual_price_override', null)}
                      title="Quitar pisado manual"
                      className="text-[#6B6B6B] hover:text-[#D7141A] text-[10px] font-bold p-1"
                    >
                      × Auto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAPEO DE CATEGORÍAS EXISTENTES A TAMAÑOS */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-xs space-y-3">
        <div>
          <h5 className="font-bold text-xs text-[#161616]">
            Mapeo de Categorías de Vehículo a Tamaños Preventa (1–4)
          </h5>
          <p className="text-[11px] text-[#6B6B6B]">
            Define a qué tamaño (1 a 4) corresponde cada categoría existente para sugerir el precio automáticamente.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {['Chico', 'Mediano', 'SUV/Rural', 'Pick-up'].map((cat) => {
            const currentSize = currentTariff.category_mapping?.[cat] || (cat === 'Chico' ? 1 : cat === 'Mediano' ? 2 : cat === 'SUV/Rural' ? 3 : 4);

            return (
              <div
                key={cat}
                className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between"
              >
                <span className="font-bold text-xs text-[#161616]">{cat}</span>
                <select
                  value={currentSize}
                  onChange={(e) => updateCategoryMapping(cat, Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-bold text-[#161616]"
                >
                  <option value={1}>Tamaño 1</option>
                  <option value={2}>Tamaño 2</option>
                  <option value={3}>Tamaño 3</option>
                  <option value={4}>Tamaño 4</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

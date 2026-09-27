import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Car,
  Clock,
  Award,
  Users,
  BarChart3,
  Lock,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { DealershipVehicle } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const DealershipDashboardSection: React.FC = () => {
  const {
    dealershipVehicles,
    dealershipInquiries
  } = useData();
  const { profile } = useAuth();

  const isAdmin = profile?.roles.includes('admin');

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [useAllTime, setUseAllTime] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<'todos' | 'usado' | '0km'>('todos');

  // 1. Stock Activo (no vendido ni descartado)
  const allActiveStock = useMemo(() => {
    return dealershipVehicles.filter((v) =>
      ['comprado', 'preparacion', 'publicado', 'reservado'].includes(v.status)
    );
  }, [dealershipVehicles]);

  // Desglose por condición (Usados vs 0km)
  const usedActiveStock = useMemo(() => {
    return allActiveStock.filter((v) => v.condition === 'usado');
  }, [allActiveStock]);

  const zeroKmActiveStock = useMemo(() => {
    return allActiveStock.filter((v) => v.condition === '0km');
  }, [allActiveStock]);

  // Stock activo filtrado según selección del usuario
  const activeStock = useMemo(() => {
    if (conditionFilter === 'usado') return usedActiveStock;
    if (conditionFilter === '0km') return zeroKmActiveStock;
    return allActiveStock;
  }, [conditionFilter, usedActiveStock, zeroKmActiveStock, allActiveStock]);

  // Cálculos de métricas para un conjunto de vehículos
  const calcMetrics = (cars: DealershipVehicle[]) => {
    const totalCapital = cars.reduce(
      (acc, c) => acc + (c.total_real_cost_usd || c.purchase_price || 0),
      0
    );
    const totalMargin = cars.reduce(
      (acc, c) => acc + (c.estimated_margin_usd || 0),
      0
    );
    const totalDays = cars.reduce((acc, c) => {
      const start = new Date(c.purchase_date || c.created_at).getTime();
      const days = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
      return acc + days;
    }, 0);
    const avgDays = cars.length > 0 ? Math.round(totalDays / cars.length) : 0;
    return { count: cars.length, totalCapital, totalMargin, avgDays };
  };

  const metricsAll = useMemo(() => calcMetrics(allActiveStock), [allActiveStock]);
  const metricsUsed = useMemo(() => calcMetrics(usedActiveStock), [usedActiveStock]);
  const metricsZeroKm = useMemo(() => calcMetrics(zeroKmActiveStock), [zeroKmActiveStock]);
  const metricsCurrent = useMemo(() => calcMetrics(activeStock), [activeStock]);

  // Antigüedad del Stock (Distribución)
  const stockAgeBuckets = useMemo(() => {
    const buckets = { under30: 0, days30to60: 0, days60to90: 0, over90: 0 };
    activeStock.forEach((car) => {
      const start = new Date(car.purchase_date || car.created_at).getTime();
      const days = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
      if (days <= 30) buckets.under30++;
      else if (days <= 60) buckets.days30to60++;
      else if (days <= 90) buckets.days60to90++;
      else buckets.over90++;
    });
    return buckets;
  }, [activeStock]);

  // Ventas del Período
  const soldVehicles = useMemo(() => {
    return dealershipVehicles.filter((v) => {
      if (v.status !== 'vendido') return false;
      if (conditionFilter !== 'todos' && v.condition !== conditionFilter) return false;
      if (useAllTime) return true;
      const saleDate = v.sale_record?.sale_date || v.updated_at;
      return saleDate.startsWith(selectedMonth);
    });
  }, [dealershipVehicles, selectedMonth, useAllTime, conditionFilter]);

  const salesVolumeUsd = useMemo(() => {
    return soldVehicles.reduce((acc, car) => acc + (car.sale_record?.sale_price || car.sale_price || 0), 0);
  }, [soldVehicles]);

  const realizedGrossProfitUsd = useMemo(() => {
    return soldVehicles.reduce((acc, car) => {
      if (car.sale_record?.gross_profit_usd !== undefined) {
        return acc + car.sale_record.gross_profit_usd;
      }
      return acc + (car.estimated_margin_usd || 0);
    }, 0);
  }, [soldVehicles]);

  const totalCommissionsUsd = useMemo(() => {
    return soldVehicles.reduce((acc, car) => acc + (car.sale_record?.commission_amount || 0), 0);
  }, [soldVehicles]);

  // Conversión CRM
  const crmConversionRate = useMemo(() => {
    if (dealershipInquiries.length === 0) return 0;
    const wonInquiries = dealershipInquiries.filter((i) => i.status === 'Ganada' || i.status === 'Vendido').length;
    return ((wonInquiries / dealershipInquiries.length) * 100).toFixed(1);
  }, [dealershipInquiries]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center rounded-xl bg-panel border border-borde space-y-3">
        <div className="w-12 h-12 rounded-xl bg-negro border border-borde text-rojo mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-white">Métricas y Rentabilidad Restringidas</h3>
        <p className="text-xs text-gris-texto max-w-sm mx-auto">
          El análisis financiero, capital inmovilizado y comisiones liquidadas solo están disponibles para Administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera & Controles de Período y Filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Métricas Financieras &amp; Rentabilidad</h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-negro border border-borde text-rojo">
              ADMINISTRACIÓN
            </span>
          </div>
          <p className="text-xs text-gris-texto mt-0.5">
            Capital propio inmovilizado, rotación de stock, comisiones y rentabilidad de Usados vs 0km.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Usados / 0km / Todos */}
          <div className="flex p-1 rounded-xl bg-negro border border-borde text-xs font-black">
            <button
              onClick={() => setConditionFilter('todos')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                conditionFilter === 'todos'
                  ? 'bg-rojo text-white shadow-sm'
                  : 'text-gris-texto hover:text-white'
              }`}
            >
              Todos ({allActiveStock.length})
            </button>
            <button
              onClick={() => setConditionFilter('usado')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                conditionFilter === 'usado'
                  ? 'bg-rojo text-white shadow-sm'
                  : 'text-gris-texto hover:text-white'
              }`}
            >
              Usados ({usedActiveStock.length})
            </button>
            <button
              onClick={() => setConditionFilter('0km')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                conditionFilter === '0km'
                  ? 'bg-rojo text-white shadow-sm'
                  : 'text-gris-texto hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>0km ({zeroKmActiveStock.length})</span>
            </button>
          </div>

          <button
            onClick={() => setUseAllTime(!useAllTime)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              useAllTime
                ? 'bg-panel border border-borde text-white font-black'
                : 'bg-negro border border-borde text-gris-texto hover:text-white'
            }`}
          >
            Histórico Completo
          </button>

          {!useAllTime && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-negro border border-borde text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-rojo"
            />
          )}
        </div>
      </div>

      {/* Tabla Comparativa: Usados vs 0km (Stock Propio) */}
      <div className="p-5 rounded-xl bg-panel border border-borde space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-borde pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rojo" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Comparativa de Inventario: Usados vs Eléctricos 0km
            </h3>
          </div>
          <span className="text-[10px] text-gris-texto font-bold">Stock Propio CARVLAK</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Card Usados */}
          <div
            onClick={() => setConditionFilter('usado')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              conditionFilter === 'usado'
                ? 'bg-negro border-rojo shadow-md'
                : 'bg-negro border-borde hover:border-gris-texto'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-white uppercase text-[11px] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-rojo" />
                Usados Seleccionados
              </span>
              <span className="px-2 py-0.5 rounded-full bg-panel border border-borde text-white font-bold text-[10px]">
                {metricsUsed.count} unidades
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Capital Invertido:</span>
                <strong className="text-white font-mono">USD {Math.round(metricsUsed.totalCapital).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Margen Proyectado:</span>
                <strong className="text-white font-mono">+USD {Math.round(metricsUsed.totalMargin).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Días Promedio Stock:</span>
                <strong className="text-white font-mono">{metricsUsed.avgDays} días</strong>
              </div>
            </div>
          </div>

          {/* Card 0km */}
          <div
            onClick={() => setConditionFilter('0km')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              conditionFilter === '0km'
                ? 'bg-negro border-rojo shadow-md'
                : 'bg-negro border-borde hover:border-gris-texto'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-white uppercase text-[11px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rojo" />
                Eléctricos 0km
              </span>
              <span className="px-2 py-0.5 rounded-full bg-panel border border-borde text-white font-bold text-[10px]">
                {metricsZeroKm.count} unidades
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Capital Invertido:</span>
                <strong className="text-white font-mono">USD {Math.round(metricsZeroKm.totalCapital).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Margen Proyectado:</span>
                <strong className="text-white font-mono">+USD {Math.round(metricsZeroKm.totalMargin).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Días Promedio Stock:</span>
                <strong className="text-white font-mono">{metricsZeroKm.avgDays} días</strong>
              </div>
            </div>
          </div>

          {/* Card Total Consolidado */}
          <div
            onClick={() => setConditionFilter('todos')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              conditionFilter === 'todos'
                ? 'bg-negro border-rojo shadow-md'
                : 'bg-negro border-borde hover:border-gris-texto'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-white uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rojo" />
                Total Flota Global
              </span>
              <span className="px-2 py-0.5 rounded-full bg-panel border border-borde text-white font-bold text-[10px]">
                {metricsAll.count} unidades
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Capital Invertido:</span>
                <strong className="text-white font-mono">USD {Math.round(metricsAll.totalCapital).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Margen Proyectado:</span>
                <strong className="text-white font-mono">+USD {Math.round(metricsAll.totalMargin).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-gris-texto text-[11px]">
                <span>Días Promedio Stock:</span>
                <strong className="text-white font-mono">{metricsAll.avgDays} días</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas Principales de KPI filtradas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Capital Inmovilizado */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-2">
          <div className="flex items-center justify-between text-gris-texto">
            <span className="text-xs font-bold">Capital en Stock ({conditionFilter})</span>
            <DollarSign className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            USD {Math.round(metricsCurrent.totalCapital).toLocaleString()}
          </div>
          <div className="text-[11px] text-gris-texto">
            En {metricsCurrent.count} unidades disponibles
          </div>
        </div>

        {/* Margen Proyectado en Stock */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-2">
          <div className="flex items-center justify-between text-gris-texto">
            <span className="text-xs font-bold">Margen Proyectado</span>
            <TrendingUp className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            +USD {Math.round(metricsCurrent.totalMargin).toLocaleString()}
          </div>
          <div className="text-[11px] text-gris-texto">
            Ganancia bruta esperada del inventario
          </div>
        </div>

        {/* Días Promedio en Stock */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-2">
          <div className="flex items-center justify-between text-gris-texto">
            <span className="text-xs font-bold">Días Promedio Stock</span>
            <Clock className={`w-4 h-4 ${metricsCurrent.avgDays > 60 ? 'text-rojo' : 'text-gris-texto'}`} />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              metricsCurrent.avgDays > 60 ? 'text-rojo' : 'text-white'
            }`}
          >
            {metricsCurrent.avgDays} días
          </div>
          <div className="text-[11px] text-gris-texto">
            {metricsCurrent.avgDays > 60 ? '⚠️ Rotación lenta (>60 días)' : '✓ Rotación saludable'}
          </div>
        </div>

        {/* Conversión CRM */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-2">
          <div className="flex items-center justify-between text-gris-texto">
            <span className="text-xs font-bold">Conversión CRM</span>
            <Users className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {crmConversionRate}%
          </div>
          <div className="text-[11px] text-gris-texto">
            Consultas convertidas a ventas
          </div>
        </div>
      </div>

      {/* Resultados de Ventas del Período */}
      <div className="p-5 rounded-xl bg-panel border border-borde space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-borde pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-rojo" />
            <span className="text-sm font-black text-white uppercase tracking-wider">
              Rendimiento Comercial • {useAllTime ? 'Histórico Acumulado' : selectedMonth}
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-negro border border-borde text-white">
            {soldVehicles.length} unidades vendidas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-negro border border-borde">
            <div className="text-[11px] font-bold text-gris-texto uppercase">Facturación Total</div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              USD {salesVolumeUsd.toLocaleString()}
            </div>
            <p className="text-[10px] text-gris-texto mt-0.5">Volumen vendido de inventario</p>
          </div>

          <div className="p-4 rounded-xl bg-negro border border-borde">
            <div className="text-[11px] font-bold text-gris-texto uppercase">Margen Bruto Realizado</div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              +USD {Math.round(realizedGrossProfitUsd).toLocaleString()}
            </div>
            <p className="text-[10px] text-gris-texto mt-0.5">Margen neto post costos internos</p>
          </div>

          <div className="p-4 rounded-xl bg-negro border border-borde">
            <div className="text-[11px] font-bold text-gris-texto uppercase">Comisiones Vendedores</div>
            <div className="text-xl font-black text-rojo mt-1 font-mono">
              USD {Math.round(totalCommissionsUsd).toLocaleString()}
            </div>
            <p className="text-[10px] text-gris-texto mt-0.5">Comisiones liquidadas por ventas</p>
          </div>
        </div>
      </div>

      {/* Widget: Distribución por Antigüedad del Stock */}
      <div className="p-5 rounded-xl bg-panel border border-borde space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rojo" />
            <span>Antigüedad del Stock ({activeStock.length} unidades {conditionFilter !== 'todos' ? `• ${conditionFilter}` : ''})</span>
          </h3>
          <span className="text-[11px] text-gris-texto">Control de rotación e inmovilización</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-negro border border-borde">
            <div className="text-[10px] font-bold uppercase text-gris-texto">0 a 30 días</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{stockAgeBuckets.under30}</div>
            <div className="text-[10px] text-gris-texto mt-0.5 font-bold">Ingreso reciente</div>
          </div>

          <div className="p-3.5 rounded-xl bg-negro border border-borde">
            <div className="text-[10px] font-bold uppercase text-gris-texto">31 a 60 días</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{stockAgeBuckets.days30to60}</div>
            <div className="text-[10px] text-gris-texto mt-0.5 font-bold">Rotación normal</div>
          </div>

          <div className="p-3.5 rounded-xl bg-negro border border-borde">
            <div className="text-[10px] font-bold uppercase text-gris-texto">61 a 90 días</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{stockAgeBuckets.days60to90}</div>
            <div className="text-[10px] text-gris-texto mt-0.5 font-bold">Atención comercial</div>
          </div>

          <div className="p-3.5 rounded-xl bg-negro border border-borde">
            <div className="text-[10px] font-bold uppercase text-gris-texto">&gt; 90 días</div>
            <div className="text-2xl font-black text-rojo mt-1 font-mono">{stockAgeBuckets.over90}</div>
            <div className="text-[10px] text-rojo mt-0.5 font-bold">Rebaja sugerida</div>
          </div>
        </div>
      </div>

      {/* Tabla de Últimas Ventas */}
      {soldVehicles.length > 0 && (
        <div className="p-5 rounded-xl bg-panel border border-borde space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Detalle de Ventas Registradas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-borde text-gris-texto text-[10px] font-black uppercase tracking-wider">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Auto / Matrícula o Chasis</th>
                  <th className="p-2.5">Condición</th>
                  <th className="p-2.5">Comprador</th>
                  <th className="p-2.5">Medio de Pago</th>
                  <th className="p-2.5 text-right">Precio Venta</th>
                  <th className="p-2.5 text-right">Ganancia Bruta</th>
                  <th className="p-2.5 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {soldVehicles.map((car) => {
                  const sale = car.sale_record;
                  return (
                    <tr key={car.id} className="hover:bg-negro transition-colors">
                      <td className="p-2.5 text-gris-texto font-mono text-[11px]">
                        {sale?.sale_date || car.updated_at.slice(0, 10)}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-white">
                          {car.brand} {car.model}
                        </div>
                        <div className="font-mono text-[10px] text-gris-texto">
                          {car.plate || car.chassis_vin || 'Sin matrícula'}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-negro border border-borde text-white">
                          {car.condition === '0km' ? '0km' : 'Usado'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="text-white font-medium">{sale?.buyer_name || 'Comprador'}</div>
                        <div className="text-[10px] text-gris-texto">{sale?.buyer_phone}</div>
                      </td>
                      <td className="p-2.5 text-gris-texto capitalize">
                        {sale?.payment_method || 'Contado'}
                      </td>
                      <td className="p-2.5 text-right font-black text-white font-mono">
                        USD {(sale?.sale_price || car.sale_price).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-black text-white font-mono">
                        +USD {Math.round(sale?.gross_profit_usd || car.estimated_margin_usd || 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono text-rojo font-bold">
                        USD {sale?.commission_amount || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Car,
  Clock,
  AlertTriangle,
  Award,
  Users,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { DealershipVehicle } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export const DealershipDashboardSection: React.FC = () => {
  const { dealershipVehicles, dealershipInquiries } = useData();
  const { profile } = useAuth();

  const isAdmin = profile?.roles.includes('admin');

  // Filtro de Mes
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [useAllTime, setUseAllTime] = useState(false);

  // 1. Stock Activo (no vendido ni descartado)
  const activeStock = useMemo(() => {
    return dealershipVehicles.filter((v) =>
      ['comprado', 'preparacion', 'publicado', 'reservado'].includes(v.status)
    );
  }, [dealershipVehicles]);

  // 2. Capital Inmovilizado en Stock (Total USD)
  const totalCapitalTiedUp = useMemo(() => {
    return activeStock.reduce((acc, car) => acc + (car.total_real_cost_usd || car.purchase_price || 0), 0);
  }, [activeStock]);

  // 3. Margen Proyectado en Stock
  const totalProjectedMargin = useMemo(() => {
    return activeStock.reduce((acc, car) => acc + (car.estimated_margin_usd || 0), 0);
  }, [activeStock]);

  // 4. Promedio de Días en Stock
  const averageDaysInStock = useMemo(() => {
    if (activeStock.length === 0) return 0;
    const totalDays = activeStock.reduce((acc, car) => {
      const start = new Date(car.purchase_date || car.created_at).getTime();
      const days = Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
      return acc + days;
    }, 0);
    return Math.round(totalDays / activeStock.length);
  }, [activeStock]);

  // 5. Antigüedad del Stock (Distribución)
  const stockAgeBuckets = useMemo(() => {
    const buckets = {
      under30: 0,
      days30to60: 0,
      days60to90: 0,
      over90: 0
    };

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

  // 6. Ventas del Período Seleccionado
  const soldVehicles = useMemo(() => {
    return dealershipVehicles.filter((v) => {
      if (v.status !== 'vendido') return false;
      if (useAllTime) return true;
      const saleDate = v.sale_record?.sale_date || v.updated_at;
      return saleDate.startsWith(selectedMonth);
    });
  }, [dealershipVehicles, selectedMonth, useAllTime]);

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

  // 7. Conversión CRM
  const crmConversionRate = useMemo(() => {
    if (dealershipInquiries.length === 0) return 0;
    const wonInquiries = dealershipInquiries.filter((i) => i.status === 'Ganada' || i.status === 'Vendido').length;
    return ((wonInquiries / dealershipInquiries.length) * 100).toFixed(1);
  }, [dealershipInquiries]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[#101520] border border-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-white">Métricas y Rentabilidad Restringidas</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          El análisis financiero, capital inmovilizado y comisiones liquidadas solo están disponibles para Administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera & Selector de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Métricas Financieras &amp; Rentabilidad</h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              ADMINISTRACIÓN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Capital inmovilizado, rotación de stock, comisiones y rentabilidad neta de la Automotora.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseAllTime(!useAllTime)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              useAllTime
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Histórico Completo
          </button>

          {!useAllTime && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>
      </div>

      {/* Tarjetas Principales de KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Capital Inmovilizado */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#101622] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Capital en Stock</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            USD {Math.round(totalCapitalTiedUp).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            En {activeStock.length} unidades disponibles
          </div>
        </div>

        {/* Margen Proyectado en Stock */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#101622] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Margen Proyectado</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            +USD {Math.round(totalProjectedMargin).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Ganancia bruta esperada del inventario
          </div>
        </div>

        {/* Días Promedio en Stock */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#101622] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Días Promedio Stock</span>
            <Clock className={`w-4 h-4 ${averageDaysInStock > 60 ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              averageDaysInStock > 60 ? 'text-amber-400' : 'text-white'
            }`}
          >
            {averageDaysInStock} días
          </div>
          <div className="text-[11px] text-slate-400">
            {averageDaysInStock > 60 ? '⚠️ Rotación lenta (>60 días)' : '✓ Rotación saludable'}
          </div>
        </div>

        {/* Conversión CRM */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#101622] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Conversión CRM</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300">
            {crmConversionRate}%
          </div>
          <div className="text-[11px] text-slate-400">
            Consultas convertidas a ventas
          </div>
        </div>
      </div>

      {/* Resultados de Ventas del Período */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#121927] to-[#0D121C] border border-emerald-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-black text-white uppercase tracking-wider">
              Rendimiento Comercial • {useAllTime ? 'Histórico Acumulado' : selectedMonth}
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            {soldVehicles.length} autos vendidos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Facturación Total</div>
            <div className="text-xl font-black text-white mt-1">
              USD {salesVolumeUsd.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Volumen bruto de ventas</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Margen Bruto Realizado</div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              +USD {Math.round(realizedGrossProfitUsd).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Margen neto post costos y alistamiento
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Comisiones a Vendedores</div>
            <div className="text-xl font-black text-amber-400 mt-1">
              USD {totalCommissionsUsd.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Generadas para el equipo comercial</p>
          </div>
        </div>
      </div>

      {/* Widget: Distribución por Antigüedad del Stock */}
      <div className="p-5 rounded-3xl bg-[#101520] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Antigüedad del Stock Actual ({activeStock.length} unidades)</span>
          </h3>
          <span className="text-[11px] text-slate-400">Control de riesgo de inmovilización</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-[10px] font-bold uppercase text-emerald-400">0 a 30 días</div>
            <div className="text-2xl font-black text-white mt-1">{stockAgeBuckets.under30}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5 font-bold">Ingreso reciente</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
            <div className="text-[10px] font-bold uppercase text-blue-400">31 a 60 días</div>
            <div className="text-2xl font-black text-white mt-1">{stockAgeBuckets.days30to60}</div>
            <div className="text-[10px] text-blue-300 mt-0.5 font-bold">Rotación normal</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
            <div className="text-[10px] font-bold uppercase text-amber-400">61 a 90 días</div>
            <div className="text-2xl font-black text-amber-300 mt-1">{stockAgeBuckets.days60to90}</div>
            <div className="text-[10px] text-amber-400 mt-0.5 font-bold">Atención comercial</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
            <div className="text-[10px] font-bold uppercase text-rose-400">&gt; 90 días</div>
            <div className="text-2xl font-black text-rose-300 mt-1">{stockAgeBuckets.over90}</div>
            <div className="text-[10px] text-rose-400 mt-0.5 font-bold">Rebaja sugerida</div>
          </div>
        </div>
      </div>

      {/* Tabla de Últimas Ventas */}
      {soldVehicles.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#101520] border border-slate-800 space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Detalle de Ventas Registradas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Auto / Matrícula</th>
                  <th className="p-2.5">Comprador</th>
                  <th className="p-2.5">Medio de Pago</th>
                  <th className="p-2.5 text-right">Precio Venta</th>
                  <th className="p-2.5 text-right">Ganancia Bruta</th>
                  <th className="p-2.5 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {soldVehicles.map((car) => {
                  const sale = car.sale_record;
                  return (
                    <tr key={car.id} className="hover:bg-slate-900/40">
                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                        {sale?.sale_date || car.updated_at.slice(0, 10)}
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-white">
                          {car.brand} {car.model}
                        </div>
                        <div className="font-mono text-[10px] text-amber-400">{car.plate}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="text-slate-200 font-medium">{sale?.buyer_name || 'Comprador'}</div>
                        <div className="text-[10px] text-slate-500">{sale?.buyer_phone}</div>
                      </td>
                      <td className="p-2.5 text-slate-300 capitalize">
                        {sale?.payment_method || 'Contado'}
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-400">
                        USD {(sale?.sale_price || car.sale_price).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-300">
                        +USD {Math.round(sale?.gross_profit_usd || car.estimated_margin_usd || 0).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-400 font-bold">
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

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  Users,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { formatCurrency } from '../../../lib/formatters';

export const DetailingDashboardSection: React.FC = () => {
  const { detailingQuotes, expenses, commissions, stockItems } = useData();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Cotizaciones del mes
  const monthQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => q.created_at.startsWith(selectedMonth));
  }, [detailingQuotes, selectedMonth]);

  // Trabajos completados del mes
  const completedQuotes = useMemo(() => {
    return monthQuotes.filter((q) => q.status === 'Trabajo Completado');
  }, [monthQuotes]);

  // 1. Ingresos brutos por trabajos completados
  const grossIncome = useMemo(() => {
    return completedQuotes.reduce((acc, curr) => acc + curr.total_amount, 0);
  }, [completedQuotes]);

  // 2. Gastos operativos del mes (Detailing + General)
  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => (e.business === 'detailing' || e.business === 'general') && e.date.startsWith(selectedMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses, selectedMonth]);

  // 3. Comisiones devengadas del mes
  const monthCommissions = useMemo(() => {
    return commissions
      .filter((c) => c.business === 'detailing' && c.created_at.startsWith(selectedMonth))
      .reduce((acc, curr) => acc + curr.commission_amount, 0);
  }, [commissions, selectedMonth]);

  // 4. Resultado Neto
  const netProfit = grossIncome - monthExpenses - monthCommissions;

  // 5. Ticket promedio
  const averageTicket = completedQuotes.length > 0 ? Math.round(grossIncome / completedQuotes.length) : 0;

  // 6. Tasa de conversión: Cotizaciones -> Trabajos Completados
  const conversionRate = monthQuotes.length > 0 ? Math.round((completedQuotes.length / monthQuotes.length) * 100) : 0;

  // 7. Servicios más vendidos
  const topServices = useMemo(() => {
    const counts: Record<string, { name: string; count: number; total: number }> = {};
    completedQuotes.forEach((q) => {
      q.selected_services.forEach((s) => {
        if (!counts[s.serviceName]) {
          counts[s.serviceName] = { name: s.serviceName, count: 0, total: 0 };
        }
        counts[s.serviceName].count += 1;
        counts[s.serviceName].total += s.price;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [completedQuotes]);

  // 8. Trabajos por empleado
  const jobsByEmployee = useMemo(() => {
    const counts: Record<string, { name: string; count: number; billed: number }> = {};
    completedQuotes.forEach((q) => {
      const empName = q.assigned_to === 'user-maxi' ? 'Maximiliano Irujo' :
                      q.assigned_to === 'user-matias' ? 'Matías Pereyra' : 'Maximiliano Irujo';
      if (!counts[empName]) {
        counts[empName] = { name: empName, count: 0, billed: 0 };
      }
      counts[empName].count += 1;
      counts[empName].billed += q.total_amount;
    });
    return Object.values(counts);
  }, [completedQuotes]);

  // Insumos con stock crítico
  const lowStock = useMemo(() => {
    return stockItems.filter((s) => (s.business === 'detailing' || s.business === 'general') && s.quantity <= s.min_stock);
  }, [stockItems]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Selector de Mes y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span>Balance Financiero &amp; Métricas DetailVlak</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-negro border border-borde text-gris-texto font-bold">
              Solo Admin
            </span>
          </h3>
          <p className="text-xs text-gris-texto">
            Resumen de rentabilidad, ticket promedio y conversión del taller de Shangrilá.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-panel border border-borde rounded-xl px-3 py-1.5 text-xs text-white self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-rojo" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none"
          />
        </div>
      </div>

      {/* 4 Métricas Financieras Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-1">
          <div className="text-[11px] font-bold text-gris-texto flex items-center justify-between">
            <span>Ingresos (Trabajos)</span>
            <ArrowUpRight className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatCurrency(grossIncome, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto">{completedQuotes.length} autos entregados</p>
        </div>

        {/* Gastos */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-1">
          <div className="text-[11px] font-bold text-gris-texto flex items-center justify-between">
            <span>Gastos Operativos</span>
            <DollarSign className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rojo font-mono">
            -{formatCurrency(monthExpenses, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto">Insumos y servicios</p>
        </div>

        {/* Comisiones */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-1">
          <div className="text-[11px] font-bold text-gris-texto flex items-center justify-between">
            <span>Comisiones (30%)</span>
            <TrendingUp className="w-4 h-4 text-rojo" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rojo font-mono">
            -{formatCurrency(monthCommissions, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto">Devengadas del mes</p>
        </div>

        {/* Margen Neto */}
        <div className="p-4 sm:p-5 rounded-xl bg-panel border border-borde space-y-1">
          <div className="text-[11px] font-bold text-gris-texto flex items-center justify-between">
            <span>Resultado Neto</span>
            <Sparkles className="w-4 h-4 text-rojo" />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${netProfit >= 0 ? 'text-white' : 'text-rojo'}`}>
            {formatCurrency(netProfit, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto">Ingresos - Gastos - Comisiones</p>
        </div>
      </div>

      {/* Métricas Operativas Clave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gris-texto">Ticket Promedio</div>
          <div className="text-lg sm:text-xl font-black text-white font-mono mt-1">
            {formatCurrency(averageTicket, 'UYU')}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">Por vehículo atendido</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gris-texto">Tasa de Conversión</div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">
            {conversionRate}%
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">
            {completedQuotes.length} de {monthQuotes.length} cotizaciones
          </p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gris-texto">Total Cotizaciones</div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">
            {monthQuotes.length}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">Recibidas en el mes</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-borde">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gris-texto">Stock Crítico</div>
          <div className={`text-lg sm:text-xl font-black mt-1 ${lowStock.length > 0 ? 'text-rojo' : 'text-white'}`}>
            {lowStock.length}
          </div>
          <p className="text-[10px] text-gris-texto mt-0.5">Productos por debajo del mín.</p>
        </div>
      </div>

      {/* Tablas Desglosadas: Servicios Más Vendidos & Trabajos por Empleado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Servicios Más Vendidos */}
        <div className="p-5 rounded-xl bg-panel border border-borde space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-rojo" />
            <span>Servicios Más Solicitados</span>
          </h4>

          {topServices.length === 0 ? (
            <p className="text-xs text-gris-texto">Sin trabajos completados en este mes</p>
          ) : (
            <div className="space-y-2.5">
              {topServices.map((serv, index) => (
                <div key={serv.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-negro border border-borde text-rojo font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{serv.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gris-texto font-bold">{serv.count} trabajos</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(serv.total, 'UYU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trabajos por Empleado */}
        <div className="p-5 rounded-xl bg-panel border border-borde space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-rojo" />
            <span>Rendimiento por Detailer</span>
          </h4>

          {jobsByEmployee.length === 0 ? (
            <p className="text-xs text-gris-texto">Sin registros asignados en este mes</p>
          ) : (
            <div className="space-y-3">
              {jobsByEmployee.map((emp) => (
                <div key={emp.name} className="p-3 rounded-xl bg-negro border border-borde flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{emp.name}</div>
                    <div className="text-[10px] text-gris-texto">{emp.count} trabajos completados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gris-texto uppercase font-bold">Total Facturado</div>
                    <div className="font-mono font-bold text-white">
                      {formatCurrency(emp.billed, 'UYU')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

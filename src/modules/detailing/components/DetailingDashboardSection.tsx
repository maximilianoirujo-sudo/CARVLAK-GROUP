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
          <h3 className="text-base font-bold text-[#161616] flex items-center gap-2">
            <span>Balance financiero y métricas DetailVlak</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-medium">
              Solo admin
            </span>
          </h3>
          <p className="text-xs text-[#6B6B6B]">
            Resumen de rentabilidad, ticket promedio y conversión del taller de Shangrilá.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] self-start sm:self-auto shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-[#D7141A]" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-[#161616] font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* 4 Métricas Financieras Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Ingresos (trabajos)</span>
            <ArrowUpRight className="w-4 h-4 text-[#1E6B43]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#161616] font-mono">
            {formatCurrency(grossIncome, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">{completedQuotes.length} autos entregados</p>
        </div>

        {/* Gastos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Gastos operativos</span>
            <DollarSign className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D7141A] font-mono">
            -{formatCurrency(monthExpenses, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">Insumos y servicios</p>
        </div>

        {/* Comisiones */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Comisiones (30%)</span>
            <TrendingUp className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D7141A] font-mono">
            -{formatCurrency(monthCommissions, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">Devengadas del mes</p>
        </div>

        {/* Margen Neto */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Resultado neto</span>
            <Sparkles className="w-4 h-4 text-[#161616]" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-[#161616]' : 'text-[#D7141A]'}`}>
            {formatCurrency(netProfit, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">Ingresos - gastos - comisiones</p>
        </div>
      </div>

      {/* Métricas Operativas Clave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Ticket promedio</div>
          <div className="text-lg sm:text-xl font-bold text-[#161616] font-mono mt-1">
            {formatCurrency(averageTicket, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Por vehículo atendido</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Tasa de conversión</div>
          <div className="text-lg sm:text-xl font-bold text-[#161616] mt-1">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            {completedQuotes.length} de {monthQuotes.length} cotizaciones
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Total cotizaciones</div>
          <div className="text-lg sm:text-xl font-bold text-[#161616] mt-1">
            {monthQuotes.length}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Recibidas en el mes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Stock crítico</div>
          <div className={`text-lg sm:text-xl font-bold mt-1 ${lowStock.length > 0 ? 'text-[#D7141A]' : 'text-[#161616]'}`}>
            {lowStock.length}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Productos por debajo del mín.</p>
        </div>
      </div>

      {/* Tablas Desglosadas: Servicios Más Vendidos & Trabajos por Empleado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Servicios Más Vendidos */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
          <h4 className="text-xs font-bold text-[#161616] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#D7141A]" />
            <span>Servicios más solicitados</span>
          </h4>

          {topServices.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">Sin trabajos completados en este mes</p>
          ) : (
            <div className="space-y-2.5">
              {topServices.map((serv, index) => (
                <div key={serv.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-[#161616] font-medium">{serv.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#6B6B6B]">{serv.count} trabajos</span>
                    <span className="font-mono font-semibold text-[#161616]">
                      {formatCurrency(serv.total, 'UYU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trabajos por Empleado */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
          <h4 className="text-xs font-bold text-[#161616] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D7141A]" />
            <span>Rendimiento por detailer</span>
          </h4>

          {jobsByEmployee.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">Sin registros asignados en este mes</p>
          ) : (
            <div className="space-y-3">
              {jobsByEmployee.map((emp) => (
                <div key={emp.name} className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#161616]">{emp.name}</div>
                    <div className="text-[11px] text-[#6B6B6B]">{emp.count} trabajos completados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#6B6B6B] font-medium">Total facturado</div>
                    <div className="font-mono font-bold text-[#161616]">
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

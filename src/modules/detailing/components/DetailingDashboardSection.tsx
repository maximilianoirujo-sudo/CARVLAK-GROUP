import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  Users,
  Layers,
  CheckCircle2,
  Package,
  AlertTriangle,
  Building2,
  Car
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  formatCurrency,
  getLocalMonthString,
  getDetailingPaidAmount,
  getDetailingPaymentStatus,
  isActiveJob,
  isActiveExpense,
  isActivePayment
} from '../../../lib/formatters';

export const DetailingDashboardSection: React.FC = () => {
  const { detailingQuotes, expenses, commissions, stockItems } = useData();
  const { availableProfiles } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthString()); // YYYY-MM

  // Trabajos activos del mes basados en work_date y excluyendo anulados/archivados
  const monthQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      const d = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
      return d.startsWith(selectedMonth) && isActiveJob(q);
    });
  }, [detailingQuotes, selectedMonth]);

  // 1. Ingresos brutos facturados
  const grossIncome = useMemo(() => {
    return monthQuotes.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  }, [monthQuotes]);

  // 2. Cobros reales ingresados
  const totalCollected = useMemo(() => {
    return monthQuotes.reduce((acc, curr) => acc + getDetailingPaidAmount(curr), 0);
  }, [monthQuotes]);

  // 3. Gastos operativos del mes
  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => isActiveExpense(e) && e.business === 'detailing' && e.date.startsWith(selectedMonth))
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses, selectedMonth]);

  // 4. Comisiones del mes
  const monthCommissions = useMemo(() => {
    return commissions
      .filter((c) => {
        if (c.business !== 'detailing' || !c.created_at.startsWith(selectedMonth)) return false;
        if (c.quote_id) {
          const relatedQuote = detailingQuotes.find((q) => q.id === c.quote_id);
          if (relatedQuote && !isActiveJob(relatedQuote)) return false;
        }
        return true;
      })
      .reduce((acc, curr) => acc + (Number(curr.commission_amount) || 0), 0);
  }, [commissions, detailingQuotes, selectedMonth]);

  // 5. Resultado Neto estimado
  const netProfit = grossIncome - monthExpenses - monthCommissions;

  // 6. Ticket promedio por trabajo
  const averageTicket = monthQuotes.length > 0 ? Math.round(grossIncome / monthQuotes.length) : 0;

  // 7. Productos con bajo stock
  const lowStock = useMemo(() => {
    return stockItems.filter((s) => !s.is_archived && s.business === 'detailing' && s.quantity <= s.min_stock);
  }, [stockItems]);

  // 8. Servicios más vendidos
  const topServices = useMemo(() => {
    const counts: Record<string, { name: string; count: number; total: number }> = {};
    monthQuotes.forEach((q) => {
      (q.selected_services || []).forEach((s) => {
        const sName = s.serviceName || s.name || 'Servicio';
        if (!counts[sName]) {
          counts[sName] = { name: sName, count: 0, total: 0 };
        }
        counts[sName].count += 1;
        counts[sName].total += s.price || 0;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [monthQuotes]);

  // 9. Rendimiento por detailer
  const jobsByEmployee = useMemo(() => {
    const empMap: Record<string, { name: string; count: number; billed: number }> = {};
    monthQuotes.forEach((q) => {
      const empId = q.assigned_to || 'unassigned';
      const empName = availableProfiles.find((p) => p.id === empId)?.full_name || 'Sin asignar';
      if (!empMap[empId]) {
        empMap[empId] = { name: empName, count: 0, billed: 0 };
      }
      empMap[empId].count += 1;
      empMap[empId].billed += q.total_amount || 0;
    });

    return Object.values(empMap).sort((a, b) => b.billed - a.billed);
  }, [monthQuotes, availableProfiles]);

  // 10. Desglose Facturación: Particulares vs Empresas
  const breakdownCustomerType = useMemo(() => {
    let particularCount = 0;
    let particularBilled = 0;
    let empresaCount = 0;
    let empresaBilled = 0;

    monthQuotes.forEach((q) => {
      const isEmpresa = q.customer_type === 'empresa' || !!q.company_id;
      const amt = q.total_amount || 0;
      if (isEmpresa) {
        empresaCount++;
        empresaBilled += amt;
      } else {
        particularCount++;
        particularBilled += amt;
      }
    });

    const totalBilled = particularBilled + empresaBilled;
    const particularPct = totalBilled > 0 ? Math.round((particularBilled / totalBilled) * 100) : 0;
    const empresaPct = totalBilled > 0 ? 100 - particularPct : 0;

    return {
      particularCount,
      particularBilled,
      particularPct,
      empresaCount,
      empresaBilled,
      empresaPct
    };
  }, [monthQuotes]);

  // 11. Ranking de Empresas del Mes
  const topCompanies = useMemo(() => {
    const map: Record<string, { id: string; name: string; count: number; billed: number; collected: number }> = {};
    monthQuotes.forEach((q) => {
      if (q.customer_type === 'empresa' || q.company_id) {
        const id = q.company_id || q.client_name || 'unknown';
        const name = q.company_name || q.client_name || 'Empresa';
        if (!map[id]) {
          map[id] = { id, name, count: 0, billed: 0, collected: 0 };
        }
        map[id].count++;
        map[id].billed += q.total_amount || 0;
        map[id].collected += getDetailingPaidAmount(q);
      }
    });

    return Object.values(map)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 5);
  }, [monthQuotes]);

  return (
    <div className="space-y-4">
      {/* Selector de Mes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#161616]">Métricas Contables del Mes</h3>
          <p className="text-xs text-[#6B6B6B]">Rendimiento financiero y operativo de DetailVlak</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#D7141A]" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E5E5E3] text-xs font-medium text-[#161616] bg-[#F5F5F4] focus:outline-none focus:border-[#D7141A]"
          />
        </div>
      </div>

      {/* Tarjetas Principales de Ingresos y Márgenes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Facturado */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Total Facturado</span>
            <DollarSign className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#161616] font-mono">
            {formatCurrency(grossIncome, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">{monthQuotes.length} trabajos confirmados</p>
        </div>

        {/* Cobrado Real */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Cobros Ingresados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            {formatCurrency(totalCollected, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            Pendiente: {formatCurrency(Math.max(0, grossIncome - totalCollected))}
          </p>
        </div>

        {/* Gastos y Comisiones */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Egresos y Comisiones</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 font-mono">
            -{formatCurrency(monthExpenses + monthCommissions, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            Gastos: {formatCurrency(monthExpenses)} · Comis: {formatCurrency(monthCommissions)}
          </p>
        </div>

        {/* Margen Neto */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-1 shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B] flex items-center justify-between">
            <span>Resultado Neto</span>
            <Sparkles className="w-4 h-4 text-[#161616]" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-[#D7141A]'}`}>
            {formatCurrency(netProfit, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B]">Facturado - Gastos - Comisiones</p>
        </div>
      </div>

      {/* Métricas Operativas Clave */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Ticket promedio</div>
          <div className="text-lg sm:text-xl font-bold text-[#161616] font-mono mt-1">
            {formatCurrency(averageTicket, 'UYU')}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Por vehículo atendido</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Total trabajos</div>
          <div className="text-lg sm:text-xl font-bold text-[#161616] mt-1 font-mono">
            {monthQuotes.length}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">En el mes {selectedMonth}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Insumos bajo mínimo</div>
          <div className={`text-lg sm:text-xl font-bold mt-1 font-mono ${lowStock.length > 0 ? 'text-[#D7141A]' : 'text-emerald-600'}`}>
            {lowStock.length}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Requieren reposición</p>
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
            <p className="text-xs text-[#6B6B6B]">Sin trabajos registrados en este mes</p>
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

        {/* Trabajos por Detailer */}
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
                    <div className="text-[11px] text-[#6B6B6B]">{emp.count} trabajos realizados</div>
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

      {/* 4. Comparación: Empresas vs Particulares y Ranking de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empresas vs Particulares */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#161616] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D7141A]" />
              <span>Facturación: Empresas vs. Particulares</span>
            </h4>
            <span className="text-[10px] text-[#6B6B6B] font-mono">
              Total: {formatCurrency(grossIncome, 'UYU')}
            </span>
          </div>

          {/* Barra de proporción visual */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${breakdownCustomerType.empresaPct}%` }}
                className="bg-[#D7141A] h-full transition-all duration-300"
                title={`Empresas: ${breakdownCustomerType.empresaPct}%`}
              />
              <div
                style={{ width: `${breakdownCustomerType.particularPct}%` }}
                className="bg-neutral-800 h-full transition-all duration-300"
                title={`Particulares: ${breakdownCustomerType.particularPct}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#6B6B6B] px-0.5">
              <span className="flex items-center gap-1 font-semibold text-[#D7141A]">
                <span className="w-2 h-2 rounded-full bg-[#D7141A] inline-block" />
                Empresas ({breakdownCustomerType.empresaPct}%)
              </span>
              <span className="flex items-center gap-1 font-semibold text-neutral-800">
                <span className="w-2 h-2 rounded-full bg-neutral-800 inline-block" />
                Particulares ({breakdownCustomerType.particularPct}%)
              </span>
            </div>
          </div>

          {/* Tarjetas lado a lado */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D7141A]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresas</span>
              </div>
              <div className="text-base font-bold font-mono text-neutral-900">
                {formatCurrency(breakdownCustomerType.empresaBilled, 'UYU')}
              </div>
              <p className="text-[10px] text-[#6B6B6B]">
                {breakdownCustomerType.empresaCount} {breakdownCustomerType.empresaCount === 1 ? 'auto preparado' : 'autos preparados'}
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-[#E5E5E3] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                <Car className="w-3.5 h-3.5" />
                <span>Particulares</span>
              </div>
              <div className="text-base font-bold font-mono text-neutral-900">
                {formatCurrency(breakdownCustomerType.particularBilled, 'UYU')}
              </div>
              <p className="text-[10px] text-[#6B6B6B]">
                {breakdownCustomerType.particularCount} {breakdownCustomerType.particularCount === 1 ? 'trabajo' : 'trabajos'}
              </p>
            </div>
          </div>
        </div>

        {/* Ranking de Empresas del Mes */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
          <h4 className="text-xs font-bold text-[#161616] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D7141A]" />
            <span>Ranking de Empresas del Mes</span>
          </h4>

          {topCompanies.length === 0 ? (
            <p className="text-xs text-[#6B6B6B]">Sin trabajos de automotoras o empresas registrados este mes</p>
          ) : (
            <div className="space-y-2.5">
              {topCompanies.map((comp, idx) => {
                const pending = Math.max(0, comp.billed - comp.collected);
                return (
                  <div key={comp.id} className="p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-white border border-[#E5E5E3] text-[#D7141A] font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 truncate">{comp.name}</div>
                        <div className="text-[10px] text-[#6B6B6B]">
                          {comp.count} {comp.count === 1 ? 'auto' : 'autos'}
                          {pending > 0 ? (
                            <span className="text-[#D7141A] font-semibold ml-1.5">
                              · Saldo pendiente: {formatCurrency(pending, 'UYU')}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold ml-1.5">· Al día</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-neutral-900">
                        {formatCurrency(comp.billed, 'UYU')}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-mono">
                        Cobrado: {formatCurrency(comp.collected, 'UYU')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

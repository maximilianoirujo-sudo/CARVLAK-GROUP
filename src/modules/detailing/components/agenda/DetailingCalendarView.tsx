import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Car
} from 'lucide-react';
import { DetailingQuote } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import {
  formatCurrency,
  getLocalDateString,
  getDetailingPaymentStatus,
  getDetailingPaidAmount,
  isJobScheduled,
  isActiveJob,
  isActivePayment
} from '../../../../lib/formatters';
import { Button } from '../../../../components/ui/Button';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';
import { DetailingQuoterModal } from '../DetailingQuoterModal';
import { DetailingPaymentRecordModal } from '../DetailingPaymentRecordModal';

interface DetailingCalendarViewProps {
  onOpenNewQuote?: (dateStr?: string) => void;
}

export const DetailingCalendarView: React.FC<DetailingCalendarViewProps> = () => {
  const { detailingQuotes } = useData();

  const todayUY = getLocalDateString();
  const [currentYear, setCurrentYear] = useState<number>(() => Number(todayUY.slice(0, 4)));
  const [currentMonth, setCurrentMonth] = useState<number>(() => Number(todayUY.slice(5, 7))); // 1-12

  const [selectedDate, setSelectedDate] = useState<string>(todayUY);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'particular' | 'empresa'>('all');

  // Modales
  const [isQuoterOpen, setIsQuoterOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<DetailingQuote | null>(null);
  const [quoteForPayment, setQuoteForPayment] = useState<DetailingQuote | null>(null);

  // Filtrado por Particular / Empresa / Todos
  const filteredDetailingQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (customerTypeFilter === 'particular') {
        return q.customer_type !== 'empresa' && !q.company_id;
      }
      if (customerTypeFilter === 'empresa') {
        return q.customer_type === 'empresa' || !!q.company_id;
      }
      return true;
    });
  }, [detailingQuotes, customerTypeFilter]);

  // Navegación de mes
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth - 1, 15);
    const mName = d.toLocaleString('es-UY', { month: 'long' });
    return `${mName.charAt(0).toUpperCase() + mName.slice(1)} ${currentYear}`;
  }, [currentYear, currentMonth]);

  // Trabajos del mes actual (excluyendo anulados para cálculos)
  const monthQuotes = useMemo(() => {
    return filteredDetailingQuotes.filter((q) => {
      const d = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
      return d.startsWith(currentMonthKey) && isActiveJob(q);
    });
  }, [filteredDetailingQuotes, currentMonthKey]);

  // Total facturado este mes
  const monthTotalBilled = useMemo(() => {
    return monthQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  }, [monthQuotes]);

  // Comparación con el mes anterior
  const prevMonthStats = useMemo(() => {
    const prevDate = new Date(currentYear, currentMonth - 2, 15);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevQuotes = filteredDetailingQuotes.filter((q) => {
      const d = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
      return d.startsWith(prevKey) && isActiveJob(q);
    });
    const prevTotal = prevQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);

    let diffPct: number | null = null;
    if (prevTotal > 0) {
      diffPct = Math.round(((monthTotalBilled - prevTotal) / prevTotal) * 100);
    }

    return { prevTotal, diffPct };
  }, [currentYear, currentMonth, filteredDetailingQuotes, monthTotalBilled]);

  // Día con mayor facturación del mes
  const topDayStats = useMemo(() => {
    const daysMap: Record<string, number> = {};
    monthQuotes.forEach((q) => {
      const d = q.work_date || q.created_at.slice(0, 10);
      daysMap[d] = (daysMap[d] || 0) + (q.total_amount || 0);
    });

    let bestDay = '';
    let maxBilled = 0;
    Object.entries(daysMap).forEach(([day, total]) => {
      if (total > maxBilled) {
        maxBilled = total;
        bestDay = day;
      }
    });

    return { bestDay, maxBilled };
  }, [monthQuotes]);

  // Construcción de la grilla mensual completa (5 o 6 semanas completas, sin cortar a 35)
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const totalDaysInMonth = lastDay.getDate();

    // En JS getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado.
    // Convertimos a Lunes = 0 ... Domingo = 6
    const startDayIndex = (firstDay.getDay() + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      jobs: DetailingQuote[];
      totalBilled: number;
    }[] = [];

    // Días de relleno del mes anterior
    const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 2, dNum);
      const prevStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dateStr: prevStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        jobs: [],
        totalBilled: 0
      });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayJobs = filteredDetailingQuotes.filter((q) => {
        const d = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
        return d === dateStr && isActiveJob(q);
      });
      const dayTotal = dayJobs.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        jobs: dayJobs,
        totalBilled: dayTotal
      });
    }

    // Días de relleno del próximo mes para completar semanas completas
    const remainder = days.length % 7;
    if (remainder > 0) {
      const daysToAdd = 7 - remainder;
      for (let i = 1; i <= daysToAdd; i++) {
        const nextDate = new Date(currentYear, currentMonth, i);
        const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          dateStr: nextStr,
          dayNumber: i,
          isCurrentMonth: false,
          jobs: [],
          totalBilled: 0
        });
      }
    }

    // Dividir en semanas de 7 días
    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [currentYear, currentMonth, filteredDetailingQuotes]);

  // Máxima facturación de un día del mes para calcular el mapa de calor
  const maxDayBillingInMonth = useMemo(() => {
    let max = 1;
    calendarWeeks.forEach((week) => {
      week.forEach((day) => {
        if (day.isCurrentMonth && day.totalBilled > max) {
          max = day.totalBilled;
        }
      });
    });
    return max;
  }, [calendarWeeks]);

  // Trabajos del día seleccionado
  const selectedDayJobs = useMemo(() => {
    return filteredDetailingQuotes.filter((q) => {
      const d = q.work_date || q.created_at.slice(0, 10);
      return d === selectedDate;
    });
  }, [filteredDetailingQuotes, selectedDate]);

  // Días para la vista "Semana" en celular
  const weekDaysForMobile = useMemo(() => {
    // Busca la semana que contiene a selectedDate
    for (const week of calendarWeeks) {
      if (week.some((d) => d.dateStr === selectedDate)) {
        return week;
      }
    }
    return calendarWeeks[0] || [];
  }, [calendarWeeks, selectedDate]);

  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-4">
      {/* 1. Métricas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Total del mes */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Facturación del mes</span>
          <p className="text-xl font-bold font-mono text-[#161616] mt-0.5">
            {formatCurrency(monthTotalBilled)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">
            {monthQuotes.length} {monthQuotes.length === 1 ? 'trabajo confirmado' : 'trabajos confirmados'}
          </span>
        </div>

        {/* Comparación con mes anterior */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Vs. Mes anterior</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {prevMonthStats.diffPct !== null ? (
              <>
                {prevMonthStats.diffPct >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <span
                  className={`text-xl font-bold font-mono ${
                    prevMonthStats.diffPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {prevMonthStats.diffPct > 0 ? `+${prevMonthStats.diffPct}%` : `${prevMonthStats.diffPct}%`}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-[#6B6B6B]">Sin datos previos</span>
            )}
          </div>
          <span className="text-[10px] text-[#6B6B6B] block">
            Anterior: {formatCurrency(prevMonthStats.prevTotal)}
          </span>
        </div>

        {/* Día récord de facturación */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Día pico de facturación</span>
          <p className="text-xl font-bold font-mono text-[#D7141A] mt-0.5">
            {topDayStats.maxBilled > 0 ? formatCurrency(topDayStats.maxBilled) : '$0'}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">
            {topDayStats.bestDay ? topDayStats.bestDay : 'Sin trabajos aún'}
          </span>
        </div>
      </div>

      {/* 2. Barra de Control de Navegación y Vistas */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base sm:text-lg font-bold font-display text-[#161616] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#D7141A]" />
            {monthLabel}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro Particular / Empresas / Todos */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#F5F5F4] p-0.5 rounded-xl border border-[#E5E5E3] text-xs">
            <button
              type="button"
              onClick={() => setCustomerTypeFilter('all')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                customerTypeFilter === 'all' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setCustomerTypeFilter('particular')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                customerTypeFilter === 'particular' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
              }`}
            >
              Particular
            </button>
            <button
              type="button"
              onClick={() => setCustomerTypeFilter('empresa')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                customerTypeFilter === 'empresa' ? 'bg-white text-[#D7141A] shadow-xs' : 'text-[#6B6B6B]'
              }`}
            >
              Empresas
            </button>
          </div>

          {/* Toggle Vista en Celular */}
          <div className="sm:hidden flex bg-[#F5F5F4] p-0.5 rounded-xl border border-[#E5E5E3]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                viewMode === 'month' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                viewMode === 'week' ? 'bg-white text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grilla de Calendario Mensual */}
      {viewMode === 'month' ? (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 sm:p-4 shadow-xs overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {weekDayNames.map((name) => (
              <span key={name} className="text-[11px] sm:text-xs font-bold text-[#6B6B6B] uppercase">
                {name}
              </span>
            ))}
          </div>

          {/* Grilla de semanas */}
          <div className="space-y-1 sm:space-y-2">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
                {week.map((cell) => {
                  const isSelected = cell.dateStr === selectedDate;
                  const isToday = cell.dateStr === todayUY;
                  const isFutureWithJobs = cell.dateStr > todayUY && cell.jobs.length > 0;

                  // Cálculo de intensidad del mapa de calor
                  let heatBg = 'bg-white';
                  if (cell.isCurrentMonth && cell.totalBilled > 0) {
                    const ratio = cell.totalBilled / maxDayBillingInMonth;
                    if (ratio <= 0.33) {
                      heatBg = 'bg-red-50 text-[#161616]';
                    } else if (ratio <= 0.66) {
                      heatBg = 'bg-red-100/70 text-[#161616]';
                    } else {
                      heatBg = 'bg-red-200/80 text-[#161616]';
                    }
                  } else if (!cell.isCurrentMonth) {
                    heatBg = 'bg-[#FAFAFA] opacity-40';
                  }

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateStr)}
                      className={`min-h-[64px] sm:min-h-[80px] p-1.5 sm:p-2 rounded-xl transition-all text-left flex flex-col justify-between cursor-pointer border ${
                        isSelected
                          ? 'border-[#D7141A] ring-2 ring-[#D7141A]/20 shadow-xs'
                          : isFutureWithJobs
                          ? 'border-2 border-dashed border-gray-400'
                          : isToday
                          ? 'border-[#161616] font-bold'
                          : 'border-[#E5E5E3] hover:border-[#161616]'
                      } ${heatBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs sm:text-sm font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                            isToday ? 'bg-[#161616] text-white' : ''
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {cell.jobs.length > 0 && (
                          <span className="text-[10px] font-bold bg-[#161616] text-white px-1.5 py-0.2 rounded-full">
                            {cell.jobs.length}
                          </span>
                        )}
                      </div>

                      {cell.totalBilled > 0 && cell.isCurrentMonth && (
                        <div className="mt-1">
                          <p className="text-[10px] sm:text-xs font-mono font-bold truncate text-[#161616]">
                            {formatCurrency(cell.totalBilled)}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vista de 7 Días para Celular */
        <div className="bg-white border border-[#E5E5E3] rounded-2xl divide-y divide-[#E5E5E3] overflow-hidden shadow-xs">
          {weekDaysForMobile.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const isToday = cell.dateStr === todayUY;
            const isFutureWithJobs = cell.dateStr > todayUY && cell.jobs.length > 0;

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-red-50' : 'hover:bg-[#F5F5F4]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#161616]">
                      {cell.dateStr}
                    </span>
                    {isToday && (
                      <span className="text-[9px] bg-[#161616] text-white font-bold px-1.5 py-0.5 rounded">
                        Hoy
                      </span>
                    )}
                    {isFutureWithJobs && (
                      <span className="text-[9px] border border-dashed border-gray-500 text-gray-700 px-1 rounded">
                        Programado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    {cell.jobs.length} {cell.jobs.length === 1 ? 'trabajo' : 'trabajos'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[#161616]">
                    {formatCurrency(cell.totalBilled)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Trabajos del Día Seleccionado */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
          <div>
            <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider font-semibold">
              Detalle del día
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#161616] flex items-center gap-2">
              <span>{selectedDate}</span>
              {isJobScheduled(selectedDate) && (
                <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                  Programado
                </span>
              )}
            </h3>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setQuoteToEdit(null);
              setIsQuoterOpen(true);
            }}
            className="bg-[#D7141A] hover:bg-[#b01015]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Nuevo trabajo
          </Button>
        </div>

        {selectedDayJobs.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#6B6B6B]">
            No hay trabajos registrados para este día. Tocá "+ Nuevo trabajo" para cargar uno.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E3]">
            {selectedDayJobs.map((q) => {
              const status = getDetailingPaymentStatus(q);
              return (
                <div
                  key={q.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#161616]">{q.vehicle_info}</span>
                      {q.vehicle_plate && <UruguayanPlate plate={q.vehicle_plate} size="sm" />}
                      {q.customer_type === 'empresa' && (
                        <span className="text-[9px] bg-red-100 text-[#D7141A] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          EMPRESA · {q.company_name || 'Empresa'}
                        </span>
                      )}
                      {q.is_voided && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                          ANULADO
                        </span>
                      )}
                    </div>
                    <p className="text-[#6B6B6B] mt-0.5">
                      <span className="font-medium text-[#161616]">
                        {q.customer_type === 'empresa' ? (q.company_name || q.client_name) : q.client_name}
                      </span> ·{' '}
                      {(q.selected_services || []).map((s) => s.serviceName || s.name).join(', ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold font-mono text-sm text-[#161616]">
                      {formatCurrency(q.total_amount)}
                    </p>
                    <div className="mt-0.5">
                      {status === 'Cobrado' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Cobrado
                        </span>
                      ) : status === 'Cobro parcial' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Parcial ({formatCurrency(getDetailingPaidAmount(q))})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#D7141A] bg-red-50 px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Trabajo */}
      {isQuoterOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterOpen}
          onClose={() => setIsQuoterOpen(false)}
          quoteToEdit={quoteToEdit}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};

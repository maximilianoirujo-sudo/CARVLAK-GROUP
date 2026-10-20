import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Edit2,
  Ban,
  Trash2,
  X,
  CreditCard,
  User,
  Car,
  Sparkles,
  Share2,
  RefreshCw
} from 'lucide-react';
import { DetailingQuote, DetailingPaymentStatus } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  formatCurrency,
  getLocalDateString,
  getDetailingPaymentStatus,
  getDetailingPaidAmount,
  isJobScheduled,
  isActiveJob,
  isActiveExpense,
  isActivePayment,
  getJobPerformersSummary
} from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';
import { DetailingVoidModal } from './DetailingVoidModal';
import { DetailingPaymentRecordModal } from './DetailingPaymentRecordModal';
import { DetailingQuoterModal } from './DetailingQuoterModal';
import { DetailingCompanyJobModal } from './DetailingCompanyJobModal';
import { DetailingReceiptView } from './receipts/DetailingReceiptView';

export const DetailingMonthJobsSection: React.FC = () => {
  const {
    detailingQuotes,
    expenses,
    commissions,
    detailingReceipts,
    voidDetailingQuote,
    bulkVoidDetailingQuotes,
    detailingConfig,
    generateDetailingReceipt,
    refreshData,
    isSyncing
  } = useData();
  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  // Selector de Mes (Formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getLocalDateString().slice(0, 7);
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [detailerFilter, setDetailerFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'particular' | 'empresa'>('all');

  // Selección múltiple para anular
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  // Modales
  const [activeQuoteForDetail, setActiveQuoteForDetail] = useState<DetailingQuote | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<DetailingQuote | null>(null);
  const [isQuoterModalOpen, setIsQuoterModalOpen] = useState(false);
  const [isCompanyJobModalOpen, setIsCompanyJobModalOpen] = useState(false);
  const [quoteForPayment, setQuoteForPayment] = useState<DetailingQuote | null>(null);
  const [quoteToVoid, setQuoteToVoid] = useState<DetailingQuote | null>(null);
  const [isBulkVoidModalOpen, setIsBulkVoidModalOpen] = useState(false);
  const [activeReceiptToView, setActiveReceiptToView] = useState<any | null>(null);

  // Navegación de mes
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const yStr = prevDate.getFullYear();
    const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
    setSelectedQuoteIds([]);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const yStr = nextDate.getFullYear();
    const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
    setSelectedQuoteIds([]);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    const name = date.toLocaleString('es-UY', { month: 'long' });
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
  }, [selectedMonth]);

  // Trabajos del mes
  const monthQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (q.deleted_at) return false;
      const qDate = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
      return qDate.startsWith(selectedMonth);
    });
  }, [detailingQuotes, selectedMonth]);

  // Trabajos activos (no anulados) del mes
  const activeMonthQuotes = useMemo(() => {
    return monthQuotes.filter(isActiveJob);
  }, [monthQuotes]);

  // Tarjetas de Resumen
  const totalJobsCount = activeMonthQuotes.length;

  const totalBilled = useMemo(() => {
    return activeMonthQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  }, [activeMonthQuotes]);

  const totalCollected = useMemo(() => {
    return activeMonthQuotes.reduce((sum, q) => sum + getDetailingPaidAmount(q), 0);
  }, [activeMonthQuotes]);

  const totalPending = Math.max(0, totalBilled - totalCollected);

  const totalExpenses = useMemo(() => {
    return (expenses || [])
      .filter((e) => (e.business === 'detailing' || e.business === 'general' || !e.business) && isActiveExpense(e) && !e.deleted_at && String(e.date || '').startsWith(selectedMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, selectedMonth]);

  const totalCommissions = useMemo(() => {
    return commissions
      .filter((c) => {
        if (c.deleted_at) return false;
        const cDate = c.job_date || (c.created_at ? c.created_at.slice(0, 10) : '');
        if ((c.business && c.business !== 'detailing') || !cDate.startsWith(selectedMonth)) return false;
        if (c.quote_id) {
          const rel = detailingQuotes.find((q) => q.id === c.quote_id);
          if (rel && !isActiveJob(rel)) return false;
        }
        return true;
      })
      .reduce((sum, c) => sum + (Number(c.amount ?? c.commission_amount) || 0), 0);
  }, [commissions, detailingQuotes, selectedMonth]);

  const netResult = totalBilled - totalExpenses - totalCommissions;

  // Filtrado de la lista
  const filteredQuotes = useMemo(() => {
    return monthQuotes.filter((q) => {
      // Búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchClient = (q.client_name || '').toLowerCase().includes(term);
        const matchPlate = (q.vehicle_plate || '').toLowerCase().includes(term);
        const matchVeh = (q.vehicle_info || '').toLowerCase().includes(term);
        if (!matchClient && !matchPlate && !matchVeh) return false;
      }

      // Estado de cobro
      if (paymentStatusFilter !== 'all') {
        const status = getDetailingPaymentStatus(q);
        if (status !== paymentStatusFilter) return false;
      }

      // Responsable
      if (detailerFilter !== 'all') {
        const inParticipants = (q.commission_participants || []).some(
          (p) => p.employee_id === detailerFilter
        );
        if (q.assigned_to !== detailerFilter && !inParticipants) return false;
      }

      // Origen
      if (originFilter !== 'all') {
        if (q.origin !== originFilter) return false;
      }

      // Tipo de cliente (Particular vs Empresas)
      if (customerTypeFilter === 'particular') {
        if (q.customer_type === 'empresa' || q.company_id) return false;
      } else if (customerTypeFilter === 'empresa') {
        if (q.customer_type !== 'empresa' && !q.company_id) return false;
      }

      return true;
    });
  }, [monthQuotes, searchTerm, paymentStatusFilter, detailerFilter, originFilter, customerTypeFilter]);

  // Agrupados por día (ordenados más nuevos arriba)
  const groupedByDay = useMemo(() => {
    const groups: Record<string, DetailingQuote[]> = {};
    filteredQuotes.forEach((q) => {
      const day = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : 'Sin fecha');
      if (!groups[day]) groups[day] = [];
      groups[day].push(q);
    });

    const sortedDays = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDays.map((day) => ({
      day,
      quotes: groups[day]
    }));
  }, [filteredQuotes]);

  // Selección múltiple
  const handleToggleSelectAllInMonth = () => {
    const nonVoidedIds = filteredQuotes.filter((q) => !q.is_voided).map((q) => q.id);
    if (selectedQuoteIds.length === nonVoidedIds.length && nonVoidedIds.length > 0) {
      setSelectedQuoteIds([]);
    } else {
      setSelectedQuoteIds(nonVoidedIds);
    }
  };

  const handleToggleSelectQuote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkVoid = (reason: string) => {
    bulkVoidDetailingQuotes(selectedQuoteIds, reason);
    showToast(`${selectedQuoteIds.length} trabajos anulados correctamente`, 'info');
    setSelectedQuoteIds([]);
  };

  // Exportar mes a Excel (CSV con BOM)
  const handleExportMonthExcel = () => {
    const headers = [
      'Fecha',
      'Matricula',
      'Vehiculo',
      'Cliente',
      'Telefono',
      'Servicios',
      'Total Facturado ($UYU)',
      'Cobrado ($UYU)',
      'Saldo Pendiente ($UYU)',
      'Estado de Cobro',
      'Origen',
      'Quien lo hizo',
      'Comisiones',
      'Anulado'
    ];

    const rows = filteredQuotes.map((q) => {
      const status = getDetailingPaymentStatus(q);
      const paid = getDetailingPaidAmount(q);
      const pending = Math.max(0, (q.total_amount || 0) - paid);
      const servicesStr = (q.selected_services || []).map((s) => s.serviceName || s.name).join(' + ');
      const perf = getJobPerformersSummary(q, commissions);
      const commsStr = perf.items
        .map((it) => `${it.employee_name} ${it.rate}% = $${it.amount}`)
        .join(' | ');

      return [
        q.work_date || q.created_at.slice(0, 10),
        q.vehicle_plate || 'Sin chapa',
        `"${(q.vehicle_info || '').replace(/"/g, '""')}"`,
        `"${(q.client_name || '').replace(/"/g, '""')}"`,
        q.client_phone || '',
        `"${servicesStr.replace(/"/g, '""')}"`,
        q.total_amount || 0,
        paid,
        pending,
        status,
        q.origin || '',
        `"${perf.badge} (${perf.label})"`,
        `"${commsStr.replace(/"/g, '""')}"`,
        q.is_voided ? 'SI' : 'NO'
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DetailVlak_Trabajos_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Archivo Excel exportado para ${monthLabel}`, 'success');
  };

  // Ver comprobante de un trabajo
  const handleViewReceipt = async (quote: DetailingQuote) => {
    let rcpt = detailingReceipts.find((r) => r.quote_id === quote.id);
    if (!rcpt) {
      rcpt = await generateDetailingReceipt(quote.id);
    }
    if (rcpt) {
      setActiveReceiptToView(rcpt);
    }
  };

  const currentDetailQuote = useMemo(() => {
    if (!activeQuoteForDetail) return null;
    return detailingQuotes.find((q) => q.id === activeQuoteForDetail.id) || activeQuoteForDetail;
  }, [activeQuoteForDetail, detailingQuotes]);

  const currentDetailPerformers = useMemo(() => {
    if (!currentDetailQuote) return null;
    return getJobPerformersSummary(currentDetailQuote, commissions);
  }, [currentDetailQuote, commissions]);

  return (
    <div className="space-y-4">
      {/* 1. Selector de Mes */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-xs">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
          title="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs uppercase tracking-wider text-[#6B6B6B] font-medium block">
            Período Contable
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-display text-[#161616] flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4 text-[#D7141A]" />
            {monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={async () => {
              await refreshData();
              showToast('Datos actualizados desde la nube', 'success');
            }}
            disabled={isSyncing}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer disabled:opacity-50"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#D7141A]' : ''}`} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportMonthExcel}
            className="hidden sm:inline-flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen del Mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Trabajos</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#161616] mt-0.5">{totalJobsCount}</p>
          <span className="text-[10px] text-[#6B6B6B] block">confirmados</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Facturado</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-[#161616] mt-0.5">
            {formatCurrency(totalBilled)}
          </p>
          <span className="text-[10px] text-emerald-600 block">Total bruto</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Cobrado</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 mt-0.5">
            {formatCurrency(totalCollected)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">Ingresos reales</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Pendiente</span>
          <p className={`text-lg sm:text-xl font-bold font-mono mt-0.5 ${totalPending > 0 ? 'text-[#D7141A]' : 'text-gray-400'}`}>
            {formatCurrency(totalPending)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">A cobrar</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Gastos</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-rose-600 mt-0.5">
            {formatCurrency(totalExpenses)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">Taller</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Comisiones</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-violet-600 mt-0.5">
            {formatCurrency(totalCommissions)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">Equipo</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Resultado</span>
          <p className={`text-lg sm:text-xl font-bold font-mono mt-0.5 ${netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netResult)}
          </p>
          <span className="text-[10px] text-[#6B6B6B] block">Neto estimado</span>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9A9A9A]" />
            <input
              type="text"
              placeholder="Buscar por cliente, matrícula o auto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-8 pr-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Tipo de cliente */}
            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as any)}
              className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs text-[#161616] font-medium focus:border-[#D7141A] focus:outline-none shrink-0"
            >
              <option value="all">Tipo: Todos</option>
              <option value="particular">Particular</option>
              <option value="empresa">Empresas</option>
            </select>

            {/* Estado de cobro */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none shrink-0"
            >
              <option value="all">Cobro: Todos</option>
              <option value="Cobrado">Cobrado</option>
              <option value="Cobro parcial">Cobro parcial</option>
              <option value="Pendiente de cobro">Pendiente</option>
            </select>

            {/* Quién lo hizo */}
            <select
              value={detailerFilter}
              onChange={(e) => setDetailerFilter(e.target.value)}
              className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none shrink-0"
            >
              <option value="all">Responsable: Todos</option>
              {availableProfiles
                .filter((p) => p.businesses?.includes('detailing'))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>

            {/* Origen */}
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2.5 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none shrink-0"
            >
              <option value="all">Origen: Todos</option>
              {(detailingConfig?.client_origins || detailingConfig?.origins || []).map((orig) => (
                <option key={orig} value={orig}>
                  {orig}
                </option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportMonthExcel}
              className="sm:hidden shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            </Button>
          </div>
        </div>

        {/* Barra de acción cuando hay selección múltiple */}
        {selectedQuoteIds.length > 0 && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs animate-fade-in">
            <span className="font-bold text-[#D7141A]">
              {selectedQuoteIds.length} {selectedQuoteIds.length === 1 ? 'trabajo seleccionado' : 'trabajos seleccionados'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedQuoteIds([])}
                className="text-[#6B6B6B] hover:text-[#161616] font-medium cursor-pointer"
              >
                Desmarcar
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBulkVoidModalOpen(true)}
                className="bg-[#D7141A] hover:bg-[#b01015]"
              >
                <Ban className="w-3.5 h-3.5 mr-1" />
                Anular seleccionados
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Lista de Trabajos agrupada por día */}
      {groupedByDay.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5E3] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F5F4] flex items-center justify-center text-[#6B6B6B] mx-auto">
            <Sparkles className="w-6 h-6 text-[#9A9A9A]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#161616]">No hay trabajos registrados en {monthLabel}</h4>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-sm mx-auto">
              Podés registrar un trabajo confirmado tocando el botón rojo "+ Nuevo trabajo".
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setQuoteToEdit(null);
              setIsQuoterModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Nuevo trabajo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(({ day, quotes }) => {
            const isFuture = isJobScheduled(day);
            const dayFormatted = (() => {
              try {
                const parts = day.split('-');
                if (parts.length === 3) {
                  const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  return dObj.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short' });
                }
              } catch (_) {}
              return day;
            })();

            return (
              <div key={day} className="space-y-2">
                {/* Header del día */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#161616] capitalize">
                      {dayFormatted}
                    </span>
                    {isFuture && (
                      <span className="text-[10px] bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                        Programado
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#6B6B6B]">
                    {quotes.length} {quotes.length === 1 ? 'trabajo' : 'trabajos'} ·{' '}
                    {formatCurrency(quotes.reduce((acc, q) => acc + (q.is_voided ? 0 : q.total_amount), 0))}
                  </span>
                </div>

                {/* Filas de trabajos del día */}
                <div className="bg-white rounded-2xl border border-[#E5E5E3] divide-y divide-[#E5E5E3] overflow-hidden shadow-xs">
                  {quotes.map((q) => {
                    const payStatus = getDetailingPaymentStatus(q);
                    const isSelected = selectedQuoteIds.includes(q.id);
                    const isScheduledFuture = isJobScheduled(q.work_date);
                    const performers = getJobPerformersSummary(q, commissions);

                    return (
                      <div
                        key={q.id}
                        onClick={() => setActiveQuoteForDetail(q)}
                        className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          q.is_voided
                            ? 'bg-gray-50 opacity-60'
                            : isSelected
                            ? 'bg-red-50/60'
                            : 'hover:bg-[#F5F5F4]'
                        }`}
                      >
                        {/* Checkbox y Auto */}
                        <div className="flex items-center gap-3 min-w-0">
                          {!q.is_voided && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onClick={(e) => handleToggleSelectQuote(q.id, e)}
                              onChange={() => {}}
                              className="rounded border-[#E5E5E3] text-[#D7141A] focus:ring-[#D7141A] cursor-pointer"
                            />
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#161616] truncate">
                                {q.vehicle_info}
                              </span>
                              {q.vehicle_plate ? (
                                <UruguayanPlate plate={q.vehicle_plate} size="sm" />
                              ) : null}
                              <span
                                className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 font-bold px-1.5 py-0.5 rounded-md"
                                title={`Realizado por: ${performers.label}`}
                              >
                                {performers.badge}
                              </span>
                              {q.customer_type === 'empresa' && (
                                <span className="text-[9px] bg-red-100 text-[#D7141A] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  EMPRESA · {q.company_name || 'Empresa'}
                                </span>
                              )}
                              {isScheduledFuture && (
                                <span className="text-[9px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded">
                                  Programado
                                </span>
                              )}
                              {q.is_voided && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                                  ANULADO
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#6B6B6B] truncate mt-0.5">
                              <span className="font-medium text-[#161616]">
                                {q.customer_type === 'empresa' ? (q.company_name || q.client_name) : q.client_name}
                              </span>
                              <span className="mx-1">·</span>
                              <span>{(q.selected_services || []).map((s) => s.serviceName || s.name).join(', ')}</span>
                            </p>

                            {performers.items.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-violet-700 font-medium">
                                {performers.items.map((it) => (
                                  <span key={it.employee_id} className="bg-violet-50/70 px-1.5 py-0.5 rounded">
                                    {it.short}: {it.rate.toString().replace('.', ',')}% = {formatCurrency(it.amount)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Total y Estado de Cobro */}
                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-sm font-bold font-mono text-[#161616]">
                            {formatCurrency(q.total_amount)}
                          </p>
                          <div className="mt-0.5">
                            {q.is_voided ? (
                              <span className="text-[10px] text-rose-600 font-bold">Anulado</span>
                            ) : payStatus === 'Cobrado' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Cobrado
                              </span>
                            ) : payStatus === 'Cobro parcial' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Parcial ({formatCurrency(getDetailingPaidAmount(q))})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D7141A] bg-red-50 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Botón Flotante Rojo "+ Nuevo trabajo" */}
      <button
        onClick={() => {
          setQuoteToEdit(null);
          setIsQuoterModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-3 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>+ Nuevo trabajo</span>
      </button>

      {/* 6. Modal / Slide-over Detalle del Trabajo */}
      {currentDetailQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
            {/* Header */}
            <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4]">
              <div>
                <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider font-semibold">
                  Detalle del trabajo
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#161616] flex items-center gap-2">
                  <span>{currentDetailQuote.vehicle_info}</span>
                  {currentDetailQuote.vehicle_plate && (
                    <UruguayanPlate plate={currentDetailQuote.vehicle_plate} size="sm" />
                  )}
                </h3>
              </div>
              <button
                onClick={() => setActiveQuoteForDetail(null)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Estado y Fecha */}
              <div className="flex items-center justify-between p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3]">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] block">Fecha de trabajo</span>
                  <span className="font-bold text-xs text-[#161616]">
                    {currentDetailQuote.work_date || currentDetailQuote.created_at.slice(0, 10)}
                  </span>
                  {isJobScheduled(currentDetailQuote.work_date) && (
                    <span className="ml-1 text-[9px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded">
                      Programado
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#6B6B6B] block">Estado de cobro</span>
                  <span className="font-bold text-xs">
                    {getDetailingPaymentStatus(currentDetailQuote)}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <div className="p-3 bg-white rounded-xl border border-[#E5E5E3] space-y-1">
                <span className="text-[10px] text-[#6B6B6B] block font-medium">Cliente</span>
                <p className="font-bold text-sm text-[#161616]">
                  {currentDetailQuote.customer_type === 'empresa'
                    ? `${currentDetailQuote.company_name || currentDetailQuote.client_name} (Empresa)`
                    : currentDetailQuote.client_name}
                </p>
                {currentDetailQuote.client_phone && (
                  <p className="text-xs text-[#6B6B6B]">{currentDetailQuote.client_phone}</p>
                )}
                <p className="text-[10px] text-[#6B6B6B] mt-1">
                  Origen: <span className="font-semibold text-[#161616]">{currentDetailQuote.origin}</span>
                </p>
              </div>

              {/* ¿Quién hizo el trabajo y comisiones? */}
              {currentDetailPerformers && (
                <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-violet-600" />
                      ¿Quién hizo el trabajo?
                    </span>
                    <span className="text-[11px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                      {currentDetailPerformers.badge} · {currentDetailPerformers.label}
                    </span>
                  </div>

                  {currentDetailPerformers.items.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {currentDetailPerformers.items.map((it) => (
                        <div
                          key={it.employee_id}
                          className="p-2 bg-white rounded-lg border border-violet-100 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-[#161616]">
                              {it.employee_name}{' '}
                              <span className="text-[#D7141A]">
                                {it.rate.toString().replace('.', ',')}%
                              </span>{' '}
                              = <span className="font-mono">{formatCurrency(it.amount)}</span>
                            </span>
                            {it.adjustment_reason && (
                              <span className="block text-[10px] text-amber-700 mt-0.5">
                                Ajuste puntual: {it.adjustment_reason}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              it.status === 'Pagada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : it.status === 'Pendiente'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {it.status === 'Pagada'
                              ? 'Comisión pagada'
                              : it.status === 'Pendiente'
                              ? 'Comisión pendiente'
                              : 'Al cobrar el trabajo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#6B6B6B]">Sin participantes asignados</p>
                  )}
                </div>
              )}

              {/* Servicios */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#161616]">Servicios realizados</span>
                <div className="border border-[#E5E5E3] rounded-xl divide-y divide-[#E5E5E3] overflow-hidden">
                  {(currentDetailQuote.selected_services || []).map((s, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <span className="font-medium text-[#161616]">{s.serviceName || s.name}</span>
                      <span className="font-mono text-[#6B6B6B]">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose de totales y cobros */}
              <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B]">Total del trabajo:</span>
                  <span className="font-bold font-mono text-[#161616]">
                    {formatCurrency(currentDetailQuote.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B6B6B]">Monto cobrado:</span>
                  <span className="font-bold font-mono text-emerald-600">
                    {formatCurrency(getDetailingPaidAmount(currentDetailQuote))}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#E5E5E3]">
                  <span className="text-[#6B6B6B]">Saldo pendiente:</span>
                  <span className="font-bold font-mono text-[#D7141A]">
                    {formatCurrency(
                      Math.max(
                        0,
                        (currentDetailQuote.total_amount || 0) - getDetailingPaidAmount(currentDetailQuote)
                      )
                    )}
                  </span>
                </div>
              </div>

              {/* Notas si existen */}
              {currentDetailQuote.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block mb-0.5">Notas</span>
                  <p className="text-xs text-amber-900">{currentDetailQuote.notes}</p>
                </div>
              )}
            </div>

            {/* Acciones principales de la fila */}
            <div className="p-3.5 sm:p-4 border-t border-[#E5E5E3] bg-[#F5F5F4] flex flex-wrap items-center justify-end gap-2">
              {!currentDetailQuote.is_voided && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuoteToVoid(currentDetailQuote);
                      setActiveQuoteForDetail(null);
                    }}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Anular
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuoteToEdit(currentDetailQuote);
                      if (currentDetailQuote.customer_type === 'empresa' || currentDetailQuote.company_id) {
                        setIsCompanyJobModalOpen(true);
                      } else {
                        setIsQuoterModalOpen(true);
                      }
                      setActiveQuoteForDetail(null);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewReceipt(currentDetailQuote)}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-[#D7141A]" />
                    Ver/enviar comprobante
                  </Button>

                  {getDetailingPaymentStatus(currentDetailQuote) !== 'Cobrado' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setQuoteForPayment(currentDetailQuote);
                        setActiveQuoteForDetail(null);
                      }}
                      className="bg-[#D7141A] hover:bg-[#b01015]"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Registrar cobro
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Cobro */}
      {quoteForPayment && (
        <DetailingPaymentRecordModal
          isOpen={!!quoteForPayment}
          onClose={() => setQuoteForPayment(null)}
          quote={quoteForPayment}
        />
      )}

      {/* Modal de Nuevo/Editar Trabajo Particular */}
      {isQuoterModalOpen && (
        <DetailingQuoterModal
          isOpen={isQuoterModalOpen}
          onClose={() => {
            setIsQuoterModalOpen(false);
            setQuoteToEdit(null);
          }}
          quoteToEdit={quoteToEdit}
          initialDate={selectedMonth === getLocalDateString().slice(0, 7) ? getLocalDateString() : `${selectedMonth}-01`}
        />
      )}

      {/* Modal de Editar Trabajo de Empresa */}
      {isCompanyJobModalOpen && (
        <DetailingCompanyJobModal
          isOpen={isCompanyJobModalOpen}
          onClose={() => {
            setIsCompanyJobModalOpen(false);
            setQuoteToEdit(null);
          }}
          preselectedCompanyId={quoteToEdit?.company_id}
          quoteToEdit={quoteToEdit}
          initialDate={selectedMonth === getLocalDateString().slice(0, 7) ? getLocalDateString() : `${selectedMonth}-01`}
        />
      )}

      {/* Modal de Anulación individual */}
      {quoteToVoid && (
        <DetailingVoidModal
          isOpen={!!quoteToVoid}
          onClose={() => setQuoteToVoid(null)}
          title="Anular trabajo"
          itemDescription={`${quoteToVoid.vehicle_info} - ${quoteToVoid.client_name} (${formatCurrency(quoteToVoid.total_amount)})`}
          mode="void"
          onConfirm={(reason) => {
            voidDetailingQuote(quoteToVoid.id, reason);
            showToast('Trabajo anulado correctamente', 'info');
            setQuoteToVoid(null);
          }}
        />
      )}

      {/* Modal de Anulación masiva */}
      {isBulkVoidModalOpen && (
        <DetailingVoidModal
          isOpen={isBulkVoidModalOpen}
          onClose={() => setIsBulkVoidModalOpen(false)}
          title="Anulación múltiple de trabajos"
          itemDescription={`Se anularán ${selectedQuoteIds.length} trabajos seleccionados del período.`}
          mode="void"
          onConfirm={handleConfirmBulkVoid}
        />
      )}

      {/* Modal de Vista de Comprobante */}
      {activeReceiptToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <DetailingReceiptView
              receipt={activeReceiptToView}
              onClose={() => setActiveReceiptToView(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

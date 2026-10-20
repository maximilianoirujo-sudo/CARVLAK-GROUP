import React, { useState, useMemo } from 'react';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Car,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { DetailingCompany, DetailingQuote } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  formatCurrency,
  getLocalDateString,
  getDetailingPaidAmount,
  getDetailingPaymentStatus,
  isActiveJob,
  isActivePayment,
  getJobPerformersSummary
} from '../../../lib/formatters';
import { DetailingCompanyJobModal } from './DetailingCompanyJobModal';
import { DetailingCompanyPaymentModal } from './DetailingCompanyPaymentModal';
import { DetailingCompanyAccountStatementModal } from './DetailingCompanyAccountStatementModal';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';

interface DetailingCompanyDetailViewProps {
  company: DetailingCompany;
  onBack: () => void;
  onEditCompany: (company: DetailingCompany) => void;
}

export const DetailingCompanyDetailView: React.FC<DetailingCompanyDetailViewProps> = ({
  company,
  onBack,
  onEditCompany
}) => {
  const { detailingQuotes, detailingConfig, detailingPayments, commissions, voidDetailingPayment } = useData();
  const { showToast } = useToast();

  // Selector de Mes (Formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getLocalDateString().slice(0, 7);
  });

  // Modales
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<DetailingQuote | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Navegación de mes
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const yStr = prevDate.getFullYear();
    const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const yStr = nextDate.getFullYear();
    const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 15);
    const name = date.toLocaleString('es-UY', { month: 'long' });
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
  }, [selectedMonth]);

  // Todos los trabajos de esta empresa
  const allCompanyQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => q.company_id === company.id && isActiveJob(q));
  }, [detailingQuotes, company.id]);

  // Trabajos del mes seleccionado
  const monthQuotes = useMemo(() => {
    return allCompanyQuotes.filter((q) => {
      const qDate = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
      return qDate.startsWith(selectedMonth);
    });
  }, [allCompanyQuotes, selectedMonth]);

  // Métricas del Mes
  const monthJobsCount = monthQuotes.length;
  const monthBilled = useMemo(() => {
    return monthQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  }, [monthQuotes]);

  const monthCollected = useMemo(() => {
    return monthQuotes.reduce((sum, q) => sum + getDetailingPaidAmount(q), 0);
  }, [monthQuotes]);

  const monthPending = Math.max(0, monthBilled - monthCollected);

  // Saldo Acumulado Histórico (todos los meses impagos)
  const totalHistoricalBilled = useMemo(() => {
    return allCompanyQuotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
  }, [allCompanyQuotes]);

  const totalHistoricalCollected = useMemo(() => {
    return allCompanyQuotes.reduce((sum, q) => sum + getDetailingPaidAmount(q), 0);
  }, [allCompanyQuotes]);

  const totalHistoricalPending = Math.max(0, totalHistoricalBilled - totalHistoricalCollected);

  // Pagos del período agrupados por payment_group_id o id individual
  const monthPaymentsGrouped = useMemo(() => {
    const groups: Record<string, {
      groupId: string;
      date: string;
      method: string;
      amount: number;
      jobCount: number;
      jobs: { quoteId: string; vehicleInfo: string; amount: number }[];
      payments: { quoteId: string; paymentId: string }[];
    }> = {};

    monthQuotes.forEach((q) => {
      (q.payments || []).forEach((p) => {
        if (!isActivePayment(p)) return;
        const key = p.payment_group_id || p.id;
        if (!groups[key]) {
          groups[key] = {
            groupId: key,
            date: p.date,
            method: p.payment_method || p.method || 'Efectivo',
            amount: 0,
            jobCount: 0,
            jobs: [],
            payments: []
          };
        }
        groups[key].amount += Number(p.amount) || 0;
        groups[key].jobCount += 1;
        groups[key].jobs.push({
          quoteId: q.id,
          vehicleInfo: q.vehicle_info || 'Vehículo',
          amount: Number(p.amount) || 0
        });
        groups[key].payments.push({
          quoteId: q.id,
          paymentId: p.id
        });
      });
    });

    return Object.values(groups).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [monthQuotes]);

  const handleVoidPaymentGroup = async (group: typeof monthPaymentsGrouped[0]) => {
    if (!window.confirm(`¿Confirmás anular este cobro de ${formatCurrency(group.amount)} imputado a ${group.jobCount} trabajo(s)? Los trabajos volverán a quedar con saldo pendiente.`)) {
      return;
    }
    try {
      for (const item of group.payments) {
        await voidDetailingPayment(item.quoteId, item.paymentId, 'Anulación de pago desde cuenta de empresa');
      }
      showToast('Pago anulado con éxito. Se recalculó la cuenta de la empresa.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Error al anular el pago', 'error');
    }
  };

  // Exportar a Excel (CSV con UTF-8 BOM)
  const handleExportExcel = () => {
    if (monthQuotes.length === 0) {
      showToast('No hay trabajos registrados para exportar en este mes', 'error');
      return;
    }

    const headers = [
      'Fecha',
      'Vehículo',
      'Matrícula',
      'Tamaño',
      'Servicios',
      'Quién lo hizo',
      'Comisiones',
      'Total UYU',
      'Abonado UYU',
      'Saldo Pendiente UYU',
      'Estado Cobro'
    ];

    const rows = monthQuotes.map((q) => {
      const paid = getDetailingPaidAmount(q);
      const bal = (q.total_amount || 0) - paid;
      const services = (q.selected_services || []).map((s) => s.serviceName || s.name).join(' + ');
      const status = bal <= 0 ? 'Cobrado' : paid > 0 ? 'Parcial' : 'Pendiente';
      const perf = getJobPerformersSummary(q, commissions);
      const commsStr = perf.items
        .map((it) => `${it.employee_name} ${it.rate}% = $${it.amount}`)
        .join(' | ');

      return [
        `"${q.work_date || q.created_at.slice(0, 10)}"`,
        `"${(q.vehicle_info || '').replace(/"/g, '""')}"`,
        `"${q.vehicle_plate || 'Sin matrícula'}"`,
        `"Tamaño ${q.vehicle_size || '-'}"`,
        `"${services.replace(/"/g, '""')}"`,
        `"${perf.badge} (${perf.label})"`,
        `"${commsStr.replace(/"/g, '""')}"`,
        q.total_amount || 0,
        paid,
        bal,
        `"${status}"`
      ];
    });

    // Fila resumen
    rows.push([
      '"TOTALES"',
      `"${monthJobsCount} vehículos"`,
      '""',
      '""',
      '""',
      '""',
      '""',
      monthBilled,
      monthCollected,
      monthPending,
      `"Saldo: ${monthPending}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DetailVlak_Cuenta_${company.name.replace(/\s+/g, '_')}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Archivo Excel exportado para ${company.name}`, 'success');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header con Botón Volver y Datos de la Empresa */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
              title="Volver a empresas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display text-[#161616]">
                  {company.name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-[#161616]">
                  {company.billing_mode === 'mensual' ? 'Cuenta Mensual' : 'Cobro por Trabajo'}
                </span>
                {!company.is_active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-100 text-[#D7141A]">
                    Inactiva
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B]">
                {company.legal_name ? `${company.legal_name} · ` : ''}
                {company.rut ? `RUT: ${company.rut}` : 'Ficha de cuenta corriente preventa'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onEditCompany(company)}
              className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                setQuoteToEdit(null);
                setIsJobModalOpen(true);
              }}
              className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Trabajo de empresa</span>
            </button>
          </div>
        </div>

        {/* Info Contacto Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-[#6B6B6B]">
          {company.contact_name && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#161616]">Contacto:</span>
              <span>{company.contact_name}</span>
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <a
                href={`https://wa.me/${company.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#161616] hover:underline font-medium"
              >
                {company.phone}
              </a>
            </div>
          )}
          {company.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="truncate">{company.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Barra de Navegación de Mes & Botones de Acción */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[150px]">
            <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-bold block">
              Período de Cuenta
            </span>
            <h2 className="text-sm sm:text-base font-bold font-display text-[#161616]">
              {monthLabel}
            </h2>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={monthPending <= 0}
            className="bg-[#161616] hover:bg-black disabled:opacity-40 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Registrar pago</span>
          </button>

          <button
            onClick={() => setIsStatementModalOpen(true)}
            className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Estado de cuenta (PDF)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* 3. Tarjetas KPI de la Cuenta */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Autos del mes</span>
          <p className="text-xl font-bold font-mono text-[#161616] mt-0.5">{monthJobsCount}</p>
          <span className="text-[10px] text-[#6B6B6B]">vehículos en {monthLabel}</span>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Facturado (mes)</span>
          <p className="text-xl font-black font-mono text-[#161616] mt-0.5">{formatCurrency(monthBilled)}</p>
          <span className="text-[10px] text-[#6B6B6B]">Total emitido</span>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Cobrado (mes)</span>
          <p className="text-xl font-black font-mono text-emerald-700 mt-0.5">{formatCurrency(monthCollected)}</p>
          <span className="text-[10px] text-emerald-600">Abonado del mes</span>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Saldo del mes</span>
          <p className={`text-xl font-black font-mono mt-0.5 ${monthPending > 0 ? 'text-[#D7141A]' : 'text-emerald-700'}`}>
            {formatCurrency(monthPending)}
          </p>
          <span className="text-[10px] text-[#6B6B6B]">Pendiente este período</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-red-50/60 border border-red-200 rounded-2xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#D7141A] block">Saldo Acumulado</span>
          <p className={`text-xl font-black font-mono mt-0.5 ${totalHistoricalPending > 0 ? 'text-[#D7141A]' : 'text-emerald-700'}`}>
            {formatCurrency(totalHistoricalPending)}
          </p>
          <span className="text-[10px] text-[#6B6B6B]">Deuda histórica total</span>
        </div>
      </div>

      {/* 4. Lista de Trabajos de la Empresa en el Mes */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-[#161616]">
              Trabajos del Período ({monthJobsCount})
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Detalle de vehículos y servicios facturados en {monthLabel}
            </p>
          </div>
        </div>

        {monthQuotes.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B6B6B] border border-dashed border-[#E5E5E3] rounded-xl space-y-2">
            <Car className="w-8 h-8 text-[#6B6B6B] mx-auto opacity-50" />
            <p className="font-semibold text-[#161616]">No hay trabajos registrados en {monthLabel}</p>
            <p>Hacé clic en "+ Trabajo de empresa" para cargar el primer auto.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E3]">
            {monthQuotes.map((q) => {
              const paid = getDetailingPaidAmount(q);
              const balance = Math.max(0, (q.total_amount || 0) - paid);
              const servicesText = (q.selected_services || [])
                .map((s) => s.serviceName || s.name)
                .join(', ');
              const performers = getJobPerformersSummary(q, commissions);

              return (
                <div
                  key={q.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs hover:bg-[#FAFAFA] transition-colors rounded-xl px-2 -mx-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#161616] text-sm">
                        {q.vehicle_info || 'Vehículo sin especificar'}
                      </span>
                      {q.vehicle_plate && <UruguayanPlate plate={q.vehicle_plate} size="sm" />}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#161616]">
                        Tamaño {q.vehicle_size || '-'}
                      </span>
                      <span
                        className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 font-bold px-1.5 py-0.5 rounded-md"
                        title={`Realizado por: ${performers.label}`}
                      >
                        {performers.badge}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#6B6B6B]">
                      <span>📅 {q.work_date || q.created_at?.slice(0, 10)}</span>
                      <span>✨ {servicesText || 'Preparación preventa'}</span>
                      {q.notes && <span className="italic">"{q.notes}"</span>}
                    </div>

                    {performers.items.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-violet-700 font-medium">
                        {performers.items.map((it) => (
                          <span key={it.employee_id} className="bg-violet-50/70 px-1.5 py-0.5 rounded">
                            {it.short}: {it.rate.toString().replace('.', ',')}% = {formatCurrency(it.amount)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setQuoteToEdit(q);
                        setIsJobModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-white transition-colors cursor-pointer"
                      title="Editar trabajo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-[#161616] block">
                        {formatCurrency(q.total_amount)}
                      </span>
                      <span className="text-[10px]">
                        {balance <= 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                            Cobrado
                          </span>
                        ) : paid > 0 ? (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            Saldo: {formatCurrency(balance)}
                          </span>
                        ) : (
                          <span className="text-[#D7141A] font-bold bg-red-50 px-2 py-0.5 rounded-full">
                            Pendiente: {formatCurrency(balance)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Pagos y Liquidaciones del Período */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-[#161616]">
              Pagos e Imputaciones ({monthPaymentsGrouped.length})
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Historial de cobros registrados y aplicados a trabajos de {monthLabel}
            </p>
          </div>
        </div>

        {monthPaymentsGrouped.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#6B6B6B] border border-dashed border-[#E5E5E3] rounded-xl">
            No se han registrado cobros en {monthLabel}.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E3]">
            {monthPaymentsGrouped.map((grp) => (
              <div
                key={grp.groupId}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#161616] text-sm">
                      {grp.method}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Imputado a {grp.jobCount} vehículo(s)
                    </span>
                  </div>
                  <div className="text-[#6B6B6B] flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>📅 {grp.date}</span>
                    <span>🚗 {grp.jobs.map((j) => j.vehicleInfo).join(' · ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-mono font-black text-sm text-emerald-700">
                    {formatCurrency(grp.amount)}
                  </span>
                  <button
                    onClick={() => handleVoidPaymentGroup(grp)}
                    className="text-xs text-[#D7141A] hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer font-medium"
                    title="Anular este cobro y revertir el saldo de los trabajos asociados"
                  >
                    Anular cobro
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {isJobModalOpen && (
        <DetailingCompanyJobModal
          isOpen={isJobModalOpen}
          onClose={() => {
            setIsJobModalOpen(false);
            setQuoteToEdit(null);
          }}
          preselectedCompanyId={company.id}
          quoteToEdit={quoteToEdit}
          initialDate={selectedMonth === getLocalDateString().slice(0, 7) ? getLocalDateString() : `${selectedMonth}-01`}
        />
      )}

      {isPaymentModalOpen && (
        <DetailingCompanyPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          company={company}
          monthQuotes={monthQuotes}
          monthLabel={monthLabel}
        />
      )}

      {isStatementModalOpen && (
        <DetailingCompanyAccountStatementModal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          company={company}
          monthStr={selectedMonth}
          monthLabel={monthLabel}
          monthQuotes={monthQuotes}
          config={detailingConfig}
        />
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Edit3,
  AlertCircle,
  User,
  DollarSign,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react';
import { CommissionRecord, Business, Currency } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency, formatLocalDate, getLocalMonthString } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingCommissionsSectionProps {
  businessFilter?: Business;
}

export const DetailingCommissionsSection: React.FC<DetailingCommissionsSectionProps> = ({
  businessFilter = 'detailing'
}) => {
  const {
    commissions,
    markCommissionPaid,
    recalculateDetailingCommissions,
    adjustSingleCommission,
    detailingQuotes
  } = useData();
  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const defaultCurrency: Currency = businessFilter === 'automotora' ? 'USD' : 'UYU';

  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthString()); // YYYY-MM
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'Pagada'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>(() => (isAdmin ? 'all' : profile?.id || 'all'));

  // Estado para el modal de ajuste manual
  const [adjustingCommission, setAdjustingCommission] = useState<CommissionRecord | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Estado para confirmación de recalcular
  const [showRecalculateConfirm, setShowRecalculateConfirm] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Filtrar según rol: empleado SOLO ve sus propias comisiones, Admin ve todas
  const userCommissions = useMemo(() => {
    return commissions
      .filter((c) => c.business === businessFilter)
      .filter((c) => (isAdmin ? true : c.employee_id === profile?.id));
  }, [commissions, businessFilter, isAdmin, profile]);

  const activeEmployeeFilter = isAdmin ? employeeFilter : (profile?.id || 'all');

  const filteredCommissions = useMemo(() => {
    return userCommissions.filter((c) => {
      const matchMonth = c.created_at.startsWith(selectedMonth);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchEmp = activeEmployeeFilter === 'all' || c.employee_id === activeEmployeeFilter;
      return matchMonth && matchStatus && matchEmp;
    });
  }, [userCommissions, selectedMonth, statusFilter, activeEmployeeFilter]);

  // Agrupación por colaborador para las fichas de liquidación
  const settlementsByEmployee = useMemo(() => {
    const map = new Map<string, {
      employeeId: string;
      employeeName: string;
      totalPending: number;
      totalPaid: number;
      totalBilled: number;
      jobsCount: number;
      pendingList: CommissionRecord[];
    }>();

    userCommissions
      .filter((c) => c.created_at.startsWith(selectedMonth))
      .forEach((c) => {
        const empId = c.employee_id;
        const current = map.get(empId) || {
          employeeId: empId,
          employeeName: c.employee_name,
          totalPending: 0,
          totalPaid: 0,
          totalBilled: 0,
          jobsCount: 0,
          pendingList: []
        };
        current.jobsCount += 1;
        current.totalBilled += c.amount_charged;
        if (c.status === 'Pendiente') {
          current.totalPending += c.commission_amount;
          current.pendingList.push(c);
        } else {
          current.totalPaid += c.commission_amount;
        }
        map.set(empId, current);
      });

    return Array.from(map.values());
  }, [userCommissions, selectedMonth]);

  // Totales de la selección actual
  const totalPending = useMemo(() => {
    return filteredCommissions
      .filter((c) => c.status === 'Pendiente')
      .reduce((acc, curr) => acc + curr.commission_amount, 0);
  }, [filteredCommissions]);

  const totalPaid = useMemo(() => {
    return filteredCommissions
      .filter((c) => c.status === 'Pagada')
      .reduce((acc, curr) => acc + curr.commission_amount, 0);
  }, [filteredCommissions]);

  const totalBilled = useMemo(() => {
    return filteredCommissions.reduce((acc, curr) => acc + curr.amount_charged, 0);
  }, [filteredCommissions]);

  // Marcar una comisión individual como pagada
  const handleTogglePaid = (comm: CommissionRecord) => {
    if (!isAdmin) return;
    markCommissionPaid(comm.id);
    showToast(`Comisión de ${comm.employee_name} marcada como pagada`, 'success');
  };

  // Marcar período completo como pagado para un colaborador
  const handleMarkPeriodPaidForEmployee = (employeeId: string, employeeName: string) => {
    if (!isAdmin) return;
    const pendingToPay = userCommissions.filter(
      (c) => c.employee_id === employeeId && c.created_at.startsWith(selectedMonth) && c.status === 'Pendiente'
    );
    if (pendingToPay.length === 0) {
      showToast('No hay comisiones pendientes en este período para liquidar.', 'info');
      return;
    }
    const confirmed = window.confirm(
      `¿Confirmás marcar como PAGADAS todas las comisiones (${pendingToPay.length} trabajos) de ${employeeName} para el período ${selectedMonth}?`
    );
    if (!confirmed) return;

    pendingToPay.forEach((comm) => markCommissionPaid(comm.id));
    showToast(`Liquidación de ${employeeName} (${selectedMonth}) marcada como pagada.`, 'success');
  };

  // Exportar liquidación a Excel (CSV con UTF-8 BOM)
  const handleExportSettlementExcel = (empId?: string) => {
    const listToExport = filteredCommissions.filter((c) => (!empId || empId === 'all' ? true : c.employee_id === empId));
    if (listToExport.length === 0) {
      showToast('No hay liquidaciones para exportar en este período', 'info');
      return;
    }

    const headers = [
      'Período',
      'Colaborador',
      'Fecha',
      'Comprobante / ID',
      'Cliente',
      'Vehículo',
      'Origen Cliente',
      'Total Cobrado (UYU)',
      '% Comisión',
      'Monto Comisión (UYU)',
      'Estado',
      'Ajuste Nota'
    ];

    const rows = listToExport.map((c) => {
      const quote = detailingQuotes.find((q) => q.id === c.quote_id);
      return [
        selectedMonth,
        `"${c.employee_name.replace(/"/g, '""')}"`,
        c.created_at.split('T')[0],
        `"${(c.receipt_number || c.quote_id.slice(-6)).replace(/"/g, '""')}"`,
        `"${c.client_name.replace(/"/g, '""')}"`,
        `"${c.vehicle_description.replace(/"/g, '""')}"`,
        `"${(c.origin || quote?.origin || 'Directo').replace(/"/g, '""')}"`,
        c.amount_charged,
        c.commission_rate,
        c.commission_amount,
        c.status,
        `"${(c.adjustment_reason || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const empName = empId && empId !== 'all'
      ? (availableProfiles.find((p) => p.id === empId)?.full_name || 'colaborador').replace(/\s+/g, '_')
      : 'todos';
    link.href = url;
    link.download = `Liquidacion_DetailVlak_${empName}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilla de liquidación exportada con éxito.', 'success');
  };

  // Abrir modal de ajuste manual
  const handleOpenAdjustModal = (comm: CommissionRecord) => {
    if (!isAdmin) return;
    setAdjustingCommission(comm);
    setAdjustAmount(comm.commission_amount);
    setAdjustReason(comm.adjustment_reason || '');
  };

  // Guardar ajuste manual
  const handleSaveAdjustment = () => {
    if (!adjustingCommission) return;
    if (!adjustReason.trim()) {
      showToast('El motivo del ajuste es obligatorio para el registro de auditoría.', 'error');
      return;
    }
    adjustSingleCommission(adjustingCommission.id, adjustAmount, adjustReason.trim());
    showToast('Monto de comisión ajustado correctamente.', 'success');
    setAdjustingCommission(null);
  };

  // Recalcular comisiones del período
  const handleRecalculate = () => {
    setIsRecalculating(true);
    try {
      recalculateDetailingCommissions(selectedMonth);
      showToast(`Comisiones de ${selectedMonth} recalculadas según las reglas vigentes.`, 'success');
      setShowRecalculateConfirm(false);
    } catch {
      showToast('Error al recalcular comisiones', 'error');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de resumen de comisiones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#6B6B6B]">
            <span>Comisiones pendientes</span>
            <Clock className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="text-2xl font-bold text-[#D7141A] font-mono mt-0.5">
            {formatCurrency(totalPending, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Por liquidar ({filteredCommissions.filter((c) => c.status === 'Pendiente').length} trabajos)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#6B6B6B]">
            <span>Comisiones pagadas</span>
            <CheckCircle2 className="w-4 h-4 text-[#1E6B43]" />
          </div>
          <div className="text-2xl font-bold text-[#161616] font-mono mt-0.5">
            {formatCurrency(totalPaid, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">Liquidadas este período</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-xs">
          <div className="text-[11px] font-medium text-[#6B6B6B]">Total facturado en trabajos</div>
          <div className="text-2xl font-bold text-[#161616] font-mono mt-0.5">
            {formatCurrency(totalBilled, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Base sobre la cual se calculan comisiones
          </p>
        </div>
      </div>

      {/* Controles de Filtros y Acciones Globales */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E5E3]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616]">
            <Calendar className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#161616] font-medium focus:outline-none cursor-pointer"
            />
          </div>

          {/* Selector de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendientes de cobro</option>
            <option value="Pagada">Pagadas</option>
          </select>

          {/* Selector de Colaborador (solo visible para Admin) */}
          {isAdmin ? (
            <select
              value={activeEmployeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los colaboradores</option>
              {availableProfiles.map((p) => {
                const rate = p.commissions?.[businessFilter] ?? 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.full_name} {rate > 0 ? `(${rate}%)` : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616] font-medium">
              <User className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>{profile?.full_name} (Mi liquidación)</span>
            </div>
          )}
        </div>

        {/* Acciones Admin y Exportar */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecalculateConfirm(true)}
              className="gap-1.5 text-xs"
              title="Recalcula las comisiones pendientes según las reglas actuales"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Recalcular período</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportSettlementExcel(activeEmployeeFilter)}
            className="gap-1.5 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#1E6B43]" />
            <span>Exportar Excel</span>
          </Button>
        </div>
      </div>

      {/* FICHA DE LIQUIDACIÓN / RESUMEN POR COLABORADOR */}
      {activeEmployeeFilter !== 'all' ? (
        // Ficha individual para el colaborador seleccionado (o empleado logueado)
        (() => {
          const emp = availableProfiles.find((p) => p.id === activeEmployeeFilter) || {
            id: activeEmployeeFilter,
            full_name: profile?.full_name || 'Colaborador'
          };
          const empComms = filteredCommissions.filter((c) => c.employee_id === activeEmployeeFilter);
          const empPending = empComms.filter((c) => c.status === 'Pendiente').reduce((s, c) => s + c.commission_amount, 0);
          const empPaid = empComms.filter((c) => c.status === 'Pagada').reduce((s, c) => s + c.commission_amount, 0);
          const empBilled = empComms.reduce((s, c) => s + c.amount_charged, 0);

          return (
            <div className="p-5 rounded-2xl bg-white border-2 border-[#161616] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E3] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#161616] text-white flex items-center justify-center font-bold font-display text-lg">
                    {emp.full_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#161616] font-display">
                        Ficha de Liquidación: {emp.full_name}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-medium font-mono">
                        Período {selectedMonth}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      {empComms.length} trabajos registrados • Base facturada {formatCurrency(empBilled, defaultCurrency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#6B6B6B] uppercase font-bold tracking-wider block">Total a Cobrar</span>
                    <span className="text-2xl font-bold font-mono text-[#D7141A]">
                      {formatCurrency(empPending, defaultCurrency)}
                    </span>
                  </div>

                  {isAdmin && empPending > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMarkPeriodPaidForEmployee(emp.id, emp.full_name)}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar período pagado</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
                  <span className="text-[#6B6B6B] text-[11px]">Trabajos realizados:</span>
                  <div className="text-base font-bold text-[#161616] mt-0.5">{empComms.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
                  <span className="text-[#6B6B6B] text-[11px]">Total facturado:</span>
                  <div className="text-base font-bold font-mono text-[#161616] mt-0.5">
                    {formatCurrency(empBilled, defaultCurrency)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FEF7EC] border border-[#945B0E]/20">
                  <span className="text-[#945B0E] text-[11px]">Pendiente de cobro:</span>
                  <div className="text-base font-bold font-mono text-[#945B0E] mt-0.5">
                    {formatCurrency(empPending, defaultCurrency)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#EEF7F2] border border-[#1E6B43]/20">
                  <span className="text-[#1E6B43] text-[11px]">Liquidado / Pagado:</span>
                  <div className="text-base font-bold font-mono text-[#1E6B43] mt-0.5">
                    {formatCurrency(empPaid, defaultCurrency)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        // Vista Admin con "Todos los colaboradores": tarjetas resumen por cada colaborador
        settlementsByEmployee.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                Resumen de liquidaciones por colaborador ({selectedMonth})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {settlementsByEmployee.map((s) => (
                <div
                  key={s.employeeId}
                  className="p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#161616] text-white flex items-center justify-center font-bold text-xs">
                        {s.employeeName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#161616]">{s.employeeName}</div>
                        <span className="text-[10px] text-[#6B6B6B]">{s.jobsCount} trabajos</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#6B6B6B] block">Pendiente</span>
                      <span className="font-bold font-mono text-sm text-[#D7141A]">
                        {formatCurrency(s.totalPending, defaultCurrency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E3] text-[11px]">
                    <span className="text-[#6B6B6B]">Pagado: {formatCurrency(s.totalPaid, defaultCurrency)}</span>
                    <button
                      type="button"
                      onClick={() => setEmployeeFilter(s.employeeId)}
                      className="text-[#161616] hover:text-[#D7141A] font-bold text-xs underline cursor-pointer"
                    >
                      Ver detalle →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* DETALLE TRABAJO POR TRABAJO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
          <span className="font-bold uppercase tracking-wider">
            Detalle de trabajos ({filteredCommissions.length})
          </span>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#9A9A9A]" />
            <p className="text-sm font-semibold text-[#161616]">No hay liquidaciones para este filtro</p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Las comisiones se generan automáticamente al pasar una cotización a "Entregado y cobrado".
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCommissions.map((comm) => {
              const isPending = comm.status === 'Pendiente';
              const quote = detailingQuotes.find((q) => q.id === comm.quote_id);
              const receiptOrQuoteNum = comm.receipt_number || quote?.receipt_number || comm.quote_id.slice(-6);
              const originBadge = comm.origin || quote?.origin || 'Directo';

              return (
                <div
                  key={comm.id}
                  className="p-4 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A] flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#161616] text-xs">{comm.employee_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-semibold">
                          #{receiptOrQuoteNum}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-medium">
                          {comm.commission_rate}% comisión
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161616]/5 border border-[#161616]/10 text-[#161616] font-medium">
                          {originBadge}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                            isPending
                              ? 'bg-[#FEF7EC] text-[#945B0E] border-[#945B0E]/20'
                              : 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/20'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6B6B]">
                        <span>Fecha: {formatLocalDate(comm.created_at)}</span>
                        <span>•</span>
                        <span>Cliente: <strong className="text-[#161616]">{comm.client_name}</strong></span>
                        <span>•</span>
                        <span>Auto: <strong className="text-[#161616]">{comm.vehicle_description}</strong></span>
                        <span>•</span>
                        <span>Cobrado: {formatCurrency(comm.amount_charged, comm.currency || defaultCurrency)}</span>
                      </div>

                      {comm.adjustment_reason && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#945B0E] bg-[#FEF7EC] px-2 py-0.5 rounded border border-[#945B0E]/20 max-w-fit">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Ajustado: {comm.adjustment_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-[#E5E5E3]">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-[#6B6B6B] font-medium">Monto comisión</div>
                      <div className="text-base font-bold font-mono text-[#161616]">
                        {formatCurrency(comm.commission_amount, comm.currency || defaultCurrency)}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjustModal(comm)}
                          title="Ajustar monto a mano con motivo"
                          className="px-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#6B6B6B]" />
                        </Button>

                        {isPending && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTogglePaid(comm)}
                            className="gap-1 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                            <span>Pagar</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: AJUSTE MANUAL DE COMISIÓN (SOLO ADMIN) */}
      {adjustingCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E5E3] shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#D7141A]" />
                <h3 className="text-sm font-bold font-display text-[#161616]">
                  Ajustar Comisión Manualmente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingCommission(null)}
                className="text-[#9A9A9A] hover:text-[#161616]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F4] text-xs space-y-1">
              <div><strong>Colaborador:</strong> {adjustingCommission.employee_name}</div>
              <div><strong>Cliente:</strong> {adjustingCommission.client_name}</div>
              <div><strong>Vehículo:</strong> {adjustingCommission.vehicle_description}</div>
              <div><strong>Total cobrado:</strong> {formatCurrency(adjustingCommission.amount_charged, adjustingCommission.currency || defaultCurrency)}</div>
              <div><strong>Monto actual:</strong> {formatCurrency(adjustingCommission.commission_amount, adjustingCommission.currency || defaultCurrency)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Nuevo monto de comisión ($U) *
              </label>
              <input
                type="number"
                min={0}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-sm font-bold font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Motivo del ajuste (obligatorio para auditoría) *
              </label>
              <textarea
                rows={3}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ej: Descuento por garantía / Bono adicional por horas extra / Corrección de base..."
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustingCommission(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAdjustment}
                className="gap-1.5"
              >
                <Check className="w-4 h-4" />
                Guardar Ajuste
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE RECALCULAR COMISIONES */}
      {showRecalculateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E5E3] shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-[#D7141A]">
              <div className="w-10 h-10 rounded-xl bg-[#FEF7EC] flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-[#945B0E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#161616]">
                  Recalcular comisiones de {selectedMonth}
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Esta acción aplicará las reglas actuales de porcentaje y origen sobre los trabajos entregados.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F4] text-xs text-[#6B6B6B] space-y-1">
              <p>• <strong>Las comisiones ya pagadas</strong> NO se modificarán.</p>
              <p>• <strong>Las comisiones pendientes</strong> se re-calcularán según las reglas vigentes en Configuración.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecalculateConfirm(false)}
                disabled={isRecalculating}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>Confirmar y Recalcular</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

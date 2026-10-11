import React, { useState, useMemo } from 'react';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  X,
  Droplets,
  MessageCircle,
  DollarSign,
  Car,
  Bell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Send,
  FileText,
  Calendar,
  Check,
  Phone
} from 'lucide-react';
import {
  DetailingQuote,
  Appointment,
  DetailingConfig,
  Profile,
  DetailingPayment,
  DetailingQuoteStatus
} from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';
import {
  formatCurrency,
  getLocalDateString,
  formatLocalTime,
  formatLocalDate
} from '../../../../lib/formatters';

interface DetailingTodayPanelProps {
  appointments: Appointment[];
  detailingQuotes: DetailingQuote[];
  detailingPayments?: DetailingPayment[];
  config: DetailingConfig;
  profiles: Profile[];
  onAdvanceStatus: (quoteId: string, newStatus: DetailingQuoteStatus) => void;
  onOpenPayment: (quote: DetailingQuote) => void;
  onOpenWhatsApp: (
    quote: DetailingQuote,
    templateKey: 'confirm_appointment' | 'day_before_reminder' | 'car_ready' | 'quote_followup'
  ) => void;
  onOpenQuoterModal: (quote?: DetailingQuote) => void;
}

export const DetailingTodayPanel: React.FC<DetailingTodayPanelProps> = ({
  appointments,
  detailingQuotes,
  detailingPayments = [],
  config,
  profiles,
  onAdvanceStatus,
  onOpenPayment,
  onOpenWhatsApp,
  onOpenQuoterModal
}) => {
  const todayStr = getLocalDateString();
  const tomorrowStr = (() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return getLocalDateString(t);
  })();

  // Móvil: selector de columna activa ('entran' | 'taller' | 'listos')
  const [mobileTab, setMobileTab] = useState<'entran' | 'taller' | 'listos'>('taller');

  // Modal para la barra de pendientes
  const [pendingModalType, setPendingModalType] = useState<
    'confirm_tomorrow' | 'ready_notify' | 'pending_balance' | 'quote_followup' | null
  >(null);

  // 1. Trabajos que ENTRAN HOY (Agendados para hoy)
  const entriesTodayQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (q.status !== 'Agendado' || q.is_voided || q.is_archived) return false;
      const apptDate = q.appointment_date ? getLocalDateString(q.appointment_date) : '';
      return apptDate === todayStr;
    });
  }, [detailingQuotes, todayStr]);

  // 2. Trabajos EN TALLER
  const inWorkshopQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      return (q.status === 'En taller' || q.status === 'Recibido' || q.status === 'En proceso') && !q.is_voided && !q.is_archived;
    });
  }, [detailingQuotes]);

  // 3. Trabajos LISTOS PARA RETIRAR
  const readyQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      return q.status === 'Listo para retirar' && !q.is_voided && !q.is_archived;
    });
  }, [detailingQuotes]);

  // 4. ENTREGADOS HOY (para totales diarios)
  const deliveredTodayQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (q.status !== 'Entregado' && q.status !== 'Trabajo Completado') return false;
      if (q.is_voided || q.is_archived) return false;
      const updatedDate = q.updated_at ? getLocalDateString(q.updated_at) : '';
      return updatedDate === todayStr;
    });
  }, [detailingQuotes, todayStr]);

  // Turnos de mañana para confirmar (Agendados mañana sin confirmed_at)
  const tomorrowApptsToConfirm = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (q.status !== 'Agendado' || q.is_voided || q.is_archived || q.confirmed_at) return false;
      const d = q.appointment_date ? getLocalDateString(q.appointment_date) : '';
      return d === tomorrowStr;
    });
  }, [detailingQuotes, tomorrowStr]);

  // Autos listos pendientes de aviso por WhatsApp
  const readyPendingWhatsApp = useMemo(() => {
    return readyQuotes.filter((q) => {
      const logs = q.whatsapp_sent_log || [];
      return !logs.some((l) => l.template_key === 'car_ready');
    });
  }, [readyQuotes]);

  // Cobros pendientes (Entregados con saldo pendiente)
  const pendingBalances = useMemo(() => {
    return detailingQuotes.filter((q) => {
      if (q.is_voided || q.is_archived || q.status === 'Cancelado' || q.status === 'No vino' || q.status === 'Anulado') return false;
      const paid = (q.payments || []).filter((p) => !p.is_voided).reduce((acc, p) => acc + p.amount, 0);
      return q.total_amount > paid && (q.status === 'Entregado' || q.status === 'Listo para retirar');
    });
  }, [detailingQuotes]);

  // Presupuestos sin respuesta hace más de 2 días
  const staleQuotes = useMemo(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoIso = twoDaysAgo.toISOString();

    return detailingQuotes.filter((q) => {
      return (
        q.status === 'Presupuesto' &&
        !q.is_voided &&
        !q.is_archived &&
        q.created_at < twoDaysAgoIso
      );
    });
  }, [detailingQuotes]);

  // Totales de recaudación de hoy
  const paymentsToday = useMemo(() => {
    return detailingPayments.filter((p) => p.date === todayStr && !p.is_voided);
  }, [detailingPayments, todayStr]);

  const totalCollectedToday = useMemo(() => {
    return paymentsToday.reduce((sum, p) => sum + p.amount, 0);
  }, [paymentsToday]);

  const collectionsByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    paymentsToday.forEach((p) => {
      const m = p.method || p.payment_method || 'Otros';
      map[m] = (map[m] || 0) + p.amount;
    });
    return map;
  }, [paymentsToday]);

  const totalPendingBalance = useMemo(() => {
    return pendingBalances.reduce((sum, q) => {
      const paid = (q.payments || []).filter((p) => !p.is_voided).reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, q.total_amount - paid);
    }, 0);
  }, [pendingBalances]);

  // Helper para mapa de colores
  const getStageColor = (stage?: string) => {
    const defaultColor = '#6B6B6B';
    if (!stage) return defaultColor;
    const match = config.flow_statuses?.find(
      (s) =>
        ((s as any).label || (s as any).name || '').toLowerCase() === stage.toLowerCase() ||
        s.id.toLowerCase() === stage.toLowerCase()
    );
    return match ? match.color : defaultColor;
  };

  return (
    <div className="space-y-4">
      {/* ── 1. BARRA DE PENDIENTES CON ACCIÓN DIRECTA ── */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-[#6B6B6B] uppercase font-display shrink-0 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-[#D7141A]" />
            Pendientes:
          </span>

          {/* Confirmar turnos de mañana */}
          <button
            type="button"
            onClick={() => setPendingModalType('confirm_tomorrow')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all font-semibold ${
              tomorrowApptsToConfirm.length > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B]'
            }`}
          >
            <span>Confirmar turnos de mañana</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                tomorrowApptsToConfirm.length > 0 ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tomorrowApptsToConfirm.length}
            </span>
          </button>

          {/* Avisar autos listos */}
          <button
            type="button"
            onClick={() => setPendingModalType('ready_notify')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all font-semibold ${
              readyPendingWhatsApp.length > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B]'
            }`}
          >
            <span>Avisar autos listos</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                readyPendingWhatsApp.length > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {readyPendingWhatsApp.length}
            </span>
          </button>

          {/* Cobros pendientes */}
          <button
            type="button"
            onClick={() => setPendingModalType('pending_balance')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all font-semibold ${
              pendingBalances.length > 0
                ? 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100'
                : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B]'
            }`}
          >
            <span>Cobros pendientes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                pendingBalances.length > 0 ? 'bg-red-200 text-red-900' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {pendingBalances.length}
            </span>
          </button>

          {/* Presupuestos sin respuesta */}
          <button
            type="button"
            onClick={() => setPendingModalType('quote_followup')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all font-semibold ${
              staleQuotes.length > 0
                ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B]'
            }`}
          >
            <span>Presupuestos sin respuesta (+2d)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                staleQuotes.length > 0 ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {staleQuotes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. TRES COLUMNAS TIPO TABLERO (KANBAN DE 2 PERSONAS) ── */}
      {/* Selector de pestañas para celular */}
      <div className="flex md:hidden bg-white p-1 rounded-2xl border border-[#E5E5E3] shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('entran')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'entran' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B]'
          }`}
        >
          <span>Entran Hoy</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {entriesTodayQuotes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('taller')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'taller' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B]'
          }`}
        >
          <span>En Taller</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {inWorkshopQuotes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('listos')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'listos' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B]'
          }`}
        >
          <span>Listos</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {readyQuotes.length}
          </span>
        </button>
      </div>

      {/* Grilla de 3 columnas (en desktop 3 columnas, en móvil pestaña seleccionada) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* COLUMNA 1: ENTRAN HOY */}
        <div
          className={`bg-white border border-[#E5E5E3] rounded-2xl p-3.5 space-y-3 ${
            mobileTab !== 'entran' ? 'hidden md:block' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[#161616]">
                Entran Hoy ({entriesTodayQuotes.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#6B6B6B]">Por ingresar</span>
          </div>

          {entriesTodayQuotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B6B6B]">
              No hay turnos agendados para ingresar hoy.
            </div>
          ) : (
            <div className="space-y-2.5">
              {entriesTodayQuotes.map((q) => {
                const stageColor = getStageColor(q.status);
                const bayName = config.work_bays.find((b) => b.id === q.work_bay_id)?.name || 'Box 1';

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] bg-[#FAFAFA] space-y-2.5 hover:border-gray-400 transition-all"
                    style={{ borderLeftWidth: '4px', borderLeftColor: stageColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#161616]">
                        <Clock className="w-3 h-3 text-[#6B6B6B]" />
                        <span>{q.appointment_date ? formatLocalTime(q.appointment_date) : 'Hoy'}</span>
                        <span className="text-[10px] text-[#6B6B6B] font-normal">· {bayName}</span>
                      </div>
                      {q.vehicle_plate && <UruguayanPlate plate={q.vehicle_plate} size="sm" />}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">Cliente: {q.client_name}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E3] text-xs">
                      <span className="font-bold text-[#161616]">{formatCurrency(q.total_amount)}</span>
                      <div className="flex items-center gap-1.5">
                        {q.client_phone && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(q, 'confirm_appointment')}
                            className="p-1 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onAdvanceStatus(q.id, 'En taller')}
                          className="text-[11px] py-1 px-2.5 h-7 bg-[#D7141A] hover:bg-[#B80E14] text-white border-none gap-1"
                        >
                          <span>Ingresó al taller</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 2: EN TALLER */}
        <div
          className={`bg-white border border-[#E5E5E3] rounded-2xl p-3.5 space-y-3 ${
            mobileTab !== 'taller' ? 'hidden md:block' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[#161616]">
                En Taller ({inWorkshopQuotes.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#6B6B6B]">En proceso</span>
          </div>

          {inWorkshopQuotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B6B6B]">
              No hay autos en proceso en los boxes.
            </div>
          ) : (
            <div className="space-y-2.5">
              {inWorkshopQuotes.map((q) => {
                const stageColor = getStageColor(q.status);
                const bayName = config.work_bays.find((b) => b.id === q.work_bay_id)?.name || 'Box 1';

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] bg-[#FAFAFA] space-y-2.5 hover:border-gray-400 transition-all"
                    style={{ borderLeftWidth: '4px', borderLeftColor: stageColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#161616]">
                        <Droplets className="w-3 h-3 text-amber-600" />
                        <span>En taller</span>
                        <span className="text-[10px] text-[#6B6B6B] font-normal">· {bayName}</span>
                      </div>
                      {q.vehicle_plate && <UruguayanPlate plate={q.vehicle_plate} size="sm" />}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {q.selected_services.map((s) => s.serviceName).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E3] text-xs">
                      <span className="font-bold text-[#161616]">{formatCurrency(q.total_amount)}</span>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onAdvanceStatus(q.id, 'Listo para retirar');
                          onOpenWhatsApp(q, 'car_ready');
                        }}
                        className="text-[11px] py-1 px-2.5 h-7 bg-[#D7141A] hover:bg-[#B80E14] text-white border-none gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Marcar listo</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 3: LISTOS PARA RETIRAR */}
        <div
          className={`bg-white border border-[#E5E5E3] rounded-2xl p-3.5 space-y-3 ${
            mobileTab !== 'listos' ? 'hidden md:block' : ''
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[#161616]">
                Listos Para Retirar ({readyQuotes.length})
              </h3>
            </div>
            <span className="text-[10px] text-[#6B6B6B]">Terminados</span>
          </div>

          {readyQuotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B6B6B]">
              No hay autos pendientes de entrega.
            </div>
          ) : (
            <div className="space-y-2.5">
              {readyQuotes.map((q) => {
                const stageColor = getStageColor(q.status);
                const paid = (q.payments || []).filter((p) => !p.is_voided).reduce((s, p) => s + p.amount, 0);
                const remaining = Math.max(0, q.total_amount - paid);

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] bg-[#FAFAFA] space-y-2.5 hover:border-gray-400 transition-all"
                    style={{ borderLeftWidth: '4px', borderLeftColor: stageColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle className="w-3 h-3" />
                        <span>Listo</span>
                        {remaining > 0 && (
                          <span className="text-[10px] text-red-600 font-semibold">
                            (Resta: {formatCurrency(remaining)})
                          </span>
                        )}
                      </div>
                      {q.vehicle_plate && <UruguayanPlate plate={q.vehicle_plate} size="sm" />}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">Cliente: {q.client_name}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E3] text-xs">
                      <span className="font-bold text-[#161616]">{formatCurrency(q.total_amount)}</span>
                      <div className="flex items-center gap-1.5">
                        {q.client_phone && (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(q, 'car_ready')}
                            className="p-1 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                            title="Avisar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => onOpenPayment(q)}
                          className="text-[11px] py-1 px-2.5 h-7 bg-[#D7141A] hover:bg-[#B80E14] text-white border-none gap-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Cobrar y entregar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. TOTALES DEL DÍA ── */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 shadow-xs">
        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#6B6B6B] mb-2.5">
          Resumen Económico del Día
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3]">
            <span className="text-[11px] text-[#6B6B6B] block">Autos atendidos / entregados</span>
            <span className="text-xl font-bold font-display text-[#161616] mt-0.5 block">
              {deliveredTodayQuotes.length} vehículos
            </span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 block">Cobrado hoy en caja</span>
            <span className="text-xl font-bold font-display text-emerald-900 mt-0.5 block">
              {formatCurrency(totalCollectedToday)}
            </span>
            {Object.keys(collectionsByMethod).length > 0 && (
              <div className="text-[10px] text-emerald-700 mt-1 flex flex-wrap gap-1.5">
                {Object.entries(collectionsByMethod).map(([m, a]) => (
                  <span key={m}>
                    {m}: {formatCurrency(a)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-red-50 rounded-xl border border-red-200">
            <span className="text-[11px] text-red-800 block">Saldo pendiente de cobro</span>
            <span className="text-xl font-bold font-display text-red-900 mt-0.5 block">
              {formatCurrency(totalPendingBalance)}
            </span>
            <span className="text-[10px] text-red-700 mt-1 block">
              {pendingBalances.length} trabajos con saldo
            </span>
          </div>
        </div>
      </div>

      {/* ── SUBMODAL DE PENDIENTES EN ACCIÓN DIRECTA ── */}
      {pendingModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-[#161616]">
                {pendingModalType === 'confirm_tomorrow' && 'Turnos de Mañana para Confirmar'}
                {pendingModalType === 'ready_notify' && 'Autos Listos para Avisar Retiro'}
                {pendingModalType === 'pending_balance' && 'Trabajos con Saldo Pendiente'}
                {pendingModalType === 'quote_followup' && 'Presupuestos Sin Respuesta (+2 días)'}
              </h3>
              <button
                type="button"
                onClick={() => setPendingModalType(null)}
                className="p-1 rounded-full text-[#6B6B6B] hover:bg-[#F5F5F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {pendingModalType === 'confirm_tomorrow' &&
                tomorrowApptsToConfirm.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {q.client_name} ({q.client_phone}) · {q.appointment_date ? formatLocalTime(q.appointment_date) : 'Mañana'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPendingModalType(null);
                        onOpenWhatsApp(q, 'confirm_appointment');
                      }}
                      className="bg-[#25D366] hover:bg-emerald-600 text-white text-xs gap-1 border-none"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                    </Button>
                  </div>
                ))}

              {pendingModalType === 'ready_notify' &&
                readyPendingWhatsApp.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {q.client_name} ({q.client_phone})
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPendingModalType(null);
                        onOpenWhatsApp(q, 'car_ready');
                      }}
                      className="bg-[#25D366] hover:bg-emerald-600 text-white text-xs gap-1 border-none"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Avisar</span>
                    </Button>
                  </div>
                ))}

              {pendingModalType === 'pending_balance' &&
                pendingBalances.map((q) => {
                  const paid = (q.payments || []).filter((p) => !p.is_voided).reduce((s, p) => s + p.amount, 0);
                  const rem = Math.max(0, q.total_amount - paid);
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl border border-[#E5E5E3] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                        <p className="text-[11px] text-[#6B6B6B]">
                          {q.client_name} · Resta: <strong className="text-red-600">{formatCurrency(rem)}</strong>
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setPendingModalType(null);
                          onOpenPayment(q);
                        }}
                        className="bg-[#D7141A] hover:bg-[#B80E14] text-white text-xs gap-1 border-none"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Cobrar</span>
                      </Button>
                    </div>
                  );
                })}

              {pendingModalType === 'quote_followup' &&
                staleQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border border-[#E5E5E3] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#161616] font-display">{q.vehicle_info}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {q.client_name} · Enviado el {formatLocalDate(q.created_at)} ({formatCurrency(q.total_amount)})
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPendingModalType(null);
                        onOpenWhatsApp(q, 'quote_followup');
                      }}
                      className="bg-[#25D366] hover:bg-emerald-600 text-white text-xs gap-1 border-none"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Seguimiento</span>
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

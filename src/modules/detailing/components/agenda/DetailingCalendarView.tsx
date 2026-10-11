import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Ban,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  Phone,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCheck,
  DollarSign
} from 'lucide-react';
import {
  Appointment,
  DetailingQuote,
  DetailingConfig,
  Profile,
  DetailingQuoteStatus,
  DetailingWorkBay
} from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';
import {
  formatLocalDate,
  formatLocalTime,
  getLocalDateString,
  getDayOfWeekKey,
  timeStringToMinutes,
  minutesToTimeString,
  formatCurrency,
  addMinutesToIso
} from '../../../../lib/formatters';

// Submodales
import { DetailingFindSlotModal } from './DetailingFindSlotModal';
import { DetailingWhatsAppQuickModal } from './DetailingWhatsAppQuickModal';
import { DetailingCheckinModal } from './DetailingCheckinModal';
import { DetailingQualityControlModal } from './DetailingQualityControlModal';
import { DetailingBlockTimeModal } from './DetailingBlockTimeModal';
import { DetailingPaymentDeliveryModal } from './DetailingPaymentDeliveryModal';

const HOUR_HEIGHT = 64; // Escala 1 hora = 64px

interface DetailingCalendarViewProps {
  appointments: Appointment[];
  detailingQuotes: DetailingQuote[];
  config: DetailingConfig;
  profiles: Profile[];
  onUpdateQuoteStatus: (
    quoteId: string,
    newStatus: DetailingQuoteStatus,
    extra?: any
  ) => void;
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
  onAddAppointment: (data: any) => void;
  onOpenQuoterModal: (
    quote?: DetailingQuote,
    initialSlot?: { date: string; time?: string; bayId?: string }
  ) => void;
  onRecordCheckin: (quoteId: string, checkinData: any) => void;
  onRecordQualityControl: (quoteId: string, qcData: any) => void;
  onRecordPayment: (quoteId: string, paymentData: any) => void;
  onLogWhatsAppSent: (targetId: string, templateKey: string, phone: string) => void;
}

export const DetailingCalendarView: React.FC<DetailingCalendarViewProps> = ({
  appointments,
  detailingQuotes,
  config,
  profiles,
  onUpdateQuoteStatus,
  onUpdateAppointment,
  onAddAppointment,
  onOpenQuoterModal,
  onRecordCheckin,
  onRecordQualityControl,
  onRecordPayment,
  onLogWhatsAppSent
}) => {
  // Vista actual: 'dia' | 'semana' | 'mes' | 'lista'
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes' | 'lista'>('dia');

  // Fecha seleccionada (YYYY-MM-DD en hora de Uruguay)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateString());

  // Modo de agrupación en vista DÍA: por puesto de trabajo ('bay') o por detailer ('detailer')
  const [dayGroupBy, setDayGroupBy] = useState<'bay' | 'detailer'>('bay');

  // Filtros
  const [filterDetailerId, setFilterDetailerId] = useState<string>('all');
  const [filterBayId, setFilterBayId] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showPastInList, setShowPastInList] = useState<boolean>(false);
  const [weekDaysCount, setWeekDaysCount] = useState<3 | 7>(7);

  // Modales
  const [isFindSlotOpen, setIsFindSlotOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [isPaymentDeliveryOpen, setIsPaymentDeliveryOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeQuoteForModal, setActiveQuoteForModal] = useState<DetailingQuote | null>(null);
  const [activeAppointmentForModal, setActiveAppointmentForModal] = useState<Appointment | null>(null);
  const [whatsAppTemplateKey, setWhatsAppTemplateKey] = useState<
    'confirm_appointment' | 'day_before_reminder' | 'car_ready' | 'quote_followup'
  >('confirm_appointment');

  // Hoja inferior (Bottom sheet) para detalle del turno
  const [selectedTurnDetail, setSelectedTurnDetail] = useState<{
    appointment: Appointment;
    quote?: DetailingQuote;
  } | null>(null);

  // Touch swipe support para celular en vista Día
  const touchStartXRef = useRef<number | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  // Lista de Detailers asignables: activos con negocio detailing o rol detailer / admin
  const detailers = useMemo(() => {
    return profiles.filter(
      (p) =>
        p.is_active &&
        (p.businesses?.includes('detailing') ||
          p.roles.includes('detailer') ||
          p.roles.includes('admin') ||
          p.roles.includes('encargado_detailing'))
    );
  }, [profiles]);

  // Boxes activos
  const activeBays = useMemo(() => {
    return (config.work_bays || []).filter((b) => b.is_active);
  }, [config.work_bays]);

  // Turnos de detailing filtrados
  const detailingAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.business !== 'detailing' || a.voided_at) return false;
      if (filterDetailerId !== 'all' && a.assigned_to !== filterDetailerId) return false;
      if (filterBayId !== 'all' && a.work_bay_id !== filterBayId) return false;
      if (filterStage !== 'all' && a.stage !== filterStage && a.status !== filterStage) return false;
      return true;
    });
  }, [appointments, filterDetailerId, filterBayId, filterStage]);

  // Helper para mapa de colores de estados
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

  // Navegación de fechas
  const handlePrevDay = () => {
    const curr = new Date(selectedDateStr + 'T12:00:00-03:00');
    curr.setDate(curr.getDate() - 1);
    setSelectedDateStr(getLocalDateString(curr));
  };

  const handleNextDay = () => {
    const curr = new Date(selectedDateStr + 'T12:00:00-03:00');
    curr.setDate(curr.getDate() + 1);
    setSelectedDateStr(getLocalDateString(curr));
  };

  const handleToday = () => {
    setSelectedDateStr(getLocalDateString());
  };

  // Touch handlers para deslizar día en móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (diff > 70) {
      handlePrevDay();
    } else if (diff < -70) {
      handleNextDay();
    }
    touchStartXRef.current = null;
  };

  // Horas del día para la grilla según config
  const currentDayOfWeekKey = getDayOfWeekKey(selectedDateStr);
  const currentDayConfig = config.schedule?.[currentDayOfWeekKey] as any;
  const openTime = currentDayConfig?.open_time || currentDayConfig?.open || '08:00';
  const closeTime = currentDayConfig?.close_time || currentDayConfig?.close || '19:00';

  const startHour = parseInt(openTime.split(':')[0], 10) || 8;
  const endHour = parseInt(closeTime.split(':')[0], 10) || 19;
  const openMinutes = startHour * 60;
  const closeMinutes = (endHour + 1) * 60;
  const totalGridMinutes = closeMinutes - openMinutes;
  const totalGridHeight = (totalGridMinutes / 60) * HOUR_HEIGHT;

  const hoursRange = useMemo(() => {
    const list = [];
    for (let h = startHour; h <= endHour; h++) {
      list.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return list;
  }, [startHour, endHour]);

  // Hora actual en Uruguay (-03:00) para la línea roja
  const nowUruguay = new Date();
  const todayStr = getLocalDateString(nowUruguay);
  const isSelectedDateToday = selectedDateStr === todayStr;

  const currentMinutesFromStart = useMemo(() => {
    if (!isSelectedDateToday) return null;
    const uruguayTimeString = nowUruguay.toLocaleTimeString('en-GB', {
      timeZone: 'America/Montevideo',
      hour12: false
    });
    const currentMins = timeStringToMinutes(uruguayTimeString.substring(0, 5));
    if (currentMins < openMinutes || currentMins > closeMinutes) return null;
    return currentMins - openMinutes;
  }, [isSelectedDateToday, openMinutes, closeMinutes]);

  // Scroll automático a la línea roja de "Ahora" al entrar
  useEffect(() => {
    if (viewMode === 'dia' && isSelectedDateToday && currentMinutesFromStart !== null && timelineContainerRef.current) {
      const targetScroll = Math.max(0, (currentMinutesFromStart / 60) * HOUR_HEIGHT - 120);
      timelineContainerRef.current.scrollTop = targetScroll;
    }
  }, [viewMode, isSelectedDateToday]);

  // Verificación de feriado en la fecha seleccionada
  const activeHoliday = (config.holidays || []).find((h) => h.date === selectedDateStr);

  // Helper para calcular segmentos de turnos multi-día
  const getAppointmentSegmentForDate = (
    app: Appointment,
    targetDateStr: string
  ): {
    startsAtMinutes: number;
    durationMinutes: number;
    dayIndex: number;
    totalDays: number;
  } | null => {
    const appStartDateStr = getLocalDateString(app.start_time);
    const totalDuration = app.duration_minutes || 60;
    const dailyCapacity = Math.max(60, closeMinutes - openMinutes);
    const startMinsOfDay = timeStringToMinutes(formatLocalTime(app.start_time));
    const day1Available = Math.max(60, closeMinutes - startMinsOfDay);

    // Si entra en un solo día
    if (totalDuration <= day1Available) {
      if (appStartDateStr === targetDateStr) {
        return {
          startsAtMinutes: startMinsOfDay,
          durationMinutes: totalDuration,
          dayIndex: 1,
          totalDays: 1
        };
      }
      return null;
    }

    // Turno multi-día (ej. 14 horas = 2 días)
    let remaining = totalDuration;
    const days: { dateStr: string; startMins: number; dur: number }[] = [];
    const curDate = new Date(appStartDateStr + 'T12:00:00-03:00');

    // Día 1
    const seg1Dur = Math.min(remaining, day1Available);
    days.push({
      dateStr: getLocalDateString(curDate),
      startMins: startMinsOfDay,
      dur: seg1Dur
    });
    remaining -= seg1Dur;

    // Días subsiguientes
    while (remaining > 0) {
      curDate.setDate(curDate.getDate() + 1);
      const segDur = Math.min(remaining, dailyCapacity);
      days.push({
        dateStr: getLocalDateString(curDate),
        startMins: openMinutes,
        dur: segDur
      });
      remaining -= segDur;
    }

    const matchIdx = days.findIndex((d) => d.dateStr === targetDateStr);
    if (matchIdx >= 0) {
      return {
        startsAtMinutes: days[matchIdx].startMins,
        durationMinutes: days[matchIdx].dur,
        dayIndex: matchIdx + 1,
        totalDays: days.length
      };
    }
    return null;
  };

  // Cálculo de solapamientos para renderizado side-by-side con borde rojo
  const getColumnLayout = (
    colId: string,
    targetDateStr: string
  ) => {
    const itemsInCol: {
      appointment: Appointment;
      segment: { startsAtMinutes: number; durationMinutes: number; dayIndex: number; totalDays: number };
      startMins: number;
      endMins: number;
    }[] = [];

    detailingAppointments.forEach((app) => {
      if (dayGroupBy === 'bay' && app.work_bay_id !== colId) return;
      if (dayGroupBy === 'detailer' && app.assigned_to !== colId) return;

      const seg = getAppointmentSegmentForDate(app, targetDateStr);
      if (seg) {
        itemsInCol.push({
          appointment: app,
          segment: seg,
          startMins: seg.startsAtMinutes,
          endMins: seg.startsAtMinutes + seg.durationMinutes
        });
      }
    });

    // Mapear colIndex, colCount y hasConflict
    const layoutMap: Record<
      string,
      {
        colIndex: number;
        colCount: number;
        hasConflict: boolean;
        appointment: Appointment;
        segment: { startsAtMinutes: number; durationMinutes: number; dayIndex: number; totalDays: number };
      }
    > = {};

    itemsInCol.forEach((item) => {
      const overlapping = itemsInCol.filter(
        (other) => item.startMins < other.endMins && item.endMins > other.startMins
      );
      const hasConflict = overlapping.length > 1;
      overlapping.sort((a, b) => a.startMins - b.startMins || a.appointment.id.localeCompare(b.appointment.id));
      const colIndex = overlapping.findIndex((o) => o.appointment.id === item.appointment.id);
      layoutMap[item.appointment.id] = {
        colIndex: Math.max(0, colIndex),
        colCount: Math.max(1, overlapping.length),
        hasConflict,
        appointment: item.appointment,
        segment: item.segment
      };
    });

    return Object.values(layoutMap);
  };

  // Manejador del avance de etapa simplificado
  const handleNextAction = (quote: DetailingQuote, appointment?: Appointment) => {
    const currentStatus = quote.status;
    if (currentStatus === 'Presupuesto') {
      onOpenQuoterModal(quote);
    } else if (currentStatus === 'Agendado') {
      onUpdateQuoteStatus(quote.id, 'En taller');
      if (appointment) {
        onUpdateAppointment(appointment.id, { stage: 'En taller', status: 'Confirmado' });
      }
      setSelectedTurnDetail(null);
    } else if (currentStatus === 'En taller') {
      onUpdateQuoteStatus(quote.id, 'Listo para retirar');
      if (appointment) {
        onUpdateAppointment(appointment.id, { stage: 'Listo para retirar' });
      }
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setWhatsAppTemplateKey('car_ready');
      setIsWhatsAppModalOpen(true);
      setSelectedTurnDetail(null);
    } else if (currentStatus === 'Listo para retirar') {
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setIsPaymentDeliveryOpen(true);
      setSelectedTurnDetail(null);
    }
  };

  // Acción "No vino"
  const handleMarkNoShow = (quote: DetailingQuote, appointment?: Appointment) => {
    if (window.confirm(`¿Marcar que ${quote.client_name} no vino? Se liberará el box en la agenda.`)) {
      onUpdateQuoteStatus(quote.id, 'No vino');
      if (appointment) {
        onUpdateAppointment(appointment.id, { stage: 'No vino', status: 'Cancelado' });
      }
      setSelectedTurnDetail(null);
      setActiveQuoteForModal(quote);
      setWhatsAppTemplateKey('quote_followup');
      setIsWhatsAppModalOpen(true);
    }
  };

  // Acción "Anular"
  const handleVoidQuote = (quote: DetailingQuote, appointment?: Appointment) => {
    const reason = window.prompt(`Motivo de anulación para ${quote.client_name}:`, 'Cancelado por el cliente');
    if (reason !== null) {
      onUpdateQuoteStatus(quote.id, 'Anulado', { reason });
      if (appointment) {
        onUpdateAppointment(appointment.id, { stage: 'Anulado', status: 'Cancelado' });
      }
      setSelectedTurnDetail(null);
    }
  };

  // Helper para abrir WhatsApp rápido
  const handleTriggerWhatsApp = (
    quote: DetailingQuote,
    appointment?: Appointment,
    templateKey: 'confirm_appointment' | 'day_before_reminder' | 'car_ready' | 'quote_followup' = 'confirm_appointment'
  ) => {
    setActiveQuoteForModal(quote);
    setActiveAppointmentForModal(appointment || null);
    setWhatsAppTemplateKey(templateKey);
    setIsWhatsAppModalOpen(true);
  };

  // Click en hueco vacío de la grilla -> abre cotizador con día, hora y box
  const handleGridBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement>,
    colId: string
  ) => {
    // Si el clic vino de un turno, ignorar
    if ((e.target as HTMLElement).closest('[data-appointment-card]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clickedMinutes = openMinutes + Math.floor((offsetY / HOUR_HEIGHT) * 60);
    // Redondear a intervalos de 30 min
    const roundedMinutes = Math.min(closeMinutes - 60, Math.max(openMinutes, Math.floor(clickedMinutes / 30) * 30));
    const timeStr = minutesToTimeString(roundedMinutes);

    onOpenQuoterModal(undefined, {
      date: selectedDateStr,
      time: timeStr,
      bayId: dayGroupBy === 'bay' ? colId : activeBays[0]?.id || 'box-1'
    });
  };

  return (
    <div className="space-y-4">
      {/* ── BARRA SUPERIOR: Vistas, Navegación de Fechas y Acciones ── */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Navegación y selector de fecha */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg hover:bg-white text-[#161616] transition-all"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-[#161616] hover:bg-white rounded-lg transition-all"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg hover:bg-white text-[#161616] transition-all"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                className="px-3 py-1.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs font-semibold text-[#161616] focus:outline-none focus:border-[#D7141A]"
              />
              <span className="text-sm font-bold font-display text-[#161616] capitalize hidden sm:inline-block">
                {formatLocalDate(selectedDateStr + 'T12:00:00-03:00', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </span>
            </div>
          </div>

          {/* Selector de Vistas y Botones Principales */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Vistas: Día / Semana / Mes / Lista */}
            <div className="flex bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setViewMode('dia')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'dia' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setViewMode('semana')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'semana' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mes')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'mes' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'lista' ? 'bg-[#161616] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Lista
              </button>
            </div>

            {/* Hueco libre y Bloquear horario */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFindSlotOpen(true)}
              className="gap-1.5 text-xs text-[#161616]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
              <span className="hidden sm:inline">Buscar</span> Hueco Libre
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBlockModalOpen(true)}
              className="gap-1.5 text-xs text-[#6B6B6B]"
            >
              <Ban className="w-3.5 h-3.5 text-amber-600" />
              Bloquear Horario
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpenQuoterModal(undefined, { date: selectedDateStr })}
              className="gap-1.5 text-xs bg-[#D7141A] hover:bg-[#B80E14] text-white border-none"
            >
              <Plus className="w-4 h-4" />
              Nuevo Turno
            </Button>
          </div>
        </div>

        {/* ── FILTROS Y SWITCH DE COLUMNAS ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-[#E5E5E3]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por puesto */}
            <select
              value={filterBayId}
              onChange={(e) => setFilterBayId(e.target.value)}
              className="px-2.5 py-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg text-xs font-medium text-[#161616] focus:outline-none"
            >
              <option value="all">Todos los Boxes</option>
              {activeBays.map((bay) => (
                <option key={bay.id} value={bay.id}>
                  {bay.name}
                </option>
              ))}
            </select>

            {/* Filtro por detailer */}
            <select
              value={filterDetailerId}
              onChange={(e) => setFilterDetailerId(e.target.value)}
              className="px-2.5 py-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg text-xs font-medium text-[#161616] focus:outline-none"
            >
              <option value="all">Todos los Detailers</option>
              {detailers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>

            {/* Filtro por estado */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-2.5 py-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg text-xs font-medium text-[#161616] focus:outline-none"
            >
              <option value="all">Todos los Estados</option>
              {config.flow_statuses?.map((st) => (
                <option key={st.id} value={st.id}>
                  {(st as any).label || (st as any).name || st.id}
                </option>
              ))}
            </select>
          </div>

          {/* Switch de columnas en Vista Día */}
          {viewMode === 'dia' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#6B6B6B]">Columnas por:</span>
              <div className="flex bg-[#F5F5F4] p-0.5 rounded-lg border border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setDayGroupBy('bay')}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                    dayGroupBy === 'bay' ? 'bg-white text-[#161616] font-bold shadow-xs' : 'text-[#6B6B6B]'
                  }`}
                >
                  Boxes ({activeBays.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDayGroupBy('detailer')}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                    dayGroupBy === 'detailer' ? 'bg-white text-[#161616] font-bold shadow-xs' : 'text-[#6B6B6B]'
                  }`}
                >
                  Detailers ({detailers.length})
                </button>
              </div>
            </div>
          )}

          {/* Toggle móvil 3 días / 7 días en semana */}
          {viewMode === 'semana' && (
            <div className="flex items-center gap-1.5 sm:hidden">
              <span className="text-[11px] font-semibold text-[#6B6B6B]">Mostrar:</span>
              <button
                type="button"
                onClick={() => setWeekDaysCount(weekDaysCount === 7 ? 3 : 7)}
                className="px-2 py-0.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-md text-xs font-bold text-[#161616]"
              >
                {weekDaysCount === 7 ? 'Ver 3 días' : 'Ver 7 días'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de Feriado o Día No Laborable */}
      {activeHoliday && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Feriado / Día Especial:</strong> {activeHoliday.name || activeHoliday.reason} ({activeHoliday.date})
            </span>
          </div>
          <span className="px-2 py-0.5 bg-amber-200/60 rounded text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Horario restringido
          </span>
        </div>
      )}

      {/* ── 1. VISTA DÍA (Línea de tiempo 64px/h con Posicionamiento Absoluto) ── */}
      {viewMode === 'dia' && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white border border-[#E5E5E3] rounded-2xl p-4 overflow-hidden select-none"
        >
          {/* Header de Columnas */}
          <div className="min-w-[650px] overflow-x-auto">
            <div className="grid grid-cols-[70px_repeat(auto-fit,minmax(200px,1fr))] border-b border-[#E5E5E3] pb-2.5 mb-1">
              <div className="text-xs font-semibold text-[#6B6B6B] uppercase font-display flex items-center">
                Hora
              </div>
              {(dayGroupBy === 'bay' ? activeBays : detailers).map((col: any) => (
                <div key={col.id} className="px-3 border-l border-[#E5E5E3]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: col.color || (dayGroupBy === 'bay' ? '#2563EB' : '#161616') }}
                    />
                    <span className="text-sm font-bold font-display text-[#161616] truncate">
                      {col.name || col.full_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] truncate block">
                    {dayGroupBy === 'bay'
                      ? (col.supported_services || ['Detallado general']).join(', ')
                      : 'Detailer'}
                  </span>
                </div>
              ))}
            </div>

            {/* Timeline Contenedor */}
            <div
              ref={timelineContainerRef}
              className="relative overflow-y-auto max-h-[750px] border-b border-[#E5E5E3]"
              style={{ height: `${totalGridHeight}px` }}
            >
              {/* Línea roja con la hora actual de Uruguay */}
              {currentMinutesFromStart !== null && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                  style={{ top: `${(currentMinutesFromStart / 60) * HOUR_HEIGHT}px` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[#D7141A] -ml-1.5 shadow-xs" />
                  <div className="w-full border-t-2 border-[#D7141A] border-dashed" />
                  <span className="text-[9px] font-bold text-white bg-[#D7141A] px-1.5 py-0.5 rounded ml-1 shadow-xs">
                    Ahora
                  </span>
                </div>
              )}

              {/* Grilla de Fondo con Horas */}
              <div className="grid grid-cols-[70px_repeat(auto-fit,minmax(200px,1fr))] h-full absolute inset-0 pointer-events-none">
                {/* Columna de Horas */}
                <div className="border-r border-[#E5E5E3]">
                  {hoursRange.map((hourStr, idx) => (
                    <div
                      key={hourStr}
                      className="text-xs font-semibold text-[#6B6B6B] pr-2 pt-1 font-display text-right border-b border-[#F5F5F4]"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      {hourStr}
                    </div>
                  ))}
                </div>

                {/* Columnas de los Boxes/Detailers (líneas de hora tenues) */}
                {(dayGroupBy === 'bay' ? activeBays : detailers).map((col: any) => (
                  <div key={col.id} className="border-r border-[#F5F5F4] h-full relative">
                    {hoursRange.map((hourStr) => (
                      <div
                        key={hourStr}
                        className="border-b border-[#F5F5F4] w-full"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Capa Interactiva: Columnas con Clic en Hueco y Bloques Posicionados Absolutos */}
              <div className="grid grid-cols-[70px_repeat(auto-fit,minmax(200px,1fr))] h-full relative z-10">
                <div /> {/* Espacio para columna de hora */}
                {(dayGroupBy === 'bay' ? activeBays : detailers).map((col: any) => {
                  const layoutCards = getColumnLayout(col.id, selectedDateStr);

                  return (
                    <div
                      key={col.id}
                      onClick={(e) => handleGridBackgroundClick(e, col.id)}
                      className="relative h-full border-r border-transparent cursor-pointer hover:bg-slate-50/40 transition-colors"
                      title="Tocá un hueco libre para agendar un turno aquí"
                    >
                      {layoutCards.map(({ appointment: app, segment, colIndex, colCount, hasConflict }) => {
                        const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                        const currentStage = app.stage || quote?.status || app.status;
                        const stageColor = getStageColor(currentStage);

                        const topPx = Math.max(0, ((segment.startsAtMinutes - openMinutes) / 60) * HOUR_HEIGHT);
                        const heightPx = Math.max(38, (segment.durationMinutes / 60) * HOUR_HEIGHT);

                        // Cálculo horizontal side-by-side si hay solapamiento
                        const widthPercent = 100 / colCount;
                        const leftPercent = colIndex * widthPercent;

                        const isBlocked = app.is_blocked;

                        if (isBlocked) {
                          return (
                            <div
                              key={app.id}
                              data-appointment-card="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTurnDetail({ appointment: app, quote: undefined });
                              }}
                              className="absolute rounded-xl p-2 text-xs border border-dashed border-amber-300 bg-amber-50/90 text-amber-900 shadow-xs cursor-pointer overflow-hidden z-20"
                              style={{
                                top: `${topPx}px`,
                                height: `${heightPx}px`,
                                left: `${leftPercent}%`,
                                width: `calc(${widthPercent}% - 4px)`
                              }}
                            >
                              <div className="flex items-center gap-1 font-bold text-[11px]">
                                <Ban className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">Bloqueado</span>
                              </div>
                              <p className="text-[10px] text-amber-800 truncate mt-0.5">
                                {app.block_reason || 'Mantenimiento / Pausa'}
                              </p>
                              <span className="text-[9px] text-amber-700 block mt-0.5 font-medium">
                                {formatLocalTime(app.start_time)} ({app.duration_minutes}m)
                              </span>
                            </div>
                          );
                        }

                        const hasConfirmed = !!quote?.confirmed_at;
                        const hasDeposit = (quote?.payments || []).some((p) => !p.is_voided && p.amount > 0);
                        const hasWhatsApp = (quote?.whatsapp_sent_log || []).length > 0;
                        const isMultiDay = segment.totalDays > 1;

                        return (
                          <div
                            key={app.id}
                            data-appointment-card="true"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTurnDetail({ appointment: app, quote });
                            }}
                            className={`absolute rounded-xl p-2 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden z-20 flex flex-col justify-between ${
                              hasConflict ? 'border-2 border-red-500 shadow-red-100' : 'border border-[#E5E5E3]'
                            }`}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `${leftPercent}%`,
                              width: `calc(${widthPercent}% - 4px)`,
                              backgroundColor: '#FFFFFF',
                              borderLeftWidth: '4px',
                              borderLeftColor: stageColor
                            }}
                          >
                            {/* Cabecera: Hora, Badge y Alerta de Choque */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[#161616] truncate">
                                  <Clock className="w-3 h-3 text-[#6B6B6B] shrink-0" />
                                  <span>{formatLocalTime(app.start_time)}</span>
                                  <span className="text-[9px] text-[#6B6B6B] font-normal">
                                    ({app.duration_minutes}m)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isMultiDay && (
                                    <span className="px-1 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                                      Día {segment.dayIndex} de {segment.totalDays}
                                    </span>
                                  )}
                                  {hasConflict && (
                                    <span
                                      className="w-2 h-2 rounded-full bg-red-600 animate-ping"
                                      title="Choque de horario detectado"
                                    />
                                  )}
                                  <span
                                    className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white truncate max-w-[80px]"
                                    style={{ backgroundColor: stageColor }}
                                  >
                                    {currentStage}
                                  </span>
                                </div>
                              </div>

                              {/* Auto, Matrícula y Cliente */}
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="truncate">
                                  <p className="text-xs font-bold text-[#161616] truncate font-display">
                                    {quote?.vehicle_info || (app.vehicle ? `${app.vehicle.brand} ${app.vehicle.model}` : app.title)}
                                  </p>
                                  <p className="text-[10px] text-[#6B6B6B] truncate">
                                    {quote?.client_name || app.client?.full_name || 'Cliente'}
                                  </p>
                                </div>
                                {(quote?.vehicle_plate || app.vehicle?.plate) && (
                                  <div className="shrink-0 scale-90 origin-right">
                                    <UruguayanPlate
                                      plate={quote?.vehicle_plate || app.vehicle?.plate || ''}
                                      size="sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Pie de tarjeta: Monto e Íconos chicos */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F4] text-[10px]">
                              <span className="font-bold text-[#161616] font-display">
                                {formatCurrency(quote?.total_amount || app.price_amount || 0)}
                              </span>

                              <div className="flex items-center gap-1">
                                {hasConfirmed && (
                                  <span
                                    title="Turno confirmado por cliente"
                                    className="text-emerald-600 font-bold text-[10px]"
                                  >
                                    ✓
                                  </span>
                                )}
                                {hasDeposit && (
                                  <span
                                    title="Seña o pago registrado"
                                    className="text-blue-600 font-bold text-[10px]"
                                  >
                                    $
                                  </span>
                                )}
                                {hasWhatsApp && (
                                  <span title="Mensaje WhatsApp enviado">
                                    <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. VISTA SEMANA (7 columnas o 3 días en móvil) ── */}
      {viewMode === 'semana' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Headers de días */}
            <div
              className={`grid border-b border-[#E5E5E3] pb-2 mb-2 text-center text-xs font-bold font-display ${
                weekDaysCount === 3 ? 'grid-cols-3' : 'grid-cols-7'
              }`}
            >
              {Array.from({ length: weekDaysCount }).map((_, idx) => {
                const baseDate = new Date(selectedDateStr + 'T12:00:00-03:00');
                const startDay = new Date(baseDate);
                if (weekDaysCount === 7) {
                  const dayOfWeek = (baseDate.getDay() + 6) % 7;
                  startDay.setDate(baseDate.getDate() - dayOfWeek + idx);
                } else {
                  startDay.setDate(baseDate.getDate() + idx);
                }
                const colDateStr = getLocalDateString(startDay);
                const isToday = colDateStr === todayStr;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(colDateStr);
                      setViewMode('dia');
                    }}
                    className={`p-2 rounded-xl cursor-pointer transition-all ${
                      isToday ? 'bg-[#D7141A] text-white shadow-xs' : 'hover:bg-[#F5F5F4] text-[#161616]'
                    }`}
                  >
                    <span className="block uppercase text-[10px]">
                      {formatLocalDate(startDay.toISOString(), { weekday: 'short' })}
                    </span>
                    <span className="text-base font-black">{startDay.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Listado de turnos de la semana por día */}
            <div
              className={`grid gap-2 ${weekDaysCount === 3 ? 'grid-cols-3' : 'grid-cols-7'}`}
            >
              {Array.from({ length: weekDaysCount }).map((_, idx) => {
                const baseDate = new Date(selectedDateStr + 'T12:00:00-03:00');
                const startDay = new Date(baseDate);
                if (weekDaysCount === 7) {
                  const dayOfWeek = (baseDate.getDay() + 6) % 7;
                  startDay.setDate(baseDate.getDate() - dayOfWeek + idx);
                } else {
                  startDay.setDate(baseDate.getDate() + idx);
                }
                const colDateStr = getLocalDateString(startDay);

                const dayTurns = detailingAppointments.filter(
                  (a) => getLocalDateString(a.start_time) === colDateStr && !a.voided_at
                );

                return (
                  <div
                    key={idx}
                    className="min-h-[300px] bg-[#FAFAFA] rounded-xl p-2 border border-[#E5E5E3] space-y-2"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[#E5E5E3]">
                      <span className="text-[10px] font-bold text-[#6B6B6B]">
                        {dayTurns.length} {dayTurns.length === 1 ? 'turno' : 'turnos'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateStr(colDateStr);
                          onOpenQuoterModal(undefined, { date: colDateStr });
                        }}
                        className="text-[#D7141A] hover:bg-red-50 p-0.5 rounded text-xs"
                        title="Agendar en este día"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {dayTurns.map((app) => {
                      const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                      const currentStage = app.stage || quote?.status || app.status;
                      const stageColor = getStageColor(currentStage);

                      return (
                        <div
                          key={app.id}
                          onClick={() => {
                            setSelectedTurnDetail({ appointment: app, quote });
                          }}
                          className="bg-white border border-[#E5E5E3] rounded-lg p-2 shadow-xs hover:shadow-md cursor-pointer text-[10px] space-y-1 transition-all"
                          style={{ borderLeftWidth: '3px', borderLeftColor: stageColor }}
                        >
                          <div className="flex items-center justify-between font-bold text-[#161616]">
                            <span>{formatLocalTime(app.start_time)}</span>
                            <span
                              className="px-1.5 py-0.2 rounded-full text-[8px] font-bold text-white"
                              style={{ backgroundColor: stageColor }}
                            >
                              {currentStage}
                            </span>
                          </div>
                          <p className="font-bold text-[#161616] truncate font-display">
                            {quote?.vehicle_info || app.title}
                          </p>
                          <p className="text-[#6B6B6B] truncate">
                            {quote?.client_name || app.client?.full_name}
                          </p>
                          <div className="text-right font-semibold text-[#161616]">
                            {formatCurrency(quote?.total_amount || app.price_amount || 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. VISTA MES (5 o 6 semanas dinámicas + ocupación por horario configurado) ── */}
      {viewMode === 'mes' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-[#6B6B6B] py-1 font-display">
                {d}
              </div>
            ))}
          </div>

          {(() => {
            const currentMonthBase = new Date(selectedDateStr + 'T12:00:00-03:00');
            const year = currentMonthBase.getFullYear();
            const month = currentMonthBase.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0

            // 5 o 6 semanas dinámicamente según días del mes y desplazamiento
            const totalCells = startDayOffset + daysInMonth > 35 ? 42 : 35;

            return (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const cellDate = new Date(year, month, 1 - startDayOffset + idx);
                  const cellDateStr = getLocalDateString(cellDate);
                  const isToday = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const isCurrentMonth = cellDate.getMonth() === month;

                  // Turnos de este día
                  const dayTurns = detailingAppointments.filter((a) => {
                    return getLocalDateString(a.start_time) === cellDateStr && !a.is_blocked && !a.voided_at;
                  });

                  // Ocupación calculada según horas configuradas de ese día
                  const cellDayKey = getDayOfWeekKey(cellDateStr);
                  const scheduleDay = config.schedule?.[cellDayKey] as any;
                  const isOpen = scheduleDay?.is_open ?? true;
                  const oMin = timeStringToMinutes(scheduleDay?.open_time || scheduleDay?.open || '08:00');
                  const cMin = timeStringToMinutes(scheduleDay?.close_time || scheduleDay?.close || '19:00');
                  const dayOperatingMinutes = isOpen ? Math.max(60, cMin - oMin) : 0;
                  const totalBays = activeBays.length || 1;
                  const capacityMinutes = dayOperatingMinutes * totalBays;

                  const bookedMinutes = dayTurns.reduce(
                    (acc, t) => acc + (t.duration_minutes || 120),
                    0
                  );
                  const occupancyPercent =
                    capacityMinutes > 0
                      ? Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100))
                      : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDateStr(cellDateStr);
                        setViewMode('dia');
                      }}
                      className={`min-h-[92px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        !isCurrentMonth
                          ? 'opacity-40 bg-[#FAFAFA] border-[#F5F5F4]'
                          : isSelected
                          ? 'border-[#161616] bg-[#F5F5F4]'
                          : isToday
                          ? 'border-[#D7141A] bg-red-50/20'
                          : 'border-[#E5E5E3] bg-white hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday ? 'text-[#D7141A]' : 'text-[#161616]'
                          }`}
                        >
                          {cellDate.getDate()}
                        </span>
                        {dayTurns.length > 0 && (
                          <span className="text-[10px] font-bold text-[#6B6B6B]">
                            {dayTurns.length} {dayTurns.length === 1 ? 'auto' : 'autos'}
                          </span>
                        )}
                      </div>

                      {/* Puntos de color por estado */}
                      <div className="flex flex-wrap gap-1 my-1">
                        {dayTurns.slice(0, 5).map((turn) => {
                          const quote = detailingQuotes.find((q) => q.id === turn.quote_id);
                          const stageColor = getStageColor(turn.stage || quote?.status || turn.status);
                          return (
                            <span
                              key={turn.id}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: stageColor }}
                            />
                          );
                        })}
                      </div>

                      {/* Barra de ocupación real */}
                      <div>
                        <div className="flex justify-between text-[9px] text-[#6B6B6B] mb-0.5">
                          <span>Ocupación</span>
                          <span className="font-semibold">{occupancyPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              occupancyPercent > 85
                                ? 'bg-red-500'
                                : occupancyPercent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── 4. VISTA LISTA (Próximos turnos desde hoy + filtro pasados) ── */}
      {viewMode === 'lista' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold font-display text-[#161616] uppercase tracking-wider">
                Próximos Turnos en Taller
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Agenda cronológica de servicios programados
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[#6B6B6B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPastInList}
                  onChange={(e) => setShowPastInList(e.target.checked)}
                  className="rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <span>Ver turnos pasados</span>
              </label>
            </div>
          </div>

          {(() => {
            const listFiltered = detailingAppointments
              .filter((app) => {
                if (showPastInList) return true;
                const dateStr = getLocalDateString(app.start_time);
                return dateStr >= todayStr;
              })
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

            if (listFiltered.length === 0) {
              return (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">
                  No hay turnos registrados desde hoy en adelante.
                </div>
              );
            }

            // Agrupar por fecha
            const groupsByDate: Record<string, Appointment[]> = {};
            listFiltered.forEach((a) => {
              const dStr = getLocalDateString(a.start_time);
              if (!groupsByDate[dStr]) groupsByDate[dStr] = [];
              groupsByDate[dStr].push(a);
            });

            return (
              <div className="space-y-4">
                {Object.entries(groupsByDate).map(([dStr, appts]) => {
                  const isToday = dStr === todayStr;
                  const tomorrowDate = new Date();
                  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                  const isTomorrow = dStr === getLocalDateString(tomorrowDate);

                  const dateHeaderLabel = isToday
                    ? 'Hoy'
                    : isTomorrow
                    ? 'Mañana'
                    : formatLocalDate(dStr + 'T12:00:00-03:00', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short'
                      });

                  return (
                    <div key={dStr} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider font-display text-[#161616]">
                          {dateHeaderLabel}
                        </span>
                        <div className="h-px bg-[#E5E5E3] flex-1" />
                      </div>

                      <div className="space-y-2">
                        {appts.map((app) => {
                          const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                          const currentStage = app.stage || quote?.status || app.status;
                          const stageColor = getStageColor(currentStage);

                          return (
                            <div
                              key={app.id}
                              onClick={() => setSelectedTurnDetail({ appointment: app, quote })}
                              className="p-3.5 rounded-xl border border-[#E5E5E3] bg-white hover:border-gray-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                              style={{ borderLeftWidth: '4px', borderLeftColor: stageColor }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B]">
                                    {formatLocalDate(app.start_time, { month: 'short' })}
                                  </span>
                                  <span className="text-sm font-black text-[#161616]">
                                    {new Date(app.start_time).getDate()}
                                  </span>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-[#161616]">
                                      {formatLocalTime(app.start_time)} ({app.duration_minutes}m)
                                    </span>
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                      style={{ backgroundColor: stageColor }}
                                    >
                                      {currentStage}
                                    </span>
                                    {app.work_bay_id && (
                                      <span className="text-[10px] font-semibold text-[#6B6B6B] bg-[#F5F5F4] px-2 py-0.5 rounded">
                                        {config.work_bays.find((b) => b.id === app.work_bay_id)?.name || 'Box'}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-sm font-bold text-[#161616] font-display mt-0.5">
                                    {quote?.vehicle_info || app.title}
                                  </p>
                                  <p className="text-xs text-[#6B6B6B]">
                                    Cliente: {quote?.client_name || app.client?.full_name} ({quote?.client_phone || app.client?.phone || 'Sin tel'})
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#F5F5F4]">
                                {(quote?.vehicle_plate || app.vehicle?.plate) && (
                                  <UruguayanPlate plate={quote?.vehicle_plate || app.vehicle?.plate || ''} size="sm" />
                                )}

                                <span className="text-sm font-bold font-display text-[#161616]">
                                  {formatCurrency(quote?.total_amount || app.price_amount || 0)}
                                </span>

                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {quote?.client_phone && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTriggerWhatsApp(quote, app)}
                                      className="p-2 text-[#25D366] hover:bg-emerald-50"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {quote && (
                                    <Button
                                      type="button"
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleNextAction(quote, app)}
                                      className="text-xs gap-1 bg-[#D7141A] hover:bg-[#B80E14] text-white border-none"
                                    >
                                      <span>Avanzar</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
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
            );
          })()}
        </div>
      )}

      {/* ── HOJA INFERIOR (BOTTOM SHEET) PARA DETALLE DEL TURNO AL TOCAR UN BLOQUE ── */}
      {selectedTurnDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getStageColor(
                      selectedTurnDetail.appointment.stage ||
                        selectedTurnDetail.quote?.status ||
                        selectedTurnDetail.appointment.status
                    )
                  }}
                />
                <h3 className="text-base font-bold font-display text-[#161616]">
                  Detalle del Servicio en Agenda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTurnDetail(null)}
                className="p-1 rounded-full text-[#6B6B6B] hover:bg-[#F5F5F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Turno y Auto */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-[#161616] font-display">
                    {selectedTurnDetail.quote?.vehicle_info || selectedTurnDetail.appointment.title}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">
                    Cliente: {selectedTurnDetail.quote?.client_name || selectedTurnDetail.appointment.client?.full_name}
                  </p>
                </div>
                {(selectedTurnDetail.quote?.vehicle_plate || selectedTurnDetail.appointment.vehicle?.plate) && (
                  <UruguayanPlate
                    plate={selectedTurnDetail.quote?.vehicle_plate || selectedTurnDetail.appointment.vehicle?.plate || ''}
                    size="sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F5F4] p-3 rounded-xl border border-[#E5E5E3]">
                <div>
                  <span className="text-[#6B6B6B] block">Horario</span>
                  <span className="font-bold text-[#161616]">
                    {formatLocalTime(selectedTurnDetail.appointment.start_time)} ({selectedTurnDetail.appointment.duration_minutes} min)
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block">Box asignado</span>
                  <span className="font-bold text-[#161616]">
                    {config.work_bays.find((b) => b.id === selectedTurnDetail.appointment.work_bay_id)?.name || 'Box 1'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block">Estado</span>
                  <span className="font-bold text-[#161616]">
                    {selectedTurnDetail.quote?.status || selectedTurnDetail.appointment.stage || selectedTurnDetail.appointment.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6B6B] block">Total</span>
                  <span className="font-bold text-[#161616]">
                    {formatCurrency(selectedTurnDetail.quote?.total_amount || selectedTurnDetail.appointment.price_amount || 0)}
                  </span>
                </div>
              </div>

              {/* Botón de Acción Siguiente Principal (Rojo) */}
              {selectedTurnDetail.quote && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center text-sm font-bold bg-[#D7141A] hover:bg-[#B80E14] text-white border-none py-3"
                  onClick={() => handleNextAction(selectedTurnDetail.quote!, selectedTurnDetail.appointment)}
                >
                  {selectedTurnDetail.quote.status === 'Agendado' && 'Ingresó al taller'}
                  {selectedTurnDetail.quote.status === 'En taller' && 'Marcar listo'}
                  {selectedTurnDetail.quote.status === 'Listo para retirar' && 'Cobrar y entregar'}
                  {selectedTurnDetail.quote.status === 'Presupuesto' && 'Agendar turno'}
                  {selectedTurnDetail.quote.status === 'Entregado' && 'Ver comprobante'}
                </Button>
              )}

              {/* Acciones Rápidas */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedTurnDetail.quote?.client_phone && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-xs text-[#25D366] hover:bg-emerald-50 border-emerald-200"
                    onClick={() => {
                      const q = selectedTurnDetail.quote!;
                      const a = selectedTurnDetail.appointment;
                      setSelectedTurnDetail(null);
                      handleTriggerWhatsApp(q, a);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </Button>
                )}

                {selectedTurnDetail.quote && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-xs text-[#161616]"
                    onClick={() => {
                      const q = selectedTurnDetail.quote!;
                      setSelectedTurnDetail(null);
                      onOpenQuoterModal(q);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar trabajo</span>
                  </Button>
                )}

                {selectedTurnDetail.quote && selectedTurnDetail.quote.status === 'Agendado' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-xs text-amber-700 hover:bg-amber-50"
                    onClick={() => handleMarkNoShow(selectedTurnDetail.quote!, selectedTurnDetail.appointment)}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>No vino</span>
                  </Button>
                )}

                {selectedTurnDetail.quote && selectedTurnDetail.quote.status !== 'Anulado' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-xs text-red-700 hover:bg-red-50"
                    onClick={() => handleVoidQuote(selectedTurnDetail.quote!, selectedTurnDetail.appointment)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Anular</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMODALES INTEGRADOS ── */}

      {/* 1. Modal Buscar Próximo Hueco Libre */}
      <DetailingFindSlotModal
        isOpen={isFindSlotOpen}
        onClose={() => setIsFindSlotOpen(false)}
        config={config}
        appointments={appointments}
        onSelectSlot={(slot) => {
          setSelectedDateStr(slot.date);
          setViewMode('dia');
          setFilterBayId(slot.bayId);
          setIsFindSlotOpen(false);
          onOpenQuoterModal(undefined, {
            date: slot.date,
            time: slot.time,
            bayId: slot.bayId
          });
        }}
      />

      {/* 2. Modal Bloquear Horario (client_id NULL y status Bloqueado) */}
      <DetailingBlockTimeModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        config={config}
        defaultDate={selectedDateStr}
        defaultBayId={filterBayId !== 'all' ? filterBayId : undefined}
        onSaveBlock={(data) => {
          onAddAppointment({
            business: 'detailing',
            client_id: undefined,
            work_bay_id: data.work_bay_id,
            start_time: data.start_time,
            duration_minutes: data.duration_minutes,
            status: 'Bloqueado',
            stage: 'Bloqueado',
            is_blocked: true,
            block_reason: data.reason,
            price_amount: 0,
            price_currency: 'UYU'
          });
        }}
      />

      {/* 3. Modal Check-in de Recepción */}
      <DetailingCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        quote={activeQuoteForModal}
        onConfirmCheckin={(quoteId, checkinData) => {
          onRecordCheckin(quoteId, checkinData);
          if (activeAppointmentForModal) {
            onUpdateAppointment(activeAppointmentForModal.id, { stage: 'En taller' });
          }
        }}
      />

      {/* 4. Modal Control de Calidad */}
      <DetailingQualityControlModal
        isOpen={isQCModalOpen}
        onClose={() => setIsQCModalOpen(false)}
        quote={activeQuoteForModal}
        config={config}
        onConfirmQualityControl={(quoteId, qcData) => {
          onRecordQualityControl(quoteId, qcData);
          if (activeAppointmentForModal) {
            onUpdateAppointment(activeAppointmentForModal.id, { stage: 'Listo para retirar' });
          }
        }}
        onOpenWhatsAppReady={(quote) => {
          setActiveQuoteForModal(quote);
          setWhatsAppTemplateKey('car_ready');
          setIsWhatsAppModalOpen(true);
        }}
      />

      {/* 5. Modal Entrega y Cobrado */}
      <DetailingPaymentDeliveryModal
        isOpen={isPaymentDeliveryOpen}
        onClose={() => setIsPaymentDeliveryOpen(false)}
        quote={activeQuoteForModal}
        config={config}
        onConfirmDeliveryAndPayment={(quoteId, paymentData) => {
          if (paymentData) {
            onRecordPayment(quoteId, paymentData);
          }
          onUpdateQuoteStatus(quoteId, 'Entregado');
          if (activeAppointmentForModal) {
            onUpdateAppointment(activeAppointmentForModal.id, {
              stage: 'Entregado',
              status: 'Finalizado'
            });
          }
        }}
      />

      {/* 6. Modal WhatsApp Rápido en 1 toque */}
      <DetailingWhatsAppQuickModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        config={config}
        defaultTemplateKey={whatsAppTemplateKey}
        quote={activeQuoteForModal}
        appointment={activeAppointmentForModal}
        onLoggedSend={(targetId, templateKey, phone) => {
          onLogWhatsAppSent(targetId, templateKey, phone);
        }}
      />
    </div>
  );
};

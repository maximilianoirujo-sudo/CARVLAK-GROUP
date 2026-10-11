import React, { useState, useMemo, useRef } from 'react';
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
  Phone
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
  formatCurrency
} from '../../../../lib/formatters';

// Submodales
import { DetailingFindSlotModal } from './DetailingFindSlotModal';
import { DetailingWhatsAppQuickModal } from './DetailingWhatsAppQuickModal';
import { DetailingCheckinModal } from './DetailingCheckinModal';
import { DetailingQualityControlModal } from './DetailingQualityControlModal';
import { DetailingBlockTimeModal } from './DetailingBlockTimeModal';
import { DetailingPaymentDeliveryModal } from './DetailingPaymentDeliveryModal';

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
  onOpenQuoterModal: (quote?: DetailingQuote) => void;
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

  // Touch swipe support para celular en vista Día
  const touchStartXRef = useRef<number | null>(null);

  // Lista de Detailers asignables
  const detailers = useMemo(() => {
    return profiles.filter((p) => p.roles.includes('detailer') || p.roles.includes('admin'));
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
    if (diff > 60) {
      handlePrevDay(); // Deslizar derecha -> día anterior
    } else if (diff < -60) {
      handleNextDay(); // Deslizar izquierda -> día siguiente
    }
    touchStartXRef.current = null;
  };

  // Horas del día para la grilla (ej. 08:00 a 19:00 según config)
  const currentDayOfWeekKey = getDayOfWeekKey(selectedDateStr);
  const currentDayConfig = config.schedule?.[currentDayOfWeekKey] as any;
  const openTime = currentDayConfig?.open_time || currentDayConfig?.open || '08:00';
  const closeTime = currentDayConfig?.close_time || currentDayConfig?.close || '19:00';

  const startHour = parseInt(openTime.split(':')[0], 10) || 8;
  const endHour = parseInt(closeTime.split(':')[0], 10) || 19;
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
    const startMins = startHour * 60;
    const endMins = (endHour + 1) * 60;
    if (currentMins < startMins || currentMins > endMins) return null;
    return currentMins - startMins;
  }, [isSelectedDateToday, startHour, endHour]);

  // Chequeo de colisión al mover o crear turno
  const checkCollision = (
    bayId: string,
    startTimeIso: string,
    durationMins: number,
    excludeAppId?: string
  ): { hasCollision: boolean; conflictingTurn?: Appointment } => {
    const startMins = new Date(startTimeIso).getTime();
    const endMins = startMins + durationMins * 60000;

    for (const app of detailingAppointments) {
      if (excludeAppId && app.id === excludeAppId) continue;
      if (app.work_bay_id !== bayId) continue;
      if (app.voided_at) continue;

      const appStart = new Date(app.start_time).getTime();
      const appEnd = appStart + app.duration_minutes * 60000;

      // Hay superposición si los intervalos se cruzan
      if (startMins < appEnd && endMins > appStart) {
        return { hasCollision: true, conflictingTurn: app };
      }
    }
    return { hasCollision: false };
  };

  // Manejador del avance de etapa en 1 clic
  const handleAdvanceStage = (quote: DetailingQuote, appointment?: Appointment) => {
    const stagesFlow: DetailingQuoteStatus[] = [
      'Agendado',
      'Confirmado',
      'Recibido',
      'En proceso',
      'Control de calidad',
      'Listo para retirar',
      'Entregado y cobrado'
    ];

    const currentIdx = stagesFlow.indexOf(quote.status as DetailingQuoteStatus);
    const nextStage = stagesFlow[currentIdx + 1];

    if (!nextStage) return;

    if (nextStage === 'Recibido') {
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setIsCheckinModalOpen(true);
    } else if (nextStage === 'Control de calidad') {
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setIsQCModalOpen(true);
    } else if (nextStage === 'Listo para retirar') {
      onUpdateQuoteStatus(quote.id, 'Listo para retirar');
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setWhatsAppTemplateKey('car_ready');
      setIsWhatsAppModalOpen(true);
    } else if (nextStage === 'Entregado y cobrado') {
      setActiveQuoteForModal(quote);
      setActiveAppointmentForModal(appointment || null);
      setIsPaymentDeliveryOpen(true);
    } else {
      onUpdateQuoteStatus(quote.id, nextStage);
    }
  };

  // Acción "No vino"
  const handleMarkNoShow = (quote: DetailingQuote, appointment?: Appointment) => {
    if (window.confirm(`¿Marcar que ${quote.client_name} no se presentó al turno? Se liberará el horario.`)) {
      onUpdateQuoteStatus(quote.id, 'No vino');
      if (appointment) {
        onUpdateAppointment(appointment.id, { stage: 'No vino', status: 'Cancelado' });
      }
      setActiveQuoteForModal(quote);
      setWhatsAppTemplateKey('quote_followup');
      setIsWhatsAppModalOpen(true);
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

  // Verificación de feriado en la fecha seleccionada
  const activeHoliday = (config.holidays || []).find((h) => h.date === selectedDateStr);

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
              onClick={() => onOpenQuoterModal()}
              className="gap-1.5 text-xs"
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
              {config.flow_statuses.map((st) => {
                const stName = (st as any).label || (st as any).name || st.id;
                return (
                  <option key={st.id} value={stName}>
                    {stName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* En vista DÍA: switch para alternar columnas por Puesto vs Detailer */}
          {viewMode === 'dia' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6B6B6B] font-semibold">Columnas por:</span>
              <div className="flex bg-[#F5F5F4] p-0.5 rounded-lg border border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setDayGroupBy('bay')}
                  className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
                    dayGroupBy === 'bay' ? 'bg-white text-[#161616] font-bold shadow-xs' : 'text-[#6B6B6B]'
                  }`}
                >
                  Puestos ({activeBays.length})
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

      {/* ── CONTENIDO PRINCIPAL SEGÚN VISTA ── */}

      {/* ── 1. VISTA DÍA (Línea de tiempo por horas + columnas) ── */}
      {viewMode === 'dia' && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white border border-[#E5E5E3] rounded-2xl p-4 overflow-x-auto select-none"
        >
          {/* Columnas Header */}
          <div className="min-w-[650px]">
            <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))] border-b border-[#E5E5E3] pb-3 mb-2">
              <div className="text-xs font-semibold text-[#6B6B6B] uppercase font-display flex items-center">
                Hora
              </div>
              {dayGroupBy === 'bay'
                ? activeBays.map((bay) => (
                    <div key={bay.id} className="px-3 border-l border-[#E5E5E3]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: bay.color || '#2563EB' }}
                        />
                        <span className="text-sm font-bold font-display text-[#161616]">
                          {bay.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B6B6B]">
                        {(bay.supported_services || ['Detallado general']).join(', ')}
                      </span>
                    </div>
                  ))
                : detailers.map((det) => (
                    <div key={det.id} className="px-3 border-l border-[#E5E5E3]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#161616] text-white text-[10px] flex items-center justify-center font-bold">
                          {det.full_name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold font-display text-[#161616]">
                          {det.full_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B6B6B]">Detailer Profesional</span>
                    </div>
                  ))}
            </div>

            {/* Timeline Grilla */}
            <div className="relative">
              {/* Línea roja con la hora actual de Uruguay */}
              {currentMinutesFromStart !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${(currentMinutesFromStart / 60) * 80}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D7141A] -ml-1.5" />
                  <div className="w-full border-t-2 border-[#D7141A] border-dashed" />
                  <span className="text-[10px] font-bold text-white bg-[#D7141A] px-1.5 py-0.5 rounded ml-1">
                    Ahora
                  </span>
                </div>
              )}

              {/* Filas de horas */}
              {hoursRange.map((hourStr, idx) => {
                const hourInt = parseInt(hourStr.split(':')[0], 10);
                return (
                  <div
                    key={hourStr}
                    className="grid grid-cols-[80px_repeat(auto-fit,minmax(200px,1fr))] min-h-[80px] border-b border-[#F5F5F4]"
                  >
                    {/* Celda Hora */}
                    <div className="text-xs font-medium text-[#6B6B6B] pt-2 pr-3 font-display">
                      {hourStr}
                    </div>

                    {/* Celdas por puesto o detailer */}
                    {(dayGroupBy === 'bay' ? activeBays : detailers).map((col) => {
                      // Buscar turnos que inicien en esta fecha y columna
                      const turnsInCell = detailingAppointments.filter((app) => {
                        const appDateStr = getLocalDateString(app.start_time);
                        if (appDateStr !== selectedDateStr) return false;

                        if (dayGroupBy === 'bay' && app.work_bay_id !== col.id) return false;
                        if (dayGroupBy === 'detailer' && app.assigned_to !== col.id) return false;

                        const appStartHour = new Date(app.start_time).getHours();
                        return appStartHour === hourInt;
                      });

                      return (
                        <div
                          key={col.id}
                          className="border-l border-[#F5F5F4] p-1.5 relative hover:bg-[#FAFAFA] transition-all group min-h-[80px]"
                        >
                          {turnsInCell.map((app) => {
                            const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                            const currentStage = app.stage || quote?.status || app.status;
                            const stageColor = getStageColor(currentStage);

                            if (app.is_blocked) {
                              return (
                                <div
                                  key={app.id}
                                  className="p-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 text-amber-900 text-xs space-y-1 mb-1 shadow-xs"
                                >
                                  <div className="flex items-center gap-1 font-bold text-[11px]">
                                    <Ban className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Horario Bloqueado</span>
                                  </div>
                                  <p className="text-[11px] font-medium text-amber-800">
                                    {app.block_reason || 'No disponible'}
                                  </p>
                                  <div className="text-[10px] text-amber-700">
                                    {formatLocalTime(app.start_time)} ({app.duration_minutes} min)
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={app.id}
                                className="bg-white border border-[#E5E5E3] rounded-xl p-2.5 shadow-xs hover:shadow-md transition-all space-y-2 mb-1.5 border-l-4"
                                style={{ borderLeftColor: stageColor }}
                              >
                                {/* Header del turno: Hora y Badge Estado */}
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#161616]">
                                    <Clock className="w-3 h-3 text-[#6B6B6B]" />
                                    <span>{formatLocalTime(app.start_time)}</span>
                                    <span className="text-[10px] text-[#6B6B6B] font-normal">
                                      ({app.duration_minutes}m)
                                    </span>
                                  </div>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-white"
                                    style={{ backgroundColor: stageColor }}
                                  >
                                    {currentStage}
                                  </span>
                                </div>

                                {/* Auto y Chapa */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-[#161616] truncate font-display">
                                      {quote?.vehicle_info || (app.vehicle ? `${app.vehicle.brand} ${app.vehicle.model}` : app.title)}
                                    </p>
                                    <p className="text-[11px] text-[#6B6B6B] truncate">
                                      {quote?.client_name || app.client?.full_name}
                                    </p>
                                  </div>
                                  {(quote?.vehicle_plate || app.vehicle?.plate) && (
                                    <UruguayanPlate
                                      plate={quote?.vehicle_plate || app.vehicle?.plate || ''}
                                      size="sm"
                                    />
                                  )}
                                </div>

                                {/* Servicios & Monto */}
                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F5F5F4]">
                                  <span className="font-semibold text-[#161616]">
                                    {formatCurrency(quote?.total_amount || app.price_amount || 0)}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {quote?.client_phone && (
                                      <button
                                        type="button"
                                        onClick={() => handleTriggerWhatsApp(quote, app, 'confirm_appointment')}
                                        className="p-1 rounded bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all"
                                        title="WhatsApp rápido"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {quote && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdvanceStage(quote, app)}
                                        className="px-2 py-0.5 rounded bg-[#161616] text-white hover:bg-[#D7141A] transition-all font-bold text-[10px] flex items-center gap-1"
                                        title="Avanzar etapa"
                                      >
                                        <span>Avanzar</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Botón "No vino" si está en agendado/confirmado */}
                                {quote && ['Agendado', 'Turno Confirmado', 'Confirmado'].includes(currentStage) && (
                                  <div className="pt-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleMarkNoShow(quote, app)}
                                      className="text-[10px] text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                      No se presentó
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

      {/* ── 2. VISTA SEMANA (Grilla de 7 días por horas) ── */}
      {viewMode === 'semana' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Header de 7 días */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E5E5E3] pb-3 mb-2">
              <div className="text-xs font-semibold text-[#6B6B6B] uppercase font-display">Hora</div>
              {Array.from({ length: 7 }).map((_, dIdx) => {
                const baseDate = new Date(selectedDateStr + 'T12:00:00-03:00');
                const dayOffset = dIdx - ((baseDate.getDay() + 6) % 7); // Inicio en Lunes
                const colDate = new Date(baseDate.getTime() + dayOffset * 86400000);
                const colDateStr = getLocalDateString(colDate);
                const isToday = colDateStr === todayStr;

                return (
                  <div
                    key={dIdx}
                    onClick={() => {
                      setSelectedDateStr(colDateStr);
                      setViewMode('dia');
                    }}
                    className={`px-2 text-center cursor-pointer rounded-lg py-1 transition-all ${
                      isToday ? 'bg-red-50 text-[#D7141A]' : 'hover:bg-[#F5F5F4]'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase font-display">
                      {formatLocalDate(colDateStr + 'T12:00:00-03:00', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-extrabold">{colDate.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Horas */}
            {hoursRange.map((hourStr) => {
              const hourInt = parseInt(hourStr.split(':')[0], 10);
              return (
                <div
                  key={hourStr}
                  className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[60px] border-b border-[#F5F5F4]"
                >
                  <div className="text-xs font-medium text-[#6B6B6B] pt-1">{hourStr}</div>
                  {Array.from({ length: 7 }).map((_, dIdx) => {
                    const baseDate = new Date(selectedDateStr + 'T12:00:00-03:00');
                    const dayOffset = dIdx - ((baseDate.getDay() + 6) % 7);
                    const colDate = new Date(baseDate.getTime() + dayOffset * 86400000);
                    const colDateStr = getLocalDateString(colDate);

                    const turns = detailingAppointments.filter((app) => {
                      const appDate = getLocalDateString(app.start_time);
                      return appDate === colDateStr && new Date(app.start_time).getHours() === hourInt;
                    });

                    return (
                      <div
                        key={dIdx}
                        className="border-l border-[#F5F5F4] p-1 min-h-[60px] hover:bg-[#FAFAFA]"
                      >
                        {turns.map((app) => {
                          const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                          const currentStage = app.stage || quote?.status || app.status;
                          const stageColor = getStageColor(currentStage);

                          return (
                            <div
                              key={app.id}
                              onClick={() => {
                                setSelectedDateStr(colDateStr);
                                setViewMode('dia');
                              }}
                              className="p-1.5 rounded-lg border border-[#E5E5E3] bg-white text-[10px] mb-1 cursor-pointer hover:shadow-xs border-l-2"
                              style={{ borderLeftColor: stageColor }}
                            >
                              <p className="font-bold text-[#161616] truncate">
                                {quote?.vehicle_info || app.title}
                              </p>
                              <span className="text-[#6B6B6B] block">
                                {formatLocalTime(app.start_time)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. VISTA MES (% ocupación y puntos por día) ── */}
      {viewMode === 'mes' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-[#6B6B6B] py-1 font-display">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, idx) => {
              const currentMonthBase = new Date(selectedDateStr + 'T12:00:00-03:00');
              const firstDayOfMonth = new Date(
                currentMonthBase.getFullYear(),
                currentMonthBase.getMonth(),
                1
              );
              const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;
              const cellDate = new Date(
                currentMonthBase.getFullYear(),
                currentMonthBase.getMonth(),
                1 - startDayOffset + idx
              );
              const cellDateStr = getLocalDateString(cellDate);
              const isToday = cellDateStr === todayStr;
              const isSelected = cellDateStr === selectedDateStr;

              // Turnos de este día
              const dayTurns = detailingAppointments.filter((a) => {
                return getLocalDateString(a.start_time) === cellDateStr && !a.is_blocked;
              });

              // Estimación simple de ocupación (% de horas usadas respecto a capacidad de boxes)
              const totalBays = activeBays.length || 1;
              const maxDayMinutes = totalBays * 9 * 60; // 9 horas de taller
              const bookedMinutes = dayTurns.reduce((acc, t) => acc + (t.duration_minutes || 120), 0);
              const occupancyPercent = Math.min(100, Math.round((bookedMinutes / maxDayMinutes) * 100));

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDateStr(cellDateStr);
                    setViewMode('dia');
                  }}
                  className={`min-h-[90px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
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
                        {dayTurns.length} {dayTurns.length === 1 ? 'turno' : 'turnos'}
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

                  {/* Barra de ocupación */}
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
        </div>
      )}

      {/* ── 4. VISTA LISTA (Próximos turnos ordenados) ── */}
      {viewMode === 'lista' && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold font-display text-[#161616] uppercase tracking-wider">
              Próximos Turnos Programados
            </h3>
            <span className="text-xs text-[#6B6B6B]">
              Total encontrados: {detailingAppointments.length}
            </span>
          </div>

          {detailingAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6B6B]">
              No hay turnos registrados que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-2">
              {detailingAppointments
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map((app) => {
                  const quote = detailingQuotes.find((q) => q.id === app.quote_id);
                  const currentStage = app.stage || quote?.status || app.status;
                  const stageColor = getStageColor(currentStage);

                  return (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-[#E5E5E3] bg-white hover:border-gray-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4"
                      style={{ borderLeftColor: stageColor }}
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
                              {formatLocalTime(app.start_time)} ({app.duration_minutes} min)
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

                        <div className="flex items-center gap-1.5">
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
                              onClick={() => handleAdvanceStage(quote, app)}
                              className="text-xs gap-1"
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
          )}
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
          // Opcional: abrir cotizador con el horario preseleccionado
          onOpenQuoterModal();
        }}
      />

      {/* 2. Modal Bloquear Horario */}
      <DetailingBlockTimeModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        config={config}
        defaultDate={selectedDateStr}
        defaultBayId={filterBayId !== 'all' ? filterBayId : undefined}
        onSaveBlock={(data) => {
          onAddAppointment({
            business: 'detailing',
            client_id: 'block',
            work_bay_id: data.work_bay_id,
            start_time: data.start_time,
            duration_minutes: data.duration_minutes,
            status: 'confirmed',
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
            onUpdateAppointment(activeAppointmentForModal.id, { stage: 'Recibido' });
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
          onUpdateQuoteStatus(quoteId, 'Entregado y cobrado');
          if (activeAppointmentForModal) {
            onUpdateAppointment(activeAppointmentForModal.id, {
              stage: 'Entregado y cobrado',
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

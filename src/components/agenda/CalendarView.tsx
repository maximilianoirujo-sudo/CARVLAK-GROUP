import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MessageCircle,
  User,
  Car,
  Droplets,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CalendarDays
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS_CONFIG, formatCurrency, normalizePlate } from '../../lib/formatters';
import { isEncargado } from '../../lib/permissions';
import { Business, Appointment, Client, Vehicle } from '../../types';
import { AppointmentModal } from './AppointmentModal';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { UruguayanPlate } from '../ui/UruguayanPlate';
import { Button } from '../ui/Button';

export const CalendarView: React.FC = () => {
  const { appointments, clients, vehicles } = useData();
  const { profile } = useAuth();
  const canSeeAllByDefault = isEncargado(profile);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [businessFilter, setBusinessFilter] = useState<'all' | Business>('all');
  const [onlyMine, setOnlyMine] = useState(!canSeeAllByDefault);

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [reminderAppointment, setReminderAppointment] = useState<{
    appt: Appointment;
    client?: Client;
    vehicle?: Vehicle;
  } | null>(null);

  // Navegación de fecha
  const changeDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Calcular días de la semana actual
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const iso = current.toISOString().slice(0, 10);
      const dayNum = current.getDate();
      const count = appointments.filter((a) => a.start_time.startsWith(iso)).length;
      days.push({
        iso,
        name: dayNames[i],
        dayNum,
        count,
        isToday: iso === new Date().toISOString().slice(0, 10)
      });
    }
    return days;
  }, [selectedDate, appointments]);

  // Contadores por negocio
  const businessCounts = useMemo(() => {
    const counts = { all: 0, automotora: 0, detailing: 0, inspeccion: 0 };
    appointments.forEach((a) => {
      counts.all++;
      if (counts[a.business] !== undefined) {
        counts[a.business]++;
      }
    });
    return counts;
  }, [appointments]);

  // Filtrado de turnos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Filtro de negocio
      if (businessFilter !== 'all' && a.business !== businessFilter) return false;

      // Filtro "Mis turnos"
      if (onlyMine && a.assigned_to !== profile?.id) return false;

      // Vista día vs semana
      if (viewMode === 'day') {
        return a.start_time.startsWith(selectedDate);
      } else {
        const curTime = new Date(selectedDate + 'T12:00:00').getTime();
        const apptTime = new Date(a.start_time.slice(0, 10) + 'T12:00:00').getTime();
        const diffDays = Math.abs((apptTime - curTime) / (1000 * 60 * 60 * 24));
        return diffDays <= 3.5;
      }
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, businessFilter, onlyMine, profile, selectedDate, viewMode]);

  // Formato legible de fecha
  const formattedSelectedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [selectedDate]);

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      
      {/* 1. TOP BAR / ENCABEZADO DE CONTEXTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-title font-bold text-[#161616]">
            Agenda unificada
          </h1>
          <p className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-0.5 capitalize">
            <CalendarIcon className="w-3.5 h-3.5 text-[#9A9A9A]" />
            {formattedSelectedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switcher Día / Semana */}
          <div className="bg-[#F5F5F4] p-0.5 rounded-lg border border-[#E5E5E3] flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-[#161616] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-[#161616] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Navegación anterior / hoy / siguiente */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeDate(viewMode === 'week' ? -7 : -1)}
              className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors shadow-xs"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={setToday}
              className="px-2.5 h-8 rounded-lg bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] text-xs font-semibold text-[#161616] transition-colors shadow-xs"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => changeDate(viewMode === 'week' ? 7 : 1)}
              className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors shadow-xs"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* UNICO BOTÓN PRINCIPAL EN ROJO #D7141A */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingAppointment(null);
              setIsNewModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Agendar turno</span>
          </Button>
        </div>
      </div>

      {/* 2. TIRA HORIZONTAL DE DÍAS (SEMANA) */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {weekDays.map((day) => {
            const isSelected = selectedDate === day.iso;
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => setSelectedDate(day.iso)}
                className={`w-14 sm:w-16 py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#161616] text-white shadow-md scale-105'
                    : 'bg-white border border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? day.isToday ? 'text-[#D7141A]' : 'text-white/80'
                      : day.isToday ? 'text-[#D7141A]' : 'text-[#9A9A9A]'
                  }`}
                >
                  {day.isToday ? 'Hoy' : day.name}
                </span>
                <span className="font-title font-bold text-base sm:text-lg leading-tight mt-0.5">
                  {day.dayNum}
                </span>
                <div className="flex items-center gap-0.5 mt-1">
                  {day.count > 0 ? (
                    <span
                      className={`text-[9px] font-semibold px-1 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {day.count} {day.count === 1 ? 't.' : 't.'}
                    </span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-[#E5E5E3]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FILTROS POR NEGOCIO & USUARIO */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Chips de Negocios */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setBusinessFilter('all')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              businessFilter === 'all'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <span>Todos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${businessFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#F5F5F4] text-[#6B6B6B]'}`}>
              {businessCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBusinessFilter('automotora')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              businessFilter === 'automotora'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Automotora</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${businessFilter === 'automotora' ? 'bg-white/20 text-white' : 'bg-[#F5F5F4] text-[#6B6B6B]'}`}>
              {businessCounts.automotora}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBusinessFilter('detailing')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              businessFilter === 'detailing'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Detailing</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${businessFilter === 'detailing' ? 'bg-white/20 text-white' : 'bg-[#F5F5F4] text-[#6B6B6B]'}`}>
              {businessCounts.detailing}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBusinessFilter('inspeccion')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              businessFilter === 'inspeccion'
                ? 'bg-[#161616] text-white shadow-sm'
                : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Inspección</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${businessFilter === 'inspeccion' ? 'bg-white/20 text-white' : 'bg-[#F5F5F4] text-[#6B6B6B]'}`}>
              {businessCounts.inspeccion}
            </span>
          </button>
        </div>

        {/* Filtro Mis Turnos */}
        <button
          type="button"
          onClick={() => setOnlyMine(!onlyMine)}
          className={`h-8 px-3 rounded-full text-xs font-bold border transition-all ${
            onlyMine
              ? 'bg-[#161616] text-white border-[#161616]'
              : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          {onlyMine ? 'Solo mis turnos' : 'Todos los operadores'}
        </button>
      </div>

      {/* 4. BANNER DE ESTADO DEL DÍA */}
      <div className="w-full bg-white rounded-xl p-3.5 border border-[#E5E5E3] shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-[#D7141A]" />
          </div>
          <div className="min-w-0">
            <p className="font-title font-bold text-sm text-[#161616] leading-snug truncate capitalize">
              {formattedSelectedDate}
            </p>
            <p className="text-xs text-[#6B6B6B] truncate">
              <strong className="text-[#161616]">{filteredAppointments.length} turnos</strong> en vista • Coordinación centralizada
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9] px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#1E6B43]"></span>
          <span>Operativo</span>
        </div>
      </div>

      {/* 5. LISTA DE TURNOS */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B] space-y-2 shadow-sm">
          <CalendarIcon className="w-10 h-10 mx-auto text-[#9A9A9A]" />
          <p className="text-base font-title font-bold text-[#161616]">No hay turnos registrados en este período</p>
          <p className="text-xs text-[#6B6B6B]">Podés agendar uno nuevo haciendo clic en "+ Agendar turno".</p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingAppointment(null);
                setIsNewModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Agendar turno</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAppointments.map((appt) => {
            const bConfig = BUSINESS_CONFIG[appt.business];
            const client = clients.find((c) => c.id === appt.client_id);
            const vehicle = vehicles.find((v) => v.id === appt.vehicle_id);
            const timeStr = appt.start_time.slice(11, 16);
            const dateStr = appt.start_time.slice(0, 10);

            const isCompleted = appt.status === 'Finalizado';
            const isInProgress = appt.status === 'En curso';

            return (
              <div
                key={appt.id}
                className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col justify-between space-y-3.5 shadow-sm group"
              >
                <div className="space-y-2.5">
                  {/* Fila superior: Hora, Negocio y Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-title font-bold text-base text-[#161616]">
                        {timeStr} <span className="text-xs font-normal text-[#6B6B6B]">hs</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3] text-[10px] font-bold flex items-center gap-1">
                        {appt.business === 'automotora' && <Car className="w-3 h-3 text-[#D7141A]" />}
                        {appt.business === 'detailing' && <Droplets className="w-3 h-3 text-[#161616]" />}
                        {appt.business === 'inspeccion' && <ClipboardCheck className="w-3 h-3 text-[#161616]" />}
                        <span>{bConfig?.name || appt.business}</span>
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isCompleted
                          ? 'bg-[#EEF7F2] text-[#1E6B43]'
                          : isInProgress
                          ? 'bg-[#FEF7EC] text-[#945B0E]'
                          : 'bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {/* Título del servicio */}
                  <div>
                    <h3 className="text-base font-title font-bold text-[#161616] group-hover:text-[#000000] leading-snug">
                      {appt.title || 'Servicio agendado'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B6B6B]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dateStr} • {appt.duration_minutes} min</span>
                    </div>
                  </div>

                  {/* Fila de Vehículo con UruguayanPlate */}
                  {vehicle && (
                    <div className="flex items-center justify-between gap-2 bg-[#F5F5F4] p-2.5 rounded-lg border border-[#E5E5E3]">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#161616] leading-tight truncate">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-[11px] text-[#6B6B6B] truncate">
                          {vehicle.year ? `Año ${vehicle.year} • ` : ''}{vehicle.category}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <UruguayanPlate plate={vehicle.plate} size="sm" />
                      </div>
                    </div>
                  )}

                  {/* Datos del Cliente */}
                  <div className="text-xs text-[#6B6B6B] space-y-0.5 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#9A9A9A]" />
                        <strong className="text-[#161616]">{client?.full_name || 'Particular'}</strong>
                      </span>
                      <span className="text-[11px] text-[#6B6B6B] font-mono">{client?.phone}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <p className="text-[11px] text-[#6B6B6B] italic line-clamp-2 bg-[#F5F5F4]/60 p-2 rounded-lg border border-[#E5E5E3]/60">
                      "{appt.notes}"
                    </p>
                  )}
                </div>

                {/* Pie de tarjeta con Monto y Acciones */}
                <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                  <span className="text-base font-title font-bold text-[#161616]">
                    {formatCurrency(appt.price_amount, appt.price_currency)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="whatsapp"
                      size="sm"
                      onClick={() => setReminderAppointment({ appt, client, vehicle })}
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Recordar</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAppointment(appt);
                        setIsNewModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewModalOpen && (
        <AppointmentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          appointmentToEdit={editingAppointment}
          defaultDate={selectedDate}
        />
      )}

      {reminderAppointment && (
        <WhatsAppReminderModal
          isOpen={Boolean(reminderAppointment)}
          onClose={() => setReminderAppointment(null)}
          appointment={reminderAppointment.appt}
          client={reminderAppointment.client}
          vehicle={reminderAppointment.vehicle}
        />
      )}

    </div>
  );
};

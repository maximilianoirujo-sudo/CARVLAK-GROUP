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
  ClipboardCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS_CONFIG, formatCurrency, normalizePlate } from '../../lib/formatters';
import { isEncargado } from '../../lib/permissions';
import { Business, Appointment, Client, Vehicle } from '../../types';
import { AppointmentModal } from './AppointmentModal';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';

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
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

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
        const curTime = new Date(selectedDate).getTime();
        const apptTime = new Date(a.start_time.slice(0, 10)).getTime();
        const diffDays = Math.abs((apptTime - curTime) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      }
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, businessFilter, onlyMine, profile, selectedDate, viewMode]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Controles de Navegación de la Agenda */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#2A2A2A] space-y-4 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 border border-[#2A2A2A]">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-title font-bold text-white">Agenda unificada</h2>
              <p className="text-xs text-[#8A8A8A]">Turnos centralizados de los 3 negocios</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Día / Semana */}
            <div className="bg-black p-1 rounded-xl border border-[#2A2A2A] flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'day' ? 'bg-[#D7141A] text-white font-bold' : 'text-[#8A8A8A] hover:text-white'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'week' ? 'bg-[#D7141A] text-white font-bold' : 'text-[#8A8A8A] hover:text-white'
                }`}
              >
                Semana
              </button>
            </div>

            {/* UNICO BOTÓN PRINCIPAL EN ROJO #D7141A */}
            <button
              onClick={() => {
                setEditingAppointment(null);
                setIsNewModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-title font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-colors min-h-[42px] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar</span>
            </button>
          </div>
        </div>

        {/* Filtros y Selector de Fecha */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="w-8 h-8 rounded-lg bg-black border border-[#2A2A2A] hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black border border-[#2A2A2A] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D7141A]"
            />
            <button
              onClick={() => changeDate(1)}
              className="w-8 h-8 rounded-lg bg-black border border-[#2A2A2A] hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-white/10 text-xs font-semibold text-white border border-white transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                onlyMine
                  ? 'bg-transparent text-white border-white'
                  : 'bg-black text-[#8A8A8A] border-[#2A2A2A] hover:text-white'
              }`}
            >
              {onlyMine ? 'Solo mis turnos' : 'Todos los turnos'}
            </button>

            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value as any)}
              className="bg-black border border-[#2A2A2A] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="all">Todos los negocios</option>
              <option value="automotora">Automotora (Auto)</option>
              <option value="detailing">Detailing (Gota)</option>
              <option value="inspeccion">Inspección (Checklist)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Lista de Turnos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-[#8A8A8A]">
          <span>{filteredAppointments.length} turnos para {viewMode === 'day' ? selectedDate : 'la semana'}</span>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-white" /> Automotora</span>
            <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-white" /> Detailing</span>
            <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5 text-white" /> Inspección</span>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#141414] border border-[#2A2A2A] text-center text-[#8A8A8A]">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-25 text-white" />
            <p className="text-base font-semibold text-white">No hay turnos registrados en este período</p>
            <p className="text-xs text-[#8A8A8A] mt-1">Podés agendar uno nuevo haciendo clic en "+ Agendar".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAppointments.map((appt) => {
              const bConfig = BUSINESS_CONFIG[appt.business];
              const client = clients.find((c) => c.id === appt.client_id);
              const vehicle = vehicles.find((v) => v.id === appt.vehicle_id);
              const timeStr = appt.start_time.slice(11, 16);
              const dateStr = appt.start_time.slice(0, 10);

              const businessBorder = appt.business === 'automotora'
                ? 'border-l-4 border-l-[#D7141A]'
                : 'border-l-4 border-l-white';

              return (
                <div
                  key={appt.id}
                  className={`p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] ${businessBorder} hover:border-white/40 transition-colors flex flex-col justify-between space-y-4 shadow-sm`}
                >
                  <div>
                    {/* Encabezado con Icono y Nombre del Negocio */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black text-white border border-[#2A2A2A] flex items-center gap-1.5">
                        {appt.business === 'automotora' && <Car className="w-3.5 h-3.5 text-[#D7141A]" />}
                        {appt.business === 'detailing' && <Droplets className="w-3.5 h-3.5 text-white" />}
                        {appt.business === 'inspeccion' && <ClipboardCheck className="w-3.5 h-3.5 text-white" />}
                        <span>{bConfig?.name || appt.business}</span>
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black text-[#8A8A8A] border border-[#2A2A2A]">
                        {appt.status}
                      </span>
                    </div>

                    <h3 className="text-base font-title font-bold text-white mt-2">
                      {appt.title || 'Servicio agendado'}
                    </h3>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-[#8A8A8A]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dateStr} • {timeStr} hs ({appt.duration_minutes} min)</span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-black border border-[#2A2A2A] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A8A8A] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#8A8A8A]" />
                          <strong className="text-white font-medium">{client?.full_name || 'Particular'}</strong>
                        </span>
                        <span className="text-[11px] text-[#8A8A8A]">{client?.phone}</span>
                      </div>

                      {vehicle && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#2A2A2A]">
                          <span className="text-[#8A8A8A] flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#8A8A8A]" />
                            <span>{vehicle.brand} {vehicle.model}</span>
                          </span>
                          <span className="font-mono text-white bg-[#141414] px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#2A2A2A]">
                            {normalizePlate(vehicle.plate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {appt.notes && (
                      <p className="text-[11px] text-[#8A8A8A] italic line-clamp-2 mt-2">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  {/* Pie de tarjeta con Monto en Archivo */}
                  <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                    <span className="text-base font-title font-bold text-white">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReminderAppointment({ appt, client, vehicle })}
                        className="px-2.5 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-semibold text-xs flex items-center gap-1 transition-colors min-h-[38px] cursor-pointer"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                        <span className="hidden sm:inline">Recordar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAppointment(appt);
                          setIsNewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-semibold text-xs transition-colors min-h-[38px] cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

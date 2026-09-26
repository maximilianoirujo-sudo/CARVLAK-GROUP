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
  Filter
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
        // Semana: tomamos +/- 3 días de la fecha seleccionada
        const curTime = new Date(selectedDate).getTime();
        const apptTime = new Date(a.start_time.slice(0, 10)).getTime();
        const diffDays = Math.abs((apptTime - curTime) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      }
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, businessFilter, onlyMine, profile, selectedDate, viewMode]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/*  */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#121721] border border-slate-800 space-y-4">
        
        {/*  */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Agenda Unificada</h2>
              <p className="text-xs text-slate-400">Turnos centralizados de los 3 negocios</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/*  */}
            <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center text-xs font-bold">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'day' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  viewMode === 'week' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana
              </button>
            </div>

            {/*  */}
            <button
              onClick={() => {
                setEditingAppointment(null);
                setIsNewModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar</span>
            </button>
          </div>
        </div>

        {/*  */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => changeDate(1)}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 transition-colors"
            >
              Hoy
            </button>
          </div>

          {/*  */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                onlyMine
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {onlyMine ? '👤 Solo mis turnos' : '👥 Todos los turnos'}
            </button>

            {/*  */}
            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">🏢 Todos los negocios</option>
              <option value="detailing">✨ DetailVlak</option>
              <option value="inspeccion">🔍 Inspección</option>
              <option value="automotora">🚗 Automotora</option>
            </select>
          </div>
        </div>

      </div>

      {/*  */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>{filteredAppointments.length} turnos encontrados para {viewMode === 'day' ? selectedDate : 'la semana'}</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-purple-400 font-bold">● DetailVlak</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">● Inspección</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">● Automotora</span>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#121721] border border-slate-800 text-center text-slate-400">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-25 text-amber-400" />
            <p className="text-base font-bold text-slate-300">No hay turnos registrados en este período</p>
            <p className="text-xs text-slate-500 mt-1">Podés agendar uno nuevo haciendo clic en "+ Agendar".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAppointments.map((appt) => {
              const bConfig = BUSINESS_CONFIG[appt.business];
              const client = clients.find((c) => c.id === appt.client_id);
              const vehicle = vehicles.find((v) => v.id === appt.vehicle_id);
              const timeStr = appt.start_time.slice(11, 16);
              const dateStr = appt.start_time.slice(0, 10);

              return (
                <div
                  key={appt.id}
                  className={`p-4 rounded-3xl bg-[#121721] border ${bConfig.borderClass} hover:border-amber-400/60 transition-all flex flex-col justify-between space-y-4 shadow-lg`}
                >
                  <div>
                    {/*  */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${bConfig.bgLight} ${bConfig.textClass} border ${bConfig.borderClass}`}>
                        {bConfig.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        appt.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    {/*  */}
                    <h3 className="text-base font-black text-white mt-2">
                      {appt.title || 'Servicio Agendado'}
                    </h3>

                    {/*  */}
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{dateStr} • {timeStr} hs ({appt.duration_minutes} min)</span>
                    </div>

                    {/*  */}
                    <div className="mt-3 p-3 rounded-2xl bg-[#0F141E] border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <strong className="text-slate-200">{client?.full_name || 'Particular'}</strong>
                        </span>
                        <span className="text-[11px] text-slate-500">{client?.phone}</span>
                      </div>

                      {vehicle && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-slate-500" />
                            <span>{vehicle.brand} {vehicle.model}</span>
                          </span>
                          <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">
                            {normalizePlate(vehicle.plate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {appt.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-2">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>

                  {/*  */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-amber-400">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/*  */}
                      <button
                        onClick={() => setReminderAppointment({ appt, client, vehicle })}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1 transition-all"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Recordar</span>
                      </button>

                      {/*  */}
                      <button
                        onClick={() => {
                          setEditingAppointment(appt);
                          setIsNewModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
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

      {/*  */}
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

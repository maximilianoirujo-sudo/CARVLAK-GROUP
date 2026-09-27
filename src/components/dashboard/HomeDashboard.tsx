import React, { useMemo } from 'react';
import {
  Calendar,
  CheckSquare,
  Car,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Droplets,
  ClipboardCheck,
  Building2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BUSINESS_CONFIG, formatCurrency, normalizePlate } from '../../lib/formatters';
import { isEncargado } from '../../lib/permissions';
import { Appointment, Task } from '../../types';

interface HomeDashboardProps {
  onNavigate: (tab: string) => void;
  onNewAppointment: () => void;
  onNewVehicle: () => void;
  onNewClient: () => void;
  onNewTask: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  onNewAppointment,
  onNewVehicle,
  onNewClient,
  onNewTask,
  onSelectAppointment
}) => {
  const { profile } = useAuth();
  const {
    appointments,
    tasks,
    vehicles,
    clients,
    updateTaskStatus,
    detailingQuotes,
    inspections,
    dealershipVehicles,
    dealershipInquiries,
    dealershipConfig
  } = useData();

  const isBoss = isEncargado(profile);

  // Solicitudes de presupuesto pendientes de DetailVlak
  const pendingQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => q.status === 'Por Cotizar');
  }, [detailingQuotes]);

  // Inspecciones pendientes o en curso
  const pendingInspections = useMemo(() => {
    return inspections.filter((i) => i.status === 'Solicitada' || i.status === 'En curso');
  }, [inspections]);

  // Automotora: Autos inmovilizados (>60 días)
  const overdueVehicles = useMemo(() => {
    const threshold = dealershipConfig?.days_in_stock_alert_threshold || dealershipConfig?.days_alert_threshold || 60;
    return dealershipVehicles.filter((v) => {
      if (v.status === 'vendido') return false;
      const start = new Date(v.purchase_date || v.created_at).getTime();
      const days = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
      return days >= threshold;
    });
  }, [dealershipVehicles, dealershipConfig]);

  // Automotora: Consultas nuevas en CRM
  const newInquiries = useMemo(() => {
    return dealershipInquiries.filter((inq) => inq.status === 'Nuevo');
  }, [dealershipInquiries]);

  // Filtrar turnos de hoy
  const todayIso = new Date().toISOString().slice(0, 10);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.start_time.startsWith(todayIso))
      .filter((a) => (isBoss ? true : a.assigned_to === profile?.id))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [appointments, todayIso, isBoss, profile]);

  // Filtrar tareas pendientes
  const pendingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'Hecha')
      .filter((t) => (isBoss ? true : t.assigned_to === profile?.id))
      .slice(0, 5);
  }, [tasks, isBoss, profile]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Encabezado Principal / Saludo */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#2A2A2A] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#8A8A8A]">
                Hub de operaciones
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black text-[#8A8A8A] border border-[#2A2A2A]">
                {profile?.roles.join(' • ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-title font-bold text-white mt-1">
              Hola, {profile?.full_name || 'Equipo'}
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1 max-w-xl">
              {isBoss
                ? 'Panel central de control unificado: Automotora, DetailVlak e Inspecciones.'
                : 'Tus turnos y tareas asignadas para la jornada.'}
            </p>
          </div>

          {/* Botones de acción: UN SOLO BOTÓN PRINCIPAL EN ROJO #D7141A, SECUNDARIOS CON BORDE BLANCO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewAppointment}
              className="px-4 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-title font-bold text-xs uppercase tracking-wider transition-colors min-h-[44px] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo turno</span>
            </button>
            <button
              onClick={onNewVehicle}
              className="px-3.5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold text-xs border border-white flex items-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-white" />
              <span>Auto</span>
            </button>
            <button
              onClick={onNewClient}
              className="px-3.5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold text-xs border border-white flex items-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTAS IMPORTANTES */}
      {overdueVehicles.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-xl bg-[#141414] border-l-4 border-[#D7141A] border-t border-r border-b border-[#2A2A2A] cursor-pointer hover:border-white/40 transition-colors flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D7141A]/10 text-[#D7141A] flex items-center justify-center shrink-0 border border-[#D7141A]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#D7141A]">
                  Alerta de stock inmovilizado
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-[#D7141A]/15 text-[#D7141A] border border-[#D7141A]">
                  {overdueVehicles.length} {overdueVehicles.length === 1 ? 'auto' : 'autos'} &gt; 60 días
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                {overdueVehicles.length} vehículo{overdueVehicles.length > 1 ? 's superan' : ' supera'} los 60 días en stock sin vender
              </div>
              <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                Revisá precios de lista o promociones para acelerar la rotación de capital.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-white flex items-center gap-1 shrink-0">
            <span>Ver stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {pendingQuotes.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-detailing')}
          className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] cursor-pointer hover:border-white/40 transition-colors flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-[#2A2A2A]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#8A8A8A]">
                  DetailVlak Shangrilá
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-[#D7141A] text-white">
                  {pendingQuotes.length} pendientes
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                {pendingQuotes.length} solicitud{pendingQuotes.length > 1 ? 'es' : ''} de presupuesto web por responder
              </div>
              <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                Última: {pendingQuotes[0]?.client_name} • {pendingQuotes[0]?.vehicle_info}
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-white flex items-center gap-1 shrink-0">
            <span>Responder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('agenda')}
          className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#8A8A8A] mb-1">
            <span className="text-xs font-semibold">Turnos hoy</span>
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-white">
            {todayAppointments.length}
          </div>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">En agenda diaria</p>
        </div>

        <div
          onClick={() => onNavigate('tareas')}
          className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#8A8A8A] mb-1">
            <span className="text-xs font-semibold">Tareas pendientes</span>
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-white">
            {pendingTasks.length}
          </div>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">Por completar</p>
        </div>

        <div
          onClick={() => onNavigate('vehiculos')}
          className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#8A8A8A] mb-1">
            <span className="text-xs font-semibold">Vehículos</span>
            <Car className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-white">
            {vehicles.length}
          </div>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">Fichas registradas</p>
        </div>

        <div
          onClick={() => onNavigate('clientes')}
          className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#8A8A8A] mb-1">
            <span className="text-xs font-semibold">Clientes</span>
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-white">
            {clients.length}
          </div>
          <p className="text-[10px] text-[#8A8A8A] mt-0.5">Base compartida</p>
        </div>
      </div>

      {/* Turnos de Hoy */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white" />
            <h2 className="text-sm font-title font-bold text-white uppercase tracking-wider">
              Turnos de hoy ({todayAppointments.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-semibold text-white hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#141414] border border-[#2A2A2A] text-center text-[#8A8A8A]">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-white" />
            <p className="text-sm font-semibold text-white">No hay turnos agendados para hoy</p>
            <p className="text-xs text-[#8A8A8A] mt-1">Podés agendar uno con el botón superior.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayAppointments.map((appt) => {
              const bConfig = BUSINESS_CONFIG[appt.business];
              const client = clients.find((c) => c.id === appt.client_id);
              const vehicle = vehicles.find((v) => v.id === appt.vehicle_id);
              const timeStr = appt.start_time.slice(11, 16);

              return (
                <div
                  key={appt.id}
                  onClick={() => onSelectAppointment(appt)}
                  className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-white/40 cursor-pointer transition-colors flex flex-col justify-between space-y-3 shadow-sm group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black text-white border border-[#2A2A2A] flex items-center gap-1">
                        {appt.business === 'automotora' && <Car className="w-3 h-3 text-[#D7141A]" />}
                        {appt.business === 'detailing' && <Droplets className="w-3 h-3 text-white" />}
                        {appt.business === 'inspeccion' && <ClipboardCheck className="w-3 h-3 text-white" />}
                        <span>{bConfig?.shortName || appt.business}</span>
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-white bg-black px-2 py-0.5 rounded-lg border border-[#2A2A2A]">
                        <Clock className="w-3 h-3 text-[#8A8A8A]" />
                        <span>{timeStr} hs</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mt-2 group-hover:text-white transition-colors">
                      {appt.title || 'Atención de cliente'}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-[#8A8A8A]">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{client?.full_name || 'Cliente'}</span>
                        {vehicle && (
                          <span className="font-mono text-white bg-black px-1.5 py-0.5 rounded text-[11px] font-semibold border border-[#2A2A2A]">
                            {normalizePlate(vehicle.plate)}
                          </span>
                        )}
                      </div>
                      {vehicle && (
                        <p className="text-[11px] text-[#8A8A8A]">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
                    <span className="font-title font-bold text-white">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black text-[#8A8A8A] border border-[#2A2A2A]">
                      {appt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tareas Operativas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-white" />
            <h2 className="text-sm font-title font-bold text-white uppercase tracking-wider">
              Tareas operativas ({pendingTasks.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tareas')}
            className="text-xs font-semibold text-white hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between gap-3 hover:border-white/40 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => updateTaskStatus(t.id, t.status === 'En curso' ? 'Hecha' : 'En curso')}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    t.status === 'En curso'
                      ? 'bg-white text-black border-white'
                      : 'border-[#2A2A2A] bg-black text-transparent hover:border-white'
                  }`}
                >
                  ✓
                </button>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-[#8A8A8A] truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black text-[#8A8A8A] border border-[#2A2A2A]">
                  {t.status}
                </span>
                <button
                  type="button"
                  onClick={() => updateTaskStatus(t.id, 'Hecha')}
                  className="px-2.5 py-1 rounded-lg bg-transparent hover:bg-white/10 text-white border border-white font-semibold text-[10px] transition-colors cursor-pointer"
                >
                  Completar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

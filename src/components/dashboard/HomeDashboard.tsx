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
      <div className="p-5 sm:p-6 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
                Hub de operaciones
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F2F2F2] dark:bg-[#222222] text-[#6B6B6B] dark:text-[#AAAAAA] border border-[#D9D9D9] dark:border-[#333333]">
                {profile?.roles.join(' • ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-title font-bold text-black dark:text-white mt-1">
              Hola, {profile?.full_name || 'Equipo'}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-1 max-w-xl">
              {isBoss
                ? 'Panel central de control unificado: Automotora, DetailVlak e Inspecciones.'
                : 'Tus turnos y tareas asignadas para la jornada.'}
            </p>
          </div>

          {/* Botones de acción: UN SOLO BOTÓN PRINCIPAL EN ROJO #D7141A */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewAppointment}
              className="px-4 py-2.5 rounded-md bg-[#D7141A] hover:bg-[#B50F14] text-white font-title font-bold text-xs uppercase tracking-wider transition-colors min-h-[44px] flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo turno</span>
            </button>
            <button
              onClick={onNewVehicle}
              className="px-3.5 py-2.5 rounded-md bg-[#F2F2F2] dark:bg-[#222222] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-black dark:text-white font-semibold text-xs border border-[#D9D9D9] dark:border-[#333333] flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Car className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Auto</span>
            </button>
            <button
              onClick={onNewClient}
              className="px-3.5 py-2.5 rounded-md bg-[#F2F2F2] dark:bg-[#222222] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-black dark:text-white font-semibold text-xs border border-[#D9D9D9] dark:border-[#333333] flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTAS IMPORTANTES (Rojo moderado acompañado SIEMPRE de icono + texto explicativo) */}
      {overdueVehicles.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border-l-4 border-[#D7141A] border-t border-r border-b border-[#D9D9D9] dark:border-[#2A2A2A] cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] transition-colors flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#D7141A]/10 text-[#D7141A] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#D7141A]">
                  Alerta de stock inmovilizado
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/20">
                  {overdueVehicles.length} {overdueVehicles.length === 1 ? 'auto' : 'autos'} &gt; 60 días
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-black dark:text-white mt-0.5">
                {overdueVehicles.length} vehículo{overdueVehicles.length > 1 ? 's superan' : ' supera'} los 60 días en stock sin vender
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Revisá precios de lista o promociones para acelerar la rotación de capital.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-black dark:text-white flex items-center gap-1 shrink-0">
            <span>Ver stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {pendingQuotes.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-detailing')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] cursor-pointer hover:bg-[#F2F2F2] dark:hover:bg-[#1A1A1A] transition-colors flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#F2F2F2] dark:bg-[#222222] text-black dark:text-white flex items-center justify-center shrink-0 border border-[#D9D9D9] dark:border-[#333333]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-title font-bold uppercase tracking-wider text-[#6B6B6B]">
                  DetailVlak Shangrilá
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#D7141A] text-white">
                  {pendingQuotes.length} pendientes
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-black dark:text-white mt-0.5">
                {pendingQuotes.length} solicitud{pendingQuotes.length > 1 ? 'es' : ''} de presupuesto web por responder
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Última: {pendingQuotes[0]?.client_name} • {pendingQuotes[0]?.vehicle_info}
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-black dark:text-white flex items-center gap-1 shrink-0">
            <span>Responder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('agenda')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Turnos hoy</span>
            <Calendar className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-black dark:text-white">
            {todayAppointments.length}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">En agenda diaria</p>
        </div>

        <div
          onClick={() => onNavigate('tareas')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Tareas pendientes</span>
            <CheckSquare className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-black dark:text-white">
            {pendingTasks.length}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Por completar</p>
        </div>

        <div
          onClick={() => onNavigate('vehiculos')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Vehículos</span>
            <Car className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-black dark:text-white">
            {vehicles.length}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Fichas registradas</p>
        </div>

        <div
          onClick={() => onNavigate('clientes')}
          className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Clientes</span>
            <Users className="w-4 h-4 text-black dark:text-white" />
          </div>
          <div className="text-2xl sm:text-3xl font-title font-bold text-black dark:text-white">
            {clients.length}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Base compartida</p>
        </div>
      </div>

      {/* Turnos de Hoy */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-black dark:text-white" />
            <h2 className="text-sm font-title font-bold text-black dark:text-white uppercase tracking-wider">
              Turnos de hoy ({todayAppointments.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-semibold text-black dark:text-white hover:underline flex items-center gap-1"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] text-center text-[#6B6B6B]">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-black dark:text-white" />
            <p className="text-sm font-semibold text-black dark:text-white">No hay turnos agendados para hoy</p>
            <p className="text-xs text-[#6B6B6B] mt-1">Podés agendar uno con el botón superior.</p>
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
                  className="p-4 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] hover:border-black dark:hover:border-white cursor-pointer transition-colors flex flex-col justify-between space-y-3 shadow-sm group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2F2F2] dark:bg-[#222222] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333] flex items-center gap-1">
                        {appt.business === 'automotora' && <Car className="w-3 h-3" />}
                        {appt.business === 'detailing' && <Droplets className="w-3 h-3" />}
                        {appt.business === 'inspeccion' && <ClipboardCheck className="w-3 h-3" />}
                        <span>{bConfig?.shortName || appt.business}</span>
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-black dark:text-white bg-[#F2F2F2] dark:bg-[#222222] px-2 py-0.5 rounded border border-[#D9D9D9] dark:border-[#333333]">
                        <Clock className="w-3 h-3 text-[#6B6B6B]" />
                        <span>{timeStr} hs</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-black dark:text-white mt-2 group-hover:underline">
                      {appt.title || 'Atención de cliente'}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-[#6B6B6B]">
                      <div className="flex items-center justify-between">
                        <span className="text-black dark:text-white font-medium">{client?.full_name || 'Cliente'}</span>
                        {vehicle && (
                          <span className="font-mono text-black dark:text-white bg-[#F2F2F2] dark:bg-[#222222] px-1.5 py-0.5 rounded text-[11px] font-semibold border border-[#D9D9D9] dark:border-[#333333]">
                            {normalizePlate(vehicle.plate)}
                          </span>
                        )}
                      </div>
                      {vehicle && (
                        <p className="text-[11px] text-[#6B6B6B]">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center justify-between text-xs">
                    <span className="font-title font-bold text-black dark:text-white">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F2F2F2] dark:bg-[#222222] text-[#6B6B6B] border border-[#D9D9D9] dark:border-[#333333]">
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
            <CheckSquare className="w-4 h-4 text-black dark:text-white" />
            <h2 className="text-sm font-title font-bold text-black dark:text-white uppercase tracking-wider">
              Tareas operativas ({pendingTasks.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tareas')}
            className="text-xs font-semibold text-black dark:text-white hover:underline flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-lg bg-white dark:bg-[#161616] border border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center justify-between gap-3 hover:border-black dark:hover:border-white transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => updateTaskStatus(t.id, t.status === 'En curso' ? 'Hecha' : 'En curso')}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    t.status === 'En curso'
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'border-[#D9D9D9] dark:border-[#444444] bg-[#F2F2F2] dark:bg-[#222222] text-transparent hover:border-black'
                  }`}
                >
                  ✓
                </button>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white truncate">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-[#6B6B6B] truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F2F2F2] dark:bg-[#222222] text-[#6B6B6B] border border-[#D9D9D9] dark:border-[#333333]">
                  {t.status}
                </span>
                <button
                  onClick={() => updateTaskStatus(t.id, 'Hecha')}
                  className="px-2.5 py-1 rounded bg-black dark:bg-white text-white dark:text-black font-semibold text-[10px] transition-colors"
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

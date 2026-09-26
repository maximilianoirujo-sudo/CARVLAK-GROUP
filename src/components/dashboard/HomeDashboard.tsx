import React, { useMemo } from 'react';
import {
  Calendar,
  CheckSquare,
  Car,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ShieldAlert,
  BadgePercent,
  AlertOctagon
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
    dealershipConfig,
    totalFondosARendir0km,
    totalZeroKmProfit,
    zeroKmAlerts,
    zeroKmOrders
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
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/*  */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#131A26] to-[#0E141E] border border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Hub de Operaciones
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {profile?.roles.join(' • ').toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Hola, {profile?.full_name || 'Equipo'} 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {isBoss
                ? 'Vista general de los 3 negocios de CARVLAK Group. Todo sincronizado en tiempo real.'
                : 'Tus turnos y tareas asignadas para la jornada.'}
            </p>
          </div>

          {/*  */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewAppointment}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Turno</span>
            </button>
            <button
              onClick={onNewVehicle}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto</span>
            </button>
            <button
              onClick={onNewClient}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Destacado: Fondos de 0km a Rendir */}
      {totalFondosARendir0km > 0 && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/50 via-[#1A181F] to-[#12161F] border-2 border-amber-500/60 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-4 shadow-xl group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Control Financiero 0km
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  FONDOS A RENDIR
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5 group-hover:text-amber-300 transition-colors">
                ${totalFondosARendir0km.toLocaleString()} USD cobrados a clientes pendientes de pago a importadores
              </div>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Dinero en custodia transitoria: <strong className="underline decoration-amber-500">no constituye liquidez disponible de la empresa</strong>.
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1 shrink-0">
            <span>Gestionar 0km</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Alertas Críticas 0km (Discrepancias / Vencimientos) */}
      {zeroKmAlerts.length > 0 && isBoss && (
        <div className="space-y-2">
          {zeroKmAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              onClick={() => onNavigate('mod-automotora')}
              className={`p-3.5 rounded-2xl border cursor-pointer hover:opacity-90 transition-all flex items-center justify-between gap-3 shadow-md ${
                alert.type === 'danger'
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    alert.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {alert.type === 'danger' ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{alert.desc}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
                <span>Ver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerta de Presupuestos Pendientes DetailVlak */}
      {pendingQuotes.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-detailing')}
          className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-[#121826] border border-purple-500/40 cursor-pointer hover:border-purple-400 transition-all flex items-center justify-between gap-3 shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-lg shrink-0">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                  DetailVlak Shangrilá
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                  {pendingQuotes.length} pendientes
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 group-hover:text-purple-300 transition-colors">
                Tenés {pendingQuotes.length} solicitud{pendingQuotes.length > 1 ? 'es' : ''} de presupuesto web por responder
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Última: {pendingQuotes[0]?.client_name} • {pendingQuotes[0]?.vehicle_info}
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-purple-400 flex items-center gap-1 shrink-0">
            <span>Ver y Cotizar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Alerta de Peritajes Pendientes / En Curso CARVLAK */}
      {pendingInspections.length > 0 && (
        <div
          onClick={() => onNavigate('mod-inspeccion')}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#0A1612] border border-emerald-500/40 cursor-pointer hover:border-emerald-400 transition-all flex items-center justify-between gap-3 shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0">
              🔍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Peritaje & Inspección
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">
                  {pendingInspections.length} activos
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 group-hover:text-emerald-300 transition-colors">
                Tenés {pendingInspections.length} peritaje{pendingInspections.length > 1 ? 's' : ''} pendiente{pendingInspections.length > 1 ? 's' : ''} o en curso
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Próximo: {pendingInspections[0]?.vehicle_plate} • {pendingInspections[0]?.vehicle_info} ({pendingInspections[0]?.status})
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 shrink-0">
            <span>Abrir Peritaje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Alerta de Nuevos Interesados CRM Automotora */}
      {newInquiries.length > 0 && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-[#0A131C] border border-blue-500/40 cursor-pointer hover:border-blue-400 transition-all flex items-center justify-between gap-3 shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-lg shrink-0">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  CRM Automotora
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200">
                  {newInquiries.length} nuevo{newInquiries.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 group-hover:text-blue-300 transition-colors">
                Tenés {newInquiries.length} consulta{newInquiries.length > 1 ? 's' : ''} nueva{newInquiries.length > 1 ? 's' : ''} de compradores por responder
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Última: {newInquiries[0]?.client_name} ({newInquiries[0]?.vehicle_info}) por {newInquiries[0]?.origin}
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-blue-400 flex items-center gap-1 shrink-0">
            <span>Atender Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Alerta de Stock Inmovilizado (> 60 días) */}
      {overdueVehicles.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-[#1C160A] border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-3 shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Control de Stock Automotora
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200">
                  {overdueVehicles.length} inmovilizado{overdueVehicles.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 group-hover:text-amber-300 transition-colors">
                {overdueVehicles.length} vehículo{overdueVehicles.length > 1 ? 's tienen' : ' tiene'} más de 60 días en inventario
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Revisá precios de lista, ofertas o promociones para acelerar la rotación de capital.
              </p>
            </div>
          </div>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1 shrink-0">
            <span>Ver Inventario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/*  */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('agenda')}
          className="p-4 rounded-2xl bg-[#121721] border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Turnos Hoy</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{todayAppointments.length}</div>
          <p className="text-[10px] text-amber-400 mt-0.5">En agenda hoy</p>
        </div>

        <div
          onClick={() => onNavigate('tareas')}
          className="p-4 rounded-2xl bg-[#121721] border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Tareas Pendientes</span>
            <CheckSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{pendingTasks.length}</div>
          <p className="text-[10px] text-purple-400 mt-0.5">Por completar</p>
        </div>

        <div
          onClick={() => onNavigate('vehiculos')}
          className="p-4 rounded-2xl bg-[#121721] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Vehículos</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{vehicles.length}</div>
          <p className="text-[10px] text-cyan-400 mt-0.5">Fichas registradas</p>
        </div>

        <div
          onClick={() => onNavigate('clientes')}
          className="p-4 rounded-2xl bg-[#121721] border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Clientes</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{clients.length}</div>
          <p className="text-[10px] text-emerald-400 mt-0.5">Base compartida</p>
        </div>
      </div>

      {/*  */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Turnos de Hoy ({todayAppointments.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Ver Agenda Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#121721] border border-slate-800 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
            <p className="text-sm font-bold text-slate-300">No hay turnos agendados para hoy</p>
            <p className="text-xs text-slate-500 mt-1">Podés agendar uno con el botón superior.</p>
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
                  className={`p-4 rounded-2xl bg-[#121721] border ${bConfig.borderClass} hover:border-amber-400/50 cursor-pointer transition-all flex flex-col justify-between space-y-3 group`}
                >
                  <div>
                    {/*  */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bConfig.bgLight} ${bConfig.textClass} border ${bConfig.borderClass}`}>
                        {bConfig.name}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{timeStr} hs</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                      {appt.title || 'Atención en Showroom / Taller'}
                    </h3>

                    {/*  */}
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{client?.full_name || 'Cliente'}</span>
                        {vehicle && (
                          <span className="font-mono text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold border border-slate-800">
                            {normalizePlate(vehicle.plate)}
                          </span>
                        )}
                      </div>
                      {vehicle && (
                        <p className="text-[11px] text-slate-500">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      )}
                    </div>
                  </div>

                  {/*  */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-black text-amber-400">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      appt.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/*  */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tareas Operativas ({pendingTasks.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tareas')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>Ver Todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl bg-[#121721] border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => updateTaskStatus(t.id, t.status === 'En curso' ? 'Hecha' : 'En curso')}
                  className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    t.status === 'En curso'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                  }`}
                >
                  ✓
                </button>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  t.status === 'En curso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {t.status}
                </span>
                <button
                  onClick={() => updateTaskStatus(t.id, 'Hecha')}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all"
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

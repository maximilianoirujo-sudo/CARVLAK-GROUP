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
  AlertTriangle,
  Share2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { BUSINESS_CONFIG, formatCurrency } from '../../lib/formatters';
import { isEncargado } from '../../lib/permissions';
import { Appointment, SocialMediaTemplateId } from '../../types';
import { UruguayanPlate } from '../ui';

interface HomeDashboardProps {
  onNavigate: (tab: string) => void;
  onNewAppointment: () => void;
  onNewVehicle: () => void;
  onNewClient: () => void;
  onNewTask: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenRedesWithItem?: (vehicleId?: string, templateId?: SocialMediaTemplateId) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  onNewAppointment,
  onNewVehicle,
  onNewClient,
  onNewTask,
  onSelectAppointment,
  onOpenRedesWithItem
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
    dealershipConfig
  } = useData();

  const isBoss = isEncargado(profile);

  // Solicitudes de presupuesto pendientes de DetailVlak
  const pendingQuotes = useMemo(() => {
    return detailingQuotes.filter((q) => q.status === 'Por Cotizar');
  }, [detailingQuotes]);

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

  // Sugerencias inteligentes para redes sociales
  const socialSuggestions = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      templateId: SocialMediaTemplateId;
      vehicleId?: string;
      badge: string;
    }> = [];

    // 1. Último auto vendido
    const soldCar = dealershipVehicles.find((v) => v.status === 'vendido');
    if (soldCar) {
      list.push({
        id: `sold-${soldCar.id}`,
        title: `Se vendió ${soldCar.brand} ${soldCar.model}`,
        subtitle: `Celebrá la entrega en Instagram con el sello de Vendido`,
        templateId: 'auto-vendido',
        vehicleId: soldCar.id,
        badge: 'Vendido'
      });
    }

    // 2. Auto con días en stock o descuento
    const discountCar = overdueVehicles[0] || dealershipVehicles.find((v) => v.status === 'publicado');
    if (discountCar) {
      list.push({
        id: `discount-${discountCar.id}`,
        title: `Oportunidad: ${discountCar.brand} ${discountCar.model}`,
        subtitle: `Publicá precio promocional para acelerar su venta`,
        templateId: 'auto-descuento',
        vehicleId: discountCar.id,
        badge: 'Oferta'
      });
    }

    // 3. Auto recién ingresado
    const newCar = dealershipVehicles.find((v) => v.status === 'publicado' && v.id !== discountCar?.id);
    if (newCar) {
      list.push({
        id: `new-${newCar.id}`,
        title: `Nuevo ingreso: ${newCar.brand} ${newCar.model}`,
        subtitle: `Presentá la unidad con fotos y equipamiento destacado`,
        templateId: 'auto-nuevo-ingreso',
        vehicleId: newCar.id,
        badge: 'Recién llegado'
      });
    }

    // 4. Último trabajo de Detailing
    const recentQuote = detailingQuotes[0];
    if (recentQuote && list.length < 3) {
      list.push({
        id: `detail-${recentQuote.id}`,
        title: `Detailing en ${recentQuote.vehicle_info}`,
        subtitle: `Mostrá el acabado espejo con la plantilla de Antes y después`,
        templateId: 'detailing-antes-despues',
        badge: 'Detailing'
      });
    }

    return list.slice(0, 3);
  }, [dealershipVehicles, overdueVehicles, detailingQuotes]);

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      
      {/* Encabezado Principal / Saludo */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E5E5E3] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B6B6B]">
                Hub de operaciones
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                {profile?.roles.join(' • ')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF7F2] text-[#1E6B43] border border-[#D4EBDC] text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B43] animate-pulse"></span>
                Taller activo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-[#161616] mt-1.5">
              Buen día, {profile?.full_name?.split(' ')[0] || 'Martín'}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5 max-w-xl">
              {isBoss
                ? 'Panel central unificado: Automotora, Detailing Shangrilá e Inspecciones vehiculares.'
                : 'Tus turnos y tareas asignadas para la jornada.'}
            </p>
          </div>

          {/* Botones de acción: UN SOLO BOTÓN PRINCIPAL EN ROJO #D7141A, SECUNDARIOS CON BORDE #E5E5E3 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewAppointment}
              className="px-4 py-2 rounded-md bg-[#D7141A] hover:bg-[#B80E14] active:bg-[#9E0C11] text-white font-semibold text-xs transition-colors min-h-[40px] flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo turno</span>
            </button>
            <button
              onClick={onNewVehicle}
              className="px-3.5 py-2 rounded-md bg-white hover:bg-[#F5F5F4] active:bg-[#EBEBEA] text-[#161616] font-semibold text-xs border border-[#E5E5E3] hover:border-[#D0D0CD] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer shadow-xs"
            >
              <Car className="w-3.5 h-3.5 text-[#161616]" />
              <span>Auto</span>
            </button>
            <button
              onClick={onNewClient}
              className="px-3.5 py-2 rounded-md bg-white hover:bg-[#F5F5F4] active:bg-[#EBEBEA] text-[#161616] font-semibold text-xs border border-[#E5E5E3] hover:border-[#D0D0CD] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-[#161616]" />
              <span>Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTAS IMPORTANTES */}
      {overdueVehicles.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-automotora')}
          className="p-4 rounded-xl bg-white border-l-4 border-l-[#D7141A] border-t border-r border-b border-[#E5E5E3] cursor-pointer hover:border-[#D0D0CD] transition-colors flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#FDF2F2] text-[#B80E14] flex items-center justify-center shrink-0 border border-[#F9D2D2]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#D7141A]">
                  Alerta de stock inmovilizado
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B80E14] border border-[#F9D2D2]">
                  {overdueVehicles.length} {overdueVehicles.length === 1 ? 'auto' : 'autos'} &gt; 60 días
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#161616] mt-0.5">
                {overdueVehicles.length} vehículo{overdueVehicles.length > 1 ? 's superan' : ' supera'} los 60 días en stock sin vender
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Revisá precios de lista o promociones para acelerar la rotación de capital.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1 shrink-0">
            <span>Ver stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {pendingQuotes.length > 0 && isBoss && (
        <div
          onClick={() => onNavigate('mod-detailing')}
          className="p-4 rounded-xl bg-white border border-[#E5E5E3] cursor-pointer hover:border-[#D0D0CD] transition-colors flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6B6B6B]">
                  Detailing Shangrilá
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B80E14] border border-[#F9D2D2]">
                  {pendingQuotes.length} pendientes
                </span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#161616] mt-0.5">
                {pendingQuotes.length} solicitud{pendingQuotes.length > 1 ? 'es' : ''} de presupuesto web por responder
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Última: {pendingQuotes[0]?.client_name} • {pendingQuotes[0]?.vehicle_info}
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1 shrink-0">
            <span>Responder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Sugerencias de Redes Sociales Automáticas */}
      {socialSuggestions.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E5E3] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                <Share2 className="w-4 h-4 text-[#D7141A]" />
              </span>
              <div>
                <h3 className="text-xs font-semibold text-[#161616]">
                  Sugerencias para Instagram y redes
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Oportunidades de publicación detectadas a partir de tus autos y trabajos recientes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('redes-sociales')}
              className="text-xs font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ir a redes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {socialSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-3.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-white text-[#D7141A] border border-[#E5E5E3]">
                    {sug.badge}
                  </span>
                  <div className="font-semibold text-xs text-[#161616] group-hover:text-[#D7141A] transition-colors line-clamp-1">
                    {sug.title}
                  </div>
                  <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
                    {sug.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRedesWithItem) {
                      onOpenRedesWithItem(sug.vehicleId, sug.templateId);
                    } else {
                      onNavigate('redes-sociales');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-md bg-white hover:bg-[#EBEBEA] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Crear imagen</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('agenda')}
          className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Turnos hoy</span>
            <Calendar className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#000000] tabular-nums">
            {todayAppointments.length}
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">En agenda diaria</p>
        </div>

        <div
          onClick={() => onNavigate('tareas')}
          className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Tareas pendientes</span>
            <CheckSquare className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#000000] tabular-nums">
            {pendingTasks.length}
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">Por completar</p>
        </div>

        <div
          onClick={() => onNavigate('vehiculos')}
          className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Vehículos</span>
            <Car className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#000000] tabular-nums">
            {vehicles.length}
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">Fichas registradas</p>
        </div>

        <div
          onClick={() => onNavigate('clientes')}
          className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-xs font-semibold">Clientes</span>
            <Users className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#000000] tabular-nums">
            {clients.length}
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">Base compartida</p>
        </div>
      </div>

      {/* Turnos de Hoy */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#161616]" />
            <h2 className="text-sm font-semibold text-[#161616] font-display">
              Turnos de hoy ({todayAppointments.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="text-xs font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver agenda completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-[#E5E5E3] text-center text-[#6B6B6B]">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#6B6B6B]" />
            <p className="text-sm font-semibold text-[#161616]">No hay turnos agendados para hoy</p>
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
                  className="p-4 rounded-xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between space-y-3 shadow-xs group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] flex items-center gap-1">
                        {appt.business === 'automotora' && <Car className="w-3 h-3 text-[#D7141A]" />}
                        {appt.business === 'detailing' && <Droplets className="w-3 h-3 text-[#161616]" />}
                        {appt.business === 'inspeccion' && <ClipboardCheck className="w-3 h-3 text-[#161616]" />}
                        <span>{bConfig?.shortName || appt.business}</span>
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#161616] bg-[#F5F5F4] px-2 py-0.5 rounded-md border border-[#E5E5E3]">
                        <Clock className="w-3 h-3 text-[#6B6B6B]" />
                        <span>{timeStr} hs</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-[#161616] mt-2 group-hover:text-[#D7141A] transition-colors">
                      {appt.title || 'Atención de cliente'}
                    </h3>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs text-[#161616] font-medium block truncate">
                          {client?.full_name || 'Cliente'}
                        </span>
                        {vehicle && (
                          <p className="text-xs text-[#6B6B6B] truncate">
                            {vehicle.brand} {vehicle.model}
                          </p>
                        )}
                      </div>
                      {vehicle?.plate && (
                        <UruguayanPlate plate={vehicle.plate} size="sm" />
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-xs">
                    <span className="font-display font-bold text-[#000000] tabular-nums text-sm">
                      {formatCurrency(appt.price_amount, appt.price_currency)}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
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
            <CheckSquare className="w-4 h-4 text-[#161616]" />
            <h2 className="text-sm font-semibold text-[#161616] font-display">
              Tareas del equipo ({pendingTasks.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tareas')}
            className="text-xs font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {pendingTasks.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl bg-white border border-[#E5E5E3] flex items-center justify-between gap-3 hover:border-[#D0D0CD] hover:shadow-xs transition-all shadow-xs"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => updateTaskStatus(t.id, t.status === 'En curso' ? 'Hecha' : 'En curso')}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    t.status === 'En curso'
                      ? 'bg-[#161616] text-white border-[#161616]'
                      : 'border-[#D0D0CD] bg-white text-transparent hover:border-[#161616]'
                  }`}
                >
                  ✓
                </button>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#161616] truncate">{t.title}</h4>
                  {t.description && (
                    <p className="text-xs text-[#6B6B6B] truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                  {t.status}
                </span>
                <button
                  type="button"
                  onClick={() => updateTaskStatus(t.id, 'Hecha')}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] hover:border-[#D0D0CD] font-semibold text-xs transition-colors cursor-pointer shadow-xs"
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

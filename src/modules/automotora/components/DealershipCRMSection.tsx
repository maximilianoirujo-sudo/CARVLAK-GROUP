import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import {
  DealershipInquiry,
  DealershipInquiryStatus,
  DealershipInquiryOrigin,
  DealershipVehicle
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface DealershipCRMSectionProps {
  onSelectVehicle?: (vehicle: DealershipVehicle) => void;
}

export const DealershipCRMSection: React.FC<DealershipCRMSectionProps> = ({ onSelectVehicle }) => {
  const {
    dealershipInquiries,
    dealershipVehicles,
    addDealershipInquiry,
    updateDealershipInquiry,
    updateDealershipInquiryStatus,
    clients
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [originFilter, setOriginFilter] = useState<string>('todos');

  // Modales
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInquiryForSchedule, setSelectedInquiryForSchedule] = useState<DealershipInquiry | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [scheduleType, setScheduleType] = useState<'Visita agendada' | 'Prueba de manejo'>('Visita agendada');

  // Formulario nuevo lead
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [origin, setOrigin] = useState<DealershipInquiryOrigin>('WhatsApp');
  const [budgetUsd, setBudgetUsd] = useState<number>(0);
  const [tradeInInfo, setTradeInInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Filtrado de consultas
  const filteredInquiries = useMemo(() => {
    return dealershipInquiries.filter((inq) => {
      const matchesSearch =
        inq.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.client_phone.includes(searchTerm) ||
        inq.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inq.trade_in_vehicle_info && inq.trade_in_vehicle_info.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'todos' ? true : inq.status === statusFilter;
      const matchesOrigin = originFilter === 'todos' ? true : inq.origin === originFilter;

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [dealershipInquiries, searchTerm, statusFilter, originFilter]);

  // Contadores por estado
  const counts = useMemo(() => {
    return {
      todos: dealershipInquiries.length,
      nuevo: dealershipInquiries.filter((i) => i.status === 'Nuevo').length,
      contactado: dealershipInquiries.filter((i) => i.status === 'Contactado').length,
      visita: dealershipInquiries.filter((i) => i.status === 'Visita agendada' || i.status === 'Prueba de manejo').length,
      negociacion: dealershipInquiries.filter((i) => i.status === 'En negociacion' || i.status === 'Negociando').length,
      ganada: dealershipInquiries.filter((i) => i.status === 'Ganada' || i.status === 'Vendido').length,
      perdida: dealershipInquiries.filter((i) => i.status === 'Perdida' || i.status === 'Perdido').length
    };
  }, [dealershipInquiries]);

  // Enviar mensaje de WhatsApp
  const handleSendWhatsApp = (inquiry: DealershipInquiry, templateType: 'bienvenida' | 'visita' | 'seguimiento') => {
    const cleanPhone = inquiry.client_phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('598')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `598${cleanPhone.slice(1)}`
      : `598${cleanPhone}`;

    let messageText = '';

    if (templateType === 'bienvenida') {
      messageText = `¡Hola ${inquiry.client_name}! 👋 Te escribimos desde Automotora CARVLAK. Recibimos tu consulta por el *${inquiry.vehicle_info}* que tenemos publicado.\n\n¿Te gustaría coordinar una visita para verlo en nuestro showroom o hacer una prueba de manejo? Quedamos a tu disposición.`;
    } else if (templateType === 'visita') {
      messageText = `Estimado/a ${inquiry.client_name}, te confirmamos la cita para conocer y probar el *${inquiry.vehicle_info}* en CARVLAK Shangrilá.\n\n📍 Te esperamos con la unidad lista y limpia. ¡Cualquier duda avisanos!`;
    } else {
      messageText = `Hola ${inquiry.client_name}, ¿cómo estás? Te escribimos de CARVLAK para saber si seguís interesado en el *${inquiry.vehicle_info}* o si te gustaría que te enviemos otras opciones similares. ¡Que tengas un excelente día!`;
    }

    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phoneWithPrefix}?text=${encoded}`, '_blank');

    // Si estaba como 'Nuevo', pasar a 'Contactado'
    if (inquiry.status === 'Nuevo') {
      updateDealershipInquiryStatus(inquiry.id, 'Contactado');
    }
  };

  // Crear cita en agenda
  const handleConfirmSchedule = () => {
    if (!selectedInquiryForSchedule) return;

    updateDealershipInquiryStatus(selectedInquiryForSchedule.id, scheduleType, {
      date: new Date(scheduleDate).toISOString(),
      assigned_to: profile?.id || 'user-maxi',
      title: `${scheduleType}: ${selectedInquiryForSchedule.vehicle_info} con ${selectedInquiryForSchedule.client_name}`
    });

    showToast(`Cita de ${scheduleType} agendada en la Agenda Unificada`, 'success');
    setIsScheduleModalOpen(false);
    setSelectedInquiryForSchedule(null);
  };

  // Crear nuevo lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Por favor ingresá nombre y teléfono del interesado', 'error');
      return;
    }

    const selectedCar = dealershipVehicles.find((v) => v.id === vehicleId);

    addDealershipInquiry({
      empresa_id: 'carvlak',
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim() || undefined,
      dealership_vehicle_id: selectedCar?.id,
      vehicle_info: selectedCar ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.year})` : 'Interesado general',
      vehicle_plate: selectedCar?.plate,
      origin,
      budget_usd: Number(budgetUsd) || undefined,
      trade_in_vehicle_info: tradeInInfo.trim() || undefined,
      notes: notes.trim(),
      status: 'Nuevo',
      assigned_to: profile?.id
    });

    showToast('Nuevo interesado registrado en el CRM', 'success');
    setIsNewLeadModalOpen(false);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setVehicleId('');
    setBudgetUsd(0);
    setTradeInInfo('');
    setNotes('');
  };

  const getStatusBadge = (status: DealershipInquiryStatus) => {
    switch (status) {
      case 'Nuevo':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            ✨ Nuevo
          </span>
        );
      case 'Contactado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
            💬 Contactado
          </span>
        );
      case 'Visita agendada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            📅 Visita Agendada
          </span>
        );
      case 'Prueba de manejo':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
            🏎️ Test Drive
          </span>
        );
      case 'Negociando':
      case 'En negociacion':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            🤝 En Negociación
          </span>
        );
      case 'Vendido':
      case 'Ganada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            🎉 Venta Cerrada
          </span>
        );
      case 'Perdido':
      case 'Perdida':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            ❌ Descartado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>CRM &amp; Clientes Interesados</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredInquiries.length} leads
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Canal de captación desde catálogo web, WhatsApp, Instagram y presencial con agendado de visitas.
          </p>
        </div>

        <button
          onClick={() => setIsNewLeadModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Interesado</span>
        </button>
      </div>

      {/* Tabs de Filtro de Estados */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {[
          { id: 'todos', label: 'Todos', count: counts.todos },
          { id: 'Nuevo', label: 'Nuevos', count: counts.nuevo },
          { id: 'Contactado', label: 'Contactados', count: counts.contactado },
          { id: 'Visita agendada', label: 'Visitas / Test Drive', count: counts.visita },
          { id: 'En negociacion', label: 'En Negociación', count: counts.negociacion },
          { id: 'Ganada', label: 'Ganadas', count: counts.ganada },
          { id: 'Perdida', label: 'Perdidas', count: counts.perdida }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Buscador & Filtro Origen */}
      <div className="p-4 rounded-3xl bg-[#0E131C] border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, auto o vehículo en permuta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Origen:</span>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los canales</option>
            <option value="Catalogo web">Catálogo Web</option>
            <option value="WhatsApp">WhatsApp Directo</option>
            <option value="Instagram">Instagram</option>
            <option value="Marketplace">Facebook Marketplace</option>
            <option value="Presencial">Presencial en Salón</option>
          </select>
        </div>
      </div>

      {/* Lista de Consultas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInquiries.map((inq) => {
          const linkedCar = dealershipVehicles.find((v) => v.id === inq.dealership_vehicle_id);

          return (
            <div
              key={inq.id}
              className="p-4 sm:p-5 rounded-3xl bg-[#101520] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Cabecera del Lead */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{inq.client_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {inq.origin}
                      </span>
                    </div>
                    <div className="text-xs text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>{inq.client_phone}</span>
                    </div>
                  </div>

                  <div>{getStatusBadge(inq.status)}</div>
                </div>

                {/* Auto de Interés */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-slate-500">
                      {linkedCar?.cover_image ? (
                        <img
                          src={linkedCar.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {inq.vehicle_info}
                      </div>
                      {inq.vehicle_plate && (
                        <div className="font-mono text-[10px] text-amber-400">
                          {inq.vehicle_plate}
                        </div>
                      )}
                    </div>
                  </div>

                  {linkedCar && onSelectVehicle && (
                    <button
                      onClick={() => onSelectVehicle(linkedCar)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold flex items-center gap-1"
                    >
                      <span>Ver Auto</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Datos de Permuta o Presupuesto */}
                {(inq.trade_in_vehicle_info || inq.budget_usd) && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    {inq.trade_in_vehicle_info && (
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Entrega Permuta:</span>
                        <span>{inq.trade_in_vehicle_info}</span>
                      </div>
                    )}
                    {inq.budget_usd && (
                      <div className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Presupuesto:</span>
                        <span>USD {inq.budget_usd.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas */}
                {inq.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2 rounded-xl border border-slate-800/40">
                    "{inq.notes}"
                  </p>
                )}
              </div>

              {/* Acciones Rápidas */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* WhatsApp Bienvenida */}
                  <button
                    onClick={() => handleSendWhatsApp(inq, 'bienvenida')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Enviar saludo de bienvenida y fotos por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Agendar Visita / Test Drive */}
                  <button
                    onClick={() => {
                      setSelectedInquiryForSchedule(inq);
                      setIsScheduleModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Agendar turno en Agenda Unificada"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Visita</span>
                  </button>

                  {/* Selector de Estado */}
                  <select
                    value={inq.status}
                    onChange={(e) =>
                      updateDealershipInquiryStatus(inq.id, e.target.value as DealershipInquiryStatus)
                    }
                    className="ml-auto bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Visita agendada">Visita Agendada</option>
                    <option value="Prueba de manejo">Test Drive</option>
                    <option value="En negociacion">En Negociación</option>
                    <option value="Ganada">Ganada (Venta)</option>
                    <option value="Perdida">Perdida</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInquiries.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl bg-[#101520] border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center text-xl">
              👥
            </div>
            <h3 className="text-sm font-black text-white">No hay consultas en este filtro</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Las consultas desde el catálogo público o WhatsApp aparecerán listadas aquí para su seguimiento.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Agendar Visita en Agenda Unificada */}
      {isScheduleModalOpen && selectedInquiryForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Agendar en Agenda Unificada</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Se creará un turno en la Agenda Unificada con color ámbar asignado a tu usuario para recibir al cliente.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Cliente &amp; Vehículo
                </label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white">
                  {selectedInquiryForSchedule.client_name} • {selectedInquiryForSchedule.vehicle_info}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tipo de Actividad
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="Visita agendada">Visita al Showroom (Conocer el auto)</option>
                  <option value="Prueba de manejo">Prueba de Manejo (Test Drive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Fecha y Hora de la Cita
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
              >
                Confirmar y Agendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Interesado / Lead */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Registrar Consulta de Cliente</h3>
              </div>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcelo Gómez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="099 123 456"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Auto de Interés
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="">-- Consulta general --</option>
                    {dealershipVehicles
                      .filter((v) => v.status !== 'vendido')
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.brand} {car.model} ({car.year}) - {car.plate}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Canal de Origen
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as DealershipInquiryOrigin)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Catalogo web">Catálogo Web</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Presencial">Presencial en Salón</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Presupuesto Disponible (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 12000"
                    value={budgetUsd}
                    onChange={(e) => setBudgetUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Auto para Permuta (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Chevrolet Onix 2018 Joy"
                    value={tradeInInfo}
                    onChange={(e) => setTradeInInfo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Notas de la Consulta
                </label>
                <textarea
                  rows={2}
                  placeholder="Le interesa financiar el 50%, busca con aire y pocos kilómetros..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Guardar Interesado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

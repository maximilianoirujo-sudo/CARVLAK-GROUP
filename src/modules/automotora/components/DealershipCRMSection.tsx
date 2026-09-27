import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  Car,
  X
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
import { Button } from '../../../components/ui/Button';

interface DealershipCRMSectionProps {
  onSelectVehicle?: (vehicle: DealershipVehicle) => void;
}

export const DealershipCRMSection: React.FC<DealershipCRMSectionProps> = ({ onSelectVehicle }) => {
  const {
    dealershipInquiries,
    dealershipVehicles,
    addDealershipInquiry,
    updateDealershipInquiryStatus
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
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EEF7F2] text-[#1E6B43] border border-[#C6E7D4]">
            Nuevo
          </span>
        );
      case 'Contactado':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
            Contactado
          </span>
        );
      case 'Visita agendada':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
            Visita agendada
          </span>
        );
      case 'Prueba de manejo':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
            Test drive
          </span>
        );
      case 'Negociando':
      case 'En negociacion':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEF7EC] text-[#945B0E] border border-[#FADBA8]">
            En negociación
          </span>
        );
      case 'Vendido':
      case 'Ganada':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#161616] text-white">
            Venta cerrada
          </span>
        );
      case 'Perdido':
      case 'Perdida':
        return (
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FDF2F2] text-[#B80E14] border border-[#FADBA8]">
            Descartado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera CRM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#161616] flex items-center gap-2">
            <span>CRM y clientes interesados</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
              {filteredInquiries.length} leads
            </span>
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Canal de captación desde catálogo web, WhatsApp, Instagram y presencial con agendado de visitas.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsNewLeadModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar interesado</span>
        </Button>
      </div>

      {/* Tabs de Filtro de Estados con Línea Roja */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E5E3]">
        {[
          { id: 'todos', label: 'Todos', count: counts.todos },
          { id: 'Nuevo', label: 'Nuevos', count: counts.nuevo },
          { id: 'Contactado', label: 'Contactados', count: counts.contactado },
          { id: 'Visita agendada', label: 'Visitas / Test drive', count: counts.visita },
          { id: 'En negociacion', label: 'En negociación', count: counts.negociacion },
          { id: 'Ganada', label: 'Ganadas', count: counts.ganada },
          { id: 'Perdida', label: 'Perdidas', count: counts.perdida }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-2 text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              statusFilter === tab.id
                ? 'border-[#D7141A] text-[#161616] font-bold'
                : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded ${
                statusFilter === tab.id ? 'bg-[#161616] text-white' : 'bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Buscador & Filtro Origen */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5E3] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, auto o vehículo en permuta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#6B6B6B]">Origen:</span>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-[#F5F5F4] border border-[#E5E5E3] text-xs font-medium text-[#161616] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#D7141A]"
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
              className="p-5 rounded-2xl bg-white border border-[#E5E5E3] hover:border-[#D0D0CD] transition-all space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Cabecera del Lead */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#161616]">{inq.client_name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                        {inq.origin}
                      </span>
                    </div>
                    <div className="text-xs text-[#161616] font-mono mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#6B6B6B]" />
                      <span>{inq.client_phone}</span>
                    </div>
                  </div>

                  <div>{getStatusBadge(inq.status)}</div>
                </div>

                {/* Auto de Interés */}
                <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E3] overflow-hidden shrink-0 flex items-center justify-center text-[#6B6B6B]">
                      {linkedCar?.cover_image ? (
                        <img
                          src={linkedCar.cover_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#161616]">{inq.vehicle_info}</div>
                      {inq.vehicle_plate && (
                        <span className="font-mono text-[10px] text-[#6B6B6B]">
                          Matrícula: {inq.vehicle_plate}
                        </span>
                      )}
                    </div>
                  </div>

                  {linkedCar && onSelectVehicle && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectVehicle(linkedCar)}
                    >
                      Ver stock
                    </Button>
                  )}
                </div>

                {/* Datos de Permuta o Presupuesto */}
                {(inq.trade_in_vehicle_info || inq.budget_usd) && (
                  <div className="p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-xs space-y-1">
                    {inq.trade_in_vehicle_info && (
                      <div className="text-[#161616] flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Entrega permuta:</span>
                        <span>{inq.trade_in_vehicle_info}</span>
                      </div>
                    )}
                    {inq.budget_usd && (
                      <div className="text-[#161616] flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Presupuesto:</span>
                        <span className="font-mono font-bold">USD {inq.budget_usd.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas */}
                {inq.notes && (
                  <p className="text-xs text-[#6B6B6B] italic bg-[#F5F5F4] p-2 rounded-xl border border-[#E5E5E3]">
                    "{inq.notes}"
                  </p>
                )}
              </div>

              {/* Acciones Rápidas */}
              <div className="pt-3 border-t border-[#E5E5E3] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="whatsapp"
                    size="sm"
                    onClick={() => handleSendWhatsApp(inq, 'bienvenida')}
                    title="Enviar saludo de bienvenida y fotos por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedInquiryForSchedule(inq);
                      setIsScheduleModalOpen(true);
                    }}
                    title="Agendar turno en Agenda Unificada"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar visita</span>
                  </Button>

                  <select
                    value={inq.status}
                    onChange={(e) =>
                      updateDealershipInquiryStatus(inq.id, e.target.value as DealershipInquiryStatus)
                    }
                    className="ml-auto bg-white border border-[#E5E5E3] text-[11px] font-semibold text-[#161616] rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#D7141A]"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Visita agendada">Visita agendada</option>
                    <option value="Prueba de manejo">Test drive</option>
                    <option value="En negociacion">En negociación</option>
                    <option value="Ganada">Ganada (Venta)</option>
                    <option value="Perdida">Perdida</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInquiries.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F4] text-[#6B6B6B] mx-auto flex items-center justify-center text-xl border border-[#E5E5E3]">
              👥
            </div>
            <h3 className="text-sm font-bold text-[#161616]">No hay consultas en este filtro</h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
              Las consultas desde el catálogo público o WhatsApp aparecerán listadas aquí para su seguimiento.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Agendar Visita en Agenda Unificada */}
      {isScheduleModalOpen && selectedInquiryForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D7141A]" />
                <h3 className="text-sm font-bold text-[#161616]">Agendar en agenda unificada</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#161616]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6B6B6B]">
              Se creará un turno en la Agenda Unificada asignado a tu usuario para recibir al cliente.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                  Cliente y vehículo
                </label>
                <div className="p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] font-semibold text-[#161616]">
                  {selectedInquiryForSchedule.client_name} • {selectedInquiryForSchedule.vehicle_info}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                  Tipo de actividad
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] font-semibold focus:border-[#D7141A] outline-none"
                >
                  <option value="Visita agendada">Visita al showroom (Conocer el auto)</option>
                  <option value="Prueba de manejo">Prueba de manejo (Test drive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                  Fecha y hora de la cita
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] font-semibold focus:border-[#D7141A] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E5E3] flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSchedule}
              >
                Confirmar y agendar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Interesado / Lead */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D7141A]" />
                <h3 className="text-base font-bold text-[#161616]">Registrar consulta de cliente</h3>
              </div>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#161616]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcelo Gómez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="099 123 456"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] font-mono placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Auto de interés
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] focus:border-[#D7141A] outline-none"
                  >
                    <option value="">-- Consulta general --</option>
                    {dealershipVehicles
                      .filter((v) => v.status !== 'vendido')
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.brand} {car.model} ({car.year}) - {car.plate || car.chassis_vin}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Canal de origen
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as DealershipInquiryOrigin)}
                    className="w-full px-2.5 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] focus:border-[#D7141A] outline-none"
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
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Presupuesto disponible (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 12000"
                    value={budgetUsd || ''}
                    onChange={(e) => setBudgetUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                    Auto para permuta (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Chevrolet Onix 2018 Joy"
                    value={tradeInInfo}
                    onChange={(e) => setTradeInInfo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase mb-1">
                  Notas de la consulta
                </label>
                <textarea
                  rows={2}
                  placeholder="Le interesa financiar el 50%, busca con aire y pocos kilómetros..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-xl text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E5E3] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsNewLeadModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Guardar interesado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

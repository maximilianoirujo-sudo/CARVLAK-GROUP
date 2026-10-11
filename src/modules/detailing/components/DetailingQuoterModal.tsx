import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Car,
  User,
  Phone,
  Clock,
  DollarSign,
  Calendar,
  AlertTriangle,
  Camera,
  Plus,
  MessageCircle,
  Save,
  CheckCircle2,
  Search,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  DetailingQuote,
  DetailingQuoteStatus,
  DetailingDiscountType,
  VehicleCategory,
  ClientOrigin,
  DetailingWorkBay
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  formatCurrency,
  normalizePlate,
  combineLocalDateAndTime,
  getLocalDateString,
  addMinutesToIso,
  timeStringToMinutes,
  minutesToTimeString,
  getDayOfWeekKey
} from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingQuoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: DetailingQuote | null;
  onOpenWhatsApp?: (quote: DetailingQuote) => void;
  initialDate?: string;
  initialTime?: string;
  initialBayId?: string;
}

export const DetailingQuoterModal: React.FC<DetailingQuoterModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onOpenWhatsApp,
  initialDate,
  initialTime,
  initialBayId
}) => {
  const {
    clients,
    vehicles,
    detailingTariffs,
    appointments,
    addDetailingQuote,
    updateDetailingQuote,
    updateDetailingQuoteStatus,
    updateAppointment,
    addAppointment,
    addClient,
    addVehicle,
    detailingConfig
  } = useData();

  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  // Escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Estados de Formulario - Cliente
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Estados de Formulario - Vehículo
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isNewVehicleMode, setIsNewVehicleMode] = useState(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleCategory, setNewVehicleCategory] = useState<VehicleCategory>('Chico');

  // Selección de servicios y montos
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customServices, setCustomServices] = useState<{ id: string; name: string; price: number; durationHours: number }[]>([]);
  const [isAddingCustomService, setIsAddingCustomService] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(1500);
  const [customHours, setCustomHours] = useState<number>(2);

  const [discountType, setDiscountType] = useState<DetailingDiscountType>('none');
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState<number>(0);
  const [hasExtremeDirt, setHasExtremeDirt] = useState(false);
  const [extremeDirtSurcharge, setExtremeDirtSurcharge] = useState<number>(1500);

  // Duración en minutos (con ajuste rápido)
  const [durationMinutes, setDurationMinutes] = useState<number>(180);

  // Metadatos
  const defaultProfileId = profile?.id || availableProfiles[0]?.id || '';
  const clientOrigins = detailingConfig?.client_origins || [
    'Presencial',
    'WhatsApp',
    'Instagram orgánico',
    'Anuncios pagos',
    'Referido',
    'Formulario web',
    'Llamada'
  ];
  const [origin, setOrigin] = useState<string>('WhatsApp');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>(defaultProfileId);
  const [notes, setNotes] = useState('');
  const [priorityZones, setPriorityZones] = useState('');

  // Agenda y Turno
  const [scheduleActive, setScheduleActive] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [workBayId, setWorkBayId] = useState<string>('box-1');

  // Fotos
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  // Cargar datos al abrir o editar
  useEffect(() => {
    if (quoteToEdit) {
      setSelectedClientId(quoteToEdit.client_id || '');
      setSelectedVehicleId(quoteToEdit.vehicle_id || '');
      setSelectedServiceIds(quoteToEdit.selected_services.map((s) => s.serviceId));
      setDiscountType(quoteToEdit.discount_type || 'none');
      setFixedDiscountAmount(quoteToEdit.discount_amount || 0);
      setHasExtremeDirt((quoteToEdit.extreme_dirt_surcharge || 0) > 0);
      setExtremeDirtSurcharge(quoteToEdit.extreme_dirt_surcharge || 1500);
      setOrigin(quoteToEdit.origin || 'WhatsApp');
      setWorkBayId(quoteToEdit.work_bay_id || initialBayId || 'box-1');

      if (quoteToEdit.commission_participants && quoteToEdit.commission_participants.length > 0) {
        setSelectedParticipantIds(quoteToEdit.commission_participants.map((p) => p.employee_id));
      } else {
        const defaults = detailingConfig?.commission_config?.default_participants || [];
        setSelectedParticipantIds(defaults.length > 0 ? defaults : (quoteToEdit.assigned_to ? [quoteToEdit.assigned_to] : []));
      }

      setAssignedTo(quoteToEdit.assigned_to || defaultProfileId);
      setAppointmentDate(quoteToEdit.appointment_date || '');
      setScheduleActive(!!quoteToEdit.appointment_date || quoteToEdit.status === 'Agendado' || quoteToEdit.status === 'Turno Confirmado');
      setNotes(quoteToEdit.notes || '');
      setPriorityZones(quoteToEdit.priority_zones || '');
      setPhotosBefore(quoteToEdit.photos_before || []);
      setPhotosAfter(quoteToEdit.photos_after || []);
      setIsNewClientMode(false);
      setIsNewVehicleMode(false);
    } else {
      setSelectedClientId('');
      setSelectedVehicleId('');
      setSelectedServiceIds(detailingConfig?.default_services && detailingConfig.default_services.length > 0 ? detailingConfig.default_services : []);
      setCustomServices([]);
      setDiscountType('none');
      setFixedDiscountAmount(0);
      setHasExtremeDirt(false);
      setExtremeDirtSurcharge(1500);
      setOrigin('');
      setWorkBayId(initialBayId || 'box-1');

      const defaults = detailingConfig?.commission_config?.default_participants || [];
      setSelectedParticipantIds(defaults.length > 0 ? defaults : (defaultProfileId ? [defaultProfileId] : []));
      setAssignedTo(defaultProfileId);

      const defaultTimePart = initialTime || '09:00';
      const defaultDate = initialDate 
        ? `${initialDate}T${defaultTimePart}` 
        : `${getLocalDateString(new Date(Date.now() + 86400000))}T09:00`;
      setAppointmentDate(defaultDate);
      setScheduleActive(!!(initialDate || initialBayId));
      setNotes('');
      setPriorityZones('');
      setPhotosBefore([]);
      setPhotosAfter([]);
      setIsNewClientMode(false);
      setIsNewVehicleMode(false);
    }
  }, [quoteToEdit, profile, isOpen, detailingConfig, initialDate, initialTime, initialBayId]);

  // Lista de vehículos del cliente seleccionado
  const clientVehicles = useMemo(() => {
    if (!selectedClientId) return [];
    return vehicles.filter((v) => v.client_id === selectedClientId && !v.is_archived);
  }, [vehicles, selectedClientId]);

  // Categoría activa de vehículo
  const activeCategory: VehicleCategory = useMemo(() => {
    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    if (veh) return veh.category;
    if (isNewVehicleMode) return newVehicleCategory;
    return 'Mediano';
  }, [vehicles, selectedVehicleId, isNewVehicleMode, newVehicleCategory]);

  const categoryKey = useMemo(() => {
    switch (activeCategory) {
      case 'Mediano': return 'mediano';
      case 'SUV/Rural': return 'suv';
      case 'Pick-up': return 'pickup';
      case 'Moto': return 'moto';
      default: return 'chico';
    }
  }, [activeCategory]);

  // Cálculo de duración sugerida por servicios
  useEffect(() => {
    let totalMins = 0;
    selectedServiceIds.forEach((sid) => {
      const tariff = detailingTariffs.find((t) => t.id === sid);
      if (tariff?.durationHours) {
        totalMins += Math.round(tariff.durationHours * 60);
      }
    });
    customServices.forEach((cs) => {
      totalMins += Math.round((cs.durationHours || 2) * 60);
    });
    if (totalMins > 0) {
      setDurationMinutes(totalMins);
    }
  }, [selectedServiceIds, customServices, detailingTariffs]);

  // Cálculo en tiempo real de Subtotal, Descuentos y Total
  const { subtotal, discountAmount, calculatedTotal, selectedServiceObjects } = useMemo(() => {
    const serviceObjs: { serviceId: string; serviceName: string; price: number; description?: string }[] = [];

    selectedServiceIds.forEach((id) => {
      const tariff = detailingTariffs.find((t) => t.id === id);
      const price = tariff ? tariff.prices[categoryKey] || 0 : 0;
      serviceObjs.push({
        serviceId: id,
        serviceName: tariff?.name || tariff?.shortName || id,
        price,
        description: tariff?.description
      });
    });

    customServices.forEach((cs) => {
      serviceObjs.push({
        serviceId: cs.id,
        serviceName: cs.name,
        price: cs.price
      });
    });

    const sub = serviceObjs.reduce((acc, curr) => acc + curr.price, 0);

    let disc = 0;
    if (discountType === 'combo_10') {
      disc = Math.round(sub * 0.1);
    } else if (discountType === 'special_15') {
      disc = Math.round(sub * 0.15);
    } else if (discountType === 'fixed') {
      disc = fixedDiscountAmount;
    }

    const surcharge = hasExtremeDirt ? extremeDirtSurcharge : 0;
    const total = Math.max(0, sub - disc + surcharge);

    return {
      subtotal: sub,
      discountAmount: disc,
      calculatedTotal: total,
      selectedServiceObjects: serviceObjs
    };
  }, [selectedServiceIds, customServices, detailingTariffs, categoryKey, discountType, fixedDiscountAmount, hasExtremeDirt, extremeDirtSurcharge]);

  // Filtro de clientes para el buscador inline
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return [];
    const term = clientSearchTerm.toLowerCase();
    return clients
      .filter((c) => !c.is_archived && (c.full_name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term))))
      .slice(0, 5);
  }, [clients, clientSearchTerm]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Próximos 3 huecos libres disponibles
  const suggestedSlots = useMemo(() => {
    if (!isOpen) return [];
    const slots: { label: string; dateIso: string }[] = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset <= 4 && slots.length < 3; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = getLocalDateString(targetDate);
      const dayKey = getDayOfWeekKey(dateStr);
      const schedule = (detailingConfig?.schedule?.[dayKey] as any);

      if (!schedule || !schedule.is_open) continue;

      const openMin = timeStringToMinutes(schedule.open_time || '08:30');
      const closeMin = timeStringToMinutes(schedule.close_time || '18:30');
      const dayAppts = appointments.filter(
        (a) => a.business === 'detailing' && !a.voided_at && a.status !== 'Cancelado' && a.start_time.startsWith(dateStr)
      );

      // Evaluar horas típicas (09:00, 13:00, 15:00)
      const testTimes = ['09:00', '13:30', '15:00'];
      for (const timeStr of testTimes) {
        if (slots.length >= 3) break;
        const startMin = timeStringToMinutes(timeStr);
        if (startMin < openMin || startMin + durationMinutes > closeMin) continue;

        // Verificar si algún box está disponible
        const availableBays = (detailingConfig?.work_bays || [{ id: 'box-1', name: 'Box 1', is_active: true }])
          .filter((b) => b.is_active);

        const hasFreeBay = availableBays.some((bay) => {
          const conflict = dayAppts.some((app) => {
            if (app.work_bay_id !== bay.id) return false;
            const appStart = timeStringToMinutes(app.start_time.split('T')[1]?.slice(0, 5) || '00:00');
            const appEnd = appStart + (app.duration_minutes || 60);
            return startMin < appEnd && startMin + durationMinutes > appStart;
          });
          return !conflict;
        });

        if (hasFreeBay) {
          const dayLabel = dayOffset === 0 ? 'Hoy' : dayOffset === 1 ? 'Mañana' : dateStr.slice(5);
          slots.push({
            label: `${dayLabel} ${timeStr}`,
            dateIso: `${dateStr}T${timeStr}`
          });
        }
      }
    }
    return slots;
  }, [isOpen, appointments, detailingConfig, durationMinutes]);

  if (!isOpen) return null;

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleAddCustomService = () => {
    if (!customName.trim()) return;
    const newCS = {
      id: `cs-${Date.now()}`,
      name: customName.trim(),
      price: customPrice || 0,
      durationHours: customHours || 2
    };
    setCustomServices((prev) => [...prev, newCS]);
    setCustomName('');
    setIsAddingCustomService(false);
  };

  const handleSave = (mode: 'quote_only' | 'schedule', openWhatsApp = false) => {
    // 1. Validar Cliente
    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientPhone = '';

    if (isNewClientMode) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        showToast('Ingresá el nombre y teléfono del nuevo cliente', 'error');
        return;
      }
      const res = addClient({
        full_name: newClientName.trim(),
        phone: newClientPhone.trim(),
        origin: origin as any,
        notes: newClientNotes.trim() || 'Creado desde Cotizador Detailing'
      });
      finalClientId = res.client.id;
      finalClientName = res.client.full_name;
      finalClientPhone = res.client.phone;
    } else {
      const cli = clients.find((c) => c.id === selectedClientId);
      if (!cli) {
        showToast('Seleccioná un cliente o creá uno nuevo', 'error');
        return;
      }
      finalClientId = cli.id;
      finalClientName = cli.full_name;
      finalClientPhone = cli.phone;
    }

    // 2. Validar Vehículo
    let finalVehicleId = selectedVehicleId;
    let finalVehicleInfo = '';
    let finalPlate = '';

    if (isNewVehicleMode) {
      if (!newVehicleBrand.trim() || !newVehicleModel.trim()) {
        showToast('Ingresá la marca y modelo del vehículo', 'error');
        return;
      }
      const plate = newVehiclePlate.trim() ? normalizePlate(newVehiclePlate.trim()) : 'S/M';
      const res = addVehicle({
        brand: newVehicleBrand.trim(),
        model: newVehicleModel.trim(),
        plate,
        category: newVehicleCategory,
        ownership: 'client',
        client_id: finalClientId,
        photos: photosBefore
      });
      finalVehicleId = res.vehicle.id;
      finalVehicleInfo = `${res.vehicle.brand} ${res.vehicle.model}`;
      finalPlate = res.vehicle.plate;
    } else {
      const veh = vehicles.find((v) => v.id === selectedVehicleId);
      if (veh) {
        finalVehicleId = veh.id;
        finalVehicleInfo = `${veh.brand} ${veh.model}`;
        finalPlate = veh.plate;
      } else {
        finalVehicleInfo = 'Vehículo a confirmar';
        finalPlate = 'S/M';
      }
    }

    if (selectedServiceObjects.length === 0) {
      showToast('Seleccioná al menos un servicio del tarifario', 'error');
      return;
    }

    if (!origin) {
      showToast('Seleccioná el origen del contacto para las métricas', 'error');
      return;
    }

    const participants = selectedParticipantIds.map((empId) => {
      const p = availableProfiles.find((ap) => ap.id === empId);
      const rule = detailingConfig?.commission_config?.employee_rules?.find((r) => r.employee_id === empId);
      const originRule = rule?.origin_rules?.find((or) => or.origin?.trim().toLowerCase() === origin.trim().toLowerCase());
      const rate = originRule ? originRule.percentage : (rule?.base_percentage ?? (p?.commissions?.detailing ?? 0));
      return {
        employee_id: empId,
        employee_name: p?.full_name || rule?.employee_name || 'Colaborador',
        rate
      };
    });

    const targetStatus: DetailingQuoteStatus = mode === 'schedule' ? 'Agendado' : (quoteToEdit ? quoteToEdit.status : 'Presupuesto');
    const [aDate, aTime] = appointmentDate.split('T');
    const finalAppointmentDate = aDate && aTime ? combineLocalDateAndTime(aDate, aTime) : appointmentDate;

    let savedQuote: DetailingQuote;

    if (quoteToEdit) {
      updateDetailingQuote(quoteToEdit.id, {
        client_id: finalClientId,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        vehicle_id: finalVehicleId,
        vehicle_info: finalVehicleInfo,
        vehicle_plate: finalPlate,
        vehicle_category: activeCategory,
        selected_services: selectedServiceObjects,
        subtotal,
        discount_type: discountType,
        discount_amount: discountAmount,
        extreme_dirt_surcharge: hasExtremeDirt ? extremeDirtSurcharge : 0,
        total_amount: calculatedTotal,
        estimated_time: `${Math.round(durationMinutes / 60)}h`,
        assigned_to: assignedTo,
        work_bay_id: workBayId,
        appointment_date: mode === 'schedule' ? finalAppointmentDate : quoteToEdit.appointment_date,
        commission_participants: participants,
        origin,
        notes,
        priority_zones: priorityZones,
        photos_before: photosBefore,
        photos_after: photosAfter
      });

      if (quoteToEdit.appointment_id) {
        updateAppointment(quoteToEdit.appointment_id, {
          start_time: finalAppointmentDate,
          duration_minutes: durationMinutes,
          work_bay_id: workBayId,
          assigned_to: assignedTo,
          stage: targetStatus,
          status: targetStatus === 'Cancelado' || targetStatus === 'No vino' ? 'Cancelado' : 'Confirmado'
        });
      } else if (mode === 'schedule') {
        const newAppt = addAppointment({
          business: 'detailing',
          client_id: finalClientId,
          vehicle_id: finalVehicleId,
          assigned_to: assignedTo,
          start_time: finalAppointmentDate,
          duration_minutes: durationMinutes,
          status: 'Confirmado',
          stage: 'Agendado',
          work_bay_id: workBayId,
          quote_id: quoteToEdit.id,
          title: `Detailing: ${selectedServiceObjects.map((s) => s.serviceName).join(' + ')}`,
          notes: `Origen: ${origin}. ${notes}`,
          price_amount: calculatedTotal,
          price_currency: 'UYU'
        });
        updateDetailingQuote(quoteToEdit.id, { appointment_id: newAppt.id });
      }

      if (quoteToEdit.status !== targetStatus) {
        updateDetailingQuoteStatus(quoteToEdit.id, targetStatus, {
          date: finalAppointmentDate,
          assigned_to: assignedTo,
          work_bay_id: workBayId
        });
      }

      savedQuote = {
        ...quoteToEdit,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        vehicle_info: finalVehicleInfo,
        total_amount: calculatedTotal,
        selected_services: selectedServiceObjects,
        status: targetStatus
      };
      showToast('Trabajo actualizado con éxito', 'success');
    } else {
      savedQuote = addDetailingQuote({
        client_id: finalClientId,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        vehicle_id: finalVehicleId,
        vehicle_info: finalVehicleInfo,
        vehicle_plate: finalPlate,
        vehicle_category: activeCategory,
        selected_services: selectedServiceObjects,
        subtotal,
        discount_type: discountType,
        discount_amount: discountAmount,
        extreme_dirt_surcharge: hasExtremeDirt ? extremeDirtSurcharge : 0,
        total_amount: calculatedTotal,
        estimated_time: `${Math.round(durationMinutes / 60)}h`,
        assigned_to: assignedTo,
        work_bay_id: workBayId,
        appointment_date: mode === 'schedule' ? finalAppointmentDate : undefined,
        commission_participants: participants,
        origin,
        status: targetStatus,
        notes,
        priority_zones: priorityZones,
        photos_before: photosBefore,
        photos_after: photosAfter
      });

      if (mode === 'schedule') {
        const newAppt = addAppointment({
          business: 'detailing',
          client_id: finalClientId,
          vehicle_id: finalVehicleId,
          assigned_to: assignedTo,
          start_time: finalAppointmentDate,
          duration_minutes: durationMinutes,
          status: 'Confirmado',
          stage: 'Agendado',
          work_bay_id: workBayId,
          quote_id: savedQuote.id,
          title: `Detailing: ${selectedServiceObjects.map((s) => s.serviceName).join(' + ')}`,
          notes: `Origen: ${origin}. ${notes}`,
          price_amount: calculatedTotal,
          price_currency: 'UYU'
        });
        updateDetailingQuote(savedQuote.id, { appointment_id: newAppt.id });
      }
      showToast(mode === 'schedule' ? 'Turno agendado en el taller' : 'Presupuesto creado con éxito', 'success');
    }

    if (openWhatsApp && onOpenWhatsApp) {
      onOpenWhatsApp(savedQuote);
    }
    onClose();
  };

  const activeBays = (detailingConfig?.work_bays || [
    { id: 'box-1', name: 'Box 1', is_active: true },
    { id: 'box-2', name: 'Box 2', is_active: true }
  ]).filter((b) => b.is_active);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Cabecera */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F2] border border-[#D7141A]/20 text-[#D7141A] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616] font-display">
                {quoteToEdit ? 'Editar trabajo o presupuesto' : 'Nuevo trabajo DetailVlak'}
              </h3>
              <p className="text-[11px] text-[#6B6B6B]">
                Carga rápida pensada para taller • Tarifas oficiales en $UYU
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* PASO 1: CLIENTE */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>1. Cliente</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsNewClientMode(!isNewClientMode);
                  setSelectedClientId('');
                }}
                className="text-xs font-semibold text-[#D7141A] hover:underline"
              >
                {isNewClientMode ? 'Buscar existente' : '+ Nuevo cliente'}
              </button>
            </div>

            {isNewClientMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nombre y apellido *"
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
                <input
                  type="text"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Teléfono / WhatsApp (09X...) *"
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
              </div>
            ) : selectedClient ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#161616] text-white flex items-center justify-center font-bold text-xs">
                    {selectedClient.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[#161616] block">{selectedClient.full_name}</span>
                    <span className="text-[11px] text-[#6B6B6B]">{selectedClient.phone || 'Sin teléfono'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('');
                    setSelectedVehicleId('');
                  }}
                  className="text-xs text-[#6B6B6B] hover:text-[#D7141A] font-semibold"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#6B6B6B] pointer-events-none" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Escribí nombre o celular del cliente..."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg pl-9 pr-3 py-2 text-[#161616] focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
                {filteredClients.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E5E5E3] rounded-xl shadow-lg overflow-hidden divide-y divide-[#E5E5E3]">
                    {filteredClients.map((cli) => (
                      <button
                        key={cli.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(cli.id);
                          setClientSearchTerm('');
                          const vList = vehicles.filter((v) => v.client_id === cli.id && !v.is_archived);
                          if (vList.length > 0) setSelectedVehicleId(vList[0].id);
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F5F5F4] transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-[#161616]">{cli.full_name}</span>
                        <span className="text-[11px] text-[#6B6B6B]">{cli.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PASO 2: VEHÍCULO */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>2. Vehículo y Categoría</span>
              </label>
              <button
                type="button"
                onClick={() => setIsNewVehicleMode(!isNewVehicleMode)}
                className="text-xs font-semibold text-[#D7141A] hover:underline"
              >
                {isNewVehicleMode ? 'Elegir cargado' : '+ Cargar otro auto'}
              </button>
            </div>

            {/* Píldoras de vehículos del cliente si existen */}
            {!isNewVehicleMode && clientVehicles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#6B6B6B]">Vehículos de este cliente (1 toque):</span>
                <div className="flex flex-wrap gap-2">
                  {clientVehicles.map((veh) => {
                    const isSelected = selectedVehicleId === veh.id;
                    return (
                      <button
                        key={veh.id}
                        type="button"
                        onClick={() => setSelectedVehicleId(veh.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                            : 'bg-[#F5F5F4] text-[#161616] border-[#E5E5E3] hover:border-[#D0D0CD]'
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>{veh.brand} {veh.model}</span>
                        {veh.plate && <span className="font-mono text-[10px] opacity-80">[{normalizePlate(veh.plate)}]</span>}
                        <span className="text-[10px] px-1 py-0.2 rounded bg-white/20">{veh.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario nuevo vehículo */}
            {isNewVehicleMode || (!selectedVehicleId && clientVehicles.length === 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fade-in">
                <input
                  type="text"
                  value={newVehicleBrand}
                  onChange={(e) => setNewVehicleBrand(e.target.value)}
                  placeholder="Marca (ej. Toyota) *"
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
                <input
                  type="text"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  placeholder="Modelo (ej. Corolla) *"
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
                <input
                  type="text"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value)}
                  placeholder="Matrícula (o S/M)"
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] font-mono uppercase focus:bg-white focus:border-[#D7141A] focus:outline-none"
                />
                <select
                  value={newVehicleCategory}
                  onChange={(e) => setNewVehicleCategory(e.target.value as VehicleCategory)}
                  className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] font-bold focus:bg-white focus:border-[#D7141A] focus:outline-none cursor-pointer"
                >
                  <option value="Chico">Chico / Hatchback</option>
                  <option value="Mediano">Mediano / Sedán</option>
                  <option value="SUV/Rural">SUV / Rural</option>
                  <option value="Pick-up">Pick-up / Camioneta</option>
                  <option value="Moto">Moto</option>
                </select>
              </div>
            ) : null}
          </div>

          {/* PASO 3: SERVICIOS */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>3. Servicios ({activeCategory})</span>
                </label>
                <span className="text-[11px] text-[#6B6B6B]">Precios directos según la categoría elegida</span>
              </div>
              <span className="text-sm font-bold font-mono text-[#161616]">
                Subtotal: {formatCurrency(subtotal, 'UYU')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detailingTariffs.filter((t) => t.isActive !== false).map((t) => {
                const isSelected = selectedServiceIds.includes(t.id);
                const price = t.prices[categoryKey] || 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleService(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FDF2F2] border-[#D7141A] text-[#161616] shadow-xs'
                        : 'bg-white border-[#E5E5E3] hover:border-[#D0D0CD] text-[#161616]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-[#D7141A] border-[#D7141A] text-white' : 'border-[#E5E5E3] bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-bold text-xs block">{t.name}</span>
                        <span className="text-[10px] text-[#6B6B6B]">{t.durationHours || 2}h estimadas</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs">
                      {formatCurrency(price, 'UYU')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Servicio personalizado opcional */}
            {isAddingCustomService ? (
              <div className="p-3 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 animate-fade-in">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre del servicio"
                  className="sm:col-span-2 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616]"
                />
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Precio $"
                  className="bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616]"
                />
                <Button size="sm" variant="primary" onClick={handleAddCustomService}>
                  Agregar
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCustomService(true)}
                className="text-xs text-[#6B6B6B] hover:text-[#161616] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar servicio personalizado</span>
              </button>
            )}
          </div>

          {/* PASO 4: DURACIÓN Y AJUSTES */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>4. Duración Estimada</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDurationMinutes(Math.max(30, durationMinutes - 30))}
                  className="w-7 h-7 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] font-bold text-[#161616] hover:bg-gray-200"
                >
                  -30m
                </button>
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#F5F5F4] border border-[#E5E5E3]">
                  {Math.floor(durationMinutes / 60)}h {durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setDurationMinutes(durationMinutes + 30)}
                  className="w-7 h-7 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] font-bold text-[#161616] hover:bg-gray-200"
                >
                  +30m
                </button>
              </div>
            </div>

            {/* Descuentos y Suciedad Extrema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#E5E5E3]">
              <div>
                <label className="text-[11px] font-semibold text-[#161616] block mb-1">Descuento aplicado</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DetailingDiscountType)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616]"
                >
                  <option value="none">Sin descuento</option>
                  <option value="combo_10">Combo 2 o más servicios (10%)</option>
                  <option value="special_15">Promo Especial (15%)</option>
                  <option value="fixed">Monto fijo en pesos</option>
                </select>
                {discountType === 'fixed' && (
                  <input
                    type="number"
                    value={fixedDiscountAmount}
                    onChange={(e) => setFixedDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Monto de descuento $"
                    className="mt-1 w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="dirt_check"
                  checked={hasExtremeDirt}
                  onChange={(e) => setHasExtremeDirt(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                />
                <label htmlFor="dirt_check" className="text-xs text-[#161616] font-medium cursor-pointer">
                  Recargo por suciedad extrema (+{formatCurrency(extremeDirtSurcharge, 'UYU')})
                </label>
              </div>
            </div>
          </div>

            {/* PASO 5: ORIGEN Y RESPONSABLE */}
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-3">
              <div>
                <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center justify-between mb-1">
                  <span>4. Origen del Contacto (Obligatorio) *</span>
                  {!origin && <span className="text-[10px] text-[#D7141A] font-semibold">Elegí una opción</span>}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {clientOrigins.map((ori) => {
                    const isSelected = origin === ori;
                    return (
                      <button
                        key={ori}
                        type="button"
                        onClick={() => setOrigin(ori)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          isSelected
                            ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                            : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-gray-400'
                        }`}
                      >
                        <div>{ori}</div>
                        {ori === 'Anuncios pagos' && (
                          <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-amber-300' : 'text-amber-700'}`}>
                            Romina 30% · Maxi 12.5%
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6B6B] block mb-1">Detailer responsable asignado</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-xs font-semibold text-[#161616]"
                >
                  {availableProfiles
                    .filter((p) => p.is_active && (p.businesses?.includes('detailing') || p.roles.includes('detailer') || p.roles.includes('admin')))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} {p.roles.includes('detailer') ? '(Detailer)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

          {/* PASO 6: AGENDAR O PRESUPUESTAR */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#161616] uppercase font-display tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>6. Agendar Turno en Taller</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleActive}
                  onChange={(e) => setScheduleActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                />
                <span className="text-xs font-bold text-[#161616]">Fijar fecha y box ahora</span>
              </label>
            </div>

            {scheduleActive && (
              <div className="space-y-3 pt-2 border-t border-[#E5E5E3] animate-fade-in">
                {/* Sugerencias de huecos libres */}
                {suggestedSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block mb-1">Próximos huecos libres disponibles:</span>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSlots.map((slot) => (
                        <button
                          key={slot.dateIso}
                          type="button"
                          onClick={() => setAppointmentDate(slot.dateIso)}
                          className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all ${
                            appointmentDate === slot.dateIso
                              ? 'bg-[#161616] text-white border-[#161616]'
                              : 'bg-[#F5F5F4] text-[#161616] border-[#E5E5E3] hover:border-[#D0D0CD]'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[#6B6B6B] block mb-1">Fecha y hora de inicio</label>
                    <input
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-xs font-bold text-[#161616]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#6B6B6B] block mb-1">Puesto de trabajo (Box)</label>
                    <select
                      value={workBayId}
                      onChange={(e) => setWorkBayId(e.target.value)}
                      className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-3 py-2 text-xs font-bold text-[#161616]"
                    >
                      {activeBays.map((bay) => (
                        <option key={bay.id} value={bay.id}>
                          {bay.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TOTAL FINAL */}
          <div className="bg-[#161616] text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400 block font-medium">TOTAL A COBRAR</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5 block">
                {formatCurrency(calculatedTotal, 'UYU')}
              </span>
              {discountAmount > 0 && (
                <span className="text-[11px] text-red-400">
                  Descuento: -{formatCurrency(discountAmount, 'UYU')}
                </span>
              )}
            </div>
            <div className="text-right text-[11px] text-gray-300">
              <div>Servicios: <strong className="text-white">{selectedServiceObjects.length}</strong></div>
              <div>Duración: <strong className="text-white">{Math.round(durationMinutes / 60)}h</strong></div>
            </div>
          </div>
        </div>

        {/* Botones de Acción (2 caminos claros) */}
        <div className="p-4 border-t border-[#E5E5E3] bg-white flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Camino 1: Solo Presupuesto */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSave('quote_only', false)}
              className="flex-1 sm:flex-none border-[#E5E5E3]"
            >
              <Save className="w-4 h-4 mr-1 text-[#6B6B6B]" />
              <span>Solo Presupuesto</span>
            </Button>

            {/* Camino 2: Agendar Turno (Acción principal roja) */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSave(scheduleActive ? 'schedule' : 'quote_only', false)}
              className="flex-1 sm:flex-none bg-[#D7141A] hover:bg-[#B80E14] text-white font-bold"
            >
              <Calendar className="w-4 h-4 mr-1" />
              <span>{scheduleActive ? 'Agendar Turno' : 'Guardar Trabajo'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

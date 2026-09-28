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
  CheckCircle2
} from 'lucide-react';
import {
  DetailingQuote,
  DetailingQuoteStatus,
  DetailingDiscountType,
  VehicleCategory,
  ClientOrigin
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency, normalizePlate } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingQuoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: DetailingQuote | null;
  onOpenWhatsApp?: (quote: DetailingQuote) => void;
}

export const DetailingQuoterModal: React.FC<DetailingQuoterModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onOpenWhatsApp
}) => {
  const {
    clients,
    vehicles,
    detailingTariffs,
    addDetailingQuote,
    updateDetailingQuote,
    updateDetailingQuoteStatus,
    addClient,
    addVehicle
  } = useData();

  const { profile } = useAuth();
  const { showToast } = useToast();

  // Escuchar tecla Escape para cerrar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Estados de Formulario
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // En caso de creación rápida en el momento
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [isNewVehicleMode, setIsNewVehicleMode] = useState(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleCategory, setNewVehicleCategory] = useState<VehicleCategory>('Chico');

  // Selección de servicios y montos
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<DetailingDiscountType>('none');
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState<number>(0);
  const [hasExtremeDirt, setHasExtremeDirt] = useState(false);
  const [extremeDirtSurcharge, setExtremeDirtSurcharge] = useState<number>(1500);

  // Metadatos
  const [origin, setOrigin] = useState<ClientOrigin | 'Llamada' | 'Form Web'>('WhatsApp');
  const [assignedTo, setAssignedTo] = useState<string>('user-maxi');
  const [estimatedTime, setEstimatedTime] = useState<string>('1 día');
  const [status, setStatus] = useState<DetailingQuoteStatus>('Por Cotizar');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [priorityZones, setPriorityZones] = useState('');

  // Fotos
  const [photoInput, setPhotoInput] = useState('');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  // Inicializar si estamos editando
  useEffect(() => {
    if (quoteToEdit) {
      setSelectedClientId(quoteToEdit.client_id || '');
      setSelectedVehicleId(quoteToEdit.vehicle_id || '');
      setSelectedServiceIds(quoteToEdit.selected_services.map((s) => s.serviceId));
      setDiscountType(quoteToEdit.discount_type || 'none');
      setFixedDiscountAmount(quoteToEdit.discount_amount || 0);
      setHasExtremeDirt(quoteToEdit.extreme_dirt_surcharge > 0);
      setExtremeDirtSurcharge(quoteToEdit.extreme_dirt_surcharge || 1500);
      setOrigin(quoteToEdit.origin);
      setAssignedTo(quoteToEdit.assigned_to || profile?.id || 'user-maxi');
      setEstimatedTime(quoteToEdit.estimated_time || '1 día');
      setStatus(quoteToEdit.status);
      setAppointmentDate(quoteToEdit.appointment_date || '');
      setNotes(quoteToEdit.notes || '');
      setPriorityZones(quoteToEdit.priority_zones || '');
      setPhotosBefore(quoteToEdit.photos_before || []);
      setPhotosAfter(quoteToEdit.photos_after || []);
      setIsNewClientMode(false);
      setIsNewVehicleMode(false);
    } else {
      // Valores por defecto para nueva cotización
      setSelectedClientId('');
      setSelectedVehicleId('');
      setSelectedServiceIds(['lavado_exterior', 'interior']);
      setDiscountType('none');
      setFixedDiscountAmount(0);
      setHasExtremeDirt(false);
      setExtremeDirtSurcharge(1500);
      setOrigin('WhatsApp');
      setAssignedTo(profile?.id || 'user-maxi');
      setEstimatedTime('1 día');
      setStatus('Por Cotizar');
      setAppointmentDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
      setNotes('');
      setPriorityZones('');
      setPhotosBefore([]);
      setPhotosAfter([]);
      setIsNewClientMode(false);
      setIsNewVehicleMode(false);
    }
  }, [quoteToEdit, profile, isOpen]);

  // Si se selecciona un vehículo existente, autodetectar su categoría
  const currentVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  const activeCategory: VehicleCategory = useMemo(() => {
    if (currentVehicle) return currentVehicle.category;
    if (isNewVehicleMode) return newVehicleCategory;
    return 'Chico';
  }, [currentVehicle, isNewVehicleMode, newVehicleCategory]);

  // Mapear categoría a key del tarifario ('chico' | 'mediano' | 'suv' | 'pickup' | 'moto')
  const categoryKey = useMemo(() => {
    switch (activeCategory) {
      case 'Mediano':
        return 'mediano';
      case 'SUV/Rural':
        return 'suv';
      case 'Pick-up':
        return 'pickup';
      case 'Moto':
        return 'moto';
      default:
        return 'chico';
    }
  }, [activeCategory]);

  // Cálculo en tiempo real de Subtotal, Descuentos y Total
  const { subtotal, discountAmount, calculatedTotal, selectedServiceObjects } = useMemo(() => {
    const serviceObjs = selectedServiceIds.map((id) => {
      const tariff = detailingTariffs.find((t) => t.id === id);
      const price = tariff ? tariff.prices[categoryKey] || 0 : 0;
      return {
        serviceId: id,
        serviceName: tariff?.name || tariff?.shortName || id,
        price
      };
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
  }, [selectedServiceIds, detailingTariffs, categoryKey, discountType, fixedDiscountAmount, hasExtremeDirt, extremeDirtSurcharge]);

  if (!isOpen) return null;

  const toggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  const handleAddPhoto = (type: 'before' | 'after') => {
    if (!photoInput.trim()) return;
    if (type === 'before') {
      setPhotosBefore([...photosBefore, photoInput.trim()]);
    } else {
      setPhotosAfter([...photosAfter, photoInput.trim()]);
    }
    setPhotoInput('');
  };

  const handleSave = (openWhatsAppAfterSave = false) => {
    // 1. Resolver Cliente
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
        notes: 'Creado desde Cotizador de Detailing'
      });
      finalClientId = res.client.id;
      finalClientName = res.client.full_name;
      finalClientPhone = res.client.phone;
    } else {
      const cli = clients.find((c) => c.id === selectedClientId);
      if (!cli) {
        showToast('Seleccioná un cliente existente o creá uno nuevo', 'error');
        return;
      }
      finalClientId = cli.id;
      finalClientName = cli.full_name;
      finalClientPhone = cli.phone;
    }

    // 2. Resolver Vehículo
    let finalVehicleId = selectedVehicleId;
    let finalVehicleInfo = '';
    let finalPlate = '';

    if (isNewVehicleMode) {
      if (!newVehicleBrand.trim() || !newVehicleModel.trim()) {
        showToast('Ingresá la marca y modelo del vehículo', 'error');
        return;
      }
      const plate = newVehiclePlate.trim() ? normalizePlate(newVehiclePlate.trim()) : `UY-${Math.floor(1000 + Math.random() * 9000)}`;
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
      }
    }

    if (selectedServiceObjects.length === 0) {
      showToast('Seleccioná al menos un servicio del tarifario', 'error');
      return;
    }

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
        estimated_time: estimatedTime,
        assigned_to: assignedTo,
        origin,
        notes,
        priority_zones: priorityZones,
        photos_before: photosBefore,
        photos_after: photosAfter
      });

      // Si cambió el estado
      if (quoteToEdit.status !== status) {
        updateDetailingQuoteStatus(quoteToEdit.id, status, {
          date: appointmentDate,
          assigned_to: assignedTo
        });
      }

      savedQuote = {
        ...quoteToEdit,
        client_name: finalClientName,
        client_phone: finalClientPhone,
        vehicle_info: finalVehicleInfo,
        total_amount: calculatedTotal,
        selected_services: selectedServiceObjects,
        status
      };

      showToast('Cotización actualizada', 'success');
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
        estimated_time: estimatedTime,
        assigned_to: assignedTo,
        origin,
        notes,
        priority_zones: priorityZones,
        status,
        appointment_date: status === 'Turno Confirmado' ? appointmentDate : undefined,
        photos_before: photosBefore,
        photos_after: photosAfter
      });

      // Si se crea directo como Turno Confirmado o Completado
      if (status !== 'Por Cotizar') {
        updateDetailingQuoteStatus(savedQuote.id, status, {
          date: appointmentDate,
          assigned_to: assignedTo
        });
      }

      showToast('Cotización creada exitosamente', 'success');
    }

    onClose();

    if (openWhatsAppAfterSave && onOpenWhatsApp) {
      onOpenWhatsApp(savedQuote);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E3] text-[#161616] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D7141A]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616] flex items-center gap-2">
                {quoteToEdit ? 'Editar cotización o trabajo' : 'Nueva cotización DetailVlak'}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Calculadora inteligente según categoría y tarifario oficial en $UYU.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors border border-[#E5E5E3] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* SECCIÓN 1: CLIENTE Y VEHÍCULO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
            {/* Cliente */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#161616] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Cliente</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewClientMode(!isNewClientMode)}
                  className="text-xs font-medium text-[#D7141A] hover:text-[#B80E14] cursor-pointer"
                >
                  {isNewClientMode ? 'Elegir existente' : '+ Crear nuevo'}
                </button>
              </div>

              {isNewClientMode ? (
                <div className="space-y-2 animate-fade-in">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Celular / WhatsApp (09X...)"
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                  />
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    const clientVehs = vehicles.filter((v) => v.client_id === e.target.value);
                    if (clientVehs.length > 0) {
                      setSelectedVehicleId(clientVehs[0].id);
                    }
                  }}
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Vehículo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#161616] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Vehículo</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewVehicleMode(!isNewVehicleMode)}
                  className="text-xs font-medium text-[#D7141A] hover:text-[#B80E14] cursor-pointer"
                >
                  {isNewVehicleMode ? 'Elegir existente' : '+ Crear nuevo'}
                </button>
              </div>

              {isNewVehicleMode ? (
                <div className="space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newVehicleBrand}
                      onChange={(e) => setNewVehicleBrand(e.target.value)}
                      placeholder="Marca (ej. Toyota)"
                      className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newVehicleModel}
                      onChange={(e) => setNewVehicleModel(e.target.value)}
                      placeholder="Modelo (ej. Corolla)"
                      className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      placeholder="Matrícula (opcional)"
                      className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-mono uppercase placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                    />
                    <select
                      value={newVehicleCategory}
                      onChange={(e) => setNewVehicleCategory(e.target.value as VehicleCategory)}
                      className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
                    >
                      <option value="Chico">Chico / Hatchback</option>
                      <option value="Mediano">Mediano / Sedán</option>
                      <option value="SUV/Rural">SUV / Rural</option>
                      <option value="Pick-up">Pick-up / Camioneta</option>
                      <option value="Moto">Moto</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Seleccionar vehículo --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} [{normalizePlate(v.plate)}] ({v.category})
                      </option>
                    ))}
                  </select>
                  {currentVehicle && (
                    <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                      <span>Categoría detectada:</span>
                      <span className="font-semibold text-[#161616] px-1.5 py-0.5 rounded bg-white border border-[#E5E5E3]">
                        {currentVehicle.category}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: SELECCIÓN DE SERVICIOS DEL TARIFARIO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#161616] flex items-center gap-2">
                <span>Servicios de detailing</span>
                <span className="text-[11px] font-normal text-[#6B6B6B]">
                  (Precios calculados para categoría: <strong className="text-[#161616]">{activeCategory}</strong>)
                </span>
              </h4>
              <span className="text-xs font-mono font-semibold text-[#161616]">
                Subtotal: {formatCurrency(subtotal, 'UYU')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detailingTariffs.map((t) => {
                const isSelected = selectedServiceIds.includes(t.id);
                const price = t.prices[categoryKey] || 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => toggleService(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-white border-[#D7141A] shadow-xs'
                        : 'bg-white border-[#E5E5E3] hover:border-[#D0D0CD]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 rounded text-[#D7141A] accent-[#D7141A] pointer-events-none"
                      />
                      <div>
                        <div className="font-semibold text-[#161616] leading-tight">{t.shortName || t.name}</div>
                        <p className="text-[11px] text-[#6B6B6B] line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#161616] shrink-0 text-right">
                      {formatCurrency(price, 'UYU')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: AJUSTES (DESCUENTO, RECARGO POR SUCIEDAD, TIEMPO) */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-4">
            <h4 className="text-xs font-bold text-[#161616]">
              Descuentos y recargos especiales
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Descuento */}
              <div>
                <label className="text-[11px] font-medium text-[#161616] block mb-1">
                  Descuento aplicado
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DetailingDiscountType)}
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
                >
                  <option value="none">Sin descuento</option>
                  <option value="combo_10">10% Combo promocional</option>
                  <option value="special_15">15% Cliente especial / Automotora</option>
                  <option value="fixed">Monto fijo personalizado</option>
                </select>

                {discountType === 'fixed' && (
                  <div className="mt-2 relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-[#9A9A9A] font-bold">$U</span>
                    <input
                      type="number"
                      value={fixedDiscountAmount}
                      onChange={(e) => setFixedDiscountAmount(Number(e.target.value))}
                      placeholder="Monto descuento"
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-8 pr-3 py-1.5 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Suciedad Extrema */}
              <div>
                <label className="text-[11px] font-medium text-[#161616] block mb-1">
                  Suciedad extrema o campo
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExtremeDirt}
                    onChange={(e) => setHasExtremeDirt(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D7141A] accent-[#D7141A]"
                  />
                  <span className="text-[#161616]">Aplicar recargo</span>
                </label>
                {hasExtremeDirt && (
                  <div className="mt-1.5 relative">
                    <span className="absolute left-2.5 top-2 text-[10px] text-[#9A9A9A] font-bold">$U</span>
                    <input
                      type="number"
                      value={extremeDirtSurcharge}
                      onChange={(e) => setExtremeDirtSurcharge(Number(e.target.value))}
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-8 pr-3 py-1.5 text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Tiempo Estimado */}
              <div>
                <label className="text-[11px] font-medium text-[#161616] block mb-1">
                  Tiempo estimado de trabajo
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Ej: 1 día, 8 horas"
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: ESTADO, ATENDIDO POR, Y AGENDA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3]">
            <div>
              <label className="text-[11px] font-medium text-[#161616] block mb-1">
                Estado del trabajo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DetailingQuoteStatus)}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-semibold focus:border-[#D7141A] focus:outline-none cursor-pointer"
              >
                <option value="Por Cotizar">Por Cotizar</option>
                <option value="Presupuesto Enviado">Presupuesto Enviado</option>
                <option value="Turno Confirmado">Turno Confirmado</option>
                <option value="Trabajo Completado">Trabajo Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#161616] block mb-1">
                Atendido por (Detailer)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
              >
                <option value="user-maxi">Maximiliano Irujo (Comisión 30%)</option>
                <option value="user-matias">Matías Pereyra</option>
                <option value="user-romina">Romina (Administración)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#161616] block mb-1">
                Origen de la consulta
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
              >
                <option value="Presencial">Presencial en taller</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Llamada">Llamada telefónica</option>
                <option value="Google Form">Google Form / Web</option>
              </select>
            </div>

            {status === 'Turno Confirmado' && (
              <div className="sm:col-span-3 pt-2 border-t border-[#E5E5E3] animate-fade-in">
                <label className="text-[11px] font-semibold text-[#161616] block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Fecha y hora del turno (Se reflejará en la agenda unificada)</span>
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full sm:w-80 bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* SECCIÓN 5: NOTAS Y FOTOS ANTES/DESPUÉS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#161616] block mb-1">
                Zonas a priorizar u observaciones
              </label>
              <textarea
                value={priorityZones}
                onChange={(e) => setPriorityZones(e.target.value)}
                placeholder="Ej: Techo con marcas de pájaros, capot con microrayones..."
                rows={2}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#161616] block mb-1">
                Notas internas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Comentarios adicionales para el equipo..."
                rows={2}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
              />
            </div>
          </div>

          {/* Resumen Final */}
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#6B6B6B] font-medium uppercase tracking-wider">
                Total presupuestado
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#161616] font-mono mt-0.5">
                {formatCurrency(calculatedTotal, 'UYU')}
              </div>
              {discountAmount > 0 && (
                <div className="text-[11px] text-[#D7141A]">
                  Descuento: -{formatCurrency(discountAmount, 'UYU')}
                </div>
              )}
            </div>

            <div className="text-right text-[11px] text-[#6B6B6B]">
              <div>Servicios: <strong className="text-[#161616]">{selectedServiceObjects.length}</strong></div>
              <div>Estimado: <strong className="text-[#161616]">{estimatedTime}</strong></div>
            </div>
          </div>

        </div>

        {/* Barra de Acciones */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5E3] bg-[#F5F5F4] flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSave(true)}
            >
              <MessageCircle className="w-4 h-4 text-[#1E6B43]" />
              <span>Guardar y enviar WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSave(false)}
            >
              <Save className="w-4 h-4" />
              <span>Guardar cotización</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

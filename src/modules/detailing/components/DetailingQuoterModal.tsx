import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Car,
  User,
  Phone,
  DollarSign,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Search,
  AlertCircle
} from 'lucide-react';
import {
  DetailingQuote,
  VehicleCategory,
  ClientOrigin,
  DetailingPayment
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  formatCurrency,
  normalizePlate,
  getLocalDateString
} from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';

interface DetailingQuoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: DetailingQuote | null;
  onOpenWhatsApp?: (quote: DetailingQuote) => void;
  initialDate?: string;
}

export const DetailingQuoterModal: React.FC<DetailingQuoterModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onOpenWhatsApp,
  initialDate
}) => {
  const {
    clients,
    vehicles,
    detailingTariffs,
    addDetailingQuote,
    updateDetailingQuote,
    addClient,
    addVehicle,
    detailingConfig,
    generateDetailingReceipt,
    recordDetailingPayment
  } = useData();

  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  const detailerProfiles = useMemo(() => {
    return availableProfiles.filter(
      (p) => p.is_active && p.businesses?.includes('detailing')
    );
  }, [availableProfiles]);

  const defaultProfileId = useMemo(() => {
    const romina = detailerProfiles.find((p) => p.full_name.toLowerCase().includes('romina'));
    if (romina) return romina.id;
    return profile?.id || detailerProfiles[0]?.id || '';
  }, [detailerProfiles, profile]);

  // Client State
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Vehicle State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleCategory, setNewVehicleCategory] = useState<VehicleCategory>('Mediano');

  // Work Date State
  const todayUY = getLocalDateString();
  const tomorrowUY = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  }, []);
  const [workDate, setWorkDate] = useState<string>(todayUY);

  // Services State (NO PRESELECTED SERVICES)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Origin State (MANDATORY & NO PRESELECTED)
  const [origin, setOrigin] = useState<string>('');

  // More Options State
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [discountType, setDiscountType] = useState<string>('none');
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0);
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Payment State ("¿Ya cobraste?")
  const [paymentOption, setPaymentOption] = useState<'none' | 'full' | 'partial'>('none');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitMethod2, setSplitMethod2] = useState<string>('Transferencia');
  const [splitAmount1, setSplitAmount1] = useState<number>(0);
  const [splitAmount2, setSplitAmount2] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Init form
  useEffect(() => {
    if (quoteToEdit) {
      setSelectedClientId(quoteToEdit.client_id || '');
      setSelectedVehicleId(quoteToEdit.vehicle_id || '');
      setWorkDate(quoteToEdit.work_date || todayUY);
      setSelectedServiceIds(quoteToEdit.selected_services.map((s) => s.serviceId));
      setOrigin(quoteToEdit.origin || '');
      setDiscountType(quoteToEdit.discount_type || 'none');
      setCustomDiscountAmount(quoteToEdit.discount_amount || 0);
      setSurchargeAmount(quoteToEdit.extreme_dirt_surcharge || 0);
      setAssignedTo(quoteToEdit.assigned_to || defaultProfileId);
      setNotes(quoteToEdit.notes || '');

      if (quoteToEdit.commission_participants && quoteToEdit.commission_participants.length > 0) {
        setSelectedParticipantIds(quoteToEdit.commission_participants.map((p) => p.employee_id));
      } else {
        const defaults = detailingConfig?.commission_config?.default_participants || [];
        setSelectedParticipantIds(defaults.length > 0 ? defaults : [defaultProfileId]);
      }

      setPaymentOption('none');
      setIsCreatingClient(false);
      setIsCreatingVehicle(false);
      setShowMoreOptions(false);
    } else {
      setSelectedClientId('');
      setSelectedVehicleId('');
      setWorkDate(initialDate || todayUY);
      setSelectedServiceIds([]); // No preselected
      setOrigin(''); // Mandatory & no preselected
      setDiscountType('none');
      setCustomDiscountAmount(0);
      setSurchargeAmount(0);
      setAssignedTo(defaultProfileId);

      const defaults = detailingConfig?.commission_config?.default_participants || [];
      setSelectedParticipantIds(defaults.length > 0 ? defaults : [defaultProfileId]);
      setNotes('');

      const lastMethod = localStorage.getItem('carvlak_last_detailing_payment_method') || 'Efectivo';
      setPaymentMethod(lastMethod);
      setPaymentOption('none');
      setIsSplitPayment(false);
      setIsCreatingClient(false);
      setIsCreatingVehicle(false);
      setShowMoreOptions(false);
    }
  }, [quoteToEdit, isOpen, initialDate, defaultProfileId, detailingConfig]);

  // Client's vehicles
  const clientVehicles = useMemo(() => {
    if (!selectedClientId) return [];
    return vehicles.filter((v) => v.client_id === selectedClientId && !v.is_archived);
  }, [vehicles, selectedClientId]);

  // Preselect client's vehicle if available
  useEffect(() => {
    if (selectedClientId && !selectedVehicleId && !isCreatingVehicle) {
      if (clientVehicles.length > 0) {
        setSelectedVehicleId(clientVehicles[0].id);
      }
    }
  }, [selectedClientId, selectedVehicleId, clientVehicles, isCreatingVehicle]);

  // Active Vehicle Category
  const activeCategory: VehicleCategory = useMemo(() => {
    if (isCreatingVehicle) return newVehicleCategory;
    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    return veh?.category || 'Mediano';
  }, [vehicles, selectedVehicleId, isCreatingVehicle, newVehicleCategory]);

  const categoryPriceKey = useMemo(() => {
    switch (activeCategory) {
      case 'Mediano': return 'mediano';
      case 'SUV/Rural': return 'suv';
      case 'Pick-up': return 'pickup';
      case 'Moto': return 'moto';
      default: return 'chico';
    }
  }, [activeCategory]);

  // Client search results
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return [];
    const term = clientSearchTerm.toLowerCase();
    return clients.filter((c) => {
      const matchName = c.full_name.toLowerCase().includes(term);
      const matchPhone = (c.phone || '').includes(term);
      const matchVehPlate = vehicles.some(
        (v) => v.client_id === c.id && v.plate.toLowerCase().includes(term)
      );
      return matchName || matchPhone || matchVehPlate;
    }).slice(0, 5);
  }, [clients, vehicles, clientSearchTerm]);

  // Calculate pricing
  const subtotal = useMemo(() => {
    return selectedServiceIds.reduce((sum, sid) => {
      const tariff = detailingTariffs.find((t) => t.id === sid);
      if (!tariff) return sum;
      const price = tariff.prices[categoryPriceKey] || tariff.prices.chico || 0;
      return sum + price;
    }, 0);
  }, [selectedServiceIds, detailingTariffs, categoryPriceKey]);

  const discountValue = useMemo(() => {
    if (discountType === 'none') return 0;
    const cfgDisc = detailingConfig?.discounts?.find((d) => d.id === discountType);
    if (cfgDisc) {
      if (cfgDisc.percentage > 0) {
        return Math.round(subtotal * (cfgDisc.percentage / 100));
      }
      return cfgDisc.amount || 0;
    }
    return customDiscountAmount;
  }, [discountType, detailingConfig, subtotal, customDiscountAmount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountValue + surchargeAmount);
  }, [subtotal, discountValue, surchargeAmount]);

  // Keep split payment amounts updated
  useEffect(() => {
    if (paymentOption === 'full') {
      if (isSplitPayment) {
        const half = Math.round(totalAmount / 2);
        setSplitAmount1(half);
        setSplitAmount2(totalAmount - half);
      }
    } else if (paymentOption === 'partial') {
      if (partialAmount > totalAmount) setPartialAmount(totalAmount);
    }
  }, [paymentOption, isSplitPayment, totalAmount]);

  // Commission preview per participant based on origin
  const commissionPreview = useMemo(() => {
    if (!origin) return [];
    const originNorm = origin.trim().toLowerCase();
    const isAds = originNorm.includes('anuncio') || originNorm.includes('anuncios pagos');

    return selectedParticipantIds.map((pid) => {
      const p = availableProfiles.find((prof) => prof.id === pid);
      const name = p ? p.full_name.split(' ')[0] : 'Colaborador';
      let pct = 30;
      if (p?.full_name.toLowerCase().includes('maxi') && isAds) {
        pct = 12.5;
      }
      const amt = Math.round(totalAmount * (pct / 100));
      return { id: pid, name, pct, amt };
    });
  }, [origin, selectedParticipantIds, availableProfiles, totalAmount]);

  // Available origins from config
  const availableOrigins: ClientOrigin[] = (detailingConfig?.client_origins || detailingConfig?.origins) && (detailingConfig?.client_origins || detailingConfig?.origins)!.length > 0
    ? (detailingConfig.client_origins || detailingConfig.origins)! as ClientOrigin[]
    : ['WhatsApp', 'Instagram', 'Referido', 'Presencial', 'Anuncios pagos', 'Google Form'];

  // Available payment methods from config
  const availableMethods = detailingConfig?.payment_methods || [
    'Efectivo',
    'Transferencia Bancaria',
    'Mercado Pago',
    'Tarjeta de Débito',
    'Tarjeta de Crédito'
  ];

  const handleToggleService = (sid: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const handleSave = async (andShareReceipt = false) => {
    if (isSubmitting) return;

    // 1. Validar Cliente
    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientPhone = '';

    if (isCreatingClient) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        showToast('Completá el nombre y teléfono del cliente', 'error');
        return;
      }
      const createdClient = addClient({
        full_name: newClientName.trim(),
        phone: newClientPhone.trim(),
        origin: (origin as ClientOrigin) || 'WhatsApp'
      });
      finalClientId = createdClient.client.id;
      finalClientName = createdClient.client.full_name;
      finalClientPhone = createdClient.client.phone;
    } else {
      const c = clients.find((client) => client.id === selectedClientId);
      if (!c) {
        showToast('Seleccioná o creá un cliente', 'error');
        return;
      }
      finalClientId = c.id;
      finalClientName = c.full_name;
      finalClientPhone = c.phone;
    }

    // 2. Validar Vehículo
    let finalVehicleId = selectedVehicleId;
    let finalVehicleInfo = '';
    let finalVehiclePlate = '';
    let finalCategory = activeCategory;

    if (isCreatingVehicle) {
      if (!newVehicleBrand.trim() || !newVehicleModel.trim()) {
        showToast('Completá la marca y modelo del vehículo', 'error');
        return;
      }
      const createdVeh = addVehicle({
        brand: newVehicleBrand.trim(),
        model: newVehicleModel.trim(),
        plate: newVehiclePlate ? normalizePlate(newVehiclePlate) : '',
        category: newVehicleCategory,
        ownership: 'client',
        client_id: finalClientId,
        year: new Date().getFullYear(),
        color: 'A definir',
        mileage: 0,
        photos: []
      });
      finalVehicleId = createdVeh.vehicle.id;
      finalVehicleInfo = `${createdVeh.vehicle.brand} ${createdVeh.vehicle.model}`;
      finalVehiclePlate = createdVeh.vehicle.plate || '';
      finalCategory = createdVeh.vehicle.category;
    } else {
      const v = vehicles.find((veh) => veh.id === selectedVehicleId);
      if (!v) {
        showToast('Seleccioná o agregá un vehículo', 'error');
        return;
      }
      finalVehicleId = v.id;
      finalVehicleInfo = `${v.brand} ${v.model}`;
      finalVehiclePlate = v.plate || '';
      finalCategory = v.category;
    }

    // 3. Validar Servicios
    if (selectedServiceIds.length === 0) {
      showToast('Seleccioná al menos un servicio del tarifario', 'error');
      return;
    }

    // 4. Validar Origen (OBLIGATORIO)
    if (!origin) {
      showToast('El origen del cliente es obligatorio', 'error');
      return;
    }

    // Preparar servicios formateados
    const selectedServicesFormatted = selectedServiceIds.map((sid) => {
      const tariff = detailingTariffs.find((t) => t.id === sid);
      const price = tariff?.prices[categoryPriceKey] || tariff?.prices.chico || 0;
      return {
        serviceId: sid,
        serviceName: tariff?.name || 'Servicio',
        name: tariff?.name || 'Servicio',
        category: finalCategory,
        price
      };
    });

    // Preparar pagos iniciales si se cargaron en el formulario
    const nowIso = new Date().toISOString();
    const initialPayments: DetailingPayment[] = [];

    if (paymentOption === 'full') {
      if (isSplitPayment) {
        if (splitAmount1 > 0) {
          initialPayments.push({
            id: `pay-${crypto.randomUUID()}`,
            quote_id: quoteToEdit?.id || '',
            amount: splitAmount1,
            method: paymentMethod,
            date: workDate,
            created_at: nowIso,
            is_voided: false
          });
        }
        if (splitAmount2 > 0) {
          initialPayments.push({
            id: `pay-${crypto.randomUUID()}`,
            quote_id: quoteToEdit?.id || '',
            amount: splitAmount2,
            method: splitMethod2,
            date: workDate,
            created_at: nowIso,
            is_voided: false
          });
        }
      } else {
        initialPayments.push({
          id: `pay-${crypto.randomUUID()}`,
          quote_id: quoteToEdit?.id || '',
          amount: totalAmount,
          method: paymentMethod,
          date: workDate,
          created_at: nowIso,
          is_voided: false
        });
      }
      localStorage.setItem('carvlak_last_detailing_payment_method', paymentMethod);
    } else if (paymentOption === 'partial' && partialAmount > 0) {
      initialPayments.push({
        id: `pay-${crypto.randomUUID()}`,
        quote_id: quoteToEdit?.id || '',
        amount: partialAmount,
        method: paymentMethod,
        date: workDate,
        created_at: nowIso,
        is_voided: false
      });
      localStorage.setItem('carvlak_last_detailing_payment_method', paymentMethod);
    }

    const payload: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'> = {
      work_date: workDate,
      client_id: finalClientId,
      client_name: finalClientName,
      client_phone: finalClientPhone,
      vehicle_id: finalVehicleId,
      vehicle_info: finalVehicleInfo,
      vehicle_plate: finalVehiclePlate,
      vehicle_category: finalCategory,
      selected_services: selectedServicesFormatted,
      subtotal: subtotal,
      discount_type: discountType as any,
      discount_amount: discountValue,
      extreme_dirt_surcharge: surchargeAmount,
      total_amount: totalAmount,
      origin: origin as ClientOrigin,
      assigned_to: assignedTo || defaultProfileId,
      commission_participants: selectedParticipantIds.map((pid) => {
        const p = availableProfiles.find((prof) => prof.id === pid);
        return {
          employee_id: pid,
          employee_name: p ? p.full_name : 'Colaborador',
          rate: origin.toLowerCase().includes('anuncio') && p?.full_name.toLowerCase().includes('maxi')
            ? 12.5
            : 30
        };
      }),
      notes: notes.trim(),
      payments: quoteToEdit ? [...(quoteToEdit.payments || []), ...initialPayments] : initialPayments
    };

    try {
      setIsSubmitting(true);
      let savedQuote: DetailingQuote;

      if (quoteToEdit) {
        updateDetailingQuote(quoteToEdit.id, payload);
        savedQuote = { ...quoteToEdit, ...payload };
        showToast('Trabajo actualizado correctamente', 'success');
      } else {
        savedQuote = addDetailingQuote(payload);
        showToast('Trabajo registrado con éxito', 'success');
      }

      // Si se indicó "Guardar y enviar comprobante"
      if (andShareReceipt) {
        const rcpt = await generateDetailingReceipt(savedQuote.id);
        if (rcpt && onOpenWhatsApp) {
          onOpenWhatsApp(savedQuote);
        }
      }

      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Error al guardar el trabajo', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyPaidNow = paymentOption === 'full' || (quoteToEdit && (quoteToEdit.payments || []).reduce((acc, p) => acc + (p.amount || 0), 0) >= totalAmount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-[#D7141A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#161616]">
                {quoteToEdit ? 'Editar trabajo' : 'Nuevo trabajo'}
              </h3>
              <p className="text-[11px] text-[#6B6B6B]">Registro contable de trabajo confirmado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* 1. CLIENTE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#161616] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D7141A]" />
                1. Cliente
              </span>
              {!isCreatingClient && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingClient(true);
                    setSelectedClientId('');
                  }}
                  className="text-[11px] font-bold text-[#D7141A] hover:underline cursor-pointer"
                >
                  + Crear cliente
                </button>
              )}
            </label>

            {isCreatingClient ? (
              <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#161616]">Nuevo cliente</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingClient(false)}
                    className="text-[11px] text-[#6B6B6B] hover:underline cursor-pointer"
                  >
                    Buscar existente
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Teléfono / WhatsApp *"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9A9A9A]" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o matrícula..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-8 pr-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                  />
                </div>

                {filteredClients.length > 0 && (
                  <div className="border border-[#E5E5E3] rounded-xl overflow-hidden divide-y divide-[#E5E5E3] bg-white shadow-xs">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setClientSearchTerm('');
                        }}
                        className={`w-full p-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                          selectedClientId === c.id ? 'bg-red-50' : 'hover:bg-[#F5F5F4]'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-[#161616]">{c.full_name}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{c.phone}</p>
                        </div>
                        {selectedClientId === c.id && <Check className="w-4 h-4 text-[#D7141A]" />}
                      </button>
                    ))}
                  </div>
                )}

                {selectedClientId && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-900">
                        {clients.find((c) => c.id === selectedClientId)?.full_name}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        {clients.find((c) => c.id === selectedClientId)?.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedClientId('')}
                      className="text-[10px] text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. AUTO */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#161616] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#D7141A]" />
                2. Auto del cliente
              </span>
              {!isCreatingVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingVehicle(true);
                    setSelectedVehicleId('');
                  }}
                  className="text-[11px] font-bold text-[#D7141A] hover:underline cursor-pointer"
                >
                  + Cargar otro auto
                </button>
              )}
            </label>

            {isCreatingVehicle ? (
              <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#161616]">Nuevo auto</span>
                  {clientVehicles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingVehicle(false)}
                      className="text-[11px] text-[#6B6B6B] hover:underline cursor-pointer"
                    >
                      Elegir del cliente
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Marca *"
                    value={newVehicleBrand}
                    onChange={(e) => setNewVehicleBrand(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Modelo *"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Matrícula (opcional)"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  />
                  <select
                    value={newVehicleCategory}
                    onChange={(e) => setNewVehicleCategory(e.target.value as VehicleCategory)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  >
                    <option value="Chico">Chico</option>
                    <option value="Mediano">Mediano</option>
                    <option value="SUV/Rural">SUV/Rural</option>
                    <option value="Pick-up">Pick-up</option>
                    <option value="Moto">Moto</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                {clientVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clientVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedVehicleId === v.id
                            ? 'bg-red-50 border-[#D7141A] text-[#D7141A]'
                            : 'bg-white border-[#E5E5E3] text-[#161616] hover:border-[#161616]'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{v.brand} {v.model}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{v.category}</p>
                        </div>
                        {v.plate ? (
                          <UruguayanPlate plate={v.plate} size="sm" />
                        ) : (
                          <span className="text-[10px] text-[#6B6B6B] italic">Sin chapa</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#F5F5F4] rounded-xl border border-dashed border-[#E5E5E3] text-center">
                    <p className="text-xs text-[#6B6B6B] mb-1.5">El cliente no tiene autos guardados</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setIsCreatingVehicle(true)}
                    >
                      + Cargar auto
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. FECHA DEL TRABAJO */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D7141A]" />
              3. Fecha del trabajo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWorkDate(todayUY)}
                className={`py-2 px-3 rounded-xl font-bold border text-xs transition-colors cursor-pointer ${
                  workDate === todayUY
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setWorkDate(tomorrowUY)}
                className={`py-2 px-3 rounded-xl font-bold border text-xs transition-colors cursor-pointer ${
                  workDate === tomorrowUY
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                Mañana
              </button>
              <div className="relative">
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className={`w-full py-1.5 px-2 rounded-xl font-mono text-xs border text-center cursor-pointer focus:outline-none ${
                    workDate !== todayUY && workDate !== tomorrowUY
                      ? 'bg-red-50 border-[#D7141A] text-[#D7141A] font-bold'
                      : 'bg-white border-[#E5E5E3] text-[#161616]'
                  }`}
                />
              </div>
            </div>
            {workDate > todayUY && (
              <span className="inline-block text-[10px] bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
                Programado (fecha futura)
              </span>
            )}
          </div>

          {/* 4. SERVICIOS (Chips con precio según categoría) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#161616] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
                4. Servicios ({activeCategory})
              </span>
              <span className="text-[11px] font-bold text-[#D7141A]">
                {formatCurrency(subtotal)}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              {detailingTariffs.map((t) => {
                const isSelected = selectedServiceIds.includes(t.id);
                const price = t.prices[categoryPriceKey] || t.prices.chico || 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleService(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-50 border-[#D7141A] text-[#161616]'
                        : 'bg-white border-[#E5E5E3] text-[#161616] hover:border-[#161616]'
                    }`}
                  >
                    <span className="font-bold leading-tight">{t.name}</span>
                    <span className={`text-[11px] font-mono mt-1 ${isSelected ? 'font-bold text-[#D7141A]' : 'text-[#6B6B6B]'}`}>
                      {formatCurrency(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. ORIGEN DEL CLIENTE (Obligatorio, sin valor previo, con preview de comisión) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#161616] flex items-center justify-between">
              <span>5. Origen del cliente *</span>
              {!origin && <span className="text-[10px] text-[#D7141A] font-bold">Obligatorio</span>}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {availableOrigins.map((orig) => {
                const isSelected = origin === orig;
                const isAds = orig.toLowerCase().includes('anuncio');
                return (
                  <button
                    key={orig}
                    type="button"
                    onClick={() => setOrigin(orig)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                        : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                    }`}
                  >
                    <p className="font-bold text-xs">{orig}</p>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-[#6B6B6B]'}`}>
                      {isAds ? 'Romina 30% · Maxi 12.5%' : 'Romina 30% · Maxi 30%'}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Preview de comisiones */}
            {origin && commissionPreview.length > 0 && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-900">Comisiones estimadas:</span>
                <div className="flex items-center gap-2 font-mono">
                  {commissionPreview.map((c) => (
                    <span key={c.id} className="text-emerald-800 font-bold">
                      {c.name}: {c.pct}% ({formatCurrency(c.amt)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 6. MÁS OPCIONES (Desplegable) */}
          <div className="border border-[#E5E5E3] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full p-3 bg-[#F5F5F4] flex items-center justify-between font-bold text-xs text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span>6. Más opciones (descuentos, recargos, responsable, notas)</span>
              {showMoreOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMoreOptions && (
              <div className="p-3 bg-white space-y-3 border-t border-[#E5E5E3]">
                {/* Descuentos */}
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Descuento
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  >
                    <option value="none">Sin descuento</option>
                    {(detailingConfig?.discounts || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label || d.name} {d.percentage > 0 ? `(${d.percentage}%)` : d.amount ? `($${d.amount})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recargo */}
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Recargo por suciedad extrema o adicional ($UYU)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={surchargeAmount || ''}
                    onChange={(e) => setSurchargeAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1.5 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  />
                </div>

                {/* Quién lo hizo */}
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    ¿Quién realizó o realiza el trabajo?
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  >
                    {detailerProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participantes de comisión */}
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Participantes de comisión
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {detailerProfiles.map((p) => {
                      const isPart = selectedParticipantIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedParticipantIds((prev) =>
                              prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            isPart
                              ? 'bg-red-50 border-[#D7141A] text-[#D7141A]'
                              : 'bg-white border-[#E5E5E3] text-[#6B6B6B]'
                          }`}
                        >
                          {p.full_name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="text-[11px] font-medium text-[#161616] block mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles específicos..."
                    className="w-full bg-white border border-[#E5E5E3] rounded-lg p-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. COBRO (Opcional en el mismo paso) */}
          <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#161616] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#D7141A]" />
                7. ¿Ya cobraste?
              </span>
              <span className="text-xs font-bold font-mono text-[#161616]">
                Total: {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentOption('full')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  paymentOption === 'full'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                Sí, total
                <span className="block text-[10px] font-normal opacity-90">{formatCurrency(totalAmount)}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentOption('partial');
                  setPartialAmount(Math.round(totalAmount / 2));
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  paymentOption === 'partial'
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                Parcial
                <span className="block text-[10px] font-normal opacity-90">Seña</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentOption('none')}
                className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                  paymentOption === 'none'
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                Todavía no
                <span className="block text-[10px] font-normal opacity-90">Pendiente</span>
              </button>
            </div>

            {/* Opciones cuando se cobra */}
            {paymentOption !== 'none' && (
              <div className="p-3 bg-white rounded-lg border border-[#E5E5E3] space-y-2 mt-2">
                {paymentOption === 'partial' && (
                  <div>
                    <label className="text-[11px] font-medium text-[#161616] block mb-1">
                      Monto cobrado ($UYU)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={totalAmount}
                      value={partialAmount || ''}
                      onChange={(e) => setPartialAmount(Number(e.target.value))}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    />
                  </div>
                )}

                {paymentOption === 'full' && (
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-[#6B6B6B]">¿Pago dividido?</span>
                    <button
                      type="button"
                      onClick={() => setIsSplitPayment(!isSplitPayment)}
                      className="text-xs font-bold text-[#D7141A] hover:underline cursor-pointer"
                    >
                      {isSplitPayment ? 'Pago simple' : '+ Dividir en 2 medios'}
                    </button>
                  </div>
                )}

                {!isSplitPayment ? (
                  <div>
                    <label className="text-[11px] font-medium text-[#161616] block mb-1">
                      Medio de pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
                    >
                      {availableMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-[#E5E5E3]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#6B6B6B] block">Monto 1</label>
                        <input
                          type="number"
                          value={splitAmount1 || ''}
                          onChange={(e) => setSplitAmount1(Number(e.target.value))}
                          className="w-full border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6B6B6B] block">Medio 1</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full border border-[#E5E5E3] rounded-lg px-1 py-1 text-xs"
                        >
                          {availableMethods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#6B6B6B] block">Monto 2</label>
                        <input
                          type="number"
                          value={splitAmount2 || ''}
                          onChange={(e) => setSplitAmount2(Number(e.target.value))}
                          className="w-full border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6B6B6B] block">Medio 2</label>
                        <select
                          value={splitMethod2}
                          onChange={(e) => setSplitMethod2(e.target.value)}
                          className="w-full border border-[#E5E5E3] rounded-lg px-1 py-1 text-xs"
                        >
                          {availableMethods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E5E3] bg-[#F5F5F4] flex items-center justify-between gap-2">
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant={isFullyPaidNow ? 'secondary' : 'primary'}
              size="md"
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>

            {isFullyPaidNow && (
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                className="bg-[#D7141A] hover:bg-[#b01015]"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Guardar y comprobante
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

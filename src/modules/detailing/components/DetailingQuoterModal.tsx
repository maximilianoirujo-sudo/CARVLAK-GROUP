import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  Car,
  User,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Search,
  AlertCircle,
  RotateCcw
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
  getLocalDateString,
  getOriginCommissionRates
} from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';
import { ModalErrorBoundary } from '../../../components/ui/ModalErrorBoundary';

const DRAFT_STORAGE_KEY = 'carvlak_draft_particular_job';

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
    syncRecordsToCloud
  } = useData();

  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  const detailerProfiles = useMemo(() => {
    return (availableProfiles || []).filter(
      (p) => p && p.is_active && p.businesses?.includes('detailing')
    );
  }, [availableProfiles]);

  const defaultProfileId = useMemo(() => {
    const romina = detailerProfiles.find((p) => String(p.full_name || '').toLowerCase().includes('romina'));
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
  const [rominaCommissionOverride, setRominaCommissionOverride] = useState<number | null>(null);
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDraftData, setSavedDraftData] = useState<any | null>(null);

  // Ref to ensure form initializes ONLY ONCE per open session
  const initializedKeyRef = useRef<string | null>(null);
  // Ref to prevent duplicate quote creation if cloud sync fails and user retries
  const createdQuoteRef = useRef<DetailingQuote | null>(null);

  // Init form ONLY ONCE when modal opens
  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      createdQuoteRef.current = null;
      setSaveError(null);
      return;
    }

    const sessionKey = quoteToEdit ? `edit:${quoteToEdit.id}` : 'new';
    if (initializedKeyRef.current === sessionKey) {
      // Already initialized for this open modal session — do NOT reset on background sync!
      return;
    }
    initializedKeyRef.current = sessionKey;
    setSaveError(null);

    if (quoteToEdit) {
      setSelectedClientId(quoteToEdit.client_id || '');
      setSelectedVehicleId(quoteToEdit.vehicle_id || '');
      setWorkDate(quoteToEdit.work_date || todayUY);
      setSelectedServiceIds((quoteToEdit.selected_services || []).map((s) => s.serviceId));
      setOrigin(quoteToEdit.origin || '');
      setDiscountType(quoteToEdit.discount_type || 'none');
      setCustomDiscountAmount(quoteToEdit.discount_amount || 0);
      setSurchargeAmount(quoteToEdit.extreme_dirt_surcharge || 0);
      setAssignedTo(quoteToEdit.assigned_to || defaultProfileId);
      setNotes(quoteToEdit.notes || '');

      if (quoteToEdit.commission_participants && quoteToEdit.commission_participants.length > 0) {
        setSelectedParticipantIds(quoteToEdit.commission_participants.map((p) => p.employee_id));
        const rominaPart = quoteToEdit.commission_participants.find(
          (p) => p.employee_id === 'user-romina' || String(p.employee_name || '').toLowerCase().includes('romina')
        );
        if (rominaPart && typeof rominaPart.rate === 'number') {
          setRominaCommissionOverride(rominaPart.rate);
        } else {
          setRominaCommissionOverride(null);
        }
      } else {
        const defaults = detailingConfig?.commission_config?.default_participants || [];
        setSelectedParticipantIds(defaults.length > 0 ? defaults : [defaultProfileId]);
        setRominaCommissionOverride(null);
      }

      setPaymentOption('none');
      setIsCreatingClient(false);
      setIsCreatingVehicle(false);
      setShowMoreOptions(false);
      setSavedDraftData(null);
    } else {
      setSelectedClientId('');
      setSelectedVehicleId('');
      setClientSearchTerm('');
      setNewClientName('');
      setNewClientPhone('');
      setNewVehicleBrand('');
      setNewVehicleModel('');
      setNewVehiclePlate('');
      setNewVehicleCategory('Mediano');
      setWorkDate(initialDate || todayUY);
      setSelectedServiceIds([]);
      setOrigin('');
      setDiscountType('none');
      setCustomDiscountAmount(0);
      setSurchargeAmount(0);
      setAssignedTo(defaultProfileId);

      const defaults = detailingConfig?.commission_config?.default_participants || [];
      setSelectedParticipantIds(defaults.length > 0 ? defaults : [defaultProfileId]);
      setRominaCommissionOverride(null);
      setNotes('');

      const lastMethod = localStorage.getItem('carvlak_last_detailing_payment_method') || 'Efectivo';
      setPaymentMethod(lastMethod);
      setPaymentOption('none');
      setIsSplitPayment(false);
      setIsCreatingClient(false);
      setIsCreatingVehicle(false);
      setShowMoreOptions(false);

      // Check if there is a draft in sessionStorage
      try {
        const rawDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (
            parsed &&
            (parsed.selectedClientId ||
              parsed.newClientName ||
              parsed.newClientPhone ||
              parsed.newVehicleBrand ||
              parsed.newVehicleModel ||
              (Array.isArray(parsed.selectedServiceIds) && parsed.selectedServiceIds.length > 0) ||
              parsed.origin ||
              parsed.notes)
          ) {
            setSavedDraftData(parsed);
          } else {
            setSavedDraftData(null);
          }
        } else {
          setSavedDraftData(null);
        }
      } catch {
        setSavedDraftData(null);
      }
    }
  }, [isOpen, quoteToEdit, initialDate, todayUY, defaultProfileId, detailingConfig]);

  // Save draft automatically to sessionStorage when editing a new job
  const hasUnsavedChanges = useMemo(() => {
    if (quoteToEdit) return false;
    return Boolean(
      selectedClientId ||
      newClientName.trim() ||
      newClientPhone.trim() ||
      newVehicleBrand.trim() ||
      newVehicleModel.trim() ||
      newVehiclePlate.trim() ||
      selectedServiceIds.length > 0 ||
      origin ||
      notes.trim()
    );
  }, [
    quoteToEdit,
    selectedClientId,
    newClientName,
    newClientPhone,
    newVehicleBrand,
    newVehicleModel,
    newVehiclePlate,
    selectedServiceIds,
    origin,
    notes
  ]);

  useEffect(() => {
    if (!isOpen || quoteToEdit) return;
    if (!hasUnsavedChanges) return;
    try {
      const draftPayload = {
        selectedClientId,
        isCreatingClient,
        newClientName,
        newClientPhone,
        selectedVehicleId,
        isCreatingVehicle,
        newVehicleBrand,
        newVehicleModel,
        newVehiclePlate,
        newVehicleCategory,
        workDate,
        selectedServiceIds,
        origin,
        discountType,
        customDiscountAmount,
        surchargeAmount,
        assignedTo,
        selectedParticipantIds,
        rominaCommissionOverride,
        notes,
        paymentOption,
        partialAmount,
        paymentMethod
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch {
      // Ignore sessionStorage quota errors
    }
  }, [
    isOpen,
    quoteToEdit,
    hasUnsavedChanges,
    selectedClientId,
    isCreatingClient,
    newClientName,
    newClientPhone,
    selectedVehicleId,
    isCreatingVehicle,
    newVehicleBrand,
    newVehicleModel,
    newVehiclePlate,
    newVehicleCategory,
    workDate,
    selectedServiceIds,
    origin,
    discountType,
    customDiscountAmount,
    surchargeAmount,
    assignedTo,
    selectedParticipantIds,
    rominaCommissionOverride,
    notes,
    paymentOption,
    partialAmount,
    paymentMethod
  ]);

  const handleRestoreDraft = () => {
    if (!savedDraftData) return;
    setSelectedClientId(savedDraftData.selectedClientId || '');
    setIsCreatingClient(Boolean(savedDraftData.isCreatingClient));
    setNewClientName(savedDraftData.newClientName || '');
    setNewClientPhone(savedDraftData.newClientPhone || '');
    setSelectedVehicleId(savedDraftData.selectedVehicleId || '');
    setIsCreatingVehicle(Boolean(savedDraftData.isCreatingVehicle));
    setNewVehicleBrand(savedDraftData.newVehicleBrand || '');
    setNewVehicleModel(savedDraftData.newVehicleModel || '');
    setNewVehiclePlate(savedDraftData.newVehiclePlate || '');
    setNewVehicleCategory(savedDraftData.newVehicleCategory || 'Mediano');
    if (savedDraftData.workDate) setWorkDate(savedDraftData.workDate);
    if (Array.isArray(savedDraftData.selectedServiceIds)) setSelectedServiceIds(savedDraftData.selectedServiceIds);
    setOrigin(savedDraftData.origin || '');
    setDiscountType(savedDraftData.discountType || 'none');
    setCustomDiscountAmount(Number(savedDraftData.customDiscountAmount) || 0);
    setSurchargeAmount(Number(savedDraftData.surchargeAmount) || 0);
    if (savedDraftData.assignedTo) setAssignedTo(savedDraftData.assignedTo);
    if (Array.isArray(savedDraftData.selectedParticipantIds) && savedDraftData.selectedParticipantIds.length > 0) {
      setSelectedParticipantIds(savedDraftData.selectedParticipantIds);
    }
    if (savedDraftData.rominaCommissionOverride !== undefined) {
      setRominaCommissionOverride(savedDraftData.rominaCommissionOverride);
    }
    setNotes(savedDraftData.notes || '');
    if (savedDraftData.paymentOption) setPaymentOption(savedDraftData.paymentOption);
    if (savedDraftData.partialAmount) setPartialAmount(Number(savedDraftData.partialAmount) || 0);
    if (savedDraftData.paymentMethod) setPaymentMethod(savedDraftData.paymentMethod);
    setSavedDraftData(null);
    showToast('Borrador recuperado', 'info');
  };

  const handleDiscardDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setSavedDraftData(null);
  };

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Tenés datos cargados en el formulario. ¿Querés descartarlos y cerrar?');
      if (!confirmed) return;
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
    }
    onClose();
  }, [isSubmitting, hasUnsavedChanges, onClose]);

  // Escape listener (confirm before discarding if dirty)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRequestClose]);

  // Client's vehicles (safe check)
  const clientVehicles = useMemo(() => {
    if (!selectedClientId) return [];
    return (vehicles || []).filter((v) => v && v.client_id === selectedClientId && !v.is_archived && !v.deleted_at);
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
    const veh = (vehicles || []).find((v) => v && v.id === selectedVehicleId);
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

  // Client search results — 100% NULL-SAFE for clients with `name` or `full_name` or missing fields
  const filteredClients = useMemo(() => {
    const rawTerm = String(clientSearchTerm || '').trim();
    if (!rawTerm) return [];
    const term = rawTerm.toLowerCase();
    return (clients || []).filter((c) => {
      if (!c || c.is_archived || c.deleted_at) return false;
      const clientName = String(c.full_name ?? c.name ?? '').toLowerCase();
      const clientPhone = String(c.phone ?? '').toLowerCase();
      const matchName = clientName.includes(term);
      const matchPhone = clientPhone.includes(term);
      const matchVehPlate = (vehicles || []).some(
        (v) => v && v.client_id === c.id && String(v.plate ?? '').toLowerCase().includes(term)
      );
      return matchName || matchPhone || matchVehPlate;
    }).slice(0, 6);
  }, [clients, vehicles, clientSearchTerm]);

  // Calculate pricing
  const subtotal = useMemo(() => {
    return selectedServiceIds.reduce((sum, sid) => {
      const tariff = (detailingTariffs || []).find((t) => t && t.id === sid);
      if (!tariff || !tariff.prices) return sum;
      const price = tariff.prices[categoryPriceKey] || tariff.prices.chico || 0;
      return sum + price;
    }, 0);
  }, [selectedServiceIds, detailingTariffs, categoryPriceKey]);

  const discountValue = useMemo(() => {
    if (discountType === 'none') return 0;
    const cfgDisc = detailingConfig?.discounts?.find((d) => d && d.id === discountType);
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

  const defaultRominaRate = useMemo(() => {
    if (!origin) return 30;
    return getOriginCommissionRates(detailingConfig, origin).romina;
  }, [detailingConfig, origin]);

  const activeRominaRate = rominaCommissionOverride !== null ? rominaCommissionOverride : defaultRominaRate;

  // Commission preview per participant based on origin
  const commissionPreview = useMemo(() => {
    if (!origin) return [];
    const rates = getOriginCommissionRates(detailingConfig, origin);

    return selectedParticipantIds.map((pid) => {
      const p = (availableProfiles || []).find((prof) => prof && prof.id === pid);
      const fullName = String(p?.full_name || 'Colaborador');
      const name = fullName.split(' ')[0] || 'Colaborador';
      const isMaxi = pid === 'user-maxi' || fullName.toLowerCase().includes('maxi');
      const isRomina = pid === 'user-romina' || fullName.toLowerCase().includes('romina');
      const pct = isMaxi ? rates.maxi : isRomina ? activeRominaRate : 30;
      const amt = Math.round(totalAmount * (pct / 100));
      return { id: pid, name, pct, amt };
    });
  }, [origin, selectedParticipantIds, availableProfiles, totalAmount, detailingConfig, activeRominaRate]);

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

  // Prevent Enter key inside inputs from submitting or closing
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const handleSave = async (andShareReceipt = false) => {
    if (isSubmitting) return;
    setSaveError(null);

    // Validaciones previas antes de tocar datos
    if (isCreatingClient) {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        const msg = 'Completá el nombre y teléfono del cliente';
        setSaveError(msg);
        showToast(msg, 'error');
        return;
      }
    } else if (!selectedClientId) {
      const msg = 'Seleccioná o creá un cliente';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    if (isCreatingVehicle) {
      if (!newVehicleBrand.trim() || !newVehicleModel.trim()) {
        const msg = 'Completá la marca y modelo del vehículo';
        setSaveError(msg);
        showToast(msg, 'error');
        return;
      }
    } else if (!selectedVehicleId) {
      const msg = 'Seleccioná o agregá un vehículo';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    if (selectedServiceIds.length === 0) {
      const msg = 'Seleccioná al menos un servicio del tarifario';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!origin) {
      const msg = 'El origen del cliente es obligatorio';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // PASO 1: CLIENTE (confirmar localStorage y respuesta OK de /api/sync)
      let finalClientId = selectedClientId;
      let finalClientName = '';
      let finalClientPhone = '';

      if (isCreatingClient) {
        const createdClient = addClient({
          full_name: newClientName.trim(),
          phone: newClientPhone.trim(),
          origin: (origin as ClientOrigin) || 'WhatsApp'
        });

        if (createdClient.duplicateWarning) {
          showToast(createdClient.duplicateWarning, 'info');
        }

        const clientSync = await syncRecordsToCloud('clients', [createdClient.client]);
        if (!clientSync.ok) {
          // Keep client selected locally so retry won't re-create it
          setSelectedClientId(createdClient.client.id);
          setIsCreatingClient(false);
          const errMsg = `No se pudo sincronizar el cliente con el servidor (${clientSync.error || 'Error de red'}). Reintentá guardar.`;
          setSaveError(errMsg);
          showToast(errMsg, 'error');
          setIsSubmitting(false);
          return;
        }

        finalClientId = createdClient.client.id;
        finalClientName = String(createdClient.client.full_name || createdClient.client.name || newClientName.trim());
        finalClientPhone = String(createdClient.client.phone || newClientPhone.trim());
        setSelectedClientId(finalClientId);
        setIsCreatingClient(false);
      } else {
        const c = (clients || []).find((client) => client && client.id === selectedClientId);
        if (!c) {
          const msg = 'Seleccioná o creá un cliente';
          setSaveError(msg);
          showToast(msg, 'error');
          setIsSubmitting(false);
          return;
        }
        finalClientId = c.id;
        finalClientName = String(c.full_name || c.name || '');
        finalClientPhone = String(c.phone || '');
      }

      // PASO 2: VEHÍCULO (confirmar localStorage y respuesta OK de /api/sync)
      let finalVehicleId = selectedVehicleId;
      let finalVehicleInfo = '';
      let finalVehiclePlate = '';
      let finalCategory = activeCategory;

      if (isCreatingVehicle) {
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

        if (createdVeh.error) {
          showToast(createdVeh.error, 'info');
        }

        const vehSync = await syncRecordsToCloud('vehicles', [createdVeh.vehicle]);
        if (!vehSync.ok) {
          setSelectedVehicleId(createdVeh.vehicle.id);
          setIsCreatingVehicle(false);
          const errMsg = `No se pudo sincronizar el vehículo con el servidor (${vehSync.error || 'Error de red'}). Reintentá guardar.`;
          setSaveError(errMsg);
          showToast(errMsg, 'error');
          setIsSubmitting(false);
          return;
        }

        finalVehicleId = createdVeh.vehicle.id;
        finalVehicleInfo = `${createdVeh.vehicle.brand || ''} ${createdVeh.vehicle.model || ''}`.trim();
        finalVehiclePlate = createdVeh.vehicle.plate || '';
        finalCategory = createdVeh.vehicle.category || 'Mediano';
        setSelectedVehicleId(finalVehicleId);
        setIsCreatingVehicle(false);
      } else {
        const v = (vehicles || []).find((veh) => veh && veh.id === selectedVehicleId);
        if (!v) {
          const msg = 'Seleccioná o agregá un vehículo';
          setSaveError(msg);
          showToast(msg, 'error');
          setIsSubmitting(false);
          return;
        }
        finalVehicleId = v.id;
        finalVehicleInfo = `${v.brand || ''} ${v.model || ''}`.trim();
        finalVehiclePlate = v.plate || '';
        finalCategory = v.category || 'Mediano';
      }

      // PASO 3: TRABAJO (confirmar localStorage y respuesta OK de /api/sync)
      const selectedServicesFormatted = selectedServiceIds.map((sid) => {
        const tariff = (detailingTariffs || []).find((t) => t && t.id === sid);
        const price = tariff?.prices?.[categoryPriceKey] || tariff?.prices?.chico || 0;
        return {
          serviceId: sid,
          serviceName: tariff?.name || 'Servicio',
          name: tariff?.name || 'Servicio',
          category: finalCategory,
          price
        };
      });

      const nowIso = new Date().toISOString();
      const targetQuoteId = quoteToEdit?.id || createdQuoteRef.current?.id || '';
      const initialPayments: DetailingPayment[] = [];

      if (paymentOption === 'full') {
        if (isSplitPayment) {
          if (splitAmount1 > 0) {
            initialPayments.push({
              id: `pay-${crypto.randomUUID()}`,
              quote_id: targetQuoteId,
              amount: splitAmount1,
              method: paymentMethod,
              date: workDate,
              created_at: nowIso,
              updated_at: nowIso,
              is_voided: false
            });
          }
          if (splitAmount2 > 0) {
            initialPayments.push({
              id: `pay-${crypto.randomUUID()}`,
              quote_id: targetQuoteId,
              amount: splitAmount2,
              method: splitMethod2,
              date: workDate,
              created_at: nowIso,
              updated_at: nowIso,
              is_voided: false
            });
          }
        } else {
          initialPayments.push({
            id: `pay-${crypto.randomUUID()}`,
            quote_id: targetQuoteId,
            amount: totalAmount,
            method: paymentMethod,
            date: workDate,
            created_at: nowIso,
            updated_at: nowIso,
            is_voided: false
          });
        }
        localStorage.setItem('carvlak_last_detailing_payment_method', paymentMethod);
      } else if (paymentOption === 'partial' && partialAmount > 0) {
        initialPayments.push({
          id: `pay-${crypto.randomUUID()}`,
          quote_id: targetQuoteId,
          amount: partialAmount,
          method: paymentMethod,
          date: workDate,
          created_at: nowIso,
          updated_at: nowIso,
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
          const p = (availableProfiles || []).find((prof) => prof && prof.id === pid);
          const rates = getOriginCommissionRates(detailingConfig, origin);
          const fullName = String(p?.full_name || 'Colaborador');
          const isMaxi = pid === 'user-maxi' || fullName.toLowerCase().includes('maxi');
          const isRomina = pid === 'user-romina' || fullName.toLowerCase().includes('romina');
          const rate = isMaxi ? rates.maxi : isRomina ? activeRominaRate : 30;
          return {
            employee_id: pid,
            employee_name: fullName,
            rate
          };
        }),
        notes: notes.trim(),
        payments: quoteToEdit
          ? [...(quoteToEdit.payments || []), ...initialPayments]
          : createdQuoteRef.current
          ? createdQuoteRef.current.payments || []
          : initialPayments
      };

      let savedQuote: DetailingQuote;

      if (quoteToEdit) {
        updateDetailingQuote(quoteToEdit.id, payload);
        savedQuote = { ...quoteToEdit, ...payload, updated_at: nowIso };
      } else if (createdQuoteRef.current) {
        updateDetailingQuote(createdQuoteRef.current.id, payload);
        savedQuote = { ...createdQuoteRef.current, ...payload, updated_at: nowIso };
      } else {
        savedQuote = addDetailingQuote(payload);
        createdQuoteRef.current = savedQuote;
      }

      const quoteSync = await syncRecordsToCloud('detailing_quotes', [savedQuote]);
      if (!quoteSync.ok) {
        const errMsg = `No se pudo confirmar el guardado del trabajo en el servidor (${quoteSync.error || 'Error de red'}). Volvé a tocar Guardar para reintentar.`;
        setSaveError(errMsg);
        showToast(errMsg, 'error');
        setIsSubmitting(false);
        return;
      }

      // Clear draft on confirmed save
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      showToast('Trabajo guardado', 'success');

      if (andShareReceipt) {
        const rcpt = await generateDetailingReceipt(savedQuote.id);
        if (rcpt && onOpenWhatsApp) {
          onOpenWhatsApp(savedQuote);
        }
      }

      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar el trabajo';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyPaidNow =
    paymentOption === 'full' ||
    (quoteToEdit && (quoteToEdit.payments || []).reduce((acc, p) => acc + (p.amount || 0), 0) >= totalAmount);

  const selectedClientObj = useMemo(
    () => (clients || []).find((c) => c && c.id === selectedClientId),
    [clients, selectedClientId]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs overflow-hidden animate-fade-in"
      onKeyDown={handleFormKeyDown}
    >
      <div
        className="bg-white border border-[#E5E5E3] rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4] shrink-0">
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
            type="button"
            onClick={handleRequestClose}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ModalErrorBoundary onClose={handleRequestClose}>
          {/* Content */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Banner de recuperación de borrador */}
            {savedDraftData && !quoteToEdit && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-medium">Tenés un borrador sin guardar</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
                  >
                    Recuperar borrador
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-2 py-1 text-amber-800 hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {/* Banner de error de guardado */}
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-900">
                <AlertCircle className="w-4 h-4 text-[#D7141A] shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-[#D7141A]">No se pudo completar el guardado</p>
                  <p className="text-red-800 mt-0.5">{saveError}</p>
                </div>
              </div>
            )}

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
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Teléfono / WhatsApp *"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
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
                      {filteredClients.map((c) => {
                        const displayName = String(c.full_name || c.name || 'Cliente sin nombre');
                        const displayPhone = String(c.phone || '');
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(c.id);
                              setSelectedVehicleId('');
                              setClientSearchTerm('');
                            }}
                            className={`w-full p-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              selectedClientId === c.id ? 'bg-red-50' : 'hover:bg-[#F5F5F4]'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-[#161616]">{displayName}</p>
                              <p className="text-[10px] text-[#6B6B6B]">{displayPhone}</p>
                            </div>
                            {selectedClientId === c.id && <Check className="w-4 h-4 text-[#D7141A]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedClientId && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-emerald-900">
                          {String(selectedClientObj?.full_name || selectedClientObj?.name || quoteToEdit?.client_name || 'Cliente seleccionado')}
                        </p>
                        <p className="text-[10px] text-emerald-700">
                          {String(selectedClientObj?.phone || quoteToEdit?.client_phone || '')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId('');
                          setSelectedVehicleId('');
                        }}
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
                    />
                    <input
                      type="text"
                      placeholder="Modelo *"
                      value={newVehicleModel}
                      onChange={(e) => setNewVehicleModel(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
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
                            <p className="font-bold">{v.brand || ''} {v.model || ''}</p>
                            <p className="text-[10px] text-[#6B6B6B]">{v.category || 'Mediano'}</p>
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
                {(detailingTariffs || []).map((t) => {
                  if (!t) return null;
                  const isSelected = selectedServiceIds.includes(t.id);
                  const price = t.prices?.[categoryPriceKey] || t.prices?.chico || 0;
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
                  const rates = getOriginCommissionRates(detailingConfig, orig);
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
                        {`Romina ${rates.romina}% · Maxi ${rates.maxi}%`}
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

              {/* 5.1 SELECCIÓN DE COMISIÓN DE ROMINA (30% vs 12.5%) */}
              {origin && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#161616]">
                      Comisión de Romina para este trabajo:
                    </span>
                    <span className="text-xs font-black text-[#D7141A] font-mono">
                      {activeRominaRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRominaCommissionOverride(30)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        activeRominaRate === 30
                          ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                          : 'bg-white text-stone-800 border-[#E5E5E3] hover:border-stone-400'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>30% — Venta Propia</span>
                        {activeRominaRate === 30 && <span className="text-[10px] text-emerald-400 font-bold">✓ Activo</span>}
                      </div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${activeRominaRate === 30 ? 'text-stone-300' : 'text-[#6B6B6B]'}`}>
                        Consigue y vende por fuera de los anuncios
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRominaCommissionOverride(12.5)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        activeRominaRate === 12.5
                          ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                          : 'bg-white text-stone-800 border-[#E5E5E3] hover:border-stone-400'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>12.5% — Anuncios / Taller</span>
                        {activeRominaRate === 12.5 && <span className="text-[10px] text-emerald-400 font-bold">✓ Activo</span>}
                      </div>
                      <div className={`text-[10px] mt-0.5 leading-tight ${activeRominaRate === 12.5 ? 'text-stone-300' : 'text-[#6B6B6B]'}`}>
                        Venta por anuncios o mano de obra
                      </div>
                    </button>
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
                            {String(p.full_name || '').split(' ')[0]}
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
          <div className="shrink-0 p-3.5 sm:p-4 border-t border-[#E5E5E3] bg-[#F5F5F4] flex items-center justify-between gap-2 sticky bottom-0">
            <Button variant="secondary" size="md" type="button" onClick={handleRequestClose} disabled={isSubmitting}>
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
                {isSubmitting ? 'Guardando…' : 'Guardar'}
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
                  {isSubmitting ? 'Guardando…' : 'Guardar y comprobante'}
                </Button>
              )}
            </div>
          </div>
        </ModalErrorBoundary>
      </div>
    </div>
  );
};

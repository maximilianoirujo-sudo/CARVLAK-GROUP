import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Check,
  AlertCircle,
  RotateCcw,
  Edit2,
  Users
} from 'lucide-react';
import {
  DetailingCompany,
  DetailingQuote,
  DetailingQuoteServiceItem,
  DetailingPayment,
  VehicleCategory
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import {
  formatCurrency,
  getLocalDateString,
  getOriginCommissionRates
} from '../../../lib/formatters';
import {
  calculatePreventaPrices,
  getCompanyEffectiveTariff,
  getSpecialServicePrice,
  DEFAULT_COMPANY_SPECIAL_SERVICES
} from '../lib/companyTariffUtils';
import { ModalErrorBoundary } from '../../../components/ui/ModalErrorBoundary';

const COMPANY_DRAFT_STORAGE_KEY = 'carvlak_draft_company_job';

interface DetailingCompanyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCompanyId?: string;
  initialDate?: string;
  quoteToEdit?: DetailingQuote | null;
  onJobCreated?: (newQuote: DetailingQuote) => void;
}

interface CustomItem {
  id: string;
  desc: string;
  price: number;
}

export const DetailingCompanyJobModal: React.FC<DetailingCompanyJobModalProps> = ({
  isOpen,
  onClose,
  preselectedCompanyId,
  initialDate,
  quoteToEdit,
  onJobCreated
}) => {
  const {
    detailingCompanies,
    addDetailingCompany,
    addDetailingQuote,
    updateDetailingQuote,
    detailingQuotes,
    detailingConfig,
    detailingCompanyServices,
    commissions,
    syncRecordsToCloud
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const isAdmin = Boolean(profile?.roles?.includes('admin'));

  const todayUY = getLocalDateString();
  const tomorrowUY = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  }, []);

  // 1. Empresa
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(preselectedCompanyId || '');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  // 2. Vehículo
  const [vehicleBrand, setVehicleBrand] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleSize, setVehicleSize] = useState<1 | 2 | 3 | 4>(1);

  // 3. Fecha
  const [workDate, setWorkDate] = useState<string>(initialDate || todayUY);

  // 4. Preparación Preventa
  const [includePreventa, setIncludePreventa] = useState<boolean>(true);

  // 5. Servicios Especiales
  const [selectedSpecialServiceIds, setSelectedSpecialServiceIds] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  // Precio del trabajo: lo pone el usuario a mano (sin precios predeterminados)
  const [manualPrice, setManualPrice] = useState<number>(0);

  // 6. ¿Quién hizo el trabajo? (MANDATORY & NO PRESELECTED ON NEW JOBS)
  const [whoDidIt, setWhoDidIt] = useState<'' | 'maxi' | 'romina' | 'both'>('');
  const [customMaxiRate, setCustomMaxiRate] = useState<number | null>(null);
  const [customMaxiReason, setCustomMaxiReason] = useState<string>('');
  const [isEditingMaxiRate, setIsEditingMaxiRate] = useState<boolean>(false);
  const [customRominaRate, setCustomRominaRate] = useState<number | null>(null);
  const [customRominaReason, setCustomRominaReason] = useState<string>('');
  const [isEditingRominaRate, setIsEditingRominaRate] = useState<boolean>(false);

  // 7. Descuento y notas
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // 8. Cobro
  const [paymentOption, setPaymentOption] = useState<'pending' | 'full'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return localStorage.getItem('carvlak_last_detailing_payment_method') || 'Transferencia BROU';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDraftData, setSavedDraftData] = useState<any | null>(null);

  const initializedKeyRef = useRef<string | null>(null);
  const createdQuoteRef = useRef<DetailingQuote | null>(null);

  // Initialize form ONLY ONCE when modal opens
  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      createdQuoteRef.current = null;
      setSaveError(null);
      return;
    }

    const sessionKey = quoteToEdit ? `edit:${quoteToEdit.id}` : 'new';
    if (initializedKeyRef.current === sessionKey) {
      return;
    }
    initializedKeyRef.current = sessionKey;
    setSaveError(null);

    if (quoteToEdit) {
      setSelectedCompanyId(quoteToEdit.company_id || quoteToEdit.client_id || preselectedCompanyId || '');
      setCompanySearch('');
      setIsCompanyDropdownOpen(false);
      const vehParts = String(quoteToEdit.vehicle_info || '').split(' ');
      setVehicleBrand(vehParts[0] || '');
      setVehicleModel(vehParts.slice(1).join(' ') || vehParts[0] || '');
      setVehiclePlate(quoteToEdit.vehicle_plate || '');
      setVehicleSize((quoteToEdit.vehicle_size as 1 | 2 | 3 | 4) || 1);
      setWorkDate(quoteToEdit.work_date || todayUY);
      const svcs = quoteToEdit.selected_services || [];
      setIncludePreventa(svcs.some((s) => s.serviceId === 'preventa'));
      setSelectedSpecialServiceIds(svcs.filter((s) => s.serviceId !== 'preventa' && !String(s.serviceId).startsWith('c-')).map((s) => s.serviceId));
      setCustomItems(
        svcs
          .filter((s) => String(s.serviceId).startsWith('c-'))
          .map((s) => ({ id: s.serviceId, desc: s.serviceName || s.name || '', price: s.price || 0 }))
      );
      setDiscountType((quoteToEdit.discount_type as any) || 'none');
      setDiscountValue(quoteToEdit.discount_amount || 0);
      setManualPrice(Number(quoteToEdit.subtotal) || Number(quoteToEdit.total_amount) || 0);
      setNotes(quoteToEdit.notes || '');

      const parts = (quoteToEdit.commission_participants || []).filter((p) => p && typeof p.rate === 'number' && p.rate > 0);
      const maxiPart = parts.find(
        (p) => p.employee_id === 'user-maxi' || String(p.employee_name || '').toLowerCase().includes('maxi')
      );
      const rominaPart = parts.find(
        (p) => p.employee_id === 'user-romina' || String(p.employee_name || '').toLowerCase().includes('romina')
      );

      if (maxiPart && rominaPart) {
        setWhoDidIt('both');
      } else if (maxiPart) {
        setWhoDidIt('maxi');
      } else if (rominaPart) {
        setWhoDidIt('romina');
      } else {
        setWhoDidIt('');
      }

      const defaultCompanyRates = getOriginCommissionRates(detailingConfig, 'Empresa');
      if (maxiPart && (maxiPart.rate !== defaultCompanyRates.maxi || maxiPart.adjustment_reason)) {
        setCustomMaxiRate(maxiPart.rate);
        setCustomMaxiReason(maxiPart.adjustment_reason || '');
      } else {
        setCustomMaxiRate(null);
        setCustomMaxiReason('');
      }

      if (rominaPart && (rominaPart.rate !== defaultCompanyRates.romina || rominaPart.adjustment_reason)) {
        setCustomRominaRate(rominaPart.rate);
        setCustomRominaReason(rominaPart.adjustment_reason || '');
      } else {
        setCustomRominaRate(null);
        setCustomRominaReason('');
      }

      setIsEditingMaxiRate(false);
      setIsEditingRominaRate(false);
      setPaymentOption('pending');
      setSavedDraftData(null);
    } else {
      setSelectedCompanyId(preselectedCompanyId || '');
      setCompanySearch('');
      setIsCompanyDropdownOpen(false);
      setVehicleBrand('');
      setVehicleModel('');
      setVehiclePlate('');
      setVehicleSize(1);
      setWorkDate(initialDate || todayUY);
      setIncludePreventa(true);
      setSelectedSpecialServiceIds([]);
      setCustomItems([]);
      setManualPrice(0);
      setWhoDidIt('');
      setCustomMaxiRate(null);
      setCustomMaxiReason('');
      setIsEditingMaxiRate(false);
      setCustomRominaRate(null);
      setCustomRominaReason('');
      setIsEditingRominaRate(false);
      setDiscountType('none');
      setDiscountValue(0);
      setNotes('');
      setPaymentOption('pending');
      setPaymentMethod(localStorage.getItem('carvlak_last_detailing_payment_method') || 'Transferencia BROU');

      // Check sessionStorage for draft
      try {
        const rawDraft = sessionStorage.getItem(COMPANY_DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (
            parsed &&
            (parsed.selectedCompanyId ||
              parsed.companySearch ||
              parsed.vehicleBrand ||
              parsed.vehicleModel ||
              parsed.vehiclePlate ||
              parsed.whoDidIt ||
              (Array.isArray(parsed.selectedSpecialServiceIds) && parsed.selectedSpecialServiceIds.length > 0) ||
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
  }, [isOpen, quoteToEdit, preselectedCompanyId, initialDate, todayUY, detailingConfig]);

  const hasUnsavedChanges = useMemo(() => {
    if (quoteToEdit) return false;
    return Boolean(
      (selectedCompanyId && selectedCompanyId !== preselectedCompanyId) ||
      companySearch.trim() ||
      vehicleBrand.trim() ||
      vehicleModel.trim() ||
      vehiclePlate.trim() ||
      whoDidIt ||
      selectedSpecialServiceIds.length > 0 ||
      customItems.length > 0 ||
      notes.trim()
    );
  }, [
    quoteToEdit,
    selectedCompanyId,
    preselectedCompanyId,
    companySearch,
    vehicleBrand,
    vehicleModel,
    vehiclePlate,
    whoDidIt,
    selectedSpecialServiceIds,
    customItems,
    notes
  ]);

  useEffect(() => {
    if (!isOpen || quoteToEdit || !hasUnsavedChanges) return;
    try {
      const draftPayload = {
        selectedCompanyId,
        companySearch,
        vehicleBrand,
        vehicleModel,
        vehiclePlate,
        vehicleSize,
        workDate,
        includePreventa,
        selectedSpecialServiceIds,
        customItems,
        manualPrice,
        whoDidIt,
        customMaxiRate,
        customMaxiReason,
        customRominaRate,
        customRominaReason,
        discountType,
        discountValue,
        notes,
        paymentOption,
        paymentMethod
      };
      sessionStorage.setItem(COMPANY_DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch {}
  }, [
    isOpen,
    quoteToEdit,
    hasUnsavedChanges,
    selectedCompanyId,
    companySearch,
    vehicleBrand,
    vehicleModel,
    vehiclePlate,
    vehicleSize,
    workDate,
    includePreventa,
    selectedSpecialServiceIds,
    customItems,
    manualPrice,
    whoDidIt,
    customMaxiRate,
    customMaxiReason,
    customRominaRate,
    customRominaReason,
    discountType,
    discountValue,
    notes,
    paymentOption,
    paymentMethod
  ]);

  const handleRestoreDraft = () => {
    if (!savedDraftData) return;
    setSelectedCompanyId(savedDraftData.selectedCompanyId || '');
    setCompanySearch(savedDraftData.companySearch || '');
    setVehicleBrand(savedDraftData.vehicleBrand || '');
    setVehicleModel(savedDraftData.vehicleModel || '');
    setVehiclePlate(savedDraftData.vehiclePlate || '');
    setVehicleSize(savedDraftData.vehicleSize || 1);
    if (savedDraftData.workDate) setWorkDate(savedDraftData.workDate);
    if (savedDraftData.includePreventa !== undefined) setIncludePreventa(Boolean(savedDraftData.includePreventa));
    if (Array.isArray(savedDraftData.selectedSpecialServiceIds)) {
      setSelectedSpecialServiceIds(savedDraftData.selectedSpecialServiceIds);
    }
    setManualPrice(Number(savedDraftData.manualPrice) || 0);
    if (Array.isArray(savedDraftData.customItems)) {
      setCustomItems(savedDraftData.customItems);
    }
    if (savedDraftData.whoDidIt) setWhoDidIt(savedDraftData.whoDidIt);
    if (savedDraftData.customMaxiRate !== undefined) setCustomMaxiRate(savedDraftData.customMaxiRate);
    if (savedDraftData.customMaxiReason) setCustomMaxiReason(savedDraftData.customMaxiReason);
    if (savedDraftData.customRominaRate !== undefined) setCustomRominaRate(savedDraftData.customRominaRate);
    if (savedDraftData.customRominaReason) setCustomRominaReason(savedDraftData.customRominaReason);
    if (savedDraftData.discountType) setDiscountType(savedDraftData.discountType);
    if (savedDraftData.discountValue) setDiscountValue(Number(savedDraftData.discountValue) || 0);
    setNotes(savedDraftData.notes || '');
    if (savedDraftData.paymentOption) setPaymentOption(savedDraftData.paymentOption);
    if (savedDraftData.paymentMethod) setPaymentMethod(savedDraftData.paymentMethod);
    setSavedDraftData(null);
    showToast('Borrador recuperado', 'info');
  };

  const handleDiscardDraft = () => {
    try {
      sessionStorage.removeItem(COMPANY_DRAFT_STORAGE_KEY);
    } catch {}
    setSavedDraftData(null);
  };

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Tenés datos cargados en el formulario. ¿Querés descartarlos y cerrar?');
      if (!confirmed) return;
      try {
        sessionStorage.removeItem(COMPANY_DRAFT_STORAGE_KEY);
      } catch {}
    }
    onClose();
  }, [isSubmitting, hasUnsavedChanges, onClose]);

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

  // Selected company object
  const currentCompany = useMemo(() => {
    return (detailingCompanies || []).find((c) => c && c.id === selectedCompanyId);
  }, [detailingCompanies, selectedCompanyId]);

  // Tarifa efectiva de la empresa seleccionada
  const effectiveTariff = useMemo(() => {
    return getCompanyEffectiveTariff(currentCompany, detailingConfig);
  }, [currentCompany, detailingConfig]);

  // Precios preventa 1..4 calculados
  const calculatedPrices = useMemo(() => {
    return calculatePreventaPrices(effectiveTariff);
  }, [effectiveTariff]);

  // Catálogo de servicios especiales activos
  const catalogSpecialServices = useMemo(() => {
    const list = detailingCompanyServices && detailingCompanyServices.length > 0
      ? detailingCompanyServices
      : (detailingConfig?.company_special_services || DEFAULT_COMPANY_SPECIAL_SERVICES);
    return (list || []).filter((s) => s && s.is_active);
  }, [detailingCompanyServices, detailingConfig]);

  // Sugerir tamaño al escribir modelo
  useEffect(() => {
    if (!vehicleModel.trim()) return;
    const modelLower = vehicleModel.toLowerCase().trim();

    // 1. Buscar en trabajos anteriores
    const prevMatch = (detailingQuotes || []).find((q) => {
      const info = String(q?.vehicle_info || '').toLowerCase();
      return info.includes(modelLower) && q?.vehicle_size;
    });
    if (prevMatch && prevMatch.vehicle_size) {
      setVehicleSize(prevMatch.vehicle_size);
      return;
    }

    // 2. Buscar en ejemplos de la tarifa
    for (const s of effectiveTariff.sizes || []) {
      const examples = String(s?.examples || '').toLowerCase();
      if (examples.includes(modelLower)) {
        setVehicleSize(s.size);
        return;
      }
    }
  }, [vehicleModel, detailingQuotes, effectiveTariff]);

  // Ajustar opción de cobro por defecto según billing_mode de la empresa
  useEffect(() => {
    if (currentCompany?.billing_mode === 'por trabajo') {
      setPaymentOption('full');
    } else if (currentCompany) {
      setPaymentOption('pending');
    }
  }, [currentCompany?.id, currentCompany?.billing_mode]);

  // Cálculo de Subtotal y Total
  const preventaPrice = includePreventa ? calculatedPrices[vehicleSize] : 0;

  const specialServicesTotal = useMemo(() => {
    return selectedSpecialServiceIds.reduce((sum, sid) => {
      const s = catalogSpecialServices.find((item) => item.id === sid);
      if (!s) return sum;
      const price = getSpecialServicePrice(s, vehicleSize, effectiveTariff);
      return sum + price;
    }, 0);
  }, [selectedSpecialServiceIds, catalogSpecialServices, vehicleSize, effectiveTariff]);

  const customItemsTotal = useMemo(() => {
    return customItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  }, [customItems]);

  // El total de los servicios lo carga el usuario a mano
  void preventaPrice; void specialServicesTotal; void customItemsTotal;
  const subtotal = Math.max(0, Number(manualPrice) || 0);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'fixed') return Math.min(subtotal, Math.max(0, discountValue));
    if (discountType === 'percent') return Math.round(subtotal * (Math.min(100, Math.max(0, discountValue)) / 100));
    return 0;
  }, [subtotal, discountType, discountValue]);

  const totalAmount = Math.max(0, subtotal - calculatedDiscount);

  // Porcentajes automáticos según Configuración > Comisiones para origen 'Empresa'
  const autoCompanyRates = useMemo(() => {
    return getOriginCommissionRates(detailingConfig, 'Empresa');
  }, [detailingConfig]);

  // Autos de CARVLAK (automotora de Jonathan): NO es comisión. Quien hace el trabajo cobra el 100% del monto.
  const isCarvlakJob = Boolean(
    currentCompany &&
      ((currentCompany as any).is_carvlak_internal || /^\s*carvlak\b/i.test(String(currentCompany.name || '')))
  );

  const effectiveRominaRate = isCarvlakJob
    ? 100
    : customRominaRate !== null
      ? customRominaRate
      : autoCompanyRates.romina;
  const effectiveMaxiRate = isCarvlakJob
    ? 100
    : customMaxiRate !== null
      ? customMaxiRate
      : autoCompanyRates.maxi;

  // En autos CARVLAK: por defecto lo cobra Romina y no existe "Los dos" (no se reparte)
  useEffect(() => {
    if (!isOpen || !isCarvlakJob) return;
    if (whoDidIt === 'both' || (!whoDidIt && !quoteToEdit)) {
      setWhoDidIt('romina');
    }
  }, [isOpen, isCarvlakJob, whoDidIt, quoteToEdit]);

  const liveRominaAmount = useMemo(
    () => Math.round(totalAmount * (effectiveRominaRate / 100)),
    [totalAmount, effectiveRominaRate]
  );

  const liveMaxiAmount = useMemo(
    () => Math.round(totalAmount * (effectiveMaxiRate / 100)),
    [totalAmount, effectiveMaxiRate]
  );

  const hasPaidCommissionsForEdit = useMemo(() => {
    if (!quoteToEdit) return false;
    return (commissions || []).some(
      (c) => c && !c.deleted_at && c.quote_id === quoteToEdit.id && c.status === 'Pagada'
    );
  }, [quoteToEdit, commissions]);

  // Mapeo de tamaño a categoría existente
  const categoryMapped: VehicleCategory = useMemo(() => {
    switch (vehicleSize) {
      case 1: return 'Chico';
      case 2: return 'Mediano';
      case 3: return 'SUV/Rural';
      case 4: return 'Pick-up';
      default: return 'Mediano';
    }
  }, [vehicleSize]);

  // Creación rápida de empresa si no existe
  const handleQuickCreateCompany = async () => {
    const trimmed = companySearch.trim();
    if (!trimmed) return;
    const existing = (detailingCompanies || []).find(
      (c) => c && String(c.name || '').trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setSelectedCompanyId(existing.id);
      setCompanySearch('');
      setIsCompanyDropdownOpen(false);
      showToast(`Se seleccionó la empresa existente "${existing.name}"`, 'info');
      return;
    }
    const created = addDetailingCompany({
      name: trimmed,
      billing_mode: 'mensual',
      is_active: true
    });
    setSelectedCompanyId(created.id);
    setCompanySearch('');
    setIsCompanyDropdownOpen(false);
    await syncRecordsToCloud('detailing_companies', [created]);
    showToast(`Empresa "${created.name}" creada`, 'success');
  };

  const handleToggleSpecialService = (id: string) => {
    setSelectedSpecialServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomItem = () => {
    setCustomItems((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, desc: '', price: 0 }
    ]);
  };

  const handleUpdateCustomItem = (id: string, field: 'desc' | 'price', val: any) => {
    setCustomItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  // Guardar trabajo con confirmación de /api/sync
  const saveJobInternal = async (andClearForNext: boolean) => {
    if (isSubmitting) return;
    setSaveError(null);

    if (!selectedCompanyId && !companySearch.trim()) {
      const msg = 'Seleccioná o creá una empresa';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    const cleanBrand = vehicleBrand.trim();
    const cleanModel = vehicleModel.trim();
    if (!cleanModel && !cleanBrand) {
      const msg = 'Ingresá el modelo o marca del vehículo';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!subtotal || subtotal <= 0) {
      const msg = 'Ingresá el precio del trabajo';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!whoDidIt) {
      const msg = 'Elegí quién hizo el trabajo (Maximiliano, Romina o Los dos)';
      setSaveError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // PASO 1: Empresa (si el usuario escribió el nombre pero no tocó "Crear", o confirmar que exista)
      let company = (detailingCompanies || []).find((c) => c && c.id === selectedCompanyId);
      if (!company && companySearch.trim()) {
        const trimmed = companySearch.trim();
        const existing = (detailingCompanies || []).find(
          (c) => c && String(c.name || '').trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) {
          company = existing;
          setSelectedCompanyId(existing.id);
          setCompanySearch('');
        } else {
          company = addDetailingCompany({
            name: trimmed,
            billing_mode: 'mensual',
            is_active: true
          });
          setSelectedCompanyId(company.id);
          setCompanySearch('');
        }
      }

      if (!company) {
        const msg = 'Seleccioná una empresa válida';
        setSaveError(msg);
        showToast(msg, 'error');
        setIsSubmitting(false);
        return;
      }

      // Confirmar empresa en /api/sync
      const compSync = await syncRecordsToCloud('detailing_companies', [company]);
      if (!compSync.ok) {
        const errMsg = `No se pudo confirmar la empresa en el servidor (${compSync.error || 'Error de red'}). Reintentá guardar.`;
        setSaveError(errMsg);
        showToast(errMsg, 'error');
        setIsSubmitting(false);
        return;
      }

      const nowIso = new Date().toISOString();

      // Armar selected_services
      const selectedServicesFormatted: DetailingQuoteServiceItem[] = [];
      if (includePreventa) {
        selectedServicesFormatted.push({
          serviceId: 'preventa',
          serviceName: `Preparación Preventa (Tamaño ${vehicleSize})`,
          price: 0
        });
      }

      selectedSpecialServiceIds.forEach((sid) => {
        const s = catalogSpecialServices.find((item) => item.id === sid);
        if (s) {
          selectedServicesFormatted.push({
            serviceId: s.id,
            serviceName: s.name,
            price: 0
          });
        }
      });

      customItems.forEach((ci) => {
        if (ci.desc.trim()) {
          selectedServicesFormatted.push({
            serviceId: ci.id,
            serviceName: ci.desc.trim(),
            price: 0
          });
        }
      });

      const targetQuoteId = quoteToEdit?.id || createdQuoteRef.current?.id || '';

      // Pagos iniciales si pagó ahora
      const initialPayments: DetailingPayment[] = [];
      if (paymentOption === 'full' && totalAmount > 0) {
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
        localStorage.setItem('carvlak_last_detailing_payment_method', paymentMethod);
      }

      const fullVehicleInfo = `${cleanBrand} ${cleanModel}`.trim();

      const finalParticipants: { employee_id: string; employee_name: string; rate: number; adjustment_reason?: string }[] = [];
      if (whoDidIt === 'romina' || whoDidIt === 'both') {
        finalParticipants.push({
          employee_id: 'user-romina',
          employee_name: 'Romina',
          rate: effectiveRominaRate,
          ...(customRominaRate !== null && customRominaReason.trim()
            ? { adjustment_reason: customRominaReason.trim() }
            : {})
        });
      }
      if (whoDidIt === 'maxi' || whoDidIt === 'both') {
        finalParticipants.push({
          employee_id: 'user-maxi',
          employee_name: 'Maximiliano',
          rate: effectiveMaxiRate,
          ...(customMaxiRate !== null && customMaxiReason.trim()
            ? { adjustment_reason: customMaxiReason.trim() }
            : {})
        });
      }

      const assignedList =
        whoDidIt === 'both'
          ? ['user-romina', 'user-maxi']
          : whoDidIt === 'maxi'
            ? ['user-maxi']
            : ['user-romina'];

      const quotePayload: Omit<DetailingQuote, 'id' | 'created_at' | 'updated_at'> = {
        customer_type: 'empresa',
        company_id: company.id,
        company_name: String(company.name || ''),
        vehicle_size: vehicleSize,
        client_id: company.id,
        client_name: String(company.name || ''),
        client_phone: String(company.phone || ''),
        vehicle_info: fullVehicleInfo,
        vehicle_plate: vehiclePlate.trim() ? vehiclePlate.trim().toUpperCase() : undefined,
        vehicle_category: categoryMapped,
        work_date: workDate,
        selected_services: selectedServicesFormatted,
        subtotal: subtotal,
        discount_type: discountType as any,
        discount_amount: calculatedDiscount,
        extreme_dirt_surcharge: 0,
        total_amount: totalAmount,
        origin: 'Empresa',
        assigned_to: assignedList[0],
        commission_participants: finalParticipants,
        notes: notes.trim(),
        status: quoteToEdit ? quoteToEdit.status : 'Trabajo Completado',
        payments: quoteToEdit
          ? [...(quoteToEdit.payments || []), ...initialPayments]
          : createdQuoteRef.current
          ? createdQuoteRef.current.payments || []
          : initialPayments
      };

      let savedQuote: DetailingQuote;
      if (quoteToEdit) {
        updateDetailingQuote(quoteToEdit.id, quotePayload);
        savedQuote = { ...quoteToEdit, ...quotePayload, updated_at: nowIso };
      } else if (createdQuoteRef.current) {
        updateDetailingQuote(createdQuoteRef.current.id, quotePayload);
        savedQuote = { ...createdQuoteRef.current, ...quotePayload, updated_at: nowIso };
      } else {
        savedQuote = addDetailingQuote(quotePayload);
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

      try {
        sessionStorage.removeItem(COMPANY_DRAFT_STORAGE_KEY);
      } catch {}

      if (onJobCreated) onJobCreated(savedQuote);

      if (andClearForNext && !quoteToEdit) {
        createdQuoteRef.current = null;
        showToast(`Trabajo guardado para ${company.name}. Podés cargar el siguiente.`, 'success');
        setVehicleBrand('');
        setVehicleModel('');
        setVehiclePlate('');
        setVehicleSize(1);
        setIncludePreventa(true);
        setSelectedSpecialServiceIds([]);
        setCustomItems([]);
        setManualPrice(0);
        setWhoDidIt('');
        setCustomMaxiRate(null);
        setCustomMaxiReason('');
        setIsEditingMaxiRate(false);
        setCustomRominaRate(null);
        setCustomRominaReason('');
        setIsEditingRominaRate(false);
        setNotes('');
        setDiscountType('none');
        setDiscountValue(0);
      } else {
        showToast('Trabajo guardado', 'success');
        onClose();
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar el trabajo';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filtrado de empresas para el buscador (100% null-safe)
  const filteredCompanies = (detailingCompanies || []).filter((c) => {
    if (!c || (c as any).deleted_at) return false;
    const isActive = c.is_active !== false;
    if (!companySearch.trim()) return isActive;
    return isActive && String(c.name || '').toLowerCase().includes(companySearch.toLowerCase().trim());
  });

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-hidden animate-fade-in"
      onKeyDown={handleFormKeyDown}
    >
      <div
        className="bg-white rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[94vh] p-4 sm:p-6 shadow-2xl border border-[#E5E5E3] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-[#161616]">
                + Trabajo de Empresa (Preventa)
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Carga rápida de vehículo con tarifa B2B por tamaño
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-1.5 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ModalErrorBoundary onClose={handleRequestClose}>
          {/* Scrollable Form Body */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-4 py-3 text-xs">
            {/* Banner de recuperación de borrador */}
            {savedDraftData && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-medium">Tenés un borrador de empresa sin guardar</span>
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

            {/* 1. SELECCIÓN DE EMPRESA */}
            <div className="bg-[#F5F5F4] p-3 rounded-xl border border-[#E5E5E3]">
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Empresa / Automotora <span className="text-[#D7141A]">*</span>
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={currentCompany ? String(currentCompany.name || '') : companySearch}
                      onChange={(e) => {
                        setSelectedCompanyId('');
                        setCompanySearch(e.target.value);
                        setIsCompanyDropdownOpen(true);
                      }}
                      onFocus={() => setIsCompanyDropdownOpen(true)}
                      placeholder="Buscá o escribí el nombre de la empresa..."
                      className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-semibold text-[#161616] focus:border-[#161616]"
                    />
                    {currentCompany && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompanyId('');
                          setCompanySearch('');
                        }}
                        className="absolute right-2.5 top-2.5 text-[#6B6B6B] hover:text-[#161616]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {companySearch.trim() && !currentCompany && (
                    <button
                      type="button"
                      onClick={handleQuickCreateCompany}
                      className="bg-[#161616] text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Crear "{companySearch.trim()}"</span>
                    </button>
                  )}
                </div>

                {/* Dropdown de opciones */}
                {isCompanyDropdownOpen && !currentCompany && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E5E5E3] rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompanyId(c.id);
                          setCompanySearch('');
                          setIsCompanyDropdownOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F5F5F4] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#161616] block">{c.name || 'Sin nombre'}</span>
                          {c.contact_name && <span className="text-[10px] text-[#6B6B6B]">{c.contact_name}</span>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-gray-100 text-[#161616]">
                          {c.billing_mode === 'mensual' ? 'Mensual' : 'Por trabajo'}
                        </span>
                      </button>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <div className="p-3 text-center text-[#6B6B6B]">
                        No se encontraron empresas. Hacé clic en "Crear" para registrarla al instante.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {currentCompany && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B6B6B]">
                  <span>Modalidad: <strong className="text-[#161616]">{currentCompany.billing_mode === 'mensual' ? 'Cuenta corriente mensual' : 'Cobro por trabajo'}</strong></span>
                  {currentCompany.phone && <span>Tel: {currentCompany.phone}</span>}
                </div>
              )}
            </div>

            {/* 2. AUTO & SELECTOR DE TAMAÑO (1-4) */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="Ej. Chevrolet / VW"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-medium text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Modelo <span className="text-[#D7141A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ej. Onix / Gol / Hilux"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-bold text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Matrícula <span className="text-[#6B6B6B] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Ej. SBX 1234"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs uppercase font-mono font-bold text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
              </div>

              {/* BOTONES GRANDES DE TAMAÑO 1..4 CON PRECIO */}
              <div>
                <label className="block text-xs font-bold text-[#161616] mb-1.5">
                  Tamaño del Vehículo & Tarifa Preventa
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((sizeNum) => {
                    const s = (effectiveTariff.sizes || []).find((sz) => sz.size === sizeNum) || {
                      size: sizeNum,
                      name: `Tamaño ${sizeNum}`,
                      examples: ''
                    };
                    const isSelected = vehicleSize === sizeNum;

                    return (
                      <button
                        key={sizeNum}
                        type="button"
                        onClick={() => setVehicleSize(sizeNum as 1 | 2 | 3 | 4)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/80 border-[#D7141A] ring-2 ring-[#D7141A]/30 shadow-xs'
                            : 'bg-white border-[#E5E5E3] hover:border-[#161616]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#D7141A]' : 'text-[#6B6B6B]'}`}>
                              {s.size} · {s.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#D7141A]" />}
                          </div>
                          <p className="text-[10px] text-[#6B6B6B] line-clamp-2 min-h-[28px]">
                            {s.examples || '-'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. FECHA DEL TRABAJO */}
            <div className="bg-[#F5F5F4] p-3 rounded-xl border border-[#E5E5E3] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#161616]">Fecha del Trabajo:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWorkDate(todayUY)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    workDate === todayUY
                      ? 'bg-[#161616] text-white'
                      : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setWorkDate(tomorrowUY)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    workDate === tomorrowUY
                      ? 'bg-[#161616] text-white'
                      : 'bg-white border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
                  }`}
                >
                  Mañana
                </button>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#161616]"
                />
              </div>
            </div>

            {/* 4. PREPARACIÓN PREVENTA INCLUIDA */}
            <div className="border border-[#E5E5E3] rounded-xl p-3 bg-white flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePreventa}
                  onChange={(e) => setIncludePreventa(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A]"
                />
                <div>
                  <span className="font-bold text-[#161616] block">
                    Incluir Preparación Preventa (Tamaño {vehicleSize})
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Lavado, aspirado profundo, acondicionador preventa de carrocería y motor
                  </span>
                </div>
              </label>
            </div>

            {/* 5. SERVICIOS ESPECIALES & ÍTEMS LIBRES */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#161616]">
                  Servicios Especiales Adicionales
                </label>
                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  className="text-[11px] text-[#D7141A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Agregar ítem libre</span>
                </button>
              </div>

              {/* Grid de Servicios Especiales del Catálogo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catalogSpecialServices.map((s) => {
                  const isSelected = selectedSpecialServiceIds.includes(s.id);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleToggleSpecialService(s.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-50/70 border-[#D7141A] text-[#161616]'
                          : 'bg-white border-[#E5E5E3] hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#D7141A] border-[#D7141A] text-white' : 'border-gray-300'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <span className="font-bold text-xs block">{s.name}</span>
                          {s.description && (
                            <span className="text-[10px] text-[#6B6B6B] line-clamp-1">{s.description}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Lista de Ítems Libres Fuera de Catálogo */}
              {customItems.length > 0 && (
                <div className="mt-2.5 space-y-1.5 bg-[#F5F5F4] p-2.5 rounded-xl border border-[#E5E5E3]">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Ítems libres adicionales:</span>
                  {customItems.map((ci) => (
                    <div key={ci.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Descripción del trabajo libre (ej. tapizado baúl)"
                        value={ci.desc}
                        onChange={(e) => handleUpdateCustomItem(ci.id, 'desc', e.target.value)}
                        className="flex-1 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomItem(ci.id)}
                        className="p-1 text-[#6B6B6B] hover:text-[#D7141A]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PRECIO DEL TRABAJO (manual) */}
            <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-1.5">
              <label htmlFor="company-manual-price" className="text-xs font-bold text-[#161616] flex items-center justify-between">
                <span>Precio del trabajo ($U) *</span>
                {!subtotal && <span className="text-[10px] text-[#D7141A] font-bold">Obligatorio</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#6B6B6B]">$U</span>
                <input
                  id="company-manual-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  placeholder="Ej: 4000"
                  value={manualPrice || ''}
                  onChange={(e) => setManualPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="flex-1 bg-white border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-xl font-bold font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-[#6B6B6B]">Total de todos los servicios de este auto.</p>
            </div>

            {/* 6. ¿QUIÉN HIZO EL TRABAJO? (Visible, obligatorio, sin opción preseleccionada) */}
            <div className="space-y-2 p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3]">
              <label className="text-xs font-bold text-[#161616] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D7141A]" />
                  ¿Quién hizo el trabajo? *
                </span>
                {!whoDidIt && <span className="text-[10px] text-[#D7141A] font-bold">Obligatorio</span>}
              </label>

              {hasPaidCommissionsForEdit && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  ⚠️ Este trabajo tiene comisión ya pagada. Si cambiás quién lo hizo o el %, la comisión pagada no se tocará.
                </div>
              )}

              <div className={`grid ${isCarvlakJob ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                <button
                  type="button"
                  onClick={() => setWhoDidIt('maxi')}
                  className={`py-3 px-2 rounded-xl font-bold border text-xs transition-all cursor-pointer text-center ${
                    whoDidIt === 'maxi'
                      ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                      : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                  }`}
                >
                  Maximiliano
                </button>
                <button
                  type="button"
                  onClick={() => setWhoDidIt('romina')}
                  className={`py-3 px-2 rounded-xl font-bold border text-xs transition-all cursor-pointer text-center ${
                    whoDidIt === 'romina'
                      ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                      : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                  }`}
                >
                  Romina
                </button>
                {!isCarvlakJob && (
                <button
                  type="button"
                  onClick={() => setWhoDidIt('both')}
                  className={`py-3 px-2 rounded-xl font-bold border text-xs transition-all cursor-pointer text-center ${
                    whoDidIt === 'both'
                      ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                      : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                  }`}
                >
                  Los dos
                </button>
                )}
              </div>

              {isCarvlakJob && (
                <div className="p-2.5 bg-white border border-[#E5E5E3] rounded-lg text-[11px] text-[#161616]">
                  <strong>Auto de CARVLAK:</strong> no es comisión. Quien hace el trabajo cobra el <strong>100% del monto</strong>. Se registra para la cuenta de Jonathan.
                </div>
              )}

              {/* Desglose en vivo por persona seleccionada */}
              {whoDidIt && (
                <div className="space-y-2 pt-1">
                  {(whoDidIt === 'romina' || whoDidIt === 'both') && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#E5E5E3] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-50 text-[#D7141A] font-black text-[10px]">
                            R
                          </span>
                          <span className="font-bold text-xs text-[#161616]">
                            {`Romina ${String(effectiveRominaRate).replace('.', ',')}% = $${liveRominaAmount.toLocaleString('es-UY')}`}
                          </span>
                          {customRominaRate !== null && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                              Ajustado
                            </span>
                          )}
                        </div>
                        {isAdmin && !isCarvlakJob && (
                          <button
                            type="button"
                            onClick={() => setIsEditingRominaRate((prev) => !prev)}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                            title="Ajustar % de Romina para este trabajo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Selección rápida de % para Romina en este trabajo */}
                      <div className={`${isCarvlakJob ? 'hidden' : 'flex'} items-center gap-1.5 flex-wrap`}>
                        <span className="text-[10px] font-semibold text-[#6B6B6B] mr-0.5">% de Romina:</span>
                        {[30, 12.5].map((pct) => {
                          const isActive = effectiveRominaRate === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setCustomRominaRate(pct === autoCompanyRates.romina ? null : pct);
                                if (pct === autoCompanyRates.romina) setCustomRominaReason('');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#161616] text-white border-[#161616]'
                                  : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                              }`}
                            >
                              {String(pct).replace('.', ',')}%
                            </button>
                          );
                        })}
                      </div>

                      {isAdmin && !isCarvlakJob && isEditingRominaRate && (
                        <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-medium text-[#161616]">% en este trabajo:</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={effectiveRominaRate}
                              onChange={(e) => setCustomRominaRate(parseFloat(e.target.value) || 0)}
                              className="w-20 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-[#161616]"
                            />
                            <span className="text-xs font-bold text-[#6B6B6B]">%</span>
                            {customRominaRate !== null && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomRominaRate(null);
                                  setCustomRominaReason('');
                                  setIsEditingRominaRate(false);
                                }}
                                className="text-[10px] text-[#D7141A] font-bold hover:underline ml-auto cursor-pointer"
                              >
                                Volver a automático ({autoCompanyRates.romina}%)
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Motivo del ajuste (opcional)..."
                            value={customRominaReason}
                            onChange={(e) => setCustomRominaReason(e.target.value)}
                            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-[11px] text-[#161616]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(whoDidIt === 'maxi' || whoDidIt === 'both') && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#E5E5E3] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-stone-100 text-[#161616] font-black text-[10px]">
                            M
                          </span>
                          <span className="font-bold text-xs text-[#161616]">
                            {`Maximiliano ${String(effectiveMaxiRate).replace('.', ',')}% = $${liveMaxiAmount.toLocaleString('es-UY')}`}
                          </span>
                          {customMaxiRate !== null && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                              Ajustado
                            </span>
                          )}
                        </div>
                        {isAdmin && !isCarvlakJob && (
                          <button
                            type="button"
                            onClick={() => setIsEditingMaxiRate((prev) => !prev)}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                            title="Ajustar % de Maximiliano para este trabajo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Selección rápida de % para Maximiliano en este trabajo */}
                      <div className={`${isCarvlakJob ? 'hidden' : 'flex'} items-center gap-1.5 flex-wrap`}>
                        <span className="text-[10px] font-semibold text-[#6B6B6B] mr-0.5">% de Maximiliano:</span>
                        {[30, 12.5].map((pct) => {
                          const isActive = effectiveMaxiRate === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setCustomMaxiRate(pct === autoCompanyRates.maxi ? null : pct);
                                if (pct === autoCompanyRates.maxi) setCustomMaxiReason('');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#161616] text-white border-[#161616]'
                                  : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                              }`}
                            >
                              {String(pct).replace('.', ',')}%
                            </button>
                          );
                        })}
                      </div>

                      {isAdmin && !isCarvlakJob && isEditingMaxiRate && (
                        <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-medium text-[#161616]">% en este trabajo:</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={effectiveMaxiRate}
                              onChange={(e) => setCustomMaxiRate(parseFloat(e.target.value) || 0)}
                              className="w-20 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-[#161616]"
                            />
                            <span className="text-xs font-bold text-[#6B6B6B]">%</span>
                            {customMaxiRate !== null && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomMaxiRate(null);
                                  setCustomMaxiReason('');
                                  setIsEditingMaxiRate(false);
                                }}
                                className="text-[10px] text-[#D7141A] font-bold hover:underline ml-auto cursor-pointer"
                              >
                                Volver a automático ({autoCompanyRates.maxi}%)
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Motivo del ajuste (opcional)..."
                            value={customMaxiReason}
                            onChange={(e) => setCustomMaxiReason(e.target.value)}
                            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-[11px] text-[#161616]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. DESCUENTO Y NOTAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E5E3]">
              <div>
                <label className="block text-[11px] font-bold text-[#161616] mb-1">
                  Descuento Opcional
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2 py-1.5 text-xs text-[#161616]"
                  >
                    <option value="none">Sin descuento</option>
                    <option value="fixed">Monto ($U)</option>
                    <option value="percent">Porcentaje (%)</option>
                  </select>
                  {discountType !== 'none' && (
                    <input
                      type="number"
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      placeholder={discountType === 'percent' ? '%' : '$U'}
                      className="flex-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-2 py-1.5 text-xs font-mono font-bold"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#161616] mb-1">
                  Notas u Observaciones del Auto
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. manchas difíciles en asiento trasero"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-1.5 text-xs text-[#161616]"
                />
              </div>
            </div>

            {/* 7. COBRO */}
            <div className="bg-[#F5F5F4] p-3 rounded-xl border border-[#E5E5E3] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#161616]">Estado de Cobro:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="pending"
                      checked={paymentOption === 'pending'}
                      onChange={() => setPaymentOption('pending')}
                      className="text-[#D7141A] focus:ring-[#D7141A]"
                    />
                    <span>Pendiente (cuenta mensual)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="text-[#D7141A] focus:ring-[#D7141A]"
                    />
                    <span>Cobrado ahora</span>
                  </label>
                </div>
              </div>

              {paymentOption === 'full' && (
                <div className="pt-2 border-t border-[#E5E5E3] flex items-center gap-2">
                  <span className="text-[11px] text-[#6B6B6B] shrink-0">Medio de pago:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#161616]"
                  >
                    {(detailingConfig?.payment_methods || ['Transferencia BROU', 'Transferencia Itaú', 'Efectivo']).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer con Resumen y Botones de Acción */}
          <div className="shrink-0 pt-3.5 sm:pt-4 border-t border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white sticky bottom-0 shadow-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-[#6B6B6B]">Total del Trabajo:</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-[#161616]">
                {formatCurrency(totalAmount)}
              </span>
              {calculatedDiscount > 0 && (
                <span className="text-[10px] text-emerald-700 font-semibold">
                  (Descuento: -{formatCurrency(calculatedDiscount)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                className="bg-white hover:bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3] font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => saveJobInternal(true)}
                disabled={isSubmitting}
                className="bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>{isSubmitting ? 'Guardando…' : 'Guardar y cargar otro'}</span>
              </button>

              <button
                type="button"
                onClick={() => saveJobInternal(false)}
                disabled={isSubmitting}
                className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando…' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </ModalErrorBoundary>
      </div>
    </div>
  );
};

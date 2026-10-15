import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Car,
  CheckCircle2,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Star,
  Plus,
  Check,
  Play,
  FileText,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  AlertCircle,
  Truck,
  Bike,
  Tag,
  Percent,
  ShoppingBag,
  Gift,
  Share2,
  RotateCcw,
  Sliders,
  Eye
} from 'lucide-react';
import {
  DetailingTariff,
  VehicleCategory,
  DetailingWebRequest,
  DetailingPackage,
  DetailingUpsellProduct,
  DetailingWebBudgetConfig,
  DetailingConfig
} from '../../../../types';
import {
  INITIAL_DETAILING_TARIFFS,
  INITIAL_DETAILING_CONFIG,
  INITIAL_GENERAL_CONFIG
} from '../../../../lib/mockData';
import { VideoEmbed } from '../../../../components/common/VideoEmbed';
import { PublicBudgetPrintView } from './PublicBudgetPrintView';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

interface PublicBudgetBuilderProps {
  onBackToApp?: () => void;
}

export const PublicBudgetBuilder: React.FC<PublicBudgetBuilderProps> = ({ onBackToApp }) => {
  // ---------------------------------------------------------------------------
  // 1. Data & Configuration States
  // ---------------------------------------------------------------------------
  const [tariffs, setTariffs] = useState<DetailingTariff[]>(() => {
    try {
      const saved = localStorage.getItem('carvlak_detailing_tariffs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DETAILING_TARIFFS;
  });

  const [detailingConfig, setDetailingConfig] = useState<DetailingConfig>(() => {
    try {
      const saved = localStorage.getItem('carvlak_detailing_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_DETAILING_CONFIG,
          ...parsed,
          web_budget: {
            ...INITIAL_DETAILING_CONFIG.web_budget,
            ...(parsed.web_budget || {})
          }
        };
      }
    } catch {}
    return INITIAL_DETAILING_CONFIG;
  });

  // Busy/Booked counts per date from quotes
  const [bookedDatesCount, setBookedDatesCount] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('carvlak_detailing_quotes');
      if (saved) {
        const quotes = JSON.parse(saved);
        const map: Record<string, number> = {};
        if (Array.isArray(quotes)) {
          quotes.forEach((q: any) => {
            if (q.date && q.status !== 'Cancelado' && q.status !== 'Anulado') {
              map[q.date] = (map[q.date] || 0) + 1;
            }
          });
        }
        return map;
      }
    } catch {}
    return {};
  });

  const webBudget: DetailingWebBudgetConfig = detailingConfig.web_budget || (INITIAL_DETAILING_CONFIG.web_budget as any);
  const companyPhone =
    webBudget.settings?.whatsapp_number ||
    webBudget.content?.company_phone ||
    INITIAL_GENERAL_CONFIG.company_phone ||
    '59899267964';

  // Sync latest data from /api/sync and Supabase
  useEffect(() => {
    async function loadPublicData() {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.detailing_tariffs && Array.isArray(json.data.detailing_tariffs)) {
            setTariffs(json.data.detailing_tariffs);
            localStorage.setItem('carvlak_detailing_tariffs', JSON.stringify(json.data.detailing_tariffs));
          }
          if (json?.data?.detailing_config) {
            const merged: DetailingConfig = {
              ...INITIAL_DETAILING_CONFIG,
              ...json.data.detailing_config,
              web_budget: {
                ...INITIAL_DETAILING_CONFIG.web_budget,
                ...(json.data.detailing_config.web_budget || {})
              }
            };
            setDetailingConfig(merged);
            localStorage.setItem('carvlak_detailing_config', JSON.stringify(merged));
          }
          if (json?.data?.detailing_quotes && Array.isArray(json.data.detailing_quotes)) {
            const map: Record<string, number> = {};
            json.data.detailing_quotes.forEach((q: any) => {
              if (q.date && q.status !== 'Cancelado' && q.status !== 'Anulado') {
                map[q.date] = (map[q.date] || 0) + 1;
              }
            });
            setBookedDatesCount(map);
          }
        }
      } catch (e) {
        // Fallback to local storage
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.rpc('get_public_config');
          if (data?.detailing_tariffs && Array.isArray(data.detailing_tariffs)) {
            setTariffs(data.detailing_tariffs);
          }
        } catch {}
      }
    }
    loadPublicData();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Wizard Navigation: 4 Pasos Clave
  // 1: Auto, 2: Servicios, 3: Día (Agenda), 4: Tus datos, 5: Éxito/Resumen
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ---------------------------------------------------------------------------
  // 3. Selection States with LocalStorage Restore
  // ---------------------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.selectedCategory) return parsed.selectedCategory;
      }
    } catch {}
    return null;
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed.selectedServiceIds)) return parsed.selectedServiceIds;
      }
    } catch {}
    return [];
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed.selectedProductIds)) return parsed.selectedProductIds;
      }
    } catch {}
    return [];
  });

  const [preferredDate, setPreferredDate] = useState<string>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.preferredDate) return parsed.preferredDate;
      }
    } catch {}
    return '';
  });

  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'manana' | 'tarde' | 'indiferente'>('indiferente');

  // Form inputs
  const [name, setName] = useState<string>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) return JSON.parse(draft).name || '';
    } catch {}
    return '';
  });

  const [phone, setPhone] = useState<string>(() => {
    try {
      const draft = localStorage.getItem('dv_client_draft');
      if (draft) return JSON.parse(draft).phone || '';
    } catch {}
    return '';
  });

  const [email, setEmail] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [comments, setComments] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent?: number;
    discount_amount?: number;
    description: string;
  } | null>(null);

  // Anti-Spam
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cross-sell & Modals
  const [detailModalService, setDetailModalService] = useState<DetailingTariff | null>(null);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [crossSellNotification, setCrossSellNotification] = useState<{
    parentName: string;
    suggestedTariffs: DetailingTariff[];
  } | null>(null);

  // Final Results
  const [createdRequest, setCreatedRequest] = useState<DetailingWebRequest | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [personalReferralCode, setPersonalReferralCode] = useState('');

  // Category filter in catalog
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('todos');

  // Scroll helper
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Draft autosave to localStorage
  useEffect(() => {
    try {
      const draftData = {
        selectedCategory,
        selectedServiceIds,
        selectedProductIds,
        preferredDate,
        preferredTimeSlot,
        name,
        phone
      };
      localStorage.setItem('dv_client_draft', JSON.stringify(draftData));
    } catch {}
  }, [
    selectedCategory,
    selectedServiceIds,
    selectedProductIds,
    preferredDate,
    preferredTimeSlot,
    name,
    phone
  ]);

  // Map category to tariff key
  const categoryKey = useMemo<'chico' | 'mediano' | 'suv' | 'pickup' | 'moto' | null>(() => {
    if (!selectedCategory) return null;
    switch (selectedCategory) {
      case 'Chico':
        return 'chico';
      case 'Mediano':
        return 'mediano';
      case 'SUV/Rural':
        return 'suv';
      case 'Pick-up':
        return 'pickup';
      case 'Moto':
        return 'moto';
      default:
        return 'mediano';
    }
  }, [selectedCategory]);

  // Active Tariffs
  const activeTariffs = useMemo(() => {
    return tariffs
      .filter((t) => t.isActive !== false)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [tariffs]);

  // Categories list for filter chips
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    activeTariffs.forEach((t) => {
      if (t.category && t.category.trim()) set.add(t.category.trim());
    });
    return Array.from(set);
  }, [activeTariffs]);

  // Filtered tariffs by category chip
  const visibleTariffs = useMemo(() => {
    if (selectedCategoryTab === 'todos') return activeTariffs;
    return activeTariffs.filter(
      (t) => (t.category || '').toLowerCase() === selectedCategoryTab.toLowerCase()
    );
  }, [activeTariffs, selectedCategoryTab]);

  // Selected Services with calculated prices
  const selectedServices = useMemo(() => {
    if (!categoryKey) return [];
    return selectedServiceIds
      .map((sid) => {
        const tariff = activeTariffs.find((t) => t.id === sid);
        if (!tariff) return null;
        let price = tariff.prices?.[categoryKey] || 0;
        // Check promo price
        if (
          tariff.promo_price &&
          tariff.promo_price > 0 &&
          tariff.promo_price < price
        ) {
          const expires = tariff.promo_expires_at ? new Date(tariff.promo_expires_at).getTime() : null;
          if (!expires || expires > Date.now()) {
            price = tariff.promo_price;
          }
        }
        return {
          tariff,
          price,
          durationHours: tariff.durationHours || 3
        };
      })
      .filter(Boolean) as Array<{
      tariff: DetailingTariff;
      price: number;
      durationHours: number;
    }>;
  }, [selectedServiceIds, activeTariffs, categoryKey]);

  // Selected Upsell Products
  const selectedProducts = useMemo(() => {
    const list = webBudget.products || [];
    return selectedProductIds
      .map((pid) => list.find((p) => p.id === pid && p.is_active !== false))
      .filter(Boolean) as DetailingUpsellProduct[];
  }, [selectedProductIds, webBudget.products]);

  // ---------------------------------------------------------------------------
  // 4. Promo Engine & Calculation
  // ---------------------------------------------------------------------------
  const promoRules = webBudget.promotions;

  const servicesSubtotal = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.price, 0);
  }, [selectedServices]);

  const productsSubtotal = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + item.price, 0);
  }, [selectedProducts]);

  const discountDetails = useMemo(() => {
    let totalDiscount = 0;
    const reasons: string[] = [];
    const maxDiscountPercent = promoRules?.max_accumulated_discount_percent || 25;

    if (!promoRules || servicesSubtotal === 0) {
      return { totalDiscount: 0, reasons: [] };
    }

    // 1. Quantity discount tiers
    if (promoRules.tiered_quantity_enabled) {
      const count = selectedServices.length;
      const sortedTiers = [...(promoRules.tiered_quantity_rules || [])].sort(
        (a, b) => b.min_services - a.min_services
      );
      const appliedTier = sortedTiers.find((t) => count >= t.min_services);
      if (appliedTier && appliedTier.discount_percent > 0) {
        const tierDisc = (servicesSubtotal * appliedTier.discount_percent) / 100;
        totalDiscount += tierDisc;
        reasons.push(
          `${appliedTier.discount_percent}% OFF por ${appliedTier.min_services}+ servicios (-$${Math.round(tierDisc).toLocaleString('es-UY')})`
        );
      }
    }

    // 2. Product add-on discount
    if (
      promoRules.product_upsell_discount_enabled &&
      selectedProducts.length > 0 &&
      promoRules.product_upsell_discount_percent > 0
    ) {
      const prodDisc = (servicesSubtotal * promoRules.product_upsell_discount_percent) / 100;
      totalDiscount += prodDisc;
      reasons.push(
        `${promoRules.product_upsell_discount_percent}% OFF por sumar producto (-$${Math.round(prodDisc).toLocaleString('es-UY')})`
      );
    }

    // 3. Agenda promo day
    if (preferredDate && promoRules.promo_days_enabled && promoRules.promo_days?.length > 0) {
      const dateObj = new Date(`${preferredDate}T12:00:00`);
      const dayOfWeek = dateObj.getDay();
      if (promoRules.promo_days.includes(dayOfWeek)) {
        const pct = promoRules.promo_days_discount_percent || 10;
        const agendaDisc = (servicesSubtotal * pct) / 100;
        totalDiscount += agendaDisc;
        reasons.push(`${pct}% OFF Día Especial Agenda (-$${Math.round(agendaDisc).toLocaleString('es-UY')})`);
      }
    }

    // 4. Coupon
    if (appliedCoupon) {
      let coupDisc = 0;
      if (appliedCoupon.discount_percent && appliedCoupon.discount_percent > 0) {
        coupDisc = (servicesSubtotal * appliedCoupon.discount_percent) / 100;
      } else if (appliedCoupon.discount_amount && appliedCoupon.discount_amount > 0) {
        coupDisc = appliedCoupon.discount_amount;
      }
      if (coupDisc > 0) {
        totalDiscount += coupDisc;
        reasons.push(`Cupón "${appliedCoupon.code}" (-$${Math.round(coupDisc).toLocaleString('es-UY')})`);
      }
    }

    // Cap at max discount percent
    const maxDiscountAllowed = (servicesSubtotal * maxDiscountPercent) / 100;
    if (totalDiscount > maxDiscountAllowed) {
      totalDiscount = maxDiscountAllowed;
      reasons.push(`* Tope máximo aplicado: ${maxDiscountPercent}% de descuento.`);
    }

    return {
      totalDiscount: Math.round(totalDiscount),
      reasons
    };
  }, [
    promoRules,
    servicesSubtotal,
    selectedServices.length,
    selectedProducts.length,
    preferredDate,
    appliedCoupon
  ]);

  const finalTotal = Math.max(0, servicesSubtotal + productsSubtotal - discountDetails.totalDiscount);

  // Incentive message (e.g. "Sumá 1 servicio más y ahorrás 10%")
  const nextTierPushMessage = useMemo(() => {
    if (!promoRules?.tiered_quantity_enabled) return null;
    const count = selectedServices.length;
    const tiers = [...(promoRules.tiered_quantity_rules || [])].sort(
      (a, b) => a.min_services - b.min_services
    );
    const nextTier = tiers.find((t) => t.min_services > count);
    if (!nextTier) return null;
    const needed = nextTier.min_services - count;
    return `¡Sumá ${needed} servicio${needed > 1 ? 's' : ''} más y ahorrás un ${nextTier.discount_percent}% en tu presupuesto!`;
  }, [promoRules, selectedServices.length]);

  // ---------------------------------------------------------------------------
  // 5. Actions: Add/Remove, Packages, Cross-sell
  // ---------------------------------------------------------------------------
  const handleToggleService = (tariffId: string) => {
    if (!selectedCategory) {
      alert('Por favor seleccioná primero el tamaño de tu vehículo para calcular los precios.');
      setCurrentStep(1);
      scrollToTop();
      return;
    }

    const isAlreadySelected = selectedServiceIds.includes(tariffId);

    if (isAlreadySelected) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== tariffId));
      setCrossSellNotification(null);
    } else {
      setSelectedServiceIds((prev) => [...prev, tariffId]);

      // Check cross-sell suggestions
      const tariff = activeTariffs.find((t) => t.id === tariffId);
      if (tariff && tariff.suggested_service_ids && tariff.suggested_service_ids.length > 0) {
        const unselectedSuggestions = activeTariffs.filter(
          (t) =>
            tariff.suggested_service_ids?.includes(t.id) &&
            !selectedServiceIds.includes(t.id) &&
            t.id !== tariffId
        );
        if (unselectedSuggestions.length > 0) {
          setCrossSellNotification({
            parentName: tariff.shortName || tariff.name,
            suggestedTariffs: unselectedSuggestions
          });
        }
      }
    }
  };

  const handleApplyPackage = (pkg: DetailingPackage) => {
    if (!selectedCategory) {
      alert('Por favor seleccioná primero el tamaño de tu vehículo para calcular el combo.');
      setCurrentStep(1);
      scrollToTop();
      return;
    }
    const union = Array.from(new Set([...selectedServiceIds, ...pkg.service_ids]));
    setSelectedServiceIds(union);
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Coupon validation
  const handleValidateCoupon = () => {
    if (!couponCode.trim()) return;
    const codeClean = couponCode.trim().toUpperCase();
    const list = promoRules?.coupons || [];
    const found = list.find(
      (c) => c.code.toUpperCase() === codeClean && c.is_active !== false
    );

    if (found) {
      setAppliedCoupon({
        code: found.code,
        discount_percent: found.discount_type === 'percent' ? found.discount_value : undefined,
        discount_amount: found.discount_type === 'fixed' ? found.discount_value : undefined,
        description:
          found.discount_type === 'percent'
            ? `${found.discount_value}% de descuento`
            : `$${found.discount_value} de descuento`
      });
    } else {
      alert(`El cupón "${codeClean}" no es válido o ha expirado.`);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Agenda Days Generator (próximos 21 días)
  // ---------------------------------------------------------------------------
  const availableAgendaDays = useMemo(() => {
    const agendaCfg = webBudget.agenda || INITIAL_DETAILING_CONFIG.web_budget?.agenda;
    const workingDaysMap = agendaCfg?.working_days || {};
    const maxCars = agendaCfg?.max_vehicles_per_day || 2;
    const blocked = agendaCfg?.blocked_dates || [];
    const promoDays = promoRules?.promo_days || [];
    const isPromoEnabled = promoRules?.promo_days_enabled || false;

    const dayNameKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const days: Array<{
      dateIso: string;
      displayDay: string;
      displayDate: string;
      dayOfWeek: number;
      isAvailable: boolean;
      isPromo: boolean;
      statusReason?: string;
    }> = [];

    const today = new Date();
    const startOffset = today.getHours() >= 17 ? 1 : 0;

    for (let i = startOffset; i < startOffset + 21; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateIso = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 Dom, 1 Lun, ..., 6 Sáb
      const dayKey = dayNameKeys[dayOfWeek];

      const dayConfig = workingDaysMap[dayKey];
      const isWorkDay = dayConfig ? dayConfig.is_open : dayOfWeek !== 0;
      const isBlocked = blocked.includes(dateIso);
      const bookedCount = bookedDatesCount[dateIso] || 0;
      const isFull = bookedCount >= maxCars;
      const isPromo = isPromoEnabled && promoDays.includes(dayOfWeek);

      let isAvailable = isWorkDay && !isBlocked && !isFull;
      let statusReason = 'Disponible';

      if (!isWorkDay) {
        statusReason = 'Cerrado';
      } else if (isBlocked) {
        statusReason = 'No disponible';
      } else if (isFull) {
        statusReason = 'Completo';
      } else if (isPromo) {
        statusReason = `${promoRules?.promo_days_discount_percent || 10}% OFF`;
      }

      const displayDay = d.toLocaleDateString('es-UY', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });

      days.push({
        dateIso,
        displayDay: displayDay.charAt(0).toUpperCase() + displayDay.slice(1).replace('.', ''),
        displayDate,
        dayOfWeek,
        isAvailable,
        isPromo,
        statusReason
      });
    }

    return days;
  }, [webBudget.agenda, promoRules, bookedDatesCount]);

  // ---------------------------------------------------------------------------
  // 7. Submit Quote Request
  // ---------------------------------------------------------------------------
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim().length > 0) return;
    if ((Date.now() - formStartTime) / 1000 < 2) return;

    if (!name.trim() || !phone.trim()) {
      alert('Por favor completá los campos obligatorios: tu nombre y WhatsApp para enviarte el presupuesto.');
      return;
    }

    if (!selectedCategory) {
      alert('Por favor seleccioná el tamaño de tu vehículo para calcular el presupuesto.');
      setCurrentStep(1);
      return;
    }

    if (selectedServices.length === 0) {
      alert('Por favor seleccioná al menos 1 servicio para armar tu presupuesto.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      // Attribution & Origin
      const urlParams = new URLSearchParams(window.location.search);
      const isPaidAd = !!(
        urlParams.get('origen') === 'anuncio' ||
        urlParams.get('utm_source') ||
        urlParams.get('utm_medium') ||
        urlParams.get('utm_campaign') ||
        urlParams.get('fbclid') ||
        urlParams.get('gclid') ||
        urlParams.get('ad_id')
      );
      const origin = urlParams.get('origen') || (isPaidAd ? 'Anuncios pagos' : 'Directo / Web');

      // Unique human code: DV-26-XXXX
      const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `DV-26-${randomCodeSuffix}`;
      const nowIso = new Date().toISOString();

      // Referral code for the client
      const refCode = `DV-REF-${code.slice(6)}`;
      setPersonalReferralCode(refCode);

      const nextServiceCouponCode = promoRules?.next_service_coupon_enabled
        ? promoRules.next_service_coupon_code || 'VUELVOADETAIL'
        : undefined;

      const newRequest: DetailingWebRequest = {
        id: `webreq-${crypto.randomUUID()}`,
        code,
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_email: email.trim() || undefined,
        vehicle_brand: vehicleBrand.trim() || 'A coordinar',
        vehicle_model: vehicleModel.trim() || '',
        vehicle_year: vehicleYear.trim() ? parseInt(vehicleYear.trim(), 10) : null,
        vehicle_plate: vehiclePlate.trim() ? vehiclePlate.trim().toUpperCase() : undefined,
        vehicle_category: selectedCategory || 'Mediano',
        preferred_date: preferredDate || undefined,
        preferred_time_slot: preferredTimeSlot,
        comments: comments.trim() || undefined,
        selected_services: selectedServices.map((s) => ({
          serviceId: s.tariff.id,
          serviceName: s.tariff.shortName || s.tariff.name,
          price: s.price,
          durationHours: s.durationHours
        })),
        selected_products: selectedProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          price: p.price
        })),
        applied_discount:
          discountDetails.totalDiscount > 0
            ? {
                discount_name: discountDetails.reasons[0] || 'Descuentos acumulados',
                discount_amount: discountDetails.totalDiscount,
                coupon_code: appliedCoupon?.code
              }
            : undefined,
        total_amount: finalTotal,
        origin,
        is_paid_ad: isPaidAd,
        status: 'incompleta',
        is_completed: false,
        created_at: nowIso,
        referral_code: refCode,
        next_service_coupon_code: nextServiceCouponCode,
        status_history: [
          {
            status: 'incompleta',
            changed_at: nowIso,
            changed_by: 'Cliente (Web)',
            note: 'Presupuesto armado en la web (esperando confirmación por WhatsApp)'
          }
        ]
      };

      // 1. Guardar localmente
      try {
        const saved = localStorage.getItem('carvlak_detailing_web_requests');
        const list: DetailingWebRequest[] = saved ? JSON.parse(saved) : [];
        const updatedList = [newRequest, ...list];
        localStorage.setItem('carvlak_detailing_web_requests', JSON.stringify(updatedList));

        // 2. Sync to cloud Upstash KV
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'detailing_web_requests',
            data: updatedList
          })
        }).catch(() => {});
      } catch (e) {
        console.error('Error saving web request:', e);
      }

      // 3. Supabase RPC fallback
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.rpc('submit_quote_request', {
            payload: {
              client_name: newRequest.client_name,
              client_phone: newRequest.client_phone,
              vehicle_brand: newRequest.vehicle_brand,
              vehicle_model: `${newRequest.vehicle_model} ${newRequest.vehicle_year || ''}`.trim(),
              vehicle_category: newRequest.vehicle_category,
              origin: newRequest.origin,
              comments: newRequest.comments,
              selected_services: newRequest.selected_services,
              total_amount: newRequest.total_amount
            }
          });
        } catch {}
      }

      setCreatedRequest(newRequest);
      setCurrentStep(5);
      scrollToTop();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al procesar tu solicitud. Podés contactarnos directamente por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. WhatsApp Sender
  // ---------------------------------------------------------------------------
  const handleConfirmWhatsApp = () => {
    if (!createdRequest) return;

    // Promover estado a 'nueva' y marcar como completada
    try {
      const saved = localStorage.getItem('carvlak_detailing_web_requests');
      if (saved) {
        const list: DetailingWebRequest[] = JSON.parse(saved);
        const updatedList = list.map((r) =>
          r.id === createdRequest.id
            ? {
                ...r,
                status: 'nueva' as const,
                is_completed: true,
                status_history: [
                  ...(r.status_history || []),
                  {
                    status: 'nueva' as const,
                    changed_at: new Date().toISOString(),
                    changed_by: 'Cliente (WhatsApp)',
                    note: 'Cliente confirmó y abrió WhatsApp'
                  }
                ]
              }
            : r
        );
        localStorage.setItem('carvlak_detailing_web_requests', JSON.stringify(updatedList));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'detailing_web_requests', data: updatedList })
        }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }

    const servicesListText = createdRequest.selected_services
      .map((s) => `• ${s.serviceName}: $${s.price.toLocaleString('es-UY')}`)
      .join('\n');

    const productsListText =
      createdRequest.selected_products && createdRequest.selected_products.length > 0
        ? `\n🧴 *Productos de cuidado:* \n${createdRequest.selected_products.map((p) => `• ${p.productName}: $${p.price.toLocaleString('es-UY')}`).join('\n')}`
        : '';

    const discountText =
      createdRequest.applied_discount && createdRequest.applied_discount.discount_amount > 0
        ? `\n🏷️ *Descuento aplicado:* -$${createdRequest.applied_discount.discount_amount.toLocaleString('es-UY')} (${createdRequest.applied_discount.discount_name})`
        : '';

    const timeSlotLabel =
      createdRequest.preferred_time_slot === 'manana'
        ? 'Mañana (08:30 a 12:30)'
        : createdRequest.preferred_time_slot === 'tarde'
        ? 'Tarde (13:30 a 18:30)'
        : 'A coordinar';

    const message = `¡Hola DetailVlak! 👋 Acabo de armar mi presupuesto estimado en su web.

📋 *Presupuesto #${createdRequest.code}*
👤 *Cliente:* ${createdRequest.client_name}
📱 *Teléfono:* ${createdRequest.client_phone}
🚗 *Vehículo:* ${createdRequest.vehicle_brand && createdRequest.vehicle_brand !== 'A coordinar' ? `${createdRequest.vehicle_brand} ${createdRequest.vehicle_model}`.trim() : 'A coordinar'} ${createdRequest.vehicle_year ? `(${createdRequest.vehicle_year})` : ''} - *${createdRequest.vehicle_category}*
${createdRequest.vehicle_plate ? `🔖 *Matrícula:* ${createdRequest.vehicle_plate}\n` : ''}${createdRequest.preferred_date ? `📅 *Día elegido en agenda:* ${createdRequest.preferred_date} (${timeSlotLabel})\n` : ''}
🛠️ *Tratamientos elegidos:*
${servicesListText}${productsListText}${discountText}

💰 *TOTAL ESTIMADO:* $${createdRequest.total_amount.toLocaleString('es-UY')} UYU
${createdRequest.comments ? `\n💬 *Comentarios:* ${createdRequest.comments}\n` : ''}
¿Tienen disponible ese turno para coordinar la inspección del auto en el taller?`;

    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');
  };

  // Direct floating WhatsApp
  const handleDirectFloatingWhatsApp = () => {
    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';
    const text = encodeURIComponent('¡Hola DetailVlak! 👋 Quisiera hacerles una consulta sobre un tratamiento para mi auto.');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-white text-gray-900 flex flex-col justify-between selection:bg-[#0066FF]/20 selection:text-[#0066FF] font-sans antialiased"
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. Header con Marca DetailVlak */}
      {/* --------------------------------------------------------------------- */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0044CC] flex items-center justify-center font-black text-white text-xs tracking-wider shadow-sm shrink-0">
              DV
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight font-display">
                  DETAIL<span className="text-[#0066FF]">VLAK</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 tracking-wide uppercase">
                  Armador
                </span>
              </div>
              <p className="text-[10px] text-gray-500 truncate">Estética automotriz • Shangrilá</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Volver al Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub interno</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDirectFloatingWhatsApp}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp directo</span>
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Barra de Progreso en 4 Pasos (Auto → Servicios → Día → Tus datos) */}
      {/* --------------------------------------------------------------------- */}
      {currentStep !== 5 && (
        <div className="bg-gray-50/80 border-b border-gray-200 px-4 py-3 sticky top-[53px] sm:top-[61px] z-30 backdrop-blur-xs">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 text-center">
              {[
                { step: 1, label: 'Auto', desc: 'Tamaño' },
                { step: 2, label: 'Servicios', desc: 'Tratamientos' },
                { step: 3, label: 'Día', desc: 'Agenda' },
                { step: 4, label: 'Tus datos', desc: 'Resumen' }
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;

                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={!isPassed && !isActive}
                    onClick={() => {
                      if (isPassed || isActive) {
                        setCurrentStep(item.step as any);
                        scrollToTop();
                      }
                    }}
                    className={`py-1.5 px-1 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-white border border-[#0066FF] shadow-xs'
                        : isPassed
                        ? 'text-gray-700 hover:bg-gray-200/60'
                        : 'text-gray-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#0066FF] text-white'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : item.step}
                      </span>
                      <span
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-[#0066FF]' : isPassed ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 hidden sm:block truncate mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. Contenido Principal según el Paso */}
      {/* --------------------------------------------------------------------- */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-32">
        {/* =================================================================== */}
        {/* PASO 1: SELECCIÓN DEL AUTO (TAMAÑO)                                */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in py-2">
            {/* Header del Paso 1 */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                Paso 1 de 4 • Tu vehículo
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {webBudget.content?.hero_title || 'Elegí el tamaño de tu vehículo'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl">
                {webBudget.content?.hero_subtitle ||
                  'Seleccioná la categoría correspondiente a tu vehículo para desbloquear los precios exactos de cada tratamiento.'}
              </p>
            </div>

            {/* Tarjetas de Selección de Tamaño */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(
                webBudget.custom_sizes?.filter((s) => s.is_active !== false) || [
                  {
                    key: 'Chico' as VehicleCategory,
                    label: 'Chico',
                    sub: 'Hatch / Compacto',
                    examples: 'Gol, Onix, 208, Celerio',
                    icon: 'car'
                  },
                  {
                    key: 'Mediano' as VehicleCategory,
                    label: 'Mediano',
                    sub: 'Sedán',
                    examples: 'Corolla, Cruze, Vento',
                    icon: 'car'
                  },
                  {
                    key: 'SUV/Rural' as VehicleCategory,
                    label: 'SUV / Rural',
                    sub: 'Camioneta med.',
                    examples: 'Tracker, Compass, Taos',
                    icon: 'truck'
                  },
                  {
                    key: 'Pick-up' as VehicleCategory,
                    label: 'Pick-up',
                    sub: 'Camioneta gde.',
                    examples: 'Hilux, Amarok, Ranger',
                    icon: 'truck'
                  },
                  {
                    key: 'Moto' as VehicleCategory,
                    label: 'Moto',
                    sub: 'Motos & Cuadris',
                    examples: 'Street, Trail, Custom',
                    icon: 'bike'
                  }
                ]
              ).map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const IconComponent =
                  cat.icon === 'truck' ? Truck : cat.icon === 'bike' ? Bike : Car;

                return (
                  <div
                    key={cat.key}
                    onClick={() => {
                      setSelectedCategory(cat.key as VehicleCategory);
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#0066FF] shadow-md shadow-blue-500/10 ring-2 ring-[#0066FF]/20'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-gray-300 bg-white" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span
                        className={`font-extrabold text-sm block ${
                          isSelected ? 'text-[#0066FF]' : 'text-gray-900'
                        }`}
                      >
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-gray-500 block">{cat.sub}</span>
                      <span className="text-[10px] text-gray-400 block truncate mt-1">
                        {cat.examples}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón Siguiente si ya seleccionó */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                {selectedCategory ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Vehículo seleccionado: <strong>{selectedCategory}</strong>
                  </span>
                ) : (
                  'Tocá el tamaño de tu auto para continuar.'
                )}
              </span>

              <button
                type="button"
                disabled={!selectedCategory}
                onClick={() => {
                  if (!selectedCategory) return;
                  setCurrentStep(2);
                  scrollToTop();
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continuar a Servicios</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Beneficios de Portada */}
            <div className="pt-6 border-t border-gray-200">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-3">
                Por qué elegir DetailVlak
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  webBudget.content?.benefits || [
                    {
                      title: 'Time-Lapse de tu auto',
                      description: 'Grabamos en video el proceso de cada trabajo para máxima transparencia.',
                      icon: 'play'
                    },
                    {
                      title: 'Tratamiento Integral',
                      description: 'Limpieza profunda a vapor de todas las butacas, piso y techo.',
                      icon: 'shield'
                    },
                    {
                      title: 'Sin Sorpresas',
                      description: 'Precios claros de antemano y garantía escrita de satisfacción.',
                      icon: 'clock'
                    }
                  ]
                ).map((b, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-gray-900">{b.title}</div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 2: SERVICIOS, COMBOS Y PRODUCTOS                              */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-7 animate-fade-in py-2">
            {/* Header del Paso 2 con categoría activa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                  Paso 2 de 4 • Catálogo
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Elegí los tratamientos para tu {selectedCategory || 'auto'}
                </h2>
                <p className="text-xs text-gray-500">
                  Podés sumar tratamientos individuales o elegir un paquete con descuento especial.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  scrollToTop();
                }}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Cambiar tamaño ({selectedCategory})</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Banner de regla de taller (interiores) */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3 text-xs text-gray-700">
              <Info className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed text-[11px]">
                <strong className="text-gray-900 block">Regla de calidad en interiores:</strong>
                <p className="text-gray-600">
                  {webBudget.content?.interior_quality_rule ||
                    'En interiores únicamente realizamos limpieza profunda integral (incluye butacas, piso, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales.'}
                </p>
              </div>
            </div>

            {/* A) PAQUETES DESTACADOS ARRIBA */}
            {webBudget.packages &&
              webBudget.packages.filter((p) => p.is_active !== false).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                      Combos & Paquetes Más Elegidos
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200">
                      Mayor Ahorro
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {webBudget.packages
                      .filter((p) => p.is_active !== false)
                      .map((pkg) => {
                        const pkgPrice = categoryKey ? pkg.prices?.[categoryKey] || 0 : 0;
                        const individualTotal = categoryKey
                          ? pkg.service_ids.reduce((sum, sId) => {
                              const s = activeTariffs.find((t) => t.id === sId);
                              return sum + (s?.prices?.[categoryKey] || 0);
                            }, 0)
                          : 0;
                        const savings = Math.max(0, individualTotal - pkgPrice);

                        const isAllSelected = pkg.service_ids.every((sId) =>
                          selectedServiceIds.includes(sId)
                        );

                        return (
                          <div
                            key={pkg.id}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                              isAllSelected
                                ? 'bg-blue-50/70 border-[#0066FF] shadow-md shadow-blue-500/10'
                                : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                {pkg.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    ★ {pkg.badge}
                                  </span>
                                )}
                                {savings > 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Ahorrás ${savings.toLocaleString('es-UY')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-extrabold text-gray-900 text-sm">
                                  {pkg.name}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                  {pkg.description}
                                </p>
                              </div>

                              {/* Servicios que incluye */}
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Incluye {pkg.service_ids.length} tratamientos:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.service_ids.map((sId) => {
                                    const s = activeTariffs.find((t) => t.id === sId);
                                    if (!s) return null;
                                    return (
                                      <span
                                        key={sId}
                                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
                                      >
                                        ✓ {s.shortName || s.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Precio y Botón Sumar Combo */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-3">
                              <div>
                                {savings > 0 && individualTotal > 0 && (
                                  <span className="text-[11px] text-gray-400 line-through block font-mono">
                                    ${individualTotal.toLocaleString('es-UY')}
                                  </span>
                                )}
                                <span className="text-base font-extrabold text-gray-900 font-mono">
                                  ${pkgPrice.toLocaleString('es-UY')}{' '}
                                  <span className="text-[10px] text-gray-500 font-normal">UYU</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplyPackage(pkg)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isAllSelected
                                    ? 'bg-[#0066FF] text-white shadow-xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                                }`}
                              >
                                {isAllSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Combo Sumado</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Elegir Combo</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* B) FILTRO POR CATEGORÍAS */}
            {availableCategories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryTab('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategoryTab === 'todos'
                        ? 'bg-[#0066FF] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos ({activeTariffs.length})
                  </button>
                  {availableCategories.map((cat) => {
                    const count = activeTariffs.filter(
                      (t) => (t.category || '').toLowerCase() === cat.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedCategoryTab.toLowerCase() === cat.toLowerCase()
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C) TARJETAS DE SERVICIO INDIVIDUALES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Tratamientos Individuales
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedServiceIds.length} sumado{selectedServiceIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visibleTariffs.map((tariff) => {
                  const isSelected = selectedServiceIds.includes(tariff.id);
                  const regularPrice = categoryKey ? tariff.prices?.[categoryKey] || 0 : 0;
                  const hasPromo =
                    Boolean(tariff.promo_price && tariff.promo_price > 0 && tariff.promo_price < regularPrice);
                  const effectivePrice = hasPromo ? tariff.promo_price! : regularPrice;
                  const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());

                  return (
                    <div
                      key={tariff.id}
                      className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/40 border-[#0066FF] shadow-md shadow-blue-500/10 ring-1 ring-[#0066FF]'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      {/* Cuerpo de la tarjeta */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          {/* Badges superiores */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tariff.badge && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  ★ {tariff.badge}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-gray-600 bg-gray-100">
                                <Clock className="w-3 h-3" /> {tariff.durationHours || 3} hs
                              </span>
                            </div>

                            {hasVideo && (
                              <button
                                type="button"
                                onClick={() => setDetailModalService(tariff)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#0066FF] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <Play className="w-3 h-3" /> Ver time-lapse
                              </button>
                            )}
                          </div>

                          {/* Foto de portada si existe */}
                          {tariff.cover_image_url && (
                            <div
                              onClick={() => setDetailModalService(tariff)}
                              className="w-full h-32 rounded-xl overflow-hidden relative cursor-pointer group bg-gray-100"
                            >
                              <img
                                src={tariff.cover_image_url}
                                alt={tariff.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Ver detalle y time-lapse
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Título y descripción corta */}
                          <div className="space-y-1">
                            <h4
                              onClick={() => setDetailModalService(tariff)}
                              className="font-extrabold text-gray-900 text-sm leading-snug cursor-pointer hover:text-[#0066FF] transition-colors"
                            >
                              {tariff.shortName || tariff.name}
                            </h4>
                            {tariff.description && (
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {tariff.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botón Ver Más detalles */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalService(tariff)}
                            className="text-[11px] font-semibold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver qué incluye y fotos</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Barra de Precio y Botón Sumar */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase text-gray-400 font-bold block">
                            {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                          </span>
                          {tariff.price_type === 'consult' ? (
                            <span className="text-sm font-bold text-gray-800">A cotizar</span>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              {hasPromo && (
                                <span className="text-xs text-gray-400 line-through font-mono">
                                  ${regularPrice.toLocaleString('es-UY')}
                                </span>
                              )}
                              <span className="text-base font-extrabold text-gray-900 font-mono">
                                {tariff.price_type === 'from' ? 'Desde ' : ''}$
                                {effectivePrice.toLocaleString('es-UY')}{' '}
                                <span className="text-[10px] text-gray-500 font-normal">UYU</span>
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleService(tariff.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/25'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Sumado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Sumar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D) NOTIFICACIÓN / CROSS-SELLING ("Sumale también...") */}
            {crossSellNotification && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0066FF]" />
                    <span className="text-xs font-bold text-gray-900">
                      Recomendado para complementar tu {crossSellNotification.parentName}:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCrossSellNotification(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {crossSellNotification.suggestedTariffs.map((sug) => {
                    const sugPrice = categoryKey ? sug.prices?.[categoryKey] || 0 : 0;
                    return (
                      <div
                        key={sug.id}
                        className="p-3 bg-white rounded-xl border border-blue-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate block">
                            {sug.shortName || sug.name}
                          </span>
                          <span className="text-[11px] font-mono text-gray-600">
                            +${sugPrice.toLocaleString('es-UY')} UYU
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleService(sug.id);
                            setCrossSellNotification(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shrink-0 cursor-pointer"
                        >
                          + Sumar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* E) PRODUCTOS DE MANTENIMIENTO (PASO OPCIONAL) */}
            {webBudget.products &&
              webBudget.products.filter((p) => p.is_active !== false).length > 0 && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#0066FF]" />
                        <h3 className="text-sm font-extrabold text-gray-900">
                          ¿Querés sumar productos para mantener tu auto?
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        Opcional • Te los entregamos listos al retirar tu auto en el taller.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {webBudget.products
                      .filter((p) => p.is_active !== false)
                      .map((prod) => {
                        const isAdded = selectedProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isAdded
                                ? 'bg-blue-50/60 border-[#0066FF]'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-gray-900 block truncate">
                                  {prod.name}
                                </span>
                                {prod.short_description && (
                                  <p className="text-[10px] text-gray-500 line-clamp-1">
                                    {prod.short_description}
                                  </p>
                                )}
                                <span className="text-xs font-mono font-bold text-gray-900 block mt-0.5">
                                  ${prod.price.toLocaleString('es-UY')}{' '}
                                  <span className="text-[9px] text-gray-500 font-normal">UYU</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleProduct(prod.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                                isAdded
                                  ? 'bg-[#0066FF] text-white'
                                  : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {isAdded ? 'Sumado ✓' : '+ Sumar'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 3: DÍA EN LA AGENDA (CALENDARIO INTERACTIVO CON PROMOS)        */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                Paso 3 de 4 • Fecha en agenda
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Elegí el día estimado para traer tu vehículo
              </h2>
              <p className="text-xs text-gray-500">
                Seleccioná el día que más te convenga. Los días con etiqueta verde tienen descuento promocional especial.
              </p>
            </div>

            {/* Selector de Días de la Agenda */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-800 block">
                Próximos días disponibles en el taller:
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                {availableAgendaDays.map((day) => {
                  const isSelected = preferredDate === day.dateIso;

                  return (
                    <div
                      key={day.dateIso}
                      onClick={() => {
                        if (day.isAvailable) {
                          setPreferredDate(day.dateIso);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col justify-between ${
                        !day.isAvailable
                          ? 'bg-gray-100/60 border-gray-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50 border-[#0066FF] shadow-sm ring-2 ring-[#0066FF]/20 cursor-pointer'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">
                        {day.displayDay}
                      </span>
                      <span
                        className={`text-sm font-extrabold block my-0.5 ${
                          isSelected ? 'text-[#0066FF]' : 'text-gray-900'
                        }`}
                      >
                        {day.displayDate}
                      </span>

                      {/* Badge estado / promo */}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                          day.isPromo
                            ? 'bg-emerald-100 text-emerald-800'
                            : !day.isAvailable
                            ? 'bg-gray-200 text-gray-500'
                            : isSelected
                            ? 'bg-blue-100 text-[#0066FF]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {day.statusReason}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Franja horaria de preferencia */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-800 block">
                Franja horaria preferida de entrega:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'manana', label: 'Mañana', hours: '08:30 a 12:30' },
                  { key: 'tarde', label: 'Tarde', hours: '13:30 a 18:30' },
                  { key: 'indiferente', label: 'Indiferente', hours: 'A coordinar luego' }
                ].map((slot) => {
                  const isSelected = preferredTimeSlot === slot.key;
                  return (
                    <div
                      key={slot.key}
                      onClick={() => setPreferredTimeSlot(slot.key as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-[#0066FF] text-[#0066FF] font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{slot.label}</div>
                      <div className="text-[10px] text-gray-500">{slot.hours}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opción rápida: no elegir fecha todavía */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreferredDate('');
                  setCurrentStep(4);
                  scrollToTop();
                }}
                className="text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer"
              >
                Prefiero coordinar el día exacto luego directamente por WhatsApp →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 4: FORMULARIO DE DATOS & CUPÓN                                */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-2">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                Paso 4 de 4 • Finalizar cotización
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Tus datos para enviarte el presupuesto
              </h2>
              <p className="text-xs text-gray-500">
                Solo tu nombre y celular son obligatorios para preparar tu cotización formal y el PDF.
              </p>
            </div>

            {/* Resumen previo de lo elegido */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-200 pb-2">
                <span>
                  Tratamientos elegidos ({selectedCategory}) • {selectedServices.length} servicios
                </span>
                <span className="text-[#0066FF] font-mono text-sm">
                  ${finalTotal.toLocaleString('es-UY')} UYU
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {selectedServices.map((s) => (
                  <div key={s.tariff.id} className="flex items-center justify-between text-gray-700">
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <span className="font-mono font-semibold">${s.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-gray-600 italic">
                    <span>+ {p.name} (mantenimiento)</span>
                    <span className="font-mono">${p.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {discountDetails.totalDiscount > 0 && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-emerald-700 font-bold">
                    <span>Descuento aplicado:</span>
                    <span>-${discountDetails.totalDiscount.toLocaleString('es-UY')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cupón de descuento */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2.5 shadow-2xs">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#0066FF]" />
                <span>¿Tenés un cupón de descuento o código de amigo?</span>
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: BIENVENIDA, DETAIL10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 uppercase font-mono focus:outline-hidden focus:bg-white focus:border-[#0066FF]"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Aplicar
                </button>
              </div>

              {appliedCoupon && (
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Cupón {appliedCoupon.code} aplicado con éxito! ({appliedCoupon.description})</span>
                </div>
              )}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Honeypot anti-spam */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="extra_field_trap"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* 1. Datos Personales */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-3.5 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] block">
                  1. Tus Datos de Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Nombre y apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      WhatsApp / Celular <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 099 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Email <span className="text-gray-400 text-[11px]">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Para recibir una copia de tu presupuesto (opcional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* 2. Datos del Auto */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-3.5 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] block">
                  2. Tu Vehículo <span className="text-gray-400 text-[11px] font-normal lowercase">(opcional)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Peugeot"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: 208"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Año</label>
                    <input
                      type="number"
                      placeholder="Ej: 2021"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Matrícula</label>
                    <input
                      type="text"
                      placeholder="Ej: SAA 1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs uppercase font-mono focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Día acordado</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Comentarios o detalles especiales de la pintura
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contanos si tiene rayas profundas, manchas en las butacas o algo puntual a tratar..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] transition-all"
                  />
                </div>
              </div>

              {/* Aclaración obligatoria de precio estimado */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-gray-900 block mb-0.5">Aclaración de DetailVlak:</strong>
                  {webBudget.content?.estimated_price_disclaimer ||
                    'Presupuesto estimado. El precio final y plazos se confirman al inspeccionar personalmente el vehículo en el taller.'}
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-500/25 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Generando presupuesto...' : 'Ver mi presupuesto terminado'}</span>
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 5: PANTALLA FINAL (RESUMEN + WHATSAPP + PDF + CUPONES)         */}
        {/* =================================================================== */}
        {currentStep === 5 && createdRequest && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-2">
            {/* Header de Éxito */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                ¡Presupuesto listo, {createdRequest.client_name}!
              </h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                Tu cotización para tu <strong>{createdRequest.vehicle_brand} {createdRequest.vehicle_model}</strong> quedó registrada con el código:
              </p>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-gray-100 border border-gray-200 font-mono text-sm font-bold text-[#0066FF]">
                #{createdRequest.code}
              </div>
            </div>

            {/* Tarjeta de Resumen Detallado */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-lg shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs">
                <span className="text-gray-500">Tamaño del vehículo:</span>
                <span className="font-bold text-gray-900">{createdRequest.vehicle_category}</span>
              </div>

              {createdRequest.preferred_date && (
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs">
                  <span className="text-gray-500">Fecha en agenda:</span>
                  <span className="font-bold text-[#0066FF] flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {createdRequest.preferred_date} (
                    {createdRequest.preferred_time_slot === 'manana'
                      ? 'Mañana'
                      : createdRequest.preferred_time_slot === 'tarde'
                      ? 'Tarde'
                      : 'A coordinar'}
                    )
                  </span>
                </div>
              )}

              {/* Lista de Servicios */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Tratamientos Seleccionados
                </span>
                <div className="divide-y divide-gray-100">
                  {createdRequest.selected_services.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-900">{item.serviceName}</div>
                        {item.durationHours && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            Duración: {item.durationHours} hs
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        ${item.price.toLocaleString('es-UY')}
                      </span>
                    </div>
                  ))}

                  {createdRequest.selected_products &&
                    createdRequest.selected_products.map((prod, idx) => (
                      <div key={`p-${idx}`} className="py-2 flex items-center justify-between text-xs text-gray-700">
                        <span className="italic">+ {prod.productName} (mantenimiento)</span>
                        <span className="font-mono font-bold">${prod.price.toLocaleString('es-UY')}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Descuentos Aplicados */}
              {createdRequest.applied_discount && createdRequest.applied_discount.discount_amount > 0 && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                  <span>Descuento ({createdRequest.applied_discount.discount_name}):</span>
                  <span>-${createdRequest.applied_discount.discount_amount.toLocaleString('es-UY')} UYU</span>
                </div>
              )}

              {/* Total Final */}
              <div className="pt-3 border-t-2 border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-700">TOTAL ESTIMADO:</span>
                <span className="text-2xl font-extrabold text-[#0066FF] font-mono">
                  ${createdRequest.total_amount.toLocaleString('es-UY')}{' '}
                  <span className="text-xs text-gray-500 font-normal">UYU</span>
                </span>
              </div>
            </div>

            {/* Tarjeta de Cupón Próximo Servicio */}
            {createdRequest.next_service_coupon_code && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">¡Cupón regalo para tu próximo servicio!</span>
                    <span className="text-[11px] text-gray-600">
                      Presentalo en el taller o compartilo con un amigo para un 10% de descuento.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm bg-white px-3 py-1.5 rounded-xl border border-blue-300 text-[#0066FF] shrink-0">
                  {createdRequest.next_service_coupon_code}
                </span>
              </div>
            )}

            {/* Código de referidos personal */}
            {personalReferralCode && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block">Tu código de recomendación</span>
                    <span className="text-[11px] text-emerald-800">
                      Un amigo se ahorra 10% y vos acumulás crédito para tu próximo service.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 shrink-0">
                  {personalReferralCode}
                </span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/20 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Confirmar por WhatsApp ahora</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-gray-800 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4 text-[#0066FF]" />
                <span>Descargar Presupuesto en PDF</span>
              </button>
            </div>

            {/* Ubicación del Taller */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-gray-900">
                <MapPin className="w-4 h-4 text-[#0066FF]" />
                <span>DetailVlak Shangrilá • Av. Giannattasio</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Atención con agenda previa de Lunes a Sábados de 08:30 a 18:30 hs.
              </p>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceIds([]);
                  setSelectedProductIds([]);
                  setSelectedCategory(null);
                  setCurrentStep(1);
                  scrollToTop();
                }}
                className="text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer"
              >
                Armar otro presupuesto nuevo
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* BLOQUES DE CONFIANZA INTERCALADOS (Reseñas, FAQ y Mapa)            */}
        {/* ------------------------------------------------------------------- */}
        {currentStep <= 3 && (
          <div className="mt-14 space-y-10 pt-10 border-t border-gray-200">
            {/* Reseñas de Clientes Reales */}
            {webBudget.content?.reviews && webBudget.content.reviews.length > 0 && (
              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                    Opiniones reales
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Clientes que confiaron en DetailVlak
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {webBudget.content.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-700 italic leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60">
                        <span className="font-bold text-xs text-gray-900 block">{rev.client_name}</span>
                        {rev.vehicle && (
                          <span className="text-[10px] text-gray-500 block">{rev.vehicle}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preguntas Frecuentes (FAQ) */}
            {webBudget.content?.faqs && webBudget.content.faqs.length > 0 && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                    Dudas frecuentes
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Preguntas habituales sobre nuestros trabajos
                  </h3>
                </div>

                <div className="space-y-2 pt-2">
                  {webBudget.content.faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs open:bg-blue-50/40 open:border-blue-200 transition-all cursor-pointer"
                    >
                      <summary className="font-bold text-gray-900 flex items-center justify-between list-none">
                        <span>{faq.question}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
                      </summary>
                      <p className="text-gray-600 mt-2 leading-relaxed pt-2 border-t border-gray-200/60">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación & Mapa */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-sm text-gray-900">
                  <MapPin className="w-4 h-4 text-[#0066FF]" />
                  <span>DetailVlak Shangrilá</span>
                </div>
                <p className="text-xs text-gray-600">
                  {webBudget.content?.address ||
                    'Av. Giannattasio, Ciudad de la Costa, Canelones, Uruguay.'}
                </p>
              </div>

              <a
                href={webBudget.content?.map_url || 'https://maps.google.com/?q=Shangrila+Canelones+Uruguay'}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
              >
                <span>Cómo llegar (Google Maps)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Barra Fija Inferior (Sticky Bottom Bar con Total y Ahorro en Vivo)  */}
      {/* --------------------------------------------------------------------- */}
      {currentStep <= 3 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] safe-bottom">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Mensaje de incentivo si falta 1 servicio */}
            {nextTierPushMessage && (
              <div className="text-[11px] font-semibold text-[#0066FF] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 flex items-center justify-between">
                <span>{nextTierPushMessage}</span>
                <Percent className="w-3.5 h-3.5 shrink-0" />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {/* Resumen & Total en Vivo */}
              <div
                onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
                className="cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="truncate">
                    {selectedServices.length} servicios {selectedCategory ? `• ${selectedCategory}` : ''}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                      isSummaryDrawerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <div className="text-lg sm:text-xl font-extrabold text-gray-900 font-mono leading-tight">
                    {selectedCategory ? (
                      <>
                        ${finalTotal.toLocaleString('es-UY')}{' '}
                        <span className="text-xs font-normal text-gray-500">UYU</span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-600 font-sans font-bold">
                        Elegí tamaño de auto
                      </span>
                    )}
                  </div>

                  {discountDetails.totalDiscount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ahorrás ${discountDetails.totalDiscount.toLocaleString('es-UY')}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón Siguiente */}
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    if (!selectedCategory) {
                      alert('Por favor elegí el tamaño de tu vehículo para continuar.');
                      return;
                    }
                    setCurrentStep(2);
                  } else if (currentStep === 2) {
                    if (selectedServices.length === 0) {
                      alert('Por favor seleccioná al menos 1 servicio.');
                      return;
                    }
                    setCurrentStep(3);
                  } else if (currentStep === 3) {
                    setCurrentStep(4);
                  }
                  scrollToTop();
                }}
                disabled={currentStep === 1 && !selectedCategory}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>
                  {currentStep === 1
                    ? 'Ver Servicios'
                    : currentStep === 2
                    ? 'Elegir Día'
                    : 'Mis Datos'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Desplegable con los items seleccionados */}
            {isSummaryDrawerOpen && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 max-h-56 overflow-y-auto">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Desglose de tu presupuesto:
                </span>
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-gray-400">Aún no agregaste servicios.</p>
                ) : (
                  <div className="space-y-1.5 divide-y divide-gray-100 text-xs">
                    {selectedServices.map((s) => (
                      <div
                        key={s.tariff.id}
                        className="pt-1.5 flex items-center justify-between text-gray-700"
                      >
                        <span className="truncate pr-2">{s.tariff.shortName || s.tariff.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-gray-900 font-bold">
                            ${s.price.toLocaleString('es-UY')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleService(s.tariff.id);
                            }}
                            className="text-gray-400 hover:text-red-600 text-[10px] font-semibold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="pt-1.5 flex items-center justify-between text-gray-600 italic"
                      >
                        <span className="truncate pr-2">+ {p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold">${p.price.toLocaleString('es-UY')}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProduct(p.id);
                            }}
                            className="text-gray-400 hover:text-red-600 text-[10px] font-semibold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}

                    {discountDetails.totalDiscount > 0 && (
                      <div className="pt-2 flex items-center justify-between text-emerald-700 font-bold text-xs">
                        <span>Descuentos acumulados:</span>
                        <span>-${discountDetails.totalDiscount.toLocaleString('es-UY')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. Botón Flotante Directo de WhatsApp                                 */}
      {/* --------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={handleDirectFloatingWhatsApp}
        className="fixed bottom-20 sm:bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center shadow-xl shadow-[#25D366]/30 transition-transform active:scale-95 cursor-pointer"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* --------------------------------------------------------------------- */}
      {/* 6. Modal de Detalle de Servicio con Video Time-Lapse & Fotos         */}
      {/* --------------------------------------------------------------------- */}
      {detailModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl my-8 text-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {detailModalService.name}
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Duración estimada: {detailModalService.durationHours || 3} horas
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalService(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Video Time-Lapse embebido o subido */}
              {detailModalService.video_url && detailModalService.video_url.trim() ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Demostración Time-Lapse real de este tratamiento</span>
                  </span>
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                    {detailModalService.is_video_uploaded || detailModalService.video_url.includes('.mp4') ? (
                      <video
                        src={detailModalService.video_url}
                        controls
                        playsInline
                        className="w-full max-h-[350px] object-contain mx-auto"
                      />
                    ) : (
                      <VideoEmbed url={detailModalService.video_url} autoPlay />
                    )}
                  </div>
                </div>
              ) : null}

              {/* Fotos Antes / Después */}
              {detailModalService.before_after_images &&
                detailModalService.before_after_images.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                      Comparativa Antes / Después:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detailModalService.before_after_images.map((pair, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-red-600 block">Antes:</span>
                            <img
                              src={pair.before_url}
                              alt="Antes"
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 block">Después:</span>
                            <img
                              src={pair.after_url}
                              alt="Después"
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Descripción */}
              {detailModalService.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    ¿En qué consiste?
                  </span>
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                    {detailModalService.description}
                  </p>
                </div>
              )}

              {/* Qué Incluye (Pasos) */}
              {detailModalService.included_steps && detailModalService.included_steps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#0066FF] uppercase tracking-wider block">
                    Qué incluye este tratamiento:
                  </span>
                  <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    {detailModalService.included_steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos que Usamos */}
              {detailModalService.products_used && detailModalService.products_used.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Insumos & Productos Prémium Utilizados:
                  </span>
                  <div className="flex flex-wrap gap-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {detailModalService.products_used.map((prod, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[11px] font-medium"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuidados Recomendados */}
              {detailModalService.care_text && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <strong className="block font-bold">Cuidados recomendados posteriores:</strong>
                  <span>{detailModalService.care_text}</span>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                </span>
                {selectedCategory && categoryKey ? (
                  <span className="text-lg font-bold text-gray-900 font-mono">
                    ${(detailModalService.prices?.[categoryKey] || 0).toLocaleString('es-UY')}{' '}
                    <span className="text-xs font-normal text-gray-500">UYU</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600">
                    Elegí el tamaño de tu auto
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalService(null)}
                  className="px-3.5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleService(detailModalService.id);
                    setDetailModalService(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    selectedServiceIds.includes(detailModalService.id)
                      ? 'bg-gray-800 text-white'
                      : 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-md'
                  }`}
                >
                  {selectedServiceIds.includes(detailModalService.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Quitar</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sumar al presupuesto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. Modal de Impresión / PDF                                           */}
      {/* --------------------------------------------------------------------- */}
      {showPrintModal && createdRequest && (
        <PublicBudgetPrintView
          request={createdRequest}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. Footer General                                                     */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-gray-200 bg-gray-50 py-5 px-4 text-center text-xs text-gray-500">
        <div>
          <strong className="text-gray-700">DetailVlak</strong> • Shangrilá, Canelones • Miembro de{' '}
          <strong className="text-gray-700">CARVLAK Group</strong>
        </div>
      </footer>
    </div>
  );
};

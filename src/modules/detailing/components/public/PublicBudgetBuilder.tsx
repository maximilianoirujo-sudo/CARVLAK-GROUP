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
  Eye,
  Instagram,
  Wrench,
  Grid,
  Layers,
  Award,
  ExternalLink
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
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

interface PublicBudgetBuilderProps {
  onBackToApp?: () => void;
}

const DEFAULT_GALLERY = [
  { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80', caption: 'Sellado Cerámico Gyeon 9H' },
  { url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80', caption: 'Corrección de laca en BMW M3' },
  { url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80', caption: 'Detallado integral de interior' },
  { url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&auto=format&fit=crop&q=80', caption: 'Lavado técnico 2 baldes con Snow Foam' },
  { url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80', caption: 'Limpieza técnica de motor a vapor' },
  { url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80', caption: 'Detallado de llantas y cálipers' },
  { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', caption: 'Restauración y nutrición de cuero' },
  { url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80', caption: 'Ópticas pulidas con sellado UV' },
  { url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80', caption: 'Entrega final en taller Shangrilá' }
];

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('paso') || new URLSearchParams(window.location.search).get('step');
      if (p && ['1', '2', '3', '4', '5'].includes(p)) return Number(p) as any;
    } catch {}
    return 1;
  });

  // ---------------------------------------------------------------------------
  // 3. Selection States with LocalStorage Restore & URL Param support
  // ---------------------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('tamano') || new URLSearchParams(window.location.search).get('categoria');
      if (q) return q as VehicleCategory;
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

  // Scroll helpers & references
  const topRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLocation = () => {
    locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Active Tariffs with normalized category
  const activeTariffs = useMemo(() => {
    return tariffs
      .filter((t) => t.isActive !== false)
      .map((t) => {
        let cat = t.category;
        if (!cat) {
          const id = t.id.toLowerCase();
          if (id.includes('interior') || id.includes('cuero') || id.includes('tapizado')) cat = 'Interior';
          else if (id.includes('motor')) cat = 'Motor';
          else if (id.includes('ceramico') || id.includes('acrilico') || id.includes('protec')) cat = 'Protección';
          else cat = 'Exterior';
        }
        return { ...t, category: cat };
      })
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [tariffs]);

  // Auto-open modal from query param
  useEffect(() => {
    try {
      const modalParam = new URLSearchParams(window.location.search).get('modal');
      if (modalParam && activeTariffs.length > 0) {
        const found = activeTariffs.find(
          (t) =>
            t.id.toLowerCase() === modalParam.toLowerCase() ||
            (t.shortName || '').toLowerCase().includes(modalParam.toLowerCase())
        );
        if (found) setDetailModalService(found);
      }
    } catch {}
  }, [activeTariffs]);

  // Stories Highlights Categories
  const highlightStories = [
    { key: 'todos', label: 'Todos', icon: Grid },
    { key: 'interior', label: 'Interior', icon: Sparkles },
    { key: 'exterior', label: 'Exterior', icon: Car },
    { key: 'motor', label: 'Motor', icon: Wrench },
    { key: 'proteccion', label: 'Protección', icon: ShieldCheck },
    { key: 'ubicacion', label: 'Ubicación', icon: MapPin }
  ];

  const handleStoryHighlightClick = (key: string) => {
    if (key === 'ubicacion') {
      scrollToLocation();
      return;
    }
    setSelectedCategoryTab(key);
    if (currentStep !== 2) {
      // Si está en otro paso y toca una categoría, saltar a servicios
      if (selectedCategory) {
        setCurrentStep(2);
      }
    }
  };

  // Filtered tariffs by category
  const visibleTariffs = useMemo(() => {
    if (selectedCategoryTab === 'todos') return activeTariffs;
    const tabLower = selectedCategoryTab.toLowerCase();
    return activeTariffs.filter((t) => {
      const c = (t.category || '').toLowerCase();
      if (tabLower === 'proteccion') {
        return c.includes('protec') || c.includes('ceram') || c.includes('acril');
      }
      return c.includes(tabLower);
    });
  }, [activeTariffs, selectedCategoryTab]);

  // Selected Services with calculated prices
  const selectedServices = useMemo(() => {
    if (!categoryKey) return [];
    return selectedServiceIds
      .map((sid) => {
        const tariff = activeTariffs.find((t) => t.id === sid);
        if (!tariff) return null;
        const regularPrice = tariff.prices?.[categoryKey] || 0;
        const hasPromo = Boolean(tariff.promo_price && tariff.promo_price > 0 && tariff.promo_price < regularPrice);
        const price = hasPromo ? tariff.promo_price! : regularPrice;
        return {
          tariff,
          price,
          regularPrice,
          hasPromo,
          durationHours: tariff.durationHours || 3
        };
      })
      .filter(Boolean) as Array<{
      tariff: DetailingTariff;
      price: number;
      regularPrice: number;
      hasPromo: boolean;
      durationHours: number;
    }>;
  }, [selectedServiceIds, categoryKey, activeTariffs]);

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
        `${promoRules.product_upsell_discount_percent}% OFF por sumar productos de mantenimiento (-$${Math.round(prodDisc).toLocaleString('es-UY')})`
      );
    }

    // 3. Promo day discount
    if (preferredDate && promoRules.promo_days_enabled && promoRules.promo_days?.length) {
      const parsedDayOfWeek = new Date(preferredDate + 'T12:00:00').getDay();
      if (promoRules.promo_days.includes(parsedDayOfWeek) && promoRules.promo_days_discount_percent > 0) {
        const dayDisc = (servicesSubtotal * promoRules.promo_days_discount_percent) / 100;
        totalDiscount += dayDisc;
        reasons.push(
          `${promoRules.promo_days_discount_percent}% OFF por día promo en taller (-$${Math.round(dayDisc).toLocaleString('es-UY')})`
        );
      }
    }

    // Cap maximum discount
    const maxAllowedDiscount = (servicesSubtotal * maxDiscountPercent) / 100;
    if (totalDiscount > maxAllowedDiscount) {
      totalDiscount = maxAllowedDiscount;
      reasons.push(`(Tope máximo acumulado aplicado: ${maxDiscountPercent}%)`);
    }

    return {
      totalDiscount: Math.round(totalDiscount),
      reasons
    };
  }, [selectedServices, selectedProducts, preferredDate, promoRules, servicesSubtotal]);

  const promoDiscountAmount = discountDetails.totalDiscount;

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_amount) return appliedCoupon.discount_amount;
    if (appliedCoupon.discount_percent) {
      return Math.round((servicesSubtotal * appliedCoupon.discount_percent) / 100);
    }
    return 0;
  }, [appliedCoupon, servicesSubtotal]);

  const finalTotal = useMemo(() => {
    const raw = servicesSubtotal + productsSubtotal - promoDiscountAmount - couponDiscountAmount;
    return Math.max(0, Math.round(raw));
  }, [servicesSubtotal, productsSubtotal, promoDiscountAmount, couponDiscountAmount]);

  // Next tier incentive message
  const nextTierPushMessage = useMemo(() => {
    if (!promoRules?.tiered_quantity_enabled) return null;
    const count = selectedServices.length;
    const rules = [...(promoRules.tiered_quantity_rules || [])].sort((a, b) => a.min_services - b.min_services);
    const nextRule = rules.find((r) => r.min_services > count);
    if (!nextRule) return null;
    const diff = nextRule.min_services - count;
    if (diff === 1) {
      return `¡Sumá 1 tratamiento más y desbloqueás ${nextRule.discount_percent}% OFF en todo tu presupuesto!`;
    }
    return null;
  }, [selectedServices.length, promoRules]);

  // ---------------------------------------------------------------------------
  // 5. Handlers
  // ---------------------------------------------------------------------------
  const handleToggleService = (tariffId: string) => {
    if (selectedServiceIds.includes(tariffId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== tariffId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, tariffId]);

      // Check cross-sell recommendation
      const addedTariff = activeTariffs.find((t) => t.id === tariffId);
      if (addedTariff?.suggested_service_ids && addedTariff.suggested_service_ids.length > 0) {
        const notSelectedSuggested = activeTariffs.filter(
          (t) => addedTariff.suggested_service_ids?.includes(t.id) && !selectedServiceIds.includes(t.id) && t.id !== tariffId
        );
        if (notSelectedSuggested.length > 0) {
          setCrossSellNotification({
            parentName: addedTariff.shortName || addedTariff.name,
            suggestedTariffs: notSelectedSuggested
          });
        }
      }
    }
  };

  const handleApplyPackage = (pkg: DetailingPackage) => {
    const newServiceIds = Array.from(new Set([...selectedServiceIds, ...pkg.service_ids]));
    setSelectedServiceIds(newServiceIds);
  };

  const handleToggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const handleValidateCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      return;
    }

    if (promoRules?.referrals_enabled && code.startsWith('DV-REF-')) {
      const discount = promoRules.referral_friend_discount_percent || 10;
      setAppliedCoupon({
        code,
        discount_percent: discount,
        description: `Código amigo: ${discount}% OFF de bienvenida`
      });
      return;
    }

    const found = promoRules?.coupons?.find((c) => c.code.toUpperCase() === code && c.is_active !== false);
    if (!found) {
      alert('El código ingresado no es válido o ha expirado.');
      setAppliedCoupon(null);
      return;
    }

    if (found.max_uses && found.current_uses && found.current_uses >= found.max_uses) {
      alert('Este cupón alcanzó el límite máximo de usos.');
      return;
    }

    if (found.discount_type === 'percent') {
      setAppliedCoupon({
        code: found.code,
        discount_percent: found.discount_value,
        description: `${found.discount_value}% OFF`
      });
    } else {
      setAppliedCoupon({
        code: found.code,
        discount_amount: found.discount_value,
        description: `-$${found.discount_value.toLocaleString('es-UY')} de regalo`
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Agenda Days Generator
  // ---------------------------------------------------------------------------
  const availableAgendaDays = useMemo(() => {
    const days: Array<{
      dateIso: string;
      displayDay: string;
      displayDate: string;
      isAvailable: boolean;
      isPromo: boolean;
      statusReason: string;
    }> = [];

    const now = new Date();
    const daysAhead = 14;
    const maxCapacity = webBudget.agenda?.max_vehicles_per_day || 3;
    const blockedDates = webBudget.agenda?.blocked_dates || [];

    for (let i = 1; i <= daysAhead; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);

      const dayOfWeek = d.getDay(); // 0 domingo, 6 sábado
      const dateIso = d.toISOString().split('T')[0];
      const isSunday = dayOfWeek === 0;
      const isBlocked = blockedDates.includes(dateIso);

      const bookedCount = bookedDatesCount[dateIso] || 0;
      const isFull = bookedCount >= maxCapacity;

      const isPromo =
        Boolean(promoRules?.promo_days_enabled && promoRules.promo_days?.includes(dayOfWeek));

      let isAvailable = !isSunday && !isFull && !isBlocked;
      let statusReason = 'Disponible';

      if (isSunday || isBlocked) {
        isAvailable = false;
        statusReason = 'Cerrado';
      } else if (isFull) {
        isAvailable = false;
        statusReason = 'Completo';
      } else if (isPromo) {
        statusReason = `Promo ${promoRules?.promo_days_discount_percent}% OFF`;
      }

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

      days.push({
        dateIso,
        displayDay: dayNames[dayOfWeek],
        displayDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
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

      const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `DV-26-${randomCodeSuffix}`;
      const nowIso = new Date().toISOString();

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

      setCreatedRequest(newRequest);

      // Local storage persist
      try {
        const saved = localStorage.getItem('carvlak_detailing_web_requests');
        const list: DetailingWebRequest[] = saved ? JSON.parse(saved) : [];
        list.unshift(newRequest);
        localStorage.setItem('carvlak_detailing_web_requests', JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }

      // Sync API
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'detailing_web_requests', data: [newRequest] })
      }).catch(() => {});

      // Clear draft
      localStorage.removeItem('dv_client_draft');

      setCurrentStep(5);
      scrollToTop();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al procesar el presupuesto. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. WhatsApp Senders
  // ---------------------------------------------------------------------------
  const handleConfirmWhatsApp = () => {
    if (!createdRequest) return;

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

  const handleDirectFloatingWhatsApp = () => {
    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';
    const text = encodeURIComponent('¡Hola DetailVlak! 👋 Quisiera hacerles una consulta sobre un tratamiento para mi auto.');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const galleryItems = (webBudget.content?.gallery && webBudget.content.gallery.length > 0)
    ? webBudget.content.gallery
    : DEFAULT_GALLERY;

  return (
    <div
      ref={topRef}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#111111] flex flex-col justify-between selection:bg-[#E10600]/20 selection:text-[#E10600] font-montserrat antialiased"
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. ENCABEZADO TIPO PERFIL DE INSTAGRAM (@detailvlak)                  */}
      {/* --------------------------------------------------------------------- */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40 px-3.5 py-3 shadow-2xs w-full max-w-full min-w-0">
        <div className="max-w-4xl mx-auto space-y-2.5 w-full min-w-0">
          {/* Fila principal del perfil */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar con Story Ring rojo DetailVlak */}
              <div className="relative shrink-0 p-0.5 rounded-full ring-2 ring-[#E10600] ring-offset-2 ring-offset-white bg-[#111111]">
                <img
                  src="/detailvlak-avatar.png"
                  alt="DetailVlak"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E10600] border-2 border-white flex items-center justify-center text-[8px] text-white font-black">
                  ✓
                </span>
              </div>

              {/* Handle y biografía */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-anton uppercase tracking-wide text-base sm:text-xl text-[#111111] leading-none">
                    DetailVlak
                  </h1>
                  <span className="text-[10px] font-bold text-gray-500 font-montserrat">
                    @detailvlak
                  </span>
                </div>
                <p className="text-xs font-bold text-[#111111] mt-0.5 truncate font-montserrat">
                  ✨ Volver a estrenar tu auto ✨
                </p>
                <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                  Estética Automotriz • Shangrilá, Canelones
                </p>
              </div>
            </div>

            {/* Acceso interno al hub si está embebido */}
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black border border-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Volver al Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub interno</span>
              </button>
            )}
          </div>

          {/* Botones de acción tipo perfil de Instagram */}
          <div className="flex items-center gap-2 pt-0.5 w-full">
            <a
              href="https://www.instagram.com/detailvlak/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-0 py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs hover:opacity-95 transition-opacity"
            >
              <Instagram className="w-3.5 h-3.5 shrink-0" />
              <span className="uppercase tracking-wider text-[11px] truncate">
                <span className="hidden sm:inline">Seguinos en </span>Instagram
              </span>
            </a>

            <button
              type="button"
              onClick={handleDirectFloatingWhatsApp}
              className="flex-1 min-w-0 py-2 px-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span className="text-[11px] truncate">WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. CATEGORÍAS COMO HISTORIAS DESTACADAS (Stories Highlights)          */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-white border-b border-gray-200 py-3 px-3.5 w-full max-w-full min-w-0 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
            {highlightStories.map((story) => {
              const IconComp = story.icon;
              const isSelected = selectedCategoryTab === story.key;

              return (
                <button
                  key={story.key}
                  type="button"
                  onClick={() => handleStoryHighlightClick(story.key)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group focus:outline-hidden"
                >
                  <div
                    className={`p-0.5 rounded-full transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#E10600] ring-offset-2 ring-offset-white'
                        : 'ring-1 ring-gray-300 group-hover:ring-[#111111]'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md transition-transform group-active:scale-95 ${
                        isSelected ? 'bg-[#E10600] text-white' : 'bg-[#111111] text-white'
                      }`}
                    >
                      <IconComp className="w-6 h-6 stroke-[2.2]" />
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-tight truncate max-w-[68px] ${
                      isSelected ? 'text-[#E10600]' : 'text-gray-800'
                    }`}
                  >
                    {story.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. BARRA DE PROGRESO EN 4 PASOS (Auto → Servicios → Día → Tus datos)  */}
      {/* --------------------------------------------------------------------- */}
      {currentStep !== 5 && (
        <div className="bg-[#F2F2F2] border-b border-gray-200 px-3 py-2.5 sticky top-[110px] sm:top-[118px] z-30 backdrop-blur-xs">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-1.5 text-center">
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
                    className={`py-1 px-1 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-white border-2 border-[#E10600] shadow-xs'
                        : isPassed
                        ? 'text-gray-700 hover:bg-gray-200/60'
                        : 'text-gray-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#E10600] text-white'
                            : isPassed
                            ? 'bg-[#111111] text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : item.step}
                      </span>
                      <span
                        className={`text-xs font-black truncate uppercase tracking-wider ${
                          isActive ? 'text-[#E10600]' : isPassed ? 'text-[#111111]' : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 hidden sm:block truncate mt-0.5 font-bold">
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
      {/* 4. CONTENIDO PRINCIPAL SEGÚN EL PASO                                  */}
      {/* --------------------------------------------------------------------- */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6 pb-32">
        {/* =================================================================== */}
        {/* PASO 1: SELECCIÓN DEL AUTO (TAMAÑO)                                */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in py-2">
            {/* Header del Paso 1 */}
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs inline-block">
                  ARMÁ TU PRESUPUESTO ONLINE
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-anton uppercase text-[#111111] tracking-wide leading-tight">
                {webBudget.content?.hero_title || 'Elegí el tamaño de tu vehículo'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-bold leading-relaxed max-w-2xl">
                {webBudget.content?.hero_subtitle ||
                  'Seleccioná la categoría correspondiente a tu vehículo para desbloquear los precios exactos de cada tratamiento.'}
              </p>
            </div>

            {/* Tarjetas de Selección de Tamaño con borde rojo activo */}
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
                        ? 'bg-red-50/20 border-[#E10600] shadow-md shadow-red-500/10 ring-2 ring-[#E10600]/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#111111] text-white shadow-xs'
                            : 'bg-gray-100 border border-gray-200 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#E10600] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-gray-300 bg-white" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span
                        className={`font-black text-sm uppercase tracking-wide block ${
                          isSelected ? 'text-[#E10600]' : 'text-[#111111]'
                        }`}
                      >
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-bold block">{cat.sub}</span>
                      <span className="text-[10px] text-gray-400 font-medium block truncate mt-1">
                        {cat.examples}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón Siguiente si ya seleccionó */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-600 font-bold">
                {selectedCategory ? (
                  <span className="text-emerald-600 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#E10600]" />
                    Vehículo seleccionado: <strong className="text-[#111111]">{selectedCategory}</strong>
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
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E10600] hover:bg-[#c20500] text-white font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continuar a Servicios</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 2: SERVICIOS ESTILO REEL & COMBOS                             */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-7 animate-fade-in py-2">
            {/* Header del Paso 2 con categoría activa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <div>
                  <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs inline-block">
                    CATÁLOGO EN VIVO
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-anton uppercase text-[#111111] tracking-wide">
                  Tratamientos para tu {selectedCategory || 'auto'}
                </h2>
                <p className="text-xs text-gray-600 font-bold">
                  Mirá cómo trabajamos en videos time-lapse y sumá los tratamientos que quieras a tu presupuesto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  scrollToTop();
                }}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111111] text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200"
              >
                <span>Cambiar tamaño ({selectedCategory})</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Banner de regla de taller (interiores) */}
            <div className="p-3.5 rounded-2xl bg-[#F2F2F2] border border-gray-200 flex items-start gap-3 text-xs text-gray-800">
              <Info className="w-4 h-4 text-[#E10600] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed text-[11px]">
                <strong className="text-[#111111] block font-black uppercase tracking-wider">
                  Regla de calidad en interiores DetailVlak:
                </strong>
                <p className="text-gray-700 font-medium">
                  {webBudget.content?.interior_quality_rule ||
                    'En interiores únicamente realizamos limpieza profunda integral (incluye butacas, piso, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales.'}
                </p>
              </div>
            </div>

            {/* A) COMBOS & PAQUETES DESTACADOS */}
            {webBudget.packages &&
              webBudget.packages.filter((p) => p.is_active !== false).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                      MÁS ELEGIDO
                    </span>
                    <h3 className="text-sm font-anton uppercase text-[#111111] tracking-wide">
                      Combos & Paquetes Más Pedidos
                    </h3>
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
                                ? 'bg-red-50/20 border-[#E10600] shadow-md shadow-red-500/10'
                                : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                {pkg.badge && (
                                  <span className="bg-[#111111] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                                    ★ {pkg.badge}
                                  </span>
                                )}
                                {savings > 0 && (
                                  <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                                    AHORRÁS ${savings.toLocaleString('es-UY')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-anton uppercase text-base text-[#111111] tracking-wide">
                                  {pkg.name}
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-bold">
                                  {pkg.description}
                                </p>
                              </div>

                              {/* Servicios que incluye */}
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                                  Incluye {pkg.service_ids.length} tratamientos:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.service_ids.map((sId) => {
                                    const s = activeTariffs.find((t) => t.id === sId);
                                    if (!s) return null;
                                    return (
                                      <span
                                        key={sId}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F2F2F2] text-[#111111] border border-gray-200"
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
                                  <span className="text-[11px] text-gray-400 line-through block font-mono font-bold">
                                    ${individualTotal.toLocaleString('es-UY')}
                                  </span>
                                )}
                                <span className="text-lg font-black text-[#111111] font-mono">
                                  ${pkgPrice.toLocaleString('es-UY')}{' '}
                                  <span className="text-[10px] text-gray-500 font-normal">UYU</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplyPackage(pkg)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isAllSelected
                                    ? 'bg-[#E10600] text-white shadow-xs'
                                    : 'bg-[#111111] hover:bg-black text-white'
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

            {/* B) TARJETAS DE SERVICIO ESTILO REEL */}
            <div id="catalogo-reels" className="space-y-3 scroll-mt-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                    TRATAMIENTOS
                  </span>
                  <h3 className="text-sm font-anton uppercase text-[#111111] tracking-wide">
                    Catálogo de Servicios {selectedCategoryTab !== 'todos' ? `• ${selectedCategoryTab}` : ''}
                  </h3>
                </div>
                <span className="text-xs text-gray-600 font-bold">
                  {selectedServiceIds.length} sumado{selectedServiceIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Grilla de Reels (2 columnas en desktop, 1 en mobile o 2 compactas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleTariffs.map((tariff) => {
                  const isSelected = selectedServiceIds.includes(tariff.id);
                  const regularPrice = categoryKey ? tariff.prices?.[categoryKey] || 0 : 0;
                  const hasPromo =
                    Boolean(tariff.promo_price && tariff.promo_price > 0 && tariff.promo_price < regularPrice);
                  const effectivePrice = hasPromo ? tariff.promo_price! : regularPrice;
                  const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());

                  // Fallback cover image
                  const coverImage =
                    tariff.cover_image_url ||
                    (tariff.category === 'Interior'
                      ? 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'
                      : tariff.category === 'Motor'
                      ? 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80'
                      : tariff.category === 'Protección'
                      ? 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80');

                  return (
                    <div
                      key={tariff.id}
                      className={`group rounded-2xl border transition-all overflow-hidden flex flex-col justify-between bg-white ${
                        isSelected
                          ? 'border-[#E10600] shadow-md shadow-red-500/10 ring-2 ring-[#E10600]'
                          : 'border-gray-200 hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      {/* Portada Estilo Reel con Gradiente y Textos */}
                      <div
                        onClick={() => setDetailModalService(tariff)}
                        className="relative w-full aspect-[4/5] overflow-hidden bg-black cursor-pointer"
                      >
                        <img
                          src={coverImage}
                          alt={tariff.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                        />

                        {/* Overlay Gradiente Oscuro estilo Reel */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                        {/* Badges superiores estilo Sticker */}
                        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tariff.badge && (
                              <span className="bg-[#E10600] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md">
                                {tariff.badge}
                              </span>
                            )}
                            <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md border border-white/10 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#E10600]" /> {tariff.durationHours || 3} hs
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {hasVideo && (
                              <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                                <Play className="w-3 h-3 text-[#E10600] fill-[#E10600]" /> REEL
                              </span>
                            )}
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-[#E10600] text-white flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ícono de Play Central al pasar el mouse */}
                        {hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-md text-white flex items-center justify-center border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-white" />
                            </div>
                          </div>
                        )}

                        {/* Información inferior sobre la foto */}
                        <div className="absolute bottom-3 inset-x-3 space-y-1.5 z-10">
                          <h4 className="font-anton uppercase text-white text-base sm:text-lg leading-tight tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {tariff.shortName || tariff.name}
                          </h4>

                          {tariff.description && (
                            <p className="text-gray-200 text-xs line-clamp-2 leading-relaxed font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {tariff.description}
                            </p>
                          )}

                          {/* Precio en Etiqueta Roja estilo Sticker */}
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1 bg-[#E10600] text-white font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
                              {hasPromo && (
                                <span className="line-through text-white/70 text-[10px] mr-1">
                                  ${regularPrice.toLocaleString('es-UY')}
                                </span>
                              )}
                              <span>
                                {tariff.price_type === 'from' ? 'DESDE ' : ''}$
                                {effectivePrice.toLocaleString('es-UY')} UYU
                              </span>
                            </div>

                            <span className="text-[10px] text-white/90 font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                              <Eye className="w-3 h-3 text-[#E10600]" /> Ver más
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de acción inferior de la tarjeta */}
                      <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailModalService(tariff)}
                          className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer"
                        >
                          <span>Detalle & time-lapse</span>
                          <ArrowRight className="w-3 h-3 text-[#E10600]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleService(tariff.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#E10600] text-white shadow-md shadow-red-600/30 ring-2 ring-[#E10600]/30'
                              : 'bg-[#111111] hover:bg-black text-white'
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

            {/* C) CROSS-SELLING ("Sumale también...") */}
            {crossSellNotification && (
              <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-gray-300 space-y-3 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      RECOMENDADO
                    </span>
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Para complementar tu {crossSellNotification.parentName}:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCrossSellNotification(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs p-1"
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
                        className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-black uppercase text-[#111111] truncate block">
                            {sug.shortName || sug.name}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-gray-700">
                            +${sugPrice.toLocaleString('es-UY')} UYU
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleService(sug.id);
                            setCrossSellNotification(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#c20500] text-white text-xs font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                        >
                          + Sumar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* D) PRODUCTOS DE CUIDADO POSTERIOR (UPSELL) */}
            {webBudget.products &&
              webBudget.products.filter((p) => p.is_active !== false).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#E10600]" />
                      <h3 className="text-sm font-anton uppercase text-[#111111] tracking-wide">
                        Insumos & Cuidados para Llevar a Casa
                      </h3>
                    </div>
                    {promoRules?.product_upsell_discount_enabled && (
                      <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                        +{promoRules.product_upsell_discount_percent}% OFF en servicios
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {webBudget.products
                      .filter((p) => p.is_active !== false)
                      .map((prod) => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-red-50/20 border-[#E10600] ring-1 ring-[#E10600]'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-xs font-bold text-[#111111] truncate block">
                                {prod.name}
                              </span>
                              {prod.short_description && (
                                <p className="text-[11px] text-gray-500 line-clamp-1">
                                  {prod.short_description}
                                </p>
                              )}
                              <span className="text-xs font-mono font-bold text-[#111111] block">
                                ${prod.price.toLocaleString('es-UY')}{' '}
                                <span className="text-[10px] text-gray-400 font-normal">UYU</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleProduct(prod.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#E10600] text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-[#111111] border border-gray-300'
                              }`}
                            >
                              {isSelected ? '✓ Sumado' : '+ Sumar'}
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
        {/* PASO 3: DÍA / AGENDA                                               */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in py-2">
            <div className="space-y-1">
              <div>
                <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs inline-block">
                  AGENDA EN VIVO
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-anton uppercase text-[#111111] tracking-wide">
                Elegí el día estimado para traer tu vehículo
              </h2>
              <p className="text-xs text-gray-600 font-bold">
                Seleccioná el día que más te convenga. Los días con etiqueta verde tienen descuento promocional especial.
              </p>
            </div>

            {/* Selector de Días de la Agenda */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wide text-[#111111] block">
                Próximos días disponibles en el taller Shangrilá:
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
                          ? 'bg-red-50/30 border-[#E10600] shadow-sm ring-2 ring-[#E10600]/30 cursor-pointer'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <span className="text-[10px] font-black text-gray-500 uppercase block">
                        {day.displayDay}
                      </span>
                      <span
                        className={`text-sm font-black block my-0.5 ${
                          isSelected ? 'text-[#E10600]' : 'text-[#111111]'
                        }`}
                      >
                        {day.displayDate}
                      </span>

                      {/* Badge estado / promo */}
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                          day.isPromo
                            ? 'bg-emerald-100 text-emerald-800'
                            : !day.isAvailable
                            ? 'bg-gray-200 text-gray-500'
                            : isSelected
                            ? 'bg-[#E10600] text-white'
                            : 'bg-gray-100 text-gray-700'
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
              <span className="text-xs font-black uppercase tracking-wide text-[#111111] block">
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
                          ? 'bg-red-50/30 border-[#E10600] text-[#E10600] font-black'
                          : 'bg-[#F2F2F2] border-gray-200 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-xs font-black uppercase tracking-wide">{slot.label}</div>
                      <div className="text-[10px] text-gray-500 font-bold">{slot.hours}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opción rápida: coordinar luego */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreferredDate('');
                  setCurrentStep(4);
                  scrollToTop();
                }}
                className="text-xs text-gray-600 font-bold hover:text-black underline cursor-pointer"
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
              <div>
                <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs inline-block">
                  PASO FINAL
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-anton uppercase text-[#111111] tracking-wide">
                Tus datos para enviarte el presupuesto
              </h2>
              <p className="text-xs text-gray-600 font-bold">
                Solo tu nombre y celular son necesarios para preparar tu cotización formal y el PDF.
              </p>
            </div>

            {/* Resumen previo de lo elegido */}
            <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black uppercase text-[#111111] border-b border-gray-300 pb-2">
                <span>
                  Tratamientos elegidos ({selectedCategory}) • {selectedServices.length} servicios
                </span>
                <span className="text-[#E10600] font-mono text-base font-black">
                  ${finalTotal.toLocaleString('es-UY')} UYU
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {selectedServices.map((s) => (
                  <div key={s.tariff.id} className="flex items-center justify-between text-gray-800 font-bold">
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <span className="font-mono">${s.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-gray-600 italic">
                    <span>+ {p.name} (mantenimiento)</span>
                    <span className="font-mono font-bold">${p.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {discountDetails.totalDiscount > 0 && (
                  <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-emerald-700 font-black">
                    <span>Descuento aplicado:</span>
                    <span>-${discountDetails.totalDiscount.toLocaleString('es-UY')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cupón de descuento */}
            <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2.5 shadow-2xs">
              <span className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#E10600]" />
                <span>¿Tenés un cupón de descuento o código de amigo?</span>
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: BIENVENIDO, DETAIL10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-[#111111] uppercase font-mono font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600]"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Aplicar
                </button>
              </div>

              {appliedCoupon && (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Cupón {appliedCoupon.code} aplicado con éxito! ({appliedCoupon.description})</span>
                </div>
              )}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
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
                <span className="text-xs font-black uppercase tracking-wider text-[#E10600] block">
                  1. Tus Datos de Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Nombre y apellido <span className="text-[#E10600]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      WhatsApp / Celular <span className="text-[#E10600]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 099 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Email <span className="text-gray-400 text-[11px] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Para recibir una copia de tu presupuesto en PDF"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              {/* 2. Datos del Auto */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 space-y-3.5 shadow-2xs">
                <span className="text-xs font-black uppercase tracking-wider text-[#E10600] block">
                  2. Tu Vehículo <span className="text-gray-400 text-[11px] font-normal lowercase">(opcional)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Peugeot"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: 208"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Año</label>
                    <input
                      type="number"
                      placeholder="Ej: 2021"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Matrícula</label>
                    <input
                      type="text"
                      placeholder="Ej: SAA 1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] placeholder-gray-400 text-xs uppercase font-mono font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Día acordado</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-[#111111] text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Comentarios o notas de pintura / tapizado
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contanos si tiene rayas profundas, manchas en las butacas o algo puntual a tratar..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-[#111111] placeholder-gray-400 text-xs font-bold focus:outline-hidden focus:bg-white focus:border-[#E10600] transition-all"
                  />
                </div>
              </div>

              {/* Aclaración obligatoria de precio estimado */}
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#E10600] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-[#111111] block mb-0.5 font-black uppercase tracking-wider">
                    Aclaración de DetailVlak:
                  </strong>
                  <span className="font-semibold text-gray-700">
                    {webBudget.content?.estimated_price_disclaimer ||
                      'Presupuesto estimado. El precio final y plazos se confirman al inspeccionar personalmente el vehículo en el taller.'}
                  </span>
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#E10600] hover:bg-[#c20500] text-white font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-red-600/30 cursor-pointer disabled:opacity-50 active:scale-98"
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
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-[#E10600] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-anton uppercase text-[#111111] tracking-wide">
                ¡Presupuesto listo, {createdRequest.client_name}!
              </h2>
              <p className="text-xs text-gray-600 font-bold max-w-md mx-auto">
                Tu cotización para tu <strong>{createdRequest.vehicle_brand} {createdRequest.vehicle_model}</strong> quedó registrada con el código:
              </p>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-[#111111] font-mono text-base font-black text-white tracking-wider">
                #{createdRequest.code}
              </div>
            </div>

            {/* Tarjeta de Resumen Detallado */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-lg shadow-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs">
                <span className="text-gray-500 font-bold">Tamaño del vehículo:</span>
                <span className="font-black text-[#111111] uppercase">{createdRequest.vehicle_category}</span>
              </div>

              {createdRequest.preferred_date && (
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs">
                  <span className="text-gray-500 font-bold">Fecha en agenda:</span>
                  <span className="font-bold text-[#E10600] flex items-center gap-1">
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
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block">
                  Tratamientos Seleccionados
                </span>
                <div className="divide-y divide-gray-100">
                  {createdRequest.selected_services.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black uppercase text-[#111111]">{item.serviceName}</div>
                        {item.durationHours && (
                          <div className="text-[10px] text-gray-500 font-mono font-bold">
                            Duración estimada: {item.durationHours} hs
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-black text-[#111111]">
                        ${item.price.toLocaleString('es-UY')}
                      </span>
                    </div>
                  ))}

                  {createdRequest.selected_products &&
                    createdRequest.selected_products.map((prod, idx) => (
                      <div key={`p-${idx}`} className="py-2 flex items-center justify-between text-xs text-gray-700">
                        <span className="italic font-bold">+ {prod.productName} (mantenimiento)</span>
                        <span className="font-mono font-black">${prod.price.toLocaleString('es-UY')}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Descuentos Aplicados */}
              {createdRequest.applied_discount && createdRequest.applied_discount.discount_amount > 0 && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700 font-black">
                  <span>Descuento ({createdRequest.applied_discount.discount_name}):</span>
                  <span>-${createdRequest.applied_discount.discount_amount.toLocaleString('es-UY')} UYU</span>
                </div>
              )}

              {/* Total Final */}
              <div className="pt-3 border-t-2 border-gray-100 flex items-center justify-between">
                <span className="font-black text-sm uppercase text-gray-700">TOTAL ESTIMADO:</span>
                <span className="text-2xl font-black text-[#E10600] font-mono">
                  ${createdRequest.total_amount.toLocaleString('es-UY')}{' '}
                  <span className="text-xs text-gray-500 font-normal">UYU</span>
                </span>
              </div>
            </div>

            {/* Tarjeta de Cupón Próximo Servicio */}
            {createdRequest.next_service_coupon_code && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E10600] flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-black uppercase text-[#111111] block">¡Cupón regalo para tu próximo servicio!</span>
                    <span className="text-[11px] text-gray-600 font-medium">
                      Presentalo en el taller o compartilo con un amigo para un 10% de descuento.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm bg-white px-3 py-1.5 rounded-xl border border-red-300 text-[#E10600] shrink-0">
                  {createdRequest.next_service_coupon_code}
                </span>
              </div>
            )}

            {/* Código de referidos personal */}
            {personalReferralCode && (
              <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-gray-300 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-[#E10600]" />
                  </div>
                  <div>
                    <span className="font-black uppercase text-[#111111] block">Tu código de recomendación</span>
                    <span className="text-[11px] text-gray-600 font-medium">
                      Un amigo se ahorra 10% y vos acumulás crédito para tu próximo service.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-300 text-[#111111] shrink-0">
                  {personalReferralCode}
                </span>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/25 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Confirmar por WhatsApp ahora</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full py-3.5 rounded-2xl bg-[#111111] hover:bg-black text-white font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-gray-800 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4 text-[#E10600]" />
                <span>Descargar Presupuesto en PDF</span>
              </button>
            </div>

            {/* Ubicación del Taller */}
            <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-gray-200 text-xs text-gray-600 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-black uppercase text-[#111111]">
                <MapPin className="w-4 h-4 text-[#E10600]" />
                <span>DetailVlak Shangrilá • Av. Giannattasio</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
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
                className="text-xs text-gray-500 hover:text-black font-bold underline cursor-pointer"
              >
                Armar otro presupuesto nuevo
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECCIÓN ESTILO INSTAGRAM: "NUESTROS TRABAJOS" (FEED DE 3 COLUMNAS) */}
        {/* =================================================================== */}
        <section id="nuestros-trabajos" className="mt-14 space-y-5 pt-10 border-t border-gray-200 scroll-mt-20">
          <div className="text-center space-y-1.5">
            <div>
              <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded shadow-xs inline-block">
                FEED @DETAILVLAK
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-anton uppercase text-[#111111] tracking-wide">
              Nuestros Trabajos Reales
            </h3>
            <p className="text-xs text-gray-600 font-bold max-w-md mx-auto">
              Mirá las transformaciones diarias que realizamos en nuestro taller de estética automotriz en Shangrilá.
            </p>
          </div>

          {/* Grilla de 3 columnas estilo Instagram Feed */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 rounded-2xl overflow-hidden">
            {galleryItems.map((item, idx) => (
              <a
                key={idx}
                href="https://www.instagram.com/detailvlak/"
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden group bg-black cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.caption || 'Trabajo DetailVlak'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 p-2">
                  <div className="text-center text-white space-y-1">
                    <Instagram className="w-5 h-5 mx-auto text-[#E10600]" />
                    {item.caption && (
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-1.5 right-1.5 z-10">
                  <span className="w-5 h-5 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/90">
                    <Play className="w-2.5 h-2.5 fill-white text-white" />
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Botón Ver Más en Instagram */}
          <div className="text-center pt-2">
            <a
              href="https://www.instagram.com/detailvlak/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition-opacity"
            >
              <Instagram className="w-4 h-4" />
              <span>Ver más en Instagram @detailvlak</span>
            </a>
          </div>
        </section>

        {/* ------------------------------------------------------------------- */}
        {/* BLOQUES DE CONFIANZA (Reseñas, FAQ y Ubicación del Taller)         */}
        {/* ------------------------------------------------------------------- */}
        <div className="mt-12 space-y-10 pt-10 border-t border-gray-200">
          {/* Reseñas de Clientes Reales */}
          {webBudget.content?.reviews && webBudget.content.reviews.length > 0 && (
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <div>
                  <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs inline-block">
                    OPINIONES
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-anton uppercase text-[#111111] tracking-wide">
                  Clientes que Vuelven a Estrenar su Auto
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {webBudget.content.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[#F2F2F2] border border-gray-200 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[#E10600]">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#E10600] text-[#E10600]" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-700 italic font-semibold leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-300">
                      <span className="font-black text-xs uppercase text-[#111111] block">{rev.client_name}</span>
                      {rev.vehicle && (
                        <span className="text-[10px] text-gray-500 font-bold block">{rev.vehicle}</span>
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
                <div>
                  <span className="bg-[#E10600] text-white font-montserrat font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs inline-block">
                    PREGUNTAS FRECUENTES
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-anton uppercase text-[#111111] tracking-wide">
                  Dudas habituales sobre los tratamientos
                </h3>
              </div>

              <div className="space-y-2 pt-2">
                {webBudget.content.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group p-3.5 rounded-xl bg-[#F2F2F2] border border-gray-200 text-xs open:bg-red-50/20 open:border-red-200 transition-all cursor-pointer"
                  >
                    <summary className="font-black uppercase tracking-wide text-[#111111] flex items-center justify-between list-none">
                      <span>{faq.question}</span>
                      <ChevronDown className="w-4 h-4 text-[#E10600] group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-gray-700 font-semibold mt-2 leading-relaxed pt-2 border-t border-gray-300">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación & Mapa */}
          <div
            ref={locationRef}
            className="p-5 rounded-2xl bg-[#F2F2F2] border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-black uppercase tracking-wide text-sm text-[#111111]">
                <MapPin className="w-4 h-4 text-[#E10600]" />
                <span>DetailVlak Shangrilá</span>
              </div>
              <p className="text-xs text-gray-600 font-bold">
                {webBudget.content?.address ||
                  'Av. Giannattasio, Ciudad de la Costa, Canelones, Uruguay.'}
              </p>
            </div>

            <a
              href={webBudget.content?.map_url || 'https://maps.google.com/?q=Shangrila+Canelones+Uruguay'}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <span>Cómo llegar (Google Maps)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E10600]" />
            </a>
          </div>
        </div>
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* 5. BARRA FIJA INFERIOR (Sticky Bottom Bar Negra con Total en Blanco)  */}
      {/* --------------------------------------------------------------------- */}
      {currentStep <= 3 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#111111] border-t border-neutral-800 p-3 sm:p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.5)] safe-bottom text-white">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Mensaje de incentivo si falta 1 servicio */}
            {nextTierPushMessage && (
              <div className="text-[11px] font-bold text-white bg-[#E10600] px-3 py-1 rounded-lg flex items-center justify-between shadow-xs">
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
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                  <span className="truncate">
                    {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''}{' '}
                    {selectedCategory ? `• ${selectedCategory}` : ''}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#E10600] transition-transform shrink-0 ${
                      isSummaryDrawerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono leading-tight">
                    {selectedCategory ? (
                      <>
                        ${finalTotal.toLocaleString('es-UY')}{' '}
                        <span className="text-xs font-normal text-gray-400">UYU</span>
                      </>
                    ) : (
                      <span className="text-xs text-[#E10600] font-sans font-black uppercase tracking-wider">
                        Elegí tamaño de auto
                      </span>
                    )}
                  </div>

                  {discountDetails.totalDiscount > 0 && (
                    <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                      AHORRÁS ${discountDetails.totalDiscount.toLocaleString('es-UY')}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón Siguiente Rojo */}
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
                className="px-6 sm:px-8 py-3 rounded-xl bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>
                  {currentStep === 1
                    ? 'CONTINUAR'
                    : currentStep === 2
                    ? 'ELEGIR DÍA'
                    : 'TUS DATOS'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Desplegable con los items seleccionados */}
            {isSummaryDrawerOpen && (
              <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2 max-h-56 overflow-y-auto">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                  Desglose de tu presupuesto:
                </span>
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-gray-400">Aún no agregaste servicios.</p>
                ) : (
                  <div className="space-y-1.5 divide-y divide-neutral-800 text-xs">
                    {selectedServices.map((s) => (
                      <div
                        key={s.tariff.id}
                        className="pt-1.5 flex items-center justify-between text-gray-300"
                      >
                        <span className="truncate pr-2 font-bold">{s.tariff.shortName || s.tariff.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-white font-black">
                            ${s.price.toLocaleString('es-UY')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleService(s.tariff.id);
                            }}
                            className="text-[#E10600] hover:underline text-[10px] font-bold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="pt-1.5 flex items-center justify-between text-gray-400 italic"
                      >
                        <span className="truncate pr-2">+ {p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-white">${p.price.toLocaleString('es-UY')}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProduct(p.id);
                            }}
                            className="text-[#E10600] hover:underline text-[10px] font-bold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}

                    {discountDetails.totalDiscount > 0 && (
                      <div className="pt-2 flex items-center justify-between text-[#E10600] font-black text-xs">
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
      {/* 6. BOTÓN FLOTANTE DIRECTO DE WHATSAPP                                 */}
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
      {/* 7. MODAL DE SERVICIO ESTILO REEL CON COMPARADOR ANTES / DESPUÉS       */}
      {/* --------------------------------------------------------------------- */}
      {detailModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-auto text-[#111111] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 fill-[#E10600] text-[#E10600]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-anton uppercase text-[#111111] text-base sm:text-lg truncate tracking-wide">
                    {detailModalService.name}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-bold font-mono">
                    Duración estimada: {detailModalService.durationHours || 3} horas
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalService(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Demostración Time-Lapse en video */}
              {detailModalService.video_url && detailModalService.video_url.trim() ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      DEMO EN VIDEO
                    </span>
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Time-Lapse real de este tratamiento
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-video sm:aspect-auto">
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

              {/* COMPARADOR ANTES / DESPUÉS DESLIZABLE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#E10600] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      COMPARADOR
                    </span>
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Antes y Después (Deslizá para comparar)
                    </span>
                  </div>
                </div>

                {detailModalService.before_after_images &&
                detailModalService.before_after_images.length > 0 ? (
                  <div className="space-y-3">
                    {detailModalService.before_after_images.map((pair, idx) => (
                      <BeforeAfterSlider
                        key={idx}
                        beforeUrl={pair.before_url}
                        afterUrl={pair.after_url}
                        labelBefore="ANTES"
                        labelAfter="DESPUÉS"
                      />
                    ))}
                  </div>
                ) : (
                  // Fallback interactivo de alta calidad de DetailVlak para que siempre se vea el comparador
                  <BeforeAfterSlider
                    beforeUrl="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80"
                    afterUrl="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"
                    labelBefore="ANTES (CON SWIRLS)"
                    labelAfter="DESPUÉS (BRILLO ESPEJO)"
                  />
                )}
              </div>

              {/* Descripción del Tratamiento */}
              {detailModalService.description && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    ¿En qué consiste este tratamiento?
                  </span>
                  <p className="text-gray-800 leading-relaxed text-xs sm:text-sm font-semibold">
                    {detailModalService.description}
                  </p>
                </div>
              )}

              {/* Qué Incluye (Pasos numerados) */}
              {detailModalService.included_steps && detailModalService.included_steps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[#E10600] uppercase tracking-wider block">
                    Qué incluye este tratamiento paso a paso:
                  </span>
                  <div className="space-y-1.5 bg-[#F2F2F2] p-3.5 rounded-2xl border border-gray-200">
                    {detailModalService.included_steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-gray-800 font-bold">
                        <span className="w-4 h-4 rounded-full bg-[#E10600] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug text-xs">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insumos & Productos Prémium Utilizados */}
              {detailModalService.products_used && detailModalService.products_used.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-[#111111] uppercase tracking-wider block">
                    Insumos & Productos Importados Utilizados:
                  </span>
                  <div className="flex flex-wrap gap-1.5 bg-[#F2F2F2] p-3 rounded-2xl border border-gray-200">
                    {detailModalService.products_used.map((prod, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#111111] text-[11px] font-bold"
                      >
                        ✓ {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuidados Recomendados */}
              {detailModalService.care_text && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-950 text-[11px] space-y-1">
                  <strong className="block font-black uppercase tracking-wider">
                    Cuidados recomendados posteriores:
                  </strong>
                  <span className="font-semibold">{detailModalService.care_text}</span>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-5 py-3.5 bg-[#F2F2F2] border-t border-gray-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                </span>
                {selectedCategory && categoryKey ? (
                  <span className="text-xl font-black text-[#111111] font-mono">
                    ${(detailModalService.prices?.[categoryKey] || 0).toLocaleString('es-UY')}{' '}
                    <span className="text-xs font-normal text-gray-500">UYU</span>
                  </span>
                ) : (
                  <span className="text-xs font-black text-[#E10600] uppercase">
                    Elegí el tamaño de tu auto
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalService(null)}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold border border-gray-300 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleService(detailModalService.id);
                    setDetailModalService(null);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md ${
                    selectedServiceIds.includes(detailModalService.id)
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#E10600] hover:bg-[#c20500] text-white shadow-red-600/30'
                  }`}
                >
                  {selectedServiceIds.includes(detailModalService.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Quitar del presupuesto</span>
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
      {/* 8. MODAL DE IMPRESIÓN / PDF EN ROJO Y NEGRO DETAILVLAK                */}
      {/* --------------------------------------------------------------------- */}
      {showPrintModal && createdRequest && (
        <PublicBudgetPrintView
          request={createdRequest}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 9. FOOTER GENERAL CON IDENTIDAD DETAILVLAK                            */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-600 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src="/detailvlak-avatar.png" alt="DetailVlak" className="w-5 h-5 rounded-full" />
          <strong className="text-[#111111] font-anton uppercase tracking-wider text-sm">
            DetailVlak
          </strong>
          <span>•</span>
          <span className="font-bold">Shangrilá, Canelones</span>
        </div>
        <p className="text-[11px] text-gray-500 font-bold">
          Miembro oficial de <strong className="text-[#111111]">CARVLAK Group</strong> • Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

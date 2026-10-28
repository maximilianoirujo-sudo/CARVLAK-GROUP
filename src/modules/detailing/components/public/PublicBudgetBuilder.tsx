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
  MapPin,
  Truck,
  Bike,
  Tag,
  Percent,
  ShoppingBag,
  Gift,
  Share2,
  RotateCcw,
  ExternalLink,
  DollarSign
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
import { HeroVideoBackground } from './HeroVideoBackground';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

interface PublicBudgetBuilderProps {
  onBackToApp?: () => void;
}

const DEFAULT_GALLERY = [
  { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80', caption: 'Sellado cerámico Gyeon 9H' },
  { url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80', caption: 'Corrección de pintura en BMW M3' },
  { url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80', caption: 'Limpieza profunda de tapizados' },
  { url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&auto=format&fit=crop&q=80', caption: 'Lavado técnico detallado' },
  { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', caption: 'Limpieza técnica de motor a vapor' },
  { url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80', caption: 'Detallado de llantas y cálipers' }
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

  // Booked counts per date from quotes
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
        // Fallback
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: tariffRows, error: tariffErr } = await supabase
            .from('detailing_tariffs')
            .select('*')
            .order('order', { ascending: true });

          if (!tariffErr && tariffRows && Array.isArray(tariffRows) && tariffRows.length > 0) {
            setTariffs(tariffRows);
            localStorage.setItem('carvlak_detailing_tariffs', JSON.stringify(tariffRows));
          } else {
            const { data } = await supabase.rpc('get_public_config');
            if (data?.detailing_tariffs && Array.isArray(data.detailing_tariffs)) {
              setTariffs(data.detailing_tariffs);
              localStorage.setItem('carvlak_detailing_tariffs', JSON.stringify(data.detailing_tariffs));
            }
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
  const [createdRequest, setCreatedRequest] = useState<DetailingWebRequest | null>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('paso');
      if (p === '5') {
        const saved = localStorage.getItem('carvlak_detailing_web_requests');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) return list[0];
        }
        return {
          id: 'webreq-demo',
          code: 'DV-26-9824',
          created_at: new Date().toISOString(),
          status: 'incompleta',
          is_completed: false,
          origin: 'Directo / Web',
          is_paid_ad: false,
          client_name: 'Santiago Morales',
          client_phone: '+598 99 123 456',
          vehicle_brand: 'Audi',
          vehicle_model: 'Q5',
          vehicle_year: 2023,
          vehicle_category: 'SUV/Rural',
          selected_services: [
            {
              serviceId: '1',
              serviceName: 'Tratamiento Cerámico 9H (3 Años)',
              price: 18500,
              durationHours: 12
            },
            {
              serviceId: '2',
              serviceName: 'Limpieza Integral de Interior y Tapizados',
              price: 6500,
              durationHours: 6
            }
          ],
          selected_products: [
            {
              productId: 'p-1',
              productName: 'Shampoo pH Neutro Gyeon Bathe+ 500ml',
              price: 1450
            }
          ],
          applied_discount: {
            discount_name: 'Descuento por 2 tratamientos (10% OFF)',
            discount_amount: 2500
          },
          total_amount: 23950,
          preferred_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          preferred_time_slot: 'manana'
        } as DetailingWebRequest;
      }
    } catch {}
    return null;
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [personalReferralCode, setPersonalReferralCode] = useState('');

  // Category filter in catalog
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('todos');

  // Scroll helpers & references
  const topRef = useRef<HTMLDivElement>(null);
  const configSectionRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToConfig = () => {
    configSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToLocation = () => {
    locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('scroll');
      if (p === 'inferiores' || window.location.hash === '#secciones-inferiores') {
        setTimeout(() => {
          document.getElementById('secciones-inferiores')?.scrollIntoView({ behavior: 'instant' as any, block: 'start' });
        }, 100);
      }
    } catch {}
  }, []);

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
      .map((pid) => list.find((p) => p.id === pid))
      .filter(Boolean) as DetailingUpsellProduct[];
  }, [selectedProductIds, webBudget.products]);

  // Subtotals
  const servicesSubtotal = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.price, 0);
  }, [selectedServices]);

  const productsSubtotal = useMemo(() => {
    return selectedProducts.reduce((sum, prod) => sum + prod.price, 0);
  }, [selectedProducts]);

  // Discounts
  const promoRules = webBudget.promotions;

  const discountDetails = useMemo(() => {
    let totalDiscount = 0;
    const reasons: string[] = [];
    const count = selectedServices.length;
    const maxDiscountPercent = promoRules?.max_accumulated_discount_percent || 40;

    if (!promoRules) {
      return { totalDiscount: 0, reasons: [] };
    }

    // 1. Tiered quantity discount
    if (promoRules.tiered_quantity_enabled && promoRules.tiered_quantity_rules?.length) {
      const applicableRules = [...promoRules.tiered_quantity_rules]
        .sort((a, b) => b.min_services - a.min_services)
        .filter((r) => count >= r.min_services);

      if (applicableRules.length > 0) {
        const bestRule = applicableRules[0];
        const tierDiscount = (servicesSubtotal * bestRule.discount_percent) / 100;
        totalDiscount += tierDiscount;
        reasons.push(
          `${bestRule.discount_percent}% OFF por sumar ${count} tratamientos (-$${Math.round(tierDiscount).toLocaleString('es-UY')})`
        );
      }
    }

    // 2. Product upsell discount
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
      return `Sumá 1 tratamiento más y desbloqueás ${nextRule.discount_percent}% OFF en todo tu presupuesto.`;
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
        description: `-$${found.discount_value.toLocaleString('es-UY')} de descuento`
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

      const dayOfWeek = d.getDay();
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

      let nextServiceCouponCode: string | undefined;
      if (promoRules?.coupons && promoRules.coupons.length > 0) {
        const autoC = promoRules.coupons.find((c) => c.is_active !== false);
        if (autoC) nextServiceCouponCode = autoC.code;
      }
      if (!nextServiceCouponCode) {
        nextServiceCouponCode = `DV-PROXIMO-${Math.floor(100 + Math.random() * 900)}`;
      }

      const personalRef = `DV-REF-${Math.floor(1000 + Math.random() * 9000)}`;
      setPersonalReferralCode(personalRef);

      const newRequest: DetailingWebRequest = {
        id: `webreq-${Date.now()}`,
        code,
        created_at: nowIso,
        status: 'incompleta',
        is_completed: false,
        origin,
        is_paid_ad: isPaidAd,
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_email: email.trim() || undefined,
        vehicle_brand: vehicleBrand.trim() || 'A coordinar',
        vehicle_model: vehicleModel.trim() || '',
        vehicle_year: vehicleYear.trim() ? Number(vehicleYear.trim()) : undefined,
        vehicle_plate: vehiclePlate.trim().toUpperCase() || undefined,
        vehicle_category: selectedCategory,
        selected_services: selectedServices.map((s) => ({
          serviceId: s.tariff.id,
          serviceName: s.tariff.name,
          category: s.tariff.category || 'General',
          price: s.price,
          durationHours: s.durationHours
        })),
        selected_products: selectedProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          price: p.price
        })),
        applied_discount:
          promoDiscountAmount > 0 || couponDiscountAmount > 0
            ? {
                discount_name: appliedCoupon ? `Promo + ${appliedCoupon.description}` : 'Descuentos acumulados',
                discount_amount: promoDiscountAmount + couponDiscountAmount,
                coupon_code: appliedCoupon?.code
              }
            : undefined,
        total_amount: finalTotal,
        preferred_date: preferredDate || undefined,
        preferred_time_slot: preferredTimeSlot,
        comments: comments.trim() || undefined,
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
¿Tienen disponibilidad en esas fechas para coordinar la inspección?`;

    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');
  };

  const handleDirectWhatsApp = () => {
    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';
    const text = encodeURIComponent('¡Hola DetailVlak! 👋 Quisiera hacerles una consulta sobre un tratamiento para mi auto.');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const galleryItems = (webBudget.content?.gallery && webBudget.content.gallery.length > 0)
    ? webBudget.content.gallery
    : DEFAULT_GALLERY;

  const categoryChips = [
    { key: 'todos', label: 'Todos' },
    { key: 'interior', label: 'Interior' },
    { key: 'exterior', label: 'Exterior' },
    { key: 'motor', label: 'Motor' },
    { key: 'proteccion', label: 'Protección' }
  ];

  const isOnlySections = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('solo_secciones') === '1';
    } catch {
      return false;
    }
  }, []);

  return (
    <div
      ref={topRef}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#0B0B0C] flex flex-col justify-between selection:bg-[#1E5EFF]/15 selection:text-[#1E5EFF] font-inter antialiased"
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. ENCABEZADO COMPACTO Y FIJO                                         */}
      {/* --------------------------------------------------------------------- */}
      <header className="border-b border-[#E6E8EB] bg-white sticky top-0 z-40 px-5 sm:px-6 h-[60px] flex items-center shadow-xs">
        <div className="max-w-[1080px] w-full mx-auto flex items-center justify-between">
          {/* Logo DetailVlak a la izquierda */}
          <div className="flex items-center gap-3">
            <a href="/presupuesto" className="flex items-center gap-2.5 group">
              <img
                src="/detailvlak-logo.png"
                alt="DetailVlak"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </a>
          </div>

          {/* Acciones a la derecha: WhatsApp directo y link a hub si aplica */}
          <div className="flex items-center gap-2.5">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3 py-1.5 rounded-[10px] bg-[#F5F6F7] hover:bg-[#E6E8EB] text-[#3A3D42] text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Volver al Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub interno</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="w-10 h-10 rounded-full bg-[#F5F6F7] hover:bg-[#E6E8EB] text-[#25D366] flex items-center justify-center transition-colors cursor-pointer"
              title="Consultar por WhatsApp"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. PORTADA (HERO) A ANCHO COMPLETO CON OSCURECIDO SUAVE                */}
      {/* --------------------------------------------------------------------- */}
      {currentStep === 1 && !isOnlySections && (
        <section className="px-5 sm:px-6 pt-5 max-w-[1080px] w-full mx-auto">
          <HeroVideoBackground
            mediaType={webBudget.appearance?.hero_media_type || 'video'}
            imageUrl={webBudget.appearance?.hero_image_url}
            posterUrl={webBudget.appearance?.hero_poster_url || '/videos/portada-poster.webp'}
            clips={webBudget.appearance?.hero_video_clips}
          >
            <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.06em] text-[#E6E8EB]/80 block">
              DetailVlak • Estética Automotriz Shangrilá
            </span>
            <h1 className="text-[26px] sm:text-[32px] font-bold leading-[1.15] text-white tracking-tight">
              Volvé a estrenar tu auto
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#E6E8EB] font-normal leading-relaxed max-w-lg">
              Armá tu presupuesto a medida en segundos con precios claros y atención personalizada.
            </p>
            <div className="pt-1.5">
              <button
                type="button"
                onClick={scrollToConfig}
                className="h-[52px] px-6 sm:px-8 rounded-[12px] bg-[#1E5EFF] hover:bg-[#1747C7] text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-98"
              >
                <span>Armar mi presupuesto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </HeroVideoBackground>

          {/* 3 datos de confianza en fila con íconos de línea grises */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 pb-1">
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[14px] bg-[#F5F6F7] border border-[#E6E8EB]">
              <ShieldCheck className="w-5 h-5 text-[#6B7079] shrink-0" />
              <div className="min-w-0">
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#0B0B0C] block truncate">
                  Productos profesionales
                </span>
                <span className="text-[12px] sm:text-[13px] text-[#6B7079] block truncate">
                  Insumos importados Gyeon & Koch
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[14px] bg-[#F5F6F7] border border-[#E6E8EB]">
              <DollarSign className="w-5 h-5 text-[#6B7079] shrink-0" />
              <div className="min-w-0">
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#0B0B0C] block truncate">
                  Precio claro
                </span>
                <span className="text-[12px] sm:text-[13px] text-[#6B7079] block truncate">
                  Sin sorpresas ni cargos ocultos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-[14px] bg-[#F5F6F7] border border-[#E6E8EB]">
              <MessageCircle className="w-5 h-5 text-[#6B7079] shrink-0" />
              <div className="min-w-0">
                <span className="text-[14px] sm:text-[15px] font-semibold text-[#0B0B0C] block truncate">
                  Confirmás por WhatsApp
                </span>
                <span className="text-[12px] sm:text-[13px] text-[#6B7079] block truncate">
                  Coordinación rápida y directa
                </span>
              </div>
            </div>
          </div>

          {/* Carrusel de videos reales: engancha desde el inicio */}
          {(() => {
            const reelServices = activeTariffs.filter((t) => (t.video_url || '').includes('.mp4'));
            if (reelServices.length === 0) return null;
            return (
              <div className="pt-6">
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1E5EFF] block">
                      Trabajos reales en nuestro taller
                    </span>
                    <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0B0B0C] leading-tight">
                      Mirá cómo trabajamos
                    </h2>
                  </div>
                  <span className="text-[12px] text-[#6B7079] shrink-0">Deslizá →</span>
                </div>
                <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
                  {reelServices.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDetailModalService(t)}
                      className="relative shrink-0 w-[160px] sm:w-[200px] aspect-[9/16] rounded-[14px] overflow-hidden bg-[#0B0B0C] snap-start text-left cursor-pointer active:scale-98 transition-transform"
                    >
                      <video
                        src={t.video_url}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <span className="text-white text-[14px] font-semibold leading-snug block line-clamp-2">
                          {t.shortName || t.name}
                        </span>
                        <span className="text-[#8FB3FF] text-[12px] font-semibold">Ver servicio →</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={scrollToConfig}
                  className="mt-3 w-full h-[48px] rounded-[12px] bg-[#0B0B0C] hover:bg-black text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Quiero esto para mi auto</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </section>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. BARRA DE PASOS: FINA, GRIS, CON PASO ACTUAL EN AZUL                */}
      {/* --------------------------------------------------------------------- */}
      {currentStep !== 5 && !isOnlySections && (
        <div className="bg-[#F5F6F7] border-y border-[#E6E8EB] sticky top-[60px] z-30 py-2.5 px-5 sm:px-6">
          <div className="max-w-[1080px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] min-w-0 flex-1 truncate">
              <span className="text-[#1E5EFF] font-semibold shrink-0">
                Paso {currentStep} de 4:
              </span>
              <span className="text-[#0B0B0C] font-semibold truncate">
                {currentStep === 1
                  ? 'Tamaño del vehículo'
                  : currentStep === 2
                  ? 'Tratamientos y servicios'
                  : currentStep === 3
                  ? 'Día en agenda'
                  : 'Tus datos'}
              </span>
            </div>

            {/* Navegación a pasos completados */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[1, 2, 3, 4].map((stepNumber) => {
                const isActive = currentStep === stepNumber;
                const isPassed = currentStep > stepNumber;
                return (
                  <button
                    key={stepNumber}
                    type="button"
                    disabled={!isPassed && !isActive}
                    onClick={() => {
                      if (isPassed) {
                        setCurrentStep(stepNumber as any);
                        scrollToTop();
                      }
                    }}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-[12px] font-semibold flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#1E5EFF] text-white shadow-xs'
                        : isPassed
                        ? 'bg-[#0B0B0C] text-white hover:bg-neutral-800 cursor-pointer'
                        : 'bg-[#E6E8EB] text-[#6B7079] cursor-not-allowed'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : stepNumber}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. CONTENIDO PRINCIPAL POR PASO                                       */}
      {/* --------------------------------------------------------------------- */}
      {!isOnlySections && (
        <main
          ref={configSectionRef}
          className="flex-1 max-w-[1080px] w-full mx-auto px-5 sm:px-6 py-8 pb-32"
        >
        {/* =================================================================== */}
        {/* PASO 1: SELECCIÓN DEL AUTO (TAMAÑO)                                 */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                Elegí el tamaño de tu vehículo
              </h2>
              <p className="text-[13px] text-[#6B7079]">
                Seleccioná la categoría correspondiente para desbloquear los precios exactos de cada tratamiento.
              </p>
            </div>

            {/* Tarjetas de Selección de Tamaño */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
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
                    className={`p-4 rounded-[14px] cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 border-[#1E5EFF] bg-[#EEF3FF] shadow-xs'
                        : 'bg-white border border-[#E6E8EB] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#1E5EFF] text-white shadow-xs'
                            : 'bg-[#F5F6F7] text-[#6B7079]'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#1E5EFF] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-[#E6E8EB] bg-white" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[17px] font-semibold text-[#0B0B0C] block">
                        {cat.label}
                      </span>
                      <span className="text-[13px] text-[#6B7079] block">{cat.sub}</span>
                      <span className="text-[12px] text-[#6B7079] block truncate mt-1">
                        {cat.examples}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 2: SERVICIOS CON FILTROS EN CHIPS Y FOTOS 4:3                  */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-8">
            {/* Header del Paso 2 con botón secundario para cambiar auto */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E8EB] pb-4">
              <div className="space-y-1">
                <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                  Tratamientos para tu {selectedCategory || 'auto'}
                </h2>
                <p className="text-[13px] text-[#6B7079]">
                  Mirá cómo trabajamos en cada tratamiento y sumá los que quieras a tu presupuesto.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  scrollToTop();
                }}
                className="self-start sm:self-auto px-3.5 py-2 rounded-[10px] bg-white border border-[#E6E8EB] hover:bg-[#F5F6F7] text-[#0B0B0C] text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Cambiar tamaño ({selectedCategory})</span>
                <RotateCcw className="w-3.5 h-3.5 text-[#6B7079]" />
              </button>
            </div>

            {/* Regla de calidad en interiores DetailVlak */}
            <div className="p-4 rounded-[14px] bg-[#F5F6F7] border border-[#E6E8EB] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#1E5EFF] shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[13px]">
                <strong className="text-[#0B0B0C] block font-semibold">
                  Regla de calidad en interiores:
                </strong>
                <p className="text-[#3A3D42] font-normal leading-relaxed">
                  {webBudget.content?.interior_quality_rule ||
                    'En interiores únicamente realizamos limpieza profunda integral (incluye butacas, piso, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales.'}
                </p>
              </div>
            </div>

            {/* A) COMBOS & PAQUETES DESTACADOS */}
            {webBudget.packages &&
              webBudget.packages.filter((p) => p.is_active !== false).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079]">
                      PAQUETES DESTACADOS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className={`p-4 rounded-[14px] border transition-all flex flex-col justify-between ${
                              isAllSelected
                                ? 'bg-[#EEF3FF] border-[#1E5EFF] shadow-xs'
                                : 'bg-white border-[#E6E8EB] hover:shadow-xs'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#1E5EFF]">
                                  Combo ahorro
                                </span>
                                {savings > 0 && (
                                  <span className="text-[13px] text-[#1E5EFF] font-semibold">
                                    Ahorrás ${savings.toLocaleString('es-UY')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <h3 className="text-[17px] font-semibold text-[#0B0B0C]">
                                  {pkg.name}
                                </h3>
                                <p className="text-[13px] text-[#6B7079] line-clamp-2 leading-relaxed">
                                  {pkg.description}
                                </p>
                              </div>

                              {/* Servicios que incluye */}
                              <div className="space-y-1 pt-1">
                                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                                  Incluye {pkg.service_ids.length} tratamientos:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pkg.service_ids.map((sId) => {
                                    const s = activeTariffs.find((t) => t.id === sId);
                                    if (!s) return null;
                                    return (
                                      <span
                                        key={sId}
                                        className="text-[12px] font-normal px-2.5 py-0.5 rounded-[6px] bg-[#F5F6F7] text-[#3A3D42] border border-[#E6E8EB]"
                                      >
                                        ✓ {s.shortName || s.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Precio y Botón Sumar Combo */}
                            <div className="pt-4 border-t border-[#E6E8EB] flex items-center justify-between gap-3 mt-4">
                              <div>
                                {savings > 0 && individualTotal > 0 && (
                                  <span className="text-[12px] text-[#6B7079] line-through block font-mono">
                                    ${individualTotal.toLocaleString('es-UY')}
                                  </span>
                                )}
                                <span className="text-[20px] font-bold font-mono tabular-nums text-[#1E5EFF]">
                                  ${pkgPrice.toLocaleString('es-UY')}{' '}
                                  <span className="text-[13px] text-[#6B7079] font-normal">UYU</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplyPackage(pkg)}
                                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                  isAllSelected
                                    ? 'bg-[#1E5EFF] text-white'
                                    : 'bg-white border border-[#E6E8EB] text-[#0B0B0C] hover:bg-[#F5F6F7]'
                                }`}
                              >
                                {isAllSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Agregado</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Agregar</span>
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

            {/* B) FILTROS DE CATEGORÍA COMO CHIPS HORIZONTALES SIMPLES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoryChips.map((chip) => {
                  const isSelected = selectedCategoryTab === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setSelectedCategoryTab(chip.key)}
                      className={`px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#0B0B0C] text-white shadow-xs'
                          : 'bg-white text-[#6B7079] border border-[#E6E8EB] hover:bg-[#F5F6F7]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              {/* GRILLA DE TARJETAS DE SERVICIO (FOTO 4:3 ARRIBA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTariffs.map((tariff) => {
                  const isSelected = selectedServiceIds.includes(tariff.id);
                  const regularPrice = categoryKey ? tariff.prices?.[categoryKey] || 0 : 0;
                  const hasPromo =
                    Boolean(tariff.promo_price && tariff.promo_price > 0 && tariff.promo_price < regularPrice);
                  const effectivePrice = hasPromo ? tariff.promo_price! : regularPrice;
                  const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());

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
                      className={`group rounded-[14px] border overflow-hidden flex flex-col justify-between bg-white transition-all ${
                        isSelected
                          ? 'border-[#1E5EFF] shadow-xs'
                          : 'border-[#E6E8EB] hover:shadow-xs'
                      }`}
                    >
                      {/* Foto 4:3 arriba con ícono de play si tiene video */}
                      <div
                        onClick={() => setDetailModalService(tariff)}
                        className="relative w-full aspect-[4/3] overflow-hidden bg-[#F5F6F7] cursor-pointer"
                      >
                        {(tariff.video_url || '').includes('.mp4') ? (
                          <video
                            src={tariff.video_url}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                            poster={coverImage}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <img
                            src={coverImage}
                            alt={tariff.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                        )}

                        {/* Badges superiores discretos */}
                        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
                          {tariff.badge ? (
                            <span className="bg-[#0B0B0C]/85 backdrop-blur-xs text-white text-[11px] font-medium uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-[6px]">
                              {tariff.badge}
                            </span>
                          ) : (
                            <span />
                          )}

                          {hasVideo && (
                            <span className="bg-[#0B0B0C]/85 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-[6px] flex items-center gap-1">
                              <Play className="w-3 h-3 text-[#1E5EFF] fill-[#1E5EFF]" /> Video
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Información de la tarjeta */}
                      <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                        <div
                          onClick={() => setDetailModalService(tariff)}
                          className="space-y-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[17px] font-semibold text-[#0B0B0C] group-hover:text-[#1E5EFF] transition-colors leading-snug">
                              {tariff.shortName || tariff.name}
                            </h3>
                          </div>
                          <span className="text-[13px] text-[#6B7079] block">
                            Duración aprox. {tariff.durationHours || 3} horas
                          </span>
                          {tariff.description && (
                            <p className="text-[13px] text-[#6B7079] line-clamp-2 leading-relaxed pt-1">
                              {tariff.description}
                            </p>
                          )}
                        </div>

                        {/* Fila inferior con precio en azul a la derecha y botón Agregar */}
                        <div className="pt-3 border-t border-[#E6E8EB] flex items-center justify-between gap-3">
                          <div className="text-right">
                            <span className="text-[20px] font-bold font-mono tabular-nums text-[#1E5EFF]">
                              ${effectivePrice.toLocaleString('es-UY')}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleService(tariff.id)}
                            className={`h-[38px] px-4 rounded-[10px] text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E5EFF] text-white shadow-xs'
                                : 'bg-white border border-[#E6E8EB] text-[#0B0B0C] hover:bg-[#F5F6F7]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Agregado</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C) PRODUCTOS DE CUIDADO POSTERIOR (UPSELL) */}
            {webBudget.products &&
              webBudget.products.filter((p) => p.is_active !== false).length > 0 && (
                <div className="space-y-4 pt-6 border-t border-[#E6E8EB]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                        CUIDADO EN CASA
                      </span>
                      <h3 className="text-[17px] font-semibold text-[#0B0B0C]">
                        Productos de mantenimiento para llevar
                      </h3>
                    </div>
                    {promoRules?.product_upsell_discount_enabled && (
                      <span className="text-[13px] text-[#1E5EFF] font-semibold">
                        +{promoRules.product_upsell_discount_percent}% OFF en servicios
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {webBudget.products
                      .filter((p) => p.is_active !== false)
                      .map((prod) => {
                        const isSelected = selectedProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            className={`p-4 rounded-[14px] border transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#EEF3FF] border-[#1E5EFF]'
                                : 'bg-white border-[#E6E8EB] hover:shadow-xs'
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-[15px] font-semibold text-[#0B0B0C] truncate block">
                                {prod.name}
                              </span>
                              {prod.short_description && (
                                <p className="text-[13px] text-[#6B7079] line-clamp-1">
                                  {prod.short_description}
                                </p>
                              )}
                              <span className="text-[15px] font-bold font-mono tabular-nums text-[#1E5EFF] block pt-1">
                                ${prod.price.toLocaleString('es-UY')}{' '}
                                <span className="text-[12px] text-[#6B7079] font-normal">UYU</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleProduct(prod.id)}
                              className={`h-[38px] px-3.5 rounded-[10px] text-[13px] font-semibold shrink-0 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1E5EFF] text-white'
                                  : 'bg-white border border-[#E6E8EB] text-[#0B0B0C] hover:bg-[#F5F6F7]'
                              }`}
                            >
                              {isSelected ? '✓ Agregado' : '+ Agregar'}
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
        {/* PASO 3: DÍA / AGENDA                                                */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                Elegí el día estimado
              </h2>
              <p className="text-[13px] text-[#6B7079]">
                Seleccioná una fecha disponible para traer tu vehículo al taller Shangrilá.
              </p>
            </div>

            {/* Selector de Días de la Agenda */}
            <div className="space-y-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                Próximos días disponibles
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
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
                      className={`p-3.5 rounded-[14px] border text-center transition-all flex flex-col justify-between ${
                        !day.isAvailable
                          ? 'bg-[#F5F6F7] border-[#E6E8EB] opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#EEF3FF] border-2 border-[#1E5EFF] shadow-xs cursor-pointer'
                          : 'bg-white border-[#E6E8EB] hover:border-[#1E5EFF]/50 cursor-pointer'
                      }`}
                    >
                      <span className="text-[12px] font-medium text-[#6B7079] uppercase block">
                        {day.displayDay}
                      </span>
                      <span
                        className={`text-[15px] font-bold block my-1 ${
                          isSelected ? 'text-[#1E5EFF]' : 'text-[#0B0B0C]'
                        }`}
                      >
                        {day.displayDate}
                      </span>

                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-[6px] inline-block mt-1 ${
                          day.isPromo
                            ? 'bg-[#EEF3FF] text-[#1E5EFF] font-semibold'
                            : !day.isAvailable
                            ? 'bg-[#E6E8EB] text-[#6B7079]'
                            : isSelected
                            ? 'bg-[#1E5EFF] text-white'
                            : 'bg-[#F5F6F7] text-[#6B7079]'
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
            <div className="space-y-2 pt-4 border-t border-[#E6E8EB]">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                Franja horaria preferida
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className={`p-3.5 rounded-[12px] border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#EEF3FF] border-2 border-[#1E5EFF]'
                          : 'bg-white border-[#E6E8EB] hover:bg-[#F5F6F7]'
                      }`}
                    >
                      <div className="text-[15px] font-semibold text-[#0B0B0C]">{slot.label}</div>
                      <div className="text-[13px] text-[#6B7079]">{slot.hours}</div>
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
                className="text-[13px] text-[#6B7079] hover:text-[#0B0B0C] font-medium underline cursor-pointer"
              >
                Prefiero coordinar la fecha exacta directamente por WhatsApp →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 4: FORMULARIO DE DATOS & CUPÓN                                 */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="space-y-1">
              <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                Tus datos para el presupuesto
              </h2>
              <p className="text-[13px] text-[#6B7079]">
                Solo tu nombre y WhatsApp son necesarios para enviarte la cotización formal.
              </p>
            </div>

            {/* Resumen previo de lo elegido tipo comprobante sobrio */}
            <div className="p-4 rounded-[14px] bg-[#F5F6F7] border border-[#E6E8EB] space-y-2.5">
              <div className="flex items-center justify-between text-[13px] font-semibold text-[#0B0B0C] border-b border-[#E6E8EB] pb-2">
                <span>
                  Tratamientos elegidos ({selectedCategory}) • {selectedServices.length} servicios
                </span>
                <span className="text-[#1E5EFF] font-mono text-[17px] font-bold tabular-nums">
                  ${finalTotal.toLocaleString('es-UY')} UYU
                </span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                {selectedServices.map((s) => (
                  <div key={s.tariff.id} className="flex items-center justify-between text-[#3A3D42]">
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <span className="font-mono tabular-nums">${s.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[#6B7079]">
                    <span>+ {p.name} (cuidado en casa)</span>
                    <span className="font-mono tabular-nums">${p.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
                {discountDetails.totalDiscount > 0 && (
                  <div className="pt-2 border-t border-[#E6E8EB] flex items-center justify-between text-[#1E5EFF] font-semibold">
                    <span>Descuentos acumulados:</span>
                    <span className="font-mono tabular-nums">-${discountDetails.totalDiscount.toLocaleString('es-UY')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cupón de descuento */}
            <div className="p-4 rounded-[14px] bg-white border border-[#E6E8EB] space-y-2.5">
              <span className="text-[13px] font-medium text-[#0B0B0C] flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#1E5EFF]" />
                <span>¿Tenés un cupón de descuento?</span>
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: DETAIL10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white border border-[#E6E8EB] rounded-[12px] h-[52px] px-4 text-[15px] text-[#0B0B0C] uppercase font-mono font-medium focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  className="px-5 h-[52px] rounded-[12px] bg-white border border-[#E6E8EB] hover:bg-[#F5F6F7] text-[#0B0B0C] text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Aplicar
                </button>
              </div>

              {appliedCoupon && (
                <div className="text-[13px] text-[#1E5EFF] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#1E5EFF]" />
                  <span>Cupón {appliedCoupon.code} aplicado ({appliedCoupon.description})</span>
                </div>
              )}
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="extra_field_trap"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* 1. Datos de Contacto (Obligatorios) */}
              <div className="p-5 rounded-[14px] bg-white border border-[#E6E8EB] space-y-4">
                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                  Datos de contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">
                      Nombre y apellido <span className="text-[#1E5EFF]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">
                      WhatsApp / Celular <span className="text-[#1E5EFF]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 099 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#3A3D42] block">
                    Email <span className="text-[#6B7079] text-[12px] font-normal">(opcional, para enviarte el PDF)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="tunombre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                  />
                </div>
              </div>

              {/* 2. Datos del Auto (Opcional) */}
              <div className="p-5 rounded-[14px] bg-white border border-[#E6E8EB] space-y-4">
                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                  Datos del auto (opcional)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Volkswagen"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: Golf GTI"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">Año</label>
                    <input
                      type="number"
                      placeholder="Ej: 2021"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">Matrícula</label>
                    <input
                      type="text"
                      placeholder="Ej: SBX 4821"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] uppercase font-mono focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#3A3D42] block">Día preferido</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full h-[52px] bg-white border border-[#E6E8EB] rounded-[12px] px-4 text-[#0B0B0C] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#3A3D42] block">
                    Comentarios o detalles especiales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contanos si tiene rayas profundas, manchas en las butacas o algo puntual a tratar..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-white border border-[#E6E8EB] rounded-[12px] p-3.5 text-[#0B0B0C] placeholder-[#6B7079] text-[15px] focus:outline-hidden focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] transition-all"
                  />
                </div>
              </div>

              {/* Aclaración de precio estimado */}
              <div className="p-4 rounded-[12px] bg-[#F5F6F7] border border-[#E6E8EB] flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#6B7079] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#6B7079] leading-relaxed">
                  {webBudget.content?.estimated_price_disclaimer ||
                    'Presupuesto estimado. El precio final y plazos se confirman al inspeccionar personalmente el vehículo en el taller.'}
                </p>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[52px] rounded-[12px] bg-[#1E5EFF] hover:bg-[#1747C7] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <span>{isSubmitting ? 'Generando presupuesto...' : 'Ver mi presupuesto terminado'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 5: RESULTADO (TARJETA TIPO COMPROBANTE SOBRIO)                  */}
        {/* =================================================================== */}
        {currentStep === 5 && createdRequest && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header de Éxito */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#EEF3FF] text-[#1E5EFF] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-[32px] font-bold leading-[1.15] text-[#0B0B0C]">
                Presupuesto listo, {createdRequest.client_name}
              </h2>
              <div className="pt-1">
                <span className="text-[12px] font-mono font-medium text-[#6B7079] bg-[#F5F6F7] border border-[#E6E8EB] px-3 py-1 rounded-[8px] inline-block">
                  #{createdRequest.code}
                </span>
              </div>
            </div>

            {/* Tarjeta tipo comprobante */}
            <div className="p-6 rounded-[14px] bg-white border border-[#E6E8EB] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E6E8EB] pb-3 text-[13px]">
                <span className="text-[#6B7079]">Categoría del vehículo:</span>
                <span className="font-semibold text-[#0B0B0C]">{createdRequest.vehicle_category}</span>
              </div>

              {createdRequest.vehicle_brand && createdRequest.vehicle_brand !== 'A coordinar' && (
                <div className="flex items-center justify-between border-b border-[#E6E8EB] pb-3 text-[13px]">
                  <span className="text-[#6B7079]">Vehículo:</span>
                  <span className="font-semibold text-[#0B0B0C]">
                    {createdRequest.vehicle_brand} {createdRequest.vehicle_model} {createdRequest.vehicle_year ? `(${createdRequest.vehicle_year})` : ''}
                  </span>
                </div>
              )}

              {createdRequest.preferred_date && (
                <div className="flex items-center justify-between border-b border-[#E6E8EB] pb-3 text-[13px]">
                  <span className="text-[#6B7079]">Fecha estimada:</span>
                  <span className="font-semibold text-[#0B0B0C]">
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
              <div className="space-y-2 pt-1">
                <span className="text-[12px] uppercase font-medium text-[#6B7079] tracking-[0.06em] block">
                  Tratamientos solicitados
                </span>
                <div className="divide-y divide-[#E6E8EB]">
                  {createdRequest.selected_services.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-[13px]">
                      <div>
                        <div className="font-semibold text-[#0B0B0C]">{item.serviceName}</div>
                        {item.durationHours && (
                          <div className="text-[12px] text-[#6B7079]">
                            Duración: {item.durationHours} hs
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-[#0B0B0C] tabular-nums">
                        ${item.price.toLocaleString('es-UY')}
                      </span>
                    </div>
                  ))}

                  {createdRequest.selected_products &&
                    createdRequest.selected_products.map((prod, idx) => (
                      <div key={`p-${idx}`} className="py-2.5 flex items-center justify-between text-[13px] text-[#6B7079]">
                        <span>+ {prod.productName} (cuidado en casa)</span>
                        <span className="font-mono font-medium tabular-nums">${prod.price.toLocaleString('es-UY')}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Descuentos Aplicados */}
              {createdRequest.applied_discount && createdRequest.applied_discount.discount_amount > 0 && (
                <div className="pt-2 border-t border-[#E6E8EB] flex items-center justify-between text-[13px] text-[#1E5EFF] font-semibold">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono tabular-nums">-${createdRequest.applied_discount.discount_amount.toLocaleString('es-UY')} UYU</span>
                </div>
              )}

              {/* Total Final Destacado */}
              <div className="pt-4 border-t border-[#E6E8EB] flex items-center justify-between">
                <span className="font-semibold text-[15px] text-[#0B0B0C]">TOTAL ESTIMADO:</span>
                <span className="text-[24px] font-bold text-[#1E5EFF] font-mono tabular-nums">
                  ${createdRequest.total_amount.toLocaleString('es-UY')}{' '}
                  <span className="text-[13px] text-[#6B7079] font-normal">UYU</span>
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="w-full h-[52px] rounded-[12px] bg-[#1E5EFF] hover:bg-[#1747C7] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366] fill-[#25D366]" />
                <span>Confirmar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full h-[52px] rounded-[12px] bg-white border border-[#E6E8EB] hover:bg-[#F5F6F7] text-[#0B0B0C] font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#6B7079]" />
                <span>Descargar PDF</span>
              </button>
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
                className="text-[13px] text-[#6B7079] hover:text-[#0B0B0C] underline cursor-pointer"
              >
                Armar otro presupuesto nuevo
              </button>
            </div>
          </div>
        )}
      </main>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. SECCIONES DE ABAJO (EN FONDO GRIS ALTERNO #F5F6F7)                 */}
      {/* --------------------------------------------------------------------- */}
      <section id="secciones-inferiores" className="bg-[#F5F6F7] border-t border-[#E6E8EB] py-14 px-5 sm:px-6 w-full">
        <div className="max-w-[1080px] mx-auto space-y-16">
          {/* A) TRABAJOS: GRILLA 2 COLUMNAS SIN TEXTO ENCIMA */}
          <div className="space-y-4">
            <div>
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block mb-1">
                TRABAJOS REALES
              </span>
              <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                Resultados en nuestro taller
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  className="aspect-[4/3] rounded-[14px] overflow-hidden bg-white border border-[#E6E8EB] shadow-xs"
                >
                  <img
                    src={item.url}
                    alt={item.caption || 'Trabajo DetailVlak'}
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <a
                href="https://www.instagram.com/detailvlak/"
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-[#1E5EFF] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>Ver más trabajos en Instagram @detailvlak</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* B) OPINIONES */}
          {webBudget.content?.reviews && webBudget.content.reviews.length > 0 && (
            <div className="space-y-4">
              <div>
                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block mb-1">
                  OPINIONES
                </span>
                <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                  Lo que dicen nuestros clientes
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {webBudget.content.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-[14px] bg-white border border-[#E6E8EB] space-y-3 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[#1E5EFF]">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#1E5EFF] text-[#1E5EFF]" />
                        ))}
                      </div>
                      <p className="text-[15px] text-[#3A3D42] leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E6E8EB]">
                      <span className="font-semibold text-[13px] text-[#0B0B0C] block">
                        {rev.client_name}
                      </span>
                      {rev.vehicle && (
                        <span className="text-[12px] text-[#6B7079] block">
                          {rev.vehicle}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C) PREGUNTAS FRECUENTES (ACORDEÓN CON SEPARADORES FINOS) */}
          {webBudget.content?.faqs && webBudget.content.faqs.length > 0 && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block mb-1">
                  PREGUNTAS FRECUENTES
                </span>
                <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                  Dudas habituales sobre los tratamientos
                </h2>
              </div>

              <div className="rounded-[14px] bg-white border border-[#E6E8EB] divide-y divide-[#E6E8EB] overflow-hidden shadow-xs">
                {webBudget.content.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group p-4.5 cursor-pointer"
                  >
                    <summary className="font-semibold text-[15px] text-[#0B0B0C] flex items-center justify-between list-none">
                      <span>{faq.question}</span>
                      <ChevronDown className="w-4 h-4 text-[#6B7079] group-open:rotate-180 transition-transform shrink-0" />
                    </summary>
                    <p className="text-[#6B7079] text-[13px] font-normal mt-2.5 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* D) UBICACIÓN */}
          <div
            ref={locationRef}
            className="p-6 rounded-[14px] bg-white border border-[#E6E8EB] space-y-3 shadow-xs"
          >
            <div>
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block mb-1">
                UBICACIÓN
              </span>
              <h2 className="text-[22px] font-semibold text-[#0B0B0C]">
                Taller DetailVlak Shangrilá
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <p className="text-[15px] text-[#3A3D42]">
                  {webBudget.content?.address || 'Av. Giannattasio, Ciudad de la Costa, Canelones, Uruguay.'}
                </p>
                <p className="text-[13px] text-[#6B7079]">
                  Horario de atención: Lunes a Sábados de 08:30 a 18:30 hs (con coordinación previa).
                </p>
              </div>

              <a
                href={webBudget.content?.map_url || 'https://maps.google.com/?q=Shangrila+Canelones+Uruguay'}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-[10px] bg-white border border-[#E6E8EB] hover:bg-[#F5F6F7] text-[#0B0B0C] text-[13px] font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Cómo llegar en Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6B7079]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. BARRA FIJA INFERIOR: FONDO NEGRO #0B0B0C, TOTAL EN BLANCO, BOTÓN AZUL */}
      {/* --------------------------------------------------------------------- */}
      {!isOnlySections && currentStep <= 3 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0B0B0C] border-t border-neutral-800 p-4 safe-bottom text-white shadow-xl">
          <div className="max-w-[1080px] mx-auto flex items-center justify-between gap-4">
            {/* Izquierda: Cantidad de servicios + Total en blanco grande */}
            <div
              onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
              className="cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-1.5 text-[13px] text-[#6B7079]">
                <span className="truncate">
                  {selectedServices.length} servicio{selectedServices.length !== 1 ? 's' : ''}{' '}
                  {selectedCategory ? `• ${selectedCategory}` : ''}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#6B7079] transition-transform shrink-0 ${
                    isSummaryDrawerOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <div className="text-[22px] font-bold text-white font-mono leading-tight tabular-nums">
                  {selectedCategory ? (
                    <>
                      ${finalTotal.toLocaleString('es-UY')}{' '}
                      <span className="text-[13px] font-normal text-[#6B7079]">UYU</span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#99BCFF] font-medium">
                      Elegí el tamaño
                    </span>
                  )}
                </div>

                {discountDetails.totalDiscount > 0 && (
                  <span className="text-[12px] text-[#99BCFF] font-normal">
                    Ahorro: -${discountDetails.totalDiscount.toLocaleString('es-UY')}
                  </span>
                )}
              </div>
            </div>

            {/* Derecha: Botón azul "Continuar" */}
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
              className="h-[48px] px-6 rounded-[12px] bg-[#1E5EFF] hover:bg-[#1747C7] text-white font-semibold text-[15px] flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer desplegable con desglose */}
          {isSummaryDrawerOpen && (
            <div className="max-w-[1080px] mx-auto mt-3 pt-3 border-t border-neutral-800 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                Detalle de tratamientos seleccionados:
              </span>
              {selectedServices.length === 0 ? (
                <p className="text-[13px] text-[#6B7079]">Aún no agregaste servicios.</p>
              ) : (
                <div className="space-y-1.5 divide-y divide-neutral-800 text-[13px]">
                  {selectedServices.map((s) => (
                    <div
                      key={s.tariff.id}
                      className="pt-1.5 flex items-center justify-between text-neutral-300"
                    >
                      <span className="truncate pr-2">{s.tariff.shortName || s.tariff.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-white font-semibold tabular-nums">
                          ${s.price.toLocaleString('es-UY')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleService(s.tariff.id);
                          }}
                          className="text-[#99BCFF] hover:underline text-[12px]"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="pt-1.5 flex items-center justify-between text-neutral-400"
                    >
                      <span className="truncate pr-2">+ {p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-white tabular-nums">${p.price.toLocaleString('es-UY')}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProduct(p.id);
                          }}
                          className="text-[#99BCFF] hover:underline text-[12px]"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}

                  {discountDetails.totalDiscount > 0 && (
                    <div className="pt-2 flex items-center justify-between text-[#99BCFF] font-medium text-[13px]">
                      <span>Descuentos acumulados:</span>
                      <span className="font-mono tabular-nums">-${discountDetails.totalDiscount.toLocaleString('es-UY')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. DETALLE DE SERVICIO: HOJA QUE SUBE DESDE ABAJO (BOTTOM SHEET / MODAL) */}
      {/* --------------------------------------------------------------------- */}
      {detailModalService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-[20px] sm:rounded-[16px] w-full sm:max-w-2xl max-h-[90vh] text-[#0B0B0C] shadow-2xl overflow-hidden flex flex-col border border-[#E6E8EB] animate-fade-in">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6E8EB] bg-white sticky top-0 z-10 shrink-0">
              <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079]">
                Detalle del tratamiento
              </span>
              <button
                type="button"
                onClick={() => setDetailModalService(null)}
                className="p-1.5 text-[#6B7079] hover:text-[#0B0B0C] rounded-[8px] hover:bg-[#F5F6F7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable en el orden solicitado:
                1. video o foto
                2. nombre
                3. precio y duración
                4. comparador antes / después
                5. descripción
                6. qué incluye con pasos numerados
                7. productos como lista simple
                8. botón principal fijo abajo */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[15px] flex-1">
              {/* 1. Video o Foto */}
              {detailModalService.video_url && detailModalService.video_url.trim() ? (
                <div
                  className={`rounded-[12px] overflow-hidden border border-[#E6E8EB] bg-black ${
                    detailModalService.is_video_uploaded || detailModalService.video_url.includes('.mp4')
                      ? 'aspect-[9/16] max-h-[65vh] mx-auto'
                      : 'aspect-video'
                  }`}
                >
                  {detailModalService.is_video_uploaded || detailModalService.video_url.includes('.mp4') ? (
                    <video
                      src={detailModalService.video_url}
                      autoPlay
                      muted
                      loop
                      controls
                      playsInline
                      className="w-full h-full object-cover mx-auto"
                    />
                  ) : (
                    <VideoEmbed url={detailModalService.video_url} autoPlay />
                  )}
                </div>
              ) : (
                <div className="rounded-[12px] overflow-hidden border border-[#E6E8EB] aspect-[16/9] bg-[#F5F6F7]">
                  <img
                    src={
                      detailModalService.cover_image_url ||
                      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={detailModalService.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 2. Nombre */}
              <div className="space-y-1">
                <h3 className="text-[22px] font-semibold text-[#0B0B0C] leading-snug">
                  {detailModalService.name}
                </h3>
              </div>

              {/* 3. Precio y Duración */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EB]">
                <div>
                  <span className="text-[12px] uppercase text-[#6B7079] font-medium block">
                    {selectedCategory ? `Precio (${selectedCategory})` : 'Precio estimado'}
                  </span>
                  <span className="text-[20px] font-bold font-mono tabular-nums text-[#1E5EFF]">
                    ${categoryKey ? (detailModalService.prices?.[categoryKey] || 0).toLocaleString('es-UY') : (detailModalService.prices?.mediano || 0).toLocaleString('es-UY')} UYU
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] uppercase text-[#6B7079] font-medium block">
                    Duración aprox.
                  </span>
                  <span className="text-[15px] font-medium text-[#0B0B0C]">
                    {detailModalService.durationHours || 3} horas
                  </span>
                </div>
              </div>

              {/* 4. Comparador antes / después deslizable */}
              <div className="space-y-2">
                <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                  Antes y después (deslizá para comparar)
                </span>
                {detailModalService.before_after_images && detailModalService.before_after_images.length > 0 ? (
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
                  <BeforeAfterSlider
                    beforeUrl="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&auto=format&fit=crop&q=80"
                    afterUrl="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"
                    labelBefore="ANTES"
                    labelAfter="DESPUÉS"
                  />
                )}
              </div>

              {/* 5. Descripción */}
              {detailModalService.description && (
                <div className="space-y-1">
                  <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                    Descripción
                  </span>
                  <p className="text-[15px] text-[#3A3D42] leading-relaxed font-normal">
                    {detailModalService.description}
                  </p>
                </div>
              )}

              {/* 6. Qué incluye con pasos numerados */}
              {detailModalService.included_steps && detailModalService.included_steps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                    Qué incluye
                  </span>
                  <div className="space-y-2 bg-[#F5F6F7] p-4 rounded-[12px] border border-[#E6E8EB]">
                    {detailModalService.included_steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[#3A3D42] text-[13px]">
                        <span className="w-5 h-5 rounded-full bg-[#1E5EFF] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-snug">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Productos como lista simple */}
              {detailModalService.products_used && detailModalService.products_used.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#6B7079] block">
                    Productos utilizados
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detailModalService.products_used.map((prod, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-[8px] bg-[#F5F6F7] border border-[#E6E8EB] text-[#3A3D42] text-[13px]"
                      >
                        ✓ {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuidados recomendados */}
              {detailModalService.care_text && (
                <div className="p-4 rounded-[12px] bg-[#F5F6F7] border border-[#E6E8EB] text-[13px] text-[#3A3D42] space-y-1">
                  <strong className="block font-semibold text-[#0B0B0C]">
                    Cuidados posteriores recomendados:
                  </strong>
                  <span>{detailModalService.care_text}</span>
                </div>
              )}
            </div>

            {/* 8. Botón principal fijo abajo */}
            <div className="p-4 bg-white border-t border-[#E6E8EB] shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleToggleService(detailModalService.id);
                  setDetailModalService(null);
                }}
                className={`w-full h-[52px] rounded-[12px] font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs ${
                  selectedServiceIds.includes(detailModalService.id)
                    ? 'bg-[#0B0B0C] text-white'
                    : 'bg-[#1E5EFF] hover:bg-[#1747C7] text-white'
                }`}
              >
                {selectedServiceIds.includes(detailModalService.id) ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Quitar del presupuesto</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Sumar al presupuesto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. MODAL DE IMPRESIÓN / PDF                                           */}
      {/* --------------------------------------------------------------------- */}
      {showPrintModal && createdRequest && (
        <PublicBudgetPrintView
          request={createdRequest}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 9. PIE DE PÁGINA LIMPIO Y SOBRIO                                      */}
      {/* --------------------------------------------------------------------- */}
      <footer className="border-t border-[#E6E8EB] bg-white py-8 px-5 sm:px-6 text-center text-[13px] text-[#6B7079] space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <strong className="text-[#0B0B0C] font-semibold">DetailVlak</strong>
          <span>•</span>
          <span>Taller de Estética Automotriz en Shangrilá, Canelones</span>
        </div>
        <p className="text-[12px]">
          Miembro de CARVLAK Group • Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

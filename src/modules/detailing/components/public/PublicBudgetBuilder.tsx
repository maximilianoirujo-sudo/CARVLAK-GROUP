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
  Calendar,
  X,
  ChevronDown,
  Info,
  MapPin,
  AlertCircle,
  Truck,
  Bike
} from 'lucide-react';
import { DetailingTariff, VehicleCategory, DetailingWebRequest } from '../../../../types';
import { INITIAL_DETAILING_TARIFFS, INITIAL_GENERAL_CONFIG } from '../../../../lib/mockData';
import { VideoEmbed } from '../../../../components/common/VideoEmbed';
import { PublicBudgetPrintView } from './PublicBudgetPrintView';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

interface PublicBudgetBuilderProps {
  onBackToApp?: () => void;
}

export const PublicBudgetBuilder: React.FC<PublicBudgetBuilderProps> = ({ onBackToApp }) => {
  // 1. Tariffs & Config State
  const [tariffs, setTariffs] = useState<DetailingTariff[]>(() => {
    try {
      const saved = localStorage.getItem('carvlak_detailing_tariffs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DETAILING_TARIFFS;
  });

  const [companyPhone, setCompanyPhone] = useState<string>(
    INITIAL_GENERAL_CONFIG.company_phone || '59899267964'
  );

  // Fetch updated tariffs & phone from /api/sync and Supabase
  useEffect(() => {
    async function loadPublicData() {
      // Intentar /api/sync (Upstash KV)
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.detailing_tariffs && Array.isArray(json.data.detailing_tariffs)) {
            setTariffs(json.data.detailing_tariffs);
            localStorage.setItem('carvlak_detailing_tariffs', JSON.stringify(json.data.detailing_tariffs));
          }
          if (json?.data?.detailing_config?.company_phone) {
            setCompanyPhone(json.data.detailing_config.company_phone);
          }
        }
      } catch (e) {
        // Fallback a localStorage
      }

      // Intentar Supabase si estuviera configurado
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.rpc('get_public_config');
          if (data?.company_phone) setCompanyPhone(data.company_phone);
          if (data?.detailing_tariffs && Array.isArray(data.detailing_tariffs)) {
            setTariffs(data.detailing_tariffs);
          }
        } catch {}
      }
    }

    loadPublicData();
  }, []);

  // 2. Wizard Flow Steps
  // 'hero' (Portada) -> 'catalog' (Selector de tamaño + servicios) -> 'form' (Datos cliente) -> 'success' (Resumen final)
  const [currentStep, setCurrentStep] = useState<'hero' | 'catalog' | 'form' | 'success'>('hero');

  // 3. Vehicle Category Selection (no preseleccionar ningún tamaño)
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null);

  // 4. Selected Services (service IDs) (no preseleccionar ningún servicio)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Modal de Detalle de Servicio con Video
  const [detailModalService, setDetailModalService] = useState<DetailingTariff | null>(null);

  // Drawer de resumen móvil
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);

  // 5. Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [comments, setComments] = useState('');

  // Anti-Spam
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 6. Success State
  const [createdRequest, setCreatedRequest] = useState<DetailingWebRequest | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Scroll to top helper
  const topRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Category Key mapping for tariff prices
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

  // Active Tariffs sorted by order
  const activeTariffs = useMemo(() => {
    return tariffs
      .filter((t) => t.isActive !== false)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [tariffs]);

  // Selected Service Objects with calculated prices
  const selectedServices = useMemo(() => {
    if (!categoryKey) return [];
    return selectedServiceIds
      .map((sid) => {
        const tariff = activeTariffs.find((t) => t.id === sid);
        if (!tariff) return null;
        const price = tariff.prices?.[categoryKey] || 0;
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

  // Live Total
  const liveTotal = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + item.price, 0);
  }, [selectedServices]);

  // Toggle Service
  const handleToggleService = (tariffId: string) => {
    if (!selectedCategory) {
      alert('Por favor seleccioná primero el tamaño de tu vehículo para calcular los precios y sumar servicios.');
      document.getElementById('size-selector-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSelectedServiceIds((prev) =>
      prev.includes(tariffId) ? prev.filter((id) => id !== tariffId) : [...prev, tariffId]
    );
  };

  // Submit Quote Request
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot.trim().length > 0) {
      console.warn('Bot detected via honeypot');
      return;
    }

    const elapsedSeconds = (Date.now() - formStartTime) / 1000;
    if (elapsedSeconds < 2) {
      console.warn('Bot detected via fast submit');
      return;
    }

    if (!name.trim() || !phone.trim()) {
      alert('Por favor completá los campos obligatorios: tu nombre y celular para enviarte la cotización.');
      return;
    }

    if (!selectedCategory) {
      alert('Por favor seleccioná el tamaño de tu vehículo para calcular el presupuesto.');
      setCurrentStep('catalog');
      return;
    }

    if (selectedServices.length === 0) {
      alert('Por favor seleccioná al menos 1 servicio para armar tu presupuesto.');
      setCurrentStep('catalog');
      return;
    }

    setIsSubmitting(true);

    try {
      // Detect URL parameters for origin / attribution
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

      // Generate unique human-friendly code: DV-26-XXXX
      const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `DV-26-${randomCodeSuffix}`;
      const nowIso = new Date().toISOString();

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
        comments: comments.trim() || undefined,
        selected_services: selectedServices.map((s) => ({
          serviceId: s.tariff.id,
          serviceName: s.tariff.shortName || s.tariff.name,
          price: s.price,
          durationHours: s.durationHours
        })),
        total_amount: liveTotal,
        origin,
        is_paid_ad: isPaidAd,
        status: 'nueva',
        created_at: nowIso
      };

      // 1. Guardar en localStorage
      try {
        const saved = localStorage.getItem('carvlak_detailing_web_requests');
        const list: DetailingWebRequest[] = saved ? JSON.parse(saved) : [];
        const updatedList = [newRequest, ...list];
        localStorage.setItem('carvlak_detailing_web_requests', JSON.stringify(updatedList));

        // 2. Sincronizar en la nube Upstash KV (/api/sync)
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'detailing_web_requests',
            data: updatedList
          })
        }).catch(() => {});
      } catch (e) {
        console.error('Error saving web request locally:', e);
      }

      // 3. Supabase RPC fallback si existiera
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
      setCurrentStep('success');
      scrollToTop();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al procesar tu solicitud. Podés contactarnos directamente por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Sender
  const handleConfirmWhatsApp = () => {
    if (!createdRequest) return;

    const servicesListText = createdRequest.selected_services
      .map((s) => `• ${s.serviceName}: $${s.price.toLocaleString('es-UY')}`)
      .join('\n');

    const message = `¡Hola DetailVlak! 👋 Acabo de armar mi presupuesto estimado en su web.

📋 *Presupuesto #${createdRequest.code}*
👤 *Cliente:* ${createdRequest.client_name}
📱 *Teléfono:* ${createdRequest.client_phone}
🚗 *Vehículo:* ${createdRequest.vehicle_brand && createdRequest.vehicle_brand !== 'A coordinar' ? `${createdRequest.vehicle_brand} ${createdRequest.vehicle_model}`.trim() : 'A coordinar'} ${createdRequest.vehicle_year ? `(${createdRequest.vehicle_year})` : ''} - *${createdRequest.vehicle_category}*
${createdRequest.vehicle_plate ? `🔖 *Matrícula:* ${createdRequest.vehicle_plate}\n` : ''}${createdRequest.preferred_date ? `📅 *Fecha preferida:* ${createdRequest.preferred_date}\n` : ''}
🛠️ *Tratamientos elegidos:*
${servicesListText}

💰 *TOTAL ESTIMADO:* $${createdRequest.total_amount.toLocaleString('es-UY')} UYU
${createdRequest.comments ? `\n💬 *Comentarios:* ${createdRequest.comments}\n` : ''}
¿Tienen disponibilidad en esas fechas para coordinar la inspección del auto?`;

    let cleanPhone = companyPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) cleanPhone = '59899267964';

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');
  };

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-white text-gray-900 flex flex-col justify-between selection:bg-[#0066FF]/20 selection:text-[#0066FF] font-sans antialiased"
    >
      {/* 1. Header con Marca DetailVlak */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-2xs">
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
                  Presupuestos
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
          </div>
        </div>
      </header>

      {/* 2. Contenido Dinámico según Paso */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28">
        {/* ========================================================================= */}
        {/* PASO 1: PORTADA CORTA (HERO) */}
        {/* ========================================================================= */}
        {currentStep === 'hero' && (
          <div className="py-8 sm:py-14 text-center space-y-8 animate-fade-in">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-700 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span className="font-semibold text-gray-900">DetailVlak Studio</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Cotización transparente en vivo</span>
            </div>

            {/* Frase Principal */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Armá tu presupuesto a medida en <span className="text-[#0066FF]">segundos</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
                Elegí el tamaño de tu vehículo, mirá cómo trabajamos en videos time-lapse y seleccioná los tratamientos que querés realizarle.
              </p>
            </div>

            {/* Tarjetas de Beneficios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900">Videos Time-Lapse</div>
                <p className="text-[11px] text-gray-600 leading-normal">
                  Mirá el paso a paso real y los productos alemanes que aplicamos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900">Tratamientos Integrales</div>
                <p className="text-[11px] text-gray-600 leading-normal">
                  Limpieza profunda a vapor de butacas y techo con desinfección total.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all space-y-1.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900">Sin Sorpresas</div>
                <p className="text-[11px] text-gray-600 leading-normal">
                  Precios claros y confirmación directa con nosotros por WhatsApp.
                </p>
              </div>
            </div>

            {/* Botón Principal CTA */}
            <div className="pt-4 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('catalog');
                  scrollToTop();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/25 cursor-pointer active:scale-98"
              >
                <span>Armá tu presupuesto</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <span className="text-[11px] text-gray-500">
                Totalmente gratuito • No requiere registro ni tarjeta
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2 & 3: CATÁLOGO DE SERVICIOS + SELECTOR DE TAMAÑO */}
        {/* ========================================================================= */}
        {currentStep === 'catalog' && (
          <div className="space-y-7 animate-fade-in">
            {/* Header del Catálogo */}
            <div id="size-selector-section" className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                Paso 1 de 2
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedCategory ? `Tamaño: ${selectedCategory}` : '1. Elegí el tamaño de tu vehículo'}
              </h2>
              <p className="text-xs text-gray-500">
                {selectedCategory
                  ? 'Podés cambiarlo en cualquier momento para ver los precios ajustados a tu vehículo.'
                  : 'Seleccioná el tamaño de tu auto para desbloquear los precios exactos y armar tu cotización.'}
              </p>
            </div>

            {!selectedCategory && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#0066FF] shrink-0" />
                <span>Primero tocá la categoría de tu vehículo abajo para ver los precios de los servicios.</span>
              </div>
            )}

            {/* 2. Selector de Tamaño de Auto (5 Categorías) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                {
                  key: 'Chico' as VehicleCategory,
                  label: 'Chico',
                  sub: 'Hatch / Compacto',
                  examples: 'Gol, Onix, 208, Celerio',
                  icon: Car
                },
                {
                  key: 'Mediano' as VehicleCategory,
                  label: 'Mediano',
                  sub: 'Sedán',
                  examples: 'Corolla, Cruze, Vento',
                  icon: Car
                },
                {
                  key: 'SUV/Rural' as VehicleCategory,
                  label: 'SUV / Rural',
                  sub: 'Camioneta med.',
                  examples: 'Tracker, Compass, Taos',
                  icon: Truck
                },
                {
                  key: 'Pick-up' as VehicleCategory,
                  label: 'Pick-up',
                  sub: 'Camioneta gde.',
                  examples: 'Hilux, Amarok, Ranger',
                  icon: Truck
                },
                {
                  key: 'Moto' as VehicleCategory,
                  label: 'Moto',
                  sub: 'Motos & Cuadris',
                  examples: 'Street, Trail, Custom',
                  icon: Bike
                }
              ].map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const IconComponent = cat.icon;

                return (
                  <div
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#0066FF] shadow-sm shadow-blue-500/10'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#0066FF] text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={`font-bold text-xs block ${isSelected ? 'text-[#0066FF]' : 'text-gray-900'}`}>{cat.label}</span>
                      <span className="text-[10px] text-gray-500 block">{cat.sub}</span>
                      <span className="text-[9px] text-gray-400 block truncate mt-1">
                        {cat.examples}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso de Regla de Taller (Interiores) */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3 text-xs text-gray-700">
              <Info className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold text-gray-900 block">Regla de calidad DetailVlak:</span>
                <p className="text-[11px] text-gray-600">
                  En interiores únicamente realizamos <strong>limpieza profunda integral</strong> (incluye inyección/extracción de todas las butacas, alfombras, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales.
                </p>
              </div>
            </div>

            {/* 3. Tarjetas de Servicios Activos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Tratamientos Disponibles</h3>
                  <p className="text-[11px] text-gray-500">
                    Tocá cualquier servicio para ver su video time-lapse y pasos detallados.
                  </p>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {selectedServiceIds.length} seleccionados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeTariffs.map((tariff) => {
                  const isSelected = selectedServiceIds.includes(tariff.id);
                  const price = tariff.prices?.[categoryKey] || 0;
                  const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());

                  return (
                    <div
                      key={tariff.id}
                      className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-50/30 border-[#0066FF] shadow-md shadow-blue-500/10 ring-1 ring-[#0066FF]'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                      }`}
                    >
                      {/* Cuerpo de la tarjeta */}
                      <div
                        onClick={() => setDetailModalService(tariff)}
                        className="p-4 cursor-pointer space-y-3 flex-1"
                      >
                        {/* Fila superior: Badges y Duración */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {tariff.is_featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Destacado
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-gray-600 bg-gray-100">
                              <Clock className="w-3 h-3" /> {tariff.durationHours || 3}h
                            </span>
                          </div>

                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#0066FF] bg-blue-50 border border-blue-200">
                              <Play className="w-3 h-3" /> Ver Time-Lapse
                            </span>
                          )}
                        </div>

                        {/* Título y descripción (muestra el nombre corto en la tarjeta) */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug">
                            {tariff.shortName || tariff.name}
                          </h4>
                          {tariff.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {tariff.description}
                            </p>
                          )}
                        </div>

                        {/* Pasos destacados preview */}
                        {tariff.included_steps && tariff.included_steps.length > 0 && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                            <span>{tariff.included_steps.length} pasos incluidos • Ver detalle</span>
                          </div>
                        )}
                      </div>

                      {/* Barra inferior de la tarjeta: Precio y Botón Agregar */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase text-gray-400 font-bold block">
                            {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                          </span>
                          {selectedCategory ? (
                            <span className="text-base font-bold text-gray-900 font-mono">
                              ${price.toLocaleString('es-UY')} <span className="text-[10px] text-gray-500 font-normal">UYU</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-600">
                              Elegí el tamaño arriba
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleService(tariff.id);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/25'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
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

            {/* Disclaimer visible */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-1 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">
                * Presupuesto estimado. El precio final se confirma al ver el vehículo.
              </span>
              <p className="text-[11px] text-gray-500">
                Los tiempos y costos pueden variar según el estado real de la pintura y la suciedad del habitáculo.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: FORMULARIO DE CONTACTO */}
        {/* ========================================================================= */}
        {currentStep === 'form' && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            {/* Header del Formulario */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('catalog');
                  scrollToTop();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a elegir servicios</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Tus datos para enviarte el presupuesto
              </h2>
              <p className="text-xs text-gray-500">
                Completá tus datos de contacto y del vehículo para preparar tu cotización formal.
              </p>
            </div>

            {/* Resumen de Servicios Elegidos */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-200 pb-2">
                <span>Tratamientos seleccionados ({selectedCategory})</span>
                <span className="text-[#0066FF] font-mono text-sm">${liveTotal.toLocaleString('es-UY')} UYU</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {selectedServices.map((s) => (
                  <div key={s.tariff.id} className="flex items-center justify-between text-gray-700">
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <span className="font-mono font-semibold text-gray-900">${s.price.toLocaleString('es-UY')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Trampa Anti-Spam (Honeypot) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="extra_website_trap"
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
                    placeholder="Para recibir una copia del presupuesto en tu correo (opcional)"
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
                    <label className="text-xs font-semibold text-gray-700">
                      Marca <span className="text-gray-400 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Peugeot"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Modelo <span className="text-gray-400 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 208"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Año <span className="text-gray-400 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 2021"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Fecha preferida para traerlo <span className="text-gray-400 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Matrícula <span className="text-gray-400 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: SAA 1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-xs uppercase font-mono focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Comentarios o estado actual del vehículo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contanos si tiene rayones profundos, marcas de agua, manchas en butacas o algo puntual a tratar..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 placeholder-gray-400 text-xs focus:outline-hidden focus:bg-white focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Aclaración Obligatoria */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-gray-900 block mb-0.5">Aclaración de DetailVlak:</strong>
                  Presupuesto estimado. El precio final y plazos se confirman al inspeccionar personalmente el vehículo en el taller.
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

        {/* ========================================================================= */}
        {/* PASO 5: PANTALLA FINAL (RESUMEN + PDF + WHATSAPP) */}
        {/* ========================================================================= */}
        {currentStep === 'success' && createdRequest && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-4">
            {/* Header de Éxito */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                ¡Presupuesto listo, {createdRequest.client_name}!
              </h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                Tu cotización estimada para tu <strong>{createdRequest.vehicle_brand} {createdRequest.vehicle_model}</strong> quedó registrada con el código:
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

              {/* Lista de Servicios */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Tratamientos Incluidos
                </span>
                <div className="divide-y divide-gray-100">
                  {createdRequest.selected_services.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-900">{item.serviceName}</div>
                        {item.durationHours && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            Duración est.: {item.durationHours} hs
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        ${item.price.toLocaleString('es-UY')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Destacado */}
              <div className="pt-3 border-t-2 border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-700">TOTAL ESTIMADO:</span>
                <span className="text-2xl font-extrabold text-[#0066FF] font-mono">
                  ${createdRequest.total_amount.toLocaleString('es-UY')} <span className="text-xs text-gray-500 font-normal">UYU</span>
                </span>
              </div>

              {/* Aclaración */}
              <p className="text-[11px] text-gray-500 leading-normal pt-2 border-t border-gray-100">
                * Presupuesto estimado. El precio final se confirma al ver el vehículo en el taller.
              </p>
            </div>

            {/* Botones de Acción Principales */}
            <div className="space-y-3 pt-2">
              {/* Botón WhatsApp */}
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/20 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Confirmar por WhatsApp ahora</span>
              </button>

              {/* Botón Descargar PDF */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-gray-800 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4 text-[#0066FF]" />
                <span>Descargar Presupuesto en PDF</span>
              </button>
            </div>

            {/* Contacto & Ubicación */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-gray-900">
                <MapPin className="w-4 h-4 text-[#0066FF]" />
                <span>DetailVlak Shangrilá • Av. Giannattasio</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Atención con agenda previa de Lunes a Sábados.
              </p>
            </div>

            {/* Armar otro presupuesto */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceIds([]);
                  setSelectedCategory(null);
                  setCurrentStep('catalog');
                  scrollToTop();
                }}
                className="text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer"
              >
                Armar otro presupuesto
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Barra Fija Inferior (Sticky Bottom Bar) */}
      {currentStep === 'catalog' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] safe-bottom">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            {/* Resumen & Total */}
            <div
              onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span>{selectedServices.length} servicios {selectedCategory ? `• ${selectedCategory}` : ''}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSummaryDrawerOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-gray-900 font-mono leading-tight">
                {selectedCategory ? (
                  <>
                    ${liveTotal.toLocaleString('es-UY')}{' '}
                    <span className="text-xs font-normal text-gray-500">UYU</span>
                  </>
                ) : (
                  <span className="text-xs text-amber-600 font-sans font-bold">Elegí tamaño de auto</span>
                )}
              </div>
            </div>

            {/* Botón Continuar */}
            <button
              type="button"
              disabled={!selectedCategory || selectedServices.length === 0}
              onClick={() => {
                if (!selectedCategory) {
                  alert('Por favor seleccioná primero el tamaño de tu vehículo arriba.');
                  document.getElementById('size-selector-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  return;
                }
                if (selectedServices.length === 0) {
                  alert('Seleccioná al menos un servicio para continuar.');
                  return;
                }
                setCurrentStep('form');
                scrollToTop();
              }}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{!selectedCategory ? 'Elegí tamaño' : 'Continuar con mis datos'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer desplegable con servicios elegidos */}
          {isSummaryDrawerOpen && (
            <div className="max-w-4xl mx-auto mt-3 pt-3 border-t border-gray-200 space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Servicios seleccionados:
              </span>
              {selectedServices.length === 0 ? (
                <p className="text-xs text-gray-400">Ningún servicio seleccionado.</p>
              ) : (
                selectedServices.map((s) => (
                  <div
                    key={s.tariff.id}
                    className="flex items-center justify-between text-xs py-1 text-gray-700"
                  >
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900 font-bold">${s.price.toLocaleString('es-UY')}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleService(s.tariff.id);
                        }}
                        className="text-gray-400 hover:text-red-600 text-[10px] ml-1 font-semibold"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Modal de Detalle de Servicio con Video Embebido */}
      {detailModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl my-8 text-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
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
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Video Time-Lapse */}
              {detailModalService.video_url && detailModalService.video_url.trim() ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Demostración Time-Lapse de nuestro trabajo</span>
                  </span>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <VideoEmbed url={detailModalService.video_url} autoPlay />
                  </div>
                </div>
              ) : null}

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

              {/* Qué Incluye */}
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
                    Productos & Insumos Prémium Utilizados:
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

              {/* Cuidados posteriores si los tiene */}
              {detailModalService.care_text && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <strong className="block font-bold">Cuidados recomendados:</strong>
                  <span>{detailModalService.care_text}</span>
                </div>
              )}
            </div>

            {/* Footer del Modal: Precio y Botón Agregar */}
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
                    Elegí el tamaño de tu auto arriba
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
                      <span>Quitar del presupuesto</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar al presupuesto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Impresión / PDF */}
      {showPrintModal && createdRequest && (
        <PublicBudgetPrintView
          request={createdRequest}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Footer General */}
      <footer className="border-t border-gray-200 bg-gray-50 py-5 px-4 text-center text-xs text-gray-500">
        <div>
          <strong className="text-gray-700">DetailVlak</strong> • Shangrilá, Canelones • Miembro de{' '}
          <strong className="text-gray-700">CARVLAK Group</strong>
        </div>
      </footer>
    </div>
  );
};

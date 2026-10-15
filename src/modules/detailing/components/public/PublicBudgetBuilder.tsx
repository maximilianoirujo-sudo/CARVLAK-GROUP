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
      className="min-h-screen bg-[#0D0D0D] text-white flex flex-col justify-between selection:bg-[#0066FF]/30 selection:text-white font-sans antialiased"
    >
      {/* 1. Header con Marca DetailVlak */}
      <header className="border-b border-[#222] bg-[#141414]/95 backdrop-blur-md sticky top-0 z-40 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0044CC] flex items-center justify-center font-black text-white text-xs tracking-wider shadow-md shrink-0 border border-blue-400/30">
              DV
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight font-display">
                  DETAIL<span className="text-[#3B82F6]">VLAK</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0066FF]/20 text-[#3B82F6] border border-[#0066FF]/30 tracking-wide uppercase">
                  Presupuestos
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 truncate">Estética automotriz • Shangrilá</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-2.5 py-1.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181818] border border-[#2D2D2D] text-xs text-neutral-300">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span className="font-semibold text-white">DetailVlak Studio</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">Cotización transparente en vivo</span>
            </div>

            {/* Frase Principal */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Armá tu presupuesto a medida en <span className="text-[#3B82F6]">segundos</span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto">
                Elegí el tamaño de tu vehículo, mirá cómo trabajamos en videos time-lapse y seleccioná los tratamientos que querés realizarle.
              </p>
            </div>

            {/* Tarjetas de Beneficios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left pt-2">
              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 text-[#3B82F6] flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Videos Time-Lapse</div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Mirá el paso a paso real y los productos alemanes que aplicamos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Tratamientos Integrales</div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Limpieza profunda a vapor de butacas y techo con desinfección total.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Sin Sorpresas</div>
                <p className="text-[11px] text-neutral-400 leading-normal">
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
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#0066FF]/30 cursor-pointer active:scale-98"
              >
                <span>Armá tu presupuesto</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <span className="text-[11px] text-neutral-500">
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                Paso 1 de 2
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {selectedCategory ? `Tamaño: ${selectedCategory}` : '1. Elegí el tamaño de tu vehículo'}
              </h2>
              <p className="text-xs text-neutral-400">
                {selectedCategory
                  ? 'Podés cambiarlo en cualquier momento para ver los precios ajustados a tu vehículo.'
                  : 'Seleccioná el tamaño de tu auto para desbloquear los precios exactos y armar tu cotización.'}
              </p>
            </div>

            {!selectedCategory && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#3B82F6] shrink-0" />
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
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#182338] border-[#0066FF] shadow-lg shadow-[#0066FF]/20 ring-1 ring-[#0066FF]'
                        : 'bg-[#161616] border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-[#0066FF] text-white' : 'bg-[#222] text-neutral-400'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-xs text-white block">{cat.label}</span>
                      <span className="text-[10px] text-neutral-400 block">{cat.sub}</span>
                      <span className="text-[9px] text-neutral-500 block truncate mt-1">
                        {cat.examples}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso de Regla de Taller (Interiores) */}
            <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#282828] flex items-start gap-3 text-xs text-neutral-300">
              <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-bold text-white block">Regla de calidad DetailVlak:</span>
                <p className="text-[11px] text-neutral-400">
                  En interiores únicamente realizamos <strong>limpieza profunda integral</strong> (incluye inyección/extracción de todas las butacas, alfombras, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales.
                </p>
              </div>
            </div>

            {/* 3. Tarjetas de Servicios Activos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Tratamientos Disponibles</h3>
                  <p className="text-[11px] text-neutral-400">
                    Tocá cualquier servicio para ver su video time-lapse y pasos detallados.
                  </p>
                </div>
                <span className="text-xs text-neutral-400 font-medium">
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
                          ? 'bg-[#182030] border-[#0066FF] shadow-lg shadow-[#0066FF]/15 ring-1 ring-[#0066FF]'
                          : 'bg-[#161616] border-[#262626] hover:border-[#383838]'
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <Star className="w-3 h-3 fill-amber-400" /> Destacado
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-neutral-400 bg-[#222]">
                              <Clock className="w-3 h-3" /> {tariff.durationHours || 3}h
                            </span>
                          </div>

                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#3B82F6] bg-[#0066FF]/15 border border-[#0066FF]/30">
                              <Play className="w-3 h-3" /> Ver Time-Lapse
                            </span>
                          )}
                        </div>

                        {/* Título y descripción */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-sm leading-snug">
                            {tariff.name}
                          </h4>
                          {tariff.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                              {tariff.description}
                            </p>
                          )}
                        </div>

                        {/* Pasos destacados preview */}
                        {tariff.included_steps && tariff.included_steps.length > 0 && (
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                            <span>{tariff.included_steps.length} pasos incluidos • Ver detalle</span>
                          </div>
                        )}
                      </div>

                      {/* Barra inferior de la tarjeta: Precio y Botón Agregar */}
                      <div className="px-4 py-3 bg-[#1A1A1A] border-t border-[#262626] flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase text-neutral-500 font-bold block">
                            {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                          </span>
                          {selectedCategory ? (
                            <span className="text-base font-bold text-white font-mono">
                              ${price.toLocaleString('es-UY')} <span className="text-[10px] text-neutral-400">UYU</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-400">
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
                              ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/30'
                              : 'bg-[#252525] hover:bg-[#303030] text-neutral-200'
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
                  );
                })}
              </div>
            </div>

            {/* Disclaimer visible */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] text-center space-y-1 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300">
                * Presupuesto estimado. El precio final se confirma al ver el vehículo.
              </span>
              <p className="text-[11px] text-neutral-500">
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
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a elegir servicios</span>
              </button>
              <h2 className="text-2xl font-bold text-white">
                Tus datos para enviarte el presupuesto
              </h2>
              <p className="text-xs text-neutral-400">
                Completá tus datos de contacto y del vehículo para preparar tu cotización formal.
              </p>
            </div>

            {/* Resumen de Servicios Elegidos */}
            <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white border-b border-[#262626] pb-2">
                <span>Tratamientos seleccionados ({selectedCategory})</span>
                <span className="text-[#3B82F6] font-mono text-sm">${liveTotal.toLocaleString('es-UY')} UYU</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {selectedServices.map((s) => (
                  <div key={s.tariff.id} className="flex items-center justify-between text-neutral-300">
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <span className="font-mono text-white">${s.price.toLocaleString('es-UY')}</span>
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
              <div className="p-4 sm:p-5 rounded-2xl bg-[#161616] border border-[#262626] space-y-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] block">
                  1. Tus Datos de Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Nombre y apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      WhatsApp / Celular <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej: 099 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Email <span className="text-neutral-500 text-[11px]">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Para recibir una copia del presupuesto en tu correo (opcional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>

              {/* 2. Datos del Auto */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#161616] border border-[#262626] space-y-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] block">
                  2. Tu Vehículo <span className="text-neutral-500 text-[11px] font-normal lowercase">(opcional)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Marca <span className="text-neutral-500 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Peugeot"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Modelo <span className="text-neutral-500 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 208"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Año <span className="text-neutral-500 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 2021"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Fecha preferida para traerlo <span className="text-neutral-500 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Matrícula <span className="text-neutral-500 text-[11px]">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: SAA 1234"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs uppercase font-mono focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Comentarios o estado actual del vehículo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contanos si tiene rayones profundos, marcas de agua, manchas en butacas o algo puntual a tratar..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl p-3 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>

              {/* Aclaración Obligatoria */}
              <div className="p-4 rounded-xl bg-[#182030] border border-[#0066FF]/30 text-xs text-neutral-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-white block mb-0.5">Aclaración de DetailVlak:</strong>
                  Presupuesto estimado. El precio final y plazos se confirman al inspeccionar personalmente el vehículo en el taller.
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#0066FF]/30 cursor-pointer disabled:opacity-50"
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                ¡Presupuesto listo, {createdRequest.client_name}!
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Tu cotización estimada para tu <strong>{createdRequest.vehicle_brand} {createdRequest.vehicle_model}</strong> quedó registrada con el código:
              </p>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-[#161616] border border-[#2D2D2D] font-mono text-sm font-bold text-[#3B82F6]">
                #{createdRequest.code}
              </div>
            </div>

            {/* Tarjeta de Resumen Detallado */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-[#282828] space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3 text-xs">
                <span className="text-neutral-400">Tamaño del vehículo:</span>
                <span className="font-bold text-white">{createdRequest.vehicle_category}</span>
              </div>

              {/* Lista de Servicios */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                  Tratamientos Incluidos
                </span>
                <div className="divide-y divide-[#222]">
                  {createdRequest.selected_services.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{item.serviceName}</div>
                        {item.durationHours && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            Duración est.: {item.durationHours} hs
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-white">
                        ${item.price.toLocaleString('es-UY')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Destacado */}
              <div className="pt-3 border-t-2 border-[#262626] flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-300">TOTAL ESTIMADO:</span>
                <span className="text-2xl font-extrabold text-[#3B82F6] font-mono">
                  ${createdRequest.total_amount.toLocaleString('es-UY')} <span className="text-xs text-neutral-400 font-normal">UYU</span>
                </span>
              </div>

              {/* Aclaración */}
              <p className="text-[11px] text-neutral-500 leading-normal pt-2 border-t border-[#222]">
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
                className="w-full py-3.5 rounded-2xl bg-[#202020] hover:bg-[#282828] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-[#333] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#3B82F6]" />
                <span>Descargar Presupuesto en PDF</span>
              </button>
            </div>

            {/* Contacto & Ubicación */}
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#222] text-xs text-neutral-400 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 font-bold text-white">
                <MapPin className="w-4 h-4 text-[#0066FF]" />
                <span>DetailVlak Shangrilá • Av. Giannattasio</span>
              </div>
              <p className="text-[11px] text-neutral-500">
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
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Armar otro presupuesto
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Barra Fija Inferior (Sticky Bottom Bar) */}
      {currentStep === 'catalog' && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#141414]/95 backdrop-blur-md border-t border-[#262626] p-3 sm:p-4 shadow-2xl safe-bottom">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            {/* Resumen & Total */}
            <div
              onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span>{selectedServices.length} servicios {selectedCategory ? `• ${selectedCategory}` : ''}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isSummaryDrawerOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white font-mono leading-tight">
                {selectedCategory ? (
                  <>
                    ${liveTotal.toLocaleString('es-UY')}{' '}
                    <span className="text-xs font-normal text-neutral-400">UYU</span>
                  </>
                ) : (
                  <span className="text-xs text-amber-400 font-sans font-bold">Elegí tamaño de auto</span>
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
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#0066FF] hover:bg-[#0055DD] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#0066FF]/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{!selectedCategory ? 'Elegí tamaño' : 'Continuar con mis datos'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer desplegable con servicios elegidos */}
          {isSummaryDrawerOpen && (
            <div className="max-w-4xl mx-auto mt-3 pt-3 border-t border-[#222] space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Servicios seleccionados:
              </span>
              {selectedServices.length === 0 ? (
                <p className="text-xs text-neutral-500">Ningún servicio seleccionado.</p>
              ) : (
                selectedServices.map((s) => (
                  <div
                    key={s.tariff.id}
                    className="flex items-center justify-between text-xs py-1 text-neutral-300"
                  >
                    <span>{s.tariff.shortName || s.tariff.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-bold">${s.price.toLocaleString('es-UY')}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleService(s.tariff.id);
                        }}
                        className="text-neutral-500 hover:text-red-400 text-[10px] ml-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#161616] border border-[#2D2D2D] rounded-2xl w-full max-w-2xl my-8 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#282828] bg-[#1A1A1A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0066FF]/20 text-[#3B82F6] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {detailModalService.name}
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Duración estimada: {detailModalService.durationHours || 3} horas
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalService(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Video Time-Lapse */}
              {detailModalService.video_url && detailModalService.video_url.trim() ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Demostración Time-Lapse de nuestro trabajo</span>
                  </span>
                  <div className="rounded-xl overflow-hidden border border-[#282828]">
                    <VideoEmbed url={detailModalService.video_url} autoPlay />
                  </div>
                </div>
              ) : null}

              {/* Descripción */}
              {detailModalService.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    ¿En qué consiste?
                  </span>
                  <p className="text-neutral-300 leading-relaxed text-xs sm:text-sm">
                    {detailModalService.description}
                  </p>
                </div>
              )}

              {/* Qué Incluye */}
              {detailModalService.included_steps && detailModalService.included_steps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                    Qué incluye este tratamiento:
                  </span>
                  <div className="space-y-1.5 bg-[#1F1F1F] p-3 rounded-xl border border-[#2B2B2B]">
                    {detailModalService.included_steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-neutral-300">
                        <span className="w-4 h-4 rounded-full bg-[#0066FF]/20 text-[#3B82F6] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Productos & Insumos Prémium Utilizados:
                  </span>
                  <div className="flex flex-wrap gap-1.5 bg-[#1F1F1F] p-3 rounded-xl border border-[#2B2B2B]">
                    {detailModalService.products_used.map((prod, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#282828] border border-[#3A3A3A] text-neutral-200 text-[11px]"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuidados posteriores si los tiene */}
              {detailModalService.care_text && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-200/90 text-[11px] space-y-1">
                  <strong className="block font-bold">Cuidados recomendados:</strong>
                  <span>{detailModalService.care_text}</span>
                </div>
              )}
            </div>

            {/* Footer del Modal: Precio y Botón Agregar */}
            <div className="px-5 py-3.5 bg-[#1A1A1A] border-t border-[#282828] flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                  {selectedCategory ? `Precio (${selectedCategory})` : 'Precio'}
                </span>
                {selectedCategory && categoryKey ? (
                  <span className="text-lg font-bold text-white font-mono">
                    ${(detailModalService.prices?.[categoryKey] || 0).toLocaleString('es-UY')} UYU
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-400">
                    Elegí el tamaño de tu auto arriba
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalService(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-semibold"
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
                      ? 'bg-neutral-700 text-white'
                      : 'bg-[#0066FF] hover:bg-[#0055DD] text-white shadow-md'
                  }`}
                >
                  {selectedServiceIds.includes(detailModalService.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
      <footer className="border-t border-[#222] bg-[#111] py-4 px-4 text-center text-xs text-neutral-500">
        <div>
          <strong className="text-neutral-400">DetailVlak</strong> • Shangrilá, Canelones • Miembro de{' '}
          <strong className="text-neutral-400">CARVLAK Group</strong>
        </div>
      </footer>
    </div>
  );
};

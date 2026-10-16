import React, { useState, useMemo } from 'react';
import {
  Globe,
  Sparkles,
  Layers,
  Car,
  ShoppingBag,
  Percent,
  Calendar,
  FileText,
  Palette,
  Sliders,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Star,
  Edit,
  Trash2,
  Copy as DuplicateIcon,
  Eye,
  EyeOff,
  Video,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Megaphone,
  Upload,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Truck,
  Bike,
  Film,
  Image as ImageIcon,
  Play,
  ArrowRight
} from 'lucide-react';
import {
  DetailingTariff,
  DetailingPackage,
  DetailingVehicleSize,
  DetailingUpsellProduct,
  DetailingDiscountCoupon,
  DetailingWebReview,
  DetailingWebHeroClip
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DetailingWebServiceModal } from './DetailingWebServiceModal';
import { VideoEmbed } from '../../../components/common/VideoEmbed';
import { uploadImageToStorage, uploadVideoToStorage } from '../../../lib/storage';
import { HeroVideoBackground } from './public/HeroVideoBackground';

export const DetailingWebBudgetSection: React.FC = () => {
  const {
    detailingTariffs,
    updateDetailingTariff,
    addDetailingTariff,
    deleteDetailingTariff,
    reorderDetailingTariffs,
    detailingQuotes,
    detailingConfig,
    updateDetailingConfig
  } = useData();
  const { showToast } = useToast();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'servicios' | 'paquetes' | 'tamanos' | 'productos' | 'promociones' | 'agenda' | 'contenido' | 'apariencia' | 'ajustes'
  >(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('subtab');
      if (p && ['servicios', 'paquetes', 'tamanos', 'productos', 'promociones', 'agenda', 'contenido', 'apariencia', 'ajustes'].includes(p)) {
        return p as any;
      }
    }
    return 'servicios';
  });

  // Web Budget Config Safe Access
  const webBudget = detailingConfig.web_budget || ({} as any);

  // Copied links state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    showToast(`${label} copiado al portapapeles`, 'success');
    setTimeout(() => setCopiedLink(null), 3000);
  };

  // Helper to update web_budget partially
  const updateWebBudget = (partial: any) => {
    updateDetailingConfig({
      web_budget: {
        ...webBudget,
        ...partial
      }
    });
    showToast('Configuración guardada en la nube', 'success');
  };

  // Hero Video & Portada states
  const [uploadingClipIndex, setUploadingClipIndex] = useState<number | null>(null);
  const [uploadClipProgress, setUploadClipProgress] = useState<number>(0);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);

  // =========================================================================
  // SUB-PANEL A: SERVICIOS
  // =========================================================================
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'active' | 'paused' | 'with_video' | 'featured'>('all');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<DetailingTariff | null>(null);

  const sortedTariffs = useMemo(() => {
    return [...detailingTariffs].sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [detailingTariffs]);

  const filteredTariffs = useMemo(() => {
    return sortedTariffs.filter((t) => {
      const q = serviceSearch.toLowerCase();
      const matches =
        t.name.toLowerCase().includes(q) ||
        (t.shortName && t.shortName.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));

      if (!matches) return false;
      if (serviceFilter === 'active') return t.isActive !== false;
      if (serviceFilter === 'paused') return t.isActive === false;
      if (serviceFilter === 'with_video') return Boolean(t.video_url && t.video_url.trim());
      if (serviceFilter === 'featured') return Boolean(t.is_featured);
      return true;
    });
  }, [sortedTariffs, serviceSearch, serviceFilter]);

  // Duplicar servicio con 1 clic
  const handleDuplicateService = (tariff: DetailingTariff) => {
    const duplicated: Omit<DetailingTariff, 'id'> = {
      ...tariff,
      name: `${tariff.name} (Copia)`,
      shortName: `${tariff.shortName || tariff.name} (Copia)`,
      order: (tariff.order || 1) + 1
    };
    addDetailingTariff(duplicated);
    showToast(`Servicio duplicado: "${duplicated.name}"`, 'success');
  };

  // Eliminar servicio con confirmación
  const handleDeleteService = (tariff: DetailingTariff) => {
    const hasJobs = detailingQuotes.some((q) =>
      (q.selected_services || []).some((s) => s.serviceId === tariff.id)
    );
    if (hasJobs) {
      showToast(
        `El servicio "${tariff.name}" tiene trabajos cargados en el sistema y no puede eliminarse. Podés pausarlo para que no aparezca en nuevas cotizaciones.`,
        'error'
      );
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar el servicio "${tariff.name}"? Esta acción no se puede deshacer.`)) {
      deleteDetailingTariff(tariff.id);
      showToast(`Servicio "${tariff.name}" eliminado`, 'success');
    }
  };

  // Reordenar arriba / abajo
  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTariffs.length) return;

    const newList = [...sortedTariffs];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    const updated = newList.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));
    reorderDetailingTariffs(updated);
  };

  // =========================================================================
  // SUB-PANEL B: PAQUETES / COMBOS
  // =========================================================================
  const packages: DetailingPackage[] = webBudget.packages || [];
  const [editingPackage, setEditingPackage] = useState<DetailingPackage | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  const handleSavePackage = (pkg: DetailingPackage) => {
    const existingIndex = packages.findIndex((p) => p.id === pkg.id);
    let nextList: DetailingPackage[];
    if (existingIndex >= 0) {
      nextList = [...packages];
      nextList[existingIndex] = pkg;
      showToast('Paquete actualizado', 'success');
    } else {
      nextList = [...packages, pkg];
      showToast('Paquete creado', 'success');
    }
    updateWebBudget({ packages: nextList });
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar el paquete "${name}"?`)) {
      updateWebBudget({ packages: packages.filter((p) => p.id !== id) });
      showToast('Paquete eliminado', 'success');
    }
  };

  // =========================================================================
  // SUB-PANEL C: TAMAÑOS
  // =========================================================================
  const sizes: DetailingVehicleSize[] = webBudget.custom_sizes || [];
  const [editingSize, setEditingSize] = useState<DetailingVehicleSize | null>(null);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  const handleSaveSize = (sizeItem: DetailingVehicleSize) => {
    const existingIndex = sizes.findIndex((s) => s.key === sizeItem.key);
    let nextList: DetailingVehicleSize[];
    if (existingIndex >= 0) {
      nextList = [...sizes];
      nextList[existingIndex] = sizeItem;
    } else {
      nextList = [...sizes, sizeItem];
    }
    updateWebBudget({ custom_sizes: nextList });
    setIsSizeModalOpen(false);
  };

  // =========================================================================
  // SUB-PANEL D: PRODUCTOS DE MANTENIMIENTO
  // =========================================================================
  const products: DetailingUpsellProduct[] = webBudget.products || [];
  const [editingProduct, setEditingProduct] = useState<DetailingUpsellProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const handleSaveProduct = (prod: DetailingUpsellProduct) => {
    const existingIndex = products.findIndex((p) => p.id === prod.id);
    let nextList: DetailingUpsellProduct[];
    if (existingIndex >= 0) {
      nextList = [...products];
      nextList[existingIndex] = prod;
    } else {
      nextList = [...products, prod];
    }
    updateWebBudget({ products: nextList });
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('¿Eliminar este producto de mantenimiento?')) {
      updateWebBudget({ products: products.filter((p) => p.id !== id) });
      showToast('Producto eliminado', 'success');
    }
  };

  // =========================================================================
  // SUB-PANEL E: PROMOCIONES
  // =========================================================================
  const promos = webBudget.promotions || {};
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponVal, setNewCouponVal] = useState<number>(10);
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) return;
    const cleanCode = newCouponCode.trim().toUpperCase().replace(/\s+/g, '');
    const currentCoupons: DetailingDiscountCoupon[] = promos.coupons || [];
    const newCoupon: DetailingDiscountCoupon = {
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      discount_type: newCouponType,
      discount_value: Number(newCouponVal) || 10,
      max_uses: 50,
      current_uses: 0,
      is_active: true
    };
    updateWebBudget({
      promotions: {
        ...promos,
        coupons: [...currentCoupons, newCoupon]
      }
    });
    setNewCouponCode('');
    showToast(`Cupón "${cleanCode}" creado`, 'success');
  };

  const handleDeleteCoupon = (id: string) => {
    const currentCoupons: DetailingDiscountCoupon[] = promos.coupons || [];
    updateWebBudget({
      promotions: {
        ...promos,
        coupons: currentCoupons.filter((c) => c.id !== id)
      }
    });
    showToast('Cupón eliminado', 'info');
  };

  // =========================================================================
  // SUB-PANEL G: CONTENIDO (FAQ, REVIEWS)
  // =========================================================================
  const content = webBudget.content || {};
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const currentFaqs = content.faqs || [];
    updateWebBudget({
      content: {
        ...content,
        faqs: [...currentFaqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]
      }
    });
    setNewFaqQ('');
    setNewFaqA('');
    showToast('Pregunta frecuente agregada', 'success');
  };

  const handleDeleteFaq = (idx: number) => {
    const currentFaqs = content.faqs || [];
    updateWebBudget({
      content: {
        ...content,
        faqs: currentFaqs.filter((_: any, i: number) => i !== idx)
      }
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header Principal del Panel "Web de Presupuestos" */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display text-[#161616]">
                  Web de Presupuestos DetailVlak
                </h1>
                <span className="text-[10px] bg-red-100 text-[#D7141A] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Panel
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Control total sin código: servicios, combos, tamaños, productos, promociones, agenda y apariencia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href="/presupuesto"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-medium px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Ver Web Pública</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setIsServiceModalOpen(true);
              }}
              className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* 2. Barra de Navegación por Pestañas del Panel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 text-xs">
          {[
            { key: 'servicios', label: 'Servicios', icon: Sparkles },
            { key: 'paquetes', label: 'Paquetes / Combos', icon: Layers },
            { key: 'tamanos', label: 'Tamaños', icon: Car },
            { key: 'productos', label: 'Productos', icon: ShoppingBag },
            { key: 'promociones', label: 'Promociones', icon: Percent },
            { key: 'agenda', label: 'Agenda & Cupos', icon: Calendar },
            { key: 'contenido', label: 'Contenido', icon: FileText },
            { key: 'apariencia', label: 'Apariencia', icon: Palette },
            { key: 'ajustes', label: 'Ajustes & Links', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubTab(tab.key as any)}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA A: SERVICIOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'servicios' && (
        <div className="space-y-4">
          {/* Tarjetas de Resumen de Servicios */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Total servicios</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-[#161616] mt-0.5">{detailingTariffs.length}</p>
              <span className="text-[10px] text-[#6B6B6B] block">en catálogo</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Activos</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {detailingTariffs.filter((t) => t.isActive !== false).length}
              </p>
              <span className="text-[10px] text-emerald-600 block">visibles online</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Pausados</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-gray-400 mt-0.5">
                {detailingTariffs.filter((t) => t.isActive === false).length}
              </p>
              <span className="text-[10px] text-[#6B6B6B] block">ocultos</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Con video</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-violet-600 mt-0.5">
                {detailingTariffs.filter((t) => Boolean(t.video_url && t.video_url.trim())).length}
              </p>
              <span className="text-[10px] text-violet-600 block">multimedia</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Destacados</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-[#D7141A] mt-0.5">
                {detailingTariffs.filter((t) => Boolean(t.is_featured)).length}
              </p>
              <span className="text-[10px] text-[#D7141A] block">con insignia</span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-[#E5E5E3] p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <input
                type="text"
                placeholder="Buscar servicio por nombre o descripción..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3.5 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setServiceFilter('all')}
                className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  serviceFilter === 'all'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
                }`}
              >
                Todos ({detailingTariffs.length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('active')}
                className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  serviceFilter === 'active'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
                }`}
              >
                Activos ({detailingTariffs.filter((t) => t.isActive !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('paused')}
                className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  serviceFilter === 'paused'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
                }`}
              >
                Pausados ({detailingTariffs.filter((t) => t.isActive === false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('featured')}
                className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  serviceFilter === 'featured'
                    ? 'bg-[#161616] text-white shadow-xs'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200'
                }`}
              >
                Destacados
              </button>
            </div>
          </div>

          {/* Grilla de Servicios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTariffs.map((tariff, index) => {
              const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());
              const isPaused = tariff.isActive === false;

              return (
                <div
                  key={tariff.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                    isPaused ? 'border-[#E5E5E3] opacity-60 bg-gray-50/50' : 'border-[#E5E5E3] hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Encabezado con Categoría, Badge y Acciones de Reordenamiento */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616]">
                          {tariff.category || 'Interior'}
                        </span>
                        {tariff.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-[#D7141A] border border-red-200">
                            {tariff.badge}
                          </span>
                        )}
                        {tariff.is_featured && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-[#D7141A] border border-red-200 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#D7141A] text-[#D7141A]" /> Destacado
                          </span>
                        )}
                        <span className="text-[10px] text-[#6B6B6B] font-mono">
                          {tariff.durationHours || 3} hs
                        </span>
                      </div>

                      {/* Botones de Orden */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveService(index, 'up')}
                          className="p-1 rounded text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === sortedTariffs.length - 1}
                          onClick={() => handleMoveService(index, 'down')}
                          className="p-1 rounded text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nombre y Nombre Corto */}
                    <div>
                      <h3 className="font-bold text-[#161616] text-sm leading-snug">{tariff.name}</h3>
                      <span className="text-[11px] text-[#D7141A] font-semibold block">
                        Chip web: {tariff.shortName || tariff.name}
                      </span>
                    </div>

                    {/* Indicadores Multimedia */}
                    <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                      {hasVideo ? (
                        <span className="text-violet-600 flex items-center gap-1 font-medium">
                          <Video className="w-3.5 h-3.5" /> {tariff.is_video_uploaded ? 'Video subido' : 'Video embebido'}
                        </span>
                      ) : (
                        <span className="text-[#9A9A9A]">Sin video</span>
                      )}
                      <span>•</span>
                      <span>{tariff.included_steps?.length || 0} pasos</span>
                      {tariff.before_after_images && tariff.before_after_images.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">{tariff.before_after_images.length} fotos antes/después</span>
                        </>
                      )}
                    </div>

                    {/* Precios resumidos */}
                    <div className="bg-[#F5F5F4] p-2.5 rounded-xl border border-[#E5E5E3] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#6B6B6B] font-sans text-[11px]">Mediano:</span>
                      <span className="font-bold text-[#161616]">
                        ${(tariff.prices?.mediano || 0).toLocaleString('es-UY')} UYU
                      </span>
                      {tariff.promo_price && (
                        <span className="text-emerald-600 text-[10px] font-bold">
                          Promo: ${tariff.promo_price.toLocaleString('es-UY')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Acciones del Servicio */}
                  <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                    {/* Toggle Activo / Pausado */}
                    <button
                      type="button"
                      onClick={() => {
                        updateDetailingTariff(tariff.id, { isActive: isPaused }, !isPaused);
                        showToast(isPaused ? 'Servicio activado' : 'Servicio pausado', 'info');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        !isPaused ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {!isPaused ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{!isPaused ? 'Activo' : 'Pausado'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Duplicar */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateService(tariff)}
                        className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] cursor-pointer transition-colors"
                        title="Duplicar servicio"
                      >
                        <DuplicateIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedService(tariff);
                          setIsServiceModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-white border border-[#E5E5E3] hover:bg-[#F5F5F4] text-[#161616] text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#D7141A]" />
                        <span>Editar</span>
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDeleteService(tariff)}
                        className="p-1.5 rounded-lg text-[#9A9A9A] hover:text-[#D7141A] hover:bg-red-50 cursor-pointer transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA B: PAQUETES / COMBOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'paquetes' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E5E3] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-[#161616]">Combos y Paquetes de Tratamientos</h3>
              <p className="text-xs text-[#6B6B6B]">
                Se muestran arriba en la página con el ahorro visible ("Ahorrás $X").
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingPackage({
                  id: `pkg-${Date.now()}`,
                  name: '',
                  description: '',
                  service_ids: [],
                  prices: { chico: 5000, mediano: 6500, suv: 8000, pickup: 9500, moto: 3500 },
                  badge: 'Ahorrás más',
                  is_active: true
                });
                setIsPackageModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Paquete</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white border border-[#E5E5E3] rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-[#D7141A] border border-red-200">
                    {pkg.badge || 'Combo Especial'}
                  </span>
                  <span className={`text-[10px] font-semibold ${pkg.is_active ? 'text-emerald-600' : 'text-[#6B6B6B]'}`}>
                    {pkg.is_active ? 'Activo en web' : 'Pausado'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-[#161616]">{pkg.name}</h4>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed mt-1">{pkg.description}</p>
                </div>

                <div className="bg-[#F5F5F4] p-3 rounded-xl border border-[#E5E5E3] space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Servicios incluidos:</span>
                  <div className="flex flex-wrap gap-1">
                    {pkg.service_ids.map((sid) => {
                      const t = detailingTariffs.find((item) => item.id === sid);
                      return (
                        <span key={sid} className="px-2 py-0.5 rounded bg-white border border-[#E5E5E3] text-[#161616] text-[11px] font-medium shadow-2xs">
                          ✓ {t?.shortName || t?.name || sid}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E3]">
                  <span className="font-mono text-sm font-bold text-[#161616]">
                    ${(pkg.prices?.mediano || 0).toLocaleString('es-UY')} UYU <span className="text-[10px] text-[#6B6B6B] font-sans font-normal">(Mediano)</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsPackageModalOpen(true);
                      }}
                      className="px-3 py-1 bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#161616] shadow-xs cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 text-[#9A9A9A] hover:text-[#D7141A] rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA C: TAMAÑOS DE VEHÍCULO */}
      {/* ========================================================================= */}
      {activeSubTab === 'tamanos' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E5E3] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-[#161616]">Categorías y Tamaños de Vehículos</h3>
              <p className="text-xs text-[#6B6B6B]">
                Configurá los tamaños con sus ejemplos y modelos para que el cliente elija fácilmente su auto.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingSize({
                  key: `cat-${Date.now()}`,
                  label: '',
                  sub: '',
                  examples: '',
                  icon: 'car',
                  is_active: true,
                  order: sizes.length + 1
                });
                setIsSizeModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Tamaño</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {sizes.map((s) => (
              <div key={s.key} className="bg-white border border-[#E5E5E3] rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-[#D7141A] flex items-center justify-center">
                    {s.icon === 'truck' ? <Truck className="w-4 h-4" /> : s.icon === 'bike' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {s.is_active ? 'Activo' : 'Pausado'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-[#161616]">{s.label}</h4>
                  <span className="text-xs text-[#6B6B6B] block">{s.sub}</span>
                  <p className="text-[11px] text-[#9A9A9A] mt-1">Ejemplos: {s.examples}</p>
                </div>

                <div className="pt-2 border-t border-[#E5E5E3] flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSize(s);
                      setIsSizeModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA D: PRODUCTOS DE MANTENIMIENTO */}
      {/* ========================================================================= */}
      {activeSubTab === 'productos' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E5E3] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-[#161616]">Productos para Vender Junto al Servicio</h3>
              <p className="text-xs text-[#6B6B6B]">
                Paso opcional en la web: "¿Querés sumar algo para mantener tu auto?". Van en el WhatsApp y PDF separados del servicio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProduct({
                  id: `prod-${Date.now()}`,
                  name: '',
                  price: 990,
                  short_description: '',
                  is_active: true
                });
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-[#E5E5E3] rounded-2xl p-4 space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-[#9A9A9A]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#161616]">{p.name}</h4>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal line-clamp-2">{p.short_description}</p>
                </div>

                <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#161616]">${p.price.toLocaleString('es-UY')} UYU</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsProductModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#161616] shadow-xs cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-[#9A9A9A] hover:text-[#D7141A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA E: PROMOCIONES Y CUPONES */}
      {/* ========================================================================= */}
      {activeSubTab === 'promociones' && (
        <div className="space-y-5 text-[#161616]">
          {/* 1. Escalones por cantidad de servicios */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#161616]">1. Descuento por Cantidad de Tratamientos</h4>
                <p className="text-xs text-[#6B6B6B]">Ahorro automático al sumar 2 o más servicios en el mismo presupuesto.</p>
              </div>
              <input
                type="checkbox"
                checked={promos.tiered_quantity_enabled}
                onChange={(e) =>
                  updateWebBudget({
                    promotions: { ...promos, tiered_quantity_enabled: e.target.checked }
                  })
                }
                className="w-5 h-5 text-[#D7141A] focus:ring-[#D7141A] rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                <span>2 servicios:</span>
                <span className="font-bold text-emerald-600 font-mono">5% OFF</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                <span>3 o más servicios:</span>
                <span className="font-bold text-emerald-600 font-mono">10% OFF</span>
              </div>
            </div>
          </div>

          {/* 2. Cupones de Descuento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#161616]">2. Cupones de Descuento</h4>
                <p className="text-xs text-[#6B6B6B]">Códigos promocionales para campañas puntuales de Instagram o WhatsApp.</p>
              </div>
            </div>

            {/* Crear nuevo cupón */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="CÓDIGO (ej. VERANO26)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] uppercase font-mono focus:border-[#D7141A]"
              />
              <input
                type="number"
                placeholder="Valor"
                value={newCouponVal}
                onChange={(e) => setNewCouponVal(Number(e.target.value))}
                className="w-24 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] font-mono focus:border-[#D7141A]"
              />
              <select
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as any)}
                className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A]"
              >
                <option value="percent">% Porcentaje</option>
                <option value="fixed">$ Monto Fijo UYU</option>
              </select>
              <button
                type="button"
                onClick={handleAddCoupon}
                className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                + Crear Cupón
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {(promos.coupons || []).map((cpn: DetailingDiscountCoupon) => (
                <div key={cpn.id} className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#D7141A]">{cpn.code}</span>
                    <span className="text-[#6B6B6B] font-sans">
                      ({cpn.discount_type === 'percent' ? `${cpn.discount_value}% OFF` : `$${cpn.discount_value} UYU`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(cpn.id)}
                    className="text-[#9A9A9A] hover:text-[#D7141A] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Base de Comisiones */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <h4 className="font-bold text-sm text-[#161616]">3. Regla de Comisiones con Descuentos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comm_base"
                  checked={promos.commission_base === 'final_price'}
                  onChange={() =>
                    updateWebBudget({
                      promotions: { ...promos, commission_base: 'final_price' }
                    })
                  }
                  className="text-[#D7141A] focus:ring-[#D7141A]"
                />
                <span>Calcular comisiones sobre el <strong>precio final cobrado</strong></span>
              </label>
              <label className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comm_base"
                  checked={promos.commission_base === 'list_price'}
                  onChange={() =>
                    updateWebBudget({
                      promotions: { ...promos, commission_base: 'list_price' }
                    })
                  }
                  className="text-[#D7141A] focus:ring-[#D7141A]"
                />
                <span>Calcular comisiones sobre el <strong>precio de lista</strong></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA F: AGENDA & CUPOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'agenda' && (
        <div className="space-y-4 text-[#161616]">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#161616]">Capacidad del Taller</h4>
                <p className="text-xs text-[#6B6B6B]">Define cuántos autos puede recibir DetailVlak por día.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#6B6B6B]">Autos máximos por día:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={webBudget.agenda?.max_vehicles_per_day || 2}
                  onChange={(e) =>
                    updateWebBudget({
                      agenda: { ...webBudget.agenda, max_vehicles_per_day: Number(e.target.value) }
                    })
                  }
                  className="w-16 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 text-center font-mono font-bold text-[#161616] text-xs focus:border-[#D7141A]"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-xs text-[#161616] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#D7141A] shrink-0 mt-0.5" />
              <span>
                <strong>Sincronización Inteligente:</strong> Los días que ya tengan trabajos agendados en la pestaña "Calendario" de DetailVlak se descontarán automáticamente del cupo disponible para los clientes en la web.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA G: CONTENIDO DE LA PÁGINA */}
      {/* ========================================================================= */}
      {activeSubTab === 'contenido' && (
        <div className="space-y-4 text-[#161616]">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 shadow-xs">
            <h4 className="font-bold text-sm text-[#161616]">Textos de la Portada</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Título principal:</label>
                <input
                  type="text"
                  value={content.hero_title || ''}
                  onChange={(e) =>
                    updateWebBudget({
                      content: { ...content, hero_title: e.target.value }
                    })
                  }
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-[#161616] focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Frase de bajada:</label>
                <textarea
                  rows={2}
                  value={content.hero_subtitle || ''}
                  onChange={(e) =>
                    updateWebBudget({
                      content: { ...content, hero_subtitle: e.target.value }
                    })
                  }
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes FAQ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <h4 className="font-bold text-sm text-[#161616]">Preguntas Frecuentes (FAQ)</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Pregunta (ej. ¿Qué pasa si llueve?)"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A]"
              />
              <textarea
                rows={2}
                placeholder="Respuesta detallada..."
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] focus:border-[#D7141A]"
              />
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                + Agregar Pregunta
              </button>
            </div>

            <div className="space-y-2 pt-3">
              {(content.faqs || []).map((faq: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-start justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-[#161616] block">{faq.question}</strong>
                    <p className="text-[#6B6B6B] mt-1">{faq.answer}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteFaq(idx)} className="text-[#9A9A9A] hover:text-[#D7141A] cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA H: APARIENCIA & PORTADA */}
      {/* ========================================================================= */}
      {activeSubTab === 'apariencia' && (() => {
        const appearance = webBudget.appearance || {};
        const heroMediaType = appearance.hero_media_type || 'video';
        const heroClips: DetailingWebHeroClip[] =
          appearance.hero_video_clips && appearance.hero_video_clips.length > 0
            ? appearance.hero_video_clips
            : [
                {
                  id: 'clip-1',
                  url: '/videos/portada-interior.mp4',
                  label: '1) Limpieza de interior con pincel',
                  order: 1
                },
                {
                  id: 'clip-2',
                  url: '/videos/portada-pulido.mp4',
                  label: '2) Pulido con máquina',
                  order: 2
                }
              ];
        const heroPoster = appearance.hero_poster_url || '/videos/portada-poster.webp';
        const heroImage =
          appearance.hero_image_url ||
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1600&auto=format&fit=crop&q=85';

        const handleSetMediaType = (type: 'image' | 'video') => {
          updateWebBudget({
            appearance: {
              ...appearance,
              hero_media_type: type,
              hero_video_clips: heroClips,
              hero_poster_url: heroPoster,
              hero_image_url: heroImage
            }
          });
        };

        const handleUpdateClip = (index: number, partial: Partial<DetailingWebHeroClip>) => {
          const updated = [...heroClips];
          updated[index] = { ...updated[index], ...partial };
          updateWebBudget({
            appearance: {
              ...appearance,
              hero_video_clips: updated
            }
          });
        };

        const handleAddClip = () => {
          if (heroClips.length >= 3) {
            showToast('Se permite un máximo de 3 clips en la portada', 'info');
            return;
          }
          const newClip: DetailingWebHeroClip = {
            id: `clip-${Date.now()}`,
            url: '',
            label: `Clip ${heroClips.length + 1}`,
            order: heroClips.length + 1
          };
          updateWebBudget({
            appearance: {
              ...appearance,
              hero_video_clips: [...heroClips, newClip]
            }
          });
          showToast('Clip agregado a la portada', 'success');
        };

        const handleRemoveClip = (index: number) => {
          if (heroClips.length <= 1) {
            showToast('Debe haber al menos 1 clip configurado', 'error');
            return;
          }
          const updated = heroClips
            .filter((_, idx) => idx !== index)
            .map((c, i) => ({ ...c, order: i + 1 }));
          updateWebBudget({
            appearance: {
              ...appearance,
              hero_video_clips: updated
            }
          });
          showToast('Clip eliminado', 'success');
        };

        const handleMoveClip = (index: number, direction: 'up' | 'down') => {
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= heroClips.length) return;

          const updated = [...heroClips];
          const temp = updated[index];
          updated[index] = updated[targetIndex];
          updated[targetIndex] = temp;

          const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));
          updateWebBudget({
            appearance: {
              ...appearance,
              hero_video_clips: reordered
            }
          });
          showToast('Orden actualizado', 'success');
        };

        const handleUploadClipVideo = async (index: number, file: File) => {
          setUploadingClipIndex(index);
          setUploadClipProgress(15);
          try {
            const publicUrl = await uploadVideoToStorage(file, (p) => setUploadClipProgress(p));
            handleUpdateClip(index, { url: publicUrl });
            showToast(`Clip ${index + 1} subido correctamente`, 'success');
          } catch (err: any) {
            showToast(err.message || 'Error al subir el video', 'error');
          } finally {
            setUploadingClipIndex(null);
            setUploadClipProgress(0);
          }
        };

        const handleUploadPosterImage = async (file: File) => {
          setUploadingPoster(true);
          try {
            const publicUrl = await uploadImageToStorage(file, 'templates', { quality: 0.85 });
            updateWebBudget({
              appearance: {
                ...appearance,
                hero_poster_url: publicUrl
              }
            });
            showToast('Imagen poster actualizada con éxito', 'success');
          } catch (err: any) {
            showToast(err.message || 'Error al subir imagen poster', 'error');
          } finally {
            setUploadingPoster(false);
          }
        };

        const handleUploadHeroImage = async (file: File) => {
          setUploadingHeroImage(true);
          try {
            const publicUrl = await uploadImageToStorage(file, 'templates', { quality: 0.88 });
            updateWebBudget({
              appearance: {
                ...appearance,
                hero_image_url: publicUrl
              }
            });
            showToast('Imagen de portada actualizada con éxito', 'success');
          } catch (err: any) {
            showToast(err.message || 'Error al subir imagen', 'error');
          } finally {
            setUploadingHeroImage(false);
          }
        };

        return (
          <div className="space-y-6">
            {/* 1. SECCIÓN PORTADA (IMAGEN O VIDEO CON HASTA 3 CLIPS Y VISTA PREVIA) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-5 text-[#161616] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E3] pb-4">
                <div>
                  <h4 className="font-bold text-sm text-[#161616] flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#1E5EFF]" />
                    <span>Portada del Armador Web (/presupuesto)</span>
                  </h4>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Elegí si la portada muestra una imagen estática o un video en loop continuo de hasta 3 clips con fundido suave (0,4 s).
                  </p>
                </div>

                {/* Selector Modo: Video o Imagen */}
                <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetMediaType('video')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      heroMediaType === 'video'
                        ? 'bg-[#1E5EFF] text-white shadow-xs'
                        : 'text-[#6B6B6B] hover:text-[#161616]'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video en bucle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetMediaType('image')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      heroMediaType === 'image'
                        ? 'bg-[#1E5EFF] text-white shadow-xs'
                        : 'text-[#6B6B6B] hover:text-[#161616]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Imagen fija</span>
                  </button>
                </div>
              </div>

              {/* OPCIÓN A: VIDEO EN BUCLE */}
              {heroMediaType === 'video' && (
                <div className="space-y-5">
                  {/* Poster Image config */}
                  <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-[#161616] block">
                          Imagen "Poster" de carga (WebP):
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">
                          Se muestra mientras cargan los videos y como imagen fija si el visitante tiene activado ahorro de datos o reducción de movimiento.
                        </span>
                      </div>
                      <label className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] hover:bg-[#F0F0EE] text-[#161616] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#1E5EFF]" />
                        <span>{uploadingPoster ? 'Subiendo...' : 'Subir WebP'}</span>
                        <input
                          type="file"
                          accept="image/webp,image/jpeg,image/png"
                          disabled={uploadingPoster}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPosterImage(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={heroPoster}
                      onChange={(e) =>
                        updateWebBudget({
                          appearance: { ...appearance, hero_poster_url: e.target.value }
                        })
                      }
                      placeholder="/videos/portada-poster.webp o URL de Supabase Storage"
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-[#161616]"
                    />
                  </div>

                  {/* Clips de Video (Hasta 3 clips) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#161616] uppercase tracking-wider">
                        Clips de Video en Reproducción ({heroClips.length}/3)
                      </span>
                      {heroClips.length < 3 && (
                        <button
                          type="button"
                          onClick={handleAddClip}
                          className="px-3 py-1.5 rounded-lg bg-[#1E5EFF]/10 hover:bg-[#1E5EFF]/20 text-[#1E5EFF] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar clip</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {heroClips.map((clip, idx) => (
                        <div
                          key={clip.id || idx}
                          className="p-3.5 sm:p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E3] space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#1E5EFF] text-white flex items-center justify-center font-bold text-[11px]">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={clip.label || ''}
                                onChange={(e) => handleUpdateClip(idx, { label: e.target.value })}
                                placeholder="Nombre del clip (ej: Limpieza de interior con pincel)"
                                className="font-semibold text-[#161616] bg-transparent border-b border-transparent hover:border-[#E5E5E3] focus:border-[#1E5EFF] px-1 py-0.5 text-xs outline-none"
                              />
                            </div>

                            {/* Controles de orden y eliminación */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveClip(idx, 'up')}
                                title="Mover arriba"
                                className="p-1 rounded hover:bg-[#E5E5E3] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#6B6B6B]"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === heroClips.length - 1}
                                onClick={() => handleMoveClip(idx, 'down')}
                                title="Mover abajo"
                                className="p-1 rounded hover:bg-[#E5E5E3] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#6B6B6B]"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={heroClips.length <= 1}
                                onClick={() => handleRemoveClip(idx)}
                                title="Eliminar clip"
                                className="p-1 rounded hover:bg-rose-100 text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* URL y botón de subida */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={clip.url || ''}
                              onChange={(e) => handleUpdateClip(idx, { url: e.target.value })}
                              placeholder="/videos/clip.mp4 o URL pública en Supabase Storage"
                              className="flex-1 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-[#161616]"
                            />

                            <label className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] hover:bg-[#F0F0EE] text-[#161616] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#1E5EFF]" />
                              <span>
                                {uploadingClipIndex === idx
                                  ? `Subiendo ${uploadClipProgress}%...`
                                  : 'Subir MP4'}
                              </span>
                              <input
                                type="file"
                                accept="video/mp4,video/webm"
                                disabled={uploadingClipIndex !== null}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadClipVideo(idx, file);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* OPCIÓN B: IMAGEN FIJA */}
              {heroMediaType === 'image' && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-3 text-xs">
                  <span className="font-semibold text-[#161616] block">
                    URL de la Imagen de Portada:
                  </span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={heroImage}
                      onChange={(e) =>
                        updateWebBudget({
                          appearance: { ...appearance, hero_image_url: e.target.value }
                        })
                      }
                      placeholder="https://... o URL en Supabase Storage"
                      className="flex-1 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-[#161616]"
                    />

                    <label className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] hover:bg-[#F0F0EE] text-[#161616] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#1E5EFF]" />
                      <span>{uploadingHeroImage ? 'Subiendo...' : 'Subir Imagen'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingHeroImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadHeroImage(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* VISTA PREVIA EN VIVO DE LA PORTADA */}
              <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#1E5EFF]" />
                    <span>Vista Previa en Vivo de la Portada</span>
                  </span>
                  <span className="text-[11px] text-[#6B6B6B]">
                    {heroMediaType === 'video'
                      ? 'Loop continuo con fundido de 0,4 s entre clips'
                      : 'Imagen estática'}
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-[#E5E5E3] max-w-full">
                  <HeroVideoBackground
                    mediaType={heroMediaType}
                    imageUrl={heroImage}
                    posterUrl={heroPoster}
                    clips={heroClips}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#E6E8EB]/80 block">
                      DetailVlak • Estética Automotriz Shangrilá
                    </span>
                    <h3 className="text-[20px] sm:text-[24px] font-bold leading-[1.15] text-white tracking-tight">
                      Volvé a estrenar tu auto
                    </h3>
                    <p className="text-[13px] text-[#E6E8EB] font-normal leading-relaxed">
                      Armá tu presupuesto a medida en segundos con precios claros y atención personalizada.
                    </p>
                    <div className="pt-1">
                      <div className="h-[42px] px-5 rounded-[10px] bg-[#1E5EFF] text-white font-semibold text-[13px] inline-flex items-center gap-2 shadow-xs pointer-events-none select-none">
                        <span>Armar mi presupuesto</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </HeroVideoBackground>
                </div>
              </div>
            </div>

            {/* 2. ESTILO VISUAL Y TIPOGRAFÍA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 text-[#161616] shadow-xs">
              <h4 className="font-bold text-sm text-[#161616]">Estilo Visual y Tipografía</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#6B6B6B] font-semibold block mb-1">Tipografía:</label>
                  <select
                    value={webBudget.appearance?.font_family || 'Inter'}
                    onChange={(e) =>
                      updateWebBudget({
                        appearance: { ...webBudget.appearance, font_family: e.target.value }
                      })
                    }
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#1E5EFF]"
                  >
                    <option value="Inter">Inter (Limpia y corporativa - Recomendada)</option>
                    <option value="Archivo Narrow">Archivo Narrow (Moderna y atlética)</option>
                    <option value="Barlow Condensed">Barlow Condensed (Impactante automotriz)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#6B6B6B] font-semibold block mb-1">Estilo de tarjetas en catálogo:</label>
                  <select
                    value={webBudget.appearance?.card_style || 'compact'}
                    onChange={(e) =>
                      updateWebBudget({
                        appearance: { ...webBudget.appearance, card_style: e.target.value }
                      })
                    }
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#1E5EFF]"
                  >
                    <option value="compact">Compacta (Más tratamientos por pantalla)</option>
                    <option value="large_photo">Con Foto Grande Destacada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* PESTAÑA I: AJUSTES & MARKETING */}
      {/* ========================================================================= */}
      {activeSubTab === 'ajustes' && (
        <div className="space-y-4 text-[#161616]">
          {/* Links con Atribución */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <h4 className="font-bold text-sm flex items-center gap-2 text-[#161616]">
              <Megaphone className="w-4 h-4 text-[#D7141A]" />
              <span>Enlaces con Atribución para Publicidad</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-700">Para Anuncios Meta / Google:</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold border border-purple-200">Comisión 12,5%</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto?origen=anuncio`}
                    className="flex-1 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-[11px] font-mono select-all text-[#161616]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${window.location.origin}/presupuesto?origen=anuncio`, 'Link de anuncios')}
                    className="px-3 py-1 bg-[#D7141A] hover:bg-[#b01015] text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-700">Para Bio de Instagram / WhatsApp:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">Comisión 30%</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto`}
                    className="flex-1 bg-white border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-[11px] font-mono select-all text-[#161616]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${window.location.origin}/presupuesto`, 'Link directo')}
                    className="px-3 py-1 bg-white hover:bg-[#F5F5F4] text-[#161616] rounded-lg font-bold border border-[#E5E5E3] shadow-xs cursor-pointer transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Switch de Mantenimiento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#161616]">Pausar Web Pública</h4>
                <p className="text-xs text-[#6B6B6B]">Desactiva el armador temporalmente si el taller está con agenda llena.</p>
              </div>
              <input
                type="checkbox"
                checked={webBudget.settings?.is_maintenance_paused || false}
                onChange={(e) =>
                  updateWebBudget({
                    settings: { ...webBudget.settings, is_maintenance_paused: e.target.checked }
                  })
                }
                className="w-5 h-5 text-[#D7141A] focus:ring-[#D7141A] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modales de Servicio, Paquete, Tamaño y Producto */}
      {isServiceModalOpen && (
        <DetailingWebServiceModal
          isOpen={isServiceModalOpen}
          service={selectedService}
          onClose={() => {
            setIsServiceModalOpen(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Modal Paquete */}
      {isPackageModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 max-w-lg w-full text-[#161616] space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold font-display text-base text-[#161616]">Configurar Paquete / Combo</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Nombre del Paquete:</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  placeholder="Ej: Combo Full Detail"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#D7141A]"
                />
              </div>

              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Servicios que incluye:</label>
                <div className="space-y-1 bg-[#F5F5F4] p-2.5 rounded-xl border border-[#E5E5E3] max-h-36 overflow-y-auto">
                  {detailingTariffs.map((t) => {
                    const isChecked = editingPackage.service_ids.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingPackage({
                                ...editingPackage,
                                service_ids: [...editingPackage.service_ids, t.id]
                              });
                            } else {
                              setEditingPackage({
                                ...editingPackage,
                                service_ids: editingPackage.service_ids.filter((id) => id !== t.id)
                              });
                            }
                          }}
                          className="text-[#D7141A] focus:ring-[#D7141A] rounded"
                        />
                        <span className="text-[#161616]">{t.shortName || t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Precio Combo ($ UYU Mediano):</label>
                <input
                  type="number"
                  value={editingPackage.prices?.mediano || 0}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      prices: { ...editingPackage.prices, mediano: Number(e.target.value) }
                    })
                  }
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-mono font-bold focus:border-[#D7141A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F5F5F4] text-xs font-semibold rounded-xl text-[#161616] border border-[#E5E5E3] shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSavePackage(editingPackage)}
                className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Guardar Paquete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tamaño */}
      {isSizeModalOpen && editingSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 max-w-md w-full text-[#161616] space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold font-display text-base text-[#161616]">Editar Categoría de Tamaño</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Nombre:</label>
                <input
                  type="text"
                  value={editingSize.label}
                  onChange={(e) => setEditingSize({ ...editingSize, label: e.target.value })}
                  placeholder="Ej: Chico, Mediano..."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={editingSize.sub}
                  onChange={(e) => setEditingSize({ ...editingSize, sub: e.target.value })}
                  placeholder="Ej: Hatch / Compacto"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Modelos de ejemplo:</label>
                <input
                  type="text"
                  value={editingSize.examples}
                  onChange={(e) => setEditingSize({ ...editingSize, examples: e.target.value })}
                  placeholder="Ej: Gol, Onix, 208, Celerio"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setIsSizeModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F5F5F4] text-xs font-semibold rounded-xl text-[#161616] border border-[#E5E5E3] shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveSize(editingSize)}
                className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Guardar Tamaño
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Producto */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 max-w-md w-full text-[#161616] space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold font-display text-base text-[#161616]">Producto de Mantenimiento</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Nombre del Producto:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej: Shampoo PH Neutro Koch Chemie"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Precio ($ UYU):</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] font-mono font-bold focus:border-[#D7141A]"
                />
              </div>
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">Descripción corta:</label>
                <textarea
                  rows={2}
                  value={editingProduct.short_description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                  placeholder="Para qué sirve y cómo se aplica..."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
              <div>
                <label className="text-[#6B6B6B] font-semibold block mb-1">URL de la foto:</label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-[#161616] focus:border-[#D7141A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F5F5F4] text-xs font-semibold rounded-xl text-[#161616] border border-[#E5E5E3] shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct(editingProduct)}
                className="px-4 py-2 bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

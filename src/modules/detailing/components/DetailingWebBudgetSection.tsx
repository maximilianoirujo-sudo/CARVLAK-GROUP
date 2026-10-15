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
  Bike
} from 'lucide-react';
import {
  DetailingTariff,
  DetailingPackage,
  DetailingVehicleSize,
  DetailingUpsellProduct,
  DetailingDiscountCoupon,
  DetailingWebReview
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DetailingWebServiceModal } from './DetailingWebServiceModal';
import { VideoEmbed } from '../../../components/common/VideoEmbed';
import { uploadImageToStorage } from '../../../lib/storage';

export const DetailingWebBudgetSection: React.FC = () => {
  const {
    detailingTariffs,
    updateDetailingTariff,
    addDetailingTariff,
    deleteDetailingTariff,
    reorderDetailingTariffs,
    detailingConfig,
    updateDetailingConfig
  } = useData();
  const { showToast } = useToast();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'servicios' | 'paquetes' | 'tamanos' | 'productos' | 'promociones' | 'agenda' | 'contenido' | 'apariencia' | 'ajustes'
  >('servicios');

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
              <p className="text-lg sm:text-xl font-bold font-mono text-blue-600 mt-0.5">
                {detailingTariffs.filter((t) => Boolean(t.video_url && t.video_url.trim())).length}
              </p>
              <span className="text-[10px] text-[#6B6B6B] block">multimedia</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-[#E5E5E3] shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] sm:text-xs text-[#6B6B6B] block">Destacados</span>
              <p className="text-lg sm:text-xl font-bold font-mono text-amber-600 mt-0.5">
                {detailingTariffs.filter((t) => Boolean(t.is_featured)).length}
              </p>
              <span className="text-[10px] text-amber-600 block">con insignia</span>
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
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'all' ? 'bg-[#161616] text-white' : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Todos ({detailingTariffs.length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('active')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Activos ({detailingTariffs.filter((t) => t.isActive !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('paused')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'paused' ? 'bg-gray-200 text-gray-700' : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616]'
                }`}
              >
                Pausados ({detailingTariffs.filter((t) => t.isActive === false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('featured')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'featured' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616]'
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {tariff.badge}
                          </span>
                        )}
                        {tariff.is_featured && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Destacado
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
                        <span className="text-blue-600 flex items-center gap-1 font-medium">
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
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
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

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
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
      {/* PESTAÑA H: APARIENCIA */}
      {/* ========================================================================= */}
      {activeSubTab === 'apariencia' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E3] space-y-4 text-[#161616] shadow-xs">
          <h4 className="font-bold text-sm text-[#161616]">Estilo Visual y Tipografía</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#6B6B6B] font-semibold block mb-1">Tipografía:</label>
              <select
                value={webBudget.appearance?.font_family || 'Archivo Narrow'}
                onChange={(e) =>
                  updateWebBudget({
                    appearance: { ...webBudget.appearance, font_family: e.target.value }
                  })
                }
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#D7141A]"
              >
                <option value="Archivo Narrow">Archivo Narrow (Moderna y atlética)</option>
                <option value="Inter">Inter (Limpia y corporativa)</option>
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
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:border-[#D7141A]"
              >
                <option value="compact">Compacta (Más tratamientos por pantalla)</option>
                <option value="large_photo">Con Foto Grande Destacada</option>
              </select>
            </div>
          </div>
        </div>
      )}

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

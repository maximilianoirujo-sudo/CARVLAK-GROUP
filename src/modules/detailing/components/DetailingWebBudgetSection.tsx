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
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Principal del Panel "Web de Presupuestos" */}
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0044CC] flex items-center justify-center text-white shadow-md font-bold tracking-wider">
                DV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Web de Presupuestos DetailVlak</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0066FF]/20 text-[#3B82F6] border border-[#0066FF]/30 uppercase">
                    Panel Administrativo
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Control total sin código: servicios, combos, tamaños, productos, promociones, agenda y apariencia.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <a
              href="/presupuesto"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] text-neutral-200 hover:text-white border border-[#333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Web Pública</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setIsServiceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0066FF]/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* 2. Barra de Navegación por Pestañas del Panel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-[#262626] text-xs">
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
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'bg-[#202020] text-neutral-400 hover:text-white hover:bg-[#282828]'
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
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-[#161616] border border-[#262626] p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <input
                type="text"
                placeholder="Buscar servicio por nombre o descripción..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setServiceFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'all' ? 'bg-[#333] text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Todos ({detailingTariffs.length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('active')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'active' ? 'bg-emerald-900/50 text-emerald-300' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Activos ({detailingTariffs.filter((t) => t.isActive !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('paused')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'paused' ? 'bg-neutral-800 text-neutral-300' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Pausados ({detailingTariffs.filter((t) => t.isActive === false).length})
              </button>
              <button
                type="button"
                onClick={() => setServiceFilter('featured')}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'featured' ? 'bg-amber-900/50 text-amber-300' : 'text-neutral-400 hover:text-white'
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
                  className={`bg-[#161616] border rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                    isPaused ? 'border-[#262626] opacity-60' : 'border-[#2C2C2C] hover:border-[#404040]'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Encabezado con Categoría, Badge y Acciones de Reordenamiento */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#202020] border border-[#333] text-neutral-300">
                          {tariff.category || 'Interior'}
                        </span>
                        {tariff.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {tariff.badge}
                          </span>
                        )}
                        {tariff.is_featured && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> Destacado
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {tariff.durationHours || 3} hs
                        </span>
                      </div>

                      {/* Botones de Orden */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveService(index, 'up')}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#252525] disabled:opacity-30"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === sortedTariffs.length - 1}
                          onClick={() => handleMoveService(index, 'down')}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#252525] disabled:opacity-30"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Nombre y Nombre Corto */}
                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">{tariff.name}</h3>
                      <span className="text-[11px] text-[#3B82F6] font-medium block">
                        Chip web: {tariff.shortName || tariff.name}
                      </span>
                    </div>

                    {/* Indicadores Multimedia */}
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      {hasVideo ? (
                        <span className="text-blue-400 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> {tariff.is_video_uploaded ? 'Video subido (MP4)' : 'Video embebido'}
                        </span>
                      ) : (
                        <span className="text-neutral-500">Sin video</span>
                      )}
                      <span>•</span>
                      <span>{tariff.included_steps?.length || 0} pasos</span>
                      {tariff.before_after_images && tariff.before_after_images.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">{tariff.before_after_images.length} fotos antes/después</span>
                        </>
                      )}
                    </div>

                    {/* Precios resumidos */}
                    <div className="bg-[#1C1C1C] p-2.5 rounded-xl border border-[#282828] flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400 font-sans text-[11px]">Mediano:</span>
                      <span className="font-bold text-white">
                        ${(tariff.prices?.mediano || 0).toLocaleString('es-UY')} UYU
                      </span>
                      {tariff.promo_price && (
                        <span className="text-emerald-400 text-[10px]">
                          Promo: ${tariff.promo_price.toLocaleString('es-UY')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Acciones del Servicio */}
                  <div className="pt-2 border-t border-[#262626] flex items-center justify-between gap-2">
                    {/* Toggle Activo / Pausado */}
                    <button
                      type="button"
                      onClick={() => {
                        updateDetailingTariff(tariff.id, { isActive: isPaused }, !isPaused);
                        showToast(isPaused ? 'Servicio activado' : 'Servicio pausado', 'info');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        !isPaused ? 'bg-emerald-950/40 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
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
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#252525] cursor-pointer"
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
                        className="px-3 py-1 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDeleteService(tariff)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 cursor-pointer"
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
          <div className="bg-[#161616] border border-[#262626] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
            <div>
              <h3 className="font-bold text-sm">Combos y Paquetes de Tratamientos</h3>
              <p className="text-xs text-neutral-400">
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
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Paquete</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-[#161616] border border-[#2C2C2C] rounded-2xl p-4 space-y-3 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {pkg.badge || 'Combo Especial'}
                  </span>
                  <span className={`text-[10px] font-semibold ${pkg.is_active ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {pkg.is_active ? 'Activo en web' : 'Pausado'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-white">{pkg.name}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-1">{pkg.description}</p>
                </div>

                <div className="bg-[#1F1F1F] p-3 rounded-xl border border-[#2D2D2D] space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">Servicios incluidos:</span>
                  <div className="flex flex-wrap gap-1">
                    {pkg.service_ids.map((sid) => {
                      const t = detailingTariffs.find((item) => item.id === sid);
                      return (
                        <span key={sid} className="px-2 py-0.5 rounded bg-[#282828] text-neutral-300 text-[11px]">
                          ✓ {t?.shortName || t?.name || sid}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                  <span className="font-mono text-sm font-bold text-[#3B82F6]">
                    ${(pkg.prices?.mediano || 0).toLocaleString('es-UY')} UYU <span className="text-[10px] text-neutral-400 font-normal">(Mediano)</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsPackageModalOpen(true);
                      }}
                      className="px-3 py-1 bg-[#252525] hover:bg-[#303030] text-xs font-semibold rounded-lg text-neutral-200"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg"
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
          <div className="bg-[#161616] border border-[#262626] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
            <div>
              <h3 className="font-bold text-sm">Categorías y Tamaños de Vehículos</h3>
              <p className="text-xs text-neutral-400">
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
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Tamaño</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {sizes.map((s) => (
              <div key={s.key} className="bg-[#161616] border border-[#2C2C2C] rounded-2xl p-4 space-y-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#222] text-[#3B82F6] flex items-center justify-center">
                    {s.icon === 'truck' ? <Truck className="w-4 h-4" /> : s.icon === 'bike' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.is_active ? 'bg-emerald-950/40 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                    {s.is_active ? 'Activo' : 'Pausado'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-white">{s.label}</h4>
                  <span className="text-xs text-neutral-400 block">{s.sub}</span>
                  <p className="text-[11px] text-neutral-500 mt-1">Ejemplos: {s.examples}</p>
                </div>

                <div className="pt-2 border-t border-[#262626] flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSize(s);
                      setIsSizeModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-200 text-xs font-semibold"
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
          <div className="bg-[#161616] border border-[#262626] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
            <div>
              <h3 className="font-bold text-sm">Productos para Vender Junto al Servicio</h3>
              <p className="text-xs text-neutral-400">
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
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {products.map((p) => (
              <div key={p.id} className="bg-[#161616] border border-[#2C2C2C] rounded-2xl p-4 space-y-3 text-white flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-xl bg-[#202020] border border-[#333] overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">{p.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-normal line-clamp-2">{p.short_description}</p>
                </div>

                <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#3B82F6]">${p.price.toLocaleString('es-UY')} UYU</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsProductModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#252525] text-xs font-semibold rounded-lg text-neutral-200"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400"
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
        <div className="space-y-5 text-white">
          {/* 1. Escalones por cantidad de servicios */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">1. Descuento por Cantidad de Tratamientos</h4>
                <p className="text-xs text-neutral-400">Ahorro automático al sumar 2 o más servicios en el mismo presupuesto.</p>
              </div>
              <input
                type="checkbox"
                checked={promos.tiered_quantity_enabled}
                onChange={(e) =>
                  updateWebBudget({
                    promotions: { ...promos, tiered_quantity_enabled: e.target.checked }
                  })
                }
                className="w-5 h-5 text-[#0066FF] rounded"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#202020] border border-[#333] flex items-center justify-between">
                <span>2 servicios:</span>
                <span className="font-bold text-emerald-400">5% OFF</span>
              </div>
              <div className="p-3 rounded-xl bg-[#202020] border border-[#333] flex items-center justify-between">
                <span>3 o más servicios:</span>
                <span className="font-bold text-emerald-400">10% OFF</span>
              </div>
            </div>
          </div>

          {/* 2. Cupones de Descuento */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">2. Cupones de Descuento</h4>
                <p className="text-xs text-neutral-400">Códigos promocionales para campañas puntuales de Instagram o WhatsApp.</p>
              </div>
            </div>

            {/* Crear nuevo cupón */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="CÓDIGO (ej. VERANO26)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value)}
                className="bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
              />
              <input
                type="number"
                placeholder="Valor"
                value={newCouponVal}
                onChange={(e) => setNewCouponVal(Number(e.target.value))}
                className="w-24 bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <select
                value={newCouponType}
                onChange={(e) => setNewCouponType(e.target.value as any)}
                className="bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="percent">% Porcentaje</option>
                <option value="fixed">$ Monto Fijo UYU</option>
              </select>
              <button
                type="button"
                onClick={handleAddCoupon}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Crear Cupón
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {(promos.coupons || []).map((cpn: DetailingDiscountCoupon) => (
                <div key={cpn.id} className="p-3 bg-[#202020] rounded-xl border border-[#333] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#3B82F6]">{cpn.code}</span>
                    <span className="text-neutral-400 font-sans">
                      ({cpn.discount_type === 'percent' ? `${cpn.discount_value}% OFF` : `$${cpn.discount_value} UYU`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(cpn.id)}
                    className="text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Base de Comisiones */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <h4 className="font-bold text-sm">3. Regla de Comisiones con Descuentos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-[#202020] border border-[#333] flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comm_base"
                  checked={promos.commission_base === 'final_price'}
                  onChange={() =>
                    updateWebBudget({
                      promotions: { ...promos, commission_base: 'final_price' }
                    })
                  }
                />
                <span>Calcular comisiones sobre el <strong>precio final cobrado</strong></span>
              </label>
              <label className="p-3 rounded-xl bg-[#202020] border border-[#333] flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="comm_base"
                  checked={promos.commission_base === 'list_price'}
                  onChange={() =>
                    updateWebBudget({
                      promotions: { ...promos, commission_base: 'list_price' }
                    })
                  }
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
        <div className="space-y-4 text-white">
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Capacidad del Taller</h4>
                <p className="text-xs text-neutral-400">Define cuántos autos puede recibir DetailVlak por día.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-300">Autos máximos por día:</label>
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
                  className="w-16 bg-[#202020] border border-[#333] rounded-lg px-2.5 py-1.5 text-center font-mono font-bold text-white text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
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
        <div className="space-y-4 text-white">
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-4">
            <h4 className="font-bold text-sm">Textos de la Portada</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Título principal:</label>
                <input
                  type="text"
                  value={content.hero_title || ''}
                  onChange={(e) =>
                    updateWebBudget({
                      content: { ...content, hero_title: e.target.value }
                    })
                  }
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Frase de bajada:</label>
                <textarea
                  rows={2}
                  value={content.hero_subtitle || ''}
                  onChange={(e) =>
                    updateWebBudget({
                      content: { ...content, hero_subtitle: e.target.value }
                    })
                  }
                  className="w-full bg-[#202020] border border-[#333] rounded-xl p-3 text-white"
                />
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes FAQ */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <h4 className="font-bold text-sm">Preguntas Frecuentes (FAQ)</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Pregunta (ej. ¿Qué pasa si llueve?)"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-xs text-white"
              />
              <textarea
                rows={2}
                placeholder="Respuesta detallada..."
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                className="w-full bg-[#202020] border border-[#333] rounded-xl p-3 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Agregar Pregunta
              </button>
            </div>

            <div className="space-y-2 pt-3">
              {(content.faqs || []).map((faq: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#202020] rounded-xl border border-[#333] flex items-start justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-white block">{faq.question}</strong>
                    <p className="text-neutral-400 mt-1">{faq.answer}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteFaq(idx)} className="text-neutral-400 hover:text-red-400">
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
        <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-4 text-white">
          <h4 className="font-bold text-sm">Estilo Visual y Tipografía</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Tipografía:</label>
              <select
                value={webBudget.appearance?.font_family || 'Archivo Narrow'}
                onChange={(e) =>
                  updateWebBudget({
                    appearance: { ...webBudget.appearance, font_family: e.target.value }
                  })
                }
                className="w-full bg-[#202020] border border-[#333] rounded-xl p-2.5 text-white"
              >
                <option value="Archivo Narrow">Archivo Narrow (Moderna y atlética)</option>
                <option value="Inter">Inter (Limpia y corporativa)</option>
                <option value="Barlow Condensed">Barlow Condensed (Impactante automotriz)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">Estilo de tarjetas en catálogo:</label>
              <select
                value={webBudget.appearance?.card_style || 'compact'}
                onChange={(e) =>
                  updateWebBudget({
                    appearance: { ...webBudget.appearance, card_style: e.target.value }
                  })
                }
                className="w-full bg-[#202020] border border-[#333] rounded-xl p-2.5 text-white"
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
        <div className="space-y-4 text-white">
          {/* Links con Atribución */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#3B82F6]" />
              <span>Enlaces con Atribución para Publicidad</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#202020] rounded-xl border border-[#333] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-400">Para Anuncios Meta / Google:</span>
                  <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded font-bold">Comisión 12,5%</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto?origen=anuncio`}
                    className="flex-1 bg-[#121212] border border-[#444] rounded-lg px-2.5 py-1 text-[11px] font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${window.location.origin}/presupuesto?origen=anuncio`, 'Link de anuncios')}
                    className="px-3 py-1 bg-[#0066FF] hover:bg-[#0055DD] text-white rounded-lg font-bold"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-[#202020] rounded-xl border border-[#333] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400">Para Bio de Instagram / WhatsApp:</span>
                  <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-bold">Comisión 30%</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto`}
                    className="flex-1 bg-[#121212] border border-[#444] rounded-lg px-2.5 py-1 text-[11px] font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(`${window.location.origin}/presupuesto`, 'Link directo')}
                    className="px-3 py-1 bg-[#282828] hover:bg-[#333] text-white rounded-lg font-bold border border-[#444]"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Switch de Mantenimiento */}
          <div className="p-5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Pausar Web Pública</h4>
                <p className="text-xs text-neutral-400">Desactiva el armador temporalmente si el taller está con agenda llena.</p>
              </div>
              <input
                type="checkbox"
                checked={webBudget.settings?.is_maintenance_paused || false}
                onChange={(e) =>
                  updateWebBudget({
                    settings: { ...webBudget.settings, is_maintenance_paused: e.target.checked }
                  })
                }
                className="w-5 h-5 text-red-600 rounded"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 max-w-lg w-full text-white space-y-4">
            <h3 className="font-bold text-base">Configurar Paquete / Combo</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Nombre del Paquete:</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  placeholder="Ej: Combo Full Detail"
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Descripción:</label>
                <textarea
                  rows={2}
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  className="w-full bg-[#202020] border border-[#333] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Servicios que incluye:</label>
                <div className="space-y-1 bg-[#202020] p-2.5 rounded-xl border border-[#333] max-h-36 overflow-y-auto">
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
                        />
                        <span>{t.shortName || t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Precio Combo ($ UYU Mediano):</label>
                <input
                  type="number"
                  value={editingPackage.prices?.mediano || 0}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      prices: { ...editingPackage.prices, mediano: Number(e.target.value) }
                    })
                  }
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="px-4 py-2 bg-[#252525] text-xs font-semibold rounded-xl text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSavePackage(editingPackage)}
                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold rounded-xl"
              >
                Guardar Paquete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tamaño */}
      {isSizeModalOpen && editingSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 max-w-md w-full text-white space-y-4">
            <h3 className="font-bold text-base">Editar Categoría de Tamaño</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Nombre:</label>
                <input
                  type="text"
                  value={editingSize.label}
                  onChange={(e) => setEditingSize({ ...editingSize, label: e.target.value })}
                  placeholder="Ej: Chico, Mediano..."
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Subtítulo:</label>
                <input
                  type="text"
                  value={editingSize.sub}
                  onChange={(e) => setEditingSize({ ...editingSize, sub: e.target.value })}
                  placeholder="Ej: Hatch / Compacto"
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Modelos de ejemplo:</label>
                <input
                  type="text"
                  value={editingSize.examples}
                  onChange={(e) => setEditingSize({ ...editingSize, examples: e.target.value })}
                  placeholder="Ej: Gol, Onix, 208, Celerio"
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setIsSizeModalOpen(false)}
                className="px-4 py-2 bg-[#252525] text-xs font-semibold rounded-xl text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveSize(editingSize)}
                className="px-4 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-xl"
              >
                Guardar Tamaño
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Producto */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-5 max-w-md w-full text-white space-y-4">
            <h3 className="font-bold text-base">Producto de Mantenimiento</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Nombre del Producto:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej: Shampoo PH Neutro Koch Chemie"
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Precio ($ UYU):</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">Descripción corta:</label>
                <textarea
                  rows={2}
                  value={editingProduct.short_description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })}
                  placeholder="Para qué sirve y cómo se aplica..."
                  className="w-full bg-[#202020] border border-[#333] rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">URL de la foto:</label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 bg-[#252525] text-xs font-semibold rounded-xl text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct(editingProduct)}
                className="px-4 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-xl"
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

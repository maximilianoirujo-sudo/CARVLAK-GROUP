import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Video,
  Sparkles,
  Star,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Megaphone
} from 'lucide-react';
import { DetailingTariff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DetailingWebServiceModal } from './DetailingWebServiceModal';
import { VideoEmbed, parseVideoUrl } from '../../../components/common/VideoEmbed';

export const DetailingWebServicesSection: React.FC = () => {
  const {
    detailingTariffs,
    updateDetailingTariff,
    deleteDetailingTariff,
    reorderDetailingTariffs
  } = useData();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'paused' | 'with_video' | 'featured'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<DetailingTariff | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    showToast(`${label} copiado al portapapeles`, 'success');
    setTimeout(() => setCopiedLink(null), 3000);
  };

  // Sort tariffs by order or original index
  const sortedTariffs = useMemo(() => {
    return [...detailingTariffs].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });
  }, [detailingTariffs]);

  // Filtered
  const filteredTariffs = useMemo(() => {
    return sortedTariffs.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.shortName && t.shortName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === 'active') return t.isActive !== false;
      if (filterMode === 'paused') return t.isActive === false;
      if (filterMode === 'with_video') return Boolean(t.video_url && t.video_url.trim());
      if (filterMode === 'featured') return Boolean(t.is_featured);

      return true;
    });
  }, [sortedTariffs, searchTerm, filterMode]);

  // Stats
  const totalCount = detailingTariffs.length;
  const activeCount = detailingTariffs.filter((t) => t.isActive !== false).length;
  const pausedCount = detailingTariffs.filter((t) => t.isActive === false).length;
  const videoCount = detailingTariffs.filter((t) => Boolean(t.video_url && t.video_url.trim())).length;
  const featuredCount = detailingTariffs.filter((t) => Boolean(t.is_featured)).length;

  // Toggle active status
  const handleToggleActive = (tariff: DetailingTariff) => {
    const nextState = tariff.isActive === false;
    updateDetailingTariff(tariff.id, { isActive: nextState }, nextState);
    showToast(
      nextState
        ? `Servicio "${tariff.name}" activado en la web`
        : `Servicio "${tariff.name}" pausado`,
      'info'
    );
  };

  // Toggle featured status
  const handleToggleFeatured = (tariff: DetailingTariff) => {
    const nextFeatured = !tariff.is_featured;
    updateDetailingTariff(tariff.id, { is_featured: nextFeatured });
    showToast(
      nextFeatured
        ? `Servicio "${tariff.name}" marcado como destacado`
        : `Se quitó el destacado de "${tariff.name}"`,
      'info'
    );
  };

  // Delete service
  const handleDelete = (tariff: DetailingTariff) => {
    if (window.confirm(`¿Estás seguro de eliminar el servicio "${tariff.name}"? Esta acción no se puede deshacer.`)) {
      deleteDetailingTariff(tariff.id);
      showToast(`Servicio "${tariff.name}" eliminado`, 'success');
    }
  };

  // Move Up / Down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTariffs.length) return;

    const newList = [...sortedTariffs];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    // Reassign order
    const updated = newList.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    reorderDetailingTariffs(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con estadísticas y acciones */}
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center text-[#3B82F6]">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Catálogo de Servicios Web</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0066FF]/20 text-[#3B82F6] border border-[#0066FF]/30">
                Página Pública / Presupuesto
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Configurá los servicios, videos time-lapse y precios que verán tus clientes en el armador de presupuestos online.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <a
              href="/presupuesto"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white border border-[#333] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Armador Web</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0066FF]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* Badges de resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-[#262626]">
          <div
            onClick={() => setFilterMode('all')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'all'
                ? 'bg-[#222] border-[#444] text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total Servicios</span>
            <span className="text-lg font-bold text-white">{totalCount}</span>
          </div>

          <div
            onClick={() => setFilterMode('active')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'active'
                ? 'bg-emerald-950/40 border-emerald-600/50 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-emerald-400 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Activos
            </span>
            <span className="text-lg font-bold text-emerald-300">{activeCount}</span>
          </div>

          <div
            onClick={() => setFilterMode('paused')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'paused'
                ? 'bg-neutral-800 border-neutral-600 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Pausados
            </span>
            <span className="text-lg font-bold text-neutral-300">{pausedCount}</span>
          </div>

          <div
            onClick={() => setFilterMode('with_video')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'with_video'
                ? 'bg-blue-950/40 border-blue-600/50 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-[#3B82F6] block flex items-center gap-1">
              <Video className="w-3 h-3" /> Con Video
            </span>
            <span className="text-lg font-bold text-blue-300">{videoCount}</span>
          </div>

          <div
            onClick={() => setFilterMode('featured')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all col-span-2 sm:col-span-1 ${
              filterMode === 'featured'
                ? 'bg-amber-950/40 border-amber-600/50 text-white'
                : 'bg-[#1A1A1A] border-[#262626] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-amber-400 block flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" /> Destacados
            </span>
            <span className="text-lg font-bold text-amber-300">{featuredCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Generador de Enlaces con Atribución para Anuncios & Redes */}
      <div className="bg-[#161616] border border-[#282828] rounded-2xl p-4 sm:p-5 text-white space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#3B82F6]" />
            <span className="font-bold text-sm">Generador de Links para Anuncios (Atribución Automática)</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            Define la comisión: <strong>12,5% si es anuncio</strong> y <strong>30% si es directo</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Link para Anuncios */}
          <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#303030] flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-purple-400 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Para Anuncios Pagos (Meta / Google / TikTok)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Comisión 12,5%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Usá este enlace en tus campañas de Meta Ads o Google. Las solicitudes se etiquetan automáticamente como anuncio pago.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto?origen=anuncio`}
                className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-neutral-300 select-all"
              />
              <button
                type="button"
                onClick={() =>
                  handleCopyLink(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto?origen=anuncio`,
                    'Link para anuncios'
                  )
                }
                className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                {copiedLink?.includes('origen=anuncio') ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar link para anuncios</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Link Directo / Orgánico */}
          <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#303030] flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Para Bio de Instagram / Estados / WhatsApp</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Comisión 30%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Para compartir en tu perfil o enviar a clientes referidos de forma directa sin costo de publicidad.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto`}
                className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-neutral-300 select-all"
              />
              <button
                type="button"
                onClick={() =>
                  handleCopyLink(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto`,
                    'Link web directo'
                  )
                }
                className="px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-[#383838]"
              >
                {copiedLink === `${typeof window !== 'undefined' ? window.location.origin : ''}/presupuesto` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar link directo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por servicio, pasos, productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#161616] border border-neutral-300 dark:border-[#2D2D2D] rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-[#0066FF]"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#161616] text-white dark:bg-white dark:text-black font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('paused')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'paused'
                ? 'bg-neutral-700 text-white font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Pausados
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('with_video')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'with_video'
                ? 'bg-[#0066FF] text-white font-bold'
                : 'bg-neutral-200 dark:bg-[#202020] text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Videos
          </button>
        </div>
      </div>

      {/* 3. Lista de Tarjetas de Servicios */}
      {filteredTariffs.length === 0 ? (
        <div className="bg-white dark:bg-[#161616] border border-neutral-200 dark:border-[#2D2D2D] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#222] text-neutral-400 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">
            No se encontraron servicios
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Probá modificando los términos de búsqueda o limpiando los filtros.'
              : 'Creá tu primer servicio web para que aparezca en el armador de presupuestos.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedService(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Servicio</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTariffs.map((tariff, index) => {
            const hasVideo = Boolean(tariff.video_url && tariff.video_url.trim());
            const videoParsed = hasVideo ? parseVideoUrl(tariff.video_url) : null;
            const isPaused = tariff.isActive === false;

            return (
              <div
                key={tariff.id}
                className={`bg-white dark:bg-[#161616] border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                  isPaused
                    ? 'border-neutral-300 dark:border-[#2A2A2A] opacity-75'
                    : tariff.is_featured
                    ? 'border-amber-400/50 dark:border-amber-500/40 shadow-amber-500/5'
                    : 'border-neutral-200 dark:border-[#262626] hover:border-neutral-400 dark:hover:border-[#3A3A3A]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Columna Izquierda: Reorder + Info Principal */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Botones de Reordenar */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        title="Subir posición"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className="p-1 rounded-md bg-neutral-100 dark:bg-[#222] hover:bg-neutral-200 dark:hover:bg-[#333] text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-neutral-400">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        title="Bajar posición"
                        disabled={index === filteredTariffs.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className="p-1 rounded-md bg-neutral-100 dark:bg-[#222] hover:bg-neutral-200 dark:hover:bg-[#333] text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Portada o Video Thumbnail */}
                    {hasVideo ? (
                      <button
                        type="button"
                        onClick={() => setPreviewVideoUrl(tariff.video_url || null)}
                        className="relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-black border border-neutral-700 overflow-hidden shrink-0 group cursor-pointer flex items-center justify-center"
                        title="Ver video"
                      >
                        {tariff.cover_image_url ? (
                          <img
                            src={tariff.cover_image_url}
                            alt={tariff.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
                            <Video className="w-6 h-6 text-neutral-500 group-hover:text-white transition-colors" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-md">
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          </div>
                        </div>
                      </button>
                    ) : tariff.cover_image_url ? (
                      <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden shrink-0">
                        <img
                          src={tariff.cover_image_url}
                          alt={tariff.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}

                    {/* Textos y Badges */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base leading-tight">
                          {tariff.name}
                        </h3>

                        {/* Badges */}
                        {tariff.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                            <Star className="w-3 h-3 fill-amber-500" /> Destacado
                          </span>
                        )}

                        {isPaused ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            <EyeOff className="w-3 h-3" /> Pausado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2D2D2D]">
                          <Clock className="w-3 h-3" /> {tariff.durationHours || 3}h
                        </span>

                        {hasVideo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#0066FF] bg-blue-50 dark:bg-[#0066FF]/10 border border-blue-200 dark:border-[#0066FF]/30">
                            <Video className="w-3 h-3" />
                            <span>{videoParsed?.type === 'instagram' ? 'Reel IG' : 'YouTube'}</span>
                          </span>
                        )}
                      </div>

                      {tariff.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          {tariff.description}
                        </p>
                      )}

                      {/* Resumen de Pasos y Productos */}
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap pt-0.5">
                        {tariff.included_steps && tariff.included_steps.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                            <span>{tariff.included_steps.length} pasos incluidos</span>
                          </span>
                        )}

                        {tariff.products_used && tariff.products_used.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{tariff.products_used.length} productos / insumos</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha: Precios + Botones de Acción */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-200 dark:border-[#242424]">
                    {/* Precios por Categoría */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:justify-end text-[11px]">
                      <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 font-mono">
                        <strong className="text-neutral-400 font-normal">Ch:</strong> ${tariff.prices?.chico?.toLocaleString() || 0}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 font-mono">
                        <strong className="text-neutral-400 font-normal">Med:</strong> ${tariff.prices?.mediano?.toLocaleString() || 0}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 font-mono">
                        <strong className="text-neutral-400 font-normal">SUV:</strong> ${tariff.prices?.suv?.toLocaleString() || 0}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 font-mono">
                        <strong className="text-neutral-400 font-normal">Pick:</strong> ${tariff.prices?.pickup?.toLocaleString() || 0}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-[#202020] border border-neutral-200 dark:border-[#2A2A2A] text-neutral-700 dark:text-neutral-300 font-mono">
                        <strong className="text-neutral-400 font-normal">Moto:</strong> ${tariff.prices?.moto?.toLocaleString() || 0}
                      </span>
                    </div>

                    {/* Botonera de acciones rápidas */}
                    <div className="flex items-center gap-1.5 self-end">
                      {/* Toggle Activo / Pausado */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(tariff)}
                        title={isPaused ? 'Activar en la web' : 'Pausar servicio'}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isPaused
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-neutral-100 dark:bg-[#202020] text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        {isPaused ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isPaused ? 'Activar' : 'Pausar'}</span>
                      </button>

                      {/* Toggle Destacado */}
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(tariff)}
                        title={tariff.is_featured ? 'Quitar destacado' : 'Marcar como destacado'}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          tariff.is_featured
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                            : 'bg-neutral-100 dark:bg-[#202020] text-neutral-500 hover:text-amber-500'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${tariff.is_featured ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedService(tariff);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#202020] hover:bg-neutral-200 dark:hover:bg-[#2D2D2D] text-neutral-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Editar</span>
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDelete(tariff)}
                        title="Eliminar servicio"
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-[#202020] hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear / Editar Servicio */}
      <DetailingWebServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      {/* Modal de Vista Previa de Video */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#161616] border border-[#2D2D2D] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-[#2D2D2D]">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#3B82F6]" />
                <span className="font-bold text-sm">Vista Previa de Video Time-Lapse</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="text-neutral-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-neutral-800"
              >
                Cerrar
              </button>
            </div>
            <div className="py-2">
              <VideoEmbed url={previewVideoUrl} autoPlay />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

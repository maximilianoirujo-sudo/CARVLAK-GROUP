import React, { useState, useMemo, useEffect } from 'react';
import {
  Palette,
  Layers,
  Sparkles,
  RotateCcw,
  Copy,
  Trash2,
  Check,
  Plus,
  ArrowLeft,
  Sliders,
  Type,
  Eye,
  Shield,
  Send,
  DollarSign,
  Car,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Save,
  Undo,
  MapPin,
  Hash
} from 'lucide-react';
import {
  SocialMediaCategory,
  SocialMediaFormat,
  SocialMediaTemplateConfig,
  FormatLayoutConfig,
  LogoPosition,
  DealershipVehicle,
  CanvasTextElement
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { SocialCanvasPreview } from './SocialCanvasPreview';
import { formatCurrency } from '../../../lib/formatters';
import { getDefaultTextElements, isLikelyFlyerImage } from '../services/socialCanvasEngine';

export const SocialTemplateEditor: React.FC = () => {
  const {
    socialMediaConfig,
    saveSocialTemplate,
    duplicateSocialTemplate,
    deleteSocialTemplate,
    toggleSocialTemplateActive,
    resetSocialTemplateToDefault,
    dealershipVehicles
  } = useData();

  const { showToast } = useToast();

  // Estados de vista
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'todas' | SocialMediaCategory>('todas');

  // Estados del editor activo
  const [activeFormat, setActiveFormat] = useState<SocialMediaFormat>('story');
  const [editorTemplate, setEditorTemplate] = useState<SocialMediaTemplateConfig | null>(null);
  const [selectedSampleCarId, setSelectedSampleCarId] = useState<string>('');

  // Elementos de lienzo interactivos unificados (CanvasTextElements)
  const [textElements, setTextElements] = useState<CanvasTextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasTextElement[][]>([]);

  // Estados de campos visuales principales
  const [badgeTag, setBadgeTag] = useState('');
  const [stampText, setStampText] = useState('');
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [templateLocation, setTemplateLocation] = useState('');
  const [templateHashtags, setTemplateHashtags] = useState('');
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-left');

  // Controles de foto / matrícula
  const [coverPlate, setCoverPlate] = useState(false);
  const [platePosition, setPlatePosition] = useState({ x: 540, y: 1100, scale: 1 });
  const [imagePan, setImagePan] = useState({ x: 0, y: 0, zoom: 1 });

  // Auto de muestra seleccionado para preview
  const sampleCar: DealershipVehicle = useMemo(() => {
    return (
      dealershipVehicles.find((v) => v.id === selectedSampleCarId) ||
      dealershipVehicles[0]
    );
  }, [dealershipVehicles, selectedSampleCarId]);

  // Foto limpia del auto de muestra
  const sampleCarPhoto = useMemo(() => {
    if (!sampleCar || !sampleCar.images || sampleCar.images.length === 0) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
    }
    const clean = sampleCar.images.find(
      (img) => !sampleCar.flyer_images?.includes(img) && !isLikelyFlyerImage(img)
    );
    return clean || sampleCar.images[0];
  }, [sampleCar]);

  // Lista de plantillas ordenada
  const templatesList = useMemo(() => {
    const list = Object.values(socialMediaConfig.templates);
    if (filterCategory === 'todas') return list;
    return list.filter((t) => t.category === filterCategory);
  }, [socialMediaConfig.templates, filterCategory]);

  // Iniciar edición de una plantilla
  const handleStartEdit = (template: SocialMediaTemplateConfig) => {
    setEditorTemplate({ ...template });
    setEditingTemplateId(template.id);
    setBadgeTag(template.badge_tag || 'STOCK CARVLAK');
    setStampText(template.stamp_text || 'OPORTUNIDAD');
    setSubtitle(template.subtitle_default || '¡Gracias por confiar en nosotros!');
    setTemplateLocation(template.location_name || '');
    setTemplateHashtags(template.default_hashtags || '');
    setLogoPosition(template.logo_position || 'top-left');
    setHistory([]);

    const car = sampleCar || dealershipVehicles[0];
    const carTitle = car ? `${car.brand} ${car.model}`.trim() : 'Vehículo Oficial';
    setHeadline(carTitle);

    const priceFormatted = car && car.sale_price
      ? formatCurrency(car.sale_price, car.sale_currency || 'USD')
      : '';
    setPrice(priceFormatted);

    // Calcular descuento real de historial si es auto-descuento
    let origFormatted = '';
    if (template.id === 'auto-descuento' && car?.sale_price) {
      const priceHistory = (car.history || [])
        .filter((h) => h.field === 'sale_price' && Number(h.old_value) > car.sale_price)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (priceHistory.length > 0) {
        origFormatted = formatCurrency(Number(priceHistory[0].old_value), car.sale_currency || 'USD');
      }
    }
    setOriginalPrice(origFormatted);

    // Cargar layout correspondiente al formato actual
    const currentLayout = activeFormat === 'story' ? template.layout_story : template.layout_post;
    if (currentLayout?.textElements && currentLayout.textElements.length > 0) {
      setTextElements(currentLayout.textElements);
    } else {
      const defs = getDefaultTextElements(template.id, activeFormat, {
        carTitle,
        version: car?.version,
        price: priceFormatted,
        originalPrice: origFormatted,
        stampText: template.stamp_text,
        badgeTag: template.badge_tag,
        subtitle: template.subtitle_default,
        cta: 'Consultá por WhatsApp',
        instagramHandle: socialMediaConfig.instagram_handle,
        locationName: template.location_name || socialMediaConfig.location_name,
        hashtag: template.default_hashtags || socialMediaConfig.default_hashtag
      });
      setTextElements(defs);
    }

    if (dealershipVehicles.length > 0 && !selectedSampleCarId) {
      setSelectedSampleCarId(dealershipVehicles[0].id);
    }
  };

  // Recargar elementos cuando cambia el formato (Story vs Post) dentro del editor
  const handleFormatSwitch = (newFormat: SocialMediaFormat) => {
    setActiveFormat(newFormat);
    if (!editorTemplate) return;

    const targetLayout = newFormat === 'story' ? editorTemplate.layout_story : editorTemplate.layout_post;
    if (targetLayout?.textElements && targetLayout.textElements.length > 0) {
      setTextElements(targetLayout.textElements);
    } else {
      const carTitle = sampleCar ? `${sampleCar.brand} ${sampleCar.model}`.trim() : 'Vehículo';
      const defs = getDefaultTextElements(editorTemplate.id, newFormat, {
        carTitle,
        version: sampleCar?.version,
        price,
        originalPrice,
        stampText,
        badgeTag,
        subtitle,
        cta: 'Consultá por WhatsApp',
        instagramHandle: socialMediaConfig.instagram_handle,
        locationName: templateLocation || socialMediaConfig.location_name,
        hashtag: templateHashtags || socialMediaConfig.default_hashtag
      });
      setTextElements(defs);
    }
  };

  // Crear nueva plantilla personalizada desde cero
  const handleCreateNewTemplate = () => {
    const newId = `plantilla-custom-${crypto.randomUUID()}`;
    const defaultStoryElements = getDefaultTextElements(newId, 'story', {
      carTitle: 'Nuevo Vehículo',
      stampText: 'DESTACADO',
      badgeTag: 'STOCK CARVLAK'
    });
    const defaultPostElements = getDefaultTextElements(newId, 'post', {
      carTitle: 'Nuevo Vehículo',
      stampText: 'DESTACADO',
      badgeTag: 'STOCK CARVLAK'
    });

    const newTemplate: SocialMediaTemplateConfig = {
      id: newId,
      title: 'Nueva plantilla personalizada',
      category: 'automotora',
      description: 'Plantilla personalizada con diseño a medida para el equipo.',
      is_active: true,
      is_custom: true,
      badge_tag: 'STOCK CARVLAK',
      stamp_text: 'DESTACADO',
      logo_position: 'top-left',
      default_caption_template: '¡Descubrí esta nueva oportunidad en CARVLAK!\n\n📲 Consultas por MD o WhatsApp al {phone}.\n📍 {location}',
      default_hashtags: '#Carvlak #AutosUruguay #Oportunidad',
      layout_story: {
        backgroundMode: 'full_photo',
        vignetteOpacity: 0.85,
        logoVersion: 'blanco',
        logoPosition: 'top-left',
        coverPlateDefault: false,
        showStamp: true,
        fontFamily: 'Archivo Narrow',
        showPrice: true,
        showOriginalPrice: false,
        specsSelection: [],
        specsOrder: [],
        textElements: defaultStoryElements
      },
      layout_post: {
        backgroundMode: 'full_photo',
        vignetteOpacity: 0.80,
        logoVersion: 'blanco',
        logoPosition: 'top-left',
        coverPlateDefault: false,
        showStamp: true,
        fontFamily: 'Archivo Narrow',
        showPrice: true,
        showOriginalPrice: false,
        specsSelection: [],
        specsOrder: [],
        textElements: defaultPostElements
      }
    };

    setEditorTemplate(newTemplate);
    setEditingTemplateId(newId);
    setTextElements(defaultStoryElements);
    setActiveFormat('story');
    showToast('Nueva plantilla creada. Podés personalizar su diseño.', 'info');
  };

  // Guardar plantilla editada
  const handleSaveTemplate = () => {
    if (!editorTemplate) return;

    const currentLayout: FormatLayoutConfig = {
      backgroundMode: 'full_photo',
      vignetteOpacity: 0.85,
      logoVersion: 'blanco',
      logoPosition,
      coverPlateDefault: coverPlate,
      showStamp: true,
      fontFamily: 'Archivo Narrow',
      showPrice: true,
      showOriginalPrice: false,
      specsSelection: [],
      specsOrder: [],
      textElements
    };

    const updatedTemplate: SocialMediaTemplateConfig = {
      ...editorTemplate,
      badge_tag: badgeTag,
      stamp_text: stampText,
      subtitle_default: subtitle,
      location_name: templateLocation.trim(),
      default_hashtags: templateHashtags.trim(),
      logo_position: logoPosition,
      layout_story: activeFormat === 'story' ? currentLayout : (editorTemplate.layout_story || currentLayout),
      layout_post: activeFormat === 'post' ? currentLayout : (editorTemplate.layout_post || currentLayout)
    };

    saveSocialTemplate(updatedTemplate);
    setEditorTemplate(updatedTemplate);
    showToast(`Plantilla "${updatedTemplate.title}" guardada correctamente`, 'success');
  };

  // Guardar y volver a la galería
  const handleSaveAndClose = () => {
    handleSaveTemplate();
    setEditingTemplateId(null);
  };

  // Deshacer cambio de elementos
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setTextElements(last);
    showToast('Acción deshecha', 'info');
  };

  // Copiar diseño de Story a Post o viceversa
  const handleCopyLayoutAcrossFormats = () => {
    if (!editorTemplate) return;
    const targetFormat = activeFormat === 'story' ? 'post' : 'story';
    const adaptedElements = getDefaultTextElements(editorTemplate.id, targetFormat, {
      carTitle: headline,
      version: sampleCar?.version,
      price,
      originalPrice,
      stampText,
      badgeTag,
      subtitle,
      cta: 'Consultá por WhatsApp',
      instagramHandle: socialMediaConfig.instagram_handle,
      locationName: templateLocation || socialMediaConfig.location_name,
      hashtag: templateHashtags || socialMediaConfig.default_hashtag
    }).map((defEl) => {
      const match = textElements.find((t) => t.id === defEl.id);
      if (!match) return defEl;
      return {
        ...defEl,
        color: match.color,
        fontWeight: match.fontWeight,
        fontFamily: match.fontFamily,
        align: match.align,
        bgType: match.bgType,
        bgColor: match.bgColor,
        bgOpacity: match.bgOpacity,
        visible: match.visible
      };
    });

    setHistory((h) => [...h.slice(-19), textElements]);
    setEditorTemplate((prev) => {
      if (!prev) return prev;
      const targetKey = targetFormat === 'story' ? 'layout_story' : 'layout_post';
      return {
        ...prev,
        [targetKey]: {
          backgroundMode: 'full_photo',
          vignetteOpacity: 0.85,
          logoVersion: 'blanco',
          logoPosition,
          coverPlateDefault: coverPlate,
          showStamp: true,
          fontFamily: 'Archivo Narrow',
          showPrice: true,
          showOriginalPrice: false,
          textElements: adaptedElements
        }
      };
    });

    showToast(`Estilos copiados a formato ${targetFormat === 'story' ? 'Historia (9:16)' : 'Feed (4:5)'}`, 'success');
  };

  // Modales de confirmación
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; title: string } | null>(null);
  const [templateToReset, setTemplateToReset] = useState<string | null>(null);

  // Duplicar plantilla
  const handleDuplicate = (templateId: string) => {
    const dup = duplicateSocialTemplate(templateId);
    if (dup) {
      showToast(`Plantilla duplicada como "${dup.title}"`, 'success');
    }
  };

  // Eliminar plantilla personalizada
  const handleDelete = (templateId: string, title: string) => {
    setTemplateToDelete({ id: templateId, title });
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteSocialTemplate(templateToDelete.id);
      showToast('Plantilla eliminada', 'info');
      setTemplateToDelete(null);
    }
  };

  // Restaurar plantilla predeterminada a valores oficiales
  const handleResetToDefault = (templateId: string) => {
    setTemplateToReset(templateId);
  };

  const confirmResetToDefault = () => {
    if (templateToReset) {
      resetSocialTemplateToDefault(templateToReset);
      const defs = getDefaultTextElements(templateToReset, activeFormat, {
        carTitle: headline,
        version: sampleCar?.version,
        price,
        originalPrice,
        locationName: socialMediaConfig.location_name,
        hashtag: socialMediaConfig.default_hashtag
      });
      setHistory((h) => [...h.slice(-19), textElements]);
      setTextElements(defs);
      showToast('Diseño original restaurado', 'info');
      setTemplateToReset(null);
    }
  };

  // Sincronizar inputs de texto manuales con los CanvasTextElements correspondientes
  const handleHeadlineChange = (val: string) => {
    setHeadline(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'modelo' ? { ...el, text: val } : el))
    );
  };

  const handleSubtitleChange = (val: string) => {
    setSubtitle(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'subtitulo' ? { ...el, text: val } : el))
    );
  };

  const handlePriceChange = (val: string) => {
    setPrice(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'precio' ? { ...el, text: val } : el))
    );
  };

  const handleOriginalPriceChange = (val: string) => {
    setOriginalPrice(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'precio_anterior' ? { ...el, text: val } : el))
    );
  };

  const handleStampTextChange = (val: string) => {
    setStampText(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'sello' ? { ...el, text: val } : el))
    );
  };

  const handleBadgeTagChange = (val: string) => {
    setBadgeTag(val);
    setTextElements((prev) =>
      prev.map((el) => (el.id === 'etiqueta' ? { ...el, text: val } : el))
    );
  };

  const handleToggleElementVisibility = (elementId: string) => {
    setHistory((h) => [...h.slice(-19), textElements]);
    setTextElements((prev) => {
      const exists = prev.some((el) => el.id === elementId);
      if (exists) {
        return prev.map((el) => (el.id === elementId ? { ...el, visible: !el.visible } : el));
      }
      if (!editorTemplate) return prev;
      const defs = getDefaultTextElements(editorTemplate.id, activeFormat, {
        carTitle: headline,
        version: sampleCar?.version,
        price,
        originalPrice,
        stampText,
        badgeTag,
        subtitle,
        cta: 'Consultá por WhatsApp',
        instagramHandle: socialMediaConfig.instagram_handle,
        locationName: templateLocation || socialMediaConfig.location_name,
        hashtag: templateHashtags || socialMediaConfig.default_hashtag
      });
      const def = defs.find((d) => d.id === elementId);
      if (def) {
        return [...prev, { ...def, visible: true }];
      }
      return prev;
    });
    setSelectedElementId(elementId);
  };

  // Keyboard shortcut Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  // VISTA 1: GALERÍA DE PLANTILLAS
  if (!editingTemplateId || !editorTemplate) {
    return (
      <div className="space-y-6">
        {/* Encabezado y Barra de Filtros */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#161616] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#D7141A]" />
                Diseñador de plantillas oficiales
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Personalizá los elementos visuales, sellos, ubicación y textos base de cada plantilla.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleCreateNewTemplate}
              className="text-xs font-bold uppercase tracking-wider h-10 px-4 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Nueva plantilla</span>
            </Button>
          </div>

          {/* Filtros por Categoría */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E5E5E3]">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase mr-2">Filtrar:</span>
            {(['todas', 'automotora', 'detailing', 'inspeccion'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-[#161616] text-white'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#EBEBEA]'
                }`}
              >
                {cat === 'todas' ? 'Todas las plantillas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Plantillas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesList.map((template) => {
            const isActive = template.is_active !== false;
            const isCustom = template.is_custom === true;

            return (
              <div
                key={template.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm ${
                  isActive ? 'border-[#E5E5E3] hover:border-[#D0D0CD]' : 'border-[#E5E5E3] opacity-60 bg-[#FAFAFA]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D7141A]" />
                        <h3 className="font-title font-bold text-sm text-[#161616] leading-tight">
                          {template.title}
                        </h3>
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                        {template.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCustom ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDF2F2] text-[#D7141A] border border-[#FACDCD]">
                          Personalizada
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F5F4] text-[#6B6B6B]">
                          Oficial
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Badges de características */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                    {template.stamp_text && (
                      <span className="px-2 py-0.5 rounded bg-[#161616] text-white font-bold">
                        Sello: {template.stamp_text}
                      </span>
                    )}
                    {template.location_name && (
                      <span className="px-2 py-0.5 rounded bg-[#F5F5F4] text-[#161616] font-semibold border border-[#E5E5E3] inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D7141A]" />
                        <span>{template.location_name}</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      9:16 + 4:5
                    </span>
                  </div>
                </div>

                {/* Acciones de la plantilla */}
                <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(template)}
                      className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(template.id)}
                      title="Duplicar plantilla"
                      aria-label="Duplicar plantilla"
                      className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id, template.title)}
                        title="Eliminar plantilla"
                        aria-label="Eliminar plantilla"
                        className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#D7141A] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSocialTemplateActive(template.id)}
                    className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      isActive ? 'text-[#1E6B43]' : 'text-[#9A9A9A]'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                        <span>Activa</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-[#9A9A9A]" />
                        <span>Pausada</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Confirmar Eliminación de Plantilla */}
        <ConfirmModal
          isOpen={!!templateToDelete}
          onClose={() => setTemplateToDelete(null)}
          onConfirm={confirmDelete}
          title="¿Eliminar plantilla?"
          message={`¿Estás seguro de que deseas eliminar la plantilla "${templateToDelete?.title || ''}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    );
  }

  // VISTA 2: EDITOR UNIFICADO (Idéntico al panel del Estudio creativo)
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Barra Superior de Herramientas y Navegación */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditingTemplateId(null)}
            className="p-2 rounded-xl border border-[#E5E5E3] hover:border-[#161616] text-[#6B6B6B] hover:text-[#161616] bg-white transition-colors cursor-pointer"
            title="Volver a la galería de plantillas"
            aria-label="Volver a la galería de plantillas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-title font-bold text-[#161616]">
                {editorTemplate.title}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                {editorTemplate.category}
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B]">
              Los cambios guardados aquí se aplicarán a todas las piezas futuras que usen esta plantilla.
            </p>
          </div>
        </div>

        {/* Formato Switcher & Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Formato activo: Story (9:16) vs Post (4:5) */}
          <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => handleFormatSwitch('story')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormat === 'story'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Historia 9:16
            </button>
            <button
              type="button"
              onClick={() => handleFormatSwitch('post')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFormat === 'post'
                  ? 'bg-white text-[#161616] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Feed 4:5
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLayoutAcrossFormats}
            title="Copiar ajustes de este formato al otro"
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E3] text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar al otro formato</span>
          </button>

          {!editorTemplate.is_custom && (
            <button
              type="button"
              onClick={() => handleResetToDefault(editorTemplate.id)}
              className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E3] text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar original</span>
            </button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={handleSaveAndClose}
            className="text-xs font-bold uppercase tracking-wider h-10 px-5 shadow-sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>Guardar plantilla</span>
          </Button>
        </div>
      </div>

      {/* Editor a Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CONTROLES DE LA PLANTILLA (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Información General y Metadatos */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-3.5">
            <h3 className="font-title font-bold text-sm text-[#161616] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#D7141A]" />
              <span>1. Configuración de la plantilla</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={editorTemplate.title}
                  onChange={(e) => setEditorTemplate({ ...editorTemplate, title: e.target.value })}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Categoría
                </label>
                <select
                  value={editorTemplate.category}
                  onChange={(e) => setEditorTemplate({ ...editorTemplate, category: e.target.value as SocialMediaCategory })}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
                >
                  <option value="automotora">Automotora</option>
                  <option value="detailing">Detailing</option>
                  <option value="inspeccion">Inspección</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={editorTemplate.description}
                  onChange={(e) => setEditorTemplate({ ...editorTemplate, description: e.target.value })}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Ubicación por plantilla (opcional)</span>
                </label>
                <input
                  type="text"
                  value={templateLocation}
                  onChange={(e) => {
                    setTemplateLocation(e.target.value);
                    setTextElements((prev) =>
                      prev.map((el) => (el.id === 'pie_ubicacion' ? { ...el, text: e.target.value || socialMediaConfig.location_name } : el))
                    );
                  }}
                  placeholder={socialMediaConfig.location_name || 'Ciudad de la Costa, Canelones'}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                  Sobrescribe la ubicación general en esta plantilla.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-[#D7141A]" />
                  <span>Hashtags por plantilla (opcional)</span>
                </label>
                <input
                  type="text"
                  value={templateHashtags}
                  onChange={(e) => {
                    setTemplateHashtags(e.target.value);
                    setTextElements((prev) =>
                      prev.map((el) => (el.id === 'pie_hashtag' ? { ...el, text: e.target.value || socialMediaConfig.default_hashtag || '#TuPróximoAuto' } : el))
                    );
                  }}
                  placeholder={socialMediaConfig.default_hashtag || '#TuPróximoAuto'}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                  Sobrescribe los hashtags generales en esta plantilla.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Panel de Elementos Visuales (Idéntico a Estudio) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] tracking-wide flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>2. Personalizar elementos visuales</span>
              </label>
              <span className="text-[11px] text-[#6B6B6B]">
                Hacé clic en cualquier texto en la vista previa para editar su formato o moverlo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  1. Etiqueta superior (roja)
                </label>
                <input
                  type="text"
                  value={badgeTag}
                  onChange={(e) => handleBadgeTagChange(e.target.value)}
                  placeholder="Ej: ENTREGA CONFIRMADA, DESTACADO DE LA SEMANA"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#D7141A] uppercase font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  2. Título principal (sello)
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => handleStampTextChange(e.target.value)}
                  placeholder="Ej: VENDIDO, OPORTUNIDAD, NUEVO INGRESO"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] uppercase font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  3. Modelo del vehículo (muestra)
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => handleHeadlineChange(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  4. Precio visible (muestra)
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="Ej: USD 18.900"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#D7141A] font-title font-bold text-sm focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              {editorTemplate.id === 'auto-descuento' && (
                <div>
                  <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                    Precio anterior tachado (muestra)
                  </label>
                  <input
                    type="text"
                    value={originalPrice}
                    onChange={(e) => handleOriginalPriceChange(e.target.value)}
                    placeholder="Ej: USD 21.000"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#6B6B6B] line-through focus:bg-white focus:border-[#161616] focus:outline-none"
                  />
                </div>
              )}

              <div className={editorTemplate.id === 'auto-descuento' ? '' : 'sm:col-span-2'}>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  5. Mensaje institucional predeterminado
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => handleSubtitleChange(e.target.value)}
                  placeholder="Ej: ¡Gracias por confiar en nosotros! Entregado con garantía total CARVLAK."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Posición del logo CARVLAK
                </label>
                <select
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
                >
                  <option value="top-left">Superior izquierda</option>
                  <option value="top-center">Superior centro</option>
                  <option value="top-right">Superior derecha</option>
                  <option value="bottom-left">Inferior izquierda</option>
                  <option value="bottom-right">Inferior derecha</option>
                </select>
              </div>

              {/* Selector de auto real para previsualización */}
              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Auto del catálogo para previsualizar
                </label>
                <select
                  value={selectedSampleCarId}
                  onChange={(e) => {
                    setSelectedSampleCarId(e.target.value);
                    const car = dealershipVehicles.find((v) => v.id === e.target.value);
                    if (car) {
                      const t = `${car.brand} ${car.model}`.trim();
                      setHeadline(t);
                      const p = car.sale_price ? formatCurrency(car.sale_price, car.sale_currency || 'USD') : '';
                      setPrice(p);
                      setTextElements((prev) =>
                        prev.map((el) => {
                          if (el.id === 'modelo') return { ...el, text: t.toUpperCase() };
                          if (el.id === 'precio') return { ...el, text: p };
                          if (el.id === 'version') return { ...el, text: (car.version || '').toUpperCase() };
                          return el;
                        })
                      );
                    }
                  }}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
                >
                  {dealershipVehicles.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.year}) - {formatCurrency(car.sale_price, car.sale_currency || 'USD')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Interruptores de Elementos de Marca y Ficha Técnica */}
            <div className="pt-3 border-t border-[#E5E5E3] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#161616] uppercase tracking-wide">
                  Elementos adicionales de la plantilla
                </span>
                <span className="text-[10px] text-[#6B6B6B]">
                  Configurá qué elementos aparecen visibles por defecto al abrir esta plantilla:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'subtitulo', label: 'Mensaje', desc: subtitle || 'Mensaje' },
                  { id: 'version', label: 'Versión', desc: sampleCar?.version || 'Versión' },
                  { id: 'specs_km', label: 'Kilometraje', desc: `${sampleCar?.mileage ? sampleCar.mileage.toLocaleString('es-UY') : '0'} km` },
                  { id: 'specs_combustible', label: 'Combustible', desc: sampleCar?.fuel || 'Nafta' },
                  { id: 'specs_transmision', label: 'Transmisión', desc: sampleCar?.transmission || 'Manual' },
                  { id: 'specs_anio', label: 'Año', desc: `Año ${sampleCar?.year || ''}` },
                  { id: 'cta', label: 'Llamado a la acción', desc: 'Consultá por WhatsApp' },
                  { id: 'logo', label: 'Logo CARVLAK', desc: 'Logo oficial superior' },
                  { id: 'etiqueta_instagram', label: 'Instagram (@car.vlak)', desc: '@car.vlak superior derecha' },
                  { id: 'pie_marca', label: 'Pie de marca', desc: 'CARVLAK Group • @car.vlak inferior' }
                ].map((item) => {
                  const el = textElements.find((t) => t.id === item.id);
                  const isVisible = el?.visible || false;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isVisible
                          ? 'bg-[#EEF7F2] border-[#CDE9D9] text-[#1E6B43]'
                          : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:bg-white'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-bold text-[11px]">{item.label}</div>
                        <div className="text-[10px] opacity-75 truncate">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleToggleElementVisibility(item.id)}
                        className="w-4 h-4 rounded-xs accent-[#D7141A] cursor-pointer shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Botón de Deshacer */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  history.length > 0
                    ? 'bg-white border-[#E5E5E3] hover:border-[#161616] text-[#161616] cursor-pointer shadow-xs'
                    : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#9A9A9A] opacity-60 cursor-not-allowed'
                }`}
                title="Deshacer último cambio (Ctrl+Z)"
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Deshacer {history.length > 0 ? `(${history.length})` : ''}</span>
              </button>

              <span className="text-[11px] text-[#6B6B6B]">
                Diseño 100% vectorizado para exportación HD a 1080px
              </span>
            </div>
          </div>

          {/* 3. Plantilla de Copy para Instagram */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E3] shadow-sm space-y-2">
            <label className="text-xs font-bold text-[#161616] tracking-wide flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>3. Plantilla predeterminada de copy para Instagram</span>
            </label>
            <textarea
              rows={4}
              value={editorTemplate.default_caption_template}
              onChange={(e) => setEditorTemplate({ ...editorTemplate, default_caption_template: e.target.value })}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] leading-relaxed focus:bg-white focus:border-[#161616] focus:outline-none font-sans"
            />
            <p className="text-[11px] text-[#6B6B6B]">
              Variables disponibles: {'{marca}'}, {'{modelo}'}, {'{anio}'}, {'{precio}'}, {'{km}'}, {'{combustible}'}, {'{phone}'}, {'{location}'}
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA INTERACTIVA CON SOCIALCANVASPREVIEW (5 COLS) */}
        <div className="lg:col-span-5 sticky top-6">
          <SocialCanvasPreview
            format={activeFormat}
            onFormatChange={handleFormatSwitch}
            templateId={editorTemplate.id}
            imageUrl={sampleCarPhoto}
            headline={headline}
            subtitle={subtitle}
            price={price}
            originalPrice={originalPrice}
            stampText={stampText}
            coverPlate={coverPlate}
            onCoverPlateChange={setCoverPlate}
            platePosition={platePosition}
            onPlatePositionChange={setPlatePosition}
            imagePan={imagePan}
            onImagePanChange={setImagePan}
            logoPosition={logoPosition}
            instagramHandle={socialMediaConfig.instagram_handle}
            locationName={templateLocation || socialMediaConfig.location_name}
            hashtag={templateHashtags || socialMediaConfig.default_hashtag || '#TuPróximoAuto'}
            badgeTag={badgeTag}
            onSaveToHistory={() => {}}
            suggestedFileName={`template-${editorTemplate.id}`}
            textElements={textElements}
            onTextElementsChange={(newElements) => {
              setHistory((h) => [...h.slice(-19), textElements]);
              setTextElements(newElements);
            }}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
          />
        </div>
      </div>

      {/* Modal Confirmar Restauración de Plantilla */}
      <ConfirmModal
        isOpen={!!templateToReset}
        onClose={() => setTemplateToReset(null)}
        onConfirm={confirmResetToDefault}
        title="¿Restaurar diseño original?"
        message="¿Restaurar el diseño original oficial de CARVLAK para esta plantilla? Se perderán los ajustes personalizados."
        confirmText="Restaurar"
        cancelText="Cancelar"
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Car,
  Sparkle,
  ShieldCheck,
  Image as ImageIcon,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  ChevronRight,
  RefreshCw,
  Sliders,
  DollarSign,
  Type,
  FileCheck,
  Send,
  Save,
  Wand2,
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  SocialMediaCategory,
  SocialMediaFormat,
  SocialMediaTemplateId,
  LogoPosition,
  DealershipVehicle,
  DetailingQuote,
  VehicleInspection,
  Client,
  CanvasTextElement,
  FormatLayoutConfig,
  SocialMediaTemplateConfig
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { SocialCanvasPreview } from './SocialCanvasPreview';
import { generateSocialCopy } from '../services/socialCopyEngine';
import { formatCurrency } from '../../../lib/formatters';
import {
  renderSocialCanvas,
  exportCanvasToBlob,
  downloadBlob,
  isLikelyFlyerImage,
  getDefaultTextElements
} from '../services/socialCanvasEngine';
import { UruguayanPlate } from '../../../components/ui/UruguayanPlate';
import { Button } from '../../../components/ui/Button';

interface SocialStudioProps {
  initialVehicleId?: string;
  initialTemplateId?: string;
}

export const SocialStudio: React.FC<SocialStudioProps> = ({
  initialVehicleId,
  initialTemplateId
}) => {
  const { profile } = useAuth();
  const {
    dealershipVehicles,
    detailingQuotes,
    inspections,
    clients,
    socialMediaConfig,
    addSocialMediaPost,
    updateDealershipVehicle,
    updateClientConsent,
    toggleVehicleFlyerImage,
    applyStyleToAllTemplates,
    saveSocialTemplate,
    resetSocialTemplateToDefault
  } = useData();

  const { showToast } = useToast();

  // 1. Estados de Categoría, Plantilla y Formato
  const [selectedCategory, setSelectedCategory] = useState<SocialMediaCategory>('automotora');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || 'auto-vendido'
  );
  const [format, setFormat] = useState<SocialMediaFormat>('story');

  // 2. Selección de Item (Auto, Detailing o Inspección)
  const [selectedCarId, setSelectedCarId] = useState<string>(initialVehicleId || '');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');

  // 3. Selección y control de imágenes
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [secondaryImage, setSecondaryImage] = useState<string>(''); // Para Antes y Después
  const [imagePan, setImagePan] = useState({ x: 0, y: 0, zoom: 1 });
  const [coverPlate, setCoverPlate] = useState(false);
  const [platePosition, setPlatePosition] = useState({ x: 540, y: 1080, scale: 1 });

  // 4. Modo Carrusel (para 'auto-ficha-carrusel')
  const [carouselSlideIndex, setCarouselSlideIndex] = useState(0);
  const [carouselPhotos, setCarouselPhotos] = useState<string[]>([]);
  const [isDownloadingCarousel, setIsDownloadingCarousel] = useState(false);

  // 5. Textos editables y elementos independientes
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stampText, setStampText] = useState('');
  const [badgeTag, setBadgeTag] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-left');

  // 6. Elementos independientes de canvas interactivo
  const [textElements, setTextElements] = useState<CanvasTextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 7. Sincronizar precio editado con inventario
  const [syncPriceWithStock, setSyncPriceWithStock] = useState(false);

  // 8. Copy para Instagram
  const [caption, setCaption] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Items seleccionados computados
  const activeCar = useMemo(() => {
    return dealershipVehicles.find((v) => v.id === selectedCarId) || dealershipVehicles[0] || null;
  }, [dealershipVehicles, selectedCarId]);

  const activeQuote = useMemo(() => {
    return detailingQuotes.find((q) => q.id === selectedQuoteId) || detailingQuotes[0] || null;
  }, [detailingQuotes, selectedQuoteId]);

  const activeInspection = useMemo(() => {
    return inspections.find((i) => i.id === selectedInspectionId) || inspections[0] || null;
  }, [inspections, selectedInspectionId]);

  // Si se pasa initialVehicleId al montar
  useEffect(() => {
    if (initialVehicleId) {
      setSelectedCarId(initialVehicleId);
      setSelectedCategory('automotora');
    }
  }, [initialVehicleId]);

  // Si se pasa initialTemplateId al montar
  useEffect(() => {
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      const conf = socialMediaConfig.templates[initialTemplateId];
      if (conf) {
        setSelectedCategory(conf.category);
      }
    }
  }, [initialTemplateId, socialMediaConfig]);

  // Configuración de plantilla actual
  const currentTemplateConfig = socialMediaConfig.templates[selectedTemplateId];

  // Cargar datos predeterminados al cambiar de auto/trabajo o plantilla
  useEffect(() => {
    const templateConfig = socialMediaConfig.templates[selectedTemplateId];
    setLogoPosition(templateConfig?.logo_position || 'top-left');
    setStampText(templateConfig?.stamp_text || '');

    if (selectedCategory === 'automotora' && activeCar) {
      // Regla oficial: Por defecto SOLO el modelo ({marca} {modelo})
      const carTitle = `${activeCar.brand} ${activeCar.model}`.trim();
      const carSubtitle = `${activeCar.year} • ${activeCar.category} • ${activeCar.transmission || 'Manual'}`;
      setHeadline(carTitle);
      setSubtitle(carSubtitle);

      const priceFormatted = activeCar.sale_price
        ? formatCurrency(activeCar.sale_price, activeCar.sale_currency || 'USD')
        : 'Consultar precio';
      setPrice(priceFormatted);

      setOriginalPrice('');
      setBadgeTag('Stock CARVLAK');

      const carSpecs = [
        activeCar.fuel || 'Nafta',
        activeCar.transmission || 'Manual',
        activeCar.mileage ? `${activeCar.mileage.toLocaleString('es-UY')} km` : '0 km',
        activeCar.year ? `Año ${activeCar.year}` : ''
      ].filter(Boolean);
      setSpecs(carSpecs);

      // Selección de primera foto limpia (evitando flyers con texto impreso)
      if (activeCar.images && activeCar.images.length > 0) {
        const isFlyer = (url: string, idx: number) => {
          if (activeCar.flyer_images?.includes(url)) return true;
          return isLikelyFlyerImage(url, idx, activeCar.images.length > 1);
        };
        const firstCleanPhoto =
          activeCar.images.find((img, idx) => !isFlyer(img, idx)) || activeCar.images[0];
        setSelectedImage(firstCleanPhoto);
        setCarouselPhotos(activeCar.images.slice(0, 6));
      } else {
        setSelectedImage(
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
        );
        setCarouselPhotos([]);
      }

      // Inicialización de CanvasTextElements según la regla de sólo el modelo visible por defecto
      const defaultElements = getDefaultTextElements(selectedTemplateId, format, {
        carTitle,
        price: priceFormatted,
        originalPrice: '',
        stampText: templateConfig?.stamp_text,
        subtitle: carSubtitle,
        specs: [
          {
            key: 'mileage',
            label: 'Kilometraje',
            text: activeCar.mileage ? `${activeCar.mileage.toLocaleString('es-UY')} km` : '0 km'
          },
          { key: 'fuel', label: 'Combustible', text: activeCar.fuel || 'Nafta' },
          { key: 'transmission', label: 'Transmisión', text: activeCar.transmission || 'Manual' },
          { key: 'year', label: 'Año', text: activeCar.year ? `Año ${activeCar.year}` : '' }
        ]
      });

      // Si la plantilla ya tiene configurados textElements en su layout, fusionar los estilos
      const savedLayout =
        format === 'story' ? templateConfig?.layout_story : templateConfig?.layout_post;
      if (savedLayout?.textElements && savedLayout.textElements.length > 0) {
        const merged = defaultElements.map((defEl) => {
          const match = savedLayout.textElements?.find((s) => s.id === defEl.id);
          if (!match) return defEl;
          return {
            ...defEl,
            color: match.color,
            fontSize: match.fontSize,
            fontWeight: match.fontWeight,
            fontFamily: match.fontFamily,
            rotation: match.rotation,
            x: match.x,
            y: match.y,
            align: match.align,
            bgType: match.bgType,
            bgColor: match.bgColor,
            bgOpacity: match.bgOpacity,
            visible: match.visible !== undefined ? match.visible : defEl.visible
          };
        });
        setTextElements(merged);
      } else {
        setTextElements(defaultElements);
      }

      // Generar copy sugerido para Instagram
      const generatedCopy = generateSocialCopy({
        templateId: selectedTemplateId,
        car: activeCar,
        customHeadline: carTitle,
        customPrice: priceFormatted,
        config: socialMediaConfig
      });
      setCaption(generatedCopy);
    } else if (selectedCategory === 'detailing' && activeQuote) {
      setHeadline(activeQuote.vehicle_info);
      setSubtitle(`Trabajo de Detailing • ${activeQuote.client_name}`);
      setPrice(formatCurrency(activeQuote.total_amount));
      setBadgeTag('DetailVlak');
      setStampText(templateConfig?.stamp_text || 'RESULTADO PREMIUM');

      const serviceNames = (activeQuote.selected_services || [])
        .map((i) => i.serviceName)
        .slice(0, 3);
      setSpecs(serviceNames);

      const beforeImg =
        activeQuote.photos_before?.[0] ||
        'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80';
      const afterImg =
        activeQuote.photos_after?.[0] ||
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80';
      setSelectedImage(beforeImg);
      setSecondaryImage(afterImg);

      const defaultElements = getDefaultTextElements(selectedTemplateId, format, {
        carTitle: activeQuote.vehicle_info,
        price: formatCurrency(activeQuote.total_amount),
        stampText: templateConfig?.stamp_text || 'RESULTADO PREMIUM',
        subtitle: `Trabajo de Detailing • ${activeQuote.client_name}`
      });
      setTextElements(defaultElements);

      const generatedCopy = generateSocialCopy({
        templateId: selectedTemplateId,
        quote: activeQuote,
        customHeadline: activeQuote.vehicle_info,
        config: socialMediaConfig
      });
      setCaption(generatedCopy);
    } else if (selectedCategory === 'inspeccion' && activeInspection) {
      setHeadline(activeInspection.vehicle_info || `Inspección ${activeInspection.vehicle_plate}`);
      setSubtitle(`Peritaje Oficial • Dictamen ${activeInspection.traffic_light.toUpperCase()}`);
      setPrice(`Score: ${activeInspection.score}/100`);
      setBadgeTag('Peritaje CARVLAK');
      setStampText(activeInspection.traffic_light === 'Recomendable' ? 'APROBADO' : 'OBSERVADO');

      const inspSpecs = [
        `Puntaje: ${activeInspection.score}/100`,
        `Dictamen: ${activeInspection.traffic_light}`,
        `Placa: ${activeInspection.vehicle_plate}`,
        activeInspection.estimated_repair_cost
          ? `Arreglos: $U ${activeInspection.estimated_repair_cost.toLocaleString('es-UY')}`
          : 'Sin reparaciones requeridas'
      ];
      setSpecs(inspSpecs);

      setSelectedImage(
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
      );

      const defaultElements = getDefaultTextElements(selectedTemplateId, format, {
        carTitle: activeInspection.vehicle_info || `Inspección ${activeInspection.vehicle_plate}`,
        price: `Score: ${activeInspection.score}/100`,
        stampText: activeInspection.traffic_light === 'Recomendable' ? 'APROBADO' : 'OBSERVADO',
        subtitle: `Peritaje Oficial • Dictamen ${activeInspection.traffic_light.toUpperCase()}`
      });
      setTextElements(defaultElements);

      const generatedCopy = generateSocialCopy({
        templateId: selectedTemplateId,
        inspection: activeInspection,
        config: socialMediaConfig
      });
      setCaption(generatedCopy);
    }
  }, [
    selectedCategory,
    selectedTemplateId,
    selectedCarId,
    selectedQuoteId,
    selectedInspectionId,
    activeCar,
    activeQuote,
    activeInspection,
    socialMediaConfig,
    format
  ]);

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

  // Toggle de visibilidad de datos ocultos (subtítulo, km, año, combustible, etc.)
  const handleToggleElementVisibility = (elementId: string) => {
    setTextElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, visible: !el.visible } : el))
    );
    const target = textElements.find((el) => el.id === elementId);
    if (target && !target.visible) {
      setSelectedElementId(elementId);
    }
  };

  // Guardar en la plantilla actual (para todas las futuras piezas que usen esta plantilla)
  const handleSaveToCurrentTemplate = () => {
    if (!currentTemplateConfig) return;
    const currentLayout =
      format === 'story'
        ? currentTemplateConfig.layout_story
        : currentTemplateConfig.layout_post;
    const updatedLayout: FormatLayoutConfig = {
      ...(currentLayout || {
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
        specsOrder: []
      }),
      textElements
    };

    const updatedTemplate: SocialMediaTemplateConfig = {
      ...currentTemplateConfig,
      stamp_text: stampText,
      layout_story: format === 'story' ? updatedLayout : currentTemplateConfig.layout_story,
      layout_post: format === 'post' ? updatedLayout : currentTemplateConfig.layout_post
    };

    saveSocialTemplate(updatedTemplate);
    showToast('Diseño guardado en la plantilla para futuras piezas', 'success');
  };

  // Aplicar estilo a todas las plantillas
  const handleApplyToAllTemplates = () => {
    handleSaveToCurrentTemplate();
    applyStyleToAllTemplates(selectedTemplateId);
    showToast('Estilo visual aplicado a todas las plantillas oficiales', 'success');
  };

  // Restaurar diseño original de fábrica
  const handleRestoreTemplateDefault = () => {
    resetSocialTemplateToDefault(selectedTemplateId);
    const defaultElements = getDefaultTextElements(selectedTemplateId, format, {
      carTitle: headline,
      price,
      originalPrice,
      stampText: currentTemplateConfig?.stamp_text,
      subtitle
    });
    setTextElements(defaultElements);
    showToast('Plantilla restablecida a su diseño original de fábrica', 'info');
  };

  // Manejo de actualización de precio en inventario si está tildado
  const handlePriceBlur = () => {
    if (syncPriceWithStock && activeCar) {
      const numericVal = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericVal) && numericVal > 0) {
        updateDealershipVehicle(activeCar.id, {
          sale_price: numericVal
        });
        showToast('Precio sincronizado con el inventario de Automotora', 'info');
      }
    }
  };

  // Copiar copy al portapapeles
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    showToast('Texto copiado al portapapeles', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Guardar publicación en historial
  const handleSaveToHistory = (thumbnailData: string) => {
    addSocialMediaPost({
      category: selectedCategory,
      template_id: selectedTemplateId,
      template_title: currentTemplateConfig?.title || 'Plantilla',
      format,
      item_id: activeCar?.id || activeQuote?.id || activeInspection?.id || '',
      item_title: headline || 'Sin título',
      suggested_caption: caption,
      thumbnail_data: thumbnailData,
      is_published: false,
      created_by_name: profile?.full_name || 'Admin CARVLAK'
    });
  };

  // Descarga del carrusel completo
  const handleDownloadFullCarousel = async () => {
    if (carouselPhotos.length === 0) return;
    setIsDownloadingCarousel(true);
    showToast(`Generando ${carouselPhotos.length} imágenes del carrusel...`, 'info');

    try {
      const offscreenCanvas = document.createElement('canvas');
      for (let i = 0; i < carouselPhotos.length; i++) {
        const photo = carouselPhotos[i];
        const isCover = i === 0;

        await renderSocialCanvas(offscreenCanvas, {
          format,
          templateId: 'auto-ficha-carrusel',
          imageUrl: photo,
          headline,
          subtitle: isCover ? subtitle : `Detalle ${i + 1} de ${carouselPhotos.length}`,
          price: isCover ? price : '',
          specs: isCover ? specs : [],
          stampText: isCover ? stampText : '',
          coverPlate,
          platePosition,
          imagePan,
          logoPosition,
          instagramHandle: socialMediaConfig.instagram_handle,
          locationName: socialMediaConfig.location_name,
          badgeTag: isCover ? badgeTag : undefined
        });

        const blob = await exportCanvasToBlob(offscreenCanvas);
        const filename = `${headline.toLowerCase().replace(/[^a-z0-9]/g, '-')}-slide-${i + 1}.png`;
        downloadBlob(blob, filename);
        await new Promise((r) => setTimeout(r, 400));
      }

      showToast('Carrusel completo descargado con éxito', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar el carrusel', 'error');
    } finally {
      setIsDownloadingCarousel(false);
    }
  };

  // Comprador para plantilla 'auto-entrega'
  const clientBuyer = useMemo(() => {
    if (selectedTemplateId === 'auto-entrega') {
      const buyerId =
        activeCar?.sale_record?.buyer_client_id || activeCar?.reservation?.client_id;
      if (buyerId) {
        return clients.find((c) => c.id === buyerId) || null;
      }
    }
    return null;
  }, [selectedTemplateId, activeCar, clients]);

  return (
    <div className="space-y-6">
      {/* 1. SELECCIÓN DE NEGOCIO Y PLANTILLA */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E5E5E3] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-title font-bold text-[#161616] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7141A]" />
              <span>Estudio creativo de redes sociales</span>
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Elegí una plantilla oficial, vinculá el vehículo o servicio y personalizá cada detalle en segundos.
            </p>
          </div>

          {/* Selector de Negocio */}
          <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('automotora');
                setSelectedTemplateId('auto-vendido');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'automotora'
                  ? 'bg-white text-[#161616] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Automotora</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('detailing');
                setSelectedTemplateId('detailing-antes-despues');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'detailing'
                  ? 'bg-white text-[#161616] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span>Detailing</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory('inspeccion');
                setSelectedTemplateId('inspeccion-precompra');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'inspeccion'
                  ? 'bg-white text-[#161616] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspección</span>
            </button>
          </div>
        </div>

        {/* Grilla de Plantillas disponibles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2">
          {Object.values(socialMediaConfig.templates)
            .filter((t) => t.category === selectedCategory && t.is_active !== false)
            .map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-[#D7141A] shadow-xs'
                      : 'bg-white border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D7141A]" />
                  )}
                  <div className="font-title font-bold text-xs text-[#161616] mb-0.5">
                    {template.title}
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                  {template.stamp_text && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD]">
                      {template.stamp_text}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* 2. ÁREA DE TRABAJO: EDITOR Y CANVAS PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (7 cols): CONTROLES Y DATOS */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Selector de Item Vinculado */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-xs space-y-3">
            <label className="block text-xs font-bold text-[#161616] tracking-wide">
              {selectedCategory === 'automotora' && '1. Seleccionar vehículo de stock'}
              {selectedCategory === 'detailing' && '1. Seleccionar trabajo o cotización'}
              {selectedCategory === 'inspeccion' && '1. Seleccionar inspección realizada'}
            </label>

            {selectedCategory === 'automotora' && (
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] font-medium focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
              >
                {dealershipVehicles.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} {car.version || ''} ({car.year}) - {car.status} -{' '}
                    {formatCurrency(car.sale_price, car.sale_currency || 'USD')}
                  </option>
                ))}
              </select>
            )}

            {selectedCategory === 'detailing' && (
              <select
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] font-medium focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
              >
                {detailingQuotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.vehicle_info} - {q.client_name} ({formatCurrency(q.total_amount)})
                  </option>
                ))}
              </select>
            )}

            {selectedCategory === 'inspeccion' && (
              <select
                value={selectedInspectionId}
                onChange={(e) => setSelectedInspectionId(e.target.value)}
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] font-medium focus:bg-white focus:border-[#161616] focus:outline-none cursor-pointer"
              >
                {inspections.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.vehicle_info || i.vehicle_plate} - Dictamen: {i.traffic_light} ({i.status})
                  </option>
                ))}
              </select>
            )}

            {/* Aviso de Consentimiento para Plantilla 'auto-entrega' */}
            {selectedTemplateId === 'auto-entrega' && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#945B0E] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#161616]">
                      Verificación de consentimiento de imagen
                    </p>
                    {clientBuyer ? (
                      clientBuyer.social_media_consent ? (
                        <p className="text-[#1E6B43] text-[11px] mt-0.5 font-semibold">
                          ✓ El comprador <strong>{clientBuyer.full_name}</strong> tiene el consentimiento autorizado en su ficha.
                        </p>
                      ) : (
                        <div className="text-[11px] text-[#6B6B6B] mt-1 space-y-2">
                          <p>
                            El comprador <strong>{clientBuyer.full_name}</strong> aún no tiene registrado consentimiento para publicaciones.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              updateClientConsent(clientBuyer.id, true);
                              showToast('Consentimiento autorizado para este cliente', 'success');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9] font-bold hover:bg-[#D9EFE3] transition-colors cursor-pointer"
                          >
                            Autorizar consentimiento ahora
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Asegurate de contar con la autorización verbal o firmada del comprador antes de subir fotos de la entrega.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Selector de Fotos con Detección de Flyers */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>2. Seleccionar foto del vehículo</span>
              </label>

              {/* Si es carrusel, botón de descarga masiva */}
              {selectedTemplateId === 'auto-ficha-carrusel' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isDownloadingCarousel}
                  onClick={handleDownloadFullCarousel}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {isDownloadingCarousel ? 'Descargando...' : 'Descargar carrusel completo'}
                  </span>
                </Button>
              )}
            </div>

            <p className="text-[11px] text-[#6B6B6B]">
              Se selecciona automáticamente la primera foto limpia (sin texto impreso). Podés marcar o desmarcar fotos como flyer tocando la etiqueta.
            </p>

            {/* Galería de fotos para elegir la activa */}
            {activeCar && activeCar.images && activeCar.images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                {activeCar.images.map((img, idx) => {
                  const isFlyer =
                    activeCar.flyer_images?.includes(img) ||
                    isLikelyFlyerImage(img, idx, activeCar.images.length > 1);

                  return (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all block cursor-pointer ${
                          selectedImage === img
                            ? 'border-[#D7141A] ring-2 ring-[#D7141A]/30 scale-95 shadow-xs'
                            : 'border-[#E5E5E3] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Badge / Toggle de Flyer con texto */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVehicleFlyerImage(activeCar.id, img);
                          showToast(
                            isFlyer
                              ? 'Foto desmarcada como flyer'
                              : 'Foto marcada como flyer con texto impreso',
                            'info'
                          );
                        }}
                        title={
                          isFlyer
                            ? 'Marcada como flyer con texto. Clic para desmarcar'
                            : 'Marcar como flyer con texto impreso'
                        }
                        className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight transition-all cursor-pointer shadow-xs ${
                          isFlyer
                            ? 'bg-[#D7141A] text-white border border-white'
                            : 'bg-black/60 text-white hover:bg-black/80'
                        }`}
                      >
                        {isFlyer ? 'Flyer' : 'Limpia'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center text-xs text-[#6B6B6B]">
                No hay fotos cargadas en este registro del catálogo.
              </div>
            )}

            {/* Si es Antes y Después, selector de segunda foto */}
            {selectedTemplateId === 'detailing-antes-despues' && (
              <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                <label className="text-[11px] font-bold text-[#161616] block">
                  Foto del "Después" (mitad inferior)
                </label>
                <input
                  type="text"
                  placeholder="URL o foto del resultado final"
                  value={secondaryImage}
                  onChange={(e) => setSecondaryImage(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:bg-white focus:border-[#161616] focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* 3. Personalizar textos y valores */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] tracking-wide flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>3. Personalizar textos y valores</span>
              </label>
              <span className="text-[11px] text-[#6B6B6B]">
                Tocá cualquier texto en la vista previa para editar tamaño, color o moverlo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Titular / Modelo
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
                  Texto del sello
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => handleStampTextChange(e.target.value)}
                  placeholder="Ej: OPORTUNIDAD, VENDIDO, RESERVADO"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] uppercase font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#6B6B6B] font-semibold">
                    Precio visible
                  </label>
                  {selectedCategory === 'automotora' && (
                    <label className="text-[10px] text-[#6B6B6B] hover:text-[#161616] flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncPriceWithStock}
                        onChange={(e) => setSyncPriceWithStock(e.target.checked)}
                        className="rounded accent-[#D7141A]"
                      />
                      <span>Sincronizar en stock</span>
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={handlePriceBlur}
                  placeholder="Ej: USD 18.900 o Consultar"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#D7141A] font-title font-bold text-sm focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              {selectedTemplateId === 'auto-descuento' && (
                <div>
                  <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                    Precio anterior (tachado)
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
            </div>

            {/* Interruptores para datos adicionales de la ficha técnica (ocultos por defecto) */}
            <div className="pt-3 border-t border-[#E5E5E3] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#161616] uppercase tracking-wide">
                  Datos adicionales de la ficha técnica (opcionales)
                </span>
                <span className="text-[10px] text-[#6B6B6B]">
                  Solo el modelo está visible por defecto. Activá cualquiera para sumarlo al diseño:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'subtitulo', label: 'Subtítulo / Versión', desc: subtitle || 'Versión' },
                  { id: 'specs_km', label: 'Kilometraje', desc: `${activeCar?.mileage ? activeCar.mileage.toLocaleString('es-UY') : '0'} km` },
                  { id: 'specs_combustible', label: 'Combustible', desc: activeCar?.fuel || 'Nafta' },
                  { id: 'specs_transmision', label: 'Transmisión', desc: activeCar?.transmission || 'Manual' },
                  { id: 'specs_anio', label: 'Año', desc: `Año ${activeCar?.year || ''}` },
                  { id: 'cta', label: 'Llamado a la acción', desc: 'Consultá por WhatsApp' }
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

            {/* Botonera de Guardado y Aplicación a Plantillas */}
            <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveToCurrentTemplate}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E5E3] hover:border-[#161616] text-[#161616] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Guardar estos cambios en esta plantilla para futuras piezas"
              >
                <Save className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>Guardar en esta plantilla</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToAllTemplates}
                className="px-3 py-1.5 rounded-lg bg-[#F5F5F4] hover:bg-white border border-[#E5E5E3] hover:border-[#D7141A] text-[#161616] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Copiar colores, tipografía y diseño a todas las plantillas de redes sociales"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>Aplicar este estilo a todas las plantillas</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreTemplateDefault}
                className="px-2.5 py-1.5 rounded-lg text-[#6B6B6B] hover:text-[#D7141A] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Restaurar el diseño original de fábrica de esta plantilla"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar original</span>
              </button>
            </div>
          </div>

          {/* 4. Copy y Texto para Instagram con Botón Copiar */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] tracking-wide flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>4. Texto y copy para Instagram</span>
              </label>

              <button
                type="button"
                onClick={handleCopyCaption}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9]'
                    : 'bg-white border border-[#E5E5E3] text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar texto'}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] leading-relaxed focus:bg-white focus:border-[#161616] focus:outline-none font-sans"
            />
            <p className="text-[11px] text-[#6B6B6B]">
              Podés retocar los hashtags o el llamado a la acción antes de pegarlo en Instagram.
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 cols): CANVAS PREVIEW INTERACTIVO */}
        <div className="lg:col-span-5 sticky top-6">
          <SocialCanvasPreview
            format={format}
            onFormatChange={setFormat}
            templateId={selectedTemplateId}
            imageUrl={selectedImage}
            secondaryImageUrl={secondaryImage}
            headline={headline}
            subtitle={subtitle}
            price={price}
            originalPrice={originalPrice}
            specs={specs}
            stampText={stampText}
            coverPlate={coverPlate}
            onCoverPlateChange={setCoverPlate}
            platePosition={platePosition}
            onPlatePositionChange={setPlatePosition}
            imagePan={imagePan}
            onImagePanChange={setImagePan}
            logoPosition={logoPosition}
            instagramHandle={socialMediaConfig.instagram_handle}
            locationName={socialMediaConfig.location_name}
            badgeTag={badgeTag}
            layoutConfig={
              format === 'story'
                ? currentTemplateConfig?.layout_story
                : currentTemplateConfig?.layout_post
            }
            onSaveToHistory={handleSaveToHistory}
            suggestedFileName={headline.toLowerCase().replace(/[^a-z0-9]/g, '-')}
            textElements={textElements}
            onTextElementsChange={setTextElements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
          />
        </div>
      </div>
    </div>
  );
};

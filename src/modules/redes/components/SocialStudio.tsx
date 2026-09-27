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
  Send
} from 'lucide-react';
import {
  SocialMediaCategory,
  SocialMediaFormat,
  SocialMediaTemplateId,
  LogoPosition,
  DealershipVehicle,
  DetailingQuote,
  VehicleInspection,
  Client
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { SocialCanvasPreview } from './SocialCanvasPreview';
import { generateSocialCopy } from '../services/socialCopyEngine';
import { formatCurrency } from '../../../lib/formatters';
import { renderSocialCanvas, exportCanvasToBlob, downloadBlob } from '../services/socialCanvasEngine';

interface SocialStudioProps {
  initialVehicleId?: string;
  initialTemplateId?: SocialMediaTemplateId;
}

export const SocialStudio: React.FC<SocialStudioProps> = ({
  initialVehicleId,
  initialTemplateId
}) => {
  const {
    dealershipVehicles,
    detailingQuotes,
    inspections,
    clients,
    socialMediaConfig,
    addSocialMediaPost,
    updateDealershipVehicle,
    updateClientConsent
  } = useData();

  const { showToast } = useToast();

  // 1. Estados de Categoría y Plantilla
  const [selectedCategory, setSelectedCategory] = useState<SocialMediaCategory>('automotora');
  const [selectedTemplateId, setSelectedTemplateId] = useState<SocialMediaTemplateId>(
    initialTemplateId || 'auto-vendido'
  );
  const [format, setFormat] = useState<SocialMediaFormat>('post');

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

  // 5. Textos editables
  const [headline, setHeadline] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stampText, setStampText] = useState('');
  const [badgeTag, setBadgeTag] = useState('');
  const [specs, setSpecs] = useState<string[]>([]);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-left');

  // 6. Sincronizar precio editado con inventario
  const [syncPriceWithStock, setSyncPriceWithStock] = useState(false);

  // 7. Copy para Instagram
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
      const carTitle = `${activeCar.brand} ${activeCar.model} ${activeCar.version || ''}`.trim();
      setHeadline(carTitle);
      setSubtitle(`${activeCar.year} • ${activeCar.category} • ${activeCar.transmission || 'Manual'}`);
      
      const priceFormatted = activeCar.sale_price
        ? formatCurrency(activeCar.sale_price, activeCar.sale_currency || 'USD')
        : 'Consultar precio';
      setPrice(priceFormatted);

      if (selectedTemplateId === 'auto-descuento') {
        const origPrice = activeCar.sale_price ? Math.round(activeCar.sale_price * 1.08) : 0;
        setOriginalPrice(origPrice > 0 ? formatCurrency(origPrice, activeCar.sale_currency || 'USD') : '');
      } else {
        setOriginalPrice('');
      }

      // Specs chips
      const sp: string[] = [];
      if (activeCar.year) sp.push(`Año ${activeCar.year}`);
      if (activeCar.mileage) {
        sp.push(`${activeCar.mileage.toLocaleString('es-UY')} km`);
      } else if (activeCar.condition === '0km') {
        sp.push('0 km');
      }
      if (activeCar.engine) sp.push(activeCar.engine);
      if (activeCar.fuel) sp.push(activeCar.fuel);
      setSpecs(sp);

      // Foto principal
      const carImages = activeCar.images && activeCar.images.length > 0
        ? activeCar.images
        : (activeCar.cover_image ? [activeCar.cover_image] : []);

      if (carImages.length > 0) {
        setSelectedImage(carImages[0]);
        setCarouselPhotos(carImages);
      } else {
        setSelectedImage('');
        setCarouselPhotos([]);
      }

      // Tags específicos
      if (selectedTemplateId === 'auto-electricos-0km') {
        setBadgeTag('100% ELÉCTRICO • 0KM');
      } else if (selectedTemplateId === 'auto-catalogo-semana') {
        setBadgeTag('DESTACADO DE LA SEMANA');
      } else {
        setBadgeTag('');
      }

    } else if (selectedCategory === 'detailing' && activeQuote) {
      setHeadline(activeQuote.vehicle_info || 'Detallado Profesional');
      const servicesStr = activeQuote.selected_services?.map((s) => s.serviceName).join(' + ') || 'Tratamiento Integral';
      setSubtitle(servicesStr);
      setPrice(activeQuote.total_amount ? formatCurrency(activeQuote.total_amount) : '');
      setOriginalPrice('');
      setSpecs(['Garantía Escrita', 'Productos Premium']);

      // Fotos de cotización si tiene
      setSelectedImage(activeQuote.photos_before?.[0] || '');
      setSecondaryImage(activeQuote.photos_after?.[0] || '');

    } else if (selectedCategory === 'inspeccion' && activeInspection) {
      setHeadline(activeInspection.vehicle_info || 'Inspección Precompra Certificada');
      setSubtitle(`Dictamen: ${activeInspection.traffic_light} • Puntaje: ${activeInspection.score}/100`);
      setPrice('Peritaje 120+ Puntos');
      setOriginalPrice('');
      setSpecs(['Escaneo OBD-II', 'Pintura Original', 'Chasis OK']);
      setSelectedImage(activeInspection.photos?.[0] || '');
    }
  }, [selectedCategory, selectedTemplateId, activeCar, activeQuote, activeInspection, socialMediaConfig]);

  // Regenerar copy para Instagram al cambiar variables relevantes
  useEffect(() => {
    const copy = generateSocialCopy({
      templateId: selectedTemplateId,
      car: selectedCategory === 'automotora' ? activeCar : null,
      quote: selectedCategory === 'detailing' ? activeQuote : null,
      inspection: selectedCategory === 'inspeccion' ? activeInspection : null,
      customHeadline: headline,
      customSubtitle: subtitle,
      customPrice: price,
      config: socialMediaConfig
    });
    setCaption(copy);
  }, [
    selectedTemplateId,
    selectedCategory,
    activeCar,
    activeQuote,
    activeInspection,
    headline,
    subtitle,
    price,
    socialMediaConfig
  ]);

  // Manejador de copia de texto al portapapeles
  const handleCopyCaption = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    showToast('Texto y hashtags copiados para Instagram', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Guardar en Historial
  const handleSaveToHistory = (thumbnailData: string) => {
    addSocialMediaPost({
      template_id: selectedTemplateId,
      template_title: currentTemplateConfig?.title || 'Publicación CARVLAK',
      category: selectedCategory,
      format,
      item_id: activeCar?.id || activeQuote?.id || activeInspection?.id,
      item_title: headline || 'Vehículo',
      thumbnail_data: thumbnailData,
      suggested_caption: caption,
      is_published: false,
      created_by_name: 'Admin'
    });
  };

  // Manejo de sincronización de precio con stock
  const handlePriceBlur = () => {
    if (syncPriceWithStock && activeCar && price) {
      // Extraer número de string (ej "$ 19.500" o "USD 19500")
      const digits = price.replace(/[^0-9]/g, '');
      const parsed = parseInt(digits, 10);
      if (!isNaN(parsed) && parsed > 0) {
        updateDealershipVehicle(activeCar.id, { sale_price: parsed });
        showToast(`Precio de lista actualizado a ${formatCurrency(parsed, activeCar.sale_currency || 'USD')} en inventario`, 'success');
      }
    }
  };

  // Validación de consentimiento para la plantilla 'auto-entrega'
  const clientBuyer = useMemo<Client | null>(() => {
    if (!activeCar) return null;
    const buyerPhone = activeCar.sale_record?.buyer_phone;
    const buyerName = activeCar.sale_record?.buyer_name;
    if (!buyerPhone && !buyerName) return null;

    return (
      clients.find(
        (c) =>
          (buyerPhone && c.phone.includes(buyerPhone)) ||
          (buyerName && c.full_name.toLowerCase() === buyerName.toLowerCase())
      ) || null
    );
  }, [activeCar, clients]);

  // Descarga de Carrusel Completo
  const handleDownloadFullCarousel = async () => {
    if (carouselPhotos.length === 0) {
      showToast('No hay fotos seleccionadas para el carrusel', 'warning');
      return;
    }

    setIsDownloadingCarousel(true);
    showToast(`Generando y descargando ${carouselPhotos.length} slides del carrusel...`, 'info');

    try {
      const offscreenCanvas = document.createElement('canvas');
      for (let i = 0; i < carouselPhotos.length; i++) {
        const photoUrl = carouselPhotos[i];
        const slideSubtitle = i === 0
          ? subtitle
          : `Foto ${i + 1} de ${carouselPhotos.length} • ${activeCar?.brand || ''} ${activeCar?.model || ''}`;

        await renderSocialCanvas(offscreenCanvas, {
          format,
          templateId: selectedTemplateId,
          imageUrl: photoUrl,
          headline,
          subtitle: slideSubtitle,
          price: i === 0 ? price : '', // Solo primer slide lleva precio gigante
          specs: i === 0 ? specs : [],
          coverPlate,
          platePosition,
          imagePan,
          logoPosition,
          instagramHandle: socialMediaConfig.instagram_handle,
          locationName: socialMediaConfig.location_name
        });

        const blob = await exportCanvasToBlob(offscreenCanvas);
        const filename = `${headline.replace(/[^a-zA-Z0-9]/g, '_')}-slide-${i + 1}.png`;
        downloadBlob(blob, filename);

        // Pequeña pausa para no bloquear la cola de descargas del navegador
        await new Promise((r) => setTimeout(r, 400));
      }

      showToast(`¡Las ${carouselPhotos.length} fotos del carrusel se descargaron con éxito!`, 'success');
    } catch (err) {
      showToast('Error al descargar algunas diapositivas del carrusel', 'error');
    } finally {
      setIsDownloadingCarousel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SELECCIÓN DE CATEGORÍA & PLANTILLA */}
      <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7141A]" />
              Estudio Creativo de Redes Sociales
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Elegí una plantilla oficial, vinculá el vehículo o servicio y personalizá los detalles en segundos.
            </p>
          </div>

          {/* Selector de Negocio */}
          <div className="flex items-center bg-black p-1 rounded-2xl border border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('automotora');
                setSelectedTemplateId('auto-vendido');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'automotora'
                  ? 'bg-[#D7141A] text-white shadow-sm'
                  : 'text-[#8A8A8A] hover:text-white'
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
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'detailing'
                  ? 'bg-[#D7141A] text-white shadow-sm'
                  : 'text-[#8A8A8A] hover:text-white'
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
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'inspeccion'
                  ? 'bg-[#D7141A] text-white shadow-sm'
                  : 'text-[#8A8A8A] hover:text-white'
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
            .filter((t) => t.category === selectedCategory)
            .map((template) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'bg-black border-[#D7141A] shadow-md ring-1 ring-[#D7141A]'
                      : 'bg-black/60 border-[#2A2A2A] hover:border-[#8A8A8A]/50 text-[#8A8A8A]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D7141A]" />
                  )}
                  <div className="font-bold text-xs text-white mb-0.5">{template.title}</div>
                  <p className="text-[10px] text-[#8A8A8A] line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                  {template.stamp_text && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/20">
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
        <div className="lg:col-span-7 space-y-5">
          
          {/* Selector de Item Vinculado */}
          <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] space-y-3">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              {selectedCategory === 'automotora' && '1. Seleccionar Vehículo de Stock'}
              {selectedCategory === 'detailing' && '1. Seleccionar Trabajo o Cotización'}
              {selectedCategory === 'inspeccion' && '1. Seleccionar Inspección Realizada'}
            </label>

            {selectedCategory === 'automotora' && (
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs text-white font-medium focus:border-[#D7141A] focus:outline-none cursor-pointer"
              >
                {dealershipVehicles.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} {car.version || ''} ({car.year}) - {car.status.toUpperCase()} - {formatCurrency(car.sale_price, car.sale_currency || 'USD')}
                  </option>
                ))}
              </select>
            )}

            {selectedCategory === 'detailing' && (
              <select
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs text-white font-medium focus:border-[#D7141A] focus:outline-none cursor-pointer"
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
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs text-white font-medium focus:border-[#D7141A] focus:outline-none cursor-pointer"
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
              <div className="mt-3 p-3.5 rounded-2xl bg-black border border-[#2A2A2A] space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#eab308] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-white">
                      Verificación de Consentimiento de Imagen
                    </p>
                    {clientBuyer ? (
                      clientBuyer.social_media_consent ? (
                        <p className="text-[#22c55e] text-[11px] mt-0.5">
                          ✓ El comprador <strong>{clientBuyer.full_name}</strong> tiene el consentimiento autorizado en su ficha.
                        </p>
                      ) : (
                        <div className="text-[11px] text-[#8A8A8A] mt-1 space-y-2">
                          <p>
                            El comprador <strong>{clientBuyer.full_name}</strong> aún no tiene registrado consentimiento para publicaciones.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              updateClientConsent(clientBuyer.id, true);
                              showToast('Consentimiento autorizado para este cliente', 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 font-bold hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                          >
                            Autorizar Consentimiento Ahora
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                        Asegurate de contar con la autorización verbal o firmada del comprador antes de subir fotos de la entrega.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector de Fotos Disponibles */}
          <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#D7141A]" />
                2. Seleccionar Foto del Vehículo
              </label>

              {/* Si es carrusel, botón de descarga masiva */}
              {selectedTemplateId === 'auto-ficha-carrusel' && (
                <button
                  type="button"
                  disabled={isDownloadingCarousel}
                  onClick={handleDownloadFullCarousel}
                  className="px-3 py-1.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isDownloadingCarousel ? 'Descargando...' : 'Descargar Carrusel Completo'}</span>
                </button>
              )}
            </div>

            {/* Carrusel Slide Tabs si es Ficha Carrusel */}
            {selectedTemplateId === 'auto-ficha-carrusel' && carouselPhotos.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {carouselPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCarouselSlideIndex(idx);
                      setSelectedImage(photo);
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      carouselSlideIndex === idx
                        ? 'bg-[#D7141A] text-white border-[#D7141A]'
                        : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
                    }`}
                  >
                    Slide {idx + 1} {idx === 0 ? '(Portada)' : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Galería de fotos para elegir la activa */}
            {activeCar && activeCar.images && activeCar.images.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {activeCar.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-video rounded-xl overflow-hidden border-2 transition-all relative cursor-pointer ${
                      selectedImage === img
                        ? 'border-[#D7141A] ring-2 ring-[#D7141A]/50 scale-95'
                        : 'border-[#2A2A2A] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-black border border-[#2A2A2A] text-center text-xs text-[#8A8A8A]">
                No hay fotos cargadas en este registro. Podés pegar una URL de imagen abajo.
              </div>
            )}

            {/* Input manual de URL de foto */}
            <div className="pt-1">
              <input
                type="text"
                placeholder="O pegá una URL directa de imagen (https://...)"
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value)}
                className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white placeholder-[#8A8A8A] focus:border-[#D7141A] focus:outline-none font-mono"
              />
            </div>

            {/* Si es Antes y Después, selector de segunda foto */}
            {selectedTemplateId === 'detailing-antes-despues' && (
              <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
                <label className="text-[11px] font-bold text-white uppercase tracking-wider block">
                  Foto del "DESPUÉS" (Mitad inferior)
                </label>
                <input
                  type="text"
                  placeholder="URL o foto del resultado final"
                  value={secondaryImage}
                  onChange={(e) => setSecondaryImage(e.target.value)}
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-xs text-white placeholder-[#8A8A8A] focus:border-[#D7141A] focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Edición de Textos y Precios */}
          <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] space-y-4">
            <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#D7141A]" />
              3. Personalizar Textos y Valores
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#8A8A8A] font-semibold block mb-1">
                  Titular / Modelo
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-bold focus:border-[#D7141A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8A8A8A] font-semibold block mb-1">
                  Subtítulo / Versión / Año
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:border-[#D7141A] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#8A8A8A] font-semibold">
                    Precio Visible
                  </label>
                  {selectedCategory === 'automotora' && (
                    <label className="text-[10px] text-[#8A8A8A] hover:text-white flex items-center gap-1 cursor-pointer">
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
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={handlePriceBlur}
                  placeholder="Ej: USD 18.900 o Consultar"
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-bold text-[#D7141A] focus:border-[#D7141A] focus:outline-none"
                />
              </div>

              {selectedTemplateId === 'auto-descuento' && (
                <div>
                  <label className="text-[11px] text-[#8A8A8A] font-semibold block mb-1">
                    Precio Anterior (Tachado)
                  </label>
                  <input
                    type="text"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ej: USD 21.000"
                    className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-[#8A8A8A] line-through focus:border-[#D7141A] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#8A8A8A] font-semibold block mb-1">
                  Texto del Sello Central
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  placeholder="Ej: VENDIDO, RESERVADO, OFERTA"
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white uppercase font-bold focus:border-[#D7141A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8A8A8A] font-semibold block mb-1">
                  Posición del Logo CARVLAK
                </label>
                <select
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                  className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:border-[#D7141A] focus:outline-none cursor-pointer"
                >
                  <option value="top-left">Superior Izquierda</option>
                  <option value="top-center">Superior Centro</option>
                  <option value="top-right">Superior Derecha</option>
                  <option value="bottom-left">Inferior Izquierda</option>
                  <option value="bottom-right">Inferior Derecha</option>
                </select>
              </div>
            </div>
          </div>

          {/* Copy y Texto para Instagram con Botón Copiar */}
          <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#D7141A]" />
                4. Texto y Copy para Instagram
              </label>

              <button
                type="button"
                onClick={handleCopyCaption}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-[#22c55e] text-black shadow-md'
                    : 'bg-[#D7141A] hover:bg-[#B51015] text-white'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-black border border-[#2A2A2A] rounded-2xl p-3 text-xs text-white leading-relaxed focus:border-[#D7141A] focus:outline-none font-sans"
            />
            <p className="text-[11px] text-[#8A8A8A]">
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
            onSaveToHistory={handleSaveToHistory}
            suggestedFileName={headline.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          />
        </div>

      </div>
    </div>
  );
};

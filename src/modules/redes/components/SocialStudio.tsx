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
import { useAuth } from '../../../context/AuthContext';
import { SocialCanvasPreview } from './SocialCanvasPreview';
import { generateSocialCopy } from '../services/socialCopyEngine';
import { formatCurrency } from '../../../lib/formatters';
import { renderSocialCanvas, exportCanvasToBlob, downloadBlob } from '../services/socialCanvasEngine';
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
    updateClientConsent
  } = useData();

  const { showToast } = useToast();

  // 1. Estados de Categoría y Plantilla
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

      setOriginalPrice('');
      setBadgeTag('Stock CARVLAK');

      const carSpecs = [
        activeCar.fuel || 'Nafta',
        activeCar.transmission || 'Manual',
        activeCar.mileage ? `${activeCar.mileage.toLocaleString('es-UY')} km` : '0 km',
        activeCar.year ? `Año ${activeCar.year}` : ''
      ].filter(Boolean);
      setSpecs(carSpecs);

      if (activeCar.images && activeCar.images.length > 0) {
        setSelectedImage(activeCar.images[0]);
        setCarouselPhotos(activeCar.images.slice(0, 6));
      } else {
        setSelectedImage('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80');
        setCarouselPhotos([]);
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
      
      const serviceNames = (activeQuote.selected_services || []).map((i) => i.serviceName).slice(0, 3);
      setSpecs(serviceNames);

      const beforeImg = activeQuote.photos_before?.[0] || 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1200&q=80';
      const afterImg = activeQuote.photos_after?.[0] || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80';
      setSelectedImage(beforeImg);
      setSecondaryImage(afterImg);

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
        activeInspection.estimated_repair_cost ? `Arreglos: $U ${activeInspection.estimated_repair_cost.toLocaleString('es-UY')}` : 'Sin reparaciones requeridas'
      ];
      setSpecs(inspSpecs);

      setSelectedImage('https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80');

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
    socialMediaConfig
  ]);

  // Manejo de actualización de precio en stock si está tildado
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
      const buyerId = activeCar?.sale_record?.buyer_client_id || activeCar?.reservation?.client_id;
      if (buyerId) {
        return clients.find((c) => c.id === buyerId) || null;
      }
    }
    return null;
  }, [selectedTemplateId, activeCar, clients]);

  return (
    <div className="space-y-6">
      {/* 1. SELECCIÓN DE NEGOCIO Y PLANTILLA */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E5E5E3] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-title font-bold text-[#161616] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D7141A]" />
              <span>Estudio creativo de redes sociales</span>
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Elegí una plantilla oficial, vinculá el vehículo o servicio y personalizá los detalles en segundos.
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
                  ? 'bg-white text-[#161616] shadow-sm'
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
                  ? 'bg-white text-[#161616] shadow-sm'
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
                  ? 'bg-white text-[#161616] shadow-sm'
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
                      ? 'bg-white border-2 border-[#D7141A] shadow-sm'
                      : 'bg-white border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D7141A]" />
                  )}
                  <div className="font-title font-bold text-xs text-[#161616] mb-0.5">{template.title}</div>
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
          
          {/* Selector de Item Vinculado */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-sm space-y-3">
            <label className="block text-xs font-bold text-[#161616] uppercase tracking-wider">
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
                    {car.brand} {car.model} {car.version || ''} ({car.year}) - {car.status} - {formatCurrency(car.sale_price, car.sale_currency || 'USD')}
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

          {/* Selector de Fotos Disponibles */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
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
                  <span>{isDownloadingCarousel ? 'Descargando...' : 'Descargar carrusel completo'}</span>
                </Button>
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      carouselSlideIndex === idx
                        ? 'bg-[#161616] text-white border-[#161616]'
                        : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616]'
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
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all relative cursor-pointer ${
                      selectedImage === img
                        ? 'border-[#D7141A] ring-2 ring-[#D7141A]/30 scale-95'
                        : 'border-[#E5E5E3] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center text-xs text-[#6B6B6B]">
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
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:bg-white focus:border-[#161616] focus:outline-none font-mono"
              />
            </div>

            {/* Si es Antes y Después, selector de segunda foto */}
            {selectedTemplateId === 'detailing-antes-despues' && (
              <div className="pt-2 border-t border-[#E5E5E3] space-y-2">
                <label className="text-[11px] font-bold text-[#161616] uppercase tracking-wider block">
                  Foto del "DESPUÉS" (Mitad inferior)
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

          {/* Edición de Textos y Precios */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>3. Personalizar textos y valores</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Titular / Modelo
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Subtítulo / Versión / Año
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] focus:bg-white focus:border-[#161616] focus:outline-none"
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
                  onChange={(e) => setPrice(e.target.value)}
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
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ej: USD 21.000"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#6B6B6B] line-through focus:bg-white focus:border-[#161616] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-[#6B6B6B] font-semibold block mb-1">
                  Texto del sello central
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  placeholder="Ej: VENDIDO, RESERVADO, OFERTA"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-[#161616] uppercase font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
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
            </div>
          </div>

          {/* Copy y Texto para Instagram con Botón Copiar */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E5E3] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
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
            layoutConfig={format === 'story' ? currentTemplateConfig?.layout_story : currentTemplateConfig?.layout_post}
            onSaveToHistory={handleSaveToHistory}
            suggestedFileName={headline.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          />
        </div>

      </div>
    </div>
  );
};

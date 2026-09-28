import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Download,
  Share2,
  BookmarkCheck,
  RotateCcw,
  Eye,
  Shield,
  Move,
  Type,
  Palette,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Check,
  Layers,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import {
  SocialMediaFormat,
  LogoPosition,
  FormatLayoutConfig,
  CanvasTextElement,
  TextBackgroundType,
  TemplateFontFamily
} from '../../../types';
import {
  renderSocialCanvas,
  exportCanvasToBlob,
  downloadBlob,
  shareCanvasImage,
  RenderCanvasOptions,
  getDefaultTextElements
} from '../services/socialCanvasEngine';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';

export interface SocialCanvasPreviewProps {
  format: SocialMediaFormat;
  onFormatChange: (f: SocialMediaFormat) => void;
  templateId: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  headline?: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  specs?: string[];
  stampText?: string;
  layoutConfig?: FormatLayoutConfig;
  coverPlate: boolean;
  onCoverPlateChange: (val: boolean) => void;
  platePosition: { x: number; y: number; scale: number };
  onPlatePositionChange: (pos: { x: number; y: number; scale: number }) => void;
  imagePan: { x: number; y: number; zoom: number };
  onImagePanChange: (pan: { x: number; y: number; zoom: number }) => void;
  logoPosition: LogoPosition;
  instagramHandle: string;
  locationName: string;
  badgeTag?: string;
  inspectionHighlights?: string[];
  detailingServices?: string[];
  onSaveToHistory: (thumbnailData: string) => void;
  suggestedFileName: string;
  // Soporte interactivo para elementos de texto independientes
  textElements?: CanvasTextElement[];
  onTextElementsChange?: (elements: CanvasTextElement[]) => void;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
}

const BRAND_PALETTE = [
  { name: 'Negro', value: '#000000', border: false },
  { name: 'Blanco', value: '#FFFFFF', border: true },
  { name: 'Rojo CARVLAK', value: '#D7141A', border: false },
  { name: 'Gris oscuro', value: '#222222', border: false },
  { name: 'Gris medio', value: '#6B6B6B', border: false },
  { name: 'Gris claro', value: '#E5E5E3', border: false },
  { name: 'Amarillo Oferta', value: '#EAB308', border: false }
];

export const SocialCanvasPreview: React.FC<SocialCanvasPreviewProps> = ({
  format,
  onFormatChange,
  templateId,
  imageUrl,
  secondaryImageUrl,
  headline,
  subtitle,
  price,
  originalPrice,
  specs,
  stampText,
  layoutConfig,
  coverPlate,
  onCoverPlateChange,
  platePosition,
  onPlatePositionChange,
  imagePan,
  onImagePanChange,
  logoPosition,
  instagramHandle,
  locationName,
  badgeTag,
  inspectionHighlights,
  detailingServices,
  onSaveToHistory,
  suggestedFileName,
  textElements: externalTextElements,
  onTextElementsChange: externalOnTextElementsChange,
  selectedElementId: externalSelectedElementId,
  onSelectElement: externalOnSelectElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  const [isRendering, setIsRendering] = useState(false);
  const [showPlateControls, setShowPlateControls] = useState(false);
  const [showPanControls, setShowPanControls] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  // Estado interno para elementos si el padre no los maneja directamente
  const [internalElements, setInternalElements] = useState<CanvasTextElement[]>(() =>
    getDefaultTextElements(templateId, format, {
      carTitle: headline,
      price,
      originalPrice,
      stampText,
      subtitle
    })
  );

  const activeElements = externalTextElements || internalElements;
  const updateElements = externalOnTextElementsChange || setInternalElements;

  // Estado de elemento seleccionado y arrastre
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const activeSelectedId = externalSelectedElementId !== undefined ? externalSelectedElementId : internalSelectedId;
  const setSelectedId = externalOnSelectElement || setInternalSelectedId;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
  const [showSnapCenterGuide, setShowSnapCenterGuide] = useState(false);

  // Elemento activo actual
  const activeElement = useMemo(
    () => activeElements.find((el) => el.id === activeSelectedId) || null,
    [activeElements, activeSelectedId]
  );

  // Dimensiones del canvas
  const canvasLogicalWidth = 1080;
  const canvasLogicalHeight = format === 'story' ? 1920 : 1350;

  // Sincronizar elementos si cambian los datos base (headline, precio, sello) y no fueron personalizados
  useEffect(() => {
    if (!externalTextElements) {
      setInternalElements(
        getDefaultTextElements(templateId, format, {
          carTitle: headline,
          price,
          originalPrice,
          stampText,
          subtitle
        })
      );
    }
  }, [templateId, format, headline, price, originalPrice, stampText, subtitle, externalTextElements]);

  // Configuración de render combinada
  const effectiveLayoutConfig = useMemo<FormatLayoutConfig>(() => {
    const base = layoutConfig || {
      backgroundMode: 'full_photo',
      backgroundColor: '#0a0a0a',
      vignetteOpacity: 0.85,
      logoVersion: 'blanco',
      logoPosition: 'top-left',
      coverPlateDefault: false,
      showStamp: true,
      fontFamily: 'Archivo Narrow',
      showPrice: true,
      showOriginalPrice: false,
      specsSelection: [],
      specsOrder: []
    };

    return {
      ...base,
      textElements: activeElements
    };
  }, [layoutConfig, activeElements]);

  // Renderizado del Canvas 2D
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRendering(true);

    const options: RenderCanvasOptions = {
      format,
      templateId,
      imageUrl,
      secondaryImageUrl,
      headline,
      subtitle,
      price,
      originalPrice,
      specs,
      stampText,
      coverPlate,
      platePosition,
      imagePan,
      logoPosition,
      instagramHandle,
      locationName,
      badgeTag,
      inspectionHighlights,
      detailingServices,
      layoutConfig: effectiveLayoutConfig,
      showSafeZones
    };

    renderSocialCanvas(canvas, options)
      .then(() => {
        if (active) setIsRendering(false);
      })
      .catch((err) => {
        console.error('Error rendering canvas:', err);
        if (active) setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [
    format,
    templateId,
    imageUrl,
    secondaryImageUrl,
    headline,
    subtitle,
    price,
    originalPrice,
    specs,
    stampText,
    coverPlate,
    platePosition,
    imagePan,
    logoPosition,
    instagramHandle,
    locationName,
    badgeTag,
    inspectionHighlights,
    detailingServices,
    effectiveLayoutConfig,
    showSafeZones
  ]);

  // Conversión de coordenadas de puntero a coordenadas lógicas (1080x1920 o 1080x1350)
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasLogicalWidth / rect.width;
      const scaleY = canvasLogicalHeight / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      return { x, y };
    },
    [canvasLogicalWidth, canvasLogicalHeight]
  );

  // Manejo de clic o inicio de arrastre en la vista previa
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Buscar si tocó sobre algún elemento visible (en orden inverso de capa)
    const reversed = [...activeElements].reverse();
    const hit = reversed.find((el) => {
      if (!el.visible || !el.text) return false;
      const textLen = el.text.length;
      const approxW = Math.max(80, textLen * el.fontSize * 0.6 + 40);
      const approxH = Math.max(50, el.fontSize * 1.3 + 24);

      let minX = el.x;
      let maxX = el.x + approxW;

      if (el.align === 'center') {
        minX = el.x - approxW / 2;
        maxX = el.x + approxW / 2;
      } else if (el.align === 'right') {
        minX = el.x - approxW;
        maxX = el.x;
      }

      const minY = el.y - approxH / 2;
      const maxY = el.y + approxH / 2;

      return x >= minX - 25 && x <= maxX + 25 && y >= minY - 25 && y <= maxY + 25;
    });

    if (hit) {
      setSelectedId(hit.id);
      setIsDragging(true);
      setDragStartPos({
        mouseX: x,
        mouseY: y,
        elemX: hit.x,
        elemY: hit.y
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      // Clic en fondo: deseleccionar
      setSelectedId(null);
    }
  };

  // Manejo de arrastre continuo con guías de alineación y centrado
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !activeElement) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const deltaX = x - dragStartPos.mouseX;
    const deltaY = y - dragStartPos.mouseY;

    let newX = Math.round(dragStartPos.elemX + deltaX);
    let newY = Math.round(dragStartPos.elemY + deltaY);

    // Guía y Snap al centro horizontal (540px)
    if (Math.abs(newX - 540) < 25) {
      newX = 540;
      setShowSnapCenterGuide(true);
    } else {
      setShowSnapCenterGuide(false);
    }

    // Límites seguros (Safe margins clamping para no salir de los bordes)
    const minSafeX = 60;
    const maxSafeX = 1020;
    const minSafeY = format === 'story' ? 250 : 80;
    const maxSafeY = format === 'story' ? 1750 : 1270;

    newX = Math.max(minSafeX, Math.min(maxSafeX, newX));
    newY = Math.max(minSafeY, Math.min(maxSafeY, newY));

    // Actualizar elemento
    updateElements(
      activeElements.map((el) => (el.id === activeElement.id ? { ...el, x: newX, y: newY } : el))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setShowSnapCenterGuide(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignorar si el puntero ya no está capturado
      }
    }
  };

  // Actualizador de propiedad para el elemento seleccionado
  const handleUpdateActiveElement = (updates: Partial<CanvasTextElement>) => {
    if (!activeElement) return;
    updateElements(
      activeElements.map((el) => (el.id === activeElement.id ? { ...el, ...updates } : el))
    );
  };

  // Botones de alineación rápida
  const handleQuickAlign = (alignType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!activeElement) return;

    if (alignType === 'left') {
      handleUpdateActiveElement({ x: 60, align: 'left' });
    } else if (alignType === 'center') {
      handleUpdateActiveElement({ x: 540, align: 'center' });
    } else if (alignType === 'right') {
      handleUpdateActiveElement({ x: 1020, align: 'right' });
    } else if (alignType === 'top') {
      handleUpdateActiveElement({ y: format === 'story' ? 300 : 160 });
    } else if (alignType === 'middle') {
      handleUpdateActiveElement({ y: format === 'story' ? 960 : 675 });
    } else if (alignType === 'bottom') {
      handleUpdateActiveElement({ y: format === 'story' ? 1620 : 1150 });
    }
  };

  // Descarga de imagen en alta resolución
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await exportCanvasToBlob(canvas);
      const filename = `${suggestedFileName}-${format}-${Date.now()}.png`;
      downloadBlob(blob, filename);
      showToast('Imagen descargada en alta resolución (1080px)', 'success');

      const thumb = canvas.toDataURL('image/jpeg', 0.6);
      onSaveToHistory(thumb);
    } catch {
      showToast('No se pudo exportar la imagen', 'error');
    }
  };

  // Compartir en Instagram
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const shared = await shareCanvasImage(
        canvas,
        headline || 'CARVLAK Group',
        `Publicación oficial de CARVLAK: ${headline || ''} | ${instagramHandle}`
      );
      if (shared) {
        showToast('Enviado al menú de compartir de tu dispositivo', 'success');
        const thumb = canvas.toDataURL('image/jpeg', 0.6);
        onSaveToHistory(thumb);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  // Guardar en historial
  const handleManualSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumb = canvas.toDataURL('image/jpeg', 0.6);
    onSaveToHistory(thumb);
    showToast('Guardado en historial de publicaciones', 'success');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-3.5">
      {/* Selector de formato: Historia (9:16) vs Publicación (4:5) */}
      <div className="flex items-center justify-between w-full bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
        <button
          type="button"
          onClick={() => onFormatChange('story')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            format === 'story'
              ? 'bg-white text-[#161616] shadow-xs'
              : 'text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <span className="w-2.5 h-3.5 border-2 border-current rounded-xs"></span>
          <span>Historia (9:16)</span>
        </button>

        <button
          type="button"
          onClick={() => onFormatChange('post')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            format === 'post'
              ? 'bg-white text-[#161616] shadow-xs'
              : 'text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <span className="w-3.5 h-3.5 border-2 border-current rounded-xs"></span>
          <span>Publicación (4:5)</span>
        </button>
      </div>

      {/* Contenedor del Canvas con Escala Proporcional Responsiva e Interactividad */}
      <div
        ref={containerRef}
        className="relative w-full flex items-center justify-center p-3 sm:p-4 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E3] shadow-xs overflow-hidden min-h-[440px]"
      >
        {isRendering && (
          <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex items-center justify-center text-[#161616] text-xs font-bold">
            <div className="animate-spin w-5 h-5 border-2 border-[#D7141A] border-t-transparent rounded-full mr-2"></div>
            Actualizando composición 1080px...
          </div>
        )}

        {/* Canvas envolvente interactivo con captura de puntero */}
        <div
          className={`relative overflow-hidden rounded-xl border border-[#E5E5E3] shadow-md transition-all duration-300 select-none cursor-pointer ${
            format === 'story' ? 'aspect-[9/16] max-h-[560px]' : 'aspect-[4/5] max-h-[510px]'
          }`}
          style={{ width: '100%', maxWidth: format === 'story' ? '315px' : '380px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas ref={canvasRef} className="w-full h-full object-contain block bg-[#161616]" />

          {/* Guía vertical de snap al centro (roja punteada) */}
          {showSnapCenterGuide && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-r-2 border-dashed border-[#D7141A] z-20 pointer-events-none -translate-x-1/2" />
          )}

          {/* Indicador visual de selección en el lienzo */}
          {activeElement && (
            <div
              className="absolute z-20 pointer-events-none border-2 border-dashed border-[#D7141A] bg-[#D7141A]/10 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
              style={{
                left: `${(activeElement.x / canvasLogicalWidth) * 100}%`,
                top: `${(activeElement.y / canvasLogicalHeight) * 100}%`,
                width: `${Math.max(60, (activeElement.text.length * activeElement.fontSize * 0.58 + 40) * (format === 'story' ? 315 / 1080 : 380 / 1080))}px`,
                height: `${Math.max(28, (activeElement.fontSize * 1.3 + 20) * (format === 'story' ? 560 / 1920 : 510 / 1350))}px`,
                transform: `translate(-50%, -50%) rotate(${activeElement.rotation || 0}deg)`
              }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#161616] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                {activeElement.label} (Arrastrá)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS EXTERNA (abajo del canvas, limpia, sin tapar la foto del vehículo) */}
      <div className="flex items-center justify-between w-full bg-white p-2 rounded-xl border border-[#E5E5E3] shadow-xs gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Ver u ocultar zonas seguras de Instagram (250px)"
          className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            showSafeZones
              ? 'bg-[#D7141A] text-white border-[#D7141A]'
              : 'bg-[#F5F5F4] text-[#161616] border-[#E5E5E3] hover:bg-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Zonas seguras (250px)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowPanControls(!showPanControls);
            setShowPlateControls(false);
          }}
          title="Ajustar encuadre y zoom de la foto"
          className={`flex-1 min-w-[100px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            showPanControls
              ? 'bg-[#161616] text-white border-[#161616]'
              : 'bg-[#F5F5F4] text-[#161616] border-[#E5E5E3] hover:bg-white'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Encuadre foto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            const next = !coverPlate;
            onCoverPlateChange(next);
            setShowPlateControls(next);
            setShowPanControls(false);
          }}
          title="Tapar matrícula con sello oficial CARVLAK"
          className={`flex-1 min-w-[105px] py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
            coverPlate
              ? 'bg-[#D7141A] text-white border-[#D7141A]'
              : 'bg-[#F5F5F4] text-[#161616] border-[#E5E5E3] hover:bg-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Tapar matrícula</span>
        </button>

        {activeElement && (
          <button
            type="button"
            onClick={() => handleQuickAlign('center')}
            title="Centrar horizontalmente el elemento seleccionado"
            className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-[#F5F5F4] hover:bg-[#E5E5E3] text-[#161616] border border-[#E5E5E3] flex items-center gap-1 cursor-pointer"
          >
            <AlignCenter className="w-3.5 h-3.5 text-[#D7141A]" />
            <span>Centrar</span>
          </button>
        )}
      </div>

      {/* DRAWER / BOTTOM SHEET DE EDICIÓN TOTAL DEL TEXTO SELECCIONADO */}
      {activeElement && (
        <div className="w-full bg-white rounded-xl border-2 border-[#D7141A] shadow-md p-4 text-xs space-y-3.5 animate-fade-in">
          {/* Cabecera del Drawer */}
          <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7141A]"></span>
              <span className="font-title font-bold text-sm text-[#161616]">
                Configurar: {activeElement.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] cursor-pointer"
              title="Cerrar panel de formato"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Contenido editable */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
              Contenido del texto
            </label>
            <input
              type="text"
              value={activeElement.text}
              onChange={(e) => handleUpdateActiveElement({ text: e.target.value })}
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] font-bold focus:bg-white focus:border-[#161616] focus:outline-none"
            />
          </div>

          {/* 2. Paleta de colores de marca + Selector libre */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#6B6B6B]">
                Color del texto
              </label>
              <span className="text-[10px] text-[#6B6B6B] font-mono">{activeElement.color}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {BRAND_PALETTE.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  onClick={() => handleUpdateActiveElement({ color: swatch.value })}
                  title={swatch.name}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer relative ${
                    swatch.border ? 'border border-[#D0D0CD]' : ''
                  } ${activeElement.color === swatch.value ? 'scale-110 ring-2 ring-[#D7141A]' : 'hover:scale-105'}`}
                  style={{ backgroundColor: swatch.value }}
                >
                  {activeElement.color === swatch.value && (
                    <Check
                      className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                        swatch.value === '#FFFFFF' || swatch.value === '#E5E5E3' ? 'text-[#161616]' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}

              {/* Selector de color libre nativo */}
              <label
                title="Color libre personalizado"
                className="w-7 h-7 rounded-lg border border-[#E5E5E3] flex items-center justify-center cursor-pointer hover:bg-[#F5F5F4] relative overflow-hidden"
              >
                <Palette className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <input
                  type="color"
                  value={activeElement.color}
                  onChange={(e) => handleUpdateActiveElement({ color: e.target.value })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 3. Tamaño de fuente (Deslizador + Campo numérico) */}
          <div>
            <div className="flex justify-between items-center text-[11px] text-[#6B6B6B] mb-1">
              <span className="font-semibold">Tamaño de fuente</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="16"
                  max="120"
                  value={activeElement.fontSize}
                  onChange={(e) =>
                    handleUpdateActiveElement({ fontSize: Math.max(16, Math.min(120, parseInt(e.target.value) || 20)) })
                  }
                  className="w-14 text-center bg-[#F5F5F4] border border-[#E5E5E3] rounded-md px-1 py-0.5 text-xs text-[#161616] font-bold"
                />
                <span>px</span>
              </div>
            </div>
            <input
              type="range"
              min="16"
              max="110"
              step="2"
              value={activeElement.fontSize}
              onChange={(e) => handleUpdateActiveElement({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-[#D7141A] cursor-pointer"
            />
          </div>

          {/* 4. Peso tipográfico & Rotación */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Peso */}
            <div>
              <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
                Grosor del texto
              </label>
              <div className="flex rounded-lg border border-[#E5E5E3] overflow-hidden bg-[#F5F5F4]">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveElement({ fontWeight: 'normal' })}
                  className={`flex-1 py-1 text-[11px] font-normal cursor-pointer transition-colors ${
                    activeElement.fontWeight === 'normal' ? 'bg-white font-bold text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveElement({ fontWeight: 'semibold' })}
                  className={`flex-1 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                    activeElement.fontWeight === 'semibold' ? 'bg-white font-bold text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
                  }`}
                >
                  Semi
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveElement({ fontWeight: 'bold' })}
                  className={`flex-1 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    activeElement.fontWeight === 'bold' || activeElement.fontWeight === 'black'
                      ? 'bg-white font-black text-[#D7141A] shadow-xs'
                      : 'text-[#6B6B6B]'
                  }`}
                >
                  Negrita
                </button>
              </div>
            </div>

            {/* Rotación con botón reset a 0° */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mb-1">
                <span className="font-semibold">Inclinación</span>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveElement({ rotation: 0 })}
                  className="text-[10px] text-[#D7141A] hover:underline font-bold cursor-pointer"
                >
                  Volver a 0°
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={activeElement.rotation || 0}
                  onChange={(e) => handleUpdateActiveElement({ rotation: parseInt(e.target.value) })}
                  className="w-full accent-[#D7141A] cursor-pointer"
                />
                <span className="text-[11px] font-mono w-7 text-right text-[#161616]">
                  {activeElement.rotation || 0}°
                </span>
              </div>
            </div>
          </div>

          {/* 5. Ubicación y Alineación rápida */}
          <div>
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
              Alineación y ubicación rápida
            </label>
            <div className="grid grid-cols-6 gap-1">
              <button
                type="button"
                onClick={() => handleQuickAlign('left')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#161616] cursor-pointer flex flex-col items-center"
              >
                <span>Izq</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAlign('center')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#D7141A] cursor-pointer flex flex-col items-center"
              >
                <span>Centro</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAlign('right')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#161616] cursor-pointer flex flex-col items-center"
              >
                <span>Der</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAlign('top')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#161616] cursor-pointer flex flex-col items-center"
              >
                <span>Arriba</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAlign('middle')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#161616] cursor-pointer flex flex-col items-center"
              >
                <span>Medio</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAlign('bottom')}
                className="py-1 px-1.5 rounded-lg border border-[#E5E5E3] bg-[#F5F5F4] hover:bg-white text-[11px] font-bold text-[#161616] cursor-pointer flex flex-col items-center"
              >
                <span>Abajo</span>
              </button>
            </div>
          </div>

          {/* 6. Fondo opcional: sin fondo, franja o recuadro */}
          <div className="pt-1">
            <label className="text-[11px] font-semibold text-[#6B6B6B] block mb-1">
              Fondo del elemento
            </label>
            <div className="flex rounded-lg border border-[#E5E5E3] overflow-hidden bg-[#F5F5F4] mb-2">
              <button
                type="button"
                onClick={() => handleUpdateActiveElement({ bgType: 'none' })}
                className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                  activeElement.bgType === 'none' ? 'bg-white font-bold text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
                }`}
              >
                Sin fondo
              </button>
              <button
                type="button"
                onClick={() => handleUpdateActiveElement({ bgType: 'box' })}
                className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                  activeElement.bgType === 'box' ? 'bg-white font-bold text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
                }`}
              >
                Recuadro
              </button>
              <button
                type="button"
                onClick={() => handleUpdateActiveElement({ bgType: 'banner' })}
                className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                  activeElement.bgType === 'banner' ? 'bg-white font-bold text-[#161616] shadow-xs' : 'text-[#6B6B6B]'
                }`}
              >
                Franja completa
              </button>
            </div>

            {activeElement.bgType !== 'none' && (
              <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                <div>
                  <label className="text-[10px] text-[#6B6B6B] font-semibold block mb-1">Color de fondo</label>
                  <div className="flex items-center gap-1.5">
                    {['#000000', '#D7141A', '#222222', '#FFFFFF'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleUpdateActiveElement({ bgColor: col })}
                        className={`w-6 h-6 rounded-md border cursor-pointer ${
                          activeElement.bgColor === col ? 'ring-2 ring-[#D7141A]' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                    <input
                      type="color"
                      value={activeElement.bgColor || '#000000'}
                      onChange={(e) => handleUpdateActiveElement({ bgColor: e.target.value })}
                      className="w-6 h-6 rounded-md cursor-pointer border border-[#D0D0CD]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#6B6B6B] font-semibold mb-1">
                    <span>Opacidad fondo</span>
                    <span>{Math.round((activeElement.bgOpacity || 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={activeElement.bgOpacity ?? 0.85}
                    onChange={(e) => handleUpdateActiveElement({ bgOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-[#D7141A] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Visibilidad & Botón de Listo */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E3]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#161616]">
              <input
                type="checkbox"
                checked={activeElement.visible}
                onChange={(e) => handleUpdateActiveElement({ visible: e.target.checked })}
                className="w-4 h-4 rounded-sm accent-[#D7141A]"
              />
              <span>Mostrar en la composición</span>
            </label>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="px-3 py-1 rounded-lg bg-[#161616] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* PANEL DE AJUSTES DESPLEGABLES: ENCUADRE Y ZOOM */}
      {showPanControls && (
        <div className="w-full p-4 bg-white rounded-xl border border-[#E5E5E3] shadow-xs text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-title font-bold text-[#161616] flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>Ajuste de encuadre y zoom</span>
            </span>
            <button
              type="button"
              onClick={() => onImagePanChange({ x: 0, y: 0, zoom: 1 })}
              className="text-[11px] text-[#6B6B6B] hover:text-[#161616] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Restablecer
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[#6B6B6B] text-[11px] mb-1">
              <span>Zoom</span>
              <span>{(imagePan.zoom * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={imagePan.zoom}
              onChange={(e) => onImagePanChange({ ...imagePan, zoom: parseFloat(e.target.value) })}
              className="w-full accent-[#D7141A] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[#6B6B6B] text-[11px] mb-1">
                <span>Mover horizontal</span>
                <span>{imagePan.x}px</span>
              </div>
              <input
                type="range"
                min="-400"
                max="400"
                step="10"
                value={imagePan.x}
                onChange={(e) => onImagePanChange({ ...imagePan, x: parseInt(e.target.value) })}
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[#6B6B6B] text-[11px] mb-1">
                <span>Mover vertical</span>
                <span>{imagePan.y}px</span>
              </div>
              <input
                type="range"
                min="-600"
                max="600"
                step="10"
                value={imagePan.y}
                onChange={(e) => onImagePanChange({ ...imagePan, y: parseInt(e.target.value) })}
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* PANEL DE AJUSTES DESPLEGABLES: TAPAR MATRÍCULA */}
      {showPlateControls && coverPlate && (
        <div className="w-full p-4 bg-white rounded-xl border border-[#E5E5E3] shadow-xs text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-title font-bold text-[#161616] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>Posición del sello de matrícula</span>
            </span>
            <button
              type="button"
              onClick={() => onCoverPlateChange(false)}
              className="text-[11px] text-[#6B6B6B] hover:text-[#D7141A] cursor-pointer"
            >
              Quitar sello
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">
                Horizontal (X)
              </label>
              <input
                type="range"
                min="100"
                max="980"
                step="10"
                value={platePosition.x}
                onChange={(e) =>
                  onPlatePositionChange({ ...platePosition, x: parseInt(e.target.value) })
                }
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">
                Vertical (Y)
              </label>
              <input
                type="range"
                min="300"
                max={format === 'story' ? 1800 : 1250}
                step="10"
                value={platePosition.y}
                onChange={(e) =>
                  onPlatePositionChange({ ...platePosition, y: parseInt(e.target.value) })
                }
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">
                Tamaño
              </label>
              <input
                type="range"
                min="0.6"
                max="2.0"
                step="0.1"
                value={platePosition.scale}
                onChange={(e) =>
                  onPlatePositionChange({ ...platePosition, scale: parseFloat(e.target.value) })
                }
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* BOTONERA PRINCIPAL: Compartir y Descargar (UN SOLO BOTÓN PRIMARIO ROJO) */}
      <div className="w-full space-y-2 pt-1">
        <Button
          type="button"
          variant="primary"
          onClick={handleShare}
          className="w-full h-11 justify-center shadow-md text-xs font-title font-bold uppercase tracking-wider"
        >
          <Share2 className="w-4 h-4 mr-1" />
          <span>Compartir en Instagram {format === 'story' ? 'Stories (9:16)' : 'Feed (4:5)'}</span>
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownload}
            className="w-full h-10 justify-center text-xs"
          >
            <Download className="w-4 h-4 text-[#6B6B6B]" />
            <span>Descargar HD</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleManualSave}
            className="w-full h-10 justify-center text-xs"
          >
            <BookmarkCheck className="w-4 h-4 text-[#6B6B6B]" />
            <span>Guardar pieza</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

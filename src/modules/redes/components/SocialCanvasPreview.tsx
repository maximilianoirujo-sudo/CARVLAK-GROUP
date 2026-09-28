import React, { useRef, useEffect, useState } from 'react';
import {
  Download,
  Share2,
  BookmarkCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Shield,
  Move
} from 'lucide-react';
import { SocialMediaFormat, LogoPosition, FormatLayoutConfig } from '../../../types';
import {
  renderSocialCanvas,
  exportCanvasToBlob,
  downloadBlob,
  shareCanvasImage,
  RenderCanvasOptions
} from '../services/socialCanvasEngine';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';

interface SocialCanvasPreviewProps {
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
}

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
  suggestedFileName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { showToast } = useToast();
  const [isRendering, setIsRendering] = useState(false);
  const [showPlateControls, setShowPlateControls] = useState(false);
  const [showPanControls, setShowPanControls] = useState(false);

  // Renderizar canvas cada vez que cambien los datos o parámetros
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
      layoutConfig
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
    layoutConfig
  ]);

  // Manejador de descarga PNG
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await exportCanvasToBlob(canvas);
      const filename = `${suggestedFileName}-${format}-${Date.now()}.png`;
      downloadBlob(blob, filename);
      showToast('Imagen descargada en alta resolución (1080px)', 'success');

      // Generar miniatura y guardar automáticamente en historial
      const thumb = canvas.toDataURL('image/jpeg', 0.6);
      onSaveToHistory(thumb);
    } catch (err) {
      showToast('No se pudo exportar la imagen', 'error');
    }
  };

  // Manejador de compartir móvil
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const shared = await shareCanvasImage(
        canvas,
        headline || 'CARVLAK Group',
        `Publicación de CARVLAK: ${headline || ''} | ${instagramHandle}`
      );
      if (shared) {
        showToast('Enviado al menú de compartir de tu dispositivo', 'success');
        const thumb = canvas.toDataURL('image/jpeg', 0.6);
        onSaveToHistory(thumb);
      } else {
        // Fallback a descarga si no soporta Web Share
        handleDownload();
      }
    } catch (err) {
      handleDownload();
    }
  };

  // Guardar manualmente en historial
  const handleManualSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumb = canvas.toDataURL('image/jpeg', 0.6);
    onSaveToHistory(thumb);
    showToast('Guardado en historial de publicaciones', 'success');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4">
      {/* Selector de formato: Historia vs Publicación */}
      <div className="flex items-center justify-between w-full bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3]">
        <button
          type="button"
          onClick={() => onFormatChange('story')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            format === 'story'
              ? 'bg-white text-[#161616] shadow-sm'
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
              ? 'bg-white text-[#161616] shadow-sm'
              : 'text-[#6B6B6B] hover:text-[#161616]'
          }`}
        >
          <span className="w-3.5 h-3.5 border-2 border-current rounded-xs"></span>
          <span>Post Feed (1:1)</span>
        </button>
      </div>

      {/* Contenedor del Canvas con Escala Proporcional Responsiva */}
      <div className="relative w-full flex items-center justify-center p-4 bg-[#F5F5F4] rounded-2xl border border-[#E5E5E3] shadow-sm overflow-hidden min-h-[460px]">
        {isRendering && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center text-[#161616] text-xs font-bold">
            <div className="animate-spin w-5 h-5 border-2 border-[#D7141A] border-t-transparent rounded-full mr-2"></div>
            Generando composición 1080px...
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-xl border border-[#E5E5E3] shadow-md transition-all duration-300 ${
            format === 'story' ? 'aspect-[9/16] max-h-[560px]' : 'aspect-[4/5] max-h-[510px]'
          }`}
          style={{ width: '100%', maxWidth: format === 'story' ? '315px' : '380px' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-[#161616]"
          />
        </div>

        {/* Acciones flotantes rápidas sobre la vista previa */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
          <button
            type="button"
            title="Ajustar encuadre y zoom"
            onClick={() => {
              setShowPanControls(!showPanControls);
              setShowPlateControls(false);
            }}
            className={`p-2 rounded-lg border backdrop-blur-md shadow-sm transition-all cursor-pointer ${
              showPanControls
                ? 'bg-[#D7141A] text-white border-[#D7141A]'
                : 'bg-white/90 text-[#161616] border-[#E5E5E3] hover:bg-white'
            }`}
          >
            <Move className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Tapar matrícula"
            onClick={() => {
              const next = !coverPlate;
              onCoverPlateChange(next);
              setShowPlateControls(next);
              setShowPanControls(false);
            }}
            className={`p-2 rounded-lg border backdrop-blur-md shadow-sm transition-all cursor-pointer ${
              coverPlate
                ? 'bg-[#D7141A] text-white border-[#D7141A]'
                : 'bg-white/90 text-[#161616] border-[#E5E5E3] hover:bg-white'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Desplegable: Controles de Encuadre & Zoom */}
      {showPanControls && (
        <div className="w-full p-4 bg-white rounded-xl border border-[#E5E5E3] shadow-sm text-xs space-y-3 animate-fade-in">
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
              onChange={(e) =>
                onImagePanChange({ ...imagePan, zoom: parseFloat(e.target.value) })
              }
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
                onChange={(e) =>
                  onImagePanChange({ ...imagePan, x: parseInt(e.target.value) })
                }
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
                onChange={(e) =>
                  onImagePanChange({ ...imagePan, y: parseInt(e.target.value) })
                }
                className="w-full accent-[#D7141A] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Panel Desplegable: Controles de Tapar Matrícula */}
      {showPlateControls && coverPlate && (
        <div className="w-full p-4 bg-white rounded-xl border border-[#E5E5E3] shadow-sm text-xs space-y-3 animate-fade-in">
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
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">Horizontal (X)</label>
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
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">Vertical (Y)</label>
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
              <label className="text-[10px] text-[#6B6B6B] uppercase font-bold block mb-1">Tamaño</label>
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

      {/* Botonera Principal: Descargar y Compartir (UN SOLO BOTÓN PRIMARIO ROJO) */}
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

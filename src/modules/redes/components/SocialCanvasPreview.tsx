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
import { SocialMediaFormat, SocialMediaTemplateId, LogoPosition } from '../../../types';
import {
  renderSocialCanvas,
  exportCanvasToBlob,
  downloadBlob,
  shareCanvasImage,
  RenderCanvasOptions
} from '../services/socialCanvasEngine';
import { useToast } from '../../../context/ToastContext';

interface SocialCanvasPreviewProps {
  format: SocialMediaFormat;
  onFormatChange: (f: SocialMediaFormat) => void;
  templateId: SocialMediaTemplateId;
  imageUrl?: string;
  secondaryImageUrl?: string;
  headline?: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  specs?: string[];
  stampText?: string;
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
      detailingServices
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
    detailingServices
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
      <div className="flex items-center justify-between w-full bg-[#141414] p-1.5 rounded-2xl border border-[#2A2A2A]">
        <button
          type="button"
          onClick={() => onFormatChange('story')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            format === 'story'
              ? 'bg-[#D7141A] text-white shadow-md'
              : 'text-[#8A8A8A] hover:text-white'
          }`}
        >
          <span className="w-2.5 h-4 border-2 border-current rounded-sm"></span>
          <span>Historia (1080×1920)</span>
        </button>

        <button
          type="button"
          onClick={() => onFormatChange('post')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            format === 'post'
              ? 'bg-[#D7141A] text-white shadow-md'
              : 'text-[#8A8A8A] hover:text-white'
          }`}
        >
          <span className="w-3.5 h-4 border-2 border-current rounded-sm"></span>
          <span>Publicación (1080×1350)</span>
        </button>
      </div>

      {/* Contenedor del Canvas con Escala Proporcional Responsiva */}
      <div className="relative w-full flex items-center justify-center p-3 bg-black/60 rounded-3xl border border-[#2A2A2A] shadow-2xl overflow-hidden min-h-[460px]">
        {isRendering && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold">
            <div className="animate-spin w-6 h-6 border-2 border-[#D7141A] border-t-transparent rounded-full mr-2"></div>
            Generando composición 1080px...
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-2xl border border-[#2A2A2A] shadow-lg transition-all duration-300 ${
            format === 'story' ? 'aspect-[9/16] max-h-[560px]' : 'aspect-[4/5] max-h-[510px]'
          }`}
          style={{ width: '100%', maxWidth: format === 'story' ? '315px' : '380px' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-[#0a0a0a]"
          />
        </div>

        {/* Acciones flotantes rápidas sobre la vista previa */}
        <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-10">
          <button
            type="button"
            title="Ajustar encuadre y zoom"
            onClick={() => {
              setShowPanControls(!showPanControls);
              setShowPlateControls(false);
            }}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              showPanControls
                ? 'bg-[#D7141A] text-white border-[#D7141A]'
                : 'bg-black/70 text-white/90 border-[#2A2A2A] hover:text-white'
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
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              coverPlate
                ? 'bg-[#D7141A] text-white border-[#D7141A]'
                : 'bg-black/70 text-white/90 border-[#2A2A2A] hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Desplegable: Controles de Encuadre & Zoom */}
      {showPanControls && (
        <div className="w-full p-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#D7141A]" />
              Ajuste de Encuadre y Zoom
            </span>
            <button
              type="button"
              onClick={() => onImagePanChange({ x: 0, y: 0, zoom: 1 })}
              className="text-[11px] text-[#8A8A8A] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Restablecer
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[#8A8A8A] text-[11px] mb-1">
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
              <div className="flex justify-between text-[#8A8A8A] text-[11px] mb-1">
                <span>Mover Horizontal</span>
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
              <div className="flex justify-between text-[#8A8A8A] text-[11px] mb-1">
                <span>Mover Vertical</span>
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
        <div className="w-full p-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] text-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D7141A]" />
              Posición del Sello de Matrícula
            </span>
            <button
              type="button"
              onClick={() => onCoverPlateChange(false)}
              className="text-[11px] text-[#8A8A8A] hover:text-[#D7141A] cursor-pointer"
            >
              Quitar Sello
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">Horizontal (X)</label>
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
              <label className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">Vertical (Y)</label>
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
              <label className="text-[10px] text-[#8A8A8A] uppercase font-bold block mb-1">Tamaño</label>
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

      {/* Botonera Principal: Descargar y Compartir */}
      <div className="w-full grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="py-3 px-4 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar PNG</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-3 px-4 rounded-xl bg-black hover:bg-[#1f1f1f] text-white border border-[#2A2A2A] hover:border-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-[#D7141A]" />
          <span>Compartir</span>
        </button>
      </div>

      {/* Guardar en Historial sin descargar */}
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={handleManualSave}
          className="text-xs text-[#8A8A8A] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Guardar en historial de piezas</span>
        </button>
      </div>
    </div>
  );
};

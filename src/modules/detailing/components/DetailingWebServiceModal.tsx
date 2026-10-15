import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Video,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
  ListOrdered,
  Eye,
  Image as ImageIcon,
  Star,
  Upload,
  Percent,
  Tag,
  ArrowRight,
  AlertTriangle,
  Play
} from 'lucide-react';
import { DetailingTariff, DetailingTariffBeforeAfter } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { VideoEmbed } from '../../../components/common/VideoEmbed';
import { uploadImageToStorage, uploadVideoToStorage } from '../../../lib/storage';

interface DetailingWebServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: DetailingTariff | null;
}

export const DetailingWebServiceModal: React.FC<DetailingWebServiceModalProps> = ({
  isOpen,
  onClose,
  service
}) => {
  const { addDetailingTariff, updateDetailingTariff, detailingTariffs } = useData();
  const { showToast } = useToast();

  const isEditing = Boolean(service);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState<number>(3);
  const [careText, setCareText] = useState('');

  // Category & Badge
  const [category, setCategory] = useState<string>('Interior');
  const [badge, setBadge] = useState<string>('');

  // Price Mode & Promo
  const [priceType, setPriceType] = useState<'fixed' | 'from' | 'consult'>('fixed');
  const [promoPrice, setPromoPrice] = useState<number | ''>('');
  const [promoExpiresAt, setPromoExpiresAt] = useState<string>('');

  // Prices per Size
  const [priceChico, setPriceChico] = useState<number>(0);
  const [priceMediano, setPriceMediano] = useState<number>(0);
  const [priceSuv, setPriceSuv] = useState<number>(0);
  const [pricePickup, setPricePickup] = useState<number>(0);
  const [priceMoto, setPriceMoto] = useState<number>(0);

  // Steps & Products lists
  const [steps, setSteps] = useState<string[]>([]);
  const [newStepText, setNewStepText] = useState('');

  const [products, setProducts] = useState<string[]>([]);
  const [newProductText, setNewProductText] = useState('');

  // Media
  const [videoUrl, setVideoUrl] = useState('');
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);

  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Before / After images
  const [beforeAfterImages, setBeforeAfterImages] = useState<DetailingTariffBeforeAfter[]>([]);
  const [beforeInputUrl, setBeforeInputUrl] = useState('');
  const [afterInputUrl, setAfterInputUrl] = useState('');
  const [beforeAfterLabel, setBeforeAfterLabel] = useState('');
  const [isUploadingBA, setIsUploadingBA] = useState(false);

  // Cross-selling ("Sumale también...")
  const [suggestedServiceIds, setSuggestedServiceIds] = useState<string[]>([]);

  // Status
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // File Inputs
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  // Populate when modal opens or service changes
  useEffect(() => {
    if (service) {
      setName(service.name || '');
      setShortName(service.shortName || '');
      setDescription(service.description || '');
      setDurationHours(service.durationHours || 3);
      setCareText(service.care_text || '');
      setCategory(service.category || 'Interior');
      setBadge(service.badge || '');
      setPriceType(service.price_type || 'fixed');
      setPromoPrice(service.promo_price !== undefined ? service.promo_price : '');
      setPromoExpiresAt(service.promo_expires_at || '');
      setPriceChico(service.prices?.chico || 0);
      setPriceMediano(service.prices?.mediano || 0);
      setPriceSuv(service.prices?.suv || 0);
      setPricePickup(service.prices?.pickup || 0);
      setPriceMoto(service.prices?.moto || 0);
      setSteps(service.included_steps ? [...service.included_steps] : []);
      setProducts(service.products_used ? [...service.products_used] : []);
      setVideoUrl(service.video_url || '');
      setIsVideoUploaded(Boolean(service.is_video_uploaded));
      setCoverImageUrl(service.cover_image_url || '');
      setBeforeAfterImages(service.before_after_images ? [...service.before_after_images] : []);
      setSuggestedServiceIds(service.suggested_service_ids ? [...service.suggested_service_ids] : []);
      setIsActive(service.isActive !== false);
      setIsFeatured(Boolean(service.is_featured));
    } else {
      setName('');
      setShortName('');
      setDescription('');
      setDurationHours(3);
      setCareText('');
      setCategory('Interior');
      setBadge('');
      setPriceType('fixed');
      setPromoPrice('');
      setPromoExpiresAt('');
      setPriceChico(2500);
      setPriceMediano(3000);
      setPriceSuv(3800);
      setPricePickup(4500);
      setPriceMoto(1800);
      setSteps([]);
      setProducts([]);
      setVideoUrl('');
      setIsVideoUploaded(false);
      setCoverImageUrl('');
      setBeforeAfterImages([]);
      setSuggestedServiceIds([]);
      setIsActive(true);
      setIsFeatured(false);
    }
    setNewStepText('');
    setNewProductText('');
    setVideoWarning(null);
  }, [service, isOpen]);

  // Lock body scroll and hide floating button
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden', 'modal-open-hide-fab');
      return () => {
        document.body.classList.remove('overflow-hidden', 'modal-open-hide-fab');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add Step
  const handleAddStep = () => {
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    setSteps((prev) => [...prev, trimmed]);
    setNewStepText('');
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Product
  const handleAddProduct = () => {
    const trimmed = newProductText.trim();
    if (!trimmed) return;
    setProducts((prev) => [...prev, trimmed]);
    setNewProductText('');
  };

  const handleRemoveProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const url = await uploadImageToStorage(file, 'quotes', { maxWidth: 1200, quality: 0.85 });
      setCoverImageUrl(url);
      showToast('Foto de portada subida con éxito', 'success');
    } catch {
      showToast('Error al subir la imagen', 'error');
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  // Video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo supera los 50MB. Seleccioná un video más corto o comprimilo antes de subir.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setVideoWarning('El video pesa más de 25MB. Podría demorar un poco en reproducir en celulares con conexión lenta.');
    } else {
      setVideoWarning(null);
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(15);

    try {
      const url = await uploadVideoToStorage(file, (percent) => {
        setVideoUploadProgress(percent);
      });
      setVideoUrl(url);
      setIsVideoUploaded(true);
      showToast('Video time-lapse subido con éxito a Supabase Storage', 'success');
    } catch (err: any) {
      alert(`No se pudo subir el video: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(null);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Before / After upload pair
  const handleAddBeforeAfterPair = () => {
    if (!beforeInputUrl.trim() || !afterInputUrl.trim()) {
      showToast('Ingresá ambas fotos (Antes y Después)', 'error');
      return;
    }
    setBeforeAfterImages((prev) => [
      ...prev,
      {
        id: `ba-${Date.now()}`,
        before_url: beforeInputUrl.trim(),
        after_url: afterInputUrl.trim(),
        label: beforeAfterLabel.trim() || undefined
      }
    ]);
    setBeforeInputUrl('');
    setAfterInputUrl('');
    setBeforeAfterLabel('');
  };

  const handleRemoveBeforeAfter = (index: number) => {
    setBeforeAfterImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Service
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Ingresá el nombre del servicio', 'error');
      return;
    }

    const pricesPayload = {
      chico: Number(priceChico) || 0,
      mediano: Number(priceMediano) || 0,
      suv: Number(priceSuv) || 0,
      pickup: Number(pricePickup) || 0,
      moto: Number(priceMoto) || 0
    };

    const tariffPayload: Partial<DetailingTariff> = {
      name: name.trim(),
      shortName: shortName.trim() || name.trim().slice(0, 30),
      description: description.trim(),
      durationHours: Number(durationHours) || 3,
      care_text: careText.trim(),
      category: category.trim() || 'Interior',
      badge: badge.trim() || undefined,
      price_type: priceType,
      promo_price: promoPrice !== '' ? Number(promoPrice) : undefined,
      promo_expires_at: promoExpiresAt.trim() || undefined,
      prices: pricesPayload,
      included_steps: steps,
      products_used: products,
      video_url: videoUrl.trim(),
      is_video_uploaded: isVideoUploaded,
      cover_image_url: coverImageUrl.trim(),
      before_after_images: beforeAfterImages,
      suggested_service_ids: suggestedServiceIds,
      isActive,
      is_featured: isFeatured
    };

    if (isEditing && service) {
      updateDetailingTariff(service.id, tariffPayload, isActive);
      showToast(`Servicio "${name}" actualizado con éxito`, 'success');
    } else {
      addDetailingTariff(tariffPayload as Omit<DetailingTariff, 'id'>);
      showToast(`Servicio "${name}" creado con éxito`, 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-[#161616] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-[#2D2D2D] text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[#2D2D2D] bg-[#1A1A1A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-[#3B82F6] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {isEditing ? 'Editar Servicio Web' : 'Nuevo Servicio Web'}
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400">
                Se mostrará en el armador de presupuestos online DetailVlak
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-sm">
            {/* 1. Información Principal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                <Sparkles className="w-4 h-4" />
                <span>1. Información Principal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Nombre del servicio (largo / completo) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Limpieza profunda integral de interiores a vapor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Nombre corto (para tarjetas y chips)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Interior integral"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>

              {/* Categoría y Etiqueta (Badge) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Categoría del Servicio</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#0066FF]"
                  >
                    <option value="Interior">Interior (Tapizados & Habitáculo)</option>
                    <option value="Exterior">Exterior (Lavado técnico & Descontaminado)</option>
                    <option value="Protección">Protección & Sellados Cerámicos</option>
                    <option value="Pulido">Pulido & Corrección de Pintura</option>
                    <option value="Motor">Motor & Chasis</option>
                    <option value="Ópticas">Restauración de Ópticas</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Etiqueta Opcional (Badge visual)</span>
                  </label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#0066FF]"
                  >
                    <option value="">Ninguna</option>
                    <option value="Más elegido">Más elegido 🔥</option>
                    <option value="Nuevo">Nuevo ✨</option>
                    <option value="Promo">Promo 🏷️</option>
                    <option value="Recomendado">Recomendado 💎</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Descripción para el cliente
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explicá de forma atractiva qué resultado logra este tratamiento..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Duración (hs)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Cuidados posteriores & recomendación (visible en comprobante y PDF)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: No mojar en las primeras 48hs. Lavar solo con shampoo pH neutro."
                  value={careText}
                  onChange={(e) => setCareText(e.target.value)}
                  className="w-full bg-[#202020] border border-[#333] rounded-xl p-3 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                />
              </div>
            </div>

            {/* 2. Tipo de Precio & Promoción */}
            <div className="space-y-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                <DollarSign className="w-4 h-4" />
                <span>2. Modalidad de Precio & Oferta</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Tipo de precio
                  </label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as any)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#0066FF]"
                  >
                    <option value="fixed">Precio Fijo exacto</option>
                    <option value="from">Precio "Desde $X"</option>
                    <option value="consult">A consultar al ver el auto</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Precio Promocional tachado ($ UYU)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 2800 (opcional)"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Fecha vencimiento de promo
                  </label>
                  <input
                    type="date"
                    value={promoExpiresAt}
                    onChange={(e) => setPromoExpiresAt(e.target.value)}
                    className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Precios por Tamaño de Auto */}
            <div className="space-y-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                  <DollarSign className="w-4 h-4" />
                  <span>Precios en Pesos Uruguayos ($UYU) por Tamaño</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Misma lista de precios para todo el taller
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-[#202020] p-3 rounded-xl border border-[#333]">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Chico</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      value={priceChico}
                      onChange={(e) => setPriceChico(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#444] rounded-lg pl-6 pr-2 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="bg-[#202020] p-3 rounded-xl border border-[#333]">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Mediano</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      value={priceMediano}
                      onChange={(e) => setPriceMediano(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#444] rounded-lg pl-6 pr-2 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="bg-[#202020] p-3 rounded-xl border border-[#333]">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">SUV / Rural</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      value={priceSuv}
                      onChange={(e) => setPriceSuv(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#444] rounded-lg pl-6 pr-2 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="bg-[#202020] p-3 rounded-xl border border-[#333]">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Pick-up</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      value={pricePickup}
                      onChange={(e) => setPricePickup(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#444] rounded-lg pl-6 pr-2 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div className="bg-[#202020] p-3 rounded-xl border border-[#333] col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-neutral-400 block mb-1">Moto</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      value={priceMoto}
                      onChange={(e) => setPriceMoto(Number(e.target.value))}
                      className="w-full bg-[#161616] border border-[#444] rounded-lg pl-6 pr-2 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Video Time-Lapse (Subida o Link) */}
            <div className="space-y-4 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                  <Video className="w-4 h-4" />
                  <span>4. Video Time-Lapse Vertical</span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Subí archivo MP4 o pegá un enlace
                </span>
              </div>

              {/* Contenedor de Subida de Video */}
              <div className="p-4 rounded-xl bg-[#202020] border border-[#333] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Subir archivo de video (vertical para celular)</span>
                    <span className="text-[11px] text-neutral-400">
                      Límite máximo 50MB (Recomendado &lt; 25MB para reproducción instantánea).
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />

                  <button
                    type="button"
                    disabled={isUploadingVideo}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingVideo ? 'Subiendo video...' : 'Subir video desde mi celular / compu'}</span>
                  </button>
                </div>

                {/* Barra de progreso si está subiendo */}
                {isUploadingVideo && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Subiendo a Supabase Storage...</span>
                      <span className="font-mono">{videoUploadProgress || 20}%</span>
                    </div>
                    <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0066FF] h-full transition-all duration-300"
                        style={{ width: `${videoUploadProgress || 20}%` }}
                      />
                    </div>
                  </div>
                )}

                {videoWarning && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{videoWarning}</span>
                  </div>
                )}

                {/* Alternativa URL directa */}
                <div className="pt-2 border-t border-[#2D2D2D] space-y-1">
                  <label className="text-[11px] text-neutral-400">O pegar link de YouTube / Shorts / Instagram Reel:</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... o https://instagram.com/reel/..."
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setIsVideoUploaded(false);
                    }}
                    className="w-full bg-[#161616] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>

                {/* Vista previa en vivo del video */}
                {videoUrl && (
                  <div className="mt-3 p-3 bg-[#161616] rounded-xl border border-[#2D2D2D] space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Vista previa del video:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('');
                          setIsVideoUploaded(false);
                        }}
                        className="text-neutral-400 hover:text-red-400 text-xs"
                      >
                        Quitar video
                      </button>
                    </div>

                    <div className="max-w-xs mx-auto rounded-xl overflow-hidden border border-[#333]">
                      {videoUrl.includes('.mp4') || videoUrl.includes('supabase.co/storage') ? (
                        <video
                          src={videoUrl}
                          controls
                          playsInline
                          className="w-full max-h-72 object-cover bg-black"
                        />
                      ) : (
                        <VideoEmbed url={videoUrl} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Foto de Portada con Subida */}
              <div className="p-4 rounded-xl bg-[#202020] border border-[#333] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Foto de Portada del Servicio</span>
                    <span className="text-[11px] text-neutral-400">
                      Se muestra en la tarjeta del catálogo antes de reproducir el video.
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={coverFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />

                  <button
                    type="button"
                    disabled={isUploadingCover}
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#333] text-neutral-200 text-xs font-bold flex items-center gap-2 cursor-pointer border border-[#444] transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingCover ? 'Subiendo...' : 'Subir foto desde celular / compu'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="O pegar URL de imagen: https://..."
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="flex-1 bg-[#161616] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                  {coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-400"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                {coverImageUrl && (
                  <div className="w-32 h-20 rounded-lg overflow-hidden border border-[#444]">
                    <img src={coverImageUrl} alt="Portada" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* 5. Fotos Antes / Después */}
            <div className="space-y-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                  <ImageIcon className="w-4 h-4" />
                  <span>5. Fotos Antes / Después (Resultados Reales)</span>
                </div>
                <span className="text-[11px] text-neutral-400">{beforeAfterImages.length} comparaciones</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#202020] border border-[#333] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="url"
                    placeholder="URL foto ANTES: https://..."
                    value={beforeInputUrl}
                    onChange={(e) => setBeforeInputUrl(e.target.value)}
                    className="bg-[#161616] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                  <input
                    type="url"
                    placeholder="URL foto DESPUÉS: https://..."
                    value={afterInputUrl}
                    onChange={(e) => setAfterInputUrl(e.target.value)}
                    className="bg-[#161616] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Etiqueta (ej. Butaca)"
                      value={beforeAfterLabel}
                      onChange={(e) => setBeforeAfterLabel(e.target.value)}
                      className="flex-1 bg-[#161616] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBeforeAfterPair}
                      className="px-3 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      + Sumar
                    </button>
                  </div>
                </div>

                {beforeAfterImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {beforeAfterImages.map((ba, idx) => (
                      <div key={idx} className="p-2.5 bg-[#161616] rounded-xl border border-[#333] flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <img src={ba.before_url} alt="Antes" className="w-12 h-12 rounded object-cover border border-red-500/40" />
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                          <img src={ba.after_url} alt="Después" className="w-12 h-12 rounded object-cover border border-emerald-500/40" />
                          {ba.label && <span className="font-semibold text-neutral-300 ml-1">{ba.label}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBeforeAfter(idx)}
                          className="p-1 text-neutral-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6. Pasos y Productos */}
            <div className="space-y-4 pt-2 border-t border-[#2D2D2D]">
              {/* Pasos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                    <ListOrdered className="w-4 h-4" />
                    <span>6. Qué Incluye (Pasos detallados)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{steps.length} pasos añadidos</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Inyección y extracción de tapizados con vapor a 140°C..."
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    className="flex-1 bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {steps.length > 0 && (
                  <div className="space-y-1.5 bg-[#1F1F1F] p-3 rounded-xl border border-[#2D2D2D] max-h-48 overflow-y-auto">
                    {steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-[#252525] rounded-lg border border-[#333] text-xs"
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#0066FF]/20 text-[#3B82F6] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-neutral-200 break-words">{st}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-neutral-400 hover:text-red-400 rounded-md hover:bg-neutral-800 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Productos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                    <Package className="w-4 h-4" />
                    <span>Productos & Insumos Utilizados</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{products.length} productos</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Koch Chemie Pol Star / Gyeon Q² Pure EVO..."
                    value={newProductText}
                    onChange={(e) => setNewProductText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProduct();
                      }
                    }}
                    className="flex-1 bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-hidden focus:border-[#0066FF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {products.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 bg-[#1F1F1F] p-3 rounded-xl border border-[#2D2D2D]">
                    {products.map((p, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#282828] border border-[#3A3A3A] text-neutral-200 text-xs"
                      >
                        <span>{p}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="text-neutral-400 hover:text-red-400 transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 7. "Sumale también…" (Cross-sell) */}
            <div className="space-y-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                  <Sparkles className="w-4 h-4" />
                  <span>7. "Sumale también…" (Sugerencias al agregar)</span>
                </div>
                <span className="text-[11px] text-neutral-400">{suggestedServiceIds.length} sugeridos</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Elegí qué tratamientos se le sugerirán al cliente cuando seleccione este servicio en el armador.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#202020] p-3 rounded-xl border border-[#333] max-h-48 overflow-y-auto">
                {detailingTariffs
                  .filter((t) => !service || t.id !== service.id)
                  .map((t) => {
                    const isChecked = suggestedServiceIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-[#0066FF]/15 border-[#0066FF] text-white' : 'bg-[#181818] border-[#2E2E2E] text-neutral-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSuggestedServiceIds((prev) => [...prev, t.id]);
                            } else {
                              setSuggestedServiceIds((prev) => prev.filter((id) => id !== t.id));
                            }
                          }}
                          className="rounded text-[#0066FF] focus:ring-0"
                        />
                        <span className="truncate">{t.shortName || t.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* 8. Opciones de Publicación & Destacado */}
            <div className="space-y-3 pt-2 border-t border-[#2D2D2D]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                <Sparkles className="w-4 h-4" />
                <span>8. Estado de Publicación</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Switch Activo */}
                <div
                  onClick={() => setIsActive(!isActive)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-[#202020] border-[#333] opacity-70'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-white">
                      {isActive ? 'Servicio Activo' : 'Servicio Pausado'}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {isActive ? 'Visible en el armador público' : 'Oculto para los clientes'}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {isActive ? <Check className="w-3.5 h-3.5" /> : null}
                  </div>
                </div>

                {/* Switch Destacado */}
                <div
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isFeatured
                      ? 'bg-amber-950/20 border-amber-800/60'
                      : 'bg-[#202020] border-[#333]'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-white flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${isFeatured ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'}`} />
                      <span>Marcar como Destacado</span>
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Resalta con insignia en el armador
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      isFeatured ? 'bg-amber-600 text-white' : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {isFeatured ? <Check className="w-3.5 h-3.5" /> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons - Siempre visibles en celular y desktop */}
          <div className="shrink-0 p-3.5 sm:p-4 border-t border-[#2D2D2D] bg-[#1A1A1A] flex items-center justify-end gap-2.5 safe-bottom z-10 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold transition-all shadow-lg shadow-[#0066FF]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Servicio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

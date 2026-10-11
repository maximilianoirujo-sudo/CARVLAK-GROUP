import React, { useState } from 'react';
import {
  X,
  Car,
  DollarSign,
  Clock,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Edit,
  ArrowRight,
  History,
  Globe,
  Copy,
  RefreshCw,
  Search,
  Inbox,
  Settings,
  Lock,
  Handshake,
  Zap,
  Check
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipPrepChecklist
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';
import { DealershipConfirmStatusDialog } from './DealershipConfirmStatusDialog';

interface DealershipVehicleDetailDrawerProps {
  vehicle: DealershipVehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: DealershipVehicle) => void;
  onOpenSaleModal: (vehicle: DealershipVehicle) => void;
  onOpenPublicCatalog: () => void;
}

export const DealershipVehicleDetailDrawer: React.FC<DealershipVehicleDetailDrawerProps> = ({
  vehicle,
  isOpen,
  onClose,
  onEdit,
  onOpenSaleModal,
  onOpenPublicCatalog
}) => {
  const {
    updateDealershipVehicle,
    updateDealershipVehicleStatus,
    duplicateDealershipVehicle,
    canEditDealershipStock,
    inspections,
    detailingQuotes,
    createPosventaDetailingQuote,
    dealershipConfig,
    syncVehicleWithTiendanube
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [isSyncingTiendanube, setIsSyncingTiendanube] = useState(false);

  const isAdmin = profile?.roles.includes('admin');
  const canEdit = canEditDealershipStock(profile?.roles);

  // Escuchar tecla Escape para cerrar drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState<'detalle' | 'historial'>('detalle');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetStatusPending, setTargetStatusPending] = useState<DealershipVehicleStatus | null>(null);

  const handleDuplicate = () => {
    if (!canEdit) {
      showToast('No tenés permisos para duplicar vehículos', 'error');
      return;
    }
    const dup = duplicateDealershipVehicle(vehicle.id);
    if (dup) {
      showToast(`Vehículo duplicado: ${dup.brand} ${dup.model}`, 'success');
      onClose();
    }
  };

  const handleRequestStatusChange = (newStatus: DealershipVehicleStatus) => {
    if (!canEdit) {
      showToast('No tenés permisos para cambiar el estado de vehículos', 'error');
      return;
    }
    if (newStatus === vehicle.status) return;
    setTargetStatusPending(newStatus);
    setConfirmModalOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (targetStatusPending) {
      updateDealershipVehicleStatus(vehicle.id, targetStatusPending);
      showToast(`Estado cambiado a ${targetStatusPending}`, 'success');
      setConfirmModalOpen(false);
      setTargetStatusPending(null);
    }
  };

  const handleSyncTiendanube = async () => {
    if (!vehicle) return;
    setIsSyncingTiendanube(true);
    try {
      await syncVehicleWithTiendanube(vehicle, 'sync');
      showToast('Sincronización con Tiendanube iniciada', 'info');
    } catch (e: any) {
      showToast(e?.message || 'Error al sincronizar con Tiendanube', 'error');
    } finally {
      setIsSyncingTiendanube(false);
    }
  };

  // Estado activo de imagen
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Formulario de costos reales adicionales (Admin Only)
  const [repairsCost, setRepairsCost] = useState<number>(vehicle?.repairs_cost || 0);
  const [paperworkCost, setPaperworkCost] = useState<number>(vehicle?.paperwork_cost || 0);
  const [otherExpensesCost, setOtherExpensesCost] = useState<number>(vehicle?.other_expenses_cost || 0);

  // Sincronizar estado cuando el vehículo cambia (Point 5)
  React.useEffect(() => {
    if (vehicle) {
      setRepairsCost(vehicle.repairs_cost || 0);
      setPaperworkCost(vehicle.paperwork_cost || 0);
      setOtherExpensesCost(vehicle.other_expenses_cost || 0);
      setSelectedImageIndex(0);
      setActiveTab('detalle');
    }
  }, [vehicle?.id, vehicle?.repairs_cost, vehicle?.paperwork_cost, vehicle?.other_expenses_cost]);

  // Inspección asociada de Fase 3
  const linkedInspection = vehicle
    ? (vehicle.inspection_id
        ? inspections.find((i) => i.id === vehicle.inspection_id)
        : inspections.find((i) => vehicle.plate && i.vehicle_plate.toUpperCase() === vehicle.plate.toUpperCase()))
    : undefined;

  // Detailing asociado de Fase 2
  const linkedDetailing = vehicle
    ? (vehicle.detailing_quote_id
        ? detailingQuotes.find((q) => q.id === vehicle.detailing_quote_id)
        : detailingQuotes.find((q) => vehicle.plate && q.vehicle_plate?.toUpperCase() === vehicle.plate.toUpperCase()))
    : undefined;

  const daysInStock = vehicle
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(vehicle.purchase_date || vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const imagesList = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : [];
  const currentImage = imagesList[selectedImageIndex] || vehicle?.cover_image;

  // Toggle de Checklist de Alistamiento
  const handleToggleChecklist = (key: keyof DealershipPrepChecklist) => {
    const currentChecklist = vehicle.prep_checklist || {
      inspection_done: false,
      repairs_done: false,
      detailing_done: false,
      photos_done: false,
      docs_done: false
    };

    const updatedChecklist = {
      ...currentChecklist,
      [key]: !currentChecklist[key]
    };

    updateDealershipVehicle(vehicle.id, {
      prep_checklist: updatedChecklist
    });
    showToast('Checklist de alistamiento actualizado', 'success');
  };

  // Guardar costos adicionales (Admin)
  const handleSaveCosts = () => {
    updateDealershipVehicle(vehicle.id, {
      repairs_cost: Number(repairsCost),
      paperwork_cost: Number(paperworkCost),
      other_expenses_cost: Number(otherExpensesCost)
    });
    showToast('Costos reales y margen recalculados', 'success');
  };

  // Publicar directamente si alistamiento está listo
  const handlePublishVehicle = () => {
    updateDealershipVehicleStatus(vehicle.id, 'publicado');
    showToast('¡Vehículo publicado con éxito en el Catálogo Web!', 'success');
  };

  // Generar cupón de Detailing Posventa con 20% OFF
  const handleCreatePosventaCoupon = () => {
    const quoteId = createPosventaDetailingQuote(vehicle.id);
    if (quoteId) {
      showToast('¡Cotización posventa creada con 20% OFF en DetailVlak!', 'success');
    }
  };

  // Compartir ficha por WhatsApp
  const handleShareWhatsApp = () => {
    const priceFormatted = formatCurrency(vehicle.sale_price, vehicle.sale_currency || 'USD');
    const kmFormatted = `${vehicle.mileage.toLocaleString('es-UY')} km`;
    const text = encodeURIComponent(
      `🚗 *${vehicle.brand} ${vehicle.model} ${vehicle.version || ''} (${vehicle.year})*\n` +
      `📌 *Precio:* ${priceFormatted}\n` +
      `⏱️ *Kilometraje:* ${kmFormatted}\n` +
      `⛽ *Combustible:* ${vehicle.fuel} | 🕹️ *Caja:* ${vehicle.transmission}\n` +
      `🌐 Mirá las fotos y ficha en: https://carvlak-group.vercel.app/?catalogo=autos#${vehicle.plate}\n` +
      `📱 Consultá directamente con CARVLAK Automotora.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const prep = vehicle?.prep_checklist || {
    inspection_done: false,
    repairs_done: false,
    detailing_done: false,
    photos_done: false,
    docs_done: false
  };

  const prepScore = [
    prep.inspection_done,
    prep.repairs_done,
    prep.detailing_done,
    prep.photos_done,
    prep.docs_done
  ].filter(Boolean).length;

  const deliveryChecklist = vehicle?.delivery_checklist || {
    completed: false,
    items: [
      { id: 'del-1', label: 'Inspección visual de arribo y estado de carrocería', done: true },
      { id: 'del-2', label: 'Batería de tracción cargada (mínimo 90%)', done: true },
      { id: 'del-3', label: 'Retiro de plásticos protectores y embalajes de fábrica', done: false },
      { id: 'del-4', label: 'Kit de carga doméstica, manuales y duplicado de llave', done: true },
      { id: 'del-5', label: 'Colocación de matrículas de empadronamiento y libreta', done: false },
      { id: 'del-6', label: 'Explicación técnica de funciones y entrega formal', done: false }
    ]
  };

  const deliveryScore = deliveryChecklist.items.filter((i) => i.done).length;

  const handleToggleDeliveryItem = (itemId: string) => {
    if (!vehicle) return;
    const updatedItems = deliveryChecklist.items.map((it) =>
      it.id === itemId ? { ...it, done: !it.done } : it
    );
    const allDone = updatedItems.every((it) => it.done);
    updateDealershipVehicle(vehicle.id, {
      delivery_checklist: {
        completed: allDone,
        items: updatedItems
      }
    });
    showToast('Checklist de entrega 0km actualizado', 'success');
  };

  // Detectar qué datos faltan específicamente (Point 3)
  const missingDataFields = React.useMemo(() => {
    if (!vehicle) return [];
    const missing: string[] = [];
    if (!vehicle.plate && vehicle.condition === 'usado') missing.push('Matrícula');
    if (!vehicle.chassis_vin) missing.push('Padrón / VIN');
    if (!vehicle.purchase_price || vehicle.purchase_price === 0) missing.push('Precio de compra');
    if (!vehicle.supplier_name) missing.push('Proveedor u origen');
    if (!vehicle.color_exterior) missing.push('Color');
    if (!vehicle.transmission) missing.push('Transmisión');
    return missing;
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl h-full bg-white border-l border-[#E5E5E3] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] text-center">
                {vehicle.plate || (vehicle.chassis_vin ? `VIN: ${vehicle.chassis_vin.slice(-8)}` : '0KM')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-title font-bold uppercase text-center bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                {vehicle.condition === '0km' ? '0km' : 'Usado'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-title font-bold text-[#161616] leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.version || ''}
              </h2>
              <div className="text-[11px] text-[#6B6B6B] flex items-center gap-2 flex-wrap">
                <span>Año {vehicle.year}</span>
                <span>•</span>
                <span>{vehicle.mileage.toLocaleString('es-UY')} km</span>
                {vehicle.autonomy_km ? (
                  <>
                    <span>•</span>
                    <span className="text-[#161616] font-semibold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-[#161616]" />
                      <span>{vehicle.autonomy_km.toLocaleString('es-UY')} km</span>
                    </span>
                  </>
                ) : null}
                <span>•</span>
                <span>{vehicle.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(vehicle)}
                className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                title="Editar Ficha"
                aria-label="Editar ficha"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
                title="Duplicar Vehículo"
                aria-label="Duplicar vehículo"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <Button
              variant="whatsapp"
              size="sm"
              onClick={handleShareWhatsApp}
              title="Compartir Ficha por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-[#161616]" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
            <button
              onClick={onClose}
              aria-label="Cerrar ficha de vehículo"
              className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs del Drawer con Línea Roja */}
        <div className="flex items-center gap-6 px-6 border-b border-[#E5E5E3] bg-white pt-2 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`pb-2.5 font-bold transition-all border-b-2 ${
              activeTab === 'detalle'
                ? 'border-[#D7141A] text-[#161616]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            Ficha y alistamiento
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'historial'
                ? 'border-[#D7141A] text-[#161616]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de cambios ({vehicle.history?.length || 0})</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'detalle' ? (
            <>
              {/* Banner de Datos Incompletos */}
              {vehicle.incomplete_data && (
                <div className="p-4 rounded-xl bg-[#FEF7EC] border border-[#F59E0B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#161616]">
                  <div className="flex items-start sm:items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#945B0E] shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <div className="text-xs font-bold text-[#945B0E]">Ficha con datos internos pendientes</div>
                      <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                        {missingDataFields.length > 0 ? (
                          <span>Faltan completar: <strong className="text-[#161616]">{missingDataFields.join(', ')}</strong>.</span>
                        ) : (
                          'Completá precio de compra, proveedor y documentación para cerrar la rentabilidad de esta unidad.'
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onEdit(vehicle)}
                    className="shrink-0 self-end sm:self-auto"
                  >
                    Completar ficha
                  </Button>
                </div>
              )}

              {/* Portada & Galería */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-[#F5F5F4] border border-[#E5E5E3] aspect-video shadow-sm">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#9A9A9A] gap-2">
                      <Car className="w-16 h-16" />
                      <span className="text-xs font-bold">Sin fotos cargadas</span>
                    </div>
                  )}

                  {/* Badges Flotantes */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white/90 backdrop-blur-sm text-[#161616] border border-[#E5E5E3]">
                      {vehicle.status}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-white/90 backdrop-blur-sm text-[#161616] border border-[#E5E5E3] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#161616]" />
                      <span>{daysInStock} días en stock</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="text-lg font-title font-bold px-3.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-[#161616] border border-[#E5E5E3] shadow-md font-mono">
                      {formatCurrency(vehicle.sale_price, vehicle.sale_currency || 'USD')}
                    </span>
                  </div>
                </div>

                {/* Selector de Miniaturas */}
                {imagesList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {imagesList.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        aria-label={`Ver foto ${idx + 1}`}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-[#D7141A] ring-2 ring-[#D7141A]/30'
                            : 'border-[#E5E5E3] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stepper de Estados */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-3">
                <div className="text-[11px] font-semibold text-[#6B6B6B]">
                  Flujo de vida del vehículo
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                  {[
                    { id: 'evaluacion', label: '1. Evaluación', icon: Search },
                    { id: 'comprado', label: '2. Comprado', icon: Inbox },
                    { id: 'preparacion', label: '3. Preparación', icon: Settings },
                    { id: 'publicado', label: '4. Publicado', icon: Globe },
                    { id: 'reservado', label: '5. Reservado', icon: Lock },
                    { id: 'vendido', label: '6. Vendido', icon: Handshake }
                  ].map((st) => {
                    const isCurrent = vehicle.status === st.id;
                    const Icon = st.icon;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleRequestStatusChange(st.id as DealershipVehicleStatus)}
                        className={`p-2 rounded-lg text-[10px] font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#161616] text-white shadow-sm ring-1 ring-[#161616]'
                            : 'bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] border border-[#E5E5E3]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-[#6B6B6B]'}`} />
                        <span className="truncate w-full">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checklist de Preparación (Usados) o Entrega (0km) */}
              {vehicle.condition === '0km' ? (
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#D7141A]" />
                        <span>Checklist de Entrega 0km ({deliveryScore}/{deliveryChecklist.items.length})</span>
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Alistamiento y verificación de unidad 0km previa a la entrega al cliente final
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && deliveryScore >= 4 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePublishVehicle}
                      >
                        Publicar ahora
                      </Button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D7141A] transition-all duration-500"
                      style={{ width: `${(deliveryScore / deliveryChecklist.items.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {deliveryChecklist.items.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          item.done
                            ? 'bg-[#EEF7F2] border-[#22C55E]/30 text-[#161616]'
                            : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#6B6B6B] hover:border-[#D0D0CD]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDeliveryItem(item.id)}
                          className="mt-0.5 rounded border-[#E5E5E3] text-[#D7141A] focus:ring-0 accent-[#D7141A]"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-xs">{item.label}</div>
                        </div>
                        {item.done && <CheckCircle2 className="w-4 h-4 text-[#1E6B43] shrink-0" />}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#D7141A]" />
                        <span>Checklist de alistamiento ({prepScore}/5)</span>
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Completá los 5 pasos para habilitar la publicación automática en el catálogo
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && prepScore >= 4 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePublishVehicle}
                      >
                        Publicar ahora
                      </Button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D7141A] transition-all duration-500"
                      style={{ width: `${(prepScore / 5) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        key: 'inspection_done',
                        label: '1. Peritaje técnico / Evaluación de compra realizada',
                        desc: 'Revisión mecánica, estructural y valuación de ingreso'
                      },
                      {
                        key: 'detailing_done',
                        label: '2. Limpieza profunda y alistamiento (DetailVlak)',
                        desc: linkedDetailing
                          ? `Estado en taller: ${linkedDetailing.status}`
                          : 'Lavado interior y vano motor interno'
                      },
                      {
                        key: 'repairs_done',
                        label: '3. Reparaciones mecánicas / chapa terminadas',
                        desc: 'Mecánica ligera, frenos y fluidos en orden'
                      },
                      {
                        key: 'photos_done',
                        label: '4. Sesión de fotos HD para catálogo web',
                        desc: `${imagesList.length} fotos cargadas actualmente`
                      },
                      {
                        key: 'docs_done',
                        label: '5. Documentación y SUCIVE al día verificados',
                        desc: 'Libreta, títulos y libre deudas listos para transferir'
                      }
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] cursor-pointer hover:border-[#D0D0CD] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(prep[item.key as keyof DealershipPrepChecklist])}
                          onChange={() => handleToggleChecklist(item.key as keyof DealershipPrepChecklist)}
                          className="mt-0.5 rounded border-[#E5E5E3] text-[#D7141A] focus:ring-0 accent-[#D7141A]"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-[#161616] text-xs">{item.label}</div>
                          <div className="text-[11px] text-[#6B6B6B]">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluación de compra & Detailing alistamiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sección Evaluación de compra (preparada para integración futura) */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#161616] flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#D7141A]" />
                      <span>Evaluación de compra</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B]">
                      Pendiente de integración
                    </span>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F5F5F4] border border-dashed border-[#E5E5E3] text-center space-y-1">
                    <div className="text-xs font-semibold text-[#6B6B6B]">
                      Pendiente de integración
                    </div>
                    <p className="text-[11px] text-[#9A9A9A] leading-relaxed">
                      Etapa reservada para la app de evaluación de compra y peritaje de stock.
                    </p>
                  </div>
                </div>

                {/* Tarjeta Detailing */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#161616] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D7141A]" />
                      <span>Detailing alistamiento</span>
                    </span>
                    {linkedDetailing && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616]">
                        {linkedDetailing.status}
                      </span>
                    )}
                  </div>

                  {linkedDetailing ? (
                    <div>
                      <div className="text-xs font-bold text-[#161616]">
                        {linkedDetailing.selected_services.map((s) => s.serviceName).join(', ')}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] mt-1">
                        Costo interno taller: {formatCurrency(linkedDetailing.total_amount, 'UYU')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[#6B6B6B]">
                        Alistamiento estético en taller Shangrilá para dejar el auto impecable para la venta.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          updateDealershipVehicleStatus(vehicle.id, 'comprado');
                          showToast('Orden interna de detailing enviada a DetailVlak', 'success');
                        }}
                      >
                        + Crear detailing interno ({formatCurrency(2500, 'UYU')})
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* DESGLOSE FINANCIERO Y CONTROL DE MARGEN (SOLO ADMIN) */}
              {isAdmin ? (
                <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E5E5E3] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#D7141A]" />
                      <span className="text-xs font-bold text-[#161616]">
                        Desglose financiero y margen real
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                      ADMIN ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                      <div className="text-[10px] text-[#6B6B6B] font-bold">Precio compra</div>
                      <div className="text-sm font-bold text-[#161616] mt-0.5 font-mono">
                        {formatCurrency(vehicle.purchase_price, 'USD')}
                      </div>
                      <div className="text-[9px] text-[#6B6B6B]">T/C: {vehicle.exchange_rate || 43.5}</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                      <div className="text-[10px] text-[#6B6B6B] font-bold">Peritaje interno</div>
                      <div className="text-sm font-bold text-[#161616] mt-0.5 font-mono">
                        {formatCurrency(vehicle.inspection_cost || 1500, 'UYU')}
                      </div>
                      <div className="text-[9px] text-[#6B6B6B]">
                        ~USD {Math.round((vehicle.inspection_cost || 1500) / (vehicle.exchange_rate || 43.5))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                      <div className="text-[10px] text-[#6B6B6B] font-bold">Detailing interno</div>
                      <div className="text-sm font-bold text-[#161616] mt-0.5 font-mono">
                        {formatCurrency(vehicle.detailing_cost || 2500, 'UYU')}
                      </div>
                      <div className="text-[9px] text-[#6B6B6B]">
                        ~USD {Math.round((vehicle.detailing_cost || 2500) / (vehicle.exchange_rate || 43.5))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                      <div className="text-[10px] text-[#6B6B6B] font-bold">Piso negociación</div>
                      <div className="text-sm font-bold text-[#161616] mt-0.5 font-mono">
                        {formatCurrency(vehicle.min_acceptable_price || Math.round(vehicle.sale_price * 0.95), vehicle.sale_currency || 'USD')}
                      </div>
                      <div className="text-[9px] text-[#6B6B6B]">Mínimo aceptable</div>
                    </div>
                  </div>

                  {/* Modificación de Gastos de Taller y Trámites */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                        Reparaciones taller (USD)
                      </label>
                      <input
                        type="number"
                        value={repairsCost}
                        onChange={(e) => setRepairsCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616] focus:border-[#D7141A] outline-none font-mono"
                      />
                      <span className="text-[10px] text-[#8A8A8A] mt-0.5 block">
                        ~$U {Math.round(repairsCost * (vehicle.exchange_rate || 43.5)).toLocaleString('es-UY')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                        Trámites / Notaría (USD)
                      </label>
                      <input
                        type="number"
                        value={paperworkCost}
                        onChange={(e) => setPaperworkCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616] focus:border-[#D7141A] outline-none font-mono"
                      />
                      <span className="text-[10px] text-[#8A8A8A] mt-0.5 block">
                        ~$U {Math.round(paperworkCost * (vehicle.exchange_rate || 43.5)).toLocaleString('es-UY')}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                        Otros gastos (USD)
                      </label>
                      <input
                        type="number"
                        value={otherExpensesCost}
                        onChange={(e) => setOtherExpensesCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5E5E3] rounded-lg text-xs text-[#161616] focus:border-[#D7141A] outline-none font-mono"
                      />
                      <span className="text-[10px] text-[#8A8A8A] mt-0.5 block">
                        ~$U {Math.round(otherExpensesCost * (vehicle.exchange_rate || 43.5)).toLocaleString('es-UY')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveCosts}
                    >
                      Recalcular costo total
                    </Button>
                  </div>

                  {/* Cuenta por Pagar al Proveedor / Importador */}
                  {vehicle.supplier_payable && (
                    <div className="p-3.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-[#6B6B6B] font-semibold">
                          Cuenta por pagar al proveedor
                        </div>
                        <div className="font-semibold text-[#161616] text-sm mt-0.5">
                          {vehicle.supplier_payable.supplier_name}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B]">
                          Vence: {vehicle.supplier_payable.due_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#161616] font-mono">
                          {formatCurrency(vehicle.supplier_payable.amount, 'USD')}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          vehicle.supplier_payable.is_paid
                            ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#22C55E]/30'
                            : 'bg-[#FDF2F2] text-[#B80E14] border border-[#D7141A]/30'
                        }`}>
                          {vehicle.supplier_payable.is_paid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Totales y Margen Final */}
                  <div className="p-3.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-[#6B6B6B]">Costo real invertido</div>
                      <div className="text-base font-semibold text-[#161616] font-mono">
                        {formatCurrency(Math.round(vehicle.total_real_cost_usd || 0), 'USD')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-[#6B6B6B]">Margen bruto estimado</div>
                      <div
                        className={`text-base font-semibold font-mono ${
                          (vehicle.estimated_margin_usd || 0) >= 0 ? 'text-[#1E6B43]' : 'text-[#B80E14]'
                        }`}
                      >
                        +{formatCurrency(Math.round(vehicle.estimated_margin_usd || 0), 'USD')} (
                        {vehicle.estimated_margin_percent?.toFixed(1) || '0.0'}%)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-center text-xs text-[#6B6B6B] flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#9A9A9A]" />
                  <span>Los costos internos y márgenes están restringidos al rol Administrador.</span>
                </div>
              )}

              {/* Posventa: Si el auto está vendido o reservado */}
              {vehicle.status === 'vendido' && (
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#161616] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D7141A]" />
                      <span>Beneficio posventa CARVLAK</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDF2F2] border border-[#D7141A]/30 text-[#B80E14]">
                      20% OFF
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B]">
                    Fidelizá al cliente generando una cotización de sellado cerámico o tratamiento de interior con 20% OFF en DetailVlak Shangrilá.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleCreatePosventaCoupon}
                  >
                    <span>Generar cotización posventa (20% OFF)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Equipamiento Detallado */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#161616]">
                    Equipamiento y accesorios
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-[#1E6B43]" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sincronización Tiendanube */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E5E5E3] text-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#6B6B6B]" />
                    <div>
                      <span className="font-bold text-[#161616] block">Catálogo web y Tiendanube</span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        {vehicle.status === 'publicado' ? 'Visible en catálogo público' : 'No publicado (oculto)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge de Estado Tiendanube */}
                    {vehicle.tiendanube_sync_status === 'synced' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#EEF7F2] text-[#1E6B43] border border-[#CDE9D9] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sincronizado {vehicle.tiendanube_synced_at ? new Date(vehicle.tiendanube_synced_at).toLocaleDateString('es-UY') : ''}</span>
                      </span>
                    )}
                    {vehicle.tiendanube_sync_status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#FEF7EC] text-[#945B0E] border border-[#FADBA8] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Pendiente</span>
                      </span>
                    )}
                    {vehicle.tiendanube_sync_status === 'error' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#FDF2F2] text-[#B80E14] border border-[#FACDCD] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Error</span>
                      </span>
                    )}
                    {!vehicle.tiendanube_sync_status && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                        {vehicle.tiendanube_synced_at
                          ? `Sincronizado ${new Date(vehicle.tiendanube_synced_at).toLocaleDateString('es-UY')}`
                          : 'Listo para sincronizar'}
                      </span>
                    )}

                    {canEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSyncTiendanube}
                        disabled={isSyncingTiendanube}
                        className="inline-flex items-center gap-1.5 text-[11px] py-1 px-2.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingTiendanube ? 'animate-spin' : ''}`} />
                        <span>{isSyncingTiendanube ? 'Sincronizando...' : 'Sincronizar'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {vehicle.tiendanube_sync_error && (
                  <p className="text-[11px] text-[#B80E14] bg-[#FDF2F2] p-2 rounded-lg border border-[#FACDCD]">
                    Error Tiendanube: {vehicle.tiendanube_sync_error}
                  </p>
                )}
              </div>

              {/* Campos Personalizados */}
              {vehicle.custom_fields && Object.keys(vehicle.custom_fields).length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E3] space-y-2">
                  <div className="text-xs font-bold text-[#161616] uppercase tracking-wider">
                    Campos personalizados
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(vehicle.custom_fields).map(([key, val]) => {
                      const def = (dealershipConfig.custom_fields || []).find((f) => f.id === key);
                      const label = def?.name || key;
                      const displayVal = typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val);
                      return (
                        <div key={key} className="p-2.5 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                          <span className="text-[10px] text-[#6B6B6B] block font-medium">{label}</span>
                          <span className="font-bold text-[#161616] text-xs mt-0.5 block">{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Historial de Cambios */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-[#E5E5E3]">
                <h3 className="text-xs font-bold text-[#161616] uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-[#D7141A]" />
                  <span>Auditoría de modificaciones ({vehicle.history?.length || 0})</span>
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Registro detallado de cambios realizados sobre esta unidad: campo modificado, valor previo, nuevo valor, usuario y hora.
                </p>
              </div>

              {(!vehicle.history || vehicle.history.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-[#E5E5E3] rounded-xl text-[#6B6B6B] text-xs">
                  Aún no hay cambios registrados en el historial de este vehículo. Cada edición de precio, estado o ficha técnica quedará registrada aquí automáticamente.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vehicle.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E5E5E3] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[#6B6B6B]">
                        <span className="font-bold text-[#161616] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#D7141A]" />
                          {entry.field_label || entry.field}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6B6B]">
                          {new Date(entry.timestamp).toLocaleString('es-UY', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-[#F5F5F4] rounded-lg border border-[#E5E5E3] text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold">Valor anterior</span>
                          <span className="text-[#B80E14] font-mono line-through truncate block">
                            {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold">Nuevo valor</span>
                          <span className="text-[#161616] font-mono font-bold truncate block">
                            {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-[#6B6B6B] flex items-center justify-between">
                        <span>Modificado por: <strong className="text-[#161616]">{entry.user_name}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t border-[#E5E5E3] bg-white flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>

          {vehicle.status !== 'vendido' && (
            <Button
              variant="primary"
              onClick={() => onOpenSaleModal(vehicle)}
            >
              <DollarSign className="w-4 h-4" />
              <span>{vehicle.status === 'reservado' ? 'Liquidar venta' : 'Vender / seña'}</span>
            </Button>
          )}
        </div>

        {/* Modal de confirmación de cambio de estado */}
        {confirmModalOpen && (
          <DealershipConfirmStatusDialog
            isOpen={confirmModalOpen}
            vehicle={vehicle}
            targetStatus={targetStatusPending}
            onConfirm={handleConfirmStatusChange}
            onCancel={() => {
              setConfirmModalOpen(false);
              setTargetStatusPending(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

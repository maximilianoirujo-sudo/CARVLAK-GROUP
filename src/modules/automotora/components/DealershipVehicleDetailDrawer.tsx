import React, { useState } from 'react';
import {
  X,
  Car,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Share2,
  Edit,
  Tag,
  FileText,
  User,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Key,
  BadgeDollarSign,
  Copy,
  History,
  Globe
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipPrepChecklist
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
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
  if (!isOpen || !vehicle) return null;

  const {
    updateDealershipVehicle,
    updateDealershipVehicleStatus,
    duplicateDealershipVehicle,
    canEditDealershipStock,
    inspections,
    detailingQuotes,
    createPosventaDetailingQuote,
    dealershipConfig
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const canEdit = canEditDealershipStock(profile?.roles);

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

  // Estado activo de imagen
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Formulario de costos reales adicionales (Admin Only)
  const [repairsCost, setRepairsCost] = useState<number>(vehicle.repairs_cost || 0);
  const [paperworkCost, setPaperworkCost] = useState<number>(vehicle.paperwork_cost || 0);
  const [otherExpensesCost, setOtherExpensesCost] = useState<number>(vehicle.other_expenses_cost || 0);

  // Inspección asociada de Fase 3
  const linkedInspection = vehicle.inspection_id
    ? inspections.find((i) => i.id === vehicle.inspection_id)
    : inspections.find((i) => i.vehicle_plate.toUpperCase() === vehicle.plate.toUpperCase());

  // Detailing asociado de Fase 2
  const linkedDetailing = vehicle.detailing_quote_id
    ? detailingQuotes.find((q) => q.id === vehicle.detailing_quote_id)
    : detailingQuotes.find((q) => q.vehicle_plate?.toUpperCase() === vehicle.plate.toUpperCase());

  const daysInStock = Math.max(
    0,
    Math.floor((Date.now() - new Date(vehicle.purchase_date || vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24))
  );

  const imagesList = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
  const currentImage = imagesList[selectedImageIndex] || vehicle.cover_image;

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
    const phone = '59899267964';
    const text = encodeURIComponent(
      `🚗 *${vehicle.brand} ${vehicle.model} ${vehicle.version || ''} (${vehicle.year})*\n` +
      `📌 *Precio:* ${vehicle.sale_currency} ${vehicle.sale_price.toLocaleString()}\n` +
      `⏱️ *Kilometraje:* ${vehicle.mileage.toLocaleString()} km\n` +
      `⛽ *Combustible:* ${vehicle.fuel} | 🕹️ *Caja:* ${vehicle.transmission}\n` +
      `🌐 Mirá las fotos y ficha en: https://carvlak-group.vercel.app/?catalogo=autos#${vehicle.plate}\n` +
      `📱 Consultá directamente con CARVLAK Automotora.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const prep = vehicle.prep_checklist || {
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

  const deliveryChecklist = vehicle.delivery_checklist || {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-full bg-white dark:bg-[#161616] border-l border-[#D9D9D9] dark:border-[#2A2A2A] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center justify-between bg-[#F2F2F2] dark:bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-center">
                {vehicle.plate || (vehicle.chassis_vin ? `VIN: ${vehicle.chassis_vin.slice(-8)}` : '0KM')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-title font-bold uppercase text-center bg-white dark:bg-[#262626] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333]">
                {vehicle.condition === '0km' ? '0km' : 'Usado'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-title font-bold text-black dark:text-white leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.version || ''}
              </h2>
              <div className="text-[11px] text-[#6B6B6B] flex items-center gap-2 flex-wrap">
                <span>Año {vehicle.year}</span>
                <span>•</span>
                <span>{vehicle.mileage.toLocaleString()} km</span>
                {vehicle.autonomy_km ? (
                  <>
                    <span>•</span>
                    <span className="text-black dark:text-white font-bold">🔋 {vehicle.autonomy_km} km</span>
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
                className="p-2 rounded-md text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-[#2A2A2A] border border-transparent hover:border-[#D9D9D9] dark:hover:border-[#333333] transition-colors"
                title="Editar Ficha"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-md text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-[#2A2A2A] border border-transparent hover:border-[#D9D9D9] dark:hover:border-[#333333] transition-colors"
                title="Duplicar Vehículo"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-md text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-[#2A2A2A] border border-transparent hover:border-[#D9D9D9] dark:hover:border-[#333333] transition-colors"
              title="Compartir Ficha por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-[#6B6B6B] hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-[#2A2A2A] border border-transparent hover:border-[#D9D9D9] dark:hover:border-[#333333] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs del Drawer */}
        <div className="flex items-center gap-4 px-6 border-b border-[#D9D9D9] dark:border-[#2A2A2A] bg-white dark:bg-[#161616] pt-2 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`pb-2.5 font-title font-bold transition-all border-b-2 ${
              activeTab === 'detalle'
                ? 'border-[#D7141A] text-black dark:text-white'
                : 'border-transparent text-[#6B6B6B] hover:text-black dark:hover:text-white'
            }`}
          >
            Ficha &amp; Alistamiento
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-2.5 font-title font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'historial'
                ? 'border-[#D7141A] text-black dark:text-white'
                : 'border-transparent text-[#6B6B6B] hover:text-black dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Cambios ({vehicle.history?.length || 0})</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'detalle' ? (
            <>
              {/* Banner de Datos Incompletos */}
              {vehicle.incomplete_data && (
                <div className="p-4 rounded-lg bg-[#D7141A]/10 border border-[#D7141A] flex items-center justify-between gap-3 text-black dark:text-white">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#D7141A] shrink-0" />
                    <div>
                      <div className="text-xs font-title font-bold text-[#D7141A]">Ficha con datos internos pendientes</div>
                      <div className="text-[11px] text-[#6B6B6B]">
                        Completá precio de compra, proveedor y documentación para cerrar la rentabilidad de esta unidad.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(vehicle)}
                    className="px-3.5 py-1.5 rounded-md bg-[#D7141A] hover:bg-[#b50f14] text-white text-xs font-title font-bold shrink-0 transition-colors shadow-sm"
                  >
                    Completar Ficha
                  </button>
                </div>
              )}

              {/* Portada & Galería */}
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-[#F2F2F2] dark:bg-[#202020] border border-[#D9D9D9] dark:border-[#2A2A2A] aspect-video shadow-sm">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#6B6B6B] gap-2">
                      <Car className="w-16 h-16" />
                      <span className="text-xs font-bold">Sin fotos cargadas</span>
                    </div>
                  )}

                  {/* Badges Flotantes */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded text-xs font-title font-bold uppercase tracking-wider bg-black/80 backdrop-blur-sm text-white border border-white/20">
                      {vehicle.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-black/80 backdrop-blur-sm text-white border border-white/20 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white" />
                      <span>{daysInStock} días en stock</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="text-lg font-title font-bold px-3.5 py-1.5 rounded-md bg-black/90 backdrop-blur-sm text-white border border-white/20 shadow-lg">
                      USD {vehicle.sale_price.toLocaleString()}
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
                        className={`relative w-16 h-12 rounded-md overflow-hidden shrink-0 border transition-all ${
                          selectedImageIndex === idx
                            ? 'border-black dark:border-white ring-2 ring-black/30 dark:ring-white/30'
                            : 'border-[#D9D9D9] dark:border-[#2A2A2A] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stepper de Estados */}
              <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-3">
                <div className="text-[11px] font-title font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Flujo de Vida del Vehículo
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                  {[
                    { id: 'evaluacion', label: '1. Evaluación', icon: '🔍' },
                    { id: 'comprado', label: '2. Comprado', icon: '📥' },
                    { id: 'preparacion', label: '3. Preparación', icon: '⚙️' },
                    { id: 'publicado', label: '4. Publicado', icon: '🌐' },
                    { id: 'reservado', label: '5. Reservado', icon: '🔒' },
                    { id: 'vendido', label: '6. Vendido', icon: '🤝' }
                  ].map((st) => {
                    const isCurrent = vehicle.status === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleRequestStatusChange(st.id as DealershipVehicleStatus)}
                        className={`p-2 rounded-md text-[10px] font-title font-bold flex flex-col items-center gap-1 transition-all ${
                          isCurrent
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm ring-1 ring-black dark:ring-white'
                            : 'bg-white dark:bg-[#222222] text-[#6B6B6B] hover:text-black dark:hover:text-white border border-[#D9D9D9] dark:border-[#333333]'
                        }`}
                      >
                        <span>{st.icon}</span>
                        <span className="truncate w-full">{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checklist de Preparación (Usados) o Entrega (0km) */}
              {vehicle.condition === '0km' ? (
                <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                        <span>Checklist de Entrega 0km ({deliveryScore}/{deliveryChecklist.items.length})</span>
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Alistamiento y verificación de unidad 0km previa a la entrega al cliente final
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && deliveryScore >= 4 && (
                      <button
                        onClick={handlePublishVehicle}
                        className="px-3 py-1.5 bg-[#D7141A] hover:bg-[#b50f14] text-white font-title font-bold text-xs rounded-md shadow-sm transition-all"
                      >
                        ¡Publicar Ahora!
                      </button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-[#D9D9D9] dark:bg-[#333333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white transition-all duration-500"
                      style={{ width: `${(deliveryScore / deliveryChecklist.items.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {deliveryChecklist.items.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${
                          item.done
                            ? 'bg-white dark:bg-[#202020] border-[#D9D9D9] dark:border-[#333333] text-black dark:text-white'
                            : 'bg-white/60 dark:bg-[#1A1A1A] border-[#D9D9D9] dark:border-[#2A2A2A] text-[#6B6B6B] hover:border-black dark:hover:border-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDeliveryItem(item.id)}
                          className="mt-0.5 rounded border-[#D9D9D9] text-black focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-xs">{item.label}</div>
                        </div>
                        {item.done && <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                        <span>Checklist de Alistamiento ({prepScore}/5)</span>
                      </h3>
                      <p className="text-[11px] text-[#6B6B6B]">
                        Completá los 5 pasos para habilitar la publicación automática en el catálogo
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && prepScore >= 4 && (
                      <button
                        onClick={handlePublishVehicle}
                        className="px-3 py-1.5 bg-[#D7141A] hover:bg-[#b50f14] text-white font-title font-bold text-xs rounded-md shadow-sm transition-all"
                      >
                        ¡Publicar Ahora!
                      </button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-[#D9D9D9] dark:bg-[#333333] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white transition-all duration-500"
                      style={{ width: `${(prepScore / 5) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      {
                        key: 'inspection_done',
                        label: '1. Peritaje técnico realizado y aprobado',
                        desc: linkedInspection
                          ? `Peritaje ${linkedInspection.traffic_light} (Puntaje: ${linkedInspection.score}/100)`
                          : 'Aún no se ha realizado peritaje de Fase 3'
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
                        className="flex items-start gap-3 p-2.5 rounded-md bg-white dark:bg-[#202020] border border-[#D9D9D9] dark:border-[#2A2A2A] cursor-pointer hover:border-black dark:hover:border-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(prep[item.key as keyof DealershipPrepChecklist])}
                          onChange={() => handleToggleChecklist(item.key as keyof DealershipPrepChecklist)}
                          className="mt-0.5 rounded border-[#D9D9D9] text-black focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-black dark:text-white text-xs">{item.label}</div>
                          <div className="text-[11px] text-[#6B6B6B]">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

          {/* Conexión con Módulos: Peritaje & Detailing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta Peritaje */}
            <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-title font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Peritaje Técnico</span>
                </span>
                {linkedInspection && (
                  <span
                    className={`text-[10px] font-title font-bold px-2 py-0.5 rounded ${
                      linkedInspection.traffic_light === 'Recomendable'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {linkedInspection.traffic_light}
                  </span>
                )}
              </div>

              {linkedInspection ? (
                <div>
                  <div className="text-xs font-title font-bold text-black dark:text-white">
                    Puntaje: {linkedInspection.score}/100
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-1 line-clamp-2">
                    {linkedInspection.inspector_conclusion}
                  </p>
                  <div className="mt-2 text-[10px] text-[#6B6B6B]">
                    Inspector: {linkedInspection.assignee?.full_name || 'Diego Benítez'}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#6B6B6B]">
                    No tiene peritaje registrado. Podés solicitar la revisión interna con costo cargado al vehículo.
                  </p>
                  <button
                    onClick={() => {
                      updateDealershipVehicleStatus(vehicle.id, 'evaluacion', { triggerInspection: true });
                      showToast('Peritaje técnico interno solicitado en Fase 3', 'success');
                    }}
                    className="mt-2 w-full py-1.5 rounded-md bg-black dark:bg-[#222222] hover:bg-neutral-800 text-white text-xs font-title font-bold transition-colors"
                  >
                    + Solicitar Peritaje Interno ($U 1.500)
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta Detailing */}
            <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-title font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Detailing Alistamiento</span>
                </span>
                {linkedDetailing && (
                  <span className="text-[10px] font-title font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                    {linkedDetailing.status}
                  </span>
                )}
              </div>

              {linkedDetailing ? (
                <div>
                  <div className="text-xs font-title font-bold text-black dark:text-white">
                    {linkedDetailing.selected_services.map((s) => s.serviceName).join(', ')}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">
                    Costo interno taller: $U {linkedDetailing.total_amount.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#6B6B6B]">
                    Alistamiento estético en taller Shangrilá para dejar el auto impecable para la venta.
                  </p>
                  <button
                    onClick={() => {
                      updateDealershipVehicleStatus(vehicle.id, 'comprado');
                      showToast('Orden interna de detailing enviada a DetailVlak', 'success');
                    }}
                    className="mt-2 w-full py-1.5 rounded-md bg-black dark:bg-[#222222] hover:bg-neutral-800 text-white text-xs font-title font-bold transition-colors"
                  >
                    + Crear Detailing Interno ($U 2.500)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DESGLOSE FINANCIERO Y CONTROL DE MARGEN (SOLO ADMIN) */}
          {isAdmin ? (
            <div className="p-4 sm:p-5 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9D9D9] dark:border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider">
                    Desglose Financiero &amp; Margen Real
                  </span>
                </div>
                <span className="text-[10px] font-title font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                  ADMIN ONLY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A]">
                  <div className="text-[10px] text-[#6B6B6B] uppercase font-bold">Precio Compra</div>
                  <div className="text-sm font-title font-bold text-black dark:text-white mt-0.5">
                    USD {vehicle.purchase_price.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#6B6B6B]">T/C: {vehicle.exchange_rate || 43.5}</div>
                </div>

                <div className="p-2.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A]">
                  <div className="text-[10px] text-[#6B6B6B] uppercase font-bold">Peritaje Interno</div>
                  <div className="text-sm font-title font-bold text-black dark:text-white mt-0.5">
                    $U {(vehicle.inspection_cost || 1500).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#6B6B6B]">
                    ~USD {Math.round((vehicle.inspection_cost || 1500) / (vehicle.exchange_rate || 43.5))}
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A]">
                  <div className="text-[10px] text-[#6B6B6B] uppercase font-bold">Detailing Interno</div>
                  <div className="text-sm font-title font-bold text-black dark:text-white mt-0.5">
                    $U {(vehicle.detailing_cost || 2500).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#6B6B6B]">
                    ~USD {Math.round((vehicle.detailing_cost || 2500) / (vehicle.exchange_rate || 43.5))}
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A]">
                  <div className="text-[10px] text-[#6B6B6B] uppercase font-bold">Piso Negociación</div>
                  <div className="text-sm font-title font-bold text-black dark:text-white mt-0.5">
                    USD {(vehicle.min_acceptable_price || Math.round(vehicle.sale_price * 0.95)).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#6B6B6B]">Mínimo aceptable</div>
                </div>
              </div>

              {/* Modificación de Gastos de Taller y Trámites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                    Reparaciones Taller (USD)
                  </label>
                  <input
                    type="number"
                    value={repairsCost}
                    onChange={(e) => setRepairsCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#333333] rounded-md text-xs text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                    Trámites / Notaría (USD)
                  </label>
                  <input
                    type="number"
                    value={paperworkCost}
                    onChange={(e) => setPaperworkCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#333333] rounded-md text-xs text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                    Otros Gastos (USD)
                  </label>
                  <input
                    type="number"
                    value={otherExpensesCost}
                    onChange={(e) => setOtherExpensesCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#333333] rounded-md text-xs text-black dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveCosts}
                  className="px-3 py-1.5 rounded-md bg-black dark:bg-[#222222] hover:bg-neutral-800 text-white text-xs font-medium"
                >
                  Recalcular Costo Total
                </button>
              </div>

              {/* Cuenta por Pagar al Proveedor / Importador */}
              {vehicle.supplier_payable && (
                <div className="p-3.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider">
                      Cuenta por Pagar al Proveedor
                    </div>
                    <div className="font-title font-bold text-black dark:text-white text-sm mt-0.5">
                      {vehicle.supplier_payable.supplier_name}
                    </div>
                    <div className="text-[11px] text-[#6B6B6B]">
                      Vence: {vehicle.supplier_payable.due_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-title font-bold text-black dark:text-white">
                      USD {vehicle.supplier_payable.amount.toLocaleString()}
                    </div>
                    <span className={`text-[10px] font-title font-bold px-2 py-0.5 rounded uppercase ${
                      vehicle.supplier_payable.is_paid
                        ? 'bg-[#F2F2F2] dark:bg-[#222222] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333]'
                        : 'bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/30'
                    }`}>
                      {vehicle.supplier_payable.is_paid ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>
              )}

              {/* Totales y Margen Final */}
              <div className="p-3.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#6B6B6B] uppercase">Costo Real Invertido</div>
                  <div className="text-base font-title font-bold text-black dark:text-white">
                    USD {Math.round(vehicle.total_real_cost_usd || 0).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#6B6B6B] uppercase">Margen Bruto Estimado</div>
                  <div
                    className={`text-base font-title font-bold ${
                      (vehicle.estimated_margin_usd || 0) >= 0 ? 'text-black dark:text-white' : 'text-[#D7141A]'
                    }`}
                  >
                    +USD {Math.round(vehicle.estimated_margin_usd || 0).toLocaleString()} (
                    {vehicle.estimated_margin_percent?.toFixed(1) || '0.0'}%)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-md bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] text-center text-xs text-[#6B6B6B]">
              🔒 Los costos internos y márgenes están restringidos al rol Administrador.
            </div>
          )}

          {/* Posventa: Si el auto está vendido o reservado */}
          {vehicle.status === 'vendido' && (
            <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-black dark:text-white" />
                  <span>Beneficio Posventa CARVLAK</span>
                </span>
                <span className="text-[10px] font-title font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                  20% OFF
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Fidelizá al cliente generando una cotización de sellado cerámico o tratamiento de interior con 20% OFF en DetailVlak Shangrilá.
              </p>
              <button
                onClick={handleCreatePosventaCoupon}
                className="w-full py-2 rounded-md bg-black dark:bg-[#222222] hover:bg-neutral-800 text-white font-title font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Generar Cotización Posventa (20% OFF)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Equipamiento Detallado */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider">
                Equipamiento &amp; Accesorios
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-[#F2F2F2] dark:bg-[#202020] border border-[#D9D9D9] dark:border-[#2A2A2A] text-black dark:text-white text-xs font-medium"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sincronización Tiendanube */}
          <div className="flex items-center justify-between p-3.5 rounded-md bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] text-xs">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#6B6B6B]" />
              <div>
                <span className="font-bold text-black dark:text-white block">Catálogo Web &amp; Tiendanube</span>
                <span className="text-[11px] text-[#6B6B6B]">
                  {vehicle.status === 'publicado' ? 'Visible en catálogo público' : 'No publicado (oculto)'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-[#222222] text-black dark:text-white border border-[#D9D9D9] dark:border-[#333333]">
                {vehicle.tiendanube_synced_at
                  ? `Sincronizado ${new Date(vehicle.tiendanube_synced_at).toLocaleDateString('es-UY')}`
                  : 'Listo para sincronizar'}
              </span>
            </div>
          </div>

          {/* Campos Personalizados */}
          {vehicle.custom_fields && Object.keys(vehicle.custom_fields).length > 0 && (
            <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-2">
              <div className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider">
                Campos Personalizados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(vehicle.custom_fields).map(([key, val]) => {
                  const def = (dealershipConfig.custom_fields || []).find((f) => f.id === key);
                  const label = def?.name || key;
                  const displayVal = typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val);
                  return (
                    <div key={key} className="p-2.5 rounded-md bg-white dark:bg-black border border-[#D9D9D9] dark:border-[#2A2A2A]">
                      <span className="text-[10px] text-[#6B6B6B] block font-medium">{label}</span>
                      <span className="font-bold text-black dark:text-white text-xs mt-0.5 block">{displayVal}</span>
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
          <div className="p-4 rounded-lg bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A]">
            <h3 className="text-xs font-title font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-black dark:text-white" />
              <span>Auditoría de Modificaciones ({vehicle.history?.length || 0})</span>
            </h3>
            <p className="text-[11px] text-[#6B6B6B] mt-1">
              Registro detallado de cambios realizados sobre esta unidad: campo modificado, valor previo, nuevo valor, usuario y hora.
            </p>
          </div>

          {(!vehicle.history || vehicle.history.length === 0) ? (
            <div className="p-8 text-center border-2 border-dashed border-[#D9D9D9] dark:border-[#2A2A2A] rounded-lg text-[#6B6B6B] text-xs">
              Aún no hay cambios registrados en el historial de este vehículo. Cada edición de precio, estado o ficha técnica quedará registrada aquí automáticamente.
            </div>
          ) : (
            <div className="space-y-2.5">
              {vehicle.history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-md bg-[#F2F2F2] dark:bg-[#1A1A1A] border border-[#D9D9D9] dark:border-[#2A2A2A] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[#6B6B6B]">
                    <span className="font-title font-bold text-black dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                      {entry.field_label || entry.field}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B6B6B]">
                      {new Date(entry.timestamp).toLocaleString('es-UY', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-white dark:bg-black rounded-md border border-[#D9D9D9] dark:border-[#2A2A2A] text-[11px]">
                    <div>
                      <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold">Valor anterior</span>
                      <span className="text-[#D7141A] font-mono line-through truncate block">
                        {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold">Nuevo valor</span>
                      <span className="text-black dark:text-white font-mono font-bold truncate block">
                        {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#6B6B6B] flex items-center justify-between">
                    <span>Modificado por: <strong className="text-black dark:text-white">{entry.user_name}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Footer con Acciones */}
    <div className="p-4 border-t border-[#D9D9D9] dark:border-[#2A2A2A] bg-[#F2F2F2] dark:bg-[#1A1A1A] flex items-center justify-between gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-md bg-white dark:bg-[#222222] hover:bg-[#D9D9D9] dark:hover:bg-[#333333] text-black dark:text-white text-xs font-medium border border-[#D9D9D9] dark:border-[#333333] transition-colors"
      >
        Cerrar
      </button>

      {vehicle.status !== 'vendido' && (
        <button
          onClick={() => onOpenSaleModal(vehicle)}
          className="px-5 py-2.5 rounded-md bg-[#D7141A] hover:bg-[#b50f14] text-white font-title font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <DollarSign className="w-4 h-4" />
          <span>{vehicle.status === 'reservado' ? 'Liquidar Venta' : 'Vender / Seña'}</span>
        </button>
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

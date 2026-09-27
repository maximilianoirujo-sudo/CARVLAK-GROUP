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
  Copy
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipPrepChecklist
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
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
  onOpenSaleModal
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-full bg-panel border-l border-borde flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-black border border-white text-center">
                {vehicle.plate || (vehicle.chassis_vin ? `VIN: ${vehicle.chassis_vin.slice(-8)}` : '0KM')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-title font-bold uppercase text-center bg-panel text-white border border-borde">
                {vehicle.condition === '0km' ? '0km' : 'Usado'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-title font-bold text-white leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.version || ''}
              </h2>
              <div className="text-[11px] text-gris-texto flex items-center gap-2 flex-wrap">
                <span>Año {vehicle.year}</span>
                <span>•</span>
                <span>{vehicle.mileage.toLocaleString()} km</span>
                {vehicle.autonomy_km ? (
                  <>
                    <span>•</span>
                    <span className="text-white font-bold">🔋 {vehicle.autonomy_km} km</span>
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
                className="p-2 rounded-lg text-gris-texto hover:text-white hover:bg-negro transition-colors"
                title="Editar Ficha"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-lg text-gris-texto hover:text-white hover:bg-negro transition-colors"
                title="Duplicar Vehículo"
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
              <Share2 className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gris-texto hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs del Drawer con Línea Roja */}
        <div className="flex items-center gap-4 px-6 border-b border-borde bg-negro pt-2 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`pb-2.5 font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'detalle'
                ? 'border-rojo text-white'
                : 'border-transparent text-gris-texto hover:text-white'
            }`}
          >
            Ficha &amp; Alistamiento
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-2.5 font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'historial'
                ? 'border-rojo text-white'
                : 'border-transparent text-gris-texto hover:text-white'
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
                <div className="p-4 rounded-xl bg-rojo/10 border border-rojo flex items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rojo shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-rojo">Ficha con datos internos pendientes</div>
                      <div className="text-[11px] text-gris-texto">
                        Completá precio de compra, proveedor y documentación para cerrar la rentabilidad de esta unidad.
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onEdit(vehicle)}
                  >
                    Completar Ficha
                  </Button>
                </div>
              )}

              {/* Portada & Galería */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-negro border border-borde aspect-video shadow-sm">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gris-texto gap-2">
                      <Car className="w-16 h-16" />
                      <span className="text-xs font-bold">Sin fotos cargadas</span>
                    </div>
                  )}

                  {/* Badges Flotantes */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/85 backdrop-blur-sm text-white border border-borde">
                      {vehicle.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-black/85 backdrop-blur-sm text-white border border-borde flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white" />
                      <span>{daysInStock} días en stock</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="text-lg font-title font-bold px-3.5 py-1.5 rounded-lg bg-black/90 backdrop-blur-sm text-white border border-borde shadow-lg font-mono">
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
                        className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${
                          selectedImageIndex === idx
                            ? 'border-white ring-2 ring-white/30'
                            : 'border-borde opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stepper de Estados */}
              <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
                <div className="text-[11px] font-bold text-gris-texto uppercase tracking-wider">
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
                        className={`p-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                          isCurrent
                            ? 'bg-white text-black shadow-sm ring-1 ring-white'
                            : 'bg-panel text-gris-texto hover:text-white border border-borde'
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
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-rojo" />
                        <span>Checklist de Entrega 0km ({deliveryScore}/{deliveryChecklist.items.length})</span>
                      </h3>
                      <p className="text-[11px] text-gris-texto">
                        Alistamiento y verificación de unidad 0km previa a la entrega al cliente final
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && deliveryScore >= 4 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePublishVehicle}
                      >
                        ¡Publicar Ahora!
                      </Button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rojo transition-all duration-500"
                      style={{ width: `${(deliveryScore / deliveryChecklist.items.length) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {deliveryChecklist.items.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          item.done
                            ? 'bg-panel border-white text-white'
                            : 'bg-panel/40 border-borde text-gris-texto hover:border-white/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDeliveryItem(item.id)}
                          className="mt-0.5 rounded border-borde text-rojo focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-xs">{item.label}</div>
                        </div>
                        {item.done && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-rojo" />
                        <span>Checklist de Alistamiento ({prepScore}/5)</span>
                      </h3>
                      <p className="text-[11px] text-gris-texto">
                        Completá los 5 pasos para habilitar la publicación automática en el catálogo
                      </p>
                    </div>

                    {vehicle.status === 'preparacion' && prepScore >= 4 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePublishVehicle}
                      >
                        ¡Publicar Ahora!
                      </Button>
                    )}
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rojo transition-all duration-500"
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
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-panel border border-borde cursor-pointer hover:border-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(prep[item.key as keyof DealershipPrepChecklist])}
                          onChange={() => handleToggleChecklist(item.key as keyof DealershipPrepChecklist)}
                          className="mt-0.5 rounded border-borde text-rojo focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-white text-xs">{item.label}</div>
                          <div className="text-[11px] text-gris-texto">{item.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Conexión con Módulos: Peritaje & Detailing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tarjeta Peritaje */}
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5 text-rojo" />
                      <span>Peritaje Técnico</span>
                    </span>
                    {linkedInspection && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-panel border border-borde text-white">
                        {linkedInspection.traffic_light}
                      </span>
                    )}
                  </div>

                  {linkedInspection ? (
                    <div>
                      <div className="text-xs font-bold text-white">
                        Puntaje: {linkedInspection.score}/100
                      </div>
                      <p className="text-[11px] text-gris-texto mt-1 line-clamp-2">
                        {linkedInspection.inspector_conclusion}
                      </p>
                      <div className="mt-2 text-[10px] text-gris-texto">
                        Inspector: {linkedInspection.assignee?.full_name || 'Diego Benítez'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gris-texto">
                        No tiene peritaje registrado. Podés solicitar la revisión interna con costo cargado al vehículo.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          updateDealershipVehicleStatus(vehicle.id, 'evaluacion', { triggerInspection: true });
                          showToast('Peritaje técnico interno solicitado en Fase 3', 'success');
                        }}
                      >
                        + Solicitar Peritaje Interno ($U 1.500)
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tarjeta Detailing */}
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-rojo" />
                      <span>Detailing Alistamiento</span>
                    </span>
                    {linkedDetailing && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-panel border border-borde text-white">
                        {linkedDetailing.status}
                      </span>
                    )}
                  </div>

                  {linkedDetailing ? (
                    <div>
                      <div className="text-xs font-bold text-white">
                        {linkedDetailing.selected_services.map((s) => s.serviceName).join(', ')}
                      </div>
                      <div className="text-[11px] text-gris-texto mt-1">
                        Costo interno taller: $U {linkedDetailing.total_amount.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gris-texto">
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
                        + Crear Detailing Interno ($U 2.500)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* DESGLOSE FINANCIERO Y CONTROL DE MARGEN (SOLO ADMIN) */}
              {isAdmin ? (
                <div className="p-4 sm:p-5 rounded-xl bg-negro border border-borde space-y-4">
                  <div className="flex items-center justify-between border-b border-borde pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-rojo" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Desglose Financiero &amp; Margen Real
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-panel text-gris-texto border border-borde">
                      ADMIN ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-panel border border-borde">
                      <div className="text-[10px] text-gris-texto uppercase font-bold">Precio Compra</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">
                        USD {vehicle.purchase_price.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-gris-texto">T/C: {vehicle.exchange_rate || 43.5}</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-panel border border-borde">
                      <div className="text-[10px] text-gris-texto uppercase font-bold">Peritaje Interno</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">
                        $U {(vehicle.inspection_cost || 1500).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-gris-texto">
                        ~USD {Math.round((vehicle.inspection_cost || 1500) / (vehicle.exchange_rate || 43.5))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-panel border border-borde">
                      <div className="text-[10px] text-gris-texto uppercase font-bold">Detailing Interno</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">
                        $U {(vehicle.detailing_cost || 2500).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-gris-texto">
                        ~USD {Math.round((vehicle.detailing_cost || 2500) / (vehicle.exchange_rate || 43.5))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-panel border border-borde">
                      <div className="text-[10px] text-gris-texto uppercase font-bold">Piso Negociación</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">
                        USD {(vehicle.min_acceptable_price || Math.round(vehicle.sale_price * 0.95)).toLocaleString()}
                      </div>
                      <div className="text-[9px] text-gris-texto">Mínimo aceptable</div>
                    </div>
                  </div>

                  {/* Modificación de Gastos de Taller y Trámites */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gris-texto mb-1">
                        Reparaciones Taller (USD)
                      </label>
                      <input
                        type="number"
                        value={repairsCost}
                        onChange={(e) => setRepairsCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-xs text-white focus:border-rojo outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gris-texto mb-1">
                        Trámites / Notaría (USD)
                      </label>
                      <input
                        type="number"
                        value={paperworkCost}
                        onChange={(e) => setPaperworkCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-xs text-white focus:border-rojo outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gris-texto mb-1">
                        Otros Gastos (USD)
                      </label>
                      <input
                        type="number"
                        value={otherExpensesCost}
                        onChange={(e) => setOtherExpensesCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-xs text-white focus:border-rojo outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveCosts}
                    >
                      Recalcular Costo Total
                    </Button>
                  </div>

                  {/* Cuenta por Pagar al Proveedor / Importador */}
                  {vehicle.supplier_payable && (
                    <div className="p-3.5 rounded-lg bg-panel border border-borde flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-gris-texto font-bold uppercase tracking-wider">
                          Cuenta por Pagar al Proveedor
                        </div>
                        <div className="font-bold text-white text-sm mt-0.5">
                          {vehicle.supplier_payable.supplier_name}
                        </div>
                        <div className="text-[11px] text-gris-texto">
                          Vence: {vehicle.supplier_payable.due_date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white font-mono">
                          USD {vehicle.supplier_payable.amount.toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          vehicle.supplier_payable.is_paid
                            ? 'bg-negro text-white border border-borde'
                            : 'bg-rojo/10 text-rojo border border-rojo/30'
                        }`}>
                          {vehicle.supplier_payable.is_paid ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Totales y Margen Final */}
                  <div className="p-3.5 rounded-lg bg-panel border border-borde flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gris-texto uppercase">Costo Real Invertido</div>
                      <div className="text-base font-bold text-white font-mono">
                        USD {Math.round(vehicle.total_real_cost_usd || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gris-texto uppercase">Margen Bruto Estimado</div>
                      <div
                        className={`text-base font-bold font-mono ${
                          (vehicle.estimated_margin_usd || 0) >= 0 ? 'text-white' : 'text-rojo'
                        }`}
                      >
                        +USD {Math.round(vehicle.estimated_margin_usd || 0).toLocaleString()} (
                        {vehicle.estimated_margin_percent?.toFixed(1) || '0.0'}%)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-negro border border-borde text-center text-xs text-gris-texto">
                  🔒 Los costos internos y márgenes están restringidos al rol Administrador.
                </div>
              )}

              {/* Posventa: Si el auto está vendido o reservado */}
              {vehicle.status === 'vendido' && (
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rojo" />
                      <span>Beneficio Posventa CARVLAK</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-panel border border-borde text-white">
                      20% OFF
                    </span>
                  </div>
                  <p className="text-xs text-gris-texto">
                    Fidelizá al cliente generando una cotización de sellado cerámico o tratamiento de interior con 20% OFF en DetailVlak Shangrilá.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleCreatePosventaCoupon}
                  >
                    <span>Generar Cotización Posventa (20% OFF)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Equipamiento Detallado */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Equipamiento &amp; Accesorios
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-negro border border-borde text-white text-xs font-medium"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sincronización Tiendanube */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-negro border border-borde text-xs">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-gris-texto" />
                  <div>
                    <span className="font-bold text-white block">Catálogo Web &amp; Tiendanube</span>
                    <span className="text-[11px] text-gris-texto">
                      {vehicle.status === 'publicado' ? 'Visible en catálogo público' : 'No publicado (oculto)'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-panel text-white border border-borde">
                    {vehicle.tiendanube_synced_at
                      ? `Sincronizado ${new Date(vehicle.tiendanube_synced_at).toLocaleDateString('es-UY')}`
                      : 'Listo para sincronizar'}
                  </span>
                </div>
              </div>

              {/* Campos Personalizados */}
              {vehicle.custom_fields && Object.keys(vehicle.custom_fields).length > 0 && (
                <div className="p-4 rounded-xl bg-negro border border-borde space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Campos Personalizados
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(vehicle.custom_fields).map(([key, val]) => {
                      const def = (dealershipConfig.custom_fields || []).find((f) => f.id === key);
                      const label = def?.name || key;
                      const displayVal = typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val);
                      return (
                        <div key={key} className="p-2.5 rounded-lg bg-panel border border-borde">
                          <span className="text-[10px] text-gris-texto block font-medium">{label}</span>
                          <span className="font-bold text-white text-xs mt-0.5 block">{displayVal}</span>
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
              <div className="p-4 rounded-xl bg-negro border border-borde">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-rojo" />
                  <span>Auditoría de Modificaciones ({vehicle.history?.length || 0})</span>
                </h3>
                <p className="text-[11px] text-gris-texto mt-1">
                  Registro detallado de cambios realizados sobre esta unidad: campo modificado, valor previo, nuevo valor, usuario y hora.
                </p>
              </div>

              {(!vehicle.history || vehicle.history.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-borde rounded-xl text-gris-texto text-xs">
                  Aún no hay cambios registrados en el historial de este vehículo. Cada edición de precio, estado o ficha técnica quedará registrada aquí automáticamente.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vehicle.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-negro border border-borde space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-gris-texto">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rojo" />
                          {entry.field_label || entry.field}
                        </span>
                        <span className="text-[10px] font-mono text-gris-texto">
                          {new Date(entry.timestamp).toLocaleString('es-UY', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-panel rounded-lg border border-borde text-[11px]">
                        <div>
                          <span className="text-[9px] text-gris-texto block uppercase font-bold">Valor anterior</span>
                          <span className="text-rojo font-mono line-through truncate block">
                            {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gris-texto block uppercase font-bold">Nuevo valor</span>
                          <span className="text-white font-mono font-bold truncate block">
                            {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gris-texto flex items-center justify-between">
                        <span>Modificado por: <strong className="text-white">{entry.user_name}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t border-borde bg-negro flex items-center justify-between gap-3">
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
              <span>{vehicle.status === 'reservado' ? 'Liquidar Venta' : 'Vender / Seña'}</span>
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

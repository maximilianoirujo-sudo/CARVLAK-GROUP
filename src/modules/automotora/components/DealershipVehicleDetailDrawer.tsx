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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-full bg-[#0D121C] border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-950 text-amber-400 border border-slate-800 text-center">
                {vehicle.plate || (vehicle.chassis_vin ? `VIN: ${vehicle.chassis_vin.slice(-8)}` : '0KM')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-center ${
                vehicle.condition === '0km' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
              }`}>
                {vehicle.condition === '0km' ? '⚡ 0km' : 'Usado'}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {vehicle.brand} {vehicle.model} {vehicle.version || ''}
              </h2>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Año {vehicle.year}</span>
                <span>•</span>
                <span>{vehicle.mileage.toLocaleString()} km</span>
                {vehicle.autonomy_km ? (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">🔋 {vehicle.autonomy_km} km</span>
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
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                title="Editar Ficha"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                title="Duplicar Vehículo"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10"
              title="Compartir Ficha por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs del Drawer */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-900/40 pt-2 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`pb-2.5 font-bold transition-all border-b-2 ${
              activeTab === 'detalle'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Ficha &amp; Alistamiento
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`pb-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'historial'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
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
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-amber-300">Ficha con datos internos pendientes</div>
                  <div className="text-[11px] text-slate-300">
                    Completá precio de compra, proveedor y documentación para cerrar la rentabilidad de esta unidad.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onEdit(vehicle)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shrink-0 transition-colors shadow-md"
              >
                Completar Ficha
              </button>
            </div>
          )}
          {/* Portada & Galería */}
          <div className="space-y-3">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video shadow-xl">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                  <Car className="w-16 h-16" />
                  <span className="text-xs font-bold">Sin fotos cargadas</span>
                </div>
              )}

              {/* Badges Flotantes */}
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-500/40">
                  {vehicle.status.toUpperCase()}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{daysInStock} días en stock</span>
                </span>
              </div>

              <div className="absolute bottom-3 right-3">
                <span className="text-lg font-black px-3.5 py-1.5 rounded-2xl bg-emerald-950/90 backdrop-blur-md text-emerald-400 border border-emerald-500/40 shadow-lg">
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
                    className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border transition-all ${
                      selectedImageIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/40'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stepper de Estados */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
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
                    className={`p-2 rounded-xl text-[10px] font-black flex flex-col items-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
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
            <div className="p-4 rounded-3xl bg-[#0e1b18] border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Checklist de Entrega 0km ({deliveryScore}/{deliveryChecklist.items.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Alistamiento y verificación de unidad 0km previa a la entrega al cliente final
                  </p>
                </div>

                {vehicle.status === 'preparacion' && deliveryScore >= 4 && (
                  <button
                    onClick={handlePublishVehicle}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    ¡Publicar Ahora!
                  </button>
                )}
              </div>

              {/* Barra de Progreso */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(deliveryScore / deliveryChecklist.items.length) * 100}%` }}
                />
              </div>

              <div className="space-y-2 text-xs">
                {deliveryChecklist.items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                      item.done
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleDeliveryItem(item.id)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-xs">{item.label}</div>
                    </div>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-[#111622] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Checklist de Alistamiento ({prepScore}/5)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Completá los 5 pasos para habilitar la publicación automática en el catálogo
                  </p>
                </div>

                {vehicle.status === 'preparacion' && prepScore >= 4 && (
                  <button
                    onClick={handlePublishVehicle}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    ¡Publicar Ahora!
                  </button>
                )}
              </div>

              {/* Barra de Progreso */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    prepScore === 5 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
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
                    className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(prep[item.key as keyof DealershipPrepChecklist])}
                      onChange={() => handleToggleChecklist(item.key as keyof DealershipPrepChecklist)}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Conexión con Módulos: Peritaje & Detailing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tarjeta Peritaje */}
            <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Peritaje Técnico</span>
                </span>
                {linkedInspection && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      linkedInspection.traffic_light === 'Recomendable'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {linkedInspection.traffic_light}
                  </span>
                )}
              </div>

              {linkedInspection ? (
                <div>
                  <div className="text-xs font-bold text-white">
                    Puntaje: {linkedInspection.score}/100
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {linkedInspection.inspector_conclusion}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500">
                    Inspector: {linkedInspection.assignee?.full_name || 'Diego Benítez'}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-400">
                    No tiene peritaje registrado. Podés solicitar la revisión interna con costo cargado al vehículo.
                  </p>
                  <button
                    onClick={() => {
                      updateDealershipVehicleStatus(vehicle.id, 'evaluacion', { triggerInspection: true });
                      showToast('Peritaje técnico interno solicitado en Fase 3', 'success');
                    }}
                    className="mt-2 w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                  >
                    + Solicitar Peritaje Interno ($U 1.500)
                  </button>
                </div>
              )}
            </div>

            {/* Tarjeta Detailing */}
            <div className="p-4 rounded-3xl bg-[#131227] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Detailing Alistamiento</span>
                </span>
                {linkedDetailing && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {linkedDetailing.status}
                  </span>
                )}
              </div>

              {linkedDetailing ? (
                <div>
                  <div className="text-xs font-bold text-white">
                    {linkedDetailing.selected_services.map((s) => s.serviceName).join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Costo interno taller: $U {linkedDetailing.total_amount.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-400">
                    Alistamiento estético en taller Shangrilá para dejar el auto impecable para la venta.
                  </p>
                  <button
                    onClick={() => {
                      updateDealershipVehicleStatus(vehicle.id, 'comprado');
                      showToast('Orden interna de detailing enviada a DetailVlak', 'success');
                    }}
                    className="mt-2 w-full py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold"
                  >
                    + Crear Detailing Interno ($U 2.500)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DESGLOSE FINANCIERO Y CONTROL DE MARGEN (SOLO ADMIN) */}
          {isAdmin ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Desglose Financiero &amp; Margen Real
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  ADMIN ONLY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Precio Compra</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    USD {vehicle.purchase_price.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">T/C: {vehicle.exchange_rate || 43.5}</div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Peritaje Interno</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    $U {(vehicle.inspection_cost || 1500).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    ~USD {Math.round((vehicle.inspection_cost || 1500) / (vehicle.exchange_rate || 43.5))}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Detailing Interno</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    $U {(vehicle.detailing_cost || 2500).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    ~USD {Math.round((vehicle.detailing_cost || 2500) / (vehicle.exchange_rate || 43.5))}
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Piso Negociación</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">
                    USD {(vehicle.min_acceptable_price || Math.round(vehicle.sale_price * 0.95)).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500">Mínimo aceptable</div>
                </div>
              </div>

              {/* Modificación de Gastos de Taller y Trámites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Reparaciones Taller (USD)
                  </label>
                  <input
                    type="number"
                    value={repairsCost}
                    onChange={(e) => setRepairsCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Trámites / Notaría (USD)
                  </label>
                  <input
                    type="number"
                    value={paperworkCost}
                    onChange={(e) => setPaperworkCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Otros Gastos (USD)
                  </label>
                  <input
                    type="number"
                    value={otherExpensesCost}
                    onChange={(e) => setOtherExpensesCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveCosts}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Recalcular Costo Total
                </button>
              </div>

              {/* Cuenta por Pagar al Proveedor / Importador */}
              {vehicle.supplier_payable && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Cuenta por Pagar al Proveedor
                    </div>
                    <div className="font-black text-white text-sm mt-0.5">
                      {vehicle.supplier_payable.supplier_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Vence: {vehicle.supplier_payable.due_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-amber-300">
                      USD {vehicle.supplier_payable.amount.toLocaleString()}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                      vehicle.supplier_payable.is_paid
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {vehicle.supplier_payable.is_paid ? 'PAGADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>
              )}

              {/* Totales y Margen Final */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Costo Real Invertido</div>
                  <div className="text-base font-black text-white">
                    USD {Math.round(vehicle.total_real_cost_usd || 0).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Margen Bruto Estimado</div>
                  <div
                    className={`text-base font-black ${
                      (vehicle.estimated_margin_usd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    +USD {Math.round(vehicle.estimated_margin_usd || 0).toLocaleString()} (
                    {vehicle.estimated_margin_percent?.toFixed(1) || '0.0'}%)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
              🔒 Los costos internos y márgenes están restringidos al rol Administrador.
            </div>
          )}

          {/* Posventa: Si el auto está vendido o reservado */}
          {vehicle.status === 'vendido' && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Beneficio Posventa CARVLAK</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                  20% OFF
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Fidelizá al cliente generando una cotización de sellado cerámico o tratamiento de interior con 20% OFF en DetailVlak Shangrilá.
              </p>
              <button
                onClick={handleCreatePosventaCoupon}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Generar Cotización Posventa (20% OFF)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Equipamiento Detallado */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Equipamiento &amp; Accesorios
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sincronización Tiendanube */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-bold text-white block">Catálogo Web &amp; Tiendanube</span>
                <span className="text-[11px] text-slate-400">
                  {vehicle.status === 'publicado' ? 'Visible en catálogo público' : 'No publicado (oculto)'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {vehicle.tiendanube_synced_at
                  ? `Sincronizado ${new Date(vehicle.tiendanube_synced_at).toLocaleDateString('es-UY')}`
                  : 'Listo para sincronizar'}
              </span>
            </div>
          </div>

          {/* Campos Personalizados */}
          {vehicle.custom_fields && Object.keys(vehicle.custom_fields).length > 0 && (
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Campos Personalizados
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(vehicle.custom_fields).map(([key, val]) => {
                  const def = (dealershipConfig.custom_fields || []).find((f) => f.id === key);
                  const label = def?.name || key;
                  const displayVal = typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val);
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-medium">{label}</span>
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
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Auditoría de Modificaciones ({vehicle.history?.length || 0})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Registro detallado de cambios realizados sobre esta unidad: campo modificado, valor previo, nuevo valor, usuario y hora.
            </p>
          </div>

          {(!vehicle.history || vehicle.history.length === 0) ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs">
              Aún no hay cambios registrados en el historial de este vehículo. Cada edición de precio, estado o ficha técnica quedará registrada aquí automáticamente.
            </div>
          ) : (
            <div className="space-y-2.5">
              {vehicle.history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {entry.field_label || entry.field}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleString('es-UY', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Valor anterior</span>
                      <span className="text-rose-400 font-mono line-through truncate block">
                        {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Nuevo valor</span>
                      <span className="text-emerald-400 font-mono font-bold truncate block">
                        {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Modificado por: <strong className="text-slate-300">{entry.user_name}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Footer con Acciones */}
    <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
      >
        Cerrar
      </button>

      {vehicle.status !== 'vendido' && (
        <button
          onClick={() => onOpenSaleModal(vehicle)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
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

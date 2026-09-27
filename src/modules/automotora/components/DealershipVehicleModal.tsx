import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Car,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  Image as ImageIcon,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Star,
  Zap,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  ArrowUp,
  ArrowDown,
  Lock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipVehicleCondition,
  DealershipVehicleType,
  DealershipDeliveryChecklist,
  PurchaseOrigin,
  VehicleCategory,
  Currency,
  DealershipDocsReceived
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { compressImage } from '../../../lib/imageCompressor';
import { Button } from '../../../components/ui/Button';

interface DealershipVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleToEdit?: DealershipVehicle | null;
}

export const DealershipVehicleModal: React.FC<DealershipVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicleToEdit
}) => {
  const {
    addDealershipVehicle,
    updateDealershipVehicle,
    dealershipConfig,
    canEditDealershipStock
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const isEncargado = profile?.roles.includes('encargado');
  const canEdit = canEditDealershipStock(profile?.roles);

  // Secciones colapsables (mobile-friendly accordions)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    tecnicos: true,
    precio: true,
    compra: false,
    docs: false,
    fotos: true,
    publicacion: false,
    custom: false,
    entrega: false
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const expandAll = () => {
    setOpenSections({
      general: true,
      tecnicos: true,
      precio: true,
      compra: true,
      docs: true,
      fotos: true,
      publicacion: true,
      custom: true,
      entrega: true
    });
  };

  const collapseAll = () => {
    setOpenSections({
      general: false,
      tecnicos: false,
      precio: false,
      compra: false,
      docs: false,
      fotos: false,
      publicacion: false,
      custom: false,
      entrega: false
    });
  };

  // 1. Datos Generales
  const [condition, setCondition] = useState<DealershipVehicleCondition>('usado');
  const [vehicleType, setVehicleType] = useState<DealershipVehicleType>('auto');
  const [plate, setPlate] = useState('');
  const [chassisVin, setChassisVin] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [category, setCategory] = useState<VehicleCategory>('Mediano');
  const [bodyType, setBodyType] = useState('Hatchback');
  const [status, setStatus] = useState<DealershipVehicleStatus>('evaluacion');
  const [isFeatured, setIsFeatured] = useState(false);

  // 2. Datos Técnicos
  const [mileage, setMileage] = useState<number>(0);
  const [fuel, setFuel] = useState('Nafta');
  const [transmission, setTransmission] = useState('Manual');
  const [autonomyKm, setAutonomyKm] = useState<number>(0);
  const [engine, setEngine] = useState('');
  const [doors, setDoors] = useState<number>(4);
  const [colorExterior, setColorExterior] = useState('');
  const [padron, setPadron] = useState('');

  // 3. Precios y Financiación
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleCurrency, setSaleCurrency] = useState<Currency>('USD');
  const [minAcceptablePrice, setMinAcceptablePrice] = useState<number>(0);
  const [financingAvailable, setFinancingAvailable] = useState(true);
  const [minDownPayment, setMinDownPayment] = useState<number>(0);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);

  // 4. Compra y Costos (Solo Admin)
  const [purchaseOrigin, setPurchaseOrigin] = useState<PurchaseOrigin>('particular');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseCurrency, setPurchaseCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(() => dealershipConfig?.default_exchange_rate || 43.50);
  const [isSupplierPayable, setIsSupplierPayable] = useState(false);
  const [payableDueDate, setPayableDueDate] = useState(() => new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));

  // 5. Documentación
  const [docsReceived, setDocsReceived] = useState<DealershipDocsReceived>({
    titulo: false,
    libreta: true,
    cedula: true,
    sucive_al_dia: true,
    multas_al_dia: true,
    llave_duplicado: false,
    convenio_pago: false
  });

  // 6. Fotos y Galería
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 7. Equipamiento, Publicación y Notas Internas
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // 8. Campos Personalizados Dinámicos
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // 9. Checklist de Entrega para 0km
  const [deliveryChecklist, setDeliveryChecklist] = useState<DealershipDeliveryChecklist>({
    completed: false,
    items: [
      { id: 'del-1', label: 'Inspección visual de arribo y estado de carrocería', done: true },
      { id: 'del-2', label: 'Batería de tracción cargada (mínimo 90%)', done: true },
      { id: 'del-3', label: 'Retiro de plásticos protectores y embalajes de fábrica', done: false },
      { id: 'del-4', label: 'Kit de carga doméstica, manuales y duplicado de llave', done: true },
      { id: 'del-5', label: 'Colocación de matrículas de empadronamiento y libreta', done: false },
      { id: 'del-6', label: 'Explicación técnica de funciones y entrega formal', done: false }
    ]
  });

  // Cargar datos en modo edición
  useEffect(() => {
    if (vehicleToEdit) {
      setCondition(vehicleToEdit.condition || 'usado');
      setVehicleType(vehicleToEdit.vehicle_type || 'auto');
      setPlate(vehicleToEdit.plate || '');
      setChassisVin(vehicleToEdit.chassis_vin || '');
      setBrand(vehicleToEdit.brand || '');
      setModel(vehicleToEdit.model || '');
      setVersion(vehicleToEdit.version || '');
      setYear(vehicleToEdit.year || new Date().getFullYear());
      setCategory(vehicleToEdit.category || 'Mediano');
      setBodyType(vehicleToEdit.body_type || 'Hatchback');
      setStatus(vehicleToEdit.status || 'evaluacion');
      setIsFeatured(vehicleToEdit.is_featured ?? false);

      setMileage(vehicleToEdit.mileage || 0);
      setFuel(vehicleToEdit.fuel || 'Nafta');
      setTransmission(vehicleToEdit.transmission || 'Manual');
      setAutonomyKm(vehicleToEdit.autonomy_km || 0);
      setEngine(vehicleToEdit.engine || '');
      setDoors(vehicleToEdit.doors || 4);
      setColorExterior(vehicleToEdit.color_exterior || '');
      setPadron(vehicleToEdit.padron || '');

      setSalePrice(vehicleToEdit.sale_price || 0);
      setSaleCurrency(vehicleToEdit.sale_currency || 'USD');
      setMinAcceptablePrice(vehicleToEdit.min_acceptable_price || Math.round((vehicleToEdit.sale_price || 0) * 0.95));
      setFinancingAvailable(vehicleToEdit.financing_available ?? true);
      setMinDownPayment(vehicleToEdit.min_down_payment_usd || 0);
      setMonthlyInstallment(vehicleToEdit.monthly_installment_estimate_usd || 0);

      setPurchaseOrigin(vehicleToEdit.purchase_origin || 'particular');
      setSupplierName(vehicleToEdit.supplier_name || vehicleToEdit.supplier_payable?.supplier_name || '');
      setSupplierPhone(vehicleToEdit.supplier_phone || '');
      setPurchaseDate(vehicleToEdit.purchase_date || new Date().toISOString().slice(0, 10));
      setPurchasePrice(vehicleToEdit.purchase_price || 0);
      setPurchaseCurrency(vehicleToEdit.purchase_currency || 'USD');
      setExchangeRate(vehicleToEdit.exchange_rate || 43.50);
      setIsSupplierPayable(Boolean(vehicleToEdit.supplier_payable));
      setPayableDueDate(vehicleToEdit.supplier_payable?.due_date || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));

      setDocsReceived(
        vehicleToEdit.docs_received || {
          titulo: false,
          libreta: true,
          cedula: true,
          sucive_al_dia: true,
          multas_al_dia: true,
          llave_duplicado: false,
          convenio_pago: false
        }
      );

      setImages(vehicleToEdit.images || []);
      setCoverImage(vehicleToEdit.cover_image || (vehicleToEdit.images && vehicleToEdit.images[0]));

      setFeatures(vehicleToEdit.features || []);
      setCatalogDescription(vehicleToEdit.catalog_description || '');
      setInternalNotes(vehicleToEdit.internal_notes || '');

      setCustomFields(vehicleToEdit.custom_fields || {});

      if (vehicleToEdit.delivery_checklist) {
        setDeliveryChecklist(vehicleToEdit.delivery_checklist);
      }
    } else {
      // Defaults nuevo auto
      setCondition('usado');
      setVehicleType('auto');
      setPlate('');
      setChassisVin('');
      setBrand('');
      setModel('');
      setVersion('');
      setYear(new Date().getFullYear());
      setCategory('Mediano');
      setBodyType('Hatchback');
      setStatus('evaluacion');
      setIsFeatured(false);

      setMileage(0);
      setFuel('Nafta');
      setTransmission('Manual');
      setAutonomyKm(0);
      setEngine('');
      setDoors(4);
      setColorExterior('Gris Plata');
      setPadron('');

      setSalePrice(10000);
      setSaleCurrency('USD');
      setMinAcceptablePrice(9500);
      setFinancingAvailable(true);
      setMinDownPayment(3000);
      setMonthlyInstallment(200);

      setPurchaseOrigin('particular');
      setSupplierName('');
      setSupplierPhone('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setPurchasePrice(7500);
      setPurchaseCurrency('USD');
      setExchangeRate(dealershipConfig?.default_exchange_rate || 43.50);
      setIsSupplierPayable(false);
      setPayableDueDate(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));

      setDocsReceived({
        titulo: false,
        libreta: true,
        cedula: true,
        sucive_al_dia: true,
        multas_al_dia: true,
        llave_duplicado: false,
        convenio_pago: false
      });

      setImages([]);
      setCoverImage(undefined);

      setFeatures([
        'Aire acondicionado',
        'Dirección hidráulica',
        'Airbags frontales',
        'Frenos ABS',
        'Cristales eléctricos'
      ]);
      setCatalogDescription('');
      setInternalNotes('');
      setCustomFields({});
    }
  }, [vehicleToEdit, dealershipConfig]);

  if (!isOpen) return null;

  // Manejo de carga de fotos desde cámara o galería con compresión cliente
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const newCompressedList: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          format: 'image/webp'
        });
        newCompressedList.push(compressedBase64);
      }

      setImages((prev) => {
        const updated = [...prev, ...newCompressedList];
        if (!coverImage && updated.length > 0) {
          setCoverImage(updated[0]);
        }
        return updated;
      });

      showToast(`${newCompressedList.length} foto(s) comprimida(s) y agregada(s)`, 'success');
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
      showToast('Error al procesar o comprimir las fotos', 'error');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      const url = newImageUrl.trim();
      setImages((prev) => {
        const updated = [...prev, url];
        if (!coverImage) setCoverImage(url);
        return updated;
      });
      setNewImageUrl('');
      showToast('Foto agregada por URL', 'info');
    }
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const handleSetCover = (imgUrl: string) => {
    setCoverImage(imgUrl);
    showToast('Foto principal actualizada', 'info');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta foto?')) return;
    const removedImg = images[indexToRemove];
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    if (coverImage === removedImg) {
      setCoverImage(updated[0] || undefined);
    }
    showToast('Foto eliminada', 'info');
  };

  // Manejo de equipamiento
  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setNewFeature('');
    }
  };

  const handleToggleFeature = (feat: string) => {
    if (features.includes(feat)) {
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const handleRemoveFeature = (feat: string) => {
    setFeatures(features.filter((f) => f !== feat));
  };

  // Guardado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      showToast('No tenés permisos para modificar stock', 'error');
      return;
    }

    if (condition === '0km') {
      if (!brand.trim() || !model.trim()) {
        showToast('Por favor completá la marca y el modelo del vehículo', 'error');
        return;
      }
      if (!plate.trim() && !chassisVin.trim()) {
        showToast('En vehículos 0km, ingresá la matrícula o el número de chasis (VIN)', 'error');
        return;
      }
    } else {
      if (!plate.trim() || !brand.trim() || !model.trim()) {
        showToast('Por favor completá matrícula, marca y modelo', 'error');
        return;
      }
    }

    const purchasePriceInUSD =
      purchaseCurrency === 'USD'
        ? Number(purchasePrice)
        : Math.round(Number(purchasePrice) / (Number(exchangeRate) || 43.50));

    const payload: Partial<DealershipVehicle> = {
      empresa_id: vehicleToEdit?.empresa_id || 'carvlak',
      condition,
      vehicle_type: vehicleType,
      plate: plate.trim().toUpperCase(),
      chassis_vin: chassisVin.trim().toUpperCase() || undefined,
      autonomy_km: autonomyKm > 0 ? Number(autonomyKm) : undefined,
      brand: brand.trim(),
      model: model.trim(),
      version: version.trim(),
      year: Number(year),
      category,
      body_type: bodyType,
      transmission: transmission as any,
      fuel: fuel as any,
      engine: engine.trim(),
      doors: Number(doors) || 4,
      mileage: Number(mileage),
      color_exterior: colorExterior.trim(),
      padron: padron.trim(),
      status,
      is_featured: isFeatured,
      catalog_description: catalogDescription.trim(),
      docs_received: docsReceived,
      sale_price: Number(salePrice),
      sale_currency: saleCurrency,
      features,
      images,
      cover_image: coverImage || images[0] || undefined,
      custom_fields: customFields,
      delivery_checklist: condition === '0km' ? deliveryChecklist : undefined,
      incomplete_data: false
    };

    // Campos sensibles solo si es Admin
    if (isAdmin) {
      payload.purchase_origin = purchaseOrigin;
      payload.supplier_name = supplierName.trim();
      payload.supplier_phone = supplierPhone.trim();
      payload.purchase_date = purchaseDate;
      payload.purchase_price = Number(purchasePrice);
      payload.purchase_currency = purchaseCurrency;
      payload.exchange_rate = Number(exchangeRate) || 43.50;
      payload.min_acceptable_price = Number(minAcceptablePrice) || Math.round(Number(salePrice) * 0.95);
      payload.internal_notes = internalNotes.trim();
      payload.supplier_payable =
        isSupplierPayable && supplierName.trim()
          ? {
              supplier_name: supplierName.trim(),
              due_date: payableDueDate,
              amount: purchasePriceInUSD,
              is_paid: false
            }
          : undefined;
    }

    if (vehicleToEdit) {
      updateDealershipVehicle(vehicleToEdit.id, payload);
      showToast('Cambios guardados con éxito', 'success');
    } else {
      addDealershipVehicle(payload as any);
      showToast('Vehículo agregado al inventario', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-panel border border-borde rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-borde text-rojo flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {vehicleToEdit ? `Editar ${vehicleToEdit.brand} ${vehicleToEdit.model}` : 'Nuevo Vehículo de Stock'}
              </h2>
              <p className="text-[11px] text-gris-texto">
                Formulario adaptado para celular organizado en secciones plegables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-lg bg-panel text-gris-texto hover:text-white border border-borde"
            >
              Expandir todo
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-lg bg-panel text-gris-texto hover:text-white border border-borde"
            >
              Colapsar todo
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gris-texto hover:text-white hover:bg-panel transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de permisos si es Vendedor */}
        {!canEdit && (
          <div className="p-3 bg-negro border border-borde border-b border-borde text-xs text-white flex items-center gap-2 px-5">
            <Lock className="w-4 h-4 text-rojo shrink-0" />
            <span>
              <strong>Modo Solo Lectura:</strong> Tu rol actual no tiene habilitada la edición de stock. Podés ver los datos comerciales para asesorar clientes.
            </span>
          </div>
        )}

        {/* Formulario con Accordions */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* ACCORDION 1: DATOS GENERALES */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('general')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-rojo" />
                <span className="text-sm font-bold text-white">1. Datos Generales &amp; Identificación</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-negro border border-borde text-rojo border border-borde">
                  {condition === '0km' ? '0km' : 'Usado'} • {brand || 'Sin marca'} {model}
                </span>
              </div>
              {openSections.general ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.general && (
              <div className="p-4 pt-0 border-t border-borde space-y-4">
                {/* Condición Usado vs 0km */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-negro border border-borde">
                  <div>
                    <span className="text-xs font-bold text-white">Condición del Vehículo:</span>
                    <p className="text-[11px] text-gris-texto">
                      {condition === '0km'
                        ? '⚡ Stock propio 0km: Matrícula opcional hasta empadronar.'
                        : '🚗 Usado: Requiere matrícula para chequeo de documentación.'}
                    </p>
                  </div>
                  <div className="flex items-center bg-negro p-1 rounded-xl border border-borde shrink-0">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setCondition('usado')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        condition === 'usado' ? 'bg-rojo text-white shadow-md' : 'text-gris-texto hover:text-white'
                      }`}
                    >
                      Usado
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        setCondition('0km');
                        if (mileage > 500) setMileage(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        condition === '0km' ? 'bg-rojo text-white shadow-md' : 'text-gris-texto hover:text-white'
                      }`}
                    >
                      0km
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Matrícula {condition === '0km' ? '(Opcional)' : '*'}
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      required={condition !== '0km'}
                      placeholder={condition === '0km' ? 'Pendiente' : 'SBA 1234'}
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono font-bold text-rojo focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Chasis / VIN {condition === '0km' && !plate ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="9BWZZZ..."
                      value={chassisVin}
                      onChange={(e) => setChassisVin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Tipo de Vehículo
                    </label>
                    <select
                      disabled={!canEdit}
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    >
                      {(dealershipConfig.vehicle_types || ['Auto', 'Moto', 'Todoterreno']).map((vt) => (
                        <option key={vt} value={vt.toLowerCase().replace(/[^a-z]/g, '')}>
                          {vt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Marca *</label>
                    <input
                      type="text"
                      list="brands-datalist"
                      disabled={!canEdit}
                      required
                      placeholder="Ej: Volkswagen, BYD..."
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                    <datalist id="brands-datalist">
                      {(dealershipConfig.brands || []).map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Modelo *</label>
                    <input
                      type="text"
                      list="models-datalist"
                      disabled={!canEdit}
                      required
                      placeholder="Ej: Golf, Dolphin..."
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                    <datalist id="models-datalist">
                      {(dealershipConfig.models_by_brand?.[brand] || []).map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Versión</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="Ej: Highline 1.4 TSI"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Año</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value) || 2020)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Estado</label>
                    <select
                      disabled={!canEdit}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    >
                      <option value="evaluacion">En evaluación</option>
                      <option value="comprado">Comprado</option>
                      <option value="preparacion">En preparación</option>
                      <option value="publicado">Publicado</option>
                      <option value="reservado">Reservado</option>
                      <option value="vendido">Vendido</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-gris-texto cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded bg-panel border-borde text-rojo focus:ring-0"
                      />
                      <Star className="w-4 h-4 text-rojo" />
                      <span className="font-semibold">Destacar en Catálogo</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: DATOS TÉCNICOS */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('tecnicos')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">2. Datos Técnicos &amp; Mecánica</span>
                <span className="text-[10px] text-gris-texto">
                  {fuel} • {transmission} • {mileage.toLocaleString('es-UY')} km
                </span>
              </div>
              {openSections.tecnicos ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.tecnicos && (
              <div className="p-4 pt-0 border-t border-borde grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Kilometraje</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={mileage}
                    onChange={(e) => setMileage(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Combustible</label>
                  <select
                    disabled={!canEdit}
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  >
                    {(dealershipConfig.fuel_types || ['Nafta', 'Diesel', 'Híbrido', 'Eléctrico']).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Transmisión</label>
                  <select
                    disabled={!canEdit}
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  >
                    {(dealershipConfig.transmission_types || ['Manual', 'Automática', 'Secuencial']).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                    Motorización (Cilindrada / Potencia)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="Ej: 1.4 TSI 150cv / 160kW"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Puertas</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    min="2"
                    max="6"
                    value={doors}
                    onChange={(e) => setDoors(parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Color Exterior</label>
                  <input
                    type="text"
                    list="colors-datalist"
                    disabled={!canEdit}
                    placeholder="Ej: Blanco, Gris Plata..."
                    value={colorExterior}
                    onChange={(e) => setColorExterior(e.target.value)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                  <datalist id="colors-datalist">
                    {(dealershipConfig.colors || []).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {fuel === 'Eléctrico' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Autonomía Eléctrica (km)
                    </label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      placeholder="405"
                      value={autonomyKm || ''}
                      onChange={(e) => setAutonomyKm(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Padrón</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="Ej: 901234"
                    value={padron}
                    onChange={(e) => setPadron(e.target.value)}
                    className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: PRECIO & FINANCIACIÓN */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('precio')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">3. Precios de Venta &amp; Financiación</span>
                <span className="text-[10px] font-bold text-white">
                  USD {salePrice.toLocaleString('es-UY')}
                </span>
              </div>
              {openSections.precio ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.precio && (
              <div className="p-4 pt-0 border-t border-borde space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Precio de Lista (Público) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gris-texto">USD</span>
                      <input
                        type="number"
                        disabled={!canEdit}
                        required
                        value={salePrice || ''}
                        onChange={(e) => setSalePrice(parseInt(e.target.value) || 0)}
                        className="w-full pl-12 pr-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1 flex items-center gap-1">
                        <span>Precio Mínimo Aceptable</span>
                        <Lock className="w-3 h-3 text-rojo" />
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gris-texto">USD</span>
                        <input
                          type="number"
                          value={minAcceptablePrice || ''}
                          onChange={(e) => setMinAcceptablePrice(parseInt(e.target.value) || 0)}
                          className="w-full pl-12 pr-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono font-bold text-rojo focus:outline-none focus:border-rojo"
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">Límite confidencial de negociación para directiva.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Financiación Disponible
                    </label>
                    <select
                      disabled={!canEdit}
                      value={financingAvailable ? 'si' : 'no'}
                      onChange={(e) => setFinancingAvailable(e.target.value === 'si')}
                      className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                    >
                      <option value="si">Disponible (Bancaria / Propia)</option>
                      <option value="no">Solo Contado</option>
                    </select>
                  </div>
                </div>

                {financingAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-negro rounded-xl border border-borde">
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                        Entrega Inicial Mínima (USD)
                      </label>
                      <input
                        type="number"
                        disabled={!canEdit}
                        value={minDownPayment || ''}
                        onChange={(e) => setMinDownPayment(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                        Cuota Estimada Mensual (USD)
                      </label>
                      <input
                        type="number"
                        disabled={!canEdit}
                        value={monthlyInstallment || ''}
                        onChange={(e) => setMonthlyInstallment(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 4: COMPRA Y COSTOS (SOLO ADMIN) */}
          {isAdmin && (
            <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('compra')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-rojo" />
                  <span className="text-sm font-bold text-white">4. Compra &amp; Costos Reales</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-negro border border-borde text-white font-mono">
                    Solo Admin
                  </span>
                </div>
                {openSections.compra ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
              </button>

              {openSections.compra && (
                <div className="p-4 pt-0 border-t border-borde space-y-4 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Origen de Compra</label>
                      <select
                        value={purchaseOrigin}
                        onChange={(e) => setPurchaseOrigin(e.target.value as any)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                      >
                        <option value="particular">Particular directo</option>
                        <option value="parte_de_pago">Tomado en permuta (Parte de pago)</option>
                        <option value="importador">Importador oficial</option>
                        <option value="consignacion">Consignación</option>
                        <option value="remate">Remate / Subasta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Precio de Compra</label>
                      <div className="flex gap-2">
                        <select
                          value={purchaseCurrency}
                          onChange={(e) => setPurchaseCurrency(e.target.value as any)}
                          className="w-20 px-2 py-2 bg-negro border border-borde rounded-xl text-xs text-white"
                        >
                          <option value="USD">USD</option>
                          <option value="UYU">UYU</option>
                        </select>
                        <input
                          type="number"
                          value={purchasePrice || ''}
                          onChange={(e) => setPurchasePrice(parseInt(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-rojo"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Tipo de Cambio</label>
                      <input
                        type="number"
                        step="0.1"
                        value={exchangeRate || 43.50}
                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 43.50)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs font-mono text-white focus:outline-none focus:border-rojo"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Nombre Proveedor / Dueño</label>
                      <input
                        type="text"
                        placeholder="Juan Pérez"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Teléfono Proveedor</label>
                      <input
                        type="text"
                        placeholder="099 123 456"
                        value={supplierPhone}
                        onChange={(e) => setSupplierPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">Fecha de Compra</label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACCORDION 5: DOCUMENTACIÓN RECIBIDA */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('docs')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">5. Documentación Recibida</span>
              </div>
              {openSections.docs ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.docs && (
              <div className="p-4 pt-0 border-t border-borde pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(dealershipConfig.required_documents || [
                    { key: 'titulo', label: 'Título de Propiedad' },
                    { key: 'libreta', label: 'Libreta de Circulación' },
                    { key: 'cedula', label: 'Cédula de Identidad' },
                    { key: 'sucive_al_dia', label: 'SUCIVE al Día' },
                    { key: 'multas_al_dia', label: 'Sin Multas Pendientes' },
                    { key: 'llave_duplicado', label: 'Llave Duplicado' }
                  ]).map((doc) => {
                    const isChecked = Boolean((docsReceived as any)[doc.key]);
                    return (
                      <label
                        key={doc.key}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-panel border-rojo text-white'
                            : 'bg-negro border-borde text-gris-texto hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={isChecked}
                          onChange={(e) => {
                            setDocsReceived({ ...docsReceived, [doc.key]: e.target.checked });
                          }}
                          className="rounded bg-panel border-borde text-rojo focus:ring-0"
                        />
                        <span className="font-medium truncate">{doc.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 6: FOTOS DEL VEHÍCULO */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('fotos')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">6. Fotos HD &amp; Galería ({images.length})</span>
                {coverImage && (
                  <span className="text-[10px] text-rojo flex items-center gap-1">
                    <Star className="w-3 h-3 fill-rojo text-rojo" /> Portada asignada
                  </span>
                )}
              </div>
              {openSections.fotos ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.fotos && (
              <div className="p-4 pt-0 border-t border-borde space-y-4 pt-3">
                {/* File input con compresión en navegador */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!canEdit || isCompressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-rojo hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isCompressing ? 'Comprimiendo fotos...' : 'Cámara o Galería'}</span>
                  </button>

                  <div className="flex-1 flex gap-2 min-w-[240px]">
                    <input
                      type="url"
                      disabled={!canEdit}
                      placeholder="O pegar URL de imagen..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                    />
                    <button
                      type="button"
                      disabled={!canEdit || !newImageUrl.trim()}
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-panel hover:bg-zinc-700 text-white text-xs font-semibold disabled:opacity-40"
                    >
                      Agregar URL
                    </button>
                  </div>
                </div>

                {/* Grid de Fotos con controles */}
                {images.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-borde rounded-xl text-gray-500 text-xs">
                    No hay fotos cargadas. Usá la cámara de tu celular o seleccioná fotos de tu galería para subirlas comprimidas automáticamente.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, idx) => {
                      const isCover = coverImage === img;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border group bg-negro aspect-video flex flex-col justify-between ${
                            isCover ? 'border-rojo ring-2 ring-rojo/30' : 'border-borde'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Badge de Portada */}
                          {isCover && (
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-rojo text-white font-black text-[10px] flex items-center gap-1 shadow-md">
                              <Star className="w-3 h-3 fill-white" />
                              Portada
                            </div>
                          )}

                          {/* Controles de orden y acciones */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-white">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 rounded-md bg-rojo text-white hover:bg-red-700 transition-colors"
                                title="Eliminar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(img)}
                                  className="px-2 py-1 rounded bg-rojo text-white font-bold text-[10px] hover:bg-red-700 transition-colors"
                                >
                                  Hacer portada
                                </button>
                              )}
                              <div className="flex gap-1 ml-auto">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, 'up')}
                                  className="p-1 rounded bg-panel text-white hover:bg-zinc-700 disabled:opacity-30"
                                  title="Mover antes"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === images.length - 1}
                                  onClick={() => handleMoveImage(idx, 'down')}
                                  className="p-1 rounded bg-panel text-white hover:bg-zinc-700 disabled:opacity-30"
                                  title="Mover después"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 7: EQUIPAMIENTO, PUBLICACIÓN & NOTAS INTERNAS */}
          <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('publicacion')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">7. Equipamiento, Catálogo &amp; Notas</span>
                <span className="text-[10px] text-gris-texto">{features.length} ítems de equipamiento</span>
              </div>
              {openSections.publicacion ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
            </button>

            {openSections.publicacion && (
              <div className="p-4 pt-0 border-t border-borde space-y-4 pt-3">
                {/* Equipamiento sugerido */}
                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1.5">
                    Equipamiento y Accesorios:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {(dealershipConfig.equipment_items || []).map((eq) => {
                      const isSelected = features.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => handleToggleFeature(eq)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-rojo text-white font-bold'
                              : 'bg-panel text-gris-texto hover:bg-zinc-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {eq}
                        </button>
                      );
                    })}
                  </div>

                  {/* Agregar equipamiento personalizado */}
                  <div className="flex gap-2 mt-2.5">
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="Otro equipamiento..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="px-3 py-1.5 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                    />
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 bg-panel hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Descripción Pública */}
                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                    Descripción Pública para Catálogo Web / Tiendanube
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    placeholder="Detalles destacados del vehículo, estado general, garantía, etc..."
                    value={catalogDescription}
                    onChange={(e) => setCatalogDescription(e.target.value)}
                    className="w-full p-3 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo disabled:opacity-50"
                  />
                </div>

                {/* Notas Internas (Solo Admin) */}
                {isAdmin && (
                  <div>
                    <label className="block text-[11px] font-bold text-rojo uppercase mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Notas Internas Confidenciales (Taller / Negociación)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles mecánicos pendientes, acuerdos con el vendedor original, observaciones de margen..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full p-3 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                    />
                    <span className="text-[10px] text-gray-500">
                      Nunca se muestra al cliente ni se sincroniza con Tiendanube o el catálogo público.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 8: CAMPOS PERSONALIZADOS DINÁMICOS */}
          {(dealershipConfig.custom_fields || []).length > 0 && (
            <div className="rounded-xl border border-borde bg-negro/50 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('custom')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-panel/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">8. Campos Personalizados</span>
                  <span className="text-[10px] text-gris-texto">
                    {dealershipConfig.custom_fields.length} definidos
                  </span>
                </div>
                {openSections.custom ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
              </button>

              {openSections.custom && (
                <div className="p-4 pt-0 border-t border-borde grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {dealershipConfig.custom_fields.map((cf) => {
                    const val = customFields[cf.id];
                    return (
                      <div key={cf.id}>
                        <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                          {cf.name} {cf.required ? '*' : ''}
                          <span className="text-[9px] lowercase text-gray-500 ml-1">
                            ({cf.show_in_catalog ? 'Público' : 'Interno'})
                          </span>
                        </label>

                        {cf.type === 'boolean' ? (
                          <label className="flex items-center gap-2 p-2 bg-negro border border-borde rounded-xl text-xs text-white cursor-pointer">
                            <input
                              type="checkbox"
                              disabled={!canEdit}
                              checked={Boolean(val)}
                              onChange={(e) => setCustomFields({ ...customFields, [cf.id]: e.target.checked })}
                              className="rounded bg-panel border-borde text-rojo focus:ring-0"
                            />
                            <span>{val ? 'Sí' : 'No'}</span>
                          </label>
                        ) : cf.type === 'select' ? (
                          <select
                            disabled={!canEdit}
                            value={val || ''}
                            onChange={(e) => setCustomFields({ ...customFields, [cf.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                          >
                            <option value="">Seleccionar...</option>
                            {(cf.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={cf.type === 'number' ? 'number' : 'text'}
                            disabled={!canEdit}
                            required={cf.required}
                            value={val || ''}
                            onChange={(e) =>
                              setCustomFields({
                                ...customFields,
                                [cf.id]: cf.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                              })
                            }
                            className="w-full px-3 py-2 bg-negro border border-borde rounded-xl text-xs text-white focus:outline-none focus:border-rojo"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACCORDION 9: CHECKLIST ENTREGA 0KM */}
          {condition === '0km' && (
            <div className="rounded-xl border border-borde bg-negro border border-borde overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('entrega')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-negro border border-borde transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">9. Checklist de Entrega 0km</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-panel border border-borde text-white font-bold">
                    0km Exclusivo
                  </span>
                </div>
                {openSections.entrega ? <ChevronUp className="w-4 h-4 text-gris-texto" /> : <ChevronDown className="w-4 h-4 text-gris-texto" />}
              </button>

              {openSections.entrega && (
                <div className="p-4 pt-0 border-t border-borde space-y-2 pt-3">
                  {deliveryChecklist.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 p-2 bg-negro rounded-xl border border-borde text-xs text-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={item.done}
                        onChange={(e) => {
                          const updated = deliveryChecklist.items.map((i) =>
                            i.id === item.id ? { ...i, done: e.target.checked } : i
                          );
                          setDeliveryChecklist({ ...deliveryChecklist, items: updated });
                        }}
                        className="rounded bg-panel border-borde text-rojo focus:ring-0"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer con Guardar / Cancelar sin guardar */}
        <div className="p-4 bg-negro border-t border-borde flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar sin guardar
          </Button>

          <Button
            type="button"
            disabled={!canEdit}
            variant="primary"
            onClick={handleSubmit}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{vehicleToEdit ? 'Guardar Cambios' : 'Crear Vehículo'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

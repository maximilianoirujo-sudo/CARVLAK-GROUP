import React, { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipVehicleStatus,
  DealershipVehicleCondition,
  DealershipDeliveryChecklist,
  PurchaseOrigin,
  VehicleCategory,
  Currency,
  DealershipDocsReceived
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

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
  const { addDealershipVehicle, updateDealershipVehicle, dealershipConfig } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');

  // Form State
  const [activeTab, setActiveTab] = useState<'info' | 'compra' | 'venta' | 'fotos' | 'equipamiento' | 'entrega'>('info');

  // Ficha Básica
  const [condition, setCondition] = useState<DealershipVehicleCondition>('usado');
  const [plate, setPlate] = useState('');
  const [chassisVin, setChassisVin] = useState('');
  const [autonomyKm, setAutonomyKm] = useState<number>(0);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [category, setCategory] = useState<VehicleCategory>('Mediano');
  const [bodyType, setBodyType] = useState('Hatchback');
  const [transmission, setTransmission] = useState('Manual');
  const [fuel, setFuel] = useState('Nafta');
  const [mileage, setMileage] = useState<number>(0);
  const [colorExterior, setColorExterior] = useState('');
  const [padron, setPadron] = useState('');
  const [status, setStatus] = useState<DealershipVehicleStatus>('evaluacion');
  const [catalogDescription, setCatalogDescription] = useState('');

  // Datos de Compra
  const [purchaseOrigin, setPurchaseOrigin] = useState<PurchaseOrigin>('particular');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [isSupplierPayable, setIsSupplierPayable] = useState(false);
  const [payableDueDate, setPayableDueDate] = useState(() => new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseCurrency, setPurchaseCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(() => dealershipConfig?.default_exchange_rate || 43.50);

  // Checklist de Entrega para 0km
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

  // Documentación recibida
  const [docsReceived, setDocsReceived] = useState<DealershipDocsReceived>({
    titulo: false,
    libreta: true,
    cedula: true,
    sucive_al_dia: true,
    multas_al_dia: true,
    llave_duplicado: false,
    convenio_pago: false
  });

  // Datos de Venta & Financiación
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleCurrency, setSaleCurrency] = useState<Currency>('USD');
  const [minAcceptablePrice, setMinAcceptablePrice] = useState<number>(0);
  const [financingAvailable, setFinancingAvailable] = useState(true);
  const [minDownPayment, setMinDownPayment] = useState<number>(0);
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);

  // Equipamiento
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  // Fotos
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  // Cargar datos en edición
  useEffect(() => {
    if (vehicleToEdit) {
      setCondition(vehicleToEdit.condition || 'usado');
      setPlate(vehicleToEdit.plate || '');
      setChassisVin(vehicleToEdit.chassis_vin || '');
      setAutonomyKm(vehicleToEdit.autonomy_km || 0);
      setBrand(vehicleToEdit.brand || '');
      setModel(vehicleToEdit.model || '');
      setVersion(vehicleToEdit.version || '');
      setYear(vehicleToEdit.year || new Date().getFullYear());
      setCategory(vehicleToEdit.category || 'Mediano');
      setBodyType(vehicleToEdit.body_type || 'Hatchback');
      setTransmission(vehicleToEdit.transmission || 'Manual');
      setFuel(vehicleToEdit.fuel || 'Nafta');
      setMileage(vehicleToEdit.mileage || 0);
      setColorExterior(vehicleToEdit.color_exterior || '');
      setPadron(vehicleToEdit.padron || '');
      setStatus(vehicleToEdit.status || 'evaluacion');
      setCatalogDescription(vehicleToEdit.catalog_description || '');

      setPurchaseOrigin(vehicleToEdit.purchase_origin || 'particular');
      setPurchaseDate(vehicleToEdit.purchase_date || new Date().toISOString().slice(0, 10));
      setPurchasePrice(vehicleToEdit.purchase_price || 0);
      setPurchaseCurrency(vehicleToEdit.purchase_currency || 'USD');
      setExchangeRate(vehicleToEdit.exchange_rate || 43.50);
      setSupplierName(vehicleToEdit.supplier_payable?.supplier_name || '');
      setIsSupplierPayable(Boolean(vehicleToEdit.supplier_payable));
      setPayableDueDate(vehicleToEdit.supplier_payable?.due_date || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));

      if (vehicleToEdit.delivery_checklist) {
        setDeliveryChecklist(vehicleToEdit.delivery_checklist);
      }

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

      setSalePrice(vehicleToEdit.sale_price || 0);
      setSaleCurrency(vehicleToEdit.sale_currency || 'USD');
      setMinAcceptablePrice(vehicleToEdit.min_acceptable_price || Math.round((vehicleToEdit.sale_price || 0) * 0.95));
      setFinancingAvailable(vehicleToEdit.financing_available ?? true);
      setMinDownPayment(vehicleToEdit.min_down_payment_usd || 0);
      setMonthlyInstallment(vehicleToEdit.monthly_installment_estimate_usd || 0);
      setIsFeatured(vehicleToEdit.is_featured ?? false);

      setFeatures(vehicleToEdit.features || []);
      setImages(vehicleToEdit.images || []);
      setCoverImage(vehicleToEdit.cover_image || (vehicleToEdit.images && vehicleToEdit.images[0]));
    } else {
      // Defaults para nuevo auto
      setCondition('usado');
      setPlate('');
      setChassisVin('');
      setAutonomyKm(0);
      setBrand('');
      setModel('');
      setVersion('');
      setYear(new Date().getFullYear());
      setCategory('Mediano');
      setBodyType('Hatchback');
      setTransmission('Manual');
      setFuel('Nafta');
      setMileage(60000);
      setColorExterior('Gris Plata');
      setPadron('');
      setStatus('evaluacion');
      setCatalogDescription('');

      setPurchaseOrigin('particular');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setPurchasePrice(8000);
      setPurchaseCurrency('USD');
      setExchangeRate(dealershipConfig?.default_exchange_rate || 43.50);
      setSupplierName('');
      setIsSupplierPayable(false);
      setPayableDueDate(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
      setDeliveryChecklist({
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

      setSalePrice(10500);
      setSaleCurrency('USD');
      setMinAcceptablePrice(9800);
      setFinancingAvailable(true);
      setMinDownPayment(3000);
      setMonthlyInstallment(210);
      setIsFeatured(false);

      setFeatures([
        'Aire acondicionado',
        'Dirección hidráulica',
        'Airbags frontales',
        'Frenos ABS',
        'Cristales eléctricos'
      ]);
      setImages([]);
      setCoverImage(undefined);
    }
  }, [vehicleToEdit, dealershipConfig]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feat: string) => {
    setFeatures(features.filter((f) => f !== feat));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const url = newImageUrl.trim();
      setImages([...images, url]);
      if (!coverImage) {
        setCoverImage(url);
      }
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    if (coverImage === images[indexToRemove]) {
      setCoverImage(updated[0] || undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
        showToast('Por favor completá la matrícula, marca y modelo', 'error');
        return;
      }
    }

    const purchasePriceInUSD = purchaseCurrency === 'USD'
      ? Number(purchasePrice)
      : Math.round(Number(purchasePrice) / (Number(exchangeRate) || 43.50));

    const payload: Partial<DealershipVehicle> = {
      empresa_id: vehicleToEdit?.empresa_id || 'carvlak',
      condition,
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
      mileage: Number(mileage),
      color_exterior: colorExterior.trim(),
      padron: padron.trim(),
      status,
      is_featured: isFeatured,
      catalog_description: catalogDescription.trim(),
      purchase_origin: purchaseOrigin,
      purchase_date: purchaseDate,
      purchase_price: Number(purchasePrice),
      purchase_currency: purchaseCurrency,
      exchange_rate: Number(exchangeRate) || 43.50,
      supplier_payable: isSupplierPayable && supplierName.trim() ? {
        supplier_name: supplierName.trim(),
        due_date: payableDueDate,
        amount: purchasePriceInUSD,
        is_paid: false
      } : undefined,
      delivery_checklist: condition === '0km' ? deliveryChecklist : undefined,
      incomplete_data: false, // Ficha completada y confirmada
      docs_received: docsReceived,
      sale_price: Number(salePrice),
      sale_currency: saleCurrency,
      min_acceptable_price: Number(minAcceptablePrice) || Math.round(Number(salePrice) * 0.95),
      financing_available: financingAvailable,
      min_down_payment_usd: Number(minDownPayment),
      monthly_installment_estimate_usd: Number(monthlyInstallment),
      features,
      images,
      cover_image: coverImage || images[0] || undefined
    };

    if (vehicleToEdit) {
      updateDealershipVehicle(vehicleToEdit.id, payload);
      showToast('Vehículo actualizado con éxito', 'success');
    } else {
      addDealershipVehicle(payload as any);
      showToast('Vehículo agregado al inventario de la Automotora', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {vehicleToEdit ? `Editar ${vehicleToEdit.brand} ${vehicleToEdit.model}` : 'Nuevo Vehículo de Stock'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Ficha completa de compra, alistamiento, fotos y venta en la Automotora
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de Navegación del Modal */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-[#0A0E17] overflow-x-auto scrollbar-none">
          {[
            { id: 'info', label: '1. Ficha Técnica', icon: Car },
            { id: 'compra', label: '2. Compra & Docs', icon: FileText },
            { id: 'venta', label: '3. Precio & Venta', icon: DollarSign },
            { id: 'equipamiento', label: '4. Equipamiento', icon: Tag },
            { id: 'fotos', label: '5. Galería HD', icon: ImageIcon },
            ...(condition === '0km'
              ? [{ id: 'entrega', label: '6. Checklist Entrega 0km', icon: CheckSquare }]
              : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-bold rounded-t-2xl flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FICHA TÉCNICA */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Selector Condición: Usado vs 0km */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Condición del Vehículo:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      condition === '0km' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {condition === '0km' ? '⚡ 0km Stock Propio' : '🚗 Usado Seleccionado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {condition === '0km'
                      ? 'Stock propio CARVLAK. No requiere matrícula inmediata hasta empadronar. Usa checklist de entrega formal.'
                      : 'Vehículo usado verificado. Requiere matrícula para chequeo de padrón, SUCIVE e historial de service.'}
                  </p>
                </div>
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCondition('usado')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      condition === 'usado'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Usado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCondition('0km');
                      if (mileage > 500) setMileage(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      condition === '0km'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ 0km
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Matrícula {condition === '0km' ? '(Opcional hasta empadronar)' : '*'}
                  </label>
                  <input
                    type="text"
                    required={condition !== '0km'}
                    placeholder={condition === '0km' ? 'Pendiente empadronamiento' : 'SBA 1234'}
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Chasis / VIN {condition === '0km' && !plate ? '*' : '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 9BWZZZ377VT004..."
                    value={chassisVin}
                    onChange={(e) => setChassisVin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Volkswagen / Changan"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Golf / E-Star"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Versión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1.4 TSI Highline / EV"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kilometraje
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Categoría Porte
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Chico">Chico</option>
                    <option value="Mediano">Mediano</option>
                    <option value="SUV">SUV / Rural</option>
                    <option value="Pick-up">Pick-up</option>
                    <option value="Moto">Moto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Carrocería
                  </label>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hatchback">Hatchback</option>
                    <option value="Sedán">Sedán</option>
                    <option value="SUV">SUV</option>
                    <option value="Pick-up">Pick-up</option>
                    <option value="Coupé">Coupé</option>
                    <option value="Utilitario">Utilitario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transmisión
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automática">Automática</option>
                    <option value="Secuencial">Secuencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Combustible
                  </label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>
              </div>

              {(fuel === 'Eléctrico' || condition === '0km') && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-black text-white">Autonomía Eléctrica Estimada (km)</div>
                      <div className="text-[11px] text-slate-400">Rango de batería por ciclo completo de carga</div>
                    </div>
                  </div>
                  <div className="relative w-36 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Ej: 301"
                      value={autonomyKm || ''}
                      onChange={(e) => setAutonomyKm(Number(e.target.value))}
                      className="w-full px-3 py-2 pr-10 bg-slate-900 border border-emerald-500/50 rounded-xl text-xs font-black text-emerald-400 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">km</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Color Exterior
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Blanco Perlado"
                    value={colorExterior}
                    onChange={(e) => setColorExterior(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Padrón / VIN (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 149204 / 9BW..."
                    value={padron}
                    onChange={(e) => setPadron(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DealershipVehicleStatus)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  >
                    <option value="evaluacion">En Evaluación (Precompra)</option>
                    <option value="comprado">Comprado</option>
                    <option value="preparacion">En Preparación (Alistamiento)</option>
                    <option value="publicado">Publicado (Visible en Catálogo)</option>
                    <option value="reservado">Reservado con Seña</option>
                    <option value="vendido">Vendido</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Descripción para el Catálogo Web
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobresalientes, mantenimiento oficial, estado de cubiertas, único dueño..."
                  value={catalogDescription}
                  onChange={(e) => setCatalogDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COMPRA & DOCUMENTACIÓN */}
          {activeTab === 'compra' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                💡 <strong>Información Interna:</strong> Los costos de compra y márgenes solo son visibles para usuarios Administradores. Nunca se muestran en el catálogo público.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Origen de la Unidad
                  </label>
                  <select
                    value={purchaseOrigin}
                    onChange={(e) => setPurchaseOrigin(e.target.value as PurchaseOrigin)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="particular">Particular</option>
                    <option value="concesionaria">Concesionaria Aliada</option>
                    <option value="importador">Importador Directo / Mayorista</option>
                    <option value="parte_de_pago">Tomado en Parte de Pago (Permuta)</option>
                    <option value="consignacion">Consignación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Fecha de Ingreso / Compra
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tipo de Cambio ($U / USD)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Moneda de Compra
                  </label>
                  <select
                    value={purchaseCurrency}
                    onChange={(e) => setPurchaseCurrency(e.target.value as Currency)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="USD">Dólares Americanos (USD)</option>
                    <option value="UYU">Pesos Uruguayos ($U)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Precio de Compra / Toma *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      {purchaseCurrency === 'USD' ? 'USD' : '$U'}
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full pl-12 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Cuentas por Pagar Proveedor / Importador */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Pago al Proveedor / Importador
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Permite registrar la compra al contado o diferir el saldo en Cuentas por Pagar.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={isSupplierPayable}
                      onChange={(e) => setIsSupplierPayable(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs text-amber-400 font-bold">Cuentas por Pagar</span>
                  </label>
                </div>

                {isSupplierPayable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Nombre del Proveedor o Importador *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Sadar / Homero De León / Particular"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Fecha Límite de Vencimiento de Pago
                      </label>
                      <input
                        type="date"
                        value={payableDueDate}
                        onChange={(e) => setPayableDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist de Documentación Recibida */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Checklist de Documentación Recibida</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'titulo', label: 'Título de propiedad original / en trámite' },
                    { key: 'libreta', label: 'Libreta de propiedad al día' },
                    { key: 'cedula', label: 'Cédula de identidad del titular' },
                    { key: 'sucive_al_dia', label: 'SUCIVE al día (libre de patentes)' },
                    { key: 'multas_al_dia', label: 'Libre de multas intendencia / policía' },
                    { key: 'llave_duplicado', label: 'Duplicado de llaves presente' },
                    { key: 'convenio_pago', label: 'Convenio o gravamen cancelado' }
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(docsReceived[item.key as keyof DealershipDocsReceived])}
                        onChange={(e) =>
                          setDocsReceived({
                            ...docsReceived,
                            [item.key]: e.target.checked
                          })
                        }
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span className="text-slate-300 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRECIO & VENTA */}
          {activeTab === 'venta' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Moneda de Venta
                  </label>
                  <select
                    value={saleCurrency}
                    onChange={(e) => setSaleCurrency(e.target.value as Currency)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="USD">Dólares Americanos (USD)</option>
                    <option value="UYU">Pesos Uruguayos ($U)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Precio de Lista (Público) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">
                      {saleCurrency === 'USD' ? 'USD' : '$U'}
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={salePrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSalePrice(val);
                        if (!minAcceptablePrice || minAcceptablePrice > val) {
                          setMinAcceptablePrice(Math.round(val * 0.95));
                        }
                      }}
                      className="w-full pl-12 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Precio mínimo aceptable (Solo visible y editable por Admin) */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Precio Mínimo Aceptable (Piso de Negociación)</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      ADMIN ONLY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Límite hasta donde los vendedores pueden negociar o aceptar contraofertas sin pedir autorización.
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-bold">
                      USD
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={minAcceptablePrice}
                      onChange={(e) => setMinAcceptablePrice(Number(e.target.value))}
                      className="w-full pl-12 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Financiación */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Simulador &amp; Financiación Bancaria (Uruguay)
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={financingAvailable}
                      onChange={(e) => setFinancingAvailable(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500"
                    />
                    <span className="text-xs text-slate-300 font-bold">Habilitar Financiación</span>
                  </label>
                </div>

                {financingAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Entrega Mínima Sugerida (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={minDownPayment}
                        onChange={(e) => setMinDownPayment(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        placeholder="Ej: 3000"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Cuota Mensual Estimada (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={monthlyInstallment}
                        onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        placeholder="Ej: 210"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Destacado */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Destacar en la portada del Catálogo Web</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Aparece primero en las búsquedas y en el carrusel de novedades.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* TAB 4: EQUIPAMIENTO & CARACTERÍSTICAS */}
          {activeTab === 'equipamiento' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Agregar equipamiento (ej: Apple CarPlay, Techo Solar, Frenos ABS)..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Sugerencias Rápidas */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Comunes:</span>
                {[
                  'Aire acondicionado',
                  'Dirección hidráulica',
                  'Airbags frontales',
                  'Frenos ABS',
                  'Cristales eléctricos',
                  'Llantas de aleación',
                  'Cámara de retroceso',
                  'Sensores de estacionamiento',
                  'Pantalla táctil',
                  'Apple CarPlay / Android Auto',
                  'Tapizado en cuero',
                  'Control de estabilidad (ESP)',
                  'Velocidad crucero'
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      if (!features.includes(sug)) setFeatures([...features, sug]);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                      features.includes(sug)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Lista actual */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-black text-slate-300">
                  Equipamiento seleccionado ({features.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {features.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No hay equipamiento cargado aún.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GALERÍA DE FOTOS HD */}
          {activeTab === 'fotos' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Pegar URL de foto HD (TiendaNube, Imgur, Supabase, Cloudinary)..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Foto</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Podés pegar enlaces directos a imágenes. Hacé clic en la estrella de una imagen para seleccionarla como portada principal del catálogo.
              </p>

              {/* Grid de Fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => {
                  const isCover = coverImage === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden border aspect-video group bg-slate-900 ${
                        isCover ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Botón Portada */}
                      <button
                        type="button"
                        onClick={() => setCoverImage(imgUrl)}
                        className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                          isCover
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-950/70 text-slate-400 hover:text-white'
                        }`}
                        title={isCover ? 'Foto de Portada' : 'Marcar como Portada'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isCover ? 'fill-slate-950' : ''}`} />
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 text-rose-300 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-900"
                        title="Eliminar Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {isCover && (
                        <div className="absolute bottom-1.5 left-2 right-2 text-center py-0.5 bg-amber-500/90 text-slate-950 text-[10px] font-black rounded">
                          PORTADA
                        </div>
                      )}
                    </div>
                  );
                })}

                {images.length === 0 && (
                  <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                    No se han añadido fotos aún. Pegá una URL arriba para agregar la primera foto.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CHECKLIST DE ENTREGA 0KM */}
          {activeTab === 'entrega' && condition === '0km' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div>
                  <strong>Checklist de Entrega 0km:</strong> Verificación de arribo, batería, accesorios y entrega formal al cliente final.
                </div>
                <span className="font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs shrink-0">
                  {deliveryChecklist.items.filter(i => i.done).length} / {deliveryChecklist.items.length} Completados
                </span>
              </div>

              <div className="space-y-2">
                {deliveryChecklist.items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      item.done
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(e) => {
                        const updatedItems = deliveryChecklist.items.map((it) =>
                          it.id === item.id ? { ...it, done: e.target.checked } : it
                        );
                        const allDone = updatedItems.every((it) => it.done);
                        setDeliveryChecklist({
                          completed: allDone,
                          items: updatedItems
                        });
                      }}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{item.label}</div>
                    </div>
                    {item.done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{vehicleToEdit ? 'Guardar Cambios' : 'Registrar Auto en Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

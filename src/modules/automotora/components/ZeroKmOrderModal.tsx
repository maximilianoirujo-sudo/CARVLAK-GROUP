import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Car,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  BadgePercent,
  Wallet
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import {
  ZeroKmOrder,
  ZeroKmBrandConfig,
  ZeroKmProfitScheme,
  ZeroKmDeliveryStatus,
  ZeroKmPaymentStatus,
  ZeroKmImporterPaymentStatus
} from '../../../types';

interface ZeroKmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: ZeroKmOrder | null;
}

export const ZeroKmOrderModal: React.FC<ZeroKmOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit
}) => {
  const { profile } = useAuth();
  const {
    clients,
    zeroKmBrandConfigs,
    addZeroKmOrder,
    updateZeroKmOrder
  } = useData();

  // Selección de Marca
  const [selectedBrandName, setSelectedBrandName] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState('');
  const [chassisVin, setChassisVin] = useState('');

  // Cliente
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Importador y Esquema
  const [importerName, setImporterName] = useState('');
  const [importerScheme, setImporterScheme] = useState<ZeroKmProfitScheme>('margen');

  // Financiero (USD)
  const [salePriceClient, setSalePriceClient] = useState<number>(30000);
  const [amountToPayImporter, setAmountToPayImporter] = useState<number>(27000);
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [commissionVal, setCommissionVal] = useState<number>(4.5);
  const [commissionAmount, setCommissionAmount] = useState<number>(1350);

  // Seña inicial al crear orden
  const [initialDepositAmount, setInitialDepositAmount] = useState<number>(5000);
  const [initialDepositAccount, setInitialDepositAccount] = useState('Santander USD');
  const [initialDepositDate, setInitialDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialDepositReceipt, setInitialDepositReceipt] = useState('');
  const [hasInitialDeposit, setHasInitialDeposit] = useState(true);

  // Fecha Vencimiento Importador
  const [importerDueDate, setImporterDueDate] = useState('');

  // Vendedor y notas
  const [sellerName, setSellerName] = useState(profile?.full_name || 'Maximiliano Irujo');
  const [notes, setNotes] = useState('');

  // Inicializar o cargar si es edición
  useEffect(() => {
    if (orderToEdit) {
      setSelectedBrandName(orderToEdit.brand);
      setModel(orderToEdit.model);
      setVersion(orderToEdit.version);
      setYear(orderToEdit.year);
      setColor(orderToEdit.color || '');
      setChassisVin(orderToEdit.chassis_vin || '');
      setSelectedClientId(orderToEdit.client_id || '');
      setClientName(orderToEdit.client_name);
      setClientPhone(orderToEdit.client_phone);
      setClientEmail(orderToEdit.client_email || '');
      setImporterName(orderToEdit.importer_name);
      setImporterScheme(orderToEdit.importer_scheme);
      setSalePriceClient(orderToEdit.sale_price_client);
      setAmountToPayImporter(orderToEdit.amount_to_pay_importer);
      setCommissionAmount(orderToEdit.commission_from_importer || 0);
      setImporterDueDate(orderToEdit.importer_payment_due_date);
      setSellerName(orderToEdit.seller_name || profile?.full_name || 'Maximiliano Irujo');
      setNotes(orderToEdit.notes || '');
      setHasInitialDeposit(false);
    } else {
      // Default: primera marca disponible
      if (zeroKmBrandConfigs.length > 0) {
        const first = zeroKmBrandConfigs[0];
        handleSelectBrand(first.brand);
      }
      const today = new Date();
      today.setDate(today.getDate() + 15);
      setImporterDueDate(today.toISOString().split('T')[0]);
    }
  }, [orderToEdit, zeroKmBrandConfigs]);

  // Handler cambio de marca
  const handleSelectBrand = (brandName: string) => {
    setSelectedBrandName(brandName);
    const cfg = zeroKmBrandConfigs.find((b) => b.brand.toLowerCase() === brandName.toLowerCase());
    if (cfg) {
      setImporterName(cfg.importer_name);
      setImporterScheme(cfg.profit_scheme);
      if (cfg.default_commission_type) setCommissionType(cfg.default_commission_type);
      if (cfg.default_commission_value) {
        setCommissionVal(cfg.default_commission_value);
        if (cfg.default_commission_type === 'percentage') {
          setCommissionAmount(Math.round((salePriceClient * cfg.default_commission_value) / 100));
        } else {
          setCommissionAmount(cfg.default_commission_value);
        }
      }
      // Vencimiento según plazos
      const d = new Date();
      d.setDate(d.getDate() + (cfg.payment_terms_days || 15));
      setImporterDueDate(d.toISOString().split('T')[0]);
    }
  };

  // Recálculo de comisiones / importador al cambiar precios
  useEffect(() => {
    if (importerScheme === 'comision_aparte') {
      setAmountToPayImporter(salePriceClient); // En opción B, se le paga todo el precio de lista al importador
      if (commissionType === 'percentage') {
        setCommissionAmount(Math.round((salePriceClient * commissionVal) / 100));
      } else {
        setCommissionAmount(commissionVal);
      }
    }
  }, [salePriceClient, importerScheme, commissionType, commissionVal]);

  // Seleccionar cliente de la lista existente
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const c = clients.find((client) => client.id === clientId);
    if (c) {
      setClientName(c.full_name);
      setClientPhone(c.phone);
      setClientEmail(c.email || '');
    }
  };

  // Cálculo de ganancia resultante
  const resultingProfit =
    importerScheme === 'margen'
      ? Math.max(0, salePriceClient - amountToPayImporter)
      : commissionAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandName || !model.trim() || !clientName.trim() || !importerName.trim()) {
      alert('Por favor completa los campos requeridos (*)');
      return;
    }

    if (orderToEdit) {
      updateZeroKmOrder(orderToEdit.id, {
        brand: selectedBrandName,
        model: model.trim(),
        version: version.trim(),
        year: Number(year),
        color: color.trim() || undefined,
        chassis_vin: chassisVin.trim() || undefined,
        client_id: selectedClientId || undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || undefined,
        importer_name: importerName.trim(),
        importer_scheme: importerScheme,
        sale_price_client: Number(salePriceClient),
        amount_to_pay_importer: Number(amountToPayImporter),
        resulting_profit: resultingProfit,
        commission_from_importer: importerScheme === 'comision_aparte' ? commissionAmount : undefined,
        importer_payment_due_date: importerDueDate,
        seller_name: sellerName,
        notes: notes.trim() || undefined
      });
    } else {
      const deposit = hasInitialDeposit ? Number(initialDepositAmount) || 0 : 0;
      let paymentStatus: ZeroKmPaymentStatus = 'pendiente';
      if (deposit >= Number(salePriceClient)) {
        paymentStatus = 'cobrado_total';
      } else if (deposit > 0) {
        paymentStatus = 'sena_cobrada';
      }

      addZeroKmOrder({
        empresa_id: 'carvlak',
        brand: selectedBrandName,
        model: model.trim(),
        version: version.trim(),
        year: Number(year),
        color: color.trim() || undefined,
        chassis_vin: chassisVin.trim() || undefined,
        client_id: selectedClientId || undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || undefined,
        importer_name: importerName.trim(),
        importer_scheme: importerScheme,
        sale_price_client: Number(salePriceClient),
        amount_to_pay_importer: Number(amountToPayImporter),
        resulting_profit: resultingProfit,
        commission_from_importer: importerScheme === 'comision_aparte' ? commissionAmount : undefined,
        commission_status_from_importer: importerScheme === 'comision_aparte' ? 'pendiente' : undefined,
        client_deposit_amount: deposit,
        client_deposit_account: hasInitialDeposit && deposit > 0 ? initialDepositAccount : undefined,
        client_deposit_date: hasInitialDeposit && deposit > 0 ? initialDepositDate : undefined,
        client_balance_amount: 0,
        client_total_collected: deposit,
        client_payment_status: paymentStatus,
        importer_payment_due_date: importerDueDate,
        importer_payment_status: 'pendiente',
        amount_paid_to_importer: 0,
        unit_delivery_status: 'pedido_confirmado',
        seller_name: sellerName,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#12161F] border border-slate-800 rounded-3xl w-full max-w-3xl my-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#161B26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {orderToEdit ? 'Editar Venta 0km' : 'Nueva Venta de Unidad 0km'}
              </h2>
              <p className="text-xs text-slate-400">
                El cliente paga directo a CARVLAK. Registra cobros a rendir, pagos al importador y ganancia neta.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* SECCIÓN 1: DATOS DEL VEHÍCULO Y MARCA */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4" />
              <span>1. Vehículo &amp; Marca Configurada</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Marca *</label>
                <select
                  required
                  value={selectedBrandName}
                  onChange={(e) => handleSelectBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="">Seleccionar marca...</option>
                  {zeroKmBrandConfigs.map((b) => (
                    <option key={b.id} value={b.brand}>
                      {b.brand} ({b.profit_scheme === 'margen' ? 'Margen' : 'Comisión'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tracker, Song Plus, Hilux..."
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Versión</label>
                <input
                  type="text"
                  placeholder="Ej: LTZ Turbo AT, EV Premium..."
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Año</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Color Solicitado</label>
                <input
                  type="text"
                  placeholder="Ej: Blanco Perlado, Gris Plata..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Chasis / VIN (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 9BGKL..."
                  value={chassisVin}
                  onChange={(e) => setChassisVin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CLIENTE */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>2. Comprador / Cliente</span>
              </h3>
              {clients.length > 0 && (
                <div className="text-xs">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none"
                  >
                    <option value="">Seleccionar cliente de base...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="+598 99..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ESQUEMA FINANCIERO & IMPORTADOR */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>3. Números Comerciales &amp; Ganancia Real (USD)</span>
            </h3>

            {/* Selector de esquema para esta orden */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setImporterScheme('margen')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  importerScheme === 'margen'
                    ? 'bg-amber-500/10 border-amber-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Opción A: Margen</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${importerScheme === 'margen' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800'}`}>
                    Neto mayorista
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Ganancia = Precio cliente – Costo neto importador
                </p>
              </div>

              <div
                onClick={() => setImporterScheme('comision_aparte')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  importerScheme === 'comision_aparte'
                    ? 'bg-amber-500/10 border-amber-400 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Opción B: Comisión Aparte</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${importerScheme === 'comision_aparte' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800'}`}>
                    Lista completa
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  Pagas el 100% al importador. Comisión se cobra por separado.
                </p>
              </div>
            </div>

            {/* Inputs de Precios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Precio de Venta al Cliente *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={salePriceClient}
                    onChange={(e) => setSalePriceClient(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Total que paga el cliente</span>
              </div>

              {importerScheme === 'margen' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Precio Neto Importador *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="100"
                      required
                      value={amountToPayImporter}
                      onChange={(e) => setAmountToPayImporter(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Monto que CARVLAK pagará</span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Comisión del Importador *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        required
                        value={commissionAmount}
                        onChange={(e) => setCommissionAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold focus:outline-none focus:border-emerald-400"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">$</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">A liquidar en Cuentas por Cobrar</span>
                </div>
              )}

              {/* Ganancia resultante */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-center">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  Ganancia Neta CARVLAK
                </span>
                <span className="text-lg font-black text-amber-300 mt-0.5">
                  ${resultingProfit.toLocaleString()} USD
                </span>
                <span className="text-[10px] text-slate-400">
                  {importerScheme === 'margen' ? 'Margen comercial' : 'Comisión a cobrar'}
                </span>
              </div>
            </div>

            {/* Vencimiento y Datos de Pago al Importador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Importador / Concesionario Oficial
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={importerName}
                    onChange={(e) => setImporterName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Fecha Vencimiento Pago a Importador *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={importerDueDate}
                    onChange={(e) => setImporterDueDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: SEÑA INICIAL DEL CLIENTE (Solo al crear nueva orden) */}
          {!orderToEdit && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>4. Seña Inicial del Cliente</span>
                </h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasInitialDeposit}
                    onChange={(e) => setHasInitialDeposit(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Cobrar seña ahora</span>
                </label>
              </div>

              {hasInitialDeposit && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 animate-fade-in">
                  <p className="text-[11px] text-cyan-300 leading-relaxed">
                    Se registrará automáticamente en Caja como: <strong className="text-white">"Cobro 0km – fondos a rendir"</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Monto Seña *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={salePriceClient}
                          value={initialDepositAmount}
                          onChange={(e) => setInitialDepositAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Cuenta Destino *</label>
                      <select
                        value={initialDepositAccount}
                        onChange={(e) => setInitialDepositAccount(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Santander USD">Santander USD</option>
                        <option value="Itaú USD">Itaú USD</option>
                        <option value="Caja Efectivo USD">Caja Efectivo USD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Fecha Cobro</label>
                      <input
                        type="date"
                        value={initialDepositDate}
                        onChange={(e) => setInitialDepositDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Nº Recibo / Comprobante</label>
                      <input
                        type="text"
                        placeholder="Ej: REC-8831"
                        value={initialDepositReceipt}
                        onChange={(e) => setInitialDepositReceipt(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 5: OBSERVACIONES & VENDEDOR */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Atendido / Vendido por</label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas / Instrucciones de Pedido</label>
                <input
                  type="text"
                  placeholder="Detalles de entrega, accesorios solicitados..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{orderToEdit ? 'Guardar Cambios' : 'Confirmar Orden 0km'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

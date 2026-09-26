import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Car,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  RefreshCw
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipSaleRecord,
  DealershipReservation,
  DealershipPaymentMethod
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface DealershipSaleModalProps {
  vehicle: DealershipVehicle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DealershipSaleModal: React.FC<DealershipSaleModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  if (!isOpen || !vehicle) return null;

  const {
    updateDealershipVehicleStatus,
    clients,
    dealershipConfig
  } = useData();
  const { availableProfiles, profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');

  // Tipo de operación: 'reserva' | 'venta'
  const [operationType, setOperationType] = useState<'reserva' | 'venta'>(
    vehicle.status === 'reservado' ? 'venta' : 'venta'
  );

  // Datos Reserva
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [reservationExpiresAt, setReservationExpiresAt] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  // Datos Comprador
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDocument, setBuyerDocument] = useState('');

  // Datos Venta
  const [salePrice, setSalePrice] = useState<number>(vehicle.sale_price || 0);
  const [paymentMethod, setPaymentMethod] = useState<DealershipPaymentMethod>('contado');
  const [bankName, setBankName] = useState('Banco Santander Uruguay');
  const [sellerId, setSellerId] = useState(profile?.id || 'user-maxi');
  const [offerPosventa, setOfferPosventa] = useState(true);
  const [saleNotes, setSaleNotes] = useState('');

  // Datos de Permuta (si entrega auto)
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInBrand, setTradeInBrand] = useState('');
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInYear, setTradeInYear] = useState<number>(2017);
  const [tradeInPlate, setTradeInPlate] = useState('');
  const [tradeInMileage, setTradeInMileage] = useState<number>(90000);
  const [tradeInValuation, setTradeInValuation] = useState<number>(4500);

  // Cálculo de Margen y Comisión estimada
  const realCostUsd = vehicle.total_real_cost_usd || vehicle.purchase_price;
  const grossProfitUsd = salePrice - realCostUsd;

  const commissionRate = dealershipConfig?.seller_commission_percentage || 15;
  const calculatedCommission = Math.max(
    50,
    grossProfitUsd > 0 ? Math.round((grossProfitUsd * commissionRate) / 100) : 100
  );

  // Manejador de Registro de Reserva
  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast('Por favor completá nombre y teléfono del cliente que reserva', 'error');
      return;
    }

    const reservation: DealershipReservation = {
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      deposit_amount: Number(depositAmount),
      deposit_currency: 'USD',
      reserved_at: new Date().toISOString(),
      expires_at: reservationExpiresAt,
      notes: saleNotes.trim()
    };

    updateDealershipVehicleStatus(vehicle.id, 'reservado', { reservation });
    showToast(`Unidad ${vehicle.plate} reservada con seña de USD ${depositAmount}`, 'success');
    onClose();
  };

  // Manejador de Venta Definitiva
  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast('Por favor completá los datos del comprador', 'error');
      return;
    }

    const tradeInPayload = hasTradeIn
      ? {
          brand: tradeInBrand.trim(),
          model: tradeInModel.trim(),
          year: Number(tradeInYear),
          plate: tradeInPlate.trim().toUpperCase(),
          mileage: Number(tradeInMileage),
          trade_in_valuation_usd: Number(tradeInValuation)
        }
      : undefined;

    const saleRecord: DealershipSaleRecord = {
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      buyer_email: buyerEmail.trim() || undefined,
      buyer_document: buyerDocument.trim() || undefined,
      sale_price: Number(salePrice),
      sale_currency: 'USD',
      sale_date: new Date().toISOString().slice(0, 10),
      payment_method: paymentMethod,
      seller_id: sellerId,
      commission_amount: calculatedCommission,
      commission_paid: false,
      gross_profit_usd: grossProfitUsd,
      trade_in: tradeInPayload,
      notes: saleNotes.trim()
    };

    updateDealershipVehicleStatus(vehicle.id, 'vendido', {
      saleRecord,
      tradeIn: tradeInPayload,
      seller_id: sellerId,
      commissionAmount: calculatedCommission,
      offerPosventa
    });

    showToast(`¡Venta de ${vehicle.brand} ${vehicle.model} completada con éxito!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0D121C] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {operationType === 'reserva' ? 'Registrar Seña / Reserva' : 'Liquidar Venta Definitiva'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {vehicle.brand} {vehicle.model} ({vehicle.year}) • Matrícula: {vehicle.plate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Operación */}
        <div className="flex items-center gap-2 p-3 bg-[#0A0E17] border-b border-slate-800">
          <button
            type="button"
            onClick={() => setOperationType('venta')}
            className={`flex-1 py-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              operationType === 'venta'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Venta Definitiva</span>
          </button>

          <button
            type="button"
            onClick={() => setOperationType('reserva')}
            className={`flex-1 py-2 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              operationType === 'reserva'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Seña / Reserva Temporal</span>
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={operationType === 'reserva' ? handleConfirmReservation : handleConfirmSale}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {/* DATOS DEL COMPRADOR / RESERVANTE */}
          <div className="space-y-3">
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Datos del Comprador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Méndez"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="099 876 543"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Cédula / RUT (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="4.123.456-7"
                  value={buyerDocument}
                  onChange={(e) => setBuyerDocument(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          {/* SI ES RESERVA */}
          {operationType === 'reserva' && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Condiciones de la Seña</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Monto de la Seña (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-black text-emerald-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Vencimiento de la Reserva
                  </label>
                  <input
                    type="date"
                    required
                    value={reservationExpiresAt}
                    onChange={(e) => setReservationExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SI ES VENTA DEFINITIVA */}
          {operationType === 'venta' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Condiciones de Cierre &amp; Pago</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Precio de Venta Definitivo (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl font-black text-emerald-400 text-base"
                    />
                    {isAdmin && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Piso mínimo aceptable: USD {vehicle.min_acceptable_price || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Forma de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        const val = e.target.value as DealershipPaymentMethod;
                        setPaymentMethod(val);
                        if (val === 'permuta') {
                          setHasTradeIn(true);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    >
                      <option value="contado">Contado Efectivo / Transferencia</option>
                      <option value="financiacion">Financiación Bancaria (100% o parcial)</option>
                      <option value="permuta">Permuta (Toma de auto en parte de pago)</option>
                      <option value="combinado">Contado + Permuta + Saldo Bancario</option>
                    </select>
                  </div>
                </div>

                {/* Si es bancario */}
                {(paymentMethod === 'financiacion' || paymentMethod === 'combinado') && (
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Banco que Financia
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    >
                      <option value="Banco Santander Uruguay">Banco Santander Uruguay</option>
                      <option value="Banco Itaú Uruguay">Banco Itaú Uruguay</option>
                      <option value="BBVA Uruguay">BBVA Uruguay</option>
                      <option value="Scotiabank Uruguay">Scotiabank Uruguay</option>
                      <option value="Financiamiento Propio CARVLAK">Financiamiento Propio</option>
                    </select>
                  </div>
                )}
              </div>

              {/* SECCIÓN PERMUTA / TRADE-IN AUTOMÁTICO */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      ¿Toma de Auto en Permuta?
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTradeIn}
                      onChange={(e) => setHasTradeIn(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-300">Sí, entrega un auto</span>
                  </label>
                </div>

                {hasTradeIn && (
                  <div className="space-y-3 pt-2">
                    <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-300">
                      🔄 <strong>Ingreso Automático:</strong> Este vehículo ingresará inmediatamente a la Automotora en estado <em>Evaluación</em> para ser peritado en Fase 3 y luego vendido.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Matrícula Permuta *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="SAA 1234"
                          value={tradeInPlate}
                          onChange={(e) => setTradeInPlate(e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono font-bold text-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Marca *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Chevrolet"
                          value={tradeInBrand}
                          onChange={(e) => setTradeInBrand(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Modelo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Onix Joy"
                          value={tradeInModel}
                          onChange={(e) => setTradeInModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Año
                        </label>
                        <input
                          type="number"
                          value={tradeInYear}
                          onChange={(e) => setTradeInYear(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Kilometraje
                        </label>
                        <input
                          type="number"
                          value={tradeInMileage}
                          onChange={(e) => setTradeInMileage(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Valor de Toma Acordado (USD) *
                        </label>
                        <input
                          type="number"
                          required
                          value={tradeInValuation}
                          onChange={(e) => setTradeInValuation(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-bold text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VENDEDOR Y COMISIÓN */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Vendedor Asignado
                    </label>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    >
                      {availableProfiles.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.roles.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Comisión Vendedor ({commissionRate}% sobre margen)
                      </label>
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-bold">A liquidar:</span>
                        <span className="font-mono text-sm font-black text-amber-400">
                          USD {calculatedCommission}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKBOX POSVENTA */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerPosventa}
                  onChange={(e) => setOfferPosventa(e.target.checked)}
                  className="rounded border-slate-700 text-purple-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Beneficio Posventa: Emitir cupón 20% OFF para DetailVlak</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Crea automáticamente una cotización bonificada a nombre de {buyerName || 'comprador'}.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* NOTAS */}
          <div className="text-xs">
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Notas Adicionales
            </label>
            <textarea
              rows={2}
              placeholder="Detalles del cierre, entrega de títulos, escribanía interviniente..."
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white resize-none"
            />
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                operationType === 'reserva'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{operationType === 'reserva' ? 'Confirmar Reserva (Seña)' : 'Cerrar y Liquidar Venta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

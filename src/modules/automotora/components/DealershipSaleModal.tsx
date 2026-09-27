import React, { useState } from 'react';
import {
  X,
  DollarSign,
  User,
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  DealershipVehicle,
  DealershipPaymentMethod,
  DealershipSaleRecord
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/ui/Button';

interface DealershipSaleModalProps {
  vehicle: DealershipVehicle;
  isOpen: boolean;
  onClose: () => void;
}

export const DealershipSaleModal: React.FC<DealershipSaleModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const { updateDealershipVehicleStatus, dealershipConfig } = useData();
  const { profile, availableProfiles } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles.includes('admin');
  const activeProfiles = (availableProfiles || []).filter((p) => p.is_active);

  // Tipo de operación
  const [operationType, setOperationType] = useState<'venta' | 'reserva'>(
    vehicle.status === 'reservado' ? 'venta' : 'venta'
  );

  // Datos del Comprador
  const [buyerName, setBuyerName] = useState(vehicle.reservation?.client_name || vehicle.reservation?.buyer_name || '');
  const [buyerPhone, setBuyerPhone] = useState(vehicle.reservation?.client_phone || vehicle.reservation?.buyer_phone || '');
  const [buyerDocument, setBuyerDocument] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // Datos de Reserva (si aplica)
  const [depositAmount, setDepositAmount] = useState<number>(
    vehicle.reservation?.deposit_amount || vehicle.reservation?.amount || 500
  );
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string>(
    vehicle.reservation?.expires_at ||
      vehicle.reservation?.expiration_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Datos de Venta Definitiva
  const [salePrice, setSalePrice] = useState<number>(vehicle.sale_price || 0);
  const [paymentMethod, setPaymentMethod] = useState<DealershipPaymentMethod>('contado');
  const [bankFinancingEntity, setBankFinancingEntity] = useState('Santander');
  const [bankFinancingAmount, setBankFinancingAmount] = useState<number>(0);

  // Permuta / Toma de usado
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInBrand, setTradeInBrand] = useState('');
  const [tradeInModel, setTradeInModel] = useState('');
  const [tradeInYear, setTradeInYear] = useState<number>(2018);
  const [tradeInPlate, setTradeInPlate] = useState('');
  const [tradeInValuation, setTradeInValuation] = useState<number>(0);
  const [tradeInMileage, setTradeInMileage] = useState<number>(80000);

  // Vendedor y Comisión
  const [sellerId, setSellerId] = useState<string>(profile?.id || activeProfiles[0]?.id || '');
  const commissionRate = dealershipConfig?.seller_commission_percentage || dealershipConfig?.default_commission_rate || 15;

  // Beneficio Posventa DetailVlak (Cupón 20% off)
  const [offerPosventa, setOfferPosventa] = useState(true);

  // Notas
  const [saleNotes, setSaleNotes] = useState('');

  // Cálculos automáticos de ganancia y comisión
  const costUsd = vehicle.total_real_cost_usd || vehicle.purchase_price || 0;
  const grossProfitUsd = Math.max(0, salePrice - costUsd);
  const calculatedCommission = Math.round((grossProfitUsd * commissionRate) / 100);

  // Handlers
  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast('Por favor completá nombre y teléfono del cliente', 'error');
      return;
    }

    updateDealershipVehicleStatus(vehicle.id, 'reservado', {
      reservation: {
        client_name: buyerName.trim(),
        client_phone: buyerPhone.trim(),
        deposit_amount: Number(depositAmount) || 0,
        reserved_at: new Date().toISOString(),
        expires_at: reservationExpiresAt,
        notes: saleNotes.trim()
      }
    });

    showToast(`Vehículo ${vehicle.brand} ${vehicle.model} reservado con éxito`, 'success');
    onClose();
  };

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast('Por favor completá los datos del comprador', 'error');
      return;
    }
    if (salePrice <= 0) {
      showToast('El precio de venta debe ser mayor a cero', 'error');
      return;
    }

    const tradeInPayload = hasTradeIn
      ? {
          brand: tradeInBrand.trim(),
          model: tradeInModel.trim(),
          year: Number(tradeInYear),
          plate: tradeInPlate.trim().toUpperCase(),
          valuation_usd: Number(tradeInValuation),
          mileage: Number(tradeInMileage)
        }
      : undefined;

    const saleRecord: DealershipSaleRecord = {
      sale_date: new Date().toISOString(),
      sale_price: Number(salePrice),
      buyer_name: buyerName.trim(),
      buyer_phone: buyerPhone.trim(),
      buyer_document: buyerDocument.trim() || undefined,
      buyer_email: buyerEmail.trim() || undefined,
      payment_method: paymentMethod,
      seller_id: sellerId,
      commission_amount: calculatedCommission,
      seller_commission_amount: calculatedCommission,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-panel border border-borde rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-borde text-white flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5 text-rojo" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {operationType === 'reserva' ? 'Registrar Seña / Reserva' : 'Liquidar Venta Definitiva'}
              </h2>
              <p className="text-[11px] text-gris-texto">
                {vehicle.brand} {vehicle.model} ({vehicle.year}) • Matrícula: {vehicle.plate || vehicle.chassis_vin || 'Sin matrícula'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gris-texto hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Operación */}
        <div className="flex items-center gap-2 p-3 bg-negro border-b border-borde">
          <button
            type="button"
            onClick={() => setOperationType('venta')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              operationType === 'venta'
                ? 'bg-white text-black'
                : 'text-gris-texto hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Venta Definitiva</span>
          </button>

          <button
            type="button"
            onClick={() => setOperationType('reserva')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              operationType === 'reserva'
                ? 'bg-white text-black'
                : 'text-gris-texto hover:text-white'
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
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-rojo" />
              <span>Datos del Comprador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Méndez"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-negro border border-borde rounded-lg text-white placeholder-gris-texto focus:border-rojo outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="099 876 543"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-negro border border-borde rounded-lg text-white font-mono placeholder-gris-texto focus:border-rojo outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                  Cédula / RUT (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="4.123.456-7"
                  value={buyerDocument}
                  onChange={(e) => setBuyerDocument(e.target.value)}
                  className="w-full px-3 py-2 bg-negro border border-borde rounded-lg text-white font-mono placeholder-gris-texto focus:border-rojo outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-negro border border-borde rounded-lg text-white placeholder-gris-texto focus:border-rojo outline-none"
                />
              </div>
            </div>
          </div>

          {/* SI ES RESERVA */}
          {operationType === 'reserva' && (
            <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rojo" />
                <span>Condiciones de la Seña</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                    Monto de la Seña (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-panel border border-borde rounded-lg font-bold text-white text-sm focus:border-rojo outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                    Vencimiento de la Reserva
                  </label>
                  <input
                    type="date"
                    required
                    value={reservationExpiresAt}
                    onChange={(e) => setReservationExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-panel border border-borde rounded-lg text-white font-bold focus:border-rojo outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SI ES VENTA DEFINITIVA */}
          {operationType === 'venta' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rojo" />
                  <span>Condiciones de Cierre &amp; Pago</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Precio de Venta Definitivo (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-panel border border-borde rounded-lg font-bold text-white text-base focus:border-rojo outline-none"
                    />
                    {isAdmin && (
                      <div className="text-[10px] text-gris-texto mt-0.5">
                        Piso mínimo aceptable: USD {vehicle.min_acceptable_price || 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
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
                      className="w-full px-3 py-2 bg-panel border border-borde rounded-lg text-white font-bold focus:border-rojo outline-none"
                    >
                      <option value="contado">Contado Efectivo / Transferencia</option>
                      <option value="financiacion">Financiación Bancaria (100% o parcial)</option>
                      <option value="permuta">Permuta (Toma de usado + diferencia)</option>
                      <option value="mixto">Mixto (Seña previa + Cuotas/Banco)</option>
                    </select>
                  </div>
                </div>

                {/* Si es Financiación Bancaria */}
                {paymentMethod === 'financiacion' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-borde">
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                        Banco Interviniente
                      </label>
                      <input
                        type="text"
                        value={bankFinancingEntity}
                        onChange={(e) => setBankFinancingEntity(e.target.value)}
                        className="w-full px-3 py-2 bg-panel border border-borde rounded-lg text-white focus:border-rojo outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                        Monto Financiado (USD)
                      </label>
                      <input
                        type="number"
                        value={bankFinancingAmount}
                        onChange={(e) => setBankFinancingAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-panel border border-borde rounded-lg text-white font-bold focus:border-rojo outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TOMA DE USADO / PERMUTA */}
              <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ¿Entrega auto usado como parte de pago?
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTradeIn}
                      onChange={(e) => setHasTradeIn(e.target.checked)}
                      className="rounded border-borde text-rojo focus:ring-0"
                    />
                    <span className="text-xs font-bold text-gris-texto">Sí, entrega un auto</span>
                  </label>
                </div>

                {hasTradeIn && (
                  <div className="pt-2 border-t border-borde space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Marca *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Chevrolet"
                          value={tradeInBrand}
                          onChange={(e) => setTradeInBrand(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-white focus:border-rojo outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Modelo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Onix"
                          value={tradeInModel}
                          onChange={(e) => setTradeInModel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-white focus:border-rojo outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Año *
                        </label>
                        <input
                          type="number"
                          required
                          value={tradeInYear}
                          onChange={(e) => setTradeInYear(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-white focus:border-rojo outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Matrícula *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="SBX 1234"
                          value={tradeInPlate}
                          onChange={(e) => setTradeInPlate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-white font-mono focus:border-rojo outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Kilometraje
                        </label>
                        <input
                          type="number"
                          value={tradeInMileage}
                          onChange={(e) => setTradeInMileage(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg text-white focus:border-rojo outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gris-texto uppercase mb-1">
                          Valor de Toma Acordado (USD) *
                        </label>
                        <input
                          type="number"
                          required
                          value={tradeInValuation}
                          onChange={(e) => setTradeInValuation(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-panel border border-borde rounded-lg font-bold text-white focus:border-rojo outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VENDEDOR Y COMISIÓN */}
              <div className="p-4 rounded-xl bg-negro border border-borde space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                      Vendedor Asignado
                    </label>
                    <select
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      className="w-full px-3 py-2 bg-panel border border-borde rounded-lg text-white font-bold focus:border-rojo outline-none"
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
                      <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
                        Comisión Vendedor ({commissionRate}% sobre margen)
                      </label>
                      <div className="p-2 bg-panel rounded-lg border border-borde flex items-center justify-between">
                        <span className="text-gris-texto text-xs font-bold">A liquidar:</span>
                        <span className="font-mono text-sm font-bold text-white">
                          USD {calculatedCommission}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKBOX POSVENTA */}
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-negro border border-borde cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerPosventa}
                  onChange={(e) => setOfferPosventa(e.target.checked)}
                  className="rounded border-borde text-rojo focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rojo" />
                    <span>Beneficio Posventa: Emitir cupón 20% OFF para DetailVlak</span>
                  </div>
                  <div className="text-[11px] text-gris-texto">
                    Crea automáticamente una cotización bonificada a nombre de {buyerName || 'comprador'}.
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* NOTAS */}
          <div className="text-xs">
            <label className="block text-[11px] font-bold text-gris-texto uppercase mb-1">
              Notas Adicionales
            </label>
            <textarea
              rows={2}
              placeholder="Detalles del cierre, entrega de títulos, escribanía interviniente..."
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              className="w-full px-3 py-2 bg-negro border border-borde rounded-lg text-white placeholder-gris-texto focus:border-rojo outline-none resize-none"
            />
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-4 border-t border-borde flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{operationType === 'reserva' ? 'Confirmar Reserva (Seña)' : 'Cerrar y Liquidar Venta'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

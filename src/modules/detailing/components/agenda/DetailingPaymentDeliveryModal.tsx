import React, { useState } from 'react';
import { DollarSign, CheckCircle, CreditCard, Wallet, Car, AlertCircle, Receipt } from 'lucide-react';
import { DetailingQuote, DetailingConfig, DetailingPayment } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { formatCurrency, getLocalDateString } from '../../../../lib/formatters';

interface DetailingPaymentDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
  config: DetailingConfig;
  onConfirmDeliveryAndPayment: (quoteId: string, paymentData?: Omit<DetailingPayment, 'id'>) => void;
}

export const DetailingPaymentDeliveryModal: React.FC<DetailingPaymentDeliveryModalProps> = ({
  isOpen,
  onClose,
  quote,
  config,
  onConfirmDeliveryAndPayment
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
  const [registerFullPayment, setRegisterFullPayment] = useState<boolean>(true);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  React.useEffect(() => {
    if (quote) {
      const alreadyPaid = (quote.payments || [])
        .filter((p) => !p.is_voided)
        .reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, quote.total_amount - alreadyPaid);
      setAmountToPay(remaining);
      setRegisterFullPayment(remaining > 0);
    }
  }, [quote, isOpen]);

  if (!quote) return null;

  const totalPaid = (quote.payments || [])
    .filter((p) => !p.is_voided)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingBalance = Math.max(0, quote.total_amount - totalPaid);

  const availableMethods = config.payment_methods || [
    'Efectivo',
    'Transferencia Bancaria',
    'Mercado Pago',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Cuenta Corriente (Fiado)'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerFullPayment && amountToPay > 0) {
      const paymentPayload: Omit<DetailingPayment, 'id'> = {
        date: getLocalDateString(),
        amount: amountToPay,
        payment_method: paymentMethod,
        type: amountToPay >= pendingBalance ? 'saldo' : 'seña',
        notes: notes.trim() || undefined
      };
      onConfirmDeliveryAndPayment(quote.id, paymentPayload);
    } else {
      // Entregar sin registrar pago nuevo si ya estaba cobrado o queda en cuenta corriente
      onConfirmDeliveryAndPayment(quote.id);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entrega y Cobro del Vehículo"
      subtitle="Verificá los importes cobrados, registrá el saldo y finalizá el servicio."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumen del trabajo */}
        <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#161616] font-display">{quote.vehicle_info}</p>
              <p className="text-xs text-[#6B6B6B]">Cliente: {quote.client_name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#6B6B6B]">Total del Servicio</span>
              <p className="text-base font-bold text-[#161616] font-display">{formatCurrency(quote.total_amount)}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E5E3] flex justify-between text-xs">
            <span className="text-[#6B6B6B]">Cobrado previamente:</span>
            <span className="font-semibold text-emerald-700">{formatCurrency(totalPaid)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#E5E5E3]">
            <span className="text-[#161616]">Saldo pendiente a cobrar:</span>
            <span className={pendingBalance > 0 ? 'text-[#D7141A]' : 'text-emerald-600'}>
              {formatCurrency(pendingBalance)}
            </span>
          </div>
        </div>

        {/* Sección de Pago */}
        {pendingBalance > 0 ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={registerFullPayment}
                onChange={(e) => setRegisterFullPayment(e.target.checked)}
                className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A] border-gray-300"
              />
              <span className="text-xs font-semibold text-[#161616]">
                Registrar cobro de saldo en este momento
              </span>
            </label>

            {registerFullPayment && (
              <div className="space-y-3 pl-6 border-l-2 border-[#D7141A]/30">
                <div>
                  <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
                    Monto a registrar ($)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={quote.total_amount}
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] font-bold focus:outline-none focus:border-[#D7141A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
                    Medio de pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
                  >
                    {availableMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
                    Nota o comprobante (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Transferencia Brou ref #99831"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>El trabajo ya está totalmente abonado. No hay saldo pendiente.</span>
          </div>
        )}

        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
          <p className="font-semibold mb-0.5">Automático al confirmar entrega:</p>
          <ul className="list-disc list-inside text-[11px] space-y-0.5 text-blue-800">
            <li>Se descuenta del inventario el stock según la receta del servicio.</li>
            <li>Se liquida la comisión asignada al detailer del trabajo.</li>
            <li>El vehículo queda registrado como finalizado con éxito.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Confirmar Entrega y Cobrado
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle,
  CreditCard,
  Wallet,
  Car,
  AlertCircle,
  Receipt,
  Plus,
  Trash2,
  Share2,
  FileText,
  Check,
  MessageCircle
} from 'lucide-react';
import { DetailingQuote, DetailingConfig, DetailingPayment } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { formatCurrency, getLocalDateString } from '../../../../lib/formatters';
import { useData } from '../../../../context/DataContext';
import { useToast } from '../../../../context/ToastContext';

interface SplitPaymentRow {
  id: string;
  amount: number;
  method: string;
  notes: string;
}

interface DetailingPaymentDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
  config: DetailingConfig;
  onConfirmDeliveryAndPayment: (
    quoteId: string,
    paymentsData?: Omit<DetailingPayment, 'id'>[]
  ) => void;
}

export const DetailingPaymentDeliveryModal: React.FC<DetailingPaymentDeliveryModalProps> = ({
  isOpen,
  onClose,
  quote,
  config,
  onConfirmDeliveryAndPayment
}) => {
  const { generateDetailingReceipt, detailingReceipts } = useData();
  const { showToast } = useToast();

  const availableMethods = config.payment_methods || [
    'Efectivo',
    'Transferencia Bancaria',
    'Mercado Pago',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Cuenta Corriente (Fiado)'
  ];

  // Recuperar último medio de pago usado
  const getLastUsedMethod = () => {
    return localStorage.getItem('detailing_last_payment_method') || availableMethods[0] || 'Efectivo';
  };

  const [splitPayments, setSplitPayments] = useState<SplitPaymentRow[]>([]);
  const [registerPayment, setRegisterPayment] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [generatedReceiptNumber, setGeneratedReceiptNumber] = useState<string>('');
  const [generatedReceiptToken, setGeneratedReceiptToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (quote && isOpen) {
      setIsCompleted(false);
      setGeneratedReceiptNumber('');
      setGeneratedReceiptToken('');
      setIsSubmitting(false);

      const alreadyPaid = (quote.payments || [])
        .filter((p) => !p.is_voided)
        .reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, quote.total_amount - alreadyPaid);

      setRegisterPayment(remaining > 0);
      setSplitPayments([
        {
          id: 'pay-1',
          amount: remaining,
          method: getLastUsedMethod(),
          notes: ''
        }
      ]);
    }
  }, [quote, isOpen]);

  if (!quote) return null;

  const totalPaidBefore = (quote.payments || [])
    .filter((p) => !p.is_voided)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingBalance = Math.max(0, quote.total_amount - totalPaidBefore);

  const totalRegisteringNow = registerPayment
    ? splitPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : 0;

  const remainingAfterPayment = Math.max(0, pendingBalance - totalRegisteringNow);

  // Agregar fila de pago dividido
  const handleAddSplitRow = () => {
    const unallocated = Math.max(0, pendingBalance - totalRegisteringNow);
    setSplitPayments((prev) => [
      ...prev,
      {
        id: `pay-${Date.now()}`,
        amount: unallocated,
        method: availableMethods[1] || 'Transferencia Bancaria',
        notes: ''
      }
    ]);
  };

  // Quitar fila
  const handleRemoveSplitRow = (id: string) => {
    if (splitPayments.length <= 1) return;
    setSplitPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Actualizar fila
  const handleUpdateSplitRow = (id: string, field: keyof SplitPaymentRow, value: any) => {
    setSplitPayments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Guardar el último medio de pago para la próxima vez
      if (splitPayments.length > 0 && splitPayments[0].method) {
        localStorage.setItem('detailing_last_payment_method', splitPayments[0].method);
      }

      const todayDate = getLocalDateString();
      const paymentsPayload: Omit<DetailingPayment, 'id'>[] = [];

      if (registerPayment && splitPayments.length > 0) {
        splitPayments.forEach((row) => {
          if (row.amount > 0) {
            paymentsPayload.push({
              date: todayDate,
              amount: row.amount,
              payment_method: row.method,
              method: row.method,
              type: row.amount >= pendingBalance ? 'saldo' : 'seña',
              notes: row.notes.trim() || undefined,
              is_voided: false
            });
          }
        });
      }

      // 1. Confirmar entrega y cobro
      onConfirmDeliveryAndPayment(quote.id, paymentsPayload);

      // 2. Generar comprobante oficial con número atómico
      const receipt = await generateDetailingReceipt(quote.id);
      if (receipt) {
        setGeneratedReceiptNumber(receipt.receipt_number);
        setGeneratedReceiptToken(receipt.token);
      } else {
        const existing = detailingReceipts.find((r) => r.quote_id === quote.id);
        if (existing) {
          setGeneratedReceiptNumber(existing.receipt_number);
          setGeneratedReceiptToken(existing.token);
        } else {
          showToast('Completá los datos de la empresa en Configuración para emitir el comprobante', 'warning');
        }
      }

      setIsCompleted(true);
    } catch (err) {
      console.error('Error confirming delivery:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    const phone = quote.client_phone?.replace(/\D/g, '') || '';
    const receiptLink = generatedReceiptToken
      ? `${window.location.origin}/?comprobante=${generatedReceiptToken}`
      : window.location.origin;

    const message = `¡Hola ${quote.client_name}! Tu vehículo ${quote.vehicle_info} está listo y ha sido entregado en CARVLAK DetailVlak.\n\nPuedes ver tu comprobante oficial de servicio en el siguiente enlace:\n${receiptLink}\n\n¡Muchas gracias por confiar en nosotros!`;

    const encoded = encodeURIComponent(message);
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCompleted ? '¡Servicio Entregado!' : 'Entrega y Cobro del Vehículo'}
      subtitle={
        isCompleted
          ? 'El trabajo se guardó correctamente y el comprobante está listo.'
          : 'Verificá los importes cobrados, registrá el saldo y finalizá el servicio.'
      }
      maxWidth="max-w-md"
    >
      {isCompleted ? (
        /* Pantalla de Éxito al finalizar */
        <div className="space-y-4 py-2 animate-fade-in text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h3 className="text-lg font-bold font-display text-[#161616]">
              {quote.vehicle_info} Entregado
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Cliente: {quote.client_name}
            </p>
            {generatedReceiptNumber && (
              <span className="inline-block mt-2 px-3 py-1 bg-[#F5F5F4] border border-[#E5E5E3] rounded-full text-xs font-black font-display text-[#161616]">
                Comprobante: {generatedReceiptNumber}
              </span>
            )}
          </div>

          <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Total del Servicio:</span>
              <span className="font-bold text-[#161616]">{formatCurrency(quote.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Total Cobrado:</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(totalPaidBefore + totalRegisteringNow)}
              </span>
            </div>
            {remainingAfterPayment > 0 && (
              <div className="flex justify-between text-red-600 font-bold pt-1 border-t border-[#E5E5E3]">
                <span>Saldo pendiente (Cuenta Corriente):</span>
                <span>{formatCurrency(remainingAfterPayment)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white border-none py-2.5 font-bold"
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Comprobante por WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-center text-xs"
              onClick={onClose}
            >
              Finalizar y Cerrar
            </Button>
          </div>
        </div>
      ) : (
        /* Formulario de Cobro y Entrega */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resumen del trabajo */}
          <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#161616] font-display">{quote.vehicle_info}</p>
                <p className="text-xs text-[#6B6B6B]">Cliente: {quote.client_name}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6B6B6B] block">Total</span>
                <p className="text-base font-bold text-[#161616] font-display">
                  {formatCurrency(quote.total_amount)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E5E3] flex justify-between text-xs">
              <span className="text-[#6B6B6B]">Cobrado previamente:</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(totalPaidBefore)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold pt-1 border-t border-[#E5E5E3]">
              <span className="text-[#161616]">Saldo a liquidar:</span>
              <span className={pendingBalance > 0 ? 'text-[#D7141A]' : 'text-emerald-600'}>
                {formatCurrency(pendingBalance)}
              </span>
            </div>
          </div>

          {/* Sección de Pago con opción de Pago Dividido */}
          {pendingBalance > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerPayment}
                    onChange={(e) => setRegisterPayment(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A] border-gray-300"
                  />
                  <span className="text-xs font-bold text-[#161616]">
                    Cobrar saldo en este momento
                  </span>
                </label>

                {registerPayment && (
                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="text-[11px] font-bold text-[#D7141A] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Dividir pago</span>
                  </button>
                )}
              </div>

              {registerPayment && (
                <div className="space-y-2.5">
                  {splitPayments.map((row, idx) => (
                    <div
                      key={row.id}
                      className="p-3 bg-white border border-[#E5E5E3] rounded-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#6B6B6B]">
                        <span>Cobro #{idx + 1}</span>
                        {splitPayments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitRow(row.id)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#6B6B6B] block mb-0.5">Monto ($)</label>
                          <input
                            type="number"
                            min={1}
                            max={quote.total_amount}
                            value={row.amount || ''}
                            onChange={(e) =>
                              handleUpdateSplitRow(row.id, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg text-xs font-bold text-[#161616] focus:outline-none focus:border-[#D7141A]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#6B6B6B] block mb-0.5">Medio de pago</label>
                          <select
                            value={row.method}
                            onChange={(e) => handleUpdateSplitRow(row.id, 'method', e.target.value)}
                            className="w-full px-2 py-1.5 bg-[#F5F5F4] border border-[#E5E5E3] rounded-lg text-xs font-semibold text-[#161616] focus:outline-none"
                          >
                            {availableMethods.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Nota o comprobante (opcional)"
                        value={row.notes}
                        onChange={(e) => handleUpdateSplitRow(row.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1 bg-[#FAFAFA] border border-[#E5E5E3] rounded-lg text-[11px] text-[#161616] focus:outline-none"
                      />
                    </div>
                  ))}

                  {/* Saldo restante si el cobro es menor al pendiente */}
                  {remainingAfterPayment > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                      <span>Queda en Cuenta Corriente:</span>
                      <strong className="text-amber-900">{formatCurrency(remainingAfterPayment)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>El trabajo ya está abonado en su totalidad.</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            <p className="font-semibold mb-0.5">Automático en este paso:</p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-blue-800">
              <li>Guarda cobros en detailing_payments</li>
              <li>Descuenta insumos de stock por receta</li>
              <li>Liquida comisiones de Romina y Maxi</li>
              <li>Genera comprobante con numeración oficial</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="gap-2 bg-[#D7141A] hover:bg-[#B80E14] text-white border-none"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Procesando...' : 'Confirmar Entrega y Cobro'}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

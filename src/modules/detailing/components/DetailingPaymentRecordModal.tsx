import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle,
  CreditCard,
  Plus,
  Trash2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DetailingQuote, DetailingPayment } from '../../../types';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, getLocalDateString, getDetailingPaidAmount } from '../../../lib/formatters';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface SplitPaymentRow {
  id: string;
  amount: number;
  method: string;
  notes: string;
}

interface DetailingPaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
  onReceiptGenerated?: (receiptId: string) => void;
}

export const DetailingPaymentRecordModal: React.FC<DetailingPaymentRecordModalProps> = ({
  isOpen,
  onClose,
  quote,
  onReceiptGenerated
}) => {
  const { detailingConfig, recordDetailingPayment, detailingReceipts } = useData();
  const { showToast } = useToast();

  const availableMethods = detailingConfig?.payment_methods || [
    'Efectivo',
    'Transferencia Bancaria',
    'Mercado Pago',
    'Tarjeta de Débito',
    'Tarjeta de Crédito'
  ];

  const [paymentType, setPaymentType] = useState<'total' | 'partial' | 'split'>('total');
  const [singleAmount, setSingleAmount] = useState<number>(0);
  const [singleMethod, setSingleMethod] = useState<string>('Efectivo');
  const [singleNotes, setSingleNotes] = useState<string>('');
  const [splitRows, setSplitRows] = useState<SplitPaymentRow[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>(getLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alreadyPaid = quote ? getDetailingPaidAmount(quote) : 0;
  const pendingAmount = quote ? Math.max(0, quote.total_amount - alreadyPaid) : 0;

  useEffect(() => {
    if (quote && isOpen) {
      const lastMethod = localStorage.getItem('carvlak_last_detailing_payment_method') || availableMethods[0] || 'Efectivo';
      const pending = Math.max(0, quote.total_amount - getDetailingPaidAmount(quote));
      setSingleAmount(pending);
      setSingleMethod(lastMethod);
      setSingleNotes('');
      setPaymentDate(getLocalDateString());
      setPaymentType('total');
      setSplitRows([
        {
          id: `split-${Date.now()}-1`,
          amount: Math.round(pending / 2),
          method: lastMethod,
          notes: ''
        },
        {
          id: `split-${Date.now()}-2`,
          amount: pending - Math.round(pending / 2),
          method: availableMethods[1] || 'Efectivo',
          notes: ''
        }
      ]);
    }
  }, [quote, isOpen]);

  if (!quote) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const paymentsToRecord: Omit<DetailingPayment, 'id'>[] = [];

    if (paymentType === 'total' || paymentType === 'partial') {
      if (singleAmount <= 0) {
        showToast('El monto a cobrar debe ser mayor a 0', 'error');
        return;
      }
      paymentsToRecord.push({
        date: paymentDate,
        amount: Number(singleAmount),
        method: singleMethod,
        notes: singleNotes.trim() || undefined
      });
      localStorage.setItem('carvlak_last_detailing_payment_method', singleMethod);
    } else {
      const validRows = splitRows.filter((r) => r.amount > 0);
      if (validRows.length === 0) {
        showToast('Debe ingresar al menos un pago válido con monto mayor a 0', 'error');
        return;
      }
      validRows.forEach((r) => {
        paymentsToRecord.push({
          date: paymentDate,
          amount: Number(r.amount),
          method: r.method,
          notes: r.notes.trim() || undefined
        });
      });
      if (validRows[0]) {
        localStorage.setItem('carvlak_last_detailing_payment_method', validRows[0].method);
      }
    }

    try {
      setIsSubmitting(true);
      for (const p of paymentsToRecord) {
        await recordDetailingPayment(quote.id, p);
      }

      const totalNewPaid = paymentsToRecord.reduce((acc, curr) => acc + curr.amount, 0);
      const isFullyPaid = alreadyPaid + totalNewPaid >= quote.total_amount;

      showToast(
        isFullyPaid
          ? 'Cobro registrado. El trabajo quedó Cobrado y se generó el comprobante.'
          : 'Cobro parcial registrado correctamente.',
        'success'
      );

      // Check receipt
      const receipt = detailingReceipts.find((r) => r.quote_id === quote.id);
      if (receipt && onReceiptGenerated) {
        onReceiptGenerated(receipt.id);
      }

      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Error al registrar el cobro', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSplitRow = () => {
    setSplitRows((prev) => [
      ...prev,
      {
        id: `split-${Date.now()}`,
        amount: 0,
        method: availableMethods[0] || 'Efectivo',
        notes: ''
      }
    ]);
  };

  const removeSplitRow = (id: string) => {
    setSplitRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSplitRow = (id: string, field: keyof SplitPaymentRow, value: any) => {
    setSplitRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const totalSplit = splitRows.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar cobro" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumen del trabajo */}
        <div className="bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B6B6B]">Cliente</p>
              <p className="text-sm font-bold text-[#161616]">{quote.client_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B6B6B]">Vehículo</p>
              <p className="text-sm font-semibold text-[#161616]">
                {quote.vehicle_info} {quote.vehicle_plate ? `(${quote.vehicle_plate})` : ''}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E5E3] grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-[#E5E5E3]">
              <span className="text-[10px] text-[#6B6B6B] block">Total</span>
              <span className="text-xs font-bold text-[#161616]">{formatCurrency(quote.total_amount)}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E5E5E3]">
              <span className="text-[10px] text-[#6B6B6B] block">Ya cobrado</span>
              <span className="text-xs font-bold text-emerald-600">{formatCurrency(alreadyPaid)}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-[#E5E5E3]">
              <span className="text-[10px] text-[#6B6B6B] block">Saldo pendiente</span>
              <span className={`text-xs font-bold ${pendingAmount > 0 ? 'text-[#D7141A]' : 'text-emerald-600'}`}>
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Tipo de cobro */}
        <div>
          <label className="text-xs font-bold text-[#161616] block mb-1.5">
            ¿Cómo se realiza el cobro?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentType('total');
                setSingleAmount(pendingAmount);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                paymentType === 'total'
                  ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                  : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:border-[#161616]'
              }`}
            >
              Total pendiente
              <span className="block text-[10px] font-normal opacity-80">{formatCurrency(pendingAmount)}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentType('partial');
                if (singleAmount >= pendingAmount) setSingleAmount(Math.round(pendingAmount / 2));
              }}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                paymentType === 'partial'
                  ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                  : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:border-[#161616]'
              }`}
            >
              Cobro parcial
              <span className="block text-[10px] font-normal opacity-80">Seña o entrega</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('split')}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                paymentType === 'split'
                  ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                  : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:border-[#161616]'
              }`}
            >
              Dividido
              <span className="block text-[10px] font-normal opacity-80">2+ medios</span>
            </button>
          </div>
        </div>

        {/* Fecha del cobro */}
        <div>
          <label className="text-xs font-medium text-[#6B6B6B] block mb-1">
            Fecha del cobro
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-sm text-[#161616] focus:border-[#D7141A] focus:outline-none"
            required
          />
        </div>

        {/* Formulario según tipo */}
        {paymentType !== 'split' ? (
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#E5E5E3]">
            <div>
              <label className="text-xs font-medium text-[#161616] block mb-1">
                Monto a cobrar ($UYU)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-[#6B6B6B] font-mono">$</span>
                <input
                  type="number"
                  min="1"
                  max={paymentType === 'total' ? pendingAmount : undefined}
                  value={singleAmount || ''}
                  onChange={(e) => setSingleAmount(Number(e.target.value))}
                  className="w-full bg-white border border-[#E5E5E3] rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                  required
                />
              </div>
              {paymentType === 'partial' && singleAmount > 0 && (
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Quedará un saldo pendiente de {formatCurrency(Math.max(0, pendingAmount - singleAmount))}.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#161616] block mb-1">
                Medio de pago
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {availableMethods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSingleMethod(m)}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                      singleMethod === m
                        ? 'bg-red-50 border-[#D7141A] text-[#D7141A] font-bold'
                        : 'bg-[#F5F5F4] border-[#E5E5E3] text-[#161616] hover:border-[#161616]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#161616] block mb-1">
                Nota o referencia (opcional)
              </label>
              <input
                type="text"
                value={singleNotes}
                onChange={(e) => setSingleNotes(e.target.value)}
                placeholder="Ej: Nro de transferencia, seña 50%..."
                className="w-full bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          /* Modo Pago Dividido */
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#E5E5E3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#161616]">Líneas de pago</span>
              <button
                type="button"
                onClick={addSplitRow}
                className="text-xs font-bold text-[#D7141A] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar línea
              </button>
            </div>

            {splitRows.map((row, idx) => (
              <div key={row.id} className="p-2.5 bg-[#F5F5F4] rounded-lg border border-[#E5E5E3] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#6B6B6B]">Pago #{idx + 1}</span>
                  {splitRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSplitRow(row.id)}
                      className="text-[#6B6B6B] hover:text-[#D7141A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#6B6B6B] block mb-0.5">Monto ($UYU)</label>
                    <input
                      type="number"
                      min="1"
                      value={row.amount || ''}
                      onChange={(e) => updateSplitRow(row.id, 'amount', Number(e.target.value))}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs font-mono text-[#161616] focus:border-[#D7141A] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B6B6B] block mb-0.5">Medio</label>
                    <select
                      value={row.method}
                      onChange={(e) => updateSplitRow(row.id, 'method', e.target.value)}
                      className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
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
                  placeholder="Referencia o nota..."
                  value={row.notes}
                  onChange={(e) => updateSplitRow(row.id, 'notes', e.target.value)}
                  className="w-full bg-white border border-[#E5E5E3] rounded-lg px-2 py-1 text-[11px] text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:outline-none"
                />
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">Total a registrar:</span>
              <span className="font-bold font-mono text-sm text-[#161616]">{formatCurrency(totalSplit)}</span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Confirmar cobro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

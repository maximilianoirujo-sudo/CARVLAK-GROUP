import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { DetailingCompany, DetailingQuote } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency, getDetailingPaidAmount, getLocalDateString } from '../../../lib/formatters';

interface DetailingCompanyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: DetailingCompany;
  monthQuotes: DetailingQuote[];
  monthLabel: string;
}

export const DetailingCompanyPaymentModal: React.FC<DetailingCompanyPaymentModalProps> = ({
  isOpen,
  onClose,
  company,
  monthQuotes,
  monthLabel
}) => {
  const { recordDetailingPayment, detailingConfig } = useData();
  const { showToast } = useToast();

  const [paymentMode, setPaymentMode] = useState<'all' | 'custom'>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return localStorage.getItem('carvlak_last_detailing_payment_method') || 'Transferencia BROU';
  });
  const [paymentDate, setPaymentDate] = useState<string>(() => getLocalDateString());
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trabajos activos con saldo pendiente
  const unpaidJobs = useMemo(() => {
    return monthQuotes
      .filter((q) => !q.is_voided)
      .map((q) => {
        const paid = getDetailingPaidAmount(q);
        const balance = Math.max(0, (q.total_amount || 0) - paid);
        return { quote: q, paid, balance };
      })
      .filter((item) => item.balance > 0);
  }, [monthQuotes]);

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(() => {
    return unpaidJobs.map((j) => j.quote.id);
  });

  // Si cambia el modo a 'all', seleccionamos todos los impagos
  React.useEffect(() => {
    if (paymentMode === 'all') {
      setSelectedJobIds(unpaidJobs.map((j) => j.quote.id));
    }
  }, [paymentMode, unpaidJobs]);

  if (!isOpen) return null;

  const totalToPay = unpaidJobs
    .filter((j) => selectedJobIds.includes(j.quote.id))
    .reduce((sum, j) => sum + j.balance, 0);

  const toggleJobSelection = (id: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const paymentMethodsList = detailingConfig?.payment_methods || [
    'Transferencia BROU',
    'Transferencia Itaú',
    'Efectivo',
    'Mercado Pago',
    'Cheque al día'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const jobsToPay = unpaidJobs.filter((j) => selectedJobIds.includes(j.quote.id));
    if (jobsToPay.length === 0) {
      showToast('Seleccioná al menos un trabajo con saldo pendiente', 'error');
      return;
    }

    try {
      const paymentGroupId = `paygrp-${crypto.randomUUID()}`;
      for (const item of jobsToPay) {
        await recordDetailingPayment(item.quote.id, {
          amount: item.balance,
          method: paymentMethod,
          date: paymentDate,
          payment_group_id: paymentGroupId,
          notes: paymentNotes.trim() ? `Pago cuenta ${company.name}: ${paymentNotes.trim()}` : `Pago cuenta empresa ${company.name}`
        });
      }

      localStorage.setItem('carvlak_last_detailing_payment_method', paymentMethod);
      showToast(`Cobro registrado con éxito para ${jobsToPay.length} trabajos (${formatCurrency(totalToPay)})`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Error al imputar el pago', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E5E5E3] my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E3]">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#161616]">
              Registrar Cobro · {company.name}
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Imputación a trabajos de {monthLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {unpaidJobs.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#161616]">
              No hay saldos pendientes en {monthLabel}
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Todos los trabajos de este mes ya se encuentran totalmente cobrados.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-[#161616] text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Modalidad de Imputación */}
            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1.5">
                Modo de Cobro
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMode('all')}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                    paymentMode === 'all'
                      ? 'bg-red-50 border-[#D7141A] text-[#D7141A] ring-1 ring-[#D7141A]'
                      : 'border-[#E5E5E3] text-[#6B6B6B] hover:border-[#161616]'
                  }`}
                >
                  Saldar todo el mes ({unpaidJobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('custom')}
                  className={`p-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                    paymentMode === 'custom'
                      ? 'bg-red-50 border-[#D7141A] text-[#D7141A] ring-1 ring-[#D7141A]'
                      : 'border-[#E5E5E3] text-[#6B6B6B] hover:border-[#161616]'
                  }`}
                >
                  Elegir trabajos ({selectedJobIds.length})
                </button>
              </div>
            </div>

            {/* Lista de Trabajos (si custom) */}
            {paymentMode === 'custom' && (
              <div className="border border-[#E5E5E3] rounded-xl p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-[#FAFAFA]">
                {unpaidJobs.map(({ quote, balance }) => {
                  const isChecked = selectedJobIds.includes(quote.id);
                  return (
                    <label
                      key={quote.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                        isChecked
                          ? 'bg-white border-[#161616] font-semibold'
                          : 'bg-transparent border-transparent text-[#6B6B6B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleJobSelection(quote.id)}
                          className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A]"
                        />
                        <div>
                          <span className="text-[#161616] block">{quote.vehicle_info}</span>
                          <span className="text-[10px] text-[#6B6B6B]">
                            {quote.vehicle_plate || 'Sin matrícula'} · {quote.work_date || 'S/F'}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#D7141A]">
                        {formatCurrency(balance)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Medio de Pago y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#161616] mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-medium text-[#161616] focus:bg-white focus:border-[#161616]"
                >
                  {paymentMethodsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161616] mb-1">
                  Fecha del Cobro
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-medium text-[#161616] focus:bg-white focus:border-[#161616]"
                />
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-xs font-bold text-[#161616] mb-1">
                Nota o Comprobante (opcional)
              </label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ej. Transferencia nro 849302 / Cheque 1234"
                className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
              />
            </div>

            {/* Total a Imputar */}
            <div className="bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Total a Cobrar</span>
                <span className="text-xs text-[#161616]">
                  {selectedJobIds.length} trabajo{selectedJobIds.length === 1 ? '' : 's'} seleccionado{selectedJobIds.length === 1 ? '' : 's'}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                {formatCurrency(totalToPay)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalToPay <= 0}
                className="bg-[#D7141A] hover:bg-[#b01015] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando...' : `Confirmar Cobro (${formatCurrency(totalToPay)})`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

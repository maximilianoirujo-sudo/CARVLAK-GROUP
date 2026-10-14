import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Copy,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Car
} from 'lucide-react';
import { DetailingCompany, DetailingQuote, DetailingConfig } from '../../../types';
import { formatCurrency, getDetailingPaidAmount } from '../../../lib/formatters';
import { useToast } from '../../../context/ToastContext';

interface DetailingCompanyAccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: DetailingCompany;
  monthStr: string; // YYYY-MM
  monthLabel: string; // e.g. "Octubre 2026"
  monthQuotes: DetailingQuote[];
  config: DetailingConfig;
}

export const DetailingCompanyAccountStatementModal: React.FC<DetailingCompanyAccountStatementModalProps> = ({
  isOpen,
  onClose,
  company,
  monthStr,
  monthLabel,
  monthQuotes,
  config
}) => {
  const { showToast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const receiptCfg = (config?.receipt_config || {}) as any;
  const companyName = receiptCfg.company_trade_name || 'DetailVlak Shangrilá';
  const companyAddress = receiptCfg.company_address || 'Av. Calcagno & Giannattasio, Shangrilá';
  const companyPhone = receiptCfg.company_phone || '099 267 964';
  const footerLegend = 'No válido como factura electrónica (CFE).';

  const activeQuotes = monthQuotes.filter((q) => !q.is_voided);

  const totalBilled = activeQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
  const totalPaid = activeQuotes.reduce((acc, q) => acc + getDetailingPaidAmount(q), 0);
  const totalBalance = Math.max(0, totalBilled - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      `*ESTADO DE CUENTA · DETAILVLAK*`,
      `Empresa: ${company.name}`,
      company.rut ? `RUT: ${company.rut}` : '',
      `Período: ${monthLabel}`,
      `Total vehículos: ${activeQuotes.length}`,
      `-----------------------------`,
      ...activeQuotes.map((q, idx) => {
        const paid = getDetailingPaidAmount(q);
        const bal = (q.total_amount || 0) - paid;
        return `${idx + 1}. ${q.vehicle_info || 'Vehículo'} (${q.vehicle_plate || 'Sin matrícula'}) - Tamaño ${q.vehicle_size || '-'}: ${formatCurrency(q.total_amount)} [${bal <= 0 ? 'Cobrado' : `Saldo: ${formatCurrency(bal)}`}]`;
      }),
      `-----------------------------`,
      `TOTAL FACTURADO: ${formatCurrency(totalBilled)}`,
      `TOTAL ABONADO: ${formatCurrency(totalPaid)}`,
      `SALDO PENDIENTE: ${formatCurrency(totalBalance)}`,
      `\n_${footerLegend}_`
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Resumen copiado al portapapeles', 'info');
  };

  const handleWhatsApp = () => {
    const text = [
      `*ESTADO DE CUENTA · DETAILVLAK*`,
      `Empresa: ${company.name}`,
      company.rut ? `RUT: ${company.rut}` : '',
      `Período: ${monthLabel}`,
      `Total vehículos: ${activeQuotes.length}`,
      `-----------------------------`,
      ...activeQuotes.map((q, idx) => {
        const paid = getDetailingPaidAmount(q);
        const bal = (q.total_amount || 0) - paid;
        return `${idx + 1}. ${q.vehicle_info || 'Vehículo'} (${q.vehicle_plate || 'Sin matrícula'}) - Tamaño ${q.vehicle_size || '-'}: ${formatCurrency(q.total_amount)} [${bal <= 0 ? 'Cobrado' : `Saldo: ${formatCurrency(bal)}`}]`;
      }),
      `-----------------------------`,
      `TOTAL FACTURADO: ${formatCurrency(totalBilled)}`,
      `TOTAL ABONADO: ${formatCurrency(totalPaid)}`,
      `SALDO PENDIENTE: ${formatCurrency(totalBalance)}`,
      `\n_${footerLegend}_`
    ].filter(Boolean).join('\n');

    let phone = (company.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '598' + phone.slice(1);
    } else if (phone.length === 8) {
      phone = '598' + phone;
    }
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Estado de Cuenta - ${company.name} (${monthLabel})`);
    const body = encodeURIComponent(
      `Estimados,\n\nAdjuntamos el detalle del Estado de Cuenta de DetailVlak correspondiente a ${monthLabel}:\n\n` +
      `Vehículos procesados: ${activeQuotes.length}\n` +
      `Total facturado: ${formatCurrency(totalBilled)}\n` +
      `Total abonado: ${formatCurrency(totalPaid)}\n` +
      `Saldo pendiente: ${formatCurrency(totalBalance)}\n\n` +
      `Saludos cordiales,\nDetailVlak Shangrilá`
    );
    window.open(`mailto:${company.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5E5E3] overflow-hidden my-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header - Oculto en impresión */}
        <div className="p-4 border-b border-[#E5E5E3] flex items-center justify-between bg-[#F5F5F4] print:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#161616]" />
            <h2 className="text-base font-bold font-display text-[#161616]">
              Estado de Cuenta · {company.name} ({monthLabel})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar - Oculto en impresión */}
        <div className="p-3 bg-white border-b border-[#E5E5E3] flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#161616] hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Copiar texto</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEmail}
              className="bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Email</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printAreaRef}
          className="overflow-y-auto flex-1 font-sans text-[#161616] bg-white print:overflow-visible"
        >
          {/* Banda negra institucional con franja celeste #1B9AD6 */}
          <div className="bg-[#161616] text-white px-6 py-4 flex items-center justify-between print:px-8 print:py-5">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black font-display tracking-widest uppercase">
                DETAILVLAK
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-300 block">
                ESTADO DE CUENTA
              </span>
              <span className="text-sm font-semibold font-mono text-white">
                {monthLabel}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-[#1B9AD6] w-full"></div>

          <div className="p-6 sm:p-8 space-y-6 print:p-8">
            {/* Datos de la Empresa Cliente y Emisión */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#E5E5E3] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Empresa Cliente</span>
                <span className="text-base font-bold text-[#161616] block mt-0.5">{company.name}</span>
                {company.legal_name && <p className="text-[#6B6B6B]">Razón social: {company.legal_name}</p>}
                {company.rut && <p className="text-[#6B6B6B] font-mono">RUT: {company.rut}</p>}
                {company.address && <p className="text-[#6B6B6B]">{company.address}</p>}
              </div>

              <div className="sm:text-right space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#6B6B6B] block">Información del Período</span>
                <p className="font-semibold text-[#161616]">
                  Período: <span className="font-mono">{monthLabel}</span>
                </p>
                <p className="text-[#6B6B6B]">
                  Emisión: {new Date().toLocaleDateString('es-UY', { timeZone: 'America/Montevideo' })}
                </p>
                {company.contact_name && (
                  <p className="text-[#6B6B6B]">Contacto: {company.contact_name}</p>
                )}
                {company.phone && (
                  <p className="text-[#6B6B6B]">Teléfono: {company.phone}</p>
                )}
              </div>
            </div>

          {/* Tabla de Trabajos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">
              Detalle de Vehículos Procesados ({activeQuotes.length})
            </h4>

            {activeQuotes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E5E5E3] rounded-xl text-xs text-[#6B6B6B]">
                No hay trabajos registrados para esta empresa en {monthLabel}.
              </div>
            ) : (
              <div className="border border-[#E5E5E3] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F4] border-b border-[#E5E5E3] text-[#6B6B6B] font-bold">
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Vehículo / Matrícula</th>
                      <th className="p-2.5 text-center">Tam.</th>
                      <th className="p-2.5">Servicios</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-right">Abonado</th>
                      <th className="p-2.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E3]">
                    {activeQuotes.map((q) => {
                      const paid = getDetailingPaidAmount(q);
                      const bal = (q.total_amount || 0) - paid;
                      const srvText = (q.selected_services || [])
                        .map((s) => s.serviceName || s.name)
                        .join(', ');

                      return (
                        <tr key={q.id} className="hover:bg-[#FAFAFA]">
                          <td className="p-2.5 text-[#6B6B6B] font-mono whitespace-nowrap">
                            {q.work_date || q.created_at?.slice(0, 10)}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-[#161616] block">{q.vehicle_info}</span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">
                              {q.vehicle_plate || 'Sin matrícula'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-[#161616]">
                              T{q.vehicle_size || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#6B6B6B] max-w-[200px] truncate" title={srvText}>
                            {srvText || 'Preventa'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#161616] whitespace-nowrap">
                            {formatCurrency(q.total_amount)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                            {formatCurrency(paid)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold whitespace-nowrap">
                            <span className={bal > 0 ? 'text-[#D7141A]' : 'text-emerald-700'}>
                              {formatCurrency(bal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resumen de Totales */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-[#E5E5E3]">
            <div className="text-[11px] text-[#6B6B6B] max-w-sm">
              <p className="font-medium text-[#161616]">Modalidad de facturación: {company.billing_mode === 'mensual' ? 'Cuenta Mensual Corriente' : 'Cobro por trabajo'}</p>
              {company.notes && <p className="mt-1 italic">Notas: {company.notes}</p>}
            </div>

            <div className="w-full sm:w-64 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Total Facturado:</span>
                <span className="font-mono font-bold text-[#161616]">{formatCurrency(totalBilled)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Abonado:</span>
                <span className="font-mono font-bold">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="border-t border-[#E5E5E3] pt-1.5 flex justify-between text-sm font-bold text-[#161616]">
                <span>Saldo Pendiente:</span>
                <span className={`font-mono font-black ${totalBalance > 0 ? 'text-[#D7141A]' : 'text-emerald-700'}`}>
                  {formatCurrency(totalBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Leyenda Footer Legal */}
          <div className="pt-6 border-t border-[#E5E5E3] text-center">
            <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider font-semibold">
              {footerLegend}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

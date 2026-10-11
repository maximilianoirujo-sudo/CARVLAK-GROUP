import React, { useState } from 'react';
import {
  Printer,
  Share2,
  Copy,
  Check,
  MessageCircle,
  FileText,
  ShieldCheck,
  Car,
  User,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import { DetailingReceipt } from '../../../../types';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';
import { formatCurrency } from '../../../../lib/formatters';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../context/ToastContext';

interface DetailingReceiptViewProps {
  receipt: DetailingReceipt;
  onClose?: () => void;
  isPublicView?: boolean;
}

export const DetailingReceiptView: React.FC<DetailingReceiptViewProps> = ({
  receipt,
  onClose,
  isPublicView = false
}) => {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?comprobante=${receipt.token}`
    : '';

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showToast('Enlace público del comprobante copiado al portapapeles', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Plantilla de WhatsApp con variables {cliente} {auto} {total} {link}
  const defaultWhatsAppText = `¡Hola {cliente}! Adjuntamos tu comprobante oficial de DetailVlak por el servicio realizado a tu {auto}.
Total: {total}
Podés ver e imprimir tu comprobante aquí:
{link}

¡Muchas gracias por confiar en CARVLAK Group!`;

  const [whatsAppCustomText, setWhatsAppCustomText] = useState(defaultWhatsAppText);

  const finalWhatsAppMessage = whatsAppCustomText
    .replace('{cliente}', receipt.client_name || 'estimado/a')
    .replace('{auto}', receipt.vehicle_info || 'vehículo')
    .replace('{total}', formatCurrency(receipt.total_amount, 'UYU'))
    .replace('{link}', publicUrl);

  const handleSendWhatsApp = () => {
    let cleanPhone = (receipt.client_phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('09')) {
      cleanPhone = '598' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('9') && cleanPhone.length === 8) {
      cleanPhone = '598' + cleanPhone;
    }
    const encoded = encodeURIComponent(finalWhatsAppMessage);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  return (
    <div className="relative">
      {/* Botones de acción (ocultos al imprimir) */}
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E5E5E3] shadow-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D7141A]" />
          <div>
            <span className="font-bold text-[#161616] text-sm font-title">
              Comprobante Oficial {receipt.receipt_number}
            </span>
            {receipt.version > 1 && (
              <span className="ml-2 text-[10px] bg-[#161616] text-white px-2 py-0.5 rounded-md font-semibold">
                Versión {receipt.version}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopyLink}
            className="text-xs gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#1E6B43]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#1E6B43]" />
            <span>Enviar WhatsApp</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            className="text-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </Button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F5F5F4] hover:bg-gray-200 text-[#6B6B6B] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENTO IMPRESO EN A4 (BLANCO Y NEGRO CON ACENTO ROJO) */}
      <div className="bg-white text-[#161616] border border-[#E5E5E3] rounded-2xl p-6 sm:p-10 shadow-lg max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none relative overflow-hidden">
        
        {/* Marca de agua si está anulado */}
        {receipt.is_voided && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 overflow-hidden">
            <div className="text-[120px] font-black text-[#D7141A]/15 uppercase tracking-widest rotate-[-30deg] border-8 border-[#D7141A]/20 py-4 px-12 rounded-3xl select-none">
              ANULADO
            </div>
          </div>
        )}

        {/* ENCABEZADO */}
        <div className="border-b-2 border-[#161616] pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            
            {/* Logo y Datos de la Empresa */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <img
                  src={receipt.company_logo_url || '/carvlak-logo-negro.png'}
                  alt="CARVLAK"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-xl font-black font-title uppercase tracking-wide text-[#161616]">
                    {receipt.company_trade_name || 'CARVLAK DetailVlak'}
                  </h1>
                  <p className="text-[11px] text-[#6B6B6B] font-medium">
                    Estética Automotriz Profesional & Protección Cerámica
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#6B6B6B] space-y-0.5 pt-1">
                <p><strong>Razón Social:</strong> {receipt.company_legal_name || 'CARVLAK GROUP S.A.S.'}</p>
                <p><strong>RUT:</strong> {receipt.company_rut || '219988770014'}</p>
                <p><strong>Dirección:</strong> {receipt.company_address || 'Shangrilá, Canelones, Uruguay'}</p>
                <p><strong>Contacto:</strong> {receipt.company_phone || '+598 99 267 964'} • {receipt.company_instagram || '@car.vlak'}</p>
              </div>
            </div>

            {/* Número y Fechas */}
            <div className="sm:text-right space-y-1.5 shrink-0 bg-[#F5F5F4] p-3.5 rounded-xl border border-[#E5E5E3] sm:min-w-[240px]">
              <div className="text-xs uppercase font-bold text-[#6B6B6B] tracking-wider">
                Comprobante de Servicio
              </div>
              <div className="text-2xl font-black text-[#D7141A] font-mono tracking-tight">
                {receipt.receipt_number}
              </div>
              {receipt.version > 1 && (
                <div className="text-[11px] font-bold text-[#161616]">
                  Re-emisión / Versión {receipt.version}
                </div>
              )}
              <div className="text-xs text-[#6B6B6B] pt-1 border-t border-[#E5E5E3] space-y-0.5">
                <p><strong>Fecha Emisión:</strong> {receipt.issue_date}</p>
                <p><strong>Fecha Servicio:</strong> {receipt.service_date}</p>
                <p><strong>Operador:</strong> {receipt.detailer_name}</p>
              </div>
            </div>

          </div>
        </div>

        {/* SECCIÓN CLIENTE Y VEHÍCULO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Ficha Cliente */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/50 space-y-1 text-xs">
            <div className="font-bold text-[#161616] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-[#E5E5E3] pb-1">
              <User className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>Datos del Cliente</span>
            </div>
            <p className="text-sm font-bold text-[#161616]">{receipt.client_name}</p>
            <p className="text-[#6B6B6B]"><strong>Teléfono:</strong> {receipt.client_phone || 'No registrado'}</p>
            {receipt.client_doc && (
              <p className="text-[#6B6B6B]"><strong>Documento / RUT:</strong> {receipt.client_doc}</p>
            )}
          </div>

          {/* Ficha Vehículo */}
          <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/50 space-y-1 text-xs">
            <div className="font-bold text-[#161616] text-xs uppercase tracking-wider mb-2 flex items-center justify-between border-b border-[#E5E5E3] pb-1">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#D7141A]" />
                <span>Vehículo Atendido</span>
              </span>
              {receipt.vehicle_plate && (
                <div className="scale-85 origin-right">
                  <UruguayanPlate plate={receipt.vehicle_plate} />
                </div>
              )}
            </div>
            <p className="text-sm font-bold text-[#161616]">{receipt.vehicle_info}</p>
            {receipt.reception_mileage && (
              <p className="text-[#6B6B6B]">
                <strong>Kilometraje de ingreso:</strong> {receipt.reception_mileage.toLocaleString()} km
              </p>
            )}
          </div>

        </div>

        {/* TABLA DE SERVICIOS */}
        <div className="mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#161616] text-[#161616]">
                <th className="py-2.5 font-bold uppercase tracking-wider">Servicio / Tratamiento Realizado</th>
                <th className="py-2.5 text-right font-bold uppercase tracking-wider w-32">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {receipt.services.map((srv, idx) => (
                <tr key={idx} className="hover:bg-[#F5F5F4]/50">
                  <td className="py-3 pr-4">
                    <p className="font-bold text-[#161616] text-sm">{srv.serviceName}</p>
                    {srv.description && (
                      <p className="text-[#6B6B6B] text-xs mt-0.5">{srv.description}</p>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-[#161616] text-sm">
                    {formatCurrency(srv.price, 'UYU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALES Y FORMAS DE PAGO */}
        <div className="border-t-2 border-[#161616] pt-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Medios de Pago Registrados */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#161616] uppercase tracking-wider block">
                Historial de Pagos y Cancelación
              </span>
              {receipt.payments && receipt.payments.length > 0 ? (
                <div className="space-y-1.5">
                  {receipt.payments.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3]">
                      <div>
                        <span className="font-medium text-[#161616]">{p.payment_method}</span>
                        <span className="text-[10px] text-[#6B6B6B] ml-2">({p.date})</span>
                      </div>
                      <span className="font-mono font-bold text-[#161616]">
                        {formatCurrency(p.amount, 'UYU')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B6B6B] italic">No se registraron pagos previos.</p>
              )}

              <div className="mt-3 pt-2 border-t border-[#E5E5E3] flex items-center justify-between">
                <span className="font-bold text-[#161616]">Estado del servicio:</span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  receipt.is_voided
                    ? 'bg-[#D7141A]/10 text-[#D7141A] border border-[#D7141A]/30'
                    : receipt.status === 'Pagado'
                    ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#1E6B43]/30'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  {receipt.is_voided ? 'ANULADO' : receipt.status}
                </span>
              </div>
            </div>

            {/* Cuadro de Totales */}
            <div className="space-y-1.5 text-xs sm:text-right">
              <div className="flex justify-between sm:justify-end gap-6 py-0.5">
                <span className="text-[#6B6B6B]">Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(receipt.subtotal, 'UYU')}</span>
              </div>

              {receipt.discount_amount > 0 && (
                <div className="flex justify-between sm:justify-end gap-6 py-0.5 text-[#D7141A]">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono font-medium">-{formatCurrency(receipt.discount_amount, 'UYU')}</span>
                </div>
              )}

              {receipt.surcharge_amount > 0 && (
                <div className="flex justify-between sm:justify-end gap-6 py-0.5">
                  <span className="text-[#6B6B6B]">Recargo por suciedad extrema:</span>
                  <span className="font-mono font-medium">+{formatCurrency(receipt.surcharge_amount, 'UYU')}</span>
                </div>
              )}

              <div className="flex justify-between sm:justify-end gap-6 pt-2 border-t border-[#161616] text-base font-black">
                <span className="uppercase text-[#161616]">Total del Servicio:</span>
                <span className="font-mono text-[#D7141A] text-xl">
                  {formatCurrency(receipt.total_amount, 'UYU')}
                </span>
              </div>

              <div className="flex justify-between sm:justify-end gap-6 py-0.5 text-[#1E6B43]">
                <span>Total Abonado (Seña + Pagos):</span>
                <span className="font-mono font-semibold">{formatCurrency(receipt.deposit_amount, 'UYU')}</span>
              </div>

              <div className="flex justify-between sm:justify-end gap-6 py-1 border-t border-[#E5E5E3] font-bold">
                <span className="text-[#161616]">Saldo Pendiente:</span>
                <span className={`font-mono text-sm ${receipt.balance_pending > 0 ? 'text-[#D7141A]' : 'text-[#1E6B43]'}`}>
                  {formatCurrency(receipt.balance_pending, 'UYU')}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* CUIDADOS POSTERIORES Y GARANTÍA */}
        {receipt.care_instructions && (
          <div className="p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] mb-6 space-y-1.5 text-xs">
            <div className="font-bold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D7141A]" />
              <span>Cuidados Posteriores y Garantía Oficial</span>
            </div>
            <p className="text-[#161616] whitespace-pre-line leading-relaxed">
              {receipt.care_instructions}
            </p>
          </div>
        )}

        {/* OBSERVACIONES */}
        {receipt.observations && (
          <div className="p-3.5 rounded-xl border border-[#E5E5E3] mb-6 text-xs text-[#6B6B6B]">
            <strong className="text-[#161616] block mb-0.5">Observaciones del trabajo:</strong>
            <p className="whitespace-pre-line">{receipt.observations}</p>
          </div>
        )}

        {/* MOTIVO DE ANULACIÓN SI APLICA */}
        {receipt.is_voided && receipt.void_reason && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 mb-6 text-xs text-[#D7141A] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <strong>Comprobante Anulado:</strong> {receipt.void_reason} (Fecha: {receipt.voided_at?.slice(0, 10)})
            </div>
          </div>
        )}

        {/* PIE DEL COMPROBANTE */}
        <div className="pt-6 border-t border-[#E5E5E3] text-center text-[10px] text-[#6B6B6B] space-y-1">
          <p className="font-semibold text-[#161616]">
            {receipt.footer_legend || 'Comprobante de servicio. No válido como factura electrónica (CFE).'}
          </p>
          <p>
            CARVLAK Group • División Estética Automotriz DetailVlak • Documento oficial generado el {receipt.issue_date}
          </p>
        </div>

      </div>

      {/* Modal para enviar mensaje de WhatsApp con plantilla editable */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#1E6B43]" />
                <h3 className="font-bold text-[#161616] text-sm">Enviar Comprobante por WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#F5F5F4] hover:bg-gray-200 flex items-center justify-center text-[#6B6B6B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-[#6B6B6B] font-medium">
                Plantilla del mensaje (podés editar antes de enviar):
              </label>
              <textarea
                rows={6}
                value={whatsAppCustomText}
                onChange={(e) => setWhatsAppCustomText(e.target.value)}
                className="w-full p-3 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none"
              />
              <p className="text-[10px] text-[#6B6B6B]">
                Variables disponibles: <code>{'{cliente}'}</code>, <code>{'{auto}'}</code>, <code>{'{total}'}</code>, <code>{'{link}'}</code>
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-[#E5E5E3] text-[11px] space-y-1">
              <strong className="text-[#161616]">Vista previa final:</strong>
              <p className="text-[#6B6B6B] whitespace-pre-line font-sans">{finalWhatsAppMessage}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsWhatsAppModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSendWhatsApp}
                className="gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

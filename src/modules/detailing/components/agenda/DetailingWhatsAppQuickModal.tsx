import React, { useState, useEffect } from 'react';
import { MessageCircle, Copy, ExternalLink, Check, Sparkles } from 'lucide-react';
import { DetailingConfig, DetailingQuote, Appointment } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../context/ToastContext';
import { 
  sanitizePhoneForWhatsApp, 
  formatLocalDate, 
  formatLocalTime, 
  formatCurrency 
} from '../../../../lib/formatters';

interface DetailingWhatsAppQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DetailingConfig;
  defaultTemplateKey?: 'confirm_appointment' | 'day_before_reminder' | 'car_ready' | 'quote_followup';
  quote?: DetailingQuote | null;
  appointment?: Appointment | null;
  onLoggedSend: (targetId: string, templateKey: string, phone: string) => void;
}

export const DetailingWhatsAppQuickModal: React.FC<DetailingWhatsAppQuickModalProps> = ({
  isOpen,
  onClose,
  config,
  defaultTemplateKey = 'confirm_appointment',
  quote,
  appointment,
  onLoggedSend
}) => {
  const { showToast } = useToast();
  const [selectedKey, setSelectedKey] = useState<string>(defaultTemplateKey);
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (defaultTemplateKey) {
      setSelectedKey(defaultTemplateKey);
    }
  }, [defaultTemplateKey, isOpen]);

  // Variables para reemplazo
  const clientName = quote?.client_name || appointment?.client?.full_name || 'Estimado/a cliente';
  const clientPhone = quote?.client_phone || appointment?.client?.phone || '';
  const vehicleInfo = quote?.vehicle_info || (appointment?.vehicle ? `${appointment.vehicle.brand} ${appointment.vehicle.model}` : 'Vehículo');
  const servicesText = quote?.selected_services?.map((s) => s.serviceName).join(' + ') || appointment?.title || 'Servicio de Detailing';
  const totalText = formatCurrency(quote?.total_amount || appointment?.price_amount || 0);

  const targetDateIso = appointment?.start_time || quote?.appointment_date || new Date().toISOString();
  const dateFormatted = formatLocalDate(targetDateIso, { weekday: 'long', day: 'numeric', month: 'long' });
  const timeFormatted = formatLocalTime(targetDateIso);
  const addressText = 'Av. Giannattasio & Calcagno, Shangrilá, Canelones';

  useEffect(() => {
    const rawTemplate = config.whatsapp_templates?.[selectedKey as keyof typeof config.whatsapp_templates] || '';
    const processed = rawTemplate
      .replace(/{cliente}/g, clientName)
      .replace(/{auto}/g, vehicleInfo)
      .replace(/{fecha}/g, dateFormatted)
      .replace(/{hora}/g, timeFormatted)
      .replace(/{servicios}/g, servicesText)
      .replace(/{total}/g, totalText)
      .replace(/{direccion}/g, addressText);

    setCustomText(processed);
  }, [selectedKey, quote, appointment, config]);

  const sanitizedPhone = sanitizePhoneForWhatsApp(clientPhone);

  const handleOpenWhatsApp = () => {
    if (!sanitizedPhone) {
      showToast('No se encontró un número de teléfono válido para el cliente', 'error');
      return;
    }

    const targetId = quote?.id || appointment?.id || '';
    if (targetId) {
      onLoggedSend(targetId, selectedKey, sanitizedPhone);
    }

    const encoded = encodeURIComponent(customText);
    const url = `https://wa.me/${sanitizedPhone}?text=${encoded}`;
    window.open(url, '_blank');
    showToast('Abriendo WhatsApp y registrando envío en el turno', 'success');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    showToast('Mensaje copiado al portapapeles', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const templateOptions = [
    { key: 'confirm_appointment', label: 'Confirmar turno' },
    { key: 'day_before_reminder', label: 'Recordatorio día anterior' },
    { key: 'car_ready', label: 'Auto listo para retirar' },
    { key: 'quote_followup', label: 'Seguimiento de presupuesto' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar mensaje por WhatsApp (1 toque)"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Selector de plantilla */}
        <div>
          <label className="text-xs font-bold text-[#161616] block mb-1.5">
            Seleccionar plantilla
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templateOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedKey(opt.key)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                  selectedKey === opt.key
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Destinatario */}
        <div className="p-3 bg-[#F5F5F4] rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[#6B6B6B] block">Destinatario:</span>
            <span className="font-bold text-[#161616]">{clientName} ({clientPhone || 'Sin teléfono'})</span>
          </div>
          <span className="text-[11px] font-semibold text-[#059669] bg-[#EEF7F2] px-2 py-0.5 rounded-md">
            +598 {sanitizedPhone.replace(/^598/, '')}
          </span>
        </div>

        {/* Mensaje editable */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#161616]">
              Mensaje preparado
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-[#6B6B6B] hover:text-[#161616] flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#059669]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
            </button>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={7}
            className="w-full text-xs bg-white border border-[#E5E5E3] rounded-xl p-3 text-[#161616] focus:border-[#D7141A] focus:outline-hidden font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleOpenWhatsApp}
            disabled={!sanitizedPhone}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar WhatsApp (+598)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

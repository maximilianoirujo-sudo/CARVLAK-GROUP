import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Settings,
  Car,
  DollarSign
} from 'lucide-react';
import { DetailingQuote, WhatsAppTemplateKey } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { sanitizePhoneForWhatsApp, formatCurrency } from '../../../lib/formatters';
import { Button } from '../../../components/ui/Button';

interface DetailingWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
}

export const DetailingWhatsAppModal: React.FC<DetailingWhatsAppModalProps> = ({
  isOpen,
  onClose,
  quote
}) => {
  const { whatsappTemplates, updateWhatsAppTemplate, updateDetailingQuoteStatus } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeKey, setActiveKey] = useState<WhatsAppTemplateKey>('formal');
  const [compiledMessage, setCompiledMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [rawTemplate, setRawTemplate] = useState('');

  const currentTemplateObj = whatsappTemplates.find((t) => t.key === activeKey);

  // Compilar el mensaje cuando cambie la cotización o la plantilla
  useEffect(() => {
    if (!quote || !currentTemplateObj) return;

    setRawTemplate(currentTemplateObj.template);

    const clientName = quote.client_name || 'Estimado/a';
    const vehicleInfo = quote.vehicle_info || 'tu vehículo';
    const operatorName = profile?.full_name || 'Maximiliano Irujo';
    const totalStr = formatCurrency(quote.total_amount, 'UYU');
    const timeStr = quote.estimated_time || 'A coordinar';

    const servicesDetail = quote.selected_services
      .map((s) => `• *${s.serviceName}:* ${formatCurrency(s.price, 'UYU')}`)
      .join('\n');

    const servicesSummary = quote.selected_services
      .map((s) => s.serviceName)
      .join(' + ') || 'Tratamiento de Detailing';

    let text = currentTemplateObj.template
      .replace(/{{cliente}}/g, clientName)
      .replace(/{{vehiculo}}/g, vehicleInfo)
      .replace(/{{operador}}/g, operatorName)
      .replace(/{{total}}/g, totalStr)
      .replace(/{{tiempo}}/g, timeStr)
      .replace(/{{servicios}}/g, servicesDetail || '• Servicios acordados')
      .replace(/{{servicios_resumen}}/g, servicesSummary);

    setCompiledMessage(text);
  }, [quote, activeKey, currentTemplateObj, profile]);

  if (!isOpen || !quote) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledMessage);
    setCopied(true);
    showToast('Mensaje copiado al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = sanitizePhoneForWhatsApp(quote.client_phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      showToast('El cliente no tiene un teléfono válido registrado', 'error');
      return;
    }

    // Si estaba "Por Cotizar", pasarlo automáticamente a "Presupuesto Enviado"
    if (quote.status === 'Por Cotizar') {
      updateDetailingQuoteStatus(quote.id, 'Presupuesto Enviado');
    }

    const encoded = encodeURIComponent(compiledMessage);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(url, '_blank');
    showToast('Abriendo WhatsApp...', 'info');
    onClose();
  };

  const handleSaveTemplate = () => {
    updateWhatsAppTemplate(activeKey, rawTemplate);
    setIsEditingTemplate(false);
    showToast('Plantilla guardada correctamente', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#E5E5E3] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F2] border border-[#F0D5D5] text-[#D7141A] flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#D7141A]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616] flex items-center gap-2">
                Plantillas de WhatsApp DetailVlak
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Para: <strong className="text-[#161616]">{quote.client_name}</strong> ({quote.client_phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors border border-[#E5E5E3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de pestañas de plantillas */}
        <div className="px-4 pt-3 pb-2 border-b border-[#E5E5E3] bg-[#F5F5F4] overflow-x-auto flex gap-3 no-scrollbar">
          {whatsappTemplates.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveKey(t.key);
                setIsEditingTemplate(false);
              }}
              className={`pb-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
                activeKey === t.key
                  ? 'text-[#161616] border-[#D7141A]'
                  : 'text-[#6B6B6B] hover:text-[#161616] border-transparent'
              }`}
            >
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        {/* Cuerpo / Previsualización */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6B6B6B]">
              {currentTemplateObj?.description}
            </p>
            {profile?.roles.includes('admin') && (
              <button
                onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                className="text-[11px] font-semibold text-[#161616] hover:text-[#D7141A] flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isEditingTemplate ? 'Ver mensaje compilado' : 'Editar plantilla base'}</span>
              </button>
            )}
          </div>

          {isEditingTemplate ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[11px] text-[#6B6B6B]">
                Variables disponibles: <code>{'{{cliente}}'}</code>, <code>{'{{vehiculo}}'}</code>, <code>{'{{operador}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{tiempo}}'}</code>, <code>{'{{servicios}}'}</code>, <code>{'{{servicios_resumen}}'}</code>
              </div>
              <textarea
                value={rawTemplate}
                onChange={(e) => setRawTemplate(e.target.value)}
                rows={9}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3.5 text-xs text-[#161616] font-mono focus:border-[#D7141A] focus:outline-none leading-relaxed"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveTemplate}
              >
                Guardar plantilla
              </Button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={compiledMessage}
                onChange={(e) => setCompiledMessage(e.target.value)}
                rows={11}
                className="w-full bg-white border border-[#E5E5E3] rounded-xl p-4 text-xs text-[#161616] font-sans focus:border-[#D7141A] focus:outline-none leading-relaxed"
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-[#9A9A9A]">
                Podés editar este texto antes de enviar
              </div>
            </div>
          )}

          {/* Tarjeta resumen rápida de la cotización */}
          <div className="p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#161616]" />
              <span className="text-[#161616] font-bold">{quote.vehicle_info}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                {quote.vehicle_category}
              </span>
            </div>
            <div className="font-bold text-[#161616] font-mono text-sm">
              {formatCurrency(quote.total_amount, 'UYU')}
            </div>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5E3] bg-[#F5F5F4] flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-[#161616]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar mensaje'}</span>
          </Button>

          <Button
            variant="whatsapp"
            size="sm"
            onClick={handleSendWhatsApp}
          >
            <Send className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </Button>
        </div>

      </div>
    </div>
  );
};

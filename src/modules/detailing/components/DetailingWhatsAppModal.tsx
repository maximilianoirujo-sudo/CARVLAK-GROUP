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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-panel border border-borde rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-borde flex items-center justify-between bg-negro">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel border border-borde text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-rojo" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Plantillas WhatsApp DetailVlak
              </h3>
              <p className="text-xs text-gris-texto">
                Para: <strong className="text-white">{quote.client_name}</strong> ({quote.client_phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-panel hover:bg-negro text-gris-texto hover:text-white flex items-center justify-center transition-colors border border-borde"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de pestañas de plantillas */}
        <div className="px-4 pt-3 pb-2 border-b border-borde bg-negro overflow-x-auto flex gap-3 no-scrollbar">
          {whatsappTemplates.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveKey(t.key);
                setIsEditingTemplate(false);
              }}
              className={`pb-2 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
                activeKey === t.key
                  ? 'text-white border-rojo'
                  : 'text-gris-texto hover:text-white border-transparent'
              }`}
            >
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        {/* Cuerpo / Previsualización */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gris-texto">
              {currentTemplateObj?.description}
            </p>
            {profile?.roles.includes('admin') && (
              <button
                onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                className="text-[11px] font-bold text-white hover:text-rojo flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isEditingTemplate ? 'Ver mensaje compilado' : 'Editar plantilla base'}</span>
              </button>
            )}
          </div>

          {isEditingTemplate ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-negro border border-borde text-[11px] text-gris-texto">
                Variables disponibles: <code>{'{{cliente}}'}</code>, <code>{'{{vehiculo}}'}</code>, <code>{'{{operador}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{tiempo}}'}</code>, <code>{'{{servicios}}'}</code>, <code>{'{{servicios_resumen}}'}</code>
              </div>
              <textarea
                value={rawTemplate}
                onChange={(e) => setRawTemplate(e.target.value)}
                rows={9}
                className="w-full bg-negro border border-borde rounded-xl p-3.5 text-xs text-white font-mono focus:border-rojo focus:outline-none leading-relaxed"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveTemplate}
              >
                Guardar Plantilla
              </Button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={compiledMessage}
                onChange={(e) => setCompiledMessage(e.target.value)}
                rows={11}
                className="w-full bg-negro border border-borde rounded-xl p-4 text-xs text-white font-sans focus:border-rojo focus:outline-none leading-relaxed"
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-gris-texto">
                Podés editar este texto antes de enviar
              </div>
            </div>
          )}

          {/* Tarjeta resumen rápida de la cotización */}
          <div className="p-3 rounded-xl bg-negro border border-borde flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-white" />
              <span className="text-white font-bold">{quote.vehicle_info}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-panel border border-borde text-gris-texto font-bold">
                {quote.vehicle_category}
              </span>
            </div>
            <div className="font-black text-white font-mono text-sm">
              {formatCurrency(quote.total_amount, 'UYU')}
            </div>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="p-4 sm:p-5 border-t border-borde bg-negro flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
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

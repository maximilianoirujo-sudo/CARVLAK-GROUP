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
      <div className="bg-[#0E131F] border border-purple-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121826]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Plantillas WhatsApp DetailVlak
              </h3>
              <p className="text-xs text-slate-400">
                Para: <strong className="text-slate-200">{quote.client_name}</strong> ({quote.client_phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de pestañas de plantillas */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-800/80 bg-[#0B0F19] overflow-x-auto flex gap-1.5 no-scrollbar">
          {whatsappTemplates.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveKey(t.key);
                setIsEditingTemplate(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeKey === t.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        {/* Cuerpo / Previsualización */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {currentTemplateObj?.description}
            </p>
            {profile?.roles.includes('admin') && (
              <button
                onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isEditingTemplate ? 'Ver mensaje compilado' : 'Editar plantilla base'}</span>
              </button>
            )}
          </div>

          {isEditingTemplate ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                Variables disponibles: <code>{'{{cliente}}'}</code>, <code>{'{{vehiculo}}'}</code>, <code>{'{{operador}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{tiempo}}'}</code>, <code>{'{{servicios}}'}</code>, <code>{'{{servicios_resumen}}'}</code>
              </div>
              <textarea
                value={rawTemplate}
                onChange={(e) => setRawTemplate(e.target.value)}
                rows={9}
                className="w-full bg-[#070A0E] border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-200 font-mono focus:border-purple-500 focus:outline-none leading-relaxed"
              />
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Guardar Plantilla
              </button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={compiledMessage}
                onChange={(e) => setCompiledMessage(e.target.value)}
                rows={11}
                className="w-full bg-[#070A0E] border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-200 font-sans focus:border-emerald-500 focus:outline-none leading-relaxed shadow-inner"
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-slate-500">
                Podés editar este texto antes de enviar
              </div>
            </div>
          )}

          {/* Tarjeta resumen rápida de la cotización */}
          <div className="p-3 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-bold">{quote.vehicle_info}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                {quote.vehicle_category}
              </span>
            </div>
            <div className="font-black text-amber-400 text-sm">
              {formatCurrency(quote.total_amount, 'UYU')}
            </div>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#121826] flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};

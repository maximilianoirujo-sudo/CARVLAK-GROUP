import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MessageSquare, Send, Copy, Check } from 'lucide-react';
import { Appointment, Client, Vehicle } from '../../types';
import { generateAppointmentWhatsAppMessage, sanitizePhoneForWhatsApp, normalizePlate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  client?: Client;
  vehicle?: Vehicle;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  appointment,
  client,
  vehicle
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const dateStr = appointment.start_time.slice(0, 10);
  const timeStr = appointment.start_time.slice(11, 16);
  const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model} (${normalizePlate(vehicle.plate)})` : 'su vehículo';

  const defaultMsg = generateAppointmentWhatsAppMessage(
    appointment.business,
    client?.full_name || 'Estimado cliente',
    vehicleInfo,
    dateStr,
    timeStr,
    appointment.title || 'Servicio agendado'
  );

  const [message, setMessage] = useState(defaultMsg);

  const handleSend = () => {
    if (!client?.phone) {
      showToast('El cliente no tiene teléfono cargado', 'error');
      return;
    }
    const cleanPhone = sanitizePhoneForWhatsApp(client.phone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    showToast('Mensaje copiado al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recordatorio de Turno por WhatsApp"
      subtitle={`Enviar a ${client?.full_name || 'Cliente'} (${client?.phone || 'Sin tel.'})`}
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Mensaje pre-armado
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={9}
          className="w-full bg-[#131924] border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-amber-400"
        />

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Abrir en WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

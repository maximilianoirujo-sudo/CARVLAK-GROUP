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
        <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
          Mensaje pre-armado
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={9}
          className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-xs sm:text-sm text-white leading-relaxed focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white border border-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Abrir en WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MessageSquare, Send, Copy, Check } from 'lucide-react';
import { Appointment, Client, Vehicle } from '../../types';
import { generateAppointmentWhatsAppMessage, sanitizePhoneForWhatsApp, normalizePlate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

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
      title="Recordatorio de turno por WhatsApp"
      subtitle={`Enviar a ${client?.full_name || 'Cliente'} (${client?.phone || 'Sin tel.'})`}
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
          Mensaje pre-armado
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={9}
          className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl p-3 text-xs sm:text-sm text-[#161616] leading-relaxed focus:bg-white focus:border-[#161616] outline-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E3]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-[#1E6B43]" /> : <Copy className="w-4 h-4 text-[#6B6B6B]" />}
            <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
          </Button>

          <Button
            type="button"
            variant="whatsapp"
            size="sm"
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
            <span>Abrir en WhatsApp</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

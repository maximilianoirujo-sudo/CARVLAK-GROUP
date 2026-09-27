import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, UserCheck, Share2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Client, ClientOrigin } from '../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit
}) => {
  const { addClient, updateClient, checkPhoneDuplicate } = useData();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [origin, setOrigin] = useState<ClientOrigin>('WhatsApp');
  const [notes, setNotes] = useState('');
  const [socialMediaConsent, setSocialMediaConsent] = useState(false);

  // Detección de duplicados en tiempo real
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);

  useEffect(() => {
    if (clientToEdit) {
      setFullName(clientToEdit.full_name);
      setPhone(clientToEdit.phone);
      setEmail(clientToEdit.email || '');
      setCedula(clientToEdit.cedula || '');
      setOrigin(clientToEdit.origin);
      setNotes(clientToEdit.notes || '');
      setSocialMediaConsent(clientToEdit.social_media_consent ?? false);
      setDuplicateClient(null);
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setCedula('');
      setOrigin('WhatsApp');
      setNotes('');
      setSocialMediaConsent(false);
      setDuplicateClient(null);
    }
  }, [clientToEdit, isOpen]);

  // Chequeo de duplicado mientras escribe el teléfono
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val.trim().length >= 8) {
      const dup = checkPhoneDuplicate(val, clientToEdit?.id);
      setDuplicateClient(dup);
    } else {
      setDuplicateClient(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Nombre y teléfono son obligatorios', 'warning');
      return;
    }

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cedula: cedula.trim() || undefined,
        origin,
        notes: notes.trim() || undefined,
        social_media_consent: socialMediaConsent
      });
      showToast('Cliente actualizado correctamente', 'success');
    } else {
      const res = addClient({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cedula: cedula.trim() || undefined,
        origin,
        notes: notes.trim() || undefined,
        social_media_consent: socialMediaConsent
      });

      if (res.duplicateWarning) {
        showToast(res.duplicateWarning, 'warning');
      } else {
        showToast(`Cliente ${fullName} registrado exitosamente`, 'success');
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      subtitle="Directorio compartido entre Automotora, Detailing e Inspección"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Nombre */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Nombre y Apellido *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Nicolás Varela"
            required
            className="w-full bg-black border border-[#2A2A2A] rounded-xl p-3 text-sm text-white font-semibold placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Teléfono / WhatsApp *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Ej: 099 123 456"
            required
            className={`w-full bg-black border rounded-xl p-3 text-sm text-white font-mono placeholder-[#8A8A8A] focus:outline-none ${
              duplicateClient ? 'border-[#D7141A] ring-1 ring-[#D7141A]' : 'border-[#2A2A2A] focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]'
            }`}
          />

          {duplicateClient && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#D7141A]/10 border border-[#D7141A]/30 text-white flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D7141A]" />
              <div>
                <p className="font-bold text-[11px] text-[#D7141A]">¡Número ya registrado!</p>
                <p className="text-[10px] text-white/90 mt-0.5">
                  Pertenece a <strong>{duplicateClient.full_name}</strong>. Podés editar el cliente existente para no duplicar datos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Email y Cédula */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@gmail.com"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Cédula de Identidad</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 4.582.119-4"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
        </div>

        {/* Origen */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1.5">Origen / Canal de Llegada</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
            {(['WhatsApp', 'Instagram', 'Presencial', 'Referido', 'Google Form'] as ClientOrigin[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setOrigin(ch)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  origin === ch
                    ? 'bg-[#D7141A] text-white border-[#D7141A]'
                    : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Notas u Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Preferencias del cliente, servicios de interés, etc..."
            className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A]"
          />
        </div>

        {/* Consentimiento Redes Sociales */}
        <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-start gap-3">
          <input
            id="social_media_consent"
            type="checkbox"
            checked={socialMediaConsent}
            onChange={(e) => setSocialMediaConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#2A2A2A] bg-black text-[#D7141A] focus:ring-[#D7141A] focus:ring-offset-black accent-[#D7141A] cursor-pointer"
          />
          <label htmlFor="social_media_consent" className="cursor-pointer select-none">
            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
              <Share2 className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>Consentimiento para fotos en redes sociales</span>
            </div>
            <p className="text-[11px] text-[#8A8A8A] mt-0.5">
              Autoriza a CARVLAK a publicar fotos de la entrega o vehículo en Instagram sin datos personales sensibles.
            </p>
          </label>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold border border-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-bold shadow-sm transition-colors cursor-pointer"
          >
            {clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

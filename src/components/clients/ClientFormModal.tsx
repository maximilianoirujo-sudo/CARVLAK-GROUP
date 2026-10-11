import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, Share2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Client, ClientOrigin } from '../../types';
import { validateUruguayanPhone, validateUruguayanCedula } from '../../lib/formatters';

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

  // Cliente existente seleccionado en caso de duplicado
  const [activeExistingClient, setActiveExistingClient] = useState<Client | null>(null);

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
      setActiveExistingClient(null);
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setCedula('');
      setOrigin('WhatsApp');
      setNotes('');
      setSocialMediaConsent(false);
      setDuplicateClient(null);
      setActiveExistingClient(null);
    }
  }, [clientToEdit, isOpen]);

  // Validaciones
  const phoneValidation = phone.trim() ? validateUruguayanPhone(phone) : { isValid: true };
  const cedulaValidation = cedula.trim() ? validateUruguayanCedula(cedula) : { isValid: true };

  // Chequeo de duplicado mientras escribe el teléfono
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const targetId = clientToEdit?.id || activeExistingClient?.id;
    if (val.trim().length >= 8) {
      const dup = checkPhoneDuplicate(val, targetId);
      setDuplicateClient(dup);
    } else {
      setDuplicateClient(null);
    }
  };

  const handleUseExisting = (dup: Client) => {
    setActiveExistingClient(dup);
    setFullName(dup.full_name);
    setPhone(dup.phone);
    setEmail(dup.email || '');
    setCedula(dup.cedula || '');
    setOrigin(dup.origin);
    setNotes(dup.notes || '');
    setSocialMediaConsent(dup.social_media_consent ?? false);
    setDuplicateClient(null);
    showToast(`Cargados datos de ${dup.full_name}`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      showToast('Nombre y teléfono son obligatorios', 'warning');
      return;
    }

    if (!phoneValidation.isValid) {
      showToast(phoneValidation.error || 'Teléfono uruguayo inválido', 'warning');
      return;
    }

    if (!cedulaValidation.isValid) {
      showToast(cedulaValidation.error || 'Cédula uruguaya inválida', 'warning');
      return;
    }

    const targetClient = clientToEdit || activeExistingClient;

    if (targetClient) {
      updateClient(targetClient.id, {
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

  const isEditing = Boolean(clientToEdit || activeExistingClient);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar cliente' : 'Registrar nuevo cliente'}
      subtitle="Directorio compartido entre Automotora, Detailing y Carbusters"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1">Nombre y apellido *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Nicolás Varela"
            required
            className="w-full bg-white border border-[#E5E5E3] rounded-xl p-3 text-xs text-[#161616] font-medium placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1">Teléfono / WhatsApp *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Ej: 099 123 456"
            required
            className={`w-full bg-white border rounded-xl p-3 text-xs text-[#161616] font-mono placeholder-[#9A9A9A] focus:outline-none transition-colors ${
              (phone.trim().length >= 4 && !phoneValidation.isValid) || duplicateClient
                ? 'border-[#D7141A] ring-1 ring-[#D7141A]'
                : 'border-[#E5E5E3] focus:border-[#D7141A]'
            }`}
          />

          {phone.trim().length >= 4 && !phoneValidation.isValid && (
            <p className="text-[11px] text-[#D7141A] font-medium mt-1">
              {phoneValidation.error}
            </p>
          )}

          {duplicateClient && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#FDF2F2] border border-[#B80E14]/20 text-[#B80E14] flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D7141A]" />
                <div>
                  <p className="font-semibold text-xs text-[#B80E14]">¡Número ya registrado!</p>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Pertenece a <strong className="text-[#161616]">{duplicateClient.full_name}</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUseExisting(duplicateClient)}
                className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#2A2A2A] text-white font-semibold text-xs shrink-0 transition-colors cursor-pointer shadow-xs self-end sm:self-auto"
              >
                Usar el existente
              </button>
            </div>
          )}
        </div>

        {/* Email y Cédula */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@gmail.com"
              className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#161616] mb-1">Cédula de identidad</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 4.582.119-4"
              className={`w-full bg-white border rounded-xl p-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none transition-colors ${
                cedula.trim().length >= 4 && !cedulaValidation.isValid
                  ? 'border-[#D7141A] ring-1 ring-[#D7141A]'
                  : 'border-[#E5E5E3] focus:border-[#D7141A]'
              }`}
            />
            {cedula.trim().length >= 4 && !cedulaValidation.isValid && (
              <p className="text-[11px] text-[#D7141A] font-medium mt-1">
                {cedulaValidation.error}
              </p>
            )}
          </div>
        </div>

        {/* Origen */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1.5">Origen o canal de llegada</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
            {(['WhatsApp', 'Instagram', 'Presencial', 'Referido', 'Google Form'] as ClientOrigin[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setOrigin(ch)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  origin === ch
                    ? 'bg-[#161616] text-white border-[#161616] font-semibold shadow-xs'
                    : 'bg-white border-[#E5E5E3] text-[#6B6B6B] hover:text-[#161616] hover:bg-[#F5F5F4]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium text-[#161616] mb-1">Notas u observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Preferencias del cliente, servicios de interés, etc..."
            className="w-full bg-white border border-[#E5E5E3] rounded-xl p-2.5 text-xs text-[#161616] placeholder-[#9A9A9A] focus:outline-none focus:border-[#D7141A] transition-colors"
          />
        </div>

        {/* Consentimiento Redes Sociales */}
        <div className="p-3 bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl flex items-start gap-3">
          <input
            id="social_media_consent"
            type="checkbox"
            checked={socialMediaConsent}
            onChange={(e) => setSocialMediaConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#D0D0CD] text-[#D7141A] focus:ring-[#D7141A] accent-[#D7141A] cursor-pointer"
          />
          <label htmlFor="social_media_consent" className="cursor-pointer select-none">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[#161616]">
              <Share2 className="w-3.5 h-3.5 text-[#D7141A]" />
              <span>Consentimiento para fotos en redes sociales</span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Autoriza a CARVLAK a publicar fotos de la entrega o vehículo en Instagram sin datos personales sensibles.
            </p>
          </label>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E5E3]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] font-medium border border-[#E5E5E3] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B80E14] text-white font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {clientToEdit ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

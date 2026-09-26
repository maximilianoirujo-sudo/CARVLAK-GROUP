import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AlertTriangle, UserCheck } from 'lucide-react';
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
      setDuplicateClient(null);
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setCedula('');
      setOrigin('WhatsApp');
      setNotes('');
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
        notes: notes.trim() || undefined
      });
      showToast('Cliente actualizado correctamente', 'success');
    } else {
      const res = addClient({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cedula: cedula.trim() || undefined,
        origin,
        notes: notes.trim() || undefined
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
        
        {/*  */}
        <div>
          <label className="block text-slate-400 font-bold mb-1">Nombre y Apellido *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Nicolás Varela"
            required
            className="w-full bg-[#131924] border border-slate-700 rounded-xl p-3 text-sm text-white font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        {/*  */}
        <div>
          <label className="block text-slate-400 font-bold mb-1">Teléfono / WhatsApp *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Ej: 099 123 456"
            required
            className={`w-full bg-[#131924] border rounded-xl p-3 text-sm text-white font-mono focus:outline-none ${
              duplicateClient ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-700 focus:border-amber-400'
            }`}
          />

          {/*  */}
          {duplicateClient && (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">¡Número ya registrado!</p>
                <p className="text-[10px] text-amber-200/90 mt-0.5">
                  Pertenece a <strong>{duplicateClient.full_name}</strong>. Podés editar el cliente existente para no duplicar datos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/*  */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@gmail.com"
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-1">Cédula de Identidad</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 4.582.119-4"
              className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/*  */}
        <div>
          <label className="block text-slate-400 font-bold mb-1.5">Origen / Canal de Llegada</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center">
            {(['WhatsApp', 'Instagram', 'Presencial', 'Referido', 'Google Form'] as ClientOrigin[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setOrigin(ch)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                  origin === ch
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/*  */}
        <div>
          <label className="block text-slate-400 font-bold mb-1">Notas u Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Preferencias del cliente, servicios de interés, etc..."
            className="w-full bg-[#131924] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/*  */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
          >
            {clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

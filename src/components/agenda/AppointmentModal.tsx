import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Business, Appointment, AppointmentStatus, Currency } from '../../types';
import { normalizePlate } from '../../lib/formatters';
import { Droplets, ClipboardCheck, Car } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: Appointment | null;
  defaultDate?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointmentToEdit,
  defaultDate
}) => {
  const { clients, vehicles, addAppointment, updateAppointment } = useData();
  const { availableProfiles, profile } = useAuth();
  const { showToast } = useToast();

  const [business, setBusiness] = useState<Business>('detailing');
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [assignedTo, setAssignedTo] = useState(profile?.id || '');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState<AppointmentStatus>('Pendiente');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [priceCurrency, setPriceCurrency] = useState<Currency>('UYU');

  useEffect(() => {
    if (appointmentToEdit) {
      setBusiness(appointmentToEdit.business);
      setClientId(appointmentToEdit.client_id);
      setVehicleId(appointmentToEdit.vehicle_id || '');
      setAssignedTo(appointmentToEdit.assigned_to || '');
      setDate(appointmentToEdit.start_time.slice(0, 10));
      setTime(appointmentToEdit.start_time.slice(11, 16));
      setDuration(appointmentToEdit.duration_minutes || 60);
      setStatus(appointmentToEdit.status);
      setTitle(appointmentToEdit.title || '');
      setNotes(appointmentToEdit.notes || '');
      setPriceAmount(appointmentToEdit.price_amount || 0);
      setPriceCurrency(appointmentToEdit.price_currency || 'UYU');
    } else {
      // Defaults para nuevo turno
      setClientId(clients[0]?.id || '');
      setVehicleId(vehicles[0]?.id || '');
      setAssignedTo(profile?.id || '');
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setTime('10:00');
      setDuration(60);
      setStatus('Pendiente');
      setTitle('');
      setNotes('');
      setPriceAmount(0);
      setPriceCurrency('UYU');
    }
  }, [appointmentToEdit, defaultDate, isOpen, clients, vehicles, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showToast('Seleccione un cliente para agendar el turno', 'warning');
      return;
    }

    const start_time = `${date}T${time}:00Z`;

    if (appointmentToEdit) {
      updateAppointment(appointmentToEdit.id, {
        business,
        client_id: clientId,
        vehicle_id: vehicleId || undefined,
        assigned_to: assignedTo || undefined,
        start_time,
        duration_minutes: duration,
        status,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        price_amount: priceAmount,
        price_currency: priceCurrency
      });
      showToast('Turno actualizado correctamente', 'success');
    } else {
      addAppointment({
        business,
        client_id: clientId,
        vehicle_id: vehicleId || undefined,
        assigned_to: assignedTo || undefined,
        start_time,
        duration_minutes: duration,
        status,
        title: title.trim() || 'Servicio General',
        notes: notes.trim() || undefined,
        price_amount: priceAmount,
        price_currency: priceCurrency
      });
      showToast('Turno agendado exitosamente', 'success');
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointmentToEdit ? 'Editar Turno' : 'Agendar Nuevo Turno'}
      subtitle="Coordinación en la agenda unificada de CARVLAK Group"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Negocio Responsable */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
            Negocio Responsable *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setBusiness('detailing')}
              className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                business === 'detailing'
                  ? 'bg-[#D7141A]/15 border-[#D7141A] text-white shadow-sm'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>DetailVlak</span>
            </button>
            <button
              type="button"
              onClick={() => setBusiness('inspeccion')}
              className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                business === 'inspeccion'
                  ? 'bg-[#D7141A]/15 border-[#D7141A] text-white shadow-sm'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Inspección</span>
            </button>
            <button
              type="button"
              onClick={() => setBusiness('automotora')}
              className={`py-2 px-2 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                business === 'automotora'
                  ? 'bg-[#D7141A]/15 border-[#D7141A] text-white shadow-sm'
                  : 'bg-black border-[#2A2A2A] text-[#8A8A8A] hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Automotora</span>
            </button>
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Título o Servicio *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Cerámico 3 años, Peritaje en patio, Entrega de unidad..."
            required
            className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white placeholder-[#8A8A8A] font-medium focus:outline-none focus:border-[#D7141A] focus:ring-1 focus:ring-[#D7141A]"
          />
        </div>

        {/* Cliente y Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Cliente *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Vehículo Asociado</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="">Sin vehículo específico</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {normalizePlate(v.plate)} - {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha, Hora, Duración */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Duración</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 h 30 min</option>
              <option value={120}>2 horas</option>
              <option value={180}>3 horas</option>
              <option value={240}>4 horas</option>
              <option value={360}>Jornada (6h)</option>
            </select>
          </div>
        </div>

        {/* Asignado y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Empleado Asignado</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.roles.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Estado del Turno</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7141A] cursor-pointer"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="En curso">En curso</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Presupuesto y Moneda */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Monto Presupuesto</label>
            <input
              type="number"
              value={priceAmount}
              onChange={(e) => setPriceAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white font-title font-bold text-sm focus:outline-none focus:border-[#D7141A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Moneda</label>
            <div className="flex rounded-xl overflow-hidden border border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setPriceCurrency('UYU')}
                className={`flex-1 py-2 font-title font-bold transition-colors cursor-pointer ${
                  priceCurrency === 'UYU' ? 'bg-[#D7141A] text-white' : 'bg-black text-[#8A8A8A]'
                }`}
              >
                $UYU
              </button>
              <button
                type="button"
                onClick={() => setPriceCurrency('USD')}
                className={`flex-1 py-2 font-title font-bold transition-colors cursor-pointer ${
                  priceCurrency === 'USD' ? 'bg-[#D7141A] text-white' : 'bg-black text-[#8A8A8A]'
                }`}
              >
                USD $
              </button>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider mb-1">Notas u Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Detalles sobre el trabajo o requerimientos del cliente..."
            className="w-full bg-black border border-[#2A2A2A] rounded-xl p-2.5 text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#D7141A] resize-none"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold text-xs border border-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7141A] hover:bg-[#B51015] text-white font-title font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {appointmentToEdit ? 'Guardar Cambios' : 'Agendar Turno'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

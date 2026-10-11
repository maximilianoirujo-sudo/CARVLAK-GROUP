import React, { useState } from 'react';
import { Ban, Clock, Calendar, AlertCircle } from 'lucide-react';
import { DetailingConfig } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { getLocalDateString } from '../../../../lib/formatters';

interface DetailingBlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DetailingConfig;
  defaultDate?: string;
  defaultBayId?: string;
  onSaveBlock: (data: {
    work_bay_id: string;
    start_time: string; // ISO
    duration_minutes: number;
    reason: string;
  }) => void;
}

export const DetailingBlockTimeModal: React.FC<DetailingBlockTimeModalProps> = ({
  isOpen,
  onClose,
  config,
  defaultDate,
  defaultBayId,
  onSaveBlock
}) => {
  const [date, setDate] = useState<string>(defaultDate || getLocalDateString());
  const [startTime, setStartTime] = useState<string>('12:00');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [bayId, setBayId] = useState<string>(
    defaultBayId || config.work_bays[0]?.id || 'box-1'
  );
  const [reason, setReason] = useState<string>('Mantenimiento preventivo de box');

  const reasonsPresets = [
    'Mantenimiento preventivo de box',
    'Limpieza profunda y cambio de filtros',
    'Ausencia del personal / Capacitación',
    'Feriado / Día no laborable especial',
    'Reparación de elevador o compresor',
    'Otro motivo'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayId || !date || !startTime) return;

    // ISO timestamp con zona horaria de Uruguay (-03:00)
    const isoStart = `${date}T${startTime}:00-03:00`;
    onSaveBlock({
      work_bay_id: bayId,
      start_time: isoStart,
      duration_minutes: Math.round(durationHours * 60),
      reason: reason.trim() || 'Horario bloqueado'
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bloquear Horario en Taller"
      subtitle="Marcá un intervalo horario como no disponible para turnos de clientes."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
            Puesto de trabajo (Box)
          </label>
          <select
            value={bayId}
            onChange={(e) => setBayId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
          >
            {config.work_bays.map((bay) => (
              <option key={bay.id} value={bay.id}>
                {bay.name} {!bay.is_active ? '(Inactivo)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
              Hora de inicio
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
            Duración del bloqueo: {durationHours} hs ({Math.round(durationHours * 60)} min)
          </label>
          <div className="flex gap-2">
            {[1, 2, 4, 8].map((hrs) => (
              <button
                type="button"
                key={hrs}
                onClick={() => setDurationHours(hrs)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  durationHours === hrs
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:border-gray-400'
                }`}
              >
                {hrs} hs
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
            Motivo del bloqueo
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {reasonsPresets.map((pr) => (
              <button
                type="button"
                key={pr}
                onClick={() => setReason(pr)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  reason === pr
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-[#F5F5F4] text-[#6B6B6B] border-[#E5E5E3] hover:border-gray-400'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribí el motivo del bloqueo..."
            className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <Ban className="w-4 h-4" />
            Confirmar Bloqueo
          </Button>
        </div>
      </form>
    </Modal>
  );
};

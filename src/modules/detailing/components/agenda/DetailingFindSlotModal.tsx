import React, { useState, useMemo } from 'react';
import { Clock, Calendar, Check, X, Sparkles, ChevronRight } from 'lucide-react';
import { Appointment, DetailingConfig, DetailingWorkBay } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { 
  getLocalDateString, 
  getDayOfWeekKey, 
  timeStringToMinutes, 
  minutesToTimeString, 
  formatLocalDate,
  formatLocalTime
} from '../../../../lib/formatters';

interface DetailingFindSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DetailingConfig;
  appointments: Appointment[];
  onSelectSlot: (slot: { date: string; time: string; bayId: string; bayName: string; durationMinutes: number }) => void;
}

export const DetailingFindSlotModal: React.FC<DetailingFindSlotModalProps> = ({
  isOpen,
  onClose,
  config,
  appointments,
  onSelectSlot
}) => {
  const [durationHours, setDurationHours] = useState<number>(3);
  const [selectedBayFilter, setSelectedBayFilter] = useState<string>('all');

  const durationMinutes = Math.round(durationHours * 60);

  // Buscar los 3 primeros huecos libres
  const availableSlots = useMemo(() => {
    if (!isOpen) return [];

    const activeBays = config.work_bays.filter((b) => b.is_active && (selectedBayFilter === 'all' || b.id === selectedBayFilter));
    if (activeBays.length === 0) return [];

    const slotsFound: { date: string; time: string; bayId: string; bayName: string; durationMinutes: number }[] = [];
    const now = new Date();
    const buffer = config.buffer_between_appointments_min || 15;

    // Buscar en los próximos 14 días
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      if (slotsFound.length >= 3) break;

      const targetDate = new Date(now.getTime() + dayOffset * 86400000);
      const dateStr = getLocalDateString(targetDate);

      // Verificar feriados
      const isHoliday = (config.holidays || []).some((h) => h.date === dateStr);
      if (isHoliday) continue;

      // Horario de este día
      const dayKey = getDayOfWeekKey(dateStr);
      const daySchedule = config.schedule?.[dayKey];
      if (!daySchedule || !daySchedule.is_open) continue;

      const shopOpenMinutes = timeStringToMinutes(daySchedule.open || '08:30');
      const shopCloseMinutes = timeStringToMinutes(daySchedule.close || '18:30');

      // Si es hoy, no buscar antes de la hora actual + 30 min
      let startSearchMinutes = shopOpenMinutes;
      if (dayOffset === 0) {
        const currentMins = now.getHours() * 60 + now.getMinutes() + 30;
        startSearchMinutes = Math.max(shopOpenMinutes, Math.ceil(currentMins / 30) * 30);
      }

      // Evaluar cada box activo
      for (const bay of activeBays) {
        if (slotsFound.length >= 3) break;

        // Turnos en este box y fecha
        const bayAppts = appointments.filter((a) => {
          if (a.business !== 'detailing' || a.is_archived || a.voided_at) return false;
          if (a.status === 'Cancelado') return false;
          if (a.work_bay_id !== bay.id) return false;
          return a.start_time.startsWith(dateStr);
        }).map((a) => {
          const apptDate = new Date(a.start_time);
          const startM = apptDate.getHours() * 60 + apptDate.getMinutes();
          const endM = startM + (a.duration_minutes || 180);
          return { startM, endM };
        }).sort((a, b) => a.startM - b.startM);

        // Iterar en slots cada 30 minutos
        for (let testM = startSearchMinutes; testM + durationMinutes <= shopCloseMinutes; testM += 30) {
          const testEndM = testM + durationMinutes;

          // Verificar si choca con algún turno (+ buffer)
          const hasCollision = bayAppts.some((appt) => {
            const blockedStart = Math.max(0, appt.startM - buffer);
            const blockedEnd = appt.endM + buffer;
            return testM < blockedEnd && testEndM > blockedStart;
          });

          if (!hasCollision) {
            slotsFound.push({
              date: dateStr,
              time: minutesToTimeString(testM),
              bayId: bay.id,
              bayName: bay.name,
              durationMinutes
            });
            break; // Siguiente puesto o día
          }
        }
      }
    }

    return slotsFound.slice(0, 3);
  }, [isOpen, durationMinutes, selectedBayFilter, config, appointments]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buscar próximo hueco libre en el taller"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-[#6B6B6B] leading-relaxed">
          El sistema analiza los horarios de atención, días feriados y turnos ya agendados en cada box para proponerte los primeros 3 huecos libres disponibles.
        </p>

        {/* Duración requerida */}
        <div>
          <label className="text-xs font-bold text-[#161616] block mb-1.5">
            Duración estimada del trabajo
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 8, 12].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setDurationHours(hours)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  durationHours === hours
                    ? 'bg-[#161616] text-white border-[#161616]'
                    : 'bg-white text-[#161616] border-[#E5E5E3] hover:border-[#161616]'
                }`}
              >
                {hours} {hours === 1 ? 'hora' : 'horas'}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Box opcional */}
        <div>
          <label className="text-xs font-bold text-[#161616] block mb-1">
            Puesto de trabajo (opcional)
          </label>
          <select
            value={selectedBayFilter}
            onChange={(e) => setSelectedBayFilter(e.target.value)}
            className="w-full text-xs bg-white border border-[#E5E5E3] rounded-lg px-3 py-2 text-[#161616] focus:border-[#D7141A] focus:outline-hidden"
          >
            <option value="all">Cualquier puesto disponible</option>
            {config.work_bays.filter((b) => b.is_active).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Resultados: Los 3 primeros huecos */}
        <div className="pt-2 border-t border-[#E5E5E3]">
          <span className="text-xs font-bold text-[#161616] block mb-2">
            Primeros huecos recomendados:
          </span>

          {availableSlots.length === 0 ? (
            <div className="p-4 bg-[#F5F5F4] rounded-xl text-center text-xs text-[#6B6B6B]">
              No se encontraron huecos libres continuos de {durationHours} horas en los próximos 14 días con los criterios seleccionados.
            </div>
          ) : (
            <div className="space-y-2">
              {availableSlots.map((slot, idx) => (
                <div
                  key={`${slot.date}-${slot.time}-${slot.bayId}`}
                  className="p-3 bg-white border border-[#E5E5E3] hover:border-[#161616] rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                  onClick={() => {
                    onSelectSlot(slot);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#161616] flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#161616]">
                          {formatLocalDate(slot.date, { weekday: 'short', day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-[#EEF7F2] text-[#059669]">
                          {slot.time} hs
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B6B6B] block mt-0.5">
                        {slot.bayName} • {durationHours} hs libres
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs py-1 px-3 group-hover:scale-102 transition-transform"
                  >
                    <span>Agendar aquí</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

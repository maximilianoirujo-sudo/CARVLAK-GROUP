import React, { useState } from 'react';
import { Camera, Check, X, Car, Fuel, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DetailingQuote, DetailingCheckinData } from '../../../../types';
import { Modal } from '../../../../components/common/Modal';
import { Button } from '../../../../components/ui/Button';
import { UruguayanPlate } from '../../../../components/ui/UruguayanPlate';

interface DetailingCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: DetailingQuote | null;
  onConfirmCheckin: (quoteId: string, checkinData: DetailingCheckinData) => void;
}

export const DetailingCheckinModal: React.FC<DetailingCheckinModalProps> = ({
  isOpen,
  onClose,
  quote,
  onConfirmCheckin
}) => {
  const [mileage, setMileage] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState<'Reserva' | '1/4' | '1/2' | '3/4' | 'Lleno'>('1/2');
  const [valuables, setValuables] = useState<string>('');
  const [preExistingDamages, setPreExistingDamages] = useState<string>('');
  const [clientAgreed, setClientAgreed] = useState<boolean>(true);

  if (!quote) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checkinPayload: DetailingCheckinData = {
      mileage: mileage ? parseInt(mileage, 10) : undefined,
      fuel_level: fuelLevel,
      valuables: valuables.trim() || 'Ninguna pertenencia de valor declarada',
      pre_existing_damages: preExistingDamages.trim() || 'Sin daños visibles declarados al ingreso',
      client_agreed: clientAgreed,
      checkin_at: new Date().toISOString()
    };
    onConfirmCheckin(quote.id, checkinPayload);
    onClose();
  };

  const fuelOptions: ('Reserva' | '1/4' | '1/2' | '3/4' | 'Lleno')[] = [
    'Reserva',
    '1/4',
    '1/2',
    '3/4',
    'Lleno'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recepción del Vehículo (Check-in)"
      subtitle="Registrá el estado del auto al ingresar al taller antes de iniciar el trabajo."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info del auto */}
        <div className="p-3 bg-[#F5F5F4] rounded-xl border border-[#E5E5E3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-[#E5E5E3] text-[#161616]">
              <Car className="w-5 h-5 text-[#D7141A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#161616] font-display">{quote.vehicle_info}</p>
              <p className="text-xs text-[#6B6B6B]">Cliente: {quote.client_name} ({quote.client_phone})</p>
            </div>
          </div>
          {quote.vehicle_plate && (
            <UruguayanPlate plate={quote.vehicle_plate} size="sm" />
          )}
        </div>

        {/* Kilometraje y Combustible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#161616] mb-1.5 uppercase tracking-wider font-display">
              Kilometraje al ingresar
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Ej. 64500"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#6B6B6B]">km</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#161616] mb-1.5 uppercase tracking-wider font-display">
              Nivel de Combustible
            </label>
            <div className="grid grid-cols-5 gap-1">
              {fuelOptions.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setFuelLevel(opt)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    fuelLevel === opt
                      ? 'bg-[#161616] text-white border-[#161616] shadow-xs'
                      : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:border-gray-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pertenencias de valor */}
        <div>
          <label className="block text-xs font-semibold text-[#161616] mb-1.5 uppercase tracking-wider font-display">
            Objetos / Pertenencias dejadas en el vehículo
          </label>
          <textarea
            rows={2}
            placeholder="Lentes de sol, cargadores, dinero, llaves secundarias, etc. (o 'Ninguna')"
            value={valuables}
            onChange={(e) => setValuables(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
          />
        </div>

        {/* Daños preexistentes */}
        <div>
          <label className="block text-xs font-semibold text-[#161616] mb-1.5 uppercase tracking-wider font-display">
            Rayones, bollos o daños preexistentes
          </label>
          <textarea
            rows={2}
            placeholder="Detallar rayones en paragolpes, parabrisas picado, llantas marcadas, etc."
            value={preExistingDamages}
            onChange={(e) => setPreExistingDamages(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
          />
        </div>

        {/* Conformidad del cliente */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E5E5E3] bg-[#F5F5F4]/60 cursor-pointer">
          <input
            type="checkbox"
            checked={clientAgreed}
            onChange={(e) => setClientAgreed(e.target.checked)}
            className="w-4 h-4 rounded text-[#D7141A] focus:ring-[#D7141A] border-gray-300"
          />
          <div className="text-xs text-[#161616]">
            <span className="font-semibold">El cliente prestó conformidad con el inventario de ingreso</span>
            <p className="text-[#6B6B6B]">El vehículo queda bajo custodia para la realización del servicio de detailing.</p>
          </div>
        </label>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Confirmar Recepción y Pasar a Recibido
          </Button>
        </div>
      </form>
    </Modal>
  );
};

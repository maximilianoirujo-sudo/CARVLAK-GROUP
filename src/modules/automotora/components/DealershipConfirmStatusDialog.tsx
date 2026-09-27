import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { DealershipVehicle, DealershipVehicleStatus } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface DealershipConfirmStatusDialogProps {
  isOpen: boolean;
  vehicle: DealershipVehicle | null;
  targetStatus: DealershipVehicleStatus | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const STATUS_DETAILS: Record<
  DealershipVehicleStatus,
  { label: string; impact: string }
> = {
  evaluacion: {
    label: 'En evaluación',
    impact: 'El vehículo entra en revisión de antecedentes, peritaje técnico y valuación inicial.'
  },
  comprado: {
    label: 'Comprado',
    impact: 'Se confirma la compra para stock propio. Se generará orden de alistamiento y detailing interno.'
  },
  preparacion: {
    label: 'En preparación',
    impact: 'El auto está en taller, alistamiento estético o sesión fotográfica antes de su publicación.'
  },
  publicado: {
    label: 'Publicado',
    impact: 'El vehículo pasa a estar visible para clientes en el catálogo público y sincronizado con Tiendanube.'
  },
  reservado: {
    label: 'Reservado',
    impact: 'Se bloquea la unidad con seña del comprador. Queda excluida de otras negociaciones activas.'
  },
  vendido: {
    label: 'Vendido',
    impact: 'Se marca como vendido, habilitando la carga del boleto/liquidación, cálculo de comisión y posventa.'
  },
  descartado: {
    label: 'Descartado',
    impact: 'El vehículo no fue adquirido o fue dado de baja. Saldrá de las listas activas de stock.'
  }
};

export const DealershipConfirmStatusDialog: React.FC<DealershipConfirmStatusDialogProps> = ({
  isOpen,
  vehicle,
  targetStatus,
  onConfirm,
  onCancel,
  isSubmitting = false
}) => {
  if (!isOpen || !vehicle || !targetStatus) return null;

  const currentInfo = STATUS_DETAILS[vehicle.status] || {
    label: vehicle.status,
    impact: ''
  };

  const targetInfo = STATUS_DETAILS[targetStatus] || {
    label: targetStatus,
    impact: ''
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E3] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#F5F5F4] border border-[#E5E5E3] text-[#D7141A]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#161616]">Confirmar cambio de estado</h3>
              <p className="text-xs text-[#6B6B6B]">
                {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1 text-[#6B6B6B] hover:text-[#161616] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-[#F5F5F4]">
          {/* Transition badge */}
          <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl border border-[#E5E5E3] shadow-sm">
            <div className="text-center">
              <span className="text-[11px] text-[#6B6B6B] uppercase block font-semibold">Actual</span>
              <span className="inline-block px-2.5 py-1 mt-1 rounded text-xs font-semibold bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                {currentInfo.label}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6B6B6B] mt-4" />
            <div className="text-center">
              <span className="text-[11px] text-[#6B6B6B] uppercase block font-semibold">Nuevo estado</span>
              <span className="inline-block px-2.5 py-1 mt-1 rounded text-xs font-bold bg-[#161616] text-white">
                {targetInfo.label}
              </span>
            </div>
          </div>

          {/* Description of impact */}
          <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl text-xs text-[#6B6B6B] leading-relaxed shadow-sm">
            <div className="font-bold text-[#161616] mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D7141A]" /> ¿Qué implica este cambio?
            </div>
            {targetInfo.impact}
          </div>

          {targetStatus === 'vendido' && (
            <div className="p-3 bg-white border border-[#E5E5E3] rounded-xl text-xs text-[#6B6B6B] shadow-sm">
              Para registrar los datos del comprador, precio final y liquidación de comisión, recordá usar el botón <strong className="text-[#161616]">"Registrar venta"</strong> en la ficha.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E5E3] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar cambio'}
          </Button>
        </div>
      </div>
    </div>
  );
};

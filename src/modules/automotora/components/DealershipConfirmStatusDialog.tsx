import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, X, ShieldAlert, Sparkles, ShoppingBag, Eye, Lock, Check } from 'lucide-react';
import { DealershipVehicle, DealershipVehicleStatus } from '../../../types';

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
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode; impact: string }
> = {
  evaluacion: {
    label: 'En evaluación',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
    impact: 'El vehículo entra en revisión de antecedentes, peritaje técnico y valuación inicial.'
  },
  comprado: {
    label: 'Comprado',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <ShoppingBag className="w-5 h-5 text-blue-400" />,
    impact: 'Se confirma la compra para stock propio. Se generará orden de alistamiento y detailing interno.'
  },
  preparacion: {
    label: 'En preparación',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    impact: 'El auto está en taller, alistamiento estético o sesión fotográfica antes de su publicación.'
  },
  publicado: {
    label: 'Publicado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <Eye className="w-5 h-5 text-emerald-400" />,
    impact: 'El vehículo pasa a estar visible para clientes en el catálogo público y sincronizado con Tiendanube.'
  },
  reservado: {
    label: 'Reservado',
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    icon: <Lock className="w-5 h-5 text-amber-300" />,
    impact: 'Se bloquea la unidad con seña del comprador. Queda excluida de otras negociaciones activas.'
  },
  vendido: {
    label: 'Vendido',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: <Check className="w-5 h-5 text-green-400" />,
    impact: 'Se marca como vendido, habilitando la carga del boleto/liquidación, cálculo de comisión y posventa.'
  },
  descartado: {
    label: 'Descartado',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
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
    color: 'text-gray-400',
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    icon: <AlertCircle className="w-5 h-5" />,
    impact: ''
  };

  const targetInfo = STATUS_DETAILS[targetStatus] || {
    label: targetStatus,
    color: 'text-gray-400',
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    icon: <AlertCircle className="w-5 h-5" />,
    impact: ''
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${targetInfo.bg} ${targetInfo.border} border`}>
              {targetInfo.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Confirmar cambio de estado</h3>
              <p className="text-xs text-gray-400">
                {vehicle.brand} {vehicle.model} {vehicle.plate ? `• ${vehicle.plate}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Transition badge */}
          <div className="flex items-center justify-center gap-3 p-3 bg-zinc-900/60 rounded-xl border border-gray-800">
            <div className="text-center">
              <span className="text-[11px] text-gray-500 uppercase block font-medium">Actual</span>
              <span className={`inline-block px-2.5 py-1 mt-1 rounded-md text-xs font-semibold ${currentInfo.bg} ${currentInfo.color} ${currentInfo.border} border`}>
                {currentInfo.label}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 mt-4" />
            <div className="text-center">
              <span className="text-[11px] text-gray-500 uppercase block font-medium">Nuevo estado</span>
              <span className={`inline-block px-2.5 py-1 mt-1 rounded-md text-xs font-semibold ${targetInfo.bg} ${targetInfo.color} ${targetInfo.border} border`}>
                {targetInfo.label}
              </span>
            </div>
          </div>

          {/* Description of impact */}
          <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-gray-300 leading-relaxed">
            <div className="font-medium text-blue-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> ¿Qué implica este cambio?
            </div>
            {targetInfo.impact}
          </div>

          {targetStatus === 'vendido' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              💡 Para registrar los datos del comprador, precio final y liquidación de comisión, recordá usar el botón <strong>"Registrar Venta"</strong> en la ficha.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900/40 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg transition-colors hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Guardando...</>
            ) : (
              <>Confirmar cambio</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

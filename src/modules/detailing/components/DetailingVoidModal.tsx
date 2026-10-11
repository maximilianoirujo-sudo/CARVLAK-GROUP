import React, { useState } from 'react';
import { AlertTriangle, Trash2, Ban, RotateCcw } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/ui/Button';

interface DetailingVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemDescription: string;
  mode: 'void' | 'permanent_delete';
  onConfirm: (reason: string) => void;
}

export const DetailingVoidModal: React.FC<DetailingVoidModalProps> = ({
  isOpen,
  onClose,
  title,
  itemDescription,
  mode,
  onConfirm
}) => {
  const [reason, setReason] = useState<string>('');
  const [confirmDeleteText, setConfirmDeleteText] = useState<string>('');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setConfirmDeleteText('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'void') {
      if (!reason.trim() || reason.trim().length < 5) {
        setError('Por favor ingresá un motivo claro de anulación (mínimo 5 caracteres).');
        return;
      }
      onConfirm(reason.trim());
      onClose();
    } else {
      if (confirmDeleteText !== 'ELIMINAR') {
        setError('Debes escribir exactamente la palabra ELIMINAR para proceder.');
        return;
      }
      onConfirm('Borrado definitivo ejecutado por Administrador');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={itemDescription}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'void' ? (
          <>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Ban className="w-4 h-4 text-amber-600" />
                <span>Anulación segura con auditoría</span>
              </div>
              <p>
                El registro quedará marcado como <strong>Anulado</strong> y no afectará métricas ni caja. Si existían comisiones o reservas de stock asociadas, se revertirán automáticamente. Podrá restaurarse en cualquier momento.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
                Motivo obligatorio de anulación *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Ej. El cliente canceló por viaje, error de tipeo en el monto, duplicado..."
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] focus:outline-none focus:border-[#D7141A]"
              />
              <span className="text-[11px] text-[#6B6B6B]">
                Quedará registrado en el historial de auditoría con tu usuario y hora exacta.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Peligro: Borrado definitivo irreversible</span>
              </div>
              <p>
                Esta acción eliminará el registro de la base de datos de forma permanente junto a todas sus dependencias. <strong>No se puede deshacer.</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1 uppercase tracking-wider font-display">
                Para confirmar, escribí <span className="text-[#D7141A] font-bold">ELIMINAR</span> abajo:
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => {
                  setConfirmDeleteText(e.target.value);
                  setError('');
                }}
                placeholder="ELIMINAR"
                className="w-full px-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#161616] font-bold focus:outline-none focus:border-[#D7141A]"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={`gap-2 ${mode === 'permanent_delete' ? 'bg-red-700 hover:bg-red-800 text-white' : ''}`}
          >
            {mode === 'void' ? (
              <>
                <Ban className="w-4 h-4" />
                Confirmar Anulación
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar Permanentemente
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

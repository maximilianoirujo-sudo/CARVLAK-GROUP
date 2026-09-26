import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Archivar',
  cancelText = 'Cancelar',
  isDanger = true
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 py-2">
        <div className={`p-3 rounded-2xl ${isDanger ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'} shrink-0`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-sm text-slate-300 leading-relaxed">
          {message}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-colors ${
            isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

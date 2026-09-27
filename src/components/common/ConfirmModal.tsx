import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui';

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
        <div className="p-3 rounded-xl bg-[#FDF2F2] text-[#B80E14] border border-[#F0D5D5] shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-sm text-[#161616] leading-relaxed font-normal">
          {message}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E3]">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};


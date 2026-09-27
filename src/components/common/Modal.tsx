import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidth} bg-white border border-[#E5E5E3] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden transition-all`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E5E3] flex items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-base sm:text-lg font-title font-bold text-[#161616] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#6B6B6B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B] hover:text-[#161616] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

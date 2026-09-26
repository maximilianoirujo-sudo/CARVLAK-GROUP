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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full ${maxWidth} bg-[#10151E] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden transition-all`}
      >
        {/*  */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#131924]">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/*  */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

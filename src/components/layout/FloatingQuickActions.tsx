import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Calendar,
  Car,
  Users,
  Droplets,
  Share2
} from 'lucide-react';

interface FloatingQuickActionsProps {
  onNewAppointment: () => void;
  onNewVehicle: () => void;
  onNewClient: () => void;
  onNewQuote: () => void;
  onCreateSocialPost: () => void;
}

export const FloatingQuickActions: React.FC<FloatingQuickActionsProps> = ({
  onNewAppointment,
  onNewVehicle,
  onNewClient,
  onNewQuote,
  onCreateSocialPost
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al presionar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="md:hidden">
      {/* Fondo atenuado al abrir el menú */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenedor flotante */}
      <div ref={menuRef} className="fixed bottom-20 right-4 z-40 flex flex-col items-end">
        {/* Panel de Opciones */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Acciones rápidas"
            className="mb-3 w-64 bg-white rounded-xl border border-[#E5E5E3] shadow-xl p-2 space-y-1 animate-in fade-in slide-in-from-bottom-3 duration-150"
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6B6B6B] border-b border-[#E5E5E3] mb-1">
              Acciones rápidas
            </div>

            {/* 1. Nuevo turno */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onNewAppointment)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#161616] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] text-[#D7141A] flex items-center justify-center shrink-0 border border-[#F9D2D2]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[#161616]">Nuevo turno</div>
                <div className="text-[10px] text-[#6B6B6B] font-normal">Agenda unificada</div>
              </div>
            </button>

            {/* 2. Nuevo auto */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onNewVehicle)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#161616] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[#161616]">Nuevo auto</div>
                <div className="text-[10px] text-[#6B6B6B] font-normal">Stock o taller</div>
              </div>
            </button>

            {/* 3. Nuevo cliente */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onNewClient)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#161616] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[#161616]">Nuevo cliente</div>
                <div className="text-[10px] text-[#6B6B6B] font-normal">Directorio comercial</div>
              </div>
            </button>

            {/* 4. Nueva cotización */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onNewQuote)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#161616] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#161616] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
                <Droplets className="w-4 h-4 text-[#161616]" />
              </div>
              <div>
                <div className="text-[#161616]">Nueva cotización</div>
                <div className="text-[10px] text-[#6B6B6B] font-normal">Detailing Shangrilá</div>
              </div>
            </button>

            {/* 5. Crear pieza de redes */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onCreateSocialPost)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#161616] hover:bg-[#F5F5F4] active:bg-[#EBEBEA] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] text-[#D7141A] flex items-center justify-center shrink-0 border border-[#E5E5E3]">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[#161616]">Crear pieza de redes</div>
                <div className="text-[10px] text-[#6B6B6B] font-normal">Estudio creativo 1080px</div>
              </div>
            </button>
          </div>
        )}

        {/* Botón Flotante Rojo Principal */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
          aria-expanded={isOpen}
          className="w-14 h-14 rounded-full bg-[#D7141A] hover:bg-[#B80E14] active:bg-[#9E0C11] text-white shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D7141A] focus:ring-offset-2"
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-200 ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

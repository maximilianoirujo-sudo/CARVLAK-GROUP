import React, { useState } from 'react';
import { Search, ChevronDown, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onOpenQuickSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenQuickSearch }) => {
  const { profile, availableProfiles, switchProfile, logout, isDemoMode } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E3] px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Logo Oficial CARVLAK Group (Negro sobre fondo claro) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/carvlak-logo-negro.png"
              alt="CARVLAK"
              className="h-[23px] sm:h-[30px] w-auto object-contain shrink-0"
            />
            <span className="text-[12px] sm:text-[13px] font-sans font-medium text-[#6B6B6B] tracking-wide select-none">
              Group
            </span>
          </div>
          <span className="hidden lg:inline text-xs text-[#6B6B6B] border-l border-[#E5E5E3] pl-3 font-medium">
            Automotora • Detailing • Inspecciones
          </span>
        </div>

        {/* Barra de Búsqueda Rápida por Matrícula */}
        <button
          onClick={onOpenQuickSearch}
          className="flex-1 max-w-xs md:max-w-md mx-2 px-3 py-2 rounded-lg bg-[#F5F5F4] hover:bg-[#EBEBEA] border border-[#E5E5E3] hover:border-[#D0D0CD] text-[#6B6B6B] hover:text-[#161616] text-xs flex items-center justify-between transition-colors min-h-[40px]"
          title="Buscar vehículo por matrícula"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-[#6B6B6B] shrink-0" />
            <span className="truncate">Buscar por matrícula...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-[#6B6B6B] rounded border border-[#E5E5E3]">
            MATRÍCULA
          </kbd>
        </button>

        {/* Selector de Perfil / Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] hover:border-[#D0D0CD] transition-colors text-xs font-semibold text-[#161616] min-h-[40px] cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#161616] shrink-0"></span>
            <span className="max-w-[100px] sm:max-w-[130px] truncate">{profile?.full_name || 'Usuario'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>

          {/* Menú de Roles & Cerrar Sesión */}
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E5E5E3] shadow-lg p-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-[#E5E5E3] text-[11px] font-semibold text-[#6B6B6B] tracking-wider">
                Simular empleado / rol
              </div>
              <div className="py-1 space-y-1">
                {availableProfiles.map((p) => {
                  const isSelected = p.id === profile?.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#F5F5F4] text-[#161616] font-bold border border-[#E5E5E3]'
                          : 'text-[#161616] hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[#161616]">{p.full_name}</div>
                        <div className="text-[10px] text-[#6B6B6B]">
                          {p.roles.join(' • ')}
                        </div>
                      </div>
                      {p.roles.includes('admin') && (
                        <span className="text-[9px] bg-[#161616] text-white font-title font-bold px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botón Cerrar Sesión */}
              <div className="pt-2 border-t border-[#E5E5E3] mt-1">
                <button
                  onClick={() => {
                    setShowRoleSwitcher(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-semibold text-[#D7141A] hover:bg-[#D7141A]/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>

              {isDemoMode && (
                <div className="mt-1 pt-1.5 px-3 text-[10px] text-[#6B6B6B] flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#6B6B6B]" />
                  <span>Modo local activo</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

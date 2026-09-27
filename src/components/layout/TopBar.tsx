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
    <header className="sticky top-0 z-40 bg-[#000000] border-b border-[#222222] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Logo Oficial CARVLAK Group (Blanco sobre fondo negro) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-carvlak-white.png"
              alt="CARVLAK Group"
              className="h-7 sm:h-8 w-auto object-contain shrink-0"
            />
            <span className="text-[10px] font-title font-bold px-1.5 py-0.5 rounded bg-[#222222] text-[#D9D9D9] border border-[#333333] tracking-widest uppercase">
              Group
            </span>
          </div>
          <span className="hidden lg:inline text-xs text-[#6B6B6B] border-l border-[#222222] pl-3 font-medium">
            Automotora • Detailing • Inspecciones
          </span>
        </div>

        {/* Barra de Búsqueda Rápida por Matrícula */}
        <button
          onClick={onOpenQuickSearch}
          className="flex-1 max-w-xs md:max-w-md mx-2 px-3 py-2 rounded-md bg-[#111111] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#6B6B6B] text-[#AAAAAA] text-xs flex items-center justify-between transition-colors min-h-[42px]"
          title="Buscar vehículo por matrícula"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-[#FFFFFF] shrink-0" />
            <span className="truncate">Buscar por matrícula...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#222222] text-[#AAAAAA] rounded border border-[#333333]">
            MATRÍCULA
          </kbd>
        </button>

        {/* Selector de Perfil / Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#111111] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#444444] transition-colors text-xs font-semibold text-white min-h-[42px]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="max-w-[100px] sm:max-w-[130px] truncate">{profile?.full_name || 'Usuario'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>

          {/* Menú de Roles & Cerrar Sesión */}
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-[#111111] border border-[#2A2A2A] shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-[#222222] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
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
                          ? 'bg-[#222222] text-white font-bold border border-[#444444]'
                          : 'text-[#D9D9D9] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{p.full_name}</div>
                        <div className="text-[10px] text-[#888888]">
                          {p.roles.join(' • ')}
                        </div>
                      </div>
                      {p.roles.includes('admin') && (
                        <span className="text-[9px] bg-white text-black font-title font-bold px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botón Cerrar Sesión */}
              <div className="pt-2 border-t border-[#222222] mt-1">
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

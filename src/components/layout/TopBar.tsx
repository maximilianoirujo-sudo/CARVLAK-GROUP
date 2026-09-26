import React, { useState } from 'react';
import { Search, UserCheck, ShieldAlert, Wifi, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onOpenQuickSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenQuickSearch }) => {
  const { profile, availableProfiles, switchProfile, isDemoMode } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/*  */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20 shrink-0">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-widest text-base sm:text-lg text-white">CARVLAK</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                GROUP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Automotora • DetailVlak • Inspecciones</p>
          </div>
        </div>

        {/*  */}
        <button
          onClick={onOpenQuickSearch}
          className="flex-1 max-w-xs md:max-w-md mx-2 px-3.5 py-2 rounded-2xl bg-[#121721] hover:bg-[#18202E] border border-slate-800 hover:border-amber-500/40 text-slate-400 text-xs flex items-center justify-between transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">Buscar por matrícula...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            MATRÍCULA
          </kbd>
        </button>

        {/*  */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#121721] border border-slate-800 hover:border-amber-500/40 transition-all text-xs font-bold text-slate-200"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="max-w-[100px] sm:max-w-[140px] truncate">{profile?.full_name || 'Usuario'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/*  */}
          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#10151E] border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Simular Empleado / Rol
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
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-300 hover:bg-[#18202E]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                          {p.roles.join(' • ')}
                        </div>
                      </div>
                      {p.roles.includes('admin') && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isDemoMode && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 px-2 text-[10px] text-amber-400/90 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Modo Demo activo (offline-ready)</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

import React from 'react';
import {
  Home,
  Calendar,
  Car,
  Users,
  CheckSquare,
  UserCog,
  Sparkles,
  ClipboardCheck,
  Building2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isEncargado } from '../../lib/permissions';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { profile } = useAuth();
  const canManageTeam = isEncargado(profile);

  const mainTabs = [
    { id: 'inicio', label: 'Inicio / Dashboard', icon: Home },
    { id: 'agenda', label: 'Agenda Unificada', icon: Calendar },
    { id: 'vehiculos', label: 'Vehículos (Matrículas)', icon: Car },
    { id: 'clientes', label: 'Directorio de Clientes', icon: Users },
    { id: 'tareas', label: 'Tareas del Equipo', icon: CheckSquare }
  ];

  const futureModules = [
    { id: 'mod-detailing', label: 'DetailVlak Pro', phase: 'Fase 2', icon: Sparkles, color: 'text-purple-400' },
    { id: 'mod-inspeccion', label: 'Inspección & Patio', phase: 'Fase 3', icon: ClipboardCheck, color: 'text-emerald-400' },
    { id: 'mod-automotora', label: 'Automotora Multi-SaaS', phase: 'Fase 4', icon: Building2, color: 'text-amber-400' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B0E14] border-r border-slate-800/80 p-4 space-y-6 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto">
      
      {/*  */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Base Común (Fase 1)
        </div>
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {canManageTeam && (
          <button
            onClick={() => onSelectTab('empleados')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              currentTab === 'empleados'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <UserCog className="w-4 h-4 text-slate-400" />
            <span>Equipo &amp; Comisiones</span>
          </button>
        )}
      </div>

      {/*  */}
      <div className="pt-4 border-t border-slate-800/80 space-y-1">
        <div className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Próximas Fases</span>
          <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-1">
            <Lock className="w-3 h-3" /> Fases 2, 3 y 4
          </span>
        </div>

        {futureModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentTab === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => onSelectTab(mod.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${mod.color}`} />
                <span className="font-medium text-slate-300">{mod.label}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {mod.phase}
              </span>
            </button>
          );
        })}
      </div>

      {/*  */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-2xl bg-[#121721] border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            CARVLAK Group Hub
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            3 negocios conectados: Automotora, DetailVlak e Inspección.
          </p>
        </div>
      </div>

    </aside>
  );
};

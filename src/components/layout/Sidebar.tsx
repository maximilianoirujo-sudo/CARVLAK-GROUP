import React from 'react';
import {
  Home,
  Calendar,
  Car,
  Users,
  CheckSquare,
  UserCog,
  Droplets,
  ClipboardCheck,
  Building2,
  Share2
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
    { id: 'inicio', label: 'Inicio / Resumen', icon: Home },
    { id: 'agenda', label: 'Agenda unificada', icon: Calendar },
    { id: 'vehiculos', label: 'Vehículos (Matrículas)', icon: Car },
    { id: 'clientes', label: 'Directorio de clientes', icon: Users },
    { id: 'tareas', label: 'Tareas del equipo', icon: CheckSquare }
  ];

  const businessModules = [
    { id: 'mod-automotora', label: 'Automotora', subtext: 'Stock y ventas', icon: Building2 },
    { id: 'mod-detailing', label: 'Detailing', subtext: 'Taller Shangrilá', icon: Droplets },
    { id: 'mod-inspeccion', label: 'Inspección', subtext: 'Peritaje vehicular', icon: ClipboardCheck }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#000000] border-r border-[#2A2A2A] p-3 space-y-4 shrink-0 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto">
      
      {/* Base Común */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          Operación diaria
        </div>
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[42px] cursor-pointer ${
                isActive
                  ? 'bg-[#141414] text-white border-l-4 border-[#D7141A]'
                  : 'text-[#8A8A8A] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7141A]' : 'text-[#8A8A8A]'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}

        {canManageTeam && (
          <button
            onClick={() => onSelectTab('empleados')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[42px] cursor-pointer ${
              currentTab === 'empleados'
                ? 'bg-[#141414] text-white border-l-4 border-[#D7141A]'
                : 'text-[#8A8A8A] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <UserCog className={`w-4 h-4 shrink-0 ${currentTab === 'empleados' ? 'text-[#D7141A]' : 'text-[#8A8A8A]'}`} />
            <span className="truncate">Equipo y permisos</span>
          </button>
        )}
      </div>

      {/* Módulos de Negocio */}
      <div className="pt-3 border-t border-[#2A2A2A] space-y-1">
        <div className="px-3 text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          Negocios del grupo
        </div>

        {businessModules.map((m) => {
          const Icon = m.icon;
          const isActive = currentTab === m.id;

          return (
            <button
              key={m.id}
              onClick={() => onSelectTab(m.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] cursor-pointer ${
                isActive
                  ? 'bg-[#141414] text-white border-l-4 border-[#D7141A]'
                  : 'text-[#8A8A8A] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D7141A]' : 'text-[#8A8A8A]'}`} />
                <div className="text-left truncate">
                  <div className="truncate font-semibold">{m.label}</div>
                  <div className="text-[10px] text-[#8A8A8A] font-normal">{m.subtext}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Marketing & Redes Sociales */}
      <div className="pt-3 border-t border-[#2A2A2A] space-y-1">
        <div className="px-3 text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          Marketing
        </div>
        <button
          onClick={() => onSelectTab('redes-sociales')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] cursor-pointer ${
            currentTab === 'redes-sociales'
              ? 'bg-[#141414] text-white border-l-4 border-[#D7141A]'
              : 'text-[#8A8A8A] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            <Share2 className={`w-4 h-4 shrink-0 ${currentTab === 'redes-sociales' ? 'text-[#D7141A]' : 'text-[#8A8A8A]'}`} />
            <div className="text-left truncate">
              <div className="truncate font-semibold">Redes sociales</div>
              <div className="text-[10px] text-[#8A8A8A] font-normal">Historias y posts 1080px</div>
            </div>
          </div>
        </button>
      </div>

      {/* Estado del Hub */}
      <div className="mt-auto pt-3 border-t border-[#2A2A2A]">
        <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[11px] text-[#8A8A8A] space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D7141A]"></span>
            CARVLAK Group Hub
          </div>
          <p className="text-[10px] text-[#8A8A8A] leading-relaxed">
            Automotora • Detailing • Inspecciones
          </p>
        </div>
      </div>

    </aside>
  );
};

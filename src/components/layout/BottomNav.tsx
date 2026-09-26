import React from 'react';
import { Home, Calendar, Car, Users, CheckSquare } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'vehiculos', label: 'Vehículos', icon: Car },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-2xl border-t border-slate-800/90 px-2 py-2 safe-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-amber-400 bg-amber-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110 text-amber-400' : ''} transition-transform`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

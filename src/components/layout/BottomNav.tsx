import React from 'react';
import { Home, Calendar, Car, Users, CheckSquare, Sparkles, ClipboardCheck, Building2 } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'mod-automotora', label: 'Automotora', icon: Building2, color: 'text-amber-400' },
    { id: 'mod-detailing', label: 'Detailing', icon: Sparkles, color: 'text-purple-400' },
    { id: 'mod-inspeccion', label: 'Peritaje', icon: ClipboardCheck, color: 'text-emerald-400' }
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
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                isActive
                  ? tab.id === 'mod-detailing'
                    ? 'text-purple-400 bg-purple-500/15 font-bold'
                    : tab.id === 'mod-inspeccion'
                    ? 'text-emerald-400 bg-emerald-500/15 font-bold'
                    : 'text-amber-400 bg-amber-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${
                isActive
                  ? tab.id === 'mod-detailing'
                    ? 'scale-110 text-purple-400'
                    : tab.id === 'mod-inspeccion'
                    ? 'scale-110 text-emerald-400'
                    : 'scale-110 text-amber-400'
                  : ''
              } transition-transform`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';
import { Home, Calendar, Car, Droplets, ClipboardCheck } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'mod-automotora', label: 'Automotora', icon: Car },
    { id: 'mod-detailing', label: 'Detailing', icon: Droplets },
    { id: 'mod-inspeccion', label: 'Inspección', icon: ClipboardCheck }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#000000] border-t border-[#222222] px-1 py-1 safe-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md min-h-[48px] transition-colors relative ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-[#888888] hover:text-[#D9D9D9]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#D7141A] rounded-full"></span>
              )}
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#D7141A]' : 'text-[#888888]'}`} />
              <span className={`text-[10px] tracking-tight ${isActive ? 'text-white font-bold' : 'text-[#888888]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

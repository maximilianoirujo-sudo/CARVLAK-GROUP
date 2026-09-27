import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1 sm:gap-2 border-b border-[#E5E5E3] overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-[1px] ${
              isActive
                ? 'border-[#D7141A] text-[#161616]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#161616]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  isActive
                    ? 'bg-[#D7141A] text-white'
                    : 'bg-[#EBEBEA] text-[#6B6B6B]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

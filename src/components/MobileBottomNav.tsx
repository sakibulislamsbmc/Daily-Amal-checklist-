import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  Repeat, 
  Download
} from 'lucide-react';

export type MobileTab = 'checklist' | 'prayers' | 'muhasaba' | 'tasbeeh' | 'export';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  pendingLateCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingLateCount = 0,
}) => {
  const tabs = [
    { id: 'checklist' as MobileTab, labelBn: 'আমল তালিকা', icon: CheckSquare },
    { id: 'prayers' as MobileTab, labelBn: 'ওয়াক্ত ও জামাত', icon: Clock },
    { id: 'muhasaba' as MobileTab, labelBn: 'মুহাসাবা', icon: Award },
    { id: 'tasbeeh' as MobileTab, labelBn: 'তাসবীহ', icon: Repeat },
    { id: 'export' as MobileTab, labelBn: 'এক্সপোর্ট', icon: Download },
  ];

  const handleTabClick = (tabId: MobileTab) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  return (
    <div className="sticky bottom-3 z-40 px-3 w-full max-w-[430px] mx-auto pointer-events-auto">
      <nav className="rounded-full p-1.5 flex items-center justify-around border border-slate-200/80 shadow-xl bg-white/95 backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-0.5 leading-none whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.labelBn}
              </span>

              {tab.id === 'checklist' && pendingLateCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

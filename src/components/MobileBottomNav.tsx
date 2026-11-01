import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  Repeat, 
  Download,
  Calendar
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
    { id: 'muhasaba' as MobileTab, labelBn: 'মুহাসাবা স্কোর', icon: Award },
    { id: 'tasbeeh' as MobileTab, labelBn: 'তাসবীহ', icon: Repeat },
    { id: 'export' as MobileTab, labelBn: 'রিপোর্ট এক্সপোর্ট', icon: Download },
  ];

  const handleTabClick = (tabId: MobileTab) => {
    // Haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    onTabChange(tabId);
  };

  return (
    <div className="sticky bottom-4 z-40 px-3 w-full max-w-[430px] mx-auto pointer-events-auto">
      <nav className="glass-panel rounded-full p-1.5 flex items-center justify-around border border-white/10 shadow-2xl bg-[#080808]/85 backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-md shadow-emerald-950/60 scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-0.5 font-medium leading-none whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>
                {tab.labelBn}
              </span>

              {tab.id === 'checklist' && pendingLateCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

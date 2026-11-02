import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  Tv,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';

export type MobileTab = 'checklist' | 'prayers' | 'muhasaba' | 'media' | 'developer' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  pendingLateCount?: number;
  currentUser?: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingLateCount = 0,
  currentUser,
}) => {
  const tabs: {
    id: MobileTab;
    labelBn: string;
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    imageIcon?: string;
    gradientClass: string;
  }[] = [
    {
      id: 'checklist',
      labelBn: 'আমল',
      title: 'দৈনিক আমল চেকলিস্ট',
      icon: CheckSquare,
      gradientClass: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 text-white',
    },
    {
      id: 'prayers',
      labelBn: 'ওয়াক্ত',
      title: 'সালাতের ওয়াক্ত ও জামাত সময়সূচী',
      icon: Clock,
      gradientClass: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 text-white',
    },
    {
      id: 'muhasaba',
      labelBn: 'মুহাসাবা',
      title: 'মুহাসাবা ও ডিজিটাল তাসবীহ',
      icon: Award,
      gradientClass: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white',
    },
    {
      id: 'media',
      labelBn: 'মিডিয়া',
      title: 'মিডিয়া, ভিডিও আপডেট ও ফেসবুক পেজ ফিড',
      icon: Tv,
      gradientClass: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-700 text-white',
    },
    {
      id: 'developer',
      labelBn: 'ডেভেলপার',
      title: 'App Developer Information',
      imageIcon: '/favicon.png',
      gradientClass: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-800 text-white',
    },
    {
      id: 'profile',
      labelBn: 'প্রোফাইল',
      title: 'প্রোফাইল, রিপোর্ট এক্সপোর্ট ও ড্যাশবোর্ড',
      icon: UserIcon,
      imageIcon: currentUser?.photoURL || undefined,
      gradientClass: 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-700 text-white',
    },
  ];

  const handleTabClick = (tabId: MobileTab) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  return (
    <div className="sticky bottom-3 z-40 px-2 w-full max-w-[430px] mx-auto pointer-events-auto">
      <nav className="rounded-full p-1.5 flex items-center justify-between border border-slate-200/90 shadow-2xl bg-white/95 backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`group relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/35 scale-105'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100/90'
              }`}
              title={tab.title}
            >
              {/* 3D Glossy Icon Container with CC Light Sweep */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous transition-transform duration-200 group-hover:scale-110 ${
                  tab.gradientClass
                } ${isActive ? 'ring-2 ring-white shadow-md' : ''}`}
              >
                {tab.imageIcon ? (
                  <img
                    src={tab.imageIcon}
                    alt={tab.labelBn}
                    className="w-full h-full rounded-xl object-cover relative z-[3]"
                  />
                ) : (
                  Icon && (
                    <Icon className="w-4 h-4 stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] relative z-[3]" />
                  )
                )}
              </div>

              {/* Bold Bengali Label */}
              <span
                className={`text-[10px] mt-1 leading-none whitespace-nowrap tracking-tight font-anek-bangla ${
                  isActive ? 'font-black text-white drop-shadow-xs' : 'font-extrabold text-slate-800'
                }`}
              >
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

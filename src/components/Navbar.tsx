import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BarChart2, 
  Calendar as CalendarIcon, 
  Radio, 
  LogOut, 
  Flame,
  User as UserIcon,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout } from '../firebase';
import { TrafficStats } from '../types';

interface NavbarProps {
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
  currentUser: User | null;
  trafficStats: TrafficStats;
  streakCount: number;
  onOpenCalendarSync: () => void;
  onOpenStats: () => void;
  onOpenProfile: () => void;
  onOpenInstallModal: () => void;
  onOpenDeveloper: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDateStr,
  onDateChange,
  currentUser,
  trafficStats,
  streakCount,
  onOpenCalendarSync,
  onOpenStats,
  onOpenProfile,
  onOpenInstallModal,
  onOpenDeveloper,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await googleSignIn();
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 shrink-0">
      <div className="flex items-center justify-between">
        
        {/* Left: Back Arrow */}
        <button 
          onClick={() => window.history.back()}
          className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-700 transition-colors"
          title="ফিরে যান"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Title */}
        <div className="text-center">
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">
            অভ্যাস ট্র্যাকার
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold leading-none">
            Daily Amol Checklist
          </p>
        </div>

        {/* Right Actions: Analytics, Calendar, Live Traffic, Auth */}
        <div className="flex items-center gap-1.5">
          
          {/* Live Traffic Badge */}
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700"
            title="লাইভ ইউনিক ভিজিটর ট্র্যাকার"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold">
              {trafficStats.totalUniqueVisitors.toLocaleString()}
            </span>
          </div>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="পরিসংখ্যান ও মুহাসাবা স্কোর"
          >
            <BarChart2 className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Calendar Sync Button */}
          <button
            onClick={onOpenCalendarSync}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="গুগল ক্যালেন্ডার সিঙ্ক"
          >
            <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Install Mobile App Button */}
          <button
            onClick={onOpenInstallModal}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 transition-colors"
            title="মোবাইল অ্যাপ ইনস্টল করুন (PWA)"
          >
            <Smartphone className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* App Developer Information Button */}
          <button
            onClick={onOpenDeveloper}
            className="p-1 rounded-xl bg-emerald-950/10 hover:bg-emerald-100 border border-emerald-500/30 hover:border-emerald-500 transition-all flex items-center justify-center shadow-xs cc-light-swipe"
            title="App Developer Information • অ্যাপ ডেভেলপার তথ্য"
          >
            <img
              src="/favicon.png"
              alt="App Developer"
              className="w-5 h-5 rounded-lg object-contain shadow-xs"
            />
          </button>

        </div>

      </div>
    </header>
  );
};

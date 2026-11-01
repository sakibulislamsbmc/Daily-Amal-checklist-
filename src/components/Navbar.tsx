import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Radio, 
  LogOut, 
  Sparkles,
  Calendar
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDateStr,
  onDateChange,
  currentUser,
  trafficStats,
  streakCount,
  onOpenCalendarSync,
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const now = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    onDateChange(now);
  };

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

  const formattedDateBn = React.useMemo(() => {
    try {
      const parts = currentDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat('bn-BD', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return currentDateStr;
    }
  }, [currentDateStr]);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl shrink-0">
      <div className="px-4 py-3">
        
        {/* Top Status & Brand Row */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-sm shadow-md shadow-emerald-950/50">
              🌙
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                Daily Amol Checklist
              </h1>
              <p className="text-[10px] text-zinc-400 leading-none">
                দৈনিক মুহাসাবা • বাংলাদেশ সময়
              </p>
            </div>
          </div>

          {/* Right: Live Traffic & Auth */}
          <div className="flex items-center gap-2">
            
            {/* Live Traffic Badge */}
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10"
              title="লাইভ ইউনিক ভিজিটর ট্র্যাকার"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">
                {trafficStats.totalUniqueVisitors.toLocaleString()}
              </span>
            </div>

            {/* Streak */}
            {streakCount > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold"
                title="ধারাবাহিক আমল স্ট্রিক"
              >
                <span>🔥</span>
                <span>{streakCount} দিন</span>
              </div>
            )}

            {/* Google Auth Avatar or Sign-in */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full ring-1 ring-emerald-400/50 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-1 rounded-lg text-zinc-400 hover:text-red-400"
                  title="লগ আউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
              >
                লগইন
              </button>
            )}

          </div>

        </div>

        {/* Date Selector Row */}
        <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
              title="পূর্ববর্তী দিন"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-white">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formattedDateBn}</span>
              <span className="text-[10px] text-zinc-500">({currentDateStr})</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
              title="পরবর্তী দিন"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            >
              আজকে
            </button>

            {/* Google Calendar Quick Sync trigger */}
            <button
              onClick={onOpenCalendarSync}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10"
              title="গুগল ক্যালেন্ডার সিঙ্ক"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

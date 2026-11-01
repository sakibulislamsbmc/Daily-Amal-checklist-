import React, { useMemo } from 'react';
import { Award, Sparkles, TrendingUp, PenTool, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DayAmolState, AmolItem } from '../types';
import { calculateMuhasabaScore, loadDayStateLocal } from '../services/amolStorage';

interface MuhasabaScoreCardProps {
  state: DayAmolState;
  allAmols: AmolItem[];
  currentDateStr: string;
  onOpenReflection: () => void;
  onOpenTasbeeh: () => void;
}

export const MuhasabaScoreCard: React.FC<MuhasabaScoreCardProps> = ({
  state,
  allAmols,
  currentDateStr,
  onOpenReflection,
  onOpenTasbeeh,
}) => {
  const dailyScore = useMemo(() => {
    return calculateMuhasabaScore(state, allAmols);
  }, [state, allAmols]);

  // Calculate Weekly Average and Monthly Aggregate from stored day states
  const { weeklyAverage, monthlyAggregate } = useMemo(() => {
    // 7-day average
    let weekSum = 0;
    let weekDaysLogged = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentDateStr);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const s = ds === currentDateStr ? state : loadDayStateLocal(ds);
      if (s && s.completedAmolIds && s.completedAmolIds.length > 0) {
        weekDaysLogged++;
        weekSum += calculateMuhasabaScore(s, allAmols).percentage;
      }
    }
    const weeklyAvg = weekDaysLogged > 0 ? Math.round(weekSum / weekDaysLogged) : dailyScore.percentage;

    // Current Month Aggregate
    const [yearStr, monthStr] = currentDateStr.split('-');
    const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
    let monthSum = 0;
    let monthDaysLogged = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const ds = `${yearStr}-${monthStr}-${dayStr}`;
      const s = ds === currentDateStr ? state : loadDayStateLocal(ds);
      if (s && s.completedAmolIds && s.completedAmolIds.length > 0) {
        monthDaysLogged++;
        monthSum += calculateMuhasabaScore(s, allAmols).percentage;
      }
    }
    const monthDailyAvg = monthDaysLogged > 0 ? Math.round(monthSum / monthDaysLogged) : dailyScore.percentage;
    const monthlyAgg = Math.round((monthDaysLogged / daysInMonth) * monthDailyAvg) || monthDailyAvg;

    return { weeklyAverage: weeklyAvg, monthlyAggregate: monthlyAgg };
  }, [state, allAmols, currentDateStr, dailyScore.percentage]);

  // Confetti on 90%+
  const prevPercentage = React.useRef(dailyScore.percentage);
  React.useEffect(() => {
    if (dailyScore.percentage >= 90 && prevPercentage.current < 90) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#fbbf24'],
      });
    }
    prevPercentage.current = dailyScore.percentage;
  }, [dailyScore.percentage]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyScore.percentage / 100) * circumference;

  return (
    <div className="w-full glass-panel rounded-3xl p-4 bg-[#0c0c0c]/80 border border-white/10 relative overflow-hidden">
      
      {/* Top Scores Row */}
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Circular gauge */}
        <div className="flex items-center gap-3">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-white/5"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-emerald-400 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="url(#emeraldAccent)"
                fill="transparent"
              />
              <defs>
                <linearGradient id="emeraldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-white font-mono leading-none">
                {dailyScore.percentage}%
              </span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-wider mt-0.5 font-bold">
                আজকের স্কোর
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              {dailyScore.gradeArabic}
            </span>
            <h3 className="text-sm font-bold text-white leading-tight">
              {dailyScore.gradeBn}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              পয়েন্ট: <strong className="text-zinc-200">{dailyScore.earnedPoints}</strong> / {dailyScore.totalPossiblePoints}
            </p>
          </div>
        </div>

        {/* Right: 3-Metric Mini Cards */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-right">
            <span className="text-[9px] text-zinc-400 block leading-none">সাপ্তাহিক গড়</span>
            <span className="text-xs font-bold text-emerald-300 font-mono leading-tight">{weeklyAverage}%</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-right">
            <span className="text-[9px] text-zinc-400 block leading-none">মাসিক সামগ্রিক</span>
            <span className="text-xs font-bold text-teal-300 font-mono leading-tight">{monthlyAggregate}%</span>
          </div>
        </div>

      </div>

      {/* Action Row */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
        <button
          onClick={onOpenReflection}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all cc-light-swipe"
        >
          <PenTool className="w-3.5 h-3.5 text-emerald-400" />
          <span>রাতের মুহাসাবা ডায়েরি</span>
        </button>

        <button
          onClick={onOpenTasbeeh}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all cc-light-swipe"
        >
          <span>📿</span>
          <span>তাসবীহ</span>
        </button>
      </div>

    </div>
  );
};

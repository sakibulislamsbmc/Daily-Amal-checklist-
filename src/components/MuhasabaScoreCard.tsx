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

  // Weekly Average and Monthly Aggregate
  const { weeklyAverage, monthlyAggregate } = useMemo(() => {
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

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyScore.percentage / 100) * circumference;

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
      
      {/* Top Scores Row */}
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Circular gauge */}
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                className="text-slate-100"
                strokeWidth="7"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-800 font-mono leading-none">
                {dailyScore.percentage}%
              </span>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                দৈনিক
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {dailyScore.gradeArabic}
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1">
              {dailyScore.gradeBn}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              পয়েন্ট: <strong className="text-slate-700">{dailyScore.earnedPoints}</strong> / {dailyScore.totalPossiblePoints}
            </p>
          </div>
        </div>

        {/* Right: Weekly and Monthly metrics */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded-2xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[9px] text-slate-400 block font-semibold leading-none">সাপ্তাহিক গড়</span>
            <span className="text-xs font-black text-emerald-600 font-mono leading-tight">{weeklyAverage}%</span>
          </div>
          <div className="px-2.5 py-1 rounded-2xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[9px] text-slate-400 block font-semibold leading-none">মাসিক সামগ্রিক</span>
            <span className="text-xs font-black text-teal-600 font-mono leading-tight">{monthlyAggregate}%</span>
          </div>
        </div>

      </div>

      {/* Action Row */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onOpenReflection}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all"
        >
          <PenTool className="w-3.5 h-3.5 text-emerald-600" />
          <span>রাতের মুহাসাবা ডায়েরি</span>
        </button>

        <button
          onClick={onOpenTasbeeh}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 transition-all"
        >
          <span>📿</span>
          <span>তাসবীহ</span>
        </button>
      </div>

    </div>
  );
};

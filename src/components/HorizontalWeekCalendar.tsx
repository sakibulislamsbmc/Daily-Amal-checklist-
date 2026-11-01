import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateInBD } from '../services/prayerTimes';

interface HorizontalWeekCalendarProps {
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
  streakCount: number;
}

export const HorizontalWeekCalendar: React.FC<HorizontalWeekCalendarProps> = ({
  currentDateStr,
  onDateChange,
  streakCount,
}) => {
  const todayInBD = useMemo(() => getTodayDateInBD(), []);

  // Parse selected date
  const selectedDate = useMemo(() => {
    const parts = currentDateStr.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }, [currentDateStr]);

  // Compute 7 days of the current week (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const dayOfWeek = selectedDate.getDay(); // 0 is Sunday
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = d.toISOString().split('T')[0];

      const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNamesBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

      const isFuture = ds > todayInBD;
      const isToday = ds === todayInBD;

      days.push({
        dateStr: ds,
        dayNum: d.getDate(),
        dayNameShort: dayNamesShort[i],
        dayNameBn: dayNamesBn[i],
        isToday,
        isFuture,
        isSelected: ds === currentDateStr,
      });
    }
    return days;
  }, [selectedDate, currentDateStr, todayInBD]);

  const monthYearDisplay = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(selectedDate);
  }, [selectedDate]);

  const goToPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
      
      {/* Month & Streak Top Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPrevWeek}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="পূর্ববর্তী সপ্তাহ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            {monthYearDisplay}
          </h3>
          <button
            onClick={goToNextWeek}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="পরবর্তী সপ্তাহ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
          {streakCount > 0 ? (
            <span className="text-amber-600 flex items-center gap-1">
              <span>🔥</span>
              <span>{streakCount} দিন স্ট্রিক</span>
            </span>
          ) : (
            <span>কোনো স্ট্রিক নেই</span>
          )}
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((item) => {
          return (
            <button
              key={item.dateStr}
              onClick={() => onDateChange(item.dateStr)}
              className="flex flex-col items-center justify-center py-1 transition-all group"
            >
              <span
                className={`text-[11px] font-medium mb-1.5 ${
                  item.isSelected ? 'text-emerald-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {item.dayNameShort}
              </span>

              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  item.isSelected
                    ? 'border-2 border-emerald-500 text-emerald-600 bg-emerald-50 shadow-sm'
                    : item.isToday
                    ? 'border border-emerald-300 text-emerald-800 bg-emerald-50/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.dayNum}
                {item.isToday && (
                  <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${item.isSelected ? 'bg-emerald-600' : 'bg-emerald-500'}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};

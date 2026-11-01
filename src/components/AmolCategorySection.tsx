import React, { useState } from 'react';
import { 
  Check, 
  Info, 
  Calendar, 
  Plus, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { AmolItem, AmolCategory, DayAmolState, PrayerSchedule } from '../types';
import { CATEGORY_LABELS } from '../data/defaultAmols';
import { checkAmolTimeWindow } from '../services/prayerTimes';

interface AmolCategorySectionProps {
  category: AmolCategory;
  items: AmolItem[];
  dayState: DayAmolState;
  schedule: PrayerSchedule;
  currentDateStr: string;
  onAttemptToggleAmol: (item: AmolItem) => void;
  onToggleSubTask: (subId: string, parentAmolId: string) => void;
  onSyncSingleToCalendar?: (item: AmolItem) => void;
  onOpenCustomAmolModal?: () => void;
}

export const AmolCategorySection: React.FC<AmolCategorySectionProps> = ({
  category,
  items,
  dayState,
  schedule,
  currentDateStr,
  onAttemptToggleAmol,
  onToggleSubTask,
  onSyncSingleToCalendar,
  onOpenCustomAmolModal,
}) => {
  const [expandedInfoIds, setExpandedInfoIds] = useState<Record<string, boolean>>({});
  const meta = CATEGORY_LABELS[category];

  const toggleInfo = (id: string) => {
    setExpandedInfoIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = items.filter((item) => dayState.completedAmolIds.includes(item.id)).length;
  const isAllComplete = items.length > 0 && completedCount === items.length;

  return (
    <div className="w-full glass-panel rounded-3xl p-4 bg-[#0a0a0a]/90 border border-white/10 transition-all duration-300">
      
      {/* Category Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm">
            {category === 'fard_salah' && '🕌'}
            {category === 'sunnah_nafl' && '🌙'}
            {category === 'quran' && '📖'}
            {category === 'adhkar' && '📿'}
            {category === 'muhasaba_akhlaq' && '🛡️'}
            {category === 'custom' && '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white tracking-wide">
                {meta.bn}
              </h2>
              {isAllComplete && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                  সম্পূর্ণ
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400">{meta.en}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300">
            {completedCount}/{items.length}
          </span>

          {category === 'custom' && onOpenCustomAmolModal && (
            <button
              onClick={onOpenCustomAmolModal}
              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const isCompleted = dayState.completedAmolIds.includes(item.id);
          const isInfoOpen = !!expandedInfoIds[item.id];
          const remark = dayState.amolRemarks?.[item.id];
          const timeGateStatus = checkAmolTimeWindow(item, schedule, currentDateStr);

          return (
            <div
              key={item.id}
              className={`rounded-2xl transition-all duration-200 border p-3 ${
                isCompleted
                  ? 'bg-emerald-950/25 border-emerald-500/30 shadow-sm'
                  : 'bg-white/5 hover:bg-white/[0.07] border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                
                {/* Main Checkbox & Title */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => onAttemptToggleAmol(item)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-black shadow-md shadow-emerald-950/60 scale-105'
                        : 'border border-white/20 hover:border-emerald-400/80 bg-black/40'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onAttemptToggleAmol(item)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs font-semibold leading-tight transition-all ${
                          isCompleted ? 'text-zinc-400 line-through' : 'text-white'
                        }`}
                      >
                        {item.titleBn}
                      </h4>

                      {/* Late badge if completed late with reason */}
                      {remark && remark.wasLate && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                          বিলম্বিত
                        </span>
                      )}

                      {/* Time Window Indicator */}
                      {item.timeWindow && item.timeWindow.startWaqt !== 'all_day' && !isCompleted && (
                        <span 
                          className={`text-[9px] px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                            timeGateStatus.wasLate
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : timeGateStatus.isWithinWindow
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-zinc-400 border border-white/5'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {timeGateStatus.wasLate ? 'ওয়াক্ত অতিক্রান্ত' : timeGateStatus.isWithinWindow ? 'ওয়াক্ত চলছে' : 'আসন্ন ওয়াক্ত'}
                          </span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {item.descriptionBn}
                    </p>

                    {/* Display recorded late reason if exists */}
                    {remark && remark.reason && (
                      <p className="text-[10px] text-amber-300/90 mt-1 italic">
                        📝 বিলম্বে আদায়ের কারণ: {remark.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right controls: Info & Calendar */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.hadithOrVirtue && (
                    <button
                      onClick={() => toggleInfo(item.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        isInfoOpen ? 'bg-white/10 text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="ফযীলত ও হাদীস"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {item.calendarSyncDefault && onSyncSingleToCalendar && (
                    <button
                      onClick={() => onSyncSingleToCalendar(item)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-emerald-300 transition-colors"
                      title="ক্যালেন্ডারে যোগ"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Sub-tasks if any (e.g. জামাত, তাকবীরে উলা) */}
              {item.subTasks && item.subTasks.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5 pl-8 flex flex-wrap gap-1.5">
                  {item.subTasks.map((sub) => {
                    const isSubDone = dayState.subTaskCompletedIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onToggleSubTask(sub.id, item.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          isSubDone
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                            : 'bg-black/30 hover:bg-white/5 border border-white/5 text-zinc-400'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded flex items-center justify-center ${
                            isSubDone ? 'bg-emerald-400 text-black' : 'border border-zinc-600'
                          }`}
                        >
                          {isSubDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{sub.titleBn}</span>
                        <span className="text-[9px] text-zinc-500">+{sub.points}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Collapsible Hadith note */}
              {isInfoOpen && item.hadithOrVirtue && (
                <div className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-zinc-300 leading-relaxed italic animate-in fade-in duration-150">
                  <span className="font-semibold text-emerald-300 not-italic">হাদীস বাণী: </span>
                  {item.hadithOrVirtue}
                </div>
              )}

            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-4 text-zinc-500 text-xs">
            এই ক্যাটাগরিতে এখনও কোনো আমল নেই।
          </div>
        )}
      </div>

    </div>
  );
};

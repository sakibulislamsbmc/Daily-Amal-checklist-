import React, { useState } from 'react';
import { 
  Check, 
  Info, 
  Calendar, 
  Plus, 
  Clock, 
  ChevronDown, 
  ChevronUp 
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedInfoIds, setExpandedInfoIds] = useState<Record<string, boolean>>({});
  const meta = CATEGORY_LABELS[category];

  const toggleInfo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInfoIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = items.filter((item) => dayState.completedAmolIds.includes(item.id)).length;

  const getPastelClass = (theme?: string) => {
    switch (theme) {
      case 'cyan':
        return 'card-pastel-cyan';
      case 'green':
        return 'card-pastel-green';
      case 'peach':
        return 'card-pastel-peach';
      case 'pink':
        return 'card-pastel-pink';
      case 'purple':
        return 'card-pastel-purple';
      case 'yellow':
        return 'card-pastel-yellow';
      default:
        return 'card-pastel-cyan';
    }
  };

  const getCategoryEmoji = (cat: AmolCategory) => {
    switch (cat) {
      case 'fard_salah':
      case 'sunnah_nafl':
        return '🌙';
      case 'core_24':
        return '✨';
      case 'optional':
        return '⭐';
      case 'adhkar':
        return '📿';
      case 'quran':
        return '📖';
      case 'muhasaba_akhlaq':
        return '🤝';
      case 'family_relationships':
        return '👥';
      case 'custom':
        return '📝';
      default:
        return '✨';
    }
  };

  return (
    <div className="w-full space-y-2.5">
      
      {/* Category Header Row */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between py-1 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCategoryEmoji(category)}</span>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            {meta.bn}
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            ({completedCount}/{items.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {category === 'custom' && onOpenCustomAmolModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCustomAmolModal();
              }}
              className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>যোগ</span>
            </button>
          )}

          <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Amol Items List (Collapsible) */}
      {!isCollapsed && (
        <div className="space-y-2.5">
          {items.map((item) => {
            const isCompleted = dayState.completedAmolIds.includes(item.id);
            const isInfoOpen = !!expandedInfoIds[item.id];
            const remark = dayState.amolRemarks?.[item.id];
            const timeGateStatus = checkAmolTimeWindow(item, schedule, currentDateStr);
            const pastelBg = getPastelClass(item.pastelTheme);

            return (
              <div
                key={item.id}
                className={`w-full rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all shadow-sm ${pastelBg} relative overflow-hidden`}
              >
                <div 
                  onClick={() => onAttemptToggleAmol(item)}
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  
                  {/* Left: Icon Pill + Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-base shrink-0 border border-white">
                      {item.iconEmoji || '✨'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-sm font-bold tracking-tight transition-all leading-tight ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {item.titleBn}
                        </h4>

                        {/* Late indicator badge */}
                        {remark && remark.wasLate && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                            বিলম্বিত
                          </span>
                        )}

                        {/* Time window status tag */}
                        {item.timeWindow && item.timeWindow.startWaqt !== 'all_day' && !isCompleted && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 font-medium ${
                              timeGateStatus.wasLate
                                ? 'bg-amber-100 text-amber-800'
                                : timeGateStatus.isWithinWindow
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{timeGateStatus.wasLate ? 'ওয়াক্ত অতিক্রান্ত' : 'ওয়াক্ত চলছে'}</span>
                          </span>
                        )}
                      </div>

                      {/* Late reason if recorded */}
                      {remark && remark.reason && (
                        <p className="text-[10px] text-amber-900/80 mt-0.5 truncate italic font-medium">
                          কারণ: {remark.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Big Clean Checkbox Circle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.hadithOrVirtue && (
                      <button
                        onClick={(e) => toggleInfo(item.id, e)}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        title="ফযীলত ও দলীল"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}

                    {item.calendarSyncDefault && onSyncSingleToCalendar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSyncSingleToCalendar(item);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-emerald-600 transition-colors"
                        title="গুগল ক্যালেন্ডারে যোগ"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300'
                          : 'border-2 border-slate-400 hover:border-emerald-500 bg-white/70'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                </div>

                {/* Sub-tasks (e.g. জামাতে সালাত, তাকবীরে উলা) */}
                {item.subTasks && item.subTasks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-black/5 pl-12 flex flex-wrap gap-1.5">
                    {item.subTasks.map((sub) => {
                      const isSubDone = dayState.subTaskCompletedIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onToggleSubTask(sub.id, item.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                            isSubDone
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/60'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                              isSubDone ? 'bg-white text-emerald-700' : 'border border-slate-400'
                            }`}
                          >
                            {isSubDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>{sub.titleBn}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Hadith / Virtue Drawer */}
                {isInfoOpen && item.hadithOrVirtue && (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-white/90 text-xs text-slate-700 leading-relaxed border border-white shadow-sm">
                    <p className="font-bold text-slate-900 mb-0.5">দলীল ও ফযীলত:</p>
                    <p className="italic">{item.hadithOrVirtue}</p>
                  </div>
                )}

              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs">
              এই ক্যাটাগরিতে এখনও কোনো আমল নেই।
            </div>
          )}
        </div>
      )}

    </div>
  );
};

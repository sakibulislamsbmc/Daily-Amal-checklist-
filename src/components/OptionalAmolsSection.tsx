import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Settings2, Check, Clock, Info } from 'lucide-react';
import { AmolItem, DayAmolState, PrayerSchedule } from '../types';
import { OPTIONAL_AMOLS } from '../data/defaultAmols';
import { checkAmolTimeWindow } from '../services/prayerTimes';

interface OptionalAmolsSectionProps {
  enabledOptionalIds: string[];
  dayState: DayAmolState;
  schedule: PrayerSchedule;
  currentDateStr: string;
  onAttemptToggleAmol: (item: AmolItem) => void;
  onOpenManageModal: () => void;
}

export const OptionalAmolsSection: React.FC<OptionalAmolsSectionProps> = ({
  enabledOptionalIds,
  dayState,
  schedule,
  currentDateStr,
  onAttemptToggleAmol,
  onOpenManageModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedInfoIds, setExpandedInfoIds] = useState<Record<string, boolean>>({});

  const activeOptionalAmols = OPTIONAL_AMOLS.filter((item) =>
    enabledOptionalIds.includes(item.id)
  );

  const completedCount = activeOptionalAmols.filter((item) =>
    dayState.completedAmolIds.includes(item.id)
  ).length;

  const toggleInfo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInfoIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        return 'card-pastel-yellow';
    }
  };

  return (
    <div className="w-full space-y-2.5 pt-2 border-t border-slate-200/60">
      
      {/* Category Header Row */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between py-1 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            ঐচ্ছিক আমলসমূহ
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            ({completedCount}/{activeOptionalAmols.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenManageModal();
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 flex items-center gap-1 transition-all"
            title="ঐচ্ছিক আমল পছন্দসমূহ পরিবর্তন করুন"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>পছন্দসমূহ ({enabledOptionalIds.length})</span>
          </button>

          <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Amols List */}
      {!isCollapsed && (
        <div className="space-y-2.5">
          {activeOptionalAmols.length === 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/80 text-center space-y-2">
              <p className="text-xs text-amber-900 font-medium">
                কোনো ঐচ্ছিক আমল এখনও সক্রিয় করা হয়নি।
              </p>
              <button
                onClick={onOpenManageModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                + ঐচ্ছিক আমল যুক্ত করুন
              </button>
            </div>
          ) : (
            activeOptionalAmols.map((item) => {
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
                    
                    {/* Left Icon + Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-base shrink-0 border border-white">
                        {item.iconEmoji || '⭐'}
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

                          {remark && remark.wasLate && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-semibold">
                              বিলম্বিত
                            </span>
                          )}

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

                        {remark && remark.reason && (
                          <p className="text-[10px] text-amber-900/80 mt-0.5 truncate italic font-medium">
                            কারণ: {remark.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Checkbox Circle */}
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

                  {/* Hadith / Virtue Drawer */}
                  {isInfoOpen && item.hadithOrVirtue && (
                    <div className="mt-2.5 p-2.5 rounded-2xl bg-white/90 text-xs text-slate-700 leading-relaxed border border-white shadow-sm">
                      <p className="font-bold text-slate-900 mb-0.5">দলীল ও ফযীলত:</p>
                      <p className="italic">{item.hadithOrVirtue}</p>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};

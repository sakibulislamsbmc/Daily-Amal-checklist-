/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  testConnection, 
  googleSignIn,
  getAccessToken 
} from './firebase';
import { 
  DEFAULT_AMOLS, 
  CATEGORY_LABELS 
} from './data/defaultAmols';
import { 
  AmolItem, 
  AmolCategory, 
  DayAmolState, 
  TrafficStats 
} from './types';
import { 
  getTodayDateInBD, 
  calculateBDPrayerTimes,
  checkAmolTimeWindow 
} from './services/prayerTimes';
import { 
  trackUniqueVisitor, 
  subscribeToLiveTraffic 
} from './services/traffic';
import { 
  loadDayStateLocal, 
  syncDayState, 
  subscribeToUserDayAmol, 
  loadCustomAmols, 
  saveCustomAmol 
} from './services/amolStorage';
import { createCalendarEvent } from './services/calendar';

import { Navbar } from './components/Navbar';
import { PrayerTimeBanner } from './components/PrayerTimeBanner';
import { MuhasabaScoreCard } from './components/MuhasabaScoreCard';
import { AmolCategorySection } from './components/AmolCategorySection';
import { DigitalTasbeehModal } from './components/DigitalTasbeehModal';
import { GoogleCalendarSyncModal } from './components/GoogleCalendarSyncModal';
import { MuhasabaReflectionModal } from './components/MuhasabaReflectionModal';
import { CustomAmolModal } from './components/CustomAmolModal';
import { LateSubmissionModal } from './components/LateSubmissionModal';
import { ExportModal } from './components/ExportModal';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';

import { 
  Filter, 
  Plus, 
  Calendar as CalendarIcon, 
  RotateCcw,
  Sparkles,
  Download,
  Clock,
  CheckSquare
} from 'lucide-react';

export default function App() {
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getTodayDateInBD());
  const [selectedDistrict, setSelectedDistrict] = useState<string>('dhaka');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active Mobile View Tab
  const [activeTab, setActiveTab] = useState<MobileTab>('checklist');

  // Traffic & Visitor counter
  const [trafficStats, setTrafficStats] = useState<TrafficStats>({
    totalUniqueVisitors: 1,
    isLive: true,
  });

  // Amol items & active day state
  const [customAmols, setCustomAmols] = useState<AmolItem[]>(() => loadCustomAmols());
  const [dayState, setDayState] = useState<DayAmolState>(() => loadDayStateLocal(currentDateStr));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AmolCategory | 'all'>('all');

  // Modals
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isCustomAmolOpen, setIsCustomAmolOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Time-gated late submission flow
  const [lateModalItem, setLateModalItem] = useState<{ item: AmolItem; explanation: string } | null>(null);

  // All Amols combined
  const allAmols = useMemo(() => {
    return [...DEFAULT_AMOLS, ...customAmols];
  }, [customAmols]);

  // Hanafi Bangladesh Prayer Times Schedule
  const prayerSchedule = useMemo(() => {
    const parts = currentDateStr.split('-');
    const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return calculateBDPrayerTimes(targetDate, selectedDistrict);
  }, [currentDateStr, selectedDistrict]);

  // Bootstrapping
  useEffect(() => {
    testConnection();
    trackUniqueVisitor();

    const unsubTraffic = subscribeToLiveTraffic((stats) => {
      setTrafficStats(stats);
    });

    const unsubAuth = initAuth((user) => {
      setCurrentUser(user);
    }, () => {
      setCurrentUser(null);
    });

    return () => {
      unsubTraffic();
      unsubAuth();
    };
  }, []);

  // Sync state on date or user change
  useEffect(() => {
    const local = loadDayStateLocal(currentDateStr);
    setDayState(local);

    if (currentUser) {
      const unsubAmol = subscribeToUserDayAmol(currentUser.uid, currentDateStr, (remoteState) => {
        setDayState(remoteState);
      });
      return () => unsubAmol();
    }
  }, [currentDateStr, currentUser]);

  // Streak calculation
  const streakCount = useMemo(() => {
    let streak = 0;
    if (dayState.completedAmolIds.length > 0) {
      streak += 1;
    }
    for (let i = 1; i <= 14; i++) {
      const pastDate = getTodayDateInBD(-i);
      const past = loadDayStateLocal(pastDate);
      if (past && past.completedAmolIds && past.completedAmolIds.length > 0) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [dayState, currentDateStr]);

  // Attempt to Toggle Amol with Time-Gating Check
  const handleAttemptToggleAmol = (item: AmolItem) => {
    const isAlreadyDone = dayState.completedAmolIds.includes(item.id);

    // If unchecking, simply remove without modal
    if (isAlreadyDone) {
      setDayState((prev) => {
        const newCompleted = prev.completedAmolIds.filter((id) => id !== item.id);
        const newRemarks = { ...(prev.amolRemarks || {}) };
        delete newRemarks[item.id];

        const updatedState: DayAmolState = {
          ...prev,
          completedAmolIds: newCompleted,
          amolRemarks: newRemarks,
          updatedAt: new Date().toISOString(),
        };

        syncDayState(currentUser ? currentUser.uid : null, updatedState, allAmols);
        return updatedState;
      });
      return;
    }

    // Checking off: verify time gating window
    const timeGate = checkAmolTimeWindow(item, prayerSchedule, currentDateStr);

    if (timeGate.wasLate) {
      // Trigger Late-Filing Reason Modal
      setLateModalItem({
        item,
        explanation: timeGate.windowExplanationBn,
      });
    } else {
      // On-time checkoff
      applyAmolCheck(item.id, '', false);
    }
  };

  // Finalize amol checkoff
  const applyAmolCheck = (amolId: string, lateReason: string = '', wasLate: boolean = false) => {
    setDayState((prev) => {
      const newCompleted = [...prev.completedAmolIds, amolId];
      const newRemarks = {
        ...(prev.amolRemarks || {}),
        [amolId]: {
          timestamp: new Date().toISOString(),
          reason: lateReason,
          wasLate,
        },
      };

      const updatedState: DayAmolState = {
        ...prev,
        completedAmolIds: newCompleted,
        amolRemarks: newRemarks,
        updatedAt: new Date().toISOString(),
      };

      syncDayState(currentUser ? currentUser.uid : null, updatedState, allAmols);
      return updatedState;
    });
  };

  // Toggle Sub-Task
  const handleToggleSubTask = (subId: string, parentAmolId: string) => {
    setDayState((prev) => {
      const isDone = prev.subTaskCompletedIds.includes(subId);
      const newSubTasks = isDone
        ? prev.subTaskCompletedIds.filter((id) => id !== subId)
        : [...prev.subTaskCompletedIds, subId];

      let newCompleted = prev.completedAmolIds;
      if (!isDone && !newCompleted.includes(parentAmolId)) {
        newCompleted = [...newCompleted, parentAmolId];
      }

      const updatedState: DayAmolState = {
        ...prev,
        completedAmolIds: newCompleted,
        subTaskCompletedIds: newSubTasks,
        updatedAt: new Date().toISOString(),
      };

      syncDayState(currentUser ? currentUser.uid : null, updatedState, allAmols);
      return updatedState;
    });
  };

  const handleUpdateTasbeehCounts = (counts: Record<string, number>) => {
    setDayState((prev) => {
      const updatedState: DayAmolState = {
        ...prev,
        tasbeehCounts: counts,
        updatedAt: new Date().toISOString(),
      };
      syncDayState(currentUser ? currentUser.uid : null, updatedState, allAmols);
      return updatedState;
    });
  };

  const handleSaveReflection = (note: string, feeling: DayAmolState['spiritualFeeling']) => {
    setDayState((prev) => {
      const updatedState: DayAmolState = {
        ...prev,
        reflectionNote: note,
        spiritualFeeling: feeling,
        updatedAt: new Date().toISOString(),
      };
      syncDayState(currentUser ? currentUser.uid : null, updatedState, allAmols);
      return updatedState;
    });
  };

  const handleAddCustomAmol = (newAmol: AmolItem) => {
    const updated = saveCustomAmol(newAmol);
    setCustomAmols(updated);
  };

  const handleSyncSingleToCalendar = async (item: AmolItem) => {
    if (!item.calendarSyncDefault) return;

    if (!currentUser) {
      alert('গুগল ক্যালেন্ডারে সিঙ্ক করতে অনুগ্রহ করে প্রথমে সাইন ইন করুন।');
      try {
        await googleSignIn();
      } catch {
        return;
      }
    }

    const time = item.calendarSyncDefault.suggestedTime;
    const confirmMsg = `আপনি কি "${item.titleBn}" আমলটি আজকের বাংলাদেশ সময় ${time}-এ আপনার গুগল ক্যালেন্ডারে যুক্ত করতে চান?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const [h, m] = time.split(':').map(Number);
      const startIso = `${currentDateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+06:00`;
      const endTotal = h * 60 + m + item.calendarSyncDefault.durationMinutes;
      const endH = Math.floor(endTotal / 60) % 24;
      const endM = endTotal % 60;
      const endIso = `${currentDateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00+06:00`;

      await createCalendarEvent({
        summary: item.titleBn,
        description: `${item.descriptionBn}\n\n[Daily Amol Checklist]`,
        startDateTime: startIso,
        endDateTime: endIso,
        colorId: item.calendarSyncDefault.colorId,
      });

      alert(`আলহামদুলিল্লাহ! "${item.titleBn}" গুগল ক্যালেন্ডারে সফলভাবে যুক্ত হয়েছে।`);
    } catch (err: any) {
      alert(`ক্যালেন্ডার সিঙ্ক ব্যর্থ: ${err.message || 'Error'}`);
    }
  };

  const categoriesToRender: AmolCategory[] = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return ['fard_salah', 'sunnah_nafl', 'quran', 'adhkar', 'muhasaba_akhlaq', 'custom'];
    }
    return [activeCategoryFilter];
  }, [activeCategoryFilter]);

  // Tab switching routing
  const handleTabChange = (tab: MobileTab) => {
    if (tab === 'tasbeeh') {
      setIsTasbeehOpen(true);
      return;
    }
    if (tab === 'export') {
      setIsExportOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex justify-center items-center sm:py-6 selection:bg-emerald-500 selection:text-black font-['Hind_Siliguri']">
      
      {/* Constrained Ultra-Modern Mobile Device Container (430px / max-w-md) */}
      <div className="mobile-device-shell flex flex-col no-scrollbar">
        
        {/* Mobile Camera Notch / Dynamic Island Simulator */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 shrink-0 z-50">
          <div className="w-24 h-4 rounded-full bg-black border border-white/10 flex items-center justify-end px-3 gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-[#151515] border border-white/15"></span>
          </div>
        </div>

        {/* Apple Glassmorphic Navbar */}
        <Navbar
          currentDateStr={currentDateStr}
          onDateChange={setCurrentDateStr}
          currentUser={currentUser}
          trafficStats={trafficStats}
          streakCount={streakCount}
          onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 px-3.5 py-4 space-y-4 pb-24 overflow-y-auto no-scrollbar">
          
          {/* TAB 1: CHECKLIST VIEW */}
          {activeTab === 'checklist' && (
            <>
              {/* Compact Hanafi Prayer Banner */}
              <PrayerTimeBanner
                schedule={prayerSchedule}
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
              />

              {/* Muhasaba Score Card with 3 Metrics */}
              <MuhasabaScoreCard
                state={dayState}
                allAmols={allAmols}
                currentDateStr={currentDateStr}
                onOpenReflection={() => setIsReflectionOpen(true)}
                onOpenTasbeeh={() => setIsTasbeehOpen(true)}
              />

              {/* Category Filter Chips */}
              <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCategoryFilter === 'all'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold shadow-md'
                        : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    সব ({allAmols.length})
                  </button>

                  {(['fard_salah', 'sunnah_nafl', 'quran', 'adhkar', 'muhasaba_akhlaq', 'custom'] as AmolCategory[]).map((cat) => {
                    const label = CATEGORY_LABELS[cat];
                    const count = allAmols.filter((x) => x.category === cat).length;
                    const isActive = activeCategoryFilter === cat;

                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold shadow-md'
                            : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>{label.bn.split(' ')[0]}</span>
                        <span className="ml-1 text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setIsCustomAmolOpen(true)}
                  className="p-1.5 rounded-xl bg-white/5 text-emerald-400 border border-white/10 shrink-0"
                  title="নতুন আমল যোগ করুন"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Amol Sections with Time Gating */}
              <div className="space-y-4">
                {categoriesToRender.map((cat) => {
                  const items = allAmols.filter((a) => a.category === cat);
                  if (items.length === 0 && cat !== 'custom') return null;

                  return (
                    <AmolCategorySection
                      key={cat}
                      category={cat}
                      items={items}
                      dayState={dayState}
                      schedule={prayerSchedule}
                      currentDateStr={currentDateStr}
                      onAttemptToggleAmol={handleAttemptToggleAmol}
                      onToggleSubTask={handleToggleSubTask}
                      onSyncSingleToCalendar={handleSyncSingleToCalendar}
                      onOpenCustomAmolModal={() => setIsCustomAmolOpen(true)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: PRAYERS & SPLIT JAMAT VIEW */}
          {activeTab === 'prayers' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center pt-2 pb-1">
                <h2 className="text-base font-extrabold text-white">ওয়াক্ত ও জামাত সময়সূচী</h2>
                <p className="text-xs text-zinc-400 mt-0.5">বাংলাদেশ সময় (Asia/Dhaka) • হানাফী আসর পদ্ধতি</p>
              </div>

              <PrayerTimeBanner
                schedule={prayerSchedule}
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
              />

              <div className="p-4 rounded-3xl glass-panel bg-white/5 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  হানাফী আসর ও জামাত বিধান
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  ইমামে আযম আবু হানিফা (রহ.) এর সিদ্ধান্ত অনুযায়ী বস্তুর ছায়া দ্বিগুণ (২ গুণ) হলে আসরের ওয়াক্ত শুরু হয়। বাংলাদেশে প্রচলিত সকল মসজিদে এই ওয়াক্ত ও জামাত কঠোরভাবে অনুসরণ করা হয়।
                </p>
                <button
                  onClick={() => setIsCalendarSyncOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs shadow-md cc-light-swipe"
                >
                  গুগল ক্যালেন্ডারে সব ওয়াক্ত সিঙ্ক করুন
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MUHASABA DASHBOARD */}
          {activeTab === 'muhasaba' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center pt-2 pb-1">
                <h2 className="text-base font-extrabold text-white">দৈনিক ও মাসিক মুহাসাবা</h2>
                <p className="text-xs text-zinc-400 mt-0.5">১০০ পয়েন্ট ভিত্তিক আত্মশুদ্ধি ও ধারাবাহিকতা পরিমাপ</p>
              </div>

              <MuhasabaScoreCard
                state={dayState}
                allAmols={allAmols}
                currentDateStr={currentDateStr}
                onOpenReflection={() => setIsReflectionOpen(true)}
                onOpenTasbeeh={() => setIsTasbeehOpen(true)}
              />

              <div className="p-4 rounded-3xl glass-panel bg-[#0c0c0c] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">মাসিক রিপোর্ট ও বিশ্লেষণ</h3>
                  <button
                    onClick={() => setIsExportOpen(true)}
                    className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>এক্সপোর্ট সেন্টার</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  আপনার মাসিক রিপোর্ট Word (.docx), Excel (.xlsx), এবং হাই-রেজোলিউশন ইমেজ (.jpg) ফরম্যাটে ডাউনলোড করে সংরক্ষণ ও পর্যালোচনা করুন।
                </p>
              </div>
            </div>
          )}

          {/* Hadith Quote */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-zinc-400 italic">
            “তোমাদের হিসাব নেওয়ার পূর্বে তোমরা নিজেদের হিসাব নাও...” — হযরত উমর (রা.)
          </div>

        </div>

        {/* Floating iOS-Style Glassmorphic Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingLateCount={0}
        />

        {/* Modals */}
        <DigitalTasbeehModal
          isOpen={isTasbeehOpen}
          onClose={() => setIsTasbeehOpen(false)}
          tasbeehCounts={dayState.tasbeehCounts}
          onUpdateCounts={handleUpdateTasbeehCounts}
        />

        <GoogleCalendarSyncModal
          isOpen={isCalendarSyncOpen}
          onClose={() => setIsCalendarSyncOpen(false)}
          dateStr={currentDateStr}
          schedule={prayerSchedule}
          currentUser={currentUser}
        />

        <MuhasabaReflectionModal
          isOpen={isReflectionOpen}
          onClose={() => setIsReflectionOpen(false)}
          dayState={dayState}
          onSaveReflection={handleSaveReflection}
        />

        <CustomAmolModal
          isOpen={isCustomAmolOpen}
          onClose={() => setIsCustomAmolOpen(false)}
          onAddAmol={handleAddCustomAmol}
        />

        <LateSubmissionModal
          isOpen={lateModalItem !== null}
          onClose={() => setLateModalItem(null)}
          amolItem={lateModalItem?.item || null}
          windowExplanation={lateModalItem?.explanation || ''}
          onConfirmLateSubmission={(reason) => {
            if (lateModalItem) {
              applyAmolCheck(lateModalItem.item.id, reason, true);
              setLateModalItem(null);
            }
          }}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          currentDateStr={currentDateStr}
        />

      </div>

    </div>
  );
}

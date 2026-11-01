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
  PRAYER_AMOLS, 
  CORE_24_AMOLS, 
  OPTIONAL_AMOLS, 
  CATEGORY_LABELS 
} from './data/defaultAmols';
import { 
  AmolItem, 
  AmolCategory, 
  DayAmolState, 
  TrafficStats,
  UserProfileData 
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
  saveCustomAmol,
  subscribeToUserCustomAmols,
  fetchUserAmolHistory
} from './services/amolStorage';
import { 
  getLocalUserProfile, 
  loadEnabledOptionalIds, 
  saveEnabledOptionalIds, 
  subscribeToUserProfile,
  saveUserProfile 
} from './services/userService';
import { createCalendarEvent } from './services/calendar';

import { Navbar } from './components/Navbar';
import { HorizontalWeekCalendar } from './components/HorizontalWeekCalendar';
import { ReferenceProgressCard } from './components/ReferenceProgressCard';
import { NotificationToggleBar } from './components/NotificationToggleBar';
import { PrayerTimeBanner } from './components/PrayerTimeBanner';
import { MuhasabaScoreCard } from './components/MuhasabaScoreCard';
import { AmolCategorySection } from './components/AmolCategorySection';
import { OptionalAmolsSection } from './components/OptionalAmolsSection';
import { ProfileDashboardModal } from './components/ProfileDashboardModal';
import { DigitalTasbeehModal } from './components/DigitalTasbeehModal';
import { GoogleCalendarSyncModal } from './components/GoogleCalendarSyncModal';
import { MuhasabaReflectionModal } from './components/MuhasabaReflectionModal';
import { CustomAmolModal } from './components/CustomAmolModal';
import { LateSubmissionModal } from './components/LateSubmissionModal';
import { ExportModal } from './components/ExportModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ScrollingNotificationBar } from './components/ScrollingNotificationBar';
import { BannerAdsCarousel } from './components/BannerAdsCarousel';
import { DeveloperInfoModal } from './components/DeveloperInfoModal';

import { Plus, UserCheck, ShieldCheck, Mail, Phone, ExternalLink, Code2 } from 'lucide-react';

export default function App() {
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getTodayDateInBD());
  const [selectedDistrict, setSelectedDistrict] = useState<string>('dhaka');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // User Profile from Firebase & Cache
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(() => getLocalUserProfile());
  const [enabledOptionalIds, setEnabledOptionalIds] = useState<string[]>(() => loadEnabledOptionalIds());

  // Active Tab
  const [activeTab, setActiveTab] = useState<MobileTab>('checklist');

  // Traffic & Visitor counter
  const [trafficStats, setTrafficStats] = useState<TrafficStats>({
    totalUniqueVisitors: 1,
    isLive: true,
  });

  // Custom amol items & active day state
  const [customAmols, setCustomAmols] = useState<AmolItem[]>(() => loadCustomAmols());
  const [dayState, setDayState] = useState<DayAmolState>(() => loadDayStateLocal(currentDateStr));

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isCustomAmolOpen, setIsCustomAmolOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);

  const isOnline = useOnlineStatus();

  // Time-gated late submission modal
  const [lateModalItem, setLateModalItem] = useState<{ item: AmolItem; explanation: string } | null>(null);

  // Active Optional Amols enabled by user
  const activeOptionalAmols = useMemo(() => {
    return OPTIONAL_AMOLS.filter((opt) => enabledOptionalIds.includes(opt.id));
  }, [enabledOptionalIds]);

  // All Amols combined (5 Prayers + 24 Core + Enabled Optionals + Custom)
  const allAmols = useMemo(() => {
    return [
      ...PRAYER_AMOLS,
      ...CORE_24_AMOLS,
      ...activeOptionalAmols,
      ...customAmols,
    ];
  }, [activeOptionalAmols, customAmols]);

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

  // Listen to User Profile, Custom Amols & History from Cloud Firestore when logged in
  useEffect(() => {
    if (currentUser) {
      fetchUserAmolHistory(currentUser.uid);

      const unsubProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
        setUserProfile(profile);
        if (profile.district) {
          setSelectedDistrict(profile.district);
        }
        if (profile.enabledOptionalIds) {
          setEnabledOptionalIds(profile.enabledOptionalIds);
        }
      });

      const unsubCustom = subscribeToUserCustomAmols(currentUser.uid, (remoteCustomAmols) => {
        setCustomAmols(remoteCustomAmols);
      });

      return () => {
        unsubProfile();
        unsubCustom();
      };
    }
  }, [currentUser]);

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
    for (let i = 1; i <= 30; i++) {
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

  // Toggle Optional Amol (Add / Remove from Daily Checklist)
  const handleToggleOptionalAmol = (amolId: string) => {
    const updated = enabledOptionalIds.includes(amolId)
      ? enabledOptionalIds.filter((id) => id !== amolId)
      : [...enabledOptionalIds, amolId];

    setEnabledOptionalIds(updated);
    saveEnabledOptionalIds(updated, currentUser?.uid);
  };

  // Handle Amol Toggle with Strict Calendar Date & Time-Gating Check
  const handleAttemptToggleAmol = (item: AmolItem) => {
    const isAlreadyDone = dayState.completedAmolIds.includes(item.id);

    // If unchecking: allow direct removal
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

    const todayStr = getTodayDateInBD();

    // 1. FUTURE DATE GATING: Cannot fill deeds in advance!
    if (currentDateStr > todayStr) {
      alert(`ভবিষ্যতের তারিখের (${currentDateStr}) আমল অগ্রিম পূরণ করা সম্ভব নয়। কেবল আজকের (${todayStr}) আমল করা যাবে।`);
      return;
    }

    // 2. PREVIOUS DATE GATING: Cannot be filled normally today; requires late reason/reflection note!
    if (currentDateStr < todayStr) {
      setLateModalItem({
        item,
        explanation: `আপনি পূর্ববর্তী তারিখের (${currentDateStr}) আমল জমা দিচ্ছেন। অতীতের আমল লিপিবদ্ধ করতে অনুগ্রহ করে কারণ বা আত্মোপলব্ধি (মুহাসাবা নোট) লিখুন।`,
      });
      return;
    }

    // 3. TODAY'S DATE GATING: Must be done on time. If submitting after deadline, note is required!
    const timeGate = checkAmolTimeWindow(item, prayerSchedule, currentDateStr);

    if (timeGate.wasLate) {
      setLateModalItem({
        item,
        explanation: timeGate.windowExplanationBn || 'ওয়াক্ত বা নির্ধারিত সময় অতিক্রান্ত হয়েছে। দেরিতে সম্পন্ন করার কারণ বা আত্মোপলব্ধি উল্লেখ আবশ্যক।',
      });
    } else {
      applyAmolCheck(item.id, '', false);
    }
  };

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
    const updated = saveCustomAmol(newAmol, currentUser?.uid);
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

  // Categories in order of UI display
  const categoriesToRender: AmolCategory[] = [
    'fard_salah',
    'core_24',
    'custom'
  ];

  const handleTabChange = (tab: MobileTab) => {
    if (tab === 'tasbeeh') {
      setIsTasbeehOpen(true);
      return;
    }
    if (tab === 'export') {
      setIsExportOpen(true);
      return;
    }
    if (tab === 'developer') {
      setIsDeveloperOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#E2E8F0] text-slate-800 flex justify-center items-center sm:py-6 selection:bg-emerald-500 selection:text-white font-['Hind_Siliguri']">
      
      {/* Centered Mobile Device Frame (430px) Matching Reference Exactly */}
      <div className="mobile-device-shell flex flex-col no-scrollbar">
        
        {/* Top Speaker Notch on Desktop */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 shrink-0 z-50">
          <div className="w-24 h-4 rounded-full bg-slate-900 flex items-center justify-end px-3 gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700"></span>
          </div>
        </div>

        {/* Top Header Navbar with Profile Dashboard Trigger & Developer Info */}
        <Navbar
          currentDateStr={currentDateStr}
          onDateChange={setCurrentDateStr}
          currentUser={currentUser}
          trafficStats={trafficStats}
          streakCount={streakCount}
          onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
          onOpenStats={() => setActiveTab('muhasaba')}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenDeveloper={() => setIsDeveloperOpen(true)}
        />

        {/* Top Scrolling Notification Bar (Right-to-Left Marquee with pause-on-hover) */}
        <ScrollingNotificationBar
          onOpenDeveloper={() => setIsDeveloperOpen(true)}
          onOpenInstall={() => setIsInstallModalOpen(true)}
          onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
        />

        {/* Offline Banner Indicator */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-[11px] font-semibold px-3 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>অফলাইন মোড — ডেটা আপনার ডিভাইসে সংরক্ষিত থাকবে এবং অনলাইনে এলে ক্লাউডে সিঙ্ক হবে।</span>
          </div>
        )}

        {/* Main Scrollable Body */}
        <div className="flex-1 px-4 py-4 space-y-4 pb-24 overflow-y-auto no-scrollbar">
          
          {/* TAB 1: CHECKLIST (REFERENCE UI LAYOUT) */}
          {activeTab === 'checklist' && (
            <>
              {/* 1. Horizontal Week Calendar (Sun 1, Mon 2, etc.) */}
              <HorizontalWeekCalendar
                currentDateStr={currentDateStr}
                onDateChange={setCurrentDateStr}
                streakCount={streakCount}
              />

              {/* Date Status Banner for Past or Future Date */}
              {currentDateStr !== getTodayDateInBD() && (
                <div
                  className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
                    currentDateStr > getTodayDateInBD()
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm">
                      {currentDateStr > getTodayDateInBD() ? '⚠️' : '🕒'}
                    </span>
                    <span className="truncate">
                      {currentDateStr > getTodayDateInBD()
                        ? `ভবিষ্যতের তারিখ (${currentDateStr}) — অগ্রিম পূরণ বন্ধ`
                        : `পূর্ববর্তী তারিখ (${currentDateStr}) — জমা দিতে নোট আবশ্যক`}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentDateStr(getTodayDateInBD())}
                    className="shrink-0 px-2 py-0.5 rounded-lg bg-white/90 hover:bg-white text-[10px] font-bold shadow-xs border border-black/5 text-slate-700"
                  >
                    আজকে ফিরুন
                  </button>
                </div>
              )}

              {/* 2. Terracotta Progress Card (আজকের অগ্রগতি • ০ সম্পন্ন • ৪৬ বাকি) */}
              <ReferenceProgressCard
                state={dayState}
                allAmols={allAmols}
                onOpenMuhasabaDetails={() => setActiveTab('muhasaba')}
              />

              {/* 3. Daily Notification Toggle Bar (Prayer Alarms & Incomplete Amol SMS Notifications) */}
              <NotificationToggleBar
                schedule={prayerSchedule}
                dayState={dayState}
                allAmols={allAmols}
              />

              {/* 4. Banner Ad Placement Carousel (Announcements & Events) */}
              <BannerAdsCarousel />

              {/* 5. Categorized Amol Sections with Pastel Cards */}
              <div className="space-y-5 pt-1">
                
                {/* Five Obligatory Prayers */}
                <AmolCategorySection
                  key="fard_salah"
                  category="fard_salah"
                  items={PRAYER_AMOLS}
                  dayState={dayState}
                  schedule={prayerSchedule}
                  currentDateStr={currentDateStr}
                  onAttemptToggleAmol={handleAttemptToggleAmol}
                  onToggleSubTask={handleToggleSubTask}
                  onSyncSingleToCalendar={handleSyncSingleToCalendar}
                />

                {/* The 24 Core Daily Listed Amols (Sequential 1 to 24) */}
                <AmolCategorySection
                  key="core_24"
                  category="core_24"
                  items={CORE_24_AMOLS}
                  dayState={dayState}
                  schedule={prayerSchedule}
                  currentDateStr={currentDateStr}
                  onAttemptToggleAmol={handleAttemptToggleAmol}
                  onToggleSubTask={handleToggleSubTask}
                  onSyncSingleToCalendar={handleSyncSingleToCalendar}
                />

                {/* Separate Optional Practices Pool (User can add/toggle) */}
                <OptionalAmolsSection
                  enabledOptionalIds={enabledOptionalIds}
                  dayState={dayState}
                  schedule={prayerSchedule}
                  currentDateStr={currentDateStr}
                  onAttemptToggleAmol={handleAttemptToggleAmol}
                  onOpenManageModal={() => setIsProfileOpen(true)}
                />

                {/* Custom User-Added Amols */}
                {customAmols.length > 0 && (
                  <AmolCategorySection
                    key="custom"
                    category="custom"
                    items={customAmols}
                    dayState={dayState}
                    schedule={prayerSchedule}
                    currentDateStr={currentDateStr}
                    onAttemptToggleAmol={handleAttemptToggleAmol}
                    onToggleSubTask={handleToggleSubTask}
                    onOpenCustomAmolModal={() => setIsCustomAmolOpen(true)}
                  />
                )}

              </div>
            </>
          )}

          {/* TAB 2: PRAYERS & SPLIT JAMAT VIEW */}
          {activeTab === 'prayers' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center pt-1 pb-1">
                <h2 className="text-base font-extrabold text-slate-800">ওয়াক্ত ও জামাত সময়সূচী</h2>
                <p className="text-xs text-slate-500 font-medium">বাংলাদেশ সময় (Asia/Dhaka) • হানাফী আসর পদ্ধতি</p>
              </div>

              <PrayerTimeBanner
                schedule={prayerSchedule}
                selectedDistrict={selectedDistrict}
                onDistrictChange={(dist) => {
                  setSelectedDistrict(dist);
                  if (currentUser) {
                    saveUserProfile(currentUser.uid, { district: dist });
                  }
                }}
                onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
              />

              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  হানাফী আসর ও জামাত বিধান
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  ইমামে আযম আবু হানিফা (রহ.) এর সিদ্ধান্ত অনুযায়ী বস্তুর ছায়া দ্বিগুণ (২ গুণ) হলে আসরের ওয়াক্ত শুরু হয়। বাংলাদেশে প্রচলিত সকল মসজিদে এই ওয়াক্ত ও জামাত কঠোরভাবে অনুসরণ করা হয়।
                </p>
                <button
                  onClick={() => setIsCalendarSyncOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe"
                >
                  গুগল ক্যালেন্ডারে সব ওয়াক্ত সিঙ্ক করুন
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MUHASABA DASHBOARD */}
          {activeTab === 'muhasaba' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center pt-1 pb-1">
                <h2 className="text-base font-extrabold text-slate-800">মুহাসাবা স্কোর ও বিশ্লেষণ</h2>
                <p className="text-xs text-slate-500 font-medium">দৈনিক অগ্রগতি, সাপ্তাহিক গড় ও মাসিক সামগ্রিক স্কোর</p>
              </div>

              <MuhasabaScoreCard
                state={dayState}
                allAmols={allAmols}
                currentDateStr={currentDateStr}
                onOpenReflection={() => setIsReflectionOpen(true)}
                onOpenTasbeeh={() => setIsTasbeehOpen(true)}
              />

              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">মাসিক রিপোর্ট ও প্রোফাইল</h3>
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    প্রোফাইল ড্যাশবোর্ড
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  আপনার মাসিক রিপোর্ট Word (.docx), Excel (.xlsx), এবং হাই-রেজোলিউশন ইমেজ (.jpg) ফরম্যাটে ডাউনলোড করতে পারেন।
                </p>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
                >
                  এক্সপোর্ট সেন্টার খুলুন
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DEVELOPER INFORMATION SECTION */}
          {activeTab === 'developer' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center pt-1 pb-1">
                <h2 className="text-base font-extrabold text-slate-800">অ্যাপ ডেভেলপার তথ্য</h2>
                <p className="text-xs text-slate-500 font-medium">Developer Profile & Contact Details</p>
              </div>

              {/* In-page Developer Profile Card */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full ring-4 ring-emerald-500/60 p-1 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl overflow-hidden">
                      <img
                        src="https://www.image2url.com/r2/default/images/1793555532100-56f572a1-b617-499d-b07c-6f5c6a4987b8.jpg"
                        alt="Sakibul Islam Sabbir"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md border-2 border-slate-900">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-white tracking-tight">Sakibul Islam Sabbir</h3>
                  <p className="text-xs text-slate-300 font-medium">সাকিবুল ইসলাম সাব্বির</p>

                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                    <Code2 className="w-3 h-3" />
                    Full-Stack Developer & UI/UX Designer
                  </div>

                  <p className="text-xs font-semibold text-slate-300 mt-2">
                    Founder & CEO, Bismahsoft
                  </p>
                </div>

                <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-200 leading-relaxed font-normal">
                  <p>
                    Full-Stack Web Developer and UI/UX Designer focused on crafting clean, high-performance web applications with modern tech stacks.
                  </p>
                  <p className="pt-2 border-t border-white/10 text-slate-300">
                    Student at As-Sunnah Skill Development Institute (Small Business Management Course, Batch 29, Department of Creative).
                  </p>
                </div>

                {/* Social Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <a
                    href="https://www.facebook.com/share/18jJa1Fom2/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 font-bold transition-all"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://linkedin.com/in/sakibulislamsabbir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-200 font-bold transition-all"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://wa.me/8801410957506"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 font-bold transition-all"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="mailto:sakibulislamsbmc@gmail.com"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200 font-bold transition-all"
                  >
                    <span>Email Me</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setIsDeveloperOpen(true)}
                    className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe"
                  >
                    বিস্তারিত প্রোফাইল মোডাল খুলুন
                  </button>
                </div>
              </div>

              {/* Also show Announcements Carousel in Developer section */}
              <BannerAdsCarousel />
            </div>
          )}

        </div>

        {/* Floating Action Button (Green + Circle as in Reference Image) */}
        {activeTab === 'checklist' && (
          <button
            onClick={() => setIsCustomAmolOpen(true)}
            className="absolute bottom-20 right-5 z-40 w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xl shadow-emerald-600/40 flex items-center justify-center transition-all cc-light-swipe"
            title="নতুন অভ্যাস / আমল যোগ করুন"
          >
            <Plus className="w-7 h-7 stroke-[2.6]" />
          </button>
        )}

        {/* Floating Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingLateCount={0}
        />

        {/* Profile & Activities Dashboard Modal (Firebase Integration) */}
        <ProfileDashboardModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          onProfileUpdated={(updated) => setUserProfile(updated)}
          currentDateStr={currentDateStr}
          dayState={dayState}
          allAmols={allAmols}
          streakCount={streakCount}
          selectedDistrict={selectedDistrict}
          onDistrictChange={setSelectedDistrict}
          enabledOptionalIds={enabledOptionalIds}
          onToggleOptionalAmol={handleToggleOptionalAmol}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
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

        {/* PWA Mobile App Install Modal */}
        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />

        {/* App Developer Profile Information Modal */}
        <DeveloperInfoModal
          isOpen={isDeveloperOpen}
          onClose={() => setIsDeveloperOpen(false)}
        />

      </div>

    </div>
  );
}

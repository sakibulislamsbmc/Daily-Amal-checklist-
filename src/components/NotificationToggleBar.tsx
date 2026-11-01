import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, BellRing, Volume2, MessageSquareWarning, CheckCircle2, Clock, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { PrayerSchedule, DayAmolState, AmolItem } from '../types';
import { formatBDTime } from '../services/prayerTimes';

interface NotificationToggleBarProps {
  schedule?: PrayerSchedule;
  dayState?: DayAmolState;
  allAmols?: AmolItem[];
}

interface InAppSMSAlert {
  id: string;
  title: string;
  body: string;
  timeStr: string;
  type: 'prayer_alarm' | 'incomplete_amol';
}

const STORAGE_KEY_ENABLED = 'daily_amol_notifications_enabled_v2';
const STORAGE_KEY_REMINDER_INTERVAL = 'daily_amol_reminder_interval_mins';

// Synthesize a gentle, clear alarm / SMS tone using Web Audio API (no external mp3 required)
function playNotificationSound(type: 'prayer_alarm' | 'incomplete_amol') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'prayer_alarm') {
      // Melodic 3-chime alarm for Prayer Time
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.28);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + idx * 0.28 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.28 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.28);
        osc.stop(ctx.currentTime + idx * 0.28 + 0.5);
      });
    } else {
      // Crisp double-beep SMS text message sound
      const notes = [880, 1174.66]; // A5, D6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.16);
        osc.stop(ctx.currentTime + idx * 0.16 + 0.25);
      });
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'prayer_alarm' ? [300, 150, 300, 150, 400] : [200, 100, 200]);
    }
  } catch {
    // Ignore audio context restriction if no user gesture yet
  }
}

async function triggerDeviceNotification(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/favicon.png',
            tag,
            renotify: true,
            vibrate: [250, 100, 250],
          } as NotificationOptions);
          return;
        }
      }
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag,
      });
    } catch {
      // Fallback handled by in-app SMS banner
    }
  }
}

export const NotificationToggleBar: React.FC<NotificationToggleBarProps> = ({
  schedule,
  dayState,
  allAmols = [],
}) => {
  // Default ON as instructed ("be sure to turn this feature on")
  const [enabled, setEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [showDetails, setShowDetails] = useState(false);
  const [reminderIntervalMins, setReminderIntervalMins] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REMINDER_INTERVAL);
    return saved ? Number(saved) : 60; // Default 60 minutes
  });

  const [activeSMSAlert, setActiveSMSAlert] = useState<InAppSMSAlert | null>(null);
  const firedAlarmsRef = useRef<Set<string>>(new Set());

  // Calculate incomplete sections breakdown
  const incompleteSummary = useMemo(() => {
    const completedIds = dayState?.completedAmolIds || [];
    const fardItems = allAmols.filter((a) => a.category === 'fard_salah');
    const coreItems = allAmols.filter((a) => a.category === 'core_24');
    const optionalItems = allAmols.filter((a) => a.category === 'optional' || a.category === 'custom');

    const incFard = fardItems.filter((a) => !completedIds.includes(a.id));
    const incCore = coreItems.filter((a) => !completedIds.includes(a.id));
    const incOpt = optionalItems.filter((a) => !completedIds.includes(a.id));

    const totalIncomplete = incFard.length + incCore.length + incOpt.length;

    const parts: string[] = [];
    if (incFard.length > 0) parts.push(`ফরজ সালাত (${incFard.length}টি বাকি)`);
    if (incCore.length > 0) parts.push(`দৈনিক রুটিন আমল (${incCore.length}টি বাকি)`);
    if (incOpt.length > 0) parts.push(`ঐচ্ছিক/কাস্টম আমল (${incOpt.length}টি বাকি)`);

    const sampleNames = [...incFard, ...incCore]
      .slice(0, 3)
      .map((i) => i.titleBn.replace(/^\d+\.\s*/, ''))
      .join(', ');

    return {
      totalIncomplete,
      incFardCount: incFard.length,
      incCoreCount: incCore.length,
      incOptCount: incOpt.length,
      sectionsText: parts.join(' • '),
      sampleNames,
    };
  }, [dayState, allAmols]);

  // Determine the next upcoming scheduled prayer alarm
  const nextPrayerAlarm = useMemo(() => {
    if (!schedule) return null;
    const now = new Date();
    const candidates = [
      { key: 'fajr-azan', nameBn: 'ফজর আজান', timeStr: schedule.fajrAzan, date: schedule.rawDates.fajrAzan },
      { key: 'fajr-jamat', nameBn: 'ফজর জামাত', timeStr: schedule.fajrJamat, date: schedule.rawDates.fajrJamat },
      { key: 'dhuhr-azan', nameBn: 'যোহর আজান', timeStr: schedule.dhuhrAzan, date: schedule.rawDates.dhuhrAzan },
      { key: 'dhuhr-jamat', nameBn: 'যোহর জামাত', timeStr: schedule.dhuhrJamat, date: schedule.rawDates.dhuhrJamat },
      { key: 'asr-azan', nameBn: 'আসর আজান', timeStr: schedule.asrAzan, date: schedule.rawDates.asrAzan },
      { key: 'asr-jamat', nameBn: 'আসর জামাত', timeStr: schedule.asrJamat, date: schedule.rawDates.asrJamat },
      { key: 'maghrib-azan', nameBn: 'মাগরিব আজান', timeStr: schedule.maghribAzan, date: schedule.rawDates.maghribAzan },
      { key: 'maghrib-jamat', nameBn: 'মাগরিব জামাত', timeStr: schedule.maghribJamat, date: schedule.rawDates.maghribJamat },
      { key: 'isha-azan', nameBn: 'এশা আজান', timeStr: schedule.ishaAzan, date: schedule.rawDates.ishaAzan },
      { key: 'isha-jamat', nameBn: 'এশা জামাত', timeStr: schedule.ishaJamat, date: schedule.rawDates.ishaJamat },
      { key: 'tahajjud', nameBn: 'তাহাজ্জুদ ওয়াক্ত', timeStr: schedule.tahajjudStart, date: schedule.rawDates.tahajjud },
    ];

    const upcoming = candidates
      .filter((c) => c.date.getTime() > now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] || { key: 'fajr-next', nameBn: 'আগামীকাল ফজর জামাত', timeStr: schedule.fajrJamat, date: schedule.rawDates.fajrJamat };
  }, [schedule]);

  // Request permission helper
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        return res;
      } catch {
        return 'default';
      }
    }
    return 'default';
  };

  // Prompt permission automatically when enabled on first interaction
  useEffect(() => {
    if (enabled && permission === 'default' && typeof window !== 'undefined' && 'Notification' in window) {
      requestNotificationPermission();
    }
  }, [enabled, permission]);

  const sendPrayerAlarmNotification = (prayerNameBn: string, timeStr: string, isPreReminder = false) => {
    const title = isPreReminder
      ? `🕌 সালাতের প্রস্তুতি অ্যালার্ম: ${prayerNameBn}`
      : `🕋 সালাতের সময় হয়েছে: ${prayerNameBn}`;
    const body = isPreReminder
      ? `${prayerNameBn} শুরু হতে আর ১০ মিনিট বাকি (${timeStr})। ওজু করে মসজিদে যাওয়ার প্রস্তুতি নিন।`
      : `এখন ${prayerNameBn}-এর নির্ধারিত সময় (${timeStr})। তাকবীরে উলার সাথে সালাত আদায় করুন।`;

    playNotificationSound('prayer_alarm');
    triggerDeviceNotification(title, body, `prayer-${prayerNameBn}`);
    setActiveSMSAlert({
      id: `alarm-${Date.now()}`,
      title,
      body,
      timeStr: formatBDTime(new Date()),
      type: 'prayer_alarm',
    });
  };

  const sendIncompleteAmolSMS = () => {
    if (incompleteSummary.totalIncomplete === 0) {
      const title = '✅ মাশাআল্লাহ! আজকের সকল আমল সম্পন্ন';
      const body = 'আপনার আজকের তালিকার সকল ফরজ ও দৈনিক আমল সম্পন্ন হয়েছে। আল্লাহ কবুল করুন!';
      playNotificationSound('incomplete_amol');
      triggerDeviceNotification(title, body, 'amol-complete');
      setActiveSMSAlert({
        id: `sms-${Date.now()}`,
        title,
        body,
        timeStr: formatBDTime(new Date()),
        type: 'incomplete_amol',
      });
      return;
    }

    const title = `📩 অসম্পূর্ণ আমল রিমাইন্ডার (${incompleteSummary.totalIncomplete}টি বাকি)`;
    const body = `${incompleteSummary.sectionsText}। উল্লেখযোগ্য বাকি আমল: ${incompleteSummary.sampleNames}... আজকের মুহাসাবা পূর্ণ করতে এখনই সম্পন্ন করুন।`;

    playNotificationSound('incomplete_amol');
    triggerDeviceNotification(title, body, 'incomplete-amol-sms');
    setActiveSMSAlert({
      id: `sms-${Date.now()}`,
      title,
      body,
      timeStr: formatBDTime(new Date()),
      type: 'incomplete_amol',
    });
  };

  // Background scheduler for prayer alarms (every 20 seconds)
  useEffect(() => {
    if (!enabled || !schedule) return;

    const checkPrayerAlarms = () => {
      const now = new Date();
      const prayers = [
        { key: 'fajr-azan', nameBn: 'ফজর আজান', timeStr: schedule.fajrAzan, date: schedule.rawDates.fajrAzan, isJamat: false },
        { key: 'fajr-jamat', nameBn: 'ফজর জামাত', timeStr: schedule.fajrJamat, date: schedule.rawDates.fajrJamat, isJamat: true },
        { key: 'dhuhr-azan', nameBn: 'যোহর আজান', timeStr: schedule.dhuhrAzan, date: schedule.rawDates.dhuhrAzan, isJamat: false },
        { key: 'dhuhr-jamat', nameBn: 'যোহর জামাত', timeStr: schedule.dhuhrJamat, date: schedule.rawDates.dhuhrJamat, isJamat: true },
        { key: 'asr-azan', nameBn: 'আসর আজান', timeStr: schedule.asrAzan, date: schedule.rawDates.asrAzan, isJamat: false },
        { key: 'asr-jamat', nameBn: 'আসর জামাত', timeStr: schedule.asrJamat, date: schedule.rawDates.asrJamat, isJamat: true },
        { key: 'maghrib-azan', nameBn: 'মাগরিব আজান', timeStr: schedule.maghribAzan, date: schedule.rawDates.maghribAzan, isJamat: false },
        { key: 'maghrib-jamat', nameBn: 'মাগরিব জামাত', timeStr: schedule.maghribJamat, date: schedule.rawDates.maghribJamat, isJamat: true },
        { key: 'isha-azan', nameBn: 'এশা আজান', timeStr: schedule.ishaAzan, date: schedule.rawDates.ishaAzan, isJamat: false },
        { key: 'isha-jamat', nameBn: 'এশা জামাত', timeStr: schedule.ishaJamat, date: schedule.rawDates.ishaJamat, isJamat: true },
      ];

      prayers.forEach((p) => {
        const diffMinutes = (p.date.getTime() - now.getTime()) / 60000;

        // 10-minute pre-Jamat alarm
        if (p.isJamat && diffMinutes <= 10 && diffMinutes > 9) {
          const preKey = `${schedule.dateStr}-${p.key}-pre10`;
          if (!firedAlarmsRef.current.has(preKey)) {
            firedAlarmsRef.current.add(preKey);
            sendPrayerAlarmNotification(p.nameBn, p.timeStr, true);
          }
        }

        // Exact prayer / jamat time alarm (within 1 minute window)
        if (Math.abs(diffMinutes) <= 0.8) {
          const exactKey = `${schedule.dateStr}-${p.key}-exact`;
          if (!firedAlarmsRef.current.has(exactKey)) {
            firedAlarmsRef.current.add(exactKey);
            sendPrayerAlarmNotification(p.nameBn, p.timeStr, false);
          }
        }
      });
    };

    const intervalId = setInterval(checkPrayerAlarms, 20000);
    return () => clearInterval(intervalId);
  }, [enabled, schedule]);

  // Background scheduler for Incomplete Amol SMS notifications
  useEffect(() => {
    if (!enabled || incompleteSummary.totalIncomplete === 0) return;

    const intervalMs = reminderIntervalMins * 60 * 1000;
    const smsTimer = setInterval(() => {
      sendIncompleteAmolSMS();
    }, intervalMs);

    return () => clearInterval(smsTimer);
  }, [enabled, reminderIntervalMins, incompleteSummary]);

  const handleToggle = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    localStorage.setItem(STORAGE_KEY_ENABLED, String(nextState));

    if (nextState) {
      await requestNotificationPermission();
      // Give immediate confirmation notification & tone when turned on
      playNotificationSound('incomplete_amol');
      const nextPrayerText = nextPrayerAlarm ? `${nextPrayerAlarm.nameBn} (${nextPrayerAlarm.timeStr})` : 'সকল ওয়াক্ত';
      triggerDeviceNotification(
        '🔔 দৈনিক সালাত অ্যালার্ম ও আমল SMS চালু হয়েছে',
        `পরবর্তী অ্যালার্ম: ${nextPrayerText}। অসম্পূর্ণ আমল রিমাইন্ডার সক্রিয় রয়েছে।`,
        'daily-notif-enabled'
      );
    }
  };

  return (
    <div className="space-y-2">
      {/* Floating Phone SMS-Style Notification Toast when an Alarm or Reminder Triggers */}
      {activeSMSAlert && (
        <div className="p-3 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/50 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  activeSMSAlert.type === 'prayer_alarm'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {activeSMSAlert.type === 'prayer_alarm' ? (
                  <BellRing className="w-4 h-4 animate-bounce" />
                ) : (
                  <MessageSquareWarning className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {activeSMSAlert.type === 'prayer_alarm' ? 'সালাত অ্যালার্ম' : 'মোবাইল মেসেজ রিমাইন্ডার'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">• {activeSMSAlert.timeStr}</span>
                </div>
                <h5 className="text-xs font-extrabold text-white leading-snug">{activeSMSAlert.title}</h5>
                <p className="text-[11px] text-slate-200 leading-relaxed">{activeSMSAlert.body}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSMSAlert(null)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Notification Toggle Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                enabled
                  ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {enabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-800 leading-tight">দৈনিক নোটিফিকেশন ও অ্যালার্ম</h4>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    enabled
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300/60'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {enabled ? 'চালু (ON)' : 'বন্ধ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                ৫ ওয়াক্ত সালাতের অ্যালার্ম ও অসম্পূর্ণ আমলের মেসেজ রিমাইন্ডার
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              title="অ্যালার্ম ও রিমাইন্ডার সেটিংস"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* iOS style toggle switch */}
            <button
              onClick={handleToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                enabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              title={enabled ? 'নোটিফিকেশন চালু আছে' : 'নোটিফিকেশন চালু করুন'}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Live Status Strip when Enabled */}
        {enabled && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px]">
            {nextPrayerAlarm && (
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>
                  পরবর্তী অ্যালার্ম: <strong>{nextPrayerAlarm.nameBn}</strong> ({nextPrayerAlarm.timeStr})
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 text-slate-600 font-semibold">
              <MessageSquareWarning className="w-3 h-3 text-amber-500" />
              <span>বাকি আমল: {incompleteSummary.totalIncomplete}টি</span>
            </div>
          </div>
        )}

        {/* Expandable Settings & Instant Test Panel */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
            {/* Permission status banner */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <span className="text-slate-600 font-medium text-[11px]">ফোন নোটিফিকেশন অনুমতি:</span>
              {permission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদিত (Active)
                </span>
              ) : (
                <button
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold shadow-xs transition-all"
                >
                  অনুমতি দিন (Allow)
                </button>
              )}
            </div>

            {/* Incomplete Amol SMS Interval Selector */}
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="font-semibold text-slate-700">অসম্পূর্ণ আমলের মেসেজ বিরতি:</span>
              <select
                value={reminderIntervalMins}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReminderIntervalMins(val);
                  localStorage.setItem(STORAGE_KEY_REMINDER_INTERVAL, String(val));
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px] focus:outline-none"
              >
                <option value={30}>প্রতি ৩০ মিনিটে</option>
                <option value={60}>প্রতি ১ ঘণ্টায়</option>
                <option value={120}>প্রতি ২ ঘণ্টায়</option>
                <option value={240}>প্রতি ৪ ঘণ্টায়</option>
              </select>
            </div>

            {/* Incomplete Sections Breakdown */}
            {incompleteSummary.totalIncomplete > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>অসম্পূর্ণ সেকশনসমূহ:</span>
                </div>
                <p className="text-[10px] leading-relaxed font-medium">{incompleteSummary.sectionsText}</p>
              </div>
            )}

            {/* Instant Test Buttons for Prayer Alarm & SMS Notification */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() =>
                  sendPrayerAlarmNotification(
                    nextPrayerAlarm ? nextPrayerAlarm.nameBn : 'ফরজ সালাত',
                    nextPrayerAlarm ? nextPrayerAlarm.timeStr : 'নির্ধারিত ওয়াক্ত',
                    false
                  )
                }
                className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>সালাত অ্যালার্ম টেস্ট</span>
              </button>

              <button
                onClick={sendIncompleteAmolSMS}
                className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                <span>বাকি আমল মেসেজ টেস্ট</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  MapPin, 
  BookOpen, 
  Compass, 
  Flame, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Save, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  UserCheck,
  ExternalLink,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, signInAsGuest, logout, isInIframe, openInStandaloneTab } from '../firebase';
import { UserProfileData, DayAmolState, AmolItem } from '../types';
import { saveUserProfile } from '../services/userService';
import { BD_DISTRICTS } from '../services/prayerTimes';
import { OPTIONAL_AMOLS } from '../data/defaultAmols';
import { calculateMuhasabaScore, loadDayStateLocal } from '../services/amolStorage';
import { Globe } from 'lucide-react';

interface ProfileDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userProfile: UserProfileData | null;
  onProfileUpdated: (updated: UserProfileData) => void;
  currentDateStr: string;
  dayState: DayAmolState;
  allAmols: AmolItem[];
  streakCount: number;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  enabledOptionalIds: string[];
  onToggleOptionalAmol: (amolId: string) => void;
  onOpenInstallModal: () => void;
  onOpenExportModal: () => void;
  onOpenOnboarding?: () => void;
}

export const ProfileDashboardModal: React.FC<ProfileDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onProfileUpdated,
  currentDateStr,
  dayState,
  allAmols,
  streakCount,
  selectedDistrict,
  onDistrictChange,
  enabledOptionalIds,
  onToggleOptionalAmol,
  onOpenInstallModal,
  onOpenExportModal,
  onOpenOnboarding,
}) => {
  if (!isOpen) return null;

  // Form states
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || currentUser?.displayName || 'মুহতারাম ব্যবহারকারী'
  );
  const [district, setDistrict] = useState(
    userProfile?.district || selectedDistrict || 'dhaka'
  );
  const [quranTarget, setQuranTarget] = useState(
    userProfile?.quranTarget || '১০ মিনিট তিলাওয়াত'
  );
  const [masjidPreference, setMasjidPreference] = useState(
    userProfile?.masjidPreference || 'তাকবীরে উলার সাথে মসজিদে জামাত'
  );
  const [spiritualBio, setSpiritualBio] = useState(
    userProfile?.spiritualBio || 'নিয়ত বিশুদ্ধ রেখে দৈনিক আমলের মাধ্যমে আল্লাহর নৈকট্য অর্জন'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) setDisplayName(userProfile.displayName);
      if (userProfile.district) setDistrict(userProfile.district);
      if (userProfile.quranTarget) setQuranTarget(userProfile.quranTarget);
      if (userProfile.masjidPreference) setMasjidPreference(userProfile.masjidPreference);
      if (userProfile.spiritualBio) setSpiritualBio(userProfile.spiritualBio);
    } else if (currentUser) {
      if (currentUser.displayName) setDisplayName(currentUser.displayName);
    }
  }, [userProfile, currentUser]);

  // Compute all-time user activities & stats
  const stats = React.useMemo(() => {
    let totalCompleted = 0;
    let totalLate = 0;
    let totalOnTime = 0;
    let totalScoresSum = 0;
    let loggedDaysCount = 0;

    // Scan past 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date(currentDateStr);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const s = ds === currentDateStr ? dayState : loadDayStateLocal(ds);

      if (s && s.completedAmolIds && s.completedAmolIds.length > 0) {
        loggedDaysCount++;
        totalCompleted += s.completedAmolIds.length;
        const score = calculateMuhasabaScore(s, allAmols).percentage;
        totalScoresSum += score;

        if (s.amolRemarks) {
          Object.values(s.amolRemarks).forEach((r) => {
            if (r.wasLate) totalLate++;
            else totalOnTime++;
          });
        }
      }
    }

    const avgScore = loggedDaysCount > 0 ? Math.round(totalScoresSum / loggedDaysCount) : 0;
    return {
      loggedDaysCount: Math.max(1, loggedDaysCount),
      totalCompleted,
      totalLate,
      totalOnTime,
      avgScore,
    };
  }, [dayState, currentDateStr, allAmols]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const uid = currentUser?.uid || 'guest_user';
    const updatedData: Partial<UserProfileData> = {
      displayName,
      district,
      quranTarget,
      masjidPreference,
      spiritualBio,
      email: currentUser?.email || '',
      photoURL: currentUser?.photoURL || '',
      enabledOptionalIds,
    };

    try {
      const saved = await saveUserProfile(uid, updatedData);
      onProfileUpdated(saved);
      onDistrictChange(district);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (!res.success) {
        setAuthError(res.friendlyMessage || 'গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হয়নি।');
      }
    } catch (err: any) {
      setAuthError('লগইন ব্যর্থ হয়েছে। বিকল্প হিসেবে অতিথি মোডে প্রবেশ করতে পারেন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGuestAuth = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await signInAsGuest();
      if (!res.success) {
        setAuthError(res.friendlyMessage || 'অতিথি অ্যাকাউন্টে প্রবেশ ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setAuthError('অতিথি মোডে প্রবেশ করা যায়নি।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                প্রোফাইল ও ড্যাশবোর্ড
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ব্যক্তিগত তথ্য, ফায়ারবেস সিঙ্ক ও সার্বিক কার্যকলাপ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          
          {/* PWA Mobile App Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  ফোনে মোবাইল অ্যাপ ইনস্টল করুন
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  পরিচালকের ফোন বা নিজস্ব ডিভাইসে সরাসরি ইনস্টল
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm transition-all shrink-0 active:scale-95"
            >
              ইনস্টল করুন
            </button>
          </div>

          {/* Onboarding & Language Selection Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700 shrink-0">
                <Globe className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">
                  অ্যাপ পরিচিতি ও ভাষা নির্বাচন
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  ৪-ধাপের ওয়েলকাম গাইড ও ভাষা পরিবর্তন
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding?.();
              }}
              className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-xs transition-all shrink-0 active:scale-95"
            >
              গাইড দেখুন
            </button>
          </div>

          {/* Moved Export Section with 3D Glossy Icon & Neatly Aligned Format Triggers */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50/90 via-sky-50/80 to-blue-50/90 border border-cyan-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-700 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous shrink-0">
                  <Download className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] relative z-[3]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                      এক্সপোর্ট ও রিপোর্ট সেন্টার
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[9px] font-extrabold">
                      3D Export
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium truncate">
                    দৈনিক, সাপ্তাহিক ও মাসিক মুহাসাবা রিপোর্ট ডাউনলোড
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-700 hover:from-teal-600 hover:to-blue-800 text-white text-xs font-extrabold shadow-md transition-all shrink-0 active:scale-95 cc-light-swipe"
              >
                এক্সপোর্ট খুলুন
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="p-2 rounded-xl bg-white/90 hover:bg-white border border-blue-200/80 flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center icon-3d-badge shrink-0">
                  <FileText className="w-3.5 h-3.5 relative z-[3]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black text-slate-800 leading-none truncate">Word</p>
                  <p className="text-[9px] text-blue-700 font-bold leading-none mt-0.5">.docx</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="p-2 rounded-xl bg-white/90 hover:bg-white border border-emerald-200/80 flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-700 text-white flex items-center justify-center icon-3d-badge shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5 relative z-[3]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black text-slate-800 leading-none truncate">Excel</p>
                  <p className="text-[9px] text-emerald-700 font-bold leading-none mt-0.5">.xlsx</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="p-2 rounded-xl bg-white/90 hover:bg-white border border-rose-200/80 flex items-center gap-2 transition-all active:scale-95 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-purple-800 text-white flex items-center justify-center icon-3d-badge shrink-0">
                  <ImageIcon className="w-3.5 h-3.5 relative z-[3]" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-black text-slate-800 leading-none truncate">Image</p>
                  <p className="text-[9px] text-rose-700 font-bold leading-none mt-0.5">.jpg কার্ড</p>
                </div>
              </button>
            </div>
          </div>

          {/* 1. Firebase Auth Account Status */}
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={displayName}
                    className="w-12 h-12 rounded-full ring-2 ring-emerald-500 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {displayName[0]?.toUpperCase() || (currentUser.isAnonymous ? 'গ' : 'U')}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                      {displayName}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-[10px] text-white font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{currentUser.isAnonymous ? 'অতিথি অ্যাকাউন্ট' : 'ভেরিফায়েড'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentUser.email || (currentUser.isAnonymous ? 'অতিথি আইডি: ' + currentUser.uid.slice(0, 8) + '...' : 'অনুমোদিত ব্যবহারকারী')}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ফায়ারবেস ক্লাউড সিঙ্ক সক্রিয়</span>
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="লগ আউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ক্লাউড সিঙ্ক চালু করুন</span>
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">ফায়ারবেস ব্যাকআপ</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                গুগল অথবা অতিথি অ্যাকাউন্টে প্রবেশ করে আপনার আমলসমূহ সুরক্ষিত রাখুন, যেকোনো ডিভাইস থেকে রিয়েল-টাইমে ব্যবহার করুন।
              </p>

              {authError && (
                <div className="p-2.5 rounded-xl bg-black/25 text-[11px] text-amber-200 border border-amber-300/30">
                  <p className="font-semibold">{authError}</p>
                  {isInIframe() && (
                    <button
                      onClick={openInStandaloneTab}
                      className="mt-1.5 flex items-center gap-1 text-[10px] underline font-bold text-white hover:text-emerald-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      নতুন ট্যাবে খুলুন (পপ-আপ সমস্যা ছাড়াই)
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoggingIn ? 'লগইন হচ্ছে...' : 'গুগল দিয়ে সাইন-ইন করুন'}</span>
                </button>

                <button
                  onClick={handleGuestAuth}
                  disabled={isLoggingIn}
                  className="w-full py-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800/90 text-white active:scale-95 text-xs font-semibold border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>অতিথি (Guest) হিসেবে সরাসরি প্রবেশ</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Activity & Muhasaba Summary Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              মুহাসাবা কার্যকলাপ ও অগ্রগতি
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Streak */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">বর্তমান স্ট্রিক</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {streakCount > 0 ? `${streakCount} দিন` : '০ দিন'}
                  </span>
                </div>
              </div>

              {/* Total Completed */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">মোট আমল সম্পন্ন</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {stats.totalCompleted} টি
                  </span>
                </div>
              </div>

              {/* Average Score */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">গড় মুহাসাবা স্কোর</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {stats.avgScore}%
                  </span>
                </div>
              </div>

              {/* Logged Days */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block leading-none">সক্রিয় রেকর্ড</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {stats.loggedDaysCount} দিন
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Personal Profile & Spiritual Goals Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-1">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              ব্যক্তিগত তথ্য ও আত্মিক লক্ষ্য
            </h4>

            {/* Display Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                আপনার নাম / ডাকনাম
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* District for Prayer Times */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                জেলা (নামাজের ওয়াক্ত ও আজানের জন্য)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
              >
                {BD_DISTRICTS.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.nameBn} ({dist.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Quran Target */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                দৈনিক কুরআন তিলাওয়াত লক্ষ্য
              </label>
              <input
                type="text"
                value={quranTarget}
                onChange={(e) => setQuranTarget(e.target.value)}
                placeholder="যেমন: ১০ মিনিট / ১ রুকু / ১ পারা"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Masjid / Jamat preference */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                জামাত ও মসজিদ সংকল্প
              </label>
              <input
                type="text"
                value={masjidPreference}
                onChange={(e) => setMasjidPreference(e.target.value)}
                placeholder="যেমন: তাকবীরে উলার সাথে মসজিদে ৫ ওয়াক্ত"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Spiritual Bio */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                আজকের নিয়ত ও আত্মশুদ্ধির ভাবনা
              </label>
              <textarea
                value={spiritualBio}
                onChange={(e) => setSpiritualBio(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>তথ্য ও জেলা সফলভাবে ফায়ারবেসে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cc-light-swipe"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য সংরক্ষণ করুন'}</span>
            </button>
          </form>

          {/* 4. Optional Amols Library Settings */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  ঐচ্ছিক আমল পছন্দসমূহ
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  পছন্দমতো যেকোনো ঐচ্ছিক আমল মূল চেকলিস্টে যুক্ত বা বাদ দিতে পারেন
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {enabledOptionalIds.length} সক্রিয়
              </span>
            </div>

            <div className="space-y-2">
              {OPTIONAL_AMOLS.map((opt) => {
                const isEnabled = enabledOptionalIds.includes(opt.id);

                return (
                  <div
                    key={opt.id}
                    onClick={() => onToggleOptionalAmol(opt.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isEnabled
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-base">{opt.iconEmoji || '⭐'}</span>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 truncate">
                          {opt.titleBn}
                        </h5>
                        <p className="text-[10px] text-slate-500 truncate">
                          {opt.descriptionBn}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOptionalAmol(opt.id);
                      }}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                        isEnabled
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {isEnabled ? 'যুক্ত আছে ✓' : '+ যুক্ত করুন'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  Bell, 
  Check, 
  BookOpen, 
  Clock, 
  Award, 
  Radio, 
  Sparkles, 
  X,
  Volume2,
  Calendar,
  Bookmark,
  Share2
} from 'lucide-react';

interface LanguageOption {
  code: string;
  nameNative: string;
  nameEn: string;
  countryName: string;
  flagEmoji: string;
  flagSvg?: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'bn',
    nameNative: 'বাংলা',
    nameEn: 'Bengali',
    countryName: 'Bangladesh',
    flagEmoji: '🇧🇩',
  },
  {
    code: 'en',
    nameNative: 'English',
    nameEn: 'English',
    countryName: 'United States',
    flagEmoji: '🇺🇸',
  },
  {
    code: 'id',
    nameNative: 'Bahasa Indonesia',
    nameEn: 'Indonesian',
    countryName: 'Indonesia',
    flagEmoji: '🇮🇩',
  },
  {
    code: 'ur',
    nameNative: 'اردو',
    nameEn: 'Urdu',
    countryName: 'Pakistan',
    flagEmoji: '🇵🇰',
  },
  {
    code: 'ar',
    nameNative: 'العربية',
    nameEn: 'Arabic',
    countryName: 'Saudi Arabia',
    flagEmoji: '🇸🇦',
  },
  {
    code: 'hi',
    nameNative: 'हिन्दी',
    nameEn: 'Hindi',
    countryName: 'India',
    flagEmoji: '🇮🇳',
  },
  {
    code: 'tr',
    nameNative: 'Türkçe',
    nameEn: 'Turkish',
    countryName: 'Turkey',
    flagEmoji: '🇹🇷',
  },
  {
    code: 'ms',
    nameNative: 'Bahasa Melayu',
    nameEn: 'Malay',
    countryName: 'Malaysia',
    flagEmoji: '🇲🇾',
  },
];

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onComplete: (selectedLanguage: string) => void;
  onClose?: () => void;
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    return localStorage.getItem('daily_amol_app_language') || 'bn';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (lang) =>
        lang.nameNative.toLowerCase().includes(q) ||
        lang.nameEn.toLowerCase().includes(q) ||
        lang.countryName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Swipe support for steps 2 to 4
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else if (isRightSwipe && currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (currentStep === 1) {
        localStorage.setItem('daily_amol_app_language', selectedLang);
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    localStorage.setItem('daily_amol_app_language', selectedLang);
    localStorage.setItem('daily_amol_onboarding_completed', 'true');

    // Request notification permission if user clicked primary button on Step 4
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.log('Notification permission skipped/denied');
      }
    }
    onComplete(selectedLang);
  };

  const handleSkipNotification = () => {
    localStorage.setItem('daily_amol_app_language', selectedLang);
    localStorage.setItem('daily_amol_onboarding_completed', 'true');
    onComplete(selectedLang);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none font-anek-bangla">
      <div 
        className="w-full max-w-[430px] h-full sm:h-[880px] max-h-screen sm:rounded-[40px] bg-white shadow-2xl flex flex-col overflow-hidden relative border border-slate-200"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Close Button (if opened from settings/profile) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 backdrop-blur-md shadow-xs transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* =========================================================================
            STEP 1: LANGUAGE SELECTION SCREEN (Matches Welcome_page_1_eda61bff.jpg)
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-in fade-in duration-200">
            {/* Top Soft Mint Curved Header Area with Floating Bubbles */}
            <div className="relative pt-10 pb-7 px-6 bg-gradient-to-b from-[#DCF4EC] to-[#E9F8F3] rounded-b-[44px] overflow-hidden shrink-0">
              {/* Floating Ambient Circles / Bubbles matching screenshot */}
              <div className="absolute top-6 left-6 w-3.5 h-3.5 rounded-full bg-[#80CBC4]/45 pointer-events-none" />
              <div className="absolute top-12 left-14 w-2 h-2 rounded-full bg-[#80CBC4]/55 pointer-events-none" />
              <div className="absolute bottom-4 left-10 w-2.5 h-2.5 rounded-full bg-[#80CBC4]/50 pointer-events-none" />
              <div className="absolute top-8 right-12 w-6 h-6 rounded-full bg-[#80CBC4]/40 pointer-events-none" />
              <div className="absolute bottom-5 right-16 w-4 h-4 rounded-full bg-[#80CBC4]/50 pointer-events-none" />

              <h1 className="relative z-10 text-center text-2xl font-extrabold text-[#334155] tracking-tight">
                Select Language
              </h1>
            </div>

            {/* Middle Scrollable Language List */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
              {/* Rounded Search Input with Magnifying Glass */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by language"
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00897B]/30 focus:border-[#00897B] shadow-2xs transition-all"
                />
              </div>

              {/* Language Cards */}
              <div className="space-y-3 pt-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => setSelectedLang(lang.code)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#EBF8F4] border-[#00897B] shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Custom Radio Button */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-[#00897B] bg-white'
                              : 'border-slate-400 bg-transparent'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#00897B]" />
                          )}
                        </div>

                        {/* Country Flag */}
                        <span className="text-2xl leading-none select-none">
                          {lang.flagEmoji}
                        </span>

                        {/* Native Language Name */}
                        <div className="flex flex-col">
                          <span className={`text-base font-extrabold ${isSelected ? 'text-[#00695C]' : 'text-slate-800'}`}>
                            {lang.nameNative}
                          </span>
                          {lang.code !== 'bn' && lang.code !== 'en' && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {lang.nameEn}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[11px] font-extrabold text-[#00897B] px-2 py-0.5 rounded-full bg-[#00897B]/10">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}

                {filteredLanguages.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">
                    কোন ভাষা পাওয়া যায়নি / No language found.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Primary Action Button */}
            <div className="p-5 pt-3 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 rounded-2xl bg-[#00897B] hover:bg-[#00796B] active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-[#00897B]/25 flex items-center justify-center gap-2 transition-all cc-light-swipe"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: APP INTRODUCTION SCREEN (Matches Welcome_page_2_689eb1ba.jpg)
           ========================================================================= */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-in fade-in duration-200">
            {/* Top Soft Mint Dome Area with Book Illustration */}
            <div className="relative w-full h-[52%] min-h-[300px] bg-gradient-to-b from-[#DCF4EC] to-[#E5F7F1] rounded-b-[48%] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {/* Floating Ambient Circles / Dots matching screenshot */}
              <div className="absolute top-10 left-8 w-4 h-4 rounded-full bg-[#80CBC4]/50 pointer-events-none" />
              <div className="absolute top-20 left-16 w-2.5 h-2.5 rounded-full bg-[#80CBC4]/60 pointer-events-none" />
              <div className="absolute bottom-16 left-12 w-3.5 h-3.5 rounded-full bg-[#80CBC4]/40 pointer-events-none" />
              <div className="absolute top-12 right-12 w-8 h-8 rounded-full bg-[#80CBC4]/45 pointer-events-none" />
              <div className="absolute top-28 right-20 w-4 h-4 rounded-full bg-[#80CBC4]/50 pointer-events-none" />
              <div className="absolute bottom-20 right-14 w-3.5 h-3.5 rounded-full bg-[#80CBC4]/60 pointer-events-none" />
              <div className="absolute bottom-10 right-28 w-2 h-2 rounded-full bg-[#80CBC4]/50 pointer-events-none" />

              {/* Exact Stylized Islamic Book Illustration from Screenshot */}
              <div className="relative z-10 w-48 h-56 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 drop-shadow-xl">
                <svg
                  viewBox="0 0 200 240"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer Book Cover (Teal/Emerald) */}
                  <rect
                    x="28"
                    y="24"
                    width="144"
                    height="192"
                    rx="18"
                    fill="#00796B"
                  />
                  {/* Left Spine Accent */}
                  <path
                    d="M28 36C28 29.3726 33.3726 24 40 24H52V216H40C33.3726 216 28 210.627 28 204V36Z"
                    fill="#004D40"
                    opacity="0.4"
                  />
                  {/* Four Corner Protectors (Mint) */}
                  <path
                    d="M28 42C28 32.0589 36.0589 24 46 24H52V34C52 38.4183 48.4183 42 44 42H28Z"
                    fill="#4DB6AC"
                  />
                  <path
                    d="M172 42C172 32.0589 163.941 24 154 24H148V34C148 38.4183 151.582 42 156 42H172Z"
                    fill="#4DB6AC"
                  />
                  <path
                    d="M28 198C28 207.941 36.0589 216 46 216H52V206C52 201.582 48.4183 198 44 198H28Z"
                    fill="#4DB6AC"
                  />
                  <path
                    d="M172 198C172 207.941 163.941 216 154 216H148V206C148 201.582 151.582 198 156 198H172Z"
                    fill="#4DB6AC"
                  />

                  {/* Inner Page Framing with Islamic Arch Silhouette */}
                  <rect
                    x="56"
                    y="44"
                    width="88"
                    height="152"
                    rx="12"
                    fill="#26A69A"
                  />
                  <path
                    d="M66 58C66 52.4772 70.4772 48 76 48H124C129.523 48 134 52.4772 134 58V76C134 81.5228 129.523 86 124 86H76C70.4772 86 66 81.5228 66 76V58Z"
                    fill="#00796B"
                    opacity="0.35"
                  />

                  {/* Center Title Plate */}
                  <rect
                    x="76"
                    y="60"
                    width="48"
                    height="64"
                    rx="6"
                    fill="#004D40"
                    opacity="0.5"
                  />
                  {/* Decorative Lines below Plate */}
                  <rect x="78" y="140" width="44" height="6" rx="3" fill="#004D40" opacity="0.4" />
                  <rect x="86" y="152" width="28" height="5" rx="2.5" fill="#004D40" opacity="0.3" />
                </svg>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-2">
              <h2 className="font-noto-serif-bn text-2xl sm:text-[26px] font-extrabold text-[#374151] tracking-tight">
                সর্ববৃহৎ হাদিস ও আমল ভাণ্ডার
              </h2>
              <p className="mt-3 text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-xs font-medium">
                দৈনিক আমল চেকলিস্ট, ২৪+ হাদিসের বই এবং বিষয়ভিত্তিক সহিহ হাদিসের সংকলন এক জায়গায়।
              </p>
            </div>

            {/* Bottom Navigation with 3-Dot Pagination on Left & Next Button on Right */}
            <div className="p-6 pt-2 pb-6 flex items-center justify-between border-t border-slate-100 bg-white">
              {/* Pagination Dots Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-2 rounded-full bg-[#00897B] transition-all duration-300" />
                <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
                <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-8 rounded-2xl bg-[#00897B] hover:bg-[#00796B] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-[#00897B]/25 flex items-center gap-2 transition-all cc-light-swipe"
              >
                <span>পরবর্তী</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: NEW & FEATURED HIGHLIGHTS SCREEN (4 Feature Cards)
           ========================================================================= */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-in fade-in duration-200">
            {/* Top Soft Warm/Mint Dome Area with 4 Glassmorphic Feature Badges */}
            <div className="relative w-full h-[52%] min-h-[300px] bg-gradient-to-b from-[#DCF4EC] via-[#E8F8F2] to-[#F2FAF6] rounded-b-[48%] flex items-center justify-center overflow-hidden shrink-0 shadow-inner px-6">
              {/* Floating Ambient Circles */}
              <div className="absolute top-10 left-8 w-4 h-4 rounded-full bg-[#80CBC4]/50 pointer-events-none" />
              <div className="absolute bottom-16 left-10 w-3 h-3 rounded-full bg-[#80CBC4]/40 pointer-events-none" />
              <div className="absolute top-10 right-10 w-7 h-7 rounded-full bg-[#80CBC4]/40 pointer-events-none" />
              <div className="absolute bottom-20 right-12 w-4 h-4 rounded-full bg-[#80CBC4]/50 pointer-events-none" />

              {/* 4 Floating Glassmorphic Feature Cards */}
              <div className="relative z-10 grid grid-cols-2 gap-3 w-full max-w-[310px]">
                {/* 1. Hadith Book & Quran */}
                <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-md flex items-center gap-2.5 transform -rotate-1 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center icon-3d-badge shrink-0">
                    <BookOpen className="w-5 h-5 relative z-[3]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 leading-tight">২৪+ হাদিস</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">সহিহ সংকলন</p>
                  </div>
                </div>

                {/* 2. Clock & Prayer Schedule */}
                <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-md flex items-center gap-2.5 transform rotate-2 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center icon-3d-badge shrink-0">
                    <Clock className="w-5 h-5 relative z-[3]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 leading-tight">সালাত ওয়াক্ত</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">হানাফী আজান</p>
                  </div>
                </div>

                {/* 3. Muhasaba & Tasbeeh */}
                <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-md flex items-center gap-2.5 transform rotate-1 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center icon-3d-badge shrink-0">
                    <Award className="w-5 h-5 relative z-[3]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 leading-tight">মুহাসাবা স্কোর</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">ডিজিটাল তাসবীহ</p>
                  </div>
                </div>

                {/* 4. Ruqyah & Media Updates */}
                <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-md flex items-center gap-2.5 transform -rotate-2 hover:rotate-0 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center icon-3d-badge shrink-0">
                    <Sparkles className="w-5 h-5 relative z-[3]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 leading-tight">নতুন মিডিয়া</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">ভিডিও ও ফেসবুক</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-2">
              <h2 className="font-noto-serif-bn text-2xl sm:text-[26px] font-extrabold text-[#374151] tracking-tight">
                নতুন ফিচারসমূহ
              </h2>
              <p className="mt-3 text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-xs font-medium">
                অ্যাডভান্সড সার্চ, বুকমার্কস, পিনস, হিফজ ও নোটস, পড়ার প্ল্যান এবং ডেইলি আমল রিমাইন্ডার।
              </p>
            </div>

            {/* Bottom Navigation with 3-Dot Pagination (Step 2 active) */}
            <div className="p-6 pt-2 pb-6 flex items-center justify-between border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
                <div className="w-5 h-2 rounded-full bg-[#00897B] transition-all duration-300" />
                <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-8 rounded-2xl bg-[#00897B] hover:bg-[#00796B] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-[#00897B]/25 flex items-center gap-2 transition-all cc-light-swipe"
              >
                <span>পরবর্তী</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: NOTIFICATION & PERMISSION SETUP (Matches welcome_page_3_313c33e2.jpg)
           ========================================================================= */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-in fade-in duration-200">
            {/* Top Soft Warm Golden Dome Area with 3D Notification Bell */}
            <div className="relative w-full h-[52%] min-h-[300px] bg-gradient-to-b from-[#FFF5CE] via-[#FFF9DD] to-[#FEFDF2] rounded-b-[48%] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {/* Floating Ambient Circles / Dots in warm yellow matching screenshot */}
              <div className="absolute top-10 left-8 w-4 h-4 rounded-full bg-[#F6D06F]/40 pointer-events-none" />
              <div className="absolute top-24 left-16 w-3 h-3 rounded-full bg-[#F6D06F]/50 pointer-events-none" />
              <div className="absolute bottom-16 left-12 w-4 h-4 rounded-full bg-[#F6D06F]/35 pointer-events-none" />
              <div className="absolute top-10 right-12 w-7 h-7 rounded-full bg-[#F6D06F]/40 pointer-events-none" />
              <div className="absolute top-28 right-20 w-5 h-5 rounded-full bg-[#F6D06F]/45 pointer-events-none" />
              <div className="absolute bottom-20 right-14 w-3.5 h-3.5 rounded-full bg-[#F6D06F]/50 pointer-events-none" />
              <div className="absolute bottom-10 right-28 w-2 h-2 rounded-full bg-[#F6D06F]/40 pointer-events-none" />

              {/* Exact Stylized 3D Golden Bell & Orange Notification Badge from Screenshot */}
              <div className="relative z-10 w-44 h-48 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 drop-shadow-xl">
                <svg
                  viewBox="0 0 200 220"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Top Bell Loop */}
                  <rect
                    x="86"
                    y="32"
                    width="28"
                    height="20"
                    rx="10"
                    fill="#F57C00"
                  />

                  {/* Bell Clapper Bottom */}
                  <circle cx="100" cy="172" r="14" fill="#E65100" />

                  {/* Bell Body */}
                  <path
                    d="M100 48C74 48 64 74 62 116C60 144 48 152 46 156C44 160 48 164 56 164H144C152 164 156 160 154 156C152 152 140 144 138 116C136 74 126 48 100 48Z"
                    fill="url(#bell_gradient)"
                  />
                  {/* Bell Highlights */}
                  <path
                    d="M100 52C82 52 74 72 72 112C71 130 65 142 58 154H142C135 142 129 130 128 112C126 72 118 52 100 52Z"
                    fill="#FFE082"
                    opacity="0.3"
                  />

                  {/* Orange Chat/Notification Bubble with 3 White Dots */}
                  <g filter="url(#bubble_shadow)">
                    <circle cx="132" cy="78" r="20" fill="#FF7043" />
                    <circle cx="124" cy="78" r="2.5" fill="white" />
                    <circle cx="132" cy="78" r="2.5" fill="white" />
                    <circle cx="140" cy="78" r="2.5" fill="white" />
                  </g>

                  <defs>
                    <linearGradient
                      id="bell_gradient"
                      x1="60"
                      y1="50"
                      x2="140"
                      y2="164"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#FFD54F" />
                      <stop offset="0.6" stopColor="#FFB300" />
                      <stop offset="1" stopColor="#FFA000" />
                    </linearGradient>
                    <filter id="bubble_shadow" x="108" y="56" width="48" height="48" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-2">
              <h2 className="font-noto-serif-bn text-2xl sm:text-[26px] font-extrabold text-[#374151] tracking-tight">
                গুরুত্বপূর্ণ নোটিশ
              </h2>
              <p className="mt-3 text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-xs font-medium">
                প্রতিদিনের আমল অনুস্মারক, নামাজের ওয়াক্ত এবং প্রতিদিনের গুরুত্বপূর্ণ হাদিস সময়মতো পেতে নোটিফিকেশন চালু রাখুন।
              </p>
            </div>

            {/* Bottom Actions: Pagination on Left & Get Started / Allow Button on Right, plus Skip */}
            <div className="p-6 pt-2 pb-6 border-t border-slate-100 bg-white flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                {/* 3-Dot Pagination (Step 3 active) */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
                  <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
                  <div className="w-5 h-2 rounded-full bg-[#00897B] transition-all duration-300" />
                </div>

                {/* Primary Button */}
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="py-3 px-6 sm:px-7 rounded-2xl bg-[#00897B] hover:bg-[#00796B] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-[#00897B]/25 flex items-center gap-2 transition-all cc-light-swipe"
                >
                  <span>অনুমতি দিন / শুরু করুন</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Secondary Skip Action */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleSkipNotification}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors py-1"
                >
                  পরে করবো (Skip for now)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

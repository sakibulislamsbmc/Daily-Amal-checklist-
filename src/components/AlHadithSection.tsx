import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Menu,
  Sparkles,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  Compass,
  MapPin,
  Calendar,
  Settings,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  X,
  ExternalLink,
  Flame,
  ArrowRight,
  SkipForward,
  CheckCircle2,
  FolderHeart,
  FileText,
  Tag,
  Facebook
} from 'lucide-react';
import {
  HADITH_BOOKS,
  DAILY_HADITH_HERO,
  SAMPLE_HADITHS,
  HADITH_QUIZ_QUESTIONS,
  HADITH_SUBJECTS,
  HadithBook,
  HadithItem,
  HadithQuizQuestion,
} from '../data/hadithData';

interface AlHadithSectionProps {
  onNavigateToWakt: () => void;
}

type HadithViewMode = 'dashboard' | 'reader' | 'quiz_select' | 'quiz_loading' | 'quiz_play' | 'quiz_result' | 'bookmarks' | 'download_manager';

export const AlHadithSection: React.FC<AlHadithSectionProps> = ({ onNavigateToWakt }) => {
  // View states
  const [currentView, setCurrentView] = useState<HadithViewMode>('dashboard');
  const [activeSegment, setActiveSegment] = useState<'online' | 'downloaded'>('online');
  const [isQuickGridExpanded, setIsQuickGridExpanded] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  
  // Selected book & hadiths for reader
  const [selectedBook, setSelectedBook] = useState<HadithBook>(HADITH_BOOKS[0]);
  const [currentHadithIndex, setCurrentHadithIndex] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Bookmarks & local downloads stored in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daily_amol_hadith_bookmarks');
      return saved ? JSON.parse(saved) : ['daily-hero-1'];
    } catch {
      return ['daily-hero-1'];
    }
  });

  const [downloadedBookIds, setDownloadedBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daily_amol_downloaded_books');
      return saved ? JSON.parse(saved) : ['bukhari', 'riyadussaliheen', 'fortynawawi', 'hisnulmuslim'];
    } catch {
      return ['bukhari', 'riyadussaliheen', 'fortynawawi', 'hisnulmuslim'];
    }
  });

  // Reader Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpBookId, setJumpBookId] = useState<string>('bukhari');
  const [jumpHadithNumber, setJumpHadithNumber] = useState<string>('');
  const [showArabic, setShowArabic] = useState(true);
  const [showTashkeel, setShowTashkeel] = useState(true);
  const [arabicFontSize, setArabicFontSize] = useState<number>(24);
  const [banglaFontSize, setBanglaFontSize] = useState<number>(15);
  const [isNightMode, setIsNightMode] = useState(false);

  // Quiz States (Matches Screenshot 2, 3)
  const [quizLevel, setQuizLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(2);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [isOptionSubmitted, setIsOptionSubmitted] = useState<boolean>(false);
  const [quizTimerSeconds, setQuizTimerSeconds] = useState<number>(1);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizLoadingProgress, setQuizLoadingProgress] = useState<number>(0);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daily_amol_hadith_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }, [bookmarkedIds]);

  // Sync downloaded books to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('daily_amol_downloaded_books', JSON.stringify(downloadedBookIds));
    } catch (e) {
      console.warn('Storage quota exceeded', e);
    }
  }, [downloadedBookIds]);

  // Timer for Quiz
  useEffect(() => {
    let interval: any = null;
    if (currentView === 'quiz_play') {
      interval = setInterval(() => {
        setQuizTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView]);

  // Quiz Loading Animation Screen
  useEffect(() => {
    let timeout: any = null;
    if (currentView === 'quiz_loading') {
      setQuizLoadingProgress(15);
      const timer1 = setTimeout(() => setQuizLoadingProgress(60), 400);
      const timer2 = setTimeout(() => {
        setQuizLoadingProgress(100);
        setCurrentView('quiz_play');
        setCurrentQuestionIndex(0);
        setSelectedOptionKey(null);
        setIsOptionSubmitted(false);
        setQuizTimerSeconds(1);
        setQuizScore(0);
      }, 900);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentView]);

  // Filter books based on search and segment
  const displayedBooks = useMemo(() => {
    let list = HADITH_BOOKS;
    if (activeSegment === 'downloaded') {
      list = list.filter((b) => downloadedBookIds.includes(b.id));
    }
    if (bookSearchQuery.trim()) {
      const q = bookSearchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.nameBn.toLowerCase().includes(q) ||
          b.nameEn.toLowerCase().includes(q) ||
          b.authorBn.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeSegment, downloadedBookIds, bookSearchQuery]);

  // Active Hadiths for selected book (reader)
  const currentBookHadiths = useMemo(() => {
    const list = SAMPLE_HADITHS.filter((h) => h.bookId === selectedBook.id);
    return list.length > 0 ? list : [DAILY_HADITH_HERO];
  }, [selectedBook]);

  const activeHadith = currentBookHadiths[currentHadithIndex] || currentBookHadiths[0];

  const handleCopyHadith = (hadith: HadithItem) => {
    const textToCopy = `${hadith.banglaText}\n\n${hadith.arabicText}\n[সূত্র: ${hadith.bookNameBn}, হাদিস: ${hadith.hadithNo}]`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(hadith.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleDownloadBook = (bookId: string) => {
    setDownloadedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSpeakHadith = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startQuizFlow = (level: 'easy' | 'medium' | 'hard', count: number) => {
    setQuizLevel(level);
    setQuizQuestionCount(count);
    setCurrentView('quiz_loading');
  };

  const handleOptionSelect = (optionKey: string) => {
    if (isOptionSubmitted) return;
    setSelectedOptionKey(optionKey);
    setIsOptionSubmitted(true);
    
    const activeQ = HADITH_QUIZ_QUESTIONS[currentQuestionIndex % HADITH_QUIZ_QUESTIONS.length];
    if (optionKey === activeQ.correctKey) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex + 1 < quizQuestionCount) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionKey(null);
      setIsOptionSubmitted(false);
    } else {
      setCurrentView('quiz_result');
    }
  };

  const handleJumpToHadith = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = HADITH_BOOKS.find((b) => b.id === jumpBookId) || HADITH_BOOKS[0];
    setSelectedBook(targetBook);
    setCurrentHadithIndex(0);
    setIsJumpModalOpen(false);
    setCurrentView('reader');
  };

  // Convert numbers to Bengali format
  const toBanglaNum = (num: number | string): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
  };

  // Format timer as ০০:০৯
  const formatTimerBn = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${toBanglaNum(pad(mins))}:${toBanglaNum(pad(secs))}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* =========================================================================
          VIEW 1: MAIN HADITH DASHBOARD (Home View)
         ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="space-y-4">
          {/* Top Green App Bar (Matches Screenshot Header) */}
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                title="মেনু ও সেটিংস"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-black tracking-tight font-anek-bangla">আল হাদিস</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('bookmarks')}
                className="p-2 rounded-full hover:bg-white/10 transition-all text-emerald-100"
                title="সংরক্ষিত হাদিস ও বুকমার্ক"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const searchElem = document.getElementById('hadith-book-search-input');
                  if (searchElem) searchElem.focus();
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
                title="সার্চ করুন"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Daily Hadith Hero Card with Mosque Silhouette Gradient */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#042f2e] text-white p-5 shadow-xl border border-teal-600/30">
            {/* Mosque Silhouette SVG Decoration in Background */}
            <svg
              className="absolute right-0 bottom-0 opacity-15 pointer-events-none w-48 h-32"
              viewBox="0 0 200 120"
              fill="currentColor"
            >
              <path d="M100,20 C100,20 85,45 85,60 L85,120 L115,120 L115,60 C115,45 100,20 100,20 Z" />
              <path d="M40,50 C40,50 30,65 30,75 L30,120 L50,120 L50,75 C50,65 40,50 40,50 Z" />
              <path d="M160,50 C160,50 150,65 150,75 L150,120 L170,120 L170,75 C170,65 160,50 160,50 Z" />
              <circle cx="100" cy="15" r="4" />
              <circle cx="40" cy="46" r="3" />
              <circle cx="160" cy="46" r="3" />
            </svg>

            {/* Header Badge */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-teal-100 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>আজকের হাদিস</span>
              </div>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-200">
                [{DAILY_HADITH_HERO.bookNameBn}: {toBanglaNum(DAILY_HADITH_HERO.hadithNo)}]
              </span>
            </div>

            {/* Hadith Quote Content */}
            <div className="relative z-10 space-y-2.5">
              <p className="text-xs text-teal-100 font-medium tracking-wide">
                বর্ণনাকারী: {DAILY_HADITH_HERO.narratorBn}
              </p>

              <blockquote className="text-[13px] sm:text-sm font-semibold leading-relaxed text-white drop-shadow-sm font-anek-bangla">
                “{DAILY_HADITH_HERO.banglaText}”
              </blockquote>
            </div>

            {/* Action Buttons Row */}
            <div className="mt-4 pt-3 border-t border-teal-500/30 flex items-center justify-between text-xs relative z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeakHadith(DAILY_HADITH_HERO.banglaText)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
                  title="অডিও শুনুন"
                >
                  {isPlayingAudio ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopyHadith(DAILY_HADITH_HERO)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all flex items-center gap-1"
                  title="কপি করুন"
                >
                  {copiedId === DAILY_HADITH_HERO.id ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleToggleBookmark(DAILY_HADITH_HERO.id)}
                  className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all ${
                    bookmarkedIds.includes(DAILY_HADITH_HERO.id) ? 'text-amber-300 font-bold' : 'text-white'
                  }`}
                  title="বুকমার্ক করুন"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(DAILY_HADITH_HERO.id) ? 'fill-amber-300' : ''}`} />
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedBook(HADITH_BOOKS[0]);
                  setCurrentHadithIndex(0);
                  setCurrentView('reader');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-black text-xs shadow-md transition-all flex items-center gap-1 active:scale-95"
              >
                <span>সম্পূর্ণ পড়ুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Collapsible 4-Column Quick Action Grid (All 3D Tactile Icons) */}
          <div className="p-3.5 rounded-3xl bg-white border border-slate-100 shadow-md">
            <div className="grid grid-cols-4 gap-2.5">
              {/* Row 1 */}
              <button
                onClick={() => {
                  setSelectedBook(HADITH_BOOKS[0]);
                  setCurrentView('reader');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-700 text-white shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  সর্বশেষ
                </span>
              </button>

              <button
                onClick={() => setIsJumpModalOpen(true)}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 text-white shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  জাম্প
                </span>
              </button>

              {/* ওয়াক্ত (Wakt shortcut - seamlessly jumps to Muhasaba prayer times) */}
              <button
                onClick={onNavigateToWakt}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
                title="মুহাসাবা ওয়াক্ত সময়সূচী খুলুন"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 text-white shadow-md shadow-orange-600/30 group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  ওয়াক্ত
                </span>
              </button>

              <button
                onClick={() => {
                  alert('সাদাকা ট্র্যাকার: আজ কোনো মুসলিম ভাইয়ের দিকে তাকিয়ে মুচকি হাসুন অথবা সামান্য কিছু দান করুন। এটিই আপনার দিনের প্রথম সাদাকা!');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-rose-400 via-pink-500 to-rose-700 text-white shadow-md shadow-rose-600/30 group-hover:scale-110 transition-transform">
                  <FolderHeart className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  সাদাকা
                </span>
              </button>

              {/* Row 2 */}
              <button
                onClick={() => {
                  setSelectedBook(HADITH_BOOKS[1]);
                  setCurrentView('reader');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-700 text-white shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  ফিড
                </span>
              </button>

              <button
                onClick={() => {
                  alert('শর্টস ও রিলস: ৬০ সেকেন্ডের নির্বাচিত হাদিসের ভিডিও ও সারসংক্ষেপ শীঘ্রই আসছে!');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-fuchsia-400 via-purple-500 to-purple-800 text-white shadow-md shadow-purple-600/30 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-white stroke-[2.4] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  রিলস
                </span>
              </button>

              {/* কুইজ (Matches Screenshots 2 & 3 flow) */}
              <button
                onClick={() => setCurrentView('quiz_select')}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-emerald-50 transition-all active:scale-95 group relative"
              >
                <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600 border border-white"></span>
                </span>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-800 text-white shadow-md shadow-emerald-700/35 ring-2 ring-emerald-400/40 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-black text-emerald-800 mt-2 tracking-tight font-anek-bangla">
                  কুইজ
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedBook(HADITH_BOOKS[7]); // Riyadus Saliheen
                  setCurrentView('reader');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 text-white shadow-md shadow-orange-600/30 group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5 fill-white/20 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight group-hover:text-teal-700 transition-colors font-anek-bangla">
                  ফ্ল্যাশকার্ড
                </span>
              </button>

              {/* Expandable Rows */}
              {isQuickGridExpanded && (
                <>
                  <button
                    onClick={() => alert('পড়ার প্ল্যান: দৈনিক ৩টি হাদিস পড়ার ৩০ দিনের হিফজ ও তাদাব্বুর রুটিন।')}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-teal-400 via-teal-600 to-cyan-800 text-white shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight font-anek-bangla">
                      পরিকল্পনা
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      alert('তাহকিক: প্রতিটি হাদিসের সনদ, রাবীদের বিবরণ ও আলবানী/দারুদ্দাওয়াহ তাহকিক যাচাই করুন।');
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 text-white shadow-md shadow-sky-600/30 group-hover:scale-110 transition-transform">
                      <Tag className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight font-anek-bangla">
                      তাহকিক
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedBook(HADITH_BOOKS[20]); // Hisnul Muslim
                      setCurrentView('reader');
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-lime-400 via-emerald-500 to-green-700 text-white shadow-md shadow-green-600/30 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight font-anek-bangla">
                      দৈনিক
                    </span>
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800 text-white shadow-md shadow-slate-700/30 group-hover:scale-110 transition-transform">
                      <Sliders className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)] relative z-[3]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 mt-2 tracking-tight font-anek-bangla">
                      অপশন
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Toggle Expand Button */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-center">
              <button
                onClick={() => setIsQuickGridExpanded(!isQuickGridExpanded)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <span>{isQuickGridExpanded ? 'সংক্ষেপ করুন' : 'সবগুলো অপশন দেখুন'}</span>
                {isQuickGridExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Segmented Filter Switch: 'অনলাইনে আছে' vs 'ডাউনলোড করা' */}
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => setActiveSegment('online')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'online'
                  ? 'bg-[#0D9488] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              অনলাইনে আছে
            </button>
            <button
              onClick={() => setActiveSegment('downloaded')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSegment === 'downloaded'
                  ? 'bg-[#0D9488] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ডাউনলোড করা ({toBanglaNum(downloadedBookIds.length)})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="hadith-book-search-input"
              type="text"
              value={bookSearchQuery}
              onChange={(e) => setBookSearchQuery(e.target.value)}
              placeholder="হাদিসের কিতাব অথবা লেখক খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0D9488] shadow-xs"
            />
          </div>

          {/* Offline Download Manager Card & Facebook Community when Downloaded tab is active */}
          {activeSegment === 'downloaded' && (
            <div className="p-4 rounded-3xl bg-teal-50/60 border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-600 to-emerald-800 text-white icon-3d-badge cc-light-swipe flex items-center justify-center shadow-md shadow-teal-700/25 shrink-0">
                    <Download className="w-5 h-5 stroke-[2.6] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] relative z-[3]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-teal-900">অফলাইন হাদিস ভাণ্ডার</h3>
                    <p className="text-[11px] text-teal-700 font-medium">কোনো ইন্টারনেট ছাড়াই পড়ুন</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('download_manager')}
                  className="px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  ডাউনলোড ম্যানেজার
                </button>
              </div>

              {/* 3 bullet feature cards matching screenshot requirements */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-white/80 border border-teal-100 flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>ইন্টারনেট সংযোগ ছাড়াই সিহাহ সিত্তাহ সহ গুরুত্বপূর্ণ কিতাবের পূর্ণ হাদিস পাঠ।</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-teal-100 flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>তাত্ক্ষণিক আরবী ও বাংলা সার্চ, প্রিয় বুকমার্কস অফলাইনে সিঙ্ক থাকবে।</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 border border-teal-100 flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>অফলাইনে কুইজ খেলা ও আত্মশুদ্ধি পরীক্ষার সুযোগ।</span>
                </div>
              </div>

              {/* Facebook Group Community Engagement Card */}
              <div className="mt-2 p-3 rounded-2xl bg-white border border-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white icon-3d-badge cc-light-swipe flex items-center justify-center shadow-md shadow-blue-700/30 shrink-0">
                    <Facebook className="w-5 h-5 fill-white stroke-[2] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)] relative z-[3]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">ফেসবুক কমিউনিটি পেজ</p>
                    <p className="text-[10px] text-slate-500 font-medium">facebook.com/dailyamolchecklist</p>
                  </div>
                </div>
                <a
                  href="https://facebook.com/dailyamolchecklist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold flex items-center gap-1"
                >
                  <span>যুক্ত হোন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Hadith Books List (25+ books with Hexagonal Initial Badge) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold text-slate-800">
                {activeSegment === 'online' ? 'হাদিসের কিতাবসমূহ' : 'ডাউনলোডকৃত কিতাবসমূহ'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                {toBanglaNum(displayedBooks.length)} টি কিতাব
              </span>
            </div>

            {displayedBooks.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold text-slate-700">কোনো কিতাব পাওয়া যায়নি</p>
                <p className="text-[11px] text-slate-500">
                  ডাউনলোড ম্যানেজার থেকে কিতাব অফলাইনে সংরক্ষণ করুন।
                </p>
                <button
                  onClick={() => setCurrentView('download_manager')}
                  className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold shadow-md"
                >
                  ডাউনলোড ম্যানেজার খুলুন
                </button>
              </div>
            ) : (
              displayedBooks.map((book) => {
                const isDownloaded = downloadedBookIds.includes(book.id);
                return (
                  <div
                    key={book.id}
                    onClick={() => {
                      setSelectedBook(book);
                      setCurrentHadithIndex(0);
                      setCurrentView('reader');
                    }}
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Hexagonal Colored Initial Badge (Matches Screenshot) */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm icon-3d-badge cc-light-swipe shadow-md ${book.badgeBg} ${book.badgeText} group-hover:scale-110 transition-transform`}
                      >
                        <span className="relative z-[3] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)]">{book.initial}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#0D9488] transition-colors">
                            {book.nameBn}
                          </h3>
                          {isDownloaded && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 font-bold">
                              অফলাইন
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {book.authorBn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                        {toBanglaNum(book.totalHadith)}টি হাদিস
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HADITH QUIZ LEVEL SELECTION (Matches User Screenshot 3)
         ========================================================================= */}
      {currentView === 'quiz_select' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-white">সহীহ বুখারী</h2>
                <p className="text-[11px] text-teal-100 font-medium">ঈমান অধ্যায় • কুইজ</p>
              </div>
            </div>
          </div>

          {/* Card Container (Exact replication of Screenshot 3) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">লেভেল বেছে নিন</h3>
            </div>

            <div className="space-y-3">
              {/* Easy level - 2 questions (Matches Screenshot 3) */}
              <div
                onClick={() => setQuizLevel('easy')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  quizLevel === 'easy'
                    ? 'border-[#0D9488] bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-teal-800 text-white icon-3d-badge cc-light-swipe flex items-center justify-center font-black shadow-md shadow-teal-600/30">
                    <span className="text-base relative z-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">📊</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">সহজ</h4>
                    <p className="text-[11px] text-slate-500 font-medium">মোট ২টি প্রশ্ন</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    quizLevel === 'easy'
                      ? 'border-[#0D9488] bg-[#0D9488] text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {quizLevel === 'easy' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Medium level - 10 questions */}
              <div
                onClick={() => setQuizLevel('medium')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  quizLevel === 'medium'
                    ? 'border-[#0D9488] bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 text-white icon-3d-badge cc-light-swipe flex items-center justify-center font-black shadow-md shadow-orange-600/30">
                    <span className="text-base relative z-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">⚡</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">মাঝারি</h4>
                    <p className="text-[11px] text-slate-500 font-medium">মোট ১০টি প্রশ্ন</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    quizLevel === 'medium'
                      ? 'border-[#0D9488] bg-[#0D9488] text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {quizLevel === 'medium' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Hard level - 20 questions */}
              <div
                onClick={() => setQuizLevel('hard')}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  quizLevel === 'hard'
                    ? 'border-[#0D9488] bg-teal-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-700 text-white icon-3d-badge cc-light-swipe flex items-center justify-center font-black shadow-md shadow-rose-600/30">
                    <span className="text-base relative z-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">🔥</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">কঠিন</h4>
                    <p className="text-[11px] text-slate-500 font-medium">মোট ২০টি প্রশ্ন</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    quizLevel === 'hard'
                      ? 'border-[#0D9488] bg-[#0D9488] text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {quizLevel === 'hard' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Start Quiz Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const count = quizLevel === 'easy' ? 2 : quizLevel === 'medium' ? 10 : 20;
                  startQuizFlow(quizLevel, count);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#0D9488] hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>কুইজ শুরু করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: QUIZ LOADING / GENERATOR ANIMATION SCREEN
         ========================================================================= */}
      {currentView === 'quiz_loading' && (
        <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-md space-y-5 my-8 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center border border-teal-200 animate-bounce">
            <HelpCircle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900">প্রশ্ন সাজানো হচ্ছে...</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              সহীহ হাদিসের আলোকে কুইজ প্রস্তুত হচ্ছে
            </p>
          </div>

          {/* Linear Progress Indicator */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#0D9488] h-full rounded-full transition-all duration-300"
              style={{ width: `${quizLoadingProgress}%` }}
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
            💡 টিপস: হাদিসের প্রতিটি প্রশ্নের সমাধান শেষে সহিহ সনদের সূত্র বিস্তারিত দেখতে পাবেন।
          </div>

          <button
            onClick={() => setCurrentView('quiz_select')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            বাতিল করুন
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: INTERACTIVE QUIZ PLAYER (Exact Match to User Screenshot 2)
         ========================================================================= */}
      {currentView === 'quiz_play' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header App Bar (Screenshot 2) */}
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('quiz_select')}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-white">সহীহ বুখারী</h2>
                <p className="text-[11px] text-teal-100 font-medium">ঈমান • সহজ</p>
              </div>
            </div>

            {/* Timer Badge: ⏱ ০০:০১ (Matches Screenshot 2) */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-teal-800/80 text-teal-100 text-xs font-bold border border-teal-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimerBn(quizTimerSeconds)}</span>
            </div>
          </div>

          {/* Question Subheader: "প্রশ্ন ১ / ২" & "স্কিপ ⏭" (Screenshot 2) */}
          <div className="px-1 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              প্রশ্ন {toBanglaNum(currentQuestionIndex + 1)} / {toBanglaNum(quizQuestionCount)}
            </span>
            <button
              onClick={handleNextQuizQuestion}
              className="inline-flex items-center gap-1 text-xs font-black text-[#0D9488] hover:text-teal-800 transition-colors"
            >
              <span>স্কিপ</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Linear Progress Bar (Screenshot 2) */}
          <div className="w-full bg-teal-100/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0D9488] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quizQuestionCount) * 100}%`,
              }}
            />
          </div>

          {/* Question Card Box (Screenshot 2) */}
          {(() => {
            const currentQ =
              HADITH_QUIZ_QUESTIONS[currentQuestionIndex % HADITH_QUIZ_QUESTIONS.length];
            return (
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-relaxed font-anek-bangla">
                  {currentQ.question}
                </h3>

                {/* 4 Option Tiles (ক, খ, গ, ঘ) */}
                <div className="space-y-2.5">
                  {currentQ.options.map((option) => {
                    const isSelected = selectedOptionKey === option.key;
                    const isCorrect = option.key === currentQ.correctKey;
                    
                    let tileClass = 'border-slate-200 bg-white text-slate-800 hover:border-slate-300';
                    let badgeClass = 'bg-slate-100 text-slate-700';

                    if (isOptionSubmitted) {
                      if (isCorrect) {
                        tileClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black';
                        badgeClass = 'bg-emerald-600 text-white';
                      } else if (isSelected && !isCorrect) {
                        tileClass = 'border-rose-400 bg-rose-50 text-rose-950';
                        badgeClass = 'bg-rose-500 text-white';
                      }
                    } else if (isSelected) {
                      tileClass = 'border-[#0D9488] bg-teal-50 text-teal-950';
                      badgeClass = 'bg-[#0D9488] text-white';
                    }

                    return (
                      <div
                        key={option.key}
                        onClick={() => handleOptionSelect(option.key)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${tileClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${badgeClass}`}
                          >
                            {option.key}
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{option.text}</span>
                        </div>

                        {isOptionSubmitted && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Card & Source Reference (Shown after selection) */}
                {isOptionSubmitted && (
                  <div className="mt-4 p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-900">
                        {selectedOptionKey === currentQ.correctKey ? '✅ সঠিক উত্তর!' : '❌ সঠিক উত্তর দেখুন:'}
                      </span>
                      <span className="text-[11px] font-bold text-[#0D9488]">
                        📖 সূত্র: {currentQ.sourceReference}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {currentQ.explanation}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={handleNextQuizQuestion}
                        className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-all"
                      >
                        {currentQuestionIndex + 1 < quizQuestionCount ? 'পরবর্তী প্রশ্ন →' : 'কুইজের ফলাফল দেখুন →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          VIEW 5: QUIZ RESULT SCREEN
         ========================================================================= */}
      {currentView === 'quiz_result' && (
        <div className="p-6 text-center rounded-3xl bg-white border border-slate-200 shadow-lg space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">মাশাআল্লাহ! কুইজ সম্পন্ন</h3>
            <p className="text-xs text-slate-500 font-medium">
              সহীহ বুখারী • ঈমান অধ্যায়
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100">
              <p className="text-2xl font-black text-[#0D9488]">{toBanglaNum(quizScore)}</p>
              <p className="text-[11px] font-bold text-teal-800">সঠিক উত্তর</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-2xl font-black text-slate-800">{toBanglaNum(quizQuestionCount)}</p>
              <p className="text-[11px] font-bold text-slate-600">মোট প্রশ্ন</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => startQuizFlow(quizLevel, quizQuestionCount)}
              className="w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>আবার খেলুন</span>
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all"
            >
              মূল ড্যাশবোর্ডে ফিরুন
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 6: HADITH READER VIEW
         ========================================================================= */}
      {currentView === 'reader' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Reader Top Bar */}
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-sm font-extrabold text-white">{selectedBook.nameBn}</h2>
                <p className="text-[10px] text-teal-100 font-medium">
                  {activeHadith.chapterNameBn} • হাদিস {toBanglaNum(activeHadith.hadithNo)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsJumpModalOpen(true)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-all text-xs font-bold"
                title="হাদিসে জাম্প করুন"
              >
                জাম্প
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-all"
                title="টেক্সট ও ফন্ট অপশন"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hadith Content Card */}
          <div
            className={`p-5 rounded-3xl border shadow-md space-y-4 transition-all ${
              isNightMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {/* Tag & Verification Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[10px]">
                  হাদিস: {toBanglaNum(activeHadith.hadithNo)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  মান: {activeHadith.tahqiq}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-slate-400">
                {activeHadith.subject}
              </span>
            </div>

            {/* Arabic Script with Tashkeel */}
            {showArabic && (
              <div
                dir="rtl"
                style={{ fontSize: `${arabicFontSize}px` }}
                className="font-serif leading-[2.2] tracking-wide text-right text-emerald-950 dark:text-emerald-100 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800"
              >
                {activeHadith.arabicText}
              </div>
            )}

            {/* Bengali Translation */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500">
                বর্ণনাকারী: {activeHadith.narratorBn}
              </p>
              <p
                style={{ fontSize: `${banglaFontSize}px` }}
                className="leading-relaxed font-anek-bangla font-semibold text-slate-800 dark:text-slate-100"
              >
                {activeHadith.banglaText}
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSpeakHadith(activeHadith.banglaText)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-all"
                  title="অডিও শুনুন"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCopyHadith(activeHadith)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-all"
                  title="কপি করুন"
                >
                  {copiedId === activeHadith.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleToggleBookmark(activeHadith.id)}
                  className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all ${
                    bookmarkedIds.includes(activeHadith.id)
                      ? 'text-amber-500 font-bold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                  title="বুকমার্ক করুন"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarkedIds.includes(activeHadith.id) ? 'fill-amber-500' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Prev / Next Hadith pagination */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentHadithIndex <= 0}
                  onClick={() => setCurrentHadithIndex((p) => p - 1)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-bold"
                >
                  পূর্ববর্তী
                </button>
                <button
                  disabled={currentHadithIndex >= currentBookHadiths.length - 1}
                  onClick={() => setCurrentHadithIndex((p) => p + 1)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 7: BOOKMARKS / COLLECTION MANAGER
         ========================================================================= */}
      {currentView === 'bookmarks' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-white">সংরক্ষিত হাদিস</h2>
                <p className="text-[11px] text-teal-100 font-medium">বুকমার্কস ও প্রিয় সংকলন</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {SAMPLE_HADITHS.filter((h) => bookmarkedIds.includes(h.id)).map((hadith) => (
              <div
                key={hadith.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800">
                    {hadith.bookNameBn} • হাদিস {toBanglaNum(hadith.hadithNo)}
                  </span>
                  <button
                    onClick={() => handleToggleBookmark(hadith.id)}
                    className="text-amber-500 hover:text-amber-600"
                  >
                    <Bookmark className="w-4 h-4 fill-amber-500" />
                  </button>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed font-anek-bangla">
                  {hadith.banglaText}
                </p>
              </div>
            ))}

            {bookmarkedIds.length === 0 && (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">কোনো বুকমার্ক সংরক্ষিত নেই</p>
                <p className="text-[11px] text-slate-500">
                  হাদিস পড়ার সময় বুকমার্ক আইকনে ট্যাপ করে সংরক্ষণ করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 8: DOWNLOAD MANAGER MODAL / VIEW
         ========================================================================= */}
      {currentView === 'download_manager' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[#0D9488] -mx-4 -mt-2 px-4 py-3 rounded-b-3xl shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-white">ডাউনলোড ম্যানেজার</h2>
                <p className="text-[11px] text-teal-100 font-medium">অফলাইনে ব্যবহারের জন্য কিতাব সেভ করুন</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {HADITH_BOOKS.map((book) => {
              const isDownloaded = downloadedBookIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs icon-3d-badge cc-light-swipe shadow-md ${book.badgeBg} ${book.badgeText}`}
                    >
                      <span className="relative z-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{book.initial}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{book.nameBn}</h4>
                      <p className="text-[10px] text-slate-500">
                        {toBanglaNum(book.totalHadith)}টি হাদিস • সাইজ: {book.downloadSize}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDownloadBook(book.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                      isDownloaded
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-[#0D9488] text-white hover:bg-teal-700 shadow-xs'
                    }`}
                  >
                    {isDownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>ডাউনলোড</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: JUMP TO HADITH
         ========================================================================= */}
      {isJumpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">হাদিসে জাম্প করুন</h3>
              <button
                onClick={() => setIsJumpModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJumpToHadith} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">কিতাব নির্বাচন</label>
                <select
                  value={jumpBookId}
                  onChange={(e) => setJumpBookId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  {HADITH_BOOKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameBn} ({toBanglaNum(b.totalHadith)}টি হাদিস)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">হাদিস নম্বর</label>
                <input
                  type="number"
                  min="1"
                  placeholder="যেমন: ১, ৮, ১২..."
                  value={jumpHadithNumber}
                  onChange={(e) => setJumpHadithNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
                >
                  হাদিসে যান →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL / BOTTOM SHEET: HADITH READER SETTINGS
         ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-black text-slate-900">হাদিস পাঠ সেটিংস</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arabic Visibility Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-bold text-slate-800">আরবি টেক্সট প্রদর্শন</p>
                <p className="text-[10px] text-slate-500">মূল আরবি এবারত চালু বা বন্ধ রাখুন</p>
              </div>
              <input
                type="checkbox"
                checked={showArabic}
                onChange={(e) => setShowArabic(e.target.checked)}
                className="w-4 h-4 accent-[#0D9488] rounded"
              />
            </div>

            {/* Tashkeel Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-bold text-slate-800">হরকত / তাশকীল</p>
                <p className="text-[10px] text-slate-500">যবর, যের, পেশ ইত্যাদি স্পষ্ট হরকত</p>
              </div>
              <input
                type="checkbox"
                checked={showTashkeel}
                onChange={(e) => setShowTashkeel(e.target.checked)}
                className="w-4 h-4 accent-[#0D9488] rounded"
              />
            </div>

            {/* Night mode toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-bold text-slate-800">ডার্ক / নাইট মোড</p>
                <p className="text-[10px] text-slate-500">রাতের বেলায় চোখের সুরক্ষায় ডার্ক ব্যাকগ্রাউন্ড</p>
              </div>
              <input
                type="checkbox"
                checked={isNightMode}
                onChange={(e) => setIsNightMode(e.target.checked)}
                className="w-4 h-4 accent-[#0D9488] rounded"
              />
            </div>

            {/* Arabic Font Size Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>আরবি ফন্ট সাইজ</span>
                <span className="text-[#0D9488]">{arabicFontSize}px</span>
              </div>
              <input
                type="range"
                min="18"
                max="36"
                value={arabicFontSize}
                onChange={(e) => setArabicFontSize(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            {/* Bangla Font Size Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>বাংলা ফন্ট সাইজ</span>
                <span className="text-[#0D9488]">{banglaFontSize}px</span>
              </div>
              <input
                type="range"
                min="13"
                max="24"
                value={banglaFontSize}
                onChange={(e) => setBanglaFontSize(Number(e.target.value))}
                className="w-full accent-[#0D9488]"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Megaphone, ExternalLink, Eye, Info, Sparkles } from 'lucide-react';

interface BannerAd {
  id: string;
  imageUrl: string;
  titleBn: string;
  categoryBn: string;
  sponsorBn: string;
  linkTextBn: string;
  fallbackGradient: string;
}

const BANNER_ADS: BannerAd[] = [
  {
    id: 'ad-1',
    imageUrl: 'https://kommodo.ai/i/dmvJ474JrkUbhf0bqKEt',
    titleBn: 'আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ও ইসলামিক সম্মেলন ঘোষণা',
    categoryBn: 'দ্বীনি কার্যক্রম ও ইভেন্ট',
    sponsorBn: 'আস-সুন্নাহ ও ইসলামিক ইনিশিয়েটিভ',
    linkTextBn: 'বিস্তারিত দেখুন',
    fallbackGradient: 'from-emerald-900 via-teal-900 to-slate-900',
  },
  {
    id: 'ad-2',
    imageUrl: 'https://kommodo.ai/i/qp7Wsq0ZxXyZxT4BALhr',
    titleBn: 'বিসমাহসফট - প্রিমিয়াম ওয়েব ও মোবাইল অ্যাপ ডেভেলপমেন্ট',
    categoryBn: 'প্রযুক্তি ও ডিজিটাল সেবা',
    sponsorBn: 'Bismahsoft • Smart Tech for Ummah',
    linkTextBn: 'যোগাযোগ করুন',
    fallbackGradient: 'from-indigo-950 via-slate-900 to-emerald-950',
  },
  {
    id: 'ad-3',
    imageUrl: 'https://kommodo.ai/i/FA8BOFSf9EdVOD34AJEK',
    titleBn: 'কুরআন তিলাওয়াত ও বিশুদ্ধ হিফজ প্রতিযোগিতা ঘোষণা',
    categoryBn: 'ইসলামিক শিক্ষা ও প্রতিযোগিতা',
    sponsorBn: 'আল-কুরআন একাডেমি বাংলাদেশ',
    linkTextBn: 'অংশগ্রহণ করুন',
    fallbackGradient: 'from-amber-950 via-emerald-950 to-slate-900',
  },
];

export const BannerAdsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll banners every 5.5s unless paused
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_ADS.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_ADS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_ADS.length) % BANNER_ADS.length);
  };

  const currentBanner = BANNER_ADS[currentIndex];

  return (
    <div 
      className="w-full my-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
            <Megaphone className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-slate-700">ঘোষণা ও বিশেষ বিজ্ঞাপন</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">
            {currentIndex + 1}/{BANNER_ADS.length}
          </span>
        </div>

        {/* Carousel indicator controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
            title="পূর্ববর্তী ব্যানার"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 px-1">
            {BANNER_ADS.map((ad, idx) => (
              <button
                key={ad.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-300'
                }`}
                title={`ব্যানার ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="p-1 rounded-full hover:bg-slate-200/70 text-slate-600 transition-colors"
            title="পরবর্তী ব্যানার"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Banner Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-md group">
        
        {/* Banner Slide Render */}
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          {!imageErrors[currentBanner.id] ? (
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.titleBn}
              onError={() => setImageErrors((prev) => ({ ...prev, [currentBanner.id]: true }))}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            /* Fallback sleek card if image link is temporarily unreachable */
            <div className={`w-full h-full bg-gradient-to-br ${currentBanner.fallbackGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold text-emerald-300">
                  {currentBanner.categoryBn}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {currentBanner.sponsorBn}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">
                  {currentBanner.titleBn}
                </h4>
              </div>
            </div>
          )}

          {/* Frosted Bottom Gradient Overlay with details & View Button */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-6 flex items-end justify-between">
            <div className="max-w-[75%]">
              <span className="text-[9px] font-bold tracking-wide uppercase text-emerald-400 block drop-shadow-sm">
                {currentBanner.sponsorBn}
              </span>
              <p className="text-[11px] font-semibold text-white truncate drop-shadow-sm">
                {currentBanner.titleBn}
              </p>
            </div>

            <button
              onClick={() => setPreviewImage(currentBanner.imageUrl)}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cc-light-swipe"
              title="ব্যানার বড় করে দেখুন"
            >
              <Eye className="w-3 h-3" />
              <span>দেখুন</span>
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Banner Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-3 border border-slate-700 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                ঘোষণা ব্যানার
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>

            <div className="w-full overflow-hidden rounded-2xl bg-black">
              <img
                src={previewImage}
                alt="Banner Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="w-full mt-3 flex items-center justify-between px-1">
              <p className="text-[11px] text-slate-400 font-medium">
                সংগঠন ও উদ্যোগের বিশেষ ঘোষণা
              </p>
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                মূল লিংক <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Volume2, ChevronRight, X, Sparkles } from 'lucide-react';

interface NotificationMessage {
  id: string;
  tag: string;
  text: string;
  linkText?: string;
  onAction?: () => void;
}

interface ScrollingNotificationBarProps {
  onOpenDeveloper?: () => void;
  onOpenInstall?: () => void;
  onOpenCalendarSync?: () => void;
}

export const ScrollingNotificationBar: React.FC<ScrollingNotificationBarProps> = ({
  onOpenDeveloper,
  onOpenInstall,
  onOpenCalendarSync,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  if (isDismissed) return null;

  const announcements = [
    {
      id: '1',
      tag: 'ঘোষণা',
      text: 'দৈনিক আমল চেকলিস্টে স্বাগতম! প্রতিদিনের ফরজ, ওয়াজিব ও সুন্নাত আমলের নিখুঁত মুহাসাবা করুন।',
    },
    {
      id: '2',
      tag: 'মোবাইল অ্যাপ',
      text: 'অ্যাপ হিসেবে ফোনে ইনস্টল করতে "মোবাইল অ্যাপ ইনস্টল" বাটনে ক্লিক করুন — অফলাইনেও চলবে!',
      action: onOpenInstall,
      actionText: 'ইনস্টল করুন',
    },
    {
      id: '3',
      tag: 'ক্যালেন্ডার সিঙ্ক',
      text: 'বাংলাদেশ সময় ও হানাফী ওয়াক্ত অনুযায়ী সকল সালাতের শিডিউল গুগল ক্যালেন্ডারে যুক্ত করুন।',
      action: onOpenCalendarSync,
      actionText: 'সিঙ্ক করুন',
    },
    {
      id: '4',
      tag: 'হাদিস শরিফ',
      text: '“যে ব্যক্তি সৎকাজের পথ দেখায়, সে তার সম্পাদনকারীর অনুরূপ সওয়াব পাবে।” — সহীহ মুসলিম: ১৮৯৩',
    },
    {
      id: '5',
      tag: 'ডেভেলপার',
      text: 'অ্যাপ ডেভেলপার সাকিবুল ইসলাম সাব্বির (Founder & CEO, Bismahsoft) এর প্রোফাইল ও বিস্তারিত দেখতে ক্লিক করুন।',
      action: onOpenDeveloper,
      actionText: 'প্রোফাইল দেখুন',
    },
  ];

  return (
    <div 
      className="relative z-30 w-full overflow-hidden bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-teal-950/90 border-b border-emerald-500/20 backdrop-blur-md shadow-inner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="flex items-center h-8 px-2">
        {/* Left Badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold z-10 mr-2 shadow-sm">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="tracking-wide">বিজ্ঞপ্তি</span>
        </div>

        {/* Marquee Container */}
        <div className="flex-1 overflow-hidden relative whitespace-nowrap">
          <div
            className={`inline-flex items-center gap-8 text-[11px] font-medium text-emerald-100 ${
              isPaused ? 'cursor-pointer' : ''
            }`}
            style={{
              display: 'inline-flex',
              animation: 'marqueeScroll 38s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {announcements.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-800/60 text-emerald-300 text-[9px] font-bold">
                  {item.tag}
                </span>
                <span className="text-slate-200">{item.text}</span>
                {item.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action?.();
                    }}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-[9px] font-bold underline transition-colors"
                  >
                    {item.actionText}
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
                <span className="text-emerald-500/40 select-none">•</span>
              </div>
            ))}

            {/* Duplicate set for smooth continuous seamless marquee loop */}
            {announcements.map((item) => (
              <div key={`dup-${item.id}`} className="inline-flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-800/60 text-emerald-300 text-[9px] font-bold">
                  {item.tag}
                </span>
                <span className="text-slate-200">{item.text}</span>
                {item.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action?.();
                    }}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-[9px] font-bold underline transition-colors"
                  >
                    {item.actionText}
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
                <span className="text-emerald-500/40 select-none">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="shrink-0 ml-2 p-1 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-full transition-colors z-10"
          title="বিজ্ঞপ্তি বন্ধ করুন"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

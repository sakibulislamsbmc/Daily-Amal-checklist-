import React, { useState, useMemo } from 'react';
import { ChevronRight, X, Sparkles, BookOpen, Search, HeartHandshake, HelpCircle } from 'lucide-react';
import { AS_SUNNAH_ACTIVITIES, SHAYKH_AHMADULLAH_100_QA } from '../data/noticeBoardData';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'qa' | 'assunnah'>('qa');
  const [searchQuery, setSearchQuery] = useState('');

  const allNoticeItems = useMemo(() => {
    const coreAnnouncements = [
      {
        id: 'core-1',
        tag: 'ঘোষণা',
        text: 'দৈনিক আমল চেকলিস্টে স্বাগতম! প্রতিদিনের ফরজ, ওয়াজিব ও সুন্নাত আমলের নিখুঁত মুহাসাবা করুন।',
      },
      {
        id: 'core-2',
        tag: 'মোবাইল অ্যাপ',
        text: 'অ্যাপ হিসেবে ফোনে ইনস্টল করতে "মোবাইল অ্যাপ ইনস্টল" বাটনে ক্লিক করুন — অফলাইনেও চলবে!',
        action: onOpenInstall,
        actionText: 'ইনস্টল করুন',
      },
      {
        id: 'core-3',
        tag: 'ক্যালেন্ডার সিঙ্ক',
        text: 'বাংলাদেশ সময় ও হানাফী ওয়াক্ত অনুযায়ী সকল সালাতের শিডিউল গুগল ক্যালেন্ডারে যুক্ত করুন।',
        action: onOpenCalendarSync,
        actionText: 'সিঙ্ক করুন',
      },
      {
        id: 'core-4',
        tag: 'হাদিস শরিফ',
        text: '“যে ব্যক্তি সৎকাজের পথ দেখায়, সে তার সম্পাদনকারীর অনুরূপ সওয়াব পাবে।” — সহীহ মুসলিম: ১৮৯৩',
      },
      {
        id: 'core-5',
        tag: 'ডেভেলপার',
        text: 'অ্যাপ ডেভেলপার সাকিবুল ইসলাম সাব্বির (Founder & CEO, Bismahsoft) এর প্রোফাইল ও বিস্তারিত দেখতে ক্লিক করুন।',
        action: onOpenDeveloper,
        actionText: 'প্রোফাইল দেখুন',
      },
    ];

    const asSunnahNotices = AS_SUNNAH_ACTIVITIES.map((act) => ({
      id: act.id,
      tag: 'আস-সুন্নাহ ফাউন্ডেশন',
      text: `${act.title}: ${act.description}`,
      action: () => {
        setModalTab('assunnah');
        setIsModalOpen(true);
      },
      actionText: 'বিস্তারিত',
    }));

    const qaNotices = SHAYKH_AHMADULLAH_100_QA.map((qa) => ({
      id: `qa-${qa.id}`,
      tag: `শায়খ আহমাদুল্লাহ প্রশ্নোত্তর #${qa.id} (${qa.category})`,
      text: `প্রশ্ন: ${qa.question} — উত্তর: ${qa.answer}`,
      action: () => {
        setModalTab('qa');
        setIsModalOpen(true);
      },
      actionText: 'সব প্রশ্নোত্তর',
    }));

    return [...coreAnnouncements, ...asSunnahNotices, ...qaNotices];
  }, [onOpenDeveloper, onOpenInstall, onOpenCalendarSync]);

  const filteredQA = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SHAYKH_AHMADULLAH_100_QA;
    return SHAYKH_AHMADULLAH_100_QA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        String(item.id).includes(q)
    );
  }, [searchQuery]);

  if (isDismissed) return null;

  return (
    <>
      <div
        className="relative z-30 w-full overflow-hidden bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border-b border-emerald-500/20 backdrop-blur-md shadow-inner"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div className="flex items-center h-8 px-2">
          {/* Left Badge - Clickable to view full 100 Q&A & As-Sunnah Directory */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold z-10 mr-2 shadow-sm transition-colors"
            title="নোটিশ বোর্ড, ১০০ প্রশ্নোত্তর ও আস-সুন্নাহ ফাউন্ডেশনের তথ্য দেখুন"
          >
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="tracking-wide">নোটিশ ও ১০০ প্রশ্নোত্তর</span>
          </button>

          {/* Marquee Container */}
          <div className="flex-1 overflow-hidden relative whitespace-nowrap">
            <div
              className={`inline-flex items-center gap-10 text-[11px] font-medium text-emerald-100 ${
                isPaused ? 'cursor-pointer' : ''
              }`}
              style={{
                display: 'inline-flex',
                // 115 items total -> ~950s linear scroll for comfortable reading speed
                animation: 'marqueeScroll 950s linear infinite',
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {allNoticeItems.map((item) => (
                <div key={item.id} className="inline-flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-800/70 text-emerald-300 text-[9px] font-bold border border-emerald-600/30">
                    {item.tag}
                  </span>
                  <span className="text-slate-100">{item.text}</span>
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
                  <span className="text-emerald-400/50 select-none">✦</span>
                </div>
              ))}

              {/* Duplicate set for continuous loop */}
              {allNoticeItems.map((item) => (
                <div key={`dup-${item.id}`} className="inline-flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-800/70 text-emerald-300 text-[9px] font-bold border border-emerald-600/30">
                    {item.tag}
                  </span>
                  <span className="text-slate-100">{item.text}</span>
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
                  <span className="text-emerald-400/50 select-none">✦</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Open List & Close buttons */}
          <div className="shrink-0 flex items-center gap-1 ml-1.5 z-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="সকল প্রশ্নোত্তর ও আস-সুন্নাহ তালিকা খুলুন"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-full transition-colors"
              title="বিজ্ঞপ্তি বার লুকান"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
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

      {/* Full Modal to Browse all 100 Q&As and As-Sunnah Foundation Activities */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0a0f12] text-white rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-950/60 to-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white leading-tight">
                    ইসলামি প্রশ্নোত্তর ও আস-সুন্নাহ কার্যক্রম
                  </h3>
                  <p className="text-[10px] text-emerald-300/80 font-medium">
                    শায়খ আহমাদুল্লাহর ১০০টি নির্বাচিত প্রশ্নোত্তর ও ফাউন্ডেশন তথ্য
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-white/10 shrink-0">
              <button
                onClick={() => setModalTab('qa')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  modalTab === 'qa'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>১০০ প্রশ্নোত্তর ({SHAYKH_AHMADULLAH_100_QA.length})</span>
              </button>
              <button
                onClick={() => setModalTab('assunnah')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  modalTab === 'assunnah'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>আস-সুন্নাহ ফাউন্ডেশন</span>
              </button>
            </div>

            {/* Search Input for Q&A */}
            {modalTab === 'qa' && (
              <div className="px-4 py-2.5 border-b border-white/10 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="প্রশ্ন, উত্তর বা বিষয় (যেমন: সালাত, রোজা, যাকাত) খুঁজুন..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Body List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {modalTab === 'qa' ? (
                filteredQA.length > 0 ? (
                  filteredQA.map((qa) => (
                    <div
                      key={qa.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          প্রশ্ন #{qa.id} • {qa.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          শায়খ আহমাদুল্লাহ
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        প্রশ্ন: {qa.question}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-emerald-400 font-semibold">উত্তর: </span>
                        {qa.answer}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-8">
                    কোনো প্রশ্নোত্তর পাওয়া যায়নি।
                  </p>
                )
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-100 leading-relaxed">
                    <strong>আস-সুন্নাহ ফাউন্ডেশন</strong> একটি অরাজনৈতিক, অলাভজনক এবং মানবকল্যাণমূলক দাতব্য সংস্থা। ২০১৭ সালে প্রখ্যাত ইসলামি ব্যক্তিত্ব <strong>শায়খ আহমাদুল্লাহ</strong> এটি প্রতিষ্ঠা করেন। শিক্ষা, দাওয়াহ ও সার্বিক মানবকল্যাণে ফাউন্ডেশনের প্রধান কার্যক্রমসমূহ নিচে তুলে ধরা হলো:
                  </div>
                  {AS_SUNNAH_ACTIVITIES.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                    >
                      <h4 className="text-xs font-bold text-emerald-400">
                        {index + 1}. {act.title}
                      </h4>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

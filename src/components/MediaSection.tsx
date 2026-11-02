import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Facebook,
  ExternalLink,
  Sparkles,
  Tv,
  Film,
  Bell,
  ShieldCheck,
  Share2,
  Plus,
  Edit3,
  Check,
  X,
  RotateCcw,
  Users,
  MessageCircle,
  Globe,
  Layers,
  RefreshCw
} from 'lucide-react';

export interface MediaVideoSectionItem {
  id: string;
  sectionBadgeBn: string;
  sectionTitleBn: string;
  subtitleBn: string;
  descriptionBn: string;
  youtubeId: string;
  siParam?: string;
  gradientClass: string;
  pastelCardClass: string;
  updatedDateBn: string;
}

const DEFAULT_VIDEO_SECTIONS: MediaVideoSectionItem[] = [
  {
    id: 'vid-sec-1',
    sectionBadgeBn: 'সেকশন ০১ • অ্যাপ আপডেট',
    sectionTitleBn: 'নতুন অ্যাপ এনহ্যান্সমেন্ট ও স্মার্ট আমল ট্র্যাকিং',
    subtitleBn: 'App Enhancements & New UI Overview',
    descriptionBn:
      'দৈনিক আমল চেকলিস্ট অ্যাপের নতুন থ্রিডি (3D) ইন্টারফেস, দ্রুততম ক্লাউড সিঙ্ক এবং প্রতিদিনের ফরজ ও সুন্নাত আমল সহজে লিপিবদ্ধ করার সম্পূর্ণ ভিজ্যুয়াল আপডেট।',
    youtubeId: 'V97udg--ygs',
    siParam: 'kM5CT768s2aH8RmS',
    gradientClass: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 text-white',
    pastelCardClass: 'bg-white border-emerald-100',
    updatedDateBn: 'সর্বশেষ সংস্করণ ২.৫',
  },
  {
    id: 'vid-sec-2',
    sectionBadgeBn: 'সেকশন ০২ • ওয়াক্ত ও নোটিফিকেশন',
    sectionTitleBn: 'হানাফী সালাতের ওয়াক্ত ও অটোমেটিক অ্যালার্ম সেটআপ',
    subtitleBn: 'Prayer Time Schedule & Smart Notification System',
    descriptionBn:
      'বাংলাদেশের ৬৪ জেলার হানাফী আসর পদ্ধতি অনুযায়ী নির্ভুল ওয়াক্ত, জামাতের সময়সূচী এবং গুগল ক্যালেন্ডারের সাথে ওয়ান-ক্লিক সিঙ্ক ব্যবহারের গুরুত্বপূর্ণ নির্দেশনা।',
    youtubeId: 'mI8V9B-CQLs',
    siParam: 'zE9WlD8xTHYCnvrD',
    gradientClass: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 text-white',
    pastelCardClass: 'bg-white border-sky-100',
    updatedDateBn: 'ফিচার গাইড',
  },
  {
    id: 'vid-sec-3',
    sectionBadgeBn: 'সেকশন ০৩ • মুহাসাবা ও রুকইয়াহ',
    sectionTitleBn: 'আত্মসমালোচনা (মুহাসাবা), ডিজিটাল তাসবীহ ও রুকইয়াহ অডিও',
    subtitleBn: 'Daily Muhasaba Score & Ruqyah Player Update',
    descriptionBn:
      'প্রতিদিনের আমলের শতকরা স্কোর নির্ণয়, বিলম্বিত আমলের কারণ লিপিবদ্ধকরণ এবং ব্যাকগ্রাউন্ড রুকইয়াহ অডিও প্লেয়ারের নতুন সুবিধাসমূহ।',
    youtubeId: 'yiy55TCUDKQ',
    siParam: 'COuL2tic-wSLWpFn',
    gradientClass: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white',
    pastelCardClass: 'bg-white border-amber-100',
    updatedDateBn: 'গুরুত্বপূর্ণ তথ্য',
  },
  {
    id: 'vid-sec-4',
    sectionBadgeBn: 'সেকশন ০৪ • প্রোফাইল ও রিপোর্ট এক্সপোর্ট',
    sectionTitleBn: 'প্রোফাইল ড্যাশবোর্ডে নতুন এক্সপোর্ট ও মাসিক রিপোর্ট সিস্টেম',
    subtitleBn: 'Export System Moved to Profile Dashboard',
    descriptionBn:
      'এখন থেকে প্রোফাইল সেকশনের ভেতর থেকেই আপনার দৈনিক, সাপ্তাহিক ও মাসিক আমলনামা Word (.docx), Excel (.xlsx) এবং ইমেজ (.jpg) আকারে ডাউনলোড করতে পারবেন।',
    youtubeId: 'QmolQ3V_ARM',
    siParam: 'fTdzBUyrlykErAM5',
    gradientClass: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-800 text-white',
    pastelCardClass: 'bg-white border-purple-100',
    updatedDateBn: 'নতুন পরিবর্তন',
  },
];

// Updated storage key v3 so that the 4 designated videos load immediately and override any old cached placeholders
const STORAGE_KEY_MEDIA_VIDEOS = 'daily_amol_media_sections_v3';

export function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regex);
  return match ? match[1] : trimmed;
}

/**
 * Minimalist, clean, source-free video player that plays the designated YouTube videos
 * reliably with viewport-aware playback, proper YouTube IFrame JS API origin handshake,
 * and zero visible source branding.
 */
interface MinimalistCleanVideoPlayerProps {
  playerId: string;
  youtubeId: string;
  siParam?: string;
  sectionBadgeBn: string;
  titleBn: string;
  autoPlayOnView?: boolean;
}

const MinimalistCleanVideoPlayer: React.FC<MinimalistCleanVideoPlayerProps> = ({
  playerId,
  youtubeId,
  siParam,
  sectionBadgeBn,
  autoPlayOnView = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const sendPlayerCommand = useCallback((func: string, args: unknown[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  }, []);

  // Register listener with YouTube iframe for state updates & ensure playback starts smoothly
  const handleIframeLoad = () => {
    setIsLoaded(true);
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(
        JSON.stringify({
          event: 'listening',
          id: playerId,
          channel: 'widget',
        }),
        '*'
      );
      if (autoPlayOnView) {
        setTimeout(() => {
          sendPlayerCommand('mute');
          sendPlayerCommand('playVideo');
        }, 250);
      }
    }
  };

  // Listen to YouTube postMessage events to keep play/pause state 100% accurate
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com') && !event.origin.includes('youtube-nocookie.com')) {
        return;
      }
      if (event.source !== iframeRef.current?.contentWindow) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'infoDelivery' && data?.info) {
          if (typeof data.info.playerState === 'number') {
            // 1 = playing, 3 = buffering, 2 = paused, 0 = ended
            if (data.info.playerState === 1 || data.info.playerState === 3) {
              setIsPlaying(true);
            } else if (data.info.playerState === 2) {
              setIsPlaying(false);
            } else if (data.info.playerState === 0) {
              sendPlayerCommand('seekTo', [0, true]);
              sendPlayerCommand('playVideo');
              setIsPlaying(true);
            }
          }
          if (typeof data.info.muted === 'boolean') {
            setIsMuted(data.info.muted);
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendPlayerCommand]);

  // Viewport observer so each video section automatically plays smoothly when scrolled into view
  useEffect(() => {
    if (!autoPlayOnView || !containerRef.current) return;
    const el = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isLoaded) return;
          if (entry.isIntersecting) {
            sendPlayerCommand('playVideo');
            setIsPlaying(true);
          } else {
            sendPlayerCommand('pauseVideo');
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlayOnView, isLoaded, sendPlayerCommand]);

  const togglePlay = () => {
    if (isPlaying) {
      sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendPlayerCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      sendPlayerCommand('unMute');
      sendPlayerCommand('setVolume', [100]);
      sendPlayerCommand('playVideo');
      setIsMuted(false);
      setIsPlaying(true);
    } else {
      sendPlayerCommand('mute');
      setIsMuted(true);
    }
  };

  const handleRestartVideo = () => {
    setIsLoaded(false);
    setReloadKey((prev) => prev + 1);
    setIsPlaying(true);
    setIsMuted(true);
  };

  const originParam =
    typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  const siQuery = siParam ? `si=${encodeURIComponent(siParam)}&` : '';
  const embedSrc = `https://www.youtube.com/embed/${youtubeId}?${siQuery}autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1${originParam}`;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md select-none group"
    >
      {/* Thumbnail & Loading Overlay before iframe finishes painting */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center gap-2 overflow-hidden">
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105 blur-[1px]"
          />
          <div className="relative z-10 w-10 h-10 rounded-2xl bg-emerald-500/30 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span className="relative z-10 text-[10px] font-extrabold text-white tracking-wide bg-black/50 px-2.5 py-0.5 rounded-full">
            ভিডিও প্রস্তুত হচ্ছে...
          </span>
        </div>
      )}

      {/* Cropped & pointer-shielded iframe so zero YouTube branding, title bar, or source indicators appear */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <iframe
          key={`${youtubeId}-${reloadKey}`}
          ref={iframeRef}
          id={playerId}
          src={embedSrc}
          title={sectionBadgeBn}
          onLoad={handleIframeLoad}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-[106%] h-[134%] -top-[17%] -left-[3%] absolute border-0 pointer-events-none select-none"
        />
      </div>

      {/* Clean Click Shield for 1-Tap Play/Pause without showing any source UI */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-20 cursor-pointer bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        {!isPlaying && isLoaded && (
          <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xl border-2 border-white/80 transform scale-100 hover:scale-105 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        )}
      </div>

      {/* Top-Left Minimal Section Pill (No video source indicator) */}
      <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
          }`}
        />
        <span className="text-[10px] font-extrabold tracking-tight">
          {sectionBadgeBn}
        </span>
      </div>

      {/* Top-Right Reload/Restart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleRestartVideo();
        }}
        className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all active:scale-95"
        title="ভিডিওটি শুরু থেকে প্লে করুন"
      >
        <RefreshCw className="w-3 h-3" />
      </button>

      {/* Bottom Minimalist Custom Controls Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold transition-all active:scale-95"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current text-emerald-400" />
              <span>চলমান</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-amber-400" />
              <span>চালু করুন</span>
            </>
          )}
        </button>

        {/* Smooth Progress Pulse Bar (Ads-style visual continuity) */}
        <div className="flex-1 mx-2.5 h-1 rounded-full bg-white/25 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700 ${
              isPlaying ? 'w-full animate-pulse' : 'w-1/3'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold transition-all active:scale-95"
          title={isMuted ? 'সাউন্ড চালু করুন' : 'মিউট করুন'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3 h-3 text-rose-400" />
              <span>আনমিউট</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>সাউন্ড অন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const MediaSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'videos' | 'facebook'>('all');
  const [videoSections, setVideoSections] = useState<MediaVideoSectionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEDIA_VIDEOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_VIDEO_SECTIONS;
  });

  // Carousel state for top Ads-style video highlight reel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editYoutubeInput, setEditYoutubeInput] = useState('');
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editDescInput, setEditDescInput] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [newSectionUrl, setNewSectionUrl] = useState('');
  const [fbFeedTab, setFbFeedTab] = useState<'timeline' | 'highlights'>('timeline');
  const [copiedFb, setCopiedFb] = useState(false);

  const FB_PAGE_URL = 'https://www.facebook.com/dailyamolchecklist';
  const FB_PLUGIN_URL = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    FB_PAGE_URL
  )}&tabs=timeline,events,messages&width=360&height=520&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDIA_VIDEOS, JSON.stringify(videoSections));
    } catch {
      // ignore
    }
  }, [videoSections]);

  // Smooth Ads-style auto-advance indicator for the featured top video reel
  useEffect(() => {
    if (videoSections.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % videoSections.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [videoSections.length]);

  const handleSaveEdit = (id: string) => {
    const cleanId = extractYouTubeId(editYoutubeInput);
    if (!cleanId) return;
    setVideoSections((prev) =>
      prev.map((sec) =>
        sec.id === id
          ? {
              ...sec,
              youtubeId: cleanId,
              siParam: undefined,
              sectionTitleBn: editTitleInput.trim() || sec.sectionTitleBn,
              descriptionBn: editDescInput.trim() || sec.descriptionBn,
            }
          : sec
      )
    );
    setEditingId(null);
  };

  const handleAddNewVideoSection = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractYouTubeId(newSectionUrl);
    if (!cleanId || !newSectionTitle.trim()) return;

    const nextNum = videoSections.length + 1;
    const newItem: MediaVideoSectionItem = {
      id: `vid-sec-${Date.now()}`,
      sectionBadgeBn: `সেকশন ০${nextNum} • নতুন আপডেট`,
      sectionTitleBn: newSectionTitle.trim(),
      subtitleBn: 'App Update & Information Video',
      descriptionBn:
        newSectionDesc.trim() ||
        'দৈনিক আমল চেকলিস্ট অ্যাপের নতুন ফিচার ও গুরুত্বপূর্ণ আপডেট সম্পর্কিত ভিডিও।',
      youtubeId: cleanId,
      gradientClass: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-700 text-white',
      pastelCardClass: 'bg-white border-emerald-100',
      updatedDateBn: 'নতুন সংযোজন',
    };

    setVideoSections((prev) => [...prev, newItem]);
    setNewSectionTitle('');
    setNewSectionDesc('');
    setNewSectionUrl('');
    setIsAddingNew(false);
  };

  const handleResetDefaults = () => {
    setVideoSections(DEFAULT_VIDEO_SECTIONS);
    localStorage.setItem(STORAGE_KEY_MEDIA_VIDEOS, JSON.stringify(DEFAULT_VIDEO_SECTIONS));
    setEditingId(null);
  };

  const handleCopyFbLink = () => {
    navigator.clipboard.writeText(FB_PAGE_URL);
    setCopiedFb(true);
    setTimeout(() => setCopiedFb(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 font-anek-bangla">
      {/* Top Media Section Header Card with 3D Glossy Icon */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border border-emerald-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-700 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous shrink-0">
              <Tv className="w-5 h-5 stroke-[2.5] drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] relative z-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  মিডিয়া ও আপডেট সেন্টার
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-extrabold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                অ্যাপ আপডেট ভিডিও সিরিজ ও অফিশিয়াল ফেসবুক পেজ ফিড
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-emerald-300 transition-all active:scale-95 shrink-0"
            title="নতুন ভিডিও সেকশন যুক্ত করুন"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Distinct Subsection Filter Pills */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 relative z-10">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`py-2 px-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'all'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>সকল মিডিয়া</span>
          </button>

          <button
            onClick={() => setActiveSubTab('videos')}
            className={`py-2 px-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'videos'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>ভিডিও সিরিজ</span>
          </button>

          <button
            onClick={() => setActiveSubTab('facebook')}
            className={`py-2 px-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'facebook'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>ফেসবুক পেজ</span>
          </button>
        </div>
      </div>

      {/* Add New Video Section Modal/Drawer */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewVideoSection}
          className="p-4 rounded-3xl bg-white border border-emerald-200 shadow-lg space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>নতুন ভিডিও আপডেট সেকশন যোগ করুন</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="সেকশনের শিরোনাম (যেমন: নতুন আপডেট ও ফিচার পরিচিতি)"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <input
              type="text"
              value={newSectionUrl}
              onChange={(e) => setNewSectionUrl(e.target.value)}
              placeholder="YouTube ভিডিও লিংক অথবা Video ID দিন"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <textarea
              value={newSectionDesc}
              onChange={(e) => setNewSectionDesc(e.target.value)}
              placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ডিফল্ট রিসেট</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
            >
              সেকশন যুক্ত করুন
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          SUBSECTION 1: 4 DESIGNATED VIDEO SECTIONS + ADS-STYLE SLIDER NAV
         ===================================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'videos') && (
        <div className="space-y-4">
          {/* Subsection Header Banner */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-600 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous">
                <Film className="w-3.5 h-3.5 stroke-[2.5] relative z-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                  অ্যাপ আপডেট ও তথ্যমূলক ভিডিও সিরিজ
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  ৪টি নির্ধারিত ভিডিও সেকশন • ক্লিন ও মিনিমালিস্ট প্লেয়ার
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
              {videoSections.length}টি সেকশন
            </span>
          </div>

          {/* Quick Jump / Ads-Style Section Selector Bar */}
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {videoSections.map((sec, idx) => {
              const isSelected = currentSlide === idx;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setCurrentSlide(idx);
                    const targetEl = document.getElementById(`media-section-card-${sec.id}`);
                    if (targetEl) {
                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span>সেকশন ০{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* SEPARATE, NEATLY ORGANIZED SECTIONS FOR EACH OF THE 4 DESIGNATED VIDEOS */}
          <div className="space-y-4">
            {videoSections.map((section, index) => {
              const isEditingThis = editingId === section.id;

              return (
                <section
                  id={`media-section-card-${section.id}`}
                  key={section.id}
                  className={`p-4 rounded-3xl border shadow-sm space-y-3 transition-all ${section.pastelCardClass}`}
                >
                  {/* Individual Video Section Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous shrink-0 ${section.gradientClass}`}
                      >
                        <span className="text-xs font-black font-mono relative z-[3]">
                          0{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold">
                            {section.sectionBadgeBn}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            • {section.updatedDateBn}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-0.5 leading-snug">
                          {section.sectionTitleBn}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingThis) {
                          setEditingId(null);
                        } else {
                          setEditingId(section.id);
                          setEditYoutubeInput(section.youtubeId);
                          setEditTitleInput(section.sectionTitleBn);
                          setEditDescInput(section.descriptionBn);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                      title="এই সেকশনের ভিডিও লিংক বা তথ্য পরিবর্তন করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Edit Drawer for this specific section */}
                  {isEditingThis && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-600">
                        এই সেকশনের শিরোনাম ও YouTube লিংক আপডেট করুন:
                      </label>
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                        placeholder="সেকশন শিরোনাম"
                      />
                      <input
                        type="text"
                        value={editYoutubeInput}
                        onChange={(e) => setEditYoutubeInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800"
                        placeholder="YouTube URL বা Video ID"
                      />
                      <textarea
                        value={editDescInput}
                        onChange={(e) => setEditDescInput(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 resize-none"
                        placeholder="বিবরণ"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(section.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>সংরক্ষণ</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Minimalist Source-Free Video Player inside its dedicated section */}
                  <MinimalistCleanVideoPlayer
                    playerId={`yt-player-${section.id}`}
                    youtubeId={section.youtubeId}
                    siParam={section.siParam}
                    sectionBadgeBn={section.sectionBadgeBn}
                    titleBn={section.sectionTitleBn}
                    autoPlayOnView={true}
                  />

                  {/* Section Description & Key Information */}
                  <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {section.descriptionBn}
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBSECTION 2: OFFICIAL FACEBOOK PAGE INFORMATION & LIVE SCROLLABLE FEED
          Link: facebook.com/dailyamolchecklist
         ===================================================================== */}
      {(activeSubTab === 'all' || activeSubTab === 'facebook') && (
        <div className="space-y-4 pt-1">
          {/* Subsection Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous">
                <Facebook className="w-3.5 h-3.5 stroke-[2.5] relative z-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                  অফিশিয়াল ফেসবুক পেজ ও লাইভ ফিড
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  facebook.com/dailyamolchecklist • সরাসরি স্ক্রল ও আপডেট দেখুন
                </p>
              </div>
            </div>
            <a
              href={FB_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs transition-all"
            >
              <span>ফলো করুন</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Facebook Page Identity & Information Card */}
          <div className="rounded-3xl bg-white border border-blue-100 shadow-sm overflow-hidden">
            {/* Cover Banner */}
            <div className="h-24 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 relative p-4 flex items-end">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/25">
                  Official Community Page
                </span>
                <span className="text-[10px] font-mono text-blue-100 font-semibold">
                  @dailyamolchecklist
                </span>
              </div>
            </div>

            {/* Profile Avatar & Page Meta */}
            <div className="px-4 pb-4 pt-0 relative">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg border border-blue-100 flex items-center justify-center">
                  <img
                    src="/favicon.png"
                    alt="Daily Amol Checklist Facebook"
                    className="w-full h-full rounded-xl object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyFbLink}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>{copiedFb ? 'লিংক কপি হয়েছে!' : 'লিংক কপি'}</span>
                  </button>
                  <a
                    href={FB_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition-all cc-light-swipe"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>পেজে যান</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Daily Amol Checklist - দৈনিক আমল চেকলিস্ট
                  </h4>
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  প্রতিদিনের ফরজ সালাত, মাসনুন দোয়া, সুন্নাত আমল ও আত্মসমালোচনার (মুহাসাবা) মাধ্যমে আখিরাতের প্রস্তুতি ও ইসলামি জীবনযাপনের অফিশিয়াল ফেসবুক কমিউনিটি পেজ।
                </p>

                <div className="pt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <Users className="w-3.5 h-3.5 text-blue-600 mx-auto mb-0.5" />
                    <p className="text-[10px] font-extrabold text-slate-800">কমিউনিটি</p>
                    <p className="text-[9px] text-slate-500 font-semibold">দৈনিক দাওয়াহ</p>
                  </div>
                  <div className="p-2 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <Bell className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
                    <p className="text-[10px] font-extrabold text-slate-800">অ্যাপ আপডেট</p>
                    <p className="text-[9px] text-slate-500 font-semibold">নোটিশ ও ফিচার</p>
                  </div>
                  <div className="p-2 rounded-2xl bg-amber-50/70 border border-amber-100">
                    <Globe className="w-3.5 h-3.5 text-amber-600 mx-auto mb-0.5" />
                    <p className="text-[10px] font-extrabold text-slate-800">ওপেন পেজ</p>
                    <p className="text-[9px] text-slate-500 font-semibold">সবার জন্য উন্মুক্ত</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Scrollable Facebook Page Plugin Container + Community Highlights */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <h4 className="text-xs font-extrabold text-slate-800">
                  ফেসবুক পেজ লাইভ ফিড (স্ক্রল করে দেখুন)
                </h4>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFbFeedTab('timeline')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                    fbFeedTab === 'timeline'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  লাইভ প্লাগইন
                </button>
                <button
                  type="button"
                  onClick={() => setFbFeedTab('highlights')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                    fbFeedTab === 'highlights'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  পেজ পোস্টসমূহ
                </button>
              </div>
            </div>

            {fbFeedTab === 'timeline' ? (
              <div className="space-y-2.5">
                {/* Embedded Official Facebook Page Plugin Iframe (Scrollable) */}
                <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[480px] relative">
                  <iframe
                    src={FB_PLUGIN_URL}
                    width="360"
                    height="500"
                    style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                    scrolling="yes"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Daily Amol Checklist Facebook Live Page Feed"
                    className="w-full max-w-[360px] h-[500px] mx-auto relative z-10 bg-white rounded-xl"
                  />
                </div>

                <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-blue-950 font-semibold leading-snug">
                    ব্রাউজারে অ্যাড-ব্লকার বা থার্ড-পার্টি কুকি বন্ধ থাকলে সরাসরি ফেসবুক অ্যাপে পেজটি খুলুন অথবা পাশের &ldquo;পেজ পোস্টসমূহ&rdquo; ট্যাব দেখুন।
                  </p>
                  <a
                    href={FB_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1"
                  >
                    <span>ফেসবুকে খুলুন</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ) : (
              /* Scrollable Feed of Page Announcements & Posts inside the app */
              <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                {[
                  {
                    id: 'fb-post-1',
                    tag: 'পিন করা পোস্ট • অ্যাপ আপডেট',
                    dateBn: 'আজকের আপডেট',
                    titleBn: 'দৈনিক আমল চেকলিস্ট অ্যাপে নতুন মিডিয়া সেকশন ও থ্রিডি প্রোফাইল এক্সপোর্ট!',
                    contentBn:
                      'আলহামদুলিল্লাহ! আপনাদের সুবিধার্থে এক্সপোর্ট অপশনটি এখন প্রোফাইল সেকশনের ভেতরে সুন্দর থ্রিডি আইকনসহ সংযোজন করা হয়েছে এবং নতুন মিডিয়া সেকশনে আমাদের সকল ভিডিও টিউটোরিয়াল ও ফেসবুক পেজের আপডেট যুক্ত করা হয়েছে।',
                  },
                  {
                    id: 'fb-post-2',
                    tag: 'দৈনিক আমল রিমাইন্ডার',
                    dateBn: 'নিয়মিত পোস্ট',
                    titleBn: 'পাঁচ ওয়াক্ত ফরজ সালাত ও তাকবীরে উলার গুরুত্ব',
                    contentBn:
                      'প্রতিদিন জামাতের সাথে ৫ ওয়াক্ত সালাত আদায় এবং সকাল-সন্ধ্যার মাসনুন জিকিরগুলো নিয়মিত ট্র্যাক করতে আমাদের অ্যাপের চেকলিস্ট ব্যবহার করুন। আল্লাহ আমাদের আমলগুলো কবুল করুন।',
                  },
                  {
                    id: 'fb-post-3',
                    tag: 'কমিউনিটি ঘোষণা',
                    dateBn: 'অফিশিয়াল পেজ',
                    titleBn: 'মাসিক ও সাপ্তাহিক মুহাসাবা রিপোর্ট ডাউনলোড করুন',
                    contentBn:
                      'আপনার পুরো মাসের আমলের অগ্রগতি Word, Excel কিংবা সুন্দর সামারি কার্ড ইমেজ (.jpg) হিসেবে ডাউনলোড করে সংরক্ষণ করুন এবং পরিবারের সদস্যদেরও উৎসাহিত করুন।',
                  },
                ].map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src="/favicon.png"
                          alt="Daily Amol Checklist"
                          className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-slate-200"
                        />
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900 leading-none">
                            Daily Amol Checklist
                          </h5>
                          <span className="text-[10px] text-blue-600 font-bold">
                            {post.tag} • {post.dateBn}
                          </span>
                        </div>
                      </div>
                      <a
                        href={FB_PAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="ফেসবুক পেজে দেখুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <h6 className="text-xs font-extrabold text-slate-800">
                      {post.titleBn}
                    </h6>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {post.contentBn}
                    </p>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 text-[10px] font-bold text-slate-500">
                      <span>facebook.com/dailyamolchecklist</span>
                      <a
                        href={FB_PAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>কমেন্ট ও শেয়ার</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

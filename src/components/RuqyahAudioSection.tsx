import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Download,
  Check,
  Music,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Smartphone,
  Loader2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Headphones,
  HardDriveDownload,
  Sparkles,
} from 'lucide-react';
import {
  RUQYAH_AUDIO_TRACKS,
  RUQYAH_TEXT_VERSES,
  RuqyahTrack,
} from '../data/ruqyahData';
import { BannerAdsCarousel } from './BannerAdsCarousel';

const OFFLINE_CACHE_NAME = 'ruqyah-offline-audio-v1';
const OFFLINE_SAVED_KEY = 'daily_amol_ruqyah_offline_ids';

function getAyahUrl(folder: string, code: string): string {
  return `https://everyayah.com/data/${folder}/${code}.mp3`;
}

export const RuqyahAudioSection: React.FC = () => {
  const [subTab, setSubTab] = useState<'audio' | 'text'>('audio');
  const [activeTrack, setActiveTrack] = useState<RuqyahTrack>(RUQYAH_AUDIO_TRACKS[0]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isLoopTrack, setIsLoopTrack] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [screenOffMode, setScreenOffMode] = useState<boolean>(true);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Track which Ruqyah tracks are cached offline
  const [offlineTrackIds, setOfflineTrackIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_SAVED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const usingFallbackRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Cleanup any created Blob URL
  const revokeCurrentBlobUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  // Resolve audio source (checks Offline CacheStorage first, then remote CDN)
  const resolveAudioSource = useCallback(
    async (track: RuqyahTrack, ayahIdx: number, useFallback = false): Promise<string> => {
      revokeCurrentBlobUrl();
      const code = track.ayahCodes[ayahIdx] || track.ayahCodes[0];
      const folder = useFallback ? track.fallbackReciterFolder : track.reciterFolder;
      const remoteUrl = getAyahUrl(folder, code);

      if ('caches' in window) {
        try {
          const cache = await caches.open(OFFLINE_CACHE_NAME);
          const cachedResponse = await cache.match(remoteUrl);
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            objectUrlRef.current = blobUrl;
            return blobUrl;
          }
        } catch {
          // Fallback to direct stream
        }
      }

      return remoteUrl;
    },
    []
  );

  // Load and optionally play a specific track & ayah index
  const loadAndPlayAyah = useCallback(
    async (track: RuqyahTrack, ayahIdx: number, autoPlay: boolean, useFallback = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      usingFallbackRef.current = useFallback;
      setIsLoadingAudio(true);

      try {
        const src = await resolveAudioSource(track, ayahIdx, useFallback);
        audio.src = src;
        audio.load();

        if (autoPlay) {
          await audio.play();
          setIsPlaying(true);
        }
      } catch (err) {
        if (!useFallback && track.fallbackReciterFolder !== track.reciterFolder) {
          // Automatic fallback reciter if primary stream had any issue
          await loadAndPlayAyah(track, ayahIdx, autoPlay, true);
        } else {
          setIsPlaying(false);
        }
      } finally {
        setIsLoadingAudio(false);
      }
    },
    [resolveAudioSource]
  );

  // Update MediaSession metadata for Screen-Off / Lock-Screen Background Playback
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeTrack.titleBn,
        artist: activeTrack.reciterBn,
        album: 'দৈনিক আমল চেকলিস্ট • রুকইয়াহ শারইয়্যাহ',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prevIdx =
          currentAyahIndex > 0 ? currentAyahIndex - 1 : activeTrack.ayahCodes.length - 1;
        setCurrentAyahIndex(prevIdx);
        loadAndPlayAyah(activeTrack, prevIdx, true);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const nextIdx =
          currentAyahIndex + 1 < activeTrack.ayahCodes.length ? currentAyahIndex + 1 : 0;
        setCurrentAyahIndex(nextIdx);
        loadAndPlayAyah(activeTrack, nextIdx, true);
      });
    } catch {
      // Ignore unsupported mediaSession handlers
    }
  }, [activeTrack, currentAyahIndex, loadAndPlayAyah]);

  // Keep audio playing when visibility changes (Screen-Off persistence)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && screenOffMode && isPlaying && audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [screenOffMode, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokeCurrentBlobUrl();
    };
  }, []);

  // Handle clicking a Ruqyah card
  const handleSelectTrack = (track: RuqyahTrack) => {
    if (activeTrack.id === track.id) {
      // Toggle play/pause
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        if (!audioRef.current?.src) {
          loadAndPlayAyah(track, currentAyahIndex, true);
        } else {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => loadAndPlayAyah(track, currentAyahIndex, true));
        }
      }
    } else {
      setActiveTrack(track);
      setCurrentAyahIndex(0);
      loadAndPlayAyah(track, 0, true);
    }
  };

  // Toggle play/pause from player bar
  const handleTogglePlayPause = () => {
    handleSelectTrack(activeTrack);
  };

  // Handle when an Ayah finishes playing -> advance seamlessly to next Ayah in Ruqyah
  const handleAudioEnded = () => {
    const nextIdx = currentAyahIndex + 1;
    if (nextIdx < activeTrack.ayahCodes.length) {
      setCurrentAyahIndex(nextIdx);
      loadAndPlayAyah(activeTrack, nextIdx, true);
    } else if (isLoopTrack) {
      setCurrentAyahIndex(0);
      loadAndPlayAyah(activeTrack, 0, true);
    } else {
      setIsPlaying(false);
      setCurrentAyahIndex(0);
    }
  };

  // Handle audio stream error -> retry with fallback reciter or skip to next ayah
  const handleAudioError = () => {
    if (!usingFallbackRef.current && activeTrack.fallbackReciterFolder !== activeTrack.reciterFolder) {
      loadAndPlayAyah(activeTrack, currentAyahIndex, isPlaying, true);
    } else if (currentAyahIndex + 1 < activeTrack.ayahCodes.length) {
      const nextIdx = currentAyahIndex + 1;
      setCurrentAyahIndex(nextIdx);
      loadAndPlayAyah(activeTrack, nextIdx, isPlaying, false);
    } else {
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  // Download track for Offline Playback + Optional Device MP3 File Download
  const handleDownloadTrackOffline = async (
    track: RuqyahTrack,
    saveMp3ToDevice: boolean = false,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (downloadingId) return;

    setDownloadingId(track.id);
    setDownloadProgress(0);

    try {
      const cache = 'caches' in window ? await caches.open(OFFLINE_CACHE_NAME) : null;
      const mp3Buffers: BlobPart[] = [];
      const uniqueCodes = Array.from(new Set(track.ayahCodes));

      for (let i = 0; i < track.ayahCodes.length; i++) {
        const code = track.ayahCodes[i];
        const primaryUrl = getAyahUrl(track.reciterFolder, code);
        const fallbackUrl = getAyahUrl(track.fallbackReciterFolder, code);

        let response: Response | undefined = cache ? await cache.match(primaryUrl) : undefined;

        if (!response) {
          try {
            const fetched = await fetch(primaryUrl, { mode: 'cors' });
            if (fetched.ok) {
              if (cache && uniqueCodes.includes(code)) {
                await cache.put(primaryUrl, fetched.clone());
              }
              response = fetched;
            }
          } catch {
            // Try fallback reciter URL
          }
        }

        if (!response) {
          const fetchedFallback = await fetch(fallbackUrl, { mode: 'cors' });
          if (fetchedFallback.ok) {
            if (cache && uniqueCodes.includes(code)) {
              await cache.put(primaryUrl, fetchedFallback.clone());
            }
            response = fetchedFallback;
          }
        }

        if (response && saveMp3ToDevice) {
          const arrayBuffer = await response.arrayBuffer();
          mp3Buffers.push(arrayBuffer);
        }

        setDownloadProgress(Math.round(((i + 1) / track.ayahCodes.length) * 100));
      }

      // Mark track as saved offline
      setOfflineTrackIds((prev) => {
        const updated = prev.includes(track.id) ? prev : [...prev, track.id];
        try {
          localStorage.setItem(OFFLINE_SAVED_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (saveMp3ToDevice && mp3Buffers.length > 0) {
        const combinedBlob = new Blob(mp3Buffers, { type: 'audio/mpeg' });
        const downloadUrl = URL.createObjectURL(combinedBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const cleanTitle = track.titleBn.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_');
        a.download = `Ruqyah_${cleanTitle}.mp3`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        showToast(`"${track.titleBn}" অফলাইনে সেভ ও MP3 ফাইল হিসেবে ডাউনলোড হয়েছে!`);
      } else {
        showToast(`"${track.titleBn}" ইন্টারনেট ছাড়া অফলাইনে শোনার জন্য সেভ হয়েছে!`);
      }
    } catch {
      showToast('অফলাইন ডাউনলোডে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const overallTrackProgress = Math.round(
    ((currentAyahIndex + (duration > 0 ? currentTime / duration : 0)) /
      Math.max(1, activeTrack.ayahCodes.length)) *
      100
  );

  // Split tracks into first 6 (Rows 1-3) and remaining 8 (Rows 4-7) so Banner Ad sits between Row 3 and Row 4 just like the screenshot
  const firstSixTracks = RUQYAH_AUDIO_TRACKS.slice(0, 6);
  const remainingEightTracks = RUQYAH_AUDIO_TRACKS.slice(6);

  const renderTrackCard = (track: RuqyahTrack) => {
    const isCurrent = activeTrack.id === track.id;
    const isCurrentPlaying = isCurrent && isPlaying;
    const isSavedOffline = offlineTrackIds.includes(track.id);
    const isThisDownloading = downloadingId === track.id;

    return (
      <div
        key={track.id}
        onClick={() => handleSelectTrack(track)}
        className={`group relative rounded-2xl p-3.5 min-h-[138px] flex flex-col justify-between cursor-pointer select-none transition-all duration-200 overflow-hidden shadow-md ${
          isCurrent
            ? 'bg-gradient-to-br from-[#175E4E] via-[#134E41] to-[#0D382F] border-2 border-[#10B981] ring-2 ring-[#10B981]/30 shadow-emerald-900/30'
            : 'bg-gradient-to-br from-[#164E43] to-[#103B33] border border-emerald-400/20 hover:border-emerald-400/50'
        }`}
      >
        {/* Top Row: Playing Equalizer or Reciter Tag + Top-Right Offline Check/Download Button */}
        <div className="flex items-center justify-between z-10">
          {isCurrentPlaying ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/25 border border-[#10B981]/50 text-[#6EE7B7] text-[9px] font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              এখন বাজছে
            </span>
          ) : (
            <span className="text-[9px] text-emerald-200/75 font-semibold truncate max-w-[105px]">
              {track.reciterBn.replace('শাইখ ', '')}
            </span>
          )}

          {/* Top-Right Offline Download / Checkmark Badge (Matches Screenshot) */}
          <button
            type="button"
            onClick={(e) => handleDownloadTrackOffline(track, true, e)}
            title={
              isSavedOffline
                ? 'অফলাইনে সংরক্ষিত আছে (পুনরায় MP3 ডাউনলোড করতে ক্লিক করুন)'
                : 'অফলাইনে সেভ ও MP3 ডাউনলোড করুন'
            }
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isSavedOffline
                ? 'bg-[#072620]/85 text-[#10B981] border border-[#10B981]/50'
                : 'bg-[#072620]/75 text-emerald-300/90 hover:text-white hover:bg-[#072620]'
            }`}
          >
            {isThisDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10B981]" />
            ) : isSavedOffline ? (
              <div className="flex flex-col items-center leading-none">
                <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                <span className="w-2.5 h-[1.5px] bg-current mt-0.5 rounded-full" />
              </div>
            ) : (
              <Download className="w-3.5 h-3.5 stroke-[2.4]" />
            )}
          </button>
        </div>

        {/* Center Play / Pause Button (Exact Emerald Circle from Screenshot) */}
        <div className="my-2 flex items-center justify-center z-10">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 icon-3d-badge cc-light-swipe cc-light-swipe-continuous ${
              isCurrentPlaying
                ? 'bg-[#059669] text-white ring-4 ring-[#10B981]/35'
                : 'bg-[#10B981] text-white shadow-lg shadow-black/25'
            }`}
          >
            {isCurrent && isLoadingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin text-white relative z-[3]" />
            ) : isCurrentPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white relative z-[3]" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5 relative z-[3]" />
            )}
          </div>
        </div>

        {/* Bottom Track Title */}
        <div className="z-10">
          <h4 className="text-xs font-extrabold text-white leading-snug line-clamp-2">
            {track.titleBn}
          </h4>
          {isThisDownloading && (
            <div className="mt-1 w-full bg-black/30 h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#10B981] h-full transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl overflow-hidden bg-[#0B221E] text-white border border-emerald-500/30 shadow-xl font-anek-bangla">
      {/* Hidden HTML5 Audio Element with Background / Screen-Off Playback */}
      <audio
        ref={audioRef}
        preload="auto"
        muted={isMuted}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Top Ruqyah Header Bar (Matches Screenshot) */}
      <div className="px-4 pt-4 pb-2 bg-[#081C18] flex items-center justify-between border-b border-emerald-500/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-white icon-3d-badge cc-light-swipe cc-light-swipe-continuous">
            <Headphones className="w-4 h-4 relative z-[3]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white leading-tight">রুকইয়াহ</h3>
            <p className="text-[10px] text-emerald-300/80 font-semibold">
              স্ক্রিন অফ প্লেব্যাক ও অফলাইন ডাউনলোড সুবিধা
            </p>
          </div>
        </div>

        {/* Right Actions: Screen-Off Toggle & Download Current Track */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const nextState = !screenOffMode;
              setScreenOffMode(nextState);
              showToast(
                nextState
                  ? 'স্ক্রিন অফ প্লেব্যাক চালু: ফোনের স্ক্রিন বন্ধ থাকলেও রুকইয়াহ চলবে।'
                  : 'স্ক্রিন অফ প্লেব্যাক বন্ধ করা হয়েছে।'
              );
            }}
            className={`px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition-all ${
              screenOffMode
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title="ফোনের স্ক্রিন বন্ধ থাকলেও ব্যাকগ্রাউন্ডে অডিও চালু রাখুন"
          >
            <Smartphone className="w-3 h-3" />
            <span>স্ক্রিন-অফ প্লে</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadTrackOffline(activeTrack, true)}
            disabled={downloadingId !== null}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-500/30 border border-white/15 flex items-center justify-center text-white transition-all"
            title="বর্তমান রুকইয়াহ অফলাইনে সেভ ও MP3 ডাউনলোড করুন"
          >
            {downloadingId === activeTrack.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Two Tabs: রুকইয়াহ অডিও | রুকইয়াহ টেক্সট (Exact Match to Screenshot) */}
      <div className="grid grid-cols-2 bg-[#081C18] border-b border-emerald-500/20">
        <button
          type="button"
          onClick={() => setSubTab('audio')}
          className={`py-2.5 text-xs font-extrabold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'audio'
              ? 'border-[#10B981] text-[#10B981] bg-[#0B221E]/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>রুকইয়াহ অডিও</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('text')}
          className={`py-2.5 text-xs font-extrabold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'text'
              ? 'border-[#10B981] text-[#10B981] bg-[#0B221E]/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>রুকইয়াহ টেক্সট</span>
        </button>
      </div>

      {/* Toast Message */}
      {statusToast && (
        <div className="mx-3 mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* TAB 1: RUQYAH AUDIO 2-COLUMN GRID */}
      {subTab === 'audio' ? (
        <div className="p-3 space-y-3">
          {/* Rows 1 - 3 (First 6 Cards) */}
          <div className="grid grid-cols-2 gap-2.5">
            {firstSixTracks.map((track) => renderTrackCard(track))}
          </div>

          {/* Middle Banner Ad Placement (Matches Screenshot between Row 3 and Row 4) */}
          <div className="py-0.5">
            <BannerAdsCarousel />
          </div>

          {/* Rows 4 - 7 (Remaining 8 Cards) */}
          <div className="grid grid-cols-2 gap-2.5">
            {remainingEightTracks.map((track) => renderTrackCard(track))}
          </div>
        </div>
      ) : (
        /* TAB 2: RUQYAH TEXT VERSES & DUAS */
        <div className="p-3 space-y-3 max-h-[580px] overflow-y-auto no-scrollbar">
          {RUQYAH_TEXT_VERSES.map((item) => {
            const linkedTrack = RUQYAH_AUDIO_TRACKS.find((t) => t.id === item.linkedTrackId);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#123831] border border-emerald-500/25 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold">
                    {item.categoryBn}
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold">
                    {item.repeatCountBn}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-white">{item.titleBn}</h4>
                  <p className="text-[10px] text-emerald-300/80 font-semibold">{item.referenceBn}</p>
                </div>

                {/* Arabic Verse Box */}
                <div
                  dir="rtl"
                  className="p-3 rounded-xl bg-[#081C18]/90 border border-emerald-500/20 text-right text-lg leading-loose text-emerald-100 font-serif"
                >
                  {item.arabic}
                </div>

                {/* Bengali Pronunciation */}
                <div className="text-xs text-emerald-200/95 leading-relaxed">
                  <strong className="text-emerald-400">উচ্চারণ: </strong>
                  {item.pronunciationBn}
                </div>

                {/* Bengali Translation */}
                <div className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-emerald-400">অনুবাদ: </strong>
                  {item.translationBn}
                </div>

                {/* Virtue & Play Button */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-emerald-300/90 font-medium flex-1">
                    ✦ {item.virtueBn}
                  </p>
                  {linkedTrack && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubTab('audio');
                        handleSelectTrack(linkedTrack);
                      }}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>অডিও শুনুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM NOW-PLAYING BAR & EXPANDABLE PLAYER (Matches Screenshot Bottom Bar) */}
      <div className="bg-[#122622] border-t border-emerald-500/30 px-3 py-2.5">
        {/* Progress Bar */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className="h-full bg-[#10B981] transition-all duration-300"
            style={{ width: `${Math.max(4, overallTrackProgress)}%` }}
          />
        </div>

        {/* Compact Now Playing Row (Exact Match to Screenshot Bottom Bar) */}
        <div className="flex items-center justify-between gap-2.5">
          <div
            onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          >
            {/* Left Music Icon Box */}
            <div className="w-10 h-10 rounded-xl bg-[#1A3A34] border border-emerald-500/30 flex items-center justify-center text-[#10B981] shrink-0 icon-3d-badge cc-light-swipe">
              <Music className="w-5 h-5 relative z-[3]" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-white truncate">
                {activeTrack.titleBn}
              </h4>
              <p className="text-[10px] text-slate-300 font-semibold flex items-center gap-1.5">
                <span className="text-[#10B981]">
                  {isPlaying ? 'এখন বাজছে' : 'প্রস্তুত'}
                </span>
                <span>•</span>
                <span className="truncate">
                  আয়াত {currentAyahIndex + 1}/{activeTrack.ayahCodes.length} ({activeTrack.reciterBn})
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Expand, Offline Save & Play/Pause Triangle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300"
              title="বিস্তারিত প্লেয়ার কন্ট্রোল"
            >
              {isPlayerExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="w-9 h-9 rounded-xl bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] transition-all"
              title={isPlaying ? 'বিরতি দিন' : 'চালু করুন'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-[#10B981]" />
              ) : (
                <Play className="w-5 h-5 fill-[#10B981] ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Full Audio Controls Drawer */}
        {isPlayerExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              {activeTrack.descriptionBn}
            </p>

            {/* Included Ayat Tags */}
            <div className="flex flex-wrap gap-1">
              {activeTrack.ayatLabelsBn.map((lbl, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-emerald-300 font-bold"
                >
                  {lbl}
                </span>
              ))}
            </div>

            {/* Seek Bar for Current Ayah */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = val;
                    setCurrentTime(val);
                  }
                }}
                className="w-full accent-[#10B981] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>
                  আয়াত {currentAyahIndex + 1} / {activeTrack.ayahCodes.length}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport & Offline Download Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsLoopTrack(!isLoopTrack)}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    isLoopTrack
                      ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                  title="পুনরাবৃত্তি (Loop)"
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                  title="মিউট / আনমিউট"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx =
                      currentAyahIndex > 0
                        ? currentAyahIndex - 1
                        : activeTrack.ayahCodes.length - 1;
                    setCurrentAyahIndex(prevIdx);
                    loadAndPlayAyah(activeTrack, prevIdx, true);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
                  title="পূর্ববর্তী আয়াত"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>বিরতি</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>বাজান</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx =
                      currentAyahIndex + 1 < activeTrack.ayahCodes.length
                        ? currentAyahIndex + 1
                        : 0;
                    setCurrentAyahIndex(nextIdx);
                    loadAndPlayAyah(activeTrack, nextIdx, true);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
                  title="পরবর্তী আয়াত"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadTrackOffline(activeTrack, true)}
                disabled={downloadingId !== null}
                className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold flex items-center gap-1"
                title="অফলাইনে সেভ ও MP3 ডাউনলোড"
              >
                <HardDriveDownload className="w-3.5 h-3.5 text-[#10B981]" />
                <span>MP3 ডাউনলোড</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

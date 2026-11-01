import React from 'react';
import { X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DigitalTasbeehModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasbeehCounts: Record<string, number>;
  onUpdateCounts: (counts: Record<string, number>) => void;
}

const PRESET_DHIKRS = [
  { key: 'subhanallah', titleBn: 'سُبْحَانَ اللَّهِ', meaningBn: 'সুবহানাল্লাহ (আল্লাহ অতি পবিত্র)', target: 33 },
  { key: 'alhamdulillah', titleBn: 'الْحَمْدُ لِلَّهِ', meaningBn: 'আলহামদুলিল্লাহ (সকল প্রশংসা আল্লাহর)', target: 33 },
  { key: 'allahuakbar', titleBn: 'اللَّهُ أَكْبَرُ', meaningBn: 'আল্লাহু আকবার (আল্লাহ সর্বশ্রেষ্ঠ)', target: 34 },
  { key: 'astaghfirullah', titleBn: 'أَسْتَغْفِرُ اللَّهَ', meaningBn: 'আস্তাগফিরুল্লাহ (আমি আল্লাহর ক্ষমা চাই)', target: 100 },
  { key: 'durood', titleBn: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaningBn: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ (দরূদ)', target: 100 },
  { key: 'lailahaillallah', titleBn: 'لَا إِلَهَ إِلَّا اللَّهُ', meaningBn: 'লা ইলাহা ইল্লাল্লাহ', target: 100 },
];

export const DigitalTasbeehModal: React.FC<DigitalTasbeehModalProps> = ({
  isOpen,
  onClose,
  tasbeehCounts,
  onUpdateCounts,
}) => {
  const [activeKey, setActiveKey] = React.useState('subhanallah');
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  if (!isOpen) return null;

  const currentDhikr = PRESET_DHIKRS.find((d) => d.key === activeKey) || PRESET_DHIKRS[0];
  const count = tasbeehCounts[activeKey] || 0;
  const target = currentDhikr.target;
  const progress = Math.min(100, Math.round((count / target) * 100));

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(count % target === 0 && count > 0 ? 880 : 520, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {}
  };

  const handleIncrement = () => {
    const newCount = count + 1;
    playClickSound();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(newCount % target === 0 ? [40, 40, 40] : 15);
    }

    if (newCount === target) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#fbbf24'],
      });
    }

    onUpdateCounts({
      ...tasbeehCounts,
      [activeKey]: newCount,
    });
  };

  const handleReset = () => {
    if (window.confirm(`${currentDhikr.meaningBn} এর কাউন্টার রিসেট করতে চান?`)) {
      onUpdateCounts({
        ...tasbeehCounts,
        [activeKey]: 0,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📿</span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">ডিজিটাল তাসবীহ</h3>
              <p className="text-[10px] text-slate-500 font-medium">হ্যাপটিক ও স্পর্শনির্ভর গণনা</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dhikr Selector Tabs */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_DHIKRS.map((item) => {
            const isActive = item.key === activeKey;
            const currentTotal = tasbeehCounts[item.key] || 0;
            return (
              <button
                key={item.key}
                onClick={() => setActiveKey(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{item.meaningBn.split(' ')[0]}</span>
                <span className="ml-1 text-[10px] opacity-80 font-mono">({currentTotal})</span>
              </button>
            );
          })}
        </div>

        {/* Main Tasbeeh Counter Circle */}
        <div className="my-6 flex flex-col items-center justify-center">
          
          <div className="text-center mb-4">
            <p className="text-xl font-black text-emerald-700 font-serif mb-0.5">
              {currentDhikr.titleBn}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {currentDhikr.meaningBn}
            </p>
          </div>

          {/* Tactile Big Counter Button */}
          <button
            onClick={handleIncrement}
            className="w-40 h-40 rounded-full bg-gradient-to-b from-emerald-50 to-emerald-100 border-4 border-emerald-500 shadow-xl flex flex-col items-center justify-center relative active:scale-95 transition-transform select-none cc-light-swipe"
          >
            <span className="text-4xl font-black text-slate-800 font-mono tracking-tight">
              {count}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
              লক্ষ্য: {target}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">
              ট্যাপ করুন
            </span>
          </button>

          {/* Progress bar */}
          <div className="w-52 mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono font-bold">
              <span>অগ্রগতি</span>
              <span>{count}/{target} ({progress}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-500 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
          >
            সম্পন্ন
          </button>
        </div>

      </div>
    </div>
  );
};

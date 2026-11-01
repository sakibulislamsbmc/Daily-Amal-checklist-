import React from 'react';
import { X, PenTool, Save, Check } from 'lucide-react';
import { DayAmolState } from '../types';

interface MuhasabaReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayState: DayAmolState;
  onSaveReflection: (note: string, feeling: DayAmolState['spiritualFeeling']) => void;
}

export const MuhasabaReflectionModal: React.FC<MuhasabaReflectionModalProps> = ({
  isOpen,
  onClose,
  dayState,
  onSaveReflection,
}) => {
  const [note, setNote] = React.useState(dayState.reflectionNote || '');
  const [feeling, setFeeling] = React.useState<DayAmolState['spiritualFeeling']>(
    dayState.spiritualFeeling || 'peaceful'
  );
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNote(dayState.reflectionNote || '');
      setFeeling(dayState.spiritualFeeling || 'peaceful');
      setIsSaved(false);
    }
  }, [isOpen, dayState]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveReflection(note, feeling);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const feelings = [
    { id: 'peaceful', label: '🌿 প্রশান্ত ও শুকরগুজার', desc: 'Peaceful' },
    { id: 'seeking_forgiveness', label: '🤲 তাওবাহ ও ক্ষমাপ্রার্থী', desc: 'Repentant' },
    { id: 'motivated', label: '⚡ উদ্যমী ও সংকল্পবদ্ধ', desc: 'Motivated' },
    { id: 'struggling', label: '🛡️ নফসের সাথে সংগ্রামরত', desc: 'Struggling' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 relative border border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">দৈনিক মুহাসাবা ডায়েরি</h3>
              <p className="text-[10px] text-zinc-400">তারিখ: {dayState.date} • রাতের আত্মপর্যালোচনা</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feelings */}
        <div className="mt-3 relative z-10">
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
            আজকের আত্মিক অবস্থা:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {feelings.map((f) => (
              <button
                key={f.id}
                onClick={() => setFeeling(f.id)}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  feeling === f.id
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold text-[11px]">{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Note Field */}
        <div className="mt-3 relative z-10">
          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
            দিনের আত্মপর্যালোচনা ও তাওবাহ নোট:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="আজ কোথায় সময় অপচয় হলো? কোন আমলে অবহেলা হলো? আগামীকালের সংকল্প কি?..."
            rows={4}
            className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2 relative z-10">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
          >
            বাতিল
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs shadow-md transition-all cc-light-swipe flex items-center gap-1.5"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষিত!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

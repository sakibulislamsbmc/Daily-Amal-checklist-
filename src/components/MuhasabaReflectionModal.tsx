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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">দৈনিক মুহাসাবা ডায়েরি</h3>
              <p className="text-[10px] text-slate-500 font-medium">তারিখ: {dayState.date} • রাতের আত্মপর্যালোচনা</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feelings */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            আজকের আত্মিক অনুভূতি:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {feelings.map((f) => (
              <button
                key={f.id}
                onClick={() => setFeeling(f.id)}
                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                  feeling === f.id
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px]">{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Note Field */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            দিনের আত্মপর্যালোচনা ও তাওবাহ নোট:
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="আজ কোথায় সময় অপচয় হলো? কোন আমলে অবহেলা হলো? আগামীকালের সংকল্প কি?..."
            rows={4}
            className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700"
          >
            বাতিল
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe flex items-center gap-1.5"
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

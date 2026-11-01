import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle, ShieldAlert, Heart } from 'lucide-react';
import { AmolItem } from '../types';

interface LateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  amolItem: AmolItem | null;
  windowExplanation: string;
  onConfirmLateSubmission: (reason: string) => void;
}

const PRESET_REASONS = [
  { id: 'work', label: '💼 কর্মব্যস্ততা বা প্রাতিষ্ঠানিক দায়িত্ব', desc: 'Work or professional engagement' },
  { id: 'travel', label: '🚗 ভ্রমণ, পথিমধ্যে বা যাতায়াত', desc: 'Traveling or commute delay' },
  { id: 'sleep', label: '🛌 অনিচ্ছাকৃত ঘুম বা অতিরিক্ত ক্লান্তি', desc: 'Unintentional sleep or exhaustion' },
  { id: 'illness', label: '🩺 অসুস্থতা বা শারীরিক প্রতিকূলতা', desc: 'Sickness or physical distress' },
  { id: 'ghaflah', label: '⚠️ অসচেতনতা বা অলসতা (তাওবাহ করছি)', desc: 'Negligence, resolving to improve' },
  { id: 'custom', label: '✍️ অন্য কোনো বিশেষ কারণ', desc: 'Specific personal reason' },
];

export const LateSubmissionModal: React.FC<LateSubmissionModalProps> = ({
  isOpen,
  onClose,
  amolItem,
  windowExplanation,
  onConfirmLateSubmission,
}) => {
  const [selectedReason, setSelectedReason] = React.useState<string>(PRESET_REASONS[0].label);
  const [customRemark, setCustomRemark] = React.useState<string>('');

  if (!isOpen || !amolItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason.includes('অন্য কোনো') && customRemark.trim()
      ? customRemark.trim()
      : selectedReason + (customRemark.trim() ? ` — ${customRemark.trim()}` : '');

    onConfirmLateSubmission(finalReason);
    setCustomRemark('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 relative border border-white/10 shadow-2xl overflow-hidden bg-[#0a0a0a]">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">বিলম্বে আমল লিপিবদ্ধকরণ</h3>
              <p className="text-[11px] text-zinc-400">ওয়াক্ত উত্তীর্ণের কারণ ও আত্মসমালোচনা</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amol Info Card */}
        <div className="mt-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">{amolItem.titleBn}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-medium">
              ওয়াক্ত উত্তীর্ণ
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            {windowExplanation}
          </p>
        </div>

        {/* Reason Selector */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3 relative z-10">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
              দেরিতে সম্পন্ন হওয়ার কারণ নির্বাচন করুন:
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {PRESET_REASONS.map((r) => {
                const isSelected = selectedReason === r.label;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.label)}
                    className={`w-full p-2 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional custom note */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              নির্দিষ্ট মন্তব্য বা সংকল্প (ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              placeholder="সংক্ষিপ্ত মন্তব্য লিখুন..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* Sincere Istighfar Reminder */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 leading-relaxed flex items-start gap-2">
            <Heart className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              দেরিতে হলেও আমল আদায়ে সচেষ্ট থাকার জন্য আলহামদুলিল্লাহ। আগামী ওয়াক্তসমূহ যথাসময়ে আদায় করার জন্য আন্তরিক তাওবাহ ও সংকল্প করুন।
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-md transition-all cc-light-swipe"
            >
              লিপিবদ্ধ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

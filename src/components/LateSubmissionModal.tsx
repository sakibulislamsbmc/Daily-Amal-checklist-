import React, { useState } from 'react';
import { X, Clock, Heart } from 'lucide-react';
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
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0].label);
  const [customRemark, setCustomRemark] = useState<string>('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">বিলম্বে আমল লিপিবদ্ধকরণ</h3>
              <p className="text-[11px] text-slate-500 font-medium">ওয়াক্ত উত্তীর্ণের কারণ ও আত্মসমালোচনা</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amol Info Card */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">{amolItem.titleBn}</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
              ওয়াক্ত উত্তীর্ণ
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {windowExplanation}
          </p>
        </div>

        {/* Reason Selector */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
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
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional custom note */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              নির্দিষ্ট মন্তব্য বা সংকল্প (ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              placeholder="সংক্ষিপ্ত মন্তব্য লিখুন..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Istighfar Reminder */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-relaxed flex items-start gap-2">
            <Heart className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              দেরিতে হলেও আমল আদায়ে সচেষ্ট থাকার জন্য আলহামদুলিল্লাহ। আগামী ওয়াক্তসমূহে সময়মতো আদায়ের জন্য আন্তরিক সংকল্প করুন।
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe"
            >
              লিপিবদ্ধ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

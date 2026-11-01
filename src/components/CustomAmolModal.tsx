import React from 'react';
import { X, PlusCircle } from 'lucide-react';
import { AmolItem, AmolCategory } from '../types';

interface CustomAmolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAmol: (item: AmolItem) => void;
}

export const CustomAmolModal: React.FC<CustomAmolModalProps> = ({
  isOpen,
  onClose,
  onAddAmol,
}) => {
  const [titleBn, setTitleBn] = React.useState('');
  const [descriptionBn, setDescriptionBn] = React.useState('');
  const [category, setCategory] = React.useState<AmolCategory>('custom');
  const [points, setPoints] = React.useState(15);
  const [suggestedTime, setSuggestedTime] = React.useState('20:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleBn.trim()) return;

    const newAmol: AmolItem = {
      id: 'custom_' + Date.now(),
      category,
      titleBn: titleBn.trim(),
      titleEn: titleBn.trim(),
      descriptionBn: descriptionBn.trim() || 'ব্যক্তিগত আধ্যাত্মিক লক্ষ্য',
      descriptionEn: 'Personal spiritual goal',
      points: Number(points) || 15,
      pastelTheme: 'yellow',
      iconEmoji: '⭐',
      timeWindow: {
        startWaqt: 'all_day',
        endWaqt: 'all_day',
        labelBn: 'সারাদিন',
        labelEn: 'All Day',
      },
      calendarSyncDefault: suggestedTime
        ? {
            suggestedTime,
            durationMinutes: 20,
            colorId: '2',
          }
        : undefined,
    };

    onAddAmol(newAmol);
    setTitleBn('');
    setDescriptionBn('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-800">নতুন আমল যোগ করুন</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              আমলের নাম / শিরোনাম:
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: তাহিয়্যাতুল ওযু, সূরা ইয়াসীন..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              বিবরণ:
            </label>
            <input
              type="text"
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              placeholder="সংক্ষিপ্ত লক্ষ্য বা নিয়ম..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ক্যাটাগরি:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AmolCategory)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="custom">ব্যক্তিগত</option>
                <option value="fard_salah">নামাজ</option>
                <option value="adhkar">আত্মিক উন্নতি</option>
                <option value="muhasaba_akhlaq">সদয় কাজ</option>
                <option value="quran">কুরআন</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                পয়েন্ট:
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ক্যালেন্ডার সময় (বাংলাদেশ BST):
            </label>
            <input
              type="time"
              value={suggestedTime}
              onChange={(e) => setSuggestedTime(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe"
            >
              যোগ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

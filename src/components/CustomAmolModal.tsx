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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 relative border border-white/10 shadow-2xl bg-[#0a0a0a]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">নতুন আমল যোগ করুন</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              আমলের নাম / শিরোনাম:
            </label>
            <input
              type="text"
              required
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder="যেমন: তাহিয়্যাতুল ওযু, সূরা ইয়াসীন..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              বিবরণ:
            </label>
            <input
              type="text"
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              placeholder="সংক্ষিপ্ত লক্ষ্য বা নিয়ম..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                ক্যাটাগরি:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AmolCategory)}
                className="w-full rounded-xl bg-black border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="custom">ব্যক্তিগত</option>
                <option value="sunnah_nafl">সুন্নাত/নফল</option>
                <option value="quran">কুরআন</option>
                <option value="adhkar">আযকার</option>
                <option value="muhasaba_akhlaq">চরিত্র</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                পয়েন্ট:
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              ক্যালেন্ডার সময় (বাংলাদেশ BST):
            </label>
            <input
              type="time"
              value={suggestedTime}
              onChange={(e) => setSuggestedTime(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs shadow-md transition-all cc-light-swipe"
            >
              যোগ করুন
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

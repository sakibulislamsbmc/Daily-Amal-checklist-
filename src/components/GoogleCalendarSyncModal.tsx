import React from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Check, 
  AlertCircle, 
  Clock, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  generateSuggestedEventsForDate, 
  batchSyncAmolSchedule, 
  SyncItemConfig 
} from '../services/calendar';
import { PrayerSchedule } from '../services/prayerTimes';
import { googleSignIn, getAccessToken } from '../firebase';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  schedule: PrayerSchedule;
  currentUser: User | null;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  schedule,
  currentUser,
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{ successCount: number; errors: string[] } | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const suggestedEvents = React.useMemo(() => {
    return generateSuggestedEventsForDate(dateStr, schedule);
  }, [dateStr, schedule]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(suggestedEvents.map((e) => e.amolId));
      setSyncResult(null);
      setAuthError(null);
      setShowConfirmDialog(false);
    }
  }, [isOpen, suggestedEvents]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === suggestedEvents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(suggestedEvents.map((e) => e.amolId));
    }
  };

  const handleInitiateSync = async () => {
    setAuthError(null);
    if (!currentUser) {
      try {
        await googleSignIn();
      } catch (err: any) {
        setAuthError('গুগল সাইন ইন সম্পন্ন হয়নি।');
        return;
      }
    }

    const token = await getAccessToken();
    if (!token) {
      try {
        await googleSignIn();
      } catch {
        setAuthError('গুগল ক্যালেন্ডারের অনুমতি পাওয়া যায়নি।');
        return;
      }
    }

    // Explicit confirmation dialog per Workspace guidelines
    setShowConfirmDialog(true);
  };

  const handleExecuteSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setSyncResult(null);
    setAuthError(null);

    const itemsToSync = suggestedEvents.filter((e) => selectedIds.includes(e.amolId));

    try {
      const result = await batchSyncAmolSchedule(dateStr, itemsToSync);
      setSyncResult(result);
    } catch (err: any) {
      setAuthError(err.message || 'ক্যালেন্ডার সিঙ্ক ব্যর্থ হয়েছে।');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 relative border border-white/10 shadow-2xl bg-[#0a0a0a] max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">গুগল ক্যালেন্ডার সিঙ্ক</h3>
              <p className="text-[10px] text-zinc-400">বাংলাদেশ সময় (Asia/Dhaka)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices */}
        {authError && (
          <div className="mt-2.5 p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {syncResult && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs shrink-0 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncResult.successCount}টি সালাত ও আমল ক্যালেন্ডারে যুক্ত হয়েছে!</span>
          </div>
        )}

        {/* Controls */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <span>নির্বাচিত: <strong className="text-white">{selectedIds.length}</strong>/{suggestedEvents.length}</span>
          <button
            onClick={handleSelectAll}
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            {selectedIds.length === suggestedEvents.length ? 'সব বাতিল' : 'সব নির্বাচন'}
          </button>
        </div>

        {/* Events Scroll List */}
        <div className="mt-2 flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
          {suggestedEvents.map((event) => {
            const isChecked = selectedIds.includes(event.amolId);
            return (
              <div
                key={event.amolId}
                onClick={() => toggleSelect(event.amolId)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isChecked
                    ? 'bg-white/10 border-emerald-500/40'
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-emerald-400 text-black' : 'border border-zinc-600'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <p className="text-xs font-semibold text-white truncate">
                    {event.title}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-300 shrink-0">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{event.startTime}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Confirmation per Workspace Skill */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md rounded-3xl animate-in zoom-in-95">
            <div className="text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">
                ক্যালেন্ডারে ইভেন্ট যুক্ত করতে চান?
              </h4>
              <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                আপনার প্রাইমারি গুগল ক্যালেন্ডারে {selectedIds.length}টি ওয়াক্ত ও আমল ইভেন্ট বাংলাদেশ সময় অনুযায়ী যুক্ত করা হবে।
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 text-xs"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleExecuteSync}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs"
                >
                  হ্যাঁ, যোগ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs text-zinc-400"
          >
            বন্ধ
          </button>

          <button
            onClick={handleInitiateSync}
            disabled={isSyncing || selectedIds.length === 0}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs shadow-md transition-all cc-light-swipe disabled:opacity-50"
          >
            {isSyncing ? 'সিঙ্ক হচ্ছে...' : `ক্যালেন্ডারে সিঙ্ক করুন (${selectedIds.length})`}
          </button>
        </div>

      </div>
    </div>
  );
};

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
        const res = await googleSignIn(true);
        if (!res.success) {
          setAuthError(res.friendlyMessage || 'গুগল সাইন ইন সম্পন্ন হয়নি।');
          return;
        }
      } catch (err: any) {
        setAuthError('গুগল সাইন ইন সম্পন্ন হয়নি।');
        return;
      }
    }

    const token = await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn(true);
        if (!res.success) {
          setAuthError(res.friendlyMessage || 'গুগল ক্যালেন্ডারের অনুমতি পাওয়া যায়নি।');
          return;
        }
      } catch {
        setAuthError('গুগল ক্যালেন্ডারের অনুমতি পাওয়া যায়নি।');
        return;
      }
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">গুগল ক্যালেন্ডার সিঙ্ক</h3>
              <p className="text-[10px] text-slate-500 font-medium">বাংলাদেশ সময় (Asia/Dhaka)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices */}
        {authError && (
          <div className="mt-2.5 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {syncResult && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncResult.successCount}টি সালাত ও আমল ক্যালেন্ডারে যুক্ত হয়েছে!</span>
          </div>
        )}

        {/* Controls */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 shrink-0 font-medium">
          <span>নির্বাচিত: <strong className="text-slate-800">{selectedIds.length}</strong>/{suggestedEvents.length}</span>
          <button
            onClick={handleSelectAll}
            className="text-emerald-600 hover:text-emerald-700 font-bold"
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
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <p className="text-xs font-bold text-slate-800 truncate">
                    {event.title}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 shrink-0">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{event.startTime}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Confirmation */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-white/95 backdrop-blur-md rounded-3xl animate-in zoom-in-95">
            <div className="text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-sm font-extrabold text-slate-800 mb-1">
                ক্যালেন্ডারে ইভেন্ট যুক্ত করতে চান?
              </h4>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                আপনার প্রাইমারি গুগল ক্যালেন্ডারে {selectedIds.length}টি ওয়াক্ত ও আমল ইভেন্ট বাংলাদেশ সময় অনুযায়ী যুক্ত করা হবে।
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleExecuteSync}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  হ্যাঁ, যোগ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-700"
          >
            বন্ধ
          </button>

          <button
            onClick={handleInitiateSync}
            disabled={isSyncing || selectedIds.length === 0}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cc-light-swipe disabled:opacity-50"
          >
            {isSyncing ? 'সিঙ্ক হচ্ছে...' : `ক্যালেন্ডারে সিঙ্ক করুন (${selectedIds.length})`}
          </button>
        </div>

      </div>
    </div>
  );
};

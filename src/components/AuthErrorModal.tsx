import React from 'react';
import { AlertCircle, ExternalLink, UserCheck, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { openInStandaloneTab } from '../firebase';

interface AuthErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorCode?: string;
  errorMessage?: string;
  onContinueAsGuest: () => void;
  onRetry: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  isOpen,
  onClose,
  errorCode,
  errorMessage,
  onContinueAsGuest,
  onRetry,
}) => {
  if (!isOpen) return null;

  const isPopupBlocked = errorCode === 'auth/popup-blocked';
  const isUnauthorizedDomain = errorCode === 'auth/unauthorized-domain';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50 text-rose-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight leading-tight">
                সাইন-ইন তথ্য ও সমাধান
              </h3>
              <p className="text-[11px] text-rose-600 font-medium">
                সহজ সমাধান বেছে নিন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-rose-200/60 text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <p className="font-semibold text-slate-900 mb-1">
              {isPopupBlocked
                ? 'ব্রাউজারে পপ-আপ উইন্ডো ব্লক করা হয়েছে'
                : isUnauthorizedDomain
                ? 'আইফ্রেম বা প্রিভিউ ডোমেইনের নিরাপত্তা সতর্কতা'
                : 'গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হয়নি'}
            </p>
            <p className="text-slate-600">
              {errorMessage || 'ব্রাউজারের নিরাপত্তা পলিসির কারণে গুগল লগইন উইন্ডোটি খুলতে পারেনি।'}
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Quick Solution 1: Continue as Guest with full cloud persistence */}
            <button
              onClick={() => {
                onContinueAsGuest();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              অতিথি (Guest) অ্যাকাউন্টে তাৎক্ষণিক প্রবেশ করুন
            </button>

            {/* Quick Solution 2: Open standalone window */}
            <button
              onClick={openInStandaloneTab}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              নতুন ট্যাবে ওপেন করুন (পপ-আপ সমস্যা ছাড়াই)
            </button>

            {/* Quick Solution 3: Retry */}
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              পুনরায় গুগল দিয়ে চেষ্টা করুন
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

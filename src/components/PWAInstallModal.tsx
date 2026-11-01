import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle, 
  Smartphone, 
  X, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  ExternalLink 
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isInIframe, openInStandaloneTab } from '../firebase';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const inIframe = isInIframe();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          setInstallSuccess(false);
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight leading-tight">
                মোবাইল অ্যাপ ইনস্টল করুন
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                PWA হিসেবে ফোনে ইনস্টল করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* App Badge Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
            <img
              src="/pwa-192x192.png"
              alt="Daily Amol Checklist Icon"
              className="w-13 h-13 rounded-2xl shadow-md border border-emerald-500/20"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 truncate">
                দৈনিক আমল চেকলিস্ট
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Daily Amol Checklist • v1.2
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  অফলাইন সক্ষম
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  সম্পূর্ণ সুরক্ষিত
                </span>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>মোবাইল হোমস্ক্রিন থেকে এক ক্লিকে দ্রুত ওপেন</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <WifiOff className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ইন্টারনেট দুর্বল বা না থাকলেও অফলাইনে ট্র্যাকিং</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ব্রাউজার ইউআরএল বার ছাড়া নেটিভ মোবাইল অ্যাপ অভিজ্ঞতা</span>
            </div>
          </div>

          {/* Installation states */}
          {isInstalled ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-emerald-800">
                অ্যাপটি ইতোমধ্যেই আপনার ডিভাইসে ইনস্টল করা আছে!
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                হোমস্ক্রিনের আইকন থেকে সরাসরি ব্যবহার করতে পারেন।
              </p>
            </div>
          ) : inIframe ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
              <div className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  পরিচালক বা ব্যবহারকারীর ফোনে সরাসরি ইনস্টল করতে নিচের বাটনে ক্লিক করে ফুল ব্রাউজারে খুলুন, এরপর সহজেই 'Install' বাটনে চাপ দিন।
                </p>
              </div>
              <button
                onClick={openInStandaloneTab}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                ফুল স্ক্রিন ব্রাউজারে খুলুন ও ইনস্টল করুন
              </button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-2">
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                এখনই ফোনে ইনস্টল করুন
              </button>
              {installSuccess && (
                <p className="text-center text-xs text-emerald-600 font-bold">
                  ইনস্টলেশন সফল হয়েছে!
                </p>
              )}
            </div>
          ) : isIOS ? (
            /* iPhone Safari instructions */
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <p className="text-xs font-bold text-slate-800">
                আইফোন / আইপ্যাডে (iOS) ইনস্টল করার নিয়ম:
              </p>
              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>সাফারি ব্রাউজারের নিচের <strong>শেয়ার (Share) <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /></strong> আইকনে চাপ দিন।</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>মেনু স্ক্রোল করে <strong>Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /></strong> অপশন সিলেক্ট করুন।</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>উপরে ডানপাশে <strong>Add</strong> বাটনে ট্যাপ করলেই হোমস্ক্রিনে চলে আসবে।</span>
                </div>
              </div>
            </div>
          ) : (
            /* Android Chrome / Desktop instructions */
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-800">
                ব্রাউজার মেনু থেকে ইনস্টল করার নিয়ম:
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <p>১. ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮) মেনুতে</strong> চাপ দিন।</p>
                <p>২. <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> সিলেক্ট করুন।</p>
                <p>৩. নিশ্চিতকরণে ক্লিক করলেই অ্যাপটি হোমস্ক্রিনে যোগ হয়ে যাবে।</p>
              </div>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            বন্ধ করুন
          </button>

        </div>

      </div>
    </div>
  );
};

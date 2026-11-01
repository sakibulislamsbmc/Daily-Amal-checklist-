import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Mail, 
  Phone, 
  Linkedin, 
  Facebook, 
  Check, 
  Copy, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck,
  Code2,
  Layers,
  HeartHandshake
} from 'lucide-react';

interface DeveloperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperInfoModal: React.FC<DeveloperInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const devData = {
    name: 'Sakibul Islam Sabbir',
    nameBn: 'সাকিবুল ইসলাম সাব্বির',
    headline: 'Full-Stack Developer & UI/UX Designer',
    subtitle: 'Founder & CEO, Bismahsoft',
    avatarUrl: 'https://kommodo.ai/i/ejBnkf03L6j67RNAGz9e',
    bio1: 'Full-Stack Web Developer and UI/UX Designer focused on crafting clean, high-performance web applications with modern tech stacks.',
    bio2: 'Student at As-Sunnah Skill Development Institute (Small Business Management Course, Batch 29, Department of Creative).',
    email: 'sakibulislamsbmc@gmail.com',
    phone: '+8801410957506',
    whatsappUrl: 'https://wa.me/8801410957506',
    facebookUrl: 'https://www.facebook.com/share/18jJa1Fom2/',
    linkedinUrl: 'https://linkedin.com/in/sakibulislamsabbir',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0a0f12] text-white rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="relative px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src="/favicon.png" 
              alt="Daily Amol Icon" 
              className="w-6 h-6 rounded-lg shadow-sm border border-emerald-500/40"
            />
            <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
              App Developer Information
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Developer Card with Avatar */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            
            {/* Avatar with emerald ring & verified badge */}
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full ring-4 ring-emerald-500/60 p-1 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl overflow-hidden">
                <img
                  src={devData.avatarUrl}
                  alt={devData.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to initials if image host takes time
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div 
                className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md border-2 border-[#0a0f12]"
                title="Verified Creator"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Name & Titles */}
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              {devData.name}
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              {devData.nameBn}
            </p>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
              <Code2 className="w-3 h-3" />
              {devData.headline}
            </div>

            <p className="text-xs font-semibold text-slate-300 mt-1.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              {devData.subtitle}
            </p>
          </div>

          {/* Bio / About Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              পরিচিতি ও তথ্য
            </h4>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs text-slate-200 leading-relaxed font-normal">
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 text-base leading-none">›</span>
                <span>{devData.bio1}</span>
              </p>
              
              <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-slate-300">
                <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{devData.bio2}</span>
              </div>
            </div>
          </div>

          {/* Social & Contact Actions */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              যোগাযোগ ও সোশ্যাল মিডিয়া
            </h4>

            <div className="grid grid-cols-2 gap-2">
              
              {/* Facebook */}
              <a
                href={devData.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-400" />
                  <span>Facebook</span>
                </div>
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </a>

              {/* LinkedIn */}
              <a
                href={devData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-200 text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-sky-400" />
                  <span>LinkedIn</span>
                </div>
                <ExternalLink className="w-3 h-3 text-sky-400" />
              </a>

              {/* WhatsApp */}
              <a
                href={devData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </div>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>

              {/* Email */}
              <a
                href={`mailto:${devData.email}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200 text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Email Me</span>
                </div>
                <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
              </a>

            </div>

            {/* Quick Copy Contact Details */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[11px] font-medium text-slate-400">Email:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>{devData.email}</span>
                  <button
                    onClick={() => handleCopy(devData.email, 'email')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                    title="ইমেইল কপি করুন"
                  >
                    {copiedKey === 'email' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-[11px] font-medium text-slate-400">WhatsApp / Phone:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>+880 1410-957506</span>
                  <button
                    onClick={() => handleCopy('+8801410957506', 'phone')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                    title="নাম্বার কপি করুন"
                  >
                    {copiedKey === 'phone' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* App Branding & Dedication */}
          <div className="text-center pt-2 pb-1">
            <p className="text-[10px] text-slate-400">
              Daily Amol Checklist • Built with devotion for daily Muhasaba & Akhirah preparation
            </p>
            <p className="text-[9px] text-emerald-400/80 font-mono mt-0.5">
              Developed by Bismahsoft © 2026
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

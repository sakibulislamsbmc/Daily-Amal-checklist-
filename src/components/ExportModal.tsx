import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Download, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MonthlyStatsReport } from '../types';
import { 
  generateMonthlyReportData, 
  exportToWordDocx, 
  exportToExcel, 
  exportExecutiveCardAsJpeg 
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateStr: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentDateStr,
}) => {
  const initialYearMonth = currentDateStr.substring(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(initialYearMonth);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const report = useMemo(() => {
    return generateMonthlyReportData(selectedMonth);
  }, [selectedMonth]);

  if (!isOpen) return null;

  const handleExportDocx = async () => {
    try {
      setIsExporting('docx');
      setExportNotice(null);
      await exportToWordDocx(report);
      setExportNotice('Microsoft Word (.docx) ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch (err: any) {
      setExportNotice(`Word এক্সপোর্ট ব্যর্থ: ${err.message || 'Error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportXlsx = () => {
    try {
      setIsExporting('xlsx');
      setExportNotice(null);
      exportToExcel(report);
      setExportNotice('Microsoft Excel (.xlsx) ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch (err: any) {
      setExportNotice(`Excel এক্সপোর্ট ব্যর্থ: ${err.message || 'Error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportJpeg = async () => {
    try {
      setIsExporting('jpeg');
      setExportNotice(null);
      await exportExecutiveCardAsJpeg('monthly-executive-card-to-capture', selectedMonth);
      setExportNotice('হাই-রেজোলিউশন সামারি কার্ড ইমেজ (.jpg) ডাউনলোড হয়েছে!');
    } catch (err: any) {
      setExportNotice(`ইমেজ এক্সপোর্ট ব্যর্থ: ${err.message || 'Error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-5 relative border border-white/10 shadow-2xl bg-[#0a0a0a] max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">মাসিক মুহাসাবা এক্সপোর্ট সেন্টার</h3>
              <p className="text-[11px] text-zinc-400">Word, Excel ও হাই-রেজোলিউশন ইমেজ রিপোর্ট</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Picker */}
        <div className="mt-3.5 flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>মাস নির্বাচন করুন:</span>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>

        {/* Status Notice */}
        {exportNotice && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Scrollable Executive Summary Card (Target for JPEG Capture as well!) */}
        <div className="mt-3.5 flex-1 overflow-y-auto pr-1">
          <div 
            id="monthly-executive-card-to-capture"
            className="p-4 rounded-3xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/10 relative overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                  Executive Summary
                </span>
                <h4 className="text-base font-extrabold text-white">
                  মাসিক মুহাসাবা ফলাফল
                </h4>
                <p className="text-xs text-zinc-400">{report.monthNameBn}</p>
              </div>

              {/* Big Score Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
                <div className="w-full h-full bg-[#050505] rounded-[14px] flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-emerald-400 font-mono leading-none">
                    {report.monthlyAggregateScore}%
                  </span>
                  <span className="text-[8px] text-zinc-400 uppercase mt-0.5">সামগ্রিক</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-zinc-400">লিপিবদ্ধ দিন</p>
                <p className="text-xs font-bold text-white font-mono mt-0.5">{report.totalDaysLogged} দিন</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-zinc-400">ওয়াক্তমতো</p>
                <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{report.onTimeCount}টি</p>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-zinc-400">দেরিতে সম্পন্ন</p>
                <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">{report.lateCount}টি</p>
              </div>
            </div>

            {/* Weekly Averages Progress Bars */}
            <div className="mt-3.5 space-y-2">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                সাপ্তাহিক গড়ের অগ্রগতি:
              </span>
              {report.weeklyAverages.map((w, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                    <span>{w.weekLabel.split(' (')[0]}</span>
                    <span className="font-mono font-bold text-emerald-400">{w.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${w.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Remarks Snippet */}
            {report.remarksList.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider">বিলম্বের কারণসমূহ ({report.remarksList.length}):</span>
                  <span>সর্বশেষ লগ</span>
                </div>
                <div className="space-y-1 text-[11px] text-zinc-300 max-h-24 overflow-y-auto pr-1">
                  {report.remarksList.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-white/5 truncate">
                      <strong className="text-amber-300">{r.amolTitle}:</strong> {r.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 text-[9px] text-zinc-500 text-center tracking-wider uppercase font-mono">
              Daily Amol Checklist • Asia/Dhaka GMT+6
            </div>
          </div>
        </div>

        {/* 3 Export Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            
            {/* Word .docx */}
            <button
              onClick={handleExportDocx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white">Word (.docx)</span>
              <span className="text-[9px] text-zinc-400">পূর্ণাঙ্গ রিপোর্ট</span>
            </button>

            {/* Excel .xlsx */}
            <button
              onClick={handleExportXlsx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white">Excel (.xlsx)</span>
              <span className="text-[9px] text-zinc-400">ডাটা শিট</span>
            </button>

            {/* Image .jpg */}
            <button
              onClick={handleExportJpeg}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <ImageIcon className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-white">Image (.jpg)</span>
              <span className="text-[9px] text-zinc-400">সামারি কার্ড</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

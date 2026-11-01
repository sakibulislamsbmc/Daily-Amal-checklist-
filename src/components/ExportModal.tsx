import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Download, 
  Calendar, 
  CheckCircle2
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">মাসিক মুহাসাবা রিপোর্ট</h3>
              <p className="text-[11px] text-slate-500 font-medium">Word, Excel ও হাই-রেজোলিউশন ইমেজ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Picker */}
        <div className="mt-3.5 flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>মাস নির্বাচন করুন:</span>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-emerald-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Status Notice */}
        {exportNotice && (
          <div className="mt-2.5 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Scrollable Executive Summary Card */}
        <div className="mt-3.5 flex-1 overflow-y-auto pr-1">
          <div 
            id="monthly-executive-card-to-capture"
            className="p-4 rounded-3xl progress-card-gradient text-white relative overflow-hidden shadow-md"
          >
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">
                  Executive Summary
                </span>
                <h4 className="text-base font-extrabold text-white">
                  মাসিক মুহাসাবা ফলাফল
                </h4>
                <p className="text-xs text-white/90 font-medium">{report.monthNameBn}</p>
              </div>

              {/* Big Score Badge */}
              <div className="w-13 h-13 rounded-2xl bg-white/20 p-1 flex items-center justify-center border border-white/30">
                <div className="w-full h-full bg-white text-[#BA6B70] rounded-xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-sm font-black font-mono leading-none">
                    {report.monthlyAggregateScore}%
                  </span>
                  <span className="text-[8px] uppercase mt-0.5 font-bold">সামগ্রিক</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 rounded-xl bg-white/15 border border-white/10">
                <p className="text-[10px] text-white/80">লিপিবদ্ধ দিন</p>
                <p className="text-xs font-bold font-mono mt-0.5">{report.totalDaysLogged} দিন</p>
              </div>
              <div className="p-2 rounded-xl bg-white/15 border border-white/10">
                <p className="text-[10px] text-white/80">ওয়াক্তমতো</p>
                <p className="text-xs font-bold font-mono mt-0.5">{report.onTimeCount}টি</p>
              </div>
              <div className="p-2 rounded-xl bg-white/15 border border-white/10">
                <p className="text-[10px] text-white/80">বিলম্বে</p>
                <p className="text-xs font-bold font-mono mt-0.5">{report.lateCount}টি</p>
              </div>
            </div>

            {/* Weekly Averages Progress Bars */}
            <div className="mt-3.5 space-y-2">
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider block">
                সাপ্তাহিক গড়ের চিত্র:
              </span>
              {report.weeklyAverages.map((w, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between text-[11px] text-white/90 font-semibold mb-1">
                    <span>{w.weekLabel.split(' (')[0]}</span>
                    <span className="font-mono font-bold">{w.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${w.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Remarks */}
            {report.remarksList.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] text-white/90 font-bold mb-1.5">
                  <span className="uppercase tracking-wider">বিলম্বের কারণসমূহ ({report.remarksList.length}):</span>
                  <span>সর্বশেষ</span>
                </div>
                <div className="space-y-1 text-[11px] text-white/95 max-h-24 overflow-y-auto pr-1">
                  {report.remarksList.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-white/15 truncate font-medium">
                      <strong>{r.amolTitle}:</strong> {r.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 text-[9px] text-white/70 text-center tracking-wider uppercase font-mono">
              Daily Amol Checklist • Asia/Dhaka GMT+6
            </div>
          </div>
        </div>

        {/* 3 Export Action Buttons */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            
            {/* Word .docx */}
            <button
              onClick={handleExportDocx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <FileText className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold text-blue-900">Word (.docx)</span>
              <span className="text-[9px] text-blue-600 font-medium">পূর্ণাঙ্গ রিপোর্ট</span>
            </button>

            {/* Excel .xlsx */}
            <button
              onClick={handleExportXlsx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold text-emerald-900">Excel (.xlsx)</span>
              <span className="text-[9px] text-emerald-600 font-medium">ডাটা শিট</span>
            </button>

            {/* Image .jpg */}
            <button
              onClick={handleExportJpeg}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center transition-all flex flex-col items-center justify-center gap-1 group cc-light-swipe"
            >
              <ImageIcon className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-extrabold text-rose-900">Image (.jpg)</span>
              <span className="text-[9px] text-rose-600 font-medium">কার্ড ইমেজ</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

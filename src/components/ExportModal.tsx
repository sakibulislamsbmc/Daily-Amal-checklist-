import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Download, 
  Calendar, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { DayAmolState, AmolItem } from '../types';
import { 
  generateMonthlyReportData, 
  getFilteredEntriesByTimeframe,
  exportToWordDocx, 
  exportToExcel, 
  exportExecutiveCardAsJpeg,
  ReportTimeframe
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateStr: string;
  dayState?: DayAmolState;
  allAmols?: AmolItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentDateStr,
  dayState,
  allAmols,
}) => {
  const initialYearMonth = currentDateStr.substring(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(initialYearMonth);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('monthly');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(currentDateStr);
    setSelectedMonth(currentDateStr.substring(0, 7));
  }, [currentDateStr]);

  const report = useMemo(() => {
    return generateMonthlyReportData(selectedMonth, dayState, allAmols);
  }, [selectedMonth, dayState, allAmols, isOpen]);

  const activeSummary = useMemo(() => {
    return getFilteredEntriesByTimeframe(report, timeframe, selectedDate);
  }, [report, timeframe, selectedDate]);

  if (!isOpen) return null;

  const handleExportDocx = async () => {
    try {
      setIsExporting('docx');
      setExportNotice(null);
      await exportToWordDocx(report, timeframe, selectedDate);
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
      exportToExcel(report, timeframe, selectedDate);
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
      await exportExecutiveCardAsJpeg('monthly-executive-card-to-capture', selectedMonth, timeframe);
      setExportNotice('হাই-রেজোলিউশন সামারি কার্ড ইমেজ (.jpg) ডাউনলোড হয়েছে!');
    } catch (err: any) {
      setExportNotice(`ইমেজ এক্সপোর্ট ব্যর্থ: ${err.message || 'Error'}`);
    } finally {
      setIsExporting(null);
    }
  };

  const timeframeButtons: { id: ReportTimeframe; label: string }[] = [
    { id: 'monthly', label: 'সম্পূর্ণ মাস' },
    { id: 'daily', label: 'দৈনিক' },
    { id: 'week1', label: 'সপ্তাহ ১' },
    { id: 'week2', label: 'সপ্তাহ ২' },
    { id: 'week3', label: 'সপ্তাহ ৩' },
    { id: 'week4', label: 'সপ্তাহ ৪' },
    ...(report.weeklyAverages.length > 4 ? [{ id: 'week5' as ReportTimeframe, label: 'সপ্তাহ ৫' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-anek-bangla">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 text-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 flex items-center justify-center text-white icon-3d-badge cc-light-swipe cc-light-swipe-continuous">
              <Download className="w-4 h-4 relative z-[3] stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">মুহাসাবা রিপোর্ট ও এক্সপোর্ট</h3>
              <p className="text-[11px] text-slate-500 font-semibold">দৈনিক, সাপ্তাহিক ও মাসিক বিস্তারিত ফলাফল</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Date Picker Row */}
        <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-extrabold">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{timeframe === 'daily' ? 'তারিখ নির্বাচন:' : 'মাস নির্বাচন:'}</span>
          </div>
          {timeframe === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSelectedDate(val);
                  setSelectedMonth(val.substring(0, 7));
                }
              }}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-emerald-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-emerald-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          )}
        </div>

        {/* Timeframe Selector Tabs (Monthly, Daily, Week 1, Week 2, Week 3, Week 4, Week 5) */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {timeframeButtons.map((btn) => {
            const isActive = timeframe === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setTimeframe(btn.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Status Notice */}
        {exportNotice && (
          <div className="mt-2 p-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Scrollable Executive Summary Card */}
        <div className="mt-2.5 flex-1 overflow-y-auto pr-1">
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
                  {activeSummary.titleBn}
                </h4>
                <p className="text-xs text-white/90 font-semibold">{activeSummary.subtitleBn}</p>
              </div>

              {/* Big Score Badge */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 p-1 flex items-center justify-center border border-white/30">
                <div className="w-full h-full bg-white text-[#BA6B70] rounded-xl flex flex-col items-center justify-center shadow-sm">
                  <span className="text-sm font-black font-mono leading-none">
                    {activeSummary.score}%
                  </span>
                  <span className="text-[8px] uppercase mt-0.5 font-extrabold">গড় স্কোর</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 rounded-xl bg-white/15 border border-white/15">
                <p className="text-[10px] text-white/85 font-semibold">লিপিবদ্ধ দিন</p>
                <p className="text-xs font-extrabold font-mono mt-0.5">
                  {activeSummary.loggedDays}/{activeSummary.totalDays} দিন
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/15 border border-white/15">
                <p className="text-[10px] text-white/85 font-semibold">ওয়াক্তমতো আমল</p>
                <p className="text-xs font-extrabold font-mono mt-0.5">{activeSummary.onTime}টি</p>
              </div>
              <div className="p-2 rounded-xl bg-white/15 border border-white/15">
                <p className="text-[10px] text-white/85 font-semibold">বিলম্বে সম্পন্ন</p>
                <p className="text-xs font-extrabold font-mono mt-0.5">{activeSummary.late}টি</p>
              </div>
            </div>

            {/* Weekly Averages Progress Bars (Always visible & clickable to inspect any week!) */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-white/95 uppercase tracking-wider">
                  সাপ্তাহিক গড়ের চিত্র (ক্লিক করে সপ্তাহ দেখুন):
                </span>
                <span className="text-[10px] font-bold text-white/80">
                  মোট আমল: {activeSummary.completedAmols}টি
                </span>
              </div>
              {report.weeklyAverages.map((w, i) => {
                const weekId = `week${i + 1}` as ReportTimeframe;
                const isSelectedWeek = timeframe === weekId;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTimeframe(weekId)}
                    className={`w-full text-left p-2 rounded-xl transition-all ${
                      isSelectedWeek
                        ? 'bg-white/25 ring-1 ring-white'
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex justify-between text-[11px] text-white font-bold mb-1">
                      <span>
                        {w.weekLabel} • <span className="text-white/80 font-normal">({w.loggedDays}/{w.totalDaysInWeek} দিন, {w.completedAmolsCount}টি আমল)</span>
                      </span>
                      <span className="font-mono font-black">{w.score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(w.score, w.loggedDays > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Daily Breakdown for Selected Timeframe */}
            <div className="mt-3.5 pt-3 border-t border-white/20">
              <div className="flex items-center justify-between text-[10px] text-white/95 font-extrabold mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>দিনভিত্তিক বিস্তারিত আমলনামা ({activeSummary.titleBn}):</span>
                </span>
                <span>স্কোর</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activeSummary.entries.filter((e) => timeframe === 'daily' || e.isLogged).length > 0 ? (
                  activeSummary.entries
                    .filter((e) => timeframe === 'daily' || e.isLogged)
                    .map((entry) => (
                      <div
                        key={entry.date}
                        onClick={() => {
                          setSelectedDate(entry.date);
                          setTimeframe('daily');
                        }}
                        className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-white">
                          <span>তারিখ: {entry.date}</span>
                          <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded-md">
                            {entry.score}% ({entry.completedCount}টি আমল)
                          </span>
                        </div>
                        {entry.completedTitles.length > 0 ? (
                          <p className="text-[10px] text-white/90 mt-1 line-clamp-2 font-medium">
                            সম্পন্ন: {entry.completedTitles.join(' • ')}
                          </p>
                        ) : (
                          <p className="text-[10px] text-white/75 mt-0.5">
                            {entry.isLogged
                              ? `সাব-টাস্ক: ${entry.subTaskCount}টি • তাসবীহ: ${entry.tasbeehTotal} বার`
                              : 'এই তারিখে কোনো আমল এখনও টিক দেওয়া হয়নি।'}
                          </p>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/10 text-[11px] text-white/90 text-center font-medium">
                    নির্বাচিত সময়কালে এখনও কোনো আমল লিপিবদ্ধ হয়নি। চেকলিস্টে আমল সম্পন্ন করলেই এখানে তাৎক্ষণিক রিপোর্ট দেখা যাবে।
                  </div>
                )}
              </div>
            </div>

            {/* Recent Remarks */}
            {report.remarksList.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] text-white/90 font-bold mb-1">
                  <span className="uppercase tracking-wider">বিলম্বের কারণসমূহ ({report.remarksList.length}):</span>
                  <span>সর্বশেষ</span>
                </div>
                <div className="space-y-1 text-[11px] text-white/95 max-h-20 overflow-y-auto pr-1">
                  {report.remarksList.slice(0, 3).map((r, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-white/15 truncate font-medium">
                      <strong>{r.amolTitle}:</strong> {r.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 text-[9px] text-white/75 text-center tracking-wider uppercase font-mono">
              Daily Amol Checklist • Asia/Dhaka GMT+6
            </div>
          </div>
        </div>

        {/* 3 Export Action Buttons with 3D Icons & CC Light Sweep */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-2.5">
            
            {/* Word .docx — 3D Glossy Blue Badge */}
            <button
              onClick={handleExportDocx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/90 shadow-sm text-center transition-all flex flex-col items-center justify-center gap-1.5 group cc-light-swipe active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 stroke-[2.4] drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] relative z-[3]" />
              </div>
              <span className="text-[11px] font-black text-blue-950 leading-none mt-0.5">Word (.docx)</span>
              <span className="text-[9px] text-blue-700 font-bold leading-none">পূর্ণাঙ্গ রিপোর্ট</span>
            </button>

            {/* Excel .xlsx — 3D Glossy Emerald Badge */}
            <button
              onClick={handleExportXlsx}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-gradient-to-b from-emerald-50 to-teal-50/80 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 shadow-sm text-center transition-all flex flex-col items-center justify-center gap-1.5 group cc-light-swipe active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5 stroke-[2.4] drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] relative z-[3]" />
              </div>
              <span className="text-[11px] font-black text-emerald-950 leading-none mt-0.5">Excel (.xlsx)</span>
              <span className="text-[9px] text-emerald-700 font-bold leading-none">ডাটা শিট</span>
            </button>

            {/* Image .jpg — 3D Glossy Rose/Purple Badge */}
            <button
              onClick={handleExportJpeg}
              disabled={isExporting !== null}
              className="p-2.5 rounded-2xl bg-gradient-to-b from-rose-50 to-pink-50/80 hover:from-rose-100 hover:to-pink-100 border border-rose-200/90 shadow-sm text-center transition-all flex flex-col items-center justify-center gap-1.5 group cc-light-swipe active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-800 text-white flex items-center justify-center icon-3d-badge cc-light-swipe cc-light-swipe-continuous group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5 stroke-[2.4] drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] relative z-[3]" />
              </div>
              <span className="text-[11px] font-black text-rose-950 leading-none mt-0.5">Image (.jpg)</span>
              <span className="text-[9px] text-rose-700 font-bold leading-none">কার্ড ইমেজ</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

import * as XLSX from 'xlsx';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  HeadingLevel, 
  AlignmentType
} from 'docx';
import { toJpeg } from 'html-to-image';
import { MonthlyStatsReport, DayAmolState, AmolItem, DailyReportEntry, WeeklyReportSummary } from '../types';
import { PRAYER_AMOLS, CORE_24_AMOLS, OPTIONAL_AMOLS } from '../data/defaultAmols';
import { calculateMuhasabaScore, loadDayStateLocal, loadCustomAmols } from './amolStorage';
import { loadEnabledOptionalIds } from './userService';

export type ReportTimeframe = 'monthly' | 'daily' | 'week1' | 'week2' | 'week3' | 'week4' | 'week5';

/**
 * Resolve active Amol list matching the user's current checklist configuration
 */
export function resolveActiveAmols(passedAmols?: AmolItem[]): AmolItem[] {
  if (passedAmols && passedAmols.length > 0) {
    return passedAmols;
  }
  const enabledOptionals = loadEnabledOptionalIds();
  const activeOptionals = OPTIONAL_AMOLS.filter((opt) => enabledOptionals.includes(opt.id));
  return [...PRAYER_AMOLS, ...CORE_24_AMOLS, ...activeOptionals, ...loadCustomAmols()];
}

/**
 * Compile Monthly, Weekly (Week 1-5), and Daily Statistics & Amol Logs for a target month (YYYY-MM)
 */
export function generateMonthlyReportData(
  yearMonth: string,
  liveDayState?: DayAmolState,
  passedAmols?: AmolItem[]
): MonthlyStatsReport {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const allAmols = resolveActiveAmols(passedAmols);

  let totalLoggedDays = 0;
  let scoreSum = 0;
  let totalCompletedAmols = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  const remarksList: MonthlyStatsReport['remarksList'] = [];
  const dailyBreakdown: DailyReportEntry[] = [];

  // Determine number of weeks in this month (4 or 5)
  const numWeeks = totalDaysInMonth > 28 ? 5 : 4;
  const weeklyBuckets: {
    scores: number[];
    completedCount: number;
    onTime: number;
    late: number;
    totalDays: number;
  }[] = Array.from({ length: numWeeks }, () => ({
    scores: [],
    completedCount: 0,
    onTime: 0,
    late: 0,
    totalDays: 0,
  }));

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;

    // Use live React state if matching date, otherwise read from localStorage
    const state: DayAmolState =
      liveDayState && liveDayState.date === dateStr
        ? liveDayState
        : loadDayStateLocal(dateStr);

    const weekIndex = Math.min(numWeeks - 1, Math.floor((day - 1) / 7));
    weeklyBuckets[weekIndex].totalDays++;

    const completedIds = state?.completedAmolIds || [];
    const subTaskIds = state?.subTaskCompletedIds || [];
    const tasbeehTotal = Object.values(state?.tasbeehCounts || {}).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );

    const hasActivity =
      completedIds.length > 0 ||
      subTaskIds.length > 0 ||
      tasbeehTotal > 0 ||
      Boolean(state?.reflectionNote && state.reflectionNote.trim().length > 0);

    const scoreObj = calculateMuhasabaScore(state, allAmols);

    let dayOnTime = 0;
    let dayLate = 0;
    const completedTitles: string[] = [];

    completedIds.forEach((amolId) => {
      const item = allAmols.find((a) => a.id === amolId);
      if (item) {
        completedTitles.push(item.titleBn);
      }
      const remark = state.amolRemarks?.[amolId];

      if (remark && remark.wasLate) {
        dayLate++;
        lateCount++;
        if (remark.reason) {
          remarksList.push({
            date: dateStr,
            amolTitle: item?.titleBn || amolId,
            reason: remark.reason,
            time: remark.timestamp
              ? new Date(remark.timestamp).toLocaleTimeString('bn-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-',
          });
        }
      } else {
        dayOnTime++;
        onTimeCount++;
      }
    });

    if (hasActivity) {
      totalLoggedDays++;
      scoreSum += scoreObj.percentage;
      totalCompletedAmols += completedIds.length;

      weeklyBuckets[weekIndex].scores.push(scoreObj.percentage);
      weeklyBuckets[weekIndex].completedCount += completedIds.length;
      weeklyBuckets[weekIndex].onTime += dayOnTime;
      weeklyBuckets[weekIndex].late += dayLate;
    }

    dailyBreakdown.push({
      date: dateStr,
      dayNumber: day,
      weekIndex,
      score: scoreObj.percentage,
      earnedPoints: scoreObj.earnedPoints,
      totalPossiblePoints: scoreObj.totalPossiblePoints,
      completedCount: completedIds.length,
      subTaskCount: subTaskIds.length,
      onTimeCount: dayOnTime,
      lateCount: dayLate,
      completedTitles,
      reflectionNote: state?.reflectionNote || '',
      tasbeehTotal,
      isLogged: hasActivity,
    });
  }

  const dailyScoreAverage = totalLoggedDays > 0 ? Math.round(scoreSum / totalLoggedDays) : 0;
  // Use average of logged days as the primary performance score so active users see their true progress
  const monthlyAggregateScore = dailyScoreAverage;

  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBnNum = (n: number) =>
    String(n)
      .split('')
      .map((c) => bnDigits[Number(c)] ?? c)
      .join('');

  const weeklyAverages: WeeklyReportSummary[] = weeklyBuckets.map((bucket, idx) => {
    const startDay = idx * 7 + 1;
    const endDay = Math.min(totalDaysInMonth, (idx + 1) * 7);
    const avg =
      bucket.scores.length > 0
        ? Math.round(bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length)
        : 0;

    return {
      weekIndex: idx,
      weekLabel: `সপ্তাহ ${toBnNum(idx + 1)} (দিন ${toBnNum(startDay)} - ${toBnNum(endDay)})`,
      shortLabel: `সপ্তাহ ${toBnNum(idx + 1)}`,
      dateRangeBn: `${toBnNum(startDay)} - ${toBnNum(endDay)} তারিখ`,
      score: avg,
      loggedDays: bucket.scores.length,
      totalDaysInWeek: bucket.totalDays,
      completedAmolsCount: bucket.completedCount,
      onTimeCount: bucket.onTime,
      lateCount: bucket.late,
    };
  });

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  return {
    monthStr: yearMonth,
    monthNameBn: `${monthNamesBn[month - 1] || monthStr} ${year}`,
    totalDaysInMonth,
    totalDaysLogged: totalLoggedDays,
    dailyScoreAverage,
    weeklyAverages,
    dailyBreakdown,
    monthlyAggregateScore,
    totalCompletedAmols,
    onTimeCount,
    lateCount,
    remarksList,
  };
}

/**
 * Filter daily entries by selected timeframe
 */
export function getFilteredEntriesByTimeframe(
  report: MonthlyStatsReport,
  timeframe: ReportTimeframe,
  selectedDateStr: string
): {
  titleBn: string;
  subtitleBn: string;
  score: number;
  loggedDays: number;
  totalDays: number;
  completedAmols: number;
  onTime: number;
  late: number;
  entries: DailyReportEntry[];
} {
  if (timeframe === 'daily') {
    const targetEntry =
      report.dailyBreakdown.find((d) => d.date === selectedDateStr) ||
      report.dailyBreakdown[0];
    return {
      titleBn: 'দৈনিক মুহাসাবা ফলাফল',
      subtitleBn: `তারিখ: ${targetEntry?.date || selectedDateStr}`,
      score: targetEntry?.score || 0,
      loggedDays: targetEntry?.isLogged ? 1 : 0,
      totalDays: 1,
      completedAmols: targetEntry?.completedCount || 0,
      onTime: targetEntry?.onTimeCount || 0,
      late: targetEntry?.lateCount || 0,
      entries: targetEntry ? [targetEntry] : [],
    };
  }

  if (timeframe.startsWith('week')) {
    const weekIdx = Number(timeframe.replace('week', '')) - 1;
    const weekSummary = report.weeklyAverages[weekIdx] || report.weeklyAverages[0];
    const entries = report.dailyBreakdown.filter((d) => d.weekIndex === weekIdx);
    return {
      titleBn: `${weekSummary?.shortLabel || 'সাপ্তাহিক'} মুহাসাবা ফলাফল`,
      subtitleBn: `${report.monthNameBn} • ${weekSummary?.dateRangeBn || ''}`,
      score: weekSummary?.score || 0,
      loggedDays: weekSummary?.loggedDays || 0,
      totalDays: weekSummary?.totalDaysInWeek || entries.length,
      completedAmols: weekSummary?.completedAmolsCount || 0,
      onTime: weekSummary?.onTimeCount || 0,
      late: weekSummary?.lateCount || 0,
      entries,
    };
  }

  return {
    titleBn: 'মাসিক মুহাসাবা ফলাফল',
    subtitleBn: report.monthNameBn,
    score: report.monthlyAggregateScore,
    loggedDays: report.totalDaysLogged,
    totalDays: report.totalDaysInMonth,
    completedAmols: report.totalCompletedAmols,
    onTime: report.onTimeCount,
    late: report.lateCount,
    entries: report.dailyBreakdown,
  };
}

/**
 * 1. Export as Microsoft Word (.docx)
 */
export async function exportToWordDocx(
  report: MonthlyStatsReport,
  timeframe: ReportTimeframe = 'monthly',
  selectedDateStr: string = ''
): Promise<void> {
  const filtered = getFilteredEntriesByTimeframe(report, timeframe, selectedDateStr);

  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'তারিখ', alignment: AlignmentType.CENTER })], width: { size: 16, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'সম্পন্ন আমলসমূহ', alignment: AlignmentType.CENTER })], width: { size: 44, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'মুহাসাবা স্কোর', alignment: AlignmentType.CENTER })], width: { size: 16, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'স্ট্যাটাস ও নোট', alignment: AlignmentType.CENTER })], width: { size: 24, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  const entriesToRender =
    timeframe === 'daily'
      ? filtered.entries
      : filtered.entries.filter((e) => e.isLogged);

  if (entriesToRender.length === 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: selectedDateStr || report.monthStr })] }),
          new TableCell({ children: [new Paragraph({ text: 'কোনো আমল এখনও লিপিবদ্ধ করা হয়নি' })] }),
          new TableCell({ children: [new Paragraph({ text: '0%', alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: '-' })] }),
        ],
      })
    );
  } else {
    entriesToRender.forEach((entry) => {
      const titlesText =
        entry.completedTitles.length > 0
          ? entry.completedTitles.slice(0, 12).join(', ')
          : entry.subTaskCount > 0
          ? `${entry.subTaskCount}টি সাব-টাস্ক সম্পন্ন`
          : 'তাসবীহ/ডায়েরি লিপিবদ্ধ';

      const statusText =
        entry.lateCount > 0
          ? `ওয়াক্তমতো: ${entry.onTimeCount}, বিলম্বে: ${entry.lateCount}`
          : 'ওয়াক্তমতো সম্পন্ন';

      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: entry.date })] }),
            new TableCell({ children: [new Paragraph({ text: titlesText })] }),
            new TableCell({ children: [new Paragraph({ text: `${entry.score}%`, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: entry.reflectionNote ? `${statusText} (${entry.reflectionNote})` : statusText })] }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `Daily Amol Checklist • ${filtered.titleBn}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${filtered.subtitleBn} • বাংলাদেশ সময় (Asia/Dhaka GMT+6)`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '১. সারসংক্ষেপ ও ফলাফল:', bold: true }),
            ],
          }),
          new Paragraph({ text: `• সময়কাল: ${filtered.titleBn} (${filtered.subtitleBn})` }),
          new Paragraph({ text: `• মোট লিপিবদ্ধ দিন: ${filtered.loggedDays} / ${filtered.totalDays} দিন` }),
          new Paragraph({ text: `• গড় মুহাসাবা স্কোর: ${filtered.score}%` }),
          new Paragraph({ text: `• মোট সম্পন্ন আমল: ${filtered.completedAmols}টি (ওয়াক্তমতো: ${filtered.onTime}টি, বিলম্বে: ${filtered.late}টি)` }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '২. সাপ্তাহিক গড়ের চিত্র (সপ্তাহ ১ - ৫):', bold: true }),
            ],
          }),
          ...report.weeklyAverages.map(
            (w) =>
              new Paragraph({
                text: `• ${w.weekLabel}: গড় স্কোর ${w.score}% (লিপিবদ্ধ দিন: ${w.loggedDays}/${w.totalDaysInWeek}, সম্পন্ন আমল: ${w.completedAmolsCount}টি)`,
              })
          ),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '৩. বিস্তারিত আমলনামা:', bold: true }),
            ],
          }),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '“তোমাদের হিসাব নেওয়ার পূর্বে তোমরা নিজেদের হিসাব নাও...” — হযরত উমর (রা.)',
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Daily_Amol_Report_${report.monthStr}_${timeframe}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 2. Export as Microsoft Excel (.xlsx)
 */
export function exportToExcel(
  report: MonthlyStatsReport,
  timeframe: ReportTimeframe = 'monthly',
  selectedDateStr: string = ''
): void {
  const filtered = getFilteredEntriesByTimeframe(report, timeframe, selectedDateStr);

  // Sheet 1: Summary & Weekly Breakdown
  const summaryData: Record<string, string>[] = [
    { 'বিষয়': 'রিপোর্টের শিরোনাম', 'তথ্য': `Daily Amol Checklist - ${filtered.titleBn}` },
    { 'বিষয়': 'সময়কাল', 'তথ্য': filtered.subtitleBn },
    { 'বিষয়': 'টাইমজোন', 'তথ্য': 'Asia/Dhaka (GMT+6)' },
    { 'বিষয়': 'লিপিবদ্ধ মোট দিন', 'তথ্য': `${filtered.loggedDays} / ${filtered.totalDays} দিন` },
    { 'বিষয়': 'গড় মুহাসাবা স্কোর', 'তথ্য': `${filtered.score}%` },
    { 'বিষয়': 'মোট সম্পন্ন আমল সংখ্যা', 'তথ্য': `${filtered.completedAmols} টি` },
    { 'বিষয়': 'ওয়াক্তমতো সম্পন্ন', 'তথ্য': `${filtered.onTime} টি` },
    { 'বিষয়': 'বিলম্বে সম্পন্ন', 'তথ্য': `${filtered.late} টি` },
    { 'বিষয়': '---', 'তথ্য': '---' },
    ...report.weeklyAverages.map((w) => ({
      'বিষয়': w.weekLabel,
      'তথ্য': `গড় স্কোর: ${w.score}% | লিপিবদ্ধ: ${w.loggedDays}/${w.totalDaysInWeek} দিন | সম্পন্ন আমল: ${w.completedAmolsCount} টি`,
    })),
  ];

  // Sheet 2: Daily Breakdown
  const detailData = filtered.entries.map((entry) => ({
    'তারিখ': entry.date,
    'সপ্তাহ': `সপ্তাহ ${entry.weekIndex + 1}`,
    'লিপিবদ্ধ স্ট্যাটাস': entry.isLogged ? 'হ্যাঁ' : 'না',
    'সম্পন্ন আমল সংখ্যা': entry.completedCount,
    'সাব-টাস্ক সংখ্যা': entry.subTaskCount,
    'ওয়াক্তমতো': entry.onTimeCount,
    'বিলম্বে': entry.lateCount,
    'তাসবীহ পাঠ': entry.tasbeehTotal,
    'দৈনিক স্কোর (%)': `${entry.score}%`,
    'সম্পন্ন আমলসমূহ': entry.completedTitles.join(', ') || '-',
    'মুহাসাবা ডায়েরি': entry.reflectionNote || '-',
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsDetail = XLSX.utils.json_to_sheet(detailData);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'সারসংক্ষেপ ও সাপ্তাহিক');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'দৈনিক বিস্তারিত রিপোর্ট');

  XLSX.writeFile(wb, `Daily_Amol_Checklist_${report.monthStr}_${timeframe}.xlsx`);
}

/**
 * 3. Export as High-Resolution Image (.jpg / .jpeg)
 */
export async function exportExecutiveCardAsJpeg(
  cardElementId: string,
  monthStr: string,
  timeframe: ReportTimeframe = 'monthly'
): Promise<void> {
  const node = document.getElementById(cardElementId);
  if (!node) {
    throw new Error('Executive card element not found');
  }

  const dataUrl = await toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#BA6B70',
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `Daily_Amol_Summary_${monthStr}_${timeframe}.jpg`;
  a.click();
}

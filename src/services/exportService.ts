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
  AlignmentType,
  BorderStyle
} from 'docx';
import { toJpeg } from 'html-to-image';
import { MonthlyStatsReport, DayAmolState, AmolItem } from '../types';
import { DEFAULT_AMOLS } from '../data/defaultAmols';
import { calculateMuhasabaScore, loadDayStateLocal, loadCustomAmols } from './amolStorage';

/**
 * Compile Monthly Statistics & Amol Logs for a target month (YYYY-MM)
 */
export function generateMonthlyReportData(yearMonth: string): MonthlyStatsReport {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed

  // Days in month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const allAmols = [...DEFAULT_AMOLS, ...loadCustomAmols()];

  let totalLoggedDays = 0;
  let scoreSum = 0;
  let totalCompletedAmols = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  const remarksList: MonthlyStatsReport['remarksList'] = [];

  // Group by 4 weeks for weekly averages
  const weeklyScores: number[][] = [[], [], [], []];

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;
    const state: DayAmolState = loadDayStateLocal(dateStr);

    if (state && state.completedAmolIds && state.completedAmolIds.length > 0) {
      totalLoggedDays++;
      const score = calculateMuhasabaScore(state, allAmols);
      scoreSum += score.percentage;
      totalCompletedAmols += state.completedAmolIds.length;

      const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
      weeklyScores[weekIndex].push(score.percentage);

      // Check remarks and on-time vs late
      state.completedAmolIds.forEach((amolId) => {
        const item = allAmols.find((a) => a.id === amolId);
        const remark = state.amolRemarks?.[amolId];

        if (remark && remark.wasLate) {
          lateCount++;
          if (remark.reason) {
            remarksList.push({
              date: dateStr,
              amolTitle: item?.titleBn || amolId,
              reason: remark.reason,
              time: new Date(remark.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
            });
          }
        } else {
          onTimeCount++;
        }
      });
    }
  }

  const dailyScoreAverage = totalLoggedDays > 0 ? Math.round(scoreSum / totalLoggedDays) : 0;
  const monthlyAggregateScore = Math.round((totalLoggedDays / totalDaysInMonth) * dailyScoreAverage);

  const weeklyAverages = weeklyScores.map((scores, idx) => {
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      weekLabel: `সপ্তাহ ${idx + 1} (দিন ${idx * 7 + 1} - ${Math.min(totalDaysInMonth, (idx + 1) * 7)})`,
      score: avg,
    };
  });

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  return {
    monthStr: yearMonth,
    monthNameBn: `${monthNamesBn[month - 1]} ${year}`,
    totalDaysLogged: totalLoggedDays,
    dailyScoreAverage,
    weeklyAverages,
    monthlyAggregateScore,
    totalCompletedAmols,
    onTimeCount,
    lateCount,
    remarksList,
  };
}

/**
 * 1. Export as Microsoft Word (.docx)
 */
export async function exportToWordDocx(report: MonthlyStatsReport): Promise<void> {
  const allAmols = [...DEFAULT_AMOLS, ...loadCustomAmols()];
  const [yearStr, monthStr] = report.monthStr.split('-');
  const totalDaysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();

  // Create document tables
  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: 'তারিখ', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'সম্পন্ন আমলসমূহ', alignment: AlignmentType.CENTER })], width: { size: 45, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'মুহাসাবা স্কোর', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: 'বিলম্বের কারণ ও মন্তব্য', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${report.monthStr}-${String(day).padStart(2, '0')}`;
    const state = loadDayStateLocal(dateStr);

    if (state && state.completedAmolIds && state.completedAmolIds.length > 0) {
      const score = calculateMuhasabaScore(state, allAmols);
      const completedTitles = state.completedAmolIds
        .map((id) => allAmols.find((a) => a.id === id)?.titleBn || id)
        .slice(0, 8)
        .join(', ');

      const dayRemarks = Object.entries(state.amolRemarks || {})
        .filter(([_, r]) => r.wasLate && r.reason)
        .map(([id, r]) => {
          const title = allAmols.find((a) => a.id === id)?.titleBn || id;
          return `${title}: ${r.reason}`;
        })
        .join('; ');

      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: dateStr })] }),
            new TableCell({ children: [new Paragraph({ text: completedTitles })] }),
            new TableCell({ children: [new Paragraph({ text: `${score.percentage}% (${score.gradeArabic})`, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: dayRemarks || 'ওয়াক্তমতো সম্পন্ন' })] }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Daily Amol Checklist • মাসিক মুহাসাবা রিপোর্ট',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `মাস: ${report.monthNameBn} • বাংলাদেশ সময় (Asia/Dhaka GMT+6)`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '১. সারসংক্ষেপ ও ফলাফল:', bold: true }),
            ],
          }),
          new Paragraph({ text: `• মোট লিপিবদ্ধ দিন: ${report.totalDaysLogged} দিন` }),
          new Paragraph({ text: `• মাসিক সামগ্রিক মুহাসাবা স্কোর: ${report.monthlyAggregateScore}%` }),
          new Paragraph({ text: `• দৈনিক স্কোরের গড়: ${report.dailyScoreAverage}%` }),
          new Paragraph({ text: `• মোট সম্পন্ন আমল: ${report.totalCompletedAmols}টি (ওয়াক্তমতো: ${report.onTimeCount}, বিলম্বে: ${report.lateCount})` }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'সাপ্তাহিক গড়ের চিত্র:', bold: true }),
            ],
          }),
          ...report.weeklyAverages.map(
            (w) => new Paragraph({ text: `• ${w.weekLabel}: ${w.score}%` })
          ),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '২. বিস্তারিত দৈনিক আমলনামা ও বিলম্বে দাখিলের কারণসমূহ:', bold: true }),
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
  a.download = `Daily_Amol_Report_${report.monthStr}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 2. Export as Microsoft Excel (.xlsx)
 */
export function exportToExcel(report: MonthlyStatsReport): void {
  const allAmols = [...DEFAULT_AMOLS, ...loadCustomAmols()];
  const [yearStr, monthStr] = report.monthStr.split('-');
  const totalDaysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();

  // Sheet 1: Summary
  const summaryData = [
    { 'বিষয়': 'রিপোর্টের শিরোনাম', 'তথ্য': 'Daily Amol Checklist - মাসিক রিপোর্ট' },
    { 'বিষয়': 'মাস ও বছর', 'তথ্য': report.monthNameBn },
    { 'বিষয়': 'টাইমজোন', 'তথ্য': 'Asia/Dhaka (GMT+6)' },
    { 'বিষয়': 'লিপিবদ্ধ মোট দিন', 'তথ্য': `${report.totalDaysLogged} দিন` },
    { 'বিষয়': 'মাসিক সামগ্রিক স্কোর', 'তথ্য': `${report.monthlyAggregateScore}%` },
    { 'বিষয়': 'দৈনিক গড় স্কোর', 'তথ্য': `${report.dailyScoreAverage}%` },
    { 'বিষয়': 'মোট সম্পন্ন আমল সংখ্যা', 'তথ্য': `${report.totalCompletedAmols} টি` },
    { 'বিষয়': 'ওয়াক্তমতো সম্পন্ন', 'তথ্য': `${report.onTimeCount} টি` },
    { 'বিষয়': 'বিলম্বে সম্পন্ন', 'তথ্য': `${report.lateCount} টি` },
    { 'বিষয়': '', 'তথ্য': '' },
    { 'বিষয়': 'সপ্তাহ ১ স্কোর', 'তথ্য': `${report.weeklyAverages[0]?.score || 0}%` },
    { 'বিষয়': 'সপ্তাহ ২ স্কোর', 'তথ্য': `${report.weeklyAverages[1]?.score || 0}%` },
    { 'বিষয়': 'সপ্তাহ ৩ স্কোর', 'তথ্য': `${report.weeklyAverages[2]?.score || 0}%` },
    { 'বিষয়': 'সপ্তাহ ৪ স্কোর', 'তথ্য': `${report.weeklyAverages[3]?.score || 0}%` },
  ];

  // Sheet 2: Daily Records
  const detailData: any[] = [];
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${report.monthStr}-${String(day).padStart(2, '0')}`;
    const state = loadDayStateLocal(dateStr);

    if (state && state.completedAmolIds) {
      const score = calculateMuhasabaScore(state, allAmols);
      state.completedAmolIds.forEach((amolId) => {
        const item = allAmols.find((a) => a.id === amolId);
        const remark = state.amolRemarks?.[amolId];

        detailData.push({
          'তারিখ': dateStr,
          'আমলের শিরোনাম': item?.titleBn || amolId,
          'ক্যাটাগরি': item?.category || 'custom',
          'ওয়াক্ত/স্ট্যাটাস': remark?.wasLate ? 'বিলম্বে সম্পন্ন' : 'ওয়াক্তমতো',
          'লিপিবদ্ধ সময়': remark?.timestamp ? new Date(remark.timestamp).toLocaleTimeString('bn-BD') : '-',
          'দেরি হওয়ার কারণ / মন্তব্য': remark?.reason || '-',
          'দৈনিক স্কোর': `${score.percentage}%`,
        });
      });
    }
  }

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsDetail = XLSX.utils.json_to_sheet(detailData.length > 0 ? detailData : [{ 'তথ্য': 'এই মাসে কোনো আমল রেকর্ড করা হয়নি' }]);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'সারসংক্ষেপ');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'দৈনিক আমলনামা ও মন্তব্য');

  XLSX.writeFile(wb, `Daily_Amol_Checklist_${report.monthStr}.xlsx`);
}

/**
 * 3. Export as High-Resolution Image (.jpg / .jpeg)
 */
export async function exportExecutiveCardAsJpeg(cardElementId: string, monthStr: string): Promise<void> {
  const node = document.getElementById(cardElementId);
  if (!node) {
    throw new Error('Executive card element not found');
  }

  const dataUrl = await toJpeg(node, {
    quality: 0.95,
    pixelRatio: 2, // High resolution capture
    backgroundColor: '#050505',
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `Daily_Amol_Executive_Summary_${monthStr}.jpg`;
  a.click();
}

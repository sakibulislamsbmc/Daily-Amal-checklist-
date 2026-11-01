export type AmolCategory = 
  | 'fard_salah'
  | 'core_24'
  | 'optional'
  | 'sunnah_nafl'
  | 'quran'
  | 'adhkar'
  | 'muhasaba_akhlaq'
  | 'family_relationships'
  | 'custom';

export type WaqtType = 
  | 'tahajjud'
  | 'fajr'
  | 'sunrise'
  | 'ishraq'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'night'
  | 'midnight'
  | 'all_day';

export interface TimeWindowConfig {
  startWaqt: WaqtType;
  startOffsetMinutes?: number; // minutes relative to start Waqt
  endWaqt: WaqtType;
  endOffsetMinutes?: number;
  labelBn: string;
  labelEn: string;
}

export interface AmolItem {
  id: string;
  category: AmolCategory;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  hadithOrVirtue?: string;
  points: number; // For Muhasaba score calculation
  orderNumber?: number; // Sequence number (e.g. 1 to 24)
  isOptional?: boolean; // If true, stored in optional amols pool
  timeWindow?: TimeWindowConfig;
  pastelTheme?: 'cyan' | 'green' | 'peach' | 'pink' | 'purple' | 'yellow';
  iconEmoji?: string;
  subTasks?: {
    id: string;
    titleBn: string;
    titleEn: string;
    points: number;
  }[];
  calendarSyncDefault?: {
    suggestedTime: string; // "HH:MM" in 24h format in Asia/Dhaka
    durationMinutes: number;
    colorId?: string; // Google Calendar color ID
  };
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  district?: string;
  quranTarget?: string;
  masjidPreference?: string;
  spiritualBio?: string;
  joinedAt?: string;
  lastActiveAt?: string;
  enabledOptionalIds?: string[];
}

export interface AmolRemark {
  timestamp: string; // ISO string
  reason: string;
  wasLate: boolean;
}

export interface DayAmolState {
  date: string; // YYYY-MM-DD in Asia/Dhaka
  completedAmolIds: string[];
  subTaskCompletedIds: string[];
  tasbeehCounts: Record<string, number>;
  reflectionNote?: string;
  spiritualFeeling?: 'peaceful' | 'seeking_forgiveness' | 'struggling' | 'grateful' | 'motivated';
  amolRemarks?: Record<string, AmolRemark>;
  updatedAt: string;
}

export interface WaqtTimePair {
  nameBn: string;
  nameEn: string;
  azanTime: string; // e.g. "04:58 AM"
  jamatTime: string; // e.g. "05:25 AM"
  azanTime24: string; // "04:58"
  jamatTime24: string; // "05:25"
  isCurrent: boolean;
  isNext: boolean;
  dateObj: Date;
  jamatDateObj: Date;
}

export interface PrayerSchedule {
  sehriEnd: string;
  fajrAzan: string;
  fajrJamat: string;
  sunrise: string;
  ishraq: string;
  dhuhrAzan: string;
  dhuhrJamat: string;
  asrAzan: string; // Strictly Hanafi
  asrJamat: string;
  maghribAzan: string; // Iftar time
  maghribJamat: string;
  ishaAzan: string;
  ishaJamat: string;
  tahajjudStart: string;
  dateStr: string;
  rawDates: {
    fajrAzan: Date;
    fajrJamat: Date;
    sunrise: Date;
    ishraq: Date;
    dhuhrAzan: Date;
    dhuhrJamat: Date;
    asrAzan: Date;
    asrJamat: Date;
    maghribAzan: Date;
    maghribJamat: Date;
    ishaAzan: Date;
    ishaJamat: Date;
    tahajjud: Date;
  };
}

export interface TrafficStats {
  totalUniqueVisitors: number;
  lastUpdated?: string;
  isLive: boolean;
}

export interface DailyReportEntry {
  date: string;
  dayNumber: number;
  weekIndex: number; // 0-indexed (0 = Week 1)
  score: number;
  earnedPoints: number;
  totalPossiblePoints: number;
  completedCount: number;
  subTaskCount: number;
  onTimeCount: number;
  lateCount: number;
  completedTitles: string[];
  reflectionNote?: string;
  tasbeehTotal: number;
  isLogged: boolean;
}

export interface WeeklyReportSummary {
  weekIndex: number;
  weekLabel: string;
  shortLabel: string;
  dateRangeBn: string;
  score: number;
  loggedDays: number;
  totalDaysInWeek: number;
  completedAmolsCount: number;
  onTimeCount: number;
  lateCount: number;
}

export interface MonthlyStatsReport {
  monthStr: string; // YYYY-MM
  monthNameBn: string;
  totalDaysInMonth: number;
  totalDaysLogged: number;
  dailyScoreAverage: number;
  weeklyAverages: WeeklyReportSummary[];
  dailyBreakdown: DailyReportEntry[];
  monthlyAggregateScore: number;
  totalCompletedAmols: number;
  onTimeCount: number;
  lateCount: number;
  remarksList: { date: string; amolTitle: string; reason: string; time: string }[];
}

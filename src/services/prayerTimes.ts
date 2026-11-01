// Prayer times calculation customized for Bangladesh (Asia/Dhaka, UTC+6)
// Strictly adhering to Hanafi jurisprudence (especially Asr 2x shadow ratio)
// Split timings: (1) Azan Time and (2) Jamat Start Time

import { PrayerSchedule, WaqtTimePair, AmolItem, WaqtType } from '../types';
export type { PrayerSchedule };

export interface BDDistrict {
  id: string;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
  fajrOffset: number; // minutes from Dhaka base
  dhuhrOffset: number;
  maghribOffset: number;
}

export const BD_DISTRICTS: BDDistrict[] = [
  { id: 'dhaka', nameBn: 'ঢাকা (মূল)', nameEn: 'Dhaka (Central)', lat: 23.8103, lng: 90.4125, fajrOffset: 0, dhuhrOffset: 0, maghribOffset: 0 },
  { id: 'chittagong', nameBn: 'চট্টগ্রাম', nameEn: 'Chittagong', lat: 22.3569, lng: 91.7832, fajrOffset: -5, dhuhrOffset: -5, maghribOffset: -4 },
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.8949, lng: 91.8687, fajrOffset: -6, dhuhrOffset: -6, maghribOffset: -7 },
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.3745, lng: 88.6042, fajrOffset: 6, dhuhrOffset: 7, maghribOffset: 7 },
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.8456, lng: 89.5403, fajrOffset: 4, dhuhrOffset: 4, maghribOffset: 4 },
  { id: 'barisal', nameBn: 'বরিশাল', nameEn: 'Barisal', lat: 22.7010, lng: 90.3535, fajrOffset: 1, dhuhrOffset: 1, maghribOffset: 1 },
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.7439, lng: 89.2752, fajrOffset: 4, dhuhrOffset: 5, maghribOffset: 4 },
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.7471, lng: 90.4203, fajrOffset: 0, dhuhrOffset: 0, maghribOffset: -1 },
  { id: 'cumilla', nameBn: 'কুমিল্লা', nameEn: 'Cumilla', lat: 23.4607, lng: 91.1809, fajrOffset: -3, dhuhrOffset: -3, maghribOffset: -3 },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function formatBDTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatBDTime24(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function getTodayDateInBD(offsetDays: number = 0): string {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Astronomical calculation using University of Islamic Sciences Karachi (18° Fajr/Isha)
 * Strictly HANAFI jurisprudence for Asr (shadow ratio = 2x object length + noon shadow)
 */
export function calculateBDPrayerTimes(targetDate: Date = new Date(), districtId: string = 'dhaka'): PrayerSchedule {
  const district = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const lat = district.lat;
  const lng = district.lng;
  const timeZoneOffset = 6; // GMT+6 for Bangladesh

  // Day of year
  const startOfYear = new Date(Date.UTC(targetDate.getUTCFullYear(), 0, 1));
  const diff = targetDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

  // Approximate solar declination & equation of time
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // in minutes
  const solarDec = 23.45 * Math.sin(toRad((360 / 365) * (dayOfYear - 81))); // in degrees

  // Solar noon in hours UTC
  const solarNoonUTC = 12 - lng / 15 - eot / 60;
  const solarNoonLocalHours = solarNoonUTC + timeZoneOffset;

  const hourAngle = (angle: number) => {
    const cosHA =
      (Math.sin(toRad(-angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(solarDec))) /
      (Math.cos(toRad(lat)) * Math.cos(toRad(solarDec)));
    if (cosHA > 1) return 0;
    if (cosHA < -1) return Math.PI;
    return Math.acos(cosHA);
  };

  // Karachi parameters: Fajr = 18°, Isha = 18°, Sunrise = 0.833°
  const haSunrise = toDeg(hourAngle(0.833)) / 15;
  const haFajr = toDeg(hourAngle(18)) / 15;
  const haIsha = toDeg(hourAngle(18)) / 15;

  // STRICTLY HANAFI ASR CALCULATION:
  // Shadow length = 2 * object height + shadow length at solar noon
  const noonZenith = Math.abs(lat - solarDec);
  const noonShadow = Math.tan(toRad(noonZenith));
  const hanafiAsrZenith = toDeg(Math.atan(2 + noonShadow)); // 2x shadow for Hanafi
  const haHanafiAsr = toDeg(hourAngle(90 - hanafiAsrZenith)) / 15;

  const dhuhrHours = solarNoonLocalHours + district.dhuhrOffset / 60;
  const sunriseHours = solarNoonLocalHours - haSunrise + district.maghribOffset / 60;
  const maghribHours = solarNoonLocalHours + haSunrise + district.maghribOffset / 60;
  const fajrHours = solarNoonLocalHours - haFajr + district.fajrOffset / 60;
  const asrHours = solarNoonLocalHours + haHanafiAsr + district.dhuhrOffset / 60;
  const ishaHours = solarNoonLocalHours + haIsha + district.maghribOffset / 60;

  const createDateForHours = (decHours: number): Date => {
    const totalMinutes = Math.round(decHours * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    const d = new Date(targetDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const rawFajrAzan = createDateForHours(fajrHours);
  // Bangladesh standard Jamat offset: Fajr +25 mins
  const rawFajrJamat = new Date(rawFajrAzan.getTime() + 25 * 60 * 1000);

  const rawSunrise = createDateForHours(sunriseHours);
  const rawIshraq = new Date(rawSunrise.getTime() + 15 * 60 * 1000);

  const rawDhuhrAzan = createDateForHours(dhuhrHours);
  // Bangladesh standard Jamat: Dhuhr Azan + 30 mins (usually 1:15 or 1:30 PM)
  const rawDhuhrJamat = new Date(rawDhuhrAzan.getTime() + 30 * 60 * 1000);

  const rawAsrAzan = createDateForHours(asrHours);
  // Asr Jamat: +20 mins after Hanafi Asr Azan
  const rawAsrJamat = new Date(rawAsrAzan.getTime() + 20 * 60 * 1000);

  const rawMaghribAzan = createDateForHours(maghribHours);
  // Maghrib Jamat: prompt +6 mins after Azan (per Sunnah)
  const rawMaghribJamat = new Date(rawMaghribAzan.getTime() + 6 * 60 * 1000);

  const rawIshaAzan = createDateForHours(ishaHours);
  // Isha Jamat: +25 mins after Azan
  const rawIshaJamat = new Date(rawIshaAzan.getTime() + 25 * 60 * 1000);

  const rawSehriEnd = new Date(rawFajrAzan.getTime() - 5 * 60 * 1000);

  // Tahajjud: last third of the night
  const nightDurationMs = rawFajrAzan.getTime() + 24 * 60 * 60 * 1000 - rawMaghribAzan.getTime();
  const rawTahajjud = new Date(rawMaghribAzan.getTime() + (2 * nightDurationMs) / 3);

  return {
    sehriEnd: formatBDTime(rawSehriEnd),
    fajrAzan: formatBDTime(rawFajrAzan),
    fajrJamat: formatBDTime(rawFajrJamat),
    sunrise: formatBDTime(rawSunrise),
    ishraq: formatBDTime(rawIshraq),
    dhuhrAzan: formatBDTime(rawDhuhrAzan),
    dhuhrJamat: formatBDTime(rawDhuhrJamat),
    asrAzan: formatBDTime(rawAsrAzan),
    asrJamat: formatBDTime(rawAsrJamat),
    maghribAzan: formatBDTime(rawMaghribAzan),
    maghribJamat: formatBDTime(rawMaghribJamat),
    ishaAzan: formatBDTime(rawIshaAzan),
    ishaJamat: formatBDTime(rawIshaJamat),
    tahajjudStart: formatBDTime(rawTahajjud),
    dateStr: getTodayDateInBD(),
    rawDates: {
      fajrAzan: rawFajrAzan,
      fajrJamat: rawFajrJamat,
      sunrise: rawSunrise,
      ishraq: rawIshraq,
      dhuhrAzan: rawDhuhrAzan,
      dhuhrJamat: rawDhuhrJamat,
      asrAzan: rawAsrAzan,
      asrJamat: rawAsrJamat,
      maghribAzan: rawMaghribAzan,
      maghribJamat: rawMaghribJamat,
      ishaAzan: rawIshaAzan,
      ishaJamat: rawIshaJamat,
      tahajjud: rawTahajjud,
    },
  };
}

/**
 * Get distinct Waqt list with Split Azan & Jamat timings
 */
export function getWaqtListWithJamat(schedule: PrayerSchedule): WaqtTimePair[] {
  const now = new Date();
  const waqts: {
    nameBn: string;
    nameEn: string;
    azanDate: Date;
    jamatDate: Date;
  }[] = [
    { nameBn: 'ফজর', nameEn: 'Fajr', azanDate: schedule.rawDates.fajrAzan, jamatDate: schedule.rawDates.fajrJamat },
    { nameBn: 'যোহর', nameEn: 'Dhuhr', azanDate: schedule.rawDates.dhuhrAzan, jamatDate: schedule.rawDates.dhuhrJamat },
    { nameBn: 'আসর (হানাফী)', nameEn: 'Asr (Hanafi)', azanDate: schedule.rawDates.asrAzan, jamatDate: schedule.rawDates.asrJamat },
    { nameBn: 'মাগরিব', nameEn: 'Maghrib', azanDate: schedule.rawDates.maghribAzan, jamatDate: schedule.rawDates.maghribJamat },
    { nameBn: 'ইশা', nameEn: 'Isha', azanDate: schedule.rawDates.ishaAzan, jamatDate: schedule.rawDates.ishaJamat },
  ];

  return waqts.map((w, idx) => {
    const nextWaqt = waqts[(idx + 1) % waqts.length];
    const isCurrent = now >= w.azanDate && (idx === waqts.length - 1 || now < nextWaqt.azanDate);
    const isNext = !isCurrent && now < w.azanDate;

    return {
      nameBn: w.nameBn,
      nameEn: w.nameEn,
      azanTime: formatBDTime(w.azanDate),
      jamatTime: formatBDTime(w.jamatDate),
      azanTime24: formatBDTime24(w.azanDate),
      jamatTime24: formatBDTime24(w.jamatDate),
      isCurrent,
      isNext,
      dateObj: w.azanDate,
      jamatDateObj: w.jamatDate,
    };
  });
}

/**
 * Evaluate whether an Amol is being completed within its designated active window
 * If completed after the window expired, returns wasLate = true
 */
export function checkAmolTimeWindow(
  item: AmolItem,
  schedule: PrayerSchedule,
  currentDateStr: string
): {
  isWithinWindow: boolean;
  wasLate: boolean;
  windowLabelBn: string;
  windowExplanationBn: string;
} {
  const todayStr = getTodayDateInBD();
  const isPastDay = currentDateStr < todayStr;
  const isFutureDay = currentDateStr > todayStr;

  // If user is editing a past date, it is inherently a post-facto / late entry
  if (isPastDay) {
    return {
      isWithinWindow: false,
      wasLate: true,
      windowLabelBn: 'পূর্ববর্তী দিনের আমল',
      windowExplanationBn: 'পূর্বের দিনের আমল পরবর্তীতে লিপিবদ্ধ করা হচ্ছে।',
    };
  }

  if (isFutureDay) {
    return {
      isWithinWindow: false,
      wasLate: false,
      windowLabelBn: 'ভবিষ্যতের তারিখ',
      windowExplanationBn: 'আজকের পূর্বেই অগ্রিম আমল মার্ক করা সম্ভব নয়।',
    };
  }

  // If item has no strict time window, it can be checked throughout the day
  if (!item.timeWindow || item.timeWindow.startWaqt === 'all_day') {
    return {
      isWithinWindow: true,
      wasLate: false,
      windowLabelBn: 'সারাদিন',
      windowExplanationBn: 'সারাদিনের যেকোনো সময় আমলটি সম্পাদন করা যায়।',
    };
  }

  const now = new Date();
  const raw = schedule.rawDates;

  // Resolve start Date
  let startDate: Date;
  switch (item.timeWindow.startWaqt) {
    case 'tahajjud':
      startDate = raw.tahajjud;
      break;
    case 'fajr':
      startDate = raw.fajrAzan;
      break;
    case 'sunrise':
      startDate = raw.sunrise;
      break;
    case 'ishraq':
      startDate = raw.ishraq;
      break;
    case 'dhuhr':
      startDate = raw.dhuhrAzan;
      break;
    case 'asr':
      startDate = raw.asrAzan;
      break;
    case 'maghrib':
      startDate = raw.maghribAzan;
      break;
    case 'isha':
      startDate = raw.ishaAzan;
      break;
    case 'night':
      startDate = raw.ishaAzan;
      break;
    default:
      startDate = raw.fajrAzan;
  }

  if (item.timeWindow.startOffsetMinutes) {
    startDate = new Date(startDate.getTime() + item.timeWindow.startOffsetMinutes * 60000);
  }

  // Resolve end Date
  let endDate: Date;
  switch (item.timeWindow.endWaqt) {
    case 'sunrise':
      endDate = raw.sunrise;
      break;
    case 'dhuhr':
      endDate = raw.dhuhrAzan;
      break;
    case 'asr':
      endDate = raw.asrAzan;
      break;
    case 'maghrib':
      endDate = raw.maghribAzan;
      break;
    case 'isha':
      endDate = raw.ishaAzan;
      break;
    case 'night':
    case 'midnight': {
      // Midnight in Bangladesh (23:59:59)
      const m = new Date(now);
      m.setHours(23, 59, 59, 999);
      endDate = m;
      break;
    }
    case 'fajr': {
      // Next day Fajr
      const nextFajr = new Date(raw.fajrAzan.getTime() + 24 * 60 * 60 * 1000);
      endDate = nextFajr;
      break;
    }
    default:
      endDate = raw.ishaAzan;
  }

  if (item.timeWindow.endOffsetMinutes) {
    endDate = new Date(endDate.getTime() + item.timeWindow.endOffsetMinutes * 60000);
  }

  // Active check
  if (now >= startDate && now <= endDate) {
    return {
      isWithinWindow: true,
      wasLate: false,
      windowLabelBn: item.timeWindow.labelBn,
      windowExplanationBn: `বর্তমানে সক্রিয় ওয়াক্ত: ${item.timeWindow.labelBn}`,
    };
  }

  // If current time passed the designated end window
  if (now > endDate) {
    return {
      isWithinWindow: false,
      wasLate: true,
      windowLabelBn: item.timeWindow.labelBn,
      windowExplanationBn: `নির্ধারিত ওয়াক্ত (${item.timeWindow.labelBn}) অতিবাহিত হয়েছে। দেরিতে সম্পন্ন করার কারণ উল্লেখ আবশ্যক।`,
    };
  }

  // If time is before the window started
  return {
    isWithinWindow: false,
    wasLate: false,
    windowLabelBn: item.timeWindow.labelBn,
    windowExplanationBn: `আমলের ওয়াক্ত এখনও শুরু হয়নি (${item.timeWindow.labelBn})।`,
  };
}

import { getAccessToken } from '../firebase';
import { PrayerSchedule } from './prayerTimes';
import { DEFAULT_AMOLS } from '../data/defaultAmols';

const TIME_ZONE = 'Asia/Dhaka';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  colorId?: string;
}

export interface SyncItemConfig {
  amolId: string;
  title: string;
  startTime: string; // "HH:MM" in Asia/Dhaka
  durationMinutes: number;
  description: string;
  colorId: string;
}

/**
 * Fetch calendar events for a given date in Asia/Dhaka
 */
export async function getCalendarEventsForDate(dateStr: string): Promise<CalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_TOKEN');
  }

  // Start and end of the day in Bangladesh time (UTC+6)
  const timeMin = `${dateStr}T00:00:00+06:00`;
  const timeMax = `${dateStr}T23:59:59+06:00`;

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeZone', TIME_ZONE);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Calendar API error (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create a new event in Google Calendar in Asia/Dhaka time zone
 */
export async function createCalendarEvent(payload: {
  summary: string;
  description: string;
  startDateTime: string; // ISO string e.g. "2026-11-01T05:00:00+06:00"
  endDateTime: string;
  colorId?: string;
}): Promise<CalendarEvent> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_TOKEN');
  }

  const eventBody = {
    summary: payload.summary,
    description: `${payload.description}\n\n[Daily Amol Checklist • Asia/Dhaka BST]`,
    start: {
      dateTime: payload.startDateTime,
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: payload.endDateTime,
      timeZone: TIME_ZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 5 },
      ],
    },
    colorId: payload.colorId || '10', // 10 is Basil (Green) in Google Calendar
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create calendar event (${res.status})`);
  }

  return await res.json();
}

/**
 * Generate default suggested calendar events based on today's Bangladesh Prayer Times
 */
export function generateSuggestedEventsForDate(dateStr: string, schedule: PrayerSchedule): SyncItemConfig[] {
  // Format hours from prayer schedule
  const formatTime24 = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return [
    {
      amolId: 'tahajjud_prayer',
      title: '🌙 তাহাজ্জুদ ও কিয়ামুল লাইল (Tahajjud)',
      startTime: formatTime24(schedule.rawDates.tahajjud),
      durationMinutes: 40,
      description: 'রাতের শেষ প্রহরে তাহাজ্জুদ সালাত, তওবা ও নির্জনে মোনাজাত।',
      colorId: '11', // Flamingo
    },
    {
      amolId: 'fajr_prayer',
      title: '🕌 ফজর সালাত ও মাসনূন আমল (Fajr Prayer)',
      startTime: formatTime24(schedule.rawDates.fajrAzan),
      durationMinutes: 30,
      description: 'ফজরের ফরজ সালাত জামাতে আদায় ও সালামের পর আয়াতুল কুরসী পাঠ।',
      colorId: '10', // Green
    },
    {
      amolId: 'morning_adhkar',
      title: '📿 সকালের মাসনূন আযকার ও তিলাওয়াত',
      startTime: '06:15',
      durationMinutes: 30,
      description: 'সকালের মাসনূন দু\'আ ও পবিত্র কুরআন তিলাওয়াত।',
      colorId: '6', // Tangerine
    },
    {
      amolId: 'ishraq_duha_prayer',
      title: '☀️ সালাতুল ইশরাক ও চাশত (Duha Prayer)',
      startTime: formatTime24(schedule.rawDates.ishraq),
      durationMinutes: 20,
      description: 'ইশরাক ও চাশতের নফল সালাত আদায়।',
      colorId: '5', // Yellow
    },
    {
      amolId: 'dhuhr_prayer',
      title: '🕌 যোহর সালাত (Dhuhr Prayer)',
      startTime: formatTime24(schedule.rawDates.dhuhrAzan),
      durationMinutes: 30,
      description: 'যোহরের ৪ রাকাত সুন্নাত, ৪ রাকাত ফরজ ও ২ রাকাত সুন্নাত আদায়।',
      colorId: '10',
    },
    {
      amolId: 'asr_prayer',
      title: '🕌 আসর সালাত ও হেফাজত (Hanafi Asr)',
      startTime: formatTime24(schedule.rawDates.asrAzan),
      durationMinutes: 30,
      description: 'হানাফী আসরের ফরজ সালাত আদায় ও হেফাজত।',
      colorId: '10',
    },
    {
      amolId: 'evening_adhkar',
      title: '🌅 সন্ধ্যার মাসনূন আযকার ও যিকির',
      startTime: '17:15',
      durationMinutes: 25,
      description: 'সন্ধ্যার হিফাযতের মাসনূন আযকার ও তাসবীহ।',
      colorId: '6',
    },
    {
      amolId: 'maghrib_prayer',
      title: '🕌 মাগরিব সালাত ও আউয়াবিন (Maghrib Prayer)',
      startTime: formatTime24(schedule.rawDates.maghribAzan),
      durationMinutes: 30,
      description: 'মাগরিবের ৩ রাকাত ফরজ ও ২ রাকাত সুন্নাত সালাত আদায়।',
      colorId: '10',
    },
    {
      amolId: 'isha_prayer',
      title: '🕌 ইশা সালাত ও বিতর (Isha Prayer)',
      startTime: formatTime24(schedule.rawDates.ishaAzan),
      durationMinutes: 35,
      description: 'ইশার ৪ রাকাত ফরজ, ২ রাকাত সুন্নাত ও ৩ রাকাত বিতর সালাত।',
      colorId: '10',
    },
    {
      amolId: 'surah_mulk_night',
      title: '📖 সূরা আল-মুলক তিলাওয়াত (Surah Al-Mulk)',
      startTime: '22:15',
      durationMinutes: 15,
      description: 'ঘুমানোর পূর্বে সূরা আল-মুলক তিলাওয়াত (কবরের আজাব থেকে মুক্তির রক্ষাকবচ)।',
      colorId: '2', // Sage
    },
    {
      amolId: 'night_muhasaba_taubah',
      title: '🤲 দৈনিক মুহাসাবা ও খালেস তাওবাহ (Night Reflection)',
      startTime: '22:45',
      durationMinutes: 15,
      description: 'আজকের আমলনামা পর্যালোচনা, আত্মসমালোচনা ও ঘুমানোর পূর্বে খালেস তাওবাহ।',
      colorId: '11',
    },
  ];
}

/**
 * Batch schedule selected events to Google Calendar with Asia/Dhaka offset
 */
export async function batchSyncAmolSchedule(
  dateStr: string,
  itemsToSync: SyncItemConfig[]
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (const item of itemsToSync) {
    try {
      const [hours, minutes] = item.startTime.split(':').map(Number);
      const startIso = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+06:00`;
      
      const endTotalMinutes = hours * 60 + minutes + item.durationMinutes;
      const endHours = Math.floor(endTotalMinutes / 60) % 24;
      const endMins = endTotalMinutes % 60;
      const endIso = `${dateStr}T${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00+06:00`;

      await createCalendarEvent({
        summary: item.title,
        description: item.description,
        startDateTime: startIso,
        endDateTime: endIso,
        colorId: item.colorId,
      });
      successCount++;
    } catch (err: any) {
      errors.push(`${item.title}: ${err.message || 'Failed'}`);
    }
  }

  return { successCount, errors };
}

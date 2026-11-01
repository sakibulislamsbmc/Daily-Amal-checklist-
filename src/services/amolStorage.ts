import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, trackAnalyticsEvent } from '../firebase';
import { DayAmolState, AmolItem, AmolRemark } from '../types';

const LOCAL_STORAGE_PREFIX = 'daily_amol_';
const CUSTOM_AMOLS_KEY = 'daily_amol_custom_items';

/**
 * Get empty default state for a given date
 */
export function getInitialDayState(dateStr: string): DayAmolState {
  return {
    date: dateStr,
    completedAmolIds: [],
    subTaskCompletedIds: [],
    tasbeehCounts: {
      subhanallah: 0,
      alhamdulillah: 0,
      allahuakbar: 0,
      astaghfirullah: 0,
      durood: 0,
      lailahaillallah: 0,
    },
    reflectionNote: '',
    spiritualFeeling: 'peaceful',
    amolRemarks: {},
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load day state from LocalStorage
 */
export function loadDayStateLocal(dateStr: string): DayAmolState {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${dateStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getInitialDayState(dateStr),
        ...parsed,
        amolRemarks: parsed.amolRemarks || {},
      };
    }
  } catch (e) {
    console.error('Failed to load local amol state:', e);
  }
  return getInitialDayState(dateStr);
}

/**
 * Save day state to LocalStorage
 */
export function saveDayStateLocal(state: DayAmolState): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${state.date}`, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local amol state:', e);
  }
}

/**
 * Parse Firestore document data into DayAmolState
 */
function parseFirestoreDayDoc(dateStr: string, data: Record<string, any>): DayAmolState {
  let completed: {
    completedAmolIds: string[];
    subTaskCompletedIds: string[];
    amolRemarks?: Record<string, AmolRemark>;
  } = {
    completedAmolIds: Array.isArray(data.completedAmolIds) ? data.completedAmolIds : [],
    subTaskCompletedIds: Array.isArray(data.subTaskCompletedIds) ? data.subTaskCompletedIds : [],
    amolRemarks: data.amolRemarks || {},
  };

  try {
    if (typeof data.completedAmols === 'string') {
      const parsed = JSON.parse(data.completedAmols);
      completed = {
        completedAmolIds: parsed.completedAmolIds || completed.completedAmolIds,
        subTaskCompletedIds: parsed.subTaskCompletedIds || completed.subTaskCompletedIds,
        amolRemarks: parsed.amolRemarks || completed.amolRemarks,
      };
    }
  } catch {}

  let tasbeeh: Record<string, number> =
    data.tasbeehCounts && typeof data.tasbeehCounts === 'object' ? data.tasbeehCounts : {};
  try {
    if (typeof data.tasbeehSummary === 'string') {
      tasbeeh = { ...tasbeeh, ...JSON.parse(data.tasbeehSummary) };
    }
  } catch {}

  return {
    date: dateStr,
    completedAmolIds: completed.completedAmolIds || [],
    subTaskCompletedIds: completed.subTaskCompletedIds || [],
    tasbeehCounts: {
      ...getInitialDayState(dateStr).tasbeehCounts,
      ...tasbeeh,
    },
    reflectionNote: data.reflection ?? data.reflectionNote ?? '',
    spiritualFeeling: data.spiritualFeeling || 'peaceful',
    amolRemarks: completed.amolRemarks || {},
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Save day state to Cloud Firestore (`users/{userId}/dailyAmols/{date}`) + LocalStorage
 */
export async function syncDayState(
  userId: string | null,
  state: DayAmolState,
  allAmols: AmolItem[]
): Promise<void> {
  saveDayStateLocal(state);

  const scoreData = calculateMuhasabaScore(state, allAmols);

  trackAnalyticsEvent('amol_checklist_sync', {
    date: state.date,
    score: scoreData.percentage,
    completed_count: state.completedAmolIds.length,
  });

  if (!userId) return;

  try {
    const docRef = doc(db, 'users', userId, 'dailyAmols', state.date);
    await setDoc(
      docRef,
      {
        userId,
        date: state.date,
        completedAmolIds: state.completedAmolIds,
        subTaskCompletedIds: state.subTaskCompletedIds,
        completedAmols: JSON.stringify({
          completedAmolIds: state.completedAmolIds,
          subTaskCompletedIds: state.subTaskCompletedIds,
          amolRemarks: state.amolRemarks || {},
        }),
        score: scoreData.percentage,
        earnedPoints: scoreData.earnedPoints,
        totalPossiblePoints: scoreData.totalPossiblePoints,
        totalCompleted: state.completedAmolIds.length,
        reflection: state.reflectionNote || '',
        spiritualFeeling: state.spiritualFeeling || 'peaceful',
        tasbeehCounts: state.tasbeehCounts,
        tasbeehSummary: JSON.stringify(state.tasbeehCounts),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync to Cloud Firestore skipped or failed:', err);
  }
}

/**
 * Real-time listener to Cloud Firestore daily amol document (`users/{userId}/dailyAmols/{dateStr}`)
 */
export function subscribeToUserDayAmol(
  userId: string,
  dateStr: string,
  onData: (state: DayAmolState) => void
): () => void {
  const docRef = doc(db, 'users', userId, 'dailyAmols', dateStr);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const syncedState = parseFirestoreDayDoc(dateStr, snapshot.data());
        saveDayStateLocal(syncedState);
        onData(syncedState);
      }
    },
    (err) => {
      console.warn('Daily amol Firestore subscription note:', err.message);
    }
  );
}

/**
 * Fetch recent 30 days of user's Amol history from Cloud Firestore into local cache (for streaks & weekly charts)
 */
export async function fetchUserAmolHistory(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const colRef = collection(db, 'users', userId, 'dailyAmols');
    const q = query(colRef, orderBy('date', 'desc'), limit(30));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const dateStr = data.date || docSnap.id;
      if (dateStr) {
        const parsedState = parseFirestoreDayDoc(dateStr, data);
        saveDayStateLocal(parsedState);
      }
    });
  } catch (err) {
    console.warn('History sync from Cloud Firestore note:', err);
  }
}

/**
 * Calculate Muhasaba points, percentage, and Islamic grade
 */
export function calculateMuhasabaScore(
  state: DayAmolState,
  allAmols: AmolItem[]
): {
  earnedPoints: number;
  totalPossiblePoints: number;
  percentage: number;
  gradeArabic: string;
  gradeBn: string;
  gradeEn: string;
  gradeColor: string;
} {
  let earnedPoints = 0;
  let totalPossiblePoints = 0;

  for (const amol of allAmols) {
    totalPossiblePoints += amol.points;
    if (state.completedAmolIds.includes(amol.id)) {
      earnedPoints += amol.points;
    }

    if (amol.subTasks) {
      for (const sub of amol.subTasks) {
        totalPossiblePoints += sub.points;
        if (state.subTaskCompletedIds.includes(sub.id)) {
          earnedPoints += sub.points;
        }
      }
    }
  }

  const percentage = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100) : 0;

  let gradeArabic = 'يحتاج إلى جهد';
  let gradeBn = 'প্রচেষ্টার প্রয়োজন';
  let gradeEn = 'Needs Effort';
  let gradeColor = 'text-amber-400';

  if (percentage >= 90) {
    gradeArabic = 'المُمتاز';
    gradeBn = 'অসাধারণ মুহাসাবা (মুসতাকীম)';
    gradeEn = 'Excellent (Al-Mumtaz)';
    gradeColor = 'text-emerald-400';
  } else if (percentage >= 75) {
    gradeArabic = 'جَيِّد جِدّاً';
    gradeBn = 'খুব ভালো (উন্নতিশীল)';
    gradeEn = 'Very Good (Jayyid Jiddan)';
    gradeColor = 'text-teal-300';
  } else if (percentage >= 50) {
    gradeArabic = 'جَيِّد';
    gradeBn = 'সন্তোষজনক (আরও চেষ্টা করুন)';
    gradeEn = 'Good (Jayyid)';
    gradeColor = 'text-zinc-300';
  } else if (percentage >= 30) {
    gradeArabic = 'مَقْبُول';
    gradeBn = 'প্রাথমিক ধাপ (নিয়মিত হোন)';
    gradeEn = 'Passable (Makbool)';
    gradeColor = 'text-yellow-400';
  }

  return {
    earnedPoints,
    totalPossiblePoints,
    percentage,
    gradeArabic,
    gradeBn,
    gradeEn,
    gradeColor,
  };
}

/**
 * Load Custom Amols from localStorage
 */
export function loadCustomAmols(): AmolItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_AMOLS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Save Custom Amol to localStorage and Cloud Firestore (`users/{userId}/customAmols/{amolId}`)
 */
export function saveCustomAmol(amol: AmolItem, userId?: string | null): AmolItem[] {
  const current = loadCustomAmols();
  const updated = [amol, ...current.filter((x) => x.id !== amol.id)];
  try {
    localStorage.setItem(CUSTOM_AMOLS_KEY, JSON.stringify(updated));
  } catch {}

  if (userId) {
    const docRef = doc(db, 'users', userId, 'customAmols', amol.id);
    setDoc(
      docRef,
      {
        id: amol.id,
        titleBn: amol.titleBn,
        titleEn: amol.titleEn || amol.titleBn,
        descriptionBn: amol.descriptionBn || '',
        descriptionEn: amol.descriptionEn || amol.descriptionBn || '',
        category: amol.category || 'custom',
        points: amol.points || 10,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Custom Amol Cloud Firestore save warning:', err);
    });
  }

  return updated;
}

/**
 * Real-time listener to user's Custom Amols in Cloud Firestore (`users/{userId}/customAmols`)
 */
export function subscribeToUserCustomAmols(
  userId: string,
  onData: (customAmols: AmolItem[]) => void
): () => void {
  const colRef = collection(db, 'users', userId, 'customAmols');

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const remoteItems: AmolItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteItems.push({
            id: data.id || docSnap.id,
            titleBn: data.titleBn || '',
            titleEn: data.titleEn || data.titleBn || '',
            descriptionBn: data.descriptionBn || '',
            descriptionEn: data.descriptionEn || data.descriptionBn || '',
            category: 'custom',
            points: typeof data.points === 'number' ? data.points : 10,
          });
        });
        try {
          localStorage.setItem(CUSTOM_AMOLS_KEY, JSON.stringify(remoteItems));
        } catch {}
        onData(remoteItems);
      }
    },
    (err) => {
      console.warn('Custom amols Firestore subscription note:', err.message);
    }
  );
}

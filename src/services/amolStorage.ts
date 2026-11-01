import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DayAmolState, AmolItem, AmolRemark } from '../types';
import { DEFAULT_AMOLS } from '../data/defaultAmols';

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
 * Save day state to Firestore if user logged in, plus local storage
 */
export async function syncDayState(userId: string | null, state: DayAmolState, allAmols: AmolItem[]): Promise<void> {
  saveDayStateLocal(state);

  if (!userId) return;

  const scoreData = calculateMuhasabaScore(state, allAmols);

  try {
    await setDoc(doc(db, 'users', userId, 'dailyAmols', state.date), {
      userId,
      date: state.date,
      completedAmols: JSON.stringify({
        completedAmolIds: state.completedAmolIds,
        subTaskCompletedIds: state.subTaskCompletedIds,
        amolRemarks: state.amolRemarks || {},
      }),
      score: scoreData.percentage,
      totalCompleted: state.completedAmolIds.length,
      reflection: state.reflectionNote || '',
      tasbeehSummary: JSON.stringify(state.tasbeehCounts),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Sync to Firestore skipped or failed:', err);
  }
}

/**
 * Listen to Firestore daily amol for logged in user
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
        const data = snapshot.data();
        let completed: { 
          completedAmolIds: string[]; 
          subTaskCompletedIds: string[];
          amolRemarks?: Record<string, AmolRemark>;
        } = {
          completedAmolIds: [],
          subTaskCompletedIds: [],
          amolRemarks: {},
        };
        try {
          if (data.completedAmols) {
            completed = JSON.parse(data.completedAmols);
          }
        } catch {}

        let tasbeeh: Record<string, number> = {};
        try {
          if (data.tasbeehSummary) {
            tasbeeh = JSON.parse(data.tasbeehSummary);
          }
        } catch {}

        const syncedState: DayAmolState = {
          date: dateStr,
          completedAmolIds: completed.completedAmolIds || [],
          subTaskCompletedIds: completed.subTaskCompletedIds || [],
          tasbeehCounts: {
            ...getInitialDayState(dateStr).tasbeehCounts,
            ...tasbeeh,
          },
          reflectionNote: data.reflection || '',
          spiritualFeeling: 'peaceful',
          amolRemarks: completed.amolRemarks || {},
          updatedAt: data.updatedAt || new Date().toISOString(),
        };

        saveDayStateLocal(syncedState);
        onData(syncedState);
      }
    },
    (err) => {
      console.warn('Daily amol subscription note:', err.message);
    }
  );
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
 * Save Custom Amols to localStorage
 */
export function saveCustomAmol(amol: AmolItem): AmolItem[] {
  const current = loadCustomAmols();
  const updated = [amol, ...current.filter((x) => x.id !== amol.id)];
  try {
    localStorage.setItem(CUSTOM_AMOLS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

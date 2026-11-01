import { doc, getDoc, setDoc, onSnapshot, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { TrafficStats } from '../types';

const VISITOR_ID_KEY = 'daily_amol_unique_visitor_id';
const STATS_DOC_PATH = 'siteStats/traffic';

/**
 * Generate a unique visitor ID (UUID v4 style)
 */
function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'vis_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Get or create unique visitor token from localStorage
 */
export function getStoredVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'temp_' + Date.now();
  }
}

/**
 * Record unique visit in Firestore and increment counter if first visit
 */
export async function trackUniqueVisitor(): Promise<void> {
  const visitorId = getStoredVisitorId();
  const visitorRef = doc(db, 'visitors', visitorId);
  const statsRef = doc(db, 'siteStats', 'traffic');

  try {
    const existing = await getDoc(visitorRef);
    if (!existing.exists()) {
      // First time this visitor has landed on the app
      await setDoc(visitorRef, {
        visitorId,
        visitedAt: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 150),
      });

      // Increment siteStats/traffic counter
      await setDoc(
        statsRef,
        {
          totalUniqueVisitors: increment(1),
          lastVisitedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      // Return visitor, update last active
      await setDoc(
        visitorRef,
        {
          lastActiveAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    // If permission or offline error occurs, log safely
    console.warn('Traffic tracking notice:', err);
  }
}

/**
 * Subscribe to real-time live unique visitors count
 */
export function subscribeToLiveTraffic(onUpdate: (stats: TrafficStats) => void): () => void {
  const statsRef = doc(db, 'siteStats', 'traffic');

  const unsubscribe = onSnapshot(
    statsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const total = typeof data.totalUniqueVisitors === 'number' ? data.totalUniqueVisitors : 1;
        onUpdate({
          totalUniqueVisitors: Math.max(1, total),
          lastUpdated: data.lastVisitedAt,
          isLive: true,
        });
      } else {
        // Doc doesn't exist yet, seed with initial count
        setDoc(statsRef, {
          totalUniqueVisitors: 1,
          lastVisitedAt: new Date().toISOString(),
        }).catch(() => {});

        onUpdate({
          totalUniqueVisitors: 1,
          isLive: true,
        });
      }
    },
    (error) => {
      console.warn('Live traffic subscription note:', error.message);
      // Fallback
      onUpdate({
        totalUniqueVisitors: 1,
        isLive: false,
      });
    }
  );

  return unsubscribe;
}

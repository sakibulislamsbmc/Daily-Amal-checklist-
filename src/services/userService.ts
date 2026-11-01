import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfileData } from '../types';

const USER_PROFILE_KEY = 'daily_amol_user_profile_cache';
const ENABLED_OPTIONAL_KEY = 'daily_amol_enabled_optional_ids';

/**
 * Get cached or default user profile
 */
export function getLocalUserProfile(): UserProfileData | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Save user profile to local cache
 */
export function saveLocalUserProfile(profile: UserProfileData): void {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

/**
 * Load list of enabled optional amols
 */
export function loadEnabledOptionalIds(): string[] {
  try {
    const raw = localStorage.getItem(ENABLED_OPTIONAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return []; // Default: core 24 + 5 prayers are main; optionals can be toggled by user
}

/**
 * Save list of enabled optional amols
 */
export async function saveEnabledOptionalIds(ids: string[], uid?: string | null): Promise<void> {
  try {
    localStorage.setItem(ENABLED_OPTIONAL_KEY, JSON.stringify(ids));
  } catch {}

  if (uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        enabledOptionalIds: ids,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // document might not exist yet, will save with profile
    }
  }
}

/**
 * Save/Update user profile in Firestore
 */
export async function saveUserProfile(uid: string, profile: Partial<UserProfileData>): Promise<UserProfileData> {
  const current = getLocalUserProfile() || {
    uid,
    displayName: profile.displayName || 'মুহতারাম ব্যবহারকারী',
    email: profile.email || '',
    photoURL: profile.photoURL || '',
    district: 'dhaka',
    quranTarget: '১০ মিনিট',
    masjidPreference: 'নিকটস্থ মসজিদ',
    spiritualBio: 'দৈনিক আমলের মাধ্যমে রবের সন্তুষ্টি অর্জন',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    enabledOptionalIds: loadEnabledOptionalIds(),
  };

  const updated: UserProfileData = {
    ...current,
    ...profile,
    uid,
    lastActiveAt: new Date().toISOString(),
  };

  saveLocalUserProfile(updated);

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...updated,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore profile save warning:', err);
  }

  return updated;
}

/**
 * Real-time listener for user profile
 */
export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfileData) => void
): () => void {
  const docRef = doc(db, 'users', uid);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfileData;
        saveLocalUserProfile(data);
        if (data.enabledOptionalIds) {
          try {
            localStorage.setItem(ENABLED_OPTIONAL_KEY, JSON.stringify(data.enabledOptionalIds));
          } catch {}
        }
        onData(data);
      }
    },
    (err) => {
      console.warn('User profile listener note:', err.message);
    }
  );
}

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithPopup, 
  signInAnonymously,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDocFromServer,
  type Firestore
} from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBJZSTki0ttYMLP33jbKCB2MPDHVHdx0lE",
  authDomain: "daily-amol-checklist.firebaseapp.com",
  projectId: "daily-amol-checklist",
  storageBucket: "daily-amol-checklist.firebasestorage.app",
  messagingSenderId: "544670284879",
  appId: "1:544670284879:web:bea9738850bd5458d97e3a",
  measurementId: "G-J3QQHQJD1L"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch {
    isSupported()
      .then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      })
      .catch(() => {});
  }
}

export const trackAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
  try {
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch {
    // Ignore analytics errors in restricted browser environments
  }
};

// Initialize Cloud Firestore with offline persistence & multi-tab synchronization
function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    return getFirestore(app);
  }
}

export const db: Firestore = createFirestoreInstance();

// Initialize Auth
export const auth = getAuth(app);

// 1. Standard Google Auth Provider for basic login (Profile & Email only)
// Fast, clean, without triggering sensitive Calendar consent warnings
export const baseGoogleProvider = new GoogleAuthProvider();
baseGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 2. Google Provider with Google Calendar scopes (only requested when syncing Calendar)
export const calendarGoogleProvider = new GoogleAuthProvider();
calendarGoogleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
calendarGoogleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
calendarGoogleProvider.setCustomParameters({
  prompt: 'consent',
});

// Backward compatibility alias
export const googleProvider = baseGoogleProvider;

// Access token caching in-memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Helper to detect if running inside an iframe (like AI Studio preview)
export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Helper to open the app in a standalone tab
export const openInStandaloneTab = () => {
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
};

// Standard Firestore Error Formatter per guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
    return false;
  }
}

// Auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface SignInResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  errorCode?: string;
  friendlyMessage?: string;
}

// Sign in with Google Popup (optionally with Calendar scopes)
export const googleSignIn = async (withCalendarScopes = false): Promise<SignInResult> => {
  const provider = withCalendarScopes ? calendarGoogleProvider : baseGoogleProvider;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    if (token) {
      cachedAccessToken = token;
    }
    return {
      success: true,
      user: result.user,
      accessToken: token,
    };
  } catch (error: any) {
    const code = error?.code || '';
    let friendlyMessage = 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।';

    if (code === 'auth/popup-blocked') {
      friendlyMessage = 'ব্রাউজার বা আইফ্রেম কর্তৃক পপ-আপ ব্লক করা হয়েছে। অনুগ্রহ করে "নতুন ট্যাবে খুলুন" বাটনে ক্লিক করুন অথবা PWA অ্যাপ ইনস্টল করে চালান।';
    } else if (code === 'auth/unauthorized-domain') {
      friendlyMessage = `বর্তমান ডোমেইন (${window.location.hostname}) ফায়ারবেস অনুমোদিত তালিকায় নেই। নিচে "অতিথি মোডে প্রবেশ" করুন।`;
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'লগইন উইন্ডোটি বন্ধ করা হয়েছে।';
    } else if (code === 'auth/network-request-failed') {
      friendlyMessage = 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। আপনার নেটওয়ার্ক চেক করুন।';
    } else if (error?.message) {
      friendlyMessage = `সাইন-ইন ত্রুটি: ${error.message}`;
    }

    console.warn('Google sign-in status:', code, friendlyMessage);
    return {
      success: false,
      errorCode: code,
      friendlyMessage,
    };
  } finally {
    isSigningIn = false;
  }
};

// Sign in as Guest / Anonymous user (zero popups, 100% reliable, provides cloud persistence)
export const signInAsGuest = async (): Promise<SignInResult> => {
  try {
    isSigningIn = true;
    const cred = await signInAnonymously(auth);
    return {
      success: true,
      user: cred.user,
      accessToken: '',
    };
  } catch (error: any) {
    console.error('Guest sign-in error:', error);
    return {
      success: false,
      errorCode: error?.code,
      friendlyMessage: 'অতিথি অ্যাকাউন্টে প্রবেশ করা সম্ভব হয়নি। অফলাইন মোডে ডেটা সংরক্ষিত থাকবে।',
    };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

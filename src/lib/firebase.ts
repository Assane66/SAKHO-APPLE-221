// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance, FirebasePerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey: "AIzaSyDqxfcc4iv3Ao5rOJvhadfIjvcTcrOY-Wg",
  authDomain: "sakho-apple-221.firebaseapp.com",
  projectId: "sakho-apple-221",
  storageBucket: "sakho-apple-221.firebasestorage.app",
  messagingSenderId: "673137479413",
  appId: "1:673137479413:web:f4bf429c817eddc3f0ffbc"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const enableClientOnlyMonitoring = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_FIREBASE_MONITORING === 'true';

const auth: Auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => undefined);
}

let db: Firestore;
try {
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: false,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  db = getFirestore(app);
}

const storage = getStorage(app);

let analytics: Analytics | undefined;
let performance: FirebasePerformance | undefined;
if (typeof window !== 'undefined' && enableClientOnlyMonitoring) {
  try {
    analytics = getAnalytics(app);
    performance = getPerformance(app);
  } catch (error) {
    console.error('Firebase client monitoring unavailable:', error);
  }
}

export { app, auth, db, storage, analytics, performance };

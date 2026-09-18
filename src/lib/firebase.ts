// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Initialize Auth and persistence safely for SSR
const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence);
}

let db: Firestore;
try {
  if (typeof window !== 'undefined') {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    db = getFirestore(app);
  }
} catch (e) {
  db = getFirestore(app);
}

const storage = getStorage(app);

// Initialize Analytics only on the client-side
let performance: FirebasePerformance | undefined;
if (typeof window !== 'undefined') {
  getAnalytics(app);
  try {
    performance = getPerformance(app);
  } catch (error) {
    console.error('Firebase Performance Monitoring unavailable:', error);
  }
}

export { app, auth, db, storage, performance };

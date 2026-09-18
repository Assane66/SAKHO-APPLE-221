// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance, FirebasePerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey: "AIzaSyCSEIftELB1fPvQ6wVogoUSlKIwWy-bkgA",
  authDomain: "khalil-premium.firebaseapp.com",
  projectId: "khalil-premium",
  storageBucket: "khalil-premium.appspot.com",
  messagingSenderId: "379342311651",
  appId: "1:379342311651:web:4e495393564f3fe2b3f5d6"
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

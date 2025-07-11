// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

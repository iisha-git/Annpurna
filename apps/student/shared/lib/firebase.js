import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase init — the ONE place the student app connects to the backend.
 *
 * These values identify the project (public by design — think of them as
 * an address, not a password). Real protection lives in Firestore
 * security rules, which decide who may read/write every document.
 *
 * Values sourced from google-services.json so both apps always agree.
 */

const firebaseConfig = {
  apiKey: 'AIzaSyDw-akG2k58fWWrGl7zwmXKZ92bR4ZsagI',
  authDomain: 'annpurna-d41ae.firebaseapp.com',
  projectId: 'annpurna-d41ae',
  storageBucket: 'annpurna-d41ae.firebasestorage.app',
  messagingSenderId: '322405333161',
  appId: '1:322405333161:android:f78e816ea828d8d62dd1b8',
};

// Guard against double-init during fast refresh
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

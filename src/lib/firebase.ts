import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase config — populated from env vars at runtime.
// All pages using Firebase are "use client", so these vars are always
// available in the browser. During Next.js static generation on the server
// the vars may be absent; we guard against that below.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Only initialise when the mandatory keys are present.
// This prevents crashes during Next.js SSR / static generation where
// NEXT_PUBLIC_* vars are injected at build time via Vercel env settings.
function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

// Export lazy accessors so modules that import db/auth/storage don't
// explode on the server when the app couldn't be initialised.
export const db: Firestore = app
  ? getFirestore(app)
  : (null as unknown as Firestore);

export const auth: Auth = app
  ? getAuth(app)
  : (null as unknown as Auth);

export const storage: FirebaseStorage = app
  ? getStorage(app)
  : (null as unknown as FirebaseStorage);

// Analytics — browser only, production only
export let analytics: unknown = null;
if (typeof window !== "undefined" && process.env.NODE_ENV === "production" && app) {
  import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
    isSupported().then((ok) => {
      if (ok) analytics = getAnalytics(app);
    }).catch(() => {});
  }).catch(() => {});
}

export default app;

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// During Next.js static generation the server evaluates this module but
// NEXT_PUBLIC_* vars are empty → getAuth/getFirestore throw auth/invalid-api-key.
// Guard: only initialise Firebase services in a browser environment.
const isBrowser = typeof window !== "undefined";

const app = isBrowser
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : (getApps().length ? getApp() : initializeApp(firebaseConfig)); // same, kept for clarity

export const db = isBrowser ? getFirestore(app) : (null as any);
export const auth = isBrowser ? getAuth(app) : (null as any);
export const storage = isBrowser ? getStorage(app) : (null as any);

export let analytics: unknown = null;
if (isBrowser && process.env.NODE_ENV === "production") {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => {
      isSupported()
        .then((ok) => { if (ok) analytics = getAnalytics(app); })
        .catch(() => {});
    })
    .catch(() => {});
}

export default app;

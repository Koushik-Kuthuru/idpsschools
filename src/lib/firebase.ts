import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Always initialise — on the server during static generation the keys
// will be undefined but Firebase will simply fail later (not at import time)
// because all pages that use Firebase are "use client" components.
// The guard below prevents the initializeApp crash when called twice.
let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch {
  app = getApp();
}

export { app };
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Analytics — browser + production only, dynamically imported
export let analytics: unknown = null;
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => {
      isSupported()
        .then((ok) => { if (ok) analytics = getAnalytics(app); })
        .catch(() => {});
    })
    .catch(() => {});
}

export default app;

"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId };
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfig();
  if (!config) return null;
  if (getApps().length) return getApp();
  return initializeApp(config);
}

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const ok = await isSupported();
    if (!ok) return null;
    return getAnalytics(app);
  } catch (err) {
    console.warn("Analytics initialization failed or blocked");
    return null;
  }
}


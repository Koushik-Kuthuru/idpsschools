import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let initError: string | null = null;

function getServiceAccount(): Record<string, unknown> | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>;
    } catch {
      initError = "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON";
      return null;
    }
  }

  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    "serviceAccount.json",
    "service-account.json",
    "firebase-service-account.json",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    const abs = resolve(process.cwd(), p);
    if (existsSync(abs)) {
      try {
        return JSON.parse(readFileSync(abs, "utf8")) as Record<string, unknown>;
      } catch {
        initError = `Failed to parse service account at ${abs}`;
        return null;
      }
    }
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
      } catch {
        initError = `Failed to parse service account at ${p}`;
        return null;
      }
    }
  }

  initError = "No Firebase service account configured";
  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  if (adminApp) return true;
  return getServiceAccount() !== null;
}

export function getFirebaseAdminError(): string | null {
  return initError;
}

function ensureAdmin(): { auth: Auth; db: Firestore } {
  if (adminAuth && adminDb) return { auth: adminAuth, db: adminDb };

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(initError ?? "Firebase Admin SDK is not configured");
  }

  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        (serviceAccount.project_id as string | undefined),
    });
  } else {
    adminApp = getApps()[0]!;
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  return { auth: adminAuth, db: adminDb };
}

export function getAdminAuth(): Auth {
  return ensureAdmin().auth;
}

export function getAdminDb(): Firestore {
  return ensureAdmin().db;
}

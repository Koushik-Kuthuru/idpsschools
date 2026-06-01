/**
 * setup-auth-users.mjs
 * Creates Firebase Auth users + Firestore role docs using the Admin SDK.
 * Run: node scripts/setup-auth-users.mjs
 *
 * Requirements:
 *   - FIREBASE_PROJECT_ID in .env.local
 *   - A service account JSON file path in GOOGLE_APPLICATION_CREDENTIALS
 *     OR the JSON content in FIREBASE_SERVICE_ACCOUNT_JSON
 *
 * If you don't have a service account yet:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   Save the file as serviceAccount.json in the project root (it's gitignored).
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync, readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env.local") });

// ── Resolve service account ──────────────────────────────────────────────────
function getServiceAccount() {
  // 1. Inline JSON in env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
      process.exit(1);
    }
  }

  // 2. Path in env var
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    const abs = resolve(__dirname, "..", envPath);
    if (existsSync(abs)) return JSON.parse(readFileSync(abs, "utf8"));
    if (existsSync(envPath)) return JSON.parse(readFileSync(envPath, "utf8"));
  }

  // 3. Conventional fallback paths
  const fallbacks = [
    resolve(__dirname, "../serviceAccount.json"),
    resolve(__dirname, "../service-account.json"),
    resolve(__dirname, "../firebase-service-account.json"),
  ];
  for (const p of fallbacks) {
    if (existsSync(p)) {
      console.log(`ℹ️  Using service account from: ${p}`);
      return JSON.parse(readFileSync(p, "utf8"));
    }
  }

  console.error(`
❌ No service account found. Do one of the following:

  Option A — Save the file:
    1. Firebase Console → Project Settings → Service Accounts
    2. Click "Generate new private key" → save as serviceAccount.json in project root
    3. Re-run this script

  Option B — Set env var:
    Add to .env.local:
    FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccount.json

  Option C — Inline JSON:
    Add to .env.local:
    FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
`);
  process.exit(1);
}

// ── Init Admin SDK ────────────────────────────────────────────────────────────
const serviceAccount = getServiceAccount();

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

// ── Users to create ───────────────────────────────────────────────────────────
const users = [
  {
    email: "super@idps.com",
    password: "Admin@1234",
    displayName: "Super Admin",
    role: "super_admin",
    schoolId: "all",
  },
  {
    email: "admin@idpskalaburagi.com",
    password: "Admin@1234",
    displayName: "Branch Admin – Kalaburagi",
    role: "admin",
    schoolId: "idpskalaburagi",
  },
  {
    email: "teacher@idpskalaburagi.com",
    password: "Admin@1234",
    displayName: "Teacher – Kalaburagi",
    role: "teacher",
    schoolId: "idpskalaburagi",
  },
  {
    email: "admin@idpscherukupalli.com",
    password: "Admin@1234",
    displayName: "Branch Admin – Cherukupalli",
    role: "admin",
    schoolId: "idpscherukupalli",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function setupUsers() {
  console.log(`\n🔧 Setting up users in project: ${serviceAccount.project_id}\n`);

  for (const u of users) {
    let uid;

    // Create or fetch existing Auth user
    try {
      const created = await adminAuth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.displayName,
        emailVerified: true,
      });
      uid = created.uid;
      console.log(`✅ Created Auth user: ${u.email}  (uid: ${uid})`);
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        const existing = await adminAuth.getUserByEmail(u.email);
        uid = existing.uid;
        console.log(`⚠️  Auth user already exists: ${u.email}  (uid: ${uid})`);
      } else {
        console.error(`❌ Failed to create ${u.email}: [${err.code}] ${err.message}`);
        continue;
      }
    }

    // Write Firestore role doc
    try {
      if (u.role === "super_admin") {
        await adminDb.doc(`super_admin_users/${uid}`).set({
          id: uid,
          name: u.displayName,
          email: u.email,
          role: u.role,
          status: "active",
          createdAt: new Date().toISOString(),
        }, { merge: true });
        console.log(`   → Firestore: super_admin_users/${uid}`);
      } else {
        await adminDb.doc(`user_roles/${uid}`).set({
          id: uid,
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          schoolId: u.schoolId,
          createdAt: new Date().toISOString(),
        }, { merge: true });
        console.log(`   → Firestore: user_roles/${uid}  (role: ${u.role}, school: ${u.schoolId})`);
      }
    } catch (err) {
      console.error(`   ❌ Firestore write failed for ${u.email}:`, err.message);
    }
  }

  console.log(`
✅ Done!

Test credentials (all passwords: Admin@1234):
  super@idps.com              → super_admin
  admin@idpskalaburagi.com    → admin (Kalaburagi)
  teacher@idpskalaburagi.com  → teacher (Kalaburagi)
  admin@idpscherukupalli.com  → admin (Cherukupalli)
`);
  process.exit(0);
}

setupUsers();

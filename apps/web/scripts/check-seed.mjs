import dotenv from "dotenv";
import path from "path";
import process from "process";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync } from "fs";
import { readFile } from "fs/promises";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function getServiceAccount() {
  const defaultPath = path.join(process.cwd(), "scripts", "serviceAccountKey.json");
  if (existsSync(defaultPath)) {
    const raw = await readFile(defaultPath, "utf8");
    return JSON.parse(raw);
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  return JSON.parse(raw);
}

async function main() {
  const sa = await getServiceAccount();
  if (!getApps().length) initializeApp({ credential: cert(sa), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || sa.project_id });
  const db = getFirestore();
  const snap = await db.collection("schools").doc("idpskalaburagi").collection("students").count().get();
  console.log("Students count:", snap.data().count);
}
main().catch(console.error);

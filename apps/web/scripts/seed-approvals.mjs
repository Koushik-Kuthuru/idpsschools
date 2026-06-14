/**
 * Seeds pending approvals (leaves, expenses, applications) into Firestore
 * for each school branch. Requires serviceAccount.json or FIREBASE_SERVICE_ACCOUNT_JSON.
 *
 * Usage: node scripts/seed-approvals.mjs
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { readFile } from "fs/promises";
import path from "path";

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  for (const name of ["serviceAccount.json", "service-account.json"]) {
    const abs = resolve(process.cwd(), name);
    if (existsSync(abs)) {
      return JSON.parse(readFileSync(abs, "utf8"));
    }
  }
  throw new Error("No service account found. Add serviceAccount.json or FIREBASE_SERVICE_ACCOUNT_JSON.");
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore(app);

const SCHOOLS = ["idpskalaburagi", "idpscherukupalli"];

async function writeCollection(schoolId, collectionName, docs) {
  const batch = db.batch();
  for (const { id, data } of docs) {
    const ref = db.collection("schools").doc(schoolId).collection(collectionName).doc(String(id));
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  console.log(`  ${collectionName}: ${docs.length} docs`);
}

function mapLeaves(rows, now) {
  return rows.map((x) => ({
    id: x.id,
    data: {
      employeeId: x.employeeId,
      employeeName: x.employeeName,
      type: x.type,
      from: x.from,
      to: x.to,
      days: x.days,
      status: x.status || "Pending",
      createdAt: x.createdAt || x.from || now,
      updatedAt: now,
    },
  }));
}

function mapExpenses(rows, now) {
  return rows.map((x) => ({
    id: x.id,
    data: {
      title: x.title,
      category: x.category,
      amount: x.amount,
      date: x.date,
      status: x.status || "Pending",
      vendor: x.vendor || "",
      createdAt: x.createdAt || x.date || now,
      updatedAt: now,
    },
  }));
}

function mapApplications(rows, now) {
  return rows.map((x) => ({
    id: x.id,
    data: {
      studentName: x.studentName || x.name,
      name: x.name || x.studentName,
      grade: x.grade,
      parentName: x.parentName || "",
      phone: x.phone || "",
      email: x.email || "",
      status: x.status || "Submitted",
      createdAt: x.createdAt || x.date || now,
      updatedAt: now,
    },
  }));
}

async function main() {
  const seedPath = path.join(process.cwd(), "src", "data", "seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const now = new Date().toISOString();

  const hrLeaveRequests = Array.isArray(seed.hrLeaveRequests) ? seed.hrLeaveRequests : [];
  const financeExpenses = Array.isArray(seed.financeExpenses) ? seed.financeExpenses : [];
  const admissionApplications = Array.isArray(seed.admissionApplications) ? seed.admissionApplications : [];

  for (const schoolId of SCHOOLS) {
    console.log(`Seeding approvals for ${schoolId}...`);
    await writeCollection(schoolId, "leaves", mapLeaves(hrLeaveRequests, now));
    await writeCollection(schoolId, "expenses", mapExpenses(financeExpenses, now));
    await writeCollection(schoolId, "applications", mapApplications(admissionApplications, now));
  }

  console.log("Done — refresh the admin dashboard to see pending approvals.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

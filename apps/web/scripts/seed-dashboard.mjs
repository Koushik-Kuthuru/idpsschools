/**
 * Seeds dashboard metrics (fees, events, transport) into Firestore for all branches.
 * Uses current-month dates so fee collection widgets show real values.
 *
 * Usage: node scripts/seed-dashboard.mjs
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

function pad(n) {
  return String(n).padStart(2, "0");
}

function currentMonthDate(day) {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(day)}`;
}

function upcomingDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

async function writeCollection(schoolId, collectionName, docs) {
  const batch = db.batch();
  for (const { id, data } of docs) {
    const ref = db.collection("schools").doc(schoolId).collection(collectionName).doc(String(id));
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  console.log(`  ${collectionName}: ${docs.length} docs`);
}

function mapPayments(rows, now) {
  const monthDate = currentMonthDate(5);
  const monthDate2 = currentMonthDate(12);
  return rows.map((x, i) => {
    const date = i === 0 ? monthDate : monthDate2;
    return {
      id: x.id,
      data: {
        student: x.student,
        studentName: x.student,
        invoiceId: x.invoiceId,
        amount: x.amount,
        mode: x.mode,
        status: x.status === "Pending" ? "Pending" : "Completed",
        date,
        createdAt: date,
        updatedAt: now,
      },
    };
  });
}

function mapInvoices(rows, now) {
  const due = currentMonthDate(20);
  const issued = currentMonthDate(1);
  return rows.map((x) => ({
    id: x.id,
    data: {
      ...x,
      date: issued,
      dueDate: due,
      createdAt: issued,
      amountPaid: x.status === "Paid" ? x.amount : 0,
      updatedAt: now,
    },
  }));
}

function mapEvents(seedEvents, now) {
  const offsets = [7, 14, 21, 35, 60];
  return (Array.isArray(seedEvents) ? seedEvents : []).map((ev, i) => ({
    id: `EVT-${i + 1}`,
    data: {
      title: ev.title,
      type: ev.type || "event",
      date: upcomingDate(offsets[i] ?? 7 + i * 7),
      location: ev.location || "School Campus",
      createdAt: now,
      updatedAt: now,
    },
  }));
}

const transportSeed = {
  buses: [
    { id: "BUS-01", data: { busNo: "KA-32-1001", capacity: 45, status: "Active" } },
    { id: "BUS-02", data: { busNo: "KA-32-1002", capacity: 40, status: "Active" } },
    { id: "BUS-03", data: { busNo: "KA-32-1003", capacity: 42, status: "Maintenance" } },
  ],
  routes: [
    { id: "RT-01", data: { name: "City Center Route", stops: 8, status: "Active" } },
    { id: "RT-02", data: { name: "Industrial Area Route", stops: 6, status: "Active" } },
    { id: "RT-03", data: { name: "Station Road Route", stops: 5, status: "Active" } },
  ],
  drivers: [
    { id: "DRV-01", data: { name: "Ramesh Kumar", phone: "9876500001", status: "Present", presentToday: true } },
    { id: "DRV-02", data: { name: "Suresh Patil", phone: "9876500002", status: "Present", presentToday: true } },
    { id: "DRV-03", data: { name: "Anil Gowda", phone: "9876500003", status: "Active", presentToday: false } },
  ],
};

async function main() {
  const seedPath = path.join(process.cwd(), "src", "data", "seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const now = new Date().toISOString();

  const financePayments = Array.isArray(seed.financePayments) ? seed.financePayments : [];
  const financeInvoices = Array.isArray(seed.financeInvoices) ? seed.financeInvoices : [];
  const financeFeeCollections = Array.isArray(seed.financeFeeCollections) ? seed.financeFeeCollections : [];
  const seedEvents = Array.isArray(seed.seedEvents) ? seed.seedEvents : [];

  for (const schoolId of SCHOOLS) {
    console.log(`Seeding dashboard data for ${schoolId}...`);
    await writeCollection(schoolId, "payments", mapPayments(financePayments, now));
    await writeCollection(schoolId, "invoices", mapInvoices(financeInvoices, now));
    await writeCollection(
      schoolId,
      "fee_collections",
      financeFeeCollections.map((x) => ({ id: x.id, data: { ...x, updatedAt: now } }))
    );
    await writeCollection(schoolId, "events", mapEvents(seedEvents, now));
    await writeCollection(
      schoolId,
      "buses",
      transportSeed.buses.map((x) => ({ id: x.id, data: { ...x.data, updatedAt: now } }))
    );
    await writeCollection(
      schoolId,
      "routes",
      transportSeed.routes.map((x) => ({ id: x.id, data: { ...x.data, updatedAt: now } }))
    );
    await writeCollection(
      schoolId,
      "drivers",
      transportSeed.drivers.map((x) => ({ id: x.id, data: { ...x.data, updatedAt: now } }))
    );
  }

  console.log("Done — refresh the admin dashboard.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

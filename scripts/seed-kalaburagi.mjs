import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFile } from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function toUpperSection(section) {
  return String(section || "").trim().toUpperCase();
}

async function main() {
  const seedPath = path.join(process.cwd(), "src", "data", "seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));

  const now = new Date().toISOString();
  const SCHOOL_ID = "idpskalaburagi";

  const students = Array.isArray(seed.adminStudents) ? seed.adminStudents : [];
  const employees = Array.isArray(seed.adminEmployees) ? seed.adminEmployees : [];
  const subjects = Array.isArray(seed.academicSubjects) ? seed.academicSubjects : [];
  const gradeGroups = Array.isArray(seed.academicClasses) ? seed.academicClasses : [];
  const financeInvoices = Array.isArray(seed.financeInvoices) ? seed.financeInvoices : [];
  const financeExpenses = Array.isArray(seed.financeExpenses) ? seed.financeExpenses : [];
  const financePayments = Array.isArray(seed.financePayments) ? seed.financePayments : [];
  const financeFeeStructures = Array.isArray(seed.financeFeeStructures) ? seed.financeFeeStructures : [];
  const financeFeeCollections = Array.isArray(seed.financeFeeCollections) ? seed.financeFeeCollections : [];
  const financePayroll = Array.isArray(seed.financePayroll) ? seed.financePayroll : [];
  const hrDepartments = Array.isArray(seed.hrDepartments) ? seed.hrDepartments : [];
  const hrLeaveRequests = Array.isArray(seed.hrLeaveRequests) ? seed.hrLeaveRequests : [];
  const admissionLeads = Array.isArray(seed.admissionLeads) ? seed.admissionLeads : [];
  const admissionEnquiries = Array.isArray(seed.admissionEnquiries) ? seed.admissionEnquiries : [];
  const admissionApplications = Array.isArray(seed.admissionApplications) ? seed.admissionApplications : [];
  const communicationMessages = Array.isArray(seed.communicationMessages) ? seed.communicationMessages : [];
  const inventoryAssets = Array.isArray(seed.inventoryAssets) ? seed.inventoryAssets : [];
  const inventoryStock = Array.isArray(seed.inventoryStock) ? seed.inventoryStock : [];
  const inventoryPurchaseOrders = Array.isArray(seed.inventoryPurchaseOrders) ? seed.inventoryPurchaseOrders : [];

  const classDocs = [];
  for (const g of gradeGroups) {
    const grade = String(g.grade || "").trim();
    const sections = Array.isArray(g.sections) ? g.sections : [];
    for (const s of sections) {
      const section = toUpperSection(s.section);
      const id = `${grade}-${section}`;
      classDocs.push({
        id,
        doc: {
          grade,
          section,
          strength: Number(s.strength || 0),
          teacherCount: Number(s.teacherCount || 0),
          status: String(s.status || "Active"),
          room: String(s.room || ""),
          updatedAt: now,
        },
      });
    }
  }

  const timetables = [];
  if (seed.seedTimetable) timetables.push({ id: "seed", doc: { type: "seedTimetable", timetable: seed.seedTimetable, updatedAt: now } });
  if (seed.timetableSchedules) timetables.push({ id: "schedules", doc: { type: "timetableSchedules", schedules: seed.timetableSchedules, updatedAt: now } });

  async function writeCollection(collectionName, docs) {
    for (const { id, doc: data } of docs) {
      const ref = doc(db, "schools", SCHOOL_ID, collectionName, String(id));
      await setDoc(ref, data, { merge: true });
    }
    console.log(`Finished writing ${docs.length} documents to ${collectionName}`);
  }

  await writeCollection("students", students.map((s) => ({ id: s.id, doc: { ...s, updatedAt: now } })));
  await writeCollection("employees", employees.map((e) => ({ id: e.id, doc: { ...e, updatedAt: now } })));
  await writeCollection("teachers", employees.map((e) => ({ id: e.id, doc: { ...e, updatedAt: now } })));
  await writeCollection("subjects", subjects.map((s) => ({
    id: s.id,
    doc: { ...s, grade: String(s.grade || "").trim(), section: toUpperSection(s.section), updatedAt: now },
  })));
  await writeCollection("classes", classDocs);
  await writeCollection("timetables", timetables);
  await writeCollection("invoices", financeInvoices.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("expenses", financeExpenses.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("payments", financePayments.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("fee_structures", financeFeeStructures.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("fee_collections", financeFeeCollections.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("payroll", financePayroll.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("departments", hrDepartments.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("leave_requests", hrLeaveRequests.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admission_leads", admissionLeads.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admission_enquiries", admissionEnquiries.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admission_applications", admissionApplications.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("communication_messages", communicationMessages.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventory_assets", inventoryAssets.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventory_stock", inventoryStock.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventory_purchase_orders", inventoryPurchaseOrders.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));

  console.log("Successfully seeded IDPS Kalaburagi!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

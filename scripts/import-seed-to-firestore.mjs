import dotenv from "dotenv";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import process from "process";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toUpperSection(section) {
  return String(section || "").trim().toUpperCase();
}

async function getServiceAccount() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    if (!existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    const raw = await readFile(serviceAccountPath, "utf8");
    return JSON.parse(raw);
  }
  const defaultPath = path.join(process.cwd(), "scripts", "serviceAccountKey.json");
  if (existsSync(defaultPath)) {
    const raw = await readFile(defaultPath, "utf8");
    return JSON.parse(raw);
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS, or place scripts/serviceAccountKey.json, or set FIREBASE_SERVICE_ACCOUNT_JSON."
    );
  }
  return JSON.parse(raw);
}

async function main() {
  const serviceAccount = await getServiceAccount();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    serviceAccount?.project_id;
  if (!projectId) {
    throw new Error(
      "Missing Firebase project id. Set FIREBASE_PROJECT_ID (recommended) or NEXT_PUBLIC_FIREBASE_PROJECT_ID, or ensure your service account JSON contains project_id."
    );
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount), projectId });
  }

  const db = getFirestore();
  const seedPath = path.join(process.cwd(), "src", "data", "seed.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));

  const now = FieldValue.serverTimestamp();

  const meta = {
    seedCounts: seed.seedCounts || null,
    seedKpis: seed.seedKpis || null,
    seedKpiDeltas: seed.seedKpiDeltas || null,
    seedStaffAvailability: seed.seedStaffAvailability || null,
    gradeCatalog: seed.gradeCatalog || null,
    updatedAt: now,
  };

  await db.doc("metadata/seed").set(meta, { merge: true });

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
    const batches = chunk(docs, 400);
    for (const part of batches) {
      const batch = db.batch();
      for (const { id, doc } of part) {
        batch.set(db.collection(collectionName).doc(String(id)), doc, { merge: true });
      }
      await batch.commit();
    }
  }

  await writeCollection(
    "students",
    students.map((s) => ({ id: s.id, doc: { ...s, updatedAt: now } }))
  );

  await writeCollection(
    "employees",
    employees.map((e) => ({ id: e.id, doc: { ...e, updatedAt: now } }))
  );

  await writeCollection(
    "academicSubjects",
    subjects.map((s) => ({
      id: s.id,
      doc: {
        ...s,
        grade: String(s.grade || "").trim(),
        section: toUpperSection(s.section),
        updatedAt: now,
      },
    }))
  );

  await writeCollection("academicClasses", classDocs);

  await writeCollection("timetables", timetables);
  await writeCollection("financeInvoices", financeInvoices.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("financeExpenses", financeExpenses.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("financePayments", financePayments.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("financeFeeStructures", financeFeeStructures.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("financeFeeCollections", financeFeeCollections.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("financePayroll", financePayroll.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("hrDepartments", hrDepartments.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("hrLeaveRequests", hrLeaveRequests.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admissionLeads", admissionLeads.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admissionEnquiries", admissionEnquiries.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("admissionApplications", admissionApplications.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("communicationMessages", communicationMessages.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventoryAssets", inventoryAssets.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventoryStock", inventoryStock.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));
  await writeCollection("inventoryPurchaseOrders", inventoryPurchaseOrders.map((x) => ({ id: x.id, doc: { ...x, updatedAt: now } })));

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        imported: {
          students: students.length,
          employees: employees.length,
          subjects: subjects.length,
          classes: classDocs.length,
          timetables: timetables.length,
          financeInvoices: financeInvoices.length,
          financeExpenses: financeExpenses.length,
          financePayments: financePayments.length,
          financeFeeStructures: financeFeeStructures.length,
          financeFeeCollections: financeFeeCollections.length,
          financePayroll: financePayroll.length,
          hrDepartments: hrDepartments.length,
          hrLeaveRequests: hrLeaveRequests.length,
          admissionLeads: admissionLeads.length,
          admissionEnquiries: admissionEnquiries.length,
          admissionApplications: admissionApplications.length,
          communicationMessages: communicationMessages.length,
          inventoryAssets: inventoryAssets.length,
          inventoryStock: inventoryStock.length,
          inventoryPurchaseOrders: inventoryPurchaseOrders.length,
        },
      },
      null,
      2
    ) + "\n"
  );
}

main().catch((e) => {
  process.stderr.write(`${e?.stack || e}\n`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Import fee transaction receipts from abc transactions Excel (2026-27).
 * Stores each receipt in notices (__fee_payment__) and on student profile feeTransactions.
 *
 * Usage:
 *   node scripts/import-cherukupalli-transactions-excel.mjs --dry-run --file "/path/abc-8.xlsx"
 *   node scripts/import-cherukupalli-transactions-excel.mjs --apply --file "/path/abc-8.xlsx"
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolveBranchId } from "./lib/resolve-branch.mjs";
import {
  baseAdmissionNo,
  saveStudentProfileNotice,
  loadStudentProfileNotice,
  buildEnrollmentFromRow,
  mergeStudentEnrollment,
} from "./import-cherukupalli-students.mjs";
import {
  loadBranchFeePayments,
  saveFeePayment,
  paymentNoticeTitle,
  FEE_PAYMENT_PREFIX,
} from "./lib/fee-payments-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_FILE = path.join(ROOT, "data/abc-8.xlsx");
const ACADEMIC_YEAR = "2026-27";
const IMPORT_SOURCE = "abc-8.xlsx";

const TXN_HEADERS = [
  "Rec.No.",
  "Adm No.",
  "Student/Staff Name",
  "Father Name",
  "Class",
  "Month",
  "Date",
  "LAST YEAR DUE",
  "ADMISSION FEE",
  "TUITION FEE",
  "HOSTEL FEE",
  "IIT FEE",
  "OLYMPIAD FEE",
  "EXCURSION FEE",
  "CIRRICULAM FEE",
  "FOOD FEE",
  "MISCELLANEOUS",
  "LAUNDRY FEE",
  "CO-SPARK FEE",
  "Transport",
  "Reg",
  "Chq. Bounce Charge",
  "Mode",
  "Total",
  "Trans. No.",
  "Chq No",
  "Remark",
  "Ex Head",
  "User",
];

const LINE_ITEM_HEADS = [
  "LAST YEAR DUE",
  "ADMISSION FEE",
  "TUITION FEE",
  "HOSTEL FEE",
  "IIT FEE",
  "OLYMPIAD FEE",
  "EXCURSION FEE",
  "CIRRICULAM FEE",
  "FOOD FEE",
  "MISCELLANEOUS",
  "LAUNDRY FEE",
  "CO-SPARK FEE",
  { key: "Transport", label: "TRANSPORT FEE" },
  { key: "Reg", label: "REG FEE" },
  { key: "Chq. Bounce Charge", label: "CHQ. BOUNCE CHARGE" },
];

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const KEEP_OLD = args.includes("--keep-old-payments");
const CREATE_MISSING = args.includes("--create-missing");

function readArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const filePath = (() => {
  const file = readArg("--file", DEFAULT_FILE);
  return path.isAbsolute(file) ? file : path.join(ROOT, file);
})();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error("Excel not found:", filePath);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseAmount(value) {
  const n = Number.parseInt(String(value ?? "0").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

const MONTH_NAME_TO_NUM = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function normalizeTime24(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";

  const ampm = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampm) {
    let hour = Number.parseInt(ampm[1], 10);
    const minute = ampm[2];
    const second = ampm[3] ?? "00";
    const meridiem = ampm[4].toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}:${second.padStart(2, "0")}`;
  }

  const hms = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    return `${String(hms[1]).padStart(2, "0")}:${hms[2]}:${(hms[3] ?? "00").padStart(2, "0")}`;
  }

  return "";
}

function parseExcelTxnDateTime(raw) {
  const text = String(raw ?? "").trim();
  if (!text || text === "0") {
    return { isoDate: "", dateDisplay: "", time: "", createdAt: "" };
  }

  if (/^\d+$/.test(text) && Number.parseInt(text, 10) >= 1000) {
    return { isoDate: "", dateDisplay: "", time: "", createdAt: "" };
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const isoDate = text.slice(0, 10);
    const year = Number.parseInt(isoDate.slice(0, 4), 10);
    if (year >= 2000 && year <= 2100) {
      const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
      const time = timeMatch ? normalizeTime24(timeMatch[1]) : "";
      return {
        isoDate,
        dateDisplay: text,
        time,
        createdAt: `${isoDate}T${time || "00:00:00"}+05:30`,
      };
    }
  }

  const named = text.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?))?$/i
  );
  if (named) {
    const [, day, monthName, year, timePart] = named;
    const mm = MONTH_NAME_TO_NUM[monthName.toLowerCase()];
    if (mm) {
      const isoDate = `${year}-${mm}-${day.padStart(2, "0")}`;
      const time = timePart ? normalizeTime24(timePart) : "";
      return {
        isoDate,
        dateDisplay: text,
        time,
        createdAt: `${isoDate}T${time || "00:00:00"}+05:30`,
      };
    }
  }

  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = epoch.getTime() + Math.round(serial * 86400000);
    const d = new Date(ms);
    const isoDate = d.toISOString().slice(0, 10);
    const year = Number.parseInt(isoDate.slice(0, 4), 10);
    if (year >= 2000 && year <= 2100) {
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");
      const seconds = String(d.getUTCSeconds()).padStart(2, "0");
      const time = `${hours}:${minutes}:${seconds}`;
      const dateDisplay = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      return {
        isoDate,
        dateDisplay: time !== "00:00:00" ? `${dateDisplay} ${time}` : dateDisplay,
        time: time !== "00:00:00" ? time : "",
        createdAt: `${isoDate}T${time}+05:30`,
      };
    }
  }

  const parts = text.split(/[\/\-\.]/).map((p) => p.trim());
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (c.length === 2) c = `20${c}`;
    const isoDate =
      a.length === 4
        ? `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
        : `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    return {
      isoDate,
      dateDisplay: text,
      time: "",
      createdAt: `${isoDate}T00:00:00+05:30`,
    };
  }

  return { isoDate: "", dateDisplay: text, time: "", createdAt: "" };
}

function normalizeMode(raw) {
  const mode = String(raw ?? "").trim();
  const upper = mode.toUpperCase();
  if (!mode || /^\d+$/.test(mode)) return "Cash";
  if (upper.includes("UPI")) return "UPI";
  if (upper.includes("CARD")) return "Credit Card";
  if (upper.includes("CASH")) return "Cash";
  if (upper.includes("NEFT") || upper.includes("BANK")) return "NEFT";
  if (upper.includes("CHEQ")) return "Cheque";
  return mode;
}

function isTxnDataRow(row) {
  const rec = String(row[0] ?? "").trim();
  return /^\d+$/.test(rec) && Number.parseInt(rec, 10) > 0;
}

function readTransactionRows(excelFile) {
  const workbook = XLSX.readFile(excelFile, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const table = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });

  const rows = [];
  for (let i = 0; i < table.length; i++) {
    const raw = table[i];
    if (!isTxnDataRow(raw)) continue;

    const record = {};
    for (let col = 0; col < TXN_HEADERS.length; col++) {
      record[TXN_HEADERS[col]] = raw[col] ?? "";
    }
    record._rowNum = i + 1;
    rows.push(record);
  }

  return rows;
}

function normalizeTransaction(row) {
  const recNo = String(row["Rec.No."] ?? "").trim();
  const remark = String(row.Remark ?? "").trim();
  const remarkUpper = remark.toUpperCase();

  let total = parseAmount(row.Total);
  let mode = row.Mode;
  let bounceCharge = parseAmount(row["Chq. Bounce Charge"]);

  const modeIsAmount =
    typeof mode === "number" || (typeof mode === "string" && /^\d+$/.test(mode.trim()));
  const isCancelled = remarkUpper === "CANCELLED" || (total <= 0 && modeIsAmount);

  if (isCancelled && modeIsAmount) {
    total = parseAmount(mode);
    mode = row["Chq. Bounce Charge"];
    bounceCharge = 0;
  }

  const lineItems = [];
  for (const head of LINE_ITEM_HEADS) {
    const key = typeof head === "string" ? head : head.key;
    const label = typeof head === "string" ? head : head.label;
    const amount = parseAmount(row[key]);
    if (amount <= 0) continue;
    if (isCancelled && key === "Chq. Bounce Charge" && typeof row.Mode === "number") continue;
    lineItems.push({ particular: label, amount: String(amount) });
  }

  const lineTotal = lineItems.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  if (total <= 0 && lineTotal > 0) total = lineTotal;

  const month = String(row.Month ?? "").trim();
  const { isoDate, dateDisplay, time, createdAt } = parseExcelTxnDateTime(row.Date);

  return {
    recNo,
    adm: baseAdmissionNo(row["Adm No."]),
    studentName: String(row["Student/Staff Name"] ?? "").trim(),
    fatherName: String(row["Father Name"] ?? "").trim(),
    classLabel: String(row.Class ?? "").trim(),
    month,
    date: isoDate,
    dateDisplay,
    time,
    createdAt,
    total,
    mode: normalizeMode(mode),
    transNo: String(row["Trans. No."] ?? "").trim(),
    chqNo: String(row["Chq No"] ?? "").trim(),
    remark,
    exHead: String(row["Ex Head"] ?? "").trim(),
    user: String(row.User ?? "").trim(),
    reg: parseAmount(row.Reg),
    bounceCharge,
    lineItems,
    status: isCancelled ? "Cancelled" : "Completed",
    rowNum: row._rowNum,
  };
}

function paymentReference(recNo) {
  return `abc8-${ACADEMIC_YEAR}-${recNo}`;
}

function paymentId(recNo) {
  return `RCP-${ACADEMIC_YEAR}-${recNo}`;
}

function buildPaymentRecord(txn, student) {
  const reference = paymentReference(txn.recNo);
  const id = paymentId(txn.recNo);

  return {
    id,
    receiptNo: txn.recNo,
    studentId: student?.id ?? "",
    studentName: student?.full_name ?? txn.studentName,
    admissionNo: txn.adm,
    fatherName: txn.fatherName,
    classLabel: txn.classLabel,
    amount: txn.total,
    mode: txn.mode,
    feeMonth: txn.month,
    month: txn.month,
    date: txn.date,
    dateDisplay: txn.dateDisplay,
    time: txn.time,
    status: txn.status,
    remark: txn.remark,
    collectedByName: txn.user || "Excel Import",
    reference,
    transNo: txn.transNo,
    chqNo: txn.chqNo,
    exHead: txn.exHead,
    reg: txn.reg,
    bounceCharge: txn.bounceCharge,
    lineItems: txn.lineItems,
    particular: txn.exHead || "FEE PAYMENT",
    academicYear: ACADEMIC_YEAR,
    importSource: IMPORT_SOURCE,
    createdAt: txn.createdAt || new Date().toISOString(),
  };
}

function buildProfileTransaction(payment) {
  return {
    id: payment.id,
    receiptNo: payment.receiptNo,
    date: payment.date,
    dateDisplay: payment.dateDisplay,
    time: payment.time,
    month: payment.month,
    amount: payment.amount,
    mode: payment.mode,
    status: payment.status,
    remark: payment.remark,
    particular: payment.particular,
    reference: payment.reference,
    collectedByName: payment.collectedByName,
    transNo: payment.transNo,
    chqNo: payment.chqNo,
    exHead: payment.exHead,
    fatherName: payment.fatherName,
    classLabel: payment.classLabel,
    bounceCharge: payment.bounceCharge,
    reg: payment.reg,
    lineItems: payment.lineItems,
  };
}

async function fetchAllStudents(branchId) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("id, admission_no, full_name")
      .eq("branch_id", branchId)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function nameKey(name) {
  return String(name ?? "")
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function buildStudentIndexes(students) {
  const byAdm = new Map();
  const byName = new Map();

  for (const student of students) {
    const adm = baseAdmissionNo(student.admission_no);
    if (adm) byAdm.set(adm, student);

    const key = nameKey(student.full_name);
    if (!key) continue;
    const list = byName.get(key) ?? [];
    list.push(student);
    byName.set(key, list);
  }

  return { byAdm, byName };
}

function resolveStudent(txn, indexes) {
  const { byAdm, byName } = indexes;
  if (txn.adm && byAdm.has(txn.adm)) {
    return { student: byAdm.get(txn.adm), matchType: "admission" };
  }

  const key = nameKey(txn.studentName);
  if (!key) return { student: null, matchType: "not_found" };

  const candidates = byName.get(key) ?? [];
  if (candidates.length === 1) {
    return { student: candidates[0], matchType: "name" };
  }

  return { student: null, matchType: candidates.length > 1 ? "ambiguous" : "not_found" };
}

async function deleteSupersededPayments(branchId) {
  const payments = await loadBranchFeePayments(supabase, branchId);
  let deleted = 0;

  for (const payment of payments) {
    const ref = String(payment.reference ?? "");
    const id = String(payment.id ?? "");
    const shouldDelete =
      ref.startsWith(`discount-excel-${ACADEMIC_YEAR}-`) ||
      id.startsWith(`RCP-EXCEL-${ACADEMIC_YEAR}-`);

    if (!shouldDelete) continue;

    const title = paymentNoticeTitle(id);
    const { error } = await supabase.from("notices").delete().eq("branch_id", branchId).eq("title", title);
    if (error) throw new Error(error.message);
    deleted += 1;
  }

  return deleted;
}

function sortTransactions(a, b) {
  const recDiff = Number.parseInt(a.receiptNo, 10) - Number.parseInt(b.receiptNo, 10);
  if (recDiff !== 0) return recDiff;
  return String(a.date).localeCompare(String(b.date));
}

function parseClassLabel(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { class_name: "Unknown", section: "Main" };
  const dash = text.indexOf("-");
  if (dash === -1) return { class_name: text, section: "Main" };
  return {
    class_name: text.slice(0, dash).trim(),
    section: text.slice(dash + 1).trim() || "Main",
  };
}

async function findClassId(branchId, classLabel, academicYear) {
  const { class_name, section } = parseClassLabel(classLabel);
  const { data, error } = await supabase
    .from("classes")
    .select("id")
    .eq("branch_id", branchId)
    .eq("academic_year", academicYear)
    .eq("class_name", class_name)
    .eq("section", section)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function createStudentFromTxn(branchId, txn) {
  const classId = await findClassId(branchId, txn.classLabel, ACADEMIC_YEAR);
  if (!classId) {
    throw new Error(`Missing class ${txn.classLabel} for adm ${txn.adm} (${txn.studentName})`);
  }

  const { class_name, section } = parseClassLabel(txn.classLabel);
  const father = String(txn.fatherName ?? "").trim();

  const { data: inserted, error } = await supabase
    .from("students")
    .insert({
      branch_id: branchId,
      admission_no: txn.adm,
      full_name: txn.studentName,
      class_id: classId,
      parent_name: father || null,
      is_active: true,
    })
    .select("id, admission_no, full_name")
    .single();

  if (error) throw new Error(`Create student ${txn.adm} (${txn.studentName}): ${error.message}`);

  const enrollment = buildEnrollmentFromRow(
    {
      class_name,
      section,
      classLabel: txn.classLabel,
      father_name: father,
      parent_name: father,
    },
    classId
  );

  const profile = mergeStudentEnrollment(
    {
      fatherName: father,
      transportDetails: { facility: "NO", fees: Array(12).fill("0") },
    },
    ACADEMIC_YEAR,
    enrollment
  );

  await saveStudentProfileNotice(branchId, inserted.id, profile);
  return inserted;
}

function collectMissingStudentStubs(transactions, indexes) {
  const stubs = new Map();
  for (const txn of transactions) {
    if (!txn.adm || indexes.byAdm.has(txn.adm)) continue;
    if (!stubs.has(txn.adm)) stubs.set(txn.adm, txn);
  }
  return stubs;
}

async function relinkAbc8PaymentsAndProfiles(branchId, indexes) {
  const payments = (await loadBranchFeePayments(supabase, branchId)).filter((p) =>
    String(p.reference ?? "").startsWith("abc8-")
  );

  const byStudent = new Map();
  let paymentsUpdated = 0;

  for (const payment of payments) {
    const adm = baseAdmissionNo(payment.admissionNo);
    const student = indexes.byAdm.get(adm);
    if (!student) continue;

    let record = payment;
    if (payment.studentId !== student.id) {
      record = { ...payment, studentId: student.id, studentName: student.full_name };
      await saveFeePayment(supabase, branchId, record);
      paymentsUpdated += 1;
    }

    const list = byStudent.get(student.id) ?? [];
    list.push(record);
    byStudent.set(student.id, list);
  }

  let profilesUpdated = 0;
  for (const [studentId, studentPayments] of byStudent) {
    const profile = await loadStudentProfileNotice(branchId, studentId);
    const sorted = [...studentPayments].sort(sortTransactions);
    const feeTransactions = sorted.map(buildProfileTransaction);
    const feePaid = sorted
      .filter((p) => p.status === "Completed")
      .reduce((sum, p) => sum + parseAmount(p.amount), 0);

    await saveStudentProfileNotice(branchId, studentId, {
      ...profile,
      feeTransactions,
      feeDetails: {
        ...(profile.feeDetails ?? {}),
        feeTransactions,
        feePaid: String(feePaid),
      },
    });
    profilesUpdated += 1;
  }

  return { paymentsUpdated, profilesUpdated, studentsLinked: byStudent.size };
}

async function main() {
  const branchId = await resolveBranchId(supabase, "idpscherukupalli");
  const rawRows = readTransactionRows(filePath);
  const transactions = rawRows.map(normalizeTransaction);

  const students = await fetchAllStudents(branchId);
  const indexes = buildStudentIndexes(students);

  let studentsCreated = 0;
  const createdStudents = [];
  const createErrors = [];

  if (CREATE_MISSING) {
    const stubs = collectMissingStudentStubs(transactions, indexes);
    for (const [adm, txn] of stubs) {
      if (indexes.byAdm.has(adm)) continue;
      if (!APPLY) {
        studentsCreated += 1;
        createdStudents.push({ adm, name: txn.studentName, classLabel: txn.classLabel });
        continue;
      }
      try {
        const student = await createStudentFromTxn(branchId, txn);
        indexes.byAdm.set(adm, student);
        studentsCreated += 1;
        createdStudents.push({
          adm,
          name: student.full_name,
          classLabel: txn.classLabel,
          id: student.id,
        });
      } catch (err) {
        createErrors.push({
          adm,
          name: txn.studentName,
          classLabel: txn.classLabel,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const existingPayments = await loadBranchFeePayments(supabase, branchId);
  const existingRefs = new Set(existingPayments.map((p) => String(p.reference ?? "")));

  let paymentsCreated = 0;
  let paymentsSkipped = 0;
  let paymentsDateUpdated = 0;
  let cancelledCount = 0;
  let completedCount = 0;
  let completedTotal = 0;
  const notFound = [];
  const nameMatched = [];
  const ambiguous = [];
  const paymentsByStudent = new Map();

  for (const txn of transactions) {
    if (txn.status === "Cancelled") cancelledCount += 1;
    else {
      completedCount += 1;
      completedTotal += txn.total;
    }

    const resolved = resolveStudent(txn, indexes);
    const student = resolved.student;

    if (resolved.matchType === "name") {
      nameMatched.push({ recNo: txn.recNo, adm: txn.adm, name: txn.studentName });
    }
    if (resolved.matchType === "ambiguous") {
      ambiguous.push({ recNo: txn.recNo, adm: txn.adm, name: txn.studentName });
    }

    const payment = buildPaymentRecord(txn, student);
    const ref = payment.reference;

    if (!existingRefs.has(ref)) {
      if (APPLY) {
        await saveFeePayment(supabase, branchId, payment);
        existingRefs.add(ref);
      }
      paymentsCreated += 1;
    } else {
      if (APPLY) {
        const existing = existingPayments.find((p) => p.reference === ref);
        if (existing) {
          const updated = {
            ...existing,
            date: payment.date,
            dateDisplay: payment.dateDisplay,
            time: payment.time,
            createdAt: payment.createdAt,
          };
          await saveFeePayment(supabase, branchId, updated);
          paymentsDateUpdated += 1;
        }
      }
      paymentsSkipped += 1;
    }

    if (!student) {
      notFound.push(txn);
      continue;
    }

    const list = paymentsByStudent.get(student.id) ?? [];
    list.push(payment);
    paymentsByStudent.set(student.id, list);
  }

  let profilesUpdated = 0;
  let paymentsLinked = 0;
  if (APPLY) {
    if (!KEEP_OLD) {
      const deleted = await deleteSupersededPayments(branchId);
      console.log(`Removed superseded discount-excel payments: ${deleted}`);
    }

    const relink = await relinkAbc8PaymentsAndProfiles(branchId, indexes);
    profilesUpdated = relink.profilesUpdated;
    paymentsLinked = relink.paymentsUpdated;
    console.log(
      `Relinked ABC-8 payments: ${relink.paymentsUpdated} updated, ${relink.studentsLinked} students, ${relink.profilesUpdated} profiles`
    );
  }

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    file: filePath,
    academicYear: ACADEMIC_YEAR,
    excelTransactions: transactions.length,
    completedCount,
    cancelledCount,
    completedTotal,
    paymentsCreated,
    paymentsSkipped,
    paymentsDateUpdated,
    paymentsLinked,
    studentsCreated,
    createdStudents,
    createErrors,
    profilesUpdated,
    studentsWithTransactions: paymentsByStudent.size,
    matchedByNameOnly: nameMatched.length,
    ambiguousName: ambiguous.length,
    notFound: notFound.map((t) => ({
      rowNum: t.rowNum,
      recNo: t.recNo,
      adm: t.adm,
      name: t.studentName,
      total: t.total,
      status: t.status,
    })),
  };

  const reportPath = path.join(ROOT, "data/abc-8-transactions-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== ABC-8 TRANSACTIONS IMPORT ===");
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`File: ${filePath}`);
  console.log(`Transactions in Excel: ${transactions.length}`);
  console.log(`Completed: ${completedCount} (₹${completedTotal.toLocaleString("en-IN")})`);
  console.log(`Cancelled: ${cancelledCount}`);
  console.log(`Payments to create: ${paymentsCreated}`);
  console.log(`Payments already in DB: ${paymentsSkipped}`);
  console.log(`Payment dates refreshed: ${paymentsDateUpdated}`);
  console.log(`Payments linked to students: ${paymentsLinked}`);
  console.log(`Students created: ${studentsCreated}`);
  console.log(`Students with transactions: ${paymentsByStudent.size}`);
  console.log(`Matched by name only: ${nameMatched.length}`);
  console.log(`Ambiguous name: ${ambiguous.length}`);
  console.log(`Profiles updated: ${profilesUpdated}`);
  console.log(`Transactions without student match: ${notFound.length}`);
  console.log(`Report: ${reportPath}`);

  if (createErrors.length) {
    console.log("\nStudent create errors:");
    for (const row of createErrors) {
      console.log(`  Adm ${row.adm} | ${row.name} | ${row.error}`);
    }
  }

  if (createdStudents.length) {
    console.log("\nStudents created / pending:");
    for (const row of createdStudents.slice(0, 20)) {
      console.log(`  Adm ${row.adm} | ${row.name} | ${row.classLabel}`);
    }
  }

  if (notFound.length) {
    console.log("\nNot found (first 15):");
    for (const row of notFound.slice(0, 15)) {
      console.log(`  Rec ${row.recNo} | Adm ${row.adm} | ${row.studentName} | ₹${row.total}`);
    }
  }

  if (!APPLY) {
    console.log("\nRun with --apply to save receipts and student transaction history.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

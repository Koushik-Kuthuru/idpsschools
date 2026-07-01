#!/usr/bin/env node
/**
 * Import student fee discounts and paid fees from discount Excel (2026-27).
 * Matches by admission number, then by normalized student name.
 * For Fee Paid > 0: creates payment receipts in DB and feeTransactions on profile.
 *
 * Usage:
 *   node scripts/import-cherukupalli-discount-excel.mjs --dry-run --file "/path/discount_2026-2027.xlsx"
 *   node scripts/import-cherukupalli-discount-excel.mjs --apply --file "/path/discount_2026-2027.xlsx"
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
import { loadBranchFeePayments, saveFeePayment } from "./lib/fee-payments-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_FILE = path.join(ROOT, "data/discount_2026-2027.xlsx");
const ACADEMIC_YEAR = "2026-27";
const FEE_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
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

const DISCOUNT_COLUMNS = [
  { excel: "LAST YEAR DUE.1", head: "LAST YEAR DUE" },
  { excel: "ADMISSION FEE.1", head: "ADMISSION FEE" },
  { excel: "TUITION FEE.1", head: "TUITION FEE" },
  { excel: "HOSTEL FEE.1", head: "HOSTEL FEE" },
  { excel: "IIT FEE.1", head: "IIT FEE" },
  { excel: "OLYMPIAD FEE.1", head: "OLYMPIAD FEE" },
  { excel: "EXCURSION FEE.1", head: "EXCURSION FEE" },
  { excel: "CIRRICULAM FEE.1", head: "CURRICULUM FEE" },
  { excel: "FOOD FEE.1", head: "FOOD FEE" },
  { excel: "MISCELLANEOUS.1", head: "MISCELLANEOUS" },
  { excel: "LAUNDRY FEE.1", head: "LAUNDRY FEE" },
  { excel: "CO-SPARK FEE.1", head: "CO-SPARK FEE" },
  { excel: "Transport.2", head: "TRANSPORT FEE" },
];

function parseAmount(value) {
  const n = Number.parseInt(String(value ?? "0").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
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

function isSummaryRow(row) {
  const adm = String(row.adm ?? "").trim().toUpperCase();
  const name = String(row.name ?? "").trim().toUpperCase();
  return adm === "TOTAL" || name === "TOTAL";
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

function parseExcelDate(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 20000 && serial < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(serial));
    return epoch.toISOString().slice(0, 10);
  }

  const parts = text.split(/[\/\-\.]/).map((p) => p.trim());
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (c.length === 2) c = `20${c}`;
    if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

function monthFromDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "JUL";
  return FEE_MONTHS[d.getMonth()] ?? "JUL";
}

function paymentReference(adm) {
  return `discount-excel-${ACADEMIC_YEAR}-${adm}`;
}

function paymentId(adm) {
  return `RCP-EXCEL-${ACADEMIC_YEAR}-${adm}`;
}

function hasDiscountData(excelRow) {
  if (excelRow.totalDiscount > 0) return true;
  return DISCOUNT_COLUMNS.some((c) => parseAmount(excelRow.raw[c.excel]) > 0);
}

function hasFeeAmountData(excelRow) {
  return excelRow.feePayable > 0 || excelRow.feePaid > 0 || excelRow.balanceDue > 0;
}

function buildPaymentFromExcel(excelRow, student) {
  const adm = baseAdmissionNo(student.admission_no) || excelRow.adm;
  const date = parseExcelDate(excelRow.raw["D.O.A"]);
  const month = monthFromDate(date);
  const reference = paymentReference(adm);

  return {
    id: paymentId(adm),
    receiptNo: `EX-${adm}`,
    studentId: student.id,
    studentName: student.full_name,
    admissionNo: adm,
    amount: excelRow.feePaid,
    mode: "Cash",
    feeMonth: month,
    month,
    date,
    status: "Completed",
    remark: `Imported from discount Excel (${ACADEMIC_YEAR})`,
    collectedByName: "Excel Import",
    reference,
    particular: "FEE PAYMENT",
    createdAt: new Date().toISOString(),
  };
}

function buildProfileTransaction(payment) {
  return {
    id: payment.id,
    receiptNo: payment.receiptNo,
    date: payment.date,
    month: payment.month,
    amount: payment.amount,
    mode: payment.mode,
    status: payment.status,
    remark: payment.remark,
    particular: payment.particular,
    reference: payment.reference,
    collectedByName: payment.collectedByName,
  };
}

function applyFeeAmountsToProfile(profile, excelRow) {
  const feeDetails = {
    ...(profile.feeDetails ?? {}),
    grossFee: excelRow.grossFee > 0 ? String(excelRow.grossFee) : profile.feeDetails?.grossFee ?? "0",
    feePayable: String(excelRow.feePayable),
    feePaid: String(excelRow.feePaid),
    balanceDue: String(excelRow.balanceDue),
  };

  return {
    ...profile,
    grossFee: feeDetails.grossFee,
    feeDetails,
  };
}

function applyPaymentToProfile(profile, payment) {
  const tx = buildProfileTransaction(payment);
  const existing = Array.isArray(profile.feeDetails?.feeTransactions)
    ? profile.feeDetails.feeTransactions
    : Array.isArray(profile.feeTransactions)
      ? profile.feeTransactions
      : [];
  const filtered = existing.filter((row) => String(row.reference ?? row.id ?? "") !== payment.reference);
  const feeTransactions = [...filtered, tx];

  const feeDetails = {
    ...(profile.feeDetails ?? {}),
    feePaid: String(payment.amount),
    feeTransactions,
  };

  return {
    ...profile,
    feeTransactions,
    feeDetails,
  };
}

function readExcelRows(excelFile) {
  const workbook = XLSX.readFile(excelFile, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const table = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  return table
    .map((row, index) => ({
      rowNum: index + 2,
      adm: baseAdmissionNo(row["Adm No."]),
      name: String(row["Student Name"] ?? "").trim(),
      classLabel: String(row["Class"] ?? "").trim(),
      feeCategory: String(row["Fee Category"] ?? "GENERAL").trim().toUpperCase() || "GENERAL",
      feeStatus: String(row["Type"] ?? "NEW").trim().toUpperCase() || "NEW",
      discRemark: String(row["Disc. Remark"] ?? "").trim(),
      totalDiscount: parseAmount(row["Total Discount"]),
      grossFee: parseAmount(row["Total"]),
      feePayable: parseAmount(row["Fee Payable"]),
      feePaid: parseAmount(row["Fee Paid"]),
      balanceDue: parseAmount(row["Balance Due"]),
      raw: row,
    }))
    .filter((row) => row.adm || row.name)
    .filter((row) => !isSummaryRow(row));
}

function buildDiscountLog(excelRow, importedOn) {
  const entries = [];
  for (const { excel, head } of DISCOUNT_COLUMNS) {
    const amount = parseAmount(excelRow.raw[excel]);
    if (amount <= 0) continue;
    entries.push({
      date: importedOn,
      particular: head,
      amount: String(amount),
      remark: excelRow.discRemark || `Imported from discount Excel (${ACADEMIC_YEAR})`,
    });
  }
  return entries;
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

function resolveStudent(excelRow, indexes) {
  const { byAdm, byName } = indexes;

  if (excelRow.adm && byAdm.has(excelRow.adm)) {
    const student = byAdm.get(excelRow.adm);
    const nameMismatch = nameKey(student.full_name) !== nameKey(excelRow.name);
    return {
      student,
      matchType: nameMismatch ? "admission_name_diff" : "admission",
      nameMismatch,
    };
  }

  const key = nameKey(excelRow.name);
  if (!key) return { error: "no_name" };

  const candidates = byName.get(key) ?? [];
  if (candidates.length === 1) {
    return { student: candidates[0], matchType: "name" };
  }
  if (candidates.length > 1) {
    return { error: "ambiguous_name", candidates };
  }

  return { error: "not_found" };
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

async function createStudentFromExcelRow(branchId, excelRow) {
  const classId = await findClassId(branchId, excelRow.classLabel, ACADEMIC_YEAR);
  if (!classId) {
    throw new Error(`Missing class ${excelRow.classLabel} for ${ACADEMIC_YEAR}`);
  }

  const { class_name, section } = parseClassLabel(excelRow.classLabel);
  const father = String(excelRow.raw["Father's Name"] ?? "").trim();
  const usesTransport = String(excelRow.raw["Transport"] ?? "NO").trim().toUpperCase() === "YES";

  const { data: inserted, error } = await supabase
    .from("students")
    .insert({
      branch_id: branchId,
      admission_no: excelRow.adm,
      full_name: excelRow.name,
      class_id: classId,
      parent_name: father || null,
      is_active: true,
    })
    .select("id, admission_no, full_name")
    .single();

  if (error) throw new Error(`Create student ${excelRow.adm} (${excelRow.name}): ${error.message}`);

  const enrollment = buildEnrollmentFromRow(
    {
      class_name,
      section,
      classLabel: excelRow.classLabel,
      father_name: father,
      parent_name: father,
    },
    classId
  );

  let profile = mergeStudentEnrollment({}, ACADEMIC_YEAR, enrollment);
  profile = {
    ...profile,
    fatherName: father,
    transportDetails: {
      facility: usesTransport ? "YES" : "NO",
      fees: Array(12).fill("0"),
    },
  };

  await saveStudentProfileNotice(branchId, inserted.id, profile);
  return inserted;
}

function applyDiscountToProfile(profile, excelRow, importedOn) {
  const discountLog = buildDiscountLog(excelRow, importedOn);
  const totalFromHeads = discountLog.reduce((sum, row) => sum + parseAmount(row.amount), 0);
  const totalDiscount = excelRow.totalDiscount > 0 ? excelRow.totalDiscount : totalFromHeads;

  const feeDetails = {
    ...(profile.feeDetails ?? {}),
    feeCategory: excelRow.feeCategory,
    feeStatus: excelRow.feeStatus,
    discRemark: excelRow.discRemark,
    totalDiscount: String(totalDiscount),
    grossFee: excelRow.grossFee > 0 ? String(excelRow.grossFee) : profile.feeDetails?.grossFee ?? "0",
    discountLog,
    feePayable: String(excelRow.feePayable),
    feePaid: String(excelRow.feePaid),
    balanceDue: String(excelRow.balanceDue),
  };

  return {
    ...profile,
    feeCategory: excelRow.feeCategory,
    feeStatus: excelRow.feeStatus,
    discRemark: excelRow.discRemark,
    totalDiscount: String(totalDiscount),
    grossFee: feeDetails.grossFee,
    discountLog,
    feeDetails,
  };
}

async function main() {
  const branchId = await resolveBranchId(supabase, "idpscherukupalli");
  const excelRows = readExcelRows(filePath);
  const students = await fetchAllStudents(branchId);
  const indexes = buildStudentIndexes(students);
  const importedOn = new Date().toISOString().slice(0, 10);
  const existingPayments = await loadBranchFeePayments(supabase, branchId);
  const existingPaymentRefs = new Set(
    existingPayments.map((p) => String(p.reference ?? "")).filter(Boolean)
  );

  let updated = 0;
  let unchanged = 0;
  let skippedNoData = 0;
  let created = 0;
  let paymentsCreated = 0;
  let paymentsSkipped = 0;
  let paymentsUpdatedProfileOnly = 0;
  const notFound = [];
  const ambiguous = [];
  const nameWarnings = [];
  const nameMatched = [];
  const createdStudents = [];
  const paymentSamples = [];

  for (const excelRow of excelRows) {
    const hasDiscount = hasDiscountData(excelRow);
    const hasPayment = excelRow.feePaid > 0;
    const hasFeeAmounts = hasFeeAmountData(excelRow);

    if (!hasDiscount && !hasPayment && !hasFeeAmounts) {
      skippedNoData += 1;
      continue;
    }

    let resolved = resolveStudent(excelRow, indexes);
    if (resolved.error === "not_found") {
      if (CREATE_MISSING && APPLY) {
        const newStudent = await createStudentFromExcelRow(branchId, excelRow);
        indexes.byAdm.set(excelRow.adm, newStudent);
        indexes.byName.set(nameKey(newStudent.full_name), [newStudent]);
        created += 1;
        createdStudents.push({
          adm: excelRow.adm,
          name: excelRow.name,
          classLabel: excelRow.classLabel,
        });
        resolved = { student: newStudent, matchType: "created" };
      } else {
        notFound.push(excelRow);
        continue;
      }
    }
    if (resolved.error === "ambiguous_name") {
      ambiguous.push({
        excel: excelRow,
        candidates: resolved.candidates.map((s) => ({
          adm: baseAdmissionNo(s.admission_no),
          name: s.full_name,
        })),
      });
      continue;
    }

    const { student, matchType, nameMismatch } = resolved;
    if (matchType === "name") {
      nameMatched.push({
        excelAdm: excelRow.adm,
        excelName: excelRow.name,
        dbAdm: baseAdmissionNo(student.admission_no),
        dbName: student.full_name,
      });
    }
    if (nameMismatch) {
      nameWarnings.push({
        adm: excelRow.adm,
        excelName: excelRow.name,
        dbName: student.full_name,
      });
    }

    const adm = baseAdmissionNo(student.admission_no) || excelRow.adm;
    const ref = paymentReference(adm);
    const paymentAlreadyStored = existingPaymentRefs.has(ref);

    let profile = await loadStudentProfileNotice(branchId, student.id);
    let nextProfile = profile;
    let changed = false;

    if (hasDiscount) {
      nextProfile = applyDiscountToProfile(nextProfile, excelRow, importedOn);
      changed = true;
    } else if (hasFeeAmounts) {
      nextProfile = applyFeeAmountsToProfile(nextProfile, excelRow);
      changed = true;
    }

    if (hasPayment) {
      const payment = buildPaymentFromExcel(excelRow, student);
      const profileHasTx = (nextProfile.feeDetails?.feeTransactions ?? []).some(
        (row) => String(row.reference ?? "") === ref
      );

      if (!profileHasTx) {
        nextProfile = applyPaymentToProfile(nextProfile, payment);
        changed = true;
      }

      if (!paymentAlreadyStored) {
        if (APPLY) {
          await saveFeePayment(supabase, branchId, payment);
          existingPaymentRefs.add(ref);
        }
        paymentsCreated += 1;
        if (paymentSamples.length < 5) {
          paymentSamples.push({
            adm,
            name: student.full_name,
            amount: payment.amount,
            receiptNo: payment.receiptNo,
            date: payment.date,
          });
        }
      } else {
        paymentsSkipped += 1;
        if (!profileHasTx) paymentsUpdatedProfileOnly += 1;
      }
    }

    if (!changed) {
      unchanged += 1;
      continue;
    }

    if (APPLY) {
      await saveStudentProfileNotice(branchId, student.id, nextProfile);
    }
    updated += 1;
  }

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    createMissing: CREATE_MISSING,
    file: filePath,
    excelRows: excelRows.length,
    created,
    updated,
    unchanged,
    skippedNoData,
    paymentsCreated,
    paymentsSkipped,
    paymentsUpdatedProfileOnly,
    notFound: notFound.map((r) => ({
      rowNum: r.rowNum,
      adm: r.adm,
      name: r.name,
      classLabel: r.classLabel,
      totalDiscount: r.totalDiscount,
      feePaid: r.feePaid,
    })),
    ambiguous,
    matchedByNameOnly: nameMatched,
    admissionWithDifferentName: nameWarnings,
    createdStudents,
    paymentSamples,
  };

  const reportPath = path.join(ROOT, "data/discount-excel-import-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== DISCOUNT & FEE PAYMENT EXCEL IMPORT ===");
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`File: ${filePath}`);
  console.log(`Excel students: ${excelRows.length}`);
  console.log(`Created missing students: ${created}`);
  console.log(`Profiles updated: ${updated}`);
  console.log(`Already correct: ${unchanged}`);
  console.log(`Skipped (no discount/payment data): ${skippedNoData}`);
  console.log(`Payment receipts created: ${paymentsCreated}`);
  console.log(`Payment receipts already in DB: ${paymentsSkipped}`);
  console.log(`Profile transactions backfilled: ${paymentsUpdatedProfileOnly}`);
  console.log(`Not found: ${notFound.length}`);
  console.log(`Ambiguous name match: ${ambiguous.length}`);
  console.log(`Matched by name only: ${nameMatched.length}`);
  console.log(`Admission match, different name order/spelling: ${nameWarnings.length}`);
  console.log(`Report: ${reportPath}`);

  if (paymentSamples.length) {
    console.log("\nSample receipts:");
    for (const row of paymentSamples) {
      console.log(`  Adm ${row.adm} | ${row.name} | ₹${row.amount} | ${row.receiptNo} | ${row.date}`);
    }
  }

  if (notFound.length) {
    console.log("\nNot found in DB:");
    for (const row of notFound.slice(0, 20)) {
      console.log(`  Row ${row.rowNum} | Adm ${row.adm} | ${row.name} | discount ₹${row.totalDiscount}`);
    }
  }

  if (nameMatched.length) {
    console.log("\nMatched by name (admission differed):");
    for (const row of nameMatched.slice(0, 10)) {
      console.log(`  Excel Adm ${row.excelAdm} (${row.excelName}) -> DB Adm ${row.dbAdm} (${row.dbName})`);
    }
  }

  if (!APPLY) {
    console.log("\nRun with --apply to save discounts, payments, and receipts to the database.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

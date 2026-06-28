#!/usr/bin/env node
/** Backfill extended student enrollments from Excel (no duplicate student rows). */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const PRESET_IMPORTS = [
  { year: "2022-23", file: "data/student Details (36).xlsx" },
  { year: "2023-24", file: "data/student Details (37).xlsx" },
  { year: "2024-25", file: "data/student Details (38).xlsx" },
  { year: "2025-26", file: "data/student Details (39).xlsx" },
  { year: "2026-27", file: "data/student Details (40).xlsx" },
];

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const {
  readExcelRows,
  findStudentByAdmissionNo,
  buildEnrollmentFromRow,
  saveStudentProfileNotice,
  loadStudentProfileNotice,
  mergeStudentEnrollment,
  ensureClasses,
} = await import("./import-cherukupalli-students.mjs");

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

async function backfillYear(branchId, academicYear, excelPath) {
  const absolutePath = path.isAbsolute(excelPath) ? excelPath : path.join(ROOT, excelPath);
  const rows = readExcelRows(absolutePath);
  const classMap = await ensureClasses(branchId, academicYear, rows);

  let synced = 0;
  for (const row of rows) {
    const classKey = `${row.class_name}|||${row.section}`;
    const classId = classMap.get(classKey);
    if (!classId) continue;

    const existing = await findStudentByAdmissionNo(branchId, row.admission_no_raw);
    if (!existing?.id) continue;

    const enrollment = buildEnrollmentFromRow(row, classId);
    const profile = await loadStudentProfileNotice(branchId, existing.id);
    const merged = mergeStudentEnrollment(profile, academicYear, enrollment);
    await saveStudentProfileNotice(branchId, existing.id, merged);
    synced += 1;
  }

  console.log(`${academicYear}: synced ${synced} enrollments`);
  return synced;
}

async function main() {
  const branchId = await getBranchId();
  let total = 0;
  for (const job of PRESET_IMPORTS) {
    total += await backfillYear(branchId, job.year, job.file);
  }
  console.log(`\nDone. Synced ${total} enrollments total.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

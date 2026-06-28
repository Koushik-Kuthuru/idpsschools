#!/usr/bin/env node
/**
 * Import full student master data from abc-2.xlsx (114 columns) into Supabase.
 * Upserts students for a given academic year with complete profile fields.
 *
 * Usage (from repo root):
 *   npm run import:abc-students-2026-27
 *   node scripts/import-abc-students.mjs --year 2026-27 --file "data/abc-2.xlsx"
 *   node scripts/import-abc-students.mjs --year 2026-27 --file "data/abc-2.xlsx" --dry-run
 *
 * From apps/web:
 *   npm run import:abc-students-2026-27
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  baseAdmissionNo,
  buildEnrollmentFromRow,
  ensureClasses,
  mergeStudentEnrollment,
  saveStudentProfileNotice,
} from "./import-cherukupalli-students.mjs";
import {
  buildAbcProfileFields,
  mapAbcTransport,
  readAbcExcelRows,
} from "./lib/read-abc-excel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROFILE_PREFIX = "__student_profile__:";

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) return null;
  return args[idx + 1];
}

const academicYear = readArg("--year") ?? "2026-27";
const excelPath = (() => {
  const file = readArg("--file") ?? "data/abc-2.xlsx";
  return path.isAbsolute(file) ? file : path.join(ROOT, file);
})();

const { createClient } = await import("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

async function fetchAllRows(table, select, filters = []) {
  const rows = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + 999);
    for (const [op, col, val] of filters) {
      if (op === "eq") query = query.eq(col, val);
      if (op === "like") query = query.like(col, val);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

function mergeProfile(merged, incoming, transportMode) {
  const enrollments = { ...(merged.enrollments ?? {}) };
  const next = { ...merged, ...incoming, enrollments };
  if (merged.photos) next.photos = merged.photos;
  next.transportDetails = mapAbcTransport(transportMode, merged.transportDetails ?? {});
  return next;
}

async function syncAbcStudents(branchId, rows, classMap, importSource) {
  const [allStudents, notices] = await Promise.all([
    fetchAllRows("students", "id, admission_no", [["eq", "branch_id", branchId]]),
    fetchAllRows("notices", "title, content", [
      ["eq", "branch_id", branchId],
      ["like", "title", `${PROFILE_PREFIX}%`],
    ]),
  ]);

  const studentIdsByAdm = new Map();
  for (const student of allStudents) {
    const base = baseAdmissionNo(student.admission_no);
    if (!studentIdsByAdm.has(base)) studentIdsByAdm.set(base, []);
    studentIdsByAdm.get(base).push({ id: student.id, admission_no: String(student.admission_no) });
  }

  const profiles = new Map();
  for (const notice of notices) {
    const id = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      profiles.set(id, JSON.parse(String(notice.content)));
    } catch {
      profiles.set(id, {});
    }
  }

  function resolveStudentId(baseAdm) {
    const matches = studentIdsByAdm.get(baseAdm) ?? [];
    if (!matches.length) return null;
    const plain = matches.find((m) => !m.admission_no.includes("#"));
    return plain?.id ?? matches[0].id;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (const row of rows) {
    const classKey = `${row.class_name}|||${row.section}`;
    const classId = classMap.get(classKey);
    if (!classId) {
      errors.push({ row: row.rowNum, adm: row.admission_no_raw, error: `Missing class ${row.classLabel}` });
      skipped += 1;
      continue;
    }

    const baseAdm = row.admission_no_raw;
    const enrollment = buildEnrollmentFromRow({ ...row, classId }, classId);
    const profileFields = buildAbcProfileFields(row, importSource);

    const payload = {
      branch_id: branchId,
      full_name: row.full_name,
      dob: row.dob,
      gender: row.gender,
      class_id: classId,
      parent_name: row.parent_name,
      parent_phone: row.parent_phone,
      address: row.address,
      is_active: true,
    };

    let studentId = resolveStudentId(baseAdm);

    try {
      if (studentId) {
        if (!DRY_RUN) {
          const { error } = await supabase.from("students").update(payload).eq("id", studentId);
          if (error) throw new Error(error.message);
        }
        updated += 1;
      } else if (!DRY_RUN) {
        const { data: inserted, error } = await supabase
          .from("students")
          .insert({ ...payload, admission_no: baseAdm })
          .select("id")
          .single();

        if (error?.code === "23505") {
          studentId = resolveStudentId(baseAdm);
          if (!studentId) throw new Error(error.message);
          await supabase.from("students").update(payload).eq("id", studentId);
          updated += 1;
        } else if (error) {
          throw new Error(error.message);
        } else {
          studentId = inserted.id;
          studentIdsByAdm.set(baseAdm, [{ id: studentId, admission_no: baseAdm }]);
          created += 1;
        }
      } else {
        created += 1;
      }

      if (!DRY_RUN && studentId) {
        const existing = profiles.get(studentId) ?? {};
        let merged = mergeStudentEnrollment(existing, academicYear, enrollment);
        merged = mergeProfile(merged, profileFields, row.modeOfTransport);
        await saveStudentProfileNotice(branchId, studentId, merged);
        profiles.set(studentId, merged);
      }
    } catch (err) {
      errors.push({
        row: row.rowNum,
        adm: row.admission_no_raw,
        name: row.full_name,
        error: err instanceof Error ? err.message : String(err),
      });
      skipped += 1;
    }
  }

  return { total: rows.length, created, updated, skipped, errors };
}

async function updateClassCounts(branchId, academicYearName) {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id")
    .eq("branch_id", branchId)
    .eq("academic_year", academicYearName);
  if (error) throw new Error(error.message);

  const notices = await fetchAllRows("notices", "title, content", [
    ["eq", "branch_id", branchId],
    ["like", "title", `${PROFILE_PREFIX}%`],
  ]);
  const profiles = new Map();
  for (const notice of notices) {
    const id = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      profiles.set(id, JSON.parse(String(notice.content)));
    } catch {
      profiles.set(id, {});
    }
  }

  const students = await fetchAllRows("students", "id", [["eq", "branch_id", branchId]]);

  for (const cls of classes ?? []) {
    let count = 0;
    for (const student of students) {
      const profile = profiles.get(student.id) ?? {};
      if (profile.enrollments?.[academicYearName]?.classId === cls.id) count += 1;
    }
    if (!DRY_RUN) {
      await supabase.from("classes").update({ total_students: count }).eq("id", cls.id);
    }
  }
}

async function main() {
  const branchId = await getBranchId();
  console.log(`Branch: idpscherukupalli (${branchId})`);
  console.log(`Academic year: ${academicYear}`);
  console.log(`Reading: ${excelPath}`);
  if (DRY_RUN) console.log("DRY RUN — no database writes\n");

  const rows = readAbcExcelRows(excelPath);
  console.log(`Parsed ${rows.length} student rows (${rows[0]?.rawByHeader ? Object.keys(rows[0].rawByHeader).length : 0} columns)`);

  const classMap = await ensureClasses(branchId, academicYear, rows);
  console.log(`Classes ready: ${classMap.size}`);

  const importSource = path.basename(excelPath);
  const result = await syncAbcStudents(branchId, rows, classMap, importSource);
  await updateClassCounts(branchId, academicYear);

  const { count: branchTotal } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", branchId);

  console.log("\n=== IMPORT SUMMARY ===");
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "APPLY"}`);
  console.log(`Rows in Excel: ${result.total}`);
  console.log(`Created: ${result.created}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Skipped / errors: ${result.skipped}`);
  console.log(`Branch student records: ${branchTotal ?? "?"}`);

  if (result.errors.length) {
    console.log("\n--- Errors (first 20) ---");
    for (const item of result.errors.slice(0, 20)) {
      console.log(`  Row ${item.row} | Adm ${item.adm} | ${item.name ?? ""} | ${item.error}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

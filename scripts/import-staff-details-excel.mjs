#!/usr/bin/env node
/**
 * Import / update Cherukupalli staff from Staff Details.xlsx (merge mode).
 * Adds missing staff and syncs full Excel profile fields for all rows.
 *
 * Usage:
 *   node scripts/import-staff-details-excel.mjs
 *   node scripts/import-staff-details-excel.mjs --file "data/Staff Details.xlsx" --year 2026-27
 *   node scripts/import-staff-details-excel.mjs --dry-run
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  baseEmployeeId,
  dedupeStaffRowsByName,
  readStaffExcelRowsFull,
  resolveStaffUsername,
  upsertStaffMember,
  findStaffByEmployeeId,
} from "./import-cherukupalli-staff.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });
dotenv.config({ path: path.join(ROOT, ".env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const file = args.includes("--file")
  ? args[args.indexOf("--file") + 1]
  : path.join(ROOT, "data/Staff Details.xlsx");
const academicYear = args.includes("--year")
  ? args[args.indexOf("--year") + 1]
  : "2026-27";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normName(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

async function findStaffByName(branchId, name) {
  const target = normName(name);
  for (const table of ["teachers", "non_teaching_staff"]) {
    const { data, error } = await supabase.from(table).select("id, employee_id, full_name").eq("branch_id", branchId);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (normName(row.full_name) === target) {
        return { id: row.id, table, employeeId: baseEmployeeId(row.employee_id) };
      }
    }
  }
  return null;
}

async function main() {
  if (DRY_RUN) console.log("DRY RUN — no database writes\n");

  const branchId = await getBranchId();
  console.log(`Branch: Cherukupalli (${branchId})`);
  console.log(`File: ${file}`);
  console.log(`Academic year: ${academicYear}`);

  const rawRows = readStaffExcelRowsFull(file);
  const rows = dedupeStaffRowsByName(rawRows);
  console.log(`Parsed ${rawRows.length} rows → ${rows.length} unique staff by name`);

  const usedIds = new Set();
  let created = 0;
  let updated = 0;
  let teaching = 0;
  let nonTeaching = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let employeeId = resolveStaffUsername(row, i);
    if (usedIds.has(employeeId)) {
      employeeId = `${employeeId}_${i + 1}`;
    }

    const byId = await findStaffByEmployeeId(branchId, employeeId);
    const byName = byId ? null : await findStaffByName(branchId, row.name);
    const existing = byId ?? byName;
    if (existing?.employeeId) employeeId = existing.employeeId;

    if (usedIds.has(employeeId)) {
      employeeId = `${employeeId}_${i + 1}`;
    }
    usedIds.add(employeeId);

    row.username = resolveStaffUsername(row, i);

    if (DRY_RUN) {
      console.log(`${existing ? "UPDATE" : "CREATE"}: ${row.name} (${employeeId})`);
      continue;
    }

    const result = await upsertStaffMember(branchId, academicYear, row, employeeId);
    if (result.created) created++;
    else updated++;
    if (result.teachingStaff) teaching++;
    else nonTeaching++;
  }

  const [{ count: teacherCount }, { count: nonTeachingCount }] = await Promise.all([
    supabase.from("teachers").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase.from("non_teaching_staff").select("id", { count: "exact", head: true }).eq("branch_id", branchId),
  ]);

  console.log(`\nDone. ${created} created, ${updated} updated (${teaching} teaching, ${nonTeaching} non-teaching this run).`);
  console.log(`DB totals: ${teacherCount ?? 0} teaching + ${nonTeachingCount ?? 0} non-teaching = ${(teacherCount ?? 0) + (nonTeachingCount ?? 0)} staff`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

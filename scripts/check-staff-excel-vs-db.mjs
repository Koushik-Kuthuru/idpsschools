#!/usr/bin/env node
/**
 * Compare Staff Details.xlsx rows against Supabase staff (Cherukupalli).
 *
 * Usage:
 *   node scripts/check-staff-excel-vs-db.mjs
 *   node scripts/check-staff-excel-vs-db.mjs --file "data/Staff Details.xlsx"
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  baseEmployeeId,
  slugEmployeeId,
} from "./import-cherukupalli-staff.mjs";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });
dotenv.config({ path: path.join(ROOT, ".env.local") });

const file =
  process.argv.includes("--file")
    ? process.argv[process.argv.indexOf("--file") + 1]
    : path.join(ROOT, "data/Staff Details.xlsx");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function readExcelStaffForAudit(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const header = rows[0] ?? [];
  const parsed = [];

  for (let idx = 0; idx < rows.slice(1).length; idx++) {
    const row = rows[idx + 1];
    const byHeader = {};
    header.forEach((h, i) => {
      if (h) byHeader[String(h).trim()] = row[i];
    });

    const name = String(byHeader.Name ?? "").trim();
    const username = String(byHeader.Username ?? "").trim();
    const empCode = byHeader["Emp Code"];
    const empCodeText =
      empCode == null || empCode === "" || Number(empCode) === 0
        ? ""
        : String(empCode).trim().replace(/\.0$/, "");

    if (!name && !username) continue;

    parsed.push({
      rowNum: idx + 2,
      name: name || `(no name / user=${username})`,
      department: String(byHeader.Department ?? "").trim() || "OTHER",
      designation: String(byHeader.Designation ?? "").trim() || "Staff",
      username,
      empCode: empCodeText,
    });
  }

  // Deduplicate by name only (Excel has bad repeated usernames like "saireddy").
  const byName = new Map();
  for (const row of parsed) {
    const key = normName(row.name);
    if (!byName.has(key)) byName.set(key, row);
  }
  return { allRows: parsed, uniqueByName: [...byName.values()] };
}

function normName(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function normUser(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

const PROFILE_PREFIX = "__staff_profile__:";

function resolveYearProfile(profile, yearName) {
  const years = profile?.years;
  if (years && typeof years === "object" && years[yearName]) return years[yearName];
  return profile;
}

async function loadDbStaff(branchId, academicYear = "2026-27") {
  const tables = ["teachers", "non_teaching_staff"];
  const all = [];

  const { data: noticeRows, error: noticeError } = await supabase
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${PROFILE_PREFIX}%`);

  if (noticeError) throw new Error(`notices: ${noticeError.message}`);

  const profileByStaffId = new Map();
  for (const notice of noticeRows ?? []) {
    const staffId = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      const parsed = JSON.parse(String(notice.content));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        profileByStaffId.set(staffId, parsed);
      }
    } catch {
      // ignore
    }
  }

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").eq("branch_id", branchId);

    if (error) throw new Error(`${table}: ${error.message}`);

    for (const row of data ?? []) {
      const profile = profileByStaffId.get(row.id) ?? {};
      const yearProfile = resolveYearProfile(profile, academicYear);
      all.push({
        ...row,
        table,
        department: yearProfile.department ?? profile.department ?? "",
        designation: yearProfile.designation ?? profile.designation ?? "",
        username: profile.username ?? baseEmployeeId(row.employee_id),
      });
    }
  }

  return all;
}

function indexDbStaff(rows) {
  const byEmployeeId = new Map();
  const byName = new Map();
  const byUsername = new Map();

  for (const row of rows) {
    const baseId = baseEmployeeId(row.employee_id);
    const name = normName(row.full_name);
    const user = normUser(baseId);
    const profileUser = normUser(row.username);

    if (baseId) byEmployeeId.set(user, row);
    if (profileUser) byEmployeeId.set(profileUser, row);
    if (name) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(row);
    }
    if (user) {
      if (!byUsername.has(user)) byUsername.set(user, []);
      byUsername.get(user).push(row);
    }
  }

  return { byEmployeeId, byName, byUsername };
}

function matchExcelRow(row, index, dbIndex) {
  const nameHits = dbIndex.byName.get(normName(row.name)) ?? [];
  if (nameHits.length === 1) return { row: nameHits[0], via: "name" };
  if (nameHits.length > 1) return { row: nameHits[0], via: "name-ambiguous", ambiguous: nameHits };

  const slug = slugEmployeeId(row.username, row.name, index);
  const keys = [
    row.empCode ? normUser(row.empCode) : "",
    normUser(row.username),
    normUser(slug),
  ].filter((key) => key && key !== "saireddy");

  for (const key of keys) {
    const hit = dbIndex.byEmployeeId.get(key);
    if (hit) return { row: hit, via: `employee_id:${key}` };
  }

  for (const key of keys) {
    const hits = dbIndex.byUsername.get(key);
    if (hits?.length === 1) return { row: hits[0], via: `username:${key}` };
  }

  return null;
}

async function main() {
  console.log(`Excel file: ${file}`);
  const { allRows, uniqueByName } = readExcelStaffForAudit(file);
  const excelRows = uniqueByName;
  const branchId = await getBranchId();
  const academicYear = process.argv.includes("--year")
    ? process.argv[process.argv.indexOf("--year") + 1]
    : "2026-27";
  const dbRows = await loadDbStaff(branchId, academicYear);
  const dbIndex = indexDbStaff(dbRows);

  const matched = [];
  const missing = [];
  const ambiguous = [];

  excelRows.forEach((row, index) => {
    const hit = matchExcelRow(row, index, dbIndex);
    if (!hit) {
      missing.push(row);
      return;
    }
    if (hit.ambiguous) {
      ambiguous.push({ excel: row, db: hit.ambiguous });
    }
    matched.push({ excel: row, db: hit.row, via: hit.via });
  });

  const matchedDbIds = new Set(matched.map((m) => m.db.id));
  const extraInDb = dbRows.filter((r) => !matchedDbIds.has(r.id));

  console.log("\n=== Summary (Cherukupalli) ===");
  console.log(`Academic year profile: ${academicYear}`);
  console.log(`Excel rows (incl. no-name): ${allRows.length}`);
  console.log(`Excel unique by name: ${excelRows.length}`);
  console.log(`DB staff total: ${dbRows.length} (${dbRows.filter((r) => r.table === "teachers").length} teaching, ${dbRows.filter((r) => r.table === "non_teaching_staff").length} non-teaching)`);
  console.log(`Matched in DB: ${matched.length}`);
  console.log(`Missing from DB: ${missing.length}`);
  console.log(`Ambiguous name matches: ${ambiguous.length}`);
  console.log(`Extra in DB (not in Excel): ${extraInDb.length}`);

  if (missing.length) {
    console.log("\n--- Missing from DB ---");
    for (const row of missing) {
      console.log(
        `  row ${row.rowNum}: ${row.name} | ${row.department} / ${row.designation} | user=${row.username || slugEmployeeId(row.username, row.name, 0)}`
      );
    }
  }

  if (ambiguous.length) {
    console.log("\n--- Ambiguous matches (review manually) ---");
    for (const item of ambiguous.slice(0, 10)) {
      console.log(`  ${item.excel.name}: ${item.db.length} DB records`);
    }
  }

  if (extraInDb.length) {
    console.log("\n--- In DB but not in Excel (first 30) ---");
    for (const row of extraInDb.slice(0, 30)) {
      console.log(
        `  ${row.full_name} | ${row.department ?? "-"} / ${row.designation ?? "-"} | id=${row.employee_id} | ${row.table}`
      );
    }
    if (extraInDb.length > 30) console.log(`  ... and ${extraInDb.length - 30} more`);
  }

  const mismatches = matched.filter((m) => {
    const dept = normName(m.excel.department);
    const dbDept = normName(m.db.department);
    const desig = normName(m.excel.designation);
    const dbDesig = normName(m.db.designation);
    return (dept && dbDept && dept !== dbDept) || (desig && dbDesig && desig !== dbDesig);
  });

  if (mismatches.length) {
    console.log(`\n--- Department/designation mismatches: ${mismatches.length} (first 15) ---`);
    for (const m of mismatches.slice(0, 15)) {
      console.log(
        `  ${m.excel.name}: Excel ${m.excel.department}/${m.excel.designation} vs DB ${m.db.department}/${m.db.designation}`
      );
    }
  }

  process.exit(missing.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

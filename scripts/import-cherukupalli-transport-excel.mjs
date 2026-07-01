#!/usr/bin/env node
/**
 * Import transport assignments from Student_with_transport.xlsx.
 * Compares Excel vs DB and optionally applies transportDetails.
 *
 * Usage:
 *   node scripts/import-cherukupalli-transport-excel.mjs --dry-run
 *   node scripts/import-cherukupalli-transport-excel.mjs --apply
 *   node scripts/import-cherukupalli-transport-excel.mjs --apply --clear-extra
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolveBranchId } from "./lib/resolve-branch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROFILE_PREFIX = "__student_profile__:";
const DEFAULT_FILE = path.join(ROOT, "data/Student_with_transport.xlsx");

import {
  buildQuarterlyTransportFeeValues,
  transportSlabFromStop,
} from "./lib/transport-fee-values.mjs";

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CLEAR_EXTRA = args.includes("--clear-extra");

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

function baseAdmissionNo(value) {
  const text = String(value ?? "").trim();
  const hash = text.indexOf("#");
  return hash === -1 ? text : text.slice(0, hash);
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function readExcelRows(excelFile) {
  const workbook = XLSX.readFile(excelFile, { cellDates: false });
  const sheetName = workbook.SheetNames.find((name) => /transport/i.test(name)) ?? workbook.SheetNames[0];
  const table = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

  return table.map((row, index) => ({
    sr: row.SR ?? index + 1,
    busNo: String(row["Bus No."] ?? "").trim(),
    admissionNo: baseAdmissionNo(row["Adm No."]),
    name: String(row["Student Name"] ?? "").trim(),
    fatherName: String(row["Father Name"] ?? "").trim(),
    classLabel: String(row.Class ?? "").trim(),
    address: String(row.Address ?? "").trim(),
    route: String(row.Route ?? "").trim(),
    stop: String(row.Stop ?? "").trim(),
    pick: String(row.Pick ?? "").trim(),
    drop: String(row.Drop ?? "").trim(),
    mobile: String(row.Mobile ?? "").trim(),
  }));
}

function buildTransportDetails(excelRow, existing = {}) {
  return {
    facility: "YES",
    busNo: excelRow.busNo || existing.busNo || "",
    route: excelRow.route || existing.route || "",
    stoppage: excelRow.stop || existing.stoppage || "",
    address: excelRow.address || existing.address || "",
    driverName: existing.driverName ?? "",
    driverMobile: existing.driverMobile ?? "",
    arrTime: excelRow.pick || existing.arrTime || "",
    depTime: excelRow.drop || existing.depTime || "",
    fees: buildQuarterlyTransportFeeValues(excelRow.stop),
  };
}

async function fetchAllStudents(branchId) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("id, admission_no, full_name, parent_phone, address, is_active")
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

async function loadProfiles(branchId) {
  const map = new Map();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("notices")
      .select("title, content")
      .eq("branch_id", branchId)
      .like("title", `${PROFILE_PREFIX}%`)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const id = String(row.title).slice(PROFILE_PREFIX.length);
      try {
        map.set(id, JSON.parse(String(row.content ?? "{}")));
      } catch {
        map.set(id, {});
      }
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return map;
}

async function saveProfile(branchId, studentId, profile) {
  const title = `${PROFILE_PREFIX}${studentId}`;
  const content = JSON.stringify(profile);
  const { data: existing } = await supabase
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

async function main() {
  const branchId = await resolveBranchId(supabase, "idpscherukupalli");
  const excelRows = readExcelRows(filePath);
  const [students, profiles] = await Promise.all([fetchAllStudents(branchId), loadProfiles(branchId)]);

  const byAdmission = new Map();
  for (const row of students) {
    const adm = baseAdmissionNo(row.admission_no);
    if (!byAdmission.has(adm)) byAdmission.set(adm, row);
  }

  const excelAdmSet = new Set(excelRows.map((row) => row.admissionNo).filter(Boolean));
  const slabCounts = { below: 0, above: 0, other: 0 };
  for (const row of excelRows) {
    const stop = normalizeText(row.stop);
    if (stop.includes("BELOW")) slabCounts.below += 1;
    else if (stop.includes("ABOVE")) slabCounts.above += 1;
    else slabCounts.other += 1;
  }

  const missingInDb = [];
  const needsTransport = [];
  const alreadyCorrect = [];
  const updated = [];
  const cleared = [];

  for (const excelRow of excelRows) {
    const dbRow = byAdmission.get(excelRow.admissionNo);
    if (!dbRow) {
      missingInDb.push(excelRow);
      continue;
    }

    const profile = profiles.get(dbRow.id) ?? {};
    const existing = profile.transportDetails ?? {};
    const next = buildTransportDetails(excelRow, existing);

    const unchanged =
      String(existing.facility ?? "").toUpperCase() === "YES" &&
      normalizeText(existing.route ?? "") === normalizeText(next.route) &&
      normalizeText(existing.busNo ?? "") === normalizeText(next.busNo) &&
      normalizeText(existing.stoppage ?? "") === normalizeText(next.stoppage);

    if (unchanged) {
      alreadyCorrect.push(excelRow.admissionNo);
    } else {
      needsTransport.push({
        admissionNo: excelRow.admissionNo,
        name: dbRow.full_name,
        route: excelRow.route,
        stop: excelRow.stop,
        busNo: excelRow.busNo,
      });
      if (APPLY) {
        await saveProfile(branchId, dbRow.id, { ...profile, transportDetails: next });
        updated.push(excelRow.admissionNo);
      }
    }
  }

  const dbOnlyTransport = [];
  if (CLEAR_EXTRA || !APPLY) {
    for (const row of students) {
      const adm = baseAdmissionNo(row.admission_no);
      const profile = profiles.get(row.id) ?? {};
      const td = profile.transportDetails ?? {};
      if (String(td.facility ?? "").toUpperCase() === "YES" && !excelAdmSet.has(adm)) {
        dbOnlyTransport.push({
          admissionNo: adm,
          name: row.full_name,
          route: td.route ?? "",
          busNo: td.busNo ?? "",
        });
        if (APPLY && CLEAR_EXTRA) {
          await saveProfile(branchId, row.id, {
            ...profile,
            transportDetails: { ...td, facility: "NO" },
          });
          cleared.push(adm);
        }
      }
    }
  }

  console.log("\n=== TRANSPORT EXCEL vs DB ===");
  console.log(`File: ${filePath}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}${CLEAR_EXTRA ? " + clear-extra" : ""}`);
  console.log(`Excel rows: ${excelRows.length}`);
  console.log(`Slabs: below 7km=${slabCounts.below}, above 7km=${slabCounts.above}, other=${slabCounts.other}`);
  console.log(`DB students: ${students.length}`);
  console.log(`Missing in DB (Excel only): ${missingInDb.length}`);
  console.log(`Need transport update: ${needsTransport.length}`);
  console.log(`Already correct: ${alreadyCorrect.length}`);
  console.log(`DB transport but NOT in Excel: ${dbOnlyTransport.length}`);
  if (APPLY) {
    console.log(`Updated from Excel: ${updated.length}`);
    if (CLEAR_EXTRA) console.log(`Cleared stale transport flags: ${cleared.length}`);
  }

  if (missingInDb.length) {
    console.log("\n--- Missing in DB ---");
    for (const row of missingInDb) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.stop}`);
    }
  }

  if (needsTransport.length) {
    console.log("\n--- Need transport update (first 30) ---");
    for (const row of needsTransport.slice(0, 30)) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.stop} | ${row.busNo}`);
    }
  }

  if (dbOnlyTransport.length) {
    console.log("\n--- In DB with transport but NOT in Excel (first 30) ---");
    for (const row of dbOnlyTransport.slice(0, 30)) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.busNo}`);
    }
    if (!APPLY || !CLEAR_EXTRA) {
      console.log("\nRun with --apply --clear-extra to turn off transport for students absent from Excel.");
    }
  }

  const reportPath = path.join(ROOT, "data/transport-excel-import-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        filePath,
        mode: APPLY ? (CLEAR_EXTRA ? "apply+clear-extra" : "apply") : "dry-run",
        slabCounts,
        totals: {
          excelRows: excelRows.length,
          missingInDb: missingInDb.length,
          needsTransport: needsTransport.length,
          alreadyCorrect: alreadyCorrect.length,
          dbOnlyTransport: dbOnlyTransport.length,
          updated: updated.length,
          cleared: cleared.length,
        },
        missingInDb,
        needsTransport,
        dbOnlyTransport,
      },
      null,
      2
    )
  );
  console.log(`\nReport: ${reportPath}`);

  if (!APPLY) {
    console.log("\nRun with --apply to write transportDetails from Excel.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

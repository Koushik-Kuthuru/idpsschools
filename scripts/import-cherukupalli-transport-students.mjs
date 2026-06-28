#!/usr/bin/env node
/**
 * Import route-wise transport student assignments from official PDF into student profiles.
 * Compares PDF data with DB and reports mismatches.
 *
 * Usage:
 *   node scripts/import-cherukupalli-transport-students.mjs --dry-run
 *   node scripts/import-cherukupalli-transport-students.mjs --apply
 *   node scripts/import-cherukupalli-transport-students.mjs --apply --file "data/route-wise students data 2026-2027.pdf"
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBranchId } from "./lib/resolve-branch.mjs";
import {
  buildEnrollmentFromRow,
  ensureClasses,
  mergeStudentEnrollment,
  saveStudentProfileNotice,
} from "./import-cherukupalli-students.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROFILE_PREFIX = "__student_profile__:";
const ACADEMIC_YEAR = "2026-27";
const DEFAULT_PDF = path.join(ROOT, "data/route-wise students data 2026-2027.pdf");

const FLEET_BY_ROUTE = {
  R1: "AP39TT3162",
  R2: "AP39TT3163",
  R3: "AP39TT3164",
  R4: "AP39TT3165",
  R5: "AP39TT3166",
  R6: "AP39UA7757",
  R7: "AP39AU7759",
  R8: "AP39UD1316",
  R9: "AP39UD0926",
  R10: "AP39UF3916",
  R11: "AP39UF3917",
  R12: "AP39UF1205",
  R13: "AP39UF3914",
  R14: "AP39UF3915",
  R15: "AP39UF0939",
  R16: "AP39UF0941",
  R17: "AP39UF0940",
  R18: "AP39UF2282",
  R19: "AP39UF4612",
  R20: "AP39UH9004",
};

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const pdfPath = (() => {
  const idx = args.indexOf("--file");
  return idx >= 0 && args[idx + 1] ? path.resolve(args[idx + 1]) : DEFAULT_PDF;
})();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error("PDF not found:", pdfPath);
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
    .replace(/\(CO-\s*SPARK\)/gi, "(CO-SPARK)")
    .toUpperCase();
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function parseClassLabel(raw) {
  const text = normalizeText(raw).replace(/^GRADE\s+/, "");
  const dash = text.indexOf(" - ");
  if (dash === -1) return { className: text, section: "MAIN" };
  return {
    className: text.slice(0, dash).trim(),
    section: text.slice(dash + 3).trim(),
  };
}

function romanToInt(value) {
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  return map[String(value ?? "").trim().toUpperCase()] ?? null;
}

function classesMatch(pdfClass, dbClassName, dbSection) {
  const pdf = parseClassLabel(pdfClass);
  const dbClass = normalizeText(dbClassName);
  const dbSec = normalizeText(dbSection);

  const gradeMatch =
    pdf.className === dbClass ||
    String(romanToInt(pdf.className) ?? "") === dbClass ||
    pdf.className === String(romanToInt(dbClass) ?? "");

  // PDF often omits section (e.g. "II" vs "II - KANGAROOS"); grade-only match is enough.
  if (pdf.section === "MAIN" || !pdf.section) {
    return gradeMatch;
  }

  const sectionMatch =
    pdf.section === dbSec ||
    pdf.section.replace(/[^A-Z0-9]/g, "") === dbSec.replace(/[^A-Z0-9]/g, "");

  return gradeMatch && sectionMatch;
}

function namesSimilar(a, b) {
  const left = normalizeText(a).replace(/[^A-Z0-9 ]/g, "");
  const right = normalizeText(b).replace(/[^A-Z0-9 ]/g, "");
  if (!left || !right) return true;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const lt = new Set(left.split(" ").filter(Boolean));
  const rt = new Set(right.split(" ").filter(Boolean));
  let overlap = 0;
  for (const token of lt) {
    if (token.length > 2 && rt.has(token)) overlap += 1;
  }
  return overlap >= Math.min(lt.size, rt.size, 2);
}

async function fetchAllStudents(branchId) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("id, admission_no, full_name, parent_name, parent_phone, address, is_active")
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

function extractPdfStudents(pdfFile, admissionNumbers) {
  const tmp = path.join(os.tmpdir(), `idps-adms-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(admissionNumbers));
  try {
    const output = execFileSync(
      "python3",
      [path.join(__dirname, "lib/extract-route-wise-pdf.py"), pdfFile, tmp],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
    );
    return JSON.parse(output);
  } finally {
    fs.unlinkSync(tmp);
  }
}

function parseClassLabelFromPdf(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { class_name: "Unknown", section: "Main", classLabel: text };
  const dash = text.indexOf(" - ");
  if (dash === -1) {
    const alt = text.indexOf("-");
    if (alt === -1) return { class_name: text, section: "Main", classLabel: text };
    return {
      class_name: text.slice(0, alt).trim(),
      section: text.slice(alt + 1).trim() || "Main",
      classLabel: text,
    };
  }
  return {
    class_name: text.slice(0, dash).trim(),
    section: text.slice(dash + 3).trim() || "Main",
    classLabel: text,
  };
}

function cleanFatherName(raw) {
  const text = normalizeText(raw).replace(/[^A-Z0-9 /]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const match = text.match(/([A-Z]{2,}(?:\s+[A-Z]{2,}){0,3})$/);
  return match ? match[1].trim() : text;
}

function pdfRowToImportRow(pdfRow) {
  const { class_name, section, classLabel } = parseClassLabelFromPdf(pdfRow.classLabel);
  const fatherName = cleanFatherName(pdfRow.fatherName);
  const phone = String(pdfRow.contactNo ?? pdfRow.phones?.[0] ?? "").trim() || null;
  return {
    rowNum: pdfRow.admissionNo,
    admission_no_raw: String(pdfRow.admissionNo),
    full_name: String(pdfRow.name ?? "").trim(),
    dob: null,
    gender: null,
    address: String(pdfRow.address ?? "").trim() || null,
    parent_name: fatherName || null,
    father_name: fatherName,
    mother_name: "",
    aadhar_no: null,
    father_phone: phone,
    mother_phone: null,
    username: null,
    password: null,
    parent_phone: phone,
    classLabel,
    class_name,
    section,
  };
}

async function createStudentFromPdf(branchId, pdfRow, classMap) {
  const importRow = pdfRowToImportRow(pdfRow);
  const classKey = `${importRow.class_name}|||${importRow.section}`;
  const classId = classMap.get(classKey);
  if (!classId) {
    throw new Error(`Missing class for adm ${importRow.admission_no_raw}: ${importRow.classLabel}`);
  }

  const payload = {
    branch_id: branchId,
    full_name: importRow.full_name,
    dob: null,
    gender: null,
    class_id: classId,
    parent_name: importRow.parent_name,
    parent_phone: importRow.parent_phone,
    address: importRow.address,
    is_active: true,
  };

  const { data: inserted, error } = await supabase
    .from("students")
    .insert({ ...payload, admission_no: importRow.admission_no_raw })
    .select("id, admission_no, full_name, parent_name, parent_phone, address, is_active")
    .single();

  if (error) {
    throw new Error(`Create student ${importRow.admission_no_raw} (${importRow.full_name}): ${error.message}`);
  }

  const enrollment = buildEnrollmentFromRow(importRow, classId);
  const profile = mergeStudentEnrollment({}, ACADEMIC_YEAR, enrollment);
  await saveStudentProfileNotice(branchId, inserted.id, profile);

  return { dbRow: inserted, profile };
}

function buildTransportDetails(pdfRow, existing = {}) {
  const busNo = FLEET_BY_ROUTE[pdfRow.route] ?? "";
  return {
    facility: "YES",
    busNo,
    route: pdfRow.route,
    stoppage: existing.stoppage ?? pdfRow.address ?? "",
    driverName: pdfRow.driverName ?? "",
    driverMobile: pdfRow.driverMobile ?? "",
    arrTime: existing.arrTime ?? "",
    depTime: existing.depTime ?? "",
    fees: Array.isArray(existing.fees) ? existing.fees : Array(12).fill("0"),
  };
}

function resolveYearEnrollment(profile) {
  return profile?.enrollments?.[ACADEMIC_YEAR] ?? null;
}

async function main() {
  const branchId = await resolveBranchId(supabase, "idpscherukupalli");
  const [students, profiles] = await Promise.all([
    fetchAllStudents(branchId),
    loadProfiles(branchId),
  ]);

  const byAdmission = new Map();
  for (const row of students) {
    const adm = baseAdmissionNo(row.admission_no);
    if (!byAdmission.has(adm)) byAdmission.set(adm, row);
  }

  console.log(`Branch students in DB: ${students.length}`);
  console.log(`Extracting PDF: ${pdfPath}`);

  const extracted = extractPdfStudents(pdfPath, [...byAdmission.keys()]);
  const pdfStudents = extracted.students ?? [];
  const pdfRoutes = extracted.routes ?? [];

  console.log(`PDF routes: ${pdfRoutes.length}`);
  console.log(`PDF transport students parsed: ${pdfStudents.length}`);

  const mismatches = [];
  const missingInDb = [];
  const duplicateAdmInPdf = [];
  const updated = [];
  const createdStudents = [];
  const alreadyCorrect = [];
  const seenAdm = new Map();

  const missingPdfRows = pdfStudents.filter((row) => !byAdmission.get(String(row.admissionNo)));
  let classMap = new Map();
  if (APPLY && missingPdfRows.length) {
    const importRows = missingPdfRows.map(pdfRowToImportRow);
    classMap = await ensureClasses(branchId, ACADEMIC_YEAR, importRows);
    console.log(`Creating ${missingPdfRows.length} student(s) missing from DB...`);
  }

  for (const pdfRow of pdfStudents) {
    const adm = String(pdfRow.admissionNo);
    if (seenAdm.has(adm)) {
      duplicateAdmInPdf.push({ adm, firstRoute: seenAdm.get(adm), secondRoute: pdfRow.route });
      continue;
    }
    seenAdm.set(adm, pdfRow.route);

    let dbRow = byAdmission.get(adm);
    if (!dbRow) {
      if (!APPLY) {
        missingInDb.push({
          admissionNo: adm,
          name: pdfRow.name,
          route: pdfRow.route,
          classLabel: pdfRow.classLabel,
        });
        continue;
      }

      const created = await createStudentFromPdf(branchId, pdfRow, classMap);
      dbRow = created.dbRow;
      byAdmission.set(adm, dbRow);
      students.push(dbRow);
      profiles.set(dbRow.id, created.profile);
      createdStudents.push({
        admissionNo: adm,
        name: dbRow.full_name,
        route: pdfRow.route,
        classLabel: pdfRow.classLabel,
      });
    }

    const profile = profiles.get(dbRow.id) ?? {};
    const enrollment = resolveYearEnrollment(profile);
    const dbClassName = enrollment?.className ?? "";
    const dbSection = enrollment?.section ?? "";
    const dbName = dbRow.full_name ?? "";
    const dbFather = profile.fatherName ?? dbRow.parent_name ?? "";
    const dbPhone = normalizePhone(dbRow.parent_phone ?? profile.fatherMobile1 ?? "");
    const pdfPhone = normalizePhone(pdfRow.contactNo ?? pdfRow.phones?.[0] ?? "");
    const busNo = FLEET_BY_ROUTE[pdfRow.route] ?? "";

    const issues = [];
    if (!namesSimilar(pdfRow.name, dbName)) {
      issues.push({ field: "name", pdf: pdfRow.name, db: dbName });
    }
    if (pdfRow.fatherName && dbFather && !namesSimilar(pdfRow.fatherName, dbFather)) {
      issues.push({ field: "fatherName", pdf: pdfRow.fatherName, db: dbFather });
    }
    if (pdfRow.classLabel && enrollment && !classesMatch(pdfRow.classLabel, dbClassName, dbSection)) {
      issues.push({
        field: "class",
        pdf: pdfRow.classLabel,
        db: `${dbClassName} - ${dbSection}`,
      });
    }
    if (pdfPhone && dbPhone && pdfPhone !== dbPhone) {
      issues.push({ field: "contact", pdf: pdfPhone, db: dbPhone });
    }

    const existing = profile.transportDetails ?? {};
    if (existing.route && normalizeText(existing.route) !== normalizeText(pdfRow.route)) {
      issues.push({ field: "existingRoute", pdf: pdfRow.route, db: existing.route });
    }

    if (issues.length) {
      mismatches.push({
        admissionNo: adm,
        name: dbName || pdfRow.name,
        route: pdfRow.route,
        issues,
      });
    }

    const nextTransport = buildTransportDetails(pdfRow, existing);

    const unchanged =
      existing.facility === "YES" &&
      normalizeText(existing.route ?? "") === normalizeText(pdfRow.route) &&
      normalizeText(existing.busNo ?? "") === normalizeText(busNo) &&
      normalizeText(existing.driverName ?? "") === normalizeText(pdfRow.driverName ?? "") &&
      normalizeText(existing.driverMobile ?? "") === normalizeText(pdfRow.driverMobile ?? "");

    if (unchanged) {
      alreadyCorrect.push(adm);
    } else if (APPLY) {
      await saveProfile(branchId, dbRow.id, {
        ...profile,
        transportDetails: nextTransport,
      });
      updated.push({ admissionNo: adm, name: dbName, route: pdfRow.route, busNo });
    }
  }

  const pdfAdmSet = new Set(pdfStudents.map((row) => String(row.admissionNo)));
  const dbUsingTransport = [];
  for (const row of students) {
    const profile = profiles.get(row.id) ?? {};
    const td = profile.transportDetails;
    if (td && String(td.facility ?? "").toUpperCase() === "YES") {
      const adm = baseAdmissionNo(row.admission_no);
      if (!pdfAdmSet.has(adm)) {
        dbUsingTransport.push({
          admissionNo: adm,
          name: row.full_name,
          route: td.route ?? "",
          busNo: td.busNo ?? "",
        });
      }
    }
  }

  console.log("\n=== IMPORT SUMMARY ===");
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`PDF students parsed: ${pdfStudents.length}`);
  console.log(`Would update / updated: ${APPLY ? updated.length : pdfStudents.length - missingInDb.length - duplicateAdmInPdf.length - alreadyCorrect.length}`);
  console.log(`Created in DB (from PDF): ${createdStudents.length}`);
  console.log(`Already correct in DB: ${alreadyCorrect.length}`);
  console.log(`Missing in DB (PDF only): ${missingInDb.length}`);
  console.log(`Duplicate admission in PDF: ${duplicateAdmInPdf.length}`);
  console.log(`Field mismatches (PDF vs DB): ${mismatches.length}`);
  console.log(`In DB using transport but NOT in PDF: ${dbUsingTransport.length}`);

  if (createdStudents.length) {
    console.log("\n--- Created in DB (from PDF) ---");
    for (const row of createdStudents) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.classLabel}`);
    }
  }

  if (missingInDb.length) {
    console.log("\n--- Missing in DB (first 30) ---");
    for (const row of missingInDb.slice(0, 30)) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.classLabel}`);
    }
  }

  if (mismatches.length) {
    console.log("\n--- Field mismatches (first 40) ---");
    for (const row of mismatches.slice(0, 40)) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | Route ${row.route}`);
      for (const issue of row.issues) {
        console.log(`    - ${issue.field}: PDF="${issue.pdf}" DB="${issue.db}"`);
      }
    }
  }

  if (dbUsingTransport.length) {
    console.log("\n--- In DB with transport but absent from PDF (first 30) ---");
    for (const row of dbUsingTransport.slice(0, 30)) {
      console.log(`  Adm ${row.admissionNo} | ${row.name} | ${row.route} | ${row.busNo}`);
    }
  }

  const reportPath = path.join(ROOT, "data/route-wise-transport-import-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        academicYear: ACADEMIC_YEAR,
        pdfPath,
        mode: APPLY ? "apply" : "dry-run",
        totals: {
          pdfStudents: pdfStudents.length,
          pdfRoutes: pdfRoutes.length,
          updated: updated.length,
          createdStudents: createdStudents.length,
          alreadyCorrect: alreadyCorrect.length,
          missingInDb: missingInDb.length,
          mismatches: mismatches.length,
          dbOnlyTransport: dbUsingTransport.length,
          duplicateAdmInPdf: duplicateAdmInPdf.length,
        },
        pdfRoutes,
        missingInDb,
        createdStudents,
        mismatches,
        dbUsingTransport,
        duplicateAdmInPdf,
        updated,
      },
      null,
      2
    )
  );
  console.log(`\nFull report written to: ${reportPath}`);

  if (!APPLY) {
    console.log("\nRun with --apply to write transportDetails to student profiles.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Import Cherukupalli staff from Excel into Supabase (teachers / non_teaching_staff).
 * One DB record per person; year-specific details stored in profile.years[academicYear].
 *
 * Usage:
 *   node scripts/import-cherukupalli-staff.mjs --year 2022-23 --file "data/Staff Details (1).xlsx"
 *   node scripts/import-cherukupalli-staff.mjs --all
 *   node scripts/import-cherukupalli-staff.mjs --all --dedupe-only
 */

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BATCH_SIZE = 50;
const PROFILE_PREFIX = "__staff_profile__:";

const PRESET_IMPORTS = [
  { year: "2022-23", file: "data/Staff Details (1).xlsx" },
  { year: "2023-24", file: "data/Staff Details (2).xlsx" },
  { year: "2024-25", file: "data/Staff Details (3).xlsx" },
  { year: "2025-26", file: "data/Staff Details (4).xlsx" },
  { year: "2026-27", file: "data/Staff Details (5).xlsx" },
];

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const IMPORT_ALL = args.includes("--all");
const DEDUPE_ONLY = args.includes("--dedupe-only");

function readArg(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) return null;
  return args[idx + 1];
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseDob(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function parseDate(value) {
  return parseDob(value);
}

function cleanPhone(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim().replace(/\.0$/, "");
  return s || null;
}

function cleanText(value) {
  const s = String(value ?? "").trim();
  if (!s || s === "-") return "";
  return s;
}

function normalizeGender(value) {
  const s = cleanText(value).toLowerCase();
  if (!s) return null;
  if (s === "m" || s === "male" || s === "boy") return "male";
  if (s === "f" || s === "female" || s === "girl") return "female";
  return null;
}

export function slugEmployeeId(username, name, index) {
  const base = cleanText(username).toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (base) return base;
  const fromName = cleanText(name).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return fromName || `staff_${index + 1}`;
}

export function baseEmployeeId(employeeId) {
  const id = String(employeeId ?? "").trim();
  const hash = id.indexOf("#");
  return hash === -1 ? id : id.slice(0, hash);
}

function isTeachingDepartment(dept) {
  return String(dept ?? "").trim().toUpperCase() === "TEACHING";
}

function mergeList(existing, incoming) {
  const parts = [...String(existing ?? "").split(/[,;\n]+/), ...String(incoming ?? "").split(/[,;\n]+/)]
    .map((p) => p.trim())
    .filter(Boolean);
  return [...new Set(parts)].join(", ");
}

function cleanSubjects(value) {
  return mergeList("", value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export function readStaffExcelRows(filePath) {
  return readStaffExcelRowsFull(filePath).map(stripRowToLegacyShape);
}

function stripRowToLegacyShape(row) {
  return {
    rowNum: row.rowNum,
    name: row.name,
    department: row.department,
    designation: row.designation,
    mobile: row.mobile,
    dob: row.dob,
    username: row.username,
    password: row.password,
    joinDate: row.joinDate,
    classTeacher: row.classTeacher,
    classes: row.classes,
    subjects: row.subjects,
  };
}

function cleanNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(/\.0$/, ""));
  return Number.isFinite(n) ? n : null;
}

export function resolveStaffUsername(row, index) {
  const raw = cleanText(row.username).toLowerCase();
  const nameSlug = slugEmployeeId("", row.name, index);
  if (raw === "saireddy" && String(row.name || "").trim().toUpperCase() !== "AKASH SATVAYA") {
    return nameSlug;
  }
  if (raw && raw !== "saireddy") return raw.replace(/[^a-z0-9._-]/g, "");
  if (row.empCode) return String(row.empCode).trim().toLowerCase();
  return nameSlug;
}

export function buildExtendedProfileFromRow(row) {
  const extended = {
    empCode: row.empCode || undefined,
    fatherName: row.fatherName || undefined,
    motherName: row.motherName || undefined,
    maritalStatus: row.maritalStatus || undefined,
    fatherOccupation: row.fatherOccupation || undefined,
    motherOccupation: row.motherOccupation || undefined,
    spouseName: row.spouseName || undefined,
    spouseContact: row.spouseContact || undefined,
    childrenCount: row.childrenCount ?? undefined,
    permanentAddress: row.permanentAddress || undefined,
    correspondenceAddress: row.correspondenceAddress || undefined,
    aadharNo: row.aadharNo || undefined,
    panNo: row.panNo || undefined,
    qualification: row.qualification || undefined,
    confirmationDate: row.confirmationDate || undefined,
    trainedStatus: row.trainedStatus || undefined,
    availingTransport: row.availingTransport || undefined,
    busNo: row.busNo || undefined,
    route: row.route || undefined,
    stop: row.stop || undefined,
    spouseOrganisation: row.spouseOrganisation || undefined,
    lockerNo: row.lockerNo || undefined,
    lockerKey: row.lockerKey || undefined,
    schoolWing: row.schoolWing || undefined,
    previousSchool: row.previousSchool || undefined,
    bloodGroup: row.bloodGroup || undefined,
    computerKnowledge: row.computerKnowledge || undefined,
    experienceMonths: row.experienceMonths ?? undefined,
    relatives: row.relatives || undefined,
    probationMonths: row.probationMonths ?? undefined,
    employmentStatus: row.employmentStatus || undefined,
    remarks: row.remarks || undefined,
    resigningDate: row.resigningDate || undefined,
    noticePeriodDays: row.noticePeriodDays ?? undefined,
    emergencyPerson: row.emergencyPerson || undefined,
    emergencyContact: row.emergencyContact || undefined,
    gender: row.gender || undefined,
  };

  Object.keys(extended).forEach((key) => {
    if (extended[key] === undefined || extended[key] === "") delete extended[key];
  });

  return extended;
}

export function dedupeStaffRowsByName(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.name || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { ...row });
      continue;
    }
    const existing = map.get(key);
    existing.classes = mergeList(existing.classes, row.classes);
    existing.subjects = cleanSubjects(mergeList(existing.subjects, row.subjects));
    existing.classTeacher = mergeList(existing.classTeacher, row.classTeacher);
    if (!existing.mobile && row.mobile) existing.mobile = row.mobile;
    if (!existing.dob && row.dob) existing.dob = row.dob;
    if (!existing.password && row.password) existing.password = row.password;
    if (!existing.joinDate && row.joinDate) existing.joinDate = row.joinDate;
    if (!existing.email && row.email) existing.email = row.email;
    if (!existing.username || existing.username === "saireddy") existing.username = row.username;
    if (existing.department === "OTHER" && row.department !== "OTHER") existing.department = row.department;
    if (existing.designation === "Staff" && row.designation !== "Staff") existing.designation = row.designation;
    Object.assign(existing, buildExtendedProfileFromRow({ ...existing, ...row }));
  }
  return [...map.values()];
}

export function readStaffExcelRowsFull(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);

  const parsed = [];
  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    const byHeader = {};
    header.forEach((h, i) => {
      if (h) byHeader[String(h).trim()] = row[i];
    });

    const name = cleanText(byHeader["Name"] ?? row[2]);
    if (!name) continue;

    const empCodeRaw = byHeader["Emp Code"];
    const empCode =
      empCodeRaw == null || empCodeRaw === "" || Number(empCodeRaw) === 0
        ? ""
        : String(empCodeRaw).trim().replace(/\.0$/, "");

    const parsedRow = {
      rowNum: idx + 2,
      name,
      department: cleanText(byHeader["Department"] ?? row[3]) || "OTHER",
      designation: cleanText(byHeader["Designation"] ?? row[4]) || "Staff",
      mobile: cleanPhone(byHeader["Mobile"] ?? row[5]),
      dob: parseDob(byHeader["DOB"] ?? row[6]),
      username: cleanText(byHeader["Username"] ?? row[7]),
      password: cleanText(byHeader["Password"] ?? row[8]),
      joinDate: parseDate(byHeader["Date of Appointment"] ?? row[9]),
      classTeacher: cleanText(byHeader["Class Teacher"] ?? row[10]),
      classes: cleanText(byHeader["Classes"] ?? row[11]),
      subjects: cleanText(byHeader["Subjects"] ?? row[12]),
      empCode,
      email: cleanText(byHeader["Email ID"]),
      fatherName: cleanText(byHeader["Father's Name"]),
      motherName: cleanText(byHeader["Mother's Name"]),
      maritalStatus: cleanText(byHeader["Marital Status"]),
      fatherOccupation: cleanText(byHeader["Father Occupation"]),
      motherOccupation: cleanText(byHeader["Mother Occupation"]),
      spouseName: cleanText(byHeader["Spouse Name"]),
      spouseContact: cleanPhone(byHeader["Spouse Contact No."]),
      childrenCount: cleanNumber(byHeader["No. of children"]),
      permanentAddress: cleanText(byHeader["Permanent Address"]),
      correspondenceAddress: cleanText(byHeader["Correspondence Address"]),
      aadharNo: cleanText(byHeader["Aadhar No."]),
      panNo: cleanText(byHeader["PAN No."]),
      qualification: cleanText(byHeader["Qualification"]),
      confirmationDate: parseDate(byHeader["Date of Confirmation"]),
      trainedStatus: cleanText(byHeader["Trained/Untrained"]),
      availingTransport: cleanText(byHeader["Availing School Transport"]),
      busNo: cleanText(byHeader["Bus No."]),
      route: cleanText(byHeader["Route"]),
      stop: cleanText(byHeader["Stop"]),
      spouseOrganisation: cleanText(byHeader["spouse organisation name"]),
      lockerNo: cleanText(byHeader["Locker No."]),
      lockerKey: cleanText(byHeader["Locker Key"]),
      schoolWing: cleanText(byHeader["School Wing"]),
      previousSchool: cleanText(byHeader["Previous School"]),
      bloodGroup: cleanText(byHeader["Blood Group"]),
      computerKnowledge: cleanText(byHeader["Computer Knowledge"]),
      experienceMonths: cleanNumber(byHeader["Experience (Months)"]),
      relatives: cleanText(byHeader["Relatives"]),
      probationMonths: cleanNumber(byHeader["Probation Period (Months)"]),
      employmentStatus: cleanText(byHeader["Employment Status"]),
      remarks: cleanText(byHeader["Remarks"]),
      resigningDate: parseDate(byHeader["Date of Resigning"]),
      noticePeriodDays: cleanNumber(byHeader["Notice Period (Days)"]),
      emergencyPerson: cleanText(byHeader["Emergency Person"]),
      emergencyContact: cleanPhone(byHeader["Emergency Contact"]),
      gender: cleanText(byHeader["Gender"]),
    };

    parsed.push(parsedRow);
  }

  return parsed;
}

export function dedupeStaffRows(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = (row.username || row.name).toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row });
      continue;
    }

    existing.classes = mergeList(existing.classes, row.classes);
    existing.subjects = cleanSubjects(mergeList(existing.subjects, row.subjects));
    existing.classTeacher = mergeList(existing.classTeacher, row.classTeacher);
    if (!existing.mobile && row.mobile) existing.mobile = row.mobile;
    if (!existing.dob && row.dob) existing.dob = row.dob;
    if (!existing.password && row.password) existing.password = row.password;
    if (!existing.joinDate && row.joinDate) existing.joinDate = row.joinDate;
    if (existing.department === "OTHER" && row.department !== "OTHER") {
      existing.department = row.department;
    }
    if (existing.designation === "Staff" && row.designation !== "Staff") {
      existing.designation = row.designation;
    }
  }

  return [...map.values()];
}

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

async function loadStaffProfileNotice(branchId, staffId) {
  const { data } = await supabase
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${PROFILE_PREFIX}${staffId}`)
    .maybeSingle();

  if (!data?.content) return {};
  try {
    const parsed = JSON.parse(String(data.content));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function saveStaffProfileNotice(branchId, staffId, profile) {
  const title = `${PROFILE_PREFIX}${staffId}`;
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

function buildYearProfile(row) {
  return {
    department: row.department,
    designation: row.designation,
    portalPassword: row.password || row.username || undefined,
    password: row.password || undefined,
    classes: row.classes || "",
    subjects: cleanSubjects(row.subjects) || "",
    classTeacher: row.classTeacher || "",
  };
}

function mergeStaffProfileYear(existing, academicYear, yearData, username) {
  const profile = { ...existing, years: { ...(existing.years ?? {}) } };

  if (profile.academicYear && !profile.years[profile.academicYear]) {
    profile.years[profile.academicYear] = {
      department: profile.department,
      designation: profile.designation,
      classes: profile.classes,
      subjects: profile.subjects,
      classTeacher: profile.classTeacher,
      portalPassword: profile.portalPassword,
      password: profile.password,
    };
  }

  delete profile.academicYear;
  delete profile.department;
  delete profile.designation;
  delete profile.classes;
  delete profile.subjects;
  delete profile.classTeacher;
  delete profile.portalPassword;
  delete profile.password;

  profile.years[academicYear] = yearData;
  if (username) profile.username = username;

  return profile;
}

function clearStaffProfileYear(profile, academicYear) {
  if (!profile.years?.[academicYear]) {
    if (profile.academicYear === academicYear) {
      const next = { ...profile };
      delete next.academicYear;
      delete next.department;
      delete next.designation;
      delete next.classes;
      delete next.subjects;
      delete next.classTeacher;
      delete next.portalPassword;
      delete next.password;
      return next;
    }
    return profile;
  }

  const years = { ...profile.years };
  delete years[academicYear];
  return { ...profile, years };
}

function yearFromScopedEmployeeId(employeeId) {
  const id = String(employeeId ?? "");
  const hash = id.indexOf("#");
  if (hash === -1) return null;
  return id.slice(hash + 1);
}

async function deleteStaffRow(branchId, table, staffId) {
  await supabase.from("notices").delete().eq("branch_id", branchId).eq("title", `${PROFILE_PREFIX}${staffId}`);
  await supabase.from(table).delete().eq("id", staffId);
}

/** Merge duplicate rows (e.g. abinaya + abinaya#2024-25) into one canonical record per person. */
export async function dedupeBranchStaff(branchId) {
  let merged = 0;
  let removed = 0;

  for (const table of ["teachers", "non_teaching_staff"]) {
    const { data, error } = await supabase.from(table).select("*").eq("branch_id", branchId);
    if (error) throw new Error(`Failed to list ${table}: ${error.message}`);

    const groups = new Map();
    for (const row of data ?? []) {
      const base = baseEmployeeId(row.employee_id);
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base).push(row);
    }

    for (const [baseId, rows] of groups) {
      if (rows.length <= 1) {
        const only = rows[0];
        if (only.employee_id !== baseId && !DRY_RUN) {
          await supabase.from(table).update({ employee_id: baseId }).eq("id", only.id);
        }
        continue;
      }

      rows.sort((a, b) => {
        const aPlain = !String(a.employee_id).includes("#");
        const bPlain = !String(b.employee_id).includes("#");
        if (aPlain !== bPlain) return aPlain ? -1 : 1;
        return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
      });

      const canonical = rows[0];
      let profile = await loadStaffProfileNotice(branchId, canonical.id);

      for (const dup of rows.slice(1)) {
        const dupProfile = await loadStaffProfileNotice(branchId, dup.id);
        const dupYear = yearFromScopedEmployeeId(dup.employee_id);

        if (dupProfile.academicYear) {
          profile = mergeStaffProfileYear(profile, dupProfile.academicYear, buildYearProfile({
            department: dupProfile.department ?? dup.department ?? "OTHER",
            designation: dupProfile.designation ?? dup.designation ?? "Staff",
            password: dupProfile.password ?? dupProfile.portalPassword ?? "",
            username: dupProfile.username ?? baseId,
            classes: dupProfile.classes ?? "",
            subjects: dupProfile.subjects ?? dup.subject ?? "",
            classTeacher: dupProfile.classTeacher ?? "",
          }), dupProfile.username);
        }

        if (dupProfile.years) {
          for (const [year, yearData] of Object.entries(dupProfile.years)) {
            profile = mergeStaffProfileYear(profile, year, yearData, dupProfile.username);
          }
        }

        if (dupYear && !dupProfile.years?.[dupYear]) {
          profile = mergeStaffProfileYear(profile, dupYear, buildYearProfile({
            department: dup.department ?? dupProfile.department ?? "OTHER",
            designation: dup.designation ?? dupProfile.designation ?? "Staff",
            password: dupProfile.password ?? "",
            username: dupProfile.username ?? baseId,
            classes: dupProfile.classes ?? "",
            subjects: dupProfile.subjects ?? dup.subject ?? "",
            classTeacher: dupProfile.classTeacher ?? "",
          }), dupProfile.username);
        }

        if (!DRY_RUN) {
          await deleteStaffRow(branchId, table, dup.id);
        }
        removed += 1;
      }

      if (!DRY_RUN) {
        if (canonical.employee_id !== baseId) {
          await supabase.from(table).update({ employee_id: baseId }).eq("id", canonical.id);
        }
        await saveStaffProfileNotice(branchId, canonical.id, profile);
      }
      merged += 1;
    }
  }

  return { merged, removed };
}

async function findStaffByEmployeeId(branchId, employeeId) {
  const baseId = baseEmployeeId(employeeId);

  for (const table of ["teachers", "non_teaching_staff"]) {
    const { data } = await supabase
      .from(table)
      .select("id, employee_id")
      .eq("branch_id", branchId)
      .eq("employee_id", baseId)
      .maybeSingle();

    if (data?.id) return { id: data.id, table, employeeId: baseId };
  }

  for (const table of ["teachers", "non_teaching_staff"]) {
    const { data } = await supabase
      .from(table)
      .select("id, employee_id")
      .eq("branch_id", branchId)
      .like("employee_id", `${baseId}#%`)
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      if (!DRY_RUN) {
        await supabase.from(table).update({ employee_id: baseId }).eq("id", data.id);
      }
      return { id: data.id, table, employeeId: baseId };
    }
  }

  return null;
}

async function clearStaffForYear(branchId, academicYear) {
  if (DRY_RUN) return { profilesCleared: 0, rowsRemoved: 0 };

  let profilesCleared = 0;
  let rowsRemoved = 0;

  for (const table of ["teachers", "non_teaching_staff"]) {
    const { data, error } = await supabase.from(table).select("id, employee_id").eq("branch_id", branchId);
    if (error) throw new Error(`Failed to list ${table}: ${error.message}`);

    for (const row of data ?? []) {
      const scopedYear = yearFromScopedEmployeeId(row.employee_id);
      if (scopedYear === academicYear) {
        await deleteStaffRow(branchId, table, row.id);
        rowsRemoved += 1;
        continue;
      }

      const profile = await loadStaffProfileNotice(branchId, row.id);
      const hadYear =
        Boolean(profile.years?.[academicYear]) || profile.academicYear === academicYear;

      if (hadYear) {
        const next = clearStaffProfileYear(profile, academicYear);
        await saveStaffProfileNotice(branchId, row.id, next);
        profilesCleared += 1;
      }
    }
  }

  return { profilesCleared, rowsRemoved };
}

async function upsertStaffMember(branchId, academicYear, row, employeeId) {
  const teachingStaff = isTeachingDepartment(row.department);
  const table = teachingStaff ? "teachers" : "non_teaching_staff";

  const payload = {
    branch_id: branchId,
    employee_id: employeeId,
    full_name: row.name,
    dob: row.dob,
    gender: normalizeGender(row.gender),
    phone: row.mobile,
    email: row.email || null,
    join_date: row.joinDate,
    is_active: true,
    ...(teachingStaff
      ? { subject: cleanSubjects(row.subjects) || null, class_id: null }
      : { designation: row.designation, department: row.department }),
  };

  const yearData = buildYearProfile(row);
  let staffId;
  let created = false;

  const existing = await findStaffByEmployeeId(branchId, employeeId);

  if (existing) {
    staffId = existing.id;

    if (existing.table !== table) {
      if (!DRY_RUN) {
        await deleteStaffRow(branchId, existing.table, existing.id);
        const { data: inserted, error } = await supabase.from(table).insert(payload).select("id").single();
        if (error) throw new Error(`Row ${row.rowNum} (${row.name}): ${error.message}`);
        staffId = inserted.id;
        created = true;
      }
    } else if (!DRY_RUN) {
      const { error } = await supabase.from(table).update(payload).eq("id", staffId);
      if (error) throw new Error(`Row ${row.rowNum} (${row.name}): ${error.message}`);
    }
  } else if (!DRY_RUN) {
    const { data: inserted, error } = await supabase.from(table).insert(payload).select("id").single();
    if (error) throw new Error(`Row ${row.rowNum} (${row.name}): ${error.message}`);
    staffId = inserted.id;
    created = true;
  }

  if (!DRY_RUN && staffId) {
    const profile = await loadStaffProfileNotice(branchId, staffId);
    const merged = mergeStaffProfileYear(profile, academicYear, yearData, row.username || employeeId);
    const extended = buildExtendedProfileFromRow(row);
    await saveStaffProfileNotice(branchId, staffId, { ...merged, ...extended });
  }

  return { teachingStaff, created, reused: Boolean(existing && !created) };
}

async function importStaff(branchId, academicYear, rows) {
  const usedIds = new Set();
  let teaching = 0;
  let nonTeaching = 0;
  let created = 0;
  let reused = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let employeeId = slugEmployeeId(row.username, row.name, i);
    if (usedIds.has(employeeId)) {
      employeeId = `${employeeId}_${i + 1}`;
    }
    usedIds.add(employeeId);

    const result = await upsertStaffMember(branchId, academicYear, row, employeeId);

    if (result.teachingStaff) teaching++;
    else nonTeaching++;
    if (result.created) created++;
    if (result.reused) reused++;
  }

  return { teaching, nonTeaching, created, reused };
}

async function importOneYear(branchId, academicYear, excelPath) {
  const absolutePath = path.isAbsolute(excelPath) ? excelPath : path.join(ROOT, excelPath);

  console.log(`\n=== ${academicYear} ===`);
  console.log(`Reading ${absolutePath}`);
  const rawRows = readStaffExcelRows(absolutePath);
  const rows = dedupeStaffRows(rawRows);

  console.log(`Parsed ${rawRows.length} rows → ${rows.length} unique staff`);
  console.log(
    `Teaching: ${rows.filter((r) => isTeachingDepartment(r.department)).length}, Non-teaching: ${rows.filter((r) => !isTeachingDepartment(r.department)).length}`
  );

  const cleared = await clearStaffForYear(branchId, academicYear);
  if (cleared.profilesCleared || cleared.rowsRemoved) {
    console.log(
      `Cleared year data: ${cleared.profilesCleared} profile(s), ${cleared.rowsRemoved} duplicate row(s)`
    );
  }

  const { teaching, nonTeaching, created, reused } = await importStaff(branchId, academicYear, rows);
  console.log(
    `${DRY_RUN ? "Would sync" : "Synced"} ${teaching} teaching + ${nonTeaching} non-teaching (${created} new, ${reused} existing updated)`
  );

  return teaching + nonTeaching;
}

async function main() {
  const branchId = await getBranchId();
  console.log(`Branch: Cherukupalli (${branchId})`);
  if (DRY_RUN) console.log("DRY RUN — no database writes");

  const dedupe = await dedupeBranchStaff(branchId);
  console.log(
    `${DRY_RUN ? "Would dedupe" : "Deduped"} ${dedupe.merged} staff group(s), removed ${dedupe.removed} duplicate row(s)`
  );

  if (DEDUPE_ONLY) return;

  let jobs = [];
  if (IMPORT_ALL) {
    jobs = PRESET_IMPORTS;
  } else {
    const year = readArg("--year");
    const file = readArg("--file");
    if (year && file) {
      jobs = [{ year, file }];
    } else {
      jobs = [{ year: "2022-23", file: "data/Staff Details (1).xlsx" }];
    }
  }

  let total = 0;
  for (const job of jobs) {
    total += await importOneYear(branchId, job.year, job.file);
  }

  const [{ count: teacherCount }, { count: nonTeachingCount }] = await Promise.all([
    supabase.from("teachers").select("*", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase
      .from("non_teaching_staff")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId),
  ]);

  console.log(
    `\nDone. Synced ${total} staff entries this run. Unique branch records: ${teacherCount ?? 0} teaching + ${nonTeachingCount ?? 0} non-teaching`
  );
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

export { saveStaffProfileNotice, buildYearProfile as buildProfile, isTeachingDepartment, upsertStaffMember, findStaffByEmployeeId, loadStaffProfileNotice, mergeStaffProfileYear };

#!/usr/bin/env node
/**
 * Import Cherukupalli student Excel data into Supabase.
 * One DB record per admission number; year-specific class/enrollment in profile.enrollments.
 *
 * Usage:
 *   node scripts/import-cherukupalli-students.mjs --year 2023-24 --file "data/student Details (37).xlsx"
 *   node scripts/import-cherukupalli-students.mjs --all
 *   node scripts/import-cherukupalli-students.mjs --dedupe-only
 */

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BATCH_SIZE = 100;
const PROFILE_PREFIX = "__student_profile__:";

const PRESET_IMPORTS = [
  { year: "2022-23", file: "data/student Details (36).xlsx" },
  { year: "2023-24", file: "data/student Details (37).xlsx" },
  { year: "2024-25", file: "data/student Details (38).xlsx" },
  { year: "2025-26", file: "data/student Details (39).xlsx" },
  { year: "2026-27", file: "data/student Details (40).xlsx" },
];

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SET_CURRENT = args.includes("--set-current");
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

export function baseAdmissionNo(admissionNo) {
  const text = String(admissionNo ?? "").trim();
  const hash = text.indexOf("#");
  return hash === -1 ? text : text.slice(0, hash);
}

export function scopedAdmissionNo(rawAdmissionNo, academicYear) {
  const base = String(rawAdmissionNo ?? "").trim();
  if (!base) return base;
  if (base.includes("#")) return base;
  return `${base}#${academicYear}`;
}

export function displayAdmissionNo(stored) {
  return baseAdmissionNo(stored);
}

function yearFromScopedAdmissionNo(admissionNo) {
  const id = String(admissionNo ?? "");
  const hash = id.indexOf("#");
  if (hash === -1) return null;
  return id.slice(hash + 1);
}

function parseClassLabel(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { class_name: "Unknown", section: "A" };
  const dash = text.indexOf("-");
  if (dash === -1) return { class_name: text, section: "Main" };
  return {
    class_name: text.slice(0, dash).trim(),
    section: text.slice(dash + 1).trim() || "Main",
  };
}

function parseDob(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    if (y >= 1900 && y <= 2100) {
      return value.toISOString().slice(0, 10);
    }
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

function normalizeGender(raw) {
  const g = String(raw ?? "").trim().toLowerCase();
  if (g.startsWith("m")) return "male";
  if (g.startsWith("f")) return "female";
  return null;
}

function pickPhone(...values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s && s !== "null" && s !== "undefined") return s.replace(/\.0$/, "");
  }
  return null;
}

export function readExcelRows(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).filter((r) => r?.[3]);

  return dataRows.map((row, idx) => {
    const byHeader = {};
    header.forEach((h, i) => {
      if (h) byHeader[String(h).trim()] = row[i];
    });

    const admissionNo = String(byHeader["Adm. No."] ?? row[2] ?? "").trim();
    const studentName = String(byHeader["Student Name"] ?? row[3] ?? "").trim();
    const classRaw = byHeader["Class"] ?? row[7];
    const father = String(byHeader["Father's Name"] ?? row[5] ?? "").trim();
    const mother = String(byHeader["Mother's Name"] ?? row[6] ?? "").trim();
    const parentName = [father, mother].filter(Boolean).join(" / ") || null;

    return {
      rowNum: idx + 2,
      admission_no_raw: admissionNo,
      full_name: studentName,
      dob: parseDob(byHeader["DOB"] ?? row[8]),
      gender: normalizeGender(byHeader["Sex"] ?? row[9]),
      address: String(byHeader["Address"] ?? row[10] ?? "").trim() || null,
      parent_name: parentName,
      father_name: father,
      mother_name: mother,
      aadhar_no: String(byHeader["Aadhar no."] ?? row[4] ?? "").trim() || null,
      father_phone: pickPhone(byHeader["Father No."], row[13]),
      mother_phone: pickPhone(byHeader["Mother No."], row[14]),
      username: String(byHeader["UserName"] ?? row[11] ?? "").trim() || null,
      password: String(byHeader["Password"] ?? row[12] ?? "").trim() || null,
      parent_phone: pickPhone(
        byHeader["Contact No."],
        byHeader["Father No."],
        byHeader["Mother No."],
        row[15],
        row[13],
        row[14]
      ),
      classLabel: String(classRaw ?? "").trim(),
      ...parseClassLabel(classRaw),
    };
  });
}

export function buildEnrollmentFromRow(row, classId) {
  const username = row.username ? String(row.username).trim() : "";
  const password = row.password ? String(row.password).trim() : "";
  return {
    className: row.class_name,
    section: row.section,
    classId,
    classLabel: row.classLabel,
    aadharNo: row.aadhar_no || "",
    fatherName: row.father_name || "",
    motherName: row.mother_name || "",
    fatherMobile1: row.father_phone || "",
    motherMobile1: row.mother_phone || "",
    mobileNumber: row.parent_phone || "",
    permMobile: row.parent_phone || "",
    permAddress: row.address || "",
    username: username || undefined,
    portalPassword: password || username || undefined,
  };
}

/** @deprecated use buildEnrollmentFromRow */
export function buildProfileFromRow(row, academicYear) {
  return { ...buildEnrollmentFromRow(row), session: academicYear };
}

export function mergeStudentEnrollment(existing, academicYear, enrollment) {
  const profile = { ...existing, enrollments: { ...(existing.enrollments ?? {}) } };

  if (profile.session && !profile.enrollments[profile.session]) {
    profile.enrollments[profile.session] = {
      aadharNo: profile.aadharNo,
      fatherName: profile.fatherName,
      motherName: profile.motherName,
      fatherMobile1: profile.fatherMobile1,
      motherMobile1: profile.motherMobile1,
      mobileNumber: profile.mobileNumber,
      permMobile: profile.permMobile,
      permAddress: profile.permAddress,
      username: profile.username,
      portalPassword: profile.portalPassword,
    };
  }

  delete profile.session;
  delete profile.aadharNo;
  delete profile.fatherName;
  delete profile.motherName;
  delete profile.fatherMobile1;
  delete profile.motherMobile1;
  delete profile.mobileNumber;
  delete profile.permMobile;
  delete profile.permAddress;

  profile.enrollments[academicYear] = enrollment;
  if (enrollment.username) profile.username = enrollment.username;
  if (enrollment.portalPassword) profile.portalPassword = enrollment.portalPassword;

  return profile;
}

function clearStudentEnrollment(profile, academicYear) {
  if (!profile.enrollments?.[academicYear]) {
    if (profile.session === academicYear) {
      const next = { ...profile };
      delete next.session;
      return next;
    }
    return profile;
  }

  const enrollments = { ...profile.enrollments };
  delete enrollments[academicYear];
  return { ...profile, enrollments };
}

async function getBranchId() {
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  return resolveBranchId(supabase, "idpscherukupalli");
}

export async function saveStudentProfileNotice(branchId, studentId, profile) {
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
    if (error) throw new Error(`Profile update failed: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(`Profile insert failed: ${error.message}`);
}

export async function loadStudentProfileNotice(branchId, studentId) {
  const { data } = await supabase
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${PROFILE_PREFIX}${studentId}`)
    .maybeSingle();

  if (!data?.content) return {};
  try {
    const parsed = JSON.parse(String(data.content));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function deleteStudentRow(branchId, studentId) {
  await supabase.from("notices").delete().eq("branch_id", branchId).eq("title", `${PROFILE_PREFIX}${studentId}`);
  await supabase.from("students").delete().eq("id", studentId);
}

async function loadClassInfo(classId) {
  if (!classId) return null;
  const { data } = await supabase
    .from("classes")
    .select("class_name, section, academic_year")
    .eq("id", classId)
    .maybeSingle();
  return data;
}

async function fetchAllRows(table, select, filters = []) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + 999);
    for (const [method, ...args] of filters) {
      query = query[method](...args);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  return rows;
}

export async function dedupeBranchStudents(branchId) {
  let merged = 0;
  let removed = 0;

  const [data, notices, classes] = await Promise.all([
    fetchAllRows(
      "students",
      "id, admission_no, class_id, full_name, dob, gender, parent_name, parent_phone, address, created_at",
      [["eq", "branch_id", branchId]]
    ),
    fetchAllRows("notices", "title, content", [
      ["eq", "branch_id", branchId],
      ["like", "title", `${PROFILE_PREFIX}%`],
    ]),
    fetchAllRows("classes", "id, class_name, section, academic_year", [["eq", "branch_id", branchId]]),
  ]);

  const profiles = new Map();
  for (const notice of notices ?? []) {
    const id = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      profiles.set(id, JSON.parse(String(notice.content)));
    } catch {
      profiles.set(id, {});
    }
  }

  const classById = new Map((classes ?? []).map((c) => [c.id, c]));

  const groups = new Map();
  for (const row of data ?? []) {
    const base = baseAdmissionNo(row.admission_no);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(row);
  }

  const deleteIds = [];

  for (const [baseAdm, rows] of groups) {
    if (rows.length === 1) {
      const only = rows[0];
      if (only.admission_no !== baseAdm && !DRY_RUN) {
        await supabase.from("students").update({ admission_no: baseAdm }).eq("id", only.id);
      }
      continue;
    }

    rows.sort((a, b) => {
      const aPlain = !String(a.admission_no).includes("#");
      const bPlain = !String(b.admission_no).includes("#");
      if (aPlain !== bPlain) return aPlain ? -1 : 1;
      return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
    });

    const canonical = rows[0];
    let profile = profiles.get(canonical.id) ?? {};

    for (const dup of rows.slice(1)) {
      const dupProfile = profiles.get(dup.id) ?? {};
      const dupYear = yearFromScopedAdmissionNo(dup.admission_no);
      const cls = classById.get(dup.class_id);

      if (dupProfile.session) {
        profile = mergeStudentEnrollment(
          profile,
          dupProfile.session,
          buildEnrollmentFromRow(
            {
              class_name: cls?.class_name ?? "Unknown",
              section: cls?.section ?? "Main",
              classLabel: "",
              aadhar_no: dupProfile.aadharNo,
              father_name: dupProfile.fatherName,
              mother_name: dupProfile.motherName,
              father_phone: dupProfile.fatherMobile1,
              mother_phone: dupProfile.motherMobile1,
              parent_phone: dupProfile.mobileNumber ?? dupProfile.permMobile,
              address: dupProfile.permAddress,
              username: dupProfile.username,
              password: dupProfile.portalPassword,
            },
            dup.class_id
          )
        );
      }

      if (dupProfile.enrollments) {
        for (const [year, enrollment] of Object.entries(dupProfile.enrollments)) {
          profile = mergeStudentEnrollment(profile, year, enrollment);
        }
      }

      if (dupYear) {
        profile = mergeStudentEnrollment(
          profile,
          dupYear,
          buildEnrollmentFromRow(
            {
              class_name: cls?.class_name ?? "Unknown",
              section: cls?.section ?? "Main",
              classLabel: "",
              aadhar_no: dupProfile.aadharNo,
              father_name: dupProfile.fatherName,
              mother_name: dupProfile.motherName,
              father_phone: dupProfile.fatherMobile1,
              mother_phone: dupProfile.motherMobile1,
              parent_phone: dupProfile.mobileNumber ?? dupProfile.permMobile,
              address: dupProfile.permAddress ?? dup.address,
              username: dupProfile.username,
              password: dupProfile.portalPassword,
            },
            dup.class_id
          )
        );
      }

      deleteIds.push(dup.id);
      removed += 1;
    }

    if (!DRY_RUN) {
      if (canonical.admission_no !== baseAdm) {
        await supabase.from("students").update({ admission_no: baseAdm }).eq("id", canonical.id);
      }
      await saveStudentProfileNotice(branchId, canonical.id, profile);
      profiles.set(canonical.id, profile);
    }
    if (rows.length > 1) merged += 1;
  }

  if (!DRY_RUN && deleteIds.length) {
    for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
      const batch = deleteIds.slice(i, i + BATCH_SIZE);
      await supabase
        .from("notices")
        .delete()
        .eq("branch_id", branchId)
        .in(
          "title",
          batch.map((id) => `${PROFILE_PREFIX}${id}`)
        );
      const { error: delErr } = await supabase.from("students").delete().in("id", batch);
      if (delErr) throw new Error(`Failed to delete duplicate students: ${delErr.message}`);
    }
  }

  return { merged, removed };
}

export async function findStudentByAdmissionNo(branchId, admissionNoRaw) {
  const baseAdm = baseAdmissionNo(admissionNoRaw);

  const { data: exact } = await supabase
    .from("students")
    .select("id, admission_no")
    .eq("branch_id", branchId)
    .eq("admission_no", baseAdm)
    .maybeSingle();

  if (exact?.id) return { id: exact.id, admissionNo: baseAdm };

  const { data: scoped } = await supabase
    .from("students")
    .select("id, admission_no")
    .eq("branch_id", branchId)
    .like("admission_no", `${baseAdm}#%`)
    .limit(1)
    .maybeSingle();

  if (scoped?.id) {
    if (!DRY_RUN) {
      await supabase.from("students").update({ admission_no: baseAdm }).eq("id", scoped.id);
    }
    return { id: scoped.id, admissionNo: baseAdm };
  }

  return null;
}

export async function ensureClasses(branchId, academicYear, rows) {
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.class_name}|||${row.section}`;
    if (!unique.has(key)) unique.set(key, row);
  }

  const { data: existing, error: loadError } = await supabase
    .from("classes")
    .select("id, class_name, section")
    .eq("branch_id", branchId)
    .eq("academic_year", academicYear);

  if (loadError) throw new Error(`Failed to load classes: ${loadError.message}`);

  const classMap = new Map();
  for (const c of existing ?? []) {
    classMap.set(`${c.class_name}|||${c.section}`, c.id);
  }

  const toCreate = [];
  for (const [key, row] of unique) {
    if (!classMap.has(key)) {
      toCreate.push({
        branch_id: branchId,
        class_name: row.class_name,
        section: row.section,
        academic_year: academicYear,
        total_students: 0,
      });
    }
  }

  if (toCreate.length && !DRY_RUN) {
    const { data: created, error } = await supabase
      .from("classes")
      .insert(toCreate)
      .select("id, class_name, section");

    if (error) throw new Error(`Failed to create classes: ${error.message}`);
    for (const c of created ?? []) {
      classMap.set(`${c.class_name}|||${c.section}`, c.id);
    }
  } else if (DRY_RUN) {
    for (const item of toCreate) {
      classMap.set(`${item.class_name}|||${item.section}`, `dry-${item.class_name}-${item.section}`);
    }
  }

  for (const c of existing ?? []) {
    classMap.set(`${c.class_name}|||${c.section}`, c.id);
  }

  return classMap;
}

async function clearEnrollmentForYear(branchId, academicYear) {
  if (DRY_RUN) return { profilesCleared: 0, rowsRemoved: 0 };

  let profilesCleared = 0;
  let rowsRemoved = 0;

  const [data, notices] = await Promise.all([
    fetchAllRows("students", "id, admission_no", [["eq", "branch_id", branchId]]),
    fetchAllRows("notices", "title, content", [
      ["eq", "branch_id", branchId],
      ["like", "title", `${PROFILE_PREFIX}%`],
    ]),
  ]);

  const profiles = new Map();
  for (const notice of notices ?? []) {
    const id = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      profiles.set(id, JSON.parse(String(notice.content)));
    } catch {
      profiles.set(id, {});
    }
  }

  const deleteIds = [];

  for (const row of data ?? []) {
    const scopedYear = yearFromScopedAdmissionNo(row.admission_no);
    if (scopedYear === academicYear) {
      deleteIds.push(row.id);
      rowsRemoved += 1;
      continue;
    }

    const profile = profiles.get(row.id) ?? {};
    const hadYear =
      Boolean(profile.enrollments?.[academicYear]) || profile.session === academicYear;

    if (hadYear) {
      const next = clearStudentEnrollment(profile, academicYear);
      if (!DRY_RUN) {
        await saveStudentProfileNotice(branchId, row.id, next);
      }
      profilesCleared += 1;
    }
  }

  if (!DRY_RUN && deleteIds.length) {
    for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
      const batch = deleteIds.slice(i, i + BATCH_SIZE);
      await supabase
        .from("notices")
        .delete()
        .eq("branch_id", branchId)
        .in(
          "title",
          batch.map((id) => `${PROFILE_PREFIX}${id}`)
        );
      await supabase.from("students").delete().in("id", batch);
    }
  }

  return { profilesCleared, rowsRemoved };
}

async function syncStudentsForYear(branchId, academicYear, rows, classMap) {
  const [allStudents, notices] = await Promise.all([
    fetchAllRows("students", "id, admission_no", [["eq", "branch_id", branchId]]),
    fetchAllRows("notices", "title, content", [
      ["eq", "branch_id", branchId],
      ["like", "title", `${PROFILE_PREFIX}%`],
    ]),
  ]);

  const studentIdsByAdm = new Map();
  for (const s of allStudents ?? []) {
    const base = baseAdmissionNo(s.admission_no);
    if (!studentIdsByAdm.has(base)) studentIdsByAdm.set(base, []);
    studentIdsByAdm.get(base).push({ id: s.id, admission_no: String(s.admission_no) });
  }

  const profiles = new Map();
  for (const notice of notices ?? []) {
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

  if (!DRY_RUN) {
    for (const [baseAdm, matches] of studentIdsByAdm) {
      if (matches.length <= 1) {
        const only = matches[0];
        if (only.admission_no !== baseAdm) {
          await supabase.from("students").update({ admission_no: baseAdm }).eq("id", only.id);
          only.admission_no = baseAdm;
        }
        continue;
      }

      const canonicalId = resolveStudentId(baseAdm);
      let profile = profiles.get(canonicalId) ?? {};

      for (const match of matches) {
        if (match.id === canonicalId) continue;
        const dupProfile = profiles.get(match.id) ?? {};
        const dupYear = yearFromScopedAdmissionNo(match.admission_no);

        if (dupProfile.session) {
          profile = mergeStudentEnrollment(profile, dupProfile.session, dupProfile);
        }
        if (dupProfile.enrollments) {
          for (const [year, enrollment] of Object.entries(dupProfile.enrollments)) {
            profile = mergeStudentEnrollment(profile, year, enrollment);
          }
        }
        if (dupYear) {
          profile = mergeStudentEnrollment(profile, dupYear, dupProfile);
        }

        await supabase
          .from("notices")
          .delete()
          .eq("branch_id", branchId)
          .eq("title", `${PROFILE_PREFIX}${match.id}`);
        await supabase.from("students").delete().eq("id", match.id);
        profiles.delete(match.id);
      }

      await saveStudentProfileNotice(branchId, canonicalId, profile);
      profiles.set(canonicalId, profile);
      if (baseAdm !== matches.find((m) => m.id === canonicalId)?.admission_no) {
        await supabase.from("students").update({ admission_no: baseAdm }).eq("id", canonicalId);
      }
      studentIdsByAdm.set(baseAdm, [{ id: canonicalId, admission_no: baseAdm }]);
    }
  }

  let created = 0;
  let reused = 0;

  for (const row of rows) {
    const classKey = `${row.class_name}|||${row.section}`;
    const classId = classMap.get(classKey);
    if (!classId) {
      throw new Error(`Missing class for row ${row.rowNum}: ${row.classLabel}`);
    }

    const baseAdm = row.admission_no_raw;
    const enrollment = buildEnrollmentFromRow(row, classId);
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

    if (studentId) {
      if (!DRY_RUN) {
        const { error } = await supabase.from("students").update(payload).eq("id", studentId);
        if (error) throw new Error(`Row ${row.rowNum} (${row.full_name}): ${error.message}`);
      }
      reused += 1;
    } else if (!DRY_RUN) {
      const { data: inserted, error } = await supabase
        .from("students")
        .insert({ ...payload, admission_no: baseAdm })
        .select("id")
        .single();
      if (error?.code === "23505") {
        const existingId = resolveStudentId(baseAdm);
        if (!existingId) {
          const { data: existing } = await supabase
            .from("students")
            .select("id")
            .eq("branch_id", branchId)
            .eq("admission_no", baseAdm)
            .maybeSingle();
          if (!existing?.id) throw new Error(`Row ${row.rowNum} (${row.full_name}): ${error.message}`);
          studentId = existing.id;
        } else {
          studentId = existingId;
        }
        await supabase.from("students").update(payload).eq("id", studentId);
        reused += 1;
      } else if (error) {
        throw new Error(`Row ${row.rowNum} (${row.full_name}): ${error.message}`);
      } else {
        studentId = inserted.id;
        studentIdsByAdm.set(baseAdm, [{ id: studentId, admission_no: baseAdm }]);
        created += 1;
      }
    } else {
      created += 1;
    }

    if (!DRY_RUN && studentId) {
      const profile = profiles.get(studentId) ?? {};
      const merged = mergeStudentEnrollment(profile, academicYear, enrollment);
      await saveStudentProfileNotice(branchId, studentId, merged);
      profiles.set(studentId, merged);
    }
  }

  return { total: rows.length, created, reused };
}

async function updateClassCounts(branchId, academicYear) {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id")
    .eq("branch_id", branchId)
    .eq("academic_year", academicYear);

  if (error || !classes?.length) return;

  const allStudentIds = await fetchAllRows("students", "id", [["eq", "branch_id", branchId]]);
  const profiles = new Map();

  const notices = await fetchAllRows("notices", "title, content", [
    ["eq", "branch_id", branchId],
    ["like", "title", `${PROFILE_PREFIX}%`],
  ]);

  for (const notice of notices ?? []) {
    const id = String(notice.title).slice(PROFILE_PREFIX.length);
    try {
      profiles.set(id, JSON.parse(String(notice.content)));
    } catch {
      /* skip */
    }
  }

  for (const cls of classes) {
    let count = 0;
    for (const student of allStudentIds ?? []) {
      const profile = profiles.get(student.id) ?? {};
      const enrollment = profile.enrollments?.[academicYear];
      if (enrollment?.classId === cls.id) count++;
    }

    if (!DRY_RUN) {
      await supabase.from("classes").update({ total_students: count }).eq("id", cls.id);
    }
  }
}

async function setCurrentAcademicYear(branchId, academicYear) {
  const { data: existing } = await supabase
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", "__config__:current_academic_year")
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("notices").update({ content: academicYear }).eq("id", existing.id);
    return;
  }

  await supabase.from("notices").insert({
    branch_id: branchId,
    title: "__config__:current_academic_year",
    content: academicYear,
    target: "admin",
  });
}

async function importOneYear(branchId, academicYear, excelPath) {
  const absolutePath = path.isAbsolute(excelPath) ? excelPath : path.join(ROOT, excelPath);

  console.log(`\n=== ${academicYear} ===`);
  console.log(`Reading ${absolutePath}`);
  const rows = readExcelRows(absolutePath);
  console.log(`Parsed ${rows.length} student rows`);

  const cleared = await clearEnrollmentForYear(branchId, academicYear);
  if (cleared.profilesCleared || cleared.rowsRemoved) {
    console.log(
      `Cleared year enrollments: ${cleared.profilesCleared} profile(s), ${cleared.rowsRemoved} duplicate row(s)`
    );
  }

  const classMap = await ensureClasses(branchId, academicYear, rows);
  console.log(`Classes ready: ${classMap.size}`);

  const { total, created, reused } = await syncStudentsForYear(branchId, academicYear, rows, classMap);
  console.log(
    `${DRY_RUN ? "Would sync" : "Synced"} ${total} students (${created} new, ${reused} existing updated)`
  );

  await updateClassCounts(branchId, academicYear);
  return total;
}

async function main() {
  const branchId = await getBranchId();
  console.log(`Branch: Cherukupalli (${branchId})`);
  if (DRY_RUN) console.log("DRY RUN — no database writes");

  let totalRemoved = 0;
  let totalMerged = 0;
  for (let pass = 0; pass < 10; pass++) {
    const dedupe = await dedupeBranchStudents(branchId);
    totalMerged += dedupe.merged;
    totalRemoved += dedupe.removed;
    if (!dedupe.removed) break;
  }
  console.log(
    `${DRY_RUN ? "Would dedupe" : "Deduped"} ${totalMerged} student group(s), removed ${totalRemoved} duplicate row(s)`
  );

  if (DEDUPE_ONLY) return;

  let jobs = [];
  if (IMPORT_ALL) {
    jobs = PRESET_IMPORTS;
  } else {
    const year = readArg("--year");
    const file = readArg("--file");
    if (!year || !file) {
      console.error(
        'Usage: node scripts/import-cherukupalli-students.mjs --year 2023-24 --file "data/student Details (37).xlsx"'
      );
      console.error("       node scripts/import-cherukupalli-students.mjs --all");
      process.exit(1);
    }
    jobs = [{ year, file }];
  }

  let total = 0;
  for (const job of jobs) {
    total += await importOneYear(branchId, job.year, job.file);
  }

  if (SET_CURRENT && jobs.length && !DRY_RUN) {
    const lastYear = jobs[jobs.length - 1].year;
    await setCurrentAcademicYear(branchId, lastYear);
    console.log(`\nSet active academic year → ${lastYear}`);
  }

  const { count: branchTotal } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", branchId);

  console.log(
    `\nDone. Synced ${total} enrollments this run. Unique student records: ${branchTotal ?? 0}`
  );
}

export { syncStudentsForYear as syncProfilesForYear };

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

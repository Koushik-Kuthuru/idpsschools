import type { FeeGridRow } from "@/lib/feeDepositUtils";
import { buildFeeGridFromStructure, hasFeeGridData } from "@/lib/feeDepositUtils";
import {
  compareGrades,
  gradeDisplayLabel,
  gradeIdentityKey,
  gradesMatchForClass,
  sortGrades,
} from "@/lib/gradeOrder";

export type FeeHead = {
  id: string;
  name: string;
  description?: string;
};

export type FeeTypeItem = {
  id: string;
  name: string;
  method: "-" | "ONE TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  headId?: string;
  /** System rows (e.g. LAST YEAR DUE) cannot be removed. */
  locked?: boolean;
};

export type ExtraFeeItem = {
  id: string;
  name: string;
  method: "-" | "ONE TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  remark?: string;
  /** Flat amount or per-day rate (used for late fee). */
  rate?: string;
};

export type ClassFeeStructureEntry = {
  id: string;
  grade: string;
  academicYear: string;
  status: "Active" | "Draft";
  feeGrid: FeeGridRow[];
};

export type FeeConfiguration = {
  feeHeads: FeeHead[];
  feeTypes: FeeTypeItem[];
  extraFees: ExtraFeeItem[];
  classStructures: ClassFeeStructureEntry[];
  updatedAt?: string;
};

const FEE_METHODS = ["-", "ONE TIME", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

export { FEE_METHODS };

function slugId(name: string, prefix: string) {
  return (
    `${prefix}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}` || prefix
  );
}

export const DEFAULT_FEE_HEADS: FeeHead[] = [
  { id: "head-academic", name: "Academic", description: "Core tuition and admission fees" },
  { id: "head-hostel", name: "Hostel & Boarding", description: "Residential and food charges" },
  { id: "head-activities", name: "Activities & Programs", description: "Olympiad, IIT, excursions" },
  { id: "head-other", name: "Other", description: "Miscellaneous and optional fees" },
];

export const DEFAULT_FEE_TYPES: FeeTypeItem[] = [
  { id: "type-last-year-due", name: "LAST YEAR DUE", method: "-", locked: true },
  { id: "type-admission", name: "ADMISSION FEE", method: "ONE TIME", headId: "head-academic" },
  { id: "type-tuition", name: "TUITION FEE", method: "QUARTERLY", headId: "head-academic" },
  { id: "type-hostel", name: "HOSTEL FEE", method: "QUARTERLY", headId: "head-hostel" },
  { id: "type-iit", name: "IIT FEE", method: "-", headId: "head-activities" },
  { id: "type-olympiad", name: "OLYMPIAD FEE", method: "-", headId: "head-activities" },
  { id: "type-excursion", name: "EXCURSION FEE", method: "-", headId: "head-activities" },
  { id: "type-curriculum", name: "CURRICULUM FEE", method: "-", headId: "head-academic" },
  { id: "type-food", name: "FOOD FEE", method: "-", headId: "head-hostel" },
  { id: "type-misc", name: "MISCELLANEOUS", method: "-", headId: "head-other" },
  { id: "type-laundry", name: "LAUNDRY FEE", method: "-", headId: "head-hostel" },
  { id: "type-cospark", name: "CO-SPARK FEE", method: "-", headId: "head-activities" },
  { id: "type-transport", name: "TRANSPORT FEE", method: "QUARTERLY", headId: "head-other", locked: true },
];

export const DEFAULT_EXTRA_FEES: ExtraFeeItem[] = [
  {
    id: "extra-late-fine",
    name: "LATE FEE",
    method: "ONE TIME",
    remark: "Applied when payment is overdue",
    rate: "25",
  },
  { id: "extra-exam", name: "EXAM FEE", method: "ONE TIME" },
];

export function feeConfigurationStorageKey(schoolId: string) {
  return `feeConfiguration_${schoolId}`;
}

function normalizeFeeType(item: Partial<FeeTypeItem>, index: number): FeeTypeItem {
  const name = String(item.name ?? `FEE ${index + 1}`)
    .trim()
    .toUpperCase();
  const method = FEE_METHODS.includes(item.method as (typeof FEE_METHODS)[number])
    ? (item.method as FeeTypeItem["method"])
    : "-";
  return {
    id: item.id || slugId(name, "type"),
    name,
    method,
    headId: item.headId,
    locked: item.locked ?? (name === "LAST YEAR DUE" || name === "TRANSPORT FEE"),
  };
}

function normalizeConfig(parsed: Partial<FeeConfiguration>): FeeConfiguration {
  const feeHeads =
    Array.isArray(parsed.feeHeads) && parsed.feeHeads.length
      ? parsed.feeHeads.map((h, i) => ({
          id: h.id || slugId(String(h.name ?? `Head ${i + 1}`), "head"),
          name: String(h.name ?? "").trim() || `Head ${i + 1}`,
          description: h.description,
        }))
      : DEFAULT_FEE_HEADS;

  const feeTypes =
    Array.isArray(parsed.feeTypes) && parsed.feeTypes.length
      ? parsed.feeTypes.map(normalizeFeeType)
      : DEFAULT_FEE_TYPES;

  const extraFees =
    Array.isArray(parsed.extraFees) && parsed.extraFees.length
      ? parsed.extraFees.map((e, i) => ({
          id: e.id || slugId(String(e.name ?? `Extra ${i + 1}`), "extra"),
          name: String(e.name ?? "").trim().toUpperCase() || `EXTRA ${i + 1}`,
          method: FEE_METHODS.includes(e.method as (typeof FEE_METHODS)[number])
            ? (e.method as ExtraFeeItem["method"])
            : "-",
          remark: e.remark,
          rate: e.rate !== undefined && e.rate !== null ? String(e.rate) : undefined,
        }))
      : DEFAULT_EXTRA_FEES;

  for (const fee of extraFees) {
    if ((fee.id === "extra-late-fine" || fee.name.includes("LATE FEE")) && !fee.rate) {
      fee.rate = "25";
    }
  }

  const classStructures: ClassFeeStructureEntry[] = Array.isArray(parsed.classStructures)
    ? parsed.classStructures.map((entry, i) => ({
        id: entry.id || slugId(String(entry.grade ?? `grade-${i}`), "class"),
        grade: String(entry.grade ?? "").trim(),
        academicYear: String(entry.academicYear ?? "2024-25").trim(),
        status: (entry.status === "Draft" ? "Draft" : "Active") as ClassFeeStructureEntry["status"],
        feeGrid: Array.isArray(entry.feeGrid) ? entry.feeGrid : [],
      }))
    : [];

  return {
    feeHeads,
    feeTypes,
    extraFees,
    classStructures,
    updatedAt: parsed.updatedAt,
  };
}

export function loadFeeConfiguration(schoolId: string): FeeConfiguration {
  if (typeof window === "undefined") {
    return normalizeConfig({});
  }
  try {
    const raw = localStorage.getItem(feeConfigurationStorageKey(schoolId));
    if (!raw) return normalizeConfig({});
    return normalizeConfig(JSON.parse(raw) as Partial<FeeConfiguration>);
  } catch {
    return normalizeConfig({});
  }
}

export function saveFeeConfiguration(schoolId: string, config: FeeConfiguration) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    feeConfigurationStorageKey(schoolId),
    JSON.stringify({ ...config, updatedAt: new Date().toISOString() })
  );
}

/** Build the standard student fee grid from branch fee-type settings. */
export function feeTypesToGrid(feeTypes: FeeTypeItem[]): FeeGridRow[] {
  return feeTypes.map((type) => ({
    name: type.name,
    method: type.method,
    values: Array(12).fill("0"),
  }));
}

export function createStandardFeeGridFromConfig(schoolId?: string): FeeGridRow[] {
  if (schoolId && typeof window !== "undefined") {
    const config = loadFeeConfiguration(schoolId);
    return feeTypesToGrid(config.feeTypes);
  }
  return feeTypesToGrid(DEFAULT_FEE_TYPES);
}

export function mergeFeeGridWithConfigTemplate(
  saved: FeeGridRow[] | undefined,
  schoolId?: string
): FeeGridRow[] {
  const template = createStandardFeeGridFromConfig(schoolId);
  if (!Array.isArray(saved) || saved.length === 0) return template;

  const meaningful = saved.filter((row) => hasFeeGridData([row]));
  if (meaningful.length === 0) return template;

  const byName = new Map(meaningful.map((row) => [row.name.toUpperCase(), row]));
  const merged = template.map((row) => {
    const match = byName.get(row.name.toUpperCase());
    if (!match) return row;
    return {
      ...row,
      ...match,
      values: Array.isArray(match.values) && match.values.length === 12 ? [...match.values] : row.values,
    };
  });

  for (const row of meaningful) {
    if (!template.some((t) => t.name.toUpperCase() === row.name.toUpperCase())) {
      merged.push(row);
    }
  }

  return merged;
}

export function classStructureStorageKey(grade: string, academicYear: string): string {
  return `${gradeIdentityKey(grade)}|${String(academicYear ?? "").trim()}`;
}

export function studentEnrollmentGrade(record: Record<string, unknown>): string {
  return String(
    record.classId ?? record.className ?? record.grade ?? record.class ?? ""
  ).trim();
}

export function studentAcademicYear(
  record: Record<string, unknown>,
  fallback?: string | null
): string | undefined {
  const fromRecord = String(
    record.academicYear ??
      (record.enrollment as Record<string, unknown> | undefined)?.academicYear ??
      ""
  ).trim();
  if (fromRecord) return fromRecord;
  const fb = String(fallback ?? "").trim();
  return fb || undefined;
}

export function pickClassStructureForGrade(
  structures: ClassFeeStructureEntry[],
  grade: string,
  academicYear?: string | null
): ClassFeeStructureEntry | undefined {
  const active = structures.filter((entry) => entry.status === "Active");
  const matched = active.filter((entry) => gradesMatchForClass(entry.grade, grade));
  if (!matched.length) return undefined;

  const yearPool = academicYear
    ? matched.filter((entry) => entry.academicYear === academicYear)
    : matched;
  const pool = academicYear ? yearPool : matched;

  if (academicYear && !pool.length) return undefined;

  return pool.find((entry) => hasFeeGridData(entry.feeGrid)) ?? pool[0];
}

export function findClassStructureForGrade(
  config: FeeConfiguration,
  grade: string,
  academicYear?: string | null
): ClassFeeStructureEntry | undefined {
  return pickClassStructureForGrade(config.classStructures, grade, academicYear);
}

export function classStructureAsGradeRecord(entry: ClassFeeStructureEntry): Record<string, unknown> {
  return {
    grade: entry.grade,
    academicYear: entry.academicYear,
    status: entry.status,
    feeGrid: entry.feeGrid,
  };
}

export async function fetchHydratedFeeConfiguration(
  schoolId: string,
  academicYear?: string | null
): Promise<FeeConfiguration> {
  const local = loadFeeConfiguration(schoolId);
  if (typeof window === "undefined") return local;

  try {
    const params = new URLSearchParams({ schoolId });
    if (academicYear) params.set("academicYear", academicYear);
    const res = await fetch(`/api/admin/fee-structures?${params.toString()}`, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return local;

    const fromDb = (body.structures ?? []).map((row: Record<string, unknown>) =>
      classStructureFromDbDoc(String(row.id ?? row.grade ?? ""), row, local.feeTypes)
    );
    const merged = hydrateFeeConfiguration(schoolId, fromDb);
    saveFeeConfiguration(schoolId, merged);
    return merged;
  } catch {
    return local;
  }
}

export function emptyClassFeeGrid(feeTypes: FeeTypeItem[]): FeeGridRow[] {
  return feeTypesToGrid(feeTypes);
}

export function mergeClassFeeGrid(
  saved: FeeGridRow[] | undefined,
  feeTypes: FeeTypeItem[]
): FeeGridRow[] {
  const template = feeTypesToGrid(feeTypes);
  if (!Array.isArray(saved) || saved.length === 0) return template;

  const byName = new Map(saved.map((row) => [row.name.toUpperCase(), row]));
  const merged = template.map((row) => {
    const match = byName.get(row.name.toUpperCase());
    if (!match) return row;
    return {
      ...row,
      method: match.method ?? row.method,
      values: Array.isArray(match.values) && match.values.length === 12 ? [...match.values] : row.values,
    };
  });

  for (const row of saved) {
    if (!template.some((t) => t.name.toUpperCase() === row.name.toUpperCase())) {
      merged.push({
        ...row,
        values: Array.isArray(row.values) && row.values.length === 12 ? [...row.values] : Array(12).fill("0"),
      });
    }
  }

  return merged;
}

export function classStructureFromDbDoc(
  docId: string,
  data: Record<string, unknown>,
  feeTypes: FeeTypeItem[]
): ClassFeeStructureEntry {
  const grade = String(data.grade ?? docId).trim();
  let feeGrid: FeeGridRow[] = [];

  if (Array.isArray(data.feeGrid) && hasFeeGridData(data.feeGrid as FeeGridRow[])) {
    feeGrid = mergeClassFeeGrid(data.feeGrid as FeeGridRow[], feeTypes);
  } else if (Array.isArray(data.feeGrid) && (data.feeGrid as FeeGridRow[]).length > 0) {
    feeGrid = mergeClassFeeGrid(data.feeGrid as FeeGridRow[], feeTypes);
  } else {
    const legacy = buildFeeGridFromStructure(data);
    feeGrid = hasFeeGridData(legacy)
      ? mergeClassFeeGrid(legacy, feeTypes)
      : emptyClassFeeGrid(feeTypes);
  }

  return {
    id: docId,
    grade,
    academicYear: String(data.academicYear ?? data.academic_year ?? "2024-25").trim(),
    status: data.status === "Draft" ? "Draft" : "Active",
    feeGrid,
  };
}

export function mergeClassStructures(
  local: ClassFeeStructureEntry[],
  fromDb: ClassFeeStructureEntry[]
): ClassFeeStructureEntry[] {
  const byKey = new Map<string, ClassFeeStructureEntry>();

  for (const entry of local) {
    if (!entry.grade.trim() || !entry.academicYear.trim()) continue;
    byKey.set(classStructureStorageKey(entry.grade, entry.academicYear), entry);
  }

  for (const entry of fromDb) {
    if (!entry.grade.trim() || !entry.academicYear.trim()) continue;
    const key = classStructureStorageKey(entry.grade, entry.academicYear);
    const existing = byKey.get(key);
    if (hasFeeGridData(entry.feeGrid)) {
      byKey.set(key, entry);
    } else if (!existing || !hasFeeGridData(existing.feeGrid)) {
      byKey.set(key, entry);
    }
  }

  return [...byKey.values()].sort((a, b) => {
    const yearCmp = b.academicYear.localeCompare(a.academicYear);
    if (yearCmp !== 0) return yearCmp;
    return compareGrades(a.grade, b.grade);
  });
}

export function hydrateFeeConfiguration(
  schoolId: string,
  dbStructures: ClassFeeStructureEntry[] = []
): FeeConfiguration {
  const local = loadFeeConfiguration(schoolId);
  if (dbStructures.length === 0) return local;
  return {
    ...local,
    classStructures: mergeClassStructures(local.classStructures, dbStructures),
  };
}

export { gradeDisplayLabel, sortGrades, compareGrades };

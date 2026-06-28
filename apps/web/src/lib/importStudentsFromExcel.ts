import { buildPath, insertData, db, auth } from "@/lib/db-client";

export type StudentImportRow = {
  name: string;
  className: string;
  section: string;
  roll: string;
  status: "Active" | "Inactive";
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<string, keyof StudentImportRow> = {
  name: "name",
  studentname: "name",
  fullname: "name",
  student: "name",
  class: "className",
  classname: "className",
  grade: "className",
  classid: "className",
  section: "section",
  roll: "roll",
  rollno: "roll",
  rollnumber: "roll",
  formno: "roll",
  status: "status",
};

export function mapSheetRowsToStudents(
  rows: Record<string, unknown>[]
): StudentImportRow[] {
  const result: StudentImportRow[] = [];

  for (const row of rows) {
    const mapped: Partial<StudentImportRow> = {};
    for (const [key, val] of Object.entries(row)) {
      const field = HEADER_ALIASES[normalizeHeader(key)];
      if (!field || val === undefined || val === null) continue;
      const text = String(val).trim();
      if (!text) continue;
      mapped[field] = text as never;
    }

    const name =
      mapped.name ||
      [row.firstName, row.lastName, row.FirstName, row.LastName]
        .filter(Boolean)
        .map(String)
        .join(" ")
        .trim();

    if (!name) continue;

    const statusRaw = (mapped.status || "Active").toLowerCase();
    const status: "Active" | "Inactive" =
      statusRaw === "inactive" ? "Inactive" : "Active";

    result.push({
      name,
      className: mapped.className || "-",
      section: mapped.section || "-",
      roll: mapped.roll || "",
      status,
    });
  }

  return result;
}




export async function importStudents(
  schoolId: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  const mapped = mapSheetRowsToStudents(rows);
  if (mapped.length === 0) {
    throw new Error(
      "No valid student rows found. Include a Name column (or First Name / Last Name)."
    );
  }
  const createdAt = new Date().toISOString();
  const colRef = buildPath(db, "schools", schoolId, "students");
  for (const row of mapped) {
    await insertData(colRef, studentImportRowToRecord(row, createdAt));
  }
  return mapped.length;
}

export function studentImportRowToRecord(
  row: StudentImportRow,
  createdAt: string
): Record<string, unknown> {
  const parts = row.name.trim().split(/\s+/);
  const firstName = parts[0] || row.name;
  const lastName = parts.slice(1).join(" ");

  return {
    studentName: row.name,
    firstName,
    lastName,
    classId: row.className,
    section: row.section,
    rollNumber: row.roll || "",
    status: row.status,
    createdAt,
    attendance: { presentDates: [], absentDates: [], lateDates: [] },
  };
}

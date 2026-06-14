import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type StudentResult = { subject: string; score: number; grade: string };
type Student = { id: string; className: string; section: string; roll?: string; results?: StudentResult[] };

type SeedShape = {
  adminStudents: Student[];
};

type Payload = {
  grade: string;
  section: string;
  subject: string;
  exam?: string;
  rows: Array<{ studentId?: string; roll?: string; marks?: number | null }>;
};

function gradeForMarks(marks: number) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "F";
}

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const grade = String(body.grade || "").trim();
    const section = String(body.section || "").trim().toUpperCase();
    const subject = String(body.subject || "").trim();
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!grade || !section || !subject) {
      return NextResponse.json({ error: "Missing grade/section/subject" }, { status: 400 });
    }

    const { filePath, data } = await readSeed();
    const students = Array.isArray(data.adminStudents) ? data.adminStudents : [];

    const scopedStudents = students.filter(
      (s) => String(s.className) === grade && String(s.section).toUpperCase() === section
    );

    const marksById = new Map<string, number | null>();
    const marksByRoll = new Map<string, number | null>();

    rows.forEach((r) => {
      const id = r.studentId ? String(r.studentId).trim() : "";
      const roll = r.roll ? String(r.roll).trim() : "";
      const marks = typeof r.marks === "number" && Number.isFinite(r.marks) ? Math.max(0, Math.min(100, r.marks)) : null;
      if (id) marksById.set(id, marks);
      if (roll) marksByRoll.set(roll, marks);
    });

    const updated = students.map((s) => {
      const inScope = String(s.className) === grade && String(s.section).toUpperCase() === section;
      if (!inScope) return s;

      const existingResults = Array.isArray(s.results) ? s.results : [];
      const nextResults = existingResults.filter((r) => r.subject.toLowerCase() !== subject.toLowerCase());

      const mark =
        marksById.has(String(s.id)) ? marksById.get(String(s.id))! : s.roll && marksByRoll.has(String(s.roll)) ? marksByRoll.get(String(s.roll))! : null;

      if (mark === null) {
        return { ...s, results: nextResults };
      }

      const score = Math.max(0, Math.min(100, mark));
      nextResults.push({ subject, score, grade: gradeForMarks(score) });
      return { ...s, results: nextResults };
    });

    await writeSeed(filePath, { ...data, adminStudents: updated });

    return NextResponse.json({ ok: true, updatedCount: scopedStudents.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


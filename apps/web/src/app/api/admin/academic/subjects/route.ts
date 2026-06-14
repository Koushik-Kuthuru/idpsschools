import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

type PortionStatus = "Planned" | "In Progress" | "Completed";

type SubjectPortion = {
  title: string;
  chapters: string;
  from: string;
  to: string;
  status: PortionStatus;
};

type AcademicSubject = {
  id: string;
  grade: string;
  section: string;
  name: string;
  code: string;
  description: string;
  portions: SubjectPortion[];
};

type SeedShape = {
  academicSubjects?: AcademicSubject[];
};

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function normalizeSection(section: string) {
  return String(section || "").trim().toUpperCase();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const grade = url.searchParams.get("grade");
    const section = url.searchParams.get("section");
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const { data } = await readSeed();
    let subjects = Array.isArray(data.academicSubjects) ? data.academicSubjects : [];

    if (grade) subjects = subjects.filter((s) => String(s.grade) === String(grade));
    if (section) subjects = subjects.filter((s) => normalizeSection(s.section) === normalizeSection(section));
    if (q) {
      subjects = subjects.filter((s) => {
        return (
          String(s.name || "").toLowerCase().includes(q) ||
          String(s.code || "").toLowerCase().includes(q) ||
          String(s.id || "").toLowerCase().includes(q)
        );
      });
    }

    if (id) {
      const subject = subjects.find((s) => String(s.id) === String(id)) || null;
      return NextResponse.json({ subject });
    }

    return NextResponse.json({ subjects });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AcademicSubject>;
    const grade = String(body.grade || "").trim();
    const section = normalizeSection(String(body.section || ""));
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim();
    const description = String(body.description || "").trim();
    const portions = Array.isArray(body.portions) ? body.portions : [];

    if (!grade || !section || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = `SUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const nextSubject: AcademicSubject = {
      id,
      grade,
      section,
      name,
      code,
      description,
      portions: portions.map((p: any) => ({
        title: String(p.title || "").trim(),
        chapters: String(p.chapters || "").trim(),
        from: String(p.from || "").trim(),
        to: String(p.to || "").trim(),
        status: (String(p.status || "Planned") as PortionStatus),
      })),
    };

    const { filePath, data } = await readSeed();
    const subjects = Array.isArray(data.academicSubjects) ? data.academicSubjects : [];

    const exists = subjects.some((s) => String(s.grade) === grade && normalizeSection(s.section) === section && String(s.name).toLowerCase() === name.toLowerCase());
    if (exists) return NextResponse.json({ error: "Subject already exists for this class/section" }, { status: 409 });

    await writeSeed(filePath, { ...data, academicSubjects: [...subjects, nextSubject] });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = (await req.json()) as Partial<AcademicSubject>;

    const { filePath, data } = await readSeed();
    const subjects = Array.isArray(data.academicSubjects) ? data.academicSubjects : [];
    const idx = subjects.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const current = subjects[idx];
    const updated: AcademicSubject = {
      ...current,
      grade: body.grade !== undefined ? String(body.grade).trim() : current.grade,
      section: body.section !== undefined ? normalizeSection(String(body.section)) : current.section,
      name: body.name !== undefined ? String(body.name).trim() : current.name,
      code: body.code !== undefined ? String(body.code).trim() : current.code,
      description: body.description !== undefined ? String(body.description).trim() : current.description,
      portions: Array.isArray(body.portions)
        ? body.portions.map((p: any) => ({
            title: String(p.title || "").trim(),
            chapters: String(p.chapters || "").trim(),
            from: String(p.from || "").trim(),
            to: String(p.to || "").trim(),
            status: (String(p.status || "Planned") as PortionStatus),
          }))
        : current.portions,
    };

    const next = [...subjects];
    next[idx] = updated;
    await writeSeed(filePath, { ...data, academicSubjects: next });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


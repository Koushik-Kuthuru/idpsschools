import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type SectionRow = {
  section: string;
  strength: number;
  teacherCount: number;
  teacherInitials?: string[];
  status: "Active" | "Inactive";
  room?: string;
};

type GradeGroup = {
  grade: string;
  sections: SectionRow[];
};

type SeedShape = {
  seedCounts?: { students?: number; staff?: number; classes?: number };
  gradeCatalog?: string[];
  academicClasses?: GradeGroup[];
};

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function totalSections(classes: GradeGroup[]) {
  return classes.reduce((sum, g) => sum + (g.sections?.length || 0), 0);
}

export async function GET() {
  try {
    const { data } = await readSeed();
    return NextResponse.json({
      gradeCatalog: data.gradeCatalog || [],
      academicClasses: data.academicClasses || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      grade: string;
      section: string;
      room?: string;
      strength?: number;
      teacherCount?: number;
      status?: "Active" | "Inactive";
    };

    const grade = String(body.grade || "").trim();
    const section = String(body.section || "").trim();
    if (!grade || !section) {
      return NextResponse.json({ error: "Grade and section are required" }, { status: 400 });
    }

    const { filePath, data } = await readSeed();
    const list = Array.isArray(data.academicClasses) ? data.academicClasses : [];

    const normalizedSection = section.toUpperCase();
    const nextList = list.map((g) => ({ ...g, sections: Array.isArray(g.sections) ? g.sections : [] }));
    const existingGradeIndex = nextList.findIndex((g) => String(g.grade) === grade);

    const newSection: SectionRow = {
      section: normalizedSection,
      strength: Number.isFinite(body.strength) ? Number(body.strength) : 0,
      teacherCount: Number.isFinite(body.teacherCount) ? Number(body.teacherCount) : 0,
      status: body.status || "Active",
      room: body.room ? String(body.room) : "",
    };

    if (existingGradeIndex === -1) {
      nextList.push({ grade, sections: [newSection] });
    } else {
      const g = nextList[existingGradeIndex];
      const exists = g.sections.some((s) => String(s.section).toUpperCase() === normalizedSection);
      if (exists) {
        return NextResponse.json({ error: "Section already exists for this grade" }, { status: 409 });
      }
      nextList[existingGradeIndex] = { ...g, sections: [...g.sections, newSection] };
    }

    const nextSeed = {
      ...data,
      academicClasses: nextList,
      seedCounts: {
        ...(data.seedCounts || {}),
        classes: totalSections(nextList),
      },
    };

    await writeSeed(filePath, nextSeed);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


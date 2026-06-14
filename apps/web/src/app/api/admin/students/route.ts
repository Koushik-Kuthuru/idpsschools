import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type Payload = {
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  roll?: string;
  status?: "Active" | "Inactive";
  email?: string;
  phone?: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianEmail?: string;
  emergencyPhone: string;
};

type SeedShape = {
  seedCounts?: { students?: number; staff?: number; classes?: number };
  adminStudents: any[];
};

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const grade = url.searchParams.get("grade");
    const section = url.searchParams.get("section");

    const { data } = await readSeed();
    let students = Array.isArray(data.adminStudents) ? data.adminStudents : [];

    if (grade) students = students.filter((s) => String(s.className) === String(grade));
    if (section) students = students.filter((s) => String(s.section).toUpperCase() === String(section).toUpperCase());

    if (id) {
      const found = students.find((s) => String(s.id) === String(id));
      return NextResponse.json({ student: found || null });
    }

    return NextResponse.json({ students });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const {
      firstName,
      lastName,
      grade,
      section,
      roll = "",
      status = "Active",
      email = "",
      phone = "",
      gender,
      guardianName,
      guardianEmail = "",
      emergencyPhone,
    } = body;

    if (!firstName || !lastName || !grade || !section || !guardianName || !emergencyPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const genderTitle = gender === "female" ? "Female" : gender === "male" ? "Male" : "Other";
    const year = new Date().getFullYear();
    const normalizedSection = String(section).toUpperCase();

    const idPrefix = `STU-${year}-`;
    const { filePath, data } = await readSeed();
    const students = Array.isArray(data.adminStudents) ? data.adminStudents : [];

    const nums = students
      .map((s) => String(s.id || ""))
      .map((v) => {
        const m = v.match(/^STU-(\d{4})-(\d+)$/);
        return m ? Number(m[2]) : 0;
      })
      .filter((n) => Number.isFinite(n));
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
    const padded = String(nextNum).padStart(3, "0");

    const newStudent = {
      id: `${idPrefix}${padded}`,
      enrollmentId: `${year}-${padded}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      className: String(grade),
      section: normalizedSection,
      roll: String(roll || ""),
      status,
      attendance: 0,
      email: String(email || ""),
      phone: String(phone || ""),
      gender: genderTitle,
      gpa: "0.0/4.0",
      guardians: {
        father: { name: String(guardianName), phone: String(emergencyPhone), email: String(guardianEmail || "") },
        mother: { name: "", phone: "", email: "" }
      },
      results: []
    };

    const nextSeed = {
      ...data,
      adminStudents: [...students, newStudent],
      seedCounts: {
        ...(data.seedCounts || {}),
        students: [...students, newStudent].length
      }
    };

    await writeSeed(filePath, nextSeed);

    return NextResponse.json({ ok: true, id: newStudent.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<Payload> & {
      status?: "Active" | "Inactive";
    };

    const { filePath, data } = await readSeed();
    const students = Array.isArray(data.adminStudents) ? data.adminStudents : [];
    const idx = students.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const current = students[idx];
    const nextGrade = body.grade !== undefined ? String(body.grade) : String(current.className || "");
    const nextSectionRaw = body.section !== undefined ? String(body.section) : String(current.section || "");
    const nextSection = nextSectionRaw.toUpperCase();

    const nextName =
      body.firstName !== undefined || body.lastName !== undefined
        ? `${String(body.firstName || "").trim()} ${String(body.lastName || "").trim()}`.trim()
        : String(current.name || "");

    const status = body.status || current.status || "Active";
    const genderTitle = body.gender ? (body.gender === "female" ? "Female" : body.gender === "male" ? "Male" : "Other") : current.gender;

    const guardianName = body.guardianName !== undefined ? String(body.guardianName) : String(current?.guardians?.father?.name || "");
    const guardianEmail = body.guardianEmail !== undefined ? String(body.guardianEmail) : String(current?.guardians?.father?.email || "");
    const emergencyPhone = body.emergencyPhone !== undefined ? String(body.emergencyPhone) : String(current?.guardians?.father?.phone || "");

    const updatedStudent = {
      ...current,
      name: nextName,
      className: nextGrade,
      section: nextSection,
      roll: body.roll !== undefined ? String(body.roll || "") : String(current.roll || ""),
      status,
      email: body.email !== undefined ? String(body.email || "") : String(current.email || ""),
      phone: body.phone !== undefined ? String(body.phone || "") : String(current.phone || ""),
      gender: genderTitle,
      guardians: {
        ...(current.guardians || {}),
        father: {
          ...(current?.guardians?.father || { name: "", phone: "", email: "" }),
          name: guardianName,
          phone: emergencyPhone,
          email: guardianEmail,
        },
      },
    };

    const nextStudents = [...students];
    nextStudents[idx] = updatedStudent;

    const nextSeed = {
      ...data,
      adminStudents: nextStudents,
      seedCounts: {
        ...(data.seedCounts || {}),
        students: nextStudents.length,
      },
    };

    await writeSeed(filePath, nextSeed);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

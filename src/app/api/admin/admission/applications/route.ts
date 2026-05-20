import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type ApplicationStatus = "Submitted" | "Verification" | "Selected";

type AdmissionApplication = {
  id: string;
  name: string;
  grade: string;
  status: ApplicationStatus;
  date: string;
};

type SeedShape = { admissionApplications?: AdmissionApplication[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as ApplicationStatus | null;
    const grade = url.searchParams.get("grade");
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let applications = Array.isArray(data.admissionApplications) ? data.admissionApplications : [];

    if (status) applications = applications.filter((a) => String(a.status) === String(status));
    if (grade) applications = applications.filter((a) => String(a.grade) === String(grade));
    if (q) applications = applications.filter((a) => String(a.id).toLowerCase().includes(q) || String(a.name).toLowerCase().includes(q));

    if (id) {
      const application = applications.find((a) => String(a.id) === String(id)) || null;
      return NextResponse.json({ application });
    }

    return NextResponse.json({ applications });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AdmissionApplication>;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const grade = String(body.grade || "").trim();
    const status = (body.status || "Submitted") as ApplicationStatus;
    const date = String(body.date || "").trim();

    if (!id || !name || !grade) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const applications = Array.isArray(data.admissionApplications) ? data.admissionApplications : [];
    if (applications.some((a) => String(a.id) === id)) return NextResponse.json({ error: "Application already exists" }, { status: 409 });

    const next: AdmissionApplication = { id, name, grade, status, date };
    await writeSeed(filePath, { ...data, admissionApplications: [...applications, next] });
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

    const body = (await req.json()) as Partial<AdmissionApplication>;
    const { filePath, data } = await readSeed<SeedShape>();
    const applications = Array.isArray(data.admissionApplications) ? data.admissionApplications : [];
    const idx = applications.findIndex((a) => String(a.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const cur = applications[idx];
    const next: AdmissionApplication = {
      ...cur,
      name: body.name !== undefined ? String(body.name) : cur.name,
      grade: body.grade !== undefined ? String(body.grade) : cur.grade,
      status: body.status !== undefined ? (body.status as ApplicationStatus) : cur.status,
      date: body.date !== undefined ? String(body.date) : cur.date,
    };

    const updated = [...applications];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, admissionApplications: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

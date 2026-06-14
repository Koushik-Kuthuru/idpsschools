import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type EnquiryStatus = "Pending" | "Scheduled" | "Converted";

type AdmissionEnquiry = {
  id: string;
  parentName: string;
  studentName: string;
  grade: string;
  email: string;
  phone: string;
  status: EnquiryStatus;
  date: string;
  time: string;
};

type SeedShape = { admissionEnquiries?: AdmissionEnquiry[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as EnquiryStatus | null;
    const grade = url.searchParams.get("grade");
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let enquiries = Array.isArray(data.admissionEnquiries) ? data.admissionEnquiries : [];

    if (status) enquiries = enquiries.filter((e) => String(e.status) === String(status));
    if (grade) enquiries = enquiries.filter((e) => String(e.grade) === String(grade));
    if (q) enquiries = enquiries.filter((e) => String(e.id).toLowerCase().includes(q) || String(e.parentName).toLowerCase().includes(q) || String(e.studentName).toLowerCase().includes(q) || String(e.email).toLowerCase().includes(q));

    if (id) {
      const enquiry = enquiries.find((e) => String(e.id) === String(id)) || null;
      return NextResponse.json({ enquiry });
    }

    return NextResponse.json({ enquiries });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AdmissionEnquiry>;
    const id = String(body.id || "").trim();
    const parentName = String(body.parentName || "").trim();
    const studentName = String(body.studentName || "").trim();
    const grade = String(body.grade || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const status = (body.status || "Pending") as EnquiryStatus;
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();

    if (!id || !parentName || !studentName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const enquiries = Array.isArray(data.admissionEnquiries) ? data.admissionEnquiries : [];
    if (enquiries.some((e) => String(e.id) === id)) return NextResponse.json({ error: "Enquiry already exists" }, { status: 409 });

    const next: AdmissionEnquiry = { id, parentName, studentName, grade, email, phone, status, date, time };
    await writeSeed(filePath, { ...data, admissionEnquiries: [...enquiries, next] });
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

    const body = (await req.json()) as Partial<AdmissionEnquiry>;
    const { filePath, data } = await readSeed<SeedShape>();
    const enquiries = Array.isArray(data.admissionEnquiries) ? data.admissionEnquiries : [];
    const idx = enquiries.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

    const cur = enquiries[idx];
    const next: AdmissionEnquiry = {
      ...cur,
      parentName: body.parentName !== undefined ? String(body.parentName) : cur.parentName,
      studentName: body.studentName !== undefined ? String(body.studentName) : cur.studentName,
      grade: body.grade !== undefined ? String(body.grade) : cur.grade,
      email: body.email !== undefined ? String(body.email) : cur.email,
      phone: body.phone !== undefined ? String(body.phone) : cur.phone,
      status: body.status !== undefined ? (body.status as EnquiryStatus) : cur.status,
      date: body.date !== undefined ? String(body.date) : cur.date,
      time: body.time !== undefined ? String(body.time) : cur.time,
    };

    const updated = [...enquiries];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, admissionEnquiries: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

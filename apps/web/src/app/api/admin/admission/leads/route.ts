import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type LeadStatus = "Qualified" | "Converted" | "Pending" | "Lost";
type LeadSource = "Website" | "Referral" | "Phone";

type AdmissionLead = {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
};

type SeedShape = { admissionLeads?: AdmissionLead[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as LeadStatus | null;
    const source = url.searchParams.get("source") as LeadSource | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let leads = Array.isArray(data.admissionLeads) ? data.admissionLeads : [];

    if (status) leads = leads.filter((l) => String(l.status) === String(status));
    if (source) leads = leads.filter((l) => String(l.source) === String(source));
    if (q) leads = leads.filter((l) => String(l.id).toLowerCase().includes(q) || String(l.studentName).toLowerCase().includes(q) || String(l.parentName).toLowerCase().includes(q));

    if (id) {
      const lead = leads.find((l) => String(l.id) === String(id)) || null;
      return NextResponse.json({ lead });
    }

    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AdmissionLead>;
    const id = String(body.id || "").trim();
    const studentName = String(body.studentName || "").trim();
    const parentName = String(body.parentName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const source = (body.source || "Website") as LeadSource;
    const status = (body.status || "Pending") as LeadStatus;

    if (!id || !studentName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const leads = Array.isArray(data.admissionLeads) ? data.admissionLeads : [];
    if (leads.some((l) => String(l.id) === id)) return NextResponse.json({ error: "Lead already exists" }, { status: 409 });

    const next: AdmissionLead = { id, studentName, parentName, email, phone, source, status };
    await writeSeed(filePath, { ...data, admissionLeads: [...leads, next] });
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

    const body = (await req.json()) as Partial<AdmissionLead>;
    const { filePath, data } = await readSeed<SeedShape>();
    const leads = Array.isArray(data.admissionLeads) ? data.admissionLeads : [];
    const idx = leads.findIndex((l) => String(l.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const cur = leads[idx];
    const next: AdmissionLead = {
      ...cur,
      studentName: body.studentName !== undefined ? String(body.studentName) : cur.studentName,
      parentName: body.parentName !== undefined ? String(body.parentName) : cur.parentName,
      email: body.email !== undefined ? String(body.email) : cur.email,
      phone: body.phone !== undefined ? String(body.phone) : cur.phone,
      source: body.source !== undefined ? (body.source as LeadSource) : cur.source,
      status: body.status !== undefined ? (body.status as LeadStatus) : cur.status,
    };

    const updated = [...leads];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, admissionLeads: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


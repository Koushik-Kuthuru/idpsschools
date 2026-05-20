import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type InvoiceStatus = "Paid" | "Pending" | "Overdue";

type FinanceInvoice = {
  id: string;
  student: string;
  grade: string;
  section: string;
  amount: number;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
};

type SeedShape = {
  financeInvoices?: FinanceInvoice[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as InvoiceStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const grade = url.searchParams.get("grade");
    const section = url.searchParams.get("section");

    const { data } = await readSeed<SeedShape>();
    let invoices = Array.isArray(data.financeInvoices) ? data.financeInvoices : [];

    if (status) invoices = invoices.filter((x) => String(x.status) === String(status));
    if (grade) invoices = invoices.filter((x) => String(x.grade) === String(grade));
    if (section) invoices = invoices.filter((x) => String(x.section).toUpperCase() === String(section).toUpperCase());
    if (q) invoices = invoices.filter((x) => String(x.id).toLowerCase().includes(q) || String(x.student).toLowerCase().includes(q));

    if (id) {
      const invoice = invoices.find((x) => String(x.id) === String(id)) || null;
      return NextResponse.json({ invoice });
    }

    return NextResponse.json({ invoices });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FinanceInvoice>;
    const id = String(body.id || "").trim();
    const student = String(body.student || "").trim();
    const grade = String(body.grade || "").trim();
    const section = String(body.section || "").trim().toUpperCase();
    const amount = Number(body.amount || 0);
    const date = String(body.date || "").trim();
    const dueDate = String(body.dueDate || "").trim();
    const status = (body.status || "Pending") as InvoiceStatus;

    if (!id || !student || !grade || !section) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const invoices = Array.isArray(data.financeInvoices) ? data.financeInvoices : [];
    if (invoices.some((x) => String(x.id) === id)) return NextResponse.json({ error: "Invoice already exists" }, { status: 409 });

    const next: FinanceInvoice = { id, student, grade, section, amount, date, dueDate, status };
    await writeSeed(filePath, { ...data, financeInvoices: [...invoices, next] });
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

    const body = (await req.json()) as Partial<FinanceInvoice>;
    const { filePath, data } = await readSeed<SeedShape>();
    const invoices = Array.isArray(data.financeInvoices) ? data.financeInvoices : [];
    const idx = invoices.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const cur = invoices[idx];
    const next: FinanceInvoice = {
      ...cur,
      student: body.student !== undefined ? String(body.student) : cur.student,
      grade: body.grade !== undefined ? String(body.grade) : cur.grade,
      section: body.section !== undefined ? String(body.section).toUpperCase() : cur.section,
      amount: body.amount !== undefined ? Number(body.amount) : cur.amount,
      date: body.date !== undefined ? String(body.date) : cur.date,
      dueDate: body.dueDate !== undefined ? String(body.dueDate) : cur.dueDate,
      status: body.status !== undefined ? (body.status as InvoiceStatus) : cur.status,
    };

    const updated = [...invoices];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, financeInvoices: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


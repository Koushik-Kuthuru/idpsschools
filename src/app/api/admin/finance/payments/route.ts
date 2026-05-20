import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type PaymentStatus = "Completed" | "Pending" | "Processing" | "Failed";

type FinancePayment = {
  id: string;
  student: string;
  invoiceId: string;
  amount: number;
  mode: string;
  status: PaymentStatus;
  date: string;
};

type SeedShape = {
  financePayments?: FinancePayment[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as PaymentStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let payments = Array.isArray(data.financePayments) ? data.financePayments : [];

    if (status) payments = payments.filter((x) => String(x.status) === String(status));
    if (q) payments = payments.filter((x) => String(x.id).toLowerCase().includes(q) || String(x.student).toLowerCase().includes(q) || String(x.invoiceId).toLowerCase().includes(q));

    if (id) {
      const payment = payments.find((x) => String(x.id) === String(id)) || null;
      return NextResponse.json({ payment });
    }

    return NextResponse.json({ payments });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FinancePayment>;
    const id = String(body.id || "").trim();
    const student = String(body.student || "").trim();
    const invoiceId = String(body.invoiceId || "").trim();
    const amount = Number(body.amount || 0);
    const mode = String(body.mode || "").trim();
    const status = (body.status || "Pending") as PaymentStatus;
    const date = String(body.date || "").trim();

    if (!id || !student || !invoiceId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const payments = Array.isArray(data.financePayments) ? data.financePayments : [];
    if (payments.some((x) => String(x.id) === id)) return NextResponse.json({ error: "Payment already exists" }, { status: 409 });

    const next: FinancePayment = { id, student, invoiceId, amount, mode, status, date };
    await writeSeed(filePath, { ...data, financePayments: [...payments, next] });
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

    const body = (await req.json()) as Partial<FinancePayment>;
    const { filePath, data } = await readSeed<SeedShape>();
    const payments = Array.isArray(data.financePayments) ? data.financePayments : [];
    const idx = payments.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    const cur = payments[idx];
    const next: FinancePayment = {
      ...cur,
      student: body.student !== undefined ? String(body.student) : cur.student,
      invoiceId: body.invoiceId !== undefined ? String(body.invoiceId) : cur.invoiceId,
      amount: body.amount !== undefined ? Number(body.amount) : cur.amount,
      mode: body.mode !== undefined ? String(body.mode) : cur.mode,
      status: body.status !== undefined ? (body.status as PaymentStatus) : cur.status,
      date: body.date !== undefined ? String(body.date) : cur.date,
    };

    const updated = [...payments];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, financePayments: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

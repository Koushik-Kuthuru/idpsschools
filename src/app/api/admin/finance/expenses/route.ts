import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type ExpenseStatus = "Paid" | "Pending";

type FinanceExpense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  vendor: string;
};

type SeedShape = {
  financeExpenses?: FinanceExpense[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status") as ExpenseStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let expenses = Array.isArray(data.financeExpenses) ? data.financeExpenses : [];

    if (category) expenses = expenses.filter((x) => String(x.category) === String(category));
    if (status) expenses = expenses.filter((x) => String(x.status) === String(status));
    if (q) expenses = expenses.filter((x) => String(x.id).toLowerCase().includes(q) || String(x.title).toLowerCase().includes(q) || String(x.vendor).toLowerCase().includes(q));

    if (id) {
      const expense = expenses.find((x) => String(x.id) === String(id)) || null;
      return NextResponse.json({ expense });
    }

    return NextResponse.json({ expenses });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FinanceExpense>;
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const category = String(body.category || "").trim();
    const amount = Number(body.amount || 0);
    const date = String(body.date || "").trim();
    const vendor = String(body.vendor || "").trim();
    const status = (body.status || "Pending") as ExpenseStatus;

    if (!id || !title || !category) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const expenses = Array.isArray(data.financeExpenses) ? data.financeExpenses : [];
    if (expenses.some((x) => String(x.id) === id)) return NextResponse.json({ error: "Expense already exists" }, { status: 409 });

    const next: FinanceExpense = { id, title, category, amount, date, status, vendor };
    await writeSeed(filePath, { ...data, financeExpenses: [...expenses, next] });
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

    const body = (await req.json()) as Partial<FinanceExpense>;
    const { filePath, data } = await readSeed<SeedShape>();
    const expenses = Array.isArray(data.financeExpenses) ? data.financeExpenses : [];
    const idx = expenses.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const cur = expenses[idx];
    const next: FinanceExpense = {
      ...cur,
      title: body.title !== undefined ? String(body.title) : cur.title,
      category: body.category !== undefined ? String(body.category) : cur.category,
      amount: body.amount !== undefined ? Number(body.amount) : cur.amount,
      date: body.date !== undefined ? String(body.date) : cur.date,
      vendor: body.vendor !== undefined ? String(body.vendor) : cur.vendor,
      status: body.status !== undefined ? (body.status as ExpenseStatus) : cur.status,
    };

    const updated = [...expenses];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, financeExpenses: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


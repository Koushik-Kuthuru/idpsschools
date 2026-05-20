import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type PayrollStatus = "Pending" | "Processed";

type PayrollRow = {
  id: string;
  employeeId: string;
  employee: string;
  role: string;
  salary: number;
  tds: number;
  deduct: number;
  net: number;
  status: PayrollStatus;
  period: string;
};

type SeedShape = { financePayroll?: PayrollRow[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const period = url.searchParams.get("period");
    const status = url.searchParams.get("status") as PayrollStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let payroll = Array.isArray(data.financePayroll) ? data.financePayroll : [];

    if (period) payroll = payroll.filter((p) => String(p.period) === String(period));
    if (status) payroll = payroll.filter((p) => String(p.status) === String(status));
    if (q) payroll = payroll.filter((p) => String(p.employeeId).toLowerCase().includes(q) || String(p.employee).toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q));

    if (id) {
      const row = payroll.find((p) => String(p.id) === String(id)) || null;
      return NextResponse.json({ payroll: row });
    }

    return NextResponse.json({ payroll });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PayrollRow>;
    const id = String(body.id || "").trim();
    const employeeId = String(body.employeeId || "").trim();
    const employee = String(body.employee || "").trim();
    const role = String(body.role || "").trim();
    const salary = Number(body.salary || 0);
    const tds = Number(body.tds || 0);
    const deduct = Number(body.deduct || 0);
    const net = Number(body.net || 0);
    const status = (body.status || "Pending") as PayrollStatus;
    const period = String(body.period || "").trim();

    if (!id || !employeeId || !employee) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const payroll = Array.isArray(data.financePayroll) ? data.financePayroll : [];
    if (payroll.some((p) => String(p.id) === id)) return NextResponse.json({ error: "Payroll row already exists" }, { status: 409 });

    const next: PayrollRow = { id, employeeId, employee, role, salary, tds, deduct, net, status, period };
    await writeSeed(filePath, { ...data, financePayroll: [...payroll, next] });
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

    const body = (await req.json()) as Partial<PayrollRow>;
    const { filePath, data } = await readSeed<SeedShape>();
    const payroll = Array.isArray(data.financePayroll) ? data.financePayroll : [];
    const idx = payroll.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Payroll row not found" }, { status: 404 });

    const cur = payroll[idx];
    const next: PayrollRow = {
      ...cur,
      employeeId: body.employeeId !== undefined ? String(body.employeeId) : cur.employeeId,
      employee: body.employee !== undefined ? String(body.employee) : cur.employee,
      role: body.role !== undefined ? String(body.role) : cur.role,
      salary: body.salary !== undefined ? Number(body.salary) : cur.salary,
      tds: body.tds !== undefined ? Number(body.tds) : cur.tds,
      deduct: body.deduct !== undefined ? Number(body.deduct) : cur.deduct,
      net: body.net !== undefined ? Number(body.net) : cur.net,
      status: body.status !== undefined ? (body.status as PayrollStatus) : cur.status,
      period: body.period !== undefined ? String(body.period) : cur.period,
    };

    const updated = [...payroll];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, financePayroll: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


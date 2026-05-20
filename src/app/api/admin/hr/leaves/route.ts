import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type LeaveStatus = "Pending" | "Approved" | "Rejected";

type HrLeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
};

type SeedShape = {
  hrLeaveRequests?: HrLeaveRequest[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as LeaveStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let leaves = Array.isArray(data.hrLeaveRequests) ? data.hrLeaveRequests : [];

    if (status) leaves = leaves.filter((x) => String(x.status) === String(status));
    if (q) leaves = leaves.filter((x) => String(x.id).toLowerCase().includes(q) || String(x.employeeName).toLowerCase().includes(q) || String(x.employeeId).toLowerCase().includes(q));

    if (id) {
      const leave = leaves.find((x) => String(x.id) === String(id)) || null;
      return NextResponse.json({ leave });
    }

    return NextResponse.json({ leaves });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<HrLeaveRequest>;
    const id = String(body.id || "").trim();
    const employeeId = String(body.employeeId || "").trim();
    const employeeName = String(body.employeeName || "").trim();
    const type = String(body.type || "").trim();
    const from = String(body.from || "").trim();
    const to = String(body.to || "").trim();
    const days = Number(body.days || 0);
    const status = (body.status || "Pending") as LeaveStatus;

    if (!id || !employeeId || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const leaves = Array.isArray(data.hrLeaveRequests) ? data.hrLeaveRequests : [];
    if (leaves.some((x) => String(x.id) === id)) return NextResponse.json({ error: "Leave request already exists" }, { status: 409 });

    const next: HrLeaveRequest = { id, employeeId, employeeName, type, from, to, days, status };
    await writeSeed(filePath, { ...data, hrLeaveRequests: [...leaves, next] });
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

    const body = (await req.json()) as Partial<HrLeaveRequest>;
    const { filePath, data } = await readSeed<SeedShape>();
    const leaves = Array.isArray(data.hrLeaveRequests) ? data.hrLeaveRequests : [];
    const idx = leaves.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const cur = leaves[idx];
    const next: HrLeaveRequest = {
      ...cur,
      employeeId: body.employeeId !== undefined ? String(body.employeeId) : cur.employeeId,
      employeeName: body.employeeName !== undefined ? String(body.employeeName) : cur.employeeName,
      type: body.type !== undefined ? String(body.type) : cur.type,
      from: body.from !== undefined ? String(body.from) : cur.from,
      to: body.to !== undefined ? String(body.to) : cur.to,
      days: body.days !== undefined ? Number(body.days) : cur.days,
      status: body.status !== undefined ? (body.status as LeaveStatus) : cur.status,
    };

    const updated = [...leaves];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, hrLeaveRequests: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


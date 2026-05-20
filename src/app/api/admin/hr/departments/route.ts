import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type DepartmentStatus = "Active" | "Inactive";

type HrDepartment = {
  id: string;
  name: string;
  hodName: string;
  staffCount: number;
  status: DepartmentStatus;
};

type SeedShape = {
  hrDepartments?: HrDepartment[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const status = url.searchParams.get("status") as DepartmentStatus | null;

    const { data } = await readSeed<SeedShape>();
    let departments = Array.isArray(data.hrDepartments) ? data.hrDepartments : [];

    if (status) departments = departments.filter((d) => String(d.status) === String(status));
    if (q) departments = departments.filter((d) => String(d.id).toLowerCase().includes(q) || String(d.name).toLowerCase().includes(q) || String(d.hodName).toLowerCase().includes(q));

    if (id) {
      const department = departments.find((d) => String(d.id) === String(id)) || null;
      return NextResponse.json({ department });
    }

    return NextResponse.json({ departments });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<HrDepartment>;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const hodName = String(body.hodName || "").trim();
    const staffCount = Number(body.staffCount || 0);
    const status = (body.status || "Active") as DepartmentStatus;

    if (!id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const departments = Array.isArray(data.hrDepartments) ? data.hrDepartments : [];
    if (departments.some((d) => String(d.id) === id)) return NextResponse.json({ error: "Department already exists" }, { status: 409 });

    const next: HrDepartment = { id, name, hodName, staffCount, status };
    await writeSeed(filePath, { ...data, hrDepartments: [...departments, next] });
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

    const body = (await req.json()) as Partial<HrDepartment>;
    const { filePath, data } = await readSeed<SeedShape>();
    const departments = Array.isArray(data.hrDepartments) ? data.hrDepartments : [];
    const idx = departments.findIndex((d) => String(d.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const cur = departments[idx];
    const next: HrDepartment = {
      ...cur,
      name: body.name !== undefined ? String(body.name) : cur.name,
      hodName: body.hodName !== undefined ? String(body.hodName) : cur.hodName,
      staffCount: body.staffCount !== undefined ? Number(body.staffCount) : cur.staffCount,
      status: body.status !== undefined ? (body.status as DepartmentStatus) : cur.status,
    };

    const updated = [...departments];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, hrDepartments: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type EmployeeStatus = "Active" | "On Leave" | "Inactive";

type LeaveBalance = {
  label: string;
  total: number;
  availed: number;
};

type EmployeeClassLoad = {
  classSection: string;
  subject: string;
  students: number;
  capacity: number;
  weeklyHours: number;
};

type AdminEmployee = {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  employmentType: string;
  reportsTo: string;
  experienceYears: number;
  baseSalaryMonthlyInr: number;
  qualifications: string[];
  joinedDate: string;
  leaveYear: string;
  leaveBalances: LeaveBalance[];
  academicSessionLabel: string;
  classLoads: EmployeeClassLoad[];
};

type SeedShape = {
  seedCounts?: { students?: number; staff?: number; classes?: number };
  seedStaffAvailability?: { present: number; total: number; onLeaveToday: Array<{ initials: string; name: string; reason: string }> };
  adminEmployees?: AdminEmployee[];
};

type Payload = Partial<Omit<AdminEmployee, "leaveBalances" | "classLoads" | "qualifications">> & {
  id?: string;
  status?: EmployeeStatus;
  qualifications?: string[];
};

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function computeStaffAvailability(employees: AdminEmployee[]) {
  const total = employees.length;
  const present = employees.filter((e) => e.status === "Active").length;
  const onLeaveToday = employees
    .filter((e) => e.status === "On Leave")
    .slice(0, 6)
    .map((e) => ({ initials: initialsFromName(e.name), name: e.name, reason: "On Leave" }));
  return { present, total, onLeaveToday };
}

function isTeachingEmployee(e: AdminEmployee) {
  const role = String(e.roleTitle || "").toLowerCase();
  const dept = String(e.department || "").toLowerCase();
  return (
    role.includes("teacher") ||
    role.includes("tutor") ||
    role.includes("professor") ||
    role.includes("lecturer") ||
    role.includes("faculty") ||
    dept === "academic" ||
    dept === "academics"
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const department = url.searchParams.get("department");
    const status = url.searchParams.get("status") as EmployeeStatus | null;
    const category = (url.searchParams.get("category") || "").toLowerCase();
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed();
    let employees = Array.isArray(data.adminEmployees) ? data.adminEmployees : [];

    if (category === "teaching") employees = employees.filter(isTeachingEmployee);
    if (category === "non-teaching" || category === "nonteaching") employees = employees.filter((e) => !isTeachingEmployee(e));
    if (department) employees = employees.filter((e) => String(e.department) === String(department));
    if (status) employees = employees.filter((e) => String(e.status) === String(status));
    if (q) {
      employees = employees.filter((e) => {
        return (
          String(e.name || "").toLowerCase().includes(q) ||
          String(e.id || "").toLowerCase().includes(q) ||
          String(e.roleTitle || "").toLowerCase().includes(q) ||
          String(e.email || "").toLowerCase().includes(q)
        );
      });
    }

    if (id) {
      const found = employees.find((e) => String(e.id) === String(id));
      return NextResponse.json({ employee: found || null });
    }

    return NextResponse.json({ employees });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const roleTitle = String(body.roleTitle || "").trim();
    const department = String(body.department || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const status = (body.status || "Active") as EmployeeStatus;

    if (!id || !name || !roleTitle || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { filePath, data } = await readSeed();
    const employees = Array.isArray(data.adminEmployees) ? data.adminEmployees : [];
    if (employees.some((e) => String(e.id) === id)) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
    }

    const newEmployee: AdminEmployee = {
      id,
      name,
      roleTitle,
      department,
      email,
      phone,
      status,
      employmentType: String(body.employmentType || "Full-time Regular"),
      reportsTo: String(body.reportsTo || ""),
      experienceYears: Number.isFinite(body.experienceYears) ? Number(body.experienceYears) : 0,
      baseSalaryMonthlyInr: Number.isFinite(body.baseSalaryMonthlyInr) ? Number(body.baseSalaryMonthlyInr) : 0,
      qualifications: Array.isArray(body.qualifications) ? body.qualifications.map((q) => String(q)) : [],
      joinedDate: String(body.joinedDate || ""),
      leaveYear: String(body.leaveYear || String(new Date().getFullYear())),
      leaveBalances: [],
      academicSessionLabel: String(body.academicSessionLabel || ""),
      classLoads: [],
    };

    const nextEmployees = [...employees, newEmployee];
    const staffAvailability = computeStaffAvailability(nextEmployees);

    const nextSeed: SeedShape = {
      ...data,
      adminEmployees: nextEmployees,
      seedCounts: { ...(data.seedCounts || {}), staff: nextEmployees.length },
      seedStaffAvailability: staffAvailability,
    };

    await writeSeed(filePath, nextSeed);
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

    const body = (await req.json()) as Payload;

    const { filePath, data } = await readSeed();
    const employees = Array.isArray(data.adminEmployees) ? data.adminEmployees : [];
    const idx = employees.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const current = employees[idx];
    const updated: AdminEmployee = {
      ...current,
      name: body.name !== undefined ? String(body.name) : current.name,
      roleTitle: body.roleTitle !== undefined ? String(body.roleTitle) : current.roleTitle,
      department: body.department !== undefined ? String(body.department) : current.department,
      email: body.email !== undefined ? String(body.email) : current.email,
      phone: body.phone !== undefined ? String(body.phone) : current.phone,
      status: body.status !== undefined ? (body.status as EmployeeStatus) : current.status,
      employmentType: body.employmentType !== undefined ? String(body.employmentType) : current.employmentType,
      reportsTo: body.reportsTo !== undefined ? String(body.reportsTo) : current.reportsTo,
      experienceYears: body.experienceYears !== undefined && Number.isFinite(body.experienceYears) ? Number(body.experienceYears) : current.experienceYears,
      baseSalaryMonthlyInr:
        body.baseSalaryMonthlyInr !== undefined && Number.isFinite(body.baseSalaryMonthlyInr) ? Number(body.baseSalaryMonthlyInr) : current.baseSalaryMonthlyInr,
      qualifications: Array.isArray(body.qualifications) ? body.qualifications.map((q) => String(q)) : current.qualifications,
      joinedDate: body.joinedDate !== undefined ? String(body.joinedDate) : current.joinedDate,
      academicSessionLabel: body.academicSessionLabel !== undefined ? String(body.academicSessionLabel) : current.academicSessionLabel,
    };

    const nextEmployees = [...employees];
    nextEmployees[idx] = updated;
    const staffAvailability = computeStaffAvailability(nextEmployees);

    const nextSeed: SeedShape = {
      ...data,
      adminEmployees: nextEmployees,
      seedCounts: { ...(data.seedCounts || {}), staff: nextEmployees.length },
      seedStaffAvailability: staffAvailability,
    };

    await writeSeed(filePath, nextSeed);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

import { redirect } from "next/navigation";
import path from "path";
import { promises as fs } from "fs";

type AdminEmployee = { id: string; roleTitle: string; department: string };

function isTeachingEmployee(e: AdminEmployee) {
 const role = String(e.roleTitle || "").toLowerCase();
 const dept = String(e.department || "").toLowerCase();
 return role.includes("teacher") || role.includes("tutor") || role.includes("professor") || role.includes("lecturer") || role.includes("faculty") || dept === "academic" || dept === "academics";
}

async function getEmployee(id: string) {
 const filePath = path.join(process.cwd(), "src", "data", "seed.json");
 const raw = await fs.readFile(filePath, "utf8");
 const data = JSON.parse(raw) as any;
 const employees = Array.isArray(data.adminEmployees) ? (data.adminEmployees as AdminEmployee[]) : [];
 return employees.find((e) => String(e.id) === String(id)) || null;
}

export default async function AdminStaffLegacyProfileRedirectPage({ params }: { params: { id: string } }) {
 const id = decodeURIComponent(params.id);
 const employee = await getEmployee(id);
 const base = employee && isTeachingEmployee(employee) ? "/idpskalaburagi/hr/teaching-staff" : "/idpskalaburagi/hr/non-teaching-staff";
 redirect(`${base}/${encodeURIComponent(id)}/profile`);
}


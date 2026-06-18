import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AdminEmployee = { id: string; roleTitle: string; department: string };

function isTeachingEmployee(e: AdminEmployee) {
 const role = String(e.roleTitle || "").toLowerCase();
 const dept = String(e.department || "").toLowerCase();
 return role.includes("teacher") || role.includes("tutor") || role.includes("professor") || role.includes("lecturer") || role.includes("faculty") || dept === "academic" || dept === "academics";
}

async function getEmployee(id: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_profiles")
    .select("id, role, department")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return { id: data.id, roleTitle: data.role, department: data.department };
}

export default async function AdminStaffLegacyProfileRedirectPage({
  params,
}: {
  params: Promise<{ schoolId: string; id: string }>;
}) {
  const { id: rawId } = await params;
  const schoolId = "idpscherukupalli";
  const id = decodeURIComponent(rawId);
  const employee = await getEmployee(id);
  const base =
    employee && isTeachingEmployee(employee)
      ? `/schools/${schoolId}/hr/teaching-staff`
      : `/schools/${schoolId}/hr/non-teaching-staff`;
  redirect(`${base}/${encodeURIComponent(id)}/profile`);
}


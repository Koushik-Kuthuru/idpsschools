"use client";

import Link from "next/link";
import { useRouteParam } from "@/hooks/useRouteParams";
import { useEffect, useState } from "react";
import type { AdminEmployee } from "@/data/adminEmployees";
import EmployeeProfileView from "@/components/admin/EmployeeProfileView";

export default function AdminTeachingStaffProfilePage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const schoolId = "idpscherukupalli";
 const employeeId = useRouteParam(params, "id");
 const [employee, setEmployee] = useState<AdminEmployee | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;
 async function load() {
 try {
 setLoading(true);
 const res = await fetch(`/api/idpscherukupalli/employees?id=${encodeURIComponent(employeeId)}`);
 const json = await res.json().catch(() => ({}));
 if (!cancelled) setEmployee((json?.employee || null) as AdminEmployee | null);
 } finally {
 if (!cancelled) setLoading(false);
 }
 }
 if (employeeId) load();
 return () => {
 cancelled = true;
 };
 }, [employeeId]);

 if (loading) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 flex items-center justify-center min-h-[60vh]">
 <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 if (!employee) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Teaching Staff Profile</h1>
 <p className="mt-2 text-xs font-semibold text-slate-600">Staff not found: {employeeId}</p>
 </div>
 <Link
 href="/schools/${schoolId}/admin/hr/teaching-staff"
 className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 w-fit"
 >
 Back to Teaching Staff
 </Link>
 </div>
 );
 }

 return (
 <EmployeeProfileView
 employee={employee}
 editHref={`/schools/${schoolId}/admin/hr/teaching-staff/${encodeURIComponent(employee.id)}/edit`}
 backHref={`/schools/${schoolId}/admin/hr/teaching-staff`}
 backLabel="Teaching Staff"
 variant="teaching"
 />
 );
}


"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
;
import { ArrowLeft, Save, Building2, Users, UserCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, getTimestamp, upsertData, db, auth } from "@/lib/db-client";




function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewDepartmentPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: "",
 name: "",
 subtitle: "",
 hodName: "",
 staffCount: 0,
 status: "Active" as "Active" | "Inactive",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: name === "staffCount" ? Number(value) : value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const id = String(form.id || "").trim();
 const name = String(form.name || "").trim();
 if (!name) throw new Error("Department Name is required");

 await upsertData(
 buildPath(db, "schools", schoolId, "departments", id || name),
 {
 name,
 subtitle: String(form.subtitle || "").trim(),
 hodName: String(form.hodName || "").trim() || null,
 staffCount: Number.isFinite(form.staffCount) ? form.staffCount : 0,
 status: form.status,
 updatedAt: getTimestamp(),
 createdAt: getTimestamp(),
 },
 { merge: true }
 );

 router.push(`/schools/${schoolId}/hr/departments`);
 router.refresh();
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 }
 setLoading(false);
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <SafeLink 
 href={`/schools/${schoolId}/hr/departments`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </SafeLink>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add New Department</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Create a new organizational unit</p>
 </div>
 </div>

 {error && (
 <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
 <Building2 size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Core details about this department</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Department ID <span className="text-gray-400 font-medium">(optional)</span></label>
 <input
 name="id"
 placeholder="Auto-generated from name if empty"
 value={form.id}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Department Name <span className="text-rose-500">*</span></label>
 <input
 name="name"
 required
 placeholder="e.g. Science Department"
 value={form.name}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-xs font-bold text-gray-700">Subtitle / Description</label>
 <input
 name="subtitle"
 placeholder="Brief description of the department"
 value={form.subtitle}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <Users size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Staffing & Status</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Head of department and metrics</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
 <UserCheck size={14} className="text-gray-400" />
 Head of Department (HOD)
 </label>
 <input
 name="hodName"
 placeholder="Name of HOD"
 value={form.hodName}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Initial Staff Count</label>
 <input
 name="staffCount"
 type="number"
 min="0"
 value={form.staffCount}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Status</label>
 <select
 name="status"
 value={form.status}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <SafeLink
 href={`/schools/${schoolId}/hr/departments`}
 className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
 >
 Cancel
 </SafeLink>
 <button
 type="submit"
 disabled={loading}
 className="h-9 px-6 bg-[#144835] text-white font-bold rounded-lg hover:bg-[#144835]/90 flex items-center gap-2 transition-colors shadow-sm shadow-[#144835]/20 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <Save size={18} />
 Create Department
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}

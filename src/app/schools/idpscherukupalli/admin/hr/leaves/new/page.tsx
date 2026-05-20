"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CalendarDays, User, Clock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDoc, collection, onSnapshot, orderBy, query as fsQuery, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewLeavePage() {
 const router = useRouter();
 const schoolId = "idpscherukupalli";
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [employees, setEmployees] = useState<Array<{ id: string; name: string; type: "teacher" | "staff" }>>([]);

 const [form, setForm] = useState({
 employeeId: "",
 employeeName: "",
 employeeType: "teacher" as "teacher" | "staff",
 type: "Annual Leave",
 from: "",
 to: "",
 days: 1,
 status: "Pending" as "Pending" | "Approved" | "Rejected",
 reason: "",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: name === "days" ? Number(value) : value }));
 };

 useEffect(() => {
 const teacherQ = fsQuery(collection(db, "schools", schoolId, "teachers"), orderBy("firstName", "asc"));
 const staffQ = fsQuery(collection(db, "schools", schoolId, "staff"), orderBy("firstName", "asc"));

 const unsubTeachers = onSnapshot(
 teacherQ,
 (snap) => {
 setEmployees((prev) => {
 const keepStaff = prev.filter((p) => p.type === "staff");
 const teachers = snap.docs.map((d) => {
 const data = d.data() as any;
 const name = `${String(data.firstName || "").trim()} ${String(data.lastName || "").trim()}`.trim() || "Unnamed";
 return { id: d.id, name, type: "teacher" as const };
 });
 return [...keepStaff, ...teachers];
 });
 },
 () => setEmployees((prev) => prev.filter((p) => p.type === "staff"))
 );

 const unsubStaff = onSnapshot(
 staffQ,
 (snap) => {
 setEmployees((prev) => {
 const keepTeachers = prev.filter((p) => p.type === "teacher");
 const staff = snap.docs.map((d) => {
 const data = d.data() as any;
 const name = `${String(data.firstName || "").trim()} ${String(data.lastName || "").trim()}`.trim() || "Unnamed";
 return { id: d.id, name, type: "staff" as const };
 });
 return [...keepTeachers, ...staff];
 });
 },
 () => setEmployees((prev) => prev.filter((p) => p.type === "teacher"))
 );

 return () => {
 unsubTeachers();
 unsubStaff();
 };
 }, [schoolId]);

 const employeeById = useMemo(() => {
 const map: Record<string, { name: string; type: "teacher" | "staff" }> = {};
 employees.forEach((e) => {
 map[e.id] = e;
 });
 return map;
 }, [employees]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const employeeId = String(form.employeeId || "").trim();
 const employeeName = String(form.employeeName || "").trim();
 const from = String(form.from || "").trim();
 const to = String(form.to || "").trim();
 const type = String(form.type || "").trim();
 if (!employeeId) throw new Error("Employee is required");
 if (!employeeName) throw new Error("Employee name is required");
 if (!from) throw new Error("From date is required");
 if (!to) throw new Error("To date is required");
 if (!type) throw new Error("Leave type is required");

 const days = Number.isFinite(form.days) ? Number(form.days) : undefined;

 await addDoc(collection(db, "schools", schoolId, "leaves"), {
 employeeId,
 employeeName,
 employeeType: form.employeeType,
 type,
 from,
 to,
 days,
 reason: String(form.reason || "").trim(),
 status: "Pending",
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 });

 router.push(`/schools/${schoolId}/admin/hr/leaves`);
 router.refresh();
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 }
 setLoading(false);
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/hr/leaves`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">New Leave Request</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Submit a leave request for an employee</p>
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
 <User size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Employee Information</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Who is taking leave</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-xs font-bold text-gray-700">Employee <span className="text-rose-500">*</span></label>
 <select
 value={form.employeeId}
 onChange={(e) => {
 const id = e.target.value;
 const emp = employeeById[id];
 setForm((prev) => ({
 ...prev,
 employeeId: id,
 employeeName: emp?.name || "",
 employeeType: emp?.type || "teacher",
 }));
 }}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 required={employees.length > 0}
 disabled={employees.length === 0}
 >
 <option value="" disabled>
 Select Employee
 </option>
 {employees.map((emp) => (
 <option key={emp.id} value={emp.id}>
 {emp.name} ({emp.type === "teacher" ? "Teacher" : "Staff"})
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Employee Name <span className="text-rose-500">*</span></label>
 <input
 name="employeeName"
 required
 placeholder="e.g. John Doe"
 value={form.employeeName}
 onChange={handleChange}
 readOnly={employees.length > 0}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Employee ID <span className="text-rose-500">*</span></label>
 <input
 name="employeeId"
 required
 placeholder="e.g. EMP-001"
 value={form.employeeId}
 onChange={handleChange}
 readOnly={employees.length > 0}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <CalendarDays size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Leave Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Dates and leave type</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Leave Type</label>
 <select
 name="type"
 value={form.type}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Annual Leave">Annual Leave</option>
 <option value="Sick Leave">Sick Leave</option>
 <option value="Casual Leave">Casual Leave</option>
 <option value="Unpaid Leave">Unpaid Leave</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
 <Clock size={14} className="text-gray-400" />
 Number of Days
 </label>
 <input
 name="days"
 type="number"
 min="0.5"
 step="0.5"
 required
 value={form.days}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">From Date <span className="text-rose-500">*</span></label>
 <input
 name="from"
 type="date"
 required
 value={form.from}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">To Date <span className="text-rose-500">*</span></label>
 <input
 name="to"
 type="date"
 required
 value={form.to}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
 <Clock size={18} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Reason</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Optional note for approval</p>
 </div>
 </div>
 <div className="p-4">
 <textarea
 name="reason"
 rows={3}
 value={form.reason}
 onChange={handleChange}
 placeholder="Optional reason for leave..."
 className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm resize-y"
 />
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/hr/leaves`}
 className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
 >
 Cancel
 </Link>
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
 Submit Request
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}

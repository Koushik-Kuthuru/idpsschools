"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileSpreadsheet, IndianRupee } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, getDocs, query, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

function gradeLabel(grade: string) {
 const g = String(grade || "").trim();
 if (!g) return "—";
 if (/^\d+$/.test(g)) return `Grade ${g}`;
 return g;
}

export default function NewFeeStructurePage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [gradeCatalog, setGradeCatalog] = useState<string[]>([]);

 const [form, setForm] = useState({
 grade: "",
 academicYear: "2024-2025",
 tuition: 0,
 sports: 0,
 transport: 0,
 others: 0,
 students: 0,
 status: "Active" as "Active" | "Draft",
 });

 const gradeOptions = useMemo(() => {
 const defaults = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
 const list = [...defaults, ...gradeCatalog].map((g) => String(g).trim()).filter(Boolean);
 const unique = Array.from(new Set(list));
 const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
 unique.sort((a, b) => collator.compare(a, b));
 return unique;
 }, [gradeCatalog]);

 useEffect(() => {
 let cancelled = false;
 async function loadGrades() {
 try {
 const snap = await getDocs(query(collection(db, "schools", schoolId, "classes")));
 const set = new Set<string>();
 snap.docs.forEach((d) => {
 const data = d.data() as any;
 const g = String(data.grade ?? data.name ?? "").trim();
 if (g) set.add(g);
 });
 const catalog = Array.from(set).sort((a, b) => {
 const numA = parseInt(a);
 const numB = parseInt(b);
 if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
 return a.localeCompare(b);
 });
 if (!cancelled) setGradeCatalog(catalog);
 } catch {
 if (!cancelled) setGradeCatalog([]);
 }
 }
 loadGrades();
 return () => {
 cancelled = true;
 };
 }, [schoolId]);

 useEffect(() => {
 if (form.grade) return;
 if (gradeOptions.length) setForm((prev) => ({ ...prev, grade: gradeOptions[0] }));
 }, [form.grade, gradeOptions]);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 const numericFields = ["tuition", "sports", "transport", "others", "students"];
 setForm(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const grade = String(form.grade || "").trim();
 if (!grade) throw new Error("Grade is required");

 const docId = grade.replaceAll("/", "-");
 await setDoc(
 doc(db, "schools", schoolId, "fee_structures", docId),
 {
 grade,
 academicYear: String(form.academicYear || "").trim(),
 tuition: Number(form.tuition || 0),
 sports: Number(form.sports || 0),
 transport: Number(form.transport || 0),
 others: Number(form.others || 0),
 status: form.status,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 },
 { merge: true }
 );

 router.push(`/schools/${schoolId}/admin/finance/fees`);
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
 href={`/schools/${schoolId}/admin/finance/fees`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add Fee Structure</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Create a new fee structure for a grade</p>
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
 <FileSpreadsheet size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Grade and academic year details</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Grade Level <span className="text-rose-500">*</span></label>
 {gradeOptions.length ? (
 <select
 name="grade"
 required
 value={form.grade}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 {gradeOptions.map((g) => (
 <option key={g} value={g}>
 {gradeLabel(g)}
 </option>
 ))}
 </select>
 ) : (
 <input
 name="grade"
 required
 placeholder="e.g. 10"
 value={form.grade}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 )}
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Academic Year</label>
 <input
 name="academicYear"
 required
 placeholder="e.g. 2024-2025"
 value={form.academicYear}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Expected Students</label>
 <input
 name="students"
 type="number"
 min="0"
 value={form.students}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
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
 <option value="Draft">Draft</option>
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <IndianRupee size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Fee Breakdown</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Annual fees per student</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Tuition Fee</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
 <input
 name="tuition"
 type="number"
 min="0"
 required
 value={form.tuition}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Sports Fee</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
 <input
 name="sports"
 type="number"
 min="0"
 value={form.sports}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Transport Fee</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
 <input
 name="transport"
 type="number"
 min="0"
 value={form.transport}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Other Fees</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
 <input
 name="others"
 type="number"
 min="0"
 value={form.others}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>
 <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
 <span className="text-xs font-bold text-gray-700">Total Fee per Student</span>
 <span className="text-xl font-extrabold text-[#144835]">
 ₹{(form.tuition + form.sports + form.transport + form.others).toLocaleString()}
 </span>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/finance/fees`}
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
 Save Structure
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}

"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import Link from "next/link";
const SafeLink = Link as any;
;
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type PortionStatus = "Planned" | "In Progress" | "Completed";

type SubjectPortion = {
 title: string;
 chapters: string;
 from: string;
 to: string;
 status: PortionStatus;
};

type FormState = {
 grade: string;
 section: string;
 name: string;
 code: string;
 description: string;
 portions: SubjectPortion[];
};

const emptyPortion = (): SubjectPortion => ({
 title: "",
 chapters: "",
 from: "",
 to: "",
 status: "Planned",
});

export default function AdminNewSubjectPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [gradeCatalog, setGradeCatalog] = useState<string[]>(["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
 const [sectionsByGrade, setSectionsByGrade] = useState<Record<string, string[]>>({});
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState<FormState>({
 grade: "10",
 section: "A",
 name: "",
 code: "",
 description: "",
 portions: [emptyPortion()],
 });

 useEffect(() => {
 async function loadMeta() {
 try {
 const q = query(collection(db, "schools", schoolId, "classes"), orderBy("name", "asc"));
 const snapshot = await getDocs(q);
 
 const catalogSet = new Set<string>();
 const map: Record<string, string[]> = {};
 
 snapshot.docs.forEach(doc => {
 const data = doc.data();
 const g = data.name;
 const s = data.section;
 
 if (g) {
 catalogSet.add(g);
 if (!map[g]) map[g] = [];
 if (s) map[g].push(s.toUpperCase());
 }
 });

 const catalog = Array.from(catalogSet).sort((a, b) => {
 const numA = parseInt(a);
 const numB = parseInt(b);
 if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
 return a.localeCompare(b);
 });

 if (catalog.length) setGradeCatalog(catalog);
 setSectionsByGrade(map);
 } catch (err) {
 console.error("Failed to load classes meta:", err);
 }
 }
 loadMeta();
 }, [schoolId]);

 const sectionOptions = useMemo(() => {
 const secs = sectionsByGrade[form.grade] || [];
 return secs.length ? secs : ["A", "B", "C"];
 }, [sectionsByGrade, form.grade]);

 useEffect(() => {
 if (!sectionOptions.includes(form.section)) setForm((p) => ({ ...p, section: sectionOptions[0] || "A" }));
 }, [form.section, sectionOptions]);

 async function save() {
 try {
 setError(null);
 setSaving(true);
 if (!form.grade || !form.section || !form.name.trim()) throw new Error("Grade, Section and Subject Name are required");

 const cleanedPortions = form.portions
 .map((p) => ({
 title: p.title.trim(),
 chapters: p.chapters.trim(),
 from: p.from,
 to: p.to,
 status: p.status,
 }))
 .filter((p) => p.title || p.chapters || p.from || p.to);

 const docRef = await addDoc(collection(db, "schools", schoolId, "subjects"), {
 classId: form.grade,
 section: String(form.section).toUpperCase(),
 name: form.name.trim(),
 code: form.code.trim(),
 description: form.description.trim(),
 portions: cleanedPortions,
 createdAt: new Date().toISOString()
 });
 
 router.push(`/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(docRef.id)}`);
 } catch (e: any) {
 setError(e?.message || "Failed to save");
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
 <div className="flex items-center gap-3">
 <SafeLink href={`/schools/${schoolId}/admin/academic/subjects`} className="p-2 rounded-lg hover:bg-gray-50 text-gray-600">
 <ArrowLeft size={18} />
 </SafeLink>
 <div>
 <h1 className="text-xl sm:text-xl font-bold text-gray-900 tracking-tight">Add Subject</h1>
 <p className="text-xs text-gray-500 mt-1">Create subject per class/section and define portions</p>
 </div>
 </div>
 <button onClick={save} disabled={saving} className="h-9 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all disabled:opacity-70">
 <Save size={14} /> {saving ? "Saving..." : "Save"}
 </button>
 </div>

 {error && <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
 <div className="xl:col-span-1 space-y-6">
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h2 className="text-xs font-bold text-gray-900">Class</h2>
 <div className="mt-4 space-y-3">
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade</label>
 <select value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800">
 {gradeCatalog.map((g) => (
 <option key={g} value={g}>{/^\d+$/.test(g) ? `Grade ${g}` : g}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Section</label>
 <select value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800">
 {sectionOptions.map((s) => (
 <option key={s} value={s}>{String(s).toUpperCase()}</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h2 className="text-xs font-bold text-gray-900">Subject Info</h2>
 <div className="mt-4 space-y-3">
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subject Name</label>
 <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Code</label>
 <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
 <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full min-h-[120px] rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-800" />
 </div>
 </div>
 </div>
 </div>

 <div className="xl:col-span-2">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <div>
 <h2 className="text-base font-bold text-gray-900">Portions</h2>
 <p className="text-xs font-bold text-gray-500 mt-1">Define syllabus/portion with date range and status</p>
 </div>
 <button
 type="button"
 onClick={() => setForm((p) => ({ ...p, portions: [...p.portions, emptyPortion()] }))}
 className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm inline-flex items-center gap-2"
 >
 <Plus size={14} /> Add Portion
 </button>
 </div>

 <div className="p-4 space-y-4">
 {form.portions.map((p, idx) => (
 <div key={idx} className="rounded-[16px] border border-gray-100 bg-gray-50/30 p-4">
 <div className="flex items-center justify-between gap-3">
 <p className="text-xs font-extrabold text-gray-900">Portion {idx + 1}</p>
 <button
 type="button"
 onClick={() => setForm((prev) => ({ ...prev, portions: prev.portions.filter((_, i) => i !== idx) }))}
 className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
 title="Remove"
 >
 <Trash2 size={14} />
 </button>
 </div>

 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
 <input
 value={p.title}
 onChange={(e) =>
 setForm((prev) => ({
 ...prev,
 portions: prev.portions.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
 }))
 }
 className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800"
 />
 </div>

 <div className="md:col-span-2">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Chapters / Portion</label>
 <textarea
 value={p.chapters}
 onChange={(e) =>
 setForm((prev) => ({
 ...prev,
 portions: prev.portions.map((x, i) => (i === idx ? { ...x, chapters: e.target.value } : x)),
 }))
 }
 className="w-full min-h-[90px] rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-800"
 />
 </div>

 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">From</label>
 <input
 type="date"
 value={p.from}
 onChange={(e) =>
 setForm((prev) => ({
 ...prev,
 portions: prev.portions.map((x, i) => (i === idx ? { ...x, from: e.target.value } : x)),
 }))
 }
 className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">To</label>
 <input
 type="date"
 value={p.to}
 onChange={(e) =>
 setForm((prev) => ({
 ...prev,
 portions: prev.portions.map((x, i) => (i === idx ? { ...x, to: e.target.value } : x)),
 }))
 }
 className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800"
 />
 </div>

 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
 <select
 value={p.status}
 onChange={(e) =>
 setForm((prev) => ({
 ...prev,
 portions: prev.portions.map((x, i) => (i === idx ? { ...x, status: e.target.value as PortionStatus } : x)),
 }))
 }
 className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800"
 >
 <option value="Planned">Planned</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 </div>
 </div>
 ))}

 {!form.portions.length && (
 <div className="rounded-[16px] border border-gray-100 bg-gray-50/40 p-4 text-xs font-bold text-gray-600">
 No portions added.
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

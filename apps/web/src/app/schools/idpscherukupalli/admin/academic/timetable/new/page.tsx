"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
type SlotKey = "08:00-09:00" | "09:00-10:00" | "10:30-11:30";

type Slot = {
 subject: string;
 room: string;
 accent: "emerald" | "blue" | "orange" | "purple";
};

const days: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const slotKeys: SlotKey[] = ["08:00-09:00", "09:00-10:00", "10:30-11:30"];

function emptyGrid(): Record<Day, Record<SlotKey, Slot>> {
 return {
 Monday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Tuesday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Wednesday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Thursday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 Friday: {
 "08:00-09:00": { subject: "—", room: "", accent: "emerald" },
 "09:00-10:00": { subject: "—", room: "", accent: "blue" },
 "10:30-11:30": { subject: "—", room: "", accent: "orange" },
 },
 };
}

function accentClasses(accent: Slot["accent"]) {
 if (accent === "emerald") return "bg-emerald-50/60 border-emerald-200 text-emerald-900";
 if (accent === "blue") return "bg-blue-50/60 border-blue-200 text-blue-900";
 if (accent === "purple") return "bg-purple-50/60 border-purple-200 text-purple-900";
 return "bg-orange-50/60 border-orange-200 text-orange-900";
}

function pad2(n: number) {
 return n.toString().padStart(2, "0");
}

function keyPart(v: string) {
 return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

function timetableDocId(nextScope: "term" | "month" | "date", nextKey: string, nextGrade: string, nextSection: string) {
 return `${nextScope}__${keyPart(nextKey)}__${keyPart(nextGrade)}__${keyPart(nextSection)}`;
}

export default function AdminCreateTimetableSchedulePage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [scope, setScope] = useState<"term" | "month" | "date">("term");
 const [termKey, setTermKey] = useState("Term 1 (2023-24)");
 const [monthKey, setMonthKey] = useState(() => {
 const d = new Date();
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
 });
 const [dateKey, setDateKey] = useState(() => {
 const d = new Date();
 return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
 });

 const [gradeCatalog, setGradeCatalog] = useState<string[]>(["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
 const [sectionsByGrade, setSectionsByGrade] = useState<Record<string, string[]>>({});
 const [grade, setGrade] = useState("10");
 const [section, setSection] = useState("A");

 const [grid, setGrid] = useState<Record<Day, Record<SlotKey, Slot>>>(emptyGrid());
 const [editorOpen, setEditorOpen] = useState(false);
 const [editDay, setEditDay] = useState<Day | null>(null);
 const [editSlot, setEditSlot] = useState<SlotKey | null>(null);
 const [editSubject, setEditSubject] = useState("");
 const [editRoom, setEditRoom] = useState("");
 const [editAccent, setEditAccent] = useState<Slot["accent"]>("emerald");

 const activeKey = scope === "term" ? termKey : scope === "month" ? monthKey : dateKey;

 const gradeLabel = (g: string) => (/^\d+$/.test(g) ? `Grade ${g}` : g);
 const sectionOptions = useMemo(() => {
 const list = sectionsByGrade[grade] || [];
 const normalized = list.map((s) => String(s).toUpperCase());
 const unique = Array.from(new Set(normalized));
 return unique.length ? unique : ["A", "B", "C"];
 }, [grade, sectionsByGrade]);

 useEffect(() => {
 if (!sectionOptions.includes(section)) setSection(sectionOptions[0] || "A");
 }, [sectionOptions, section]);

 const loadSaved = useCallback(async () => {
 setError(null);
 const key = String(activeKey || "").trim();
 const g = String(grade || "").trim();
 const s = String(section || "").trim().toUpperCase();
 if (!key || !g || !s) {
 setGrid(emptyGrid());
 return;
 }

 try {
 const ref = doc(db, "schools", schoolId, "timetables", timetableDocId(scope, key, g, s));
 const snap = await getDoc(ref);
 if (!snap.exists()) {
 setGrid(emptyGrid());
 return;
 }
 const data = snap.data() as any;
 const tt = data?.timetable;
 setGrid(tt ? (tt as any) : emptyGrid());
 } catch (e: any) {
 setError(e?.message || "Failed to load schedule");
 }
 }, [activeKey, grade, schoolId, scope, section]);

 useEffect(() => {
 let cancelled = false;
 async function init() {
 try {
 setLoading(true);
 const snap = await getDocs(query(collection(db, "schools", schoolId, "classes")));
 const catalogSet = new Set<string>();
 const map: Record<string, string[]> = {};

 snap.docs.forEach((d) => {
 const data = d.data();
 const g = String(data.grade ?? data.name ?? "").trim();
 const s = String(data.section ?? "").trim().toUpperCase();
 if (!g) return;
 catalogSet.add(g);
 if (!map[g]) map[g] = [];
 if (s) map[g].push(s);
 });

 const catalog = Array.from(catalogSet).sort((a, b) => {
 const numA = parseInt(a);
 const numB = parseInt(b);
 if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
 return a.localeCompare(b);
 });

 if (!cancelled) {
 if (catalog.length) setGradeCatalog(catalog);
 setSectionsByGrade(map);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 }
 init();
 return () => {
 cancelled = true;
 };
 }, []);

 function openEditor(day: Day, slotKey: SlotKey) {
 const s = grid[day][slotKey];
 setEditDay(day);
 setEditSlot(slotKey);
 setEditSubject(s.subject);
 setEditRoom(s.room);
 setEditAccent(s.accent);
 setEditorOpen(true);
 }

 function applyEditor() {
 if (!editDay || !editSlot) return;
 setGrid((prev) => ({
 ...prev,
 [editDay]: {
 ...prev[editDay],
 [editSlot]: { subject: editSubject, room: editRoom, accent: editAccent },
 },
 }));
 setEditorOpen(false);
 }

 async function saveSchedule() {
 setError(null);
 if (!activeKey.trim()) {
 setError("Please select a schedule key.");
 return;
 }
 try {
 setSaving(true);
 const key = String(activeKey || "").trim();
 const g = String(grade || "").trim();
 const s = String(section || "").trim().toUpperCase();
 if (!key || !g || !s) throw new Error("Missing scope/key/grade/section");

 const ref = doc(db, "schools", schoolId, "timetables", timetableDocId(scope, key, g, s));
 await setDoc(
 ref,
 {
 scope,
 key,
 grade: g,
 section: s,
 timetable: grid,
 updatedAt: new Date().toISOString(),
 },
 { merge: true }
 );
 router.push(`/schools/${schoolId}/admin/academic/timetable?scope=${encodeURIComponent(scope)}&key=${encodeURIComponent(activeKey)}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`);
 } catch (e: any) {
 setError(e.message || "Unknown error");
 } finally {
 setSaving(false);
 }
 }

 if (loading) {
 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto flex items-center justify-center min-h-[60vh]">
 <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
 <div className="flex items-center gap-3">
 <SafeLink href={`/schools/${schoolId}/admin/academic/timetable`} className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
 <ArrowLeft size={20} />
 </SafeLink>
 <div>
 <h1 className="text-xl sm:text-xl font-bold text-gray-900 tracking-tight">Create Schedule</h1>
 <p className="text-xs text-gray-500 mt-1">Build a timetable and save it by term, month, or date</p>
 </div>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button onClick={loadSaved} type="button" className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
 Load Saved
 </button>
 <button onClick={saveSchedule} disabled={saving} type="button" className="h-10 px-5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 shadow-sm disabled:opacity-70 inline-flex items-center gap-2">
 <Save size={14} /> {saving ? "Saving..." : "Save Schedule"}
 </button>
 </div>
 </div>

 {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs font-bold">{error}</div>}

 <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
 <div className="xl:col-span-1 space-y-6">
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h2 className="text-xs font-bold text-gray-900">Schedule Scope</h2>
 <div className="mt-4 space-y-3">
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Scope</label>
 <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800">
 <option value="term">Term</option>
 <option value="month">Month</option>
 <option value="date">Date</option>
 </select>
 </div>

 {scope === "term" && (
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Term Key</label>
 <input value={termKey} onChange={(e) => setTermKey(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 )}
 {scope === "month" && (
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Month</label>
 <input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 )}
 {scope === "date" && (
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
 <input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 )}
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h2 className="text-xs font-bold text-gray-900">Class</h2>
 <div className="mt-4 space-y-3">
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Grade</label>
 <div className="relative">
 <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-xs font-semibold text-gray-800">
 {gradeCatalog.map((g) => (
 <option key={g} value={g}>
 {gradeLabel(g)}
 </option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Section</label>
 <div className="relative">
 <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-xs font-semibold text-gray-800">
 {sectionOptions.map((s) => (
 <option key={s} value={s}>
 Section {s}
 </option>
 ))}
 </select>
 <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 <div className="pt-2">
 <p className="text-xs font-bold text-gray-500">This schedule saves globally by scope + key.</p>
 <p className="text-xs font-bold text-gray-500 mt-1">Grade/Section is used when opening the timetable view.</p>
 </div>
 </div>
 </div>
 </div>

 <div className="xl:col-span-3">
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <div>
 <h2 className="text-base font-bold text-gray-900">Schedule Grid</h2>
 <p className="text-xs font-bold text-gray-500 mt-1">Click a slot to edit</p>
 </div>
 <button onClick={() => setEditorOpen(true)} type="button" className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm inline-flex items-center gap-2">
 <Plus size={14} /> Quick Add
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-[980px] w-full">
 <thead className="bg-gray-50/80">
 <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
 <th className="px-4 py-2.5 w-[140px] border-b border-gray-100">Time</th>
 {days.map((d) => (
 <th key={d} className="px-4 py-2.5 border-b border-gray-100">
 <span className="text-gray-700">{d}</span>
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 bg-white">
 {slotKeys.slice(0, 2).map((slot) => (
 <tr key={slot} className="group hover:bg-gray-50/30 transition-colors">
 <td className="px-6 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">{slot}</td>
 {days.map((d) => {
 const cell = grid[d][slot];
 return (
 <td key={d} className="px-4 py-4">
 <button
 type="button"
 onClick={() => openEditor(d, slot)}
 className={cn(
 "w-full rounded-lg border border-l-4 px-4 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md",
 accentClasses(cell.accent)
 )}
 >
 <p className="text-xs font-bold">{cell.subject}</p>
 <p className="mt-1 text-xs font-bold opacity-80">{cell.room || "—"}</p>
 </button>
 </td>
 );
 })}
 </tr>
 ))}

 <tr className="bg-gray-50/50">
 <td className="px-6 py-3" />
 <td colSpan={5} className="px-6 py-3">
 <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
 <span className="w-10 h-px bg-gray-200"></span>
 ☕ BREAK (10:00 - 10:30)
 <span className="w-10 h-px bg-gray-200"></span>
 </div>
 </td>
 </tr>

 <tr className="group hover:bg-gray-50/30 transition-colors">
 <td className="px-6 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">10:30-11:30</td>
 {days.map((d) => {
 const cell = grid[d]["10:30-11:30"];
 return (
 <td key={d} className="px-4 py-4">
 <button
 type="button"
 onClick={() => openEditor(d, "10:30-11:30")}
 className={cn(
 "w-full rounded-lg border border-l-4 px-4 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md",
 accentClasses(cell.accent)
 )}
 >
 <p className="text-xs font-bold">{cell.subject}</p>
 <p className="mt-1 text-xs font-bold opacity-80">{cell.room || "—"}</p>
 </button>
 </td>
 );
 })}
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 {editorOpen && (
 <div className="fixed inset-0 z-50">
 <div className="absolute inset-0 bg-black/40" onClick={() => setEditorOpen(false)} />
 <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
 <div className="p-4 border-b border-gray-100">
 <h3 className="text-lg font-bold text-gray-900">Edit Slot</h3>
 <p className="text-xs font-bold text-gray-500 mt-1">{editDay && editSlot ? `${editDay} • ${editSlot}` : "Select a slot in the grid"}</p>
 </div>
 <div className="p-4 space-y-4">
 {!editDay || !editSlot ? (
 <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4 text-xs font-bold text-gray-600">
 Click any slot to edit.
 </div>
 ) : (
 <>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Subject</label>
 <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Room</label>
 <input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800" />
 </div>
 <div>
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Accent</label>
 <select value={editAccent} onChange={(e) => setEditAccent(e.target.value as any)} className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800">
 <option value="emerald">Emerald</option>
 <option value="blue">Blue</option>
 <option value="purple">Purple</option>
 <option value="orange">Orange</option>
 </select>
 </div>
 </>
 )}
 </div>
 <div className="p-4 border-t border-gray-100 mt-auto flex items-center justify-end gap-2">
 <button onClick={() => setEditorOpen(false)} className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50">Close</button>
 <button disabled={!editDay || !editSlot} onClick={applyEditor} className="h-10 px-5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60">Apply</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

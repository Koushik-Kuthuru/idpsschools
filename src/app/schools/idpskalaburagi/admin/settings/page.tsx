"use client";

import { useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranch } from "@/components/admin/BranchContext";
import {
 Bell,
 Building2,
 CalendarDays,
 CheckCircle2,
 ChevronRight,
 GraduationCap,
 IndianRupee,
 Plus,
 ShieldCheck,
 SlidersHorizontal,
 Users,
 XCircle,
 ClipboardList,
 Trash2,
 Save,
 RefreshCw,
 AlertCircle,
 Camera,
 Upload,
 Image as ImageIcon
} from "lucide-react";
import { useEffect, useRef } from "react";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type SectionKey = "general" | "academic" | "notifications" | "fees" | "staff" | "holidays" | "exams";

const sections: { key: SectionKey; label: string; icon: React.ComponentType<{ size?: number | string }> }[] = [
 { key: "general", label: "General Information", icon: Building2 },
 { key: "academic", label: "Academic Settings", icon: GraduationCap },
 { key: "exams", label: "Exam Types", icon: ClipboardList },
 { key: "holidays", label: "Holidays & Calendar", icon: CalendarDays },
 { key: "notifications", label: "Notification Settings", icon: Bell },
 { key: "fees", label: "Fee Configuration", icon: IndianRupee },
 { key: "staff", label: "Staff Policies", icon: Users },
];

export default function AdminBranchSettingsPage() {
 const { activeBranch } = useBranch();
 const schoolId = activeBranch.id;
 const [activeSection, setActiveSection] = useState<SectionKey>("general");

 // General Info State
 const [branchDetails, setBranchDetails] = useState({
  name: activeBranch.name || "",
  code: "",
  principal: "",
  phone: "",
  email: "",
  address: activeBranch.city || "",
  logo: "",
  status: "Active"
 });
 const [isSavingGeneral, setIsSavingGeneral] = useState(false);
 const logoInputRef = useRef<HTMLInputElement>(null);

 // Exam Types State
 const [exams, setExams] = useState<{ id: string; name: string; startDate?: string; endDate?: string }[]>([]);
 const [newExamName, setNewExamName] = useState("");
 const [newExamStartDate, setNewExamStartDate] = useState("");
 const [newExamEndDate, setNewExamEndDate] = useState("");
 const [isSavingExams, setIsSavingExams] = useState(false);

 // Classes State
 const [classes, setClasses] = useState<{ id: string; grade: string; section: string; room?: string }[]>([]);
 const [newClassGrade, setNewClassGrade] = useState("");
 const [newClassSection, setNewClassSection] = useState("");
 const [isSavingClasses, setIsSavingClasses] = useState(false);

 // Holidays State
 const [holidays, setHolidays] = useState<{ id: string; name: string; date: string; type: string }[]>([]);
 const [newHolidayName, setNewHolidayName] = useState("");
 const [newHolidayDate, setNewHolidayDate] = useState("");
const [newHolidayEndDate, setNewHolidayEndDate] = useState("");
 const [newHolidayType, setNewHolidayType] = useState("Public Holiday");
 const [isSavingHolidays, setIsSavingHolidays] = useState(false);

 // Sessions State
 const [sessions, setSessions] = useState<{ id: string; year: string; isActive: boolean }[]>([]);
 const [newSessionYear, setNewSessionYear] = useState("");
 const [isSavingSessions, setIsSavingSessions] = useState(false);

 // Load Data (Local)
 useEffect(() => {
  if (!schoolId) return;

  // Load from local storage if available, else initialize empty
  const localBranch = localStorage.getItem(`branchDetails_${schoolId}`);
  if (localBranch) setBranchDetails(JSON.parse(localBranch));

  const localExams = localStorage.getItem(`exams_${schoolId}`);
  if (localExams) setExams(JSON.parse(localExams));

  const localClasses = localStorage.getItem(`classes_${schoolId}`);
  if (localClasses) setClasses(JSON.parse(localClasses));

  const localHolidays = localStorage.getItem(`holidays_${schoolId}`);
  if (localHolidays) setHolidays(JSON.parse(localHolidays));

  const localSessions = localStorage.getItem(`sessions_${schoolId}`);
  if (localSessions) setSessions(JSON.parse(localSessions));

 }, [schoolId]);

 // Sync local storage on change
 useEffect(() => { localStorage.setItem(`branchDetails_${schoolId}`, JSON.stringify(branchDetails)); }, [branchDetails, schoolId]);
 useEffect(() => { localStorage.setItem(`exams_${schoolId}`, JSON.stringify(exams)); }, [exams, schoolId]);
 useEffect(() => { localStorage.setItem(`classes_${schoolId}`, JSON.stringify(classes)); }, [classes, schoolId]);
 useEffect(() => { localStorage.setItem(`holidays_${schoolId}`, JSON.stringify(holidays)); }, [holidays, schoolId]);
 useEffect(() => { localStorage.setItem(`sessions_${schoolId}`, JSON.stringify(sessions)); }, [sessions, schoolId]);

 // Handlers (Local)
 const handleSaveGeneral = async () => {
  setIsSavingGeneral(true);
  try {
   setBranchDetails(prev => ({
    ...prev,
    name: prev.code?.trim() ? prev.code.trim() : prev.name
   }));
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingGeneral(false), 500);
 };

 const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   const reader = new FileReader();
   reader.onloadend = () => {
    setBranchDetails(prev => ({ ...prev, logo: reader.result as string }));
   };
   reader.readAsDataURL(file);
  }
 };

 const handleAddExam = async () => {
  if (!newExamName.trim() || !newExamStartDate) return;
  setIsSavingExams(true);
  try {
   const start = new Date(`${newExamStartDate}T00:00:00`);
   const end = new Date(`${(newExamEndDate || newExamStartDate)}T00:00:00`);
   const rangeStart = start <= end ? start : end;
   const rangeEnd = start <= end ? end : start;

   const newExam = {
    id: Date.now().toString(),
    name: newExamName.trim(),
    startDate: rangeStart.toISOString().slice(0, 10),
    endDate: rangeEnd.toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
   };
   
   setExams(prev => [...prev, newExam]);
   setNewExamName("");
   setNewExamStartDate("");
   setNewExamEndDate("");
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingExams(false), 300);
 };

 const handleDeleteExam = async (id: string) => {
  try { setExams(prev => prev.filter(e => e.id !== id)); } catch (e) { console.error(e); }
 };

 const handleAddClass = async () => {
  if (!newClassGrade.trim() || !newClassSection.trim()) return;
  setIsSavingClasses(true);
  try {
   const newClass = {
    id: Date.now().toString(),
    grade: newClassGrade.trim(),
    name: newClassGrade.trim(),
    section: newClassSection.trim().toUpperCase(),
    createdAt: new Date().toISOString()
   };
   setClasses(prev => [...prev, newClass]);
   setNewClassGrade("");
   setNewClassSection("");
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingClasses(false), 300);
 };

 const handleDeleteClass = async (id: string) => {
  try { setClasses(prev => prev.filter(c => c.id !== id)); } catch (e) { console.error(e); }
 };

 const handleAddHoliday = async () => {
  if (!newHolidayName.trim() || !newHolidayDate) return;
  setIsSavingHolidays(true);
  try {
   const nowIso = new Date().toISOString();
   const holidayName = newHolidayName.trim();
   const start = new Date(`${newHolidayDate}T00:00:00`);
   const end = new Date(`${(newHolidayEndDate || newHolidayDate)}T00:00:00`);
   const rangeStart = start <= end ? start : end;
   const rangeEnd = start <= end ? end : start;
   
   const newHolidays: { id: string; name: string; date: string; type: string; createdAt: string }[] = [];
   for (
    const cursor = new Date(rangeStart);
    cursor <= rangeEnd;
    cursor.setDate(cursor.getDate() + 1)
   ) {
    const day = cursor.toISOString().slice(0, 10);
    newHolidays.push({
     id: Date.now().toString() + Math.random().toString(),
     name: holidayName,
     date: day,
     type: newHolidayType,
     createdAt: nowIso
    });
   }
   
   setHolidays(prev => {
     const updated = [...prev, ...newHolidays];
     return updated.sort((a, b) => a.date.localeCompare(b.date));
   });
   
   setNewHolidayName("");
   setNewHolidayDate("");
   setNewHolidayEndDate("");
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingHolidays(false), 300);
 };

 const handleDeleteHoliday = async (id: string) => {
  try { setHolidays(prev => prev.filter(h => h.id !== id)); } catch (e) { console.error(e); }
 };

 const handleAddSession = async () => {
  const year = newSessionYear.trim();
  if (!year) return;
  setIsSavingSessions(true);
  try {
   const newSession = {
    id: Date.now().toString(),
    year,
    isActive: false,
    status: "inactive",
    createdAt: new Date().toISOString()
   };
   setSessions(prev => [...prev, newSession].sort((a, b) => a.year.localeCompare(b.year)));
   setNewSessionYear("");
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingSessions(false), 300);
 };

 const handleToggleSessionActive = async (id: string, nextIsActive: boolean) => {
  setIsSavingSessions(true);
  try {
   setSessions(prev => prev.map(s => {
    if (nextIsActive) {
     const isSelected = s.id === id;
     return { ...s, isActive: isSelected, status: isSelected ? "active" : "inactive" };
    } else {
     if (s.id === id) return { ...s, isActive: false, status: "inactive" };
     return s;
    }
   }));
  } catch (e) { console.error(e); }
  setTimeout(() => setIsSavingSessions(false), 300);
 };

 const header = useMemo(() => {
 const branchLabel = activeBranch.city ? `${activeBranch.name} (${activeBranch.city})` : activeBranch.name;
 return { branchLabel };
 }, [activeBranch.city, activeBranch.name]);

 const activeSessionYears = useMemo(
  () => sessions.filter((session) => session.isActive).map((session) => session.year).filter(Boolean),
  [sessions]
 );

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
 {/* Navigation Sidebar */}
 <aside className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden h-fit">
 <div className="p-3">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-3 pt-2">Branch Configuration</p>
 <div className="space-y-1">
 {sections.map((s) => {
 const active = s.key === activeSection;
 return (
 <button
 key={s.key}
 type="button"
 onClick={() => setActiveSection(s.key)}
 className={cn(
 "w-full text-left rounded-lg px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-3",
 active ? "bg-[#144835]/10 text-[#144835]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
 )}
 >
 <div className={cn("flex items-center justify-center h-7 w-7 rounded-md shrink-0", active ? "bg-white shadow-sm" : "")}>
 <s.icon size={16} />
 </div>
 <span className="flex-1">{s.label}</span>
 {active && <ChevronRight size={14} className="opacity-100 shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 </aside>

 {/* Content Section */}
 <section className="lg:col-span-3 space-y-4">
 {activeSection === "general" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
 <Building2 size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">General Information</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{header.branchLabel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
  onClick={() => window.location.reload()}
  type="button"
  className="h-8 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
 >
 Discard
 </button>
 <button
  onClick={handleSaveGeneral}
  disabled={isSavingGeneral}
  type="button"
  className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-[#144835] text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-50"
 >
  {isSavingGeneral ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
 </button>
 </div>
 </div>

 <div className="p-4 space-y-6">
 <div className="flex flex-col items-center sm:flex-row gap-6 p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30">
  <div className="relative group">
   <div className="h-24 w-24 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
    {branchDetails.logo ? (
     <img src={branchDetails.logo} alt="School Logo" className="h-full w-full object-contain p-2" />
    ) : (
     <Building2 size={32} className="text-gray-300" />
    )}
   </div>
   <button
    onClick={() => logoInputRef.current?.click()}
    type="button"
    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#144835] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
   >
    <Camera size={14} />
   </button>
   <input
    type="file"
    ref={logoInputRef}
    onChange={handleLogoUpload}
    accept="image/*"
    className="hidden"
   />
  </div>
  <div className="text-center sm:text-left">
   <p className="text-xs font-bold text-gray-900">Branch Logo</p>
   <p className="text-[10px] font-medium text-gray-500 mt-1 max-w-[200px]">Upload a high-resolution logo. PNG or JPG preferred.</p>
   <button
    onClick={() => logoInputRef.current?.click()}
    type="button"
    className="mt-2 text-[10px] font-bold text-[#144835] hover:underline"
   >
    Change Image
   </button>
  </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {[
   { label: "Branch Name", key: "name", value: branchDetails.name },
   { label: "Branch Code", key: "code", value: branchDetails.code, placeholder: "e.g. IDPS-KLB" },
   { label: "Principal", key: "principal", value: branchDetails.principal },
   { label: "Phone", key: "phone", value: branchDetails.phone },
   { label: "Email", key: "email", value: branchDetails.email },
   { label: "Address", key: "address", value: branchDetails.address },
  ].map((f) => (
   <div key={f.label} className="rounded-[12px] border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-[#144835]/30 hover:bg-[#144835]/5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{f.label}</p>
    <input
     className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all"
     value={f.value}
     placeholder={f.placeholder}
     onChange={(e) => setBranchDetails(prev => ({ ...prev, [f.key as keyof typeof branchDetails]: e.target.value }))}
    />
   </div>
  ))}

  <div className="md:col-span-2 rounded-[12px] border border-gray-100 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
   <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Branch Status</p>
    <div className="flex items-center gap-2 mt-1">
     <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
     </span>
     <p className="text-xs font-bold text-gray-900">{branchDetails.status}</p>
    </div>
    <p className="mt-1 text-[10px] font-medium text-gray-500">Changes take effect immediately for this branch.</p>
   </div>
   <button type="button" className="h-8 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors w-full sm:w-auto">
    <SlidersHorizontal size={14} /> Advanced Settings
   </button>
  </div>
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "academic" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
 <GraduationCap size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Academic Settings</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{header.branchLabel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
 Discard
 </button>
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-[#144835] text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 Save Changes
 </button>
 </div>
 </div>

 <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
 <div className="lg:col-span-7 space-y-4">
 <div className="rounded-[12px] border border-gray-100 bg-gray-50 p-3">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Academic Year</p>
 <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-700">Default Session</label>
 <div className="relative mt-1.5">
 <select className="w-full h-8 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer">
 {activeSessionYears.length > 0 ? (
  activeSessionYears.map((y) => (
   <option key={y}>{y}</option>
  ))
 ) : (
  <option>No active session</option>
 )}
 </select>
 <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">Grading System</label>
 <div className="relative mt-1.5">
 <select className="w-full h-8 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer">
 <option>GPA (10)</option>
 <option>Percentage</option>
 <option>CBSE (Grades)</option>
 </select>
 <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">Attendance Threshold</label>
 <input className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm" defaultValue="80%" />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">Timetable Version</label>
 <input className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm" defaultValue="2025-T1" />
 </div>
 </div>
 </div>
 </div>

 <div className="lg:col-span-5">
 <div className="rounded-[12px] border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
  <div className="px-3 py-2 border-b border-gray-100 bg-[#144835]/10">
   <p className="text-[10px] font-bold uppercase tracking-wider text-[#144835]">Academic Year Sessions</p>
  </div>

  <div className="p-3">
   <div className="overflow-hidden rounded-lg border border-gray-200">
    <table className="w-full text-left">
     <thead className="bg-emerald-50/60">
      <tr>
       <th className="px-3 py-2 text-[10px] font-bold text-gray-600 w-12">SR</th>
       <th className="px-3 py-2 text-[10px] font-bold text-gray-600">Session Year</th>
       <th className="px-3 py-2 text-[10px] font-bold text-gray-600 w-28">Action</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-gray-100">
      {sessions.map((s, idx) => (
       <tr key={s.id} className="bg-white hover:bg-gray-50/60 transition-colors">
        <td className="px-3 py-2 text-[10px] font-bold text-gray-700">{idx + 1}</td>
        <td className="px-3 py-2 text-[10px] font-bold text-gray-700">{s.year}</td>
        <td className="px-3 py-2">
         <button
          type="button"
          disabled={isSavingSessions}
          onClick={() => handleToggleSessionActive(s.id, !s.isActive)}
          className={cn(
           "h-6 px-2 rounded text-[10px] font-bold text-white disabled:opacity-50 transition-colors",
           s.isActive ? "bg-[#144835] hover:bg-[#144835]/90" : "bg-gray-400 hover:bg-gray-500"
          )}
         >
          {s.isActive ? "Active" : "Inactive"}
         </button>
        </td>
       </tr>
      ))}
      {sessions.length === 0 ? (
       <tr>
        <td colSpan={3} className="px-3 py-6 text-center text-[10px] font-bold text-gray-400">No sessions added</td>
       </tr>
      ) : null}
     </tbody>
    </table>
   </div>

   <div className="mt-3 grid grid-cols-1 gap-2">
    <input
     value={newSessionYear}
     onChange={(e) => setNewSessionYear(e.target.value)}
     placeholder="e.g. 2026-2027"
     className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
    />
    <button
     type="button"
     onClick={handleAddSession}
     disabled={isSavingSessions}
     className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 disabled:opacity-50 transition-all"
    >
     Add Session
    </button>
   </div>
  </div>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "exams" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
 <ClipboardList size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Exam Types</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">Manage examinations for this branch</p>
 </div>
 </div>
 </div>

 <div className="p-4 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
 <input
 type="text"
 value={newExamName}
 onChange={(e) => setNewExamName(e.target.value)}
 placeholder="e.g. Final Examination 2024"
 className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 <input
  type="date"
  value={newExamStartDate}
  onChange={(e) => setNewExamStartDate(e.target.value)}
  className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
 />
 <input
  type="date"
  value={newExamEndDate}
  onChange={(e) => setNewExamEndDate(e.target.value)}
  className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
 />
 <button
 onClick={handleAddExam}
 disabled={isSavingExams}
 className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 disabled:opacity-50 transition-all flex items-center gap-2"
 >
 {isSavingExams ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Add Exam
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {exams.map((exam) => (
 <div key={exam.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-[#144835]/30 hover:bg-white transition-all">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#144835]">
 <ClipboardList size={14} />
 </div>
 <div>
  <p className="text-xs font-bold text-gray-800">{exam.name}</p>
  {exam.startDate ? (
   <p className="text-[10px] font-medium text-gray-500">
    {exam.startDate}
    {exam.endDate && exam.endDate !== exam.startDate ? ` • ${exam.endDate}` : ""}
   </p>
  ) : null}
 </div>
 </div>
 <button
 onClick={() => handleDeleteExam(exam.id)}
 className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
 >
 <Trash2 size={14} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "holidays" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
 <CalendarDays size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Holidays & Calendar</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">Manage branch holidays and events</p>
 </div>
 </div>
 </div>

 <div className="p-4 space-y-4">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
 <input
 type="text"
 value={newHolidayName}
 onChange={(e) => setNewHolidayName(e.target.value)}
 placeholder="Holiday Name"
 className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 <input
 type="date"
 value={newHolidayDate}
 onChange={(e) => setNewHolidayDate(e.target.value)}
 className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
 />
<input
type="date"
value={newHolidayEndDate}
onChange={(e) => setNewHolidayEndDate(e.target.value)}
className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
placeholder="End Date (optional)"
/>
 <select
 value={newHolidayType}
 onChange={(e) => setNewHolidayType(e.target.value)}
 className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] bg-white"
 >
 <option>Public Holiday</option>
 <option>Festival</option>
 <option>Academic Break</option>
 <option>Other</option>
 </select>
 <button
 onClick={handleAddHoliday}
 disabled={isSavingHolidays}
 className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 disabled:opacity-50 transition-all flex items-center gap-2"
 >
 {isSavingHolidays ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} Add Holiday
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {holidays.map((h) => (
 <div key={h.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-[#144835]/30 hover:bg-white transition-all">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#144835]">
 <CalendarDays size={14} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-800">{h.name}</p>
 <p className="text-[10px] font-medium text-gray-500">{h.type} • {h.date}</p>
 </div>
 </div>
 <button
 onClick={() => handleDeleteHoliday(h.id)}
 className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
 >
 <Trash2 size={14} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "notifications" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
 <Bell size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Notification Settings</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{header.branchLabel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
 Discard
 </button>
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-[#144835] text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 Save Changes
 </button>
 </div>
 </div>

 <div className="p-4">
 <div className="divide-y divide-gray-100 rounded-[12px] border border-gray-100 overflow-hidden shadow-sm">
 {[
 { label: "Email Notifications", desc: "Send alerts to admin email group" },
 { label: "SMS Alerts", desc: "Critical events to branch phone numbers" },
 { label: "In-App Notifications", desc: "Notify admins inside the dashboard" },
 { label: "Daily Digest", desc: "Summarized notifications once per day" },
 ].map((n, idx) => (
 <div key={n.label} className={cn("p-3 bg-white flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors", idx === 0 ? "" : "")}>
 <div>
 <p className="text-xs font-bold text-gray-900">{n.label}</p>
 <p className="mt-0.5 text-[10px] font-medium text-gray-500">{n.desc}</p>
 </div>
 <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#144835] focus:ring-[#144835] cursor-pointer" defaultChecked={n.label !== "SMS Alerts"} />
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "fees" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
 <IndianRupee size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Fee Configuration</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{header.branchLabel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
 Discard
 </button>
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-[#144835] text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 Save Changes
 </button>
 </div>
 </div>

 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 {[
 { label: "Currency", value: "INR (₹)" },
 { label: "Late Fee (per day)", value: "₹25" },
 { label: "Payment Gateway", value: "Razorpay" },
 { label: "Receipt Prefix", value: "IDPS-FEE" },
 ].map((f) => (
 <div key={f.label} className="rounded-[12px] border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-[#144835]/30 hover:bg-[#144835]/5">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{f.label}</p>
 <input className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all" defaultValue={f.value} />
 </div>
 ))}

 <div className="md:col-span-2 rounded-[12px] border border-gray-100 bg-white p-3 shadow-sm mt-2">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Auto Reminders</p>
 <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
 {[
 { label: "7 days before due", on: true },
 { label: "1 day before due", on: true },
 { label: "After due date", on: false },
 ].map((r) => (
 <label key={r.label} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 h-8 cursor-pointer hover:border-[#144835]/30 transition-colors shadow-sm">
 <span className="text-[10px] font-bold text-gray-800">{r.label}</span>
 <input type="checkbox" defaultChecked={r.on} className="h-4 w-4 rounded border-gray-300 text-[#144835] focus:ring-[#144835]" />
 </label>
 ))}
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {activeSection === "staff" ? (
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
 <Users size={16} />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-900">Staff Policies</p>
 <p className="text-[10px] font-medium text-gray-500 mt-0.5">{header.branchLabel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-[10px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
 Discard
 </button>
 <button type="button" className="h-8 px-3 inline-flex items-center gap-2 rounded-lg bg-[#144835] text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 Save Changes
 </button>
 </div>
 </div>

 <div className="p-4 space-y-4">
 <div className="rounded-[12px] border border-gray-100 bg-gray-50 p-3">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Leave & Attendance</p>
 <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[10px] font-bold text-gray-700">Weekly Off Days</label>
 <div className="relative mt-1.5">
 <select className="w-full h-8 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer">
 <option>Sunday</option>
 <option>Saturday & Sunday</option>
 </select>
 <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">Working Hours</label>
 <input className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm" defaultValue="09:00 AM - 04:00 PM" />
 </div>
 </div>
 </div>

 <div className="rounded-[12px] border border-gray-100 bg-white shadow-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Policy Enforcement</p>
 <p className="mt-0.5 text-[10px] font-medium text-gray-600">Control sign-in requirements and leave approvals.</p>
 </div>
 <button type="button" className="h-8 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all w-full sm:w-auto">
 <ShieldCheck size={14} /> Configure
 </button>
 </div>
 </div>
 </div>
 ) : null}

 </section>
 </div>
 </div>
 );
}

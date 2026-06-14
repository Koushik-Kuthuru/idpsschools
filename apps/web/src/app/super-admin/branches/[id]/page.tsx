"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
 MapPin, 
 Mail, 
 Phone, 
 Edit2, 
 Download,
 Users,
 Briefcase,
 Calendar,
 CheckCircle2,
 MessageSquare,
 Shield,
 Activity,
 AlertTriangle,
 Building2,
 Home,
 ChevronRight as BreadcrumbSeparator,
 Camera,
 BookOpen
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function BranchDetailsPage({ params }: { params: Promise<{ id: string }> }) {
 const unwrappedParams = use(params);
 const branchId = decodeURIComponent(unwrappedParams.id);
 const router = useRouter();
 
 const [branch, setBranch] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [studentCount, setStudentCount] = useState<number | null>(null);
 const [teacherCount, setTeacherCount] = useState<number | null>(null);
 const [classCount, setClassCount] = useState<number | null>(null);
 const [branchAdmin, setBranchAdmin] = useState<any | null>(null);
 const [activities, setActivities] = useState<any[]>([]);
 const [transactions, setTransactions] = useState<any[]>([]);

 useEffect(() => {
 setLoading(true);

 const unsubSchool = onSnapshot(
 doc(db, "schools", branchId),
 (snap) => {
 if (snap.exists()) {
 setBranch({ id: snap.id, ...snap.data() });
 } else {
 setBranch(null);
 }
 setLoading(false);
 },
 (err) => {
 console.error("Error listening school:", err);
 setBranch(null);
 setLoading(false);
 }
 );

 const unsubStudents = onSnapshot(
 collection(db, "schools", branchId, "students"),
 (snap) => setStudentCount(snap.size),
 () => setStudentCount(0)
 );

 const unsubTeachers = onSnapshot(
 collection(db, "schools", branchId, "teachers"),
 (snap) => setTeacherCount(snap.size),
 () => setTeacherCount(0)
 );

 const unsubClasses = onSnapshot(
 collection(db, "schools", branchId, "classes"),
 (snap) => setClassCount(snap.size),
 () => setClassCount(0)
 );

 const unsubBranchAdmin = onSnapshot(
 query(collection(db, "user_roles"), where("schoolId", "==", branchId), where("role", "==", "admin"), limit(1)),
 (snap) => {
 const d = snap.docs[0];
 setBranchAdmin(d ? { id: d.id, ...(d.data() as any) } : null);
 },
 () => setBranchAdmin(null)
 );

 const unsubActivities = onSnapshot(
 query(collection(db, "schools", branchId, "activity"), orderBy("createdAt", "desc"), limit(10)),
 (snap) => {
 setActivities(
 snap.docs.map((d) => ({
 id: d.id,
 ...(d.data() as any),
 }))
 );
 },
 () => setActivities([])
 );

 const unsubTransactions = onSnapshot(
 query(collection(db, "schools", branchId, "transactions"), orderBy("date", "desc"), limit(10)),
 (snap) => {
 setTransactions(
 snap.docs.map((d) => ({
 id: d.id,
 ...(d.data() as any),
 }))
 );
 },
 () => setTransactions([])
 );

 return () => {
 unsubSchool();
 unsubStudents();
 unsubTeachers();
 unsubClasses();
 unsubBranchAdmin();
 unsubActivities();
 unsubTransactions();
 };
 }, [branchId]);

 const [activeTab, setActiveTab] = useState("General Info");
 const [isDownloading, setIsDownloading] = useState(false);

 const handleToggleVisibility = async (checked: boolean) => {
 try {
 await updateDoc(doc(db, "schools", branchId), { visible: checked });
 } catch (error) {
 console.error("Failed to update visibility:", error);
 alert("Failed to update visibility. Check console for details.");
 }
 };

 const handleToggleNotifications = async (checked: boolean) => {
 try {
 await updateDoc(doc(db, "schools", branchId), { notificationsEnabled: checked });
 } catch (error) {
 console.error("Failed to update notifications:", error);
 alert("Failed to update notifications. Check console for details.");
 }
 };

 const handleDownloadReport = () => {
 setIsDownloading(true);
 try {
 const payload = {
 generatedAt: new Date().toISOString(),
 schoolId: branchId,
 school: branch,
 counts: {
 students: studentCount,
 teachers: teacherCount,
 classes: classCount,
 },
 };

 const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${branchId}-report.json`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
 } finally {
 setIsDownloading(false);
 }
 };

 const handleDeleteBranch = async () => {
 if (!confirm("Are you sure you want to delete this branch? This action cannot be undone.")) return;
 try {
 await deleteDoc(doc(db, "schools", branchId));
 router.push("/super-admin/branches");
 } catch (error) {
 console.error("Failed to delete branch:", error);
 alert("Failed to delete branch. Check console for details.");
 }
 };

 if (loading) {
 return (
 <div className="flex h-96 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
 </div>
 );
 }

 if (!branch) {
 return (
 <div className="flex flex-col items-center justify-center h-96 space-y-4">
 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
 <AlertTriangle size={32} />
 </div>
 <h2 className="text-xl font-bold text-gray-800">Branch Not Found</h2>
 <p className="text-sm text-gray-500">The branch ID "{branchId}" does not exist.</p>
 <Link href="/super-admin/branches" className="px-6 py-2 bg-[#144835] text-white rounded-lg font-medium hover:bg-[#0f3628] transition-colors mt-4">
 Back to Branches
 </Link>
 </div>
 );
 }

 const stats = [
 {
 label: "Total Students",
 value:
 typeof studentCount === "number"
 ? studentCount.toLocaleString()
 : typeof branch.students === "number"
 ? branch.students.toLocaleString()
 : "-",
 icon: Users,
 color: "text-blue-600",
 bg: "bg-blue-50",
 },
 {
 label: "Total Teachers",
 value:
 typeof teacherCount === "number"
 ? teacherCount.toLocaleString()
 : typeof branch.teachers === "number"
 ? branch.teachers.toLocaleString()
 : "-",
 icon: Briefcase,
 color: "text-purple-600",
 bg: "bg-purple-50",
 },
 {
 label: "Total Classes",
 value: typeof classCount === "number" ? classCount.toLocaleString() : "-",
 icon: BookOpen,
 color: "text-green-600",
 bg: "bg-green-50",
 },
 {
 label: "Avg. Attendance",
 value: branch.attendance?.student != null ? `${branch.attendance.student}%` : "-",
 icon: Calendar,
 color: "text-orange-600",
 bg: "bg-orange-50",
 },
 ];

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-12">
 
 {/* Breadcrumb */}
 <nav className="flex items-center text-xs font-medium text-gray-500 mb-4">
 <Link href="/super-admin" className="hover:text-[#144835] transition-colors flex items-center gap-1">
 <Home size={14} /> Dashboard
 </Link>
 <BreadcrumbSeparator size={14} className="mx-2" />
 <Link href="/super-admin/branches" className="hover:text-[#144835] transition-colors">
 Branches
 </Link>
 <BreadcrumbSeparator size={14} className="mx-2" />
 <span className="text-[#144835] font-semibold">{branch.name}</span>
 </nav>

 {/* Hero Profile Card with Cover */}
 <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
 {/* Cover Image */}
 <div className="h-32 bg-gradient-to-r from-[#144835] to-[#1e6b52] relative">
 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
 <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors">
 <Camera size={18} />
 </button>
 </div>

 <div className="px-6 pb-6 relative">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-12 mb-2">
 <div className="flex items-end gap-4">
 <div className="w-24 h-24 rounded-[16px] bg-white p-1 shadow-md">
 <div className="w-full h-full rounded-lg bg-[#E8F5E9] border border-[#144835]/10 flex items-center justify-center">
 <Building2 size={40} className="text-[#144835]" />
 </div>
 </div>
 <div className="mb-1">
 <div className="flex items-center gap-3 mb-1">
 <h1 className="text-xl font-extrabold text-[#1A1A1A]">{branch.name}</h1>
 <span className={cn(
 "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide border",
 branch.status === "Active" 
 ? "bg-green-50 text-green-700 border-green-100" 
 : "bg-red-50 text-red-700 border-red-100"
 )}>
 {branch.status}
 </span>
 </div>
 <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
 <span className="flex items-center gap-1.5"><Shield size={14} /> Branch Code: {branch.id.replace('#', '')}</span>
 <span className="hidden md:inline w-1 h-1 rounded-full bg-gray-300"></span>
 <span className="flex items-center gap-1.5"><MapPin size={14} /> {branch.city || "City"}, {branch.state || "State"}</span>
 </div>
 </div>
 </div>
 
 <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
 <Link 
 href={`/super-admin/branches/${encodeURIComponent(branchId)}/edit`}
 className="flex-1 md:flex-none px-5 py-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
 >
 <Edit2 size={14} /> Edit Details
 </Link>
 <button 
 onClick={handleDownloadReport}
 disabled={isDownloading}
 className="flex-1 md:flex-none px-5 py-2.5 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center justify-center gap-2 shadow-lg shadow-[#144835]/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
 >
 {isDownloading ? (
 <>
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 Generating...
 </>
 ) : (
 <>
 <Download size={14} /> Report
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat, idx) => (
 <div key={idx} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer">
 <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500", stat.color)}>
 <stat.icon size={64} />
 </div>

 <div className="flex justify-between items-start mb-4 relative z-10">
 <div className={cn("p-3 rounded-lg", stat.bg, stat.color)}>
 <stat.icon size={20} />
 </div>
 </div>
 
 <div className="relative z-10">
 <h3 className="text-xl font-bold text-gray-800 mb-1">{stat.value}</h3>
 <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Main Content Area */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Tabs & Content */}
 <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
 {/* Tab Navigation */}
 <div className="flex border-b border-gray-100 px-6 pt-2 overflow-x-auto scrollbar-hide">
 {["General Info", "Academic Stats", "Financials", "Settings"].map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap",
 activeTab === tab 
 ? "border-[#144835] text-[#144835]" 
 : "border-transparent text-gray-500 hover:text-gray-700"
 )}
 >
 {tab}
 </button>
 ))}
 </div>

 <div className="p-8">
 {activeTab === "General Info" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {/* Address & Contact Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
 <div className="space-y-6">
 <div>
 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Address Details</h3>
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
 <MapPin size={14} />
 </div>
 <div>
 <p className="text-xs font-medium text-gray-700 leading-relaxed mt-1">
 {branch.address}
 </p>
 <p className="text-xs text-gray-500 mt-1">{branch.city || "City"}, {branch.state || "State"}</p>
 </div>
 </div>
 </div>
 
 {/* Map Placeholder */}
 <a
 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
 [branch.address, branch.city, branch.state].filter(Boolean).join(", ")
 )}`}
 target="_blank"
 rel="noreferrer"
 className="h-40 bg-gray-50 rounded-lg overflow-hidden relative group cursor-pointer border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
 >
 <span className="px-4 py-2 bg-white shadow-sm rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2">
 <MapPin size={14} /> View on Google Maps
 </span>
 </a>
 </div>

 <div className="space-y-8">
 <div>
 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h3>
 <div className="space-y-4">
 <div className="flex items-center gap-3 text-xs font-medium text-gray-700 group cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#144835] group-hover:bg-[#144835]/10 transition-colors">
 <Phone size={14} />
 </div>
 <div>
 <p className="text-gray-900">{branch.phone}</p>
 <p className="text-xs text-gray-400">Reception Desk</p>
 </div>
 </div>
 <div className="flex items-center gap-3 text-xs font-medium text-gray-700 group cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#144835] group-hover:bg-[#144835]/10 transition-colors">
 <Phone size={14} />
 </div>
 <div>
 <p className="text-gray-900">{branch.altPhone}</p>
 <p className="text-xs text-gray-400">Administration Office</p>
 </div>
 </div>
 <div className="flex items-center gap-3 text-xs font-medium text-gray-700 group cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#144835] group-hover:bg-[#144835]/10 transition-colors">
 <Mail size={14} />
 </div>
 <div>
 <p className="text-gray-900">{branch.email}</p>
 <p className="text-xs text-gray-400">Official Email</p>
 </div>
 </div>
 </div>
 </div>

 <div>
 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Institutional Detail</h3>
 <div className="flex items-center gap-3 text-xs font-medium text-gray-700">
 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
 <Calendar size={14} />
 </div>
 Established: {branch.established}
 </div>
 </div>
 </div>
 </div>

 <hr className="border-gray-100" />

 {/* Campus Gallery */}
 <div>
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-xs font-bold text-[#1A1A1A]">Campus Gallery</h3>
 {Array.isArray(branch.galleryUrls) && branch.galleryUrls.length > 0 ? (
 <button className="text-xs font-bold text-[#144835] hover:underline">View All</button>
 ) : null}
 </div>
 {Array.isArray(branch.galleryUrls) && branch.galleryUrls.length > 0 ? (
 <div className="grid grid-cols-4 gap-3">
 {branch.galleryUrls.slice(0, 4).map((url: string, i: number) => (
 <div
 key={`${url}-${i}`}
 className="aspect-video bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative group"
 >
 <img src={url} alt="Campus" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
 </div>
 ))}
 </div>
 ) : (
 <div className="text-xs text-gray-500 border border-gray-200 bg-gray-50 rounded-lg p-4">
 No gallery images added for this school yet.
 </div>
 )}
 </div>

 <hr className="border-gray-100" />

 {/* Key Admin */}
 <div>
 <h3 className="text-xs font-bold text-[#1A1A1A] mb-4">Key Administration</h3>
 {Array.isArray(branch.keyAdministration) && branch.keyAdministration.length > 0 ? (
 <div className="flex gap-4 overflow-x-auto pb-2">
 {branch.keyAdministration.map((staff: any, i: number) => (
 <div
 key={staff.id ?? `${staff.name ?? "staff"}-${i}`}
 className="flex items-center gap-3 min-w-[200px] p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
 >
 <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 font-bold text-xs">
 {String(staff.name ?? "S").charAt(0)}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{staff.name ?? "Staff"}</p>
 <p className="text-xs text-gray-500">{staff.role ?? "-"}</p>
 </div>
 </div>
 ))}
 </div>
 ) : branch.principal ? (
 <div className="flex gap-4 overflow-x-auto pb-2">
 <div className="flex items-center gap-3 min-w-[200px] p-3 rounded-lg border border-gray-100">
 <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 font-bold text-xs">
 {String(branch.principal).charAt(0)}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{branch.principal}</p>
 <p className="text-xs text-gray-500">Principal</p>
 </div>
 </div>
 </div>
 ) : (
 <div className="text-xs text-gray-500 border border-gray-200 bg-gray-50 rounded-lg p-4">
 No key administration configured for this school yet.
 </div>
 )}
 </div>

 </div>
 )}

 {activeTab === "Academic Stats" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
 <h3 className="text-xs font-bold text-blue-800 mb-4 flex items-center gap-2">
 <Users size={14} /> Attendance Overview
 </h3>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
 <span>Student Attendance</span>
 <span>{branch.attendance?.student != null ? `${branch.attendance.student}%` : "-"}</span>
 </div>
 <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
 <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Number(branch.attendance?.student ?? 0)}%` }}></div>
 </div>
 </div>
 <div>
 <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
 <span>Staff Attendance</span>
 <span>{branch.attendance?.staff != null ? `${branch.attendance.staff}%` : "-"}</span>
 </div>
 <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
 <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Number(branch.attendance?.staff ?? 0)}%` }}></div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
 <h3 className="text-xs font-bold text-purple-800 mb-4 flex items-center gap-2">
 <BookOpen size={14} /> Class Performance
 </h3>
 {Array.isArray(branch.performanceBySubject) && branch.performanceBySubject.length > 0 ? (
 <div className="space-y-3">
 {branch.performanceBySubject.map((row: any, i: number) => (
 <div key={row.subject ?? i} className="flex justify-between items-center text-xs">
 <span className="font-medium text-gray-700">{row.subject ?? "-"}</span>
 <span className="font-bold text-purple-700">{row.average ?? "-"}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-xs text-gray-500">No subject performance data saved for this school.</div>
 )}
 </div>
 </div>
 
 <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
 <h3 className="text-xs font-bold text-gray-800 mb-6">Performance Trend</h3>
 {Array.isArray(branch.performanceTrend) && branch.performanceTrend.length > 0 ? (
 <div className="h-48 flex items-end justify-between gap-2 px-2">
 {branch.performanceTrend.slice(0, 12).map((point: any, i: number) => (
 <div key={point.label ?? i} className="w-full flex flex-col items-center gap-2 group relative">
 <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap z-10">
 {point.value ?? "-"}%
 </div>
 <div
 className="w-full bg-indigo-500 rounded-t-md transition-all duration-500 group-hover:bg-indigo-600 group-hover:shadow-lg"
 style={{ height: `${Number(point.value ?? 0)}%` }}
 ></div>
 <span className="text-xs font-bold text-gray-400 uppercase">{point.label ?? "-"}</span>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-xs text-gray-500">No performance trend data saved for this school.</div>
 )}
 </div>
 </div>
 )}

 {activeTab === "Financials" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
 <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
 <h3 className="text-xl font-extrabold text-[#144835] mt-1">{branch.revenue ?? "-"}</h3>
 </div>
 <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
 <p className="text-xs font-bold text-gray-400 uppercase">Outstanding Fees</p>
 <h3 className="text-xl font-extrabold text-red-600 mt-1">{branch.outstanding ?? "-"}</h3>
 </div>
 <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
 <p className="text-xs font-bold text-gray-400 uppercase">Expenses (YTD)</p>
 <h3 className="text-xl font-extrabold text-gray-800 mt-1">{branch.expenses ?? "-"}</h3>
 </div>
 </div>

 <div>
 <div className="flex justify-between items-center mb-4">
 <h3 className="text-xs font-bold text-gray-800">Recent Transactions</h3>
 </div>
 <div className="overflow-hidden border border-gray-200 rounded-lg">
 <table className="w-full text-xs text-left">
 <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
 <tr>
 <th className="px-6 py-3">ID</th>
 <th className="px-6 py-3">Date</th>
 <th className="px-6 py-3">Description</th>
 <th className="px-6 py-3 text-right">Amount</th>
 <th className="px-6 py-3 text-center">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {transactions.length > 0 ? (
 transactions.slice(0, 5).map((t: any) => (
 <tr key={t.id} className="bg-white hover:bg-gray-50 transition-colors">
 <td className="px-4 py-2.5 font-medium text-gray-900">{t.ref ?? t.id}</td>
 <td className="px-4 py-2.5 text-gray-500">
 {t.date?.toDate ? t.date.toDate().toLocaleDateString() : t.date ?? "-"}
 </td>
 <td className="px-4 py-2.5 text-gray-700">{t.description ?? "-"}</td>
 <td className="px-4 py-2.5 text-right font-bold text-gray-900">{t.amount ?? "-"}</td>
 <td className="px-4 py-2.5 text-center">
 <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
 {t.status ?? "-"}
 </span>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-500">
 No transactions found in the database for this school.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === "Settings" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="space-y-6">
 <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
 <div className="space-y-1">
 <h3 className="text-xs font-bold text-gray-900">Branch Visibility</h3>
 <p className="text-xs text-gray-500">Control whether this branch is visible in the public directory.</p>
 </div>
 <div className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 className="sr-only peer"
 checked={Boolean(branch.visible)}
 onChange={(e) => handleToggleVisibility(e.target.checked)}
 />
 <div className="w-9 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#144835]"></div>
 </div>
 </div>

 <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
 <div className="space-y-1">
 <h3 className="text-xs font-bold text-gray-900">Notifications</h3>
 <p className="text-xs text-gray-500">Receive alerts for attendance and fee collection anomalies.</p>
 </div>
 <div className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 className="sr-only peer"
 checked={Boolean(branch.notificationsEnabled)}
 onChange={(e) => handleToggleNotifications(e.target.checked)}
 />
 <div className="w-9 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#144835]"></div>
 </div>
 </div>
 </div>

 <div className="border-t border-gray-100 pt-8">
 <h3 className="text-xs font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h3>
 <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
 <div>
 <h4 className="text-xs font-bold text-red-900">Delete this branch</h4>
 <p className="text-xs text-red-700 mt-1">This action cannot be undone. All data will be lost.</p>
 </div>
 <button 
 onClick={handleDeleteBranch}
 className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-colors"
 >
 Delete Branch
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right Sidebar */}
 <div className="space-y-6">
 
 {/* Plan Card */}
 <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Plan</p>
 {branch.plan?.name ? (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="text-xl font-bold text-gray-900">{branch.plan.name}</h3>
 <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
 {branch.plan.status ?? "Active"}
 </span>
 </div>
 {Array.isArray(branch.plan.features) && branch.plan.features.length > 0 ? (
 <ul className="space-y-2">
 {branch.plan.features.map((item: string, i: number) => (
 <li key={`${item}-${i}`} className="flex items-center gap-2 text-xs text-gray-700">
 <CheckCircle2 size={14} className="text-emerald-600" />
 {item}
 </li>
 ))}
 </ul>
 ) : (
 <div className="text-xs text-gray-500">No plan features saved.</div>
 )}
 <div className="text-xs text-gray-500">
 Next billing:{" "}
 {branch.plan.nextBillingAt?.toDate
 ? branch.plan.nextBillingAt.toDate().toLocaleDateString()
 : branch.plan.nextBillingAt ?? "-"}
 </div>
 </div>
 ) : (
 <div className="text-xs text-gray-500">No plan configured for this school.</div>
 )}
 </div>

 {/* Admin Profile */}
 <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-xs font-bold text-gray-800">Assigned Branch Admin</h3>
 </div>
 
 {branchAdmin ? (
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-gray-600 font-bold text-xs">
 {String(branchAdmin.name ?? branchAdmin.email ?? "A").charAt(0)}
 </div>
 <div>
 <h4 className="text-xs font-bold text-gray-900">{branchAdmin.name ?? "Admin"}</h4>
 <p className="text-xs text-gray-500">{branchAdmin.email ?? "-"}</p>
 </div>
 </div>
 ) : (
 <div className="text-xs text-gray-500 mb-6">No admin assigned for this school in user_roles.</div>
 )}

 <div className="flex gap-3">
 <button className="flex-1 py-2.5 bg-gray-50 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors">
 <MessageSquare size={14} /> Chat
 </button>
 <button className="flex-1 py-2.5 bg-gray-50 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors">
 <Shield size={14} /> Permissions
 </button>
 </div>
 </div>

 {/* Activity Log */}
 <div className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100">
 <h3 className="text-xs font-bold text-gray-800 mb-6">Branch Activity</h3>
 <div className="space-y-6">
 {activities.length > 0 ? (
 activities.map((item) => (
 <div key={item.id} className="flex gap-4">
 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-gray-100 text-gray-600">
 <Activity size={14} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900 leading-snug">{item.text ?? item.title ?? "-"}</p>
 <p className="text-xs text-gray-400 mt-1 font-medium">
 {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : item.createdAt ?? "-"}
 </p>
 </div>
 </div>
 ))
 ) : (
 <div className="text-xs text-gray-500">No activity found in /schools/{branchId}/activity.</div>
 )}
 </div>
 </div>

 </div>
 </div>
 </div>
 );
}

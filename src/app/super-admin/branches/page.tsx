"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
 Search, 
 Filter, 
 Plus, 
 Building2, 
 Eye, 
 Edit2, 
 CheckCircle2,
 ChevronLeft,
 ChevronRight,
 MapPin,
 TrendingUp,
 TrendingDown,
 Users,
 GraduationCap,
 MoreHorizontal,
 X,
 Trash2,
 Shield,
 Briefcase
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function BranchesPage() {
 const [branchesData, setBranchesData] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState("All");
 const [regionFilter, setRegionFilter] = useState("All Regions");
 const [currentPage, setCurrentPage] = useState(1);
 
 // State for Edit Modal
 const [editingBranch, setEditingBranch] = useState<any | null>(null);

 useEffect(() => {
 async function fetchSchools() {
 try {
 const schoolsSnapshot = await getDocs(query(collection(db, "schools")));
 const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setBranchesData(schools);
 } catch (error) {
 console.error("Error fetching schools:", error);
 } finally {
 setLoading(false);
 }
 }
 fetchSchools();
 }, []);
 
 // State for More Options Dropdown
 const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
 const actionMenuRef = useRef<HTMLDivElement>(null);

 const itemsPerPage = 6;
 const branches = branchesData;

 // Click outside to close dropdown
 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
 setActiveActionMenu(null);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 // Filter Logic
 const filteredBranches = branches.filter(branch => {
 const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
 (branch.city && branch.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
 (branch.state && branch.state.toLowerCase().includes(searchTerm.toLowerCase()));
 
 const matchesStatus = statusFilter === "All" || branch.status === statusFilter;
 const matchesRegion = regionFilter === "All Regions" || branch.state === regionFilter;

 return matchesSearch && matchesStatus && matchesRegion;
 });

 // Derived metrics — computed from real Firebase data
 const totalBranches = branches.length;
 const activeBranches = branches.filter(b => b.status === "Active").length;
 const totalStudents = branches.reduce((acc, curr) => acc + (curr.students || 0), 0);
 const totalStaff = branches.reduce((acc, curr) => acc + (curr.teachers || 0) + (curr.admins || 0), 0);

 if (loading) {
 return (
 <div className="flex h-96 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
 </div>
 );
 }

 // Pagination Logic
 const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
 const paginatedBranches = filteredBranches.slice(
 (currentPage - 1) * itemsPerPage,
 currentPage * itemsPerPage
 );

 const handleNextPage = () => {
 if (currentPage < totalPages) setCurrentPage(currentPage + 1);
 };

 const handlePrevPage = () => {
 if (currentPage > 1) setCurrentPage(currentPage - 1);
 };

 // Enhanced Stats matching Dashboard style
 const statsCards = [
 {
 label: "TOTAL BRANCHES",
 value: branches.length.toString(),
 icon: Building2,
 trend: "+2 new",
 trendUp: true,
 bg: "bg-blue-50",
 color: "text-blue-600",
 border: "border-blue-100"
 },
 {
 label: "ACTIVE BRANCHES",
 value: branches.filter(b => b.status === "Active").length.toString(),
 icon: CheckCircle2,
 trend: "Stable",
 trendUp: true,
 bg: "bg-emerald-50",
 color: "text-emerald-600",
 border: "border-emerald-100"
 },
 {
 label: "TOTAL STUDENTS",
 value: totalStudents.toLocaleString("en-IN"),
 icon: GraduationCap,
 trend: "+12.5%",
 trendUp: true,
 bg: "bg-orange-50",
 color: "text-orange-600",
 border: "border-orange-100"
 },
 {
 label: "TOTAL STAFF",
 value: totalStaff.toLocaleString("en-IN"),
 icon: Users,
 trend: "+4.2%",
 trendUp: true,
 bg: "bg-purple-50",
 color: "text-purple-600",
 border: "border-purple-100"
 }
 ];

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">
 
 {/* Header Section */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-xl font-bold text-[#1A1A1A]">Manage Branches</h1>
 <p className="text-gray-500 text-xs mt-1">Oversee and manage all school branches across regions.</p>
 </div>
 <Link 
 href="/super-admin/branches/new"
 className="px-5 py-2.5 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center gap-2 shadow-lg shadow-[#144835]/20 transition-all transform hover:-translate-y-0.5"
 >
 <Plus size={18} />
 Add New Branch
 </Link>
 </div>

 {/* Stats Grid - Matching Dashboard Style */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {statsCards.map((stat, idx) => (
 <div key={idx} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer">
 <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500", stat.color)}>
 <stat.icon size={64} />
 </div>

 <div className="flex justify-between items-start mb-4 relative z-10">
 <div className={cn("p-3 rounded-lg", stat.bg, stat.color)}>
 <stat.icon size={20} />
 </div>
 <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-lg", stat.trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
 {stat.trendUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
 {stat.trend}
 </div>
 </div>
 
 <div className="relative z-10">
 <h3 className="text-xl font-bold text-gray-800 mb-1">{stat.value}</h3>
 <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Main Content Card */}
 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
 
 {/* Filters Bar */}
 <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/30">
 <div className="relative w-full lg:w-96">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder="Search by name, ID or city..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 
 <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
 <div className="relative min-w-[140px]">
 <select
 value={regionFilter}
 onChange={(e) => setRegionFilter(e.target.value)}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
 >
 <option>All Regions</option>
 <option>North</option>
 <option>South</option>
 <option>East</option>
 <option>West</option>
 <option>Central</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>

 <div className="relative min-w-[140px]">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
 >
 <option>Status: All</option>
 <option>Active</option>
 <option>Inactive</option>
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={14} />
 </div>

 <button className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#144835] transition-colors shadow-sm">
 <Filter size={18} />
 </button>
 </div>
 </div>

 {/* Branches Table */}
 <div className="overflow-visible flex-grow">
 <table className="w-full">
 <thead className="bg-gray-50/50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
 <tr>
 <th className="px-4 py-2.5">Branch Info</th>
 <th className="px-4 py-2.5">Location</th>
 <th className="px-4 py-2.5">Capacity</th>
 <th className="px-4 py-2.5 text-center">Stats</th>
 <th className="px-4 py-2.5 text-center">Status</th>
 <th className="px-4 py-2.5 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {paginatedBranches.length > 0 ? (
 paginatedBranches.map((branch) => (
 <tr key={branch.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <Link href={`/super-admin/branches/${encodeURIComponent(branch.id)}`} className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
 <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">
 <Building2 size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#144835] transition-colors">{branch.name}</p>
 <p className="text-xs text-gray-500">{branch.id}</p>
 </div>
 </Link>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex flex-col">
 <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
 <MapPin size={14} className="text-gray-400" /> {branch.city}, {branch.state}
 </span>
 <span className="text-xs text-gray-400 pl-5">{branch.region} Region</span>
 </div>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-3">
 <div className="flex-1 w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
 <div 
 className="h-full bg-[#144835] rounded-full" 
 style={{ width: `${branch.progress}%` }}
 ></div>
 </div>
 <span className="text-xs font-bold text-gray-700">{branch.progress}%</span>
 </div>
 <p className="text-xs text-gray-400 mt-1">{branch.students} Students</p>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center justify-center gap-4">
 <div className="text-center">
 <p className="text-xs font-bold text-gray-700">{branch.admins}</p>
 <p className="text-xs text-gray-400 uppercase">Admins</p>
 </div>
 <div className="w-px h-6 bg-gray-200"></div>
 <div className="text-center">
 <span className={cn(
 "inline-flex items-center gap-1 text-xs font-bold",
 branch.growth?.startsWith('+') ? "text-green-600" : "text-red-600"
 )}>
 {branch.growth?.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
 {branch.growth}
 </span>
 <p className="text-xs text-gray-400 uppercase">Growth</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2.5 text-center">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
 branch.status === "Active" 
 ? "bg-green-50 text-green-700 border-green-100" 
 : "bg-amber-50 text-amber-700 border-amber-100"
 )}>
 <span className={cn("w-1.5 h-1.5 rounded-full", branch.status === "Active" ? "bg-green-600" : "bg-amber-600")}></span>
 {branch.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right relative">
 <div className="flex items-center justify-end gap-2">
 <Link 
 href={`/super-admin/branches/${encodeURIComponent(branch.id)}`} 
 className="p-2 text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 rounded-lg transition-colors"
 title="View Details"
 >
 <Eye size={18} />
 </Link>
 
 <button 
 onClick={() => setEditingBranch(branch)}
 className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit2 size={18} />
 </button>
 
 <div className="relative">
 <button 
 onClick={(e) => {
 e.stopPropagation();
 setActiveActionMenu(activeActionMenu === branch.id ? null : branch.id);
 }}
 className={cn(
 "p-2 rounded-lg transition-colors",
 activeActionMenu === branch.id 
 ? "text-[#144835] bg-[#144835]/10" 
 : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
 )}
 >
 <MoreHorizontal size={18} />
 </button>
 
 {activeActionMenu === branch.id && (
 <div 
 ref={actionMenuRef}
 className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
 >
 <div className="py-1">
 <Link 
 href={`/super-admin/branches/${encodeURIComponent(branch.id)}`}
 className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#144835]"
 >
 <Eye size={14} /> View Details
 </Link>
 <button 
 className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#144835] text-left"
 >
 <Briefcase size={14} /> Manage Staff
 </button>
 <button 
 className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#144835] text-left"
 >
 <Shield size={14} /> Permissions
 </button>
 <div className="h-px bg-gray-100 my-1"></div>
 <button 
 className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left"
 >
 <Trash2 size={14} /> Delete Branch
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
 <div className="flex flex-col items-center justify-center gap-3">
 <div className="p-4 bg-gray-50 rounded-full">
 <Building2 size={32} className="text-gray-300" />
 </div>
 <div>
 <p className="font-bold text-gray-900">No branches found</p>
 <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
 </div>
 <button 
 onClick={() => {
 setSearchTerm("");
 setStatusFilter("All");
 setRegionFilter("All Regions");
 }}
 className="text-xs font-bold text-[#144835] hover:underline"
 >
 Clear all filters
 </button>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 
 {/* Pagination */}
 <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
 <p className="text-xs text-gray-500">
 Showing <span className="font-bold text-gray-900">
 {filteredBranches.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
 -
 {Math.min(currentPage * itemsPerPage, filteredBranches.length)}
 </span> of <span className="font-bold text-gray-900">{filteredBranches.length}</span> branches
 </p>
 <div className="flex items-center gap-2">
 <button 
 onClick={handlePrevPage}
 disabled={currentPage === 1}
 className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#144835] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
 >
 <ChevronLeft size={14} />
 </button>
 
 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={cn(
 "w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
 currentPage === page
 ? "bg-[#144835] text-white shadow-md shadow-[#144835]/20"
 : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
 )}
 >
 {page}
 </button>
 ))}

 <button 
 onClick={handleNextPage}
 disabled={currentPage === totalPages || totalPages === 0}
 className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-[#144835] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
 >
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 </div>

 {/* Edit Modal */}
 {editingBranch && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
 <div className="bg-white rounded-[16px] w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
 <div className="px-4 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
 <h3 className="text-lg font-bold text-[#1A1A1A]">Edit Branch</h3>
 <button 
 onClick={() => setEditingBranch(null)}
 className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
 >
 <X size={20} />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Branch Name</label>
 <input 
 type="text" 
 defaultValue={editingBranch.name}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Location</label>
 <div className="relative">
 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
 <input 
 type="text" 
 defaultValue={editingBranch.location}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Status</label>
 <select 
 defaultValue={editingBranch.status}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 >
 <option>Active</option>
 <option>Inactive</option>
 </select>
 </div>
 </div>

 <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
 <button 
 onClick={() => setEditingBranch(null)}
 className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
 >
 Cancel
 </button>
 <button 
 onClick={() => setEditingBranch(null)}
 className="px-4 py-2 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 shadow-lg shadow-[#144835]/20 transition-colors"
 >
 Save Changes
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
 Search, 
 UserPlus, 
 RefreshCw,
 Edit2, 
 Trash2, 
 ChevronLeft, 
 ChevronRight, 
 MapPin, 
 Download,
 CheckCircle2,
 XCircle,
 Mail,
 Phone,
 ArrowUpRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

function normalizeStatus(value: unknown): "Active" | "Inactive" | "Suspended" {
 const s = String(value ?? "").toLowerCase();
 if (s === "active") return "Active";
 if (s === "inactive") return "Inactive";
 if (s === "suspended") return "Suspended";
 return "Active";
}

export default function UsersPage() {
 const [usersData, setUsersData] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 
 const [searchTerm, setSearchTerm] = useState("");
 const [roleFilter, setRoleFilter] = useState("All Roles");
 const [branchFilter, setBranchFilter] = useState("All Branches");
 const [statusFilter, setStatusFilter] = useState("All Status");
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
 const itemsPerPage = 8;

 useEffect(() => {
 let superAdminsLoaded = false;
 let rolesLoaded = false;
 let superAdmins: any[] = [];
 let roles: any[] = [];

 const sync = () => {
 const merged = [...superAdmins, ...roles].sort((a, b) => {
 const roleCompare = String(a.role ?? "").localeCompare(String(b.role ?? ""));
 if (roleCompare !== 0) return roleCompare;
 return String(a.email ?? "").localeCompare(String(b.email ?? ""));
 });
 setUsersData(merged);
 if (superAdminsLoaded && rolesLoaded) setLoading(false);
 };

 const unsubSuperAdmins = onSnapshot(
 collection(db, "super_admin_users"),
 (snap) => {
 superAdminsLoaded = true;
 superAdmins = snap.docs.map((d) => {
 const data = d.data() as any;
 return {
 id: d.id,
 ...data,
 role: data.role ?? "super_admin",
 schoolId: "All Branches",
 status: normalizeStatus(data.status),
 };
 });
 sync();
 },
 (err) => {
 console.error("Error listening super_admin_users:", err);
 superAdminsLoaded = true;
 sync();
 }
 );

 const unsubRoles = onSnapshot(
 collection(db, "user_roles"),
 (snap) => {
 rolesLoaded = true;
 roles = snap.docs.map((d) => {
 const data = d.data() as any;
 return {
 id: d.id,
 ...data,
 status: normalizeStatus(data.status),
 };
 });
 sync();
 },
 (err) => {
 console.error("Error listening user_roles:", err);
 rolesLoaded = true;
 sync();
 }
 );

 return () => {
 unsubSuperAdmins();
 unsubRoles();
 };
 }, []);

 const users = usersData;

 // Filter Logic
 // Get unique values for dropdowns
 const uniqueRoles = Array.from(new Set(users.map(u => u.role)));
 const uniqueBranches = Array.from(
 new Set(users.map((u) => u.schoolId).filter((v) => v && v !== "All Branches"))
 );

 const filteredUsers = users.filter((user) => {
 const matchesSearch =
 user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 user.id?.toString().includes(searchTerm);
 
 // Check if roleFilter is applied
 let matchesRole = true;
 if (roleFilter !== "All Roles") {
 const dbRole = user.role;
 if (roleFilter === "Super Admin" && dbRole !== "super_admin") matchesRole = false;
 if (roleFilter === "Branch Admin" && dbRole !== "admin") matchesRole = false;
 if (roleFilter === "Teacher" && dbRole !== "teacher") matchesRole = false;
 if (roleFilter === "Student" && dbRole !== "student") matchesRole = false;
 }

 const matchesBranch = branchFilter === "All Branches" || user.schoolId === branchFilter;
 const matchesStatus = statusFilter === "All Status" || user.status === statusFilter;
 return matchesSearch && matchesRole && matchesBranch && matchesStatus;
 });

 const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
 const paginatedUsers = filteredUsers.slice(
 (currentPage - 1) * itemsPerPage,
 currentPage * itemsPerPage
 );

 // Toggle Selection
 const toggleSelectAll = () => {
 const pageIds = paginatedUsers.map(u => u.id);
 const allSelected = pageIds.every(id => selectedUsers.includes(id));

 if (allSelected) {
 // Deselect all on this page
 setSelectedUsers(selectedUsers.filter(id => !pageIds.includes(id)));
 } else {
 // Select all on this page
 const newSelected = new Set([...selectedUsers, ...pageIds]);
 setSelectedUsers(Array.from(newSelected));
 }
 };

 const toggleSelectUser = (id: string) => {
 if (selectedUsers.includes(id)) {
 setSelectedUsers(selectedUsers.filter(uid => uid !== id));
 } else {
 setSelectedUsers([...selectedUsers, id]);
 }
 };

 const handleDeleteSelected = () => {
 if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
 alert("Delete action simulated");
 setSelectedUsers([]);
 }
 }

 const handleEmailSelected = () => {
 alert(`Opening email composer for ${selectedUsers.length} users`);
 }

 const handleExportCSV = () => {
 const headers = ["ID", "Name", "Role", "Branch", "Email", "Status"];
 const csvContent = [
 headers.join(","),
 ...filteredUsers.map(user => 
 [user.id, `"${user.name ?? ""}"`, user.role, user.schoolId ?? "", user.email, user.status].join(",")
 )
 ].join("\n");

 const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
 const link = document.createElement("a");
 const url = URL.createObjectURL(blob);
 link.setAttribute("href", url);
 link.setAttribute("download", "users_export.csv");
 link.style.visibility = "hidden";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 // Helper for Role Badges
 const getRoleBadgeStyle = (role: string) => {
 switch (role) {
 case "super_admin": return "bg-purple-50 text-purple-700 border-purple-100";
 case "admin": return "bg-blue-50 text-blue-700 border-blue-100";
 case "teacher": return "bg-orange-50 text-orange-700 border-orange-100";
 case "student": return "bg-emerald-50 text-emerald-700 border-emerald-100";
 default: return "bg-gray-50 text-gray-700 border-gray-100";
 }
 };

 if (loading) {
 return (
 <div className="flex h-96 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
 </div>
 );
 }

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">
 
 {/* Header */}
 <div className="flex flex-col gap-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-xl font-bold text-[#1A1A1A]">User Management</h1>
 <p className="text-gray-500 text-xs mt-1">Manage access, roles, and permissions across the organization.</p>
 </div>
 <div className="flex gap-3">
 <ExportButton data={filteredUsers} filename="Export" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm" iconSize={18} />
 <Link 
 href="/super-admin/users/new"
 className="px-5 py-2.5 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center gap-2 shadow-lg shadow-[#144835]/20 transition-all transform hover:-translate-y-0.5"
 >
 <UserPlus size={18} />
 Add New User
 </Link>
 </div>
 </div>
 </div>

 {/* Main Content Card */}
 <div className="bg-white border border-gray-200 rounded-[16px] shadow-sm overflow-hidden">
 
 {/* Filters Bar */}
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
 
 {/* Search */}
 <div className="relative w-full lg:w-96 group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors" size={18} />
 <input
 type="text"
 placeholder="Search users by name, email or ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>

 {/* Filters */}
 <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
 <div className="relative min-w-[140px]">
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
 >
 <option key="all-roles">All Roles</option>
 {["Super Admin", "Branch Admin", "Teacher", "Student"].map((role, idx) => (
 <option key={`role-${idx}-${role}`} value={role}>{role}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
 </div>

 <div className="relative min-w-[140px]">
 <select
 value={branchFilter}
 onChange={(e) => setBranchFilter(e.target.value)}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
 >
 <option key="all-branches">All Branches</option>
 {uniqueBranches.map((branch, idx) => (
 <option key={`branch-${idx}-${branch}`} value={branch}>{branch}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
 </div>

 <div className="relative min-w-[140px]">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 cursor-pointer font-medium hover:border-gray-300 transition-colors shadow-sm"
 >
 <option key="all-status">All Status</option>
 {["Active", "Inactive", "Suspended"].map((status, idx) => (
 <option key={`status-${idx}-${status}`} value={status}>{status}</option>
 ))}
 </select>
 <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
 </div>

 <button 
 onClick={() => {
 setSearchTerm("");
 setRoleFilter("All Roles");
 setBranchFilter("All Branches");
 setStatusFilter("All Status");
 setCurrentPage(1);
 }}
 className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#144835] hover:border-[#144835] transition-colors shadow-sm flex-shrink-0 flex items-center justify-center" 
 title="Reset Filters"
 >
 <RefreshCw size={16} />
 </button>
 </div>
 </div>

 {/* Table Actions (Selection) */}
 {selectedUsers.length > 0 && (
 <div className="bg-[#144835]/5 px-6 py-3 flex items-center justify-between border-b border-[#144835]/10 animate-in slide-in-from-top-2">
 <span className="text-xs font-bold text-[#144835]">{selectedUsers.length} users selected</span>
 <div className="flex gap-3">
 <button 
 onClick={handleDeleteSelected}
 className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
 >
 <Trash2 size={14} /> Delete Selected
 </button>
 <button 
 onClick={handleEmailSelected}
 className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
 >
 <Mail size={14} /> Email Selected
 </button>
 </div>
 </div>
 )}

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
 <th className="px-4 py-2 w-10">
 <input 
 type="checkbox" 
 className="rounded border-gray-300 text-[#144835] focus:ring-[#144835]"
 checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.id))}
 onChange={toggleSelectAll}
 />
 </th>
 <th className="px-4 py-2">User Profile</th>
 <th className="px-4 py-2">Role & Branch</th>
 <th className="px-4 py-2">Contact Info</th>
 <th className="px-4 py-2">Status</th>
 <th className="px-4 py-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {paginatedUsers.length > 0 ? (
 paginatedUsers.map((user) => (
 <tr key={user.id} className="group hover:bg-gray-50/80 transition-colors">
 <td className="px-4 py-2">
 <input 
 type="checkbox" 
 className="rounded border-gray-300 text-[#144835] focus:ring-[#144835]"
 checked={selectedUsers.includes(user.id)}
 onChange={() => toggleSelectUser(user.id)}
 />
 </td>
 <td className="px-4 py-2">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#144835] font-bold text-base uppercase border border-gray-200 flex-shrink-0">
 {user.name ? user.name.charAt(0) : user.email?.charAt(0)}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900 group-hover:text-[#144835] transition-colors">{user.name || "User"}</p>
 <p className="text-xs text-gray-500">ID: #{user.id}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-2">
 <div className="space-y-1">
 <span className={cn("inline-flex px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wide border", getRoleBadgeStyle(user.role))}>
 {user.role?.replace('_', ' ')}
 </span>
 <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
 <MapPin size={10} />
 {user.schoolId || 'All Branches'}
 </div>
 </div>
 </td>
 <td className="px-4 py-2">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
 <Mail size={12} className="text-gray-400" /> {user.email}
 </div>
 <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
 <Phone size={12} className="text-gray-400" /> {user.phone ?? "-"}
 </div>
 </div>
 </td>
 <td className="px-4 py-2">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
 user.status === "Active" 
 ? "bg-green-50 text-green-700 border-green-200" 
 : "bg-gray-50 text-gray-600 border-gray-200"
 )}>
 {user.status === "Active" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
 {user.status}
 </span>
 </td>
 <td className="px-4 py-2 text-right relative">
 <div className="flex items-center justify-end gap-2 transition-opacity">
 <button 
 onClick={() => alert(`View details for ${user.name}`)}
 className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors" 
 title="View Details"
 >
 <ArrowUpRight size={14} />
 </button>
 <button 
 onClick={() => alert(`Edit user ${user.name}`)}
 className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" 
 title="Edit"
 >
 <Edit2 size={14} />
 </button>
 <button 
 onClick={() => confirm(`Are you sure you want to delete ${user.name}?`) && alert("User deleted successfully")}
 className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
 title="Delete"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
 <div className="flex flex-col items-center justify-center gap-3">
 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
 <Search size={18} className="text-gray-400" />
 </div>
 <div>
 <p className="text-base font-bold text-gray-900">No users found</p>
 <p className="text-xs text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
 </div>
 <button 
 onClick={() => {
 setSearchTerm("");
 setRoleFilter("All Roles");
 setBranchFilter("All Branches");
 setStatusFilter("All Status");
 }}
 className="mt-2 text-xs font-bold text-[#144835] hover:underline"
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
 <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
 <p className="text-xs font-medium text-gray-500">
 Showing <span className="font-bold text-gray-900">
 {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
 </span> to <span className="font-bold text-gray-900">
 {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
 </span> of <span className="font-bold text-gray-900">{filteredUsers.length}</span> results
 </p>
 
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-[#144835] hover:border-[#144835] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
 >
 <ChevronLeft size={14} />
 </button>
 
 <div className="flex items-center gap-1">
 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
 <button
 key={page}
 onClick={() => setCurrentPage(page)}
 className={cn(
 "w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center",
 currentPage === page
 ? "bg-[#144835] text-white shadow-lg shadow-[#144835]/20"
 : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
 )}
 >
 {page}
 </button>
 ))}
 </div>

 <button 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages || totalPages === 0}
 className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-[#144835] hover:border-[#144835] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
 >
 <ChevronRight size={14} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

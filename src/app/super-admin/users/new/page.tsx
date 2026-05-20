"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
 Save, 
 User, 
 Mail, 
 Phone, 
 Lock, 
 Eye, 
 EyeOff, 
 ChevronRight, 
 Info, 
 CheckCircle2,
 Building2,
 ShieldCheck,
 Briefcase,
 Upload,
 Camera,
 RefreshCw
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function CreateUserPage() {
 const [showPassword, setShowPassword] = useState(false);
 const [role, setRole] = useState("Student");
 const [formData, setFormData] = useState({
 firstName: "",
 lastName: "",
 email: "",
 phone: "",
 password: "",
 confirmPassword: ""
 });
 const [avatar, setAvatar] = useState<string | null>(null);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const generatePassword = () => {
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
 let pass = "";
 for (let i = 0; i < 12; i++) {
 pass += chars.charAt(Math.floor(Math.random() * chars.length));
 }
 setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
 };

 const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const reader = new FileReader();
 reader.onload = (e) => {
 if (e.target?.result) {
 setAvatar(e.target.result as string);
 }
 };
 reader.readAsDataURL(e.target.files[0]);
 }
 };

 return (
 <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
 {/* Breadcrumb & Header */}
 <div className="flex flex-col gap-4">
 <nav className="flex items-center text-xs font-medium text-gray-400">
 <Link href="/super-admin" className="hover:text-[#004D40] transition-colors">Dashboard</Link>
 <ChevronRight size={14} className="mx-2" />
 <Link href="/super-admin/users" className="hover:text-[#004D40] transition-colors">Users</Link>
 <ChevronRight size={14} className="mx-2" />
 <span className="text-[#004D40]">New User</span>
 </nav>
 
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">Create New User</h1>
 <p className="text-gray-500 text-xs mt-1 font-medium">Add a new user account to the system and assign permissions.</p>
 </div>
 <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
 <Info size={18} />
 <span className="text-xs font-bold uppercase tracking-wider">Status: Pending Activation</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column: Forms */}
 <div className="lg:col-span-2 space-y-8">
 {/* Personal Information Card */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-50 bg-gray-50/30">
 <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-[#004D40] text-white">
 <User size={18} />
 </div>
 Personal Information
 </h2>
 </div>
 
 <div className="p-8 space-y-8">
 {/* Avatar Upload */}
 <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-gray-100">
 <div className="relative group cursor-pointer">
 <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-[#004D40] transition-colors">
 {avatar ? (
 <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <User size={32} className="text-gray-400" />
 )}
 </div>
 <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-2 bg-[#004D40] text-white rounded-full shadow-lg hover:bg-[#003d33] transition-colors cursor-pointer">
 <Camera size={14} />
 </label>
 <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
 </div>
 <div className="text-center sm:text-left">
 <h3 className="font-bold text-gray-900">Profile Picture</h3>
 <p className="text-xs text-gray-500 mt-1 max-w-xs">Upload a professional photo. Recommended size: 400x400px. Max file size: 2MB.</p>
 <div className="flex gap-2 mt-3 justify-center sm:justify-start">
 <label htmlFor="avatar-upload" className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
 Choose File
 </label>
 {avatar && (
 <button onClick={() => setAvatar(null)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
 Remove
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">First Name <span className="text-red-500">*</span></label>
 <div className="relative group">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type="text" 
 name="firstName"
 value={formData.firstName}
 onChange={handleInputChange}
 placeholder="e.g. John" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Last Name <span className="text-red-500">*</span></label>
 <div className="relative group">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type="text" 
 name="lastName"
 value={formData.lastName}
 onChange={handleInputChange}
 placeholder="e.g. Doe" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Email Address <span className="text-red-500">*</span></label>
 <div className="relative group">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type="email" 
 name="email"
 value={formData.email}
 onChange={handleInputChange}
 placeholder="john.doe@idps.edu" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Phone Number</label>
 <div className="relative group">
 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type="tel" 
 name="phone"
 value={formData.phone}
 onChange={handleInputChange}
 placeholder="+91 (000) 000-0000" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Role & Access Card */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-50 bg-gray-50/30">
 <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-[#004D40] text-white">
 <ShieldCheck size={18} />
 </div>
 Role & Access
 </h2>
 </div>
 
 <div className="p-8 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Role Assignment <span className="text-red-500">*</span></label>
 <div className="relative group">
 <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <select 
 value={role}
 onChange={(e) => setRole(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all appearance-none cursor-pointer"
 >
 <option value="Student">Student</option>
 <option value="Teacher">Teacher</option>
 <option value="Admin">Admin</option>
 <option value="Principal">Principal</option>
 <option value="Accountant">Accountant</option>
 <option value="Staff">Staff</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Assigned Branch <span className="text-red-500">*</span></label>
 <div className="relative group">
 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <select className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all appearance-none cursor-pointer">
 <option>Main Campus</option>
 <option>West Wing</option>
 <option>North Heights</option>
 <option>Silicon Valley</option>
 <option>Eastern Enclave</option>
 </select>
 </div>
 </div>
 </div>

 {/* Security */}
 <div className="pt-4 border-t border-gray-100">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-gray-700 ml-1">Password <span className="text-red-500">*</span></label>
 <button 
 type="button"
 onClick={generatePassword}
 className="text-xs font-bold text-[#004D40] hover:underline flex items-center gap-1"
 >
 <RefreshCw size={12} /> Generate
 </button>
 </div>
 <div className="relative group">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type={showPassword ? "text" : "password"}
 name="password"
 value={formData.password}
 onChange={handleInputChange}
 placeholder="••••••••••••" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-12 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004D40] transition-colors"
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 ml-1">Confirm Password <span className="text-red-500">*</span></label>
 <div className="relative group">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004D40] transition-colors" size={18} />
 <input 
 type={showPassword ? "text" : "password"}
 name="confirmPassword"
 value={formData.confirmPassword}
 onChange={handleInputChange}
 placeholder="••••••••••••" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-12 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#004D40]/5 focus:border-[#004D40] transition-all"
 />
 </div>
 </div>
 </div>
 <p className="text-xs text-gray-500 mt-2 ml-1">
 Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Summary & Tips */}
 <div className="space-y-8">
 {/* Summary Card */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-50 bg-gray-50/30">
 <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-[#004D40] text-white">
 <Info size={18} />
 </div>
 User Summary
 </h2>
 </div>
 <div className="p-4 space-y-4">
 <div className="flex justify-between items-center py-2 border-b border-gray-50">
 <span className="text-xs text-gray-500">User Type</span>
 <span className="text-xs font-bold text-[#004D40] px-2 py-1 bg-emerald-50 rounded-md">{role}</span>
 </div>
 <div className="flex justify-between items-center py-2 border-b border-gray-50">
 <span className="text-xs text-gray-500">Access Level</span>
 <span className="text-xs font-medium text-gray-900">
 {role === "Admin" || role === "Principal" ? "Full Access" : "Restricted"}
 </span>
 </div>
 <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
 <Info className="text-blue-600 shrink-0" size={20} />
 <p className="text-xs text-blue-700 font-medium leading-relaxed">
 An invitation email will be sent to the user with their login credentials and a link to set up 2FA.
 </p>
 </div>
 </div>
 </div>

 {/* Tips Card */}
 <div className="bg-[#004D40] rounded-[16px] shadow-xl p-8 text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
 <CheckCircle2 size={20} className="text-emerald-400" />
 Quick Checklist
 </h3>
 <ul className="space-y-4 relative z-10">
 {[
 "Verify email accuracy",
 "Assign correct role",
 "Select primary branch",
 "Check permission scope"
 ].map((item, i) => (
 <li key={i} className="flex items-start gap-3 text-xs font-medium text-emerald-50/80">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1"></div>
 {item}
 </li>
 ))}
 </ul>
 </div>
 </div>
 </div>

 {/* Sticky Action Footer */}
 <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 lg:left-64 lg:ml-0 transition-all duration-300">
 <div className="max-w-6xl mx-auto flex justify-end gap-4">
 <Link 
 href="/super-admin/users"
 className="px-8 py-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
 >
 Cancel
 </Link>
 <button className="px-8 py-3 bg-[#004D40] text-white rounded-lg text-xs font-bold hover:bg-[#003d33] flex items-center gap-2 shadow-lg shadow-[#004D40]/20 transition-all transform active:scale-95">
 <Save size={18} />
 Create User
 </button>
 </div>
 </div>
 </div>
 );
}

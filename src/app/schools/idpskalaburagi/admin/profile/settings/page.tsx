"use client";

import { useMemo, useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Bell, Lock, Search, ShieldAlert, Smartphone, User, Laptop, Pencil, LogOut, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "Basic Info" | "Password" | "Preferences" | "Privacy" | "Sessions";

const tabs: Tab[] = ["Basic Info", "Password", "Preferences", "Privacy", "Sessions"];

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AdminProfileSettingsPage() {
 const { user, role, updateProfile } = useAuth();
 const [tab, setTab] = useState<Tab>("Basic Info");
 const [digest, setDigest] = useState("Summarized (Once daily at 8 AM)");
 const [saved, setSaved] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Form State
 const [profileForm, setProfileForm] = useState({
   displayName: user?.displayName ?? "",
   email: user?.email ?? "",
   phone: user?.phone ?? "",
   designation: user?.designation || (role === "admin" ? "Senior Operations Manager" : role ?? "Admin Role"),
   department: user?.department ?? "Logistics - Mumbai South",
   employeeId: "EMP-2024-045",
 });

 useEffect(() => {
   if (user) {
     setProfileForm(p => ({
       ...p,
       displayName: user.displayName ?? p.displayName,
       email: user.email ?? p.email,
       phone: user.phone ?? p.phone,
       designation: user.designation ?? p.designation,
       department: user.department ?? p.department,
     }));
   }
 }, [user]);

 const userInitials = useMemo(() => {
   const name = profileForm.displayName || profileForm.email || "SS";
   return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
 }, [profileForm.displayName, profileForm.email]);

 const handleSaveProfile = async () => {
   try {
     setError(null);
     await updateProfile({
       displayName: profileForm.displayName,
       phone: profileForm.phone,
       designation: profileForm.designation,
       department: profileForm.department,
     });
     setSaved(true);
     setTimeout(() => setSaved(false), 2500);
   } catch (err: any) {
     setError(err.message || "Failed to update profile");
   }
 };

 const sessions = useMemo(() => {
 return [
 { id: "s1", device: "Chrome, Windows 11", meta: "192.168.1.104 • Mumbai, IN", status: "ACTIVE", icon: Laptop },
 { id: "s2", device: "iPhone 15, iOS 17", meta: "2 hrs ago", status: "Logout", icon: Smartphone },
 { id: "s3", device: "Safari, macOS Sonoma", meta: "Yesterday", status: "Logout", icon: Laptop },
 ] as const;
 }, []);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-jost pb-20 sm:pb-24 max-w-[1600px] mx-auto -mx-0.5 sm:mx-auto">
      {/* ── Profile Hero ── */}
      <div className="relative bg-gradient-to-br from-[#144835] via-[#1a5a40] to-[#0d2e22] text-white border border-[#0d2e22] ring-1 ring-inset ring-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 sm:h-40 w-32 sm:w-40 rounded-full bg-[#a2c144]/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-2xl border-4 border-white/30 shadow-xl overflow-hidden bg-white/10 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{userInitials}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-black text-white tracking-tight">{profileForm.displayName || "Admin User"}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white border border-white/10">
                {profileForm.designation}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-[#a2c144]/80 rounded-lg text-[10px] font-black text-[#144835]">
                {role === "super_admin" ? "Super Admin" : "Admin Role"}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1.5 font-medium">{profileForm.email}</p>
          </div>

          {/* Search bar inside hero */}
          <div className="relative w-full sm:w-[240px] mt-4 sm:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={14} />
            <input
              className="w-full h-9 bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 text-xs font-medium text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/15 transition-all shadow-sm"
              placeholder="Search settings..."
            />
          </div>
        </div>
      </div>

 {/* Tabs */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
 <div className="p-2 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-2">
 {tabs.map((t) => {
 const active = t === tab;
 return (
 <button
 key={t}
 type="button"
 onClick={() => setTab(t)}
 className={cn(
 "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
 active ? "text-[#144835] bg-white border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
 )}
 >
 {t}
 </button>
 );
 })}
 </div>

 {tab === "Basic Info" ? (
 <div className="p-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
 <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
 <User size={16} />
 </div>
 <p className="text-sm font-bold text-gray-900">Basic Information</p>
 </div>
  <button onClick={handleSaveProfile} type="button" className="inline-flex items-center gap-2 rounded-lg bg-[#144835] px-3 h-8 text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
  <Save size={14} /> Save Profile
  </button>
  </div>

  {error && (
    <div className="mx-4 mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
      <ShieldAlert size={14} /> {error}
    </div>
  )}

  {saved && (
    <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[10px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
      <CheckCircle2 size={14} /> Profile updated successfully
    </div>
  )}

  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Full Name</label>
      <input
        value={profileForm.displayName}
        onChange={e => setProfileForm(p => ({ ...p, displayName: e.target.value }))}
        className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</label>
      <input
        value={profileForm.email}
        disabled
        className="w-full h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-[10px] font-medium text-gray-500 focus:outline-none shadow-sm transition-all cursor-not-allowed"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Phone Number</label>
      <input
        value={profileForm.phone}
        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
        placeholder="+91 98765 43210"
        className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Employee ID</label>
      <input
        value={profileForm.employeeId}
        disabled
        className="w-full h-8 rounded-lg border border-gray-200 bg-gray-50 px-3 text-[10px] font-medium text-gray-500 focus:outline-none shadow-sm transition-all cursor-not-allowed"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Designation / Role</label>
      <input
        value={profileForm.designation}
        onChange={e => setProfileForm(p => ({ ...p, designation: e.target.value }))}
        className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Department & Branch</label>
      <input
        value={profileForm.department}
        onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
        className="w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all"
      />
    </div>
  </div>
 </div>

 <div className="lg:col-span-4 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
 <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
 <Lock size={16} />
 </div>
 <p className="text-sm font-bold text-gray-900">Change Password</p>
 </div>

 <div className="p-4 space-y-4">
 <div>
 <label className="text-[10px] font-bold text-gray-700">Current Password</label>
 <input
 type="password"
 className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm"
 placeholder="••••••••"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">New Password</label>
 <input
 type="password"
 className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm"
 placeholder="••••••••"
 />
 <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
 <div className="h-full w-2/3 bg-[#144835] rounded-full" />
 </div>
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-700">Confirm Password</label>
 <input
 type="password"
 className="mt-1.5 w-full h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm"
 placeholder="••••••••"
 />
 </div>

 <label className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-700 mt-2 cursor-pointer">
 <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#144835] focus:ring-[#144835]" defaultChecked />
 Sign out of other sessions
 </label>

 <button
 type="button"
 className="w-full mt-4 h-8 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 text-[10px] font-bold text-white shadow-md hover:bg-gray-800 transition-colors"
 >
 Update Password
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {tab === "Preferences" ? (
 <div className="p-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
 <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
 <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
 <Bell size={16} />
 </div>
 <p className="text-sm font-bold text-gray-900">Notification Preferences</p>
 </div>

 <div className="p-4 space-y-4">
 <div className="divide-y divide-gray-100 rounded-[12px] border border-gray-100 overflow-hidden shadow-sm">
 {[
 { label: "Email Notifications", desc: "System alerts via work email" },
 { label: "SMS Notifications", desc: "Urgent operational alerts to phone" },
 { label: "Push & In-App", desc: "Browser and mobile dashboard" },
 ].map((p, idx) => (
 <div key={p.label} className="p-3 flex items-center justify-between gap-4 bg-white hover:bg-gray-50/50 transition-colors">
 <div>
 <p className="text-[10px] font-bold text-gray-900">{p.label}</p>
 <p className="mt-0.5 text-[10px] font-medium text-gray-500">{p.desc}</p>
 </div>
 <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#144835] focus:ring-[#144835]" defaultChecked={p.label !== "Push & In-App"} />
 </div>
 ))}
 </div>

 <div>
 <label className="text-[10px] font-bold text-gray-700">Email Daily Digest Frequency</label>
 <select
 value={digest}
 onChange={(e) => setDigest(e.target.value)}
 className="mt-1.5 w-full h-8 appearance-none rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer"
 >
 <option>Summarized (Once daily at 8 AM)</option>
 <option>Detailed (Once daily at 8 AM)</option>
 <option>Weekly (Every Monday)</option>
 <option>Off</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {tab === "Sessions" ? (
 <div className="p-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
 <div className="lg:col-span-8 bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
 <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
 <Laptop size={16} />
 </div>
 <p className="text-sm font-bold text-gray-900">Active Sessions</p>
 </div>

 <div className="p-4 space-y-3">
 {sessions.map((s) => (
 <div key={s.id} className="rounded-[12px] border border-gray-100 bg-gray-50 p-3 flex items-center justify-between gap-3 transition-colors hover:border-[#144835]/30">
 <div className="flex items-center gap-3 min-w-0">
 <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
 <s.icon size={16} />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-[10px] font-bold text-gray-900 truncate">{s.device}</p>
 {s.status === "ACTIVE" ? (
 <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
 ACTIVE NOW
 </span>
 ) : null}
 </div>
 <p className="mt-0.5 text-[10px] font-medium text-gray-500 truncate">{s.meta}</p>
 </div>
 </div>

 {s.status !== "ACTIVE" ? (
 <button type="button" className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1">
 Logout
 </button>
 ) : null}
 </div>
 ))}

 <button type="button" className="mt-2 w-full h-8 rounded-lg border border-gray-200 bg-white px-4 text-[10px] font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2 shadow-sm transition-colors">
 <LogOut size={14} /> Logout All Other Sessions
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {tab === "Privacy" ? (
 <div className="p-4">
 <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-6 text-center max-w-2xl mx-auto">
 <ShieldAlert size={32} className="mx-auto text-gray-300 mb-3" />
 <h3 className="text-sm font-bold text-gray-900">Privacy Controls</h3>
 <p className="text-[10px] text-gray-500 mt-2">Privacy and data sharing settings are managed globally by the system administrator. If you need to request a data export, please contact support.</p>
 </div>
 </div>
 ) : null}

 {/* Footer Actions */}
 <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <button type="button" className="inline-flex items-center gap-2 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline w-fit px-2 py-1">
 <ShieldAlert size={14} /> Deactivate Account
 </button>

 <div className="flex flex-wrap items-center gap-3 justify-end">
 <button type="button" className="h-8 rounded-lg border border-gray-200 bg-white px-5 text-[10px] font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
 Discard Changes
 </button>
 <button onClick={handleSaveProfile} type="button" className="h-8 rounded-lg bg-[#144835] px-5 text-[10px] font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
 Save All Changes
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

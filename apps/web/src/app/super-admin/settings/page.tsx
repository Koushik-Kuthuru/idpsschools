"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";


import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit";
import { buildPath, subscribeData, upsertData, db, auth } from "@/lib/db-client";


export default function SettingsPage() {
 const { user } = useAuth();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);

 const [profileName, setProfileName] = useState("");

 const [systemName, setSystemName] = useState("IDPS ERP");
 const [supportEmail, setSupportEmail] = useState("");
 const [timezone, setTimezone] = useState("(UTC+05:30) Asia/Kolkata");

 const [enable2FA, setEnable2FA] = useState(false);
 const [enforceHTTPS, setEnforceHTTPS] = useState(true);

 const [lastLoaded, setLastLoaded] = useState<any | null>(null);

 useEffect(() => {
 if (!user) return;
 setLoading(true);

 const profileRef = buildPath(db, "super_admin_users", user.uid);
 const settingsRef = buildPath(db, "system_settings", "global");

 let gotProfile = false;
 let gotSettings = false;

 const syncLoaded = (next: any) => {
 setLastLoaded((prev: any) => ({ ...(prev ?? {}), ...next }));
 if (gotProfile && gotSettings) setLoading(false);
 };

 const unsubProfile = subscribeData(
 profileRef,
 (snap: any) => {
 gotProfile = true;
 const data = snap.exists() ? (snap.data() as any) : {};
 setProfileName(String(data.name ?? user.displayName ?? ""));
 syncLoaded({
 profile: {
 name: String(data.name ?? user.displayName ?? ""),
 },
 });
 },
 (err: any) => {
 console.error("Error loading super admin profile:", err);
 gotProfile = true;
 syncLoaded({ profile: { name: "" } });
 }
 );

 const unsubSettings = subscribeData(
 settingsRef,
 (snap: any) => {
 gotSettings = true;
 const data = snap.exists() ? (snap.data() as any) : {};
 setSystemName(String(data.systemName ?? "IDPS ERP"));
 setSupportEmail(String(data.supportEmail ?? ""));
 setTimezone(String(data.timezone ?? "(UTC+05:30) Asia/Kolkata"));
 setEnable2FA(Boolean(data.security?.enable2FA ?? false));
 setEnforceHTTPS(Boolean(data.security?.enforceHTTPS ?? true));
 syncLoaded({
 settings: {
 systemName: String(data.systemName ?? "IDPS ERP"),
 supportEmail: String(data.supportEmail ?? ""),
 timezone: String(data.timezone ?? "(UTC+05:30) Asia/Kolkata"),
 security: {
 enable2FA: Boolean(data.security?.enable2FA ?? false),
 enforceHTTPS: Boolean(data.security?.enforceHTTPS ?? true),
 },
 },
 });
 },
 (err: any) => {
 console.error("Error loading system settings:", err);
 gotSettings = true;
 syncLoaded({ settings: null });
 }
 );

 return () => {
 unsubProfile();
 unsubSettings();
 };
 }, [user]);

 const canSave = useMemo(() => Boolean(user), [user]);

 const handleReset = () => {
 const profile = lastLoaded?.profile ?? {};
 const settings = lastLoaded?.settings ?? {};
 setProfileName(String(profile.name ?? ""));
 setSystemName(String(settings.systemName ?? "IDPS ERP"));
 setSupportEmail(String(settings.supportEmail ?? ""));
 setTimezone(String(settings.timezone ?? "(UTC+05:30) Asia/Kolkata"));
 setEnable2FA(Boolean(settings.security?.enable2FA ?? false));
 setEnforceHTTPS(Boolean(settings.security?.enforceHTTPS ?? true));
 };

 const handleSave = async () => {
 if (!user || saving) return;
 setSaving(true);
 try {
 const profileRef = buildPath(db, "super_admin_users", user.uid);
 const settingsRef = buildPath(db, "system_settings", "global");

 await upsertData(
 profileRef,
 {
 id: user.uid,
 email: user.email ?? "",
 role: "super_admin",
 name: profileName.trim(),
 updatedAt: new Date().toISOString(),
 },
 { merge: true }
 );

 await upsertData(
 settingsRef,
 {
 systemName: systemName.trim(),
 supportEmail: supportEmail.trim(),
 timezone,
 security: {
 enable2FA,
 enforceHTTPS,
 },
 updatedAt: new Date().toISOString(),
 },
 { merge: true }
 );

 await logAuditEvent({
 action: "UPDATE",
 entity: "system_settings",
 details: "Updated super admin system settings",
 schoolId: null,
 status: "Success",
 role: "super_admin",
 });

 alert("Saved successfully.");
 } catch (error: any) {
 console.error("Failed to save settings:", error);
 const code = String(error?.code ?? "");
 if (code.includes("permission-denied")) {
 alert(
 "Permission denied while saving. Check Supabase row-level security policies, then try again."
 );
 } else {
 alert(`Failed to save settings: ${error?.message ?? "Unknown error"}`);
 }
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in duration-500">
 <div className="flex flex-col gap-2">
 <h1 className="text-xl font-bold text-[#1A1A1A]">System Settings</h1>
 <p className="text-gray-500 text-xs">Manage Super Admin profile and global ERP settings.</p>
 </div>

 {loading ? (
 <div className="flex h-64 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin" />
 </div>
 ) : (
 <div className="space-y-6">
 <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
 <h2 className="text-base font-bold text-[#1A1A1A] mb-1">Super Admin Profile</h2>
 <p className="text-gray-500 text-xs mb-4">This name is used across the Super Admin interface.</p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Name</label>
 <input
 type="text"
 value={profileName}
 onChange={(e) => setProfileName(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Email</label>
 <input
 type="email"
 value={user?.email ?? ""}
 readOnly
 className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 text-xs text-gray-600"
 />
 </div>
 </div>
 </div>

 <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
 <h2 className="text-base font-bold text-[#1A1A1A] mb-1">Global Settings</h2>
 <p className="text-gray-500 text-xs mb-4">Applies to the entire ERP system.</p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">System Name</label>
 <input
 type="text"
 value={systemName}
 onChange={(e) => setSystemName(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Support Email</label>
 <input
 type="email"
 value={supportEmail}
 onChange={(e) => setSupportEmail(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 />
 </div>

 <div className="space-y-2 md:col-span-2">
 <label className="text-xs font-bold text-gray-700">Timezone</label>
 <select
 value={timezone}
 onChange={(e) => setTimezone(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
 >
 <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata</option>
 <option value="(UTC+00:00) UTC">(UTC+00:00) UTC</option>
 <option value="(UTC-05:00) America/New_York">(UTC-05:00) America/New_York</option>
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
 <h2 className="text-base font-bold text-[#1A1A1A] mb-1">Security</h2>
 <p className="text-gray-500 text-xs mb-4">These are policy toggles stored in the database.</p>

 <div className="space-y-3">
 <label className="flex items-center gap-3 text-xs font-medium text-gray-700">
 <input
 type="checkbox"
 checked={enable2FA}
 onChange={(e) => setEnable2FA(e.target.checked)}
 className="rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
 />
 Enable Two-Factor Authentication policy (2FA)
 </label>

 <label className="flex items-center gap-3 text-xs font-medium text-gray-700">
 <input
 type="checkbox"
 checked={enforceHTTPS}
 onChange={(e) => setEnforceHTTPS(e.target.checked)}
 className="rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
 />
 Enforce HTTPS policy
 </label>
 </div>
 </div>

 <div className="flex gap-3">
 <button
 disabled={!canSave || saving}
 onClick={handleSave}
 className="px-5 py-2.5 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
 >
 <Save size={16} />
 {saving ? "Saving..." : "Save Changes"}
 </button>
 <button
 onClick={handleReset}
 className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
 >
 <RotateCcw size={16} />
 Reset
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

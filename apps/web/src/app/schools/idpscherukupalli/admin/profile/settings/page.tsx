"use client";

import { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useBranch } from "@/components/admin/BranchContext";
import {
  User, Lock, Bell, Shield, Laptop, Smartphone,
  Camera, Save, Eye, EyeOff, LogOut, CheckCircle2,
  ShieldAlert, RefreshCw, Mail, Phone, Building2,
  ChevronRight, Globe, Clock, Fingerprint,
} from "lucide-react";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

type Tab = "profile" | "security" | "notifications" | "privacy" | "sessions";

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "profile",       label: "Profile",       icon: User        },
  { key: "security",      label: "Security",      icon: Lock        },
  { key: "notifications", label: "Notifications", icon: Bell        },
  { key: "privacy",       label: "Privacy",       icon: Shield      },
  { key: "sessions",      label: "Sessions",      icon: Laptop      },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-[#144835]" : "bg-gray-200")}>
      <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
        checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 || !/[0-9]/.test(password) ? 2
    : password.length < 14 || !/[^a-zA-Z0-9]/.test(password) ? 3
    : 4;

  const config = [
    { label: "", color: "" },
    { label: "Weak",      color: "bg-red-500"    },
    { label: "Fair",      color: "bg-amber-500"  },
    { label: "Good",      color: "bg-yellow-400" },
    { label: "Strong",    color: "bg-emerald-500" },
  ][strength];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-300",
            i <= strength ? config.color : "bg-gray-100")} />
        ))}
      </div>
      {password.length > 0 && (
        <p className={cn("text-xs font-bold",
          strength <= 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-yellow-600" : "text-emerald-600")}>
          {config.label} password
        </p>
      )}
    </div>
  );
}

function FieldRow({ label, icon: Icon, children }: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#144835]/20 hover:shadow-[0_4px_12px_rgba(20,72,53,0.04)] transition-all">
      <div className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

function PrivacySettingRow({ label, desc, icon: Icon, initialOn }: {
  label: string;
  desc: string;
  icon: typeof User;
  initialOn: boolean;
}) {
  const [toggled, setToggled] = useState(initialOn);
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#144835]/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
          <Icon size={14} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <Toggle checked={toggled} onChange={setToggled} />
    </div>
  );
}

const inputCls = "w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all placeholder:text-gray-400";

export default function AdminProfileSettingsPage() {
  const { user, role, schoolId, logout, updateProfile } = useAuth();
  const { activeBranch } = useBranch();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Profile ─────────────────────────────────────────────────────────────────
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [profile, setProfile] = useState({
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    designation: user?.designation || (role === "admin" ? "Branch Administrator" : role ?? "Staff"),
    department: user?.department ?? "",
  });

  useEffect(() => {
    if (user) {
      setProfile(p => ({
        ...p,
        displayName: user.displayName ?? p.displayName,
        email: user.email ?? p.email,
        phone: user.phone ?? p.phone,
        designation: user.designation ?? p.designation,
        department: user.department ?? p.department,
      }));
      if (user.photoURL) {
        setAvatarSrc(user.photoURL);
      }
    }
  }, [user]);

  const initials = (profile.displayName || profile.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAvatarSrc(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await updateProfile({
        displayName: profile.displayName,
        phone: profile.phone,
        designation: profile.designation,
        department: profile.department,
        photoURL: avatarSrc,
      });
      showSaved();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  // ── Security ─────────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const pwMatch = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw;

  // ── Notifications ────────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    email: true, sms: false, inApp: true,
    digest: true, leaveAlerts: true, feeAlerts: true,
  });
  const [digestFreq, setDigestFreq] = useState("Daily at 8 AM");

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const sessions = [
    { id: "s1", device: "Chrome · Windows 11",   location: "Current session",                  active: true,  icon: Laptop     },
    { id: "s2", device: "iPhone 15 · iOS 17",     location: "2 hours ago · Mumbai, IN",         active: false, icon: Smartphone },
    { id: "s3", device: "Safari · macOS Sonoma",  location: "Yesterday · Hyderabad, IN",        active: false, icon: Laptop     },
  ];

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 font-jost pb-20 sm:pb-24 max-w-[1600px] mx-auto -mx-0.5 sm:mx-auto">

      {/* ── Profile Hero ── */}
      <div className="relative bg-gradient-to-br from-[#144835] via-[#1a5a40] to-[#0d2e22] text-white border border-[#0d2e22] ring-1 ring-inset ring-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 sm:h-40 w-32 sm:w-40 rounded-full bg-[#a2c144]/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-2xl border-4 border-white/30 shadow-xl overflow-hidden bg-[#144835]/40 flex items-center justify-center">
              {avatarSrc
                ? <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                : <span className="text-2xl font-bold text-white">{initials}</span>}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} type="button"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#a2c144] text-[#144835] flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera size={12} />
            </button>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {profile.displayName || profile.email || "Admin User"}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-lg text-xs font-bold text-white border border-white/10">
                <Building2 size={10} /> {activeBranch.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 bg-[#a2c144]/80 rounded-lg text-xs font-bold text-[#144835]">
                {profile.designation}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1.5 font-medium">{profile.email}</p>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60 shrink-0">
            {loggingOut ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const active = t.key === tab;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                active
                  ? "bg-[#144835] text-white shadow-lg shadow-[#144835]/20"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50")}>
              <t.icon size={13} />
              {t.label}
            </button>
          );
        })}

        <div className="flex-1" />
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold animate-in fade-in duration-200 shrink-0">
            <CheckCircle2 size={12} /> Saved
          </div>
        )}
      </div>


      {/* ── Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

        {/* ════ PROFILE ════ */}
        {tab === "profile" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update your name, contact details and role</p>
              </div>
              <button onClick={handleSaveProfile}
                className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
                <Save size={13} /> Save Changes
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <ShieldAlert size={14} /> {error}
              </div>
            )}

            <div className="space-y-3">
              <FieldRow label="Full Name" icon={User}>
                <input value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your full name" className={inputCls} />
              </FieldRow>

              <FieldRow label="Email Address" icon={Mail}>
                <div className="flex items-center gap-2">
                  <input value={profile.email} readOnly
                    className={cn(inputCls, "bg-gray-50 cursor-not-allowed text-gray-500 flex-1")} />
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700 shrink-0">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Email is managed by your system administrator</p>
              </FieldRow>

              <FieldRow label="Phone Number" icon={Phone}>
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210" className={inputCls} />
              </FieldRow>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Designation" icon={Building2}>
                  <input value={profile.designation} onChange={e => setProfile(p => ({ ...p, designation: e.target.value }))}
                    className={inputCls} />
                </FieldRow>

                <FieldRow label="Department" icon={Globe}>
                  <input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Administration" className={inputCls} />
                </FieldRow>
              </div>

              {/* UID info card */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <Fingerprint size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">User ID</p>
                  <p className="text-xs font-bold text-gray-700 mt-0.5 font-mono tracking-wide">{user?.uid?.slice(0, 24)}…</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECURITY ════ */}
        {tab === "security" && (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900">Security Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your password and two-factor authentication</p>
            </div>

            {/* Change password */}
            <div className="rounded-2xl border border-gray-100 p-5 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Lock size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Use a strong, unique password</p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                {/* Current */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">Current Password</label>
                  <div className="relative">
                    <input type={showCurrent ? "text" : "password"} value={currentPw}
                      onChange={e => setCurrentPw(e.target.value)}
                      placeholder="••••••••" className={cn(inputCls, "pr-10")} />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* New */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">New Password</label>
                  <div className="relative">
                    <input type={showNew ? "text" : "password"} value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="••••••••" className={cn(inputCls, "pr-10")} />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <PasswordStrength password={newPw} />
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5 block">Confirm New Password</label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className={cn(inputCls, "pr-10", confirmPw.length > 0 && (pwMatch ? "border-emerald-300 ring-2 ring-emerald-100" : "border-red-300 ring-2 ring-red-100"))} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {confirmPw.length > 0 && (
                    <p className={cn("text-xs font-bold mt-1.5", pwMatch ? "text-emerald-600" : "text-red-500")}>
                      {pwMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={signOutOthers} onChange={e => setSignOutOthers(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-[#144835]" />
                  <span className="text-xs font-bold text-gray-700">Sign out of all other sessions</span>
                </label>

                <button type="button" disabled={!currentPw || !pwMatch}
                  onClick={showSaved}
                  className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                  <Lock size={13} /> Update Password
                </button>
              </div>
            </div>

            {/* 2FA */}
            <div className="rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Fingerprint size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                  twoFactor ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                  {twoFactor ? "Enabled" : "Disabled"}
                </span>
                <Toggle checked={twoFactor} onChange={setTwoFactor} />
              </div>
            </div>
          </div>
        )}


        {/* ════ NOTIFICATIONS ════ */}
        {tab === "notifications" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose how and when you want to be notified</p>
              </div>
              <button onClick={showSaved}
                className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
                <Save size={13} /> Save
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {([
                { key: "email"      as const, label: "Email Notifications",    desc: "System alerts sent to your work email",          icon: Mail     },
                { key: "sms"        as const, label: "SMS Alerts",             desc: "Critical events sent to your mobile number",     icon: Phone    },
                { key: "inApp"      as const, label: "In-App Notifications",   desc: "Real-time alerts inside the dashboard",          icon: Bell     },
                { key: "digest"     as const, label: "Daily Digest",           desc: "One summary email per day",                      icon: Clock    },
                { key: "leaveAlerts" as const, label: "Leave Request Alerts",  desc: "Notified when staff submit or cancel leave",     icon: Shield   },
                { key: "feeAlerts"  as const, label: "Fee Due Alerts",         desc: "Reminder when student fees are past due",        icon: ChevronRight },
              ]).map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#144835]/20 hover:shadow-[0_4px_12px_rgba(20,72,53,0.04)] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Digest Frequency</p>
              <div className="relative max-w-xs">
                <select value={digestFreq} onChange={e => setDigestFreq(e.target.value)}
                  className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer">
                  <option>Daily at 8 AM</option>
                  <option>Daily at 6 PM</option>
                  <option>Weekly on Monday</option>
                  <option>Off</option>
                </select>
                <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* ════ PRIVACY ════ */}
        {tab === "privacy" && (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900">Privacy Controls</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your data, visibility and account deletion</p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Profile Visibility",      desc: "Allow other staff members to see your profile",        icon: User,    on: true  },
                { label: "Activity Status",          desc: "Show when you were last active in the dashboard",      icon: Clock,   on: true  },
                { label: "Analytics Participation",  desc: "Help improve the platform with anonymous usage data",  icon: Globe,   on: false },
              ].map(({ label, desc, icon: Icon, on }, i) => (
                <PrivacySettingRow key={i} label={label} desc={desc} icon={Icon} initialOn={on} />
              ))}
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-900">Danger Zone</p>
                  <p className="text-xs text-red-600 mt-0.5">These actions are irreversible. Proceed with caution.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button"
                  className="h-9 px-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                  Export My Data
                </button>
                <button type="button"
                  className="h-9 px-4 inline-flex items-center gap-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-200 transition-colors">
                  <ShieldAlert size={13} /> Deactivate Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ SESSIONS ════ */}
        {tab === "sessions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Active Sessions</h2>
                <p className="text-xs text-gray-500 mt-0.5">Devices currently signed in to your account</p>
              </div>
              <button type="button" onClick={showSaved}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                <LogOut size={13} className="text-rose-500" /> Sign Out All Others
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  s.active
                    ? "border-[#144835]/20 bg-[#144835]/3 shadow-[0_4px_12px_rgba(20,72,53,0.06)]"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}>
                  <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                    s.active ? "bg-[#144835]/10 text-[#144835]" : "bg-gray-50 border border-gray-100 text-gray-500")}>
                    <s.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{s.device}</p>
                      {s.active && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-700 shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE NOW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.location}</p>
                  </div>
                  {!s.active && (
                    <button type="button"
                      className="h-8 px-3 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors shrink-0">
                      Sign Out
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
              <Shield size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                If you see an unfamiliar device, sign it out immediately and change your password. We recommend reviewing active sessions regularly for security.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

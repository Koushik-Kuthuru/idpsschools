"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Check,
  IndianRupee,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  employeeId: string;
  department: string;
  position: string;
  joiningDate: string;
  employmentType: string;
  baseSalary: string;
  reportingManager: string;
  status: "Active" | "On Leave" | "Inactive";
  createUserAccount: boolean;
  sendWelcomeEmail: boolean;
};

type EmployeeCategory = "teaching" | "nonTeaching";

function generateEmployeeId() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${suffix}`;
}

function isTeachingFromFields(roleTitle: string, department: string) {
  const role = String(roleTitle || "").toLowerCase();
  const dept = String(department || "").toLowerCase();
  return (
    role.includes("teacher") ||
    role.includes("tutor") ||
    role.includes("professor") ||
    role.includes("lecturer") ||
    role.includes("faculty") ||
    dept === "academic" ||
    dept === "academics"
  );
}

export default function EmployeeForm({
  mode,
  employeeId,
  directoryHref = "/schools/idpskalaburagi/hr/employees",
  category,
}: {
  mode: "create" | "edit";
  employeeId?: string;
  directoryHref?: string;
  category?: EmployeeCategory;
}) {
  const router = useRouter();
  const formTitle =
    mode === "create"
      ? category === "teaching"
        ? "Add Teaching Staff"
        : category === "nonTeaching"
          ? "Add Non-Teaching Staff"
          : "Add New Employee"
      : "Edit Employee";
  const formSubtitle =
    mode === "create"
      ? "Create a new institutional record and configure system access permissions."
      : "Update employee details and manage access permissions.";

  const initialEmployeeId = useMemo(() => employeeId ?? generateEmployeeId(), [employeeId]);

  const [form, setForm] = useState<FormState>(() => ({
    firstName: mode === "edit" ? "James" : "",
    lastName: mode === "edit" ? "Wilson" : "",
    dob: "",
    gender: "",
    email: mode === "edit" ? "j.wilson@idps.edu" : "",
    phone: "",
    address: "",
    employeeId: initialEmployeeId,
    department: mode === "create" && category === "teaching" ? "Academic" : mode === "create" && category === "nonTeaching" ? "Administration" : "",
    position: mode === "create" && category === "teaching" ? "Teacher" : "",
    joiningDate: "",
    employmentType: "Full-time Permanent",
    baseSalary: "",
    reportingManager: "",
    status: "Active",
    createUserAccount: true,
    sendWelcomeEmail: true,
  }));
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const directoryLabel =
    directoryHref === "/schools/idpskalaburagi/hr/teaching-staff"
      ? "Teaching Staff"
      : directoryHref === "/schools/idpskalaburagi/hr/non-teaching-staff"
        ? "Non-Teaching Staff"
        : "Directory";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (mode !== "edit" || !employeeId) return;
      try {
        setError(null);
        setLoading(true);
        const res = await fetch(`/api/schools/idpskalaburagi/employees?id=${encodeURIComponent(employeeId)}`);
        const json = await res.json().catch(() => ({}));
        const employee = json?.employee as any;
        if (!employee) throw new Error("Employee not found");
        const parts = String(employee.name || "").trim().split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ");
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            firstName,
            lastName,
            email: String(employee.email || ""),
            phone: String(employee.phone || ""),
            address: prev.address,
            employeeId: String(employee.id || prev.employeeId),
            department: String(employee.department || ""),
            position: String(employee.roleTitle || ""),
            joiningDate: String(employee.joinedDate || ""),
            employmentType: String(employee.employmentType || prev.employmentType),
            baseSalary: employee.baseSalaryMonthlyInr ? String(employee.baseSalaryMonthlyInr) : prev.baseSalary,
            reportingManager: String(employee.reportsTo || ""),
            status: (String(employee.status || "Active") as FormState["status"]),
          }));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load employee");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, employeeId]);

  return (
    <form
      className="space-y-8 animate-in fade-in duration-500 font-jost pb-10"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setError(null);
          setSaving(true);

          if (!form.firstName.trim() || !form.lastName.trim() || !form.department.trim() || !form.position.trim()) {
            throw new Error("Please fill all required fields.");
          }

          if (mode === "create" && category) {
            const teaching = isTeachingFromFields(form.position, form.department);
            if (category === "teaching" && !teaching) {
              throw new Error("For Teaching Staff, choose Academic department or a Teacher role.");
            }
            if (category === "nonTeaching" && teaching) {
              throw new Error("For Non-Teaching Staff, choose a non-teaching role/department.");
            }
          }

          const payload = {
            id: form.employeeId,
            name: `${form.firstName} ${form.lastName}`.trim(),
            roleTitle: form.position,
            department: form.department,
            email: form.email,
            phone: form.phone,
            status: form.status,
            employmentType: form.employmentType,
            reportsTo: form.reportingManager,
            baseSalaryMonthlyInr: Number(form.baseSalary || 0),
            joinedDate: form.joiningDate,
          };

          if (mode === "create") {
            const res = await fetch("/api/schools/idpskalaburagi/employees", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || "Failed to create employee");
          } else {
            const res = await fetch(`/api/schools/idpskalaburagi/employees?id=${encodeURIComponent(form.employeeId)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || "Failed to update employee");
          }

          const targetBase = isTeachingFromFields(payload.roleTitle, payload.department)
            ? "/schools/idpskalaburagi/hr/teaching-staff"
            : "/schools/idpskalaburagi/hr/non-teaching-staff";
          router.push(`${targetBase}/${encodeURIComponent(form.employeeId)}/profile`);
        } catch (e: any) {
          setError(e?.message || "Failed to save employee");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">{formTitle}</h1>
          <p className="mt-2 text-xs font-medium text-gray-500">{formSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SafeLink
            href={directoryHref}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 h-10 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Users size={14} /> {directoryLabel}
          </SafeLink>
        </div>
      </div>

      {error && (
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={14} />
              </div>
              <h2 className="text-xs font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                <input
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                  placeholder="e.g. Jonathan"
                  value={form.firstName}
                  onChange={(e) => onChange("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                <input
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                  placeholder="e.g. Doe"
                  value={form.lastName}
                  onChange={(e) => onChange("lastName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.dob}
                  onChange={(e) => onChange("dob", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
                <select
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.gender}
                  onChange={(e) => onChange("gender", e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                  placeholder="j.doe@idps.edu"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Residential Address</label>
                <textarea
                  className="min-h-[88px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                  placeholder="Street, Building, Apartment No, City, Zip"
                  value={form.address}
                  onChange={(e) => onChange("address", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <ShieldCheck size={14} />
              </div>
              <h2 className="text-xs font-bold text-gray-900">System Access</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Create User Account</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">Enable login access to the ERP system</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange("createUserAccount", !form.createUserAccount)}
                  className={cn(
                    "h-9 w-9 rounded-lg border flex items-center justify-center transition-colors",
                    form.createUserAccount
                      ? "bg-[#144835] border-[#144835] text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-300 hover:bg-gray-50"
                  )}
                  aria-label="Toggle create user account"
                >
                  <Check size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Send Welcome Email</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">Notify employee with credentials via email</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange("sendWelcomeEmail", !form.sendWelcomeEmail)}
                  className={cn(
                    "h-9 w-9 rounded-lg border flex items-center justify-center transition-colors",
                    form.sendWelcomeEmail
                      ? "bg-[#144835] border-[#144835] text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-300 hover:bg-gray-50"
                  )}
                  aria-label="Toggle send welcome email"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Briefcase size={14} />
              </div>
              <h2 className="text-xs font-bold text-gray-900">Employment Details</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</label>
                <div className="relative">
                  <input
                    className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/80 px-4 pr-32 text-xs font-bold text-gray-600"
                    value={form.employeeId}
                    readOnly
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md bg-gray-200/50 px-2 py-1 text-xs font-bold text-gray-500 border border-gray-200/50">
                    AUTO-GENERATED
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                    value={form.department}
                    onChange={(e) => onChange("department", e.target.value)}
                  >
                    <option value="">Select Department</option>
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                    <option value="IT & Systems">IT & Systems</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Position / Role</label>
                <select
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.position}
                  onChange={(e) => onChange("position", e.target.value)}
                >
                  <option value="">Select Position</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Senior Teacher">Senior Teacher</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Senior Developer">Senior Developer</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Joining</label>
                <div className="relative">
                  <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                    value={form.joiningDate}
                    onChange={(e) => onChange("joiningDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employment Type</label>
                <select
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.employmentType}
                  onChange={(e) => onChange("employmentType", e.target.value)}
                >
                  <option value="Full-time Permanent">Full-time Permanent</option>
                  <option value="Full-time Contract">Full-time Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <select
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.status}
                  onChange={(e) => onChange("status", e.target.value as FormState["status"])}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Base Salary (INR)</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full h-9 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder:text-gray-400"
                    placeholder="0.00"
                    value={form.baseSalary}
                    onChange={(e) => onChange("baseSalary", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reporting Manager</label>
                <select
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
                  value={form.reportingManager}
                  onChange={(e) => onChange("reportingManager", e.target.value)}
                >
                  <option value="">Select Manager</option>
                  <option value="Ms. Helena Parker">Ms. Helena Parker</option>
                  <option value="Mr. Robert Wilson">Mr. Robert Wilson</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4 flex items-center gap-4">
            <div className="h-16 w-16 rounded-[16px] border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
              <Camera size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">Official Profile Photo</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                JPG or PNG format. Max size 2MB.
              </p>
              <button type="button" className="mt-2 text-xs font-bold text-[#144835] hover:underline">
                Upload Photo
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 flex items-center justify-end gap-3">
        <SafeLink
          href={directoryHref}
          className="h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </SafeLink>
        <button
          type="submit"
          disabled={saving || loading}
          className="h-9 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-6 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <ShieldCheck size={14} />
          {saving ? "Saving..." : "Save Record"}
        </button>
      </div>
    </form>
  );
}

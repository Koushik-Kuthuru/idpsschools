"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  RefreshCw,
  RotateCw,
  Search,
  Users,
} from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import type { PortalUserStaff, PortalUserStudent } from "@/lib/loadPortalUsers";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabKey = "staff" | "students";

type PortalUsersPayload = {
  staff: PortalUserStaff[];
  students: PortalUserStudent[];
};

type PortalUsersPanelProps = {
  schoolId: string;
  onSaved?: () => void;
};

function PasswordCell({
  value,
  visible,
}: {
  value: string;
  visible: boolean;
}) {
  return (
    <span className="font-mono text-xs font-semibold text-gray-900">
      {visible ? value || "—" : "••••••••"}
    </span>
  );
}

export default function PortalUsersPanel({ schoolId, onSaved }: PortalUsersPanelProps) {
  const { currentYear } = useAcademicYear();
  const academicYear = currentYear?.name ?? null;

  const [tab, setTab] = useState<TabKey>("staff");
  const [query, setQuery] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<PortalUserStaff[]>([]);
  const [students, setStudents] = useState<PortalUserStudent[]>([]);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (silent = false) => {
      if (!schoolId) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ schoolId });
        if (academicYear) params.set("academicYear", academicYear);

        const res = await adminFetch(`/api/admin/portal-users?${params.toString()}`);
        const data = (await res.json().catch(() => ({}))) as PortalUsersPayload & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load portal users");
        }

        setStaff(data.staff ?? []);
        setStudents(data.students ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load portal users");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [schoolId, academicYear]
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredStaff = useMemo(() => {
    if (!normalizedQuery) return staff;
    return staff.filter((row) =>
      [row.name, row.userId, row.department, row.designation, row.password, row.passwordLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [staff, normalizedQuery]);

  const filteredStudents = useMemo(() => {
    if (!normalizedQuery) return students;
    return students.filter((row) =>
      [row.name, row.userId, row.admissionNo, row.className, row.section, row.password]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [students, normalizedQuery]);

  const activeRows = tab === "staff" ? filteredStaff : filteredStudents;
  const totalCount = tab === "staff" ? staff.length : students.length;

  const exportData = useMemo(() => {
    if (tab === "staff") {
      return filteredStaff.map((row) => ({
        Name: row.name,
        "User ID": row.userId,
        Password: row.hasCustomPassword ? row.passwordLabel : row.password,
        Department: row.department,
        Designation: row.designation,
        Status: row.status,
      }));
    }
    return filteredStudents.map((row) => ({
      Name: row.name,
      "User ID": row.userId,
      Password: row.password,
      "Admission No": row.admissionNo,
      Class: row.className,
      Section: row.section,
      Status: row.status,
    }));
  }, [tab, filteredStaff, filteredStudents]);

  const exportColumns = useMemo(() => {
    if (tab === "staff") {
      return [
        { header: "Name", key: "Name" },
        { header: "User ID", key: "User ID" },
        { header: "Password", key: "Password" },
        { header: "Department", key: "Department" },
        { header: "Designation", key: "Designation" },
        { header: "Status", key: "Status" },
      ];
    }
    return [
      { header: "Name", key: "Name" },
      { header: "User ID", key: "User ID" },
      { header: "Password", key: "Password" },
      { header: "Admission No", key: "Admission No" },
      { header: "Class", key: "Class" },
      { header: "Section", key: "Section" },
      { header: "Status", key: "Status" },
    ];
  }, [tab]);

  const handleResetPassword = async (recordId: string, userId: string) => {
    const useDefault = window.confirm(
      `Reset password for ${userId}?\n\nDefault password will be set to the User ID (${userId}).`
    );
    if (!useDefault) return;

    setResettingId(recordId);
    try {
      const res = await adminFetch("/api/admin/portal-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          type: tab === "staff" ? "staff" : "student",
          recordId,
          academicYear,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Password reset failed");
      }

      await loadUsers(true);
      onSaved?.();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Portal Users</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Staff and student login IDs, passwords, reset and export for {schoolId}
              {academicYear ? ` · ${academicYear}` : ""}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPasswords ? "Hide passwords" : "Show passwords"}
            </button>
            <button
              type="button"
              onClick={() => void loadUsers(true)}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <ExportButton
              data={exportData}
              filename={`portal-${tab}-${schoolId}`}
              columns={exportColumns}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setTab("staff")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
                tab === "staff"
                  ? "bg-white text-[#144835] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Users size={14} />
              Staff ({staff.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("students")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
                tab === "students"
                  ? "bg-white text-[#144835] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <GraduationCap size={14} />
              Students ({students.length})
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "staff" ? "Search staff…" : "Search students…"}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#144835] focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <SkeletonTable rows={8} columns={7} className="rounded-none border-0" />
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="mt-3 text-xs font-bold text-[#144835] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              <KeyRound size={20} />
            </div>
            <p className="text-sm font-bold text-gray-700">No {tab} found</p>
            <p className="mt-1 text-xs text-gray-400">
              {normalizedQuery
                ? "Try a different search term"
                : academicYear
                  ? `No ${tab} records for ${academicYear}. Check the academic year switcher matches imported data (e.g. 2023-24).`
                  : `No ${tab} records for this branch`}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-left">
            <thead className="sticky top-0 z-10 border-b border-gray-100 bg-[#FAFBFC]">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  User ID
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Password
                </th>
                {tab === "staff" ? (
                  <>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Department
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Designation
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Class
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Section
                    </th>
                  </>
                )}
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tab === "staff"
                ? filteredStaff.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900">{row.name}</td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-700">{row.userId}</td>
                      <td className="px-3 py-3">
                        {row.hasCustomPassword ? (
                          <span className="text-xs font-semibold text-amber-700">
                            {row.passwordLabel}
                          </span>
                        ) : (
                          <PasswordCell value={row.password} visible={showPasswords} />
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{row.department}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{row.designation}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            row.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={resettingId === row.id}
                          onClick={() => void handleResetPassword(row.id, row.userId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835] disabled:opacity-50"
                        >
                          <RotateCw
                            size={12}
                            className={resettingId === row.id ? "animate-spin" : ""}
                          />
                          Reset password
                        </button>
                      </td>
                    </tr>
                  ))
                : filteredStudents.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-900">{row.name}</td>
                      <td className="px-3 py-3 text-xs font-medium text-gray-700">{row.userId}</td>
                      <td className="px-3 py-3">
                        <PasswordCell value={row.password} visible={showPasswords} />
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{row.className}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{row.section}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            row.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          disabled={resettingId === row.id}
                          onClick={() => void handleResetPassword(row.id, row.userId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835] disabled:opacity-50"
                        >
                          <RotateCw
                            size={12}
                            className={resettingId === row.id ? "animate-spin" : ""}
                          />
                          Reset password
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && (
        <div className="border-t border-gray-100 px-5 py-2 text-[10px] font-medium text-gray-400">
          Showing {activeRows.length} of {totalCount} {tab}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Save,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import SelectMenu from "@/components/ui/SelectMenu";
import AttendanceMarkCell from "@/components/admin/attendance/AttendanceMarkCell";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchTransportStudents } from "@/hooks/useBranchTransportStudents";
import { useBranchTransportBuses } from "@/hooks/useBranchTransportBuses";
import { classifyAttendanceDay, type AttendanceMarkStatus } from "@/utils/attendance";
import { summarizeTransportMonth } from "@/lib/transportAttendanceUtils";
import type { BranchTransportStudentRow } from "@/lib/loadBranchStudents";
import * as XLSX from "xlsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = ["Mark Attendance", "Transport Register"] as const;
type AttendanceTab = (typeof TABS)[number];

const REGISTER_SUMMARY = ["TP", "TA", "TW", "%"] as const;

function tabFromParam(value: string | null): AttendanceTab {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized === "register") return "Transport Register";
  return "Mark Attendance";
}

function gradeLabel(className: string) {
  if (!className || className === "—") return "—";
  return /^\d+$/.test(className) ? `Grade ${className}` : className;
}

type RosterRow = Omit<BranchTransportStudentRow, "status"> & {
  markStatus: AttendanceMarkStatus;
  remarks: string;
};

function attendanceStatusColor(status: AttendanceMarkStatus) {
  if (status === "P") return "text-emerald-700 font-bold";
  if (status === "A") return "text-red-600 font-bold";
  if (status === "HD") return "text-amber-600 font-bold";
  return "text-gray-400";
}

export default function AdminTransportAttendancePage() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const searchParams = useSearchParams();
  const { buses } = useBranchTransportBuses(schoolId);
  const { usingTransport, loading, error: studentsError } = useBranchTransportStudents(
    schoolId,
    currentYear?.name
  );

  const [activeTab, setActiveTab] = useState<AttendanceTab>(() => tabFromParam(searchParams.get("tab")));
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [routeFilter, setRouteFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [registerMonth, setRegisterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [registerRoute, setRegisterRoute] = useState("All");
  const [registerLoaded, setRegisterLoaded] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [monthMarks, setMonthMarks] = useState<Record<string, Record<string, { status: AttendanceMarkStatus; remarks?: string }>>>({});

  useEffect(() => {
    setActiveTab(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const routeOptions = useMemo(() => {
    const fromStudents = usingTransport.map((s) => s.route).filter((r) => r && r !== "—");
    const fromBuses = buses.map((b) => b.route).filter(Boolean);
    const routes = [...new Set([...fromStudents, ...fromBuses])].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    return ["All", ...routes];
  }, [usingTransport, buses]);

  const markDayInfo = useMemo(
    () => classifyAttendanceDay(attendanceDate, []),
    [attendanceDate]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usingTransport.filter((row) => {
      const matchRoute = routeFilter === "All" || row.route === routeFilter;
      const matchSearch =
        !q ||
        `${row.name} ${row.admissionNo} ${row.route} ${row.busNo} ${row.stoppage} ${row.className} ${row.section}`
          .toLowerCase()
          .includes(q);
      return matchRoute && matchSearch;
    });
  }, [usingTransport, routeFilter, search]);

  const loadMarksForDate = useCallback(async () => {
    if (!schoolId || !currentYear?.name) return;
    setMarksLoading(true);
    setSaveError("");
    try {
      const params = new URLSearchParams({
        schoolId,
        academicYear: currentYear.name,
        date: attendanceDate,
      });
      const res = await fetch(`/api/admin/transport/attendance?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load attendance");

      const marks = (data.marks ?? {}) as Record<string, { status?: AttendanceMarkStatus; remarks?: string }>;
      setRoster(
        filteredStudents.map((student) => ({
          ...student,
          markStatus: marks[student.id]?.status ?? "None",
          remarks: marks[student.id]?.remarks ?? "",
        }))
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load attendance");
      setRoster(
        filteredStudents.map((student) => ({
          ...student,
          markStatus: "None",
          remarks: "",
        }))
      );
    } finally {
      setMarksLoading(false);
    }
  }, [schoolId, currentYear?.name, attendanceDate, filteredStudents]);

  useEffect(() => {
    if (activeTab !== "Mark Attendance") return;
    loadMarksForDate();
  }, [activeTab, loadMarksForDate]);

  const totals = useMemo(() => {
    const present = roster.filter((r) => r.markStatus === "P").length;
    const absent = roster.filter((r) => r.markStatus === "A" || r.markStatus === "HD").length;
    return { total: roster.length, present, absent };
  }, [roster]);

  const updateStatus = (studentId: string, status: AttendanceMarkStatus) => {
    setRoster((prev) => prev.map((row) => (row.id === studentId ? { ...row, markStatus: status } : row)));
  };

  const handleSave = async () => {
    if (!schoolId || !currentYear?.name) return;
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const marks = Object.fromEntries(
        roster.map((row) => [
          row.id,
          { status: row.markStatus, remarks: row.remarks || undefined },
        ])
      );
      const res = await fetch("/api/admin/transport/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          academicYear: currentYear.name,
          date: attendanceDate,
          marks,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save attendance");
      setSaveMessage("Transport attendance saved successfully.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const registerStudents = useMemo(() => {
    return usingTransport.filter((row) => registerRoute === "All" || row.route === registerRoute);
  }, [usingTransport, registerRoute]);

  const registerSummary = useMemo(() => {
    if (!registerLoaded) return null;
    const base = summarizeTransportMonth(
      registerMonth,
      registerStudents.map((s) => s.id),
      monthMarks
    );
    const rows = registerStudents.map((student, index) => {
      const stats = base.rows.find((r) => r.studentId === student.id);
      return {
        index: index + 1,
        student,
        dayMarks: stats?.dayMarks ?? {},
        present: stats?.present ?? 0,
        absent: stats?.absent ?? 0,
        working: stats?.working ?? 0,
        percent: stats?.percent ?? 0,
      };
    });
    return { ...base, rows };
  }, [registerLoaded, registerMonth, registerStudents, monthMarks]);

  const loadRegister = async () => {
    if (!schoolId || !currentYear?.name) return;
    setRegisterLoading(true);
    setRegisterLoaded(false);
    try {
      const params = new URLSearchParams({
        schoolId,
        academicYear: currentYear.name,
        month: registerMonth,
      });
      const res = await fetch(`/api/admin/transport/attendance?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load register");
      setMonthMarks(data.marks ?? {});
      setRegisterLoaded(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load register");
    } finally {
      setRegisterLoading(false);
    }
  };

  const exportRegisterExcel = () => {
    if (!registerSummary) return;
    const header = [
      "SR",
      "Adm No",
      "Student",
      "Route",
      "Bus No",
      "Class",
      "Section",
      ...Array.from({ length: registerSummary.daysInMonth }, (_, i) => String(i + 1)),
      ...REGISTER_SUMMARY,
    ];
    const rows = registerSummary.rows.map((row) => [
      row.index,
      row.student.admissionNo,
      row.student.name,
      row.student.route,
      row.student.busNo,
      gradeLabel(row.student.className),
      row.student.section,
      ...Array.from({ length: registerSummary.daysInMonth }, (_, i) => row.dayMarks[i + 1] ?? ""),
      row.present,
      row.absent,
      row.working,
      row.percent,
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Transport Register");
    XLSX.writeFile(book, `transport-register-${registerMonth}-${registerRoute}.xlsx`);
  };

  const listLoading = loading && usingTransport.length === 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Transport Attendance"
        description="Mark daily bus attendance by route and view the monthly transport register"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Using Transport", value: String(usingTransport.length) },
          { label: "Routes", value: String(Math.max(routeOptions.length - 1, 0)) },
          { label: "Present Today", value: String(totals.present) },
          { label: "Absent Today", value: String(totals.absent) },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="text-lg font-bold tabular-nums text-[#144835]">{item.value}</p>
          </div>
        ))}
      </div>

      {(studentsError || saveError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {studentsError || saveError}
        </div>
      )}

      {saveMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={14} />
          {saveMessage}
        </div>
      ) : null}

      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2",
              activeTab === tab
                ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Mark Attendance" ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3 flex-1">
              <div className="flex flex-col gap-1.5 w-full sm:w-[220px]">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(attendanceDate);
                      d.setDate(d.getDate() - 1);
                      setAttendanceDate(d.toISOString().slice(0, 10));
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="relative flex-1">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(attendanceDate);
                      d.setDate(d.getDate() + 1);
                      setAttendanceDate(d.toISOString().slice(0, 10));
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Route</label>
                <SelectMenu
                  value={routeFilter}
                  onChange={setRouteFilter}
                  options={routeOptions.map((r) => ({
                    value: r,
                    label: r === "All" ? "All Routes" : r,
                  }))}
                  aria-label="Filter by route"
                />
              </div>
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadMarksForDate}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <RotateCw size={14} className={marksLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <ExportButton
                data={roster.map((row, i) => ({
                  SR: i + 1,
                  Route: row.route,
                  "Bus No": row.busNo,
                  Name: row.name,
                  "Adm No": row.admissionNo,
                  Class: gradeLabel(row.className),
                  Section: row.section,
                  Stoppage: row.stoppage,
                  Status: row.markStatus,
                  Remarks: row.remarks,
                }))}
                filename={`transport-attendance-${attendanceDate}-${routeFilter}`}
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                iconSize={14}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !markDayInfo.canMark}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#144835]/90 disabled:opacity-70"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 text-xs font-bold">
              <span className="text-gray-600">Total: {totals.total}</span>
              <span className="text-emerald-600">Present: {totals.present}</span>
              <span className="text-red-600">Absent: {totals.absent}</span>
              {!markDayInfo.canMark ? (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertCircle size={12} />
                  {markDayInfo.label}
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              {listLoading || marksLoading ? (
                <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">Loading...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="w-12 px-4 py-3 text-xs font-bold text-gray-500 uppercase">SR</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Stoppage</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roster.map((row, index) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{index + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-bold text-gray-900">{row.name}</p>
                          <p className="text-[10px] font-semibold text-gray-500">{row.admissionNo}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.route}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-gray-900 uppercase">{row.busNo}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                          {gradeLabel(row.className)} - {row.section}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 max-w-[180px]">
                          <span className="block truncate" title={row.stoppage}>
                            {row.stoppage}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <AttendanceMarkCell
                            dayInfo={markDayInfo}
                            status={row.markStatus}
                            attendancePercent={0}
                            remarks={row.remarks}
                            onStatusChange={(status) => updateStatus(row.id, status)}
                            onRemarksChange={(remarks) =>
                              setRoster((prev) =>
                                prev.map((item) => (item.id === row.id ? { ...item, remarks } : item))
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {roster.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                          No transport students found for the selected route.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Month</label>
              <input
                type="month"
                value={registerMonth}
                onChange={(e) => {
                  setRegisterMonth(e.target.value);
                  setRegisterLoaded(false);
                }}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Route</label>
              <SelectMenu
                value={registerRoute}
                onChange={(value) => {
                  setRegisterRoute(value);
                  setRegisterLoaded(false);
                }}
                options={routeOptions.map((r) => ({
                  value: r,
                  label: r === "All" ? "All Routes" : r,
                }))}
                aria-label="Filter register by route"
              />
            </div>
            <button
              type="button"
              onClick={loadRegister}
              disabled={registerLoading}
              className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#144835]/90 disabled:opacity-70"
            >
              {registerLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
              {registerLoading ? "Loading..." : "Load Register"}
            </button>
            {registerSummary ? (
              <button
                type="button"
                onClick={exportRegisterExcel}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Export Excel
              </button>
            ) : null}
          </div>

          {!registerLoaded && !registerLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-12 text-center text-xs font-bold text-gray-400">
              Select month and route, then click Load Register.
            </div>
          ) : null}

          {registerLoading && !registerSummary ? (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-12 text-center text-xs font-bold text-gray-400">
              Loading register...
            </div>
          ) : null}

          {registerSummary ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                  <CalendarDays size={14} className="text-[#144835]" />
                  Transport Register — {new Date(registerSummary.year, registerSummary.month).toLocaleString("default", { month: "long", year: "numeric" })}
                  {registerRoute !== "All" ? ` · ${registerRoute}` : ""}
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                  <span className="text-emerald-600">P Present</span>
                  <span className="text-red-600">A Absent</span>
                  <span className="text-gray-400">— Not marked</span>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[min(70vh,640px)]">
                <table className="border-collapse text-[10px] w-max min-w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#144835] text-white">
                      <th className="sticky left-0 z-20 bg-[#144835] px-2 py-2 border-r border-[#0f3628]">#</th>
                      <th className="sticky left-8 z-20 bg-[#144835] px-2 py-2 border-r border-[#0f3628]">Adm</th>
                      <th className="sticky left-20 z-20 bg-[#144835] px-2 py-2 border-r border-[#0f3628] min-w-[120px]">Student</th>
                      <th className="px-2 py-2 border-r border-[#0f3628]">Route</th>
                      <th className="px-2 py-2 border-r border-[#0f3628]">Class</th>
                      {Array.from({ length: registerSummary.daysInMonth }, (_, i) => i + 1).map((day) => (
                        <th key={day} className="w-8 min-w-[32px] px-0 py-2 text-center border-r border-[#0f3628]">
                          {day}
                        </th>
                      ))}
                      {REGISTER_SUMMARY.map((label) => (
                        <th key={label} className="px-2 py-2 border-r border-[#0f3628] min-w-[40px] text-center">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registerSummary.rows.map((row) => (
                      <tr key={row.student.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                        <td className="sticky left-0 bg-white px-2 py-1.5 border-r border-gray-100 text-center">{row.index}</td>
                        <td className="sticky left-8 bg-white px-2 py-1.5 border-r border-gray-100">{row.student.admissionNo}</td>
                        <td className="sticky left-20 bg-white px-2 py-1.5 border-r border-gray-100 font-semibold text-gray-900">{row.student.name}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100">{row.student.route}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">
                          {gradeLabel(row.student.className)} - {row.student.section}
                        </td>
                        {Array.from({ length: registerSummary.daysInMonth }, (_, i) => i + 1).map((day) => {
                          const status = row.dayMarks[day] ?? "None";
                          return (
                            <td key={day} className={cn("px-0 py-1.5 text-center border-r border-gray-100", attendanceStatusColor(status))}>
                              {status === "None" ? "—" : status}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center border-r border-gray-100 font-bold text-emerald-700">{row.present}</td>
                        <td className="px-2 py-1.5 text-center border-r border-gray-100 font-bold text-red-600">{row.absent}</td>
                        <td className="px-2 py-1.5 text-center border-r border-gray-100">{row.working}</td>
                        <td className="px-2 py-1.5 text-center font-bold">{row.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

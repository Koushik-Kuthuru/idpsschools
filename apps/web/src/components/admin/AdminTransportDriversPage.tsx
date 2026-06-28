"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Phone,
  RotateCw,
  Save,
  Search,
  User,
  Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import SelectMenu from "@/components/ui/SelectMenu";
import AttendanceMarkCell from "@/components/admin/attendance/AttendanceMarkCell";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { classifyAttendanceDay, type AttendanceMarkStatus } from "@/utils/attendance";
import { summarizeTransportMonth } from "@/lib/transportAttendanceUtils";
import type { TransportDriverRow } from "@/lib/transportDriversUtils";
import * as XLSX from "xlsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = ["Driver List", "Mark Attendance", "Attendance Register"] as const;
type DriverTab = (typeof TABS)[number];

const REGISTER_SUMMARY = ["TP", "TA", "TW", "%"] as const;

function tabFromParam(value: string | null): DriverTab {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized === "attendance" || normalized === "mark") return "Mark Attendance";
  if (normalized === "register") return "Attendance Register";
  return "Driver List";
}

type RosterRow = TransportDriverRow & {
  markStatus: AttendanceMarkStatus;
  remarks: string;
};

function attendanceStatusColor(status: AttendanceMarkStatus) {
  if (status === "P") return "text-emerald-700 font-bold";
  if (status === "A") return "text-red-600 font-bold";
  if (status === "HD") return "text-amber-600 font-bold";
  return "text-gray-400";
}

export default function AdminTransportDriversPage() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<DriverTab>(() => tabFromParam(searchParams.get("tab")));
  const [drivers, setDrivers] = useState<TransportDriverRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("All");
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
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
  const [monthMarks, setMonthMarks] = useState<
    Record<string, Record<string, { status: AttendanceMarkStatus; remarks?: string }>>
  >({});

  useEffect(() => {
    setActiveTab(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const loadDrivers = useCallback(async () => {
    if (!schoolId) return;
    setDriversLoading(true);
    setDriversError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (currentYear?.name) params.set("academicYear", currentYear.name);
      const res = await fetch(`/api/admin/transport/drivers?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load drivers");
      setDrivers((data.drivers ?? []) as TransportDriverRow[]);
    } catch (err) {
      setDriversError(err instanceof Error ? err.message : "Failed to load drivers");
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const routeOptions = useMemo(() => {
    const routes = new Set<string>();
    for (const driver of drivers) {
      for (const route of driver.routes) routes.add(route);
    }
    return ["All", ...[...routes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchRoute = routeFilter === "All" || driver.routes.includes(routeFilter);
      const matchSearch =
        !q ||
        `${driver.name} ${driver.mobile} ${driver.routes.join(" ")} ${driver.busNos.join(" ")}`
          .toLowerCase()
          .includes(q);
      return matchRoute && matchSearch;
    });
  }, [drivers, search, routeFilter]);

  const markDayInfo = useMemo(
    () => classifyAttendanceDay(attendanceDate, []),
    [attendanceDate]
  );

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
      const res = await fetch(`/api/admin/transport/driver-attendance?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load attendance");

      const marks = (data.marks ?? {}) as Record<string, { status?: AttendanceMarkStatus; remarks?: string }>;
      setRoster(
        filteredDrivers.map((driver) => ({
          ...driver,
          markStatus: marks[driver.id]?.status ?? "None",
          remarks: marks[driver.id]?.remarks ?? "",
        }))
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to load attendance");
      setRoster(
        filteredDrivers.map((driver) => ({
          ...driver,
          markStatus: "None",
          remarks: "",
        }))
      );
    } finally {
      setMarksLoading(false);
    }
  }, [schoolId, currentYear?.name, attendanceDate, filteredDrivers]);

  useEffect(() => {
    if (activeTab !== "Mark Attendance") return;
    loadMarksForDate();
  }, [activeTab, loadMarksForDate]);

  const totals = useMemo(() => {
    const present = roster.filter((r) => r.markStatus === "P").length;
    const absent = roster.filter((r) => r.markStatus === "A" || r.markStatus === "HD").length;
    return { total: roster.length, present, absent };
  }, [roster]);

  const updateStatus = (driverId: string, status: AttendanceMarkStatus) => {
    setRoster((prev) => prev.map((row) => (row.id === driverId ? { ...row, markStatus: status } : row)));
  };

  const handleSave = async () => {
    if (!schoolId || !currentYear?.name) return;
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const marks = Object.fromEntries(
        roster.map((row) => [row.id, { status: row.markStatus, remarks: row.remarks || undefined }])
      );
      const res = await fetch("/api/admin/transport/driver-attendance", {
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
      setSaveMessage("Driver attendance saved successfully.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const registerDrivers = useMemo(() => {
    return drivers.filter((driver) => registerRoute === "All" || driver.routes.includes(registerRoute));
  }, [drivers, registerRoute]);

  const registerSummary = useMemo(() => {
    if (!registerLoaded) return null;
    const base = summarizeTransportMonth(
      registerMonth,
      registerDrivers.map((d) => d.id),
      monthMarks
    );
    const rows = registerDrivers.map((driver, index) => {
      const stats = base.rows.find((r) => r.studentId === driver.id);
      return {
        index: index + 1,
        driver,
        dayMarks: stats?.dayMarks ?? {},
        present: stats?.present ?? 0,
        absent: stats?.absent ?? 0,
        working: stats?.working ?? 0,
        percent: stats?.percent ?? 0,
      };
    });
    return { ...base, rows };
  }, [registerLoaded, registerMonth, registerDrivers, monthMarks]);

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
      const res = await fetch(`/api/admin/transport/driver-attendance?${params.toString()}`);
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
      "Driver",
      "Mobile",
      "Route(s)",
      "Bus No(s)",
      "Students",
      ...Array.from({ length: registerSummary.daysInMonth }, (_, i) => String(i + 1)),
      ...REGISTER_SUMMARY,
    ];
    const rows = registerSummary.rows.map((row) => [
      row.index,
      row.driver.name,
      row.driver.mobile || "—",
      row.driver.routes.join(", "),
      row.driver.busNos.join(", "),
      row.driver.studentCount,
      ...Array.from({ length: registerSummary.daysInMonth }, (_, i) => row.dayMarks[i + 1] ?? ""),
      row.present,
      row.absent,
      row.working,
      row.percent,
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Driver Register");
    XLSX.writeFile(book, `driver-attendance-register-${registerMonth}.xlsx`);
  };

  const totalStudents = useMemo(
    () => drivers.reduce((sum, driver) => sum + driver.studentCount, 0),
    [drivers]
  );

  const listLoading = driversLoading && drivers.length === 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Transport Drivers"
        description={
          currentYear?.name
            ? `Driver roster and daily attendance · ${currentYear.name}`
            : "Driver roster and daily attendance"
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Drivers", value: String(drivers.length), icon: User },
          { label: "Routes Covered", value: String(Math.max(routeOptions.length - 1, 0)), icon: Bus },
          { label: "Students Assigned", value: String(totalStudents), icon: Users },
          {
            label: activeTab === "Mark Attendance" ? "Present Today" : "On Roster",
            value: activeTab === "Mark Attendance" ? String(totals.present) : String(drivers.length),
            icon: CheckCircle2,
          },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <item.icon size={14} className="text-gray-400" />
            </div>
            <p className="text-lg font-bold tabular-nums text-[#144835]">{item.value}</p>
          </div>
        ))}
      </div>

      {(driversError || saveError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {driversError || saveError}
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

      {activeTab === "Driver List" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search driver, mobile, route…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none"
                />
              </div>
              <SelectMenu
                value={routeFilter}
                onChange={setRouteFilter}
                options={routeOptions.map((r) => ({ value: r, label: r === "All" ? "All Routes" : r }))}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadDrivers()}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1.5"
              >
                <RotateCw size={14} />
                Refresh
              </button>
              <ExportButton
                data={filteredDrivers.map((driver, index) => ({
                  SR: index + 1,
                  "Driver Name": driver.name,
                  Mobile: driver.mobile || "—",
                  Route: driver.routes.join(", "),
                  "Bus No": driver.busNos.join(", "),
                  Students: driver.studentCount,
                }))}
                filename={`transport-drivers-${schoolId}`}
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {["#", "Driver Name", "Mobile", "Route(s)", "Bus No(s)", "Students"].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">
                        Loading drivers…
                      </td>
                    </tr>
                  ) : filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400">
                        No drivers found. Assign drivers on student transport profiles.
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver, index) => (
                      <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 tabular-nums">{index + 1}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                              <User size={12} />
                            </div>
                            <span className="text-xs font-bold text-gray-900">{driver.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                          {driver.mobile ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} className="text-gray-400" />
                              {driver.mobile}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                          {driver.routes.length ? driver.routes.join(", ") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                          {driver.busNos.length ? driver.busNos.join(", ") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-bold text-[#144835] tabular-nums">
                          {driver.studentCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Mark Attendance" && (
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 h-9">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(attendanceDate);
                    d.setDate(d.getDate() - 1);
                    setAttendanceDate(d.toISOString().slice(0, 10));
                  }}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-xs font-bold text-gray-900 outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(attendanceDate);
                    d.setDate(d.getDate() + 1);
                    setAttendanceDate(d.toISOString().slice(0, 10));
                  }}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <SelectMenu
                value={routeFilter}
                onChange={setRouteFilter}
                options={routeOptions.map((r) => ({ value: r, label: r === "All" ? "All Routes" : r }))}
                className="w-36"
              />
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search driver…"
                  className="h-9 w-48 pl-9 pr-3 rounded-lg border border-gray-200 text-xs font-semibold focus:border-[#144835] outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadMarksForDate()}
                disabled={marksLoading}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1.5"
              >
                <RotateCw size={14} className={marksLoading ? "animate-spin" : ""} />
                Reload
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !markDayInfo.canMark}
                className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#0f3a28] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Save size={14} />
                {isSaving ? "Saving…" : "Save Attendance"}
              </button>
            </div>
          </div>

          {!markDayInfo.canMark && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
              {markDayInfo.label}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {["#", "Driver", "Mobile", "Route(s)", "Bus", "Students", "Status"].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marksLoading && roster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                        Loading attendance…
                      </td>
                    </tr>
                  ) : roster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                        No drivers on roster for this filter.
                      </td>
                    </tr>
                  ) : (
                    roster.map((row, index) => (
                      <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-xs text-gray-500 tabular-nums">{index + 1}</td>
                        <td className="px-3 py-2 text-xs font-bold text-gray-900">{row.name}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-700">{row.mobile || "—"}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-700">
                          {row.routes.join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-gray-700">
                          {row.busNos.join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-[#144835] tabular-nums">{row.studentCount}</td>
                        <td className="px-3 py-2">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 px-1">
            <span>
              Total: <strong className="text-gray-900">{totals.total}</strong>
            </span>
            <span className={attendanceStatusColor("P")}>
              Present: {totals.present}
            </span>
            <span className={attendanceStatusColor("A")}>
              Absent: {totals.absent}
            </span>
          </div>
        </div>
      )}

      {activeTab === "Attendance Register" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white">
                <CalendarDays size={14} className="text-gray-400" />
                <input
                  type="month"
                  value={registerMonth}
                  onChange={(e) => {
                    setRegisterMonth(e.target.value);
                    setRegisterLoaded(false);
                  }}
                  className="text-xs font-bold text-gray-900 outline-none bg-transparent"
                />
              </div>
              <SelectMenu
                value={registerRoute}
                onChange={(value) => {
                  setRegisterRoute(value);
                  setRegisterLoaded(false);
                }}
                options={routeOptions.map((r) => ({ value: r, label: r === "All" ? "All Routes" : r }))}
                className="w-40"
              />
              <button
                type="button"
                onClick={() => void loadRegister()}
                disabled={registerLoading}
                className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#0f3a28] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <RotateCw size={14} className={registerLoading ? "animate-spin" : ""} />
                Load Register
              </button>
            </div>
            {registerSummary && (
              <button
                type="button"
                onClick={exportRegisterExcel}
                className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
              >
                Export Excel
              </button>
            )}
          </div>

          {registerSummary ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-2 py-2 text-left font-bold text-gray-500 sticky left-0 bg-gray-50/95">SR</th>
                      <th className="px-2 py-2 text-left font-bold text-gray-500 sticky left-8 bg-gray-50/95 min-w-[120px]">
                        Driver
                      </th>
                      <th className="px-2 py-2 text-left font-bold text-gray-500">Route</th>
                      {Array.from({ length: registerSummary.daysInMonth }, (_, i) => (
                        <th key={i} className="px-1 py-2 text-center font-bold text-gray-500 w-6">
                          {i + 1}
                        </th>
                      ))}
                      {REGISTER_SUMMARY.map((col) => (
                        <th key={col} className="px-2 py-2 text-center font-bold text-gray-500">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registerSummary.rows.map((row) => (
                      <tr key={row.driver.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                        <td className="px-2 py-1.5 tabular-nums text-gray-500 sticky left-0 bg-white">{row.index}</td>
                        <td className="px-2 py-1.5 font-bold text-gray-900 sticky left-8 bg-white">{row.driver.name}</td>
                        <td className="px-2 py-1.5 text-gray-700">{row.driver.routes.join(", ") || "—"}</td>
                        {Array.from({ length: registerSummary.daysInMonth }, (_, i) => {
                          const status = row.dayMarks[i + 1] ?? "None";
                          return (
                            <td
                              key={i}
                              className={cn("px-1 py-1.5 text-center", attendanceStatusColor(status))}
                            >
                              {status === "None" ? "" : status}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center font-bold text-emerald-700">{row.present}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-red-600">{row.absent}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-gray-700">{row.working}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-[#144835]">{row.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-12 text-center">
              <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-500">
                Select a month and click Load Register to view driver attendance.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

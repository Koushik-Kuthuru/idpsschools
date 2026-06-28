"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bus, ChevronDown, Eye, MapPin, Search, UserCheck, UserX } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import SelectMenu from "@/components/ui/SelectMenu";
import TableRowActions from "@/components/ui/TableRowActions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchTransportStudents } from "@/hooks/useBranchTransportStudents";
import type { BranchTransportStudentRow } from "@/lib/loadBranchStudents";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  "Using Transport",
  "Not Using Transport",
  "Route Wise",
  "Stop Wise",
] as const;
type StudentListTab = (typeof TABS)[number];

function tabFromParam(value: string | null): StudentListTab {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized === "not-using") return "Not Using Transport";
  if (normalized === "route-wise" || normalized === "by-route") return "Route Wise";
  if (normalized === "stop-wise" || normalized === "by-stop") return "Stop Wise";
  return "Using Transport";
}

function gradeLabel(className: string) {
  if (!className || className === "—") return "—";
  return /^\d+$/.test(className) ? `Grade ${className}` : className;
}

function TruncatedAddress({
  value,
  maxWidth = "max-w-[220px]",
}: {
  value: string;
  maxWidth?: string;
}) {
  const text = value && value !== "—" ? value : "—";
  return (
    <span
      className={cn("block truncate", maxWidth, text === "—" && "text-gray-400")}
      title={text !== "—" ? text : undefined}
    >
      {text}
    </span>
  );
}

function filterRows(
  rows: BranchTransportStudentRow[],
  search: string,
  classFilter: string,
  sectionFilter: string,
  routeFilter = "All",
  stopFilter = "All"
) {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    const matchClass = classFilter === "All" || row.className === classFilter;
    const matchSection =
      sectionFilter === "All" || row.section.toUpperCase() === sectionFilter.toUpperCase();
    const matchRoute = routeFilter === "All" || row.route === routeFilter;
    const matchStop = stopFilter === "All" || row.stoppage === stopFilter;
    const matchSearch =
      !q ||
      `${row.name} ${row.admissionNo} ${row.className} ${row.section} ${row.busNo} ${row.route} ${row.stoppage}`
        .toLowerCase()
        .includes(q);
    return matchClass && matchSection && matchRoute && matchStop && matchSearch;
  });
}

type GroupedStudents = {
  key: string;
  label: string;
  meta: string;
  students: BranchTransportStudentRow[];
};

function groupByRoute(students: BranchTransportStudentRow[]): GroupedStudents[] {
  const map = new Map<string, BranchTransportStudentRow[]>();
  for (const student of students) {
    const route = student.route && student.route !== "—" ? student.route : "Unassigned Route";
    const list = map.get(route) ?? [];
    list.push(student);
    map.set(route, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([route, rows]) => {
      const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
      const busNos = [...new Set(sorted.map((s) => s.busNo).filter((b) => b && b !== "—"))];
      return {
        key: route,
        label: route,
        meta: busNos.length ? `Bus ${busNos.join(", ")}` : "No bus assigned",
        students: sorted,
      };
    });
}

function groupByStop(students: BranchTransportStudentRow[]): GroupedStudents[] {
  const map = new Map<string, BranchTransportStudentRow[]>();
  for (const student of students) {
    const stop = student.stoppage && student.stoppage !== "—" ? student.stoppage : "Unassigned Stop";
    const list = map.get(stop) ?? [];
    list.push(student);
    map.set(stop, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([stop, rows]) => {
      const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
      const routes = [...new Set(sorted.map((s) => s.route).filter((r) => r && r !== "—"))];
      return {
        key: stop,
        label: stop,
        meta: routes.length ? `Route ${routes.join(", ")}` : "No route assigned",
        students: sorted,
      };
    });
}

function tabCount(
  tab: StudentListTab,
  using: number,
  notUsing: number,
  routes: number,
  stops: number
) {
  if (tab === "Using Transport") return using;
  if (tab === "Not Using Transport") return notUsing;
  if (tab === "Route Wise") return routes;
  return stops;
}

export default function AdminTransportStudentsPage() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const searchParams = useSearchParams();
  const base = `/schools/${schoolId}/admin`;

  const { usingTransport, notUsingTransport, loading, error } = useBranchTransportStudents(
    schoolId,
    currentYear?.name
  );

  const [activeTab, setActiveTab] = useState<StudentListTab>(() =>
    tabFromParam(searchParams.get("tab"))
  );
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [routeFilter, setRouteFilter] = useState("All");
  const [stopFilter, setStopFilter] = useState("All");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const classOptions = useMemo(() => {
    const all = [...usingTransport, ...notUsingTransport];
    const grades = [...new Set(all.map((s) => s.className).filter((g) => g && g !== "—"))].sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    );
    return ["All", ...grades];
  }, [usingTransport, notUsingTransport]);

  const sectionOptions = useMemo(() => {
    const all = [...usingTransport, ...notUsingTransport];
    const sections = [...new Set(all.map((s) => s.section).filter((s) => s && s !== "—"))].sort(
      (a, b) => a.localeCompare(b)
    );
    return ["All", ...sections];
  }, [usingTransport, notUsingTransport]);

  const routeOptions = useMemo(() => {
    const routes = [...new Set(usingTransport.map((s) => s.route).filter((r) => r && r !== "—"))].sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    );
    return ["All", ...routes];
  }, [usingTransport]);

  const stopOptions = useMemo(() => {
    const stops = [...new Set(usingTransport.map((s) => s.stoppage).filter((s) => s && s !== "—"))].sort(
      (a, b) => a.localeCompare(b, undefined, { numeric: true })
    );
    return ["All", ...stops];
  }, [usingTransport]);

  const filteredUsing = useMemo(
    () => filterRows(usingTransport, search, classFilter, sectionFilter, routeFilter, stopFilter),
    [usingTransport, search, classFilter, sectionFilter, routeFilter, stopFilter]
  );

  const filteredNotUsing = useMemo(
    () => filterRows(notUsingTransport, search, classFilter, sectionFilter),
    [notUsingTransport, search, classFilter, sectionFilter]
  );

  const routeGroups = useMemo(() => groupByRoute(filteredUsing), [filteredUsing]);
  const stopGroups = useMemo(() => groupByStop(filteredUsing), [filteredUsing]);

  const activeRows = activeTab === "Using Transport" ? filteredUsing : filteredNotUsing;
  const listLoading = loading && usingTransport.length === 0 && notUsingTransport.length === 0;

  const exportData = useMemo(() => {
    if (activeTab === "Route Wise") {
      return filteredUsing.flatMap((row) => ({
        Route: row.route,
        "Bus No.": row.busNo,
        Name: row.name,
        Class: gradeLabel(row.className),
        Section: row.section,
        "Adm. No.": row.admissionNo,
        Stoppage: row.stoppage,
      }));
    }
    if (activeTab === "Stop Wise") {
      return filteredUsing.flatMap((row) => ({
        Stoppage: row.stoppage,
        Route: row.route,
        "Bus No.": row.busNo,
        Name: row.name,
        Class: gradeLabel(row.className),
        Section: row.section,
        "Adm. No.": row.admissionNo,
      }));
    }
    if (activeTab === "Using Transport") {
      return activeRows.map((row, i) => ({
        SR: i + 1,
        Name: row.name,
        Class: gradeLabel(row.className),
        Section: row.section,
        "Adm. No.": row.admissionNo,
        "Bus No.": row.busNo,
        Route: row.route,
        Stoppage: row.stoppage,
        Driver: row.driverName,
        "Driver Mobile": row.driverMobile,
      }));
    }
    return activeRows.map((row, i) => ({
      SR: i + 1,
      Name: row.name,
      Class: gradeLabel(row.className),
      Section: row.section,
      "Adm. No.": row.admissionNo,
      "Parent Phone": row.parentPhone ?? "—",
      Status: row.status,
    }));
  }, [activeTab, activeRows, filteredUsing]);

  const exportFilename =
    activeTab === "Route Wise"
      ? "route-wise-student-list"
      : activeTab === "Stop Wise"
        ? "stop-wise-student-list"
        : activeTab === "Using Transport"
          ? "students-using-transport"
          : "students-not-using-transport";

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderUsingStudentRow = (row: BranchTransportStudentRow, index: number, showRoute = true, showStop = true) => (
    <tr key={row.id} className="hover:bg-gray-50/50">
      <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{index + 1}</td>
      <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.name}</td>
      <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{gradeLabel(row.className)}</td>
      <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.section}</td>
      <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.admissionNo}</td>
      <td className="px-4 py-2.5 text-xs font-bold text-gray-900 uppercase">{row.busNo}</td>
      {showRoute ? (
        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.route}</td>
      ) : null}
      {showStop ? (
        <td
          className="px-4 py-2.5 text-xs font-semibold text-gray-700 max-w-[220px] w-[220px]"
        >
          <TruncatedAddress value={row.stoppage} />
        </td>
      ) : null}
      <td className="px-4 py-2.5 text-right">
        <TableRowActions
          items={[
            {
              label: "View Profile",
              icon: Eye,
              href: `${base}/academic/students/${row.id}/profile?tab=Transport`,
            },
            {
              label: "Edit Transport",
              icon: Bus,
              href: `${base}/academic/students/${row.id}/profile?tab=Transport`,
            },
          ]}
        />
      </td>
    </tr>
  );

  const renderGroupedView = (groups: GroupedStudents[], groupType: "route" | "stop") => {
    if (listLoading) {
      return <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">Loading...</div>;
    }
    if (groups.length === 0) {
      return (
        <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">
          No transport students found for the selected filters.
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {groups.map((group) => {
          const collapsed = collapsedGroups[group.key];
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/80 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {groupType === "route" ? (
                    <MapPin size={14} className="text-[#144835] shrink-0" />
                  ) : (
                    <Bus size={14} className="text-[#144835] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate" title={group.label}>
                      {group.label}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-500 truncate" title={group.meta}>
                      {group.meta}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#144835] bg-[#144835]/10 px-2 py-0.5 rounded-full">
                    {group.students.length} students
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn("text-gray-400 transition-transform", collapsed && "-rotate-90")}
                  />
                </div>
              </button>
              {!collapsed ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="w-12 px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">SR</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Section</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Adm. No.</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Bus No.</th>
                        {groupType === "route" ? (
                          <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase max-w-[220px] w-[220px]">
                            Stoppage
                          </th>
                        ) : (
                          <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Route</th>
                        )}
                        <th className="w-12 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.students.map((row, index) =>
                        renderUsingStudentRow(
                          row,
                          index + 1,
                          groupType === "stop",
                          groupType === "route"
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Student List"
        description="Students using transport, not using transport, and route or stop wise views"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { label: "Using Transport", value: String(usingTransport.length), icon: UserCheck, tone: "text-emerald-600" },
          { label: "Not Using Transport", value: String(notUsingTransport.length), icon: UserX, tone: "text-gray-700" },
          { label: "Routes", value: String(Math.max(routeGroups.length, 0)), icon: MapPin, tone: "text-[#144835]" },
          { label: "Stops", value: String(Math.max(stopGroups.length, 0)), icon: Bus, tone: "text-[#144835]" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <item.icon size={16} className={`${item.tone} mb-2`} />
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className={`text-lg font-bold tabular-nums ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

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
            <span className="ml-1.5 tabular-nums text-[10px] font-bold opacity-70">
              (
              {tabCount(
                tab,
                usingTransport.length,
                notUsingTransport.length,
                routeGroups.length,
                stopGroups.length
              )}
              )
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
              <SelectMenu
                value={classFilter}
                onChange={setClassFilter}
                options={classOptions.map((c) => ({
                  value: c,
                  label: c === "All" ? "All Classes" : gradeLabel(c),
                }))}
                aria-label="Filter by class"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
              <SelectMenu
                value={sectionFilter}
                onChange={setSectionFilter}
                options={sectionOptions.map((s) => ({
                  value: s,
                  label: s === "All" ? "All Sections" : s,
                }))}
                aria-label="Filter by section"
              />
            </div>
            {activeTab === "Route Wise" ? (
              <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
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
            ) : null}
            {activeTab === "Stop Wise" ? (
              <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stop</label>
                <SelectMenu
                  value={stopFilter}
                  onChange={setStopFilter}
                  options={stopOptions.map((s) => ({
                    value: s,
                    label: s === "All" ? "All Stops" : s,
                  }))}
                  aria-label="Filter by stop"
                />
              </div>
            ) : null}
          </div>
          <ExportButton
            data={exportData}
            filename={exportFilename}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 shrink-0"
            iconSize={14}
          />
        </div>

        <div className="overflow-x-auto">
          {activeTab === "Route Wise" ? (
            renderGroupedView(routeGroups, "route")
          ) : activeTab === "Stop Wise" ? (
            renderGroupedView(stopGroups, "stop")
          ) : listLoading ? (
            <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">Loading...</div>
          ) : activeTab === "Using Transport" ? (
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-12 px-4 py-3 text-xs font-bold text-gray-500 uppercase">SR</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Adm. No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase max-w-[220px] w-[220px]">
                    Stoppage
                  </th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRows.map((row, index) => renderUsingStudentRow(row, index + 1))}
                {activeRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No students using transport found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-12 px-4 py-3 text-xs font-bold text-gray-500 uppercase">SR</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Adm. No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Parent Phone</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.name}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                      {gradeLabel(row.className)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.section}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.admissionNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                      {row.parentPhone ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          row.status === "Active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <TableRowActions
                        items={[
                          {
                            label: "View Profile",
                            icon: Eye,
                            href: `${base}/academic/students/${row.id}/profile`,
                          },
                          {
                            label: "Assign Transport",
                            icon: Bus,
                            href: `${base}/academic/students/${row.id}/profile?tab=Transport`,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {activeRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No students without transport found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

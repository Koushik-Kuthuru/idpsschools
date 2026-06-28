"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import {
  Bus,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { computeTransportHostelMetrics } from "@/lib/adminDashboardLive";
import { hasDbQueryCache } from "@/lib/dbQueryCache";
import {
  buildPath,
  buildQuery,
  db,
  getTimestamp,
  insertData,
  removeData,
  sortBy,
  subscribeData,
} from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabKey = "routes" | "buses" | "drivers" | "students";

type AdminTransportViewProps = {
  page?: "routes" | "buses";
};

type RouteRow = {
  id: string;
  name: string;
  busNo: string;
  driverName: string;
  driverMobile: string;
  stoppage: string;
  status: string;
  studentCount: number;
};

type BusRow = {
  id: string;
  busNo: string;
  registration: string;
  capacity: number;
  driverName: string;
  status: string;
};

type DriverRow = {
  id: string;
  name: string;
  mobile: string;
  busNo: string;
  status: string;
  presentToday: boolean;
};

type TransportStudentRow = {
  id: string;
  name: string;
  className: string;
  section: string;
  busNo: string;
  route: string;
  stoppage: string;
  driverName: string;
};

function formatInr(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export default function AdminTransportView({ page }: AdminTransportViewProps = {}) {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const base = `/schools/${schoolId}/admin`;

  const routesQuery = useMemo(
    () => buildQuery(buildPath(db, "schools", schoolId, "routes"), sortBy("name", "asc")),
    [schoolId]
  );
  const busesQuery = useMemo(
    () => buildQuery(buildPath(db, "schools", schoolId, "buses"), sortBy("busNo", "asc")),
    [schoolId]
  );
  const driversQuery = useMemo(
    () => buildQuery(buildPath(db, "schools", schoolId, "drivers"), sortBy("name", "asc")),
    [schoolId]
  );
  const studentsQuery = useMemo(
    () => buildQuery(buildPath(db, "schools", schoolId, "students"), sortBy("name", "asc")),
    [schoolId]
  );

  const [tab, setTab] = useState<TabKey>(page ?? "routes");
  const activeTab = page ?? tab;
  const [search, setSearch] = useState("");
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [studentDocs, setStudentDocs] = useState<Record<string, unknown>[]>([]);
  const [routesLoading, setRoutesLoading] = useState(!hasDbQueryCache(routesQuery));
  const [busesLoading, setBusesLoading] = useState(!hasDbQueryCache(busesQuery));
  const [driversLoading, setDriversLoading] = useState(!hasDbQueryCache(driversQuery));
  const [studentsLoading, setStudentsLoading] = useState(!hasDbQueryCache(studentsQuery));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [routeForm, setRouteForm] = useState({
    name: "",
    busNo: "",
    driverName: "",
    driverMobile: "",
    stoppage: "",
  });
  const [busForm, setBusForm] = useState({
    busNo: "",
    registration: "",
    capacity: 40,
    driverName: "",
  });
  const [driverForm, setDriverForm] = useState({
    name: "",
    mobile: "",
    busNo: "",
  });

  useEffect(() => {
    if (page) setTab(page);
  }, [page]);

  useEffect(() => {
    const unsubs = [
      subscribeData(
        routesQuery,
        (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          setRoutes(
            snap.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: String(data.name ?? data.route ?? doc.id),
                busNo: String(data.busNo ?? data.bus_no ?? "—"),
                driverName: String(data.driverName ?? data.driver_name ?? "—"),
                driverMobile: String(data.driverMobile ?? data.driver_mobile ?? data.mobile ?? "—"),
                stoppage: String(data.stoppage ?? data.stop ?? "—"),
                status: String(data.status ?? "Active"),
                studentCount: Number(data.studentCount ?? data.students ?? 0),
              };
            })
          );
          setRoutesLoading(false);
        },
        () => setRoutesLoading(false)
      ),
      subscribeData(
        busesQuery,
        (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          setBuses(
            snap.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                busNo: String(data.busNo ?? data.bus_no ?? data.name ?? doc.id),
                registration: String(data.registration ?? data.regNo ?? "—"),
                capacity: Number(data.capacity ?? data.seats ?? 0),
                driverName: String(data.driverName ?? data.driver_name ?? "—"),
                status: String(data.status ?? "Active"),
              };
            })
          );
          setBusesLoading(false);
        },
        () => setBusesLoading(false)
      ),
      subscribeData(
        driversQuery,
        (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          setDrivers(
            snap.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: String(data.name ?? data.driverName ?? "Unnamed"),
                mobile: String(data.mobile ?? data.phone ?? "—"),
                busNo: String(data.busNo ?? data.bus_no ?? "—"),
                status: String(data.status ?? "Active"),
                presentToday: data.presentToday === true || data.status === "Present",
              };
            })
          );
          setDriversLoading(false);
        },
        () => setDriversLoading(false)
      ),
      subscribeData(
        studentsQuery,
        (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
          setStudentDocs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setStudentsLoading(false);
        },
        () => setStudentsLoading(false)
      ),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [routesQuery, busesQuery, driversQuery, studentsQuery]);

  const metrics = useMemo(
    () => computeTransportHostelMetrics(studentDocs, new Date().getMonth()),
    [studentDocs]
  );

  const transportStudents = useMemo<TransportStudentRow[]>(() => {
    return studentDocs
      .filter((s) => {
        const td = s.transportDetails as Record<string, unknown> | undefined;
        return td && String(td.facility ?? "").toUpperCase() === "YES";
      })
      .map((s) => {
        const td = (s.transportDetails ?? {}) as Record<string, unknown>;
        const name =
          String(s.name ?? s.studentName ?? "").trim() ||
          `${String(s.firstName ?? "")} ${String(s.lastName ?? "")}`.trim() ||
          "Unnamed";
        return {
          id: String(s.id ?? ""),
          name,
          className: String(s.classId ?? s.grade ?? s.className ?? "—"),
          section: String(s.section ?? "—"),
          busNo: String(td.busNo ?? "—"),
          route: String(td.route ?? "—"),
          stoppage: String(td.stoppage ?? "—"),
          driverName: String(td.driverName ?? "—"),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentDocs]);

  const tabLoading =
    (activeTab === "routes" && routesLoading && routes.length === 0) ||
    (activeTab === "buses" && busesLoading && buses.length === 0) ||
    (activeTab === "drivers" && driversLoading && drivers.length === 0) ||
    (activeTab === "students" && studentsLoading && transportStudents.length === 0);

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) =>
      `${r.name} ${r.busNo} ${r.driverName} ${r.stoppage}`.toLowerCase().includes(q)
    );
  }, [routes, search]);

  const filteredBuses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter((b) =>
      `${b.busNo} ${b.registration} ${b.driverName}`.toLowerCase().includes(q)
    );
  }, [buses, search]);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) =>
      `${d.name} ${d.mobile} ${d.busNo}`.toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transportStudents;
    return transportStudents.filter((s) =>
      `${s.name} ${s.className} ${s.section} ${s.busNo} ${s.route} ${s.stoppage}`
        .toLowerCase()
        .includes(q)
    );
  }, [transportStudents, search]);

  const stats = useMemo(
    () => [
      { label: "Total Buses", value: String(buses.length || metrics.busNos.size), icon: Bus },
      { label: "Active Routes", value: String(routes.filter((r) => r.status !== "Inactive").length || metrics.routeNames.size), icon: MapPin },
      { label: "Students", value: String(metrics.studentsUsingTransport), icon: Users },
      { label: "Drivers", value: String(drivers.length || metrics.driverNames.size), icon: User },
      { label: "Fee Pending", value: formatInr(metrics.transportFeePending), icon: Wallet },
    ],
    [buses.length, routes, metrics, drivers.length]
  );

  const handleAddRoute = async () => {
    if (!routeForm.name.trim()) {
      setFormError("Route name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const id = routeForm.name.trim().replace(/\s+/g, "-").toLowerCase();
      await insertData(buildPath(db, "schools", schoolId, "routes"), {
        id,
        name: routeForm.name.trim(),
        busNo: routeForm.busNo.trim(),
        driverName: routeForm.driverName.trim(),
        driverMobile: routeForm.driverMobile.trim(),
        stoppage: routeForm.stoppage.trim(),
        status: "Active",
        createdAt: getTimestamp(),
      });
      setRouteForm({ name: "", busNo: "", driverName: "", driverMobile: "", stoppage: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add route");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBus = async () => {
    if (!busForm.busNo.trim()) {
      setFormError("Bus number is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const id = busForm.busNo.trim().replace(/\s+/g, "-").toLowerCase();
      await insertData(buildPath(db, "schools", schoolId, "buses"), {
        id,
        busNo: busForm.busNo.trim(),
        registration: busForm.registration.trim(),
        capacity: busForm.capacity,
        driverName: busForm.driverName.trim(),
        status: "Active",
        createdAt: getTimestamp(),
      });
      setBusForm({ busNo: "", registration: "", capacity: 40, driverName: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add bus");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDriver = async () => {
    if (!driverForm.name.trim()) {
      setFormError("Driver name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const id = driverForm.name.trim().replace(/\s+/g, "-").toLowerCase();
      await insertData(buildPath(db, "schools", schoolId, "drivers"), {
        id,
        name: driverForm.name.trim(),
        mobile: driverForm.mobile.trim(),
        busNo: driverForm.busNo.trim(),
        status: "Active",
        presentToday: false,
        createdAt: getTimestamp(),
      });
      setDriverForm({ name: "", mobile: "", busNo: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add driver");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection: "routes" | "buses" | "drivers", id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await removeData(buildPath(db, "schools", schoolId, collection, id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const tabs: { key: TabKey; label: string }[] = page
    ? []
    : [
        { key: "routes", label: "Routes" },
        { key: "buses", label: "Buses" },
        { key: "drivers", label: "Drivers" },
        { key: "students", label: "Students" },
      ];

  const pageTitle =
    page === "routes" ? "Transport Routes" : page === "buses" ? "Transport Buses" : "Transport Management";
  const pageDescription =
    page === "routes"
      ? "Manage school bus routes, stops, and driver assignments"
      : page === "buses"
        ? "Manage fleet buses, registration, and capacity"
        : `Fleet, routes, drivers, and student assignments${currentYear?.name ? ` · ${currentYear.name}` : ""}`;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <ExportButton
            data={
              activeTab === "routes"
                ? filteredRoutes
                : activeTab === "buses"
                  ? filteredBuses
                  : activeTab === "drivers"
                    ? filteredDrivers
                    : filteredStudents
            }
            filename={`transport-${activeTab}`}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            iconSize={14}
          />
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2"
          >
            <item.icon size={16} className="text-[#144835]" />
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tabs.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSearch("");
                setFormError(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                activeTab === t.key
                  ? "bg-[#144835] text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        )}

        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
        </div>

        {activeTab !== "students" && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/30">
            {formError && (
              <p className="mb-3 text-xs font-bold text-rose-600">{formError}</p>
            )}
            {activeTab === "routes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
                {[
                  { key: "name", label: "Route name", placeholder: "Route 10" },
                  { key: "busNo", label: "Bus no.", placeholder: "AP 39 X 1234" },
                  { key: "driverName", label: "Driver", placeholder: "Driver name" },
                  { key: "driverMobile", label: "Mobile", placeholder: "9876543210" },
                  { key: "stoppage", label: "Main stop", placeholder: "Town center" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {field.label}
                    </span>
                    <input
                      value={routeForm[field.key as keyof typeof routeForm]}
                      onChange={(e) =>
                        setRouteForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAddRoute()}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
                >
                  <Plus size={14} /> Add Route
                </button>
              </div>
            )}
            {activeTab === "buses" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
                {[
                  { key: "busNo", label: "Bus no.", placeholder: "Bus 01" },
                  { key: "registration", label: "Registration", placeholder: "AP 39 X 1234" },
                  { key: "driverName", label: "Driver", placeholder: "Assigned driver" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {field.label}
                    </span>
                    <input
                      value={busForm[field.key as keyof typeof busForm] as string}
                      onChange={(e) =>
                        setBusForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Capacity
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={busForm.capacity}
                    onChange={(e) =>
                      setBusForm((prev) => ({ ...prev, capacity: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAddBus()}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
                >
                  <Plus size={14} /> Add Bus
                </button>
              </div>
            )}
            {activeTab === "drivers" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                {[
                  { key: "name", label: "Driver name", placeholder: "Full name" },
                  { key: "mobile", label: "Mobile", placeholder: "9876543210" },
                  { key: "busNo", label: "Bus no.", placeholder: "Bus 01" },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {field.label}
                    </span>
                    <input
                      value={driverForm[field.key as keyof typeof driverForm]}
                      onChange={(e) =>
                        setDriverForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAddDriver()}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
                >
                  <Plus size={14} /> Add Driver
                </button>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          {tabLoading ? (
            <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">Loading...</div>
          ) : activeTab === "routes" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Driver</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Stop</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoutes.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.name}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.busNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.driverName}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.driverMobile}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.stoppage}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.status}</td>
                    <td className="px-4 py-2.5 text-right">
                      <TableRowActions
                        items={[
                          {
                            label: "Delete",
                            icon: Trash2,
                            destructive: true,
                            onClick: () => void handleDelete("routes", row.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filteredRoutes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No routes yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === "buses" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Registration</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Driver</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBuses.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.busNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.registration}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.capacity || "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.driverName}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.status}</td>
                    <td className="px-4 py-2.5 text-right">
                      <TableRowActions
                        items={[
                          {
                            label: "Delete",
                            icon: Trash2,
                            destructive: true,
                            onClick: () => void handleDelete("buses", row.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filteredBuses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No buses yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === "drivers" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Driver</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Today</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.name}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" />
                        {row.mobile}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.busNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.status}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                      {row.presentToday ? "Present" : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <TableRowActions
                        items={[
                          {
                            label: "Delete",
                            icon: Trash2,
                            destructive: true,
                            onClick: () => void handleDelete("drivers", row.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No drivers yet. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Stop</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Driver</th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.name}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                      {row.className}-{row.section}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.busNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.route}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.stoppage}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.driverName}</td>
                    <td className="px-4 py-2.5 text-right">
                      <SafeLink
                        href={`${base}/academic/students/${encodeURIComponent(row.id)}/profile`}
                        className="text-xs font-bold text-[#144835] hover:underline"
                      >
                        Profile
                      </SafeLink>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No students with transport assigned. Update transport on student profiles.
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

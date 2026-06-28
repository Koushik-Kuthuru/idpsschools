"use client";

import { useMemo, useState } from "react";
import { Bus, Pencil, Plus, Search, Trash2, X, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchTransportBuses } from "@/hooks/useBranchTransportBuses";
import type { TransportBusRecord } from "@/lib/branchTransportStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatPrice(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function AdminTransportBusesTab() {
  const schoolId = useSchoolId();
  const { buses, loading, error, mutating, addBus, updateBus, deleteBus } = useBranchTransportBuses(schoolId);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    busNo: "",
    route: "",
    routePrice: "0",
    status: "Active" as "Active" | "Inactive",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    busNo: "",
    route: "",
    routePrice: "0",
    status: "Active" as "Active" | "Inactive",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter((b) =>
      `${b.busNo} ${b.route} ${b.status} ${b.routePrice}`.toLowerCase().includes(q)
    );
  }, [buses, search]);

  const listLoading = loading && buses.length === 0;

  const startEdit = (row: TransportBusRecord) => {
    setEditId(row.id);
    setEditForm({
      busNo: row.busNo,
      route: row.route,
      routePrice: String(row.routePrice),
      status: row.status,
    });
    setFormError(null);
  };

  const handleAdd = async () => {
    setFormError(null);
    try {
      await addBus({
        busNo: addForm.busNo.trim(),
        route: addForm.route.trim(),
        routePrice: Number(addForm.routePrice) || 0,
        status: addForm.status,
      });
      setAddForm({ busNo: "", route: "", routePrice: "0", status: "Active" });
      setShowAdd(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add bus");
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setFormError(null);
    try {
      await updateBus(editId, {
        busNo: editForm.busNo.trim(),
        route: editForm.route.trim(),
        routePrice: Number(editForm.routePrice) || 0,
        status: editForm.status,
      });
      setEditId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update bus");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Buses", value: String(buses.length), icon: Bus },
          { label: "Active Routes", value: String(new Set(buses.map((b) => b.route)).size), icon: Bus },
          { label: "Active Buses", value: String(buses.filter((b) => b.status === "Active").length), icon: Bus },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <item.icon size={16} className="text-[#144835] mb-2" />
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#144835]/20 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Add New Bus</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          {formError && !editId && (
            <p className="mb-3 text-xs font-bold text-rose-600">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {[
              { key: "busNo", label: "Bus No.", placeholder: "AP39TT3162" },
              { key: "route", label: "Route", placeholder: "R21" },
              { key: "routePrice", label: "Route Price", placeholder: "0", type: "number" },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {field.label}
                </span>
                <input
                  type={field.type ?? "text"}
                  value={addForm[field.key as keyof typeof addForm]}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold uppercase"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</span>
              <select
                value={addForm.status}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    status: e.target.value as "Active" | "Inactive",
                  }))
                }
                className="mt-1 w-full h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <button
              type="button"
              disabled={mutating}
              onClick={() => void handleAdd()}
              className="h-9 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
            >
              Save Bus
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buses..."
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <ExportButton
              data={filtered.map((b, i) => ({
                SR: i + 1,
                "Bus No.": b.busNo,
                Route: b.route,
                "Route Price": b.routePrice,
                Status: b.status,
              }))}
              filename="transport-buses"
              className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              iconSize={14}
            />
            <button
              type="button"
              onClick={() => {
                setShowAdd((v) => !v);
                setFormError(null);
              }}
              className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90"
            >
              <Plus size={14} /> Add Bus
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {listLoading ? (
            <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-12 px-4 py-3 text-xs font-bold text-gray-500 uppercase">SR</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="w-28 px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, index) => {
                  const isEditing = editId === row.id;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            value={editForm.busNo}
                            onChange={(e) => setEditForm((p) => ({ ...p, busNo: e.target.value.toUpperCase() }))}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs font-bold uppercase"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-900 uppercase">{row.busNo}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            value={editForm.route}
                            onChange={(e) => setEditForm((p) => ({ ...p, route: e.target.value.toUpperCase() }))}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs font-semibold uppercase"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-700">{row.route}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editForm.routePrice}
                            onChange={(e) => setEditForm((p) => ({ ...p, routePrice: e.target.value }))}
                            className="w-full h-8 rounded border border-gray-200 px-2 text-xs font-semibold"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-700 tabular-nums">
                            {formatPrice(row.routePrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                status: e.target.value as "Active" | "Inactive",
                              }))
                            }
                            className="h-8 rounded border border-gray-200 px-2 text-xs font-semibold"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        ) : (
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
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={mutating}
                              onClick={() => void handleSaveEdit()}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-[#144835] text-white"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditId(null)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <TableRowActions
                            items={[
                              {
                                label: "Update",
                                icon: Pencil,
                                onClick: () => startEdit(row),
                              },
                              {
                                label: "Delete",
                                icon: Trash2,
                                destructive: true,
                                dividerBefore: true,
                                confirmMessage: `Delete bus ${row.busNo}?`,
                                onClick: () => void deleteBus(row.id),
                              },
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No buses found. Click &quot;Add Bus&quot; to register a vehicle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {editId && formError && (
          <div className="px-4 py-3 border-t border-rose-100 bg-rose-50 text-xs font-bold text-rose-600">
            {formError}
          </div>
        )}
      </div>
    </div>
  );
}

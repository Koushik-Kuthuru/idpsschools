"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import ExportButton from "@/components/ui/ExportButton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchTransportBuses } from "@/hooks/useBranchTransportBuses";

function formatPrice(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function AdminTransportRoutesTab() {
  const schoolId = useSchoolId();
  const { buses, loading, error } = useBranchTransportBuses(schoolId);
  const [search, setSearch] = useState("");

  const routes = useMemo(
    () =>
      [...buses].sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true })),
    [buses]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) =>
      `${r.route} ${r.busNo} ${r.status}`.toLowerCase().includes(q)
    );
  }, [routes, search]);

  const listLoading = loading && buses.length === 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <MapPin size={16} className="text-[#144835]" />
          <p className="text-xs font-semibold text-gray-600">
            {routes.length} routes · switch to the Buses tab to add or update records
          </p>
        </div>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes..."
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
          <div className="flex items-center justify-end shrink-0">
            <ExportButton
              data={filtered.map((r, i) => ({
                SR: i + 1,
                Route: r.route,
                "Bus No.": r.busNo,
                "Route Price": r.routePrice,
                Status: r.status,
              }))}
              filename="transport-routes"
              className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
              iconSize={14}
            />
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
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Bus No.</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Route Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{row.route}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 uppercase">{row.busNo}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 tabular-nums">
                      {formatPrice(row.routePrice)}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.status}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No routes yet. Add buses on the Buses tab.
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

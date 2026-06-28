"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToggleProps = { checked: boolean; onChange: (v: boolean) => void };

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-[#144835]" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

type AcademicYearPanelProps = {
  compact?: boolean;
};

export default function AcademicYearPanel({ compact = false }: AcademicYearPanelProps) {
  const ctx = useAcademicYearOptional();
  if (!ctx) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
        Academic year settings are unavailable on this page.
      </div>
    );
  }
  const { years, currentYear, loading, error, refresh, createYear, setCurrentYear } = ctx;
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [setAsCurrent, setSetAsCurrent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const inputCls =
    "w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all placeholder:text-gray-400";
  const selectCls =
    "w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer";

  const sortedYears = useMemo(
    () => [...years].sort((a, b) => String(b.start_date).localeCompare(String(a.start_date))),
    [years]
  );

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await createYear({
      name: trimmed,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      setAsCurrent,
    });
    setName("");
    setStartDate("");
    setEndDate("");
    setSaving(false);
  };

  const handleSelectActive = async (id: string) => {
    if (id === currentYear?.id) return;
    setSwitchingId(id);
    await setCurrentYear(id);
    setSwitchingId(null);
  };

  return (
    <div className={cn("space-y-4", compact ? "" : "lg:col-span-2")}>
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
          {error.includes("School not found") ? (
            <span> — add this branch in General settings or run the schema on Supabase first.</span>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-[#144835]/15 bg-[#144835]/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#144835]/70">
              Active academic year
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Students, classes, enrollments and teacher scope use this year across the portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="relative mt-3">
          <select
            className={selectCls}
            value={currentYear?.id ?? ""}
            disabled={loading || sortedYears.length === 0 || switchingId !== null}
            onChange={(e) => void handleSelectActive(e.target.value)}
          >
            {sortedYears.length === 0 ? (
              <option value="">No academic years yet</option>
            ) : (
              sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.is_current ? " (active)" : ""}
                </option>
              ))
            )}
          </select>
        </div>

        {currentYear ? (
          <p className="mt-2 text-xs text-gray-500">
            {currentYear.start_date && currentYear.end_date
              ? `${currentYear.start_date} → ${currentYear.end_date}`
              : "Dates not set"}
          </p>
        ) : null}
      </div>

      {!compact ? (
        <div>
          <p className="mb-3 text-xs font-bold text-gray-700">All academic years</p>
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            <div className="border-b border-[#144835]/10 bg-[#144835]/5 px-4 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#144835]">Sessions</p>
            </div>
            {loading && years.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading…</div>
            ) : sortedYears.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No academic years yet — create one below.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Year</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Period</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedYears.map((y) => (
                    <tr key={y.id} className="bg-white transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{y.name}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">
                        {y.start_date && y.end_date ? `${y.start_date} – ${y.end_date}` : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-bold",
                            y.is_current ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {y.is_current ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Toggle
                          checked={y.is_current}
                          onChange={(v) => v && void handleSelectActive(y.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-bold text-gray-700">Create academic year</p>
        <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2026-2027"
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
          />
          {!compact ? (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
                aria-label="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
                aria-label="End date"
              />
            </>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={setAsCurrent}
              onChange={(e) => setSetAsCurrent(e.target.checked)}
              className="rounded border-gray-300 text-[#144835] focus:ring-[#144835]"
            />
            Set as active year
          </label>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void handleCreate()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 transition-all hover:bg-[#144835]/90 disabled:opacity-50"
          >
            <Plus size={13} />
            {saving ? "Creating…" : "Add year"}
          </button>
        </div>
      </div>
    </div>
  );
}

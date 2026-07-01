"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, GraduationCap, RotateCcw, Pencil } from "lucide-react";
import {
  DEFAULT_EXTRA_FEES,
  DEFAULT_FEE_HEADS,
  DEFAULT_FEE_TYPES,
  emptyClassFeeGrid,
  FEE_METHODS,
  gradeDisplayLabel,
  mergeClassFeeGrid,
  type ClassFeeStructureEntry,
  type ExtraFeeItem,
  type FeeConfiguration,
  type FeeHead,
  type FeeTypeItem,
} from "@/lib/feeConfigurationStore";
import type { FeeGridRow } from "@/lib/feeDepositUtils";
import { hasFeeGridData } from "@/lib/feeDepositUtils";
import { gradesMatchForClass, gradeDocId } from "@/lib/gradeOrder";

const FEE_MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];

type PanelProps = {
  config: FeeConfiguration;
  onChange: (next: FeeConfiguration) => void;
  inputCls: string;
  selectCls: string;
};

function rowTotal(values: string[]) {
  return values.reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
}

function cloneFeeGrid(grid: FeeGridRow[]): FeeGridRow[] {
  return grid.map((row) => ({ ...row, values: [...row.values] }));
}

function feeGridsEqual(a: FeeGridRow[], b: FeeGridRow[]) {
  if (a.length !== b.length) return false;
  return a.every((row, i) => {
    const other = b[i];
    if (!other || row.name !== other.name || row.method !== other.method) return false;
    return row.values.every((v, j) => v === other.values[j]);
  });
}

function formatFeeCell(value: string) {
  const n = parseInt(value, 10) || 0;
  return n === 0 ? "0" : n.toLocaleString("en-IN");
}

export function FeeHeadsPanel({ config, onChange, inputCls }: PanelProps) {
  const updateHead = (index: number, patch: Partial<FeeHead>) => {
    const feeHeads = config.feeHeads.map((h, i) => (i === index ? { ...h, ...patch } : h));
    onChange({ ...config, feeHeads });
  };

  const addHead = () => {
    onChange({
      ...config,
      feeHeads: [
        ...config.feeHeads,
        { id: `head-${Date.now()}`, name: "New Head", description: "" },
      ],
    });
  };

  const removeHead = (index: number) => {
    const removed = config.feeHeads[index];
    if (!removed) return;
    onChange({
      ...config,
      feeHeads: config.feeHeads.filter((_, i) => i !== index),
      feeTypes: config.feeTypes.map((t) =>
        t.headId === removed.id ? { ...t, headId: undefined } : t
      ),
    });
  };

  const resetDefaults = () => onChange({ ...config, feeHeads: DEFAULT_FEE_HEADS });

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Group standard fee items under heads such as Academic, Hostel, or Activities. These are used for
        reporting and organisation only.
      </p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Head Name</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Description</th>
              <th className="py-3 px-4 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {config.feeHeads.map((head, index) => (
              <tr key={head.id} className="hover:bg-gray-50/60">
                <td className="py-2 px-4">
                  <input
                    className={inputCls}
                    value={head.name}
                    onChange={(e) => updateHead(index, { name: e.target.value })}
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    className={inputCls}
                    value={head.description ?? ""}
                    placeholder="Optional description"
                    onChange={(e) => updateHead(index, { description: e.target.value })}
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeHead(index)}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                    aria-label="Remove head"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addHead}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#144835] border border-[#144835]/30 rounded-lg bg-emerald-50/50 hover:bg-emerald-50"
        >
          <Plus size={14} /> Add Fee Head
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-gray-800"
        >
          Restore Defaults
        </button>
      </div>
    </div>
  );
}

export function FeeTypesPanel({ config, onChange, inputCls, selectCls }: PanelProps) {
  const headOptions = config.feeHeads;

  const updateType = (index: number, patch: Partial<FeeTypeItem>) => {
    const feeTypes = config.feeTypes.map((t, i) =>
      i === index
        ? {
            ...t,
            ...patch,
            name: patch.name !== undefined ? patch.name.trim().toUpperCase() : t.name,
          }
        : t
    );
    onChange({ ...config, feeTypes });
  };

  const addType = () => {
    onChange({
      ...config,
      feeTypes: [
        ...config.feeTypes,
        { id: `type-${Date.now()}`, name: "NEW FEE", method: "MONTHLY", headId: headOptions[0]?.id },
      ],
    });
  };

  const removeType = (index: number) => {
    const row = config.feeTypes[index];
    if (row?.locked) return;
    onChange({ ...config, feeTypes: config.feeTypes.filter((_, i) => i !== index) });
  };

  const resetDefaults = () => onChange({ ...config, feeTypes: DEFAULT_FEE_TYPES });

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Standard fee line items shown on every student fee sheet. Rename, reorder collection method, or add
        new items. Changes apply to new student profiles unless a student already has a saved structure.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[640px] text-left border-collapse text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Fee Item</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Collection Method</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Fee Head</th>
              <th className="py-3 px-4 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {config.feeTypes.map((type, index) => (
              <tr key={type.id} className="hover:bg-gray-50/60">
                <td className="py-2 px-4">
                  <input
                    className={inputCls}
                    value={type.name}
                    disabled={type.locked}
                    onChange={(e) => updateType(index, { name: e.target.value })}
                  />
                </td>
                <td className="py-2 px-4">
                  <select
                    className={selectCls}
                    value={type.method}
                    disabled={type.locked && type.name === "LAST YEAR DUE"}
                    onChange={(e) =>
                      updateType(index, { method: e.target.value as FeeTypeItem["method"] })
                    }
                  >
                    {FEE_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-4">
                  <select
                    className={selectCls}
                    value={type.headId ?? ""}
                    onChange={(e) => updateType(index, { headId: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {headOptions.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2 text-center">
                  {!type.locked ? (
                    <button
                      type="button"
                      onClick={() => removeType(index)}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                      aria-label="Remove fee item"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addType}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#144835] border border-[#144835]/30 rounded-lg bg-emerald-50/50 hover:bg-emerald-50"
        >
          <Plus size={14} /> Add Fee Item
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-gray-800"
        >
          Restore Defaults
        </button>
      </div>
    </div>
  );
}

export function ExtraFeesPanel({ config, onChange, inputCls, selectCls }: PanelProps) {
  const updateExtra = (index: number, patch: Partial<ExtraFeeItem>) => {
    const extraFees = config.extraFees.map((e, i) =>
      i === index
        ? { ...e, ...patch, name: patch.name !== undefined ? patch.name.trim().toUpperCase() : e.name }
        : e
    );
    onChange({ ...config, extraFees });
  };

  const addExtra = () => {
    onChange({
      ...config,
      extraFees: [...config.extraFees, { id: `extra-${Date.now()}`, name: "NEW EXTRA FEE", method: "ONE TIME" }],
    });
  };

  const removeExtra = (index: number) => {
    onChange({ ...config, extraFees: config.extraFees.filter((_, i) => i !== index) });
  };

  const resetDefaults = () => onChange({ ...config, extraFees: DEFAULT_EXTRA_FEES });

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Optional or ad-hoc charges outside the standard annual grid. Set the late fee per-day rate on the
        Late Fee row.
      </p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Additional Fee</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Method</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide w-36">Rate (₹)</th>
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide">Remark</th>
              <th className="py-3 px-4 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {config.extraFees.map((extra, index) => {
              const isLateFee = extra.id === "extra-late-fine" || extra.name.toUpperCase().includes("LATE FEE");
              return (
              <tr key={extra.id} className="hover:bg-gray-50/60">
                <td className="py-2 px-4">
                  <input
                    className={inputCls}
                    value={extra.name}
                    disabled={isLateFee}
                    onChange={(e) => updateExtra(index, { name: e.target.value })}
                  />
                </td>
                <td className="py-2 px-4">
                  <select
                    className={selectCls}
                    value={extra.method}
                    onChange={(e) =>
                      updateExtra(index, { method: e.target.value as ExtraFeeItem["method"] })
                    }
                  >
                    {FEE_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={extra.rate ?? ""}
                    placeholder={isLateFee ? "Per day" : "Amount"}
                    onChange={(e) => updateExtra(index, { rate: e.target.value })}
                    onFocus={(e) => e.target.value === "0" && e.target.select()}
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    className={inputCls}
                    value={extra.remark ?? ""}
                    placeholder="Optional"
                    onChange={(e) => updateExtra(index, { remark: e.target.value })}
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  {!isLateFee ? (
                  <button
                    type="button"
                    onClick={() => removeExtra(index)}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
                    aria-label="Remove additional fee"
                  >
                    <Trash2 size={14} />
                  </button>
                  ) : null}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addExtra}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#144835] border border-[#144835]/30 rounded-lg bg-emerald-50/50 hover:bg-emerald-50"
        >
          <Plus size={14} /> Add Additional Fee
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-gray-800"
        >
          Restore Defaults
        </button>
      </div>
    </div>
  );
}

type ClassFeesPanelProps = PanelProps & {
  gradeOptions: string[];
  academicYear: string;
  loading?: boolean;
  onSaveClass?: (entry: ClassFeeStructureEntry) => Promise<void>;
};

export function ClassFeesPanel({
  config,
  onChange,
  inputCls,
  selectCls,
  gradeOptions,
  academicYear,
  loading = false,
  onSaveClass,
}: ClassFeesPanelProps) {
  const [selectedGrade, setSelectedGrade] = useState(gradeOptions[0] ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftGrid, setDraftGrid] = useState<FeeGridRow[] | null>(null);
  const [editSnapshot, setEditSnapshot] = useState<FeeGridRow[] | null>(null);
  const [pendingGrade, setPendingGrade] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!gradeOptions.length) {
      setSelectedGrade("");
      setIsEditing(false);
      setDraftGrid(null);
      setEditSnapshot(null);
      setPendingGrade(null);
      return;
    }
    if (!gradeOptions.some((g) => gradesMatchForClass(g, selectedGrade))) {
      setSelectedGrade(gradeOptions[0]);
      setIsEditing(false);
      setDraftGrid(null);
      setEditSnapshot(null);
      setPendingGrade(null);
    }
  }, [gradeOptions, selectedGrade]);

  const activeEntry = useMemo(() => {
    const forGrade = config.classStructures.filter((e) =>
      gradesMatchForClass(e.grade, selectedGrade)
    );
    if (!forGrade.length) return undefined;

    if (!academicYear) return undefined;

    const forYear = forGrade.filter((e) => e.academicYear === academicYear);
    if (!forYear.length) return undefined;

    return (
      forYear.find((e) => hasFeeGridData(e.feeGrid)) ??
      forYear.find((e) => e.status === "Active") ??
      forYear[0]
    );
  }, [config.classStructures, selectedGrade, academicYear]);

  const savedGrid = useMemo(() => {
    const saved = activeEntry?.feeGrid;
    if (saved?.length) return mergeClassFeeGrid(saved, config.feeTypes);
    return emptyClassFeeGrid(config.feeTypes);
  }, [activeEntry?.feeGrid, config.feeTypes]);

  const displayGrid = isEditing && draftGrid ? draftGrid : savedGrid;
  const isDirty =
    isEditing && draftGrid !== null && editSnapshot !== null && !feeGridsEqual(draftGrid, editSnapshot);

  const buildEntryFromGrid = (grid: FeeGridRow[]): ClassFeeStructureEntry => ({
    id: activeEntry?.id ?? `${gradeDocId(selectedGrade)}-${academicYear}`,
    grade: selectedGrade,
    academicYear,
    status: activeEntry?.status ?? "Active",
    feeGrid: mergeClassFeeGrid(grid, config.feeTypes),
  });

  const startEditing = () => {
    const snap = cloneFeeGrid(savedGrid);
    setEditSnapshot(snap);
    setDraftGrid(snap);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftGrid(null);
    setEditSnapshot(null);
  };

  const handleSave = async () => {
    if (!draftGrid || !onSaveClass) return;
    setSaving(true);
    try {
      const entry = buildEntryFromGrid(draftGrid);
      await onSaveClass(entry);
      cancelEditing();
    } catch (err) {
      console.error("Failed to save class fee structure:", err);
      alert("Failed to save class fee structure.");
    } finally {
      setSaving(false);
    }
  };

  const switchToGrade = (nextGrade: string) => {
    cancelEditing();
    setPendingGrade(null);
    setSelectedGrade(nextGrade);
  };

  const requestGradeChange = (nextGrade: string) => {
    if (gradesMatchForClass(nextGrade, selectedGrade)) return;
    if (isEditing && isDirty) {
      setPendingGrade(nextGrade);
      return;
    }
    switchToGrade(nextGrade);
  };

  const saveAndSwitch = async () => {
    if (!pendingGrade) return;
    const target = pendingGrade;
    if (draftGrid && onSaveClass) {
      setSaving(true);
      try {
        const entry = buildEntryFromGrid(draftGrid);
        await onSaveClass(entry);
        cancelEditing();
        setSelectedGrade(target);
        setPendingGrade(null);
      } catch (err) {
        console.error("Failed to save class fee structure:", err);
        alert("Failed to save class fee structure.");
      } finally {
        setSaving(false);
      }
    }
  };

  const discardAndSwitch = () => {
    if (!pendingGrade) return;
    switchToGrade(pendingGrade);
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    if (!isEditing || !draftGrid) return;
    const row = draftGrid[rowIdx];
    if (row?.name === "LAST YEAR DUE") return;
    if (!/^\d*$/.test(val)) return;
    setDraftGrid(
      draftGrid.map((r, i) =>
        i === rowIdx
          ? {
              ...r,
              values: r.values.map((v, j) =>
                j === colIdx ? (val === "" ? "0" : parseInt(val, 10).toString()) : v
              ),
            }
          : r
      )
    );
  };

  const clearGradeGrid = () => {
    if (!isEditing) return;
    const label = gradeDisplayLabel(selectedGrade);
    if (
      !window.confirm(
        `Are you sure you want to reset the fee grid for ${label}? All amounts will be cleared to zero.`
      )
    ) {
      return;
    }
    setDraftGrid(emptyClassFeeGrid(config.feeTypes));
  };

  const grandTotal = displayGrid.reduce((sum, row) => {
    if (row.name === "LAST YEAR DUE") return sum;
    return sum + rowTotal(row.values);
  }, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Set month-wise default fees for each class for the active academic year ({academicYear || "—"}).
        When a student has no individual fee sheet saved, the structure for their enrolled class in that
        year is applied. Last Year Due is set per student on their profile.
      </p>

      {!academicYear ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Select an academic year from the header to view or edit class fee structures.
        </div>
      ) : null}

      {gradeOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          No classes found for the current academic year. Add or import classes on the{" "}
          <strong>Academic → Classes</strong> page first.
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-xs text-gray-500">
          Loading class fee structures…
        </div>
      ) : null}

      {!loading && gradeOptions.length > 0 && academicYear ? (
      <>
      {pendingGrade ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium text-amber-900">
            Save changes for <strong>{gradeDisplayLabel(selectedGrade)}</strong> before switching class?
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveAndSwitch}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white bg-[#144835] rounded-lg hover:bg-[#144835]/90 disabled:opacity-60"
            >
              <Save size={12} />
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={discardAndSwitch}
              disabled={saving}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-60"
            >
              Don&apos;t save
            </button>
            <button
              type="button"
              onClick={() => setPendingGrade(null)}
              disabled={saving}
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[#144835]" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</span>
            <select
              className={`${selectCls} min-w-[160px]`}
              value={selectedGrade}
              onChange={(e) => requestGradeChange(e.target.value)}
            >
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {gradeDisplayLabel(g)}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Academic Year: {activeEntry?.academicYear ?? academicYear}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              (activeEntry?.status ?? "Active") === "Active"
                ? "bg-emerald-100 text-[#144835]"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {activeEntry?.status ?? "Active"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-[#0d3023] transition-all"
            >
              <Pencil size={14} strokeWidth={2.5} />
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={clearGradeGrid}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg bg-white"
              >
                <RotateCcw size={12} />
                Reset Grid
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left border-collapse text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 font-bold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_0_#e5e7eb]">
                Fee Item
              </th>
              <th className="py-3 px-3 font-bold text-gray-500 uppercase tracking-wide text-center border-l border-gray-100">
                Method
              </th>
              {FEE_MONTHS.map((m) => (
                <th
                  key={m}
                  className="py-3 px-2 font-bold text-gray-500 uppercase tracking-wide text-center border-l border-gray-100"
                >
                  {m}
                </th>
              ))}
              <th className="py-3 px-4 font-bold text-[#144835] uppercase tracking-wide text-center bg-emerald-50/50 border-l border-emerald-100">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayGrid.map((fee, rowIdx) => {
              const isLastYearDue = fee.name === "LAST YEAR DUE";
              const total = isLastYearDue ? 0 : rowTotal(fee.values);
              return (
                <tr key={`${fee.name}-${rowIdx}`} className="hover:bg-gray-50/50 group">
                  <td className="py-2 px-4 font-bold text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">
                    {fee.name}
                  </td>
                  <td className="py-2 px-3 text-center border-l border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100/80 px-2 py-1 rounded uppercase">
                      {fee.method}
                    </span>
                  </td>
                  {fee.values.map((val, colIdx) => (
                    <td key={colIdx} className="py-2 px-1 text-center border-l border-gray-50">
                      {isLastYearDue ? (
                        <span className="inline-flex w-14 h-8 items-center justify-center text-gray-300 font-bold">
                          —
                        </span>
                      ) : isEditing ? (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          onFocus={(e) => e.target.value === "0" && e.target.select()}
                          className={`w-14 h-8 text-center text-xs font-bold border rounded-md outline-none transition-all ${
                            val === "0" || val === ""
                              ? "text-gray-400 bg-gray-50/80 border-gray-100"
                              : "text-gray-900 bg-emerald-50/60 border-emerald-100"
                          } focus:bg-white focus:border-[#144835] focus:ring-1 focus:ring-[#144835]/20`}
                        />
                      ) : (
                        <span
                          className={`inline-flex w-14 h-8 items-center justify-center text-xs font-bold tabular-nums ${
                            val === "0" || val === "" ? "text-gray-400" : "text-gray-900"
                          }`}
                        >
                          {formatFeeCell(val)}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-center font-bold text-[#144835] bg-emerald-50/30 border-l border-emerald-100/50">
                    {total.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50/90 border-t-2 border-gray-200">
              <td className="py-3 px-4 font-bold text-gray-600 uppercase sticky left-0 bg-gray-50/90 z-10">
                Grand Total
              </td>
              <td colSpan={13} className="bg-gray-50/90" />
              <td className="py-3 px-4 text-center font-bold text-[#144835] bg-emerald-100/50 border-l border-emerald-200/50">
                ₹{grandTotal.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isEditing ? (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={13} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : null}
      </>
      ) : null}
    </div>
  );
}

export function FeeConfigurationSaveBar({
  saving,
  onSave,
}: {
  saving?: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-60"
      >
        <Save size={13} />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

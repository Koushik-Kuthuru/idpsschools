"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { createStandardFeeGridTemplate } from "@/lib/studentFeeResolver";
import type { FeeGridRow } from "@/lib/feeDepositUtils";

const FEE_MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
const FEE_METHOD_OPTIONS = ["-", "ONE TIME", "MONTHLY", "QUARTERLY", "YEARLY"];

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23144835' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: "right 0.5rem center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "1em 1em",
};

export type FeeStructureFormState = {
  feeCategory: string;
  feeTypeFilter: string;
  feeStatus: string;
  lastYearDue: string;
  discRemark: string;
  feeGrid: FeeGridRow[];
};

type Props = {
  initial: FeeStructureFormState;
  onSave: (state: FeeStructureFormState) => Promise<void>;
  schoolId?: string;
  classFeeSource?: { grade: string; academicYear?: string } | null;
};

function cloneFormState(state: FeeStructureFormState): FeeStructureFormState {
  return {
    ...state,
    feeGrid: state.feeGrid.map((row) => ({ ...row, values: [...row.values] })),
  };
}

function calculateRowTotal(values: string[]) {
  return values.reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
}

function formatFeeCell(value: string) {
  const n = parseInt(value, 10) || 0;
  return n === 0 ? "0" : n.toLocaleString("en-IN");
}

export default function StudentFeeStructureEditor({ initial, onSave, schoolId, classFeeSource }: Props) {
  const standardFeeNames = useMemo(
    () => new Set(createStandardFeeGridTemplate(schoolId).map((row) => row.name.toUpperCase())),
    [schoolId]
  );

  const [feeCategory, setFeeCategory] = useState(initial.feeCategory);
  const [feeTypeFilter, setFeeTypeFilter] = useState(initial.feeTypeFilter);
  const [feeStatus, setFeeStatus] = useState(initial.feeStatus);
  const [lastYearDue, setLastYearDue] = useState(initial.lastYearDue);
  const [discRemark, setDiscRemark] = useState(initial.discRemark);
  const [feeGrid, setFeeGrid] = useState(initial.feeGrid);
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<FeeStructureFormState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setFeeCategory(initial.feeCategory);
    setFeeTypeFilter(initial.feeTypeFilter);
    setFeeStatus(initial.feeStatus);
    setLastYearDue(initial.lastYearDue);
    setDiscRemark(initial.discRemark);
    setFeeGrid(initial.feeGrid);
  }, [initial, isEditing]);

  const currentState = (): FeeStructureFormState => ({
    feeCategory,
    feeTypeFilter,
    feeStatus,
    lastYearDue,
    discRemark,
    feeGrid,
  });

  const isStandardFeeRow = (name: string) => standardFeeNames.has(name.toUpperCase());
  const canRemoveFeeRow = (name: string) => !isStandardFeeRow(name);

  const calculateGrandTotal = () => {
    const gridTotal = feeGrid.reduce((sum, row) => sum + calculateRowTotal(row.values), 0);
    return gridTotal + (parseInt(lastYearDue, 10) || 0);
  };

  const startEditing = () => {
    setEditSnapshot(cloneFormState(currentState()));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (editSnapshot) {
      setFeeCategory(editSnapshot.feeCategory);
      setFeeTypeFilter(editSnapshot.feeTypeFilter);
      setFeeStatus(editSnapshot.feeStatus);
      setLastYearDue(editSnapshot.lastYearDue);
      setDiscRemark(editSnapshot.discRemark);
      setFeeGrid(editSnapshot.feeGrid);
    }
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const handleFeeChange = (rowIdx: number, colIdx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newGrid = [...feeGrid];
    newGrid[rowIdx] = {
      ...newGrid[rowIdx],
      values: [...newGrid[rowIdx].values],
    };
    newGrid[rowIdx].values[colIdx] = val === "" ? "0" : parseInt(val, 10).toString();
    setFeeGrid(newGrid);
  };

  const handleFeeNameChange = (rowIdx: number, name: string) => {
    const newGrid = [...feeGrid];
    newGrid[rowIdx] = { ...newGrid[rowIdx], name: name.toUpperCase() };
    setFeeGrid(newGrid);
  };

  const handleFeeMethodChange = (rowIdx: number, method: string) => {
    const newGrid = [...feeGrid];
    newGrid[rowIdx] = { ...newGrid[rowIdx], method };
    setFeeGrid(newGrid);
  };

  const handleAddFeeRow = () => {
    const method =
      feeTypeFilter === "YEARLY"
        ? "YEARLY"
        : feeTypeFilter === "QUARTERLY"
          ? "QUARTERLY"
          : "MONTHLY";
    setFeeGrid([
      ...feeGrid,
      { name: "NEW FEE", method, values: Array(12).fill("0") },
    ]);
  };

  const handleRemoveFeeRow = (rowIdx: number) => {
    const row = feeGrid[rowIdx];
    if (!canRemoveFeeRow(row.name)) return;
    setFeeGrid(feeGrid.filter((_, idx) => idx !== rowIdx));
  };

  const resetFeeGrid = () => {
    setFeeCategory("GENERAL");
    setFeeTypeFilter("MONTHLY");
    setFeeStatus("NEW");
    setLastYearDue("0");
    setDiscRemark("");
    setFeeGrid(createStandardFeeGridTemplate(schoolId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const state = currentState();
      const syncedGrid = state.feeGrid.map((row) =>
        row.name === "LAST YEAR DUE"
          ? { ...row, values: [state.lastYearDue, ...Array(11).fill("0")] }
          : row
      );
      await onSave({ ...state, feeGrid: syncedGrid });
      setIsEditing(false);
      setEditSnapshot(null);
      alert("Fee structure saved successfully!");
    } catch (err) {
      console.error("Error saving fee structure:", err);
      alert("Failed to save fee structure.");
    } finally {
      setSaving(false);
    }
  };

  const controlClass =
    "h-8 rounded-lg border border-gray-200 bg-white px-3 py-0 text-xs font-bold text-[#144835] focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm cursor-pointer appearance-none pr-8 relative disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {classFeeSource?.grade ? (
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Class Fee Structure</span>
          <span className="text-xs font-bold text-emerald-700">
            {classFeeSource.grade}
            {classFeeSource.academicYear ? ` · ${classFeeSource.academicYear}` : ""}
          </span>
          <span className="text-[11px] font-medium text-emerald-700/80">
            Tuition and other heads are loaded from the class fee grid. Transport fee comes from Transport Details.
          </span>
        </div>
      ) : null}

      <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <div className="text-amber-500 mt-0.5">
          <AlertCircle size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Important Notice</h4>
          <p className="text-xs font-bold text-amber-700/80 mt-0.5">
            Transport/Bus Fee indicated here is for reference only. For changing Bus Fee, please go to the{" "}
            <strong>&apos;Transport Details&apos;</strong> section.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</span>
              <select
                value={feeCategory}
                disabled={!isEditing}
                onChange={(e) => setFeeCategory(e.target.value)}
                className={controlClass}
                style={selectChevronStyle}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="RTE">RTE</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Type</span>
              <select
                value={feeTypeFilter}
                disabled={!isEditing}
                onChange={(e) => setFeeTypeFilter(e.target.value)}
                className={controlClass}
                style={selectChevronStyle}
              >
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
                <option value="YEARLY">YEARLY</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
              <select
                value={feeStatus}
                disabled={!isEditing}
                onChange={(e) => setFeeStatus(e.target.value)}
                className={controlClass}
                style={selectChevronStyle}
              >
                <option value="NEW">NEW</option>
                <option value="OLD">OLD</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Year Due</span>
              <input
                type="number"
                value={lastYearDue}
                disabled={!isEditing}
                onChange={(e) => setLastYearDue(e.target.value)}
                onFocus={(e) => e.target.value === "0" && e.target.select()}
                className="h-8 w-24 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm text-center disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Disc. Remark
              </span>
              <input
                type="text"
                value={discRemark}
                disabled={!isEditing}
                onChange={(e) => setDiscRemark(e.target.value)}
                placeholder="Optional remark..."
                className="h-8 w-full sm:w-48 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-[#0d3023] transition-all active:scale-95"
              >
                <Pencil size={14} strokeWidth={2.5} />
                Edit Fee Structure
              </button>
            ) : (
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 uppercase tracking-wider border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50/90 backdrop-blur-sm z-20 shadow-[1px_0_0_0_#f3f4f6]">
                  Fee Type
                </th>
                <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">
                  Method
                </th>
                {FEE_MONTHS.map((m) => (
                  <th
                    key={m}
                    className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide text-center"
                  >
                    {m}
                  </th>
                ))}
                <th className="py-3 px-4 text-xs font-bold text-[#144835] uppercase tracking-wide text-center bg-emerald-50/50">
                  Total
                </th>
                {isEditing && <th className="py-3 px-2 w-10" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {feeGrid.map((fee, rowIdx) => {
                let rowTotal = calculateRowTotal(fee.values);
                let displayValues = fee.values;

                if (fee.name === "LAST YEAR DUE") {
                  displayValues = [lastYearDue, ...Array(11).fill("0")];
                  rowTotal = parseInt(lastYearDue, 10) || 0;
                }

                const isCustomRow = canRemoveFeeRow(fee.name);

                return (
                  <tr key={`${fee.name}-${rowIdx}`} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-2 px-4 text-xs font-bold text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">
                      {isEditing && isCustomRow ? (
                        <input
                          type="text"
                          value={fee.name}
                          onChange={(e) => handleFeeNameChange(rowIdx, e.target.value)}
                          className="w-full min-w-[120px] h-8 px-2 text-xs font-bold uppercase border border-gray-200 rounded-md focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none"
                        />
                      ) : (
                        fee.name
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isEditing && fee.name !== "LAST YEAR DUE" ? (
                        <select
                          value={fee.method || "-"}
                          onChange={(e) => handleFeeMethodChange(rowIdx, e.target.value)}
                          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider focus:border-[#144835] outline-none"
                        >
                          {FEE_METHOD_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100/50 px-2 py-1 rounded uppercase tracking-wider">
                          {fee.method}
                        </span>
                      )}
                    </td>
                    {displayValues.map((val, colIdx) => (
                      <td key={colIdx} className="py-2 px-1 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={displayValues[colIdx]}
                            onChange={(e) => handleFeeChange(rowIdx, colIdx, e.target.value)}
                            onFocus={(e) => e.target.value === "0" && e.target.select()}
                            disabled={fee.name === "LAST YEAR DUE" && colIdx > 0}
                            readOnly={fee.name === "LAST YEAR DUE"}
                            className={`w-14 h-8 text-center text-xs font-bold ${
                              displayValues[colIdx] === "0" || displayValues[colIdx] === ""
                                ? "text-gray-400 bg-gray-50/50"
                                : "text-gray-900 bg-emerald-50/50"
                            } border border-transparent rounded-md focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 outline-none transition-all hover:bg-white hover:border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                        ) : (
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              val === "0" || val === "" ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {formatFeeCell(val)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-center bg-emerald-50/30 border-l border-emerald-100/50">
                      <span className="text-xs font-bold text-[#144835]">{rowTotal.toLocaleString("en-IN")}</span>
                    </td>
                    {isEditing && (
                      <td className="py-2 px-2 text-center">
                        {isCustomRow ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeeRow(rowIdx)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            aria-label={`Remove ${fee.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })}

              <tr className="bg-gray-50/80 border-t-2 border-gray-200">
                <td className="py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wide sticky left-0 bg-gray-50/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">
                  Grand Total
                </td>
                <td colSpan={13} className="py-4 bg-gray-50/80" />
                <td className="py-4 px-4 text-center bg-emerald-100/50 border-l border-emerald-200/50">
                  <span className="text-sm font-bold text-[#144835]">₹{calculateGrandTotal().toLocaleString("en-IN")}</span>
                </td>
                {isEditing && <td className="bg-gray-50/80" />}
              </tr>
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <button
              type="button"
              onClick={handleAddFeeRow}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#144835] uppercase tracking-wide border border-[#144835]/30 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Fee Row
            </button>
          </div>
        )}

        {isEditing && (
          <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={resetFeeGrid}
              className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors"
            >
              Reset Values
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-[#0d3023] hover:shadow transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Update Fee Structure"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

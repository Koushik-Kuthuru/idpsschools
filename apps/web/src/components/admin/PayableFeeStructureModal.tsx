"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  FEE_MONTHS,
  mergePayableFeeGrid,
  payableFeeGridGrandTotal,
  parseAmount,
  sumRowValues,
  type FeeGridRow,
} from "@/lib/feeDepositUtils";

type PayableFeeStructureModalProps = {
  open: boolean;
  onClose: () => void;
  studentName: string;
  feeGrid?: FeeGridRow[];
  lastYearDue?: string | number;
  transportFees?: unknown;
  totalDiscount?: string | number;
  academicYear?: string | null;
};

function formatCell(value: string | number): string {
  const n = parseAmount(value);
  return n === 0 ? "0" : n.toLocaleString("en-IN");
}

export default function PayableFeeStructureModal({
  open,
  onClose,
  studentName,
  feeGrid,
  lastYearDue,
  transportFees,
  totalDiscount = 0,
  academicYear,
}: PayableFeeStructureModalProps) {
  if (!open || typeof document === "undefined") return null;

  const rows = mergePayableFeeGrid(feeGrid, { lastYearDue, transportFees, academicYear });
  const grandTotal = payableFeeGridGrandTotal(rows);
  const discount = parseAmount(totalDiscount);
  const netPayable = Math.max(0, grandTotal);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payable-fee-structure-title"
      >
        <div className="flex shrink-0 items-center justify-between px-5 py-3 border-b border-gray-200 bg-[#f3f4f6]">
          <h2 id="payable-fee-structure-title" className="text-sm font-bold text-gray-800">
            Annual Fee Structure For {studentName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 overflow-auto px-4 py-3">
          <table className="w-full min-w-[720px] border-collapse text-xs text-gray-800">
            <thead>
              <tr className="border border-gray-300 bg-white">
                <th className="border border-gray-300 px-3 py-2 text-left font-bold w-40">Month</th>
                {FEE_MONTHS.map((m) => (
                  <th key={m} className="border border-gray-300 px-2 py-2 text-center font-bold min-w-[52px]">
                    {m}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-2 text-center font-bold min-w-[72px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowTotal = sumRowValues(row.values);
                return (
                  <tr key={row.name} className="bg-white hover:bg-gray-50/80">
                    <td className="border border-gray-300 px-3 py-1.5 font-semibold text-left whitespace-nowrap">
                      {row.name}
                    </td>
                    {row.values.map((val, i) => (
                      <td key={i} className="border border-gray-300 px-2 py-1.5 text-center font-medium tabular-nums">
                        {formatCell(val)}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-1.5 text-center font-bold tabular-nums">
                      {formatCell(rowTotal)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-white">
                <td colSpan={FEE_MONTHS.length + 1} className="border border-gray-300 px-3 py-2 text-right font-bold">
                  TOTAL (Payable)
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center font-bold tabular-nums">
                  {netPayable.toLocaleString("en-IN")}
                </td>
              </tr>
              {discount > 0 ? (
                <tr className="bg-sky-50/60">
                  <td colSpan={FEE_MONTHS.length + 1} className="border border-gray-300 px-3 py-2 text-right font-bold text-sky-800">
                    Discount (already applied above)
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold tabular-nums text-sky-800">
                    {discount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 justify-end px-5 py-3 border-t border-gray-200 bg-[#f9fafb]">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-6 rounded-md border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

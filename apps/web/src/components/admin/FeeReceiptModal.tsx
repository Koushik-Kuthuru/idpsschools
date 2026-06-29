"use client";

import { Printer, X } from "lucide-react";
import FeeReceiptPrintView, { FeeReceiptPrintPortal } from "@/components/admin/FeeReceiptPrintView";
import type { FeeReceiptPrintData, FeeReceiptTemplateSettings } from "@/lib/feeReceiptTemplate";

type FeeReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  data: FeeReceiptPrintData | null;
  template: FeeReceiptTemplateSettings;
};

export default function FeeReceiptModal({ open, onClose, data, template }: FeeReceiptModalProps) {
  if (!open || !data) return null;

  const singleCopyTemplate = { ...template, duplicateCopies: false };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <FeeReceiptPrintPortal data={data} template={singleCopyTemplate} open={open} />

      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] print:hidden"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fee-receipt-title"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
            <h2 id="fee-receipt-title" className="text-sm font-bold text-gray-900">
              Fee Receipt — {data.receiptNo}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-3 rounded-lg bg-[#144835] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#0f3a2a]"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100">
            <FeeReceiptPrintView data={data} template={singleCopyTemplate} />
          </div>
        </div>
      </div>
    </>
  );
}

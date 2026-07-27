"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { usePortalActions } from "@/contexts/PortalActionContext";

interface Column {
  header: string;
  key: string;
}

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: Column[];
  className?: string;
  iconSize?: number;
  /** When false, skips portal export permission check (e.g. super-admin). */
  requirePermission?: boolean;
}

export default function ExportButton({
  data,
  filename,
  columns,
  className,
  iconSize = 14,
  requirePermission = true,
}: ExportButtonProps) {
  const { canExport, loading } = usePortalActions();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (requirePermission && (loading || !canExport)) {
    return null;
  }

  const getProcessedData = () => {
    if (!data || data.length === 0) return [];

    if (columns && columns.length > 0) {
      return data.map((item) => {
        const row: any = {};
        columns.forEach((col) => {
          let val = item[col.key];
          if (val === undefined || val === null) val = "";
          if (typeof val === "object") val = JSON.stringify(val);
          row[col.header] = val;
        });
        return row;
      });
    }

    return data.map((item) => {
      const row: any = {};
      Object.keys(item).forEach((key) => {
        let val = item[key];
        if (val === undefined || val === null) val = "";
        if (typeof val === "object") val = JSON.stringify(val);
        row[key] = val;
      });
      return row;
    });
  };

  const handleExportExcel = async () => {
    const processedData = getProcessedData();
    if (processedData.length === 0) {
      alert("No data to export");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(processedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      setIsOpen(false);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    const processedData = getProcessedData();
    if (processedData.length === 0) {
      alert("No data to export");
      return;
    }
    setExporting(true);
    try {
      const [{ default: jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default;
      const doc = new jsPDF("landscape");
      const headers = columns ? columns.map((c) => c.header) : Object.keys(processedData[0]);
      const body = processedData.map((row) => headers.map((h) => row[h]));

      autoTable(doc, {
        head: [headers],
        body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 72, 53] },
        margin: { top: 15 },
      });

      doc.save(`${filename}.pdf`);
      setIsOpen(false);
    } finally {
      setExporting(false);
    }
  };

  const defaultClassName =
    "h-9 lg:h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 lg:px-4 text-xs lg:text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || defaultClassName}
        disabled={exporting}
      >
        <Download size={iconSize} /> {exporting ? "Exporting…" : "Export"}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-100">
          <div className="py-1">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <FileSpreadsheet size={14} className="mr-2 text-emerald-600" />
              Export as Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <FileText size={14} className="mr-2 text-red-500" />
              Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

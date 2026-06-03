"use client";

import React, { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportExcelButtonProps {
  onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  className?: string;
  iconSize?: number;
  label?: string;
}

export default function ImportExcelButton({
  onImport,
  className,
  iconSize = 14,
  label = "Import",
}: ImportExcelButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const defaultClassName =
    "h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors disabled:opacity-60";

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert("Please upload an Excel file (.xlsx, .xls) or CSV.");
      return;
    }

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        alert("The file has no worksheets.");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      if (rows.length === 0) {
        alert("No data rows found in the spreadsheet.");
        return;
      }
      await onImport(rows);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to import file.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={className || defaultClassName}
      >
        {loading ? (
          <FileSpreadsheet size={iconSize} className="animate-pulse" />
        ) : (
          <Upload size={iconSize} />
        )}
        {loading ? "Importing…" : label}
      </button>
    </>
  );
}

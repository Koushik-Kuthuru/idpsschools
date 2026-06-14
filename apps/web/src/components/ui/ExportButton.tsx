import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

export default function ExportButton({ data, filename, columns, className, iconSize = 14 }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const getProcessedData = () => {
    if (!data || data.length === 0) return [];
    
    if (columns && columns.length > 0) {
      return data.map(item => {
        const row: any = {};
        columns.forEach(col => {
          // Handle nested keys if necessary, or just simple keys
          let val = item[col.key];
          if (val === undefined || val === null) val = "";
          if (typeof val === 'object') val = JSON.stringify(val);
          row[col.header] = val;
        });
        return row;
      });
    }

    // If no columns specified, just use the raw data but stringify objects
    return data.map(item => {
      const row: any = {};
      Object.keys(item).forEach(key => {
        let val = item[key];
        if (val === undefined || val === null) val = "";
        if (typeof val === 'object') val = JSON.stringify(val);
        row[key] = val;
      });
      return row;
    });
  };

  const handleExportExcel = () => {
    const processedData = getProcessedData();
    if (processedData.length === 0) {
      alert("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    const processedData = getProcessedData();
    if (processedData.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF('landscape');
    
    const headers = columns ? columns.map(c => c.header) : Object.keys(processedData[0]);
    const body = processedData.map(row => headers.map(h => row[h]));

    autoTable(doc, {
      head: [headers],
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 72, 53] }, // Primary green color
      margin: { top: 15 },
    });

    doc.save(`${filename}.pdf`);
    setIsOpen(false);
  };

  const defaultClassName = "h-9 lg:h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 lg:px-4 text-xs lg:text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || defaultClassName}
      >
        <Download size={iconSize} /> Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-100">
          <div className="py-1">
            <button
              onClick={handleExportExcel}
              className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <FileSpreadsheet size={14} className="mr-2 text-emerald-600" />
              Export as Excel
            </button>
            <button
              onClick={handleExportPDF}
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

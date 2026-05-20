"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SeriesItem = {
  label: string;
  value: number;
  tone: string;
};

export default function BarSummary({ title, series }: { title: string; series: SeriesItem[] }) {
  const max = Math.max(1, ...series.map((s) => (Number.isFinite(s.value) ? s.value : 0)));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-gray-900">{title}</p>
        <p className="text-xs font-bold text-gray-500">{series.reduce((sum, s) => sum + (Number.isFinite(s.value) ? s.value : 0), 0).toLocaleString("en-IN")}</p>
      </div>
      <div className="mt-4 space-y-3">
        {series.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600">{s.label}</p>
              <p className="text-xs font-black text-gray-900">{Number.isFinite(s.value) ? s.value.toLocaleString("en-IN") : "0"}</p>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn("h-2 rounded-full", s.tone)}
                style={{ width: `${Math.round(((Number.isFinite(s.value) ? s.value : 0) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


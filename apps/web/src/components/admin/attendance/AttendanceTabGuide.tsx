"use client";

import type { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AttendanceGuideStep = {
  icon: LucideIcon;
  label: string;
  hint: string;
  color: string;
};

export type AttendanceGuideChip = {
  icon: LucideIcon;
  label: string;
};

type AttendanceTabGuideProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  steps: AttendanceGuideStep[];
  chips?: AttendanceGuideChip[];
};

export default function AttendanceTabGuide({
  icon: HeaderIcon,
  title,
  subtitle,
  steps,
  chips = [],
}: AttendanceTabGuideProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-in fade-in duration-500">
      <div className="h-16 w-16 bg-[#144835]/5 rounded-full flex items-center justify-center mb-6">
        <HeaderIcon size={28} className="text-[#144835]/60" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
        {subtitle}
      </p>

      {steps && steps.length > 0 && (
        <div className="flex flex-wrap items-start justify-center gap-6 max-w-3xl">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-2xl border border-gray-100/50 shadow-sm transition-all hover:shadow-md hover:bg-white">
                <div className={cn("flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl", step.color)}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-gray-800">{step.label}</p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">{step.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chips && chips.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {chips.map((chip, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
              <chip.icon size={14} strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-wide uppercase">{chip.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AttendanceTabLoading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center h-12 w-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-gray-100"></div>
        <div className="absolute inset-0 rounded-full border-2 border-[#144835] border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-gray-500 tracking-wide">{label}</p>
    </div>
  );
}


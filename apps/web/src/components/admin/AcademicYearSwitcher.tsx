"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { getActiveAcademicYear } from "@/lib/activeAcademicYear";
import { Skeleton } from "@/components/ui/Skeleton";

const SafeLink = Link as any;

type AcademicYearSwitcherProps = {
  schoolId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function AcademicYearSwitcher({ schoolId, open: openProp, onOpenChange }: AcademicYearSwitcherProps) {
  const academicYear = useAcademicYearOptional();
  const [internalOpen, setInternalOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const open = openProp ?? internalOpen;

  const cachedYearLabel = useMemo(() => getActiveAcademicYear(schoolId), [schoolId]);
  const displayYear = academicYear?.currentYear?.name ?? cachedYearLabel;

  const sortedYears = useMemo(
    () => [...(academicYear?.years ?? [])].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date))),
    [academicYear?.years]
  );

  const setOpenState = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenState(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenState(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!displayYear) return null;

  const handleSelect = async (yearId: string) => {
    if (!academicYear?.setCurrentYear || yearId === academicYear.currentYear?.id) {
      setOpenState(false);
      return;
    }

    setSwitchingId(yearId);
    await academicYear.setCurrentYear(yearId);
    setSwitchingId(null);
    setOpenState(false);
  };

  const canSwitch = Boolean(academicYear?.setCurrentYear && sortedYears.length > 0);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-label="Change academic year"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={switchingId !== null}
        onClick={() => {
          if (!canSwitch) return;
          setOpenState(!open);
        }}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
          canSwitch
            ? "bg-[#144835]/10 text-[#144835] hover:bg-[#144835]/15 cursor-pointer"
            : "bg-[#144835]/10 text-[#144835] cursor-default"
        }`}
      >
        {switchingId ? <Loader2 size={10} className="animate-spin" /> : null}
        <span>{displayYear}</span>
        {canSwitch ? (
          <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        ) : null}
      </button>

      {open && canSwitch ? (
        <div
          role="listbox"
          aria-label="Academic years"
          className="absolute left-0 top-full z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Academic year</p>
          </div>

          {academicYear?.loading && sortedYears.length === 0 ? (
            <div className="space-y-2 px-3 py-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          ) : sortedYears.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-400">No academic years</div>
          ) : (
            sortedYears.map((year) => {
              const isActive = year.id === academicYear?.currentYear?.id;
              const isSwitching = switchingId === year.id;
              return (
                <button
                  key={year.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={isSwitching || switchingId !== null}
                  onClick={() => void handleSelect(year.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[#144835]/5 text-[#144835]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#144835]"
                  }`}
                >
                  <span>{year.name}</span>
                  {isSwitching ? (
                    <Loader2 size={12} className="animate-spin text-[#144835]" />
                  ) : isActive ? (
                    <Check size={12} className="text-[#144835]" />
                  ) : null}
                </button>
              );
            })
          )}

          <div className="border-t border-gray-100 px-3 py-2">
            <SafeLink
              href={`/schools/${schoolId}/admin/settings/academic-years`}
              onClick={() => setOpenState(false)}
              className="text-[11px] font-semibold text-[#144835] hover:underline"
            >
              Manage years
            </SafeLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

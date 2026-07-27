"use client";

import { useEffect, useState } from "react";
import { Plus, RotateCw, Save, Settings2, Trash2, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  defaultTimetableTemplateSet,
  formatTimeRange,
  GRADE_BAND_LABELS,
  nextBreakId,
  nextPeriodId,
  normalizeTimetableTemplateSet,
  type TimetableBreakConfig,
  type TimetableGradeBand,
  type TimetablePeriodConfig,
  type TimetableTemplate,
  type TimetableTemplateSet,
} from "./timetableTemplate";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inputCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

type TimetableTemplatePanelProps = {
  open: boolean;
  /** Saved raw template doc or normalized set / single template. */
  template: TimetableTemplate | TimetableTemplateSet | Record<string, unknown>;
  isSaving: boolean;
  onClose: () => void;
  onSave: (templateSet: TimetableTemplateSet) => void;
};

export default function TimetableTemplatePanel({
  open,
  template,
  isSaving,
  onClose,
  onSave,
}: TimetableTemplatePanelProps) {
  const [draft, setDraft] = useState<TimetableTemplateSet>(() =>
    normalizeTimetableTemplateSet(template)
  );
  const [band, setBand] = useState<TimetableGradeBand>("primary_senior");

  useEffect(() => {
    if (open) setDraft(normalizeTimetableTemplateSet(template));
  }, [open, template]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const active = draft.profiles[band];

  const updatePeriod = (index: number, patch: Partial<TimetablePeriodConfig>) => {
    setDraft((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [band]: {
          ...prev.profiles[band],
          periods: prev.profiles[band].periods.map((p, i) =>
            i === index ? { ...p, ...patch } : p
          ),
        },
      },
    }));
  };

  const removePeriod = (index: number) => {
    setDraft((prev) => {
      const current = prev.profiles[band];
      if (current.periods.length <= 1) return prev;
      const removed = current.periods[index];
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [band]: {
            periods: current.periods.filter((_, i) => i !== index),
            breaks: current.breaks.filter((b) => b.afterPeriodId !== removed.id),
          },
        },
      };
    });
  };

  const addPeriod = () => {
    setDraft((prev) => {
      const current = prev.profiles[band];
      const id = nextPeriodId(current.periods);
      const last = current.periods[current.periods.length - 1];
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [band]: {
            ...current,
            periods: [
              ...current.periods,
              {
                id,
                label: id,
                startTime: last?.endTime ?? "09:00",
                endTime: "09:50",
              },
            ],
          },
        },
      };
    });
  };

  const updateBreak = (index: number, patch: Partial<TimetableBreakConfig>) => {
    setDraft((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [band]: {
          ...prev.profiles[band],
          breaks: prev.profiles[band].breaks.map((b, i) =>
            i === index ? { ...b, ...patch } : b
          ),
        },
      },
    }));
  };

  const removeBreak = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [band]: {
          ...prev.profiles[band],
          breaks: prev.profiles[band].breaks.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const addBreak = () => {
    setDraft((prev) => {
      const current = prev.profiles[band];
      const after =
        current.periods[Math.min(2, current.periods.length - 1)]?.id ??
        current.periods[0]?.id;
      if (!after) return prev;
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [band]: {
            ...current,
            breaks: [
              ...current.breaks,
              {
                id: nextBreakId(current.breaks),
                label: "Break",
                startTime: "10:30",
                endTime: "10:40",
                afterPeriodId: after,
              },
            ],
          },
        },
      };
    });
  };

  const resetDraft = () => setDraft(defaultTimetableTemplateSet);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close timetable template settings"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Timetable template settings"
        className="relative h-full w-full max-w-lg bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#144835]/10 text-[#144835] shrink-0">
                <Settings2 size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900">Bell Timing Template</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official period times — lunch swaps for Grade 6–9
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#144835] hover:bg-white border border-transparent hover:border-gray-200 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
            {(Object.keys(GRADE_BAND_LABELS) as TimetableGradeBand[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBand(key)}
                className={cn(
                  "flex-1 h-8 rounded-md text-[11px] font-bold transition-colors",
                  band === key
                    ? "bg-white text-[#144835] shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {GRADE_BAND_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Periods</h4>
              <button
                type="button"
                onClick={addPeriod}
                className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
              >
                <Plus size={12} />
                Add period
              </button>
            </div>
            <div className="space-y-2">
              {active.periods.map((period, index) => (
                <div key={period.id} className="rounded-xl border border-gray-200 p-3 space-y-2 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      value={period.label}
                      onChange={(e) => updatePeriod(index, { label: e.target.value })}
                      className={cn(inputCls, "flex-1")}
                      placeholder="Label"
                    />
                    <button
                      type="button"
                      onClick={() => removePeriod(index)}
                      disabled={active.periods.length <= 1}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start</label>
                      <input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => updatePeriod(index, { startTime: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End</label>
                      <input
                        type="time"
                        value={period.endTime}
                        onChange={(e) => updatePeriod(index, { endTime: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-400">
                    Period {period.label}: {formatTimeRange(period.startTime, period.endTime)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Breaks</h4>
              <button
                type="button"
                onClick={addBreak}
                className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors"
              >
                <Plus size={12} />
                Add break
              </button>
            </div>
            {active.breaks.length === 0 ? (
              <p className="text-xs text-gray-400 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center">
                No breaks configured. Add one between periods.
              </p>
            ) : (
              <div className="space-y-2">
                {active.breaks.map((brk, index) => (
                  <div key={brk.id} className="rounded-xl border border-amber-100 bg-amber-50/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={brk.label}
                        onChange={(e) => updateBreak(index, { label: e.target.value })}
                        className={cn(inputCls, "flex-1")}
                        placeholder="Break name"
                      />
                      <button
                        type="button"
                        onClick={() => removeBreak(index)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">After period</label>
                      <select
                        value={brk.afterPeriodId}
                        onChange={(e) => updateBreak(index, { afterPeriodId: e.target.value })}
                        className={inputCls}
                      >
                        {active.periods.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Start</label>
                        <input
                          type="time"
                          value={brk.startTime}
                          onChange={(e) => updateBreak(index, { startTime: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">End</label>
                        <input
                          type="time"
                          value={brk.endTime}
                          onChange={(e) => updateBreak(index, { endTime: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40 shrink-0 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetDraft}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Reset bell timing
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={isSaving}
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#144835]/90 disabled:opacity-60 transition-all"
            >
              {isSaving ? <RotateCw size={13} className="animate-spin" /> : <Save size={13} />}
              Save template
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

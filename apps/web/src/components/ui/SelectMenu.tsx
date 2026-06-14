"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SelectMenuOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
  disabled = false,
  "aria-label": ariaLabel,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-left text-xs font-semibold text-gray-800 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-[#144835]/30 bg-white ring-2 ring-[#144835]/20"
        )}
      >
        <span className={cn("truncate", !selected && "text-gray-500")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-gray-400 transition-transform duration-200", open && "rotate-180 text-[#144835]")}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors",
                    isSelected
                      ? "bg-[#144835]/5 text-[#144835]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#144835]"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check size={14} className="shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

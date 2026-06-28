"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
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
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const padding = 8;
    const preferredMax = 224;
    const spaceBelow = window.innerHeight - rect.bottom - gap - padding;
    const spaceAbove = rect.top - gap - padding;
    const placement: "bottom" | "top" =
      spaceBelow >= 120 || spaceBelow >= spaceAbove ? "bottom" : "top";
    const available = placement === "bottom" ? spaceBelow : spaceAbove;
    const maxHeight = Math.min(preferredMax, Math.max(available, 96));

    setMenuPosition({
      top: placement === "bottom" ? rect.bottom + gap : rect.top - gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateMenuPosition]);

  const menu =
    open && menuPosition && mounted ? (
      <ul
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          maxHeight: menuPosition.maxHeight,
          transform: menuPosition.placement === "top" ? "translateY(-100%)" : undefined,
        }}
        className="z-[200] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
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
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) {
              requestAnimationFrame(() => updateMenuPosition());
            }
            return next;
          });
        }}
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
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180 text-[#144835]"
          )}
        />
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

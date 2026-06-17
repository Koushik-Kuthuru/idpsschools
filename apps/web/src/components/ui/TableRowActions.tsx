"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RowActionItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void | Promise<void>;
  destructive?: boolean;
  confirmMessage?: string;
  hidden?: boolean;
  dividerBefore?: boolean;
};

type TableRowActionsProps = {
  items: RowActionItem[];
  align?: "left" | "right";
};

export default function TableRowActions({ items, align = "right" }: TableRowActionsProps) {
  const SafeLink = Link as any;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = items.filter((item) => !item.hidden && (item.href || item.onClick));

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

  if (!visible.length) return null;

  const runAction = async (item: RowActionItem) => {
    if (!item.onClick) return;
    if (item.destructive) {
      const message =
        item.confirmMessage ?? `Delete "${item.label.replace(/^Delete\s*/i, "")}"? This cannot be undone.`;
      if (!window.confirm(message)) return;
    }
    setBusy(true);
    try {
      await item.onClick();
      setOpen(false);
    } catch (err) {
      console.error(err);
      window.alert("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const itemClass = (destructive?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors",
      destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50 hover:text-[#144835]"
    );

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex", align === "right" ? "justify-end" : "justify-start")}
    >
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-400 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50",
          open && "border-gray-200 bg-gray-50 text-gray-700"
        )}
        aria-label="Row actions"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {visible.map((item, index) => {
            const Icon = item.icon ?? (item.destructive ? Trash2 : undefined);
            return (
              <div key={`${item.label}-${index}`}>
                {item.dividerBefore && index > 0 ? <div className="my-1 border-t border-gray-100" /> : null}
                {item.href ? (
                  <SafeLink href={item.href} onClick={() => setOpen(false)} className={itemClass(item.destructive)}>
                    {Icon ? <Icon size={14} className="shrink-0" /> : null}
                    <span>{item.label}</span>
                  </SafeLink>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(item)}
                    className={itemClass(item.destructive)}
                  >
                    {Icon ? <Icon size={14} className="shrink-0" /> : null}
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
const SafeLink = Link as any;
import { MoreHorizontal, Trash2, type LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { inferRowActionPermission } from "@/lib/portalActionUtils";
import { usePortalActions } from "@/contexts/PortalActionContext";

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

type MenuCoords = { top: number; left?: number; right?: number };

export default function TableRowActions({ items, align = "right" }: TableRowActionsProps) {
  const { can, loading: permissionsLoading } = usePortalActions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visible = items.filter((item) => {
    if (item.hidden || (!item.href && !item.onClick)) return false;
    if (permissionsLoading) return false;
    return can(inferRowActionPermission(item));
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 4;
    const estHeight = menuRef.current?.offsetHeight ?? visible.length * 36 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estHeight + gap && rect.top > estHeight + gap;
    const top = openUp ? rect.top - gap - estHeight : rect.bottom + gap;
    if (align === "right") {
      setCoords({ top, right: Math.max(8, window.innerWidth - rect.right) });
    } else {
      setCoords({ top, left: Math.max(8, rect.left) });
    }
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    // Re-measure once the menu has rendered for an accurate flip decision.
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onReposition = () => updatePosition();
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const menu =
    open && coords ? (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          right: coords.right,
        }}
        className="z-[100] min-w-[11rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
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
    ) : null;

  return (
    <div className={cn("relative inline-flex", align === "right" ? "justify-end" : "justify-start")}>
      <button
        ref={buttonRef}
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

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { navGroups } from "./navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const activeGroupId = useMemo(() => {
    const group = navGroups.find((g) =>
      g.items.some((item) => pathname === item.href || (item.href !== "/schools/idpskalaburagi/students" && pathname.startsWith(item.href)))
    );
    return group?.id ?? null;
  }, [pathname]);

  useEffect(() => {
    setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[320px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3 text-[#144835]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#144835] text-white font-extrabold">
              I
            </div>
            <div className="leading-tight">
              <p className="text-xs font-extrabold tracking-tight">IDPS ERP</p>
              <p className="text-xs text-slate-500">Branch Admin</p>
            </div>
          </div>
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="p-3 overflow-y-auto h-[calc(100%-64px)]">
          <div className="space-y-2">
            {navGroups.map((group) => {
              const groupActive = group.items.some(
                (item) => pathname === item.href || (item.href !== "/schools/idpskalaburagi/students" && pathname.startsWith(item.href))
              );

              if (group.items.length === 1) {
                const item = group.items[0];
                const active = groupActive;
                return (
                  <SafeLink
                    key={group.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold",
                      active ? "bg-[#144835]/10 text-[#144835]" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <item.icon size={18} className={cn(active ? "text-[#144835]" : "text-slate-500")} />
                    <span>{item.name}</span>
                  </SafeLink>
                );
              }

              const isOpen = openGroupId === group.id;
              return (
                <div key={group.id} className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenGroupId((prev) => (prev === group.id ? null : group.id))}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold",
                      groupActive ? "bg-[#144835]/10 text-[#144835]" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <group.icon size={18} className={cn(groupActive ? "text-[#144835]" : "text-slate-500")} />
                    <span className="flex-1 text-left">{group.name}</span>
                    <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <div className="p-2 border-t border-slate-200 bg-slate-50/30 space-y-1">
                      {group.items.map((item) => {
                        const active =
                          pathname === item.href || (item.href !== "/schools/idpskalaburagi/students" && pathname.startsWith(item.href));
                        return (
                          <SafeLink
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold",
                              active ? "bg-white text-[#144835]" : "text-slate-700 hover:bg-white"
                            )}
                          >
                            <item.icon size={14} className={cn(active ? "text-[#144835]" : "text-slate-500")} />
                            <span>{item.name}</span>
                          </SafeLink>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

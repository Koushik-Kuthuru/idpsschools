"use client";

import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SettingsNavCategory, SettingsNavKey } from "./settingsNavigation";

const SafeLink = Link as any;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SettingsSidebarProps = {
  categories: SettingsNavCategory[];
  activeKey: SettingsNavKey;
  sidebarExpanded: boolean;
  onInPageSelect?: (key: SettingsNavKey) => void;
};

export default function SettingsSidebar({
  categories,
  activeKey,
  sidebarExpanded,
  onInPageSelect,
}: SettingsSidebarProps) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3" aria-label="Settings navigation">
      {categories.map((category) => (
        <div key={category.label}>
          {sidebarExpanded ? (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {category.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {category.items.map((item) => {
              const active = activeKey === item.key;
              const className = cn(
                "flex w-full items-center rounded-lg text-[13px] font-medium transition-colors",
                sidebarExpanded ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
                active
                  ? "bg-[#144835]/8 text-[#144835]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              );
              const icon = (
                <item.icon
                  size={16}
                  className={cn("shrink-0", active ? "text-[#144835]" : "text-gray-400")}
                />
              );

              if (item.href) {
                return (
                  <SafeLink
                    key={item.key}
                    href={item.href}
                    title={!sidebarExpanded ? item.label : undefined}
                    className={className}
                  >
                    {icon}
                    {sidebarExpanded ? <span className="truncate text-left">{item.label}</span> : null}
                  </SafeLink>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onInPageSelect?.(item.key)}
                  title={!sidebarExpanded ? item.label : undefined}
                  className={className}
                >
                  {icon}
                  {sidebarExpanded ? <span className="truncate text-left">{item.label}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

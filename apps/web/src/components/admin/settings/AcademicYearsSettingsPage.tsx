"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import SettingsPageShell from "@/components/admin/settings/SettingsPageShell";
import SettingsSidebar from "@/components/admin/settings/SettingsSidebar";
import AcademicYearPanel from "@/components/admin/settings/AcademicYearPanel";
import {
  buildSettingsNavCategories,
  settingsBasePath,
} from "@/components/admin/settings/settingsNavigation";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";
import { useBranch } from "@/components/admin/BranchContext";

const SafeLink = Link as any;

export default function AcademicYearsSettingsPage() {
  const { activeBranch } = useBranch();
  const schoolSlug = activeBranch.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navCategories = useMemo(() => buildSettingsNavCategories(schoolSlug), [schoolSlug]);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNavCategories = useMemo(() => {
    if (!normalizedQuery) return navCategories;
    return navCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedQuery) ||
            item.desc.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [navCategories, normalizedQuery]);

  const sidebar = (
    <SettingsSidebar
      categories={filteredNavCategories}
      activeKey="academic-years"
      sidebarExpanded={isSidebarOpen || mobileNavOpen}
    />
  );

  return (
    <AdminNotificationsProvider>
      <SettingsPageShell
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        sidebar={sidebar}
      >
        <div className="px-6 py-8 sm:px-8">
          <SafeLink
            href={settingsBasePath(schoolSlug)}
            className="mb-5 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[#144835]"
          >
            <ChevronRight size={14} className="rotate-180" />
            Settings Home
          </SafeLink>

          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#144835]/10 text-[#144835]">
              <Clock size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Academic Years</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
                Create academic years for {activeBranch.name} and choose which year is active. Students,
                classes, enrollments and teacher scope across the portal follow the active year.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <AcademicYearPanel />
          </div>
        </div>
      </SettingsPageShell>
    </AdminNotificationsProvider>
  );
}

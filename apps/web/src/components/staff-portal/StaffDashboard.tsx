"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/auth/roles";
import { useStaffOverview } from "@/hooks/useStaffPortalData";
import { Calendar, FileText, Megaphone, User } from "lucide-react";
import { StaffPortalError, StaffPortalLoading } from "./StaffPortalStates";

export default function StaffDashboard() {
  const { user, role, schoolId } = useAuth();
  const { data, loading, error, refresh } = useStaffOverview(schoolId);

  const cards = [
    {
      title: "My Profile",
      desc: "View and update your personal details",
      href: `/schools/${schoolId}/staff/profile`,
      icon: User,
    },
    {
      title: "Leave Requests",
      desc: "Apply for leave and track approvals",
      href: `/schools/${schoolId}/staff/leaves`,
      icon: Calendar,
    },
    {
      title: "Announcements",
      desc: "School notices and updates",
      href: `/schools/${schoolId}/staff/announcements`,
      icon: Megaphone,
    },
    {
      title: "Documents",
      desc: "Policies, forms, and resources",
      href: `/schools/${schoolId}/staff/documents`,
      icon: FileText,
    },
  ];

  const overviewCards = data?.overview?.cards ?? [];

  return (
    <div className="space-y-6 font-jost">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
          Welcome, {user?.displayName || "Staff Member"}
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          {role ? getRoleLabel(role) : "Staff"} portal —{" "}
          {schoolId?.replace("idps", "IDPS ").toUpperCase()}
        </p>
      </div>

      {loading ? <StaffPortalLoading variant="dashboard" label="Loading dashboard" /> : null}
      {error ? <StaffPortalError message={error} onRetry={refresh} /> : null}

      {!loading && !error && overviewCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div
              key={`${card.label}-${card.value}`}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="mt-2 text-2xl font-extrabold text-[#144835]">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SafeLink
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-[#144835]/20 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#144835]/10 text-[#144835] transition-colors group-hover:bg-[#144835] group-hover:text-white">
              <card.icon size={18} />
            </div>
            <h2 className="mt-4 text-sm font-extrabold text-gray-900">{card.title}</h2>
            <p className="mt-1 text-xs font-medium text-gray-500">{card.desc}</p>
          </SafeLink>
        ))}
      </div>
    </div>
  );
}

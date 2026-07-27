"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStaffAnnouncements } from "@/hooks/useStaffPortalData";
import { StaffPortalEmpty, StaffPortalError, StaffPortalLoading } from "./StaffPortalStates";

export default function StaffAnnouncementsView() {
  const { schoolId } = useAuth();
  const { data, loading, error, refresh } = useStaffAnnouncements(schoolId);
  const announcements = data?.announcements ?? [];

  return (
    <div className="space-y-6 font-jost">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">School-wide notices and updates for staff.</p>
      </div>

      {loading ? <StaffPortalLoading variant="cards" label="Loading announcements" /> : null}
      {error ? <StaffPortalError message={error} onRetry={refresh} /> : null}

      {!loading && !error && announcements.length === 0 ? (
        <StaffPortalEmpty message="No announcements yet." />
      ) : null}

      {!loading && !error && announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-sm font-extrabold text-gray-900">{item.title}</h2>
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {item.time}
                </span>
              </div>
              {item.body ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                  {item.body}
                </p>
              ) : null}
              {item.audience ? (
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#144835]/70">
                  Audience: {item.audience}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

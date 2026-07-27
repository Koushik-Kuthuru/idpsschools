"use client";

import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import {
  fetchStaffPortal,
  type StaffAnnouncement,
  type StaffLeaveRow,
  type StaffOverviewCard,
  type StaffPortalResource,
  type StaffProfilePayload,
} from "@/lib/portalStaffApi";

export function useStaffPortalData<T>(
  schoolId: string | null | undefined,
  resource: StaffPortalResource,
  params?: Record<string, string>,
) {
  const paramKey = JSON.stringify(params ?? {});
  const cacheKey = clientCacheKey("staff-portal", schoolId ?? "", resource, paramKey);

  return useCachedQuery<T>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: () => fetchStaffPortal<T>(schoolId!, resource, params),
  });
}

export function useStaffOverview(schoolId: string | null | undefined) {
  return useStaffPortalData<{ overview: { cards: StaffOverviewCard[] }; role: string; allowed: string[] }>(
    schoolId,
    "overview",
  );
}

export function useStaffAnnouncements(schoolId: string | null | undefined) {
  return useStaffPortalData<{ announcements: StaffAnnouncement[] }>(schoolId, "announcements");
}

export function useStaffLeaves(schoolId: string | null | undefined) {
  return useStaffPortalData<{ leaves: StaffLeaveRow[] }>(schoolId, "leaves");
}

export function useStaffProfile(schoolId: string | null | undefined) {
  return useStaffPortalData<StaffProfilePayload>(schoolId, "profile");
}

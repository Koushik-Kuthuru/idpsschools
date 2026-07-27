"use client";

import { clientCacheKey } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import {
  fetchLeadershipPortal,
  type LeadershipResource,
  type PrincipalAgendaItem,
  type PrincipalDashboardStat,
  type PrincipalLatestPost,
  type PrincipalPriorityApproval,
} from "@/lib/portalLeadershipApi";

export function useLeadershipData<T>(
  schoolId: string | null | undefined,
  resource: LeadershipResource,
  params?: Record<string, string>,
) {
  const paramKey = JSON.stringify(params ?? {});
  const cacheKey = clientCacheKey("leadership-portal", schoolId ?? "", resource, paramKey);

  return useCachedQuery<T>({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: () => fetchLeadershipPortal<T>(schoolId!, resource, params),
  });
}

export function usePrincipalDashboard(schoolId: string | null | undefined) {
  return useLeadershipData<{
    dashboard: {
      stats: PrincipalDashboardStat[];
      priorityApprovals: PrincipalPriorityApproval[];
      latestPosts: PrincipalLatestPost[];
      agendaItems: PrincipalAgendaItem[];
    };
  }>(schoolId, "dashboard");
}

export type PrincipalLeaveRow = {
  id: string;
  name: string;
  dept: string;
  type: string;
  days: string;
  dates: string;
  submitted: string;
  status: "pending" | "approved" | "rejected";
};

export function usePrincipalLeaves(schoolId: string | null | undefined) {
  return useLeadershipData<{ leaves: PrincipalLeaveRow[] }>(schoolId, "leaves");
}

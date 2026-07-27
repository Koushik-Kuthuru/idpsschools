import { supabase } from "@/lib/supabase/client";

export type LeadershipResource =
  | "dashboard"
  | "vp-dashboard"
  | "academic-director-dashboard"
  | "academic-manager-dashboard"
  | "academic-performance"
  | "staff"
  | "leaves"
  | "attendance"
  | "announcements"
  | "exams"
  | "finance"
  | "departments"
  | "notifications"
  | "profile";

export type PrincipalDashboardStat = {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
};

export type PrincipalPriorityApproval = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  type: "leave" | "exam";
};

export type PrincipalLatestPost = {
  id: string;
  icon: string;
  title: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
};

export type PrincipalAgendaItem = {
  id: string;
  title: string;
  location: string;
  time: string;
  date?: string;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchLeadershipPortal<T>(
  schoolId: string,
  resource: LeadershipResource,
  params?: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams({ schoolId, resource, ...params });
  const res = await fetch(`/api/portal/leadership/data?${search.toString()}`, {
    headers: await authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data.error ?? `Failed to load ${resource}`));
  }
  return data as T;
}

export async function updateLeadershipLeavePortal(
  schoolId: string,
  leaveId: string,
  status: "approved" | "rejected",
) {
  const search = new URLSearchParams({ schoolId, resource: "leaves" });
  const res = await fetch(`/api/portal/leadership/data?${search.toString()}`, {
    method: "POST",
    headers: {
      ...(await authHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ leaveId, status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data.error ?? "Failed to update leave"));
  }
  return data;
}

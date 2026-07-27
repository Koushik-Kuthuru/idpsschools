import { supabase } from "@/lib/supabase/client";

export type StaffPortalResource =
  | "overview"
  | "finance"
  | "expenses"
  | "staff"
  | "departments"
  | "students"
  | "transport"
  | "hostel"
  | "mess"
  | "inventory"
  | "announcements"
  | "notifications"
  | "leaves"
  | "profile";

export type StaffOverviewCard = {
  icon: string;
  label: string;
  value: string;
  tone: string;
};

export type StaffAnnouncement = {
  id: string;
  title: string;
  body: string;
  time: string;
  audience?: string;
  category?: string;
};

export type StaffLeaveRow = {
  id: string;
  employee_id_ref?: string;
  employee_name?: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  days?: number | string;
  status?: string;
  reason?: string;
  created_at?: string;
};

export type StaffProfilePayload = {
  profile: {
    name: string;
    role: string;
    department: string;
    empId: string;
    email: string;
    employment: string;
    serverRole: string;
  };
};

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStaffPortal<T>(
  schoolId: string,
  resource: StaffPortalResource,
  params?: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams({ schoolId, resource, ...params });
  const res = await fetch(`/api/portal/staff/data?${search.toString()}`, {
    headers: await authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data.error ?? `Failed to load ${resource}`));
  }
  return data as T;
}

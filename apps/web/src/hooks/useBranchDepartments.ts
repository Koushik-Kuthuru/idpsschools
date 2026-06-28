"use client";

import { useCallback, useState } from "react";
import { clientCacheKey, writeClientCache } from "@/lib/clientCache";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import type { DepartmentRecord } from "@/components/admin/hr/DepartmentsManagementView";

function mapDepartments(rows: Record<string, unknown>[]): DepartmentRecord[] {
  return rows.map((d) => ({
    id: String(d.id ?? ""),
    name: String(d.name ?? "Unnamed Department"),
    subtitle: String(d.subtitle ?? ""),
    category: d.category as DepartmentRecord["category"],
    designations: Array.isArray(d.designations)
      ? d.designations.map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          staffCount: Number(item.staffCount ?? 0),
        }))
      : [],
    staffCount: Number(d.staffCount ?? 0),
    status: (d.status as DepartmentRecord["status"]) ?? "Active",
  }));
}

export function useBranchDepartments(schoolId: string, academicYear?: string | null) {
  const cacheKey = clientCacheKey("departments", schoolId, academicYear ?? "current");

  const query = useCachedQuery({
    cacheKey,
    enabled: Boolean(schoolId),
    fetcher: async () => {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      const res = await fetch(`/api/admin/departments?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load departments");
      return mapDepartments(data.departments ?? []);
    },
  });

  const [mutating, setMutating] = useState(false);

  const runMutation = useCallback(
    async (request: () => Promise<Response>) => {
      if (!schoolId) throw new Error("School not found");
      setMutating(true);
      try {
        const res = await request();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Request failed");
        const next = mapDepartments(data.departments ?? []);
        query.setData(next);
        writeClientCache(cacheKey, next);
      } catch (err) {
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [cacheKey, query, schoolId]
  );

  const body = useCallback(
    (action: string, extra: Record<string, unknown> = {}) =>
      JSON.stringify({
        schoolId,
        academicYear: academicYear ?? null,
        action,
        ...extra,
      }),
    [schoolId, academicYear]
  );

  const departments = query.data ?? [];

  return {
    departments,
    loading: query.loading,
    refreshing: query.refreshing,
    mutating,
    loadError: query.error,
    refresh: query.refresh,
    addDepartment: (name: string) =>
      runMutation(() =>
        fetch("/api/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body("addDepartment", { name }),
        })
      ),
    updateDepartment: (departmentId: string, name: string) =>
      runMutation(() =>
        fetch("/api/admin/departments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: body("updateDepartment", { departmentId, name }),
        })
      ),
    deleteDepartment: (departmentId: string) =>
      runMutation(() => {
        const params = new URLSearchParams({
          schoolId,
          action: "deleteDepartment",
          departmentId,
        });
        if (academicYear) params.set("academicYear", academicYear);
        return fetch(`/api/admin/departments?${params.toString()}`, { method: "DELETE" });
      }),
    addDesignation: (departmentId: string, name: string) =>
      runMutation(() =>
        fetch("/api/admin/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body("addDesignation", { departmentId, name }),
        })
      ),
    updateDesignation: (departmentId: string, designationId: string, name: string) =>
      runMutation(() =>
        fetch("/api/admin/departments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: body("updateDesignation", { departmentId, designationId, name }),
        })
      ),
    deleteDesignation: (departmentId: string, designationId: string) =>
      runMutation(() => {
        const params = new URLSearchParams({
          schoolId,
          action: "deleteDesignation",
          departmentId,
          designationId,
        });
        if (academicYear) params.set("academicYear", academicYear);
        return fetch(`/api/admin/departments?${params.toString()}`, { method: "DELETE" });
      }),
  };
}

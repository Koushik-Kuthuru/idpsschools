"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  LockKeyhole,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { SkeletonMatrix } from "@/components/ui/Skeleton";
import { RBAC_ACTIONS, RBAC_MODULES, type RbacAction } from "@/lib/rbac/catalog";
import { removeClientCache, clientCacheKey } from "@/lib/clientCache";

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_custom: boolean;
  designation_name: string | null;
  portal_role: string | null;
  record_scope: string;
  status: string;
};

type Matrix = Record<string, string[]>;

const MATRIX_ACTIONS: RbacAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "print",
  "manage",
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function RolePermissionManagementPanel({
  schoolId,
  onSaved,
}: {
  schoolId: string;
  onSaved?: () => void;
}) {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Matrix>({});
  const [baseline, setBaseline] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleQuery, setRoleQuery] = useState("");
  const [moduleQuery, setModuleQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newRoleName, setNewRoleName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(matrix) !== JSON.stringify(baseline),
    [matrix, baseline]
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        String(r.designation_name ?? "")
          .toLowerCase()
          .includes(q)
    );
  }, [roles, roleQuery]);

  const modulesByCategory = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase();
    const groups = new Map<string, typeof RBAC_MODULES>();
    for (const mod of RBAC_MODULES) {
      if (q && !mod.name.toLowerCase().includes(q) && !mod.key.includes(q)) continue;
      const list = groups.get(mod.category) ?? [];
      list.push(mod);
      groups.set(mod.category, list);
    }
    return [...groups.entries()];
  }, [moduleQuery]);

  const permissionSummary = useMemo(() => {
    const granted = RBAC_MODULES.reduce(
      (total, mod) =>
        total + MATRIX_ACTIONS.filter((action) => (matrix[mod.key] ?? []).includes(action)).length,
      0
    );
    const enabledModules = RBAC_MODULES.filter((mod) =>
      MATRIX_ACTIONS.some((action) => (matrix[mod.key] ?? []).includes(action))
    ).length;
    return {
      granted,
      enabledModules,
      total: RBAC_MODULES.length * MATRIX_ACTIONS.length,
    };
  }, [matrix]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Seed on first load
      await adminFetch("/api/admin/rbac/me", {
        method: "POST",
        body: JSON.stringify({ schoolId }),
      }).catch(() => null);

      const res = await adminFetch(
        `/api/admin/rbac/roles?schoolId=${encodeURIComponent(schoolId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load roles");
      const list = (data.roles ?? []) as RoleRow[];
      setRoles(list);
      if (!selectedRoleId && list[0]) setSelectedRoleId(list[0].id);
      else if (selectedRoleId && !list.some((r) => r.id === selectedRoleId) && list[0]) {
        setSelectedRoleId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedRoleId]);

  const loadMatrix = useCallback(
    async (roleId: string) => {
      setError(null);
      try {
        const res = await adminFetch(
          `/api/admin/rbac/roles?schoolId=${encodeURIComponent(schoolId)}&roleId=${encodeURIComponent(roleId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load permissions");
        const next = (data.matrix ?? {}) as Matrix;
        setMatrix(next);
        setBaseline(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load permissions");
      }
    },
    [schoolId]
  );

  useEffect(() => {
    void loadRoles();
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedRoleId) void loadMatrix(selectedRoleId);
  }, [selectedRoleId, loadMatrix]);

  const toggleCell = (moduleKey: string, action: RbacAction) => {
    setMatrix((prev) => {
      const current = new Set(prev[moduleKey] ?? []);
      if (current.has(action)) current.delete(action);
      else {
        current.add(action);
        if (action !== "view") current.add("view");
      }
      return { ...prev, [moduleKey]: [...current] };
    });
  };

  const selectModuleAll = (moduleKey: string, on: boolean) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleKey]: on ? [...MATRIX_ACTIONS] : [],
    }));
  };

  const selectAllVisible = (on: boolean) => {
    setMatrix((prev) => {
      const next = { ...prev };
      for (const [, mods] of modulesByCategory) {
        for (const mod of mods) {
          next[mod.key] = on ? [...MATRIX_ACTIONS] : [];
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/rbac/roles", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          action: "set_permissions",
          roleId: selectedRoleId,
          matrix,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setBaseline(matrix);
      removeClientCache(clientCacheKey("portal-permissions", schoolId));
      removeClientCache(clientCacheKey("rbac-effective", schoolId));
      setMessage("Permissions saved");
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/rbac/roles", {
        method: "POST",
        body: JSON.stringify({ schoolId, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Create failed");
      setNewRoleName("");
      await loadRoles();
      if (data.role?.id) setSelectedRoleId(data.role.id);
      setMessage("Role created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const duplicateRole = async () => {
    if (!selectedRole) return;
    const name = window.prompt("Name for duplicated role", `${selectedRole.name} Copy`);
    if (!name?.trim()) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/rbac/roles", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          action: "duplicate",
          roleId: selectedRole.id,
          name: name.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Duplicate failed");
      await loadRoles();
      if (data.role?.id) setSelectedRoleId(data.role.id);
      setMessage("Role duplicated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async () => {
    if (!selectedRole || selectedRole.is_system) return;
    if (!window.confirm(`Delete role “${selectedRole.name}”? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await adminFetch(
        `/api/admin/rbac/roles?schoolId=${encodeURIComponent(schoolId)}&roleId=${encodeURIComponent(selectedRole.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setSelectedRoleId(null);
      await loadRoles();
      setMessage("Role deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/rbac/me", {
        method: "POST",
        body: JSON.stringify({ schoolId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Seed failed");
      await loadRoles();
      setMessage("Default roles seeded / refreshed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  if (loading && roles.length === 0) {
    return <SkeletonMatrix rows={10} columns={MATRIX_ACTIONS.length} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#144835]/10">
              <Shield size={18} className="text-[#144835]" />
            </span>
            Role & Permission Management
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-5">
            Default permissions come from each designation/role. You can still grant or deny access
            for individual staff on their profile without changing everyone else.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void seedDefaults()}
            disabled={seeding}
            className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Seed defaults
          </button>
          <button
            type="button"
            onClick={() => {
              setMatrix(baseline);
              setMessage(null);
            }}
            disabled={!dirty}
            className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving || !selectedRoleId}
            className="h-9 px-3 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#0f3a2a] disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save changes
          </button>
        </div>
      </div>

      {(error || message) && (
        <div
          className={cn(
            "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold",
            error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"
          )}
        >
          {error || message}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-stretch">
        {/* Role list — scrolls independently */}
        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:h-full xl:min-h-0">
          <div className="shrink-0 space-y-3 border-b border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Roles</p>
                <p className="text-[11px] text-gray-500">{roles.length} designations</p>
              </div>
              <span className="rounded-full bg-white border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-500">
                {filteredRoles.length} shown
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={roleQuery}
                onChange={(e) => setRoleQuery(e.target.value)}
                placeholder="Search roles…"
                className="h-10 w-full pl-8 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold outline-none transition focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10"
              />
            </div>
            <div className="flex gap-1.5">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void createRole();
                }}
                className="h-10 min-w-0 flex-1 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold outline-none transition focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10"
              />
              <button
                type="button"
                onClick={() => void createRole()}
                disabled={!newRoleName.trim() || saving}
                className="h-10 w-10 shrink-0 rounded-xl bg-[#144835] text-white flex items-center justify-center transition hover:bg-[#0f3a2a] disabled:cursor-not-allowed disabled:opacity-40"
                title="Create role"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
            {filteredRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  if (dirty && !window.confirm("Discard unsaved permission changes?")) return;
                  setSelectedRoleId(role.id);
                  setMessage(null);
                }}
                className={cn(
                  "group w-full rounded-xl px-3 py-3 text-left transition hover:bg-gray-50",
                  selectedRoleId === role.id &&
                    "bg-[#144835]/8 ring-1 ring-inset ring-[#144835]/20"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500",
                      selectedRoleId === role.id && "bg-[#144835] text-white"
                    )}
                  >
                    {selectedRoleId === role.id ? <Check size={14} /> : <Shield size={13} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900">{role.name}</span>
                    <span className="mt-0.5 block truncate text-[10px] font-medium text-gray-500">
                      {role.is_system ? "System role" : "Custom role"}
                      {role.record_scope ? ` · ${role.record_scope.replaceAll("_", " ")}` : ""}
                    </span>
                  </span>
                </div>
              </button>
            ))}
            {filteredRoles.length === 0 && (
              <div className="px-3 py-10 text-center text-xs text-gray-500">
                No roles match “{roleQuery}”
              </div>
            )}
          </div>
        </aside>

        {/* Matrix — scrolls independently */}
        <section className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:h-full xl:min-h-0">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-gray-950">
                  {selectedRole?.name ?? "Select a role"}
                </p>
                {selectedRole && (
                  <span className="rounded-full border border-[#144835]/20 bg-[#144835]/8 px-2 py-0.5 text-[10px] font-bold text-[#144835]">
                    {selectedRole.is_system ? "System" : "Custom"}
                  </span>
                )}
                {dirty && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Unsaved changes
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {selectedRole?.description
                  ? selectedRole.description
                  : "Choose the actions this role can perform"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => void duplicateRole()}
                disabled={!selectedRole}
                className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-700 inline-flex items-center gap-1 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                type="button"
                onClick={() => void deleteRole()}
                disabled={!selectedRole || selectedRole.is_system}
                className="h-8 px-2.5 rounded-lg border border-rose-200 bg-white text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 transition hover:bg-rose-50 disabled:opacity-40"
              >
                <Trash2 size={12} /> Delete
              </button>
              <button
                type="button"
                onClick={() => selectAllVisible(true)}
                className="h-8 px-2.5 rounded-lg border border-[#144835]/20 bg-[#144835]/5 text-[#144835] text-[11px] font-bold transition hover:bg-[#144835]/10"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => selectAllVisible(false)}
                className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-[11px] font-bold transition hover:bg-gray-50"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={moduleQuery}
                  onChange={(e) => setModuleQuery(e.target.value)}
                  placeholder="Search modules…"
                  className="h-9 w-full pl-9 pr-3 rounded-xl border border-gray-200 text-xs font-semibold outline-none transition focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10"
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500">
                <span>
                  <strong className="text-gray-900">{permissionSummary.enabledModules}</strong>/
                  {RBAC_MODULES.length} modules
                </span>
                <span className="h-4 w-px bg-gray-200" />
                <span>
                  <strong className="text-[#144835]">{permissionSummary.granted}</strong>/
                  {permissionSummary.total} permissions
                </span>
                <span className="hidden items-center gap-1 text-gray-400 md:flex" title="Each permission is independent">
                  <Info size={13} /> Click a box to toggle
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-gray-50/20">
            <table className="w-full text-xs min-w-[780px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#e5e7eb]">
                <tr className="text-[10px] uppercase tracking-[0.08em] text-gray-500 font-bold">
                  <th className="sticky left-0 z-30 w-[190px] bg-white px-4 py-3 text-left">Module</th>
                  {MATRIX_ACTIONS.map((a) => (
                    <th key={a} className="min-w-[64px] px-1 py-3 text-center capitalize">
                      {a}
                    </th>
                  ))}
                  <th className="min-w-[58px] px-2 py-3 text-center">All</th>
                </tr>
              </thead>
              <tbody>
                {modulesByCategory.map(([category, mods]) => {
                  const isCollapsed = collapsed[category];
                  return (
                    <FragmentCategory
                      key={category}
                      category={category}
                      collapsed={Boolean(isCollapsed)}
                      onToggle={() =>
                        setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }))
                      }
                      mods={mods}
                      matrix={matrix}
                      onToggleCell={toggleCell}
                      onSelectModuleAll={selectModuleAll}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <LockKeyhole size={13} className="text-[#144835]" />
              These are inherited defaults. Personal overrides are managed from each staff profile.
            </p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving || !selectedRoleId}
              className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#144835] px-3 text-xs font-bold text-white transition hover:bg-[#0f3a2a] disabled:opacity-40 sm:inline-flex"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FragmentCategory({
  category,
  collapsed,
  onToggle,
  mods,
  matrix,
  onToggleCell,
  onSelectModuleAll,
}: {
  category: string;
  collapsed: boolean;
  onToggle: () => void;
  mods: readonly { key: string; name: string; category: string }[];
  matrix: Matrix;
  onToggleCell: (moduleKey: string, action: RbacAction) => void;
  onSelectModuleAll: (moduleKey: string, on: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-gray-100/80">
        <td colSpan={MATRIX_ACTIONS.length + 2} className="sticky left-0 px-4 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-600 transition hover:text-[#144835]"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {category}
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-gray-500 shadow-sm">
              {mods.length}
            </span>
          </button>
        </td>
      </tr>
      {!collapsed &&
        mods.map((mod) => {
          const actions = new Set(matrix[mod.key] ?? []);
          const allOn = MATRIX_ACTIONS.every((a) => actions.has(a));
          return (
            <tr key={mod.key} className="group hover:bg-[#144835]/[0.025]">
              <td className="sticky left-0 z-10 border-b border-gray-100 bg-white px-4 py-2.5 font-semibold text-gray-800 group-hover:bg-[#f9fbfa]">
                {mod.name}
              </td>
              {MATRIX_ACTIONS.map((action) => {
                const on = actions.has(action);
                return (
                  <td key={action} className="border-b border-gray-100 px-1 py-2 text-center">
                    <PermissionCheckbox
                      checked={on}
                      label={`${mod.name}: ${action}`}
                      onChange={() => onToggleCell(mod.key, action)}
                    />
                  </td>
                );
              })}
              <td className="border-b border-gray-100 px-2 py-2 text-center">
                <PermissionCheckbox
                  checked={allOn}
                  label={`${mod.name}: all permissions`}
                  onChange={() => onSelectModuleAll(mod.key, !allOn)}
                  emphasis
                />
              </td>
            </tr>
          );
        })}
    </>
  );
}

function PermissionCheckbox({
  checked,
  label,
  onChange,
  emphasis = false,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
  emphasis?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#144835]/30 focus-visible:ring-offset-1",
        checked
          ? emphasis
            ? "border-[#144835] bg-[#144835] text-white shadow-sm"
            : "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10"
          : emphasis
            ? "border-gray-300 bg-gray-50 text-transparent hover:border-[#144835] hover:bg-[#144835]/5"
            : "border-gray-200 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50"
      )}
    >
      <Check size={14} strokeWidth={3} />
    </button>
  );
}

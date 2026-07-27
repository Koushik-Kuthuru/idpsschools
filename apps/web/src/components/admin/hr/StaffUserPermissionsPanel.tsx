"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, Shield, UserCog } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { SkeletonMatrix } from "@/components/ui/Skeleton";
import { RBAC_MODULES, type RbacAction } from "@/lib/rbac/catalog";
import { removeClientCache, clientCacheKey } from "@/lib/clientCache";

type RoleRow = {
  id: string;
  name: string;
  key: string;
  designation_name?: string | null;
};

type OverrideRow = {
  moduleKey: string;
  actionKey: string;
  effect: "grant" | "deny";
};

type EffectivePayload = {
  fullAccess: boolean;
  matrix: Record<string, string[]>;
  inherited: Array<{ moduleKey: string; actionKey: string }>;
  granted: Array<{ moduleKey: string; actionKey: string }>;
  denied: Array<{ moduleKey: string; actionKey: string }>;
  roleNames: string[];
};

const ACTIONS: RbacAction[] = [
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

/**
 * Per-staff permission overrides UI.
 * Shows inherited role permissions + personal grant/deny overrides + effective result.
 */
export default function StaffUserPermissionsPanel({
  schoolId,
  userId,
  authUid,
  employeeId,
  email,
  designation,
  academicYear,
  onSaved,
}: {
  schoolId: string;
  userId?: string;
  authUid?: string | null;
  employeeId?: string | null;
  email?: string | null;
  designation?: string | null;
  academicYear?: string | null;
  onSaved?: () => void;
}) {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [assignedRoleId, setAssignedRoleId] = useState<string>("");
  const [resolvedUserId, setResolvedUserId] = useState<string>(userId ?? authUid ?? "");
  const [effective, setEffective] = useState<EffectivePayload | null>(null);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noPortalUser, setNoPortalUser] = useState(false);

  const overrideMap = useMemo(() => {
    const map = new Map<string, "grant" | "deny">();
    for (const ov of overrides) {
      map.set(`${ov.moduleKey}:${ov.actionKey}`, ov.effect);
    }
    return map;
  }, [overrides]);

  const inheritedSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of effective?.inherited ?? []) {
      set.add(`${p.moduleKey}:${p.actionKey}`);
    }
    return set;
  }, [effective]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoPortalUser(false);
    try {
      const params = new URLSearchParams({ schoolId });
      if (userId) params.set("userId", userId);
      else if (authUid) params.set("authUid", String(authUid).trim());
      if (employeeId) params.set("employeeId", String(employeeId).trim());
      if (email) params.set("email", String(email).trim());
      if (designation) params.set("designation", String(designation).trim());
      if (academicYear) params.set("academicYear", String(academicYear).trim());

      const [rolesRes, userRes] = await Promise.all([
        adminFetch(`/api/admin/rbac/roles?schoolId=${encodeURIComponent(schoolId)}`),
        adminFetch(`/api/admin/rbac/users?${params.toString()}`),
      ]);
      const rolesData = await rolesRes.json().catch(() => ({}));
      const userData = await userRes.json().catch(() => ({}));
      if (!rolesRes.ok) throw new Error(rolesData.error || "Failed to load roles");
      if (!userRes.ok) {
        if (userData.code === "NO_PORTAL_USER") {
          setNoPortalUser(true);
          setRoles(rolesData.roles ?? []);
          setResolvedUserId("");
          setEffective(null);
          setOverrides([]);
          setError(userData.message || userData.error || "No portal login linked");
          return;
        }
        throw new Error(userData.error || userData.message || "Failed to load user permissions");
      }

      const resolvedId = String(userData.user?.id ?? userId ?? authUid ?? "");
      setResolvedUserId(resolvedId);
      setRoles(rolesData.roles ?? []);
      const assigned = (userData.roles ?? [])[0];
      setAssignedRoleId(assigned?.id ?? "");
      setEffective(userData.effective ?? null);
      setOverrides(
        (userData.overrides ?? []).map(
          (o: { moduleKey: string; actionKey: string; effect: "grant" | "deny" }) => ({
            moduleKey: o.moduleKey,
            actionKey: o.actionKey,
            effect: o.effect,
          })
        )
      );

      // Auto-bind designation once if no role
      if (!assigned?.id && designation && resolvedId) {
        await adminFetch("/api/admin/rbac/users", {
          method: "POST",
          body: JSON.stringify({
            schoolId,
            userId: resolvedId,
            action: "bind_designation_role",
            designation,
          }),
        });
        const again = await adminFetch(
          `/api/admin/rbac/users?schoolId=${encodeURIComponent(schoolId)}&userId=${encodeURIComponent(resolvedId)}&designation=${encodeURIComponent(designation)}`
        );
        const againData = await again.json().catch(() => ({}));
        if (again.ok) {
          setAssignedRoleId((againData.roles ?? [])[0]?.id ?? "");
          setEffective(againData.effective ?? null);
          setOverrides(
            (againData.overrides ?? []).map(
              (o: { moduleKey: string; actionKey: string; effect: "grant" | "deny" }) => ({
                moduleKey: o.moduleKey,
                actionKey: o.actionKey,
                effect: o.effect,
              })
            )
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [schoolId, userId, authUid, employeeId, email, designation, academicYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const setCellOverride = (moduleKey: string, actionKey: string, next: "inherit" | "grant" | "deny") => {
    setOverrides((prev) => {
      const filtered = prev.filter(
        (o) => !(o.moduleKey === moduleKey && o.actionKey === actionKey)
      );
      if (next === "inherit") return filtered;
      return [...filtered, { moduleKey, actionKey, effect: next }];
    });
  };

  const saveRole = async () => {
    if (!assignedRoleId || !resolvedUserId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/rbac/users", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          userId: resolvedUserId,
          action: "assign_role",
          roleId: assignedRoleId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to assign role");
      setMessage("Role assigned");
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign role");
    } finally {
      setSaving(false);
    }
  };

  const saveOverrides = async () => {
    if (!resolvedUserId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/rbac/users", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          userId: resolvedUserId,
          action: "set_overrides_bulk",
          overrides,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save overrides");
      removeClientCache(clientCacheKey("rbac-effective", schoolId));
      removeClientCache(clientCacheKey("portal-permissions", schoolId));
      setMessage("Personal permissions saved");
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save overrides");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonMatrix rows={10} columns={ACTIONS.length} />;
  }

  if (noPortalUser) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#144835]" />
          <h3 className="text-base font-bold text-gray-900">Staff Permissions</h3>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">No portal login linked for this staff member yet.</p>
          <p className="mt-1 text-xs text-amber-800/90">
            Personal permission overrides need a portal account. Create login from{" "}
            <strong>Settings → Portal Users</strong>, or re-save the staff form with login enabled.
            {designation ? (
              <>
                {" "}
                Their designation is <strong>{designation}</strong> — once login exists, that role’s
                defaults will apply automatically.
              </>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={18} className="text-[#144835]" />
            Staff Permissions
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Inherited from role/designation
            {effective?.roleNames?.length ? ` (${effective.roleNames.join(", ")})` : ""}
            . Personal overrides apply only to this staff member.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void saveOverrides()}
          disabled={saving}
          className="h-9 px-3 rounded-lg bg-[#144835] text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save personal permissions
        </button>
      </div>

      {(error || message) && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold",
            error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"
          )}
        >
          {error || message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Assigned role
          </label>
          <select
            value={assignedRoleId}
            onChange={(e) => setAssignedRoleId(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-2 text-xs font-semibold"
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void saveRole()}
          disabled={!assignedRoleId || saving}
          className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
        >
          Apply role
        </button>
        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <Shield size={12} />
          {effective?.fullAccess
            ? "Full access"
            : `${Object.values(effective?.matrix ?? {}).flat().length} effective actions`}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wide text-gray-400 flex gap-4">
          <span>
            <span className="inline-block w-3 h-3 rounded bg-[#144835] align-middle mr-1" /> Effective
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded bg-amber-400 align-middle mr-1" /> Extra grant
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded bg-rose-400 align-middle mr-1" /> Extra deny
          </span>
          <span className="text-gray-500">Click cell: Inherit → Grant → Deny</span>
        </div>
        <div className="overflow-auto max-h-[560px]">
          <table className="w-full text-xs min-w-[720px]">
            <thead className="sticky top-0 bg-white border-b border-gray-100">
              <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                <th className="px-3 py-2 text-left">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-1 py-2 text-center capitalize">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC_MODULES.map((mod) => (
                <tr key={mod.key} className="border-b border-gray-50">
                  <td className="px-3 py-2 font-semibold text-gray-800">{mod.name}</td>
                  {ACTIONS.map((action) => {
                    const key = `${mod.key}:${action}`;
                    const ov = overrideMap.get(key);
                    const inherited = inheritedSet.has(key);
                    const effectiveOn = Boolean(effective?.matrix?.[mod.key]?.includes(action));
                    let cycle: "inherit" | "grant" | "deny" = "inherit";
                    if (ov === "grant") cycle = "grant";
                    else if (ov === "deny") cycle = "deny";

                    const next =
                      cycle === "inherit" ? "grant" : cycle === "grant" ? "deny" : "inherit";

                    return (
                      <td key={action} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          title={`Inherited: ${inherited ? "yes" : "no"} · Override: ${cycle} · Effective: ${effectiveOn ? "yes" : "no"}`}
                          onClick={() => setCellOverride(mod.key, action, next)}
                          className={cn(
                            "h-7 min-w-[2rem] px-1 rounded border text-[10px] font-bold",
                            ov === "grant" && "bg-amber-100 border-amber-300 text-amber-900",
                            ov === "deny" && "bg-rose-100 border-rose-300 text-rose-900",
                            !ov &&
                              effectiveOn &&
                              "bg-[#144835]/10 border-[#144835]/30 text-[#144835]",
                            !ov && !effectiveOn && "bg-white border-gray-200 text-gray-300"
                          )}
                        >
                          {ov === "grant" ? "+G" : ov === "deny" ? "−D" : effectiveOn ? "✓" : "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

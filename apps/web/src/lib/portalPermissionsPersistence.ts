import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import type { BranchPortalPermissions } from "@/lib/portalPermissionsStore";

export const PORTAL_PERMISSIONS_NOTICE_TITLE = "__portal_permissions__";

export async function loadBranchPortalPermissionsFromServer(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<BranchPortalPermissions> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return {};

  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", PORTAL_PERMISSIONS_NOTICE_TITLE)
    .maybeSingle();

  if (error || !data?.content) return {};

  try {
    const parsed = JSON.parse(String(data.content));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveBranchPortalPermissionsToServer(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  config: BranchPortalPermissions
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const content = JSON.stringify(config ?? {});

  const { data: existing, error: loadError } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", PORTAL_PERMISSIONS_NOTICE_TITLE)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title: PORTAL_PERMISSIONS_NOTICE_TITLE,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export const ANNOUNCEMENT_AUDIENCES = [
  { id: "all", label: "Everyone" },
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "staff", label: "All Staff" },
  { id: "parents", label: "Parents" },
] as const;

export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number]["id"];

export type BranchAnnouncementRecord = {
  id: string;
  title: string;
  content: string;
  target: AnnouncementAudience;
  postedOn: string;
  priority: "normal" | "important" | "urgent";
  category: string;
};

function parsePriorityAndCategory(content: string): {
  body: string;
  priority: "normal" | "important" | "urgent";
  category: string;
  extras: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.body != null) {
      const record = parsed as Record<string, unknown>;
      const priority = String(record.priority ?? "normal");
      const {
        body: _body,
        priority: _priority,
        category: _category,
        ...extras
      } = record;
      return {
        body: String(record.body ?? ""),
        priority:
          priority === "important" || priority === "urgent" ? priority : "normal",
        category: String(record.category ?? "General").trim() || "General",
        extras,
      };
    }
  } catch {
    // plain text content
  }
  return { body: content, priority: "normal", category: "General", extras: {} };
}

function encodeContent(payload: {
  body: string;
  priority: "normal" | "important" | "urgent";
  category: string;
  extras?: Record<string, unknown>;
}) {
  return JSON.stringify({
    ...(payload.extras ?? {}),
    body: payload.body,
    priority: payload.priority,
    category: payload.category,
  });
}

function normalizeTarget(target: string): AnnouncementAudience {
  const value = String(target ?? "all").trim().toLowerCase();
  if (
    value === "students" ||
    value === "teachers" ||
    value === "staff" ||
    value === "parents"
  ) {
    return value;
  }
  return "all";
}

export async function loadBranchAnnouncementsAdmin(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<BranchAnnouncementRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const { data, error } = await admin
    .from("notices")
    .select("id, title, content, posted_on, target")
    .eq("branch_id", branchId)
    .neq("target", "system")
    .order("posted_on", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => !String(row.title ?? "").startsWith("__"))
    .map((row) => {
      const parsed = parsePriorityAndCategory(String(row.content ?? ""));
      return {
        id: String(row.id),
        title: String(row.title ?? "Announcement").trim() || "Announcement",
        content: parsed.body,
        target: normalizeTarget(String(row.target ?? "all")),
        postedOn: String(row.posted_on ?? ""),
        priority: parsed.priority,
        category: parsed.category,
      };
    });
}

export async function saveBranchAnnouncement(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: {
    id?: string;
    title: string;
    content: string;
    target?: AnnouncementAudience;
    postedOn?: string;
    priority?: "normal" | "important" | "urgent";
    category?: string;
  }
): Promise<BranchAnnouncementRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const title = String(payload.title ?? "").trim();
  const content = String(payload.content ?? "").trim();
  if (!title) throw new Error("Title is required");
  if (!content) throw new Error("Message is required");

  let preservedExtras: Record<string, unknown> = {};
  let existingTarget: string | null = null;
  if (payload.id) {
    const { data: existing } = await admin
      .from("notices")
      .select("content, target")
      .eq("id", payload.id)
      .eq("branch_id", branchId)
      .maybeSingle();
    if (existing?.content) {
      preservedExtras = parsePriorityAndCategory(String(existing.content)).extras;
    }
    existingTarget = existing?.target ? String(existing.target) : null;
  }

  // Keep class-scoped targets (class:GRADE__SECTION) intact when admin edits body/priority.
  const nextTarget =
    existingTarget && existingTarget.startsWith("class:")
      ? existingTarget
      : normalizeTarget(String(payload.target ?? existingTarget ?? "all"));

  const row = {
    branch_id: branchId,
    title,
    content: encodeContent({
      body: content,
      priority: payload.priority ?? "normal",
      category: String(payload.category ?? "General").trim() || "General",
      extras: preservedExtras,
    }),
    target: nextTarget,
    posted_on: String(payload.postedOn ?? new Date().toISOString().slice(0, 10)),
  };

  if (payload.id) {
    const { data, error } = await admin
      .from("notices")
      .update(row)
      .eq("id", payload.id)
      .eq("branch_id", branchId)
      .select("id, title, content, posted_on, target")
      .single();
    if (error) throw new Error(error.message);
    const parsed = parsePriorityAndCategory(String(data.content ?? ""));
    return {
      id: String(data.id),
      title: String(data.title ?? title),
      content: parsed.body,
      target: normalizeTarget(String(data.target ?? "all")),
      postedOn: String(data.posted_on ?? ""),
      priority: parsed.priority,
      category: parsed.category,
    };
  }

  const { data, error } = await admin
    .from("notices")
    .insert(row)
    .select("id, title, content, posted_on, target")
    .single();
  if (error) throw new Error(error.message);

  const parsed = parsePriorityAndCategory(String(data.content ?? ""));
  return {
    id: String(data.id),
    title: String(data.title ?? title),
    content: parsed.body,
    target: normalizeTarget(String(data.target ?? "all")),
    postedOn: String(data.posted_on ?? ""),
    priority: parsed.priority,
    category: parsed.category,
  };
}

export async function deleteBranchAnnouncement(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  announcementId: string
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const { error } = await admin
    .from("notices")
    .delete()
    .eq("id", announcementId)
    .eq("branch_id", branchId);

  if (error) throw new Error(error.message);
}

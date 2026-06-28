import type { SupabaseClient } from "@supabase/supabase-js";

/** Canonical school slugs used in /schools/{slug}/ routes */
export const BRANCH_SLUGS = {
  idpscherukupalli: "idpscherukupalli",
  idpskalaburagi: "idpskalaburagi",
} as const;

export type BranchSlug = (typeof BRANCH_SLUGS)[keyof typeof BRANCH_SLUGS];

export const BRANCH_SLUG_MAP_NOTICE_TITLE = "__branch_slug_map__";

const SLUG_TO_BRANCH_PATTERN: Record<string, string> = {
  idpscherukupalli: "%cherukupalli%",
  idpskalaburagi: "%kalaburagi%",
};

/** Normalize route param / legacy aliases to canonical branch slug */
export function normalizeBranchSlug(schoolSlug: string): string | null {
  const slug = schoolSlug.trim().toLowerCase();
  if (slug.includes("cherukupalli")) return BRANCH_SLUGS.idpscherukupalli;
  if (slug.includes("kalaburagi")) return BRANCH_SLUGS.idpskalaburagi;
  return null;
}

export function branchPatternFromSlug(schoolSlug: string): string | null {
  const normalized = normalizeBranchSlug(schoolSlug);
  if (!normalized) return null;
  return SLUG_TO_BRANCH_PATTERN[normalized];
}

async function loadBranchSlugMap(
  client: SupabaseClient<any>
): Promise<Record<string, string>> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("title", BRANCH_SLUG_MAP_NOTICE_TITLE)
    .limit(1)
    .maybeSingle();

  if (error?.code === "PGRST205") return {};
  if (error || !data?.content) return {};

  try {
    const parsed = JSON.parse(String(data.content));
    if (!parsed || typeof parsed !== "object") return {};
    const map: Record<string, string> = {};
    for (const [slug, id] of Object.entries(parsed)) {
      if (typeof id === "string" && id.trim()) map[slug] = id.trim();
    }
    return map;
  } catch {
    return {};
  }
}

export async function saveBranchSlugMap(
  client: SupabaseClient<any>,
  map: Record<string, string>
): Promise<void> {
  const content = JSON.stringify(map);
  const hostBranchId = map[BRANCH_SLUGS.idpscherukupalli] ?? Object.values(map)[0];
  if (!hostBranchId) throw new Error("No branch IDs in slug map");

  const { data: existing, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("title", BRANCH_SLUG_MAP_NOTICE_TITLE)
    .eq("branch_id", hostBranchId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await client.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("notices").insert({
    branch_id: hostBranchId,
    title: BRANCH_SLUG_MAP_NOTICE_TITLE,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}

async function resolveByNamePattern(
  client: SupabaseClient<any>,
  slug: string
): Promise<string | null> {
  const pattern = branchPatternFromSlug(slug);
  if (!pattern) return null;

  const { data, error } = await client
    .from("branches")
    .select("id")
    .ilike("name", pattern)
    .maybeSingle();

  if (error?.code === "PGRST205") return null;
  if (error) {
    console.error("resolveBranchUuid (name):", error.message);
    return null;
  }

  return data?.id ?? null;
}

export async function resolveBranchUuid(
  client: SupabaseClient<any>,
  schoolSlug: string
): Promise<string | null> {
  const slug = normalizeBranchSlug(schoolSlug);
  if (!slug) return null;

  const slugMap = await loadBranchSlugMap(client);
  if (slugMap[slug]) return slugMap[slug];

  const { data: bySlug, error: slugError } = await client
    .from("branches")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugError?.code === "42703") {
    // slug column not migrated yet
  } else if (slugError && slugError.code !== "PGRST205") {
    console.error("resolveBranchUuid (slug):", slugError.message);
    return null;
  } else if (bySlug?.id) {
    return bySlug.id;
  }

  return resolveByNamePattern(client, slug);
}

export async function resolveBranchSlug(
  client: SupabaseClient<any>,
  branchId: string
): Promise<string | null> {
  const slugMap = await loadBranchSlugMap(client);
  for (const [slug, id] of Object.entries(slugMap)) {
    if (id === branchId) return slug;
  }

  const { data, error } = await client
    .from("branches")
    .select("slug, name")
    .eq("id", branchId)
    .maybeSingle();

  if (error?.code === "PGRST205") return null;
  if (error) return null;

  if (data?.slug) return String(data.slug);
  const name = String(data?.name ?? "").toLowerCase();
  if (name.includes("cherukupalli")) return BRANCH_SLUGS.idpscherukupalli;
  if (name.includes("kalaburagi")) return BRANCH_SLUGS.idpskalaburagi;
  return null;
}

export async function ensureBranchSlugMappings(
  client: SupabaseClient<any>
): Promise<Record<string, string>> {
  const mappings: Record<string, string> = {};
  for (const slug of Object.values(BRANCH_SLUGS)) {
    const id = await resolveByNamePattern(client, slug);
    if (id) mappings[slug] = id;
  }
  if (Object.keys(mappings).length > 0) {
    await saveBranchSlugMap(client, mappings);
  }
  return mappings;
}

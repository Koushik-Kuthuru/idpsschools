/** @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient */

export const BRANCH_SLUGS = {
  idpscherukupalli: "idpscherukupalli",
  idpskalaburagi: "idpskalaburagi",
};

const SLUG_MAP_NOTICE = "__branch_slug_map__";

export function normalizeBranchSlug(schoolSlug) {
  const slug = String(schoolSlug ?? "").trim().toLowerCase();
  if (slug.includes("cherukupalli")) return BRANCH_SLUGS.idpscherukupalli;
  if (slug.includes("kalaburagi")) return BRANCH_SLUGS.idpskalaburagi;
  return null;
}

async function loadSlugMap(supabase) {
  const { data } = await supabase
    .from("notices")
    .select("content")
    .eq("title", SLUG_MAP_NOTICE)
    .limit(1)
    .maybeSingle();

  if (!data?.content) return {};
  try {
    return JSON.parse(String(data.content));
  } catch {
    return {};
  }
}

async function resolveByName(supabase, slug) {
  const pattern = slug === BRANCH_SLUGS.idpscherukupalli ? "%cherukupalli%" : "%kalaburagi%";
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, slug")
    .ilike("name", pattern)
    .maybeSingle();

  if (error) throw new Error(`Failed to load branch: ${error.message}`);
  return data;
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} schoolSlug
 */
export async function resolveBranchId(supabase, schoolSlug = BRANCH_SLUGS.idpscherukupalli) {
  const slug = normalizeBranchSlug(schoolSlug);
  if (!slug) throw new Error(`Unknown branch slug: ${schoolSlug}`);

  const map = await loadSlugMap(supabase);
  if (map[slug]) return map[slug];

  const { data: bySlug, error: slugError } = await supabase
    .from("branches")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!slugError && bySlug?.id) return bySlug.id;

  const branch = await resolveByName(supabase, slug);
  if (!branch?.id) throw new Error(`Branch not found for slug: ${slug}`);
  return branch.id;
}

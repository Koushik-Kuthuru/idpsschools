import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const SCHOOL_CODE_TO_SLUG: Record<string, string> = {
  'IDPS-CHER': 'idpscherukupalli',
  'IDPS-KALA': 'idpskalaburagi',
}

export function getSchoolCodeFromSlug(slug: string): string | null {
  if (slug.includes('cherukupalli')) return 'IDPS-CHER'
  if (slug.includes('kalaburagi')) return 'IDPS-KALA'
  return null
}

export function getSchoolSlugFromCode(code: string): string | null {
  return SCHOOL_CODE_TO_SLUG[code] ?? null
}

export async function getSchoolUuidFromSlug(slug: string): Promise<string | null> {
  const code = getSchoolCodeFromSlug(slug);
  if (!code) return null;
  const { data, error } = await supabase.from("schools").select("id").eq("code", code).maybeSingle();
  if (error?.code === "PGRST205") return null;
  return data?.id ?? null;
}

import { resolveBranchUuid as resolveBranchUuidFromLib } from "@/lib/resolveBranchUuid";

export async function getBranchUuidFromSlug(slug: string): Promise<string | null> {
  return resolveBranchUuidFromLib(supabase, slug);
}

export async function getSchoolSlugFromUuid(uuid: string): Promise<string | null> {
  const { data } = await supabase.from('schools').select('code').eq('id', uuid).single();
  if (!data?.code) return null;
  return getSchoolSlugFromCode(data.code);
}

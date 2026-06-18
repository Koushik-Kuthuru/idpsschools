import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://knvlfvirhcdihcuzioop.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_5l_GGturSgLYknzpWlhZxA_zbcEHTmT'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getSchoolUuidFromSlug(slug: string): Promise<string | null> {
    const code = slug.includes('cherukupalli') ? 'IDPS-CHER' : slug.includes('kalaburagi') ? 'IDPS-KALA' : null;
    if (!code) return null;
    const { data } = await supabase.from('schools').select('id').eq('code', code).single();
    return data?.id || null;
}

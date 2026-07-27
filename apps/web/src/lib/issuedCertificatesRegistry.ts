import type { SupabaseClient } from "@supabase/supabase-js";

export const ISSUED_CERTIFICATES_PREFIX = "__issued_certificates__:";

export type IssuedCertificateRow = {
  kind: string;
  certNo: string;
  admissionNo: string;
  studentName?: string;
  fatherName?: string;
  classLabel?: string;
  issuedOn?: string;
  sourceFile?: string;
};

export type IssuedCertificatesRegistry = {
  academicYear: string;
  sourceDir?: string;
  count?: number;
  seededAt?: string;
  certificates: IssuedCertificateRow[];
};

export async function loadIssuedCertificatesRegistry(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<IssuedCertificatesRegistry | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", `${ISSUED_CERTIFICATES_PREFIX}${academicYear}`)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;
  try {
    const parsed = JSON.parse(String(data.content)) as IssuedCertificatesRegistry;
    if (!Array.isArray(parsed.certificates)) return null;
    return parsed;
  } catch {
    return null;
  }
}

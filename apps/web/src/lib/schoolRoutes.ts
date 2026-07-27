/** Canonical school slugs used in App Router paths. */
export const SCHOOL_SLUGS = ["idpscherukupalli", "idpskalaburagi"] as const;
export type SchoolSlug = (typeof SCHOOL_SLUGS)[number];

export function isSchoolSlug(value: string | null | undefined): value is SchoolSlug {
  return SCHOOL_SLUGS.includes(String(value ?? "") as SchoolSlug);
}

export function schoolBasePath(schoolId: string, portal: string = "admin"): string {
  return `/schools/${schoolId}/${portal}`;
}

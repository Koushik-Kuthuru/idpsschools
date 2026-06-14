export type SchoolBranch = {
  id: string;
  name: string;
  city: string;
  slug: string;
};

export const SCHOOL_BRANCHES: SchoolBranch[] = [
  { id: "idpscherukupalli", name: "IDPS Cherukupalli", city: "Cherukupalli", slug: "idpscherukupalli" },
  { id: "idpskalaburagi", name: "IDPS Kalaburagi", city: "Kalaburagi", slug: "idpskalaburagi" },
];

export const VALID_SCHOOL_IDS = new Set(SCHOOL_BRANCHES.map((b) => b.id));

export function isValidSchoolId(schoolId: string | null | undefined): boolean {
  return Boolean(schoolId && VALID_SCHOOL_IDS.has(schoolId));
}

export function getSchoolBranch(schoolId: string): SchoolBranch | undefined {
  return SCHOOL_BRANCHES.find((b) => b.id === schoolId);
}

/** Build a path under /schools/{schoolId}/… */
export function schoolPath(schoolId: string, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join("/");
  return tail ? `/schools/${schoolId}/${tail}` : `/schools/${schoolId}`;
}

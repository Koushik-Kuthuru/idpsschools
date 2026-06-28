const STORAGE_PREFIX = "academicYear:";

export const ACADEMIC_YEAR_CHANGED_EVENT = "academicYearChanged";

export type AcademicYearChangedDetail = {
  schoolSlug: string;
  yearName: string;
};

export function setActiveAcademicYear(schoolSlug: string, yearName: string) {
  if (typeof window === "undefined" || !schoolSlug || !yearName) return;
  const key = `${STORAGE_PREFIX}${schoolSlug}`;
  const previous = sessionStorage.getItem(key);
  sessionStorage.setItem(key, yearName);
  if (previous === yearName) return;
  window.dispatchEvent(
    new CustomEvent<AcademicYearChangedDetail>(ACADEMIC_YEAR_CHANGED_EVENT, {
      detail: { schoolSlug, yearName },
    })
  );
}

export function getActiveAcademicYear(schoolSlug: string): string | null {
  if (typeof window === "undefined" || !schoolSlug) return null;
  return sessionStorage.getItem(`${STORAGE_PREFIX}${schoolSlug}`);
}

/** `buildPath(db, "schools", slug, "students")` → slug */
export function schoolSlugFromCollectionPath(collectionPath: string[]): string | null {
  if (collectionPath.length === 3 && collectionPath[0] === "schools") {
    return collectionPath[1] || null;
  }
  return null;
}

/** Strip year suffix from stored admission numbers (e.g. 425#2023-24 → 425). */
export function displayAdmissionNo(stored: string | null | undefined): string {
  const text = String(stored ?? "").trim();
  const hash = text.indexOf("#");
  return hash === -1 ? text : text.slice(0, hash);
}

export function baseAdmissionNo(stored: string | null | undefined): string {
  return displayAdmissionNo(stored);
}

export function scopedAdmissionNo(rawAdmissionNo: string, academicYear: string): string {
  const base = String(rawAdmissionNo ?? "").trim();
  if (!base || base.includes("#")) return base;
  return `${base}#${academicYear}`;
}

export function yearFromScopedAdmissionNo(admissionNo: string | null | undefined): string | null {
  const id = String(admissionNo ?? "");
  const hash = id.indexOf("#");
  if (hash === -1) return null;
  return id.slice(hash + 1);
}

export function admissionNoMatchesYear(admissionNo: string | null | undefined, academicYear: string): boolean {
  const id = String(admissionNo ?? "");
  if (academicYear === "2022-23") return !id.includes("#");
  return id.endsWith(`#${academicYear}`);
}

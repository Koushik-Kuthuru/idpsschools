export async function fetchBranchStaffByIdViaApi(
  schoolSlug: string,
  staffId: string,
  academicYear: string | null,
  kind?: "teaching" | "non_teaching"
): Promise<Record<string, unknown> | null> {
  try {
    const params = new URLSearchParams({ schoolId: schoolSlug });
    if (academicYear) params.set("academicYear", academicYear);
    if (kind) params.set("kind", kind);

    const res = await fetch(`/api/admin/staff/${encodeURIComponent(staffId)}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;

    const staff = (data.staff ?? null) as Record<string, unknown> | null;
    const profile = (data.profile ?? {}) as Record<string, unknown>;
    if (!staff) return null;

    const { years, password, portalPassword: yearPortalPassword, ...profileRoot } = profile;
    const qualification = staff.qualification ?? profileRoot.qualification;
    const qualifications = Array.isArray(staff.qualifications)
      ? staff.qualifications
      : qualification
        ? [String(qualification)]
        : [];

    return {
      ...profileRoot,
      ...staff,
      years,
      qualification,
      qualifications,
      employmentType:
        staff.employmentType ??
        profileRoot.employmentStatus ??
        profileRoot.employmentType ??
        "Full-Time",
      staffKind: data.staffKind,
    };
  } catch {
    return null;
  }
}

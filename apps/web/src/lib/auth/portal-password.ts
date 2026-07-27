/** Supabase Auth enforces a 6-character minimum; portal passwords may be shorter. */
export function normalizePortalAuthPassword(password: string): string {
  const trimmed = String(password ?? "").trim();
  if (trimmed.length >= 6) return trimmed;
  return trimmed.padEnd(6, "0");
}

export function portalAuthPasswordCandidates(password: string): string[] {
  const trimmed = String(password ?? "").trim();
  if (!trimmed) return [];
  const normalized = normalizePortalAuthPassword(trimmed);
  const compact = trimmed.replace(/\s+/g, "");
  const values = new Set<string>([trimmed, normalized]);
  if (compact && compact !== trimmed) {
    values.add(compact);
    values.add(normalizePortalAuthPassword(compact));
  }
  return [...values];
}

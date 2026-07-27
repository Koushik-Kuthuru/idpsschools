/** Shared portal identifier helpers — safe for client and server bundles. */

export function normalizePortalIdentifier(raw: string): string {
  return String(raw ?? "").trim();
}

/**
 * True when the identifier looks like a staff username / employee id
 * (not a numeric admission number or email).
 */
export function looksLikeStaffIdentifier(raw: string): boolean {
  const text = normalizePortalIdentifier(raw);
  if (!text || text.includes("@")) return false;
  return /[a-z]/i.test(text) && /^[a-z0-9._-]+$/i.test(text);
}

/**
 * Build lookup variants for an identifier.
 * Only treat digit-stripped forms as variants when the whole identifier is numeric
 * (admission numbers). Usernames like "k0ush9k" must NOT expand to "09".
 *
 * Also expand common OCR / keyboard confusions: O↔0 and I↔1 for mixed alphanumeric
 * staff usernames (e.g. typed "kOush9k" should still match "k0ush9k").
 */
export function identifierVariants(raw: string): string[] {
  const text = normalizePortalIdentifier(raw);
  if (!text) return [];
  const lower = text.toLowerCase();
  const variants = new Set<string>([text, lower, text.toUpperCase()]);
  if (/^\d+$/.test(text)) {
    variants.add(text.replace(/^0+/, "") || text);
  }
  if (lower.startsWith("std_")) variants.add(lower.slice(4));

  // Ambiguous glyph swaps for staff-style usernames (letters + digits).
  if (/[a-z]/i.test(text) && /\d/.test(text) && /^[a-z0-9._-]+$/i.test(text)) {
    variants.add(lower.replace(/o/g, "0"));
    variants.add(lower.replace(/0/g, "o"));
    variants.add(lower.replace(/i/g, "1"));
    variants.add(lower.replace(/1/g, "i"));
    variants.add(lower.replace(/o/g, "0").replace(/i/g, "1"));
    variants.add(lower.replace(/0/g, "o").replace(/1/g, "i"));
  }

  return [...variants].filter(Boolean);
}

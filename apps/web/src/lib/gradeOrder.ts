/**
 * Standard Indian school grade order:
 * Nursery → PP1 (LKG) → PP2 (UKG) → I … XII
 */

const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

const ROMAN_PATTERN = /^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i;

const STREAM_GROUP_PATTERN = /\b(MPC|BIPC|BIOPC|MBIPC|CEC|NDA)\b/i;

/** XI (MPC), XI + NDA, etc. — distinct from plain XI for fee/class lists. */
export function isStreamOrCompositeGrade(raw: string): boolean {
  const label = String(raw ?? "").trim();
  if (!label) return false;

  if (STREAM_GROUP_PATTERN.test(label)) return true;

  const upper = label.toUpperCase();
  if (/^XI\b/.test(upper) && /\+/.test(label)) return true;
  if (/^XII\b/.test(upper) && /\+/.test(label)) return true;
  if (/^XI\s*\(/i.test(label)) return true;
  if (/^XII\s*\(/i.test(label)) return true;

  return false;
}

/** Stable identity for deduping class grades (aliases merge; streams stay separate). */
export function gradeIdentityKey(raw: string): string {
  const label = String(raw ?? "").trim();
  if (!label) return "";

  if (isStreamOrCompositeGrade(label)) {
    return `stream:${label.toUpperCase().replace(/\s+/g, " ").trim()}`;
  }

  return `std:${gradeSortKey(label)}`;
}

export function gradesMatchForClass(a: string, b: string): boolean {
  return gradeIdentityKey(a) === gradeIdentityKey(b);
}

/** Document / storage id for a class grade label. */
export function gradeDocId(grade: string): string {
  return grade
    .trim()
    .replaceAll("/", "-")
    .replace(/\s+/g, "-")
    .replace(/\+/g, "-plus-");
}

/** Lower number = earlier in school progression. */
export function gradeSortKey(raw: string): number {
  const label = String(raw ?? "").trim();
  if (!label) return 9999;

  const upper = label.toUpperCase();

  if (/^NURSERY\b/.test(upper) || upper === "NURSERY") return 0;

  if (/^PP\s*1\b|^PP1\b/.test(upper) || /\bLKG\b/.test(upper) || upper.startsWith("PP1")) return 1;

  if (/^PP\s*2\b|^PP2\b/.test(upper) || /\bUKG\b/.test(upper) || upper.startsWith("PP2")) return 2;

  const roman = label.match(ROMAN_PATTERN);
  if (roman) {
    const n = ROMAN_VALUES[roman[1].toUpperCase()];
    if (n) return 2 + n;
  }

  const arabic = label.match(/^(?:GRADE\s*)?(\d{1,2})\b/i);
  if (arabic) {
    const n = parseInt(arabic[1], 10);
    if (n >= 1 && n <= 12) return 2 + n;
  }

  return 9000;
}

export function compareGrades(a: string, b: string): number {
  const diff = gradeSortKey(a) - gradeSortKey(b);
  if (diff !== 0) return diff;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

export function sortGrades(grades: string[]): string[] {
  return [...grades].sort(compareGrades);
}

export function gradeDisplayLabel(raw: string): string {
  const label = String(raw ?? "").trim();
  if (!label) return "Unknown";

  if (isStreamOrCompositeGrade(label)) {
    return label;
  }

  const key = gradeSortKey(label);
  if (key === 0) return "Nursery";
  if (key === 1) return "PP1 (LKG)";
  if (key === 2) return "PP2 (UKG)";

  const roman = label.match(ROMAN_PATTERN);
  if (roman) return roman[1].toUpperCase();

  const arabic = label.match(/^(?:GRADE\s*)?(\d{1,2})\b/i);
  if (arabic) {
    const n = parseInt(arabic[1], 10);
    const romans = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return romans[n] ?? label;
  }

  return label;
}

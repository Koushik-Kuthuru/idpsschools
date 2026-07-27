/** CBSE 9-point grade labels used across marks feeding / import. */
export const CBSE_GRADES = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"] as const;
export type CbseGrade = (typeof CBSE_GRADES)[number];

/**
 * Resolve a CBSE grade from obtained marks as a % of maxMarks.
 * Bands: A1 ≥91, A2 ≥81, B1 ≥71, B2 ≥61, C1 ≥51, C2 ≥41, D ≥33, else E.
 */
export function gradeForMarks(marks: number | "", maxMarks = 100): CbseGrade | "-" {
  if (marks === "" || !Number.isFinite(marks)) return "-";
  const max = maxMarks > 0 ? maxMarks : 100;
  const pct = (Number(marks) / max) * 100;
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 33) return "D";
  return "E";
}

export function gradeTone(grade: string) {
  switch (grade) {
    case "A1":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "A2":
      return "bg-green-100 text-green-800 border-green-200";
    case "B1":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "B2":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "C1":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "C2":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "D":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "E":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function gradeBarTone(grade: string) {
  switch (grade) {
    case "A1":
      return "bg-emerald-500";
    case "A2":
      return "bg-green-500";
    case "B1":
      return "bg-sky-500";
    case "B2":
      return "bg-blue-500";
    case "C1":
      return "bg-amber-500";
    case "C2":
      return "bg-yellow-500";
    case "D":
      return "bg-orange-500";
    case "E":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

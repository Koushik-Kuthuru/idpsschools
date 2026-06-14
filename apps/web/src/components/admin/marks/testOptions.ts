export type TestCategory = "class_test" | "examination";

const CLASS_TEST_STANDARD = [
  "UT1",
  "UT2",
  "UT3",
  "UT4",
  "Weekly Test",
  "Chapter Test",
  "Monthly Test",
] as const;

const CLASS_TEST_PRIMARY = [
  "Unit Test 1",
  "Unit Test 2",
  "Term Test",
  "Weekly Test",
] as const;

const EXAMINATION_STANDARD = [
  "Quarterly Exam",
  "Half Yearly",
  "Annual Exam",
  "Pre-Final",
  "Final Exam",
] as const;

const EXAMINATION_PRIMARY = [
  "Term Exam",
  "Annual Exam",
] as const;

function isPrimaryGrade(grade: string) {
  const g = grade.trim().toLowerCase();
  if (["nursery", "lkg", "ukg", "kg"].includes(g)) return true;
  const num = parseInt(grade, 10);
  return !isNaN(num) && num >= 1 && num <= 5;
}

export function getTestOptionsForClass(category: TestCategory, grade: string): string[] {
  const primary = isPrimaryGrade(grade);
  if (category === "class_test") {
    return [...(primary ? CLASS_TEST_PRIMARY : CLASS_TEST_STANDARD)];
  }
  return [...(primary ? EXAMINATION_PRIMARY : EXAMINATION_STANDARD)];
}

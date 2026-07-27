export function formatAcademicTermLine(date = new Date()): string {
  const formatted = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const month = date.getMonth();
  const term = month < 4 ? "Term 1" : month < 8 ? "Term 2" : "Term 3";
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + yearStart.getDay() + 1) / 7,
  );
  return `${formatted} • ${term} — Week ${week}`;
}

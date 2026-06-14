import seed from "./seed.json";

export type EventType = "academic" | "exam" | "holiday" | "event" | "meeting";

export type SeedEvent = {
  date: string;
  title: string;
  type: EventType;
};

export type OnLeave = {
  initials: string;
  name: string;
  reason: string;
};

export type SectionRow = {
  section: string;
  strength: number;
  teacherCount: number;
  teacherInitials?: string[];
  status: "Active" | "Inactive";
  room?: string;
};

export type GradeGroup = {
  grade: string;
  sections: SectionRow[];
};

export type TimetableSlot = {
  subject: string;
  room: string;
  accent: "emerald" | "blue" | "orange" | "purple";
};

export type Timetable = Record<string, Record<string, TimetableSlot>>;

export const seedBranch = seed.seedBranch;
export const seedCounts = seed.seedCounts;
export const seedAttendance = seed.seedAttendance;
export const seedFinance = seed.seedFinance;
export const gradeCatalog = (seed as any).gradeCatalog as string[] | undefined;
export const seedStaffAvailability = seed.seedStaffAvailability as { present: number; total: number; onLeaveToday: OnLeave[] };
export const seedApprovals = seed.seedApprovals as Array<{ count: number; label: string; note: string; href: string; iconKey: "users" | "wallet" | "grad" }>;
export const seedActivities = seed.seedActivities as Array<{ text: string; href: string; time: string }>;
export const seedEvents = seed.seedEvents as SeedEvent[];
export const seedKpiDeltas = seed.seedKpiDeltas;
export const academicClasses = seed.academicClasses as GradeGroup[];
export const seedTimetable = seed.seedTimetable as Timetable;
export const adminStudents = seed.adminStudents;

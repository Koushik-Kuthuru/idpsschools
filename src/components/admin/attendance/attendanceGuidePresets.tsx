import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  GraduationCap,
  LayoutGrid,
  List,
  Pencil,
  Save,
  Search,
  Users,
} from "lucide-react";
import type { AttendanceGuideChip, AttendanceGuideStep } from "./AttendanceTabGuide";

const dateStep: AttendanceGuideStep = {
  icon: CalendarDays,
  label: "Date",
  hint: "Pick the day",
  color: "bg-amber-50 text-amber-600 border-amber-100",
};

const classStep: AttendanceGuideStep = {
  icon: GraduationCap,
  label: "Class",
  hint: "Pick a grade",
  color: "bg-blue-50 text-blue-600 border-blue-100",
};

const sectionStep: AttendanceGuideStep = {
  icon: LayoutGrid,
  label: "Section",
  hint: "Pick A, B, C…",
  color: "bg-violet-50 text-violet-600 border-violet-100",
};

const submitStep = (hint = "Load records"): AttendanceGuideStep => ({
  icon: Search,
  label: "Submit",
  hint,
  color: "bg-[#144835]/10 text-[#144835] border-[#144835]/15",
});

export const markGuide = {
  icon: CheckCircle2,
  title: "How to mark attendance",
  subtitle: "Choose a class and section, then mark Present or Absent and save.",
  steps: [
    dateStep,
    classStep,
    sectionStep,
    { icon: Save, label: "Save", hint: "Store marks", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  ],
  chips: [
    { icon: CheckCircle2, label: "Present / Absent" },
    { icon: Users, label: "Bulk select" },
    { icon: Save, label: "Save when done" },
  ],
};

export const viewGuide = {
  icon: Search,
  title: "How to view attendance",
  subtitle: "Use the filters above, then press Submit to load the list or graph.",
  steps: [classStep, sectionStep, { ...dateStep, hint: "From → To range" }, submitStep()],
  chips: [
    { icon: ClipboardList, label: "List view" },
    { icon: BarChart3, label: "Graph view" },
    { icon: Download, label: "Export after load" },
  ],
};

export const updateGuide = {
  icon: Pencil,
  title: "How to update attendance",
  subtitle: "Fetch a past day's roster, fix marks, then save updates.",
  steps: [dateStep, classStep, sectionStep, submitStep("Fetch roster")],
  chips: [
    { icon: Pencil, label: "P / A / Clear" },
    { icon: Save, label: "Save updates" },
  ],
};

export const absentLogGuide = {
  icon: ClipboardList,
  title: "How to use absent log",
  subtitle: "Pick a date and class, then generate the attendance log for that day.",
  steps: [
    { ...dateStep, label: "Date", hint: "Select day" },
    classStep,
    sectionStep,
    submitStep("Generate log"),
  ],
  chips: [{ icon: Download, label: "Export PDF / Excel" }],
};

export const datewiseGuide = {
  icon: BarChart3,
  title: "Datewise absent summary",
  subtitle: "Pick a date range and generate daily absent counts for the school.",
  steps: [
    { ...dateStep, label: "From", hint: "Start date" },
    { icon: CalendarDays, label: "To", hint: "End date", color: "bg-orange-50 text-orange-600 border-orange-100" },
    submitStep("Generate summary"),
  ],
  chips: [{ icon: Download, label: "Export PDF / Excel" }],
};

export const continuousGuide = {
  icon: Users,
  title: "Continuous absent summary",
  subtitle: "Find students absent for several days in a row from today backward.",
  steps: [
    {
      icon: CalendarDays,
      label: "Min days",
      hint: "e.g. 3+ days",
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
    classStep,
    sectionStep,
    submitStep("Generate list"),
  ],
  chips: [{ icon: Download, label: "Export PDF / Excel" }],
};

export const registerGuide = {
  icon: ClipboardList,
  title: "Attendance register",
  subtitle: "Open the monthly P/A grid for one class after you submit.",
  steps: [
    classStep,
    sectionStep,
    {
      icon: CalendarDays,
      label: "Month",
      hint: "Pick month",
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    submitStep("Open register"),
  ],
  chips: [
    { icon: CheckCircle2, label: "P = Present" },
    { icon: Users, label: "A = Absent" },
  ],
};

export const classwiseGuide = {
  icon: Users,
  title: "Classwise status",
  subtitle: "Pick a date and check present / absent counts for every class.",
  steps: [dateStep, submitStep("Check status")],
  chips: [
    { icon: BarChart3, label: "Card view" },
    { icon: List, label: "List view" },
  ],
};

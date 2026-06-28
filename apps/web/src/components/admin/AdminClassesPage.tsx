"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchClasses } from "@/hooks/useBranchClasses";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import AdminPageHeader from "@/components/admin/PageHeader";
import TableRowActions from "@/components/ui/TableRowActions";
import { useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { gradeDisplayLabel, sortGrades } from "@/lib/gradeOrder";
import {
  BarChart3,
  ClipboardList,
  MapPin,
  Plus,
  RefreshCw,
  TriangleAlert,
  Users,
  Pencil,
  Search,
  BookOpen,
  LayoutGrid,
  TrendingUp,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SectionRow = {
  id: string;
  section: string;
  strength: number;
  teacherCount: number;
  teacherInitials?: string[];
  status: "Active" | "Inactive";
  room?: string;
};

type GradeGroup = {
  grade: string;
  sections: SectionRow[];
};

function strengthColor(strength: number) {
  if (strength > 50) return "bg-red-500";
  if (strength > 45) return "bg-amber-500";
  return "bg-emerald-500";
}

function strengthText(strength: number) {
  if (strength > 50) return "text-red-700";
  if (strength > 45) return "text-amber-700";
  return "text-emerald-700";
}

function strengthBg(strength: number) {
  if (strength > 50) return "bg-red-50";
  if (strength > 45) return "bg-amber-50";
  return "bg-emerald-50";
}

export default function AdminClassesPage() {
  const schoolId = useSchoolId();
  const { currentYear, loading: yearLoading } = useAcademicYear();
  const { classes: branchClasses, loading, error: loadError, refresh } = useBranchClasses(
    schoolId,
    currentYear?.name
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [formGrade, setFormGrade] = useState("Nursery");
  const [formSection, setFormSection] = useState("A");
  const [formRoom, setFormRoom] = useState("");
  const [formStrength, setFormStrength] = useState<number>(0);
  const [formTeacherCount, setFormTeacherCount] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = (loading && branchClasses.length === 0) || (yearLoading && !currentYear);

  const gradeLabel = (g: string) => gradeDisplayLabel(g);

  const gradeCatalog = useMemo(
    () => sortGrades([...new Set(branchClasses.map((c) => c.grade))]),
    [branchClasses]
  );

  const classes = useMemo((): GradeGroup[] => {
    const classMap: Record<string, SectionRow[]> = {};

    branchClasses.forEach((e) => {
      if (!classMap[e.grade]) classMap[e.grade] = [];
      classMap[e.grade].push({
        id: e.id,
        section: e.section,
        strength: e.strength,
        teacherCount: e.classTeacherId ? 1 : 0,
        status: e.status,
        room: "TBD",
      });
    });

    return sortGrades(Object.keys(classMap)).map((grade) => ({
      grade,
      sections: classMap[grade].sort((a, b) => a.section.localeCompare(b.section)),
    }));
  }, [branchClasses]);

  const stats = useMemo(() => {
    let totalSections = 0;
    let totalStudents = 0;
    let overcrowded = 0;

    classes.forEach((g) => {
      g.sections.forEach((s) => {
        totalSections++;
        totalStudents += s.strength;
        if (s.strength > 50) overcrowded++;
      });
    });

    return {
      activeGrades: classes.length,
      totalSections,
      totalStudents,
      avgStrength: totalSections ? Math.round(totalStudents / totalSections) : 0,
      overcrowded,
    };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes
      .filter((g) => filterGrade === "All" || g.grade === filterGrade)
      .map((g) => ({
        ...g,
        sections: g.sections.filter(
          (s) =>
            searchQuery === "" ||
            s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.grade.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((g) => g.sections.length > 0);
  }, [searchQuery, filterGrade, classes]);

  async function submitAdd() {
    setFormError("Adding classes from this form is not wired yet — classes are created from student import.");
    setAddOpen(false);
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Classes & Sections"
        description={
          currentYear
            ? `Academic year ${currentYear.name} — ${stats.totalSections} sections, ${stats.totalStudents.toLocaleString()} students enrolled`
            : "Manage grade levels, sections, and class assignments"
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
              Filter by Grade
            </label>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 appearance-none"
              >
                <option value="All">All Grades</option>
                {(gradeCatalog.length ? gradeCatalog : classes.map((g) => g.grade)).map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] xl:w-[240px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all placeholder:text-gray-400"
                placeholder="Search class or section..."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => void refresh()}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#144835]/10 text-[#144835] hover:bg-[#144835]/20 transition-colors"
              title="Reload Data"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-1 xl:pt-4 justify-end">
          <button
            type="button"
            onClick={() => {
              setAddOpen(true);
              setFormError(null);
            }}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Section
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Grades</p>
            <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.activeGrades}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <LayoutGrid size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Sections</p>
            <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.totalSections}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Students</p>
            <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              stats.overcrowded > 0 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
            )}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">Avg Strength</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-gray-900 tracking-tight">{stats.avgStrength}</p>
              {stats.overcrowded > 0 ? (
                <span className="text-xs font-bold text-red-500 flex items-center bg-red-50 px-1 py-0.5 rounded">
                  <AlertCircle size={10} className="mr-0.5" /> {stats.overcrowded} over
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xs font-bold text-gray-800">Classes Overview</h2>
          {currentYear ? (
            <span className="text-xs font-semibold text-[#144835]">{currentYear.name}</span>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Grade</th>
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Strength</th>
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Teachers</th>
                <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-5 py-2.5">
                      <div className="h-6 w-16 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-6 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-5 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-6 w-28 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-5 w-16 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="h-5 w-16 rounded bg-gray-100" />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="h-6 w-20 rounded bg-gray-100 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredClasses.length > 0 ? (
                filteredClasses.flatMap((g) =>
                  g.sections.map((s, idx) => {
                    const showGrade = idx === 0;
                    const rowSpan = g.sections.length;
                    const barWidth = Math.min(100, Math.round((s.strength / 60) * 100));
                    const isOvercrowded = s.strength > 50;

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                        {showGrade ? (
                          <td rowSpan={rowSpan} className="px-5 py-2.5 align-top border-r border-gray-100/50">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-700">
                                {g.grade.length > 4 ? g.grade.slice(0, 3) : g.grade}
                              </div>
                              <span className="text-xs font-bold text-gray-900">{gradeLabel(g.grade)}</span>
                            </div>
                          </td>
                        ) : null}
                        <td className="px-5 py-2.5">
                          <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">
                            Sec {s.section}
                          </span>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                            <MapPin size={12} className="text-gray-400" />
                            {s.room || "TBD"}
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center justify-center min-w-[2rem] rounded px-1.5 py-0.5 text-xs font-bold border border-white/20",
                                strengthBg(s.strength),
                                strengthText(s.strength)
                              )}
                            >
                              {s.strength}
                            </div>
                            <div className="hidden sm:block h-1 w-20 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", strengthColor(s.strength))}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            {isOvercrowded ? (
                              <span title="Overcrowded">
                                <TriangleAlert size={12} className="text-red-500" />
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-xs font-bold text-gray-700">{s.teacherCount} Teachers</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100/50">
                            <CheckCircle2 size={10} />
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <TableRowActions
                            items={[
                              { label: "Edit Section", icon: Pencil, onClick: () => {} },
                              { label: "View Teachers", icon: Users, onClick: () => {} },
                              { label: "Student List", icon: ClipboardList, onClick: () => {} },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
                      <Search size={20} className="text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">No classes found</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentYear
                        ? `No classes for ${currentYear.name}. Import student data for this year first.`
                        : "Select an active academic year in Settings."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] border border-gray-100 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900">Add Class / Section</h3>
              <p className="text-xs text-gray-500 mt-1">
                Classes are created automatically when you import student Excel data for an academic year.
              </p>
            </div>
            {formError ? (
              <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-xs">
                {formError}
              </div>
            ) : null}
            <div className="p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#144835]/30 hover:shadow-md transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 size={18} />
          </div>
          <p className="mt-3 text-xs font-bold text-gray-900">Class Strength Report</p>
          <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">
            Occupancy across all sections for the active academic year.
          </p>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalHomework } from "@/hooks/usePortalHomework";
import { getStudentClassInfo } from "@/lib/studentClassInfo";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type HomeworkStatus = "draft" | "published" | "closed";

type HomeworkRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  className: string;
  dueDate: string;
  assignedDate: string;
  status: HomeworkStatus;
  teacherName: string;
  description: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(dueDate: string) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function matchesStudentClass(item: HomeworkRow, grade: string, section: string) {
  if (!grade && !section) return true;
  const gradeMatch = !grade || item.grade === grade || item.className.startsWith(grade);
  const sectionMatch = !section || item.section === section || item.className.includes(section);
  return gradeMatch && sectionMatch;
}

export default function StudentHomeworkView() {
  const schoolId = useSchoolId();
  const { user } = useAuth();
  const { grade, section, className } = getStudentClassInfo(
    user as Parameters<typeof getStudentClassInfo>[0]
  );
  const { data, loading, error: loadError } = usePortalHomework(schoolId);
  const [searchQuery, setSearchQuery] = useState("");

  const items = useMemo<HomeworkRow[]>(() => {
    return (data?.items ?? []).map((row) => {
      const g = String(row.grade ?? "").trim();
      const s = String(row.section ?? "").trim();
      const cn = String(row.class_name ?? row.className ?? "").trim() || (g && s ? `${g}-${s}` : "");
      const rawStatus = String(row.status ?? "published").toLowerCase();
      const status: HomeworkStatus =
        rawStatus === "draft" || rawStatus === "closed" ? rawStatus : "published";
      return {
        id: String(row.id),
        title: String(row.title ?? "Untitled"),
        subject: String(row.subject ?? "—"),
        grade: g,
        section: s,
        className: cn,
        dueDate: String(row.due_date ?? row.dueDate ?? ""),
        assignedDate: String(row.assigned_date ?? row.assignedDate ?? ""),
        status,
        teacherName: String(row.teacher_name ?? row.teacherName ?? ""),
        description: String(row.description ?? ""),
      };
    });
  }, [data?.items]);

  const listLoading = loading && items.length === 0;

  const myItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === "published" && matchesStudentClass(item, grade, section)
      ),
    [items, grade, section]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myItems.filter((item) => {
      if (!q) return true;
      return `${item.title} ${item.subject} ${item.className} ${item.teacherName}`.toLowerCase().includes(q);
    });
  }, [myItems, searchQuery]);

  const stats = useMemo(
    () => ({
      total: myItems.length,
      overdue: myItems.filter((i) => isOverdue(i.dueDate)).length,
      upcoming: myItems.filter((i) => !isOverdue(i.dueDate)).length,
    }),
    [myItems]
  );

  return (
    <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Homework"
        description="View and track homework assigned to your class"
      />

      <div className="rounded-xl border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs font-semibold text-[#144835]">
        Your class: {className || grade || "Not linked yet"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Assigned", value: stats.total, icon: BookOpen, tone: "text-blue-600 bg-blue-50" },
          { label: "Due Soon", value: stats.upcoming, icon: Clock, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Overdue", value: stats.overdue, icon: AlertCircle, tone: "text-rose-600 bg-rose-50" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", item.tone)}>
              <item.icon size={18} />
            </div>
            <div>
              <p className="erp-caption mb-0.5">{item.label}</p>
              <p className="erp-metric text-xl">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold erp-input"
            placeholder="Search homework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
          {loadError}
        </div>
      ) : listLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading homework...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No homework assigned</p>
          <p className="text-xs text-gray-500 mt-1">Check back later for new assignments from your teachers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const overdue = isOverdue(item.dueDate);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#144835]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.subject} · {item.teacherName || "Teacher"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase",
                      overdue
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {overdue ? "Overdue" : "Active"}
                  </span>
                </div>

                {item.description ? (
                  <p className="text-xs text-gray-600 line-clamp-3 mb-3">{item.description}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} /> Due {formatDate(item.dueDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 size={13} /> Assigned {formatDate(item.assignedDate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

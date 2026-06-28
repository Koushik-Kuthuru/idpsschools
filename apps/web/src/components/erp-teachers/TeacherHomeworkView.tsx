"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { buildPath, subscribeData, sortBy, buildQuery, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type HomeworkStatus = "draft" | "published" | "closed";

export type HomeworkRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  className: string;
  dueDate: string;
  assignedDate: string;
  status: HomeworkStatus;
  teacherId: string;
  teacherName: string;
  description: string;
  submissionsCount: number;
  totalStudents: number;
};

const STATUS_FILTERS = ["All", "Published", "Draft", "Closed"] as const;

function statusTone(status: HomeworkStatus) {
  if (status === "published") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "closed") return "bg-slate-50 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

function statusLabel(status: HomeworkStatus) {
  if (status === "published") return "Published";
  if (status === "closed") return "Closed";
  return "Draft";
}

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function TeacherHomeworkView() {
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const { loading: scopeLoading, assignments } = useTeacherClassScope(schoolId);
  const [items, setItems] = useState<HomeworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const q = buildQuery(buildPath(db, "schools", schoolId, "homework"), sortBy("assigned_date", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const rows = snapshot.docs.map((doc) => {
          const data = doc.data();
          const grade = String(data.grade ?? "").trim();
          const section = String(data.section ?? "").trim();
          const className = String(data.className ?? data.class_name ?? "").trim() || (grade && section ? `${grade}-${section}` : "");
          const rawStatus = String(data.status ?? "published").toLowerCase();
          const status: HomeworkStatus =
            rawStatus === "draft" || rawStatus === "closed" ? rawStatus : "published";
          return {
            id: doc.id,
            title: String(data.title ?? "Untitled"),
            subject: String(data.subject ?? "—"),
            grade,
            section,
            className,
            dueDate: String(data.dueDate ?? data.due_date ?? ""),
            assignedDate: String(data.assignedDate ?? data.assigned_date ?? ""),
            status,
            teacherId: String(data.teacherId ?? data.teacher_id ?? ""),
            teacherName: String(data.teacherName ?? data.teacher_name ?? ""),
            description: String(data.description ?? ""),
            submissionsCount: Number(data.submissionsCount ?? data.submissions_count ?? 0),
            totalStudents: Number(data.totalStudents ?? data.total_students ?? 0),
          };
        });
        setItems(rows);
        setLoading(false);
      },
      () => {
        setLoadError("Could not load homework. Ensure the homework table exists in Supabase.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [schoolId]);

  const myItems = useMemo(() => {
    const uid = scope?.teacherUid;
    if (!uid) return items;
    return items.filter((item) => item.teacherId === uid);
  }, [items, scope?.teacherUid]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myItems.filter((item) => {
      const matchQ =
        !q ||
        `${item.title} ${item.subject} ${item.className} ${item.grade} ${item.section}`
          .toLowerCase()
          .includes(q);
      const matchStatus =
        statusFilter === "All" || statusLabel(item.status).toLowerCase() === statusFilter.toLowerCase();
      return matchQ && matchStatus;
    });
  }, [myItems, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      published: myItems.filter((i) => i.status === "published").length,
      draft: myItems.filter((i) => i.status === "draft").length,
      closed: myItems.filter((i) => i.status === "closed").length,
      total: myItems.length,
    }),
    [myItems]
  );

  const classLabel = useMemo(() => {
    if (assignments.length === 0) return "Your assigned classes";
    return assignments.map((a) => `${a.grade}-${a.section}`).join(", ");
  }, [assignments]);

  return (
    <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Homework"
        description="Create and manage homework for your assigned classes"
        actions={
          <SafeLink
            href={`/schools/${schoolId}/teachers/homework/new`}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
          >
            <Plus size={14} /> Assign Homework
          </SafeLink>
        }
      />

      {!scopeLoading && assignments.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            No class assignments found for your account yet. You can still create homework once classes are
            linked to your profile.
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs font-semibold text-[#144835]">
          Assigned classes: {classLabel}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Published", value: stats.published, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
          { label: "Drafts", value: stats.draft, icon: Clock, tone: "text-amber-600 bg-amber-50" },
          { label: "Closed", value: stats.closed, icon: BookOpen, tone: "text-slate-600 bg-slate-50" },
          { label: "Total", value: stats.total, icon: CalendarDays, tone: "text-blue-600 bg-blue-50" },
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

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold"
            placeholder="Search title, subject, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
          {loadError}
        </div>
      ) : loading || scopeLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading homework...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No homework yet</p>
          <p className="text-xs text-gray-500 mt-1">Assign homework for your classes using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#144835]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.subject} · {item.className || "—"}
                  </p>
                </div>
                <span className={cn("shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", statusTone(item.status))}>
                  {statusLabel(item.status)}
                </span>
              </div>

              {item.description ? (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.description}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} /> Due {formatDate(item.dueDate)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={13} />
                  {item.submissionsCount}/{item.totalStudents || "—"} submitted
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Assigned {formatDate(item.assignedDate)}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#144835] hover:text-[#a2c144] transition-colors"
                  title="Submissions review coming soon"
                >
                  <Eye size={13} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

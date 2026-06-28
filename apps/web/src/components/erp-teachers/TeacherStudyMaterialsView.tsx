"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileStack,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { loadTeacherProfile } from "@/lib/loadTeacherProfile";
import { useAuth } from "@/contexts/AuthContext";
import { buildPath, subscribeData, sortBy, buildQuery, removeData, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type StudyMaterialRow = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  section: string;
  className: string;
  materialType: string;
  description: string;
  fileUrl: string;
  fileName: string;
  externalLink: string;
  uploadedAt: string;
  teacherId: string;
};

const MATERIAL_TYPES = ["All Types", "Notes", "PDF", "Presentation", "Worksheet", "Reference", "Video Link", "Other"];

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function typeBadge(type: string) {
  const t = type.toLowerCase();
  if (t.includes("pdf")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (t.includes("presentation") || t.includes("ppt")) return "bg-orange-50 text-orange-700 border-orange-200";
  if (t.includes("video")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (t.includes("worksheet")) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function TeacherStudyMaterialsView() {
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const { user } = useAuth();
  const { loading: scopeLoading, assignments } = useTeacherClassScope(schoolId);
  const [items, setItems] = useState<StudyMaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid || !schoolId) return;
    loadTeacherProfile(schoolId, user.uid, user.email, user.displayName, user.phone, user.photoURL).then(
      (profile) => {
        const subjects = [
          ...new Set(
            profile.teachingLoads.map((l) => l.subject).filter((s) => s && s !== "—" && s !== "Class Teacher")
          ),
        ].sort();
        setSubjectOptions(subjects);
      }
    );
  }, [schoolId, user?.uid, user?.email, user?.displayName, user?.phone, user?.photoURL]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const q = buildQuery(buildPath(db, "schools", schoolId, "study_materials"), sortBy("uploaded_at", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const uid = scope?.teacherUid;
        const rows = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const grade = String(data.grade ?? "").trim();
            const section = String(data.section ?? "").trim();
            const className =
              String(data.className ?? data.class_name ?? "").trim() ||
              (grade && section ? `${grade}-${section}` : "");
            return {
              id: doc.id,
              title: String(data.title ?? "Untitled"),
              subject: String(data.subject ?? "—"),
              grade,
              section,
              className,
              materialType: String(data.materialType ?? data.material_type ?? "Notes"),
              description: String(data.description ?? ""),
              fileUrl: String(data.fileUrl ?? data.file_url ?? ""),
              fileName: String(data.fileName ?? data.file_name ?? ""),
              externalLink: String(data.externalLink ?? data.external_link ?? ""),
              uploadedAt: String(data.uploadedAt ?? data.uploaded_at ?? data.created_at ?? ""),
              teacherId: String(data.teacherId ?? data.teacher_id ?? ""),
            };
          })
          .filter((row) => !uid || row.teacherId === uid);
        setItems(rows);
        setLoading(false);
      },
      () => {
        setLoadError("Could not load study materials. Run supabase/study_materials_table.sql if the table is missing.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [schoolId, scope?.teacherUid]);

  const classOptions = useMemo(() => {
    const fromItems = items.map((i) => i.className).filter(Boolean);
    const fromScope = assignments.map((a) => `${a.grade}-${a.section}`);
    return Array.from(new Set([...fromScope, ...fromItems])).sort();
  }, [assignments, items]);

  const allSubjects = useMemo(() => {
    const fromItems = items.map((i) => i.subject).filter((s) => s && s !== "—");
    return Array.from(new Set([...subjectOptions, ...fromItems])).sort();
  }, [items, subjectOptions]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchQ =
        !q ||
        `${item.title} ${item.subject} ${item.className} ${item.description} ${item.materialType}`
          .toLowerCase()
          .includes(q);
      const matchSubject = subjectFilter === "All Subjects" || item.subject === subjectFilter;
      const matchClass = classFilter === "All Classes" || item.className === classFilter;
      const matchType =
        typeFilter === "All Types" || item.materialType.toLowerCase() === typeFilter.toLowerCase();
      return matchQ && matchSubject && matchClass && matchType;
    });
  }, [items, searchQuery, subjectFilter, classFilter, typeFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await removeData(buildPath(db, "schools", schoolId, "study_materials", id));
    } catch (err) {
      console.error("Failed to delete material", err);
    }
  };

  const classLabel = useMemo(() => {
    if (assignments.length === 0) return null;
    return assignments.map((a) => `${a.grade}-${a.section}`).join(", ");
  }, [assignments]);

  return (
    <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Study Materials"
        description="Upload notes, PDFs, and resources for your classes by subject and section"
        actions={
          <SafeLink
            href={`/schools/${schoolId}/teachers/materials/new`}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
          >
            <Plus size={14} /> Upload Material
          </SafeLink>
        }
      />

      {!scopeLoading && assignments.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>No class assignments found yet. You can still upload materials once classes are linked to your profile.</span>
        </div>
      ) : classLabel ? (
        <div className="rounded-xl border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs font-semibold text-[#144835]">
          Your classes: {classLabel}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="erp-input h-9 pl-9"
            placeholder="Search title, subject, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="erp-input h-9 min-w-[140px]"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="All Subjects">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="erp-input h-9 min-w-[140px]"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="All Classes">All Classes</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="erp-input h-9 min-w-[130px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {MATERIAL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">{loadError}</div>
      ) : loading || scopeLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading study materials...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <FileStack size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No study materials yet</p>
          <p className="text-xs text-gray-500 mt-1">Upload notes, PDFs, or resources for your students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#144835]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.subject} · {item.className || "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase",
                    typeBadge(item.materialType)
                  )}
                >
                  {item.materialType}
                </span>
              </div>

              {item.description ? (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.description}</p>
              ) : null}

              <p className="text-[11px] text-gray-400 mb-3">Uploaded {formatDate(item.uploadedAt)}</p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#144835] hover:text-[#a2c144]"
                    >
                      <Download size={13} /> {item.fileName || "Download"}
                    </a>
                  ) : null}
                  {item.externalLink ? (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={13} /> Open link
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.title)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

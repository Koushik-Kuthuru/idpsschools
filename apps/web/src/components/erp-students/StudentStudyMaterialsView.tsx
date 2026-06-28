"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileStack,
  Search,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentClassInfo } from "@/lib/studentClassInfo";
import { buildPath, subscribeData, sortBy, buildQuery, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StudyMaterialRow = {
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

function matchesStudentClass(item: StudyMaterialRow, grade: string, section: string) {
  if (!grade && !section) return true;
  const gradeMatch = !grade || item.grade === grade || item.className.startsWith(grade);
  const sectionMatch = !section || item.section === section || item.className.includes(section);
  return gradeMatch && sectionMatch;
}

export default function StudentStudyMaterialsView() {
  const schoolId = useSchoolId();
  const { user } = useAuth();
  const { grade, section, className } = getStudentClassInfo(user as Parameters<typeof getStudentClassInfo>[0]);
  const [items, setItems] = useState<StudyMaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [typeFilter, setTypeFilter] = useState("All Types");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const q = buildQuery(buildPath(db, "schools", schoolId, "study_materials"), sortBy("uploaded_at", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const rows = snapshot.docs.map((doc) => {
          const data = doc.data();
          const g = String(data.grade ?? "").trim();
          const s = String(data.section ?? "").trim();
          const cn = String(data.className ?? data.class_name ?? "").trim() || (g && s ? `${g}-${s}` : "");
          return {
            id: doc.id,
            title: String(data.title ?? "Untitled"),
            subject: String(data.subject ?? "—"),
            grade: g,
            section: s,
            className: cn,
            materialType: String(data.materialType ?? data.material_type ?? "Other"),
            description: String(data.description ?? ""),
            fileUrl: String(data.fileUrl ?? data.file_url ?? ""),
            fileName: String(data.fileName ?? data.file_name ?? ""),
            externalLink: String(data.externalLink ?? data.external_link ?? ""),
            uploadedAt: String(data.uploadedAt ?? data.uploaded_at ?? ""),
          };
        });
        setItems(rows);
        setLoading(false);
      },
      () => {
        setLoadError("Could not load study materials. Ensure the study_materials table exists in Supabase.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [schoolId]);

  const myItems = useMemo(
    () => items.filter((item) => matchesStudentClass(item, grade, section)),
    [items, grade, section]
  );

  const subjectOptions = useMemo(() => {
    const subjects = new Set(myItems.map((i) => i.subject).filter(Boolean));
    return ["All Subjects", ...Array.from(subjects).sort()];
  }, [myItems]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myItems.filter((item) => {
      const matchQ =
        !q ||
        `${item.title} ${item.subject} ${item.className} ${item.materialType}`.toLowerCase().includes(q);
      const matchSubject = subjectFilter === "All Subjects" || item.subject === subjectFilter;
      const matchType =
        typeFilter === "All Types" ||
        item.materialType.toLowerCase().includes(typeFilter.toLowerCase().replace("all types", ""));
      return matchQ && matchSubject && matchType;
    });
  }, [myItems, searchQuery, subjectFilter, typeFilter]);

  return (
    <div className="erp-body space-y-6 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Study Materials"
        description="Download notes, worksheets, and resources shared by your teachers"
      />

      <div className="rounded-xl border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs font-semibold text-[#144835]">
        Materials for class: {className || grade || "Not linked yet"}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold erp-input"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold min-w-[140px]"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          {subjectOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold min-w-[140px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {MATERIAL_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          {loadError}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading study materials...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <FileStack size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No materials yet</p>
          <p className="text-xs text-gray-500 mt-1">Your teachers will share notes and resources here.</p>
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
                <span className={cn("shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", typeBadge(item.materialType))}>
                  {item.materialType}
                </span>
              </div>

              {item.description ? (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.description}</p>
              ) : null}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">Uploaded {formatDate(item.uploadedAt)}</span>
                <div className="flex items-center gap-2">
                  {item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#144835] hover:text-[#a2c144] transition-colors"
                    >
                      <Download size={13} /> {item.fileName || "Download"}
                    </a>
                  ) : null}
                  {item.externalLink ? (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink size={13} /> Open link
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

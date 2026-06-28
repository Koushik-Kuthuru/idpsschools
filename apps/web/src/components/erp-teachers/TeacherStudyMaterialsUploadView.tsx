"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
import { ArrowLeft, FileStack, Save, Upload } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { useAuth } from "@/contexts/AuthContext";
import { loadTeacherProfile } from "@/lib/loadTeacherProfile";
import { buildPath, insertData, getTimestamp, uploadFile, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MATERIAL_TYPE_OPTIONS = [
  { value: "Notes", label: "Notes" },
  { value: "PDF", label: "PDF Document" },
  { value: "Presentation", label: "Presentation (PPT)" },
  { value: "Worksheet", label: "Worksheet" },
  { value: "Reference", label: "Reference Material" },
  { value: "Video Link", label: "Video / External Link" },
  { value: "Other", label: "Other" },
];

const ACCEPT_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.xlsx,.xls";

export default function TeacherStudyMaterialsUploadView() {
  const router = useRouter();
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const { user } = useAuth();
  const { assignments, loading: scopeLoading } = useTeacherClassScope(schoolId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

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

  const classOptions = useMemo(
    () =>
      assignments.map((a) => ({
        value: a.key,
        label: `${a.grade} · Section ${a.section}`,
        grade: a.grade,
        section: a.section,
      })),
    [assignments]
  );

  const [form, setForm] = useState({
    title: "",
    subject: "",
    classKey: "",
    materialType: "Notes",
    description: "",
    externalLink: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!form.classKey) {
      setError("Please select a class and section.");
      return;
    }
    if (form.materialType === "Video Link" && !form.externalLink.trim() && !file) {
      setError("Provide a video/external link or upload a file.");
      return;
    }
    if (form.materialType !== "Video Link" && !file && !form.externalLink.trim()) {
      setError("Please upload a file or provide an external link.");
      return;
    }

    const selected = classOptions.find((c) => c.value === form.classKey);
    if (!selected) {
      setError("Invalid class selection.");
      return;
    }

    setLoading(true);
    try {
      const now = getTimestamp();
      const id = `SM-${Date.now()}`;
      const className = `${selected.grade}-${selected.section}`;

      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `schools/${schoolId}/study-materials/${id}/${safeName}`;
        fileUrl = await uploadFile(path, file);
        fileName = file.name;
        fileSize = file.size;
      }

      await insertData(buildPath(db, "schools", schoolId, "study_materials"), {
        id,
        title: form.title.trim(),
        subject: form.subject.trim(),
        grade: selected.grade,
        section: selected.section,
        class_name: className,
        className,
        material_type: form.materialType,
        materialType: form.materialType,
        description: form.description.trim(),
        file_url: fileUrl,
        fileUrl,
        file_name: fileName,
        fileName,
        file_size: fileSize,
        fileSize,
        external_link: form.externalLink.trim(),
        externalLink: form.externalLink.trim(),
        status: "published",
        teacher_id: scope?.teacherUid ?? "",
        teacherId: scope?.teacherUid ?? "",
        teacher_name: scope?.teacherDisplayName ?? "Teacher",
        teacherName: scope?.teacherDisplayName ?? "Teacher",
        uploaded_at: now,
        uploadedAt: now,
        created_at: now,
      });

      router.push(`/schools/${schoolId}/teachers/materials`);
    } catch (err) {
      console.error("Failed to upload study material", err);
      setError(
        "Could not save material. Ensure supabase/study_materials_table.sql is applied and the uploads storage bucket exists."
      );
      setLoading(false);
    }
  };

  return (
    <div className="erp-body space-y-6 pb-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <SafeLink
          href={`/schools/${schoolId}/teachers/materials`}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </SafeLink>
        <div>
          <h1 className="erp-page-title">Upload Study Material</h1>
          <p className="erp-page-desc">Share notes, PDFs, and resources with a specific class and subject</p>
        </div>
      </div>

      {scopeLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading your classes...
        </div>
      ) : classOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          No classes are assigned to your account. Contact admin to link your teaching classes before uploading
          materials.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </div>
          ) : null}

          <div>
            <label className="erp-label block mb-1.5" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="erp-input h-10"
              placeholder="e.g. Chapter 3 — Algebra Notes"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="erp-label block mb-1.5" htmlFor="subject">
                Subject
              </label>
              {subjectOptions.length > 0 ? (
                <select
                  id="subject"
                  name="subject"
                  className="erp-input h-10"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="">Select subject</option>
                  {subjectOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="subject"
                  name="subject"
                  className="erp-input h-10"
                  placeholder="e.g. Mathematics"
                  value={form.subject}
                  onChange={handleChange}
                />
              )}
            </div>
            <div>
              <label className="erp-label block mb-1.5" htmlFor="classKey">
                Class & Section
              </label>
              <select
                id="classKey"
                name="classKey"
                className="erp-input h-10"
                value={form.classKey}
                onChange={handleChange}
              >
                <option value="">Select class</option>
                {classOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="erp-label block mb-1.5" htmlFor="materialType">
              Material type
            </label>
            <select
              id="materialType"
              name="materialType"
              className="erp-input h-10"
              value={form.materialType}
              onChange={handleChange}
            >
              {MATERIAL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="erp-label block mb-1.5" htmlFor="file">
              Upload file
            </label>
            <label
              htmlFor="file"
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 cursor-pointer hover:border-[#144835]/40 hover:bg-[#144835]/5 transition-colors",
                file && "border-[#144835]/30 bg-[#144835]/5"
              )}
            >
              <Upload size={24} className="text-[#144835]" />
              <span className="text-sm font-bold text-gray-700">
                {file ? file.name : "Click to upload PDF, DOC, PPT, images, or text"}
              </span>
              <span className="text-xs text-gray-500">Max recommended: 20 MB</span>
              <input
                id="file"
                type="file"
                accept={ACCEPT_FILES}
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="erp-label block mb-1.5" htmlFor="externalLink">
              External link (optional)
            </label>
            <input
              id="externalLink"
              name="externalLink"
              type="url"
              className="erp-input h-10"
              placeholder="https://youtube.com/... or Google Drive link"
              value={form.externalLink}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="erp-label block mb-1.5" htmlFor="description">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="erp-input min-h-[80px] resize-y"
              placeholder="Brief description for students..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 disabled:opacity-60"
            >
              <Save size={14} />
              {loading ? "Uploading..." : "Publish Material"}
            </button>
            <SafeLink
              href={`/schools/${schoolId}/teachers/materials`}
              className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </SafeLink>
          </div>
        </form>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <FileStack size={14} className="shrink-0 mt-0.5" />
        <p>Materials are visible to students in the selected class and subject once published.</p>
      </div>
    </div>
  );
}

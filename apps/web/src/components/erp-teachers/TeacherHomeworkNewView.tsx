"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
import { ArrowLeft, Save, BookOpen } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { buildPath, insertData, getTimestamp, db } from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TeacherHomeworkNewView() {
  const router = useRouter();
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const { assignments, loading: scopeLoading } = useTeacherClassScope(schoolId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    dueDate: "",
    description: "",
    status: "published" as "published" | "draft",
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
      setError("Please select a class.");
      return;
    }
    if (!form.dueDate) {
      setError("Due date is required.");
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
      const id = `HW-${Date.now()}`;
      const className = `${selected.grade}-${selected.section}`;
      const today = now.slice(0, 10);

      await insertData(buildPath(db, "schools", schoolId, "homework"), {
        id,
        title: form.title.trim(),
        subject: form.subject.trim(),
        grade: selected.grade,
        section: selected.section,
        class_name: className,
        className,
        description: form.description.trim(),
        due_date: form.dueDate,
        dueDate: form.dueDate,
        due_at: new Date(form.dueDate).toISOString(),
        assigned_date: today,
        assignedDate: today,
        assigned_at: now,
        status: form.status,
        type: "homework",
        teacher_id: scope?.teacherUid ?? "",
        teacherId: scope?.teacherUid ?? "",
        teacher_name: scope?.teacherDisplayName ?? "Teacher",
        teacherName: scope?.teacherDisplayName ?? "Teacher",
        submissions_count: 0,
        submissionsCount: 0,
        total_students: 0,
        totalStudents: 0,
        created_at: now,
      });

      router.push(`/schools/${schoolId}/teachers/homework`);
    } catch (err) {
      console.error("Failed to create homework", err);
      setError("Could not save homework. Run supabase/homework_table.sql if the table is missing.");
      setLoading(false);
    }
  };

  return (
    <div className="erp-body space-y-6 pb-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <SafeLink
          href={`/schools/${schoolId}/teachers/homework`}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </SafeLink>
        <div>
          <h1 className="erp-page-title">Assign Homework</h1>
          <p className="erp-page-desc">Publish homework for students in your assigned classes</p>
        </div>
      </div>

      {scopeLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading your classes...
        </div>
      ) : classOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          No classes are assigned to your account. Contact admin to link your homeroom or teaching classes
          before assigning homework.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </div>
          ) : null}

          <div>
            <label className="erp-label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="erp-input mt-1"
              placeholder="e.g. Chapter 5 exercise problems"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="erp-label" htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                className="erp-input mt-1"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="erp-label" htmlFor="classKey">
                Class
              </label>
              <select
                id="classKey"
                name="classKey"
                className="erp-input mt-1"
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
            <label className="erp-label" htmlFor="dueDate">
              Due date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              className="erp-input mt-1"
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="erp-label" htmlFor="description">
              Instructions (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={cn("erp-input mt-1 resize-y min-h-[100px]")}
              placeholder="Describe what students need to complete..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="erp-label" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" className="erp-input mt-1" value={form.status} onChange={handleChange}>
              <option value="published">Publish now</option>
              <option value="draft">Save as draft</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 disabled:opacity-60"
            >
              <Save size={14} />
              {loading ? "Saving..." : form.status === "draft" ? "Save Draft" : "Publish Homework"}
            </button>
            <SafeLink
              href={`/schools/${schoolId}/teachers/homework`}
              className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </SafeLink>
          </div>
        </form>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <BookOpen size={14} className="shrink-0 mt-0.5" />
        <p>Homework is visible to students in the selected class once published.</p>
      </div>
    </div>
  );
}

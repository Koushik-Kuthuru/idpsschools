"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Plus, Search, Star, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";
import type { MessFeedbackDoc, MessMealType } from "@/lib/messStore";

type FeedbackRow = MessFeedbackDoc & { id: string };

const fieldCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

const MEALS: Array<{ id: MessMealType | "general"; label: string }> = [
  { id: "general", label: "General" },
  { id: "breakfast", label: "Morning Breakfast" },
  { id: "lunch", label: "Afternoon Lunch" },
  { id: "snacks", label: "Evening Snacks" },
  { id: "dinner", label: "Night Dinner" },
];

function mealLabel(meal: string) {
  return MEALS.find((item) => item.id === meal)?.label ?? meal;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  studentId: "",
  meal: "general" as MessMealType | "general",
  rating: 5,
  comment: "",
  date: todayIso(),
};

export default function MessFeedbackView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentParams = new URLSearchParams({ schoolId });
      if (academicYear) studentParams.set("academicYear", academicYear);
      const [studentsRes, feedbackRes] = await Promise.all([
        adminFetch(`/api/admin/hostel/students?${studentParams.toString()}`),
        adminFetch(`/api/admin/mess/feedback?schoolId=${encodeURIComponent(schoolId)}`),
      ]);
      const studentsData = await studentsRes.json().catch(() => ({}));
      const feedbackData = await feedbackRes.json().catch(() => ({}));
      if (!studentsRes.ok) throw new Error(studentsData.error || "Failed to load students");
      if (!feedbackRes.ok) throw new Error(feedbackData.error || "Failed to load feedback");
      setStudents((studentsData.students ?? []) as BranchHostelStudentRow[]);
      setFeedback((feedbackData.feedback ?? []) as FeedbackRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === form.studentId) ?? null,
    [students, form.studentId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feedback;
    return feedback.filter((row) =>
      [row.studentName, row.className, row.section, row.comment, row.meal]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [feedback, search]);

  const avgRating = useMemo(() => {
    if (!feedback.length) return 0;
    const sum = feedback.reduce((acc, row) => acc + (Number(row.rating) || 0), 0);
    return Math.round((sum / feedback.length) * 10) / 10;
  }, [feedback]);

  const handleSave = async () => {
    if (!selectedStudent || !form.comment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: MessFeedbackDoc = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: selectedStudent.className,
        section: selectedStudent.section,
        meal: form.meal,
        rating: form.rating,
        comment: form.comment.trim(),
        date: form.date,
        status: "new",
      };
      const res = await adminFetch("/api/admin/mess/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setShowForm(false);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const markReviewed = async (row: FeedbackRow) => {
    const res = await adminFetch("/api/admin/mess/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, ...row, id: row.id, status: "reviewed" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to update");
      return;
    }
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    const params = new URLSearchParams({ schoolId, id });
    const res = await adminFetch(`/api/admin/mess/feedback?${params.toString()}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Mess Feedback"
        description="Student and staff feedback on meals and service."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
          >
            <Plus size={14} />
            Add Feedback
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <MessageSquare size={12} /> {feedback.length} entries
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
          <Star size={12} /> Avg {avgRating || "—"} / 5
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
          {feedback.filter((row) => row.status === "new").length} new
        </span>
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">New feedback</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Student</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                className={`${fieldCls} mt-1`}
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.className}-{student.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Meal</label>
              <select
                value={form.meal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    meal: e.target.value as MessMealType | "general",
                  }))
                }
                className={`${fieldCls} mt-1`}
              >
                {MEALS.map((meal) => (
                  <option key={meal.id} value={meal.id}>
                    {meal.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Rating</label>
              <select
                value={form.rating}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                }
                className={`${fieldCls} mt-1`}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className={`${fieldCls} mt-1`}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Comment</label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
                placeholder="Feedback on food quality, quantity, service…"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.studentId || !form.comment.trim()}
              className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save feedback"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={7} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">No feedback yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Meal</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Comment</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-extrabold text-gray-900">{row.studentName}</p>
                      <p className="text-[11px] text-gray-500">
                        {row.className}-{row.section}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {mealLabel(row.meal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-700">
                      {"★".repeat(Math.max(1, Math.min(5, Number(row.rating) || 0)))}
                      <span className="text-gray-400 ml-1">{row.rating}/5</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-sm">{row.comment}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{row.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                          row.status === "reviewed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {row.status === "reviewed" ? "Reviewed" : "New"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {row.status !== "reviewed" ? (
                          <button
                            type="button"
                            onClick={() => markReviewed(row)}
                            className="h-8 px-2 rounded-md border border-gray-200 text-[11px] font-bold text-gray-600 hover:text-[#144835]"
                          >
                            Mark reviewed
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

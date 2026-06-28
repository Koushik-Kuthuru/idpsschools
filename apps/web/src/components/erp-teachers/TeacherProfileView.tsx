"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/PageHeader";
import TeacherProfileSidebar from "@/components/erp-teachers/profile/TeacherProfileSidebar";
import {
  TeacherProfileTabPanels,
} from "@/components/erp-teachers/profile/TeacherProfileTabPanels";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import {
  useTeacherAttendanceDates,
  useTeacherPayslips,
  useTeacherRawEmployee,
} from "@/hooks/useTeacherProfileData";
import { getRoleLabel } from "@/lib/auth/roles";
import { loadTeacherProfile, type TeacherProfileData } from "@/lib/loadTeacherProfile";
import type { ComplaintRow, LeaveRow, StaffExpenseRow, TeacherProfileTab } from "@/lib/teacherProfileHub";
import { buildPath, subscribeData, sortBy, buildQuery, insertData, getTimestamp, db } from "@/lib/db-client";

function getAvatarColor(name: string) {
  const colors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-violet-100 text-violet-700 border-violet-200",
  ];
  if (!name) return colors[0];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export default function TeacherProfileView() {
  const { user, role } = useAuth();
  const schoolId = useSchoolId();
  const scope = useTeacherPortalScope();
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [expenses, setExpenses] = useState<StaffExpenseRow[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TeacherProfileTab>("Overview");
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Travel",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    notes: "",
  });
  const [complaintForm, setComplaintForm] = useState({
    recipient: "Principal",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!user?.uid || !schoolId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadTeacherProfile(schoolId, user.uid, user.email, user.displayName, user.phone, user.photoURL)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => console.error("Failed to load teacher profile", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schoolId, user?.uid, user?.email, user?.displayName, user?.phone, user?.photoURL]);

  const data = profile ?? {
    name: user?.displayName || "Teacher",
    email: user?.email || "—",
    phone: user?.phone || "—",
    employeeId: user?.uid?.slice(0, 8).toUpperCase() || "—",
    designation: "Teacher",
    department: "Academic",
    status: "Active",
    joinedDate: "—",
    qualification: "—",
    experienceYears: null,
    photoURL: user?.photoURL ?? null,
    homeroomClasses: [],
    teachingLoads: [],
  };

  const rawEmployee = useTeacherRawEmployee(
    schoolId,
    scope?.teacherUid ?? user?.uid ?? null,
    data.employeeId,
    data.name,
    data.email !== "—" ? data.email : user?.email ?? null
  );
  const payslips = useTeacherPayslips(
    schoolId,
    scope?.teacherUid ?? user?.uid ?? null,
    data.employeeId,
    data.name,
    data.email !== "—" ? data.email : user?.email ?? null,
    rawEmployee
  );
  const { presentDates, absentDates } = useTeacherAttendanceDates(rawEmployee);

  const baseSalary = useMemo(() => {
    return Number(
      rawEmployee?.baseSalaryMonthlyInr ?? rawEmployee?.baseSalary ?? rawEmployee?.salary ?? 0
    );
  }, [rawEmployee]);

  useEffect(() => {
    if (!schoolId || !scope?.teacherUid) return;
    const q = buildQuery(buildPath(db, "schools", schoolId, "leaves"), sortBy("from", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const uid = scope.teacherUid;
        const name = scope.teacherDisplayName?.toLowerCase();
        const rows = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              employeeId: String(d.employeeId ?? ""),
              employeeName: String(d.employeeName ?? ""),
              type: String(d.type ?? "Leave"),
              from: String(d.from ?? ""),
              to: String(d.to ?? ""),
              days: typeof d.days === "number" ? d.days : undefined,
              status: String(d.status ?? "Pending"),
            };
          })
          .filter((row) => {
            if (uid && row.employeeId === uid) return true;
            if (name && row.employeeName.toLowerCase().includes(name)) return true;
            return false;
          })
          .map(({ id, type, from, to, days, status }) => ({ id, type, from, to, days, status }));
        setLeaves(rows);
      },
      () => setLeaves([])
    );
    return () => unsub();
  }, [schoolId, scope?.teacherDisplayName, scope?.teacherUid]);

  useEffect(() => {
    if (!schoolId || !scope?.teacherUid) return;
    const q = buildQuery(buildPath(db, "schools", schoolId, "staff_expenses"), sortBy("created_at", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const uid = scope.teacherUid!;
        const rows = snapshot.docs
          .filter((doc) => {
            const d = doc.data();
            return String(d.employeeId ?? d.employee_id ?? "") === uid;
          })
          .map((doc) => {
            const d = doc.data();
            const dateRaw = d.expenseDate ?? d.expense_date ?? d.date ?? "";
            return {
              id: doc.id,
              title: String(d.title ?? "Expense"),
              category: String(d.category ?? "Other"),
              amount: Number(d.amount ?? 0),
              date: dateRaw ? new Date(String(dateRaw)).toLocaleDateString("en-IN") : "—",
              status: String(d.status ?? "Pending"),
              vendor: String(d.vendor ?? "—"),
              notes: String(d.notes ?? ""),
            };
          });
        setExpenses(rows);
      },
      () => setExpenses([])
    );
    return () => unsub();
  }, [schoolId, scope?.teacherUid]);

  useEffect(() => {
    if (!schoolId || !scope?.teacherUid) return;
    const q = buildQuery(buildPath(db, "schools", schoolId, "staff_complaints"), sortBy("created_at", "desc"));
    const unsub = subscribeData(
      q,
      (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        const uid = scope.teacherUid!;
        const rows = snapshot.docs
          .filter((doc) => String(doc.data().employeeId ?? doc.data().employee_id ?? "") === uid)
          .map((doc) => {
            const d = doc.data();
            const created = String(d.createdAt ?? d.created_at ?? "");
            return {
              id: doc.id,
              recipient: String(d.recipient ?? "Principal"),
              subject: String(d.subject ?? ""),
              message: String(d.message ?? ""),
              status: String(d.status ?? "Open"),
              createdAt: created
                ? new Date(created).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : "—",
            };
          });
        setComplaints(rows);
      },
      () => setComplaints([])
    );
    return () => unsub();
  }, [schoolId, scope?.teacherUid]);

  const roleLabel = role ? getRoleLabel(role) : "Teacher";
  const initials = useMemo(
    () =>
      data.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(""),
    [data.name]
  );
  const avatarColor = getAvatarColor(data.name);

  const handleSubmitExpense = async () => {
    if (!scope?.teacherUid || !expenseForm.title.trim() || !expenseForm.amount) return;
    setSubmittingExpense(true);
    try {
      const id = `SEXP-${Date.now()}`;
      await insertData(buildPath(db, "schools", schoolId, "staff_expenses"), {
        id,
        employee_id: scope.teacherUid,
        employeeId: scope.teacherUid,
        employee_name: data.name,
        employeeName: data.name,
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.date,
        expenseDate: expenseForm.date,
        date: expenseForm.date,
        status: "Pending",
        vendor: expenseForm.vendor.trim(),
        notes: expenseForm.notes.trim(),
        created_at: getTimestamp(),
        createdAt: getTimestamp(),
      });
      setExpenseForm({
        title: "",
        category: "Travel",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        vendor: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to submit expense", err);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!scope?.teacherUid || !complaintForm.subject.trim() || !complaintForm.message.trim()) return;
    setSubmittingComplaint(true);
    try {
      const id = `SCMP-${Date.now()}`;
      await insertData(buildPath(db, "schools", schoolId, "staff_complaints"), {
        id,
        employee_id: scope.teacherUid,
        employeeId: scope.teacherUid,
        employee_name: data.name,
        employeeName: data.name,
        recipient: complaintForm.recipient,
        subject: complaintForm.subject.trim(),
        message: complaintForm.message.trim(),
        status: "Open",
        created_at: getTimestamp(),
        createdAt: getTimestamp(),
      });
      setComplaintForm({ recipient: "Principal", subject: "", message: "" });
    } catch (err) {
      console.error("Failed to submit complaint", err);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="erp-body space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="My Profile"
        description="Attendance, payroll, expenses, leave, and feedback — all in one place"
      />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <TeacherProfileSidebar
          data={data}
          initials={initials}
          avatarColor={avatarColor}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 min-w-0 w-full">
          <TeacherProfileTabPanels
            schoolId={schoolId}
            activeTab={activeTab}
            data={data}
            roleLabel={roleLabel}
            userUid={user?.uid}
            leaves={leaves}
            payslips={payslips}
            expenses={expenses}
            complaints={complaints}
            presentDates={presentDates}
            absentDates={absentDates}
            baseSalary={baseSalary}
            expenseForm={expenseForm}
            complaintForm={complaintForm}
            submittingExpense={submittingExpense}
            submittingComplaint={submittingComplaint}
            onExpenseFormChange={(field, value) => setExpenseForm((prev) => ({ ...prev, [field]: value }))}
            onComplaintFormChange={(field, value) => setComplaintForm((prev) => ({ ...prev, [field]: value }))}
            onSubmitExpense={handleSubmitExpense}
            onSubmitComplaint={handleSubmitComplaint}
            onTabSelect={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
}

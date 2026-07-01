"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import {
  ArrowUpDown,
  Banknote,
  Building2,
  Bus,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  IndianRupee,
  MapPin,
  Phone,
  Printer,
  Receipt,
  RotateCw,
  Search,
  SlidersHorizontal,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import PayableFeeStructureModal from "@/components/admin/PayableFeeStructureModal";
import FeeReceiptModal from "@/components/admin/FeeReceiptModal";
import { useBranch } from "@/components/admin/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import {
  FEE_MONTHS,
  buildFeeGridFromStructure,
  buildPaidMonthsFromReceipts,
  computeFeeStatus,
  formatInr,
  hasFeeGridData,
  monthLabelFromIndex,
  nextReceiptNo,
  normalizeGradeKey,
  parseAmount,
  type FeeGridRow,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";
import { extractFeeDetails, extractFeeTransactions } from "@/lib/studentFeeResolver";
import {
  classStructureAsGradeRecord,
  fetchHydratedFeeConfiguration,
  findClassStructureForGrade,
} from "@/lib/feeConfigurationStore";
import { buildFeeReceiptPrintData } from "@/lib/buildFeeReceiptData";
import { loadFeeReceiptTemplate, type FeeReceiptPrintData } from "@/lib/feeReceiptTemplate";
import {
  buildPath,
  buildQuery,
  fetchMany,
  getTimestamp,
  sortBy,
  upsertData,
  db,
} from "@/lib/db-client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TX_TABS = ["Previous Transaction", "Discount Log", "Fee Refund", "Pending"] as const;
type TxTab = (typeof TX_TABS)[number];

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "NEFT", "Credit Card"] as const;

type StudentSort = "name" | "admission" | "class";
type StatusFilter = "All" | "Active" | "Inactive";

type StudentDetail = Record<string, unknown> & {
  id: string;
  name?: string;
  studentName?: string;
  admissionNo?: string;
  fatherName?: string;
  classId?: string;
  grade?: string;
  section?: string;
  feeDetails?: {
    feeCategory?: string;
    feeStatus?: string;
    lastYearDue?: string;
    discRemark?: string;
    totalDiscount?: string | number;
    lateFine?: string | number;
    feeGrid?: FeeGridRow[];
    paidMonths?: string[];
    discountLog?: Array<{ date?: string; amount?: string | number; remark?: string }>;
  };
  transportDetails?: {
    facility?: string;
    busNo?: string;
    route?: string;
    stoppage?: string;
    driverName?: string;
    fees?: string[];
  };
  photo?: string;
  photos?: { student?: string };
  mobileNumber?: string;
  fatherMobile1?: string;
  parentPhone?: string;
  permAddress?: string;
  address?: string;
  siblingInfo?: string;
  siblings?: string;
  hasSibling?: string | boolean;
  studentType?: string;
  feeStatus?: string;
  className?: string;
};

function defaultFeeGrid(): FeeGridRow[] {
  return [
    { name: "TUITION FEE", method: "QUARTERLY", values: Array(12).fill("0") },
    { name: "ADMISSION FEE", method: "ONE TIME", values: Array(12).fill("0") },
    { name: "TRANSPORT FEE", method: "QUARTERLY", values: Array(12).fill("0") },
  ];
}

function mapPaymentDoc(id: string, data: Record<string, unknown>): FeeReceiptRow {
  const monthRaw = String(data.feeMonth ?? data.month ?? "");
  const dateRaw = String(data.date ?? data.payment_date ?? "").slice(0, 10);
  return {
    id,
    receiptNo: String(data.receiptNo ?? data.id ?? id).slice(0, 12),
    month: monthRaw || monthLabelFromIndex(new Date(dateRaw || Date.now()).getMonth()),
    date: dateRaw,
    amount: parseAmount(data.amount),
    mode: String(data.mode ?? data.paymentMode ?? "Cash"),
    fine: parseAmount(data.fine),
    status: String(data.status ?? "Completed"),
    studentId: data.studentId ? String(data.studentId) : undefined,
    studentName: data.studentName ? String(data.studentName) : undefined,
    admissionNo: data.admissionNo ? String(data.admissionNo) : undefined,
    collectedBy: data.collectedBy ? String(data.collectedBy) : undefined,
    collectedByName: data.collectedByName ? String(data.collectedByName) : undefined,
    remark: data.remark ? String(data.remark) : undefined,
    reference: String(data.reference ?? data.upiId ?? data.upiRef ?? data.transactionId ?? data.txnId ?? ""),
  };
}

function formatLegacyTxDate(date: string): string {
  if (!date) return "—";
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function isUpiPaymentMode(mode: string): boolean {
  return String(mode ?? "").toUpperCase().includes("UPI");
}

function transactionIdForRow(mode: string, reference?: string): string {
  if (!isUpiPaymentMode(mode)) return "";
  const id = String(reference ?? "").trim();
  return id;
}

function studentBoardingCategory(student: StudentDetail | null | undefined): string {
  const raw = String(student?.studentType ?? "").trim();
  if (!raw) return "—";
  const lower = raw.toLowerCase();
  if (lower.includes("day")) return "Day Scholar";
  if (lower.includes("board") || lower.includes("hostel") || lower.includes("residen")) return "Residential";
  return raw;
}

function MonthCell({ value, variant }: { value: number; variant: "fee" | "paid" | "balance" | "bus" }) {
  if (variant === "balance") {
    if (value === 0) {
      return <span className="text-emerald-600 font-bold text-[11px]">Paid</span>;
    }
    return <span className="text-rose-600 font-bold text-[11px]">{value.toLocaleString("en-IN")}</span>;
  }
  if (value === 0) return <span className="text-gray-300 text-[11px]">—</span>;
  const color =
    variant === "paid"
      ? "text-amber-700 bg-amber-50"
      : variant === "bus"
        ? "text-sky-700 bg-sky-50"
        : "text-emerald-700 bg-emerald-50";
  return (
    <span className={cn("inline-block rounded-md px-1.5 py-0.5 font-bold text-[11px]", color)}>
      {value.toLocaleString("en-IN")}
    </span>
  );
}

export default function AdminDepositFeePage({ embedded = false }: { embedded?: boolean }) {
  const schoolId = useSchoolId();
  const { activeBranch } = useBranch();
  const branchName = activeBranch?.name ?? "IDPS Cherukupalli";
  const { user } = useAuth();
  const { currentYear } = useAcademicYear();
  const base = `/schools/${schoolId}/admin`;
  const { students, classOptions, sectionOptions, loading: studentsLoading } = useBranchStudents(
    schoolId,
    currentYear?.name
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [studentSort, setStudentSort] = useState<StudentSort>("name");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [filterOpen, setFilterOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [allReceipts, setAllReceipts] = useState<FeeReceiptRow[]>([]);
  const [txTab, setTxTab] = useState<TxTab>("Previous Transaction");
  const [payOpen, setPayOpen] = useState(false);
  const [feeStructureOpen, setFeeStructureOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<FeeReceiptPrintData | null>(null);
  const [receiptTemplate, setReceiptTemplate] = useState(() => loadFeeReceiptTemplate(schoolId, branchName));
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    mode: "Cash" as (typeof PAYMENT_MODES)[number],
    month: FEE_MONTHS[new Date().getMonth()] as string,
    remark: "",
  });

  const sectionsForClass = useMemo(() => {
    if (classFilter === "All") return ["All", ...sectionOptions];
    const sections = [
      ...new Set(
        students
          .filter((s) => s.className === classFilter && s.section && s.section !== "—")
          .map((s) => s.section.toUpperCase())
      ),
    ].sort((a, b) => a.localeCompare(b));
    return ["All", ...sections];
  }, [classFilter, sectionOptions, students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const rows = students.filter((s) => {
      const matchClass = classFilter === "All" || s.className === classFilter;
      const matchSection =
        sectionFilter === "All" || s.section.toUpperCase() === sectionFilter.toUpperCase();
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchSearch =
        !q ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        String(s.fatherName ?? "").toLowerCase().includes(q);
      return matchClass && matchSection && matchStatus && matchSearch;
    });

    return [...rows].sort((a, b) => {
      if (studentSort === "admission") {
        return a.admissionNo.localeCompare(b.admissionNo, undefined, { numeric: true });
      }
      if (studentSort === "class") {
        const byClass = a.className.localeCompare(b.className, undefined, { numeric: true });
        return byClass !== 0 ? byClass : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }, [students, searchQuery, classFilter, sectionFilter, statusFilter, studentSort]);

  const showStudentList =
    !student &&
    filteredStudents.length > 0 &&
    Boolean(searchQuery.trim() || classFilter !== "All" || sectionFilter !== "All");

  const showEmptyPlaceholder = !student && !studentLoading && !selectedId && !showStudentList;

  const displayStudents = filteredStudents;

  const resetFilters = () => {
    setSearchQuery("");
    setClassFilter("All");
    setSectionFilter("All");
    setStudentSort("name");
    setStatusFilter("Active");
    setSelectedId(null);
    setStudent(null);
    setStudentLoadError(null);
  };

  const resolveGradeFeeStructure = useCallback(
    async (gradeRaw: string) => {
      const grade = String(gradeRaw ?? "").trim();
      if (!grade) return null;

      const config = await fetchHydratedFeeConfiguration(schoolId, currentYear?.name ?? null);
      const entry = findClassStructureForGrade(config, grade, currentYear?.name ?? null);
      return entry ? classStructureAsGradeRecord(entry) : null;
    },
    [schoolId, currentYear?.name]
  );

  const studentReceipts = useMemo(() => {
    if (!student) return [];
    const adm = String(student.admissionNo ?? "").toLowerCase();
    const sid = student.id;
    const name = String(student.name ?? student.studentName ?? "").toLowerCase();
    const fromPayments = allReceipts.filter(
      (r) =>
        r.studentId === sid ||
        (r.admissionNo && r.admissionNo.toLowerCase() === adm) ||
        (r.studentName && r.studentName.toLowerCase() === name)
    );
    const fromProfile = extractFeeTransactions(student as Record<string, unknown>, {
      id: sid,
      admissionNo: String(student.admissionNo ?? ""),
      name: String(student.name ?? student.studentName ?? ""),
    });
    const seen = new Set<string>();
    return [...fromProfile, ...fromPayments].filter((r) => {
      const key = `${r.receiptNo}|${r.date}|${r.amount}|${r.reference ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allReceipts, student]);

  const loadPayments = useCallback(async () => {
    try {
      const snap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, "payments"), sortBy("createdAt", "desc")));
      const rows = snap.docs.map((d) => mapPaymentDoc(d.id, d.data() as Record<string, unknown>));
      setAllReceipts(rows);
    } catch {
      setAllReceipts([]);
    }
  }, [schoolId]);

  const loadStudent = useCallback(
    async (studentId: string) => {
      setStudentLoading(true);
      setStudentLoadError(null);
      setSelectedId(studentId);
      try {
        const params = new URLSearchParams({ schoolId });
        if (currentYear?.name) params.set("academicYear", currentYear.name);
        const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Student not found");

        let detail = data.student as StudentDetail;
        const grade =
          String(detail.grade ?? detail.classId ?? detail.className ?? "").trim() ||
          classOptions.find((c) => normalizeGradeKey(c) === normalizeGradeKey(String(detail.classId ?? ""))) ||
          "";

        if (!hasFeeGridData(detail.feeDetails?.feeGrid)) {
          const structure = await resolveGradeFeeStructure(grade);
          if (structure) {
            detail = {
              ...detail,
              feeDetails: {
                ...(detail.feeDetails ?? {}),
                feeCategory: detail.feeDetails?.feeCategory ?? "GENERAL",
                feeStatus: detail.feeDetails?.feeStatus ?? "NEW",
                feeGrid: buildFeeGridFromStructure(structure),
              },
            };
          }
        }

        setStudent(detail);
      } catch (err) {
        setStudent(null);
        setStudentLoadError(err instanceof Error ? err.message : "Failed to load student");
      } finally {
        setStudentLoading(false);
      }
    },
    [schoolId, currentYear?.name, classOptions, resolveGradeFeeStructure]
  );

  useEffect(() => {
    setReceiptTemplate(loadFeeReceiptTemplate(schoolId, branchName));
  }, [schoolId, branchName]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const feeGrid = useMemo(() => {
    const grid = student?.feeDetails?.feeGrid;
    if (hasFeeGridData(grid)) return grid as FeeGridRow[];
    return defaultFeeGrid();
  }, [student]);

  const paidMonths = useMemo(() => {
    const fromProfile = student?.feeDetails?.paidMonths;
    if (Array.isArray(fromProfile) && fromProfile.some((v) => parseAmount(v) > 0)) {
      return fromProfile.map((v) => parseAmount(v));
    }
    return buildPaidMonthsFromReceipts(studentReceipts);
  }, [student, studentReceipts]);

  const feeAdjustments = useMemo(() => {
    const details = extractFeeDetails(student ?? {});
    let lateFine = parseAmount(details.lateFine);
    if (lateFine === 0) {
      lateFine = studentReceipts.reduce((sum, r) => sum + parseAmount(r.fine), 0);
    }
    return {
      totalDiscount: parseAmount(details.totalDiscount),
      grossFee: parseAmount(details.grossFee),
      lateFine,
      discountLog: details.discountLog ?? [],
    };
  }, [student, studentReceipts]);

  const feeStatus = useMemo(
    () =>
      computeFeeStatus({
        feeGrid,
        transportFees: student?.transportDetails?.fees,
        paidMonths,
        lastYearDue: student?.feeDetails?.lastYearDue,
        grossFee: feeAdjustments.grossFee,
        totalDiscount: feeAdjustments.totalDiscount,
        lateFine: feeAdjustments.lateFine,
      }),
    [feeGrid, student, paidMonths, feeAdjustments]
  );

  const handleSelectStudent = (id: string, admissionNo: string, name: string) => {
    setSearchQuery(`${admissionNo} · ${name}`);
    void loadStudent(id);
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setPaySaving(true);
    setPayError(null);

    const amount = parseAmount(payForm.amount);
    if (amount <= 0) {
      setPayError("Enter a valid amount.");
      setPaySaving(false);
      return;
    }

    try {
      const receiptNo = nextReceiptNo(allReceipts);
      const payId = `RCP-${receiptNo}`;
      const today = new Date().toISOString().slice(0, 10);

      const collectorName = user?.displayName || user?.email?.split("@")[0] || "Admin";

      await upsertData(buildPath(db, "schools", schoolId, "payments", payId), {
        id: payId,
        receiptNo,
        studentId: student.id,
        studentName: student.name ?? student.studentName,
        admissionNo: student.admissionNo,
        amount,
        mode: payForm.mode,
        feeMonth: payForm.month,
        date: today,
        status: "Completed",
        remark: payForm.remark.trim(),
        collectedBy: user?.uid ?? null,
        collectedByName: collectorName,
        createdAt: getTimestamp(),
      });

      await loadPayments();
      setPayOpen(false);
      setPayForm((f) => ({ ...f, amount: "", remark: "" }));
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setPaySaving(false);
    }
  };

  const classLabel = student
    ? [student.grade || student.classId || student.className, student.section]
        .filter(Boolean)
        .join(" · ")
        .toUpperCase()
    : "—";
  const photo = student?.photos?.student || student?.photo;
  const usesTransport = String(student?.transportDetails?.facility ?? "").toUpperCase() === "YES";
  const mobile = student?.fatherMobile1 || student?.mobileNumber || student?.parentPhone || "—";
  const address = student?.permAddress || student?.address || "—";
  const siblingText =
    String(student?.siblings ?? student?.siblingInfo ?? "").trim() ||
    (student?.hasSibling ? "Yes" : "—");
  const admissionType = student?.feeDetails?.feeStatus ?? student?.feeStatus ?? "NEW";
  const hasConfiguredFees = hasFeeGridData(student?.feeDetails?.feeGrid);

  const openReceipt = (receipt: FeeReceiptRow) => {
    if (!student) return;
    setReceiptTemplate(loadFeeReceiptTemplate(schoolId, branchName));
    setReceiptData(
      buildFeeReceiptPrintData({
        receipt,
        student,
        academicYear: currentYear?.name,
        feeTotals: { balance: feeStatus.totals.balance, fee: feeStatus.totals.fee },
        monthlyBalances: feeStatus.balance,
      })
    );
    setReceiptOpen(true);
  };

  const filteredTx = useMemo(() => {
    if (txTab === "Pending") return studentReceipts.filter((r) => r.status === "Pending" || r.status === "Processing");
    if (txTab === "Fee Refund") return studentReceipts.filter((r) => r.status === "Refunded");
    if (txTab === "Discount Log") {
      return (feeAdjustments.discountLog ?? []).map((row, idx) => ({
        id: `disc-${idx}`,
        receiptNo: "DISC",
        month: "—",
        date: String(row.date ?? "—").slice(0, 10),
        amount: parseAmount(row.amount),
        mode: "Discount",
        fine: 0,
        status: "Completed",
        remark: row.remark ? String(row.remark) : undefined,
      }));
    }
    return studentReceipts.filter((r) => r.status === "Completed" || r.status === "Live");
  }, [studentReceipts, txTab, feeAdjustments.discountLog]);

  return (
    <div className={cn("space-y-5 animate-in fade-in duration-300", embedded ? "pb-6" : "pb-10")}>
      {!embedded ? (
        <AdminPageHeader
          title="Deposit Fee"
          description="Search a student, review fee status, and record payments."
        />
      ) : null}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admission no. or student name"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>

          <div className="relative shrink-0">
            <ArrowUpDown
              size={16}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <select
              value={studentSort}
              onChange={(e) => setStudentSort(e.target.value as StudentSort)}
              className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-transparent appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
              aria-label="Sort students"
              title="Sort students"
            >
              <option value="name">Sort by Name</option>
              <option value="admission">Sort by Admission No.</option>
              <option value="class">Sort by Class</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            title="Filter"
            aria-label="Filter"
            className={cn(
              "h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border transition-colors",
              filterOpen
                ? "border-[#144835]/30 bg-[#144835]/10 text-[#144835]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <SlidersHorizontal size={16} />
          </button>

          <button
            type="button"
            onClick={resetFilters}
            title="Reset"
            aria-label="Reset filters"
            className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RotateCw size={16} />
          </button>

          <span className="hidden sm:inline text-[11px] font-bold text-gray-400 whitespace-nowrap shrink-0">
            {studentsLoading ? "Loading…" : `${filteredStudents.length} students`}
          </span>
        </div>

        {filterOpen ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Class</span>
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setSectionFilter("All");
                }}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800"
              >
                <option value="All">All Classes</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Section</span>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800"
              >
                {sectionsForClass.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Sections" : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800"
              >
                <option value="All">All Students</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        ) : null}

        {showStudentList ? (
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#144835]">
                Select a student
              </p>
              <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                {filteredStudents.length} student{filteredStudents.length === 1 ? "" : "s"}
              </span>
            </div>
            <div>
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
                  <tr>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 w-10 text-center">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 w-28">
                      Adm. No.
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Student Name
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Father&apos;s Name
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Class
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 w-24 text-center">
                      Section
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 w-20 text-center">
                      Status
                    </th>
                    <th className="w-10" aria-hidden />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayStudents.map((s, index) => {
                    const initials = s.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("");
                    const isSelected = selectedId === s.id;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelectStudent(s.id, s.admissionNo, s.name)}
                        className={cn(
                          "cursor-pointer transition-colors group",
                          isSelected ? "bg-[#144835]/10" : "hover:bg-[#144835]/5"
                        )}
                      >
                        <td className="px-3 py-2.5 text-center text-[11px] font-bold text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700 font-mono">
                            {s.admissionNo}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0",
                                isSelected
                                  ? "bg-[#144835] text-white"
                                  : "bg-[#144835]/10 text-[#144835] group-hover:bg-[#144835]/15"
                              )}
                            >
                              {initials || "?"}
                            </div>
                            <span className="text-sm font-bold text-gray-900 truncate">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-600 max-w-[200px]">
                          <span className="truncate block">{s.fatherName || "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-700">
                          {s.className}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {s.section && s.section !== "—" ? (
                            <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase">
                              {s.section}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                              s.status === "Active"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <ChevronRight
                            size={16}
                            className={cn(
                              "inline-block text-gray-300 transition-colors",
                              isSelected ? "text-[#144835]" : "group-hover:text-[#144835]"
                            )}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {student ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#144835]/20 bg-[#144835]/5 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-900 truncate">
                {student.name ?? student.studentName}
              </p>
              <p className="text-[11px] font-semibold text-gray-500">
                Adm. {student.admissionNo} · {classLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStudent(null);
                setSelectedId(null);
                setStudentLoadError(null);
              }}
              className="shrink-0 h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Change student
            </button>
          </div>
        ) : null}
      </div>

      {studentLoadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {studentLoadError}
        </div>
      ) : null}

      {showEmptyPlaceholder && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Wallet size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">
            Search by admission number or name, or pick a class and section to browse students.
          </p>
        </div>
      )}

      {studentLoading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center animate-pulse">
          <p className="text-sm font-bold text-gray-400">Loading student…</p>
        </div>
      )}

      {student && !studentLoading && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Student card */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#144835]/5 to-transparent flex gap-4">
                <div className="h-20 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <User size={28} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold text-gray-900 truncate">
                    {student.name ?? student.studentName}
                  </h2>
                  <p className="text-xs font-bold text-[#144835] mt-0.5">{classLabel}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-1">Adm. {student.admissionNo ?? "—"}</p>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Info icon={Users} label="Father" value={String(student.fatherName ?? "—")} />
                <Info icon={Building2} label="Student Type" value={studentBoardingCategory(student)} />
                <Info icon={Users} label="Admission Type" value={admissionType} />
                <Info icon={Phone} label="Mobile" value={String(mobile)} />
                <Info icon={Users} label="Sibling" value={siblingText} />
                {usesTransport && (
                  <>
                    <Info icon={Bus} label="Transport" value={String(student.transportDetails?.busNo ?? "—")} />
                    <Info icon={MapPin} label="Route" value={String(student.transportDetails?.route ?? "—")} />
                  </>
                )}
                <div className="sm:col-span-2">
                  <Info icon={MapPin} label="Address" value={String(address)} />
                </div>
              </div>
              <div className="p-4 pt-0 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  className="flex-1 min-w-[120px] h-10 rounded-xl bg-[#144835] text-white text-xs font-extrabold uppercase tracking-wide hover:bg-[#0f3a2a] transition-colors shadow-sm"
                >
                  Pay Fee
                </button>
                <SafeLink
                  href={`${base}/academic/students/${student.id}/profile?tab=Fee%20Details`}
                  className="flex-1 min-w-[120px] h-10 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-extrabold uppercase tracking-wide hover:bg-amber-100 flex items-center justify-center transition-colors"
                >
                  Fee Structure
                </SafeLink>
                <SafeLink
                  href={`${base}/academic/students/${student.id}/profile`}
                  className="flex-1 min-w-[120px] h-10 rounded-xl border border-gray-200 text-gray-700 text-xs font-extrabold uppercase tracking-wide hover:bg-gray-50 flex items-center justify-center transition-colors"
                >
                  Full Profile
                </SafeLink>
              </div>
            </div>

            {/* Transactions */}
            <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[320px]">
              <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100 bg-gray-50/60">
                {TX_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTxTab(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors",
                      txTab === tab ? "bg-[#144835] text-white" : "text-gray-500 hover:bg-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 flex gap-4 text-[11px] font-bold text-gray-500 border-b border-gray-50">
                <span>
                  Receipts: <strong className="text-gray-900">{filteredTx.length}</strong>
                </span>
                <span>
                  Deposited:{" "}
                  <strong className="text-emerald-700">{formatInr(feeStatus.totals.paid)}</strong>
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-100">
                    <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                      <th className="px-3 py-2">Receipt</th>
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Mode</th>
                      <th className="px-3 py-2 text-right">Fine</th>
                      <th className="px-3 py-2">Transaction ID</th>
                      <th className="px-3 py-2 w-10 print:hidden"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400 font-semibold">
                          No transactions yet
                        </td>
                      </tr>
                    ) : (
                      filteredTx.map((r) => {
                        const txnId = transactionIdForRow(r.mode, r.reference);
                        return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-bold text-gray-800">{r.receiptNo}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-600">{r.month}</td>
                          <td className="px-3 py-2.5 text-gray-500">{formatLegacyTxDate(r.date)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-[#144835]">
                            {formatInr(r.amount)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-gray-600">{r.mode}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-600">
                            {formatInr(r.fine)}
                          </td>
                          <td
                            className="px-3 py-2.5 font-mono text-[11px] text-gray-500 truncate max-w-[140px]"
                            title={txnId || undefined}
                          >
                            {txnId}
                          </td>
                          <td className="px-2 py-2.5 print:hidden">
                            <button
                              type="button"
                              onClick={() => openReceipt(r)}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-[#144835]/5 hover:text-[#144835] hover:border-[#144835]/30"
                              title="Print receipt"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { label: "Student Type", value: studentBoardingCategory(student) },
              {
                label: "Annual Fee",
                value: formatInr(feeStatus.totals.gross),
                accent: "text-gray-900",
              },
              {
                label: "Total Discounted",
                value: formatInr(feeStatus.totals.discount),
                accent: "text-sky-700",
              },
              { label: "Total Due", value: formatInr(feeStatus.totals.fee), accent: "text-gray-900" },
              {
                label: "Total Amount Deposited",
                value: formatInr(feeStatus.totals.paid),
                accent: "text-emerald-700",
              },
              {
                label: "Late Fine",
                value: formatInr(feeStatus.totals.lateFine),
                accent: feeStatus.totals.lateFine > 0 ? "text-amber-700" : "text-gray-900",
              },
              { label: "Balance", value: formatInr(feeStatus.totals.balance), accent: "text-rose-600" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
                <p className={cn("text-base font-extrabold mt-1", item.accent ?? "text-gray-900")}>{item.value}</p>
              </div>
            ))}
          </div>

          {feeStatus.totals.lastYearDue > 0 && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
              Last year dues: {formatInr(feeStatus.totals.lastYearDue)}
            </p>
          )}

          {!hasConfiguredFees && feeStatus.totals.fee === 0 ? (
            <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
              No fee structure saved for this student yet. Fees shown below use the class template if available — open{" "}
              <SafeLink href={`${base}/academic/students/${student.id}/profile?tab=Fee%20Details`} className="underline">
                Fee Details
              </SafeLink>{" "}
              to set or adjust amounts.
            </p>
          ) : null}

          {/* Fee status table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-extrabold text-gray-900">School Fee Status</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFeeStructureOpen(true)}
                  className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-800 text-[11px] font-bold hover:bg-gray-50 flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet size={14} className="text-gray-500" />
                  See Payable Fee Structure
                </button>
                <SafeLink
                  href={`${base}/academic/students/${student.id}/profile?tab=Fee%20Details`}
                  className="h-8 px-3 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-700 flex items-center gap-1.5"
                >
                  <Receipt size={14} />
                  Fee Structure
                </SafeLink>
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  className="h-8 px-3 rounded-lg bg-[#144835] text-white text-[11px] font-bold hover:bg-[#0f3a2a] flex items-center gap-1.5"
                >
                  <IndianRupee size={14} />
                  Pay Fee
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-center text-xs border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-[#144835] text-white">
                    <th className="px-3 py-2.5 text-left font-bold sticky left-0 bg-[#144835] z-10 min-w-[120px] !text-white border border-white/25">
                      Head
                    </th>
                    {FEE_MONTHS.map((m) => (
                      <th key={m} className="px-1.5 py-2.5 font-bold text-[10px] !text-white border border-white/25">
                        {m}
                      </th>
                    ))}
                    <th className="px-2 py-2.5 font-bold bg-[#0f3a2a] !text-white border border-white/25">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: "Total Fee", values: feeStatus.totalFee, variant: "fee" as const },
                      { label: "Bus Fee", values: feeStatus.busFee, variant: "bus" as const },
                      { label: "Paid Fee", values: feeStatus.paidFee, variant: "paid" as const },
                      { label: "Balance", values: feeStatus.balance, variant: "balance" as const },
                    ] as const
                  ).map((row, rowIdx) => (
                    <tr key={row.label} className={cn(rowIdx % 2 === 1 && "bg-gray-50/50")}>
                      <td
                        className={cn(
                          "px-3 py-2 text-left font-extrabold text-gray-800 sticky left-0 z-10 border border-gray-300",
                          rowIdx % 2 === 1 ? "bg-gray-50" : "bg-white"
                        )}
                      >
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-1 py-2 border border-gray-300">
                          <MonthCell value={v} variant={row.variant} />
                        </td>
                      ))}
                      <td className="px-2 py-2 font-extrabold bg-gray-50 border border-gray-300">
                        {row.variant === "balance" ? (
                          <span className="text-rose-600">{sumRow(row.values).toLocaleString("en-IN")}</span>
                        ) : (
                          <MonthCell value={sumRow(row.values)} variant={row.variant === "bus" ? "bus" : row.variant === "paid" ? "paid" : "fee"} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pay fee modal */}
      {payOpen && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Pay Fee</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{student.name ?? student.studentName}</p>
              </div>
              <button type="button" onClick={() => setPayOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePayFee} className="p-5 space-y-4">
              {payError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {payError}
                </p>
              )}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Amount (₹)</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Fee Month</label>
                  <select
                    value={payForm.month}
                    onChange={(e) => setPayForm((f) => ({ ...f, month: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                  >
                    {FEE_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Mode</label>
                  <select
                    value={payForm.mode}
                    onChange={(e) => setPayForm((f) => ({ ...f, mode: e.target.value as (typeof PAYMENT_MODES)[number] }))}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Remark (optional)</label>
                <input
                  value={payForm.remark}
                  onChange={(e) => setPayForm((f) => ({ ...f, remark: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                  placeholder="Optional note"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySaving}
                  className="flex-1 h-10 rounded-xl bg-[#144835] text-white text-sm font-extrabold hover:bg-[#0f3a2a] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paySaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PayableFeeStructureModal
        open={feeStructureOpen && Boolean(student)}
        onClose={() => setFeeStructureOpen(false)}
        studentName={String(student?.name ?? student?.studentName ?? "Student")}
        feeGrid={hasFeeGridData(student?.feeDetails?.feeGrid) ? (student?.feeDetails?.feeGrid as FeeGridRow[]) : feeGrid}
        lastYearDue={student?.feeDetails?.lastYearDue}
        transportFees={student?.transportDetails?.fees}
      />

      <FeeReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
        template={receiptTemplate}
      />
    </div>
  );
}

function sumRow(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

function Info({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex gap-2 items-start">
      <Icon size={14} className="text-[#144835] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-xs font-bold text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Contact,
  CreditCard,
  FileBadge,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Receipt,
  RefreshCw,
  Save,
  Wallet,
} from "lucide-react";
import Term1ReportCard from "@/components/admin/marks/Term1ReportCard";
import Term2ReportCard from "@/components/admin/marks/Term2ReportCard";
import Pt1ReportCard from "@/components/admin/marks/Pt1ReportCard";
import {
  DOCUMENT_TEMPLATE_CATALOG,
  DOCUMENT_TEMPLATE_CATEGORIES,
  defaultReportCardTemplate,
  defaultTerm2ReportCardTemplate,
  defaultPt1ReportCardTemplate,
  loadDocumentTemplates,
  saveDocumentTemplates,
  type DocumentTemplateCategory,
  type DocumentTemplateKind,
  type ReportCardTemplateSettings,
} from "@/lib/documentTemplatesStore";
import {
  emptyCoScholastic,
  type Term1ReportCardData,
} from "@/lib/term1ReportCard";
import { type Term2ReportCardData } from "@/lib/term2ReportCard";
import { type Pt1ReportCardData } from "@/lib/pt1ReportCard";
import { settingsBasePath } from "@/components/admin/settings/settingsNavigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SafeLink = Link as any;

const KIND_ICONS: Record<DocumentTemplateKind, typeof FileText> = {
  "report-card": FileBadge,
  "report-card-term2": FileBadge,
  "report-card-pt1": FileBadge,
  "admit-card": BadgeCheck,
  "id-card": Contact,
  payslip: Wallet,
  "fee-receipt": Receipt,
  certificate: CreditCard,
};

const CATEGORY_ICONS: Record<DocumentTemplateCategory, typeof FileText> = {
  academic: GraduationCap,
  identity: Contact,
  "finance-hr": Receipt,
};

const CATEGORY_COLORS: Record<
  DocumentTemplateCategory,
  { badge: string; ring: string; soft: string }
> = {
  academic: {
    badge: "bg-blue-50 text-blue-700",
    ring: "ring-blue-100",
    soft: "border-blue-100 bg-blue-50/40",
  },
  identity: {
    badge: "bg-violet-50 text-violet-700",
    ring: "ring-violet-100",
    soft: "border-violet-100 bg-violet-50/40",
  },
  "finance-hr": {
    badge: "bg-teal-50 text-teal-700",
    ring: "ring-teal-100",
    soft: "border-teal-100 bg-teal-50/40",
  },
};

const VALID_KINDS = new Set<DocumentTemplateKind>(
  DOCUMENT_TEMPLATE_CATALOG.map((item) => item.kind)
);

function parseTemplateKind(value: string | null): DocumentTemplateKind | null {
  if (!value) return null;
  return VALID_KINDS.has(value as DocumentTemplateKind)
    ? (value as DocumentTemplateKind)
    : null;
}

type DocumentTemplatesPanelProps = {
  schoolId: string;
  onSaved?: () => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#144835] focus:bg-white focus:ring-2 focus:ring-[#144835]/10";

function samplePt1ReportCard(template: ReportCardTemplateSettings): Pt1ReportCardData {
  return {
    schoolName: template.schoolName,
    schoolAddress: template.schoolAddress,
    affiliationNo: template.affiliationNo,
    academicYear: "2025-2026",
    assessmentTitle: template.assessmentTitle || "PERIODIC ASSESSMENT – I",
    studentName: "ABHINAV RAM REDDY AKKALA",
    className: "IV",
    sectionName: "TITAN",
    house: "VAAYU",
    subjects: [
      { subject: "ENGLISH", grade: "A1" },
      { subject: "HINDI", grade: "A1" },
      { subject: "TELUGU", grade: "A1" },
      { subject: "MATHEMATICS", grade: "A1" },
      { subject: "SCIENCE", grade: "A1" },
      { subject: "SOCIAL STUDIES", grade: "A1" },
      { subject: "ICT", grade: "A1" },
    ],
    remarks: "",
    generatedOn: "16-07-2026",
    schoolLogoUrl: template.schoolLogoUrl,
    showSchoolLogo: template.showSchoolLogo,
  };
}

function sampleTerm2ReportCard(template: ReportCardTemplateSettings): Term2ReportCardData {
  const half = (total: number, grade: string) => ({
    pa: 5,
    se: 5,
    ma: 5,
    nb: 5,
    term: total - 20,
    total,
    grade,
  });
  return {
    schoolName: template.schoolName,
    schoolSubtitle1: template.schoolSubtitle1,
    schoolSubtitle2: template.schoolSubtitle2,
    schoolAddress: template.schoolAddress,
    affiliationNo: template.affiliationNo,
    udiseCode: template.udiseCode,
    academicYear: "2025-2026",
    profileTitle: template.profileTitle || "PERFORMANCE PROFILE",
    studentName: "ACHHUTHA SASI PRIYA",
    admissionNo: "1038",
    fatherName: "A MUSALAIH",
    motherName: "A SWAPNA",
    classSection: "III-MARS(CO-SPARK)",
    className: "III",
    sectionName: "MARS(CO-SPARK)",
    aadharNo: "352024416830",
    dateOfBirth: "11 May, 2018",
    house: "PRITHVI",
    residentialAddress: "GATTIVARIPALEM,NIZAMPATNAM",
    telephoneNo: "7330797807",
    heightCm: "115",
    weightKg: "25",
    scholastic: [
      {
        subject: "ENGLISH",
        term1: half(90, "A2"),
        term2: half(94, "A1"),
        grandTotal: 184,
        finalGrade: "A1",
      },
      {
        subject: "HINDI",
        term1: half(90, "A2"),
        term2: half(96, "A1"),
        grandTotal: 186,
        finalGrade: "A1",
      },
      {
        subject: "TELUGU",
        term1: half(98, "A1"),
        term2: half(92, "A1"),
        grandTotal: 190,
        finalGrade: "A1",
      },
      {
        subject: "MATHEMATICS",
        term1: half(100, "A1"),
        term2: half(100, "A1"),
        grandTotal: 200,
        finalGrade: "A1",
      },
      {
        subject: "SOCIAL",
        term1: half(100, "A1"),
        term2: half(94, "A1"),
        grandTotal: 194,
        finalGrade: "A1",
      },
      {
        subject: "EVS",
        term1: half(96, "A1"),
        term2: half(99, "A1"),
        grandTotal: 195,
        finalGrade: "A1",
      },
      {
        subject: "ICT",
        term1: half(86, "A2"),
        term2: half(96, "A1"),
        grandTotal: 182,
        finalGrade: "A1",
      },
    ],
    gradeOnlySubjects: [
      { subject: "GK", grade: "A1" },
      { subject: "ROBOTICS", grade: "A1" },
      { subject: "SPACE", grade: "A1" },
    ],
    coScholastic: emptyCoScholastic().map((r, i) => ({
      ...r,
      grade: ["A", "A", "A", "A", "A", "A"][i] ?? "A",
    })),
    disciplineGrade: "A",
    workingDays: 223,
    daysPresent: null,
    remarks:
      "High achiever across all subjects. Leadership qualities evident. Maintains respectful and disciplined conduct, setting a positive example.",
    generatedOn: "10/04/2026",
    schoolLogoUrl: template.schoolLogoUrl,
    boardLogoUrl: template.boardLogoUrl,
    showSchoolLogo: template.showSchoolLogo,
    showBoardLogo: template.showBoardLogo,
  };
}

function sampleReportCard(template: ReportCardTemplateSettings): Term1ReportCardData {
  return {
    schoolName: template.schoolName,
    schoolSubtitle1: template.schoolSubtitle1,
    schoolSubtitle2: template.schoolSubtitle2,
    schoolAddress: template.schoolAddress,
    affiliationNo: template.affiliationNo,
    udiseCode: template.udiseCode,
    academicYear: "2025-2026",
    termTitle: template.defaultTermTitle,
    studentName: "ACHHUTHA SASI PRIYA",
    admissionNo: "1038",
    fatherName: "A MUSALAIH",
    motherName: "A SWAPNA",
    classSection: "III-MARS(CO-SPARK)",
    aadharNo: "352024416830",
    dateOfBirth: "11 May, 2018",
    house: "PRITHVI",
    residentialAddress: "GATTIVARIPALEM,NIZAMPATNAM",
    telephoneNo: "7330797807",
    scholastic: [
      { subject: "ENGLISH", pa: 5, se: 5, ma: 5, nb: 5, t1: 70, total: 90, grade: "A2" },
      { subject: "HINDI", pa: 5, se: 5, ma: 5, nb: 5, t1: 70, total: 90, grade: "A2" },
      { subject: "TELUGU", pa: 5, se: 5, ma: 5, nb: 5, t1: 78, total: 98, grade: "A1" },
      { subject: "MATHEMATICS", pa: 5, se: 5, ma: 5, nb: 5, t1: 80, total: 100, grade: "A1" },
      { subject: "SOCIAL", pa: 5, se: 5, ma: 5, nb: 5, t1: 80, total: 100, grade: "A1" },
      { subject: "EVS", pa: 5, se: 5, ma: 5, nb: 5, t1: 76, total: 96, grade: "A1" },
      { subject: "ICT", pa: 5, se: 5, ma: 5, nb: 5, t1: 66, total: 86, grade: "A2" },
    ],
    gradeOnlySubjects: [
      { subject: "GK", grade: "A2" },
      { subject: "ROBOTICS", grade: "B1" },
      { subject: "SPACE", grade: "A1" },
    ],
    coScholastic: emptyCoScholastic().map((r) => ({ ...r, grade: "A" })),
    disciplineGrade: "A",
    workingDays: 123,
    daysPresent: 120,
    remarks: "",
    generatedOn: "21/11/2025",
    schoolLogoUrl: template.schoolLogoUrl,
    boardLogoUrl: template.boardLogoUrl,
    showSchoolLogo: template.showSchoolLogo,
    showBoardLogo: template.showBoardLogo,
  };
}

function TemplatesHub({
  onOpen,
}: {
  onOpen: (kind: DocumentTemplateKind) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="h-10 w-10 rounded-xl bg-white ring-4 ring-emerald-100 flex items-center justify-center text-[#144835] shrink-0">
          <LayoutTemplate size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Templates</h3>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            Choose a document type to open its own template page. Each type keeps its own layout,
            size and letterhead settings.
          </p>
        </div>
      </div>

      {DOCUMENT_TEMPLATE_CATEGORIES.map((category) => {
        const CategoryIcon = CATEGORY_ICONS[category.id];
        const colors = CATEGORY_COLORS[category.id];
        const items = DOCUMENT_TEMPLATE_CATALOG.filter((item) => item.category === category.id);

        return (
          <section key={category.id} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg bg-white flex items-center justify-center ring-4 text-[#144835]",
                  colors.ring
                )}
              >
                <CategoryIcon size={15} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{category.label}</h4>
                <p className="text-[11px] text-gray-500">{category.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item) => {
                const Icon = KIND_ICONS[item.kind];
                return (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => onOpen(item.kind)}
                    className="text-left rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[#144835]/40 hover:shadow-[0_8px_24px_rgba(20,72,53,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-9 w-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                            colors.badge
                          )}
                        >
                          {item.categoryLabel}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                            item.status === "ready" && "bg-emerald-50 text-emerald-700",
                            item.status === "linked" && "bg-sky-50 text-sky-700",
                            item.status === "planned" && "bg-amber-50 text-amber-700"
                          )}
                        >
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-3">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 truncate">
                          Used in: <span className="text-gray-700">{item.usesFor}</span>
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 truncate">
                          Size: <span className="text-gray-700">{item.sizeHint}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#144835] shrink-0">
                        Open
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ReportCardTemplatePage({
  schoolId,
  onSaved,
  backHref,
}: {
  schoolId: string;
  onSaved?: () => void;
  backHref: string;
}) {
  const [reportCard, setReportCard] = useState<ReportCardTemplateSettings>(() =>
    defaultReportCardTemplate(schoolId)
  );
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previewData = useMemo(() => sampleReportCard(reportCard), [reportCard]);
  const reportCardsHref = `/schools/${schoolId}/admin/academic/marks/report-cards`;

  useEffect(() => {
    const state = loadDocumentTemplates(schoolId);
    setReportCard(state.reportCard);
    setLoaded(true);
  }, [schoolId]);

  const saveReportCard = () => {
    setSaving(true);
    try {
      const current = loadDocumentTemplates(schoolId);
      saveDocumentTemplates(schoolId, { ...current, reportCard });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-gray-500">Loading report card template…</p>;
  }

  return (
    <div className="space-y-5">
      <SafeLink
        href={backHref}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
      >
        <ArrowLeft size={14} />
        Back to Templates
      </SafeLink>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-1">
              Academic · Report Cards
            </p>
            <h3 className="text-sm font-bold text-gray-900">Report card template</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              CBSE Term-I layout (29.7 × 21 cm). Letterhead below is used from Marks → Report Cards.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SafeLink
              href={reportCardsHref}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
            >
              Open Report Cards
              <ChevronRight size={14} />
            </SafeLink>
            <button
              type="button"
              onClick={() => setReportCard(defaultReportCardTemplate(schoolId))}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={13} />
              Reset
            </button>
            <button
              type="button"
              onClick={saveReportCard}
              disabled={saving}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              Save template
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
          <p className="text-xs font-medium text-emerald-900">
            Active layout: <span className="font-bold">Term-I CBSE Report Card (Grades I–X)</span>
            <span className="text-emerald-800"> · 29.7 × 21 cm</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="School Name">
            <input
              className={inputCls}
              value={reportCard.schoolName}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolName: e.target.value }))}
            />
          </Field>
          <Field label="Default Term Title">
            <input
              className={inputCls}
              value={reportCard.defaultTermTitle}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, defaultTermTitle: e.target.value }))
              }
            />
          </Field>
          <Field label="CBSE Affiliation No.">
            <input
              className={inputCls}
              value={reportCard.affiliationNo}
              onChange={(e) => setReportCard((p) => ({ ...p, affiliationNo: e.target.value }))}
            />
          </Field>
          <Field label="UDISE Code">
            <input
              className={inputCls}
              value={reportCard.udiseCode}
              onChange={(e) => setReportCard((p) => ({ ...p, udiseCode: e.target.value }))}
            />
          </Field>
          <Field label="Subtitle Line 1">
            <input
              className={inputCls}
              value={reportCard.schoolSubtitle1}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, schoolSubtitle1: e.target.value }))
              }
            />
          </Field>
          <Field label="Subtitle Line 2">
            <input
              className={inputCls}
              value={reportCard.schoolSubtitle2}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, schoolSubtitle2: e.target.value }))
              }
            />
          </Field>
          <Field label="School Address">
            <input
              className={inputCls}
              value={reportCard.schoolAddress}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolAddress: e.target.value }))}
            />
          </Field>
          <Field label="School Logo URL">
            <input
              className={inputCls}
              value={reportCard.schoolLogoUrl}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolLogoUrl: e.target.value }))}
              placeholder="/idps-report-card-school-logo.png"
            />
          </Field>
          <Field label="Board Logo URL">
            <input
              className={inputCls}
              value={reportCard.boardLogoUrl}
              onChange={(e) => setReportCard((p) => ({ ...p, boardLogoUrl: e.target.value }))}
              placeholder="/images/cbse-logo.png"
            />
          </Field>
          <Field label="Logo Options">
            <div className="space-y-2 mt-1">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-bold text-gray-800">Show school logo</span>
                <input
                  type="checkbox"
                  checked={reportCard.showSchoolLogo}
                  onChange={(e) =>
                    setReportCard((p) => ({ ...p, showSchoolLogo: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#144835]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-bold text-gray-800">Show CBSE logo</span>
                <input
                  type="checkbox"
                  checked={reportCard.showBoardLogo}
                  onChange={(e) =>
                    setReportCard((p) => ({ ...p, showBoardLogo: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#144835]"
                />
              </label>
            </div>
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 overflow-auto max-h-[640px]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">
            Live Preview · Term I (Grades I–X)
          </p>
          <div className="origin-top-left scale-[0.72] sm:scale-[0.82] w-[139%] sm:w-[122%]">
            <Term1ReportCard data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Term2ReportCardTemplatePage({
  schoolId,
  onSaved,
  backHref,
}: {
  schoolId: string;
  onSaved?: () => void;
  backHref: string;
}) {
  const [reportCard, setReportCard] = useState<ReportCardTemplateSettings>(() =>
    defaultTerm2ReportCardTemplate(schoolId)
  );
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previewData = useMemo(() => sampleTerm2ReportCard(reportCard), [reportCard]);
  const reportCardsHref = `/schools/${schoolId}/admin/academic/marks/report-cards`;

  useEffect(() => {
    const state = loadDocumentTemplates(schoolId);
    setReportCard(state.reportCardTerm2);
    setLoaded(true);
  }, [schoolId]);

  const saveReportCard = () => {
    setSaving(true);
    try {
      const current = loadDocumentTemplates(schoolId);
      saveDocumentTemplates(schoolId, {
        ...current,
        reportCardTerm2: { ...reportCard, layoutId: "term2-cbse" },
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
        Loading Term-II template…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SafeLink
          href={backHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
        >
          <ArrowLeft size={14} />
          Back to Templates
        </SafeLink>
        <div className="flex items-center gap-2">
          <SafeLink
            href={reportCardsHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
          >
            Open Report Cards
            <ChevronRight size={14} />
          </SafeLink>
          <button
            type="button"
            onClick={saveReportCard}
            disabled={saving}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 disabled:opacity-60"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            Save template
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5 flex items-center gap-2">
        <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
        <p className="text-xs font-medium text-emerald-900">
          Active layout:{" "}
          <span className="font-bold">Term-II PERFORMANCE PROFILE (Grades I–XII)</span>
          <span className="text-emerald-800"> · 4 pages · 29.7 × 21 cm</span>
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="School Name">
            <input
              className={inputCls}
              value={reportCard.schoolName}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolName: e.target.value }))}
            />
          </Field>
          <Field label="Profile Title">
            <input
              className={inputCls}
              value={reportCard.profileTitle || "PERFORMANCE PROFILE"}
              onChange={(e) => setReportCard((p) => ({ ...p, profileTitle: e.target.value }))}
            />
          </Field>
          <Field label="CBSE Affiliation No.">
            <input
              className={inputCls}
              value={reportCard.affiliationNo}
              onChange={(e) => setReportCard((p) => ({ ...p, affiliationNo: e.target.value }))}
            />
          </Field>
          <Field label="UDISE Code">
            <input
              className={inputCls}
              value={reportCard.udiseCode}
              onChange={(e) => setReportCard((p) => ({ ...p, udiseCode: e.target.value }))}
            />
          </Field>
          <Field label="Subtitle Line 1">
            <input
              className={inputCls}
              value={reportCard.schoolSubtitle1}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, schoolSubtitle1: e.target.value }))
              }
            />
          </Field>
          <Field label="Subtitle Line 2">
            <input
              className={inputCls}
              value={reportCard.schoolSubtitle2}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, schoolSubtitle2: e.target.value }))
              }
            />
          </Field>
          <Field label="School Address">
            <input
              className={inputCls}
              value={reportCard.schoolAddress}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolAddress: e.target.value }))}
            />
          </Field>
          <Field label="School Logo URL">
            <input
              className={inputCls}
              value={reportCard.schoolLogoUrl}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolLogoUrl: e.target.value }))}
              placeholder="/idps-report-card-school-logo.png"
            />
          </Field>
          <Field label="Board Logo URL">
            <input
              className={inputCls}
              value={reportCard.boardLogoUrl}
              onChange={(e) => setReportCard((p) => ({ ...p, boardLogoUrl: e.target.value }))}
              placeholder="/images/cbse-logo.png"
            />
          </Field>
          <Field label="Logo Options">
            <div className="space-y-2 mt-1">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-bold text-gray-800">Show school logo</span>
                <input
                  type="checkbox"
                  checked={reportCard.showSchoolLogo}
                  onChange={(e) =>
                    setReportCard((p) => ({ ...p, showSchoolLogo: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#144835]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-bold text-gray-800">Show CBSE logo</span>
                <input
                  type="checkbox"
                  checked={reportCard.showBoardLogo}
                  onChange={(e) =>
                    setReportCard((p) => ({ ...p, showBoardLogo: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#144835]"
                />
              </label>
            </div>
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 overflow-auto max-h-[640px]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">
            Live Preview · Term II (4 pages · Grades I–XII)
          </p>
          <div className="origin-top-left scale-[0.72] sm:scale-[0.82] w-[139%] sm:w-[122%]">
            <Term2ReportCard data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pt1ReportCardTemplatePage({
  schoolId,
  onSaved,
  backHref,
}: {
  schoolId: string;
  onSaved?: () => void;
  backHref: string;
}) {
  const [reportCard, setReportCard] = useState<ReportCardTemplateSettings>(() =>
    defaultPt1ReportCardTemplate(schoolId)
  );
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previewData = useMemo(() => samplePt1ReportCard(reportCard), [reportCard]);
  const reportCardsHref = `/schools/${schoolId}/admin/academic/marks/report-cards`;

  useEffect(() => {
    const state = loadDocumentTemplates(schoolId);
    setReportCard(state.reportCardPt1);
    setLoaded(true);
  }, [schoolId]);

  const saveReportCard = () => {
    setSaving(true);
    try {
      const current = loadDocumentTemplates(schoolId);
      saveDocumentTemplates(schoolId, {
        ...current,
        reportCardPt1: { ...reportCard, layoutId: "pt1-cbse" },
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
        Loading PT template…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SafeLink
          href={backHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
        >
          <ArrowLeft size={14} />
          Back to Templates
        </SafeLink>
        <div className="flex items-center gap-2">
          <SafeLink
            href={reportCardsHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
          >
            Open Report Cards
            <ChevronRight size={14} />
          </SafeLink>
          <button
            type="button"
            onClick={saveReportCard}
            disabled={saving}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 disabled:opacity-60"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            Save template
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5 flex items-center gap-2">
        <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
        <p className="text-xs font-medium text-emerald-900">
          Active layout:{" "}
          <span className="font-bold">Periodic Assessment (Grades I–XII)</span>
          <span className="text-emerald-800"> · A4 portrait · 21 × 29.7 cm</span>
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="School Name">
            <input
              className={inputCls}
              value={reportCard.schoolName}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolName: e.target.value }))}
            />
          </Field>
          <Field label="Assessment Title">
            <input
              className={inputCls}
              value={reportCard.assessmentTitle || "PERIODIC ASSESSMENT – I"}
              onChange={(e) =>
                setReportCard((p) => ({ ...p, assessmentTitle: e.target.value }))
              }
            />
          </Field>
          <Field label="CBSE Affiliation No.">
            <input
              className={inputCls}
              value={reportCard.affiliationNo}
              onChange={(e) => setReportCard((p) => ({ ...p, affiliationNo: e.target.value }))}
            />
          </Field>
          <Field label="School Address">
            <input
              className={inputCls}
              value={reportCard.schoolAddress}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolAddress: e.target.value }))}
            />
          </Field>
          <Field label="School Logo URL">
            <input
              className={inputCls}
              value={reportCard.schoolLogoUrl}
              onChange={(e) => setReportCard((p) => ({ ...p, schoolLogoUrl: e.target.value }))}
              placeholder="/idps-report-card-school-logo.png"
            />
          </Field>
          <Field label="Logo Options">
            <div className="space-y-2 mt-1">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-bold text-gray-800">Show school logo</span>
                <input
                  type="checkbox"
                  checked={reportCard.showSchoolLogo}
                  onChange={(e) =>
                    setReportCard((p) => ({ ...p, showSchoolLogo: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#144835]"
                />
              </label>
            </div>
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 overflow-auto max-h-[720px]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">
            Live Preview · PT (A4 portrait · Grades I–XII)
          </p>
          <div className="origin-top-left scale-[0.62] sm:scale-[0.72] w-[162%] sm:w-[139%]">
            <Pt1ReportCard data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePlaceholderPage({
  kind,
  backHref,
  receiptHref,
}: {
  kind: DocumentTemplateKind;
  backHref: string;
  receiptHref: string;
}) {
  const meta = DOCUMENT_TEMPLATE_CATALOG.find((c) => c.kind === kind);
  if (!meta) return null;

  if (kind === "fee-receipt") {
    return (
      <div className="space-y-5">
        <SafeLink
          href={backHref}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
        >
          <ArrowLeft size={14} />
          Back to Templates
        </SafeLink>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
            Finance &amp; HR · Fee Receipts
          </p>
          <h3 className="text-sm font-bold text-gray-900">Fee receipt template</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Fee receipt letterhead, logo and print preview are managed under{" "}
            <strong>Receipt &amp; Billing</strong> so billing reminders stay in one place.
          </p>
          <SafeLink
            href={receiptHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#144835] px-4 text-xs font-bold text-white"
          >
            Open Receipt &amp; Billing
            <ChevronRight size={14} />
          </SafeLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SafeLink
        href={backHref}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:text-[#144835]"
      >
        <ArrowLeft size={14} />
        Back to Templates
      </SafeLink>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
          {meta.categoryLabel} · {meta.title}
        </p>
        <h3 className="text-sm font-bold text-gray-900">{meta.title} — coming soon</h3>
        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">{meta.description}</p>
        <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
          <li>Category: {meta.categoryLabel}</li>
          <li>Used in: {meta.usesFor}</li>
          <li>Print size: {meta.sizeHint}</li>
        </ul>
      </div>
    </div>
  );
}

export default function DocumentTemplatesPanel({
  schoolId,
  onSaved,
}: DocumentTemplatesPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = parseTemplateKind(searchParams.get("kind"));
  const templatesHref = `${settingsBasePath(schoolId)}?view=templates`;
  const receiptHref = `${settingsBasePath(schoolId)}?view=fee-receipt`;

  const openKind = (nextKind: DocumentTemplateKind) => {
    router.push(`${templatesHref}&kind=${nextKind}`);
  };

  if (!kind) {
    return <TemplatesHub onOpen={openKind} />;
  }

  if (kind === "report-card") {
    return (
      <ReportCardTemplatePage
        schoolId={schoolId}
        onSaved={onSaved}
        backHref={templatesHref}
      />
    );
  }

  if (kind === "report-card-term2") {
    return (
      <Term2ReportCardTemplatePage
        schoolId={schoolId}
        onSaved={onSaved}
        backHref={templatesHref}
      />
    );
  }

  if (kind === "report-card-pt1") {
    return (
      <Pt1ReportCardTemplatePage
        schoolId={schoolId}
        onSaved={onSaved}
        backHref={templatesHref}
      />
    );
  }

  return (
    <TemplatePlaceholderPage
      kind={kind}
      backHref={templatesHref}
      receiptHref={receiptHref}
    />
  );
}

import { DEFAULT_FEE_RECEIPT_TEMPLATE } from "@/lib/feeReceiptTemplate";

export type DocumentTemplateKind =
  | "report-card"
  | "report-card-term2"
  | "report-card-pt1"
  | "admit-card"
  | "id-card"
  | "payslip"
  | "fee-receipt"
  | "certificate";

export type ReportCardTemplateSettings = {
  layoutId: "term1-cbse" | "term2-cbse" | "pt1-cbse";
  schoolName: string;
  schoolSubtitle1: string;
  schoolSubtitle2: string;
  schoolAddress: string;
  affiliationNo: string;
  udiseCode: string;
  schoolLogoUrl: string;
  boardLogoUrl: string;
  showSchoolLogo: boolean;
  showBoardLogo: boolean;
  defaultTermTitle: string;
  /** Term-2 performance profile page title */
  profileTitle?: string;
  /** PT assessment heading e.g. PERIODIC ASSESSMENT – I */
  assessmentTitle?: string;
};

export type DocumentTemplatesState = {
  reportCard: ReportCardTemplateSettings;
  reportCardTerm2: ReportCardTemplateSettings;
  reportCardPt1: ReportCardTemplateSettings;
  activeAdmitCardLayout: "standard" | null;
  activeIdCardLayout: "student" | "staff" | null;
  activePayslipLayout: "monthly" | null;
  activeCertificateLayout: "bonafide" | null;
};

export function documentTemplatesStorageKey(schoolId: string) {
  return `documentTemplates_${schoolId}`;
}

export function defaultReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  const fee = DEFAULT_FEE_RECEIPT_TEMPLATE;
  const isKalaburagi = schoolId === "idpskalaburagi";
  return {
    layoutId: "term1-cbse",
    schoolName: fee.schoolName,
    schoolSubtitle1: "SENIOR SECONDARY SCHOOL (Pre-Primary to XII)",
    schoolSubtitle2: fee.schoolSubtitle2,
    schoolAddress: isKalaburagi
      ? "IDPS Kalaburagi"
      : "AREPALLI ROAD, PONNAPALLI(V), CHERUKUPALLI(M), BAPATLA(DT), AP - 522259",
    affiliationNo: fee.affiliationNo,
    udiseCode: fee.udiseCode,
    schoolLogoUrl: "/idps-report-card-school-logo.png",
    boardLogoUrl: "/images/cbse-logo.png",
    showSchoolLogo: true,
    showBoardLogo: true,
    defaultTermTitle: "TERMINAL - I RESULT",
    profileTitle: "PERFORMANCE PROFILE",
  };
}

export function defaultTerm2ReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  return {
    ...defaultReportCardTemplate(schoolId),
    layoutId: "term2-cbse",
    defaultTermTitle: "TERMINAL - II RESULT",
    profileTitle: "PERFORMANCE PROFILE",
  };
}

export function defaultPt1ReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  return {
    ...defaultReportCardTemplate(schoolId),
    layoutId: "pt1-cbse",
    defaultTermTitle: "PERIODIC ASSESSMENT – I",
    assessmentTitle: "PERIODIC ASSESSMENT – I",
    showBoardLogo: false,
  };
}

export function defaultDocumentTemplates(schoolId: string): DocumentTemplatesState {
  return {
    reportCard: defaultReportCardTemplate(schoolId),
    reportCardTerm2: defaultTerm2ReportCardTemplate(schoolId),
    reportCardPt1: defaultPt1ReportCardTemplate(schoolId),
    activeAdmitCardLayout: null,
    activeIdCardLayout: null,
    activePayslipLayout: null,
    activeCertificateLayout: null,
  };
}

function normalizeReportCard(
  schoolId: string,
  parsed?: Partial<ReportCardTemplateSettings>,
  layout: "term1-cbse" | "term2-cbse" | "pt1-cbse" = "term1-cbse"
): ReportCardTemplateSettings {
  const base =
    layout === "term2-cbse"
      ? defaultTerm2ReportCardTemplate(schoolId)
      : layout === "pt1-cbse"
        ? defaultPt1ReportCardTemplate(schoolId)
        : defaultReportCardTemplate(schoolId);
  const boardLogoUrl =
    !parsed?.boardLogoUrl || parsed.boardLogoUrl === "/cbse-logo.png"
      ? base.boardLogoUrl
      : parsed.boardLogoUrl;
  const defaultTermTitle =
    !parsed?.defaultTermTitle || parsed.defaultTermTitle === "TERM - I EXAMINATION"
      ? base.defaultTermTitle
      : parsed.defaultTermTitle;
  return {
    ...base,
    ...parsed,
    boardLogoUrl,
    defaultTermTitle,
    layoutId: layout,
    profileTitle: parsed?.profileTitle || base.profileTitle,
    assessmentTitle: parsed?.assessmentTitle || base.assessmentTitle,
    showSchoolLogo: parsed?.showSchoolLogo ?? base.showSchoolLogo,
    showBoardLogo: parsed?.showBoardLogo ?? base.showBoardLogo,
  };
}

export function loadDocumentTemplates(schoolId: string): DocumentTemplatesState {
  const base = defaultDocumentTemplates(schoolId);
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(documentTemplatesStorageKey(schoolId));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<DocumentTemplatesState>;
    const term1 = normalizeReportCard(schoolId, parsed.reportCard, "term1-cbse");
    const term2Source = parsed.reportCardTerm2 ?? {
      ...term1,
      layoutId: "term2-cbse" as const,
      defaultTermTitle: "TERMINAL - II RESULT",
      profileTitle: "PERFORMANCE PROFILE",
    };
    const pt1Source = parsed.reportCardPt1 ?? {
      ...term1,
      layoutId: "pt1-cbse" as const,
      defaultTermTitle: "PERIODIC ASSESSMENT – I",
      assessmentTitle: "PERIODIC ASSESSMENT – I",
      showBoardLogo: false,
    };
    return {
      reportCard: term1,
      reportCardTerm2: normalizeReportCard(schoolId, term2Source, "term2-cbse"),
      reportCardPt1: normalizeReportCard(schoolId, pt1Source, "pt1-cbse"),
      activeAdmitCardLayout: parsed.activeAdmitCardLayout ?? null,
      activeIdCardLayout: parsed.activeIdCardLayout ?? null,
      activePayslipLayout: parsed.activePayslipLayout ?? null,
      activeCertificateLayout: parsed.activeCertificateLayout ?? null,
    };
  } catch {
    return base;
  }
}

export function saveDocumentTemplates(schoolId: string, state: DocumentTemplatesState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(documentTemplatesStorageKey(schoolId), JSON.stringify(state));
}

export function loadReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  return loadDocumentTemplates(schoolId).reportCard;
}

export function loadTerm2ReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  return loadDocumentTemplates(schoolId).reportCardTerm2;
}

export function loadPt1ReportCardTemplate(schoolId: string): ReportCardTemplateSettings {
  return loadDocumentTemplates(schoolId).reportCardPt1;
}

export function saveReportCardTemplate(schoolId: string, reportCard: ReportCardTemplateSettings) {
  const current = loadDocumentTemplates(schoolId);
  saveDocumentTemplates(schoolId, { ...current, reportCard });
}

export function saveTerm2ReportCardTemplate(
  schoolId: string,
  reportCardTerm2: ReportCardTemplateSettings
) {
  const current = loadDocumentTemplates(schoolId);
  saveDocumentTemplates(schoolId, { ...current, reportCardTerm2 });
}

export function savePt1ReportCardTemplate(
  schoolId: string,
  reportCardPt1: ReportCardTemplateSettings
) {
  const current = loadDocumentTemplates(schoolId);
  saveDocumentTemplates(schoolId, { ...current, reportCardPt1 });
}

export type DocumentTemplateCategory = "academic" | "identity" | "finance-hr";

export type DocumentTemplateCatalogItem = {
  kind: DocumentTemplateKind;
  title: string;
  description: string;
  category: DocumentTemplateCategory;
  categoryLabel: string;
  usesFor: string;
  sizeHint: string;
  status: "ready" | "linked" | "planned";
  statusLabel: string;
};

export const DOCUMENT_TEMPLATE_CATEGORIES: {
  id: DocumentTemplateCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "academic",
    label: "Academic",
    description: "Exam and student academic print documents",
  },
  {
    id: "identity",
    label: "Identity",
    description: "Student and staff identity documents",
  },
  {
    id: "finance-hr",
    label: "Finance & HR",
    description: "Fee, payroll and billing documents",
  },
];

export const DOCUMENT_TEMPLATE_CATALOG: DocumentTemplateCatalogItem[] = [
  {
    kind: "report-card",
    title: "Term-I Report Cards (I–X)",
    description:
      "Official CBSE Terminal-I landscape mark sheets for grades 1–10 (PA / SE / MA / NB / TERM).",
    category: "academic",
    categoryLabel: "Academic",
    usesFor: "Marks → Report Cards (Term 1)",
    sizeHint: "29.7 × 21 cm (A4 landscape)",
    status: "ready",
    statusLabel: "Active",
  },
  {
    kind: "report-card-term2",
    title: "Term-II Report Cards (I–XII)",
    description:
      "4-page PERFORMANCE PROFILE for grades 1–12 with Terminal I + II totals and grading.",
    category: "academic",
    categoryLabel: "Academic",
    usesFor: "Marks → Report Cards (Term 2)",
    sizeHint: "29.7 × 21 cm × 4 pages",
    status: "ready",
    statusLabel: "Active",
  },
  {
    kind: "report-card-pt1",
    title: "PT Report Cards (I–XII)",
    description:
      "Periodic Assessment portrait cards with subject grades for grades 1–12.",
    category: "academic",
    categoryLabel: "Academic",
    usesFor: "Marks → Report Cards (PT1 / PT2)",
    sizeHint: "21 × 29.7 cm (A4 portrait)",
    status: "ready",
    statusLabel: "Active",
  },
  {
    kind: "admit-card",
    title: "Admit Cards",
    description: "Exam hall tickets with photo, roll number and centre details.",
    category: "academic",
    categoryLabel: "Academic",
    usesFor: "Admission / Examinations",
    sizeHint: "A5 / A4 portrait",
    status: "planned",
    statusLabel: "Coming soon",
  },
  {
    kind: "certificate",
    title: "Certificates",
    description: "Bonafide, transfer and character certificates.",
    category: "academic",
    categoryLabel: "Academic",
    usesFor: "Student certificates",
    sizeHint: "A4 portrait",
    status: "planned",
    statusLabel: "Coming soon",
  },
  {
    kind: "id-card",
    title: "ID Cards",
    description: "Student and staff identity cards for print and mobile preview.",
    category: "identity",
    categoryLabel: "Identity",
    usesFor: "Student / Staff ID",
    sizeHint: "CR80 card",
    status: "planned",
    statusLabel: "Coming soon",
  },
  {
    kind: "fee-receipt",
    title: "Fee Receipts",
    description: "Fee payment receipts — letterhead is managed under Receipt & Billing.",
    category: "finance-hr",
    categoryLabel: "Finance & HR",
    usesFor: "Fees → Receipts",
    sizeHint: "A5 / A4",
    status: "linked",
    statusLabel: "Linked",
  },
  {
    kind: "payslip",
    title: "Payslips",
    description: "Monthly staff salary slips with earning and deduction lines.",
    category: "finance-hr",
    categoryLabel: "Finance & HR",
    usesFor: "Staff payroll",
    sizeHint: "A4 portrait",
    status: "planned",
    statusLabel: "Coming soon",
  },
];

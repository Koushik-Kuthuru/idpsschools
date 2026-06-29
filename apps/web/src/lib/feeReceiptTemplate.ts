export type FeeReceiptLineItem = {
  particular: string;
  amount: number;
};

export type FeeReceiptPrintData = {
  feeMonth: string;
  admissionNo: string;
  date: string;
  studentName: string;
  receiptNo: string;
  fatherName: string;
  mobile: string;
  classSection: string;
  paymentMode: string;
  transactionId?: string;
  lineItems: FeeReceiptLineItem[];
  grandTotal: number;
  balanceUpToMonth: number;
  balanceUpToMonthLabel: string;
  balanceUpToYearEnd: number;
  balanceUpToYearEndLabel: string;
};

export type FeeReceiptTemplateSettings = {
  affiliationNo: string;
  udiseCode: string;
  schoolName: string;
  schoolSubtitle1: string;
  schoolSubtitle2: string;
  schoolAddress: string;
  contactEmail: string;
  contactWebsite: string;
  contactMobile: string;
  signatureLabel: string;
  transactionIdLabel: string;
  duplicateCopies: boolean;
  showLogo: boolean;
  logoUrl: string;
};

export const DEFAULT_FEE_RECEIPT_TEMPLATE: FeeReceiptTemplateSettings = {
  affiliationNo: "130739",
  udiseCode: "28175000344",
  schoolName: "INTERNATIONAL DELHI PUBLIC SCHOOL",
  schoolSubtitle1: "SENIOR SECONDARY SCHOOL (Pre - Primary To XII)",
  schoolSubtitle2: "AFFILIATED TO CENTRAL BOARD OF SECONDARY EDUCATION, NEW DELHI",
  schoolAddress: "AREPALLI ROAD, PONNAPALLI (V), CHERUKUPALLI (M), BAPATLA (DT), AP - 522259",
  contactEmail: "management@idpscherukupalli.com",
  contactWebsite: "www.idpscherukupalli.com",
  contactMobile: "7799797931, 7799797932",
  signatureLabel: "Accountant Singnature",
  transactionIdLabel: "Transuction Id.",
  duplicateCopies: false,
  showLogo: true,
  logoUrl: "/idps-logo.png",
};

export function feeReceiptTemplateStorageKey(schoolId: string) {
  return `feeReceiptTemplate_${schoolId}`;
}

function normalizeTemplate(
  parsed: Partial<FeeReceiptTemplateSettings> & { schoolAddress?: string },
  branchName?: string
): FeeReceiptTemplateSettings {
  const legacySchoolName =
    parsed.schoolName && parsed.schoolName !== "IDPS Cherukupalli" ? parsed.schoolName : undefined;

  return {
    ...DEFAULT_FEE_RECEIPT_TEMPLATE,
    ...parsed,
    schoolName: legacySchoolName || DEFAULT_FEE_RECEIPT_TEMPLATE.schoolName,
    logoUrl: parsed.logoUrl && !parsed.logoUrl.includes("idps-fee-receipt-logo")
      ? parsed.logoUrl
      : DEFAULT_FEE_RECEIPT_TEMPLATE.logoUrl,
    showLogo: parsed.showLogo ?? DEFAULT_FEE_RECEIPT_TEMPLATE.showLogo,
    duplicateCopies: false,
  };
}

export function loadFeeReceiptTemplate(
  schoolId: string,
  _branchName?: string
): FeeReceiptTemplateSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_FEE_RECEIPT_TEMPLATE };
  }
  try {
    const raw = localStorage.getItem(feeReceiptTemplateStorageKey(schoolId));
    if (!raw) return { ...DEFAULT_FEE_RECEIPT_TEMPLATE };
    const parsed = JSON.parse(raw) as Partial<FeeReceiptTemplateSettings>;
    return normalizeTemplate(parsed);
  } catch {
    return { ...DEFAULT_FEE_RECEIPT_TEMPLATE };
  }
}

export function saveFeeReceiptTemplate(schoolId: string, settings: FeeReceiptTemplateSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    feeReceiptTemplateStorageKey(schoolId),
    JSON.stringify({ ...settings, duplicateCopies: false })
  );
}

export function formatReceiptDate(date: string): string {
  if (!date) return "—";
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function balanceYearEndLabel(academicYear?: string): string {
  if (!academicYear) return "March";
  const match = academicYear.match(/(\d{4})\s*[-–]\s*(\d{2,4})/);
  if (match) {
    const end = match[2].length === 2 ? `20${match[2]}` : match[2];
    return `March ${end}`;
  }
  return "March";
}

export function isUpiPaymentMode(mode: string): boolean {
  return String(mode ?? "").toUpperCase().includes("UPI");
}

export const FEE_MONTHS = [
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
  "JAN",
  "FEB",
  "MAR",
] as const;

const FEE_MONTH_NUM: Record<(typeof FEE_MONTHS)[number], number> = {
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
  JAN: 1,
  FEB: 2,
  MAR: 3,
};

/** Map academic-year fee month (APR–MAR) to a calendar date range. */
export function feeMonthDateRange(
  academicYear: string,
  feeMonth: string
): { from: string; to: string } | null {
  const yearMatch = String(academicYear ?? "")
    .trim()
    .match(/^(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/);
  if (!yearMatch) return null;
  const startYear = Number.parseInt(yearMatch[1], 10);
  if (!Number.isFinite(startYear)) return null;
  const endYear = startYear + 1;
  const key = String(feeMonth ?? "")
    .trim()
    .slice(0, 3)
    .toUpperCase() as (typeof FEE_MONTHS)[number];
  const monthNum = FEE_MONTH_NUM[key];
  if (!monthNum) return null;
  const calendarYear = monthNum >= 4 ? startYear : endYear;
  const lastDay = new Date(calendarYear, monthNum, 0).getDate();
  const mm = String(monthNum).padStart(2, "0");
  return {
    from: `${calendarYear}-${mm}-01`,
    to: `${calendarYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export type FeePaymentModeFilter = "all" | "cash" | "upi" | "neft" | "cheque" | "card" | "digital";

export function matchesFeePaymentMode(mode: string, filter: FeePaymentModeFilter): boolean {
  if (filter === "all") return true;
  const m = String(mode ?? "").toLowerCase();
  if (filter === "cash") return m.includes("cash");
  if (filter === "upi") return m.includes("upi");
  if (filter === "neft") return m.includes("neft") || m.includes("bank") || m.includes("rtgs") || m.includes("imps");
  if (filter === "cheque") return m.includes("cheq");
  if (filter === "card") return m.includes("card") || m.includes("credit") || m.includes("debit");
  if (filter === "digital") {
    return (
      m.includes("upi") ||
      m.includes("neft") ||
      m.includes("bank") ||
      m.includes("card") ||
      m.includes("credit") ||
      m.includes("rtgs") ||
      m.includes("imps")
    );
  }
  return true;
}

export type FeeGridRow = {
  name: string;
  method?: string;
  values: string[];
};

export type FeeReceiptRow = {
  id: string;
  receiptNo: string;
  month: string;
  date: string;
  /** Exact date text from source Excel (e.g. "19 January 2026"). */
  dateDisplay?: string;
  /** Time from source when available (HH:mm:ss). */
  time?: string;
  amount: number;
  mode: string;
  fine: number;
  status: string;
  studentId?: string;
  studentName?: string;
  admissionNo?: string;
  collectedBy?: string;
  collectedByName?: string;
  remark?: string;
  reference?: string;
  /** UPI / NEFT / gateway transaction id from Excel Trans. No. */
  transNo?: string;
  transactionId?: string;
  particular?: string;
  exHead?: string;
  academicYear?: string;
  lineItems?: Array<{ particular?: string; amount?: string | number }>;
};

/** Lump receipts from discount/transport summary imports — not real abc transaction rows. */
export function isSyntheticImportedReceipt(receipt: {
  reference?: string;
  receiptNo?: string;
  id?: string;
}): boolean {
  const ref = String(receipt.reference ?? "").toLowerCase();
  const no = String(receipt.receiptNo ?? "").toUpperCase();
  const id = String(receipt.id ?? "").toUpperCase();
  if (ref.startsWith("discount-excel-")) return true;
  if (ref.startsWith("transport-fee-collection-excel-")) return true;
  if (no.startsWith("EX-") || no.startsWith("TF-")) return true;
  if (id.startsWith("RCP-EXCEL-") || id.startsWith("RCP-TRANSPORT-")) return true;
  return false;
}

const MONTH_NAME_TO_ABBR: Record<string, string> = {
  JAN: "JAN",
  JANUARY: "JAN",
  FEB: "FEB",
  FEBRUARY: "FEB",
  MAR: "MAR",
  MARCH: "MAR",
  APR: "APR",
  APRIL: "APR",
  MAY: "MAY",
  JUN: "JUN",
  JUNE: "JUN",
  JUL: "JUL",
  JULY: "JUL",
  AUG: "AUG",
  AUGUST: "AUG",
  SEP: "SEP",
  SEPT: "SEP",
  SEPTEMBER: "SEP",
  OCT: "OCT",
  OCTOBER: "OCT",
  NOV: "NOV",
  NOVEMBER: "NOV",
  DEC: "DEC",
  DECEMBER: "DEC",
};

/** Excel fee-month labels → short range (APRIL-OCTOBER → APR-OCT, JULY → JUL). */
export function formatFeeMonthRange(monthRaw: string): string {
  const text = String(monthRaw ?? "").trim();
  if (!text || text === "—") return "—";
  const parts = text.split(/[-–/]| TO /i).map((p) => p.trim()).filter(Boolean);
  const abbr = parts.map((part) => {
    const key = part.toUpperCase();
    if (MONTH_NAME_TO_ABBR[key]) return MONTH_NAME_TO_ABBR[key];
    const idx = monthIndexFromLabel(key);
    return idx >= 0 ? FEE_MONTHS[idx] : key.slice(0, 3);
  });
  return abbr.join("-") || "—";
}

/** Rec No. like school Excel: S-2537 / E-1321 (E = food/extra head). */
export function formatReceiptNumber(
  receiptNo: string,
  meta?: { exHead?: string; particular?: string; remark?: string }
): string {
  const raw = String(receiptNo ?? "").trim();
  if (!raw) return "—";
  if (/^[SE]-/i.test(raw)) {
    return raw.replace(/^s-/i, "S-").replace(/^e-/i, "E-");
  }
  const num = raw.replace(/\D/g, "");
  if (!num) return raw;
  const hint = `${meta?.exHead ?? ""} ${meta?.particular ?? ""} ${meta?.remark ?? ""}`.toUpperCase();
  const prefix = /\bFOOD\b/.test(hint) ? "E-" : "S-";
  return `${prefix}${num}`;
}

/** Date as DD-MM-YY (Excel fee receipt style). */
export function formatTxnDateDmy(row: Pick<FeeReceiptRow, "date" | "dateDisplay">): string {
  const iso = String(row.date ?? "").trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y.slice(2)}`;
  }
  const display = String(row.dateDisplay ?? "").trim();
  const match = display.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const cal = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ].indexOf(match[2].toUpperCase());
    const mm = cal >= 0 ? String(cal + 1).padStart(2, "0") : "01";
    return `${day}-${mm}-${match[3].slice(2)}`;
  }
  return display || "—";
}

/** Drop scientific-notation Trans. No. values corrupted by Excel number coercion. */
export function cleanTransactionId(raw: string): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (/e[+\-]/i.test(text)) return "";
  if (text.includes(",")) return text.replace(/\s+/g, "");
  if (!/^\d+$/.test(text)) return text;
  return text;
}

const EXCEL_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Convert YYYY-MM-DD to Excel-style text (e.g. "19 January 2026"). */
export function isoDateToExcelDisplay(iso: string): string {
  const value = String(iso ?? "").trim().slice(0, 10);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const year = match[1];
  const monthIdx = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);
  const month = EXCEL_MONTH_NAMES[monthIdx];
  if (!month || !day) return value;
  return `${day} ${month} ${year}`;
}

export function formatReceiptDateTime(
  row: Pick<FeeReceiptRow, "date" | "dateDisplay" | "time">,
  options?: { excelStyle?: boolean }
): {
  date: string;
  time: string;
} {
  const excelStyle = options?.excelStyle !== false;
  const display = String(row.dateDisplay ?? "").trim();
  const iso = String(row.date ?? "").trim().slice(0, 10);

  let date = display;
  if (!date && iso) {
    date = excelStyle ? isoDateToExcelDisplay(iso) : iso;
  }
  if (excelStyle && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = isoDateToExcelDisplay(date);
  }
  if (!date) date = "—";

  const time = String(row.time ?? "").trim() || "—";
  return { date, time };
}

/** Short date in Excel transaction rows: "09 March" from "09 March 2026". */
export function excelShortTxnDate(fullDate: string): string {
  const text = String(fullDate ?? "").trim();
  const match = text.match(/^(\d{1,2}\s+[A-Za-z]+)(?:\s+\d{4})?$/);
  return match ? match[1] : text;
}

export function excelModeGroupLabel(mode: string): string {
  const upper = String(mode ?? "").trim().toUpperCase();
  if (!upper) return "";
  if (upper.includes("UPI")) return "UPI ID";
  if (upper.includes("CASH")) return "CASH";
  if (upper.includes("CARD")) return "CREDIT/DEBIT CARD";
  if (upper.includes("NEFT") || upper.includes("BANK")) return "NEFT";
  if (upper.includes("CHEQ")) return "CHEQUE";
  return upper;
}

export type FeeTxnTableRow =
  | { kind: "date-header"; key: string; label: string }
  | { kind: "txn"; key: string; receipt: FeeReceiptRow }
  | { kind: "date-summary"; key: string; label: string; count: number; total: number }
  | { kind: "mode-label"; key: string; label: string; amount: number; count: number };

function parseReceiptRecNo(receipt: FeeReceiptRow): number {
  return Number.parseInt(String(receipt.receiptNo).replace(/\D/g, ""), 10) || 0;
}

/** Group All Time transactions like the Excel report: date header → rows → daily total → mode labels. */
export function buildExcelGroupedTxnRows(receipts: FeeReceiptRow[]): FeeTxnTableRow[] {
  const byDate = new Map<string, FeeReceiptRow[]>();

  for (const receipt of receipts) {
    const key = String(receipt.date || receipt.dateDisplay || "").trim() || "unknown";
    const list = byDate.get(key) ?? [];
    list.push(receipt);
    byDate.set(key, list);
  }

  const sortedKeys = [...byDate.keys()].sort((a, b) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return a.localeCompare(b);
  });

  const rows: FeeTxnTableRow[] = [];

  for (const dateKey of sortedKeys) {
    const items = [...(byDate.get(dateKey) ?? [])].sort(
      (a, b) => parseReceiptRecNo(a) - parseReceiptRecNo(b)
    );
    if (items.length === 0) continue;

    const headerLabel = formatReceiptDateTime(items[0], { excelStyle: true }).date;
    rows.push({ kind: "date-header", key: `header-${dateKey}`, label: headerLabel });

    for (const receipt of items) {
      rows.push({ kind: "txn", key: receipt.id, receipt });
    }

    const total = items
      .filter((r) => r.status !== "Cancelled" && r.status !== "Failed")
      .reduce((sum, r) => sum + r.amount, 0);

    rows.push({
      kind: "date-summary",
      key: `summary-${dateKey}`,
      label: headerLabel,
      count: items.length,
      total,
    });

    const modeTotals = new Map<string, { amount: number; count: number }>();
    for (const receipt of items) {
      if (receipt.status === "Cancelled" || receipt.status === "Failed") continue;
      const label = excelModeGroupLabel(receipt.mode);
      if (!label) continue;
      const prev = modeTotals.get(label) ?? { amount: 0, count: 0 };
      modeTotals.set(label, {
        amount: prev.amount + receipt.amount,
        count: prev.count + 1,
      });
    }

    for (const [label, stats] of [...modeTotals.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      rows.push({
        kind: "mode-label",
        key: `mode-${dateKey}-${label}`,
        label,
        amount: stats.amount,
        count: stats.count,
      });
    }
  }

  return rows;
}

export function mapPaymentDocToReceipt(
  id: string,
  data: Record<string, unknown>
): FeeReceiptRow {
  const monthRaw = String(data.feeMonth ?? data.month ?? "");
  const dateRaw = String(data.date ?? data.payment_date ?? "").slice(0, 10);
  const dateDisplay = data.dateDisplay ? String(data.dateDisplay).trim() : undefined;
  const time = data.time ? String(data.time).trim() : undefined;
  const transNo = cleanTransactionId(
    String(data.transNo ?? data.transactionId ?? data.upiId ?? data.upiRef ?? data.txnId ?? "").trim()
  );
  const internalRef = String(data.reference ?? "").trim();
  const particular = data.particular ? String(data.particular) : undefined;
  const exHead = data.exHead ? String(data.exHead) : undefined;
  const remark = data.remark ? String(data.remark) : undefined;
  const receiptNo = formatReceiptNumber(String(data.receiptNo ?? data.id ?? id), {
    exHead,
    particular,
    remark,
  });

  return {
    id,
    receiptNo,
    month: formatFeeMonthRange(monthRaw),
    date: dateRaw,
    dateDisplay,
    time,
    amount: parseAmount(data.amount),
    mode: excelModeGroupLabel(String(data.mode ?? data.paymentMode ?? "Cash")) || String(data.mode ?? "Cash"),
    fine: parseAmount(data.fine ?? data.lateFine),
    status: String(data.status ?? "Completed"),
    studentId: data.studentId ? String(data.studentId) : undefined,
    studentName: data.studentName ? String(data.studentName) : undefined,
    admissionNo: data.admissionNo ? String(data.admissionNo) : undefined,
    collectedBy: data.collectedBy ? String(data.collectedBy) : undefined,
    collectedByName: data.collectedByName ? String(data.collectedByName) : undefined,
    remark: data.remark ? String(data.remark) : undefined,
    // Keep internal import reference separate from gateway txn id
    reference: internalRef || undefined,
    transNo: transNo || undefined,
    transactionId: transNo || undefined,
    particular: particular,
    exHead,
    academicYear: data.academicYear ? String(data.academicYear) : undefined,
    lineItems: Array.isArray(data.lineItems)
      ? (data.lineItems as FeeReceiptRow["lineItems"])
      : undefined,
  };
}

export type CollectionPeriod = "today" | "week" | "month" | "all";

function isSuccessReceipt(r: FeeReceiptRow) {
  return r.status !== "Cancelled" && r.status !== "Failed";
}

function parseReceiptDate(date: string): Date | null {
  if (!date) return null;
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterReceiptsByPeriod(
  receipts: FeeReceiptRow[],
  period: CollectionPeriod,
  options?: { includeCancelled?: boolean }
): FeeReceiptRow[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return receipts.filter((r) => {
    if (!options?.includeCancelled && !isSuccessReceipt(r)) return false;
    if (period === "all") return true;
    if (!r.date) return period === "today" ? false : true;

    if (period === "today") return r.date === todayStr;

    const d = parseReceiptDate(r.date);
    if (!d) return false;

    if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return d >= start && d <= now;
    }

    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= now;
  });
}

export function collectionBreakdown(receipts: FeeReceiptRow[]) {
  let cash = 0;
  let cheque = 0;
  let neft = 0;
  let upi = 0;
  let card = 0;
  let total = 0;

  for (const r of receipts) {
    total += r.amount;
    const mode = r.mode.toLowerCase();
    if (mode.includes("cash")) cash += r.amount;
    else if (mode.includes("cheq")) cheque += r.amount;
    else if (mode.includes("neft") || mode.includes("bank")) neft += r.amount;
    else if (mode.includes("upi")) upi += r.amount;
    else if (mode.includes("card") || mode.includes("credit")) card += r.amount;
    else cash += r.amount;
  }

  return { total, cash, cheque, neft, upi, card, count: receipts.length };
}

export type CollectorSummary = {
  name: string;
  count: number;
  amount: number;
  cash: number;
  digital: number;
};

export function groupByCollector(receipts: FeeReceiptRow[]): CollectorSummary[] {
  const map = new Map<string, CollectorSummary>();

  for (const r of receipts) {
    const name = r.collectedByName?.trim() || "Unknown";
    const row = map.get(name) ?? { name, count: 0, amount: 0, cash: 0, digital: 0 };
    row.count += 1;
    row.amount += r.amount;
    if (r.mode.toLowerCase().includes("cash")) row.cash += r.amount;
    else row.digital += r.amount;
    map.set(name, row);
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function todayCollectionStats(receipts: FeeReceiptRow[]) {
  return collectionBreakdown(filterReceiptsByPeriod(receipts, "today"));
}

export function parseAmount(value: unknown): number {
  const n = Number.parseInt(String(value ?? "0").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatInr(amount: number, compact = false): string {
  if (compact && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function monthLabelFromIndex(index: number): string {
  return FEE_MONTHS[index] ?? "—";
}

/** APR–MAR index from a calendar month number (0=Jan … 11=Dec). */
export function academicMonthIndexFromCalendarMonth(calendarMonth: number): number {
  if (!Number.isFinite(calendarMonth) || calendarMonth < 0 || calendarMonth > 11) return -1;
  // Jan→JAN(9), Feb→FEB(10), Mar→MAR(11), Apr→APR(0), …
  return (calendarMonth + 9) % 12;
}

/** APR–MAR index from an ISO date (YYYY-MM-DD). */
export function academicMonthIndexFromDate(isoDate: string): number {
  const value = String(isoDate ?? "").trim().slice(0, 10);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return -1;
  const calendarMonth = Number.parseInt(match[2], 10) - 1;
  return academicMonthIndexFromCalendarMonth(calendarMonth);
}

/**
 * Map fee-month labels to APR–MAR indexes.
 * Accepts "APR", "April", "NOVEMBER", "OCTOBER-JANUARY" (first token), etc.
 * Returns -1 when the label cannot be resolved (caller may fall back to receipt date).
 */
export function monthIndexFromLabel(label: string): number {
  const text = String(label ?? "").trim().toUpperCase();
  if (!text) return -1;
  const firstToken = text.split(/[-–/,]| TO /i)[0]?.trim() ?? "";
  if (!firstToken) return -1;
  const abbr = firstToken.slice(0, 3) as (typeof FEE_MONTHS)[number];
  const idx = FEE_MONTHS.indexOf(abbr);
  return idx >= 0 ? idx : -1;
}

/** Quarterly installment months (Apr / Jul / Oct / Jan) — used by 2022-23 bus fees. */
export const QUARTERLY_FEE_MONTH_INDEXES = [0, 3, 6, 9] as const;
/** Jul / Oct / Jan — used by 2023-24 / 2026-27 bus fees. */
export const TRANSPORT_JUL_OCT_JAN_INDEXES = [3, 6, 9] as const;

export const TRANSPORT_FEE_BELOW_7KM_ANNUAL = 15000;
export const TRANSPORT_FEE_ABOVE_7KM_ANNUAL_2022_23 = 20004;
export const TRANSPORT_FEE_ABOVE_7KM_ANNUAL = TRANSPORT_FEE_ABOVE_7KM_ANNUAL_2022_23;
export const TRANSPORT_FEE_ABOVE_7KM_ANNUAL_JUL_OCT_JAN = 23000;
export const TRANSPORT_FEE_BELOW_7KM_INSTALLMENT = 3750;
export const TRANSPORT_FEE_ABOVE_7KM_INSTALLMENT = 5001;

function normalizeAcademicYearName(year: string | null | undefined): string {
  const raw = String(year ?? "").trim();
  const m = raw.match(/(\d{4})\s*[-/–]\s*(\d{2,4})/);
  if (!m) return raw;
  const start = m[1];
  const end = m[2].length === 2 ? m[2] : m[2].slice(-2);
  return `${start}-${end}`;
}

/** Bus-fee billing schedule for an academic year. */
export function getTransportFeeSchedule(academicYear?: string | null): {
  monthIndexes: readonly number[];
  below: readonly number[];
  above: readonly number[];
  belowAnnual: number;
  aboveAnnual: number;
} {
  const year = normalizeAcademicYearName(academicYear);
  if (year === "2022-23") {
    return {
      monthIndexes: QUARTERLY_FEE_MONTH_INDEXES,
      below: [3750, 3750, 3750, 3750],
      above: [5001, 5001, 5001, 5001],
      belowAnnual: TRANSPORT_FEE_BELOW_7KM_ANNUAL,
      aboveAnnual: TRANSPORT_FEE_ABOVE_7KM_ANNUAL_2022_23,
    };
  }
  return {
    monthIndexes: TRANSPORT_JUL_OCT_JAN_INDEXES,
    below: [5000, 5000, 5000],
    above: [8000, 8000, 7000],
    belowAnnual: TRANSPORT_FEE_BELOW_7KM_ANNUAL,
    aboveAnnual: TRANSPORT_FEE_ABOVE_7KM_ANNUAL_JUL_OCT_JAN,
  };
}

function applyScheduleParts(monthIndexes: readonly number[], parts: readonly number[]): number[] {
  const values = Array(12).fill(0);
  monthIndexes.forEach((index, partIndex) => {
    values[index] = parts[partIndex] ?? 0;
  });
  return values;
}

/** Spread an annual bus-fee amount across the year's installment months. */
export function spreadAmountAcrossQuarterMonths(
  total: number,
  academicYear?: string | null
): number[] {
  const amount = Math.max(0, Math.round(total));
  if (amount <= 0) return Array(12).fill(0);

  const year = normalizeAcademicYearName(academicYear);
  const schedule = getTransportFeeSchedule(academicYear);
  const isAprSchedule = year === "2022-23";

  if (amount === schedule.belowAnnual) {
    return applyScheduleParts(schedule.monthIndexes, schedule.below);
  }
  if (amount === schedule.aboveAnnual) {
    return applyScheduleParts(schedule.monthIndexes, schedule.above);
  }
  // Import aliases
  if (isAprSchedule && (amount === 20000 || amount === TRANSPORT_FEE_ABOVE_7KM_ANNUAL_JUL_OCT_JAN)) {
    return applyScheduleParts(schedule.monthIndexes, schedule.above);
  }
  if (!isAprSchedule && (amount === 20000 || amount === TRANSPORT_FEE_ABOVE_7KM_ANNUAL_2022_23)) {
    return applyScheduleParts(schedule.monthIndexes, schedule.above);
  }

  // Generic even split across this year's installment months.
  const values = Array(12).fill(0);
  const n = schedule.monthIndexes.length;
  const base = Math.floor(amount / n);
  let remainder = amount - base * n;
  for (const idx of schedule.monthIndexes) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    values[idx] = base + extra;
  }
  return values;
}

/**
 * If a monthly fee row is lumped into a single month (common import shape),
 * redistribute it across the academic year's bus-fee installment months.
 */
export function normalizeQuarterlyMonthlyFees(
  fees: unknown,
  academicYear?: string | null
): number[] {
  if (!Array.isArray(fees)) return Array(12).fill(0);
  const values = fees.map((v) => parseAmount(v));
  const total = sumRowValues(values);
  if (total <= 0) return Array(12).fill(0);

  const schedule = getTransportFeeSchedule(academicYear);
  const year = normalizeAcademicYearName(academicYear);
  const knownAnnuals = new Set<number>([schedule.belowAnnual, schedule.aboveAnnual, 20000]);
  if (year === "2022-23") {
    knownAnnuals.add(TRANSPORT_FEE_ABOVE_7KM_ANNUAL_JUL_OCT_JAN);
  } else {
    knownAnnuals.add(TRANSPORT_FEE_ABOVE_7KM_ANNUAL_2022_23);
  }
  if (knownAnnuals.has(total)) {
    return spreadAmountAcrossQuarterMonths(total, academicYear);
  }

  const nonZeroIndexes = values
    .map((v, i) => (v > 0 ? i : -1))
    .filter((i) => i >= 0);
  if (nonZeroIndexes.length === 0) return Array(12).fill(0);

  const installmentHits = nonZeroIndexes.filter((i) => schedule.monthIndexes.includes(i));
  // Already spread across 2+ installment months — keep as stored.
  if (installmentHits.length >= 2) return values;
  // Single lump (or only one installment slot with the whole total) → split.
  if (nonZeroIndexes.length === 1 || installmentHits.length <= 1) {
    return spreadAmountAcrossQuarterMonths(total, academicYear);
  }
  return values;
}

export function sumRowValues(values: string[] | number[] | null | undefined): number {
  if (!Array.isArray(values)) return 0;
  return values.reduce<number>((sum, v) => sum + parseAmount(v), 0);
}

export function hasFeeGridData(grid: FeeGridRow[] | undefined): boolean {
  if (!Array.isArray(grid) || grid.length === 0) return false;
  return grid.some((row) => sumRowValues(row.values) > 0);
}

/** Spread annual fee heads into quarterly months (Jul, Oct, Jan, Apr). */
export function buildFeeGridFromStructure(
  structure: Record<string, unknown>,
  schoolId?: string
): FeeGridRow[] {
  const nestedGrid = structure.feeGrid;
  if (Array.isArray(nestedGrid) && hasFeeGridData(nestedGrid as FeeGridRow[])) {
    return nestedGrid as FeeGridRow[];
  }

  const tuition = parseAmount(structure.tuition);
  const sports = parseAmount(structure.sports);
  const transport = parseAmount(structure.transport);
  const others = parseAmount(structure.others);

  const quarterlyValues = (annual: number): string[] => {
    const values = Array(12).fill("0");
    if (annual <= 0) return values;
    const quarter = Math.round(annual / 4);
    for (const idx of [3, 6, 9, 0]) {
      values[idx] = String(quarter);
    }
    return values;
  };

  const rows: FeeGridRow[] = [
    { name: "TUITION FEE", method: "QUARTERLY", values: quarterlyValues(tuition) },
    { name: "SPORTS FEE", method: "QUARTERLY", values: quarterlyValues(sports) },
    { name: "TRANSPORT FEE", method: "QUARTERLY", values: quarterlyValues(transport) },
    { name: "OTHER FEES", method: "QUARTERLY", values: quarterlyValues(others) },
  ];

  return rows.filter((row) => sumRowValues(row.values) > 0);
}

export function normalizeGradeKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^grade\s+/i, "")
    .replace(/\s+/g, " ");
}

export function gradeLookupCandidates(value: string): string[] {
  const normalized = normalizeGradeKey(value);
  if (!normalized) return [];
  const firstWord = normalized.split(" ")[0] ?? "";
  return [...new Set([normalized, firstWord].filter(Boolean))];
}

export function feeStructureMatchesGrade(structureGrade: string, studentGrade: string): boolean {
  const structCandidates = gradeLookupCandidates(structureGrade);
  const studentCandidates = gradeLookupCandidates(studentGrade);
  if (!structCandidates.length || !studentCandidates.length) return false;

  for (const struct of structCandidates) {
    for (const student of studentCandidates) {
      if (struct === student || struct.includes(student) || student.includes(struct)) {
        return true;
      }
    }
  }
  return false;
}

export function monthlyTotals(rows: FeeGridRow[], excludeNameIncludes: string[] = []): number[] {
  const months = Array(12).fill(0);
  for (const row of rows) {
    const name = row.name.toUpperCase();
    if (excludeNameIncludes.some((key) => name.includes(key))) continue;
    row.values.forEach((v, i) => {
      months[i] += parseAmount(v);
    });
  }
  return months;
}

export function transportMonthlyFees(fees: unknown, academicYear?: string | null): number[] {
  return normalizeQuarterlyMonthlyFees(fees, academicYear);
}

export function buildPaidMonthsFromReceipts(receipts: FeeReceiptRow[]): number[] {
  const paid = Array(12).fill(0);
  for (const r of receipts) {
    if (r.status === "Cancelled" || r.status === "Failed") continue;
    const amount = parseAmount(r.amount);
    if (amount <= 0) continue;
    let idx = monthIndexFromLabel(r.month);
    if (idx < 0) idx = academicMonthIndexFromDate(r.date);
    if (idx < 0) continue;
    paid[idx] += amount;
  }
  return paid;
}

/** Waterfall paid amount across monthly dues (APR→MAR). */
export function allocatePaidAcrossDues(monthlyDues: number[], feePaid: number): number[] {
  const paid = Array(12).fill(0);
  let remaining = Math.max(0, Math.round(feePaid));
  if (remaining <= 0) return paid;

  const dueTotal = sumRowValues(monthlyDues);
  if (dueTotal > 0 && remaining >= dueTotal) {
    return monthlyDues.map((v) => Math.max(0, v));
  }

  for (let i = 0; i < 12 && remaining > 0; i += 1) {
    const due = Math.max(0, monthlyDues[i] ?? 0);
    if (due <= 0) continue;
    const take = Math.min(due, remaining);
    paid[i] = take;
    remaining -= take;
  }
  // Any leftover (overpayment) stays on the last month that had a due, else APR.
  if (remaining > 0) {
    let lastDueIdx = 0;
    for (let i = 0; i < 12; i += 1) {
      if ((monthlyDues[i] ?? 0) > 0) lastDueIdx = i;
    }
    paid[lastDueIdx] += remaining;
  }
  return paid;
}

/**
 * Resolve the Paid Fee month row:
 * 1) Attribute completed receipts to the correct fee month (label or payment date)
 * 2) If profile/feePaid still has a remainder (or a single APR lump with no receipts),
 *    waterfall that amount across monthly dues
 * 3) Otherwise keep a stored multi-month profile breakdown
 */
export function resolvePaidMonths(params: {
  receipts?: FeeReceiptRow[];
  profilePaidMonths?: Array<string | number> | null;
  monthlyDues?: number[];
  feePaidTotal?: string | number;
}): number[] {
  const fromReceipts = buildPaidMonthsFromReceipts(params.receipts ?? []);
  const receiptTotal = sumRowValues(fromReceipts);

  const fromProfile = Array.isArray(params.profilePaidMonths)
    ? params.profilePaidMonths.map((v) => parseAmount(v))
    : Array(12).fill(0);
  const profileTotal = sumRowValues(fromProfile);
  const explicitPaid = parseAmount(params.feePaidTotal);
  const paidTotal = Math.max(profileTotal, explicitPaid, receiptTotal);
  const nonZeroProfileMonths = fromProfile.filter((v) => v > 0).length;
  const dues = Array.isArray(params.monthlyDues) ? params.monthlyDues : Array(12).fill(0);

  if (receiptTotal > 0) {
    if (paidTotal > receiptTotal && dues.some((v) => v > 0)) {
      const remainingDues = dues.map((due, i) => Math.max(0, due - (fromReceipts[i] ?? 0)));
      const extra = allocatePaidAcrossDues(remainingDues, paidTotal - receiptTotal);
      return fromReceipts.map((v, i) => v + (extra[i] ?? 0));
    }
    return fromReceipts;
  }

  if (paidTotal > 0 && nonZeroProfileMonths <= 1 && dues.some((v) => v > 0)) {
    return allocatePaidAcrossDues(dues, paidTotal);
  }
  if (profileTotal > 0) return fromProfile;
  if (paidTotal > 0 && dues.some((v) => v > 0)) {
    return allocatePaidAcrossDues(dues, paidTotal);
  }
  return fromProfile;
}

export function computeFeeStatus(params: {
  feeGrid: FeeGridRow[];
  transportFees: unknown;
  paidMonths?: number[];
  receipts?: FeeReceiptRow[];
  profilePaidMonths?: Array<string | number> | null;
  /** Authoritative paid-by-month from head-wise month reports (overrides receipt waterfall). */
  headwisePaidMonths?: Array<string | number | null | undefined> | null;
  /** Authoritative due-by-month from head-wise month reports (school + bus combined). */
  headwiseDueMonths?: Array<string | number | null | undefined> | null;
  feePaidTotal?: string | number;
  lastYearDue?: string | number;
  grossFee?: string | number;
  totalDiscount?: string | number;
  lateFine?: string | number;
  academicYear?: string | null;
}) {
  const {
    feeGrid,
    transportFees,
    paidMonths: paidMonthsOverride,
    receipts,
    profilePaidMonths,
    headwisePaidMonths,
    headwiseDueMonths,
    feePaidTotal,
    lastYearDue = 0,
    grossFee = 0,
    totalDiscount = 0,
    lateFine = 0,
    academicYear,
  } = params;

  let schoolFee = monthlyTotals(feeGrid, ["TRANSPORT"]);
  const busFee = transportMonthlyFees(transportFees, academicYear);
  const transportRow = feeGrid.find((r) => r.name.toUpperCase().includes("TRANSPORT"));
  const transportFromGrid = transportRow
    ? normalizeQuarterlyMonthlyFees(transportRow.values, academicYear)
    : Array(12).fill(0);
  const gridBusRaw = Array.isArray(transportRow?.values)
    ? transportRow!.values.map((v) => parseAmount(v))
    : Array(12).fill(0);

  // Prefer transportDetails when present. For fee-grid transport cells (headwise),
  // keep already-spread multi-month rows; only normalize single-month annual lumps.
  const busMonthly = (() => {
    if (busFee.some((v) => v > 0)) return busFee;
    const nonZero = gridBusRaw.filter((v) => v > 0).length;
    if (nonZero >= 2) return gridBusRaw;
    if (nonZero === 1) return transportFromGrid;
    return Array(12).fill(0);
  })();

  let totalFee = schoolFee.map((v, i) => v + busMonthly[i]);

  if (Array.isArray(headwiseDueMonths)) {
    totalFee = totalFee.map((v, i) => {
      const hw = headwiseDueMonths[i];
      if (hw === null || hw === undefined || hw === "") return v;
      return parseAmount(hw);
    });
    schoolFee = totalFee.map((v, i) => Math.max(0, v - (busMonthly[i] ?? 0)));
  }

  let paidFee = Array.isArray(paidMonthsOverride)
    ? paidMonthsOverride.map((v) => v || 0)
    : resolvePaidMonths({
        receipts,
        profilePaidMonths,
        monthlyDues: totalFee,
        feePaidTotal,
      });

  if (Array.isArray(headwisePaidMonths)) {
    paidFee = paidFee.map((v, i) => {
      const hw = headwisePaidMonths[i];
      if (hw === null || hw === undefined || hw === "") return v;
      return parseAmount(hw);
    });
  }

  const balance = totalFee.map((v, i) => Math.max(0, v - paidFee[i]));

  const gridTotal = sumRowValues(totalFee) + parseAmount(lastYearDue);
  const discount = parseAmount(totalDiscount);
  const fine = parseAmount(lateFine);
  const explicitGross = parseAmount(grossFee);
  // Head-wise dues are already net of discounts; otherwise net = gross − discount.
  const hasHeadwiseDue =
    Array.isArray(headwiseDueMonths) &&
    headwiseDueMonths.some((v) => v !== null && v !== undefined && String(v).trim() !== "");
  const resolvedNet = hasHeadwiseDue
    ? Math.max(0, gridTotal)
    : Math.max(0, (explicitGross > 0 ? explicitGross : gridTotal + discount) - discount);
  const grossDue =
    explicitGross > 0 ? explicitGross : hasHeadwiseDue ? resolvedNet + discount : gridTotal + discount;
  const totalPaid = sumRowValues(paidFee);
  const totalBalance = Math.max(0, resolvedNet + fine - totalPaid);

  return {
    schoolFee,
    busFee: busMonthly,
    totalFee,
    paidFee,
    balance,
    totals: {
      school: sumRowValues(schoolFee),
      bus: sumRowValues(busMonthly),
      gross: grossDue,
      fee: resolvedNet,
      discount,
      lateFine: fine,
      paid: totalPaid,
      balance: totalBalance,
      lastYearDue: parseAmount(lastYearDue),
      gridTotal,
    },
  };
}

export function nextReceiptNo(existing: FeeReceiptRow[]): string {
  const nums = existing
    .map((r) => Number.parseInt(String(r.receiptNo).replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return String(next);
}

/** Standard payable fee rows shown in the annual fee structure modal (legacy ERP layout). */
export const PAYABLE_FEE_ROW_NAMES = [
  "LAST YEAR DUE",
  "ADMISSION FEE",
  "TUITION FEE",
  "HOSTEL FEE",
  "IIT FEE",
  "OLYMPIAD FEE",
  "EXCURSION FEE",
  "CIRRICULAM FEE",
  "FOOD FEE",
  "MISCELLANEOUS",
  "LAUNDRY FEE",
  "CO-SPARK FEE",
  "TRANSPORT FEE",
] as const;

function payableRowKey(name: string): string {
  const upper = String(name ?? "").toUpperCase().trim();
  if (upper.includes("CURRICULUM") || upper.includes("CIRRICULAM")) return "CIRRICULAM FEE";
  if (upper.includes("TRANSPORT")) return "TRANSPORT FEE";
  if (upper.includes("LAST YEAR")) return "LAST YEAR DUE";
  return upper;
}

export function createPayableFeeGridTemplate(): FeeGridRow[] {
  return PAYABLE_FEE_ROW_NAMES.map((name) => ({
    name,
    method:
      name === "ADMISSION FEE"
        ? "ONE TIME"
        : name === "TUITION FEE" || name === "HOSTEL FEE" || name === "TRANSPORT FEE"
          ? "QUARTERLY"
          : "-",
    values: Array(12).fill("0"),
  }));
}

export function mergePayableFeeGrid(
  saved: FeeGridRow[] | undefined,
  options?: { lastYearDue?: string | number; transportFees?: unknown; academicYear?: string | null }
): FeeGridRow[] {
  const template = createPayableFeeGridTemplate();
  const byKey = new Map<string, FeeGridRow>();

  if (Array.isArray(saved)) {
    for (const row of saved) {
      byKey.set(payableRowKey(row.name), row);
    }
  }

  const merged = template.map((row) => {
    const match = byKey.get(payableRowKey(row.name));
    if (!match) return { ...row, values: [...row.values] };
    return {
      ...row,
      method: match.method ?? row.method,
      values: Array.isArray(match.values) && match.values.length === 12 ? [...match.values] : [...row.values],
    };
  });

  const lastYearDue = parseAmount(options?.lastYearDue);
  if (lastYearDue > 0) {
    const idx = merged.findIndex((r) => r.name === "LAST YEAR DUE");
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], values: [String(lastYearDue), ...Array(11).fill("0")] };
    }
  }

  const transportFees = options?.transportFees;
  if (Array.isArray(transportFees) && transportFees.some((v) => parseAmount(v) > 0)) {
    const spread = normalizeQuarterlyMonthlyFees(transportFees, options?.academicYear).map(String);
    const idx = merged.findIndex((r) => r.name === "TRANSPORT FEE");
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        method: "QUARTERLY",
        values: spread,
      };
    }
  }

  for (const row of saved ?? []) {
    const key = payableRowKey(row.name);
    if (!template.some((t) => payableRowKey(t.name) === key)) {
      merged.push({
        name: row.name,
        method: row.method,
        values: Array.isArray(row.values) && row.values.length === 12 ? [...row.values] : Array(12).fill("0"),
      });
    }
  }

  return merged;
}

export function payableFeeGridGrandTotal(grid: FeeGridRow[]): number {
  return grid.reduce((sum, row) => sum + sumRowValues(row.values), 0);
}

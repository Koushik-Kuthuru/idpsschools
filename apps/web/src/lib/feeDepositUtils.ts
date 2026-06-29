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
  particular?: string;
  lineItems?: Array<{ particular: string; amount: number }>;
};

export type CollectionPeriod = "today" | "week" | "month";

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
  period: CollectionPeriod
): FeeReceiptRow[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return receipts.filter((r) => {
    if (!isSuccessReceipt(r)) return false;
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

export function monthIndexFromLabel(label: string): number {
  const idx = FEE_MONTHS.indexOf(label.toUpperCase() as (typeof FEE_MONTHS)[number]);
  return idx >= 0 ? idx : 0;
}

export function sumRowValues(values: string[] | number[]): number {
  return values.reduce<number>((sum, v) => sum + parseAmount(v), 0);
}

export function hasFeeGridData(grid: FeeGridRow[] | undefined): boolean {
  if (!Array.isArray(grid) || grid.length === 0) return false;
  return grid.some((row) => sumRowValues(row.values) > 0);
}

/** Spread annual fee heads into quarterly months (Jul, Oct, Jan, Apr). */
export function buildFeeGridFromStructure(structure: Record<string, unknown>): FeeGridRow[] {
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

export function transportMonthlyFees(fees: unknown): number[] {
  if (!Array.isArray(fees)) return Array(12).fill(0);
  return fees.map((v) => parseAmount(v));
}

export function buildPaidMonthsFromReceipts(receipts: FeeReceiptRow[]): number[] {
  const paid = Array(12).fill(0);
  for (const r of receipts) {
    if (r.status === "Cancelled" || r.status === "Failed") continue;
    const idx = monthIndexFromLabel(r.month);
    paid[idx] += r.amount;
  }
  return paid;
}

export function computeFeeStatus(params: {
  feeGrid: FeeGridRow[];
  transportFees: unknown;
  paidMonths: number[];
  lastYearDue?: string | number;
  grossFee?: string | number;
  totalDiscount?: string | number;
  lateFine?: string | number;
}) {
  const {
    feeGrid,
    transportFees,
    paidMonths,
    lastYearDue = 0,
    grossFee = 0,
    totalDiscount = 0,
    lateFine = 0,
  } = params;

  const schoolFee = monthlyTotals(feeGrid, ["TRANSPORT"]);
  const busFee = transportMonthlyFees(transportFees);
  const transportRow = feeGrid.find((r) => r.name.toUpperCase().includes("TRANSPORT"));
  const transportFromGrid = transportRow ? transportRow.values.map((v) => parseAmount(v)) : Array(12).fill(0);
  const busMonthly = busFee.some((v) => v > 0) ? busFee : transportFromGrid;

  const totalFee = schoolFee.map((v, i) => v + busMonthly[i]);
  const paidFee = paidMonths.map((v) => v || 0);
  const balance = totalFee.map((v, i) => Math.max(0, v - paidFee[i]));

  const gridTotal = sumRowValues(totalFee) + parseAmount(lastYearDue);
  const discount = parseAmount(totalDiscount);
  const fine = parseAmount(lateFine);
  const explicitGross = parseAmount(grossFee);
  const grossDue = explicitGross > 0 ? explicitGross : gridTotal + discount;
  const netDue = Math.max(0, grossDue - discount);
  const totalPaid = sumRowValues(paidFee);
  const totalBalance = Math.max(0, netDue + fine - totalPaid);

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
      fee: netDue,
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
  options?: { lastYearDue?: string | number; transportFees?: unknown }
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
    const values = transportFees.map((v) => String(parseAmount(v)));
    const idx = merged.findIndex((r) => r.name === "TRANSPORT FEE");
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        values: values.length === 12 ? values : Array(12).fill("0"),
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

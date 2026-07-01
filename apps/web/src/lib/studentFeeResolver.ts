import {
  buildFeeGridFromStructure,
  hasFeeGridData,
  monthLabelFromIndex,
  parseAmount,
  type FeeGridRow,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";
import {
  createStandardFeeGridFromConfig,
  findClassStructureForGrade,
  loadFeeConfiguration,
  mergeFeeGridWithConfigTemplate,
  studentAcademicYear,
  studentEnrollmentGrade,
  type FeeConfiguration,
} from "@/lib/feeConfigurationStore";

export function createStandardFeeGridTemplate(schoolId?: string): FeeGridRow[] {
  return createStandardFeeGridFromConfig(schoolId);
}

export function mergeFeeGridWithTemplate(
  saved: FeeGridRow[] | undefined,
  template: FeeGridRow[] = createStandardFeeGridTemplate(),
  schoolId?: string
): FeeGridRow[] {
  const base =
    schoolId != null
      ? mergeFeeGridWithConfigTemplate(template, schoolId)
      : template.map((row) => ({ ...row, values: [...row.values] }));

  if (!Array.isArray(saved) || saved.length === 0) return base;

  const overrides = saved.filter((row) => hasFeeGridData([row]));
  if (overrides.length === 0) return base;

  const byName = new Map(overrides.map((row) => [row.name.toUpperCase(), row]));
  const merged = base.map((row) => {
    const match = byName.get(row.name.toUpperCase());
    if (!match) return row;
    return {
      ...row,
      ...match,
      values: Array.isArray(match.values) && match.values.length === 12 ? [...match.values] : row.values,
    };
  });

  for (const row of overrides) {
    if (!base.some((t) => t.name.toUpperCase() === row.name.toUpperCase())) {
      merged.push({ ...row, values: [...row.values] });
    }
  }

  return merged;
}

export type StudentFeeDetails = {
  feeCategory?: string;
  feeTypeFilter?: string;
  feeStatus?: string;
  lastYearDue?: string;
  discRemark?: string;
  grossFee?: string | number;
  annualFee?: string | number;
  totalDiscount?: string | number;
  lateFine?: string | number;
  paidMonths?: string[];
  feeGrid?: FeeGridRow[];
  discountLog?: Array<{ date?: string; amount?: string | number; remark?: string }>;
  feeTransactions?: Array<Record<string, unknown>>;
};

function readAmountField(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const nested = (record.feeDetails ?? {}) as Record<string, unknown>;
    const val = nested[key] ?? record[key];
    if (val !== undefined && val !== null && val !== "") {
      return parseAmount(val);
    }
  }
  return 0;
}

export function extractFeeDetails(record: Record<string, unknown> | null | undefined): StudentFeeDetails {
  if (!record) return {};

  const nested = (record.feeDetails ?? {}) as StudentFeeDetails;
  const rootGrid = record.feeGrid;
  const nestedGrid = nested.feeGrid;

  const feeGrid = hasFeeGridData(nestedGrid)
    ? (nestedGrid as FeeGridRow[])
    : hasFeeGridData(Array.isArray(rootGrid) ? (rootGrid as FeeGridRow[]) : undefined)
      ? (rootGrid as FeeGridRow[])
      : undefined;

  const discountLog = (nested.discountLog ?? record.discountLog) as StudentFeeDetails["discountLog"];
  let totalDiscount = readAmountField(record as Record<string, unknown>, "totalDiscount", "totalDiscounted", "discount");
  if (totalDiscount === 0 && Array.isArray(discountLog)) {
    totalDiscount = discountLog.reduce((sum, row) => sum + parseAmount(row.amount), 0);
  }

  return {
    feeCategory: nested.feeCategory ?? (record.feeCategory as string | undefined) ?? "GENERAL",
    feeTypeFilter: nested.feeTypeFilter ?? (record.feeTypeFilter as string | undefined) ?? "MONTHLY",
    feeStatus: nested.feeStatus ?? (record.feeStatus as string | undefined) ?? "NEW",
    lastYearDue: nested.lastYearDue ?? (record.lastYearDue as string | undefined) ?? "0",
    discRemark: nested.discRemark ?? (record.discRemark as string | undefined) ?? "",
    grossFee: readAmountField(
      record as Record<string, unknown>,
      "grossFee",
      "annualFee",
      "totalFeeBeforeDiscount",
      "actualFee"
    ),
    totalDiscount,
    lateFine: readAmountField(record as Record<string, unknown>, "lateFine", "late_fine"),
    paidMonths: nested.paidMonths ?? (record.paidMonths as string[] | undefined),
    feeGrid,
    discountLog,
    feeTransactions: (nested.feeTransactions ??
      record.feeTransactions ??
      (nested as Record<string, unknown>).transactions ??
      record.transactions) as StudentFeeDetails["feeTransactions"],
  };
}

export function mapProfileFeeTransaction(
  row: Record<string, unknown>,
  index: number,
  student?: { id?: string; admissionNo?: string; name?: string }
): FeeReceiptRow {
  const dateRaw = String(row.date ?? row.paymentDate ?? row.payment_date ?? "").slice(0, 10);
  const monthRaw = String(row.month ?? row.feeMonth ?? "");
  return {
    id: String(row.id ?? `profile-tx-${index}`),
    receiptNo: String(row.receiptNo ?? row.receipt ?? row.receipt_no ?? `S-${index + 1}`),
    month: monthRaw || (dateRaw ? monthLabelFromIndex(new Date(`${dateRaw}T12:00:00`).getMonth()) : "—"),
    date: dateRaw,
    amount: parseAmount(row.amount),
    mode: String(row.mode ?? row.paymentMode ?? "Cash"),
    fine: parseAmount(row.fine ?? row.lateFine),
    status: String(row.status ?? "Completed"),
    studentId: student?.id,
    admissionNo: student?.admissionNo,
    studentName: student?.name,
    reference: String(row.reference ?? row.upiId ?? row.upiRef ?? row.transactionId ?? row.txnId ?? ""),
    particular: row.particular ? String(row.particular) : undefined,
    lineItems: Array.isArray(row.lineItems)
      ? (row.lineItems as Array<{ particular?: string; amount?: string | number }>).map((item) => ({
          particular: String(item.particular ?? "FEE"),
          amount: parseAmount(item.amount),
        }))
      : undefined,
  };
}

export function extractFeeTransactions(
  record: Record<string, unknown> | null | undefined,
  student?: { id?: string; admissionNo?: string; name?: string }
): FeeReceiptRow[] {
  if (!record) return [];
  const details = extractFeeDetails(record);
  const rows = details.feeTransactions;
  if (!Array.isArray(rows)) return [];
  return rows.map((row, idx) => mapProfileFeeTransaction(row as Record<string, unknown>, idx, student));
}

export function applyTransportFeesToGrid(
  grid: FeeGridRow[],
  transportFees: unknown
): FeeGridRow[] {
  if (!Array.isArray(transportFees)) return grid;

  const values = transportFees.map((v) => String(Number.parseInt(String(v ?? "0"), 10) || 0));
  if (!values.some((v) => v !== "0")) return grid;

  const next = [...grid];
  const idx = next.findIndex((r) => r.name.toUpperCase().includes("TRANSPORT"));
  const row: FeeGridRow = {
    name: "TRANSPORT FEE",
    method: "QUARTERLY",
    values: values.length === 12 ? values : Array(12).fill("0"),
  };

  if (idx >= 0) next[idx] = row;
  else next.push(row);

  return next;
}

function resolveClassBaseFeeGrid(
  record: Record<string, unknown>,
  gradeStructure?: Record<string, unknown> | null,
  schoolId?: string,
  feeConfig?: FeeConfiguration,
  academicYearFallback?: string | null
): FeeGridRow[] {
  if (gradeStructure) {
    const nestedGrid = gradeStructure.feeGrid;
    if (Array.isArray(nestedGrid) && hasFeeGridData(nestedGrid as FeeGridRow[])) {
      return nestedGrid as FeeGridRow[];
    }
    const fromStructure = buildFeeGridFromStructure(gradeStructure, schoolId);
    if (hasFeeGridData(fromStructure)) return fromStructure;
  }

  if (!schoolId) return [];

  const grade = studentEnrollmentGrade(record);
  if (!grade) return [];

  const config = feeConfig ?? (typeof window !== "undefined" ? loadFeeConfiguration(schoolId) : null);
  if (!config) return [];

  const academicYear = studentAcademicYear(record, academicYearFallback);
  let classEntry = findClassStructureForGrade(config, grade, academicYear);
  if (!classEntry && academicYear) {
    classEntry = findClassStructureForGrade(config, grade, null);
  }
  if (classEntry && hasFeeGridData(classEntry.feeGrid)) {
    return classEntry.feeGrid;
  }

  return [];
}

export function resolveStudentFeeGrid(
  record: Record<string, unknown>,
  gradeStructure?: Record<string, unknown> | null,
  schoolId?: string,
  feeConfig?: FeeConfiguration,
  academicYearFallback?: string | null
): FeeGridRow[] {
  const details = extractFeeDetails(record);
  const template = createStandardFeeGridTemplate(schoolId);
  const classBase = resolveClassBaseFeeGrid(
    record,
    gradeStructure,
    schoolId,
    feeConfig,
    academicYearFallback
  );

  let merged: FeeGridRow[];
  if (hasFeeGridData(classBase)) {
    const baseWithTemplate = mergeFeeGridWithTemplate(classBase, template, schoolId);
    merged = hasFeeGridData(details.feeGrid)
      ? mergeFeeGridWithTemplate(details.feeGrid, baseWithTemplate, schoolId)
      : baseWithTemplate;
  } else if (hasFeeGridData(details.feeGrid)) {
    merged = mergeFeeGridWithTemplate(details.feeGrid, template, schoolId);
  } else {
    merged = template;
  }

  return applyTransportFeesToGrid(merged, record.transportDetails);
}

export function resolveStudentFeeDetails(
  record: Record<string, unknown>,
  gradeStructure?: Record<string, unknown> | null,
  schoolId?: string,
  feeConfig?: FeeConfiguration,
  academicYearFallback?: string | null
): StudentFeeDetails {
  const extracted = extractFeeDetails(record);
  const feeGrid = resolveStudentFeeGrid(
    record,
    gradeStructure,
    schoolId,
    feeConfig,
    academicYearFallback
  );
  return {
    ...extracted,
    feeGrid: hasFeeGridData(feeGrid) ? feeGrid : extracted.feeGrid,
  };
}

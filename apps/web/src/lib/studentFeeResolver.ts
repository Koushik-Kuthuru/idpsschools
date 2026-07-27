import {
  buildFeeGridFromStructure,
  hasFeeGridData,
  monthLabelFromIndex,
  parseAmount,
  type FeeGridRow,
  type FeeReceiptRow,
} from "@/lib/feeDepositUtils";
import {
  classStructureAsGradeRecord,
  createStandardFeeGridFromConfig,
  fetchHydratedFeeConfiguration,
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
  schoolId?: string,
  options?: { preferSavedZeros?: boolean }
): FeeGridRow[] {
  const base =
    schoolId != null
      ? mergeFeeGridWithConfigTemplate(template, schoolId)
      : template.map((row) => ({ ...row, values: [...row.values] }));

  if (!Array.isArray(saved) || saved.length === 0) return base;

  const overrides = options?.preferSavedZeros
    ? saved.filter((row) => Array.isArray(row.values) && row.values.length === 12)
    : saved.filter((row) => hasFeeGridData([row]));
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
  /** Overall fee payment state: Paid | Partial | Pending */
  paymentStatus?: string;
  lastYearDue?: string;
  discRemark?: string;
  grossFee?: string | number;
  annualFee?: string | number;
  totalDiscount?: string | number;
  lateFine?: string | number;
  feePayable?: string | number;
  feePaid?: string | number;
  balanceDue?: string | number;
  paidMonths?: string[];
  /** Paid totals by APR–MAR from head-wise month reports (overrides receipt-derived paid). */
  headwisePaidMonths?: Array<string | number | null>;
  /** Due totals by APR–MAR from head-wise month reports (authoritative Total Fee). */
  headwiseDueMonths?: Array<string | number | null>;
  feeGrid?: FeeGridRow[];
  discountLog?: Array<{
    date?: string;
    amount?: string | number;
    remark?: string;
    particular?: string;
  }>;
  feeTransactions?: Array<Record<string, unknown>>;
};

/** True when head-wise month reports were imported for this enrollment year. */
export function hasHeadwiseFeeAuthority(
  details: Pick<StudentFeeDetails, "headwiseDueMonths" | "headwisePaidMonths"> | null | undefined
): boolean {
  if (!details) return false;
  const months = details.headwiseDueMonths ?? details.headwisePaidMonths;
  if (!Array.isArray(months)) return false;
  return months.some((v) => v !== null && v !== undefined && String(v).trim() !== "");
}

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

  const balanceDue = readAmountField(record as Record<string, unknown>, "balanceDue", "balance");
  const feePaid = readAmountField(record as Record<string, unknown>, "feePaid", "paidAmount", "paid");
  const feePayable = readAmountField(record as Record<string, unknown>, "feePayable", "netDue");
  const explicitPaymentStatus = String(
    nested.paymentStatus ?? (record.paymentStatus as string | undefined) ?? ""
  ).trim();
  const inferredPaymentStatus =
    explicitPaymentStatus ||
    (feePayable > 0 && balanceDue <= 0 && feePaid >= feePayable
      ? "Paid"
      : feePaid > 0
        ? "Partial"
        : feePayable > 0
          ? "Unpaid"
          : "");

  return {
    feeCategory: nested.feeCategory ?? (record.feeCategory as string | undefined) ?? "GENERAL",
    feeTypeFilter: nested.feeTypeFilter ?? (record.feeTypeFilter as string | undefined) ?? "MONTHLY",
    feeStatus: nested.feeStatus ?? (record.feeStatus as string | undefined) ?? "NEW",
    paymentStatus: inferredPaymentStatus || undefined,
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
    feePayable,
    feePaid,
    balanceDue,
    paidMonths: nested.paidMonths ?? (record.paidMonths as string[] | undefined),
    headwisePaidMonths:
      nested.headwisePaidMonths ??
      (record.headwisePaidMonths as StudentFeeDetails["headwisePaidMonths"] | undefined),
    headwiseDueMonths:
      nested.headwiseDueMonths ??
      (record.headwiseDueMonths as StudentFeeDetails["headwiseDueMonths"] | undefined),
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
  const transNo = String(
    row.transNo ?? row.transactionId ?? row.upiId ?? row.upiRef ?? row.txnId ?? ""
  ).trim();
  const internalRef = String(row.reference ?? "").trim();
  return {
    id: String(row.id ?? `profile-tx-${index}`),
    receiptNo: String(row.receiptNo ?? row.receipt ?? row.receipt_no ?? `S-${index + 1}`),
    month: monthRaw || (dateRaw ? monthLabelFromIndex(new Date(`${dateRaw}T12:00:00`).getMonth()) : "—"),
    date: dateRaw,
    dateDisplay: row.dateDisplay ? String(row.dateDisplay) : undefined,
    time: row.time ? String(row.time) : undefined,
    amount: parseAmount(row.amount),
    mode: String(row.mode ?? row.paymentMode ?? "Cash"),
    fine: parseAmount(row.fine ?? row.lateFine),
    status: String(row.status ?? "Completed"),
    studentId: student?.id,
    admissionNo: student?.admissionNo,
    studentName: student?.name,
    reference: internalRef || undefined,
    transNo: transNo || undefined,
    transactionId: transNo || undefined,
    particular: row.particular ? String(row.particular) : undefined,
    academicYear: row.academicYear ? String(row.academicYear) : undefined,
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
  const headwiseAuthority = hasHeadwiseFeeAuthority(details);

  // Head-wise imports are the payable truth for that year (already net of discounts).
  // Do not re-inject class structure amounts on top of zeroed heads (e.g. fully discounted admission).
  if (headwiseAuthority && Array.isArray(details.feeGrid) && details.feeGrid.length > 0) {
    const merged = mergeFeeGridWithTemplate(details.feeGrid, template, schoolId, {
      preferSavedZeros: true,
    });
    return applyTransportFeesToGrid(merged, record.transportDetails);
  }

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

  // Without head-wise authority, subtract discount-log amounts from matching heads
  // so Payable / Deposit Fee show net dues.
  if (!headwiseAuthority && Array.isArray(details.discountLog) && details.discountLog.length > 0) {
    merged = applyDiscountLogToFeeGrid(merged, details.discountLog);
  }

  return applyTransportFeesToGrid(merged, record.transportDetails);
}

/**
 * Reduce fee-grid heads by discount-log particulars (ADMISSION FEE, TUITION FEE, …).
 * Discounts are applied to the earliest months that still have due on that head.
 */
export function applyDiscountLogToFeeGrid(
  grid: FeeGridRow[],
  discountLog: Array<{ amount?: string | number; particular?: string; remark?: string }>
): FeeGridRow[] {
  const next = grid.map((row) => ({
    ...row,
    values: Array.isArray(row.values) ? [...row.values] : Array(12).fill("0"),
  }));

  for (const entry of discountLog) {
    let remaining = parseAmount(entry.amount);
    if (remaining <= 0) continue;
    const particular = String(entry.particular ?? entry.remark ?? "")
      .toUpperCase()
      .trim();
    if (!particular) continue;

    const row = next.find((r) => {
      const name = r.name.toUpperCase();
      return (
        name === particular ||
        name.includes(particular) ||
        particular.includes(name.replace(/\s+FEE$/, "")) ||
        (particular.includes("ADMISSION") && name.includes("ADMISSION")) ||
        (particular.includes("TUITION") && name.includes("TUITION")) ||
        (particular.includes("TRANSPORT") && name.includes("TRANSPORT")) ||
        (particular.includes("HOSTEL") && name.includes("HOSTEL")) ||
        (particular.includes("IIT") && name.includes("IIT"))
      );
    });
    if (!row) continue;

    for (let i = 0; i < row.values.length && remaining > 0; i += 1) {
      const due = parseAmount(row.values[i]);
      if (due <= 0) continue;
      const cut = Math.min(due, remaining);
      row.values[i] = String(due - cut);
      remaining -= cut;
    }
  }

  return next;
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

/** Load class fee structure + student overrides + transport for UI (deposit fee, receipts, etc.). */
export async function hydrateStudentFeeDetails(
  record: Record<string, unknown>,
  schoolId: string,
  academicYearFallback?: string | null
): Promise<StudentFeeDetails> {
  const gradeToSearch = studentEnrollmentGrade(record);
  const studentYear = studentAcademicYear(record, academicYearFallback);
  const yearForLookup = studentYear ?? academicYearFallback ?? null;
  const feeConfig = await fetchHydratedFeeConfiguration(schoolId, yearForLookup);

  let structure: Record<string, unknown> | null = null;
  if (gradeToSearch) {
    let classEntry = findClassStructureForGrade(feeConfig, gradeToSearch, yearForLookup);
    if (!classEntry && yearForLookup) {
      classEntry = findClassStructureForGrade(feeConfig, gradeToSearch, null);
    }
    if (classEntry) structure = classStructureAsGradeRecord(classEntry);
  }

  const resolved = resolveStudentFeeDetails(
    record,
    structure,
    schoolId,
    feeConfig,
    yearForLookup
  );

  const feeGrid = mergeFeeGridWithTemplate(
    resolved.feeGrid ?? [],
    createStandardFeeGridTemplate(schoolId),
    schoolId,
    hasHeadwiseFeeAuthority(resolved) ? { preferSavedZeros: true } : undefined
  );

  return {
    ...resolved,
    feeGrid: hasFeeGridData(feeGrid) ? feeGrid : resolved.feeGrid,
  };
}

/**
 * Server-side hydration for portal APIs — loads class fee structures from Supabase
 * (browser `fetchHydratedFeeConfiguration` is a no-op on the server).
 */
export async function hydrateStudentFeeDetailsWithAdmin(
  admin: import("@supabase/supabase-js").SupabaseClient<any>,
  record: Record<string, unknown>,
  schoolSlug: string,
  academicYearFallback?: string | null
): Promise<StudentFeeDetails> {
  const { loadBranchClassFeeRecords } = await import("@/lib/loadBranchClassFeeStructures");
  const {
    classStructureFromDbDoc,
    hydrateFeeConfiguration,
    loadFeeConfiguration,
  } = await import("@/lib/feeConfigurationStore");

  const gradeToSearch = studentEnrollmentGrade(record);
  const studentYear = studentAcademicYear(record, academicYearFallback);
  const yearForLookup = studentYear ?? academicYearFallback ?? null;

  let rows = await loadBranchClassFeeRecords(admin, schoolSlug, yearForLookup);
  if (!rows.length && yearForLookup) {
    rows = await loadBranchClassFeeRecords(admin, schoolSlug, null);
  }

  const local = loadFeeConfiguration(schoolSlug);
  const fromDb = rows.map((row) =>
    classStructureFromDbDoc(
      row.id || row.grade,
      {
        grade: row.grade,
        academicYear: row.academicYear,
        status: row.status,
        feeGrid: row.feeGrid,
        remarks: row.remarks,
      },
      local.feeTypes
    )
  );
  const feeConfig = hydrateFeeConfiguration(schoolSlug, fromDb);

  let structure: Record<string, unknown> | null = null;
  if (gradeToSearch) {
    let classEntry = findClassStructureForGrade(feeConfig, gradeToSearch, yearForLookup);
    if (!classEntry && yearForLookup) {
      classEntry = findClassStructureForGrade(feeConfig, gradeToSearch, null);
    }
    if (classEntry) structure = classStructureAsGradeRecord(classEntry);
  }

  const resolved = resolveStudentFeeDetails(
    record,
    structure,
    schoolSlug,
    feeConfig,
    yearForLookup
  );

  const feeGrid = mergeFeeGridWithTemplate(
    resolved.feeGrid ?? [],
    createStandardFeeGridTemplate(schoolSlug),
    schoolSlug,
    hasHeadwiseFeeAuthority(resolved) ? { preferSavedZeros: true } : undefined
  );

  return {
    ...resolved,
    feeGrid: hasFeeGridData(feeGrid) ? feeGrid : resolved.feeGrid,
  };
}

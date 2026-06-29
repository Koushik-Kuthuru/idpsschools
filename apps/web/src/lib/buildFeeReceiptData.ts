import { FEE_MONTHS, parseAmount, type FeeReceiptRow } from "@/lib/feeDepositUtils";
import {
  balanceYearEndLabel,
  formatReceiptDate,
  isUpiPaymentMode,
  type FeeReceiptLineItem,
  type FeeReceiptPrintData,
} from "@/lib/feeReceiptTemplate";

type StudentLike = {
  admissionNo?: string;
  name?: string;
  studentName?: string;
  fatherName?: string;
  fatherMobile1?: string;
  mobileNumber?: string;
  parentPhone?: string;
  classId?: string;
  grade?: string;
  className?: string;
  section?: string;
};

type FeeTotals = {
  balance: number;
  fee: number;
};

function classSectionLabel(student: StudentLike): string {
  const cls = String(student.classId ?? student.grade ?? student.className ?? "").trim();
  const section = String(student.section ?? "").trim();
  if (!cls && !section) return "—";
  if (!section || section === "—") return cls.toUpperCase();
  return `${cls}-${section.toUpperCase()}`;
}

function monthBalanceValue(month: string, monthlyBalances: number[] | undefined): number {
  const idx = FEE_MONTHS.indexOf(month as (typeof FEE_MONTHS)[number]);
  if (idx < 0 || !monthlyBalances) return 0;
  return monthlyBalances[idx] ?? 0;
}

export function lineItemsFromReceipt(
  receipt: FeeReceiptRow & { lineItems?: FeeReceiptLineItem[]; particular?: string }
): FeeReceiptLineItem[] {
  if (Array.isArray(receipt.lineItems) && receipt.lineItems.length > 0) {
    return receipt.lineItems.map((row) => ({
      particular: String(row.particular ?? "FEE"),
      amount: parseAmount(row.amount),
    }));
  }
  const particular = String((receipt as { particular?: string }).particular ?? "").trim();
  if (particular) {
    return [{ particular: particular.toUpperCase(), amount: receipt.amount }];
  }
  return [{ particular: "FEE PAYMENT", amount: receipt.amount }];
}

export function buildFeeReceiptPrintData(params: {
  receipt: FeeReceiptRow & { lineItems?: FeeReceiptLineItem[]; particular?: string };
  student: StudentLike;
  academicYear?: string;
  feeTotals?: FeeTotals;
  monthlyBalances?: number[];
}): FeeReceiptPrintData {
  const { receipt, student, academicYear, feeTotals, monthlyBalances } = params;
  const lineItems = lineItemsFromReceipt(receipt);
  const grandTotal = lineItems.reduce((sum, row) => sum + row.amount, 0);
  const month = receipt.month || "APR";
  const txnId = isUpiPaymentMode(receipt.mode) ? String(receipt.reference ?? "").trim() : "";

  return {
    feeMonth: month,
    admissionNo: String(student.admissionNo ?? "—"),
    date: formatReceiptDate(receipt.date),
    studentName: String(student.name ?? student.studentName ?? "—"),
    receiptNo: receipt.receiptNo,
    fatherName: String(student.fatherName ?? "—"),
    mobile: String(student.fatherMobile1 ?? student.mobileNumber ?? student.parentPhone ?? "—"),
    classSection: classSectionLabel(student),
    paymentMode: receipt.mode,
    transactionId: txnId || undefined,
    lineItems,
    grandTotal,
    balanceUpToMonth: monthBalanceValue(month, monthlyBalances),
    balanceUpToMonthLabel: month,
    balanceUpToYearEnd: feeTotals?.balance ?? 0,
    balanceUpToYearEndLabel: balanceYearEndLabel(academicYear),
  };
}

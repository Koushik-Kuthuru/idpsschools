import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SCHOOL_LOGO_URI, SCHOOL_NAME } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import type { PaymentRecord } from '@/types';

export interface ReceiptData {
  transactionId: string;
  studentName: string;
  studentId: string;
  className?: string;
  rollNumber?: string;
  amount: number;
  method: string;
  date: string;
  receiptNumber: string;
  schoolName: string;
  period?: string;
  breakdown?: { label: string; amount: number }[];
  pendingDues?: number;
}

const DEFAULT_BREAKDOWN = [
  { label: 'Tuition Fees', amount: 1800 },
  { label: 'Sports & Activities', amount: 300 },
  { label: 'Transport Facility', amount: 150 },
  { label: 'Miscellaneous', amount: 400 },
];

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function buildReceiptFileName(data: ReceiptData): string {
  const name = sanitizeFilePart(data.studentName) || 'Student';
  const receipt = sanitizeFilePart(data.receiptNumber);
  const date = sanitizeFilePart(data.date.split('|')[0].trim());
  return `IDPS_Fee_Receipt_${name}_${receipt}_${date}.pdf`;
}

export function paymentToReceiptData(
  payment: PaymentRecord,
  student: { name?: string; studentId?: string; className?: string; rollNumber?: string },
  breakdown = DEFAULT_BREAKDOWN,
  pendingDues = 0,
): ReceiptData {
  return {
    transactionId: payment.transactionId ?? `TXN_${payment.id}`,
    studentName: student.name ?? 'Student',
    studentId: student.studentId ?? '—',
    className: student.className ?? '10-A',
    rollNumber: student.rollNumber ?? '001',
    amount: payment.amount,
    method: payment.method ?? 'Online Payment',
    date: payment.dateTime ?? payment.paidOn,
    receiptNumber: payment.receiptNumber ?? `RCP-${payment.id}`,
    schoolName: SCHOOL_NAME,
    period: payment.period,
    breakdown,
    pendingDues: pendingDues > 0 ? pendingDues : undefined,
  };
}

export async function generateFeeReceipt(data: ReceiptData): Promise<string> {
  const breakdownRows = (data.breakdown ?? DEFAULT_BREAKDOWN)
    .map((b) => `<tr><td>${b.label}</td><td style="text-align:right">${formatINR(b.amount)}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @media print { body { margin: 0; } }
  body { font-family: Lexend, Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 520px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 2px solid #0fbd83; margin-bottom: 20px; }
  .logo { width: 72px; height: 72px; object-fit: contain; border-radius: 50%; border: 2px solid #0fbd8333; }
  .school-name { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.3; }
  .doc-type { margin: 4px 0 0; font-size: 12px; color: #0fbd83; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f6f8f7; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
  .meta label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #0fbd831a; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
  .cell { background: #fff; padding: 12px; }
  .cell label { font-size: 10px; color: #64748b; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .total { font-size: 22px; color: #0fbd83; font-weight: 800; text-align: center; margin: 20px 0; }
  .paid { background: #0fbd831a; color: #0fbd83; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: 700; }
  .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 32px; }
  h3 { color: #0fbd83; font-size: 12px; text-transform: uppercase; margin: 16px 0 8px; }
</style></head><body>
  <div class="header">
    <img class="logo" src="${SCHOOL_LOGO_URI}" alt="IDPS Logo" />
    <div>
      <h2 class="school-name">${data.schoolName}</h2>
      <p class="doc-type">Fee Receipt</p>
    </div>
  </div>
  <div class="meta">
    <div><label>Receipt #</label><div><strong>${data.receiptNumber}</strong></div></div>
    <div style="text-align:right"><label>Date & Time</label><div><strong>${data.date}</strong></div></div>
  </div>
  ${data.period ? `<p style="font-size:14px;margin-bottom:12px"><strong>Payment Period:</strong> ${data.period}</p>` : ''}
  <h3>Student Details</h3>
  <div class="grid">
    <div class="cell"><label>Name</label><div>${data.studentName}</div></div>
    <div class="cell"><label>Enrollment ID</label><div>${data.studentId}</div></div>
    <div class="cell"><label>Class</label><div>${data.className ?? '10-A'}</div></div>
    <div class="cell"><label>Roll No.</label><div>${data.rollNumber ?? '001'}</div></div>
  </div>
  <h3>Fee Breakdown</h3>
  <table><tbody>${breakdownRows}</tbody></table>
  <div class="total">Amount Paid: ${formatINR(data.amount)}</div>
  <p style="text-align:center"><span class="paid">✓ Payment Successful</span></p>
  <table>
    <tr><td>Payment Method</td><td style="text-align:right">${data.method}</td></tr>
    <tr><td>Transaction ID</td><td style="text-align:right">${data.transactionId}</td></tr>
    ${data.pendingDues ? `<tr><td>Pending Dues</td><td style="text-align:right;color:#ef4444">${formatINR(data.pendingDues)}</td></tr>` : ''}
  </table>
  <div class="footer">Computer-generated receipt. No signature required.<br/>Powered by IDPS Digital Solutions</div>
</body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareReceipt(uri: string, title = 'Share Receipt') {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title });
  }
}

export async function downloadReceipt(uri: string, fileName: string) {
  const dest = `${FileSystem.documentDirectory ?? ''}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function downloadPaymentReceipt(
  payment: PaymentRecord,
  student: { name?: string; studentId?: string; className?: string; rollNumber?: string },
): Promise<{ path: string; fileName: string }> {
  const receiptData = paymentToReceiptData(payment, student);
  const uri = await generateFeeReceipt(receiptData);
  const fileName = buildReceiptFileName(receiptData);
  const path = await downloadReceipt(uri, fileName);
  return { path, fileName };
}

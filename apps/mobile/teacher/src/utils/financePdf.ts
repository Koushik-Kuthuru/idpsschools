import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { stitchImages } from '@/assets/images';
import { SCHOOL_NAME } from '@/constants/school';

export interface FinanceCategoryRow {
  label: string;
  amount: string;
  percent: number;
}

export interface FinanceDefaulterRow {
  name: string;
  class: string;
  amount: string;
  days: number;
}

export interface FinanceReportInput {
  title: string;
  periodLabel: string;
  summary: {
    total: string;
    target: string;
    balance: string;
    progress: number;
    month: string;
  };
  categories: FinanceCategoryRow[];
  defaulters?: FinanceDefaulterRow[];
  rangeLabel?: string;
  includeDefaulters?: boolean;
}

function sanitizeFilename(title: string): string {
  const base = title
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return base.endsWith('.pdf') ? base : `${base || 'Finance_Report'}.pdf`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFinanceHtml(input: FinanceReportInput): string {
  const { title, periodLabel, summary, categories, defaulters, rangeLabel, includeDefaulters } = input;

  const catRows = categories
    .map(
      (c) =>
        `<tr>
          <td>${escapeHtml(c.label)}</td>
          <td style="text-align:right">${escapeHtml(c.amount)}</td>
          <td style="text-align:center;font-weight:600">${c.percent}%</td>
        </tr>`,
    )
    .join('');

  const defaulterBlock =
    includeDefaulters && defaulters && defaulters.length > 0
      ? `<h2>Fee Defaulters</h2>
         <table>
           <thead><tr><th>Student</th><th>Class</th><th>Amount</th><th>Days Overdue</th></tr></thead>
           <tbody>
             ${defaulters
               .map(
                 (d) =>
                   `<tr>
                      <td>${escapeHtml(d.name)}</td>
                      <td>${escapeHtml(d.class)}</td>
                      <td style="text-align:right">${escapeHtml(d.amount)}</td>
                      <td style="text-align:center">${d.days}</td>
                    </tr>`,
               )
               .join('')}
           </tbody>
         </table>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 24mm 20mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; line-height: 1.5; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #0fbd83; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { width: 56px; height: 56px; object-fit: contain; }
    .school { font-size: 18px; font-weight: 700; color: #0f766e; }
    .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .summary { display: flex; gap: 20px; margin: 16px 0 24px; flex-wrap: wrap; }
    .stat { min-width: 120px; }
    .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .stat-val { font-size: 20px; font-weight: 700; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
    th { background: #ecfdf5; text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${stitchImages.loginLogo}" alt="School logo" />
    <div>
      <div class="school">${escapeHtml(SCHOOL_NAME)}</div>
      <div class="meta">${escapeHtml(periodLabel)}${rangeLabel ? ` · ${escapeHtml(rangeLabel)}` : ''}</div>
    </div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <div class="summary">
    <div class="stat"><div class="stat-lbl">Collected (${escapeHtml(summary.month)})</div><div class="stat-val">${escapeHtml(summary.total)}</div></div>
    <div class="stat"><div class="stat-lbl">Target</div><div class="stat-val">${escapeHtml(summary.target)}</div></div>
    <div class="stat"><div class="stat-lbl">Balance</div><div class="stat-val">${escapeHtml(summary.balance)}</div></div>
    <div class="stat"><div class="stat-lbl">Progress</div><div class="stat-val">${summary.progress}%</div></div>
  </div>
  <h2>Collection by Category</h2>
  <table>
    <thead><tr><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:center">Share</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>
  ${defaulterBlock}
  <div class="footer">Generated by Principal ERP · ${escapeHtml(new Date().toLocaleString('en-IN'))}</div>
</body>
</html>`;
}

async function sharePdfWeb(html: string, filename: string, title: string): Promise<void> {
  const printWin = window.open('', '_blank');
  if (!printWin) {
    Alert.alert('Download failed', 'Please allow pop-ups to export the report as PDF.');
    return;
  }
  printWin.document.write(html);
  printWin.document.title = filename.replace(/\.pdf$/i, '');
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 400);
  Alert.alert('Save as PDF', `"${title}" is ready. Choose "Save as PDF" in the print dialog.`);
}

async function sharePdfNative(html: string, filename: string, title: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  const dest = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, {
      mimeType: 'application/pdf',
      dialogTitle: title,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  Alert.alert('PDF ready', `Report saved as ${filename}`);
}

export async function shareFinanceReportAsPdf(input: FinanceReportInput): Promise<void> {
  const html = buildFinanceHtml(input);
  const filename = sanitizeFilename(input.title);

  try {
    if (Platform.OS === 'web') {
      await sharePdfWeb(html, filename, input.title);
      return;
    }
    await sharePdfNative(html, filename, input.title);
  } catch {
    Alert.alert('Download failed', 'Could not generate the finance report. Please try again.');
  }
}

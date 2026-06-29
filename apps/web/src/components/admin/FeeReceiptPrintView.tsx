"use client";

import { createPortal } from "react-dom";
import {
  type FeeReceiptPrintData,
  type FeeReceiptTemplateSettings,
  isUpiPaymentMode,
} from "@/lib/feeReceiptTemplate";

type FeeReceiptPrintViewProps = {
  data: FeeReceiptPrintData;
  template: FeeReceiptTemplateSettings;
};

const SCHOOL_GREEN = "#0b5d2e";
const CELL = "border border-black px-2 py-[5px] text-[11px] text-black align-top";
const LABEL = `${CELL} font-semibold whitespace-nowrap`;

function ReceiptLetterhead({ template }: { template: FeeReceiptTemplateSettings }) {
  const logoSrc = template.logoUrl?.trim() || "/idps-logo.png";
  const showLogo = template.showLogo !== false;

  return (
    <div className="border border-black border-b-0">
      <div className="grid grid-cols-[110px_1fr]">
        <div className="row-span-3 flex items-center justify-center border-r border-black bg-white p-2">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-[88px] w-[88px] object-contain" />
          ) : null}
        </div>

        <div className="border-b border-black px-3 py-1.5">
          <div className="flex items-start justify-between gap-2 text-[9px] leading-tight text-black uppercase">
            <span>CBSE AFFILIATION NO: {template.affiliationNo}</span>
            <span>UDISE CODE: {template.udiseCode}</span>
          </div>
        </div>

        <div className="border-b border-black px-3 py-2 text-center col-start-2">
          <h1
            className="text-[17px] font-bold uppercase leading-tight tracking-wide"
            style={{ color: SCHOOL_GREEN }}
          >
            {template.schoolName}
          </h1>
          <p className="text-[10px] font-semibold text-black mt-1">{template.schoolSubtitle1}</p>
          <p className="text-[9px] text-black mt-0.5 leading-snug">{template.schoolSubtitle2}</p>
          <p className="text-[9px] text-black mt-1.5 leading-snug">{template.schoolAddress}</p>
        </div>

        <div className="col-start-2 px-3 py-2 text-center text-[9px] text-black leading-snug border-b border-black">
          {template.contactEmail} ★ {template.contactWebsite} ★ Mobile: {template.contactMobile}
        </div>
      </div>
    </div>
  );
}

function ReceiptBody({ data, template }: FeeReceiptPrintViewProps) {
  const showTxnId = isUpiPaymentMode(data.paymentMode) && Boolean(data.transactionId?.trim());

  return (
    <div className="fee-receipt-copy border border-black bg-white text-black font-[Arial,Helvetica,sans-serif]">
      <ReceiptLetterhead template={template} />

      <div className={`${CELL} border-t-0 font-bold text-[12px]`}>
        Fee For Month : {data.feeMonth}
      </div>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={`${LABEL} w-[18%] border-t-0`}>Adm. No.</td>
            <td className={`${CELL} w-[32%] border-t-0`}>: {data.admissionNo}</td>
            <td className={`${LABEL} w-[18%] border-t-0`}>Date</td>
            <td className={`${CELL} w-[32%] border-t-0`}>: {data.date}</td>
          </tr>
          <tr>
            <td className={LABEL}>Student Name</td>
            <td className={CELL}>: {data.studentName}</td>
            <td className={LABEL}>Rec No</td>
            <td className={CELL}>: {data.receiptNo}</td>
          </tr>
          <tr>
            <td className={LABEL}>Father&apos;s Name</td>
            <td className={CELL}>: {data.fatherName}</td>
            <td className={LABEL}>Mobile No.</td>
            <td className={CELL}>: {data.mobile}</td>
          </tr>
          <tr>
            <td className={LABEL}>Class &amp; Section</td>
            <td className={CELL}>: {data.classSection}</td>
            <td className={LABEL}>Mode of Payment</td>
            <td className={CELL}>: {data.paymentMode}</td>
          </tr>
          {showTxnId ? (
            <tr>
              <td className={LABEL}>{template.transactionIdLabel}</td>
              <td className={CELL} colSpan={3}>
                : {data.transactionId}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black border-t-0">
        <thead>
          <tr>
            <th className={`${CELL} border-t-0 text-left w-[14%] font-bold`}>Sr. No.</th>
            <th className={`${CELL} border-t-0 text-left font-bold`}>Particular</th>
            <th className={`${CELL} border-t-0 text-right font-bold w-[22%]`}>Paid Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((row, idx) => (
            <tr key={`${row.particular}-${idx}`}>
              <td className={`${CELL} text-center`}>{idx + 1}</td>
              <td className={`${CELL} uppercase`}>{row.particular}</td>
              <td className={`${CELL} text-right`}>{row.amount.toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <td className={CELL} colSpan={2}>
              <span className="font-bold">GRAND TOTAL</span>
            </td>
            <td className={`${CELL} text-right font-bold`}>{data.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black border-t-0">
        <tbody>
          <tr>
            <td className={`${CELL} border-t-0 w-1/2 font-bold`}>
              Balance Up To {data.balanceUpToMonthLabel} : {data.balanceUpToMonth}
            </td>
            <td className={`${CELL} border-t-0 w-1/2 text-right font-bold`}>
              Balance Up {data.balanceUpToYearEndLabel} : {data.balanceUpToYearEnd}
            </td>
          </tr>
        </tbody>
      </table>

      <div className={`${CELL} border-t-0 min-h-[80px] relative`}>
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold">
          {template.signatureLabel}
        </span>
      </div>
    </div>
  );
}

export default function FeeReceiptPrintView({
  data,
  template,
  printRootId = "fee-receipt-print-root",
}: FeeReceiptPrintViewProps & { printRootId?: string }) {
  return (
    <div
      id={printRootId}
      className="fee-receipt-root mx-auto w-full max-w-[858px] bg-white"
    >
      <ReceiptBody data={data} template={template} />
    </div>
  );
}

export function FeeReceiptPrintPortal({
  data,
  template,
  open,
}: {
  data: FeeReceiptPrintData;
  template: FeeReceiptTemplateSettings;
  open: boolean;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fee-receipt-print-portal">
      <FeeReceiptPrintView data={data} template={template} printRootId="fee-receipt-print-portal-root" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 10mm; }
              html, body { background: #fff !important; }
              body > *:not(.fee-receipt-print-portal) { display: none !important; }
              .fee-receipt-print-portal {
                display: block !important;
                position: static !important;
                width: 100% !important;
                background: #fff !important;
              }
            }
            @media screen {
              .fee-receipt-print-portal { display: none !important; }
            }
          `,
        }}
      />
    </div>,
    document.body
  );
}

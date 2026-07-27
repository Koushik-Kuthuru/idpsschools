"use client";

import type { Pt1ReportCardData } from "@/lib/pt1ReportCard";

type Pt1ReportCardProps = {
  data: Pt1ReportCardData;
  className?: string;
};

/**
 * Periodic Assessment (PT) report card — A4 portrait, grades I–XII.
 * Matches official PT1 HTML: green frame, subject grades only, remarks + signatures.
 */
export default function Pt1ReportCard({ data, className = "" }: Pt1ReportCardProps) {
  return (
    <article className={`pt1-rc ${className}`.trim()}>
      <div className="pt1-rc-page">
        <div className="pt1-rc-frame">
          <div className="pt1-rc-outer">
            <div className="pt1-rc-mid">
              <div className="pt1-rc-inner">
                <div className="pt1-rc-brand">
                  {data.showSchoolLogo !== false ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="pt1-rc-logo"
                      src={data.schoolLogoUrl || "/idps-report-card-school-logo.png"}
                      alt="IDPS"
                    />
                  ) : null}
                  <div className="pt1-rc-school-name">{data.schoolName}</div>
                  <div className="pt1-rc-affil-badge">
                    CBSE Affiliation No.{data.affiliationNo}
                  </div>
                </div>

                <div className="pt1-rc-exam-title">
                  {data.assessmentTitle || "PERIODIC ASSESSMENT – I"}
                  <br />
                  SESSION ({data.academicYear})
                </div>

                <div className="pt1-rc-field pt1-rc-field-name">
                  <span className="pt1-rc-label">Name :</span>
                  <span className="pt1-rc-underline">{data.studentName}</span>
                </div>

                <div className="pt1-rc-meta-row">
                  <div className="pt1-rc-field">
                    <span className="pt1-rc-label">Grade :</span>
                    <span className="pt1-rc-underline">{data.className}</span>
                  </div>
                  <div className="pt1-rc-field">
                    <span className="pt1-rc-label">Section :</span>
                    <span className="pt1-rc-underline">{data.sectionName}</span>
                  </div>
                  <div className="pt1-rc-field">
                    <span className="pt1-rc-label">House :</span>
                    <span className="pt1-rc-underline">{data.house}</span>
                  </div>
                </div>

                <table className="pt1-rc-subjects">
                  <tbody>
                    <tr>
                      <td>Subjects</td>
                      <td>Grade</td>
                    </tr>
                    {data.subjects.map((row) => (
                      <tr key={row.subject}>
                        <td>{row.subject}</td>
                        <td>{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pt1-rc-remarks-block">
                  <div className="pt1-rc-remarks-label">Remarks:</div>
                  <div className="pt1-rc-remarks-line">{data.remarks}</div>
                  <div className="pt1-rc-remarks-line" />
                </div>

                <div className="pt1-rc-sign-block">
                  <div className="pt1-rc-sign-row pt1-rc-sign-images">
                    <div />
                    <div />
                    <div className="pt1-rc-principal-sign">
                      {data.principalSignatureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.principalSignatureUrl} alt="Principal signature" />
                      ) : (
                        <div className="pt1-rc-sign-placeholder" />
                      )}
                    </div>
                  </div>
                  <div className="pt1-rc-sign-row pt1-rc-sign-labels">
                    <div className="pt1-rc-date">
                      Date : <span>{data.generatedOn}</span>
                    </div>
                    <div>Class Teacher</div>
                    <div>Principal</div>
                  </div>
                </div>
              </div>
              <p className="pt1-rc-footer-address">{data.schoolAddress}</p>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pt1-rc {
          width: 21cm;
          flex-shrink: 0;
        }
        .pt1-rc-page {
          width: 21cm;
          height: 29.7cm;
          background: #fff;
          box-sizing: border-box;
          overflow: hidden;
          color: #000;
          font-family: Cambria, "Times New Roman", Times, serif;
        }
        .pt1-rc-frame {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0;
        }
        .pt1-rc-outer {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: 28px solid #007f17;
          background: #007f17;
        }
        .pt1-rc-mid {
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: 5px solid #000;
          background: #fff;
          display: flex;
          flex-direction: column;
        }
        .pt1-rc-inner {
          flex: 1;
          margin: 3px;
          border: 2px solid #000;
          box-sizing: border-box;
          padding: 10px 14px 8px;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .pt1-rc-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .pt1-rc-logo {
          width: 115px;
          height: auto;
          display: block;
          margin: 0 auto 2px;
        }
        .pt1-rc-school-name {
          font-family: Impact, "Arial Black", sans-serif;
          font-size: 36px;
          color: #008000;
          letter-spacing: 1px;
          line-height: 1.05;
          font-weight: 700;
          margin: 2px 0 8px;
        }
        .pt1-rc-affil-badge {
          background: #008000;
          color: #fff;
          font-family: Cambria, serif;
          font-size: 14px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        .pt1-rc-exam-title {
          text-align: center;
          font-size: 16pt;
          font-weight: 700;
          line-height: 1.35;
          margin: 4px 0 14px;
        }
        .pt1-rc-field {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          font-size: 14pt;
          margin-bottom: 10px;
        }
        .pt1-rc-field-name {
          margin-top: 4px;
          margin-bottom: 16px;
        }
        .pt1-rc-label {
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pt1-rc-underline {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 1.2em;
          padding: 0 4px 1px;
          font-weight: 500;
        }
        .pt1-rc-meta-row {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        .pt1-rc-subjects {
          width: 82%;
          margin: 18px auto 0;
          border-collapse: collapse;
          table-layout: fixed;
          font-weight: 700;
        }
        .pt1-rc-subjects td {
          border: 1px solid #000;
          padding: 7px 8px;
          text-align: center;
          font-size: 12.5pt;
          line-height: 1.35;
        }
        .pt1-rc-subjects tr:first-child td {
          font-size: 14pt;
        }
        .pt1-rc-subjects td:first-child {
          width: 70%;
        }
        .pt1-rc-subjects td:last-child {
          width: 30%;
        }
        .pt1-rc-remarks-block {
          width: 90%;
          margin: 28px auto 0;
        }
        .pt1-rc-remarks-label {
          font-size: 14pt;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .pt1-rc-remarks-line {
          min-height: 42px;
          border-bottom: 1px solid #000;
          padding: 4px 8px 4px 24px;
          font-size: 12pt;
          line-height: 1.4;
        }
        .pt1-rc-sign-block {
          margin-top: auto;
          padding-top: 18px;
        }
        .pt1-rc-sign-row {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr;
          align-items: end;
          gap: 8px;
        }
        .pt1-rc-sign-images {
          min-height: 56px;
          margin-bottom: 4px;
        }
        .pt1-rc-principal-sign {
          display: flex;
          justify-content: center;
        }
        .pt1-rc-principal-sign img {
          height: 50px;
          width: 150px;
          object-fit: contain;
        }
        .pt1-rc-sign-placeholder {
          width: 120px;
          height: 40px;
          border: 1px solid #ccc;
        }
        .pt1-rc-sign-labels {
          font-size: 13.5pt;
          font-weight: 700;
          text-align: center;
        }
        .pt1-rc-date {
          text-align: left;
          padding-left: 12px;
        }
        .pt1-rc-date span {
          font-weight: 500;
          border-bottom: 1px solid #000;
          padding: 0 6px 1px;
        }
        .pt1-rc-footer-address {
          margin: 0;
          padding: 10px 8px 6px;
          text-align: center;
          font-size: 11.5pt;
          font-weight: 700;
          color: #fff;
          background: #007f17;
          font-family: Cambria, serif;
          line-height: 1.25;
        }
        @media print {
          .pt1-rc,
          .pt1-rc-page {
            width: 21cm !important;
            height: 29.7cm !important;
            max-width: none !important;
          }
        }
      `,
        }}
      />
    </article>
  );
}

"use client";

import {
  SCHOLASTIC_GRADE_BANDS,
  TERM2_CO_SCHOLASTIC_GRADE_POINTS,
  grandTotalPercent,
  halfColumnPercent,
  sumGrandTotals,
  sumHalfColumn,
  type Term2ReportCardData,
} from "@/lib/term2ReportCard";
import { gradeForTerm1Percent } from "@/lib/term1ReportCard";

function cell(v: number | string | null | undefined) {
  if (v == null || v === "") return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

type Term2ReportCardProps = {
  data: Term2ReportCardData;
  className?: string;
};

/**
 * Term-2 / annual report card (grades 1–12) — A4 landscape, multi-page,
 * matching official PERFORMANCE PROFILE HTML.
 */
export default function Term2ReportCard({ data, className = "" }: Term2ReportCardProps) {
  const subjectCount = Math.max(data.scholastic.length, 1);

  const t1 = {
    pa: sumHalfColumn(data.scholastic, "term1", "pa"),
    se: sumHalfColumn(data.scholastic, "term1", "se"),
    ma: sumHalfColumn(data.scholastic, "term1", "ma"),
    nb: sumHalfColumn(data.scholastic, "term1", "nb"),
    term: sumHalfColumn(data.scholastic, "term1", "term"),
    total: sumHalfColumn(data.scholastic, "term1", "total"),
  };
  const t2 = {
    pa: sumHalfColumn(data.scholastic, "term2", "pa"),
    se: sumHalfColumn(data.scholastic, "term2", "se"),
    ma: sumHalfColumn(data.scholastic, "term2", "ma"),
    nb: sumHalfColumn(data.scholastic, "term2", "nb"),
    term: sumHalfColumn(data.scholastic, "term2", "term"),
    total: sumHalfColumn(data.scholastic, "term2", "total"),
  };
  const pct1 = {
    pa: halfColumnPercent(data.scholastic, "term1", "pa", 5),
    se: halfColumnPercent(data.scholastic, "term1", "se", 5),
    ma: halfColumnPercent(data.scholastic, "term1", "ma", 5),
    nb: halfColumnPercent(data.scholastic, "term1", "nb", 5),
    term: halfColumnPercent(data.scholastic, "term1", "term", 80),
    total: halfColumnPercent(data.scholastic, "term1", "total", 100),
  };
  const pct2 = {
    pa: halfColumnPercent(data.scholastic, "term2", "pa", 5),
    se: halfColumnPercent(data.scholastic, "term2", "se", 5),
    ma: halfColumnPercent(data.scholastic, "term2", "ma", 5),
    nb: halfColumnPercent(data.scholastic, "term2", "nb", 5),
    term: halfColumnPercent(data.scholastic, "term2", "term", 80),
    total: halfColumnPercent(data.scholastic, "term2", "total", 100),
  };
  const grandSum = sumGrandTotals(data.scholastic);
  const grandPct = grandTotalPercent(data.scholastic);
  const grade1 = gradeForTerm1Percent(pct1.total);
  const grade2 = gradeForTerm1Percent(pct2.total);
  const gradeFinal = gradeForTerm1Percent(grandPct);

  const infoRows: Array<{ label: string; value: string }> = [
    { label: "ADMISSION NO.", value: data.admissionNo },
    { label: "NAME OF THE STUDENT", value: data.studentName },
    { label: "FATHER'S NAME", value: data.fatherName },
    { label: "MOTHER'S NAME", value: data.motherName },
    { label: "CLASS & SECTION", value: data.classSection },
    { label: "HOUSE", value: data.house },
    { label: "DATE OF BIRTH", value: data.dateOfBirth },
    { label: "RESIDENTIAL ADDRESS", value: data.residentialAddress },
    { label: "AADHAR NO.", value: data.aadharNo },
    { label: "TELEPHONE NO.", value: data.telephoneNo },
  ];

  return (
    <article className={`term2-rc ${className}`.trim()}>
      {/* ——— Page 1: Performance profile ——— */}
      <div className="term2-rc-page">
        <div className="term2-rc-inner">
          <div className="term2-rc-header">
            <div className="term2-rc-logo-left">
              {data.showSchoolLogo !== false ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.schoolLogoUrl || "/idps-report-card-school-logo.png"}
                  alt="IDPS"
                />
              ) : null}
            </div>
            <div className="term2-rc-header-center">
              <div className="term2-rc-title-wrap">
                <div className="term2-rc-affil-row">
                  <span>CBSE AFFILIATION NO: {data.affiliationNo}</span>
                  <span>UDISE CODE: {data.udiseCode}</span>
                </div>
                <div className="term2-rc-school-name">{data.schoolName}</div>
              </div>
              <div className="term2-rc-sub-1">{data.schoolSubtitle1}</div>
              <div className="term2-rc-sub-2">{data.schoolSubtitle2}</div>
              <div className="term2-rc-rule term2-rc-rule-primary" />
              <div className="term2-rc-address">{data.schoolAddress}</div>
              <div className="term2-rc-rule term2-rc-rule-muted" />
              <div className="term2-rc-section-title">{data.profileTitle || "PERFORMANCE PROFILE"}</div>
            </div>
            <div className="term2-rc-logo-right">
              {data.showBoardLogo !== false ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.boardLogoUrl || "/images/cbse-logo.png"} alt="CBSE" />
              ) : null}
            </div>
          </div>

          <table className="term2-rc-info">
            <tbody>
              {infoRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="term2-rc-table term2-rc-attendance">
            <tbody>
              <tr>
                <td rowSpan={2}>ATTENDANCE</td>
                <td>TOTAL NUMBER OF WORKING DAYS</td>
                <td>TOTAL NUMBER OF DAYS PRESENT</td>
              </tr>
              <tr>
                <td>{cell(data.workingDays)}</td>
                <td>{cell(data.daysPresent)}</td>
              </tr>
            </tbody>
          </table>

          <table className="term2-rc-table term2-rc-health">
            <tbody>
              <tr>
                <td colSpan={2}>HEALTH STATUS</td>
              </tr>
              <tr>
                <td>HEIGHT (CM)</td>
                <td>{data.heightCm}</td>
              </tr>
              <tr>
                <td>WEIGHT (KG)</td>
                <td>{data.weightKg}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— Page 2: Academic performance ——— */}
      <div className="term2-rc-page">
        <div className="term2-rc-inner term2-rc-inner-pad">
          <div className="term2-rc-section-title">ACADEMIC PERFORMANCE</div>

          <table className="term2-rc-table term2-rc-scholastic">
            <tbody>
              <tr>
                <td colSpan={2} />
                <td colSpan={7}>TERMINAL - I</td>
                <td colSpan={7}>TERMINAL - II</td>
                <td colSpan={2}>TOTAL</td>
              </tr>
              <tr className="term2-rc-col-heads">
                <td>S.No.</td>
                <td>SCHOLASTIC</td>
                <td>
                  PA-1
                  <br />
                  (05)
                </td>
                <td>
                  SE-1
                  <br />
                  (05)
                </td>
                <td>
                  MA-1
                  <br />
                  (05)
                </td>
                <td>
                  NB-1
                  <br />
                  (05)
                </td>
                <td>
                  T1
                  <br />
                  (80)
                </td>
                <td>
                  TOTAL
                  <br />
                  (100)
                </td>
                <td>GRADE</td>
                <td>
                  PA-2
                  <br />
                  (05)
                </td>
                <td>
                  SE-2
                  <br />
                  (05)
                </td>
                <td>
                  MA-2
                  <br />
                  (05)
                </td>
                <td>
                  NB-2
                  <br />
                  (05)
                </td>
                <td>
                  T2
                  <br />
                  (80)
                </td>
                <td>
                  TOTAL
                  <br />
                  (100)
                </td>
                <td>GRADE</td>
                <td>
                  GRAND TOTAL
                  <br />
                  (200)
                </td>
                <td>FINAL GRADE</td>
              </tr>
              {data.scholastic.map((row, i) => (
                <tr key={row.subject}>
                  <td>{i + 1}</td>
                  <td className="term2-rc-subj">{row.subject}</td>
                  <td>{cell(row.term1.pa)}</td>
                  <td>{cell(row.term1.se)}</td>
                  <td>{cell(row.term1.ma)}</td>
                  <td>{cell(row.term1.nb)}</td>
                  <td>{cell(row.term1.term)}</td>
                  <td>{cell(row.term1.total)}</td>
                  <td>{row.term1.grade}</td>
                  <td>{cell(row.term2.pa)}</td>
                  <td>{cell(row.term2.se)}</td>
                  <td>{cell(row.term2.ma)}</td>
                  <td>{cell(row.term2.nb)}</td>
                  <td>{cell(row.term2.term)}</td>
                  <td>{cell(row.term2.total)}</td>
                  <td>{row.term2.grade}</td>
                  <td>{cell(row.grandTotal)}</td>
                  <td>{row.finalGrade}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}>TOTAL MARKS</td>
                <td>{cell(t1.pa)}</td>
                <td>{cell(t1.se)}</td>
                <td>{cell(t1.ma)}</td>
                <td>{cell(t1.nb)}</td>
                <td>{cell(t1.term)}</td>
                <td>{cell(t1.total)}</td>
                <td />
                <td>{cell(t2.pa)}</td>
                <td>{cell(t2.se)}</td>
                <td>{cell(t2.ma)}</td>
                <td>{cell(t2.nb)}</td>
                <td>{cell(t2.term)}</td>
                <td>{cell(t2.total)}</td>
                <td />
                <td>{cell(grandSum)}</td>
                <td />
              </tr>
              <tr>
                <td colSpan={2}>TOTAL %</td>
                <td>{cell(pct1.pa)}</td>
                <td>{cell(pct1.se)}</td>
                <td>{cell(pct1.ma)}</td>
                <td>{cell(pct1.nb)}</td>
                <td>{cell(pct1.term)}</td>
                <td>{cell(pct1.total)}</td>
                <td>{grade1}</td>
                <td>{cell(pct2.pa)}</td>
                <td>{cell(pct2.se)}</td>
                <td>{cell(pct2.ma)}</td>
                <td>{cell(pct2.nb)}</td>
                <td>{cell(pct2.term)}</td>
                <td>{cell(pct2.total)}</td>
                <td>{grade2}</td>
                <td>{cell(grandPct)}</td>
                <td>{gradeFinal}</td>
              </tr>
            </tbody>
          </table>

          {data.gradeOnlySubjects.length > 0 ? (
            <table className="term2-rc-table term2-rc-grade-only">
              <tbody>
                <tr>
                  <td>S.No.</td>
                  <td>SUBJECT</td>
                  <td>OVERALL GRADE</td>
                </tr>
                {data.gradeOnlySubjects.map((row, i) => (
                  <tr key={row.subject}>
                    <td>{i + 1}</td>
                    <td>{row.subject}</td>
                    <td>{row.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          <div className="term2-rc-footnote">
            Subjects shown: {subjectCount} scholastic
            {data.gradeOnlySubjects.length
              ? ` + ${data.gradeOnlySubjects.length} grade-only`
              : ""}
          </div>
        </div>
      </div>

      {/* ——— Page 3: Grading system ——— */}
      <div className="term2-rc-page">
        <div className="term2-rc-inner term2-rc-inner-pad">
          <div className="term2-rc-section-title">GRADING SYSTEM</div>

          <div className="term2-rc-grade-grid">
            <table className="term2-rc-table term2-rc-bands">
              <tbody>
                <tr>
                  <td colSpan={2}>SCHOLASTIC AREAS GRADING SYSTEM</td>
                </tr>
                <tr>
                  <th>GRADE</th>
                  <th>PERCENTAGE</th>
                </tr>
                {SCHOLASTIC_GRADE_BANDS.map((band) => (
                  <tr key={band.grade}>
                    <td>{band.grade}</td>
                    <td>{band.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="term2-rc-table term2-rc-co">
              <tbody>
                <tr>
                  <td>CO SCHOLASTIC AREAS</td>
                  <td>( GRADES A – C ) ON 3 POINT GRADING SCALE</td>
                </tr>
                {data.coScholastic.map((row) => (
                  <tr key={row.area}>
                    <td>{row.area}</td>
                    <td>{row.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="term2-rc-table term2-rc-bands">
              <tbody>
                <tr>
                  <td colSpan={2}>CO-SCHOLASTIC AREAS &amp; DISCIPLINE GRADING SYSTEM</td>
                </tr>
                <tr>
                  <th>GRADE</th>
                  <th>GRADE POINT</th>
                </tr>
                {TERM2_CO_SCHOLASTIC_GRADE_POINTS.map((row) => (
                  <tr key={row.grade}>
                    <td>{row.grade}</td>
                    <td>{row.point}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="term2-rc-table term2-rc-discipline">
              <tbody>
                <tr>
                  <td colSpan={2}>
                    DISCIPLINE
                    <br />
                    (GRADES A – C) ON 3 POINT GRADING SCALE
                  </td>
                </tr>
                <tr>
                  <td>GRADE</td>
                  <td>{data.disciplineGrade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className="term2-rc-table term2-rc-key">
            <tbody>
              <tr>
                <td>KEY</td>
              </tr>
              <tr>
                <td>
                  PA - PERIODIC ASSESSMENT,&nbsp;&nbsp; SE - SUBJECT ENRICHMENT ACTIVITY,&nbsp;&nbsp;
                  MA - MULTIPLE ASSESSMENT,&nbsp;&nbsp; NB - NOTE BOOK SUBMISSION,&nbsp;&nbsp; AB -
                  ABSENT
                </td>
              </tr>
            </tbody>
          </table>

          <table className="term2-rc-table term2-rc-remarks">
            <tbody>
              <tr>
                <td>REMARKS :</td>
                <td colSpan={4}>{data.remarks}</td>
              </tr>
              <tr>
                <td>SIGNATURE</td>
                <td>CLASS TEACHER</td>
                <td />
                <td>PRINCIPAL</td>
                <td>
                  <div className="term2-rc-placeholder" />
                </td>
              </tr>
              <tr>
                <td colSpan={5}>REPORT CARD GENERATED ON : {data.generatedOn}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ——— Page 4: Session ——— */}
      <div className="term2-rc-page">
        <div className="term2-rc-inner term2-rc-inner-pad">
          <div className="term2-rc-session">
            <div className="term2-rc-section-title">SESSION ({data.academicYear})</div>
            <div className="term2-rc-session-media">
              {data.sessionImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.sessionImageUrl} alt="Class session" />
              ) : (
                <div className="term2-rc-session-placeholder">Class photograph</div>
              )}
            </div>
            <div className="term2-rc-session-meta">
              <span>
                GRADE:&nbsp;&nbsp;<u>{data.className || "—"}</u>
              </span>
              <span>
                SECTION:&nbsp;&nbsp;<u>{data.sectionName || "—"}</u>
              </span>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .term2-rc {
          width: 29.7cm;
          flex-shrink: 0;
        }
        .term2-rc-page {
          width: 29.7cm;
          height: 21cm;
          background: #fff;
          border: 5px solid #005f33;
          padding: 3px;
          box-sizing: border-box;
          overflow: hidden;
          color: #000;
          font-family: Cambria, "Times New Roman", Times, serif;
          font-size: 10pt;
          page-break-after: always;
          break-after: page;
          margin-bottom: 16px;
        }
        .term2-rc-page:last-child {
          page-break-after: auto;
          break-after: auto;
          margin-bottom: 0;
        }
        .term2-rc-inner {
          width: 100%;
          height: 100%;
          border: 1.5px solid #005f33;
          padding: 6px 10px 8px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .term2-rc-inner-pad {
          padding-top: 14px;
        }
        .term2-rc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .term2-rc-logo-left img {
          width: 120px;
          height: auto;
          display: block;
        }
        .term2-rc-logo-right img {
          width: 105px;
          height: auto;
          display: block;
        }
        .term2-rc-header-center {
          flex: 1 1 auto;
          text-align: center;
          min-width: 0;
        }
        .term2-rc-title-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: stretch;
          max-width: 100%;
        }
        .term2-rc-affil-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-weight: 700;
          font-size: 10.5pt;
          gap: 10px;
        }
        .term2-rc-school-name {
          font-family: Impact, "Arial Black", sans-serif;
          font-size: 42px;
          color: #006634;
          margin: -6px 0 0;
          letter-spacing: 2px;
          line-height: 1;
          white-space: nowrap;
          font-weight: 700;
        }
        .term2-rc-sub-1,
        .term2-rc-sub-2,
        .term2-rc-address {
          font-size: 10.5pt;
          font-weight: 700;
          line-height: 1.15;
        }
        .term2-rc-sub-1 { margin-top: -4px; }
        .term2-rc-rule {
          width: 98%;
          margin: 1px auto 0;
          border: none;
          border-top: 1px solid #3a416d;
          height: 0;
        }
        .term2-rc-rule-muted { border-top-color: #8080806b; }
        .term2-rc-section-title {
          text-align: center;
          font-size: 20pt;
          font-weight: 700;
          color: #006634;
          letter-spacing: 4px;
          margin: 8px 0 6px;
          font-family: Impact, "Arial Black", sans-serif;
        }
        .term2-rc-info {
          width: 92%;
          margin: 12px auto 0;
          border-collapse: collapse;
          font-size: 12pt;
          line-height: 1.55;
          font-weight: 700;
        }
        .term2-rc-info td {
          border: 1px solid #000;
          padding: 3px 8px;
          text-align: left;
          vertical-align: middle;
        }
        .term2-rc-info td:first-child {
          width: 28%;
          white-space: nowrap;
        }
        .term2-rc-table {
          width: 92%;
          margin: 18px auto 0;
          border-collapse: collapse;
          table-layout: fixed;
          font-weight: 700;
          text-align: center;
        }
        .term2-rc-table td,
        .term2-rc-table th {
          border: 1px solid #000;
          padding: 4px 3px;
          vertical-align: middle;
          font-size: 9.5pt;
        }
        .term2-rc-attendance,
        .term2-rc-health {
          font-size: 11pt;
        }
        .term2-rc-scholastic {
          width: 95%;
          margin-top: 12px;
        }
        .term2-rc-scholastic td {
          font-size: 8pt;
          padding: 3px 2px;
          line-height: 1.15;
        }
        .term2-rc-col-heads td {
          height: 42px;
          font-size: 7.5pt;
        }
        .term2-rc-subj {
          text-align: left !important;
          padding-left: 6px !important;
        }
        .term2-rc-grade-only {
          width: 95%;
          margin-top: 16px;
        }
        .term2-rc-grade-only td {
          padding: 6px 4px;
          font-size: 10pt;
        }
        .term2-rc-footnote {
          display: none;
        }
        .term2-rc-grade-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 14px;
          width: 95%;
          margin: 10px auto 0;
          align-items: start;
        }
        .term2-rc-grade-grid > .term2-rc-table {
          width: 100%;
          margin: 0;
        }
        .term2-rc-co td {
          height: 28px;
          font-size: 9pt;
        }
        .term2-rc-discipline td {
          height: 36px;
        }
        .term2-rc-key {
          width: 95%;
          margin-top: 28px;
        }
        .term2-rc-key td {
          padding: 8px 6px;
          font-size: 10pt;
        }
        .term2-rc-remarks {
          width: 95%;
          margin-top: 14px;
        }
        .term2-rc-remarks td {
          padding: 8px 6px;
          font-size: 11pt;
          text-align: left;
          height: 36px;
        }
        .term2-rc-placeholder {
          width: 120px;
          height: 40px;
          border: 1px solid #ccc;
          margin: 0 auto;
        }
        .term2-rc-session {
          width: 92%;
          margin: 20px auto 0;
          border: 2px solid #000;
          min-height: 620px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px 20px;
          box-sizing: border-box;
        }
        .term2-rc-session .term2-rc-section-title {
          margin-top: 8px;
        }
        .term2-rc-session-media {
          width: 86%;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
        }
        .term2-rc-session-media img {
          max-width: 100%;
          max-height: 420px;
          object-fit: contain;
        }
        .term2-rc-session-placeholder {
          width: 100%;
          height: 360px;
          border: 1px dashed #999;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          font-size: 14pt;
          font-weight: 700;
        }
        .term2-rc-session-meta {
          width: 86%;
          display: flex;
          justify-content: space-around;
          margin-top: 12px;
          font-size: 18pt;
          font-weight: 700;
          color: #006634;
        }
        @media print {
          .term2-rc,
          .term2-rc-page {
            width: 29.7cm !important;
            height: 21cm !important;
            max-width: none !important;
            margin-bottom: 0 !important;
          }
        }
      `,
        }}
      />
    </article>
  );
}

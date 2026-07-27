"use client";

import {
  CO_SCHOLASTIC_GRADE_POINTS,
  SCHOLASTIC_GRADE_BANDS,
  columnPercent,
  overallGradeFromTotalPercent,
  sumColumn,
  type Term1ReportCardData,
} from "@/lib/term1ReportCard";

function cell(v: number | string | null | undefined) {
  if (v == null || v === "") return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

type Term1ReportCardProps = {
  data: Term1ReportCardData;
  className?: string;
};

/**
 * Term-1 report card (grades I–X) — A4 landscape matching official IDPS Terminal-I HTML.
 */
export default function Term1ReportCard({ data, className = "" }: Term1ReportCardProps) {
  const totals = {
    pa: sumColumn(data.scholastic, "pa"),
    se: sumColumn(data.scholastic, "se"),
    ma: sumColumn(data.scholastic, "ma"),
    nb: sumColumn(data.scholastic, "nb"),
    t1: sumColumn(data.scholastic, "t1"),
    total: sumColumn(data.scholastic, "total"),
  };
  const percents = {
    pa: columnPercent(data.scholastic, "pa", 5),
    se: columnPercent(data.scholastic, "se", 5),
    ma: columnPercent(data.scholastic, "ma", 5),
    nb: columnPercent(data.scholastic, "nb", 5),
    t1: columnPercent(data.scholastic, "t1", 80),
    total: columnPercent(data.scholastic, "total", 100),
  };
  const overallGrade = overallGradeFromTotalPercent(percents.total);

  return (
    <article className={`term1-rc ${className}`.trim()}>
      <div className="term1-rc-page">
        <div className="term1-rc-inner">
          <div className="term1-rc-header">
            <div className="term1-rc-logo-left">
              {data.showSchoolLogo !== false ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.schoolLogoUrl || "/idps-report-card-school-logo.png"}
                  alt="IDPS"
                />
              ) : null}
            </div>
            <div className="term1-rc-header-center">
              <div className="term1-rc-title-wrap">
                <div className="term1-rc-affil-row">
                  <span>CBSE AFFILIATION NO: {data.affiliationNo}</span>
                  <span>UDISE CODE: {data.udiseCode}</span>
                </div>
                <div className="term1-rc-school-name">{data.schoolName}</div>
              </div>
              <div className="term1-rc-sub-1">{data.schoolSubtitle1}</div>
              <div className="term1-rc-sub-2">{data.schoolSubtitle2}</div>
              <div className="term1-rc-rule term1-rc-rule-primary" />
              <div className="term1-rc-address">{data.schoolAddress}</div>
              <div className="term1-rc-rule term1-rc-rule-muted" />
              <div className="term1-rc-term-title">
                {data.termTitle} {data.academicYear}
              </div>
            </div>
            <div className="term1-rc-logo-right">
              {data.showBoardLogo !== false ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.boardLogoUrl || "/images/cbse-logo.png"} alt="CBSE" />
              ) : null}
            </div>
          </div>

          <table className="term1-rc-student">
            <tbody>
              <tr>
                <td>NAME OF THE STUDENT</td>
                <td>{data.studentName}</td>
                <td>ADMISSION NO.</td>
                <td>{data.admissionNo}</td>
              </tr>
              <tr>
                <td>FATHER&apos;S NAME</td>
                <td>{data.fatherName}</td>
                <td>MOTHER&apos;S NAME</td>
                <td>{data.motherName}</td>
              </tr>
              <tr>
                <td>CLASS &amp; SECTION</td>
                <td>{data.classSection}</td>
                <td>AADHAR NO.</td>
                <td>{data.aadharNo}</td>
              </tr>
              <tr>
                <td>DATE OF BIRTH</td>
                <td>{data.dateOfBirth}</td>
                <td>HOUSE</td>
                <td>{data.house}</td>
              </tr>
              <tr>
                <td>RESIDENTIAL ADDRESS</td>
                <td>{data.residentialAddress}</td>
                <td>TELEPHONE NO.</td>
                <td>{data.telephoneNo}</td>
              </tr>
            </tbody>
          </table>

          <div className="term1-rc-main">
            <div className="term1-rc-left">
              <table className="term1-rc-table term1-rc-scholastic">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td colSpan={9}>TERMINAL - I</td>
                  </tr>
                  <tr>
                    <td>S.No.</td>
                    <td>SCHOLASTIC</td>
                    <td>
                      PA
                      <br />
                      (05)
                    </td>
                    <td>
                      SE
                      <br />
                      (05)
                    </td>
                    <td>
                      MA
                      <br />
                      (05)
                    </td>
                    <td>
                      NB
                      <br />
                      (05)
                    </td>
                    <td>
                      TERM
                      <br />
                      (80)
                    </td>
                    <td>
                      TOTAL
                      <br />
                      (100)
                    </td>
                    <td>GRADE</td>
                  </tr>
                  {data.scholastic.map((row, idx) => (
                    <tr key={row.subject}>
                      <td>{idx + 1}</td>
                      <td className="term1-rc-subj">{row.subject}</td>
                      <td>{cell(row.pa)}</td>
                      <td>{cell(row.se)}</td>
                      <td>{cell(row.ma)}</td>
                      <td>{cell(row.nb)}</td>
                      <td>{cell(row.t1)}</td>
                      <td>{cell(row.total)}</td>
                      <td>{row.grade}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2}>TOTAL MARKS</td>
                    <td>{cell(totals.pa)}</td>
                    <td>{cell(totals.se)}</td>
                    <td>{cell(totals.ma)}</td>
                    <td>{cell(totals.nb)}</td>
                    <td>{cell(totals.t1)}</td>
                    <td>{cell(totals.total)}</td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={2}>TOTAL %</td>
                    <td>{cell(percents.pa)}</td>
                    <td>{cell(percents.se)}</td>
                    <td>{cell(percents.ma)}</td>
                    <td>{cell(percents.nb)}</td>
                    <td>{cell(percents.t1)}</td>
                    <td>{cell(percents.total)}</td>
                    <td>{overallGrade}</td>
                  </tr>
                </tbody>
              </table>

              {data.gradeOnlySubjects.length > 0 ? (
                <table className="term1-rc-table term1-rc-grade-only">
                  <colgroup>
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "60%" }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td>S.No.</td>
                      <td>SUBJECT</td>
                      <td>GRADE</td>
                    </tr>
                    {data.gradeOnlySubjects.map((row, idx) => (
                      <tr key={row.subject}>
                        <td>{idx + 1}</td>
                        <td className="term1-rc-subj">{row.subject}</td>
                        <td>{row.grade || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <table className="term1-rc-table term1-rc-co">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "60%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td>S.No.</td>
                    <td>CO SCHOLASTIC AREAS</td>
                    <td className="term1-rc-co-scale">
                      ( GRADES A – C ) ON 3 POINT GRADING SCALE
                    </td>
                  </tr>
                  {data.coScholastic.map((row, idx) => (
                    <tr key={row.area}>
                      <td>{idx + 1}</td>
                      <td className="term1-rc-subj term1-rc-left-align">
                        {row.area.includes("PRE-VOCATIONAL")
                          ? "WORK EDUCATION (OR PRE-VOCATIONAL EDUCATION)"
                          : row.area}
                      </td>
                      <td>{row.grade || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="term1-rc-right">
              <table className="term1-rc-table term1-rc-side">
                <tbody>
                  <tr>
                    <td colSpan={2}>ATTENDANCE</td>
                  </tr>
                  <tr>
                    <td className="term1-rc-left-align" style={{ width: "70%" }}>
                      TOTAL NO OF WORKING DAYS
                    </td>
                    <td style={{ width: "30%" }}>{cell(data.workingDays)}</td>
                  </tr>
                  <tr>
                    <td className="term1-rc-left-align">NUMBER OF DAYS PRESENT</td>
                    <td>{cell(data.daysPresent)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="term1-rc-table term1-rc-side">
                <tbody>
                  <tr>
                    <td colSpan={2}>SCHOLASTIC AREAS GRADING SYSTEM</td>
                  </tr>
                  <tr>
                    <td style={{ width: "50%" }}>GRADE</td>
                    <td style={{ width: "50%" }}>PERCENTAGE</td>
                  </tr>
                  {SCHOLASTIC_GRADE_BANDS.map((band) => (
                    <tr key={band.grade}>
                      <td>{band.grade}</td>
                      <td>{band.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="term1-rc-table term1-rc-side">
                <tbody>
                  <tr>
                    <td colSpan={2}>CO-SCHOLASTIC AREAS &amp; DISCIPLINE GRADING SCALE</td>
                  </tr>
                  <tr>
                    <td style={{ width: "50%" }}>GRADE</td>
                    <td style={{ width: "50%" }}>GRADE POINT</td>
                  </tr>
                  {CO_SCHOLASTIC_GRADE_POINTS.map((row) => (
                    <tr key={row.grade}>
                      <td>{row.grade}</td>
                      <td>{row.point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="term1-rc-bottom">
            <div className="term1-rc-discipline">
              <table className="term1-rc-table term1-rc-discipline-table">
                <tbody>
                  <tr>
                    <td colSpan={2}>
                      DISCIPLINE
                      <br />
                      (GRADES A – C) ON 3 POINT GRADING SCALE
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: "50%" }}>GRADE</td>
                    <td style={{ width: "50%" }}>{data.disciplineGrade}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="term1-rc-remarks-wrap">
              <table className="term1-rc-table term1-rc-remarks-table">
                <tbody>
                  <tr>
                    <td colSpan={2} className="term1-rc-remarks-cell">
                      REMARKS :{data.remarks ? ` ${data.remarks}` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: "28%" }}>SIGNATURE</td>
                    <td style={{ width: "72%" }}>CLASS TEACHER</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="term1-rc-left-align">
                      REPORT CARD GENERATED ON : {data.generatedOn}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="term1-rc-table term1-rc-key-table">
            <tbody>
              <tr>
                <td>KEY</td>
              </tr>
              <tr>
                <td className="term1-rc-key-details">
                  PA - PERIODIC ASSESSMENT,&nbsp;&nbsp; SE - SUBJECT ENRICHMENT ACTIVITY,&nbsp;&nbsp;
                  MA - MULTIPLE ASSESSMENT,&nbsp;&nbsp; NB - NOTE BOOK SUBMISSION,&nbsp;&nbsp; AB -
                  ABSENT
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .term1-rc {
          width: 29.7cm;
          flex-shrink: 0;
        }
        .term1-rc-page {
          width: 29.7cm;
          height: 21cm;
          background: #fff;
          border: 8px solid #006600;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
          color: #000;
          font-family: Cambria, "Times New Roman", Times, serif;
          font-size: 9pt;
        }
        .term1-rc-inner {
          width: 100%;
          height: 100%;
          padding: 4px 8px 5px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-size: 9pt;
        }
        .term1-rc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          margin-bottom: 2px;
        }
        .term1-rc-logo-left,
        .term1-rc-logo-right {
          width: auto;
          text-align: center;
          flex-shrink: 0;
        }
        .term1-rc-logo-left img {
          width: 120px;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        .term1-rc-logo-right img {
          width: 105px;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        .term1-rc-header-center {
          flex: 1 1 auto;
          width: auto;
          max-width: none;
          text-align: center;
          padding: 0 2px;
          min-width: 0;
        }
        .term1-rc-title-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: stretch;
          max-width: 100%;
        }
        .term1-rc-affil-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          width: 100%;
          font-weight: 700;
          font-size: 10.5pt;
          gap: 10px;
          padding: 0;
          margin-top: 2px;
        }
        .term1-rc-affil-row span:first-child {
          text-align: left;
          white-space: nowrap;
        }
        .term1-rc-affil-row span:last-child {
          text-align: right;
          white-space: nowrap;
        }
        .term1-rc-school-name {
          font-family: Impact, "Arial Black", Fantasy, sans-serif;
          font-size: 42px;
          color: #006634;
          margin: -6px 0 0;
          letter-spacing: 2px;
          line-height: 1;
          white-space: nowrap;
          font-weight: 700;
        }
        .term1-rc-sub-1,
        .term1-rc-sub-2 {
          font-size: 10.5pt;
          font-weight: 700;
          line-height: 1.15;
        }
        .term1-rc-sub-1 {
          margin-top: -4px;
        }
        .term1-rc-sub-2 {
          margin-top: 0;
        }
        .term1-rc-rule {
          width: 98%;
          margin: 1px auto 0;
          border: none;
          border-top: 1px solid #3a416d;
          height: 0;
        }
        .term1-rc-rule-muted {
          border-top-color: #8080806b;
          margin-top: 1px;
        }
        .term1-rc-address {
          display: block;
          max-width: 100%;
          margin: 1px auto 0;
          padding: 0;
          border: none;
          font-size: 10.5pt;
          font-weight: 700;
          line-height: 1.15;
        }
        .term1-rc-term-title {
          text-align: center;
          font-size: 13.5pt;
          font-weight: 700;
          margin: 1px 0 0;
          padding: 0;
          border: none;
          flex-shrink: 0;
          line-height: 1.2;
        }
        .term1-rc-student,
        .term1-rc-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-weight: 700;
        }
        .term1-rc-table {
          font-size: 9pt;
        }
        .term1-rc-student {
          font-size: 9.8pt !important;
          flex-shrink: 0;
          margin-bottom: 0;
        }
        .term1-rc-student td,
        .term1-rc-table td {
          border: 1px solid #000;
          padding: 1px 3px;
          line-height: 1.2;
          vertical-align: middle;
        }
        .term1-rc-table td {
          font-size: 9pt;
        }
        .term1-rc-student td {
          font-size: 9.8pt !important;
          height: 18px;
          padding: 1px 4px;
        }
        .term1-rc-student td:nth-child(1),
        .term1-rc-student td:nth-child(3) {
          width: 17%;
          font-weight: 700;
          font-size: 9.8pt !important;
        }
        .term1-rc-student td:nth-child(2),
        .term1-rc-student td:nth-child(4) {
          width: 33%;
          font-weight: 400;
          font-size: 9.8pt !important;
        }
        .term1-rc-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-top: 5px;
          flex: 0 0 auto;
        }
        .term1-rc-left {
          width: 66%;
          display: flex;
          flex-direction: column;
          gap: 5px;
          height: fit-content;
        }
        .term1-rc-right {
          width: 33.5%;
          display: flex;
          flex-direction: column;
          gap: 5px;
          height: fit-content;
        }
        .term1-rc-left > .term1-rc-table,
        .term1-rc-right > .term1-rc-table {
          width: 100%;
          margin: 0;
          border-spacing: 0;
        }
        .term1-rc-table td {
          text-align: center;
        }
        .term1-rc-subj,
        .term1-rc-left-align {
          text-align: left !important;
        }
        .term1-rc-co-scale {
          text-align: center !important;
          font-size: 8pt;
          font-weight: 700;
        }
        .term1-rc-scholastic td:nth-child(2) {
          text-align: left;
        }
        .term1-rc-scholastic td,
        .term1-rc-grade-only td,
        .term1-rc-co td,
        .term1-rc-side td {
          height: 13px;
          padding: 0 3px;
          line-height: 1.15;
          vertical-align: middle;
        }
        .term1-rc-bottom {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 6px;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .term1-rc-discipline {
          width: 26%;
          display: flex;
          flex-direction: column;
          align-self: stretch;
        }
        .term1-rc-discipline-table {
          width: 100%;
          height: 100%;
          flex: 1;
          border-collapse: collapse;
        }
        .term1-rc-discipline-table tr:last-child td {
          height: 36px;
          vertical-align: middle;
        }
        .term1-rc-remarks-wrap {
          width: 73%;
          display: flex;
          flex-direction: column;
          align-self: stretch;
          min-height: 0;
        }
        .term1-rc-remarks-table {
          width: 100%;
          height: 100%;
        }
        .term1-rc-remarks-cell {
          text-align: left !important;
          height: 34px;
          vertical-align: top !important;
          padding: 3px 5px !important;
        }
        .term1-rc-key-table {
          margin-top: 8px;
          flex-shrink: 0;
        }
        .term1-rc-key-table td {
          font-size: 9pt;
          font-weight: 700;
          line-height: 1.25;
          padding: 1px 4px;
        }
        .term1-rc-key-details {
          text-align: left !important;
        }
        @media print {
          .term1-rc,
          .term1-rc-page {
            width: 29.7cm !important;
            height: 21cm !important;
            max-width: none !important;
          }
        }
      `,
        }}
      />
    </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Minus, RefreshCw, School, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLeadershipPortal } from "@/lib/portalLeadershipApi";

type Term = "Term 1" | "Term 2" | "Term 3";

type AcademicPerformancePayload = {
  hasData: boolean;
  overview: {
    passRate: string;
    passRateValue: number | null;
    distinction: number;
    firstClass: number;
    pass: number;
    fail: number;
    scoredRows: number;
    examsCovered: number;
    subjectsCovered: number;
  };
  subjectPerformance: { subject: string; percent: number; color: string }[];
  gradePerformance: { grade: string; avg: string; pass: string; trend: "up" | "down" | "flat" }[];
  schoolToppers: { name: string; grade: string; score: string; medal: "gold" | "silver" | "bronze" }[];
};

const TERMS: Term[] = ["Term 1", "Term 2", "Term 3"];

export default function PrincipalAcademicsView() {
  const { schoolId } = useAuth();
  const [term, setTerm] = useState<Term>("Term 2");
  const [data, setData] = useState<AcademicPerformancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (selectedTerm: Term) => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLeadershipPortal<AcademicPerformancePayload>(
        schoolId,
        "academic-performance",
        { term: selectedTerm },
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load academic performance");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(term);
  }, [schoolId, term]);

  const overview = data?.overview;

  return (
    <div className="space-y-5 font-jost">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Academic Performance</h1>
          <p className="mt-1 text-sm text-gray-500">Pass rates, subject trends, and school toppers</p>
        </div>
        <button
          type="button"
          onClick={() => void load(term)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#144835]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-1">
        {TERMS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTerm(item)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
              term === item ? "bg-white text-[#144835] shadow-sm" : "text-gray-500"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-400">
          Loading academic performance…
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Exams", value: overview.examsCovered },
              { label: "Subjects", value: overview.subjectsCovered },
              { label: "Entries", value: overview.scoredRows },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{kpi.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-[#144835]">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-500">Overall Pass Rate · {term}</p>
            <p className="mt-2 text-4xl font-extrabold text-[#144835]">{overview.passRate}</p>
            {overview.passRateValue != null ? (
              <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#144835]"
                  style={{ width: `${Math.max(4, Math.min(100, overview.passRateValue))}%` }}
                />
              </div>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Distinction", value: overview.distinction },
                { label: "First Class", value: overview.firstClass },
                { label: "Pass", value: overview.pass },
                { label: "Fail", value: overview.fail, tone: "text-red-600" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-gray-50 px-3 py-3">
                  <p className={`text-[11px] font-bold ${item.tone ?? "text-gray-500"}`}>{item.label}</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {!data?.hasData ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <School className="mx-auto text-gray-300" size={36} />
              <h2 className="mt-3 text-base font-extrabold text-gray-900">No marks for {term}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Upload exam marks in Admin → Marks to populate this dashboard.
              </p>
            </div>
          ) : null}

          {data?.hasData ? (
            <>
              <section>
                <h2 className="text-base font-extrabold text-gray-900">Subject-wise Performance</h2>
                <div className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  {data.subjectPerformance.map((subject) => (
                    <div key={subject.subject} className="flex items-center gap-3">
                      <span className="w-24 truncate text-xs font-bold text-gray-700">{subject.subject}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${subject.percent}%`, backgroundColor: subject.color }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-extrabold text-gray-800">{subject.percent}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-base font-extrabold text-gray-900">Grade-wise Summary</h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="grid grid-cols-4 bg-[#144835]/5 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    <span>Grade</span>
                    <span>Avg</span>
                    <span>Pass</span>
                    <span>Trend</span>
                  </div>
                  {data.gradePerformance.map((row) => (
                    <div
                      key={row.grade}
                      className="grid grid-cols-4 items-center border-t border-gray-100 px-4 py-3 text-center text-sm"
                    >
                      <span className="font-bold text-gray-900">{row.grade}</span>
                      <span className="font-medium text-gray-700">{row.avg}</span>
                      <span className="font-medium text-gray-700">{row.pass}</span>
                      <span className="flex justify-center text-[#144835]">
                        {row.trend === "up" ? (
                          <TrendingUp size={16} />
                        ) : row.trend === "down" ? (
                          <TrendingDown size={16} className="text-red-500" />
                        ) : (
                          <Minus size={16} className="text-gray-400" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-base font-extrabold text-gray-900">School Toppers</h2>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {data.schoolToppers.map((topper, index) => (
                    <div
                      key={`${topper.name}-${index}`}
                      className="min-w-[140px] rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm"
                    >
                      <div
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-white ${
                          topper.medal === "gold"
                            ? "bg-amber-400"
                            : topper.medal === "silver"
                              ? "bg-slate-300"
                              : "bg-amber-600"
                        }`}
                      >
                        ★
                      </div>
                      <p className="mt-2 truncate text-sm font-extrabold text-gray-900">{topper.name}</p>
                      <p className="text-[11px] text-gray-500">{topper.grade}</p>
                      <p className="mt-1 text-lg font-extrabold text-[#144835]">{topper.score}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

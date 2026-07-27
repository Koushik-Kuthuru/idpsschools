"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonStats, SkeletonTableRows } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { adminFetch } from "@/lib/adminApi";
import type {
  LibraryBook,
  LibraryIssuedRecord,
  LibrarySummaryRegistry,
} from "@/lib/libraryRegistry";

type LibrarySection = "book-stock" | "issued" | "summary";

const SECTION_COPY: Record<
  LibrarySection,
  { title: string; description: string; empty: string }
> = {
  "book-stock": {
    title: "Book Stock",
    description: "Catalogue of library books by accession number, title, publisher, and category.",
    empty: "No book stock found for this academic year.",
  },
  issued: {
    title: "Issued Books",
    description: "Late-fee / issued book status records for the academic year.",
    empty: "No issued book records found for this academic year.",
  },
  summary: {
    title: "Library Summary",
    description: "Quantity and status overview for the school library.",
    empty: "No library summary found for this academic year.",
  },
};

const PAGE_SIZE = 50;

export default function LibrarySectionPage({ section }: { section: LibrarySection }) {
  const schoolId = useSchoolId("idpscherukupalli");
  const academicYearCtx = useAcademicYearOptional();
  const academicYear = academicYearCtx?.currentYear?.name || "2022-23";
  const copy = SECTION_COPY[section];

  const [query, setQuery] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [records, setRecords] = useState<LibraryIssuedRecord[]>([]);
  const [summary, setSummary] = useState<LibrarySummaryRegistry | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          schoolId,
          academicYear,
          section,
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });
        if (query) params.set("q", query);
        const res = await adminFetch(`/api/admin/library?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load library data");
        if (cancelled) return;
        setSource(data.source ?? null);
        if (section === "summary") {
          setSummary(data.summary ?? null);
          setTotal(0);
          setBooks([]);
          setRecords([]);
        } else if (section === "issued") {
          setRecords(Array.isArray(data.records) ? data.records : []);
          setTotal(Number(data.total) || 0);
          setBooks([]);
          setSummary(null);
        } else {
          setBooks(Array.isArray(data.books) ? data.books : []);
          setTotal(Number(data.total) || 0);
          setRecords([]);
          setSummary(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load library data");
          setBooks([]);
          setRecords([]);
          setSummary(null);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, academicYear, section, query, page]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title={copy.title}
        description={`${copy.description}${source ? ` Source: ${source}.` : ""}`}
      />

      {section !== "summary" ? (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={
                section === "issued"
                  ? "Search accession, book, student..."
                  : "Search accession, title, author, publisher..."
              }
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#144835]/40 focus:ring-2 focus:ring-[#144835]/10"
            />
          </div>
          <p className="text-xs font-medium text-gray-500">
            {loading ? "Loading…" : `${total.toLocaleString()} record${total === 1 ? "" : "s"}`}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {section === "summary" ? (
        <SummaryCards summary={summary} loading={loading} empty={copy.empty} />
      ) : section === "issued" ? (
        <IssuedTable
          records={records}
          loading={loading}
          empty={copy.empty}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          page={page}
          pageCount={pageCount}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        />
      ) : (
        <BookStockTable
          books={books}
          loading={loading}
          empty={copy.empty}
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={total}
          page={page}
          pageCount={pageCount}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        />
      )}
    </div>
  );
}

function SummaryCards({
  summary,
  loading,
  empty,
}: {
  summary: LibrarySummaryRegistry | null;
  loading: boolean;
  empty: string;
}) {
  if (loading) {
    return <SkeletonStats count={8} />;
  }
  if (!summary) {
    return (
      <EmptyState title="Library Summary" empty={empty} />
    );
  }

  const cards = [
    { label: "Total Books", value: summary.totalBooks ?? summary.bookStockCount },
    { label: "Categories", value: summary.totalCategories },
    { label: "Publishers", value: summary.totalPublishers },
    { label: "Vendors", value: summary.totalVendors },
    { label: "Issued to Students", value: summary.issuedToStudents },
    { label: "Issued to Staff", value: summary.issuedToStaff },
    { label: "Imported Stock Rows", value: summary.bookStockCount },
    { label: "Late-fee Records", value: summary.issuedRecordCount },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-[#144835]">{Number(card.value ?? 0).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function BookStockTable({
  books,
  loading,
  empty,
  showingFrom,
  showingTo,
  total,
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  books: LibraryBook[];
  loading: boolean;
  empty: string;
  showingFrom: number;
  showingTo: number;
  total: number;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!loading && books.length === 0) return <EmptyState title="Book Stock" empty={empty} />;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Acc No</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Author</th>
              <th className="px-4 py-3 font-semibold">Publisher</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? <SkeletonTableRows rows={8} columns={6} />
              : books.map((book) => (
                  <tr key={`${book.accessionNo}-${book.sr}`} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{book.accessionNo}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-[280px]"><span className="line-clamp-2">{book.title}</span></td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px]"><span className="line-clamp-2">{book.author || "—"}</span></td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px]"><span className="line-clamp-2">{book.publisher || "—"}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
                        {book.stockStatus || "Present"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold border ${book.issued ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {book.issued ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pager
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={total}
        page={page}
        pageCount={pageCount}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}

function IssuedTable({
  records,
  loading,
  empty,
  showingFrom,
  showingTo,
  total,
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  records: LibraryIssuedRecord[];
  loading: boolean;
  empty: string;
  showingFrom: number;
  showingTo: number;
  total: number;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!loading && records.length === 0) return <EmptyState title="Issued Books" empty={empty} />;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Acc No</th>
              <th className="px-4 py-3 font-semibold">Book</th>
              <th className="px-4 py-3 font-semibold">Issued To</th>
              <th className="px-4 py-3 font-semibold">Class</th>
              <th className="px-4 py-3 font-semibold">Submit</th>
              <th className="px-4 py-3 font-semibold">Late Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? <SkeletonTableRows rows={4} columns={6} />
              : records.map((row) => (
                  <tr key={`${row.sr}-${row.accessionNo}-${row.issuedTo}`} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{row.accessionNo}</td>
                    <td className="px-4 py-3 text-gray-800">{row.bookName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.issuedTo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {[row.className, row.section].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.submitDate || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-amber-700 whitespace-nowrap">{row.lateDays ?? 0}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <Pager
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={total}
        page={page}
        pageCount={pageCount}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}

function Pager({
  showingFrom,
  showingTo,
  total,
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  showingFrom: number;
  showingTo: number;
  total: number;
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500">
        Showing {showingFrom}–{showingTo} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 0}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-gray-600">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pageCount - 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, empty }: { title: string; empty: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#144835]/10 text-[#144835]">
        <BookOpen size={22} strokeWidth={2.25} />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{empty}</p>
    </div>
  );
}

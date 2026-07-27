import type { SupabaseClient } from "@supabase/supabase-js";

export const LIBRARY_BOOK_STOCK_PREFIX = "__library_book_stock__:";
export const LIBRARY_ISSUED_PREFIX = "__library_issued__:";
export const LIBRARY_SUMMARY_PREFIX = "__library_summary__:";

export type LibraryBook = {
  sr?: number;
  accessionNo: string;
  title: string;
  publisher?: string | null;
  author?: string | null;
  category?: string | null;
  stockStatus?: string;
  issued?: boolean;
};

export type LibraryIssuedRecord = {
  sr?: number;
  accessionNo: string;
  bookName: string;
  issuedTo?: string | null;
  className?: string | null;
  section?: string | null;
  submitDate?: string | null;
  feePaidDate?: string | null;
  paidAmount?: number;
  lateDays?: number;
};

export type LibraryBookStockRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  books: LibraryBook[];
};

export type LibraryIssuedRegistry = {
  academicYear: string;
  source?: string;
  count?: number;
  seededAt?: string;
  note?: string;
  records: LibraryIssuedRecord[];
};

export type LibrarySummaryRegistry = {
  academicYear: string;
  source?: string;
  seededAt?: string;
  totalBooks?: number;
  totalCategories?: number;
  totalPublishers?: number;
  totalVendors?: number;
  issuedToStudents?: number;
  issuedToStaff?: number;
  bookStockCount?: number;
  issuedRecordCount?: number;
};

async function loadNoticeJson<T>(
  admin: SupabaseClient<any>,
  branchId: string,
  title: string
): Promise<T | null> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (error?.code === "PGRST205" || !data?.content) return null;
  try {
    return JSON.parse(String(data.content)) as T;
  } catch {
    return null;
  }
}

export async function loadLibraryBookStock(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<LibraryBookStockRegistry | null> {
  const parsed = await loadNoticeJson<LibraryBookStockRegistry>(
    admin,
    branchId,
    `${LIBRARY_BOOK_STOCK_PREFIX}${academicYear}`
  );
  if (!parsed || !Array.isArray(parsed.books)) return null;
  return parsed;
}

export async function loadLibraryIssued(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<LibraryIssuedRegistry | null> {
  const parsed = await loadNoticeJson<LibraryIssuedRegistry>(
    admin,
    branchId,
    `${LIBRARY_ISSUED_PREFIX}${academicYear}`
  );
  if (!parsed || !Array.isArray(parsed.records)) return null;
  return parsed;
}

export async function loadLibrarySummary(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYear: string
): Promise<LibrarySummaryRegistry | null> {
  return loadNoticeJson<LibrarySummaryRegistry>(
    admin,
    branchId,
    `${LIBRARY_SUMMARY_PREFIX}${academicYear}`
  );
}

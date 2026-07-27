import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  loadLibraryBookStock,
  loadLibraryIssued,
  loadLibrarySummary,
} from "@/lib/libraryRegistry";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear") || "2022-23";
  const section = url.searchParams.get("section") || "book-stock";
  const q = String(url.searchParams.get("q") ?? "").trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500);
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) {
    return noStoreJson({ error: "Branch not found" }, { status: 404 });
  }

  try {
    if (section === "summary") {
      const summary = await loadLibrarySummary(ctx.admin, branchId, academicYear);
      return noStoreJson({ section, academicYear, summary });
    }

    if (section === "issued") {
      const registry = await loadLibraryIssued(ctx.admin, branchId, academicYear);
      let records = registry?.records ?? [];
      if (q) {
        records = records.filter((row) => {
          const hay = `${row.accessionNo} ${row.bookName} ${row.issuedTo ?? ""} ${row.className ?? ""} ${row.section ?? ""}`.toLowerCase();
          return hay.includes(q);
        });
      }
      const total = records.length;
      const page = records.slice(offset, offset + limit);
      return noStoreJson({
        section,
        academicYear,
        source: registry?.source ?? null,
        total,
        limit,
        offset,
        hasMore: offset + page.length < total,
        records: page,
      });
    }

    const registry = await loadLibraryBookStock(ctx.admin, branchId, academicYear);
    let books = registry?.books ?? [];
    if (q) {
      books = books.filter((row) => {
        const hay = `${row.accessionNo} ${row.title} ${row.publisher ?? ""} ${row.author ?? ""} ${row.category ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const total = books.length;
    const page = books.slice(offset, offset + limit);
    return noStoreJson({
      section: "book-stock",
      academicYear,
      source: registry?.source ?? null,
      total,
      limit,
      offset,
      hasMore: offset + page.length < total,
      books: page,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load library data";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

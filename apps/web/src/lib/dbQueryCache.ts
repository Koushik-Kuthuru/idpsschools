import { readClientCache, writeClientCache } from "@/lib/clientCache";
import { getActiveAcademicYear, schoolSlugFromCollectionPath } from "@/lib/activeAcademicYear";

const CACHE_PREFIX = "db";

function stableHash(value: unknown): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/=+$/, "");
  } catch {
    return "0";
  }
}

function academicYearSuffix(collectionPath: string[] | null): string {
  if (!collectionPath) return "";
  const slug = schoolSlugFromCollectionPath(collectionPath);
  if (!slug) return "";
  const year = getActiveAcademicYear(slug);
  return year ? `:y:${year}` : "";
}

export function buildDbQueryCacheKey(
  collectionPath: string[],
  constraints: unknown[] = []
): string {
  const pathPart = collectionPath.join("/");
  const constraintPart = constraints.length ? `:c:${stableHash(constraints)}` : "";
  return `${CACHE_PREFIX}:q:${pathPart}${constraintPart}${academicYearSuffix(collectionPath)}`;
}

export function buildDbDocCacheKey(docPath: string[]): string {
  const pathPart = docPath.join("/");
  const slug = docPath.length === 4 ? docPath[1] : null;
  const yearPart = slug ? academicYearSuffix(["schools", slug, docPath[2] ?? ""]) : "";
  return `${CACHE_PREFIX}:doc:${pathPart}${yearPart}`;
}

export function readDbRowsCache(key: string): Record<string, unknown>[] | null {
  return readClientCache<Record<string, unknown>[]>(key);
}

export function writeDbRowsCache(key: string, rows: Record<string, unknown>[]): void {
  writeClientCache(key, rows);
}

export type CachedDoc = { id: string; data: Record<string, unknown> | null };

export function readDbDocCache(key: string): CachedDoc | null {
  return readClientCache<CachedDoc>(key);
}

export function writeDbDocCache(key: string, doc: CachedDoc): void {
  writeClientCache(key, doc);
}

export function hasDbQueryCache(queryOrDoc: unknown): boolean {
  if (!queryOrDoc) return false;
  if (Array.isArray(queryOrDoc)) {
    if (queryOrDoc.length === 2 || queryOrDoc.length === 4) {
      return readDbDocCache(buildDbDocCacheKey(queryOrDoc)) !== null;
    }
    return readDbRowsCache(buildDbQueryCacheKey(queryOrDoc)) !== null;
  }
  if (typeof queryOrDoc === "object" && queryOrDoc !== null && "collectionPath" in queryOrDoc) {
    const q = queryOrDoc as { collectionPath: string[]; constraints?: unknown[] };
    return (
      readDbRowsCache(
        buildDbQueryCacheKey(q.collectionPath, q.constraints ?? [])
      ) !== null
    );
  }
  return false;
}

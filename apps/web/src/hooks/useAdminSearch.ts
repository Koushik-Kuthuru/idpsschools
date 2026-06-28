"use client";

import { useCallback, useEffect, useMemo, useState } from "react";


import { buildPath, fetchMany, db, auth } from "@/lib/db-client";
import {
  AdminSearchResult,
  buildApplicationResult,
  buildClassResult,
  buildEnquiryResult,
  buildInvoiceResult,
  buildLeadResult,
  buildPageSearchIndex,
  buildStaffResult,
  buildStudentResult,
  buildSubjectResult,
  buildTeacherResult,
  filterResultsByScope,
  groupSearchResults,
  matchesSearch,
  normalizeSearchQuery,
  type AdminSearchGroup,
  type SearchScopeFilter,
} from "@/lib/adminSearch";

async function loadCollection(schoolId: string, collectionName: string) {
  try {
    const snapshot = await fetchMany(buildPath(db, "schools", schoolId, collectionName));
    return snapshot.docs.map((buildPath) => ({ id: buildPath.id, data: buildPath.data() as Record<string, unknown> }));
  } catch (error) {
    console.error(`Admin search failed for ${collectionName}:`, error);
    return [];
  }
}

export function useAdminSearch(schoolId: string) {
  const [records, setRecords] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const pageIndex = useMemo(() => buildPageSearchIndex(schoolId), [schoolId]);

  useEffect(() => {
    let cancelled = false;

    async function loadIndex() {
      setLoading(true);
      const [
        students,
        teachers,
        staff,
        leads,
        enquiries,
        applications,
        classes,
        subjects,
        invoices,
      ] = await Promise.all([
        loadCollection(schoolId, "students"),
        loadCollection(schoolId, "teachers"),
        loadCollection(schoolId, "staff"),
        loadCollection(schoolId, "leads"),
        loadCollection(schoolId, "enquiries"),
        loadCollection(schoolId, "applications"),
        loadCollection(schoolId, "classes"),
        loadCollection(schoolId, "subjects"),
        loadCollection(schoolId, "invoices"),
      ]);

      if (cancelled) return;

      const mapped: AdminSearchResult[] = [
        ...students.map((item) => buildStudentResult(schoolId, item.id, item.data)),
        ...teachers.map((item) => buildTeacherResult(schoolId, item.id, item.data)),
        ...staff.map((item) => buildStaffResult(schoolId, item.id, item.data)),
        ...leads.map((item) => buildLeadResult(schoolId, item.id, item.data)),
        ...enquiries.map((item) => buildEnquiryResult(schoolId, item.id, item.data)),
        ...applications.map((item) => buildApplicationResult(schoolId, item.id, item.data)),
        ...classes.map((item) => buildClassResult(schoolId, item.id, item.data)),
        ...subjects.map((item) => buildSubjectResult(schoolId, item.id, item.data)),
        ...invoices.map((item) => buildInvoiceResult(schoolId, item.id, item.data)),
      ];

      setRecords(mapped);
      setLoading(false);
    }

    void loadIndex();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const allResults = useMemo(() => [...pageIndex, ...records], [pageIndex, records]);

  const search = useCallback(
    (buildQuery: string, options?: { scope?: SearchScopeFilter }): AdminSearchGroup[] => {
      const normalized = normalizeSearchQuery(buildQuery);
      if (!normalized) return [];

      const matched = allResults.filter((result) => matchesSearch(result, normalized));
      const scoped = filterResultsByScope(matched, options?.scope ?? "all");
      return groupSearchResults(scoped, options?.scope === "all" ? 5 : 8);
    },
    [allResults]
  );

  return {
    loading,
    search,
    totalIndexed: allResults.length,
  };
}

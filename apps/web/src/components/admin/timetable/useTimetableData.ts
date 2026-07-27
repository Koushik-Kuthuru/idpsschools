"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSchoolId } from "@/hooks/useSchoolId";
import { buildPath, fetchMany, fetchOne, db } from "@/lib/db-client";
import { buildTeacherPeriodGrid, listTeacherNamesFromDocs } from "@/lib/teacherTimetableUtils";
import type { TimetableDocRecord } from "@/lib/teacherTimetableUtils";
import { gradesMatchForClass } from "@/lib/gradeOrder";
import {
  normalizePeriodGrid,
  timetableDocId,
  DEFAULT_TERM_KEY,
  type PeriodGrid,
} from "./timetablePeriodGrid";
import {
  defaultTimetableTemplate,
  defaultTimetableTemplateSet,
  normalizeTimetableTemplateSet,
  resolveTemplateForGrade,
  TIMETABLE_TEMPLATE_DOC,
  type TimetableTemplate,
  type TimetableTemplateSet,
} from "./timetableTemplate";
import { useTimetableTermKey } from "./useTimetableTermKey";

export function useTimetableTemplate(schoolId: string) {
  const [templateSet, setTemplateSet] = useState<TimetableTemplateSet>(defaultTimetableTemplateSet);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const ref = buildPath(db, "schools", schoolId, "settings", TIMETABLE_TEMPLATE_DOC);
        const snap = await fetchOne(ref, { skipCache: true });
        if (!cancelled && snap.exists()) {
          setTemplateSet(normalizeTimetableTemplateSet(snap.data()));
        }
      } catch {
        if (!cancelled) setTemplateSet(defaultTimetableTemplateSet);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const template = templateSet.profiles.primary_senior;
  const templateForGrade = useCallback(
    (grade: string) => resolveTemplateForGrade(templateSet, grade),
    [templateSet]
  );

  return { template, templateSet, templateForGrade, loading };
}

export function useClassTimetable(
  schoolId: string,
  grade: string,
  section: string,
  termKey?: string
) {
  const resolvedTerm = useTimetableTermKey(schoolId);
  const term = termKey ?? resolvedTerm;
  const { templateForGrade, loading: templateLoading } = useTimetableTemplate(schoolId);
  const template = useMemo(() => templateForGrade(grade), [templateForGrade, grade]);
  const [grid, setGrid] = useState<PeriodGrid | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!grade || !section) {
      setGrid(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const ref = buildPath(
          db,
          "schools",
          schoolId,
          "timetables",
          timetableDocId(term, grade, section)
        );
        const snap = await fetchOne(ref, { skipCache: true });
        if (cancelled) return;
        if (!snap.exists()) {
          setGrid(null);
          return;
        }
        const data = snap.data();
        setGrid(normalizePeriodGrid(data?.periodGrid ?? data?.timetable, template));
      } catch {
        if (!cancelled) setGrid(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, grade, section, term, template]);

  return { grid, template, loading: loading || templateLoading, term };
}

export type TimetableClassDoc = {
  id: string;
  grade: string;
  section: string;
  grid: PeriodGrid;
};

function sectionsMatch(a: string, b: string) {
  return String(a).trim().toUpperCase() === String(b).trim().toUpperCase();
}

/** Match imported timetables to branch class sections for a grade. */
export function timetablesForGrade(
  docs: TimetableClassDoc[],
  grade: string,
  classSections: string[] = []
): TimetableClassDoc[] {
  const gradeDocs = docs.filter((doc) => gradesMatchForClass(doc.grade, grade));

  if (!classSections.length) {
    return [...gradeDocs].sort((a, b) =>
      a.section.localeCompare(b.section, undefined, { sensitivity: "base" })
    );
  }

  const rows: TimetableClassDoc[] = [];
  const seen = new Set<string>();

  for (const section of classSections) {
    const doc = gradeDocs.find((d) => sectionsMatch(d.section, section));
    if (doc) {
      rows.push(doc);
      seen.add(doc.id);
    }
  }

  for (const doc of gradeDocs) {
    if (seen.has(doc.id)) continue;
    rows.push(doc);
  }

  return rows.sort((a, b) =>
    a.section.localeCompare(b.section, undefined, { sensitivity: "base" })
  );
}

export function useAllClassTimetables(schoolId: string, termKey?: string) {
  const resolvedTerm = useTimetableTermKey(schoolId);
  const term = termKey ?? resolvedTerm;
  const { template, templateForGrade, loading: templateLoading } = useTimetableTemplate(schoolId);
  const [docs, setDocs] = useState<TimetableClassDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchMany(buildPath(db, "schools", schoolId, "timetables"), {
        skipCache: true,
      });
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          if (data.scope === "teacher") return null;
          const grade = String(data.grade ?? "").trim();
          const section = String(data.section ?? "").trim();
          const key = String(data.key ?? "").trim();
          if (!grade || !section) return null;
          if (key && key !== term) return null;
          const gradeTemplate = templateForGrade(grade);
          return {
            id: d.id,
            grade,
            section,
            grid: normalizePeriodGrid(data.periodGrid ?? data.timetable, gradeTemplate),
          };
        })
        .filter(Boolean) as TimetableClassDoc[];
      rows.sort((a, b) =>
        `${a.grade}-${a.section}`.localeCompare(`${b.grade}-${b.section}`, undefined, {
          numeric: true,
        })
      );
      setDocs(rows);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, term, templateForGrade]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byGrade = useMemo(() => {
    const map: Record<string, TimetableClassDoc[]> = {};
    for (const doc of docs) {
      const key =
        Object.keys(map).find((g) => gradesMatchForClass(g, doc.grade)) ?? doc.grade;
      if (!map[key]) map[key] = [];
      map[key].push(doc);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) =>
        a.section.localeCompare(b.section, undefined, { sensitivity: "base" })
      );
    }
    return map;
  }, [docs]);

  return {
    docs,
    byGrade,
    template,
    templateForGrade,
    loading: loading || templateLoading,
    refresh,
    term,
  };
}

export function useTeacherTimetable(
  schoolId: string,
  teacherName: string,
  termKey?: string
) {
  const resolvedTerm = useTimetableTermKey(schoolId);
  const term = termKey ?? resolvedTerm;
  const { template, loading: templateLoading } = useTimetableTemplate(schoolId);
  const [grid, setGrid] = useState<PeriodGrid | null>(null);
  const [subject, setSubject] = useState("");
  const [resolvedTeacherName, setResolvedTeacherName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherName) {
      setGrid(null);
      setSubject("");
      setResolvedTeacherName("");
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const snapAll = await fetchMany(buildPath(db, "schools", schoolId, "timetables"), {
          skipCache: true,
        });
        const docs = snapAll.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        })) as TimetableDocRecord[];

        const built = buildTeacherPeriodGrid(docs, teacherName, term, template);
        if (cancelled) return;
        setResolvedTeacherName(built.resolvedName);
        setSubject(built.subject);
        setGrid(built.grid);
      } catch {
        if (!cancelled) {
          setGrid(null);
          setSubject("");
          setResolvedTeacherName("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId, teacherName, term, template]);

  return {
    grid,
    subject,
    template,
    loading: loading || templateLoading,
    term,
    resolvedTeacherName,
    teacherOptions: [] as string[],
  };
}

export function useTeacherTimetableOptions(schoolId: string) {
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "timetables"), {
          skipCache: true,
        });
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        })) as TimetableDocRecord[];
        if (!cancelled) setTeacherOptions(listTeacherNamesFromDocs(docs));
      } catch {
        if (!cancelled) setTeacherOptions([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  return teacherOptions;
}

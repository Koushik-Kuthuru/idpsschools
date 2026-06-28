"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import type { ClassAssignment } from "@/lib/teacherClassScope";

export type TeacherPortalScope = {
  isTeacherPortal: true;
  schoolId: string;
  allowedClassKeys: Set<string>;
  assignments: ClassAssignment[];
  matchesStudent: (student: { classId?: string; grade?: string; section?: string }) => boolean;
  teacherDisplayName: string | null;
  teacherUid: string | null;
  teacherEmail: string | null;
};

const TeacherPortalScopeContext = createContext<TeacherPortalScope | null>(null);

export function TeacherPortalScopeProvider({
  schoolId,
  children,
}: {
  schoolId: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { classKeys, assignments, matchesStudent } = useTeacherClassScope(schoolId);

  const value = useMemo<TeacherPortalScope>(
    () => ({
      isTeacherPortal: true,
      schoolId,
      allowedClassKeys: new Set(classKeys),
      assignments,
      matchesStudent,
      teacherDisplayName: user?.displayName ?? null,
      teacherUid: user?.uid ?? null,
      teacherEmail: user?.email ?? null,
    }),
    [schoolId, classKeys, assignments, matchesStudent, user?.displayName, user?.uid, user?.email]
  );

  return (
    <TeacherPortalScopeContext.Provider value={value}>{children}</TeacherPortalScopeContext.Provider>
  );
}

export function useTeacherPortalScope(): TeacherPortalScope | null {
  return useContext(TeacherPortalScopeContext);
}

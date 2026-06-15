import React from 'react';
import { AuthStack } from './AuthStack';
import {
  AcademicDirectorNavigator,
  AcademicManagerNavigator,
  FacultyRootNavigator,
  PrincipalNavigator,
  VicePrincipalNavigator,
  isAcademicDirectorDesignation,
  isAcademicManagerDesignation,
  isPrincipalDesignation,
  isVicePrincipalDesignation,
} from '@/designations';
import { useAuthStore } from '@/store';

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const designation = useAuthStore((s) => s.user?.designation ?? 'teacher');

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (isAcademicDirectorDesignation(designation)) {
    return <AcademicDirectorNavigator />;
  }

  if (isAcademicManagerDesignation(designation)) {
    return <AcademicManagerNavigator />;
  }

  if (isPrincipalDesignation(designation)) {
    return <PrincipalNavigator />;
  }

  if (isVicePrincipalDesignation(designation)) {
    return <VicePrincipalNavigator />;
  }

  return <FacultyRootNavigator />;
}

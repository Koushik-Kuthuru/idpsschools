import type { StaffRole } from '@/types';

/** All designation modules live under src/designations/ */
export const FACULTY_DESIGNATIONS: StaffRole[] = [
  'teacher',
  'vice_principal',
  'coordinator',
  'admin',
  'manager',
];

export const ACADEMIC_DIRECTOR_DESIGNATION: StaffRole = 'academic_director';
export const ACADEMIC_MANAGER_DESIGNATION: StaffRole = 'academic_manager';
export const PRINCIPAL_DESIGNATION: StaffRole = 'principal';
export const VICE_PRINCIPAL_DESIGNATION: StaffRole = 'vice_principal';

export function isAcademicDirectorDesignation(designation: StaffRole): boolean {
  return designation === ACADEMIC_DIRECTOR_DESIGNATION;
}

export function isAcademicManagerDesignation(designation: StaffRole): boolean {
  return designation === ACADEMIC_MANAGER_DESIGNATION;
}

export function isPrincipalDesignation(designation: StaffRole): boolean {
  return designation === PRINCIPAL_DESIGNATION;
}

export function isVicePrincipalDesignation(designation: StaffRole): boolean {
  return designation === VICE_PRINCIPAL_DESIGNATION;
}

export function isFacultyDesignation(designation: StaffRole): boolean {
  return FACULTY_DESIGNATIONS.includes(designation);
}

export function getDesignationLabel(designation: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    teacher: 'Teacher',
    principal: 'Principal',
    vice_principal: 'Vice Principal',
    coordinator: 'Academic Coordinator',
    admin: 'Administrator',
    manager: 'Manager',
    academic_director: 'Academic Director',
    academic_manager: 'Academic Administration Manager',
  };
  return labels[designation];
}

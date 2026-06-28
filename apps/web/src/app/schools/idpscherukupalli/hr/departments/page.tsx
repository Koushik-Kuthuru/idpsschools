"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchDepartments } from "@/hooks/useBranchDepartments";
import DepartmentsManagementView from "@/components/admin/hr/DepartmentsManagementView";

export default function AdminDepartmentsPage() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const dept = useBranchDepartments(schoolId, currentYear?.name);

  return (
    <DepartmentsManagementView
      academicYearLabel={currentYear?.name}
      departments={dept.departments}
      loading={dept.loading && dept.departments.length === 0}
      mutating={dept.mutating}
      loadError={dept.loadError}
      onAddDepartment={dept.addDepartment}
      onUpdateDepartment={dept.updateDepartment}
      onDeleteDepartment={dept.deleteDepartment}
      onAddDesignation={dept.addDesignation}
      onUpdateDesignation={dept.updateDesignation}
      onDeleteDesignation={dept.deleteDesignation}
    />
  );
}

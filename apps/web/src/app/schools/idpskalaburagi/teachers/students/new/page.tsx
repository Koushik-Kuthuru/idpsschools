import TeacherAccessDenied from "@/components/erp-teachers/TeacherAccessDenied";

export default function TeacherAddStudentBlockedPage() {
  return (
    <TeacherAccessDenied
      title="Add student not allowed"
      message="Teachers can view student details only. Adding students is handled by the school admin."
      backHref="/schools/idpskalaburagi/teachers/students"
      backLabel="Back to My Students"
    />
  );
}

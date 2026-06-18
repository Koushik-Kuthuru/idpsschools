# IDP ERP — Supabase Database Schema

> **Architecture principle:** Every table (except `schools`) carries a `school_id` foreign key.
> Supabase Row Level Security (RLS) policies use this to ensure Branch Admins, Teachers,
> Students, and Parents only ever see their own school's data. The Super Admin role bypasses RLS.

---

## 1. Core — Identity & Access

### `schools`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `name` | `text` | School full name |
| `code` | `text` UNIQUE | Short code e.g. `IDP-HYD-01` |
| `city` | `text` | |
| `state` | `text` | |
| `address` | `text` | |
| `phone` | `text` | |
| `email` | `text` | |
| `logo_url` | `text` | Storage bucket URL |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

---

### `users`
> Linked to Supabase Auth `auth.users` via `id`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Same as `auth.users.id` |
| `school_id` | `uuid` FK → `schools.id` | NULL for Super Admin |
| `role` | `enum` | `super_admin`, `branch_admin`, `teacher`, `student`, `parent`, `staff` |
| `full_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `avatar_url` | `text` | |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**RLS policies:**
- Super Admin → can SELECT/UPDATE all rows
- Branch Admin → can SELECT/UPDATE where `school_id = auth.school_id()`
- Teacher/Student/Parent → can SELECT/UPDATE their own row only

---

## 2. Academic Structure

### `academic_years`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `name` | `text` | e.g. `2025-2026` |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `is_current` | `boolean` | Only one true per school |
| `created_at` | `timestamptz` | |

---

### `grades`
> Class levels — Grade 1, Grade 2 … Grade 12.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `name` | `text` | e.g. `Grade 5` |
| `level_order` | `integer` | For sorting |
| `created_at` | `timestamptz` | |

---

### `sections`
> Sections within a grade — A, B, C.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `grade_id` | `uuid` FK → `grades.id` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `name` | `text` | e.g. `A`, `B` |
| `class_teacher_id` | `uuid` FK → `users.id` | |
| `capacity` | `integer` | Max students |
| `created_at` | `timestamptz` | |

---

### `subjects`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `grade_id` | `uuid` FK → `grades.id` | |
| `name` | `text` | e.g. `Mathematics` |
| `code` | `text` | e.g. `MATH-05` |
| `created_at` | `timestamptz` | |

---

### `teacher_subject_assignments`
> Which teacher teaches which subject to which section.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `teacher_id` | `uuid` FK → `users.id` | |
| `subject_id` | `uuid` FK → `subjects.id` | |
| `section_id` | `uuid` FK → `sections.id` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `created_at` | `timestamptz` | |

---

## 3. Students

### `students`
> Extended profile linked to `users`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | |
| `school_id` | `uuid` FK → `schools.id` | |
| `admission_number` | `text` UNIQUE | |
| `date_of_birth` | `date` | |
| `gender` | `text` | |
| `blood_group` | `text` | |
| `address` | `text` | |
| `admission_date` | `date` | |
| `status` | `enum` | `active`, `transferred`, `graduated`, `dropped` |
| `created_at` | `timestamptz` | |

---

### `student_section_enrollments`
> Student's section for each academic year.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `student_id` | `uuid` FK → `students.id` | |
| `section_id` | `uuid` FK → `sections.id` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `roll_number` | `text` | |
| `enrolled_at` | `timestamptz` | |

---

### `parents`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | |
| `school_id` | `uuid` FK → `schools.id` | |
| `relation` | `text` | `father`, `mother`, `guardian` |
| `occupation` | `text` | |
| `created_at` | `timestamptz` | |

---

### `student_parent_links`
> Many-to-many: one student can have multiple parents; one parent can have multiple children.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `student_id` | `uuid` FK → `students.id` | |
| `parent_id` | `uuid` FK → `parents.id` | |
| `is_primary` | `boolean` | Primary contact flag |
| `created_at` | `timestamptz` | |

---

## 4. Staff & Teachers

### `staff_profiles`
> Extended profile for all non-student users (teachers, accounts, HR, etc.).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | |
| `school_id` | `uuid` FK → `schools.id` | |
| `employee_id` | `text` UNIQUE | |
| `designation` | `text` | e.g. `Senior Teacher`, `Accountant` |
| `department` | `text` | e.g. `Science`, `Admin` |
| `date_of_joining` | `date` | |
| `date_of_birth` | `date` | |
| `gender` | `text` | |
| `qualification` | `text` | |
| `experience_years` | `integer` | |
| `salary` | `numeric` | |
| `status` | `enum` | `active`, `on_leave`, `resigned` |
| `created_at` | `timestamptz` | |

---

## 5. Attendance

### `attendance`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `student_id` | `uuid` FK → `students.id` | |
| `section_id` | `uuid` FK → `sections.id` | |
| `date` | `date` | |
| `status` | `enum` | `present`, `absent`, `late`, `excused` |
| `marked_by` | `uuid` FK → `users.id` | Teacher who marked |
| `remarks` | `text` | |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(school_id, student_id, date)`

---

### `staff_attendance`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `staff_id` | `uuid` FK → `staff_profiles.id` | |
| `date` | `date` | |
| `check_in` | `time` | |
| `check_out` | `time` | |
| `status` | `enum` | `present`, `absent`, `half_day`, `on_leave` |
| `created_at` | `timestamptz` | |

---

## 6. Examinations & Results

### `exam_types`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `name` | `text` | e.g. `Unit Test 1`, `Mid Term`, `Final` |
| `created_at` | `timestamptz` | |

---

### `exams`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `exam_type_id` | `uuid` FK → `exam_types.id` | |
| `subject_id` | `uuid` FK → `subjects.id` | |
| `section_id` | `uuid` FK → `sections.id` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `exam_date` | `date` | |
| `max_marks` | `numeric` | |
| `pass_marks` | `numeric` | |
| `created_at` | `timestamptz` | |

---

### `results`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `exam_id` | `uuid` FK → `exams.id` | |
| `student_id` | `uuid` FK → `students.id` | |
| `marks_obtained` | `numeric` | |
| `grade` | `text` | e.g. `A+`, `B` |
| `remarks` | `text` | |
| `entered_by` | `uuid` FK → `users.id` | |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(school_id, exam_id, student_id)`

---

## 7. Timetable

### `timetable_slots`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `section_id` | `uuid` FK → `sections.id` | |
| `subject_id` | `uuid` FK → `subjects.id` | |
| `teacher_id` | `uuid` FK → `users.id` | |
| `day_of_week` | `integer` | 1=Mon … 7=Sun |
| `period_number` | `integer` | |
| `start_time` | `time` | |
| `end_time` | `time` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `created_at` | `timestamptz` | |

---

## 8. Fees & Finance

### `fee_structures`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `grade_id` | `uuid` FK → `grades.id` | |
| `academic_year_id` | `uuid` FK → `academic_years.id` | |
| `name` | `text` | e.g. `Tuition Fee`, `Transport Fee` |
| `amount` | `numeric` | |
| `frequency` | `enum` | `monthly`, `quarterly`, `annual`, `one_time` |
| `due_day` | `integer` | Day of month |
| `created_at` | `timestamptz` | |

---

### `fee_payments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `student_id` | `uuid` FK → `students.id` | |
| `fee_structure_id` | `uuid` FK → `fee_structures.id` | |
| `amount_paid` | `numeric` | |
| `payment_date` | `date` | |
| `payment_mode` | `enum` | `cash`, `upi`, `bank_transfer`, `cheque` |
| `transaction_id` | `text` | |
| `receipt_number` | `text` UNIQUE | |
| `collected_by` | `uuid` FK → `users.id` | |
| `status` | `enum` | `paid`, `partial`, `pending`, `overdue` |
| `remarks` | `text` | |
| `created_at` | `timestamptz` | |

---

## 9. Communication

### `announcements`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `title` | `text` | |
| `content` | `text` | |
| `audience` | `enum` | `all`, `teachers`, `students`, `parents` |
| `created_by` | `uuid` FK → `users.id` | |
| `publish_date` | `date` | |
| `expiry_date` | `date` | |
| `created_at` | `timestamptz` | |

---

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `sender_id` | `uuid` FK → `users.id` | |
| `receiver_id` | `uuid` FK → `users.id` | |
| `subject` | `text` | |
| `body` | `text` | |
| `is_read` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | |

---

## 10. Library (optional module)

### `library_books`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `title` | `text` | |
| `author` | `text` | |
| `isbn` | `text` | |
| `total_copies` | `integer` | |
| `available_copies` | `integer` | |
| `created_at` | `timestamptz` | |

---

### `book_issues`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `book_id` | `uuid` FK → `library_books.id` | |
| `issued_to` | `uuid` FK → `users.id` | |
| `issued_date` | `date` | |
| `due_date` | `date` | |
| `return_date` | `date` | NULL if not returned |
| `fine_amount` | `numeric` | |
| `issued_by` | `uuid` FK → `users.id` | |
| `created_at` | `timestamptz` | |

---

## 11. Notifications

### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `school_id` | `uuid` FK → `schools.id` | |
| `user_id` | `uuid` FK → `users.id` | |
| `title` | `text` | |
| `body` | `text` | |
| `type` | `text` | e.g. `fee_due`, `attendance`, `result`, `announcement` |
| `is_read` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | |

---

## RLS Policy Summary

| Role | Access Scope |
|---|---|
| `super_admin` | All rows in all tables (RLS bypassed via `auth.jwt() ->> 'role' = 'super_admin'`) |
| `branch_admin` | All rows where `school_id = (select school_id from users where id = auth.uid())` |
| `teacher` | Own profile · assigned sections · students in those sections · own timetable |
| `student` | Own profile · own attendance · own results · own fees · own notifications |
| `parent` | Linked children's data only (via `student_parent_links`) |
| `staff` | Own profile + role-specific access (e.g. accounts → `fee_payments`) |

---

## Supabase Storage Buckets

| Bucket | Contents |
|---|---|
| `school-logos` | School branding images |
| `student-documents` | Admission forms, certificates |
| `staff-documents` | Appointment letters, IDs |
| `fee-receipts` | PDF receipts |
| `announcements-media` | Images/PDFs attached to announcements |

> All buckets should use **private** access with signed URLs generated server-side, scoped by `school_id`.

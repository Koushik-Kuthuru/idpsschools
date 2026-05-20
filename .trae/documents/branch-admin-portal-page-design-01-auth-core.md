# Branch Admin Portal — Page Design Spec (01: Auth + Core)
UI source: `stitch_super_admin_admin_pages` (screenshots + `code.html`). Desktop-first.

## Global Styles (applies to all pages)
- Layout system: CSS Grid for app shell (sidebar + content) and cards; Flexbox for rows/toolbars.
- Background: `#F7F8FA` (app), surfaces `#FFFFFF`, borders `#E5E7EB`.
- Typography: Inter/system; H1 24/28 semibold, H2 18/24 semibold, body 14/20.
- Primary: `#2563EB` (buttons/links), hover `#1D4ED8`; Danger `#DC2626`.
- Buttons: 40px height primary; secondary outline; disabled = 60% opacity.
- Tables: sticky header, zebra optional, row hover highlight.
- Multi-school readiness: header shows active branch name; if user has >1 branch membership, show a Branch Switcher dropdown.

## Shared App Shell (authenticated)
- Header (top): product name left; branch name/switcher; user dropdown; icons for notifications/lock/settings as shown in designs.
- Left nav (or top breadcrumb row per page design): Dashboard, Students, Staff/HR, Finance, Inventory, Admission, Reports, Communication.
- Content container: max-width ~1200–1400px; 24px padding; section cards with 16–20px inner padding.

---

## Page: Login
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/login_page/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Login”; description “Sign in to ERP system”.
- Layout: centered auth card; stacked form fields.
- Sections/components: logo/title, email/username input, password input + show/hide, remember me checkbox, forgot password link, Sign In CTA, footer text.
- States: validation errors, loading on submit.

## Page: Forgot Password
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/forgot_password_page/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Forgot Password”.
- Layout: centered card.
- Components: back button, email input, “Send OTP” CTA, “Back to login”.

## Page: Verify OTP & Reset Password
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/verify_otp_reset_password/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Verify OTP” / “Reset Password”.
- Layout: centered card; 2-step flow.
- Components: OTP 6-box entry, resend timer, new password + confirm, strength meter, reset CTA.

---

## Page: Branch Admin Dashboard
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/branch_admin_dashboard/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Dashboard”; description “Branch overview and approvals”.
- Layout: card grid (3 + 3 KPI cards), then stacked widgets.
- Sections/components:
  - Header row: “Branch Dashboard – {Branch Name} ({City})”.
  - KPI cards: Students, Staff, Revenue, Classes, Fees Due, Attendance.
  - Recent activities panel (list).
  - Pending approvals widget with “View All” link.
- Interactions: KPI cards deep-link to relevant modules.

## Page: Students Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/students_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Students”; description “Search and manage students”.
- Layout: toolbar + table.
- Sections/components:
  - Toolbar: search, filter class, filter status, “+ Add New Student”.
  - Table columns: ID, Name, Class, Roll, Status, Attendance, Actions.
  - Row actions: View, Edit, Attendance, Marks.
  - Pagination footer.

## Page: Add/Edit Student
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/add_edit_student/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Add Student” / “Edit Student”.
- Layout: stacked form cards.
- Sections/components:
  - Personal Information card (name, DOB, gender, email/phone, address).
  - Academic Information card (enrollment no, class/section, roll, status).
  - Parent/Guardian card; Save/Cancel.

## Page: Student Profile (Admin View)
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/student_profile_admin_view/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Student Profile”.
- Layout: 2-column top (photo card + details card) then stacked sections.
- Sections/components: student summary, academic performance table, guardian info, action buttons (edit/attendance/marks/fees/print/message).

## Page: Staff Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/staff_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Staff Management”.
- Layout: toolbar + table.
- Components: search, role/department filters, “+ Add New Staff”, staff table with actions (view/edit/delete).

## Page: Branch Settings
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/branch_settings/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Branch Settings”.
- Layout: left vertical section list (or stacked list) + main content card.
- Sections/components:
  - Section links: General, Academic, Notification, Fee Configuration, Staff Policies, Holidays & Calendar.
  - General Information form: branch name/code, principal, phone, email, academic year; “Save Changes”.

## Page: User Profile Settings (refined)
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/refined_user_profile_settings/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Profile Settings”.
- Layout: tabbed settings (Basic Info, Password, Preferences, Privacy, Sessions).
- Components: basic info summary + edit, change password form + sign out other sessions, notification preferences toggles, active sessions list.

Note: If both `user_profile_settings` and `refined_user_profile_settings` exist, implement the refined design for parity with the latest screen.
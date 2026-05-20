# Branch Admin Portal — Page Design Spec (02: Academic + Finance)
UI source: `stitch_super_admin_admin_pages` (screenshots + `code.html`). Desktop-first.

## Global Styles + Shell
Use the same global styles and app shell as in `branch-admin-portal-page-design-01-auth-core.md`.

---

## Page: Attendance Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/attendance_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Attendance”; description “Mark class attendance”.
- Layout: toolbar row + roster table card.
- Components:
  - Controls: date picker, class dropdown, section dropdown; Load, Mark All Present, Mark Bulk, Export.
  - Roster table: student name + status radio (Present/Absent).
  - Totals row + “Save Attendance”.

## Page: Marks Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/marks_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Marks”; description “Enter and publish marks”.
- Layout: filters toolbar + marks entry table.
- Components: exam/class/subject selectors; Load; Bulk Upload; Export; Publish Results; marks entry cells; Save/Clear.

## Page: Class Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/class_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Class Management”.
- Layout: top actions + table.
- Components: grade filter; add class/section; classes overview table; row actions (edit/view teachers/student list); footer links (strength report/teacher allocation/room mapping).

## Page: Timetable Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/timetable_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Timetable”.
- Layout: toolbar + timetable grid.
- Components: grade/section selectors; create/edit/generate/export/view/assign rooms; timetable week grid; print/email/modify slots.

---

## Page: Fee Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/fee_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Fee Management”.
- Layout: filters row + fee structure table + summary card.
- Components: class/status filters; “+ Add Fee Structure”; per-row actions (edit/delete/duplicate); monthly collection summary block.

## Page: Invoice Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/invoice_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Invoices”.
- Layout: search/filter toolbar + invoices table.
- Components: search, status, date range, “+ Generate Invoice”; table with invoice no/student/amount/date/status/action; pagination.

## Page: Payment Collection
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/payment_collection/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Payments”.
- Layout: action toolbar + recent payments table + totals.
- Components: record payment CTA; view reports; reconciliation; recent payments list; daily/month totals.

## Page: Expense Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/expense_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Expenses”.
- Layout: search/filter toolbar + expense table + totals.
- Components: category/status filters; “+ Add Expense”; “Approval Pending”; table with approve/view actions; month total vs budget.

## Page: Payroll Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/payroll_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Payroll”.
- Layout: month toolbar + summary card + payroll table.
- Components: month selector; process payroll; export slips; approve all; summary values; employee payroll rows with view action.

## Page: Financial Reports
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/financial_reports/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Financial Reports”.
- Layout: left report list + main report panel.
- Components: report type list; report content panel (e.g., P&L); export PDF; email; print.

Multi-school readiness note (finance): All monetary reports and lists are filtered by the active branch; if a branch switch occurs, re-run queries and refresh aggregates.
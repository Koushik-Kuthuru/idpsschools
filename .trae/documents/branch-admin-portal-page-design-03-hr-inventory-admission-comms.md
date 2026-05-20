# Branch Admin Portal — Page Design Spec (03: HR + Inventory + Admission + Analytics + Comms)
UI source: `stitch_super_admin_admin_pages` (screenshots + `code.html`). Desktop-first.

## Global Styles + Shell
Use the same global styles and app shell as in `branch-admin-portal-page-design-01-auth-core.md`.

---

## HR

### Page: Employee Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/employee_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Employees”.
- Layout: toolbar + stats cards + list table.
- Components: search + department/status filters; add employee; stats cards (total/on leave/active); employee list with actions (view/edit/salary/leave balance).

### Page: Add/Edit Employee
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/add_edit_employee/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Add Employee” / “Edit Employee”.
- Layout: stacked form cards.
- Components: personal info; employment info (dept/position/joining/employment type/salary/reporting-to/status); toggles (send welcome email/create user account); save/cancel.

### Page: Leave Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/leave_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Leave Management”.
- Layout: filters toolbar + requests table + balance summary.
- Components: approve/reject/view; downloadable/email summary actions.

### Page: Department Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/department_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Departments”.
- Layout: search + table.
- Components: add department; list with edit/view/delete.

### Page: Teacher/Employee Profile (Admin View)
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/teacher_profile_admin_view/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Employee Profile”.
- Layout: top summary split card + stacked details.
- Components: employee summary (photo/details), employment details, leave balance, classes assigned, action shortcuts.

---

## Inventory

### Page: Stock Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/stock_management_inventory/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Stock Management”.
- Layout: toolbar + summary cards + table.
- Components: search/category filter; add item; stock in; export; low stock alert; table with qty + reorder + status indicators.

### Page: Purchase Orders
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/purchase_orders/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Purchase Orders”.
- Layout: filter toolbar + PO table.
- Components: status/vendor filters; new PO; pending approvals count; per-row approve/reject/GRN/view.

### Page: Asset Tracking
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/asset_tracking/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Asset Tracking”.
- Layout: toolbar + summary + table.
- Components: search/category/status; add asset; depreciation report; asset list with maintain action.

---

## Admission

### Page: Lead Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/lead_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Leads”.
- Layout: toolbar + funnel summary + list table.
- Components: status/source filters; new lead; conversion report; row actions (follow-up/convert).

### Page: Enquiry Management
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/enquiry_management/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Enquiries”.
- Layout: toolbar + list table.
- Components: grade/status filters; log enquiry; callback schedule; row actions (call/schedule tour/convert).

### Page: Admission Applications
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/admission_applications/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Applications”.
- Layout: toolbar + stats cards + list table.
- Components: grade/status filters; merit list/final selection; verification actions; publish/send offers/generate admit artifacts.

---

## Analytics + Communication

### Page: Reports & Analytics Dashboard
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/reports_analytics_dashboard/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Analytics”.
- Layout: filter toolbar + KPI cards + charts + table.
- Components: date range selector; branch selector (shown for super admin; branch admin sees fixed branch); export/email/schedule.

### Page: Communication Center
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/communication_center_1/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Messages”.
- Layout: tabs row + message list card.
- Components: inbox/sent/drafts/announcements tabs; compose CTA; list items with sender, subject, time, attachments; bulk actions.

### Page: Notifications & Alerts
<img src="stitch_super_admin_admin_pages/stitch_super_admin_admin_pages/notifications_alerts/screen.png" style="max-width:100%;border:1px solid #eee" />
- Meta: title “Notifications”.
- Layout: category tabs + stacked alert cards.
- Components: mark all read; clear all; notification settings; deep links (pay now/view attendance/review application).

Multi-school readiness note: Notifications/messages are scoped to the active branch plus user identity; switching branches updates unread counts and lists.
# 📁 Complete Multi-Tenant ERP Folder Structure
## Super Admin + Branch Admin + Student App + Faculty App

```
educational-erp/
│
├── 🔧 BACKEND (Multi-Tenant API Server)
├── 🌐 WEB APP (All Admins & Operations)
├── 📱 MOBILE APP - STUDENT
├── 📱 MOBILE APP - FACULTY
├── 📦 SHARED CODE
├── 📚 DOCUMENTATION
└── ⚙️ INFRASTRUCTURE
```

---

## 1️⃣ BACKEND STRUCTURE (Multi-Tenant)

```
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── jwt.js
│   │   ├── multitenancy.js       # ⭐ Tenant configuration
│   │   ├── environment.js
│   │   └── payment.js
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── tenantMiddleware.js    # ⭐ Extract branch_id
│   │   ├── branchScope.js         # ⭐ Enforce data isolation
│   │   ├── rbac.js               # Role-based access
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   ├── logging.js
│   │   ├── cors.js
│   │   └── rateLimit.js
│   │
│   ├── models/
│   │   │
│   │   ├── core/
│   │   │   ├── Branch.js         # ⭐ School/Campus entity
│   │   │   ├── User.js           # With branch_id & is_super_admin
│   │   │   ├── Role.js           # SUPER_ADMIN, BRANCH_ADMIN roles
│   │   │   └── Permission.js     # Different per role type
│   │   │
│   │   ├── academic/
│   │   │   ├── Student.js        # branch_id field
│   │   │   ├── Class.js          # branch_id field
│   │   │   ├── Subject.js        # branch_id field
│   │   │   ├── Attendance.js     # branch_id field
│   │   │   ├── Marks.js          # branch_id field
│   │   │   └── Timetable.js      # branch_id field
│   │   │
│   │   ├── finance/
│   │   │   ├── FeeStructure.js   # branch_id field
│   │   │   ├── Invoice.js        # branch_id field
│   │   │   ├── Payment.js        # branch_id field
│   │   │   ├── Expense.js        # branch_id field
│   │   │   ├── Payroll.js        # branch_id field
│   │   │   └── Transaction.js    # branch_id field
│   │   │
│   │   ├── hr/
│   │   │   ├── Employee.js       # branch_id field
│   │   │   ├── LeaveRequest.js   # branch_id field
│   │   │   ├── Department.js     # branch_id field
│   │   │   └── Designation.js    # branch_id field
│   │   │
│   │   ├── inventory/
│   │   │   ├── Item.js           # branch_id field
│   │   │   ├── Stock.js          # branch_id field
│   │   │   ├── PurchaseOrder.js  # branch_id field
│   │   │   └── Vendor.js
│   │   │
│   │   ├── admission/
│   │   │   ├── Lead.js           # branch_id field
│   │   │   ├── Enquiry.js        # branch_id field
│   │   │   └── ApplicationForm.js# branch_id field
│   │   │
│   │   └── operations/
│   │       ├── Branch.js         # Main branch table
│   │       ├── AuditLog.js       # branch_id field
│   │       ├── SystemSetting.js
│   │       └── BranchSetting.js
│   │
│   ├── controllers/
│   │   │
│   │   ├── superadmin/           # ⭐ SUPER ADMIN ONLY
│   │   │   ├── branchController.js        # Create/edit/delete branches
│   │   │   ├── superAdminController.js    # Super admin dashboard
│   │   │   ├── userManagementController.js # Manage all users
│   │   │   ├── systemSettingController.js # System-wide config
│   │   │   └── crossBranchReportController.js
│   │   │
│   │   ├── admin/                # ⭐ BRANCH ADMIN ONLY
│   │   │   ├── branchAdminController.js   # Branch dashboard
│   │   │   ├── branchSettingController.js # Branch-specific settings
│   │   │   ├── staffManagementController.js
│   │   │   └── branchReportController.js
│   │   │
│   │   ├── auth/
│   │   │   ├── authController.js
│   │   │   └── roleController.js
│   │   │
│   │   ├── academic/
│   │   │   ├── studentController.js
│   │   │   ├── classController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── marksController.js
│   │   │   └── subjectController.js
│   │   │
│   │   ├── finance/
│   │   │   ├── feeController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── paymentController.js
│   │   │   ├── expenseController.js
│   │   │   ├── payrollController.js
│   │   │   └── reportController.js
│   │   │
│   │   ├── hr/
│   │   │   ├── employeeController.js
│   │   │   ├── leaveController.js
│   │   │   └── departmentController.js
│   │   │
│   │   ├── inventory/
│   │   │   ├── itemController.js
│   │   │   ├── stockController.js
│   │   │   └── purchaseController.js
│   │   │
│   │   ├── admission/
│   │   │   ├── leadController.js
│   │   │   ├── enquiryController.js
│   │   │   └── admissionController.js
│   │   │
│   │   └── operations/
│   │       ├── branchController.js
│   │       └── reportController.js
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── superadmin.js         # ⭐ Super admin routes
│   │   ├── admin.js              # ⭐ Branch admin routes
│   │   ├── student.js            # ⭐ Student app routes
│   │   ├── faculty.js            # ⭐ Faculty app routes
│   │   ├── academic.js
│   │   ├── finance.js
│   │   ├── hr.js
│   │   ├── inventory.js
│   │   ├── admission.js
│   │   └── operations.js
│   │
│   ├── services/
│   │   │
│   │   ├── auth/
│   │   │   ├── authService.js
│   │   │   ├── jwtService.js
│   │   │   ├── rbacService.js
│   │   │   └── permissionService.js  # Branch-aware
│   │   │
│   │   ├── multitenancy/         # ⭐ Tenant management
│   │   │   ├── tenantService.js
│   │   │   ├── branchService.js
│   │   │   └── dataIsolationService.js
│   │   │
│   │   ├── superadmin/           # ⭐ Super admin features
│   │   │   ├── branchManagementService.js
│   │   │   ├── crossBranchAnalyticsService.js
│   │   │   └── userManagementService.js
│   │   │
│   │   ├── admin/                # ⭐ Branch admin features
│   │   │   ├── branchOperationsService.js
│   │   │   ├── staffManagementService.js
│   │   │   └── branchAnalyticsService.js
│   │   │
│   │   ├── student/              # ⭐ Student app specific
│   │   │   ├── studentDashboardService.js
│   │   │   ├── studentAttendanceService.js
│   │   │   ├── studentMarksService.js
│   │   │   └── studentFeeService.js
│   │   │
│   │   ├── faculty/              # ⭐ Faculty app specific
│   │   │   ├── facultyDashboardService.js
│   │   │   ├── facultyAttendanceService.js
│   │   │   ├── facultyMarksService.js
│   │   │   ├── facultyClassService.js
│   │   │   └── facultyCommunicationService.js
│   │   │
│   │   ├── academic/
│   │   │   ├── studentService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── marksService.js
│   │   │   └── classService.js
│   │   │
│   │   ├── finance/
│   │   │   ├── feeService.js
│   │   │   ├── paymentService.js
│   │   │   ├── invoiceService.js
│   │   │   └── payrollService.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── emailService.js
│   │   │   ├── smsService.js
│   │   │   └── pushService.js    # Firebase Cloud Messaging
│   │   │
│   │   ├── external/
│   │   │   ├── paymentGateway.js
│   │   │   ├── fileUploadService.js
│   │   │   └── gstService.js
│   │   │
│   │   └── cache/
│   │       └── cacheService.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── helpers.js
│   │   ├── dateUtils.js
│   │   ├── constants.js
│   │   ├── encryptDecrypt.js
│   │   ├── logger.js
│   │   └── multitenancy.js       # Tenant helper functions
│   │
│   ├── jobs/
│   │   ├── payrollJob.js
│   │   ├── attendanceJob.js
│   │   ├── emailJob.js
│   │   └── jobScheduler.js
│   │
│   ├── seeds/
│   │   ├── seedBranches.js       # Create demo branches
│   │   ├── seedRoles.js          # SUPER_ADMIN, BRANCH_ADMIN roles
│   │   ├── seedPermissions.js
│   │   └── seedUsers.js          # Create demo users per branch
│   │
│   ├── migrations/
│   │   ├── 001_create_branches.js
│   │   ├── 002_create_users.js
│   │   ├── 003_create_students.js
│   │   ├── 004_add_branch_id.js
│   │   └── ... (other migrations)
│   │
│   └── app.js
│
├── tests/
│   ├── unit/
│   │   ├── superadmin.test.js
│   │   ├── branchAdmin.test.js
│   │   ├── multitenancy.test.js
│   │   └── ...
│   │
│   └── integration/
│       ├── auth.integration.test.js
│       ├── branchIsolation.test.js
│       └── ...
│
├── .env.example
├── .env
├── .env.production
├── server.js
├── package.json
├── docker-compose.yml
└── README.md
```

---

## 2️⃣ WEB APP STRUCTURE (React - All Admin/Operations)

```
web-app/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── styles/
│   │       ├── global.css
│   │       └── variables.css
│   │
│   ├── components/
│   │   │
│   │   ├── shared/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   ├── Card/
│   │   │   ├── Loader/
│   │   │   └── Breadcrumb/
│   │   │
│   │   ├── superadmin/           # ⭐ Super Admin Components
│   │   │   ├── BranchCard/
│   │   │   ├── BranchForm/
│   │   │   ├── UserManagementTable/
│   │   │   ├── CrossBranchChart/
│   │   │   └── SystemSettingsPanel/
│   │   │
│   │   ├── admin/                # ⭐ Branch Admin Components
│   │   │   ├── BranchOverviewCard/
│   │   │   ├── StaffTable/
│   │   │   ├── BranchMetricsChart/
│   │   │   └── BranchSettingsPanel/
│   │   │
│   │   ├── academic/
│   │   │   ├── StudentCard/
│   │   │   ├── AttendanceTable/
│   │   │   ├── MarksCard/
│   │   │   ├── ClassList/
│   │   │   └── MarksUploadForm/
│   │   │
│   │   ├── finance/
│   │   │   ├── FeeStructureForm/
│   │   │   ├── InvoiceGenerator/
│   │   │   ├── PaymentForm/
│   │   │   ├── ExpenseForm/
│   │   │   └── FinancialChart/
│   │   │
│   │   ├── hr/
│   │   │   ├── EmployeeForm/
│   │   │   ├── LeaveRequestForm/
│   │   │   ├── DepartmentForm/
│   │   │   └── EmployeeTable/
│   │   │
│   │   ├── inventory/
│   │   │   ├── StockForm/
│   │   │   ├── PurchaseOrderForm/
│   │   │   ├── InventoryTable/
│   │   │   └── AssetList/
│   │   │
│   │   └── admission/
│   │       ├── LeadForm/
│   │       ├── EnquiryForm/
│   │       ├── AdmissionForm/
│   │       └── LeadTable/
│   │
│   ├── pages/
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SuperAdminDashboard.jsx         # ⭐ For super admins
│   │   │   │   ├── BranchMetrics.jsx
│   │   │   │   ├── CrossBranchReports.jsx
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   └── SystemOverview.jsx
│   │   │   │
│   │   │   └── BranchAdminDashboard.jsx        # ⭐ For branch admins
│   │   │       ├── BranchMetrics.jsx
│   │   │       ├── StaffOverview.jsx
│   │   │       ├── FinancialOverview.jsx
│   │   │       └── BranchReports.jsx
│   │   │
│   │   ├── superadmin/                        # ⭐ Super Admin Pages
│   │   │   ├── BranchesPage.jsx
│   │   │   │   ├── BranchListPage.jsx
│   │   │   │   ├── CreateBranchPage.jsx
│   │   │   │   └── EditBranchPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── SystemSettingsPage.jsx
│   │   │   ├── CrossBranchReportsPage.jsx
│   │   │   └── AuditLogPage.jsx
│   │   │
│   │   ├── admin/                             # ⭐ Branch Admin Pages
│   │   │   ├── BranchSettingsPage.jsx
│   │   │   ├── StaffManagementPage.jsx
│   │   │   ├── BranchReportsPage.jsx
│   │   │   └── StudentManagementPage.jsx
│   │   │
│   │   ├── academic/
│   │   │   ├── StudentListPage.jsx
│   │   │   ├── StudentDetailPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── MarksPage.jsx
│   │   │   └── ClassManagementPage.jsx
│   │   │
│   │   ├── finance/
│   │   │   ├── FeesPage.jsx
│   │   │   ├── InvoicesPage.jsx
│   │   │   ├── PaymentsPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   └── PayrollPage.jsx
│   │   │
│   │   ├── hr/
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── LeaveManagementPage.jsx
│   │   │   └── DepartmentsPage.jsx
│   │   │
│   │   ├── inventory/
│   │   │   ├── StockPage.jsx
│   │   │   ├── PurchaseOrdersPage.jsx
│   │   │   └── AssetsPage.jsx
│   │   │
│   │   ├── admission/
│   │   │   ├── LeadsPage.jsx
│   │   │   ├── AdmissionsPage.jsx
│   │   │   └── ConversionReportsPage.jsx
│   │   │
│   │   └── profile/
│   │       ├── MyProfilePage.jsx
│   │       ├── ChangePasswordPage.jsx
│   │       └── PreferencesPage.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useForm.js
│   │   ├── usePermission.js
│   │   ├── useBranch.js          # ⭐ Get current branch context
│   │   └── useDebounce.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── BranchContext.jsx     # ⭐ Branch context for multi-tenant
│   │   ├── UserContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── PermissionContext.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── superadminService.js   # ⭐ Super admin API calls
│   │   ├── branchAdminService.js  # ⭐ Branch admin API calls
│   │   ├── studentService.js
│   │   ├── teacherService.js
│   │   ├── feeService.js
│   │   ├── paymentService.js
│   │   ├── employeeService.js
│   │   ├── leaveService.js
│   │   ├── inventoryService.js
│   │   ├── reportService.js
│   │   └── uploadService.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── dateUtils.js
│   │   ├── constants.js
│   │   ├── localStorage.js
│   │   └── errorHandler.js
│   │
│   ├── styles/
│   │   ├── tailwind.css
│   │   └── variables.css
│   │
│   ├── App.jsx
│   └── index.jsx
│
├── tests/
│   ├── unit/
│   │   ├── superadmin.test.js
│   │   ├── branchAdmin.test.js
│   │   └── ...
│   │
│   └── integration/
│       └── pages/
│
├── .env.example
├── .env
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 3️⃣ MOBILE APP - STUDENT (React Native)

```
mobile-app-student/
│
├── app/
│   │
│   ├── screens/
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── SignupScreen.jsx
│   │   │   ├── ForgotPasswordScreen.jsx
│   │   │   └── VerifyOtpScreen.jsx
│   │   │
│   │   ├── student/                  # ⭐ STUDENT APP SCREENS
│   │   │   ├── StudentDashboardScreen.jsx
│   │   │   │   ├── AttendanceWidget.jsx
│   │   │   │   ├── MarksWidget.jsx
│   │   │   │   ├── FeeWidget.jsx
│   │   │   │   └── NotificationsWidget.jsx
│   │   │   │
│   │   │   ├── AttendanceScreen.jsx
│   │   │   │   ├── AttendanceByClass.jsx
│   │   │   │   ├── AttendanceBySubject.jsx
│   │   │   │   └── AttendanceChart.jsx
│   │   │   │
│   │   │   ├── MarksScreen.jsx
│   │   │   │   ├── SubjectWiseMarks.jsx
│   │   │   │   ├── GradeAnalysis.jsx
│   │   │   │   ├── PerformanceChart.jsx
│   │   │   │   └── TranscriptViewer.jsx
│   │   │   │
│   │   │   ├── FeesScreen.jsx
│   │   │   │   ├── FeeStructure.jsx
│   │   │   │   ├── PaymentHistory.jsx
│   │   │   │   ├── ReceiptViewer.jsx
│   │   │   │   ├── PendingFeesAlert.jsx
│   │   │   │   └── OnlinePaymentForm.jsx
│   │   │   │
│   │   │   ├── TimeTableScreen.jsx
│   │   │   │   ├── WeeklyTimeTable.jsx
│   │   │   │   ├── ExamSchedule.jsx
│   │   │   │   └── ClassRoomLocation.jsx
│   │   │   │
│   │   │   ├── NotificationsScreen.jsx
│   │   │   │   ├── AnnouncementsList.jsx
│   │   │   │   ├── PersonalNotifications.jsx
│   │   │   │   └── NotificationSettings.jsx
│   │   │   │
│   │   │   ├── ProfileScreen.jsx
│   │   │   │   ├── StudentInfoCard.jsx
│   │   │   │   ├── ParentInfo.jsx
│   │   │   │   ├── ChangePassword.jsx
│   │   │   │   ├── AboutMe.jsx
│   │   │   │   └── Preferences.jsx
│   │   │   │
│   │   │   ├── CommunicationScreen.jsx
│   │   │   │   ├── TeachersList.jsx
│   │   │   │   ├── ChatInterface.jsx
│   │   │   │   └── NoticeBoard.jsx
│   │   │   │
│   │   │   └── studentStack.js
│   │   │
│   │   └── common/
│   │       ├── SplashScreen.jsx
│   │       ├── LoadingScreen.jsx
│   │       └── ErrorScreen.jsx
│   │
│   ├── components/
│   │   │
│   │   ├── shared/
│   │   │   ├── Header.jsx
│   │   │   ├── BottomTab.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Badge.jsx
│   │   │
│   │   ├── student/                  # ⭐ STUDENT-SPECIFIC COMPONENTS
│   │   │   ├── AttendanceCard.jsx
│   │   │   ├── MarksCard.jsx
│   │   │   ├── FeeCard.jsx
│   │   │   ├── NotificationCard.jsx
│   │   │   ├── AnnouncementCard.jsx
│   │   │   ├── ClassCard.jsx
│   │   │   ├── PerformanceChart.jsx
│   │   │   ├── ReceiptViewer.jsx
│   │   │   └── PaymentButton.jsx
│   │   │
│   │   └── forms/
│   │       ├── PaymentForm.jsx
│   │       └── ComplaintForm.jsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.jsx        # Entry point
│   │   ├── AuthNavigator.jsx        # Auth stack
│   │   ├── StudentTabNavigator.jsx  # ⭐ Student app bottom tabs
│   │   ├── navigationConfig.js
│   │   └── linkingConfiguration.js  # Deep linking
│   │
│   ├── services/
│   │   │
│   │   ├── api.js                   # Axios instance
│   │   ├── authService.js
│   │   │
│   │   ├── student/                 # ⭐ STUDENT-SPECIFIC SERVICES
│   │   │   ├── studentDashboardService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── marksService.js
│   │   │   ├── feeService.js
│   │   │   ├── paymentService.js
│   │   │   ├── notificationService.js
│   │   │   ├── timeTableService.js
│   │   │   └── communicationService.js
│   │   │
│   │   └── uploadService.js
│   │
│   ├── storage/
│   │   ├── offlineDB.js             # SQLite database setup
│   │   │
│   │   ├── offline/
│   │   │   ├── studentDB.js         # ⭐ Student offline data
│   │   │   ├── attendanceDB.js
│   │   │   ├── marksDB.js
│   │   │   ├── feeDB.js
│   │   │   └── syncManager.js       # Sync logic
│   │   │
│   │   ├── asyncStorage.js          # Secure storage
│   │   └── tokenStorage.js          # JWT storage
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useForm.js
│   │   ├── useNetworkStatus.js      # Offline detection
│   │   ├── usePushNotification.js   # FCM setup
│   │   ├── useOfflineSync.js        # Offline sync
│   │   └── useStudentData.js        # Student-specific hooks
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── StudentContext.jsx       # ⭐ Student data context
│   │   ├── OfflineContext.jsx       # Offline mode context
│   │   └── NotificationContext.jsx
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── dateUtils.js
│   │   ├── constants.js
│   │   ├── colors.js
│   │   ├── errorHandler.js
│   │   └── permissions.js
│   │
│   ├── styles/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   ├── spacing.js
│   │   └── globalStyles.js
│   │
│   ├── App.jsx
│   └── index.js
│
├── ios/
│   ├── Podfile
│   └── [ProjectName]/
│       └── Info.plist
│
├── android/
│   ├── app/
│   │   └── build.gradle
│   └── build.gradle
│
├── tests/
│   ├── unit/
│   │   └── services/
│   └── integration/
│       └── screens/
│
├── .env.example
├── .env
├── app.json
├── metro.config.js
├── babel.config.js
├── package.json
└── README.md
```

---

## 4️⃣ MOBILE APP - FACULTY (React Native)

```
mobile-app-faculty/
│
├── app/
│   │
│   ├── screens/
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── SignupScreen.jsx
│   │   │   ├── ForgotPasswordScreen.jsx
│   │   │   └── VerifyOtpScreen.jsx
│   │   │
│   │   ├── faculty/                 # ⭐ FACULTY APP SCREENS
│   │   │   ├── FacultyDashboardScreen.jsx
│   │   │   │   ├── ClassesWidget.jsx
│   │   │   │   ├── AttendanceWidget.jsx
│   │   │   │   ├── PendingMarksWidget.jsx
│   │   │   │   ├── CommunicationWidget.jsx
│   │   │   │   └── LeaveBalanceWidget.jsx
│   │   │   │
│   │   │   ├── MyClassesScreen.jsx
│   │   │   │   ├── ClassList.jsx
│   │   │   │   ├── ClassDetailsScreen.jsx
│   │   │   │   ├── StudentListByClass.jsx
│   │   │   │   └── ClassAnnouncementForm.jsx
│   │   │   │
│   │   │   ├── AttendanceScreen.jsx
│   │   │   │   ├── ClassSelectorForAttendance.jsx
│   │   │   │   ├── AttendanceMarkingForm.jsx      # Offline-first
│   │   │   │   ├── BulkAttendanceUpload.jsx
│   │   │   │   ├── AttendanceHistory.jsx
│   │   │   │   └── AttendanceReport.jsx
│   │   │   │
│   │   │   ├── MarksScreen.jsx
│   │   │   │   ├── ClassSelectorForMarks.jsx
│   │   │   │   ├── MarkEntryForm.jsx              # Offline-first
│   │   │   │   ├── BulkMarksUpload.jsx
│   │   │   │   ├── MarksHistory.jsx
│   │   │   │   ├── MarksReviewScreen.jsx
│   │   │   │   └── GradeDistributionChart.jsx
│   │   │   │
│   │   │   ├── TimeTableScreen.jsx
│   │   │   │   ├── MyTimeTable.jsx
│   │   │   │   ├── ExamDuties.jsx
│   │   │   │   └── RoomAllocation.jsx
│   │   │   │
│   │   │   ├── HomeworkScreen.jsx
│   │   │   │   ├── CreateHomework.jsx
│   │   │   │   ├── HomeworkList.jsx
│   │   │   │   ├── SubmissionTracker.jsx
│   │   │   │   └── StudentSubmissions.jsx
│   │   │   │
│   │   │   ├── CommunicationScreen.jsx
│   │   │   │   ├── StudentsList.jsx
│   │   │   │   ├── ChatInterface.jsx
│   │   │   │   ├── NoticeBoard.jsx
│   │   │   │   ├── AnnouncementForm.jsx
│   │   │   │   └── StudentComplaintsTracker.jsx
│   │   │   │
│   │   │   ├── LeaveScreen.jsx
│   │   │   │   ├── LeaveApplicationForm.jsx
│   │   │   │   ├── LeaveHistory.jsx
│   │   │   │   ├── LeaveBalance.jsx
│   │   │   │   └── LeaveCalendar.jsx
│   │   │   │
│   │   │   ├── ProfileScreen.jsx
│   │   │   │   ├── FacultyInfoCard.jsx
│   │   │   │   ├── DepartmentInfo.jsx
│   │   │   │   ├── Qualifications.jsx
│   │   │   │   ├── ChangePassword.jsx
│   │   │   │   └── Preferences.jsx
│   │   │   │
│   │   │   └── facultyStack.js
│   │   │
│   │   └── common/
│   │       ├── SplashScreen.jsx
│   │       ├── LoadingScreen.jsx
│   │       └── ErrorScreen.jsx
│   │
│   ├── components/
│   │   │
│   │   ├── shared/
│   │   │   ├── Header.jsx
│   │   │   ├── BottomTab.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Badge.jsx
│   │   │
│   │   ├── faculty/                 # ⭐ FACULTY-SPECIFIC COMPONENTS
│   │   │   ├── ClassCard.jsx
│   │   │   ├── StudentListCard.jsx
│   │   │   ├── AttendanceCheckbox.jsx
│   │   │   ├── MarkEntryField.jsx
│   │   │   ├── HomeworkCard.jsx
│   │   │   ├── SubmissionStatusBadge.jsx
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── LeaveTypeSelector.jsx
│   │   │   ├── LeaveBalanceCard.jsx
│   │   │   ├── SyncIndicator.jsx      # Shows offline/sync status
│   │   │   └── OfflineDataAlert.jsx   # Warns about unsaved data
│   │   │
│   │   └── forms/
│   │       ├── AttendanceForm.jsx
│   │       ├── MarkEntryForm.jsx
│   │       ├── HomeworkForm.jsx
│   │       └── LeaveApplicationForm.jsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.jsx        # Entry point
│   │   ├── AuthNavigator.jsx        # Auth stack
│   │   ├── FacultyTabNavigator.jsx  # ⭐ Faculty app bottom tabs
│   │   ├── navigationConfig.js
│   │   └── linkingConfiguration.js  # Deep linking
│   │
│   ├── services/
│   │   │
│   │   ├── api.js                   # Axios instance
│   │   ├── authService.js
│   │   │
│   │   ├── faculty/                 # ⭐ FACULTY-SPECIFIC SERVICES
│   │   │   ├── facultyDashboardService.js
│   │   │   ├── classService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── marksService.js
│   │   │   ├── homeworkService.js
│   │   │   ├── communicationService.js
│   │   │   ├── leaveService.js
│   │   │   ├── timeTableService.js
│   │   │   └── notificationService.js
│   │   │
│   │   └── uploadService.js
│   │
│   ├── storage/
│   │   ├── offlineDB.js             # SQLite database setup
│   │   │
│   │   ├── offline/
│   │   │   ├── facultyDB.js         # ⭐ Faculty offline data
│   │   │   ├── attendanceDB.js      # ⭐ Offline attendance marking
│   │   │   ├── marksDB.js           # ⭐ Offline marks entry
│   │   │   ├── homeworkDB.js
│   │   │   ├── syncManager.js       # ⭐ Smart sync queue
│   │   │   └── conflictResolver.js  # Handle offline conflicts
│   │   │
│   │   ├── asyncStorage.js          # Secure storage
│   │   └── tokenStorage.js          # JWT storage
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useForm.js
│   │   ├── useNetworkStatus.js      # ⭐ Offline detection
│   │   ├── usePushNotification.js   # FCM setup
│   │   ├── useOfflineSync.js        # ⭐ Offline sync queue
│   │   ├── useFacultyData.js        # Faculty-specific hooks
│   │   └── useBiometric.js          # Biometric auth (optional)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── FacultyContext.jsx       # ⭐ Faculty data context
│   │   ├── OfflineContext.jsx       # ⭐ Offline mode context
│   │   ├── SyncContext.jsx          # ⭐ Sync status context
│   │   └── NotificationContext.jsx
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── dateUtils.js
│   │   ├── constants.js
│   │   ├── colors.js
│   │   ├── errorHandler.js
│   │   ├── permissions.js
│   │   └── offlineUtils.js          # ⭐ Offline helpers
│   │
│   ├── styles/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   ├── spacing.js
│   │   └── globalStyles.js
│   │
│   ├── App.jsx
│   └── index.js
│
├── ios/
│   ├── Podfile
│   └── [ProjectName]/
│       └── Info.plist
│
├── android/
│   ├── app/
│   │   └── build.gradle
│   └── build.gradle
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   │
│   └── integration/
│       ├── offline/
│       ├── sync/
│       └── screens/
│
├── .env.example
├── .env
├── app.json
├── metro.config.js
├── babel.config.js
├── package.json
└── README.md
```

---

## 5️⃣ SHARED CODE STRUCTURE

```
shared/
│
├── types/
│   ├── user.types.ts
│   ├── student.types.ts
│   ├── faculty.types.ts
│   ├── branch.types.ts
│   ├── attendance.types.ts
│   ├── marks.types.ts
│   ├── fee.types.ts
│   ├── api.types.ts
│   └── index.ts
│
├── constants/
│   ├── roles.ts               # SUPER_ADMIN, BRANCH_ADMIN
│   ├── permissions.ts
│   ├── modules.ts
│   ├── apiEndpoints.ts
│   ├── errorMessages.ts
│   ├── successMessages.ts
│   ├── httpStatusCodes.ts
│   └── index.ts
│
├── utils/
│   ├── validators.ts
│   ├── formatters.ts
│   ├── dateUtils.ts
│   ├── numberUtils.ts
│   ├── apiClient.ts           # Shared axios instance
│   ├── jwtDecoder.ts
│   ├── encryptDecrypt.ts
│   └── index.ts
│
├── config/
│   ├── apiConfig.ts
│   ├── authConfig.ts
│   └── index.ts
│
├── interfaces/
│   ├── IUser.ts
│   ├── IStudent.ts
│   ├── IFaculty.ts
│   ├── IBranch.ts
│   └── index.ts
│
└── index.ts
```

---

## 6️⃣ DOCUMENTATION STRUCTURE

```
docs/
│
├── README.md                           # Project overview
├── SETUP.md                            # Setup instructions
├── ARCHITECTURE.md                     # System architecture
├── MULTI_TENANCY.md                    # ⭐ Super Admin vs Branch Admin
├── MOBILE_STRATEGY.md                  # ⭐ Student vs Faculty apps
├── API-DOCUMENTATION.md                # API endpoints
├── DEVELOPMENT.md                      # Development guide
├── DEPLOYMENT.md                       # Deployment guide
│
├── guides/
│   ├── backend-setup.md
│   ├── web-app-setup.md
│   ├── mobile-student-setup.md         # ⭐ Student app setup
│   ├── mobile-faculty-setup.md         # ⭐ Faculty app setup
│   ├── database-migration.md
│   └── testing-guide.md
│
├── api/
│   ├── auth-api.md
│   ├── superadmin-api.md               # ⭐ Super admin endpoints
│   ├── admin-api.md                    # ⭐ Branch admin endpoints
│   ├── student-api.md                  # ⭐ Student app endpoints
│   ├── faculty-api.md                  # ⭐ Faculty app endpoints
│   ├── academic-api.md
│   ├── finance-api.md
│   └── reports-api.md
│
├── mobile/
│   ├── student-app-guide.md            # ⭐ Student app features
│   ├── faculty-app-guide.md            # ⭐ Faculty app features
│   ├── offline-sync-guide.md           # ⭐ Faculty offline mode
│   ├── push-notifications.md
│   └── mobile-testing.md
│
├── database/
│   ├── schema-diagram.md
│   ├── branch-isolation.md             # ⭐ Data isolation rules
│   ├── sample-queries.md
│   └── migrations.md
│
└── deployment/
    ├── docker-setup.md
    ├── kubernetes-setup.md
    ├── aws-deployment.md
    ├── environment-variables.md
    └── monitoring.md
```

---

## 7️⃣ GITHUB WORKFLOW STRUCTURE

```
.github/
│
├── workflows/
│   ├── backend-ci.yml
│   ├── web-app-ci.yml
│   ├── mobile-student-build.yml        # ⭐ Student app build
│   ├── mobile-faculty-build.yml        # ⭐ Faculty app build
│   ├── deploy-staging.yml
│   ├── deploy-production.yml
│   └── code-quality.yml
│
└── ISSUE_TEMPLATE/
    ├── bug_report.md
    ├── feature_request.md
    └── mobile_issue.md
```

---

## 8️⃣ ROOT DIRECTORY

```
educational-erp/
│
├── backend/                    # Node.js API (Multi-Tenant)
├── web-app/                    # React (All Admins)
├── mobile-app-student/         # React Native (Students Only)
├── mobile-app-faculty/         # React Native (Faculty Only)
├── shared/                     # Shared Types & Utils
├── docs/                       # Documentation
├── .github/                    # CI/CD
├── .gitignore
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── docker-compose.yml          # Local dev
├── docker-compose.prod.yml     # Production
└── package.json                # Root monorepo (optional)
```

---

## 🚀 QUICK START

```bash
# Clone
git clone <repo>
cd educational-erp

# Backend
cd backend && npm install && npm start

# Web App (new terminal)
cd web-app && npm install && npm start

# Student Mobile App (new terminal)
cd mobile-app-student && npm install && npm start

# Faculty Mobile App (new terminal)
cd mobile-app-faculty && npm install && npm start

# Docker (single command)
docker-compose up
```

---

## ✅ KEY DIFFERENCES: STUDENT vs FACULTY APP

| Feature | Student App | Faculty App |
|---------|------------|-----------|
| **Users** | Students only | Teachers/Faculty only |
| **Navigation** | Dashboard, Attendance, Marks, Fees, Profile | Dashboard, Classes, Attendance, Marks, Homework, Leave, Profile |
| **Offline** | Read-only | ✅ Full offline (mark attendance, enter marks) |
| **Permissions** | Read-only (view own data) | Write (enter data) |
| **Data Scope** | Own records only | Own classes only |
| **Key Features** | View grades, Track attendance, Pay fees | Mark attendance, Enter marks, Assign homework |
| **Sync** | Auto-sync all data | Smart sync with conflict resolution |
| **Push Notifications** | Announcements, Results | Task reminders, Submissions alerts |

---

**Ready to code?** 🎯
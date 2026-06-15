# IDPS Management ERP (React Native)

Single unified app for **all staff designations** — Teacher, Principal, Academic Director, Manager, and more. One login screen, one server — each user sees their own screens based on email/password.

## Run once for everyone

```bash
cd idps-teacher-erp
npm install
npm start
```

Press **`w`** for web or scan QR with Expo Go SDK 54.

## Architecture

```
src/
├── designations/              # Role-specific modules (one folder per designation)
│   ├── faculty/               # Teacher, Principal, Coordinator, Admin, Manager
│   ├── academic-director/     # Academic Director screens & navigation
│   ├── academic-manager/      # Academic Administration Manager screens
│   └── registry.ts            # Maps designation → navigator
├── screens/                   # Faculty designation screens
├── navigation/                # Auth + role-routing root navigator
├── config/roleConfig.ts       # Per-role tabs, menus, profile
├── services/api/              # Shared mock auth (multi-user)
└── store/                     # Shared auth store
```

After login, `RootNavigator` reads `user.designation` and loads the correct module:

- **Faculty roles** → `FacultyRootNavigator` (existing teacher portal)
- **Academic Director** → `AcademicDirectorNavigator` (10 Stitch screens)
- **Academic Administration Manager** → `AcademicManagerNavigator` (10 Stitch screens)

## Mock login (same screen, same OTP flow)

Password for all: `password` · OTP: any 6 digits

| Designation | Email |
|-------------|-------|
| Teacher | `sarah.teacher@idps.edu` |
| Principal | `principal@idps.edu` |
| Vice Principal | `vice.principal@idps.edu` |
| Academic Coordinator | `coordinator@idps.edu` |
| Administrator | `admin@idps.edu` |
| Manager | `manager@idps.edu` |
| Academic Director | `academic.director@idps.edu` |
| Academic Administration Manager | `academic.manager@idps.edu` |

## Adding a new designation

1. Create `src/designations/<role-name>/` with screens + navigator
2. Add role to `StaffRole` in `src/types/index.ts`
3. Add mock user in `src/services/api/mockData.ts`
4. Register in `src/designations/registry.ts` and `RootNavigator.tsx`

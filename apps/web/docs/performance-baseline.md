# Performance Baseline (2026-07-18)

Captured before Web Performance Program implementation.

## Inventory
| Metric | Value |
|--------|-------|
| `page.tsx` routes | 312 |
| `route.ts` API handlers | 57 |
| TSX files | 510 |
| `"use client"` TSX | 334 |
| `idps-logo.png` | 171 KB |
| `cbse-logo.png` | 344 KB |

## Production evidence (Vercel, 7d)
Statement timeouts via `portalMobileData` → session resolve:
- `/api/portal/student/content` — 19
- `/api/portal/student/attendance` — 10
- `/api/portal/student/fees` — 7
- `/api/portal/student/dashboard` — 5
- `/api/portal/student/profile` — 3

Root cause: `resolveStudentSessionContext` full-scans `students` + all `__student_profile__:*` notices per request.

## Known gaps
- 39/40 `/api/admin/*` routes unauthenticated + service role
- Empty `next.config.mjs` (no images, no cacheComponents)
- Eager `xlsx`/`jspdf` in ExportButton (~50 consumers)
- Process-local `serverQueryCache` (not shared across isolates)
- 0 school-route `loading.tsx` / `error.tsx`
- 0 `next/image` usage

# ERP SYSTEM — Educational Management App

Production-ready React Native (Expo) school ERP mobile app for IDPS students.

## Tech Stack

- React Native + TypeScript
- Expo Router (file-based navigation)
- TanStack Query (server state)
- Zustand (client state)
- React Hook Form + Zod (forms)
- Axios (API layer with mock fallback)
- Expo Secure Store + AsyncStorage (auth/session)
- React Native Reanimated, Chart Kit, Document Picker, Print, Sharing

## Getting Started

```bash
cd erp-school-app
npm install
npm start
```

This project targets **Expo SDK 54** and **Expo Go 54.0.8**. Use the matching Expo Go build on your device.

Press `a` for Android, `i` for iOS simulator, or scan QR with Expo Go.

## Demo Login

| Field    | Value            |
|----------|------------------|
| Email    | `user@school.com` |
| Password | `password123`    |
| OTP      | `483920`           |

## Project Structure

```
src/
├── app/           # Expo Router screens
├── components/    # UI, cards, charts, navigation
├── services/      # API, auth, websocket mock
├── store/         # Zustand stores
├── hooks/         # useApi, useTheme
├── constants/     # Theme, config
├── types/         # TypeScript interfaces
└── utils/         # Validation, PDF receipt
```

## Features

- **Auth**: Splash → Login → Forgot Password → OTP → Reset Password (JWT + refresh tokens)
- **Dashboard**: Overview cards, GPA, fees, announcements
- **Tabs**: Home, Marks, Attendance, Fees, Profile (matches Stitch UI)
- **Modules**: Attendance, Marks, Assignments (file upload), Exams, Timetable, Fees (payment flow + PDF receipt), Messages (mock WebSocket chat), Notifications, Settings (dark mode)

## API Configuration

Set `EXPO_PUBLIC_API_URL` to your backend. Mock API is enabled by default in `src/services/api/index.ts`.

## Design

UI follows `stitch_splash_screen` HTML designs:

- Primary: `#0fbd83`
- Background: `#f6f8f7` / `#10221c` (dark)
- Font: Lexend

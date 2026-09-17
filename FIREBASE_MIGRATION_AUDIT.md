# CAMPUSCODE — FIREBASE MIGRATION AUDIT

This document provides a comprehensive, production-grade audit of the current **CampusCode** repository prior to executing the architecture repair and single-source-of-truth Firebase migration.

---

## 1. Executive Summary & Audit Overview

* **Repository Target**: CampusCode — Sarhad College Portal (`campus-code-7dbb5`)
* **Migration Goal**: Replace competing database backends (Prisma, PostgreSQL, Supabase, SQLite, custom JWT, runtime fallback arrays) with **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage** as the single authoritative production backend.
* **Preservation Directives**:
  - UI visual layout, components, and user workflows are preserved.
  - Judge0 CE engine execution and multi-language support (C, C++, Java, Python, JS, Go, Rust, Kotlin, SQL) remain strictly intact.
  - Gemini AI / Ido AI assistant logic remains intact with server-side API key protection.
  - Authoritative dataset (137 problems: 50 published, 87 archived) and user/XP/submission history must be preserved and migrated without truncation or dummy overwrites.

---

## 2. Component-by-Component Audit

### 2.1 Current Authentication
* **Implementation**: Dual-mode legacy system. Uses client/server custom JWT generation (`src/lib/auth.ts` via `jsonwebtoken`) alongside initial Firebase Client Auth setup (`src/lib/firebase/client.ts`).
* **Issues / Risk Points**:
  - Custom JWT tokens stored in `localStorage` and cookies (`token`).
  - Auth routes (`/api/auth`) allow lookup via unverified `userId` query/body parameters.
  - Legacy OTP flow in `AuthModal.tsx` contains static fallback code.
* **Required Target**:
  - Exclusive use of Firebase Auth Client SDK (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`, `sendPasswordResetEmail`).
  - Server-side verification using Firebase Admin SDK `adminAuth.verifyIdToken(idToken)`.
  - Authoritative identity strictly derived from `request.auth.uid`.

### 2.2 Current Database Layer & Competing Backends
* **PostgreSQL / Supabase**: `.env.local` contains Supabase PostgreSQL connection strings (`DATABASE_URL`, `DIRECT_URL`) and `DATA_BACKEND` flags.
* **Prisma ORM**: `src/lib/prisma.ts` instantiates Prisma Client targeting Supabase/SQLite (`prisma/dev.db`, `prisma/schema.prisma`).
* **Firestore Service**: `src/lib/firebase/store.ts` implements `FirebaseStoreService` but includes `if (process.env.DATA_BACKEND === "postgres")` checks and local JSON fallback readers.
* **Required Target**:
  - Remove all conditional `DATA_BACKEND === "postgres"` branches across API routes.
  - Make Cloud Firestore (`adminDb` and client Firestore) the single source of truth.

### 2.3 Current Seed & Runtime Fallback Logic
* **Identified Fallbacks**:
  - `SEED_USERS` in `src/lib/firebase/store.ts` (5 seed accounts).
  - `SEED_CLASSROOMS` in `src/lib/firebase/store.ts` (6 classroom objects).
  - `prisma/canonical_50_pdf_dataset.json` read directly at runtime if Firestore query fails.
  - `prisma/ccps_problems.json` read directly at runtime for 87 archived problems.
  - Hardcoded batch fallbacks (`"TY BSc CS"`) across `Navbar.tsx`, `Sidebar.tsx`, `ClassroomsPage`, `DashboardPage`.
* **Required Target**:
  - Remove all runtime fallback JSON files and seed arrays from API execution paths.
  - Ensure API routes return proper HTTP 404 / 500 or clean empty arrays when Firestore collections are accessed.

### 2.4 Current Problem Dataset & Test Cases
* **Problem Dataset**:
  - **50 Published Problems**: Canonical coding problem set with titles, descriptions, constraints, examples, starter codes, and test cases.
  - **87 Archived Problems**: Stored problem records available to faculty/admins.
* **Test Case Security Audit**:
  - `src/app/api/problems/[id]/route.ts` filters out hidden test cases before returning to browser (`!tc.is_hidden`).
  - `src/lib/firebase/store.ts` supports `includeHidden: boolean` parameter in `getTestCases()`.
  - `POST /api/execute` fetches `includeHidden = true` exclusively on the server side to run Judge0 submissions.
* **Required Target**:
  - Verify that no API endpoint ever leaks `is_hidden: true` test cases or expected outputs to the client.

### 2.5 Current Submissions, XP & Streak Engine
* **Submissions**: `POST /api/execute` executes user code against test cases and records submissions.
* **Security Flaw**: `POST /api/execute` previously checked `let effectiveUserId = userId;` from the request body if token was missing.
* **XP Calculation**:
  - Standard problem completion awards XP based on difficulty.
  - First-solve protection is required so re-submitting an already accepted problem does not infinitely inflate user XP.
* **Streak Calculation**:
  - Implemented in `src/lib/streak.ts` using `Asia/Kolkata` IST timezone (`getISTDateStr()`).
  - Calculates daily consecutive activity based on first accepted submission per calendar day.

### 2.6 Current Leaderboard, Classrooms, Notes, Projects & Media
* **Leaderboard**: `src/app/api/leaderboard/route.ts` sorts students by XP. Excludes `TEACHER`, `FACULTY`, `ADMIN`, `SUPER_ADMIN`.
* **Classrooms**: `src/app/api/classrooms/route.ts` resolves student enrollment and teacher assignments.
* **Notes & Projects**: `src/app/api/notes/route.ts` and `src/app/api/projects/route.ts` manage note uploads and project showcases.
* **Feed & Messages**: `src/app/api/feed/route.ts` and `src/app/api/messages/route.ts` handle social posts and peer messaging.

### 2.7 Current Ido AI Assistant
* **Implementation**: `src/app/api/ai-assistant/route.ts` and `src/lib/ai/campus-tools.ts` powered by Google Gemini API (`GEMINI_API_KEY`).
* **Security Audit**: API keys are strictly configured server-side. Assistant context includes public problem details but must never inspect hidden test outputs or private user messages.

### 2.8 Current Judge0 Execution Flow
* **File**: `src/lib/code-runner.ts`
* **Flow**:
  1. Client sends code submission request to `/api/execute`.
  2. Server verifies caller identity via Firebase Auth token.
  3. Server retrieves problem and full test cases (including hidden tests) from Firestore.
  4. Server generates bracket/quote-aware language wrapper (C, C++, Java 17, Python 3, JS, Go, Rust, Kotlin).
  5. Server posts payload to Judge0 CE API.
  6. Server evaluates execution results, updates user XP / Streak via transaction, stores submission document in `submissions` collection, and returns output logs & public test results to client.

---

## 3. Mandatory Remediation Checklist

1. Update `.env.local` to point directly to Firebase project `campus-code-7dbb5`.
2. Remove custom JWT verification and enforce `adminAuth.verifyIdToken()` across all `/api/*` endpoints.
3. Remove all conditional Prisma / PostgreSQL / local JSON fallback branches from `store.ts` and API routes.
4. Verify all 137 problems (50 published, 87 archived) exist in Cloud Firestore `problems` and `testCases` collections.
5. Ensure `users/{firebaseUid}` is the canonical user schema in Firestore.
6. Deploy and enforce production `firestore.rules`.
7. Execute automated TypeScript type checks (`npx tsc --noEmit`) and production build (`npm run build`).

# CivicSpark Missions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a competition-ready teacher-to-student civic mission workflow that produces measurable learning and a reviewed congressional letter packet.

**Architecture:** Keep the existing Next.js App Router application and add a server-only mission data layer backed by Supabase. Teacher identity comes from Supabase magic-link auth; student sessions use mission-scoped opaque tokens. Mission content is frozen after source-grounded generation so delivery is reliable without live upstream dependencies.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Postgres/Auth, Zod, Groq, Congress.gov API, Vitest, Playwright, PDFKit.

---

### Task 1: Mission domain and deterministic demo repository

**Files:**
- Create: `src/features/missions/types.ts`
- Create: `src/features/missions/schemas.ts`
- Create: `src/features/missions/demo-data.ts`
- Create: `src/features/missions/repository.ts`
- Test: `src/features/missions/schemas.test.ts`

- [ ] Define source, evidence, question, mission, participant, response, metrics, and review-state types.
- [ ] Add Zod schemas for join codes, pseudonyms, mission creation, autosave, submission, and teacher review.
- [ ] Add one fully cited sample mission and a repository interface with an in-memory/local demo implementation so the complete flow works before hosted credentials exist.
- [ ] Write and run schema and metric tests with `npm test`.
- [ ] Commit with `feat: add missions domain model`.

### Task 2: Supabase persistence and authorization

**Files:**
- Create: `supabase/migrations/202609130001_missions.sql`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/features/missions/supabase-repository.ts`
- Modify: `.env.example`

- [ ] Create tables for missions, mission content, participants, responses, and frozen sources, including uniqueness, status, timestamp, and foreign-key constraints.
- [ ] Add RLS policies so teachers see only owned missions and service-side participant operations are scoped by mission and token hash.
- [ ] Add server/client Supabase factories using the current asynchronous Next.js cookie API.
- [ ] Implement the repository interface and select Supabase only when required environment variables are configured.
- [ ] Verify migration syntax locally and commit with `feat: persist classroom missions`.

### Task 3: Source-grounded mission generation

**Files:**
- Create: `src/features/missions/sources.ts`
- Create: `src/features/missions/generate.ts`
- Create: `src/features/missions/citations.ts`
- Create: `src/app/api/missions/generate/route.ts`
- Test: `src/features/missions/citations.test.ts`

- [ ] Fetch and normalize bill metadata, actions, CRS summaries, and available official text into frozen source records.
- [ ] Generate structured evidence cards and questions once per mission using the existing Groq client.
- [ ] Validate every source ID, reject unsupported factual content, and retain teacher inputs after failure.
- [ ] Add validated, rate-limited generation API responses with stable error codes.
- [ ] Test valid, missing, unknown, and empty citations; commit with `feat: generate cited civic missions`.

### Task 4: Teacher creation and publishing

**Files:**
- Create: `src/app/teacher/page.tsx`
- Create: `src/app/teacher/missions/new/page.tsx`
- Create: `src/app/teacher/missions/[id]/page.tsx`
- Create: `src/features/missions/components/MissionEditor.tsx`

- [ ] Add magic-link sign-in and a demo-teacher fallback clearly labeled for local judging previews.
- [ ] Build bill selection, grade-band/objective inputs, generation/retry, evidence editing, preview, and publish controls.
- [ ] Prevent publication when factual cards or questions lack valid official citations.
- [ ] Show the six-character join code and copyable student URL.
- [ ] Verify keyboard/mobile behavior and commit with `feat: add teacher mission builder`.

### Task 5: Seven-chapter student runner

**Files:**
- Create: `src/app/mission/[code]/page.tsx`
- Create: `src/features/missions/components/MissionRunner.tsx`
- Create: `src/features/missions/components/MissionProgress.tsx`
- Create: `src/features/missions/components/EvidenceDeck.tsx`
- Create: `src/features/missions/components/KnowledgeCheck.tsx`

- [ ] Implement code validation and pseudonymous joining.
- [ ] Implement all seven chapters with one primary action, source drawers, argument weighing, explanatory quiz feedback, and structured reflection.
- [ ] Autosave after each chapter, persist the opaque participant token locally, and restore unfinished sessions after refresh.
- [ ] Add explicit offline/retry states and reduced-motion-safe transitions.
- [ ] Add Playwright coverage for join through submission and commit with `feat: add interactive student missions`.

### Task 6: Safe letter composition and review

**Files:**
- Create: `src/features/missions/letters.ts`
- Create: `src/app/api/missions/letter/route.ts`
- Create: `src/features/missions/components/LetterReviewQueue.tsx`
- Test: `src/features/missions/letters.test.ts`

- [ ] Compose letters only from selected cited facts and student-authored reflection fields.
- [ ] Detect and reject factual sentences that cannot be attributed to either input class.
- [ ] Add teacher approve, return-with-feedback, and exclude actions.
- [ ] Test invented claims, empty reflection, returned letters, and status transitions.
- [ ] Commit with `feat: add reviewed student letters`.

### Task 7: Metrics and PDF packet

**Files:**
- Create: `src/features/missions/metrics.ts`
- Create: `src/features/missions/pdf.ts`
- Create: `src/app/api/missions/[id]/export/route.ts`
- Create: `src/features/missions/components/MissionDashboard.tsx`
- Test: `src/features/missions/metrics.test.ts`

- [ ] Calculate completion, average pre/post knowledge, confidence shift, anonymous opinion distribution, common themes, and review totals.
- [ ] Render the dashboard without exposing participant tokens or personal data.
- [ ] Generate a paginated PDF containing a cover sheet, recipient, mission context, and approved letters only.
- [ ] Test empty, one-letter, and multi-page exports; commit with `feat: add mission outcomes and packet export`.

### Task 8: Homepage and navigation repositioning

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/app/globals.css`

- [ ] Replace the homepage with the join/create promise, sample mission, pilot evidence area, and secondary Explore Congress link.
- [ ] Update navigation around Missions, Teach, and Explore while preserving bill and representative routes.
- [ ] Add reusable ink/paper/spark tokens, editorial layouts, focus states, reduced-motion behavior, and 375px breakpoints.
- [ ] Verify meaningful content remains visible with animation disabled; commit with `feat: reposition CivicSpark around missions`.

### Task 9: Full-story verification and submission assets

**Files:**
- Create: `tests/missions.spec.ts`
- Modify: `scripts/verify-demo.mjs`
- Modify: `DEMO_SCRIPT.md`
- Modify: `CAC_APPLICATION.md`

- [ ] Test teacher creation, publication, student completion, review, metrics, closing, and export end to end.
- [ ] Verify invalid and closed codes, duplicate joins, refresh recovery, upstream failures, and 30 concurrent saves.
- [ ] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and Playwright at mobile and desktop widths.
- [ ] Update the application narrative and three-minute demonstration script with verified pilot results only.
- [ ] Commit with `test: verify CivicSpark Missions submission flow`.

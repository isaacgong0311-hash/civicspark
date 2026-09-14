# CivicSpark Missions

CivicSpark is a classroom civic-learning platform. Students move through one sourced mission about a real bill, test their understanding, form a position, and submit a personal letter. Teachers review the letters, study anonymous learning metrics, and export approved work as a congressional packet.

The existing bill and representative tools remain available under **Explore Congress**, but missions are the primary product.

## Try the demo

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then use join code **SPARK6**. The teacher preview is at `/teacher` when Supabase is not configured.

## Environment

Copy `.env.example` to `.env.local` and add the services you want to use:

- `CONGRESS_API_KEY` — official bill ingestion
- `GROQ_API_KEY` — one-time structured mission generation
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only; never expose this in client code

Without Supabase credentials, the app intentionally runs as a local competition demo using frozen official-source content and browser persistence.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202609130001_missions.sql` in the SQL editor or with the Supabase CLI.
3. Add the three Supabase values to `.env.local`.
4. In Supabase Auth, add `http://localhost:3000/auth/confirm` and the production equivalent as redirect URLs.

The migration enables row-level security on every mission table. Teachers can query only missions they own; participant and response rows are intentionally server-mediated through hashed mission-scoped tokens.

## Quality checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Key implementation areas

- `src/app/mission/[code]` — seven-chapter student experience
- `src/app/teacher` — mission dashboard, review queue, and metrics
- `src/features/missions` — schemas, source validation, generation, metrics, and local resume
- `src/app/api/missions` — generation and PDF export boundaries
- `supabase/migrations` — schema, privacy constraints, indexes, and RLS policies
- `docs/superpowers/specs` and `docs/superpowers/plans` — product design and implementation plan

## Privacy boundary

Students use a mission code and nickname, not an account. CivicSpark does not request or store student email, ZIP code, address, school name, or political-party information. Position is never scored; only completion and source-based understanding are measured.

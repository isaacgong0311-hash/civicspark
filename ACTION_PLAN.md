# CivicSpark — Final Push Action Plan

Last research pass: 2026-08-30. This is organized around how CAC judges actually score submissions (1–5 on each of three criteria), plus a submission-logistics track that's just as decisive as the code.

**CAC judging criteria** (per official rubric): **(1) Quality/Creativity of the Idea, (2) Design/Implementation & UX, (3) Coding & Programming Skills** — each scored 1-5.
Sources: [CAC Judging Rubric](https://www.congressionalappchallenge.us/wp-content/uploads/2018/10/CAC_Rubric_2018.pdf), [2026 CAC Rules](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)

---

## MOST CRITICAL FIX: every AI feature was silently broken (dead model ID)

While doing a final devtools click-through, server logs revealed `Groq chatJSON failed: 404 {"error":{"message":"The model \`llama-3.3-70b-versatile\` does not exist or you do not have access to it."...}}` on *every single AI call* — summarize, pros/cons, pass-likelihood, letter, script, ask. Groq had retired that model ID from their catalog (confirmed via `GET https://api.groq.com/openai/v1/models` — it's not in the list). Because `src/lib/ai.ts` catches the error and returns the neutral `fallback*()` text, the app never crashed or showed an error — it just silently served generic placeholder content ("Addresses a recognized policy need related to this issue area," etc.) for the entire AI feature set, all session, for every bill. **This is the single most damaging bug possible for this submission**: the AI features are the app's core differentiator and exactly what a judge would evaluate first, and they were completely non-functional while *looking* functional.

**Fixed**: switched the default model (`src/lib/ai.ts:4`) to `openai/gpt-oss-120b`, currently the largest general-purpose chat model on Groq's catalog (verified live via the models endpoint), confirmed to support `response_format: json_object` correctly. Also bumped every `max_tokens` budget up (summarize 800→1100, pros/cons 700→1000, likelihood 300→400→ kept at 400, letter 700→900, call script 500→650, ask 500→650) after discovering gpt-oss-120b spends some of its token budget on internal reasoning tokens (visible in the API response as a separate `reasoning` field) *before* the JSON content, which was tight enough at the old budgets to occasionally trigger `json_validate_failed: max completion tokens reached before generating a valid document`. Updated the "Llama 3.3-70B" branding to "GPT-OSS-120B" everywhere it's mentioned in user-facing copy (`src/app/page.tsx`, `src/app/how-it-works/page.tsx`) and in `CAC_APPLICATION.md`/`DEMO_SCRIPT.md`. Verified live: re-opened a bill drawer post-fix and confirmed the summary/likelihood/pros-cons text is now genuinely bill-specific (e.g. correctly explained that HRES 1498, a simple House resolution, "never requires Senate approval or presidential signature" — a fact the old fallback text could never have produced) with zero Groq errors in the following requests. `npx tsc --noEmit` clean. No `GROQ_MODEL` env override exists on Vercel (`vercel env ls` confirms only `GOOGLE_CIVIC_API_KEY`, `CONGRESS_API_KEY`, `GROQ_API_KEY` are set), so production will pick up the new default on next deploy.

**Action required before submission: redeploy to production.** This fix has only been verified against the local dev server so far.

---

## Critical fix found during mobile QA: ZIP lookup silently defaulted to Texas

While QA'ing `/representatives` at 375px, found that `lookupByZip` in `src/lib/representatives.ts` only had curated House-district data for 10 ZIP3 prefixes; every other ZIP (i.e. the vast majority of the US, including e.g. 94102/San Francisco) silently fell back to `FALLBACK.state = "TX"` and displayed Chip Roy + Ted Cruz labeled "Live from Congress.gov" — confidently wrong data for the app's core "ZIP → your reps" flow, exactly the thing a judge would try first. **Fixed**: added `geocodeZipToState()` using the free, keyless `zippopotam.us` API to resolve the real state for any ZIP not in the curated table; senators are then fetched live from Congress.gov for the correct state, and the House rep is only shown when we have real curated district data (rather than fabricating one for a district we don't actually know). Verified both paths: curated ZIP (78701 → TX, Chip Roy) and geocoded ZIP (94102 → CA, Schiff/Padilla) now resolve correctly. `npx tsc --noEmit` clean.

---

## Correcting one false alarm first

An earlier automated audit flagged "API keys committed to git" as critical. **I verified this is false**: `.env.local` is gitignored, was never committed (`git log --all -- .env.local` returns nothing), and no key value appears in any client bundle or `NEXT_PUBLIC_*` variable. No key rotation needed. Don't waste time on it.

---

## P0 — Reliability (fix before anything else; these are the failure modes that would embarrass you live in front of judges)

1. **Fetch timeouts on all client → API calls.** `src/app/bills/page.tsx` fires ~6 fetches per drawer open (summarize, likelihood, proscons, bill-vote, ask, letter/script) with no `AbortController`. If Groq or Congress.gov hangs, the spinner spins forever with no recovery. Add a shared `fetchJSON(url, opts, timeoutMs=15000)` helper in `src/lib/` and use it everywhere.
2. **Rate-limit the 6 AI endpoints** (`/api/summarize`, `/api/likelihood`, `/api/proscons`, `/api/letter`, `/api/script`, `/api/ask`). Right now anyone (or a curious judge poking at devtools) can hammer these and burn your Groq quota mid-demo-window. A simple in-memory per-IP token bucket (10 req/min) is enough — no need for Redis/Vercel KV for a judged demo period.
3. **Log errors server-side.** `src/lib/ai.ts` and `src/lib/congress.ts` swallow fetch/API failures into `null`/`[]` with no `console.error`. If something breaks during judging, you'll have zero signal in Vercel logs to debug from. Add `console.error` at every catch site.
4. **Bump Groq timeout/retries.** `src/lib/ai.ts` uses a 9s timeout with `maxRetries: 1`. Under real network variance this produces avoidable failed generations. Move to 15–20s / 2 retries.
5. **Fix the bill-URL fallback.** `src/lib/congress.ts:214` falls back to the generic `congress.gov` homepage instead of constructing `https://www.congress.gov/bill/{congress}/{type}/{number}` when the API's own URL field is malformed. A judge clicking through to "see the real bill" should never land on a homepage.
6. **Show when you're on fallback/mock data.** `src/lib/congress.ts` silently swaps in `MOCK_BILLS` if Congress.gov is unreachable. There's a `live` flag already returned but no UI treatment — add a small "showing cached example data" banner so it never *looks* broken or dishonest if the live API hiccups during judging.

## P1 — Design/Implementation & UX polish (this is a full rubric category — worth real point value)

7. **Accessibility pass on the action drawer** (biggest single UX component, `src/app/bills/page.tsx`):
   - Focus trap when the drawer opens (keyboard/screen-reader users currently can tab out to the page behind it)
   - `aria-live="polite"` announcement when switching Overview/Perspectives/Ask/Act tabs
   - Bill cards should be real `<button>`/`role="button"` with `tabIndex` + Enter/Space handling, not just an `onClick` on a `motion.div`
   - Visible focus rings on all interactive elements (currently relies on browser default, easy to lose with the custom styling)
8. **Mobile QA pass at 375px** (iPhone SE) on every page including the new `/my-bills` — the drawer, tab labels ("Take Action" may wrap), and the roll-call vote panel haven't been explicitly verified at the smallest common breakpoint.
9. **Representative photos → `next/image`.** `src/app/representatives/page.tsx` uses raw `<img>` — swap to Next's `Image` for lazy loading and layout stability. Small change, visible polish.
10. **Sponsor-name fallback.** `src/lib/congress.ts` can produce `sponsorName: undefined`, which currently renders as literal "Sponsored by undefined" in some card states. One-line guard.
11. **OG image + robots.txt + sitemap.xml.** `public/cover.jpg` already exists but isn't wired into `openGraph.images` in `src/app/layout.tsx` — so if a judge shares the link, no preview image shows. Add these three things; 15 minutes of work, real payoff if the link gets shared.

## P2 — Coding & Programming Skills signal (judges may open the GitHub repo — code they see matters)

12b. **`react-hooks/set-state-in-effect` lint errors (9, pre-existing, confirmed via `git stash`).** `npm run lint` fails with 9 errors across `bills/page.tsx`, `my-bills/page.tsx`, `representatives/page.tsx` — a stricter rule bundled with this Next.js version's eslint-config flags synchronous `setState()` calls inside effect bodies (sessionStorage restores, reset-on-bill-change, loading-flag sets before an async call). Not a regression from the P0 fetch-wiring work — `npm run build` compiles with zero TypeScript errors either way, so it's not a deploy blocker. Worth cleaning up if time allows: lazy `useState(() => ...)` initializers instead of effect+setState for synchronous reads (sessionStorage restore, `speechSynthesis` support check); a `key={bill.id}` prop instead of a reset-effect for the Ask-tab state reset on bill switch.

12. **Split `src/app/bills/page.tsx` (now ~1,850 lines after the My Bills changes)** into components: `BillCard`, `ActionDrawer`, `LikelihoodMeter`, `ProsConsPanel`, `RepVotePanel`. A judge skimming the repo sees one unreadable mega-file right now, which undersells otherwise solid engineering.
13. **Extract the duplicated fetch/error pattern** (6+ near-identical `fetch → .json() → setState` blocks with no error path) into the same `fetchJSON` helper from P0.1 — kills two birds.
14. **Validate API route bodies with `zod`.** None of the 6 AI POST routes validate their incoming JSON shape today (e.g., `/api/ask` trusts `bill: Bill` from the client wholesale). Cheap to add, and it's a concrete "I thought about input validation" talking point for the written answers.
15. **Move duplicated local types** (`ActionTab`, `AskMsg`, `ContactTab` etc., currently redefined inline in `bills/page.tsx`) into `src/lib/types.ts` alongside everything else.

## P3 — Testing (highest leverage-per-hour if time remains)

16. **Turn `scripts/verify-demo.mjs` into a real Playwright test.** It already drives the exact critical path (ZIP → reps → bill drawer → AI tabs → letter generation) with Playwright — it just takes screenshots instead of asserting. Adding `expect(...)` calls on the key text/selectors turns an existing smoke script into actual test coverage with almost no new code. This is the single best ROI item on this list.
17. **Unit tests for the pure logic**: `inferStage`/`inferUrgency` (`src/lib/congress.ts`), `stageName` (`src/lib/stages.ts`), watchlist/impact helpers (`src/lib/activity.ts`). These are already pure functions — trivial to test, and "I wrote tests" is a direct, defensible answer to the programming-skills judging question.

---

## Submission logistics (separate from code, equally decisive)

- [ ] **Re-record the demo video** (`scripts/record-demo.mjs`) — the last recording (`public/demo/civicspark-demo.mp4`, June 10) predates the multilingual summaries, rep-vote accountability, listen-aloud, mission homepage, and the entire My Bills dashboard. The demo currently undersells the app. This is probably the single highest-impact remaining task.
- [ ] **Update `DEMO_SCRIPT.md`** to include the My Bills dashboard and civic-impact tracker — currently not mentioned in the script at all.
- [ ] **Update `CAC_APPLICATION.md`** the same way — it describes the app accurately as of the multilingual-summaries commit but doesn't mention My Bills/impact tracking, which is a genuinely good, judge-relevant feature (persistent tracking, honest per-browser stats instead of fabricated aggregate numbers).
- [ ] **Full click-through with devtools console open**, desktop + simulated mobile, watching for red errors — do this *after* the P0/P1 fixes land.
- [ ] **Confirm the production deploy matches what you're about to submit.** It already does as of this session (production is on `a0c785c`, local now matches) — just re-verify after your next push.
- [ ] **Proofread `CAC_APPLICATION.md` against the actual Submittable form's character limits** before pasting in final answers.

---

## Suggested order for this session

1. P0 items 1–6 (reliability) — do these first, they're what could visibly break during a live judge session
2. P1 items 7–11 (polish/accessibility) — highest visible-to-judges ROI per hour
3. Re-record the demo + update the two markdown docs — do this **last**, after the UI changes above, so the video/docs reflect the final state
4. P2/P3 if time remains — real but lower-visibility signal (judges *may* open the repo; they *will* watch the video)

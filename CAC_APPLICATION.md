# Congressional App Challenge — Submission Answers

**App name:** CivicSpark Missions
**Tagline:** Understand a real bill. Find your voice. Send Congress something worth reading.

> Draft copy. Replace bracketed pilot fields only after real data is collected, and trim to the official form limits.

## What does your app do?

CivicSpark turns a real bill into a teacher-guided civic mission. A student joins with a short code and nickname—no student account—then moves through seven focused chapters: a relatable scenario, an initial opinion, official-source evidence, multiple perspectives, a knowledge check, personal reflection, and a letter to Congress.

Every factual card and answer explanation links to a frozen official source. CivicSpark records how understanding and confidence change, but never rewards a political position. The student’s final letter can use only cited mission facts and the student’s own words.

Teachers choose a bill and learning objective, generate a sourced draft once, edit it before publishing, review or return submissions, see anonymous class-level outcomes, and export approved letters as a polished congressional packet. The older bill and representative tools remain available in a secondary Explore Congress area.

## Why did you build it?

Young people are often taught the structure of government without experiencing what civic participation feels like. A broad bill browser can provide information, but information alone does not help a classroom evaluate evidence, discuss tradeoffs, or communicate a reasoned view.

I built CivicSpark around a measurable transformation: a student begins with an instinct, checks it against primary sources, and ends with an informed message in their own voice. The teacher review step makes the action credible and safe while giving the class a real audience beyond a grade.

## What was technically challenging?

The hardest problem was making generated educational content trustworthy. CivicSpark first captures Congress.gov metadata, actions, summaries, and official text references. AI output must match a strict schema, and every evidence claim and quiz explanation must cite an ID from that captured source set. Output with missing or invented citations is rejected. The mission is generated once and frozen, so every student sees the same reviewed material even if an upstream service is temporarily unavailable.

Privacy required a second layer of engineering. Supabase row-level security isolates each teacher’s missions. Students receive mission-scoped sessions backed by hashed browser tokens, while sensitive service credentials remain server-only. The database schema deliberately has no fields for student email, address, ZIP code, or school.

The student experience also had to survive refreshes and weak connections. Responses autosave chapter by chapter, resume locally in the demo, and use idempotent server-oriented data shapes for production persistence.

## Languages, tools, and frameworks

- TypeScript in strict mode
- Next.js 16 App Router and React 19
- Supabase Postgres, Auth magic links, and row-level security
- Congress.gov official data and source links
- Groq structured generation with Zod validation
- PDFKit for congressional packet export
- Framer Motion as progressive enhancement
- Vitest for mission logic and citation tests
- Vercel for deployment

## What did you learn?

I learned that responsible AI is mostly system design around the model: constraining its inputs, validating its output, preserving provenance, and failing safely. I also learned to model privacy by asking what data the product does not need, rather than collecting everything and promising to protect it later.

Most importantly, I learned to define impact as a learning outcome. CivicSpark measures completion, knowledge, confidence change, and teacher-approved letters—not clicks, streaks, or agreement with a political viewpoint.

## What should judges know?

CivicSpark is nonpartisan by construction. Supporting, opposing, and factual material are labeled; all claims trace to official sources; teachers approve content before students see it; and student position is never part of a score.

The product has been built for a real classroom pilot. After the pilot, this answer will include only verified results: **[participants] students, [completion rate]% completion, [knowledge change]-point average knowledge change, and [approved letters] teacher-approved letters**, plus permissioned anonymous quotes.

## Short fields

- **One sentence:** CivicSpark guides students from official evidence about a real bill to a teacher-reviewed personal letter for Congress.
- **Primary language:** TypeScript
- **Platform:** Responsive web application
- **Demo join code:** SPARK6

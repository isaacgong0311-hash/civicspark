# CivicSpark Missions — Three-Minute Demo

Record one continuous student-to-teacher transformation. Use join code **SPARK6** and preflight the production build immediately before recording.

## 0:00–0:20 — The problem and promise

**On screen:** Homepage hero, then the sample mission.

**Say:**

> Students learn how Congress works, but rarely get to practice participating. CivicSpark turns one real bill into a guided journey: understand official evidence, decide what you think, and write something your representative can actually read.

## 0:20–1:35 — One student mission

**On screen:** Enter SPARK6 and a nickname. Move through the scenario, set an initial position and confidence, open evidence cards and their source links, weigh both perspectives, answer the knowledge check, and draft the letter.

**Say:**

> A student joins with a code and nickname—no account or personal address. First, CivicSpark records an initial view. Then the student investigates the Kids Off Social Media Act through evidence tied directly to Congress.gov. Facts are separated from supporting and opposing arguments, and every claim shows its source. The knowledge check explains each answer instead of just marking it wrong. Finally, the student reflects in their own words. CivicSpark organizes those answers into a letter, but it cannot invent an experience or introduce an uncited fact.

## 1:35–2:10 — Teacher outcomes

**On screen:** Open Teacher Studio. Show the anonymous metrics, review queue, feedback controls, approve a letter, and open the PDF export.

**Say:**

> The teacher sees learning, not ideology: completion, source-based knowledge, and confidence change. Submissions can be approved, returned with feedback, or excluded. Approved letters become a polished classroom packet addressed to the appropriate representative. Nothing is sent automatically.

## 2:10–2:40 — Technical depth

**On screen:** Brief diagram or code close-ups of ingestion, schema validation, citation rejection, frozen sources, and RLS.

**Say:**

> Behind the interface, CivicSpark captures official bill metadata, actions, summaries, and source references. AI generation is structured and citation-validated; a claim with an unknown source ID is rejected. Content is generated once, reviewed, and frozen so a class is not dependent on a live AI call. Supabase row-level security isolates teachers, while student sessions use hashed mission-scoped tokens. The schema never stores student emails, ZIP codes, addresses, or school names.

## 2:40–3:00 — Verified pilot close

**On screen:** Pilot result cards and one permissioned anonymous quote.

**Say after the pilot:**

> In our pilot, [participants] students completed a mission, with [completion rate] percent finishing and an average knowledge change of [knowledge change] points. The teacher approved [approved letters] letters. One student told us, “[short verified quote].” CivicSpark does not tell students what to think. It gives them the evidence and a real reason to think carefully.

## Recording checklist

- Replace every bracket only with verified pilot data.
- Keep official-source labels legible in the recording.
- Show at least one wrong quiz answer and its explanation.
- Use a real teacher-reviewed letter, with identifying details removed.
- Test at mobile width and desktop before recording.
- Do not claim letters were delivered; demonstrate the reviewed PDF packet.
- Finish under 3:00 and include an AI-use disclosure in the submission.

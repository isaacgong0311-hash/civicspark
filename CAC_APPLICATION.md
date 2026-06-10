# Congressional App Challenge — Submission Answers

**App name:** CivicSpark
**Live demo:** https://civicspark.vercel.app
**Tagline:** From ZIP code to constituent letter in under a minute — nonpartisan, AI-assisted civic engagement.

> These are drafts. The exact wording and character limits on the official Submittable form may differ slightly — paste these in and trim to fit. Each answer is written to map to the three CAC judging categories: (1) Understanding of Computer Programming Skills, (2) Quality of the Idea, and (3) Implementation of the Idea.

---

## 1. What does your app do? / Describe your app.

CivicSpark turns the intimidating process of engaging with Congress into something anyone can do in under a minute. You enter your ZIP code and the app identifies your House representative and two senators with live profile data — photo, party, and official contact info — pulled from the Congress.gov Members API.

From there you can browse real legislation, fetched in real time from the Congress.gov REST API and sorted by latest activity. For any bill, CivicSpark uses a large language model (Llama 3.3-70B served via Groq) to generate:

- a **plain-English summary** of what the bill actually does,
- an **AI pass-likelihood estimate** with a rationale, based on the bill's legislative stage, policy area, sponsor history, and cosponsor count,
- **three balanced arguments for and three against**, written to be strictly nonpartisan, and
- a **ready-to-send constituent letter or phone-call script** addressed to your specific representative, reflecting your stated position and an optional personal note.

You can also search the full text of legislation, star bills to a personal watchlist, and view each lawmaker's recently sponsored bills. Everything works without creating an account.

---

## 2. Why did you decide to create this app? / What problem does it solve?

Most people my age — and most adults — have never contacted an elected official. Pew Research finds only about a quarter of Americans have ever reached out to a representative. It's not because people don't care; it's because the process feels opaque. Bills are written in dense legislative language, it's hard to know who your representatives even are, and writing a letter to Congress feels like a formal task you need to be an expert to do.

I built CivicSpark to remove every one of those barriers. It tells you who represents you, translates legislation into language anyone can understand, shows balanced perspectives so you can make up your own mind, and then drafts the actual letter for you. The goal is to make the distance between "I have an opinion" and "my representative heard it" as short as possible — while staying rigorously nonpartisan so the tool informs rather than persuades.

---

## 3. What was the most challenging part of building your app? / What did you learn?

The hardest part was making AI output trustworthy and fast at the same time. Each bill needs several distinct AI generations — a summary, a pass-likelihood score, balanced pros and cons, and a personalized letter — and running them one after another felt slow. I learned to fire them in parallel using `Promise.allSettled`, so a slow or failed generation never blocks the others, and the page progressively fills in.

I also had to design the prompts carefully to keep the model genuinely nonpartisan: it always produces an equal number of arguments for and against, and the letter reflects the user's position rather than the model's. On the data side, integrating the live Congress.gov REST API meant handling rate limits, missing fields, and inconsistent formats, so I built graceful fallbacks and inference logic (for example, deducing a bill's legislative stage from its latest action). The biggest lesson was that a good AI feature is mostly engineering *around* the model — caching, parallelism, validation, and fallbacks — not just the prompt itself.

---

## 4. What programming languages, tools, and frameworks did you use?

- **TypeScript** (strict mode) as the primary language, end to end
- **Next.js 16** (App Router) with React 19 — server components, API routes, and the Turbopack bundler
- **Congress.gov REST API v3** for live bill data, member lookup, sponsored legislation, and full-text search
- **Groq inference API running Meta's Llama 3.3-70B** for all generative features
- **Framer Motion** for animations and transitions
- **Lucide React** for iconography
- **Vercel** for production deployment, edge CDN, and per-commit preview builds
- Browser **localStorage / sessionStorage** for the watchlist and saved representatives (no account or database required)

---

## 5. What new skills or concepts did you learn while building this?

- Designing **multi-call AI pipelines** that run in parallel and degrade gracefully when one call fails
- **Prompt engineering for neutrality** — forcing balanced, symmetric output rather than letting the model take a side
- Working with a real **government REST API**, including pagination, rate limiting, and normalizing messy real-world data
- Building a **fully responsive UI** with a mobile filter drawer, hamburger navigation, and layouts that adapt from desktop to phone
- **Server components and API routes** in the Next.js App Router, and deploying a full-stack TypeScript app to the edge on Vercel

---

## 6. Is there anything else you'd like the judges to know?

CivicSpark is intentionally **nonpartisan by design**, not just by disclaimer: every bill shows an equal number of arguments for and against, AI-drafted letters reflect *your* position rather than any viewpoint of mine, and there's no tracking, no account, and no political messaging anywhere in the app. It runs entirely on live, official data from Congress.gov, so what you see is what's actually happening in the 119th Congress right now. My hope is that a student, a first-time voter, or anyone who's never contacted Congress could open CivicSpark and feel, for the first time, that participating is genuinely within reach.

---

## Quick reference (for short-answer fields)

- **One-sentence description:** CivicSpark uses live Congress.gov data and AI to help anyone understand legislation and contact their representatives — nonpartisan, account-free, in under a minute.
- **Primary language:** TypeScript
- **Platform:** Web (responsive, works on desktop and mobile)
- **Live URL:** https://civicspark.vercel.app

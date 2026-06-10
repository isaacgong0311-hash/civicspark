# CivicSpark — Demo Video Script

**Target length:** ~2:00 (CAC allows up to 3 min — shorter and tighter scores better)
**Format:** Screen recording of `civicspark.vercel.app` with voiceover. Record at 1280×720 or 1080p.
**Tone:** Confident, conversational. Talk like you're showing a friend, not reading a paper.

> Each scene = what's ON SCREEN + what you SAY. Times are cumulative targets.

---

### Scene 1 — Hook + the problem  (0:00–0:20)
**On screen:** Start on the CivicSpark landing page (the hero). Slowly scroll past the civic-stats bar.

**Say:**
> "Only about one in four Americans has ever contacted their representative in Congress. It's not that people don't care — it's that following legislation is confusing, the bills are written in dense legal language, and most people don't even know who represents them. I built CivicSpark to fix that. It takes you from your ZIP code to a finished letter to Congress in under a minute."

---

### Scene 2 — Find your representatives  (0:20–0:40)
**On screen:** Go to the Representatives page. Type in a ZIP code. Show the rep cards loading with real photos, party, and contact info.

**Say:**
> "It starts with your ZIP code. CivicSpark queries the official Congress.gov API and pulls back your House representative and both of your senators — with live photos, party, and contact information. I can even expand a lawmaker to see the actual bills they've recently sponsored."

*(Click to expand one rep's recent legislation.)*

---

### Scene 3 — Explore real bills  (0:40–1:05)
**On screen:** Go to the Bills page. Show the list of live bills. Use a filter or the search bar to search a topic (e.g., "housing" or "veterans"). Click into one bill to open the detail drawer.

**Say:**
> "Here are real bills moving through the current Congress, pulled live and sorted by latest activity. I can search the full text of legislation, filter by policy area, and star bills to a watchlist. Let's open one up."

---

### Scene 4 — The AI features (the core)  (1:05–1:35)
**On screen:** In the bill drawer, show the AI sections rendering: plain-English summary, the pass-likelihood meter with its rationale, and the balanced pros and cons.

**Say:**
> "This is where it gets powerful. An AI model reads the bill and explains it in plain English — what it does and how it could actually affect you. It estimates how likely the bill is to become law, with a reason. And it lays out three arguments for and three against — completely balanced, so it informs you instead of telling you what to think."

---

### Scene 5 — Take action  (1:35–1:55)
**On screen:** Switch to the "Take Action" tab. Pick a position (Support / Oppose), type a short personal note, and click to generate. Show the AI-written constituent letter appear. Briefly show the call-script tab too. Hit copy.

**Say:**
> "Once you've made up your own mind, CivicSpark writes the letter for you. I pick a position, add a personal note, and it drafts a real constituent letter addressed to my specific representative — or a phone-call script if I'd rather call. One click to copy, and I'm ready to send."

---

### Scene 6 — Close + tech  (1:55–2:10)
**On screen:** Zoom back out to the landing page or the How It Works page showing the tech stack.

**Say:**
> "CivicSpark is built with Next.js, TypeScript, and React, on live data from the Congress.gov API, with AI powered by Llama running on Groq. It's nonpartisan by design, works on your phone, and needs no account. My goal was simple: make it so anyone — a student, a first-time voter, anyone — can feel like participating in democracy is actually within reach. Thanks for watching."

---

## Recording tips
- **Do a dry run first** so the AI sections are warm/cached — you don't want to narrate over a long spinner. If a generation is slow, you can lightly trim/cut in editing.
- **Pre-pick your examples:** decide the ZIP code and the exact bill you'll open before you hit record, so the demo is smooth.
- **Keep the cursor calm** — move deliberately, don't jitter. Pause ~1 second after each click so viewers can see the result.
- **Show, don't just tell:** every claim in the voiceover should have something happening on screen at that moment.
- **Audio matters more than video.** Record the voiceover in a quiet room; clean narration beats a fancy screen capture.
- **End under 3:00.** If you run long, cut Scene 2 or 3 down — never cut the AI demo (Scene 4) or the action step (Scene 5); those are the heart of the app.
- **Verify before final cut:** make sure no API errors or blank states appear on screen. If the live API hiccups, re-record that segment.

## Optional 60-second version (if a shorter cut is needed)
Hook (problem) → ZIP lookup → open a bill, show the plain-English summary + pros/cons → generate the letter → one closing line with the tech. Drop search, watchlist, and pass-likelihood to save time.

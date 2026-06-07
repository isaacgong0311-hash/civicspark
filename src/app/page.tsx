"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ArrowRight, Home as HomeIcon, Leaf, HeartPulse, GraduationCap,
  TrendingUp, Shield, Cpu, Award, Check, ChevronLeft,
  Landmark, FileText, ThumbsUp, ThumbsDown, Mail, Copy,
  ExternalLink, Loader2, Zap, Lock, Database, Phone,
  Share2, BookOpen, AlertCircle, Flame, Sparkles, Moon, Sun,
  BarChart2, Scale, X, Info,
} from "lucide-react";
import type { Bill, BillSummary, PassLikelihood, ProsCons, Representative } from "@/lib/types";
import { ISSUE_TOPICS } from "@/lib/issues";

/* ── Icon map ────────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  home: HomeIcon, leaf: Leaf, "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap, "trending-up": TrendingUp,
  shield: Shield, cpu: Cpu, award: Award,
};

/* ── Types ───────────────────────────────────────────────────────────────── */
type Step = "onboarding" | "issues" | "feed" | "action";
const STEPS: Step[] = ["onboarding", "issues", "feed", "action"];
const STEP_LABELS = ["Location", "Issues", "Bills", "Act"];

type ActionTab = "letter" | "call" | "share";
type InfoTab   = "overview" | "perspectives" | "act";

interface CivicScore { billsRead: number; lettersWritten: number; callsScripted: number; }

interface AppState {
  step: Step;
  zip: string; state: string; district: string;
  representatives: Representative[];
  selectedIssues: string[];
  bills: Bill[]; billsLive: boolean;
  selectedBill: Bill | null;
  summaries:    Record<string, BillSummary>;
  prosCons:     Record<string, ProsCons>;
  likelihoods:  Record<string, PassLikelihood>;
  loadingSummary: string | null;
  actionRep: Representative | null;
  actionPosition: "support" | "oppose";
  personalNote: string;
  infoTab: InfoTab; actionTab: ActionTab;
  generatedLetter: string; generatingLetter: boolean;
  generatedScript: string; generatingScript: boolean;
  copied: boolean; sharedBill: boolean;
  stageModal: number | null; // which stage index is open in explainer
  darkMode: boolean;
}

const INITIAL: AppState = {
  step: "onboarding", zip: "", state: "", district: "",
  representatives: [], selectedIssues: [], bills: [], billsLive: false,
  selectedBill: null, summaries: {}, prosCons: {}, likelihoods: {},
  loadingSummary: null, actionRep: null, actionPosition: "support", personalNote: "",
  infoTab: "overview", actionTab: "letter",
  generatedLetter: "", generatingLetter: false,
  generatedScript: "", generatingScript: false,
  copied: false, sharedBill: false,
  stageModal: null, darkMode: false,
};

/* ── Motion ──────────────────────────────────────────────────────────────── */
const slide = {
  initial: (d: number) => ({ opacity: 0, x: d * 36 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: "easeOut" as const } },
  exit:    (d: number) => ({ opacity: 0, x: d * -28, transition: { duration: 0.22 } }),
};
const stagger  = { animate: { transition: { staggerChildren: 0.055 } } };
const itemRise = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};

/* ── Stage explainer content ─────────────────────────────────────────────── */
const STAGE_INFO = [
  { label: "Introduced", short: "Intro",
    icon: FileText,
    what: "A member of Congress formally introduces the bill. It gets an official number (like HR 1234 or S 567).",
    next: "The bill is referred to a relevant committee for review.",
    stat: "Only ~10% of introduced bills ever become law." },
  { label: "In Committee", short: "Cmte",
    icon: Shield,
    what: "A specialized committee of legislators reviews, debates, and can amend the bill. This is where most bills stall.",
    next: "If the committee approves, the bill is reported to the full chamber.",
    stat: "About 85% of bills die in committee without a vote." },
  { label: "Floor Ready", short: "Floor",
    icon: BarChart2,
    what: "The bill is scheduled for debate and a vote by the full House or Senate. Amendments may be offered.",
    next: "Members vote on the bill. A majority is needed to pass.",
    stat: "Bills reaching the floor have roughly a 50% chance of passing." },
  { label: "Passed Chamber", short: "Passed",
    icon: ThumbsUp,
    what: "The bill has passed at least one chamber (House or Senate). It must also pass the other chamber.",
    next: "The other chamber reviews it. If both pass identical versions, it goes to the President.",
    stat: "Bills must pass both chambers before heading to the President." },
  { label: "Signed into Law", short: "Law",
    icon: Check,
    what: "The President signs the bill, and it officially becomes federal law — enforceable across the United States.",
    next: "Federal agencies implement and enforce the new law.",
    stat: "Fewer than 4% of introduced bills are signed into law." },
];

/* ── Urgency config ──────────────────────────────────────────────────────── */
function urgencyConfig(u?: string) {
  if (u === "urgent") return { label: "URGENT", Icon: Flame };
  if (u === "new")    return { label: "NEW",    Icon: Sparkles };
  return                     { label: "ACTIVE", Icon: AlertCircle };
}

/* ── Party color ─────────────────────────────────────────────────────────── */
function partyDot(party: string) {
  if (party === "R") return "#ef4444";
  if (party === "D") return "#3b82f6";
  return "#94a3b8";
}

/* ── Likelihood color ────────────────────────────────────────────────────── */
function likelihoodColor(pct: number) {
  if (pct >= 70) return { bar: "#15803d", bg: "#f0fdf4", text: "#15803d" };
  if (pct >= 45) return { bar: "#b8830e", bg: "#fdf3d7", text: "#b8830e" };
  if (pct >= 20) return { bar: "#c2410c", bg: "#fff7ed", text: "#c2410c" };
  return                { bar: "#b91c1c", bg: "#fef2f2", text: "#b91c1c" };
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [s, setS]             = useState<AppState>(INITIAL);
  const [zipInput, setZip]    = useState("");
  const [zipError, setErr]    = useState("");
  const [ldReps, setLdReps]   = useState(false);
  const [ldBills, setLdBills] = useState(false);
  const [dir, setDir]         = useState(1);
  const [score, setScore]     = useState<CivicScore>({ billsRead: 0, lettersWritten: 0, callsScripted: 0 });

  // Load dark mode + civic score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("civicspark_score");
      if (saved) setScore(JSON.parse(saved));
      const dm = localStorage.getItem("civicspark_dark") === "1";
      if (dm) { setS(p => ({ ...p, darkMode: true })); document.documentElement.classList.add("dark"); }
    } catch { /* ignore */ }
  }, []);

  function toggleDark() {
    const next = !s.darkMode;
    setS(p => ({ ...p, darkMode: next }));
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("civicspark_dark", next ? "1" : "0"); } catch { /* ignore */ }
  }

  function saveScore(update: { billsRead?: number; lettersWritten?: number; callsScripted?: number }) {
    setScore(prev => {
      const next = {
        billsRead:      prev.billsRead      + (update.billsRead      ?? 0),
        lettersWritten: prev.lettersWritten + (update.lettersWritten ?? 0),
        callsScripted:  prev.callsScripted  + (update.callsScripted  ?? 0),
      };
      try { localStorage.setItem("civicspark_score", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const patch = useCallback((u: Partial<AppState>) => setS(p => ({ ...p, ...u })), []);

  function goTo(next: Step) {
    setDir(STEPS.indexOf(next) > STEPS.indexOf(s.step) ? 1 : -1);
    patch({ step: next });
  }

  /* ── API calls ─────────────────────────────────────────────────────────── */
  async function handleZip(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zipInput.trim())) { setErr("Enter a valid 5-digit ZIP."); return; }
    setErr(""); setLdReps(true);
    try {
      const r = await fetch("/api/reps", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: zipInput.trim() }) });
      const d = await r.json();
      patch({ zip: zipInput.trim(), state: d.state, district: d.district, representatives: d.representatives });
      goTo("issues");
    } finally { setLdReps(false); }
  }

  function toggleIssue(id: string) {
    patch({ selectedIssues: s.selectedIssues.includes(id)
      ? s.selectedIssues.filter(i => i !== id)
      : [...s.selectedIssues, id] });
  }

  async function handleIssues() {
    if (!s.selectedIssues.length) return;
    setLdBills(true);
    try {
      const r = await fetch("/api/bills", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: s.selectedIssues }) });
      const d = await r.json();
      patch({ bills: d.bills, billsLive: d.live });
      goTo("feed");
    } finally { setLdBills(false); }
  }

  async function handleBill(bill: Bill) {
    patch({ selectedBill: bill, actionRep: s.representatives[0] ?? null,
      generatedLetter: "", generatedScript: "", infoTab: "overview", actionTab: "letter" });
    goTo("action");
    saveScore({ billsRead: 1 });

    const fetches: Promise<void>[] = [];

    // Summary
    if (!s.summaries[bill.id]) {
      patch({ loadingSummary: bill.id });
      fetches.push(
        fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bill, state: s.state, district: s.district }) })
          .then(r => r.json())
          .then(summary => setS(p => ({ ...p, summaries: { ...p.summaries, [bill.id]: summary }, loadingSummary: null })))
          .catch(() => patch({ loadingSummary: null }))
      );
    }

    // Pros/cons — fire in parallel
    if (!s.prosCons[bill.id]) {
      fetches.push(
        fetch("/api/proscons", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bill) })
          .then(r => r.json())
          .then(pc => setS(p => ({ ...p, prosCons: { ...p.prosCons, [bill.id]: pc } })))
          .catch(() => {})
      );
    }

    // Likelihood — fire in parallel
    if (!s.likelihoods[bill.id]) {
      fetches.push(
        fetch("/api/likelihood", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bill) })
          .then(r => r.json())
          .then(lk => setS(p => ({ ...p, likelihoods: { ...p.likelihoods, [bill.id]: lk } })))
          .catch(() => {})
      );
    }

    await Promise.allSettled(fetches);
  }

  async function handleLetter() {
    if (!s.selectedBill || !s.actionRep) return;
    patch({ generatingLetter: true, generatedLetter: "" });
    try {
      const r = await fetch("/api/letter", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: s.selectedBill, rep: s.actionRep,
          position: s.actionPosition, personalNote: s.personalNote }) });
      const d = await r.json();
      patch({ generatedLetter: d.letter });
      saveScore({ lettersWritten: 1 });
    } finally { patch({ generatingLetter: false }); }
  }

  async function handleScript() {
    if (!s.selectedBill || !s.actionRep) return;
    patch({ generatingScript: true, generatedScript: "" });
    try {
      const r = await fetch("/api/script", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: s.selectedBill, rep: s.actionRep,
          position: s.actionPosition, personalNote: s.personalNote }) });
      const d = await r.json();
      patch({ generatedScript: d.script });
      saveScore({ callsScripted: 1 });
    } finally { patch({ generatingScript: false }); }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    patch({ copied: true });
    setTimeout(() => patch({ copied: false }), 2200);
  }

  function handleShare() {
    if (!s.selectedBill) return;
    const bill = s.selectedBill;
    const sum  = s.summaries[bill.id];
    const text = `${bill.type} ${bill.number} — ${bill.title}\n\n` +
      (sum ? `${sum.plainEnglish}\n\n` : "") +
      `Learn more & take action: https://civicspark.vercel.app`;
    navigator.clipboard.writeText(text);
    patch({ sharedBill: true });
    setTimeout(() => patch({ sharedBill: false }), 2200);
  }

  const stepIdx = STEPS.indexOf(s.step);
  const totalActions = score.billsRead + score.lettersWritten + score.callsScripted;
  const dm = s.darkMode;

  // CSS variable shorthand helpers
  const bg       = "var(--bg)";
  const surface  = "var(--surface)";
  const surface2 = "var(--surface2)";
  const border   = "var(--border)";
  const border2  = "var(--border2)";
  const navy     = "var(--navy)";
  const navyMid  = "var(--navy-mid)";
  const navyLight= "var(--navy-light)";
  const gold     = "var(--gold)";
  const goldLt   = "var(--gold-light)";
  const goldBrd  = "var(--gold-border)";
  const muted    = "var(--muted)";
  const text     = "var(--text)";
  const text2    = "var(--text2)";

  const primaryBtn = {
    background: dm
      ? `linear-gradient(135deg, #1e4080, #2d5fa6)`
      : `linear-gradient(135deg, #0d1f3c, #1e4080)`,
    color: "white", border: "none",
    boxShadow: "0 2px 12px rgba(13,31,60,0.22)",
  } as const;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <main style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", padding: "44px 16px 64px", position: "relative", overflow: "hidden",
      transition: "background 0.3s" }}>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div className="orb-a" style={{ position: "absolute", top: -120, left: -120,
          width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, var(--orb-a) 0%, transparent 70%)` }} />
        <div className="orb-b" style={{ position: "absolute", bottom: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, var(--orb-b) 0%, transparent 70%)` }} />
      </div>

      <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div style={{ textAlign: "center", marginBottom: 32 }}
          initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8, position: "relative" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, #0d1f3c, #1e4080)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(13,31,60,0.25)" }}>
              <Landmark size={20} color="white" strokeWidth={1.8} />
            </div>
            <span className="text-gradient" style={{ fontFamily: "var(--font-playfair)",
              fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px" }}>
              CivicSpark
            </span>
            {/* Dark mode toggle */}
            <motion.button onClick={toggleDark}
              aria-label={dm ? "Switch to light mode" : "Switch to dark mode"}
              style={{ position: "absolute", right: 0, width: 34, height: 34, borderRadius: 99,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: surface, border: `1.5px solid ${border}`, cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {dm ? <Sun size={15} color={gold} strokeWidth={2} /> : <Moon size={15} color={muted} strokeWidth={2} />}
            </motion.button>
          </div>

          <p style={{ color: muted, fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            Understand legislation. Reach your representatives.{" "}
            <span style={{ color: navyMid, fontWeight: 600 }}>Your voice in Congress — made simple.</span>
          </p>
        </motion.div>

        {/* ── Civic score badge ────────────────────────────────────────────── */}
        <AnimatePresence>
          {totalActions > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
              <div role="status" aria-label="Your civic engagement record"
                style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "7px 16px",
                borderRadius: 99, background: surface, border: `1.5px solid ${goldBrd}`,
                boxShadow: "0 2px 8px rgba(184,131,14,0.10)" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: gold, letterSpacing: "0.07em" }}>
                  CIVIC RECORD
                </span>
                {[{ n: score.billsRead, label: "bills read" },
                  { n: score.lettersWritten, label: "letters" },
                  { n: score.callsScripted, label: "scripts" }].map(({ n, label }) => n > 0 && (
                  <span key={label} style={{ fontSize: 12, color: text, fontWeight: 600 }}>
                    <span style={{ color: navyMid }}>{n}</span> {label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Card ────────────────────────────────────────────────────────── */}
        <motion.div style={{ background: surface, borderRadius: 24, overflow: "hidden",
            border: `1px solid ${border}`,
            boxShadow: dm
              ? "0 1px 3px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.04), 0 16px 48px rgba(13,31,60,0.10)" }}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: "easeOut" }}>

          {/* Progress bar */}
          <div style={{ height: 3, background: border2 }}>
            <motion.div style={{ height: "100%",
                background: `linear-gradient(90deg, #0d1f3c, #1e4080, #b8830e)` }}
              initial={{ width: "0%" }}
              animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>

          {/* Step dots */}
          <div role="navigation" aria-label="Steps"
            style={{ padding: "18px 32px 0", display: "flex", alignItems: "center", gap: 4 }}>
            {STEPS.map((step, i) => {
              const active = step === s.step, done = i < stepIdx;
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <motion.div
                    role="img" aria-label={`Step ${i+1}: ${STEP_LABELS[i]}${done?" complete":active?" current":""}`}
                    style={{ width: 28, height: 28, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                      background: active ? `linear-gradient(135deg, #0d1f3c, #1e4080)`
                        : done ? "#b8830e" : border2,
                      color: active || done ? "white" : muted }}
                    animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}>
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </motion.div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? text : done ? gold : muted }}>
                    {STEP_LABELS[i]}
                  </span>
                  {i < 3 && <div style={{ width: 16, height: 1, margin: "0 4px",
                    background: i < stepIdx ? goldBrd : border }} />}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ padding: "22px 32px 32px", minHeight: 440 }}>
            <AnimatePresence mode="wait" custom={dir}>

              {/* ════ STEP 1: Onboarding ════════════════════════════════════ */}
              {s.step === "onboarding" && (
                <motion.form key="onboarding" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  onSubmit={handleZip}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 30,
                      fontWeight: 700, color: text, marginBottom: 8, lineHeight: 1.25 }}>
                      Who represents you?
                    </h2>
                    <p style={{ color: muted, fontSize: 14, lineHeight: 1.65 }}>
                      Enter your ZIP code to find your House representative and two Senators,
                      then explore legislation that directly affects your community.
                    </p>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none", color: zipError ? "#ef4444" : muted }}>
                      <MapPin size={18} strokeWidth={1.8} />
                    </div>
                    <input type="text" inputMode="numeric" maxLength={5}
                      placeholder="ZIP code — e.g. 78717"
                      aria-label="ZIP code" aria-describedby={zipError ? "zip-error" : undefined}
                      value={zipInput}
                      onChange={e => { setZip(e.target.value.replace(/\D/g, "")); setErr(""); }}
                      style={{ width: "100%", paddingLeft: 46, paddingRight: 16,
                        paddingTop: 14, paddingBottom: 14, fontSize: 16, borderRadius: 14,
                        outline: "none", fontFamily: "var(--font-dm-sans)",
                        border: `2px solid ${zipError ? "#fca5a5" : border}`,
                        background: surface2, color: text, transition: "border-color 0.2s" }}
                      onFocus={e => { if (!zipError) { e.target.style.borderColor = "#1e4080"; e.target.style.boxShadow = "0 0 0 3px rgba(30,64,128,0.08)"; }}}
                      onBlur={e => { e.target.style.borderColor = zipError ? "#fca5a5" : border; e.target.style.boxShadow = "none"; }} />
                    {zipError && (
                      <motion.p id="zip-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ color: "#ef4444", fontSize: 12, marginTop: 6, paddingLeft: 4 }}>
                        {zipError}
                      </motion.p>
                    )}
                  </div>
                  <motion.button type="submit" disabled={ldReps || zipInput.length < 5}
                    aria-busy={ldReps}
                    style={{ ...primaryBtn, padding: "15px 24px", borderRadius: 14, fontSize: 15,
                      fontWeight: 700, cursor: ldReps || zipInput.length < 5 ? "not-allowed" : "pointer",
                      opacity: ldReps || zipInput.length < 5 ? 0.55 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontFamily: "var(--font-dm-sans)" }}
                    whileHover={zipInput.length === 5 ? { scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" } : {}}
                    whileTap={{ scale: 0.98 }}>
                    {ldReps
                      ? <><Loader2 size={16} className="animate-spin" /> Looking up…</>
                      : <><span>Find My Representatives</span>
                          <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                            <ArrowRight size={16} strokeWidth={2.5} />
                          </motion.div></>}
                  </motion.button>
                  <div style={{ display: "flex", gap: 20, justifyContent: "center",
                    borderTop: `1px solid ${border}`, paddingTop: 20 }}>
                    {[{ Icon: Lock, label: "Private & secure" },
                      { Icon: Database, label: "Congress.gov data" },
                      { Icon: Zap, label: "AI-powered" }].map(({ Icon, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 5,
                        color: muted, fontSize: 12, fontWeight: 500 }}>
                        <Icon size={13} strokeWidth={2} /> {label}
                      </div>
                    ))}
                  </div>
                </motion.form>
              )}

              {/* ════ STEP 2: Issues ════════════════════════════════════════ */}
              {s.step === "issues" && (
                <motion.div key="issues" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 28,
                      fontWeight: 700, color: text, marginBottom: 10, lineHeight: 1.25 }}>
                      What issues matter to you?
                    </h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {s.representatives.map(r => (
                        <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5,
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                          background: surface2, border: `1.5px solid ${border}`, color: text }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: partyDot(r.party) }} />
                          {r.chamber === "Senate" ? "Sen." : "Rep."} {r.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <motion.div role="group" aria-label="Issue topics"
                    variants={stagger} initial="initial" animate="animate"
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ISSUE_TOPICS.map(topic => {
                      const Icon = ICON_MAP[topic.emoji] ?? Shield;
                      const sel = s.selectedIssues.includes(topic.id);
                      return (
                        <motion.button key={topic.id} variants={itemRise}
                          role="checkbox" aria-checked={sel}
                          onClick={() => toggleIssue(topic.id)}
                          style={{ position: "relative", display: "flex", alignItems: "center",
                            gap: 11, padding: "13px 14px", borderRadius: 14, textAlign: "left",
                            cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                            border: `2px solid ${sel ? "#1e4080" : border}`,
                            background: sel ? navyLight : surface2,
                            boxShadow: sel ? "0 4px 14px rgba(30,64,128,0.12)" : "none",
                            transition: "all 0.18s" }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: sel ? `linear-gradient(135deg, #0d1f3c, #1e4080)` : border2,
                            transition: "all 0.18s" }}>
                            <Icon size={16} color={sel ? "white" : muted} strokeWidth={1.8} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: sel ? text : text2 }}>
                            {topic.label}
                          </span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 440, damping: 20 }}
                              style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18,
                                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                background: `linear-gradient(135deg, #0d1f3c, #1e4080)` }}>
                              <Check size={10} color="white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                  <motion.button onClick={handleIssues}
                    disabled={!s.selectedIssues.length || ldBills}
                    style={{ ...primaryBtn, padding: "15px 24px", borderRadius: 14, fontSize: 15,
                      fontWeight: 700, cursor: !s.selectedIssues.length || ldBills ? "not-allowed" : "pointer",
                      opacity: !s.selectedIssues.length || ldBills ? 0.55 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontFamily: "var(--font-dm-sans)" }}
                    whileHover={s.selectedIssues.length > 0 ? { scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" } : {}}
                    whileTap={{ scale: 0.98 }}>
                    {ldBills
                      ? <><Loader2 size={16} className="animate-spin" /> Fetching bills…</>
                      : s.selectedIssues.length === 0 ? "Select at least one issue"
                        : <><span>See Bills ({s.selectedIssues.length} selected)</span>
                            <ArrowRight size={16} strokeWidth={2.5} /></>}
                  </motion.button>
                </motion.div>
              )}

              {/* ════ STEP 3: Bill Feed ═════════════════════════════════════ */}
              {s.step === "feed" && (
                <motion.div key="feed" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 28,
                      fontWeight: 700, color: text, marginBottom: 6, lineHeight: 1.25 }}>
                      Bills that affect you
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: muted }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%",
                        background: s.billsLive ? "#22c55e" : "#f59e0b",
                        boxShadow: s.billsLive ? "0 0 0 2px rgba(34,197,94,0.25)" : "none" }} />
                      {s.billsLive ? "Live from Congress.gov" : "Sample legislation"} · Select to explore
                    </div>
                  </div>

                  <motion.div role="list" variants={stagger} initial="initial" animate="animate"
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.bills.map(bill => {
                      const urg = urgencyConfig(bill.urgency);
                      const UrgIcon = urg.Icon;
                      const stage = bill.stage ?? 1;
                      return (
                        <motion.button key={bill.id} role="listitem" variants={itemRise}
                          onClick={() => handleBill(bill)}
                          aria-label={`${bill.type} ${bill.number}: ${bill.title}. Status: ${urg.label}`}
                          style={{ width: "100%", textAlign: "left", padding: "14px 16px",
                            borderRadius: 16, cursor: "pointer",
                            border: `1.5px solid ${border}`, background: surface2,
                            fontFamily: "var(--font-dm-sans)", transition: "all 0.18s" }}
                          whileHover={{ borderColor: "#1e4080", background: navyLight,
                            boxShadow: "0 4px 18px rgba(30,64,128,0.10)", scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center", background: border2 }}>
                              <FileText size={15} color={muted} strokeWidth={1.8} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                                  padding: "2px 8px", borderRadius: 5,
                                  background: `linear-gradient(135deg, #0d1f3c, #1e4080)`, color: "white" }}>
                                  {bill.type} {bill.number}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                                  padding: "2px 7px", borderRadius: 5,
                                  display: "flex", alignItems: "center", gap: 3,
                                  background: urg.label === "URGENT" ? "#fef2f2" : urg.label === "NEW" ? "#f0fdf4" : "#fff7ed",
                                  border: `1px solid ${urg.label === "URGENT" ? "#fca5a5" : urg.label === "NEW" ? "#86efac" : "#fdba74"}`,
                                  color: urg.label === "URGENT" ? "#b91c1c" : urg.label === "NEW" ? "#15803d" : "#c2410c" }}>
                                  <UrgIcon size={9} strokeWidth={2.5} /> {urg.label}
                                </span>
                                {bill.policyArea && (
                                  <span style={{ fontSize: 11, color: muted }}>{bill.policyArea}</span>
                                )}
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45,
                                color: text, marginBottom: 6 }}>
                                {bill.title}
                              </p>
                              {/* Mini stage bar */}
                              <div style={{ display: "flex", gap: 3 }}>
                                {STAGE_INFO.map((st, i) => (
                                  <div key={st.short} style={{ height: 3, flex: 1, borderRadius: 2,
                                    background: i < stage ? (i === stage - 1 ? "#1e4080" : "#b8830e") : border }} />
                                ))}
                              </div>
                              <span style={{ fontSize: 9, color: muted, letterSpacing: "0.04em",
                                textTransform: "uppercase" }}>
                                {STAGE_INFO[stage - 1]?.label ?? ""}
                              </span>
                            </div>
                            <ArrowRight size={15} color={muted} strokeWidth={2} style={{ flexShrink: 0, marginTop: 4 }} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <button onClick={() => goTo("issues")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: muted,
                      fontFamily: "var(--font-dm-sans)" }}>
                    <ChevronLeft size={14} strokeWidth={2.5} /> Change issues
                  </button>
                </motion.div>
              )}

              {/* ════ STEP 4: Action ════════════════════════════════════════ */}
              {s.step === "action" && s.selectedBill && (
                <motion.div key="action" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  <button onClick={() => { patch({ generatedLetter: "", generatedScript: "" }); goTo("feed"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: muted,
                      fontFamily: "var(--font-dm-sans)", alignSelf: "flex-start" }}>
                    <ChevronLeft size={14} strokeWidth={2.5} /> Back to bills
                  </button>

                  {/* Bill banner */}
                  <div style={{ padding: "14px 16px", borderRadius: 14,
                    background: navyLight, border: `1.5px solid ${dm ? "#1e4080" : "#b3cff0"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                          padding: "2px 8px", borderRadius: 5,
                          background: `linear-gradient(135deg, #0d1f3c, #1e4080)`, color: "white" }}>
                          {s.selectedBill.type} {s.selectedBill.number}
                        </span>
                        {s.selectedBill.policyArea && (
                          <span style={{ fontSize: 11, color: navyMid, fontWeight: 500 }}>
                            {s.selectedBill.policyArea}
                          </span>
                        )}
                      </div>
                      <a href={s.selectedBill.url} target="_blank" rel="noopener noreferrer"
                        aria-label="Read full bill text on Congress.gov"
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                          color: navyMid, fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-dm-sans)" }}>
                        <BookOpen size={12} strokeWidth={2} /> Full text
                      </a>
                    </div>
                    <p style={{ fontFamily: "var(--font-playfair)", fontSize: 15, fontWeight: 700,
                      color: text, lineHeight: 1.4, marginBottom: 12 }}>
                      {s.selectedBill.title}
                    </p>
                    {/* Interactive timeline */}
                    <InteractiveTimeline
                      stage={s.selectedBill.stage ?? 1}
                      onStageClick={(i) => patch({ stageModal: i })}
                      dm={dm} />
                  </div>

                  {/* Info tabs */}
                  <div>
                    <div role="tablist" style={{ display: "flex", gap: 2, padding: 4, borderRadius: 14,
                      background: "var(--tab-bg)", marginBottom: 14 }}>
                      {([
                        { id: "overview",      label: "Overview" },
                        { id: "perspectives",  label: "Perspectives" },
                        { id: "act",           label: "Take Action" },
                      ] as { id: InfoTab; label: string }[]).map(({ id, label }) => (
                        <button key={id} role="tab" aria-selected={s.infoTab === id}
                          onClick={() => patch({ infoTab: id })}
                          style={{ flex: 1, padding: "9px 8px", borderRadius: 11, fontSize: 12,
                            fontWeight: 700, cursor: "pointer", border: "none",
                            fontFamily: "var(--font-dm-sans)", transition: "all 0.18s",
                            background: s.infoTab === id ? surface : "transparent",
                            color: s.infoTab === id ? text : muted,
                            boxShadow: s.infoTab === id ? "0 1px 6px rgba(13,31,60,0.10)" : "none" }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* Overview tab */}
                      {s.infoTab === "overview" && (
                        <motion.div key="tab-overview" role="tabpanel"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <SectionLabel>Plain-English Summary</SectionLabel>
                          {s.loadingSummary === s.selectedBill.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[1, 0.82, 0.65].map((w, i) => (
                                <div key={i} className="skeleton" style={{ height: 14, width: `${w * 100}%` }} />
                              ))}
                              <div className="skeleton" style={{ height: 52, marginTop: 4, borderRadius: 12 }} />
                              <div className="skeleton" style={{ height: 52, borderRadius: 12 }} />
                            </div>
                          ) : s.summaries[s.selectedBill.id] ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <p style={{ fontSize: 13, lineHeight: 1.7, color: text2 }}>
                                {s.summaries[s.selectedBill.id].plainEnglish}
                              </p>
                              <div style={{ padding: "12px 14px", borderRadius: 12,
                                background: goldLt, border: `1.5px solid ${goldBrd}`,
                                fontSize: 13, lineHeight: 1.65 }}>
                                <strong style={{ color: gold }}>What this means for you — </strong>
                                <span style={{ color: dm ? "#c9a84c" : "#6b4f0a" }}>
                                  {s.summaries[s.selectedBill.id].whatItMeans}
                                </span>
                              </div>
                              {s.summaries[s.selectedBill.id].districtImpact && (
                                <div style={{ padding: "12px 14px", borderRadius: 12,
                                  background: navyLight, border: `1.5px solid ${dm ? "#1e4080" : "#b3cff0"}`,
                                  fontSize: 13, lineHeight: 1.65 }}>
                                  <strong style={{ color: navyMid }}>
                                    Impact on {s.state}{s.district ? ` District ${s.district}` : ""} — </strong>
                                  <span style={{ color: dm ? "#79a6e8" : "#1e3a6e" }}>
                                    {s.summaries[s.selectedBill.id].districtImpact}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p style={{ fontSize: 13, color: muted, fontStyle: "italic" }}>Loading summary…</p>
                          )}

                          {/* Pass likelihood */}
                          <SectionLabel>Pass Likelihood</SectionLabel>
                          {s.likelihoods[s.selectedBill.id] ? (
                            <PassLikelihoodMeter data={s.likelihoods[s.selectedBill.id]} dm={dm} surface={surface} border={border} text={text} muted={muted} />
                          ) : (
                            <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
                          )}
                        </motion.div>
                      )}

                      {/* Perspectives tab */}
                      {s.infoTab === "perspectives" && (
                        <motion.div key="tab-perspectives" role="tabpanel"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <SectionLabel>Balanced Perspectives</SectionLabel>
                          {s.prosCons[s.selectedBill.id] ? (
                            <ProsConsPanel data={s.prosCons[s.selectedBill.id]} dm={dm} surface={surface} border={border} text={text} text2={text2} muted={muted} />
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[1,1,1,1,1,1].map((_, i) => <div key={i} className="skeleton" style={{ height: 16, width: `${85 - i*5}%`, borderRadius: 4 }} />)}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Take Action tab */}
                      {s.infoTab === "act" && (
                        <motion.div key="tab-act" role="tabpanel"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                          {/* Rep cards */}
                          <div>
                            <SectionLabel>Contact</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {s.representatives.map(r => {
                                const active = s.actionRep?.name === r.name;
                                return (
                                  <motion.button key={r.name} onClick={() => patch({ actionRep: r })}
                                    aria-pressed={active}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                      padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                                      fontFamily: "var(--font-dm-sans)", transition: "all 0.15s",
                                      border: `2px solid ${active ? "#1e4080" : border}`,
                                      background: active ? navyLight : surface2 }}
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%",
                                        background: partyDot(r.party), flexShrink: 0 }} />
                                      <div style={{ textAlign: "left" }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: text }}>
                                          {r.chamber === "Senate" ? "Sen." : "Rep."} {r.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: muted }}>
                                          {r.party === "R" ? "Republican" : r.party === "D" ? "Democrat" : "Independent"}
                                          {" · "}{r.chamber}{r.district ? ` · District ${r.district}` : ""}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      {r.phone && (
                                        <a href={`tel:${r.phone}`} onClick={e => e.stopPropagation()}
                                          aria-label={`Call ${r.name} at ${r.phone}`}
                                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px",
                                            borderRadius: 7, fontSize: 11, fontWeight: 600, textDecoration: "none",
                                            background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
                                          <Phone size={11} strokeWidth={2.5} /> {r.phone}
                                        </a>
                                      )}
                                      {active && <div style={{ width: 20, height: 20, borderRadius: "50%",
                                        background: `linear-gradient(135deg, #0d1f3c, #1e4080)`,
                                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Check size={11} color="white" strokeWidth={3} />
                                      </div>}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Position */}
                          <div>
                            <SectionLabel>Your Position</SectionLabel>
                            <div style={{ display: "flex", gap: 10 }}>
                              {(["support", "oppose"] as const).map(p => {
                                const active = s.actionPosition === p;
                                return (
                                  <motion.button key={p} onClick={() => patch({ actionPosition: p })}
                                    aria-pressed={active}
                                    style={{ flex: 1, padding: "11px 16px", borderRadius: 12, fontSize: 13,
                                      fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                      transition: "all 0.15s",
                                      border: `2px solid ${active ? (p === "support" ? "#86efac" : "#fca5a5") : border}`,
                                      background: active ? (p === "support" ? "#f0fdf4" : "#fef2f2") : surface2,
                                      color: active ? (p === "support" ? "#15803d" : "#b91c1c") : muted }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                    {p === "support" ? <ThumbsUp size={14} strokeWidth={2.5} /> : <ThumbsDown size={14} strokeWidth={2.5} />}
                                    {p === "support" ? "Support" : "Oppose"}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Personal note */}
                          <div>
                            <SectionLabel optional>Personal Note</SectionLabel>
                            <textarea value={s.personalNote} rows={2}
                              onChange={e => patch({ personalNote: e.target.value })}
                              placeholder="A personal story makes your outreach far more persuasive."
                              aria-label="Optional personal note to include in your message"
                              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13,
                                lineHeight: 1.6, resize: "none", outline: "none",
                                border: `2px solid ${border}`, background: surface2, color: text,
                                fontFamily: "var(--font-dm-sans)", transition: "border-color 0.2s" }}
                              onFocus={e => { e.target.style.borderColor = "#1e4080"; e.target.style.boxShadow = "0 0 0 3px rgba(30,64,128,0.08)"; }}
                              onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = "none"; }} />
                          </div>

                          {/* Output tabs */}
                          <div>
                            <div role="tablist" style={{ display: "flex", gap: 2, padding: 4, borderRadius: 12,
                              background: "var(--tab-bg)", marginBottom: 10 }}>
                              {([
                                { id: "letter", Icon: Mail,   label: "Letter"    },
                                { id: "call",   Icon: Phone,  label: "Call Script"},
                                { id: "share",  Icon: Share2, label: "Share"     },
                              ] as { id: ActionTab; Icon: React.ElementType; label: string }[]).map(({ id, Icon, label }) => (
                                <button key={id} role="tab" aria-selected={s.actionTab === id}
                                  onClick={() => patch({ actionTab: id })}
                                  style={{ flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 11,
                                    fontWeight: 700, cursor: "pointer", border: "none",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                                    fontFamily: "var(--font-dm-sans)", transition: "all 0.18s",
                                    background: s.actionTab === id ? surface : "transparent",
                                    color: s.actionTab === id ? text : muted,
                                    boxShadow: s.actionTab === id ? "0 1px 6px rgba(13,31,60,0.10)" : "none" }}>
                                  <Icon size={12} strokeWidth={2} /> {label}
                                </button>
                              ))}
                            </div>

                            <AnimatePresence mode="wait">

                              {s.actionTab === "letter" && (
                                <motion.div key="letter-tab"
                                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                  style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  <motion.button onClick={handleLetter}
                                    disabled={!s.actionRep || s.generatingLetter}
                                    style={{ ...primaryBtn, padding: "13px 24px", borderRadius: 13, fontSize: 14,
                                      fontWeight: 700, cursor: !s.actionRep || s.generatingLetter ? "not-allowed" : "pointer",
                                      opacity: !s.actionRep || s.generatingLetter ? 0.55 : 1,
                                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                      background: `linear-gradient(135deg, #0d1f3c, #1e4080 60%, #b8830e 140%)`,
                                      fontFamily: "var(--font-dm-sans)" }}
                                    whileHover={s.actionRep && !s.generatingLetter ? { scale: 1.01, boxShadow: "0 8px 30px rgba(13,31,60,0.32)" } : {}}
                                    whileTap={{ scale: 0.98 }}>
                                    {s.generatingLetter
                                      ? <><Loader2 size={16} className="animate-spin" /> Crafting your letter…</>
                                      : <><Mail size={15} strokeWidth={2} /> Generate Letter</>}
                                  </motion.button>
                                  {s.generatedLetter && (
                                    <OutputBox text={s.generatedLetter} copied={s.copied}
                                      onCopy={() => handleCopy(s.generatedLetter)} rep={s.actionRep}
                                      surface={surface} border={border} muted={muted} gold={gold} dm={dm} />
                                  )}
                                </motion.div>
                              )}

                              {s.actionTab === "call" && (
                                <motion.div key="call-tab"
                                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                  style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {s.actionRep?.phone && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                      borderRadius: 12, background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                                      <Phone size={15} color="#15803d" strokeWidth={2} />
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Office phone</div>
                                        <a href={`tel:${s.actionRep.phone}`}
                                          style={{ fontSize: 14, fontWeight: 700, color: "#0d1f3c", textDecoration: "none" }}>
                                          {s.actionRep.phone}
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  <motion.button onClick={handleScript}
                                    disabled={!s.actionRep || s.generatingScript}
                                    style={{ ...primaryBtn, padding: "13px 24px", borderRadius: 13, fontSize: 14,
                                      fontWeight: 700, cursor: !s.actionRep || s.generatingScript ? "not-allowed" : "pointer",
                                      opacity: !s.actionRep || s.generatingScript ? 0.55 : 1,
                                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                      fontFamily: "var(--font-dm-sans)" }}
                                    whileHover={s.actionRep && !s.generatingScript ? { scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" } : {}}
                                    whileTap={{ scale: 0.98 }}>
                                    {s.generatingScript
                                      ? <><Loader2 size={16} className="animate-spin" /> Writing script…</>
                                      : <><Phone size={15} strokeWidth={2} /> Generate Call Script</>}
                                  </motion.button>
                                  {s.generatedScript && (
                                    <OutputBox text={s.generatedScript} copied={s.copied}
                                      onCopy={() => handleCopy(s.generatedScript)} rep={s.actionRep}
                                      surface={surface} border={border} muted={muted} gold={gold} dm={dm} />
                                  )}
                                </motion.div>
                              )}

                              {s.actionTab === "share" && (
                                <motion.div key="share-tab"
                                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                  style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  <div style={{ padding: "14px 16px", borderRadius: 12, fontFamily: "var(--font-dm-sans)",
                                    background: surface2, border: `1.5px solid ${border}`, fontSize: 13, lineHeight: 1.7, color: text2 }}>
                                    <strong style={{ color: text }}>
                                      {s.selectedBill.type} {s.selectedBill.number} — {s.selectedBill.title}
                                    </strong>
                                    {s.summaries[s.selectedBill.id] && (
                                      <p style={{ marginTop: 6, color: muted }}>{s.summaries[s.selectedBill.id].plainEnglish}</p>
                                    )}
                                    <p style={{ marginTop: 6, color: navyMid, fontWeight: 600 }}>civicspark.vercel.app</p>
                                  </div>
                                  <motion.button onClick={handleShare}
                                    style={{ ...primaryBtn, padding: "13px 24px", borderRadius: 13, fontSize: 14,
                                      fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                                      gap: 8, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
                                    whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" }}
                                    whileTap={{ scale: 0.98 }}>
                                    {s.sharedBill
                                      ? <><Check size={15} strokeWidth={2.5} /> Copied!</>
                                      : <><Share2 size={15} strokeWidth={2} /> Copy Shareable Summary</>}
                                  </motion.button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ textAlign: "center", marginTop: 24, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 12, fontSize: 11, color: muted, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Landmark size={11} strokeWidth={2} /> CivicSpark
          </span>
          <span>·</span><span>Congressional App Challenge</span>
          <span>·</span><span>AI by Groq</span>
          <span>·</span><span>Data: Congress.gov</span>
        </motion.div>
      </div>

      {/* Stage explainer modal */}
      <AnimatePresence>
        {s.stageModal !== null && (
          <StageModal
            stageIdx={s.stageModal}
            onClose={() => patch({ stageModal: null })}
            surface={surface} border={border} text={text} text2={text2} muted={muted} gold={gold} navyMid={navyMid} navyLight={navyLight} />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function InteractiveTimeline({ stage, onStageClick, dm }: {
  stage: number; onStageClick: (i: number) => void; dm: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
        {STAGE_INFO.map((st, i) => {
          const filled = i < stage, current = i === stage - 1;
          const StIcon = st.icon;
          return (
            <motion.button key={st.short} onClick={() => onStageClick(i)}
              title={`Learn about: ${st.label}`}
              aria-label={`Stage ${i+1}: ${st.label}. Click to learn more.`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                cursor: "pointer", background: "none", border: "none", padding: "4px 2px", borderRadius: 8 }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <div style={{ height: 5, width: "100%", borderRadius: 2,
                background: filled ? (current ? "#1e4080" : "#b8830e") : (dm ? "#21262d" : "#c8daf5"),
                transition: "background 0.3s" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <StIcon size={8} color={current ? "#1e4080" : filled ? "#b8830e" : dm ? "#8b949e" : "#93afd4"} strokeWidth={2.5} />
                <span style={{ fontSize: 8, fontWeight: current ? 800 : 500, letterSpacing: "0.04em",
                  color: current ? "#1e4080" : filled ? "#b8830e" : dm ? "#8b949e" : "#93afd4",
                  textTransform: "uppercase" }}>
                  {st.short}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Info size={10} color={dm ? "#8b949e" : "#93afd4"} strokeWidth={2} />
        <span style={{ fontSize: 9, color: dm ? "#8b949e" : "#93afd4" }}>Tap any stage to learn how Congress works</span>
      </div>
    </div>
  );
}

function StageModal({ stageIdx, onClose, surface, border, text, text2, muted, gold, navyMid, navyLight }: {
  stageIdx: number; onClose: () => void;
  surface: string; border: string; text: string; text2: string; muted: string;
  gold: string; navyMid: string; navyLight: string;
}) {
  const info = STAGE_INFO[stageIdx];
  if (!info) return null;
  const Icon = info.icon;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }} />
      <motion.div role="dialog" aria-modal aria-label={`Learn about: ${info.label}`}
        initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "min(90vw, 400px)", background: surface, borderRadius: 20, padding: 28,
          border: `1px solid ${border}`, zIndex: 51,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12,
              background: navyLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={navyMid} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 2 }}>
                Stage {stageIdx + 1} of 5
              </div>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: text }}>
                {info.label}
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: muted, padding: 4 }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: text2 }}>{info.what}</p>

          <div style={{ padding: "10px 12px", borderRadius: 10,
            background: navyLight, borderLeft: `3px solid ${navyMid}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: navyMid, letterSpacing: "0.06em",
              textTransform: "uppercase", marginBottom: 4 }}>What happens next</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: text2 }}>{info.next}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10,
            background: "rgba(184,131,14,0.08)", border: `1px solid ${gold}` }}>
            <Scale size={14} color={gold} strokeWidth={2} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: gold, fontWeight: 500 }}>{info.stat}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function PassLikelihoodMeter({ data, dm, surface, border, text, muted }: {
  data: PassLikelihood; dm: boolean; surface: string; border: string; text: string; muted: string;
}) {
  const colors = likelihoodColor(data.percent);
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14,
      background: surface, border: `1.5px solid ${border}`,
      display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 2 }}>
            Likelihood to pass
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700, color: colors.text }}>
              {data.percent}%
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              background: colors.bg, color: colors.text }}>
              {data.label}
            </span>
          </div>
        </div>
        <BarChart2 size={28} color={colors.text} strokeWidth={1.5} style={{ opacity: 0.4 }} />
      </div>
      {/* Animated bar */}
      <div style={{ height: 8, borderRadius: 4, background: dm ? "#21262d" : "#e6e2d8", overflow: "hidden" }}>
        <motion.div className="meter-fill"
          style={{ height: "100%", borderRadius: 4, background: colors.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${data.percent}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <p style={{ fontSize: 12, color: muted, lineHeight: 1.55 }}>{data.rationale}</p>
    </div>
  );
}

function ProsConsPanel({ data, dm, surface, border, text, text2, muted }: {
  data: ProsCons; dm: boolean; surface: string; border: string; text: string; text2: string; muted: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Pros */}
        <div style={{ padding: "12px 14px", borderRadius: 12,
          background: "#f0fdf4", border: "1.5px solid #86efac" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#15803d", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <ThumbsUp size={11} strokeWidth={2.5} /> Arguments for
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {data.pros.map((pro, i) => (
              <li key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "#166534",
                display: "flex", gap: 6 }}>
                <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }}>+</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        {/* Cons */}
        <div style={{ padding: "12px 14px", borderRadius: 12,
          background: "#fef2f2", border: "1.5px solid #fca5a5" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#b91c1c", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <ThumbsDown size={11} strokeWidth={2.5} /> Arguments against
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {data.cons.map((con, i) => (
              <li key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "#991b1b",
                display: "flex", gap: 6 }}>
                <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }}>−</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Who's involved */}
      {(data.supporterView || data.opposerView) && (
        <div style={{ padding: "12px 14px", borderRadius: 12,
          background: surface, border: `1.5px solid ${border}`, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, letterSpacing: "0.06em",
            textTransform: "uppercase" }}>Who&apos;s involved</div>
          {data.supporterView && (
            <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.55, margin: 0 }}>
              <strong>Supporters:</strong> {data.supporterView}
            </p>
          )}
          {data.opposerView && (
            <p style={{ fontSize: 12, color: "#991b1b", lineHeight: 1.55, margin: 0 }}>
              <strong>Critics:</strong> {data.opposerView}
            </p>
          )}
        </div>
      )}
      <p style={{ fontSize: 11, color: muted, fontStyle: "italic", textAlign: "center" }}>
        Perspectives are AI-generated and nonpartisan. They do not reflect CivicSpark&apos;s views.
      </p>
    </div>
  );
}

function OutputBox({ text, copied, onCopy, rep, surface, border, muted, dm }: {
  text: string; copied: boolean; onCopy: () => void; rep: Representative | null;
  surface: string; border: string; muted: string; gold?: string; dm: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <SectionLabel>Output</SectionLabel>
        <div style={{ display: "flex", gap: 7 }}>
          <motion.button onClick={onCopy} aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
              padding: "5px 11px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${border}`,
              background: copied ? "#f0fdf4" : dm ? "#21262d" : "#f4f2ee",
              color: copied ? "#15803d" : muted, fontFamily: "var(--font-dm-sans)", transition: "all 0.2s" }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
            {copied ? <><Check size={12} strokeWidth={3} /> Copied!</> : <><Copy size={12} strokeWidth={2} /> Copy</>}
          </motion.button>
          {rep?.contactUrl && (
            <motion.a href={rep.contactUrl} target="_blank" rel="noopener noreferrer"
              aria-label={`Contact ${rep.name} on their official website`}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
                padding: "5px 11px", borderRadius: 8, textDecoration: "none",
                background: `linear-gradient(135deg, #0d1f3c, #1e4080)`, color: "white",
                fontFamily: "var(--font-dm-sans)" }}
              whileHover={{ scale: 1.04, boxShadow: "0 4px 16px rgba(13,31,60,0.28)" }}
              whileTap={{ scale: 0.95 }}>
              <ExternalLink size={12} strokeWidth={2} />
              Contact {rep.name.split(" ").pop()}
            </motion.a>
          )}
        </div>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, padding: "16px 18px",
        borderRadius: 12, fontFamily: "var(--font-dm-sans)",
        background: surface, border: `1.5px solid ${border}`, color: "#334155", margin: 0 }}>
        {text}
      </pre>
    </motion.div>
  );
}

function SectionLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--gold)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      {children}
      {optional && <span style={{ fontWeight: 400, textTransform: "none",
        letterSpacing: 0, fontSize: 11, color: "var(--muted)" }}>(optional)</span>}
    </p>
  );
}

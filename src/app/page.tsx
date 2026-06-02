"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ArrowRight, Home as HomeIcon, Leaf, HeartPulse, GraduationCap,
  TrendingUp, Shield, Cpu, Award, Check, ChevronLeft,
  Landmark, FileText, ThumbsUp, ThumbsDown, Mail, Copy,
  ExternalLink, Loader2, Zap, Lock, Database, Phone,
  Share2, BookOpen, AlertCircle, Flame, Sparkles,
} from "lucide-react";
import type { Bill, BillSummary, Representative } from "@/lib/types";
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

interface CivicScore { billsRead: number; lettersWritten: number; callsScripted: number; }

interface AppState {
  step: Step;
  zip: string;
  state: string;
  district: string;
  representatives: Representative[];
  selectedIssues: string[];
  bills: Bill[];
  billsLive: boolean;
  selectedBill: Bill | null;
  summaries: Record<string, BillSummary>;
  loadingSummary: string | null;
  actionRep: Representative | null;
  actionPosition: "support" | "oppose";
  personalNote: string;
  actionTab: ActionTab;
  generatedLetter: string;
  generatingLetter: boolean;
  generatedScript: string;
  generatingScript: boolean;
  copied: boolean;
  sharedBill: boolean;
}

const INITIAL: AppState = {
  step: "onboarding", zip: "", state: "", district: "",
  representatives: [], selectedIssues: [], bills: [], billsLive: false,
  selectedBill: null, summaries: {}, loadingSummary: null,
  actionRep: null, actionPosition: "support", personalNote: "",
  actionTab: "letter",
  generatedLetter: "", generatingLetter: false,
  generatedScript: "", generatingScript: false,
  copied: false, sharedBill: false,
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

/* ── Tokens ──────────────────────────────────────────────────────────────── */
const T = {
  navy: "#0d1f3c", navyMid: "#1e4080", navyLight: "#dce8f8",
  gold: "#b8830e", goldLight: "#fdf3d7", goldBorder: "#e8c96a",
  cream: "#f4f2ee", surface: "#ffffff", border: "#e6e2d8", muted: "#7a8699",
  green: "#15803d", greenBg: "#f0fdf4", greenBorder: "#86efac",
  red: "#b91c1c", redBg: "#fef2f2", redBorder: "#fca5a5",
  orange: "#c2410c", orangeBg: "#fff7ed", orangeBorder: "#fdba74",
};

const primaryBtn = {
  background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
  color: "white", border: "none",
  boxShadow: `0 2px 12px rgba(13,31,60,0.22)`,
} as const;

/* ── Legislative stage config ────────────────────────────────────────────── */
const STAGES = [
  { label: "Introduced",   short: "Intro" },
  { label: "In Committee", short: "Cmte"  },
  { label: "Floor Ready",  short: "Floor" },
  { label: "Passed",       short: "Passed"},
  { label: "Signed",       short: "Law"   },
];

/* ── Party color ─────────────────────────────────────────────────────────── */
function partyColor(party: string) {
  if (party === "R") return { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", dot: "#ef4444" };
  if (party === "D") return { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", dot: "#3b82f6" };
  return { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", dot: "#94a3b8" };
}

/* ── Urgency config ──────────────────────────────────────────────────────── */
function urgencyConfig(u?: string) {
  if (u === "urgent") return { label: "URGENT", bg: T.redBg,    border: T.redBorder,    text: T.red,    Icon: Flame       };
  if (u === "new")    return { label: "NEW",    bg: T.greenBg,  border: T.greenBorder,  text: T.green,  Icon: Sparkles    };
  return                     { label: "ACTIVE", bg: T.orangeBg, border: T.orangeBorder, text: T.orange, Icon: AlertCircle };
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

  // Load civic score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("civicspark_score");
      if (saved) setScore(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveScore(update: Partial<CivicScore>) {
    setScore(prev => {
      const next = { ...prev, ...update,
        billsRead:      (update.billsRead      ?? 0) + prev.billsRead,
        lettersWritten: (update.lettersWritten  ?? 0) + prev.lettersWritten,
        callsScripted:  (update.callsScripted   ?? 0) + prev.callsScripted,
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
      generatedLetter: "", generatedScript: "", actionTab: "letter" });
    goTo("action");
    saveScore({ billsRead: 1 } as Partial<CivicScore>);

    if (!s.summaries[bill.id]) {
      patch({ loadingSummary: bill.id });
      try {
        const r = await fetch("/api/summarize", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bill, state: s.state, district: s.district }) });
        const summary = await r.json();
        setS(p => ({ ...p, summaries: { ...p.summaries, [bill.id]: summary }, loadingSummary: null }));
      } catch { patch({ loadingSummary: null }); }
    }
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
      saveScore({ lettersWritten: 1 } as Partial<CivicScore>);
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
      saveScore({ callsScripted: 1 } as Partial<CivicScore>);
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
    const text = `📋 ${bill.type} ${bill.number} — ${bill.title}\n\n` +
      (sum ? `${sum.plainEnglish}\n\n` : "") +
      `Take action: https://civicspark.vercel.app`;
    navigator.clipboard.writeText(text);
    patch({ sharedBill: true });
    setTimeout(() => patch({ sharedBill: false }), 2200);
  }

  const stepIdx = STEPS.indexOf(s.step);
  const totalActions = score.billsRead + score.lettersWritten + score.callsScripted;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <main style={{ minHeight: "100vh", background: T.cream,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "44px 16px 64px", position: "relative", overflow: "hidden" }}>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div className="orb-a" style={{ position: "absolute", top: -120, left: -120,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30,64,128,0.09) 0%, transparent 70%)" }} />
        <div className="orb-b" style={{ position: "absolute", bottom: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,131,14,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 1 }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div style={{ textAlign: "center", marginBottom: 36 }}
          initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(13,31,60,0.25)" }}>
              <Landmark size={20} color="white" strokeWidth={1.8} />
            </div>
            <span className="text-gradient" style={{ fontFamily: "var(--font-playfair)",
              fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px" }}>
              CivicSpark
            </span>
          </div>
          <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            Understand legislation. Reach your representatives.{" "}
            <span style={{ color: T.navyMid, fontWeight: 600 }}>Your voice in Congress — made simple.</span>
          </p>
        </motion.div>

        {/* ── Civic score badge ────────────────────────────────────────────── */}
        {totalActions > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "8px 16px",
              borderRadius: 99, background: T.surface, border: `1.5px solid ${T.goldBorder}`,
              boxShadow: "0 2px 8px rgba(184,131,14,0.12)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: "0.06em" }}>
                YOUR CIVIC RECORD
              </span>
              {[
                { n: score.billsRead,      label: "bills read"   },
                { n: score.lettersWritten, label: "letters sent" },
                { n: score.callsScripted,  label: "calls scripted"},
              ].map(({ n, label }) => n > 0 && (
                <span key={label} style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>
                  <span style={{ color: T.navyMid }}>{n}</span> {label}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Card ────────────────────────────────────────────────────────── */}
        <motion.div style={{ background: T.surface, borderRadius: 24, overflow: "hidden",
            border: `1px solid ${T.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 16px 48px rgba(13,31,60,0.10)" }}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: "easeOut" }}>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#ede9df" }}>
            <motion.div style={{ height: "100%",
                background: `linear-gradient(90deg, ${T.navy}, ${T.navyMid}, ${T.gold})` }}
              initial={{ width: "0%" }}
              animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>

          {/* Step indicators */}
          <div style={{ padding: "20px 32px 0", display: "flex", alignItems: "center", gap: 4 }}>
            {STEPS.map((step, i) => {
              const active = step === s.step, done = i < stepIdx;
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <motion.div style={{ width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    background: active ? `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`
                      : done ? T.gold : "#ede9df",
                    color: active || done ? "white" : T.muted }}
                    animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}>
                    {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </motion.div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
                    color: active ? T.navy : done ? T.gold : "#b0a99a" }}>
                    {STEP_LABELS[i]}
                  </span>
                  {i < 3 && <div style={{ width: 18, height: 1, margin: "0 4px",
                    background: i < stepIdx ? T.goldBorder : "#e6e2d8" }} />}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ padding: "24px 32px 32px", minHeight: 440 }}>
            <AnimatePresence mode="wait" custom={dir}>

              {/* ── STEP 1: Onboarding ───────────────────────────────────── */}
              {s.step === "onboarding" && (
                <motion.form key="onboarding" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  onSubmit={handleZip}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 30,
                      fontWeight: 700, color: T.navy, marginBottom: 8, lineHeight: 1.25 }}>
                      Who represents you?
                    </h2>
                    <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.65 }}>
                      Enter your ZIP code to identify your House representative and two Senators,
                      then explore the legislation that directly affects your community.
                    </p>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 16, top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none",
                      color: zipError ? T.red : T.muted }}>
                      <MapPin size={18} strokeWidth={1.8} />
                    </div>
                    <input type="text" inputMode="numeric" maxLength={5}
                      placeholder="ZIP code — e.g. 78717"
                      value={zipInput}
                      onChange={e => { setZip(e.target.value.replace(/\D/g, "")); setErr(""); }}
                      style={{ width: "100%", paddingLeft: 46, paddingRight: 16,
                        paddingTop: 14, paddingBottom: 14, fontSize: 16, borderRadius: 14,
                        outline: "none", fontFamily: "var(--font-dm-sans)",
                        border: `2px solid ${zipError ? "#fca5a5" : T.border}`,
                        background: "#faf9f6", color: T.navy, transition: "border-color 0.2s" }}
                      onFocus={e => { if (!zipError) { e.target.style.borderColor = T.navyMid; e.target.style.boxShadow = "0 0 0 3px rgba(30,64,128,0.08)"; }}}
                      onBlur={e => { e.target.style.borderColor = zipError ? "#fca5a5" : T.border; e.target.style.boxShadow = "none"; }} />
                    {zipError && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                        style={{ color: T.red, fontSize: 12, marginTop: 6, paddingLeft: 4 }}>
                        {zipError}
                      </motion.p>
                    )}
                  </div>
                  <motion.button type="submit" disabled={ldReps || zipInput.length < 5}
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
                    borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                    {[{ Icon: Lock, label: "Private & secure" },
                      { Icon: Database, label: "Congress.gov data" },
                      { Icon: Zap, label: "AI-powered" }].map(({ Icon, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 5,
                        color: T.muted, fontSize: 12, fontWeight: 500 }}>
                        <Icon size={13} strokeWidth={2} /> {label}
                      </div>
                    ))}
                  </div>
                </motion.form>
              )}

              {/* ── STEP 2: Issues ──────────────────────────────────────── */}
              {s.step === "issues" && (
                <motion.div key="issues" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 28,
                      fontWeight: 700, color: T.navy, marginBottom: 10, lineHeight: 1.25 }}>
                      What issues matter to you?
                    </h2>
                    {/* Rep pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {s.representatives.map(r => {
                        const pc = partyColor(r.party);
                        return (
                          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5,
                            fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                            background: pc.bg, border: `1.5px solid ${pc.border}`, color: pc.text }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: pc.dot }} />
                            {r.chamber === "Senate" ? "Sen." : "Rep."} {r.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <motion.div variants={stagger} initial="initial" animate="animate"
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ISSUE_TOPICS.map(topic => {
                      const Icon = ICON_MAP[topic.emoji] ?? Shield;
                      const sel = s.selectedIssues.includes(topic.id);
                      return (
                        <motion.button key={topic.id} variants={itemRise}
                          onClick={() => toggleIssue(topic.id)}
                          style={{ position: "relative", display: "flex", alignItems: "center",
                            gap: 11, padding: "13px 14px", borderRadius: 14, textAlign: "left",
                            cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                            border: `2px solid ${sel ? T.navyMid : T.border}`,
                            background: sel ? T.navyLight : "#faf9f6",
                            boxShadow: sel ? "0 4px 14px rgba(30,64,128,0.12)" : "none",
                            transition: "all 0.18s" }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: sel ? `linear-gradient(135deg, ${T.navy}, ${T.navyMid})` : "#ede9df",
                            transition: "all 0.18s" }}>
                            <Icon size={16} color={sel ? "white" : T.muted} strokeWidth={1.8} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                            color: sel ? T.navy : "#4a5568" }}>
                            {topic.label}
                          </span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 440, damping: 20 }}
                              style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18,
                                borderRadius: "50%", display: "flex", alignItems: "center",
                                justifyContent: "center",
                                background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})` }}>
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
                      : s.selectedIssues.length === 0
                        ? "Select at least one issue"
                        : <><span>See Bills ({s.selectedIssues.length} selected)</span>
                            <ArrowRight size={16} strokeWidth={2.5} /></>}
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 3: Bill Feed ────────────────────────────────────── */}
              {s.step === "feed" && (
                <motion.div key="feed" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 28,
                      fontWeight: 700, color: T.navy, marginBottom: 6, lineHeight: 1.25 }}>
                      Bills that affect you
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.muted }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%",
                        background: s.billsLive ? "#22c55e" : "#f59e0b",
                        boxShadow: s.billsLive ? "0 0 0 2px rgba(34,197,94,0.25)" : "none" }} />
                      {s.billsLive ? "Live from Congress.gov" : "Sample legislation"}
                      <span>·</span>
                      Select a bill to take action
                    </div>
                  </div>

                  <motion.div variants={stagger} initial="initial" animate="animate"
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.bills.map(bill => {
                      const urg = urgencyConfig(bill.urgency);
                      const UrgIcon = urg.Icon;
                      return (
                        <motion.button key={bill.id} variants={itemRise}
                          onClick={() => handleBill(bill)}
                          style={{ width: "100%", textAlign: "left", padding: "14px 16px",
                            borderRadius: 16, cursor: "pointer",
                            border: `1.5px solid ${T.border}`, background: "#faf9f6",
                            fontFamily: "var(--font-dm-sans)", transition: "all 0.18s" }}
                          whileHover={{ borderColor: T.navyMid, background: T.navyLight,
                            boxShadow: "0 4px 18px rgba(30,64,128,0.10)", scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "#ede9df" }}>
                              <FileText size={15} color={T.muted} strokeWidth={1.8} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                                  padding: "2px 8px", borderRadius: 5,
                                  background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, color: "white" }}>
                                  {bill.type} {bill.number}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                                  padding: "2px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3,
                                  background: urg.bg, border: `1px solid ${urg.border}`, color: urg.text }}>
                                  <UrgIcon size={9} strokeWidth={2.5} /> {urg.label}
                                </span>
                                {bill.policyArea && (
                                  <span style={{ fontSize: 11, color: T.muted }}>{bill.policyArea}</span>
                                )}
                              </div>
                              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.45,
                                color: T.navy, marginBottom: 6 }}>
                                {bill.title}
                              </p>
                              {/* Legislative stage mini-bar */}
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                {STAGES.map((st, i) => {
                                  const filled = i < (bill.stage ?? 1);
                                  const current = i === (bill.stage ?? 1) - 1;
                                  return (
                                    <div key={st.short} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                      <div style={{ height: 4, width: current ? 28 : 18, borderRadius: 2,
                                        transition: "all 0.3s",
                                        background: filled
                                          ? current ? T.navyMid : T.gold
                                          : "#e6e2d8" }} />
                                      {current && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: T.navyMid,
                                          letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                                          {st.label.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <ArrowRight size={15} color={T.muted} strokeWidth={2} style={{ flexShrink: 0, marginTop: 4 }} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  <button onClick={() => goTo("issues")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: T.muted,
                      fontFamily: "var(--font-dm-sans)" }}>
                    <ChevronLeft size={14} strokeWidth={2.5} /> Change issues
                  </button>
                </motion.div>
              )}

              {/* ── STEP 4: Action ───────────────────────────────────────── */}
              {s.step === "action" && s.selectedBill && (
                <motion.div key="action" custom={dir} variants={slide}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  <button onClick={() => { patch({ generatedLetter: "", generatedScript: "" }); goTo("feed"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                      display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: T.muted,
                      fontFamily: "var(--font-dm-sans)", alignSelf: "flex-start" }}>
                    <ChevronLeft size={14} strokeWidth={2.5} /> Back to bills
                  </button>

                  {/* Bill banner */}
                  <div style={{ padding: "14px 16px", borderRadius: 14,
                    background: `linear-gradient(135deg, ${T.navyLight}, #c8daf5)`,
                    border: `1.5px solid #b3cff0` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                          padding: "2px 8px", borderRadius: 5,
                          background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, color: "white" }}>
                          {s.selectedBill.type} {s.selectedBill.number}
                        </span>
                        {s.selectedBill.policyArea && (
                          <span style={{ fontSize: 11, color: T.navyMid, fontWeight: 500 }}>
                            {s.selectedBill.policyArea}
                          </span>
                        )}
                      </div>
                      {/* Congress.gov link */}
                      <a href={s.selectedBill.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                          color: T.navyMid, fontWeight: 600, textDecoration: "none",
                          fontFamily: "var(--font-dm-sans)" }}>
                        <BookOpen size={12} strokeWidth={2} /> Full text
                      </a>
                    </div>
                    <p style={{ fontFamily: "var(--font-playfair)", fontSize: 15,
                      fontWeight: 700, color: T.navy, lineHeight: 1.4, marginBottom: 12 }}>
                      {s.selectedBill.title}
                    </p>
                    {/* Full legislative timeline */}
                    <LegislativeTimeline stage={s.selectedBill.stage ?? 1} />
                  </div>

                  {/* AI Summary + District Impact */}
                  <div>
                    <SectionLabel>Plain-English Summary</SectionLabel>
                    {s.loadingSummary === s.selectedBill.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[1, 0.82, 0.65].map((w, i) => (
                          <div key={i} className="skeleton" style={{ height: 14, width: `${w * 100}%` }} />
                        ))}
                        <div className="skeleton" style={{ height: 52, marginTop: 4, borderRadius: 12 }} />
                        <div className="skeleton" style={{ height: 52, marginTop: 4, borderRadius: 12 }} />
                      </div>
                    ) : s.summaries[s.selectedBill.id] ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#334155" }}>
                          {s.summaries[s.selectedBill.id].plainEnglish}
                        </p>
                        <div style={{ padding: "12px 14px", borderRadius: 12,
                          background: T.goldLight, border: `1.5px solid ${T.goldBorder}`,
                          fontSize: 13, lineHeight: 1.65, color: "#6b4f0a" }}>
                          <strong style={{ color: T.gold }}>What this means for you — </strong>
                          {s.summaries[s.selectedBill.id].whatItMeans}
                        </div>
                        {s.summaries[s.selectedBill.id].districtImpact && (
                          <div style={{ padding: "12px 14px", borderRadius: 12,
                            background: T.navyLight, border: `1.5px solid #b3cff0`,
                            fontSize: 13, lineHeight: 1.65, color: "#1e3a6e" }}>
                            <strong style={{ color: T.navyMid }}>
                              Impact on {s.state}{s.district ? ` District ${s.district}` : ""} — </strong>
                            {s.summaries[s.selectedBill.id].districtImpact}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <p style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>Loading…</p>
                    )}
                  </div>

                  {/* Rep selector */}
                  <div>
                    <SectionLabel>Write or call</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {s.representatives.map(r => {
                        const active = s.actionRep?.name === r.name;
                        const pc = partyColor(r.party);
                        return (
                          <motion.button key={r.name} onClick={() => patch({ actionRep: r })}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                              fontFamily: "var(--font-dm-sans)", transition: "all 0.15s",
                              border: `2px solid ${active ? T.navyMid : T.border}`,
                              background: active ? T.navyLight : "#faf9f6" }}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* Party dot */}
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pc.dot, flexShrink: 0 }} />
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: active ? T.navy : "#374151" }}>
                                  {r.chamber === "Senate" ? "Sen." : "Rep."} {r.name}
                                </div>
                                <div style={{ fontSize: 11, color: T.muted }}>
                                  {r.party === "R" ? "Republican" : r.party === "D" ? "Democrat" : "Independent"}
                                  {" · "}{r.chamber}{r.district ? ` · District ${r.district}` : ""}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              {r.phone && (
                                <a href={`tel:${r.phone}`}
                                  onClick={e => e.stopPropagation()}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px",
                                    borderRadius: 7, fontSize: 11, fontWeight: 600, textDecoration: "none",
                                    background: T.greenBg, border: `1px solid ${T.greenBorder}`, color: T.green }}>
                                  <Phone size={11} strokeWidth={2.5} />
                                  {r.phone}
                                </a>
                              )}
                              {active && <div style={{ width: 20, height: 20, borderRadius: "50%",
                                background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`,
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
                            style={{ flex: 1, padding: "11px 16px", borderRadius: 12, fontSize: 13,
                              fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                              transition: "all 0.15s",
                              border: `2px solid ${active ? (p === "support" ? T.greenBorder : T.redBorder) : T.border}`,
                              background: active ? (p === "support" ? T.greenBg : T.redBg) : "#faf9f6",
                              color: active ? (p === "support" ? T.green : T.red) : T.muted }}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            {p === "support"
                              ? <ThumbsUp size={14} strokeWidth={2.5} />
                              : <ThumbsDown size={14} strokeWidth={2.5} />}
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
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13,
                        lineHeight: 1.6, resize: "none", outline: "none",
                        border: `2px solid ${T.border}`, background: "#faf9f6", color: T.navy,
                        fontFamily: "var(--font-dm-sans)", transition: "border-color 0.2s" }}
                      onFocus={e => { e.target.style.borderColor = T.navyMid; e.target.style.boxShadow = "0 0 0 3px rgba(30,64,128,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }} />
                  </div>

                  {/* Action tabs */}
                  <div>
                    <div style={{ display: "flex", gap: 2, padding: 4, borderRadius: 14,
                      background: "#f1ede5", marginBottom: 12 }}>
                      {([
                        { id: "letter", Icon: Mail,   label: "Write a Letter" },
                        { id: "call",   Icon: Phone,  label: "Call Script"    },
                        { id: "share",  Icon: Share2, label: "Share"          },
                      ] as { id: ActionTab; Icon: React.ElementType; label: string }[]).map(({ id, Icon, label }) => (
                        <button key={id} onClick={() => patch({ actionTab: id })}
                          style={{ flex: 1, padding: "9px 8px", borderRadius: 11, fontSize: 12,
                            fontWeight: 700, cursor: "pointer", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            fontFamily: "var(--font-dm-sans)", transition: "all 0.18s",
                            background: s.actionTab === id ? T.surface : "transparent",
                            color: s.actionTab === id ? T.navy : T.muted,
                            boxShadow: s.actionTab === id ? "0 1px 6px rgba(13,31,60,0.10)" : "none" }}>
                          <Icon size={13} strokeWidth={2} /> {label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* Letter tab */}
                      {s.actionTab === "letter" && (
                        <motion.div key="letter-tab"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <motion.button onClick={handleLetter}
                            disabled={!s.actionRep || s.generatingLetter}
                            style={{ ...primaryBtn, padding: "14px 24px", borderRadius: 14, fontSize: 14,
                              fontWeight: 700, cursor: !s.actionRep || s.generatingLetter ? "not-allowed" : "pointer",
                              opacity: !s.actionRep || s.generatingLetter ? 0.55 : 1,
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 60%, ${T.gold} 140%)`,
                              fontFamily: "var(--font-dm-sans)" }}
                            whileHover={s.actionRep && !s.generatingLetter ? { scale: 1.01, boxShadow: "0 8px 30px rgba(13,31,60,0.32)" } : {}}
                            whileTap={{ scale: 0.98 }}>
                            {s.generatingLetter
                              ? <><Loader2 size={16} className="animate-spin" /> Crafting your letter…</>
                              : <><Mail size={15} strokeWidth={2} /> Generate Letter</>}
                          </motion.button>
                          {s.generatedLetter && (
                            <OutputBox text={s.generatedLetter} copied={s.copied}
                              onCopy={() => handleCopy(s.generatedLetter)}
                              rep={s.actionRep} />
                          )}
                        </motion.div>
                      )}

                      {/* Call script tab */}
                      {s.actionTab === "call" && (
                        <motion.div key="call-tab"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {s.actionRep?.phone && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                              borderRadius: 12, background: T.greenBg, border: `1.5px solid ${T.greenBorder}` }}>
                              <Phone size={15} color={T.green} strokeWidth={2} />
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.green }}>Office phone</div>
                                <a href={`tel:${s.actionRep.phone}`}
                                  style={{ fontSize: 14, fontWeight: 700, color: T.navy, textDecoration: "none" }}>
                                  {s.actionRep.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          <motion.button onClick={handleScript}
                            disabled={!s.actionRep || s.generatingScript}
                            style={{ ...primaryBtn, padding: "14px 24px", borderRadius: 14, fontSize: 14,
                              fontWeight: 700, cursor: !s.actionRep || s.generatingScript ? "not-allowed" : "pointer",
                              opacity: !s.actionRep || s.generatingScript ? 0.55 : 1,
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              fontFamily: "var(--font-dm-sans)" }}
                            whileHover={s.actionRep && !s.generatingScript ? { scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" } : {}}
                            whileTap={{ scale: 0.98 }}>
                            {s.generatingScript
                              ? <><Loader2 size={16} className="animate-spin" /> Writing your script…</>
                              : <><Phone size={15} strokeWidth={2} /> Generate Call Script</>}
                          </motion.button>
                          {s.generatedScript && (
                            <OutputBox text={s.generatedScript} copied={s.copied}
                              onCopy={() => handleCopy(s.generatedScript)}
                              rep={s.actionRep} />
                          )}
                        </motion.div>
                      )}

                      {/* Share tab */}
                      {s.actionTab === "share" && (
                        <motion.div key="share-tab"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ padding: "14px 16px", borderRadius: 12,
                            background: "#faf9f6", border: `1.5px solid ${T.border}`,
                            fontSize: 13, lineHeight: 1.7, color: "#334155",
                            fontFamily: "var(--font-dm-sans)" }}>
                            <strong style={{ color: T.navy }}>
                              {s.selectedBill.type} {s.selectedBill.number} — {s.selectedBill.title}
                            </strong>
                            {s.summaries[s.selectedBill.id] && (
                              <p style={{ marginTop: 6, color: T.muted }}>
                                {s.summaries[s.selectedBill.id].plainEnglish}
                              </p>
                            )}
                            <p style={{ marginTop: 6, color: T.navyMid, fontWeight: 600 }}>
                              civicspark.vercel.app
                            </p>
                          </div>
                          <motion.button onClick={handleShare}
                            style={{ ...primaryBtn, padding: "14px 24px", borderRadius: 14, fontSize: 14,
                              fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                              gap: 8, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
                            whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(13,31,60,0.28)" }}
                            whileTap={{ scale: 0.98 }}>
                            {s.sharedBill
                              ? <><Check size={15} strokeWidth={2.5} /> Copied to clipboard!</>
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

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ textAlign: "center", marginTop: 24, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 12, fontSize: 11, color: "#b0a99a", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Landmark size={11} strokeWidth={2} /> CivicSpark
          </span>
          <span>·</span><span>Congressional App Challenge</span>
          <span>·</span><span>AI by Groq</span>
          <span>·</span><span>Data: Congress.gov</span>
        </motion.div>
      </div>
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function LegislativeTimeline({ stage }: { stage: number }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 5 }}>
        {STAGES.map((st, i) => {
          const filled = i < stage, current = i === stage - 1;
          return (
            <div key={st.short} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{ width: "100%", height: 5, borderRadius: 2,
                  background: filled ? (current ? T.navyMid : T.gold) : "#c8daf5",
                  transition: "background 0.3s" }} />
              </div>
              {i < STAGES.length - 1 && <div style={{ width: 2 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex" }}>
        {STAGES.map((st, i) => {
          const current = i === stage - 1;
          return (
            <div key={st.short} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 9, fontWeight: current ? 800 : 500,
                color: current ? T.navyMid : "#93afd4", letterSpacing: "0.04em",
                textTransform: "uppercase" }}>
                {st.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OutputBox({ text, copied, onCopy, rep }:
  { text: string; copied: boolean; onCopy: () => void; rep: Representative | null }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionLabel>Your Output</SectionLabel>
          <div style={{ display: "flex", gap: 7 }}>
            <motion.button onClick={onCopy}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
                padding: "5px 11px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${T.border}`,
                background: copied ? T.greenBg : "#f4f2ee", color: copied ? T.green : T.muted,
                fontFamily: "var(--font-dm-sans)", transition: "all 0.2s" }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
              {copied ? <><Check size={12} strokeWidth={3} /> Copied!</> : <><Copy size={12} strokeWidth={2} /> Copy</>}
            </motion.button>
            {rep?.contactUrl && (
              <motion.a href={rep.contactUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
                  padding: "5px 11px", borderRadius: 8, textDecoration: "none",
                  background: `linear-gradient(135deg, ${T.navy}, ${T.navyMid})`, color: "white",
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
          background: "#faf9f6", border: `1.5px solid ${T.border}`, color: "#334155", margin: 0 }}>
          {text}
        </pre>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
      color: T.gold, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
      {children}
      {optional && <span style={{ fontWeight: 400, textTransform: "none",
        letterSpacing: 0, fontSize: 11, color: "#b0a99a" }}>(optional)</span>}
    </p>
  );
}

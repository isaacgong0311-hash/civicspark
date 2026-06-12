"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronDown, ExternalLink, ArrowRight,
  Loader2, Mail, Phone, Share2, ThumbsUp, ThumbsDown,
  Check, Copy, BookOpen, BarChart2, Flame, Sparkles,
  Star, Users, Calendar, SlidersHorizontal, Send,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Bill, BillSummary, PassLikelihood, ProsCons, Representative } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";

/* ── Stage config ────────────────────────────────────────────────────────── */
const STAGES = ["Introduced", "In Committee", "Floor Ready", "Passed", "Signed"];

function StageBar({ stage }: { stage: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "stretch" }}>
      {STAGES.map((label, i) => {
        const filled = i < stage;
        const current = i === stage - 1;
        return (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 5, borderRadius: 2,
              background: filled
                ? (current ? "#1e4080" : "#4b7cc4")
                : "#d1d9e6",
              transition: "background 0.3s",
            }} />
            {current && (
              <div style={{
                textAlign: "center", fontSize: 9.5, fontWeight: 700,
                color: "#1e4080", marginTop: 4, letterSpacing: "0.03em",
                fontFamily: "var(--font-dm-sans)",
              }}>
                {label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Party color ─────────────────────────────────────────────────────────── */
function partyDot(party?: string) {
  if (party === "R") return "#ef4444";
  if (party === "D") return "#3b82f6";
  return "#94a3b8";
}

/* ── Bill Card ───────────────────────────────────────────────────────────── */
function BillCard({
  bill, onAction, starred, onStar,
}: {
  bill: Bill;
  onAction: (b: Bill) => void;
  starred: boolean;
  onStar: (id: string) => void;
}) {
  const isNew = bill.urgency === "new";
  const isUrgent = bill.urgency === "urgent";
  const chamber = bill.type.startsWith("S") ? "Senate" : "House";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "white", borderRadius: 12, padding: "18px 20px",
        border: `1.5px solid ${starred ? "#e8c96a" : "#e6e2d8"}`,
        marginBottom: 10,
        boxShadow: starred
          ? "0 2px 8px rgba(184,131,14,0.10)"
          : "0 1px 4px rgba(13,31,60,0.04)",
      }}
      whileHover={{ borderColor: starred ? "#d4a030" : "#c8d8f0", boxShadow: "0 4px 16px rgba(13,31,60,0.08)" }}
      transition={{ duration: 0.15 }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 5,
            background: "#0d1f3c", color: "white", letterSpacing: "0.04em",
          }}>
            {bill.type} {bill.number}
          </span>
          <span style={{ fontSize: 11.5, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
            {chamber}
          </span>
          {bill.cosponsors != null && bill.cosponsors > 0 && (
            <span style={{
              fontSize: 10.5, color: "#7a8699", fontFamily: "var(--font-dm-sans)",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Users size={10} strokeWidth={2} />
              {bill.cosponsors} cosponsor{bill.cosponsors !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(isNew || isUrgent) && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
              letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 3,
              background: isUrgent ? "#fef2f2" : "#f0fdf4",
              color: isUrgent ? "#b91c1c" : "#15803d",
              border: `1px solid ${isUrgent ? "#fca5a5" : "#86efac"}`,
            }}>
              {isUrgent ? <Flame size={9} strokeWidth={2.5} /> : <Sparkles size={9} strokeWidth={2.5} />}
              {isUrgent ? "URGENT" : "NEW"}
            </span>
          )}
          {/* Star / watchlist button */}
          <motion.button
            onClick={e => { e.stopPropagation(); onStar(bill.id); }}
            title={starred ? "Remove from watchlist" : "Save to watchlist"}
            aria-label={starred ? "Remove from watchlist" : "Save to watchlist"}
            aria-pressed={starred}
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 3, color: starred ? "#b8830e" : "#c9d1de",
            }}
          >
            <Star size={15} fill={starred ? "#b8830e" : "none"} strokeWidth={2} />
          </motion.button>
        </div>
      </div>

      {/* Title */}
      <p style={{
        fontSize: 14, fontWeight: 700, color: "#0d1f3c", lineHeight: 1.45,
        marginBottom: 4, fontFamily: "var(--font-dm-sans)",
      }}>
        {bill.title}
      </p>

      {/* Sponsor line */}
      {bill.sponsorName && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          marginBottom: 6, fontSize: 11.5,
          fontFamily: "var(--font-dm-sans)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: partyDot(bill.sponsorParty),
          }} />
          <span style={{ color: "#7a8699" }}>Sponsored by</span>
          <span style={{ color: "#334155", fontWeight: 600 }}>{bill.sponsorName}</span>
          {bill.introducedDate && (
            <span style={{ color: "#9ba8ba", display: "flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
              <Calendar size={9} strokeWidth={2} />
              {bill.introducedDate}
            </span>
          )}
        </div>
      )}

      {/* Latest action */}
      <p style={{ fontSize: 12, color: "#7a8699", marginBottom: 14, lineHeight: 1.5,
        fontFamily: "var(--font-dm-sans)" }}>
        {bill.latestAction}
      </p>

      {/* Stage bar */}
      <div style={{ marginBottom: 14 }}>
        <StageBar stage={bill.stage ?? 1} />
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "#9ba8ba", fontFamily: "var(--font-dm-sans)" }}>
          Last action: {bill.latestActionDate || "—"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={bill.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
              padding: "5px 12px", borderRadius: 7, textDecoration: "none",
              border: "1.5px solid #d1d9e6", color: "#7a8699",
              fontFamily: "var(--font-dm-sans)", background: "white",
            }}>
            <ExternalLink size={11} strokeWidth={2} /> Congress.gov
          </a>
          <motion.button
            onClick={() => onAction(bill)}
            style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
              padding: "5px 14px", borderRadius: 7, cursor: "pointer",
              border: "none", background: "#0d1f3c", color: "white",
              fontFamily: "var(--font-dm-sans)",
            }}
            whileHover={{ background: "#1e4080" }} whileTap={{ scale: 0.97 }}
          >
            Take Action <ArrowRight size={12} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Likelihood meter ────────────────────────────────────────────────────── */
function LikelihoodMeter({ data }: { data: PassLikelihood }) {
  const color = data.percent >= 70 ? "#15803d" : data.percent >= 45 ? "#b8830e" : data.percent >= 20 ? "#c2410c" : "#b91c1c";
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e6e2d8",
      background: "white", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9ba8ba", textTransform: "uppercase",
          letterSpacing: "0.08em", fontFamily: "var(--font-dm-sans)" }}>Pass likelihood</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color }}>{data.percent}%</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
            background: `${color}18`, color }}>{data.label}</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#e6e2d8", overflow: "hidden", marginBottom: 8 }}>
        <motion.div style={{ height: "100%", borderRadius: 3, background: color }}
          initial={{ width: 0 }} animate={{ width: `${data.percent}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <p style={{ fontSize: 11.5, color: "#7a8699", lineHeight: 1.55, margin: 0,
        fontFamily: "var(--font-dm-sans)" }}>{data.rationale}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
        <BarChart2 size={11} color="#9ba8ba" strokeWidth={2} />
        <span style={{ fontSize: 10, color: "#9ba8ba", fontFamily: "var(--font-dm-sans)" }}>
          AI analysis based on bill stage and historical data
        </span>
      </div>
    </div>
  );
}

/* ── Pros/Cons ───────────────────────────────────────────────────────────── */
function ProsConsPanel({ data }: { data: ProsCons }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #86efac" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#15803d", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <ThumbsUp size={10} strokeWidth={2.5} /> Arguments for
          </div>
          {data.pros.map((p, i) => (
            <div key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "#166534",
              display: "flex", gap: 5, marginBottom: i < data.pros.length - 1 ? 6 : 0 }}>
              <span style={{ color: "#22c55e", flexShrink: 0 }}>+</span>{p}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fca5a5" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#b91c1c", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <ThumbsDown size={10} strokeWidth={2.5} /> Arguments against
          </div>
          {data.cons.map((c, i) => (
            <div key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "#991b1b",
              display: "flex", gap: 5, marginBottom: i < data.cons.length - 1 ? 6 : 0 }}>
              <span style={{ color: "#ef4444", flexShrink: 0 }}>−</span>{c}
            </div>
          ))}
        </div>
      </div>
      {(data.supporterView || data.opposerView) && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f8f7f4", border: "1.5px solid #e6e2d8",
          fontSize: 12, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 4 }}>
          {data.supporterView && <p style={{ margin: 0, color: "#166534" }}><strong>Supporters:</strong> {data.supporterView}</p>}
          {data.opposerView && <p style={{ margin: 0, color: "#991b1b" }}><strong>Critics:</strong> {data.opposerView}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Action Drawer ───────────────────────────────────────────────────────── */
type ActionTab = "overview" | "perspectives" | "ask" | "act";
type AskMsg = { role: "user" | "assistant"; content: string };
type ContactTab = "letter" | "call" | "share";

function ActionDrawer({
  bill, reps, onClose,
}: {
  bill: Bill;
  reps: Representative[];
  onClose: () => void;
}) {
  const [infoTab, setInfoTab] = useState<ActionTab>("overview");
  const [contactTab, setContactTab] = useState<ContactTab>("letter");
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [likelihood, setLikelihood] = useState<PassLikelihood | null>(null);
  const [prosCons, setProsCons] = useState<ProsCons | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [actionRep, setActionRep] = useState<Representative | null>(reps[0] ?? null);
  const [position, setPosition] = useState<"support" | "oppose">("support");
  const [note, setNote] = useState("");
  const [letter, setLetter] = useState("");
  const [script, setScript] = useState("");
  const [genLetter, setGenLetter] = useState(false);
  const [genScript, setGenScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [askMsgs, setAskMsgs] = useState<AskMsg[]>([]);
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const askScrollRef = useRef<HTMLDivElement | null>(null);

  // Reset the conversation when switching bills.
  useEffect(() => { setAskMsgs([]); setAskInput(""); }, [bill.id]);

  // Keyboard: close the drawer on Escape (standard dialog behavior).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    askScrollRef.current?.scrollTo({ top: askScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [askMsgs, askLoading]);

  async function handleAsk(question: string) {
    const q = question.trim();
    if (!q || askLoading) return;
    const history = askMsgs;
    setAskMsgs(prev => [...prev, { role: "user", content: q }]);
    setAskInput("");
    setAskLoading(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill, question: q, history }),
      });
      const d = await r.json();
      setAskMsgs(prev => [...prev, {
        role: "assistant",
        content: typeof d.answer === "string" && d.answer
          ? d.answer
          : "Sorry — I couldn't answer that just now. Please try again.",
      }]);
    } catch {
      setAskMsgs(prev => [...prev, {
        role: "assistant",
        content: "Sorry — I couldn't reach the server. Please try again.",
      }]);
    } finally {
      setAskLoading(false);
    }
  }

  useEffect(() => {
    setLoadingSummary(true);
    Promise.allSettled([
      fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill }) }).then(r => r.json()).then(setSummary),
      fetch("/api/likelihood", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill) }).then(r => r.json()).then(setLikelihood),
      fetch("/api/proscons", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill) }).then(r => r.json()).then(setProsCons),
    ]).finally(() => setLoadingSummary(false));
  }, [bill.id]);

  async function handleLetter() {
    if (!actionRep) return;
    setGenLetter(true); setLetter("");
    const r = await fetch("/api/letter", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill, rep: actionRep, position, personalNote: note }) });
    const d = await r.json();
    setLetter(d.letter);
    setGenLetter(false);
  }

  async function handleScript() {
    if (!actionRep) return;
    setGenScript(true); setScript("");
    const r = await fetch("/api/script", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill, rep: actionRep, position, personalNote: note }) });
    const d = await r.json();
    setScript(d.script);
    setGenScript(false);
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const TAB_STYLE = (active: boolean) => ({
    flex: 1, padding: "8px 6px", borderRadius: 9, fontSize: 12, fontWeight: 700,
    cursor: "pointer", border: "none", fontFamily: "var(--font-dm-sans)",
    transition: "all 0.15s",
    background: active ? "white" : "transparent",
    color: active ? "#0d1f3c" : "#9ba8ba",
    boxShadow: active ? "0 1px 4px rgba(13,31,60,0.10)" : "none",
  });

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(6,14,31,0.55)", zIndex: 200 }} />

      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
          background: "#f4f2ee", zIndex: 201, display: "flex", flexDirection: "column",
          overflowY: "auto", boxShadow: "-8px 0 40px rgba(6,14,31,0.2)",
        }}
        role="dialog" aria-modal aria-label={`Take action on ${bill.type} ${bill.number}`}
      >
        {/* Drawer header */}
        <div style={{ background: "#0d1f3c", padding: "20px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
                  background: "rgba(255,255,255,0.12)", color: "white", letterSpacing: "0.04em" }}>
                  {bill.type} {bill.number}
                </span>
                {bill.policyArea && (
                  <span style={{ fontSize: 11, color: "#7a8fa8" }}>{bill.policyArea}</span>
                )}
              </div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 16, fontWeight: 700,
                color: "white", lineHeight: 1.4, margin: 0, maxWidth: 380 }}>
                {bill.title}
              </p>
              {bill.sponsorName && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: partyDot(bill.sponsorParty) }} />
                  <span style={{ fontSize: 11, color: "#8da4c4" }}>{bill.sponsorName}</span>
                  {bill.cosponsors != null && bill.cosponsors > 0 && (
                    <span style={{ fontSize: 11, color: "#6b84a0", display: "flex", alignItems: "center", gap: 3 }}>
                      · <Users size={9} strokeWidth={2} /> {bill.cosponsors} cosponsors
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
                color: "white", padding: 8, borderRadius: 8, flexShrink: 0 }}>
              <X size={17} strokeWidth={2} />
            </button>
          </div>
          {/* Stage bar in header */}
          <StageBar stage={bill.stage ?? 1} />
        </div>

        {/* Tab nav */}
        <div style={{ padding: "14px 24px 0", flexShrink: 0 }}>
          <div role="tablist" style={{ display: "flex", gap: 2, padding: 4, borderRadius: 12,
            background: "#e8e4db" }}>
            {([
              { id: "overview", label: "Overview" },
              { id: "perspectives", label: "Perspectives" },
              { id: "ask", label: "Ask AI" },
              { id: "act", label: "Take Action" },
            ] as { id: ActionTab; label: string }[]).map(({ id, label }) => (
              <button key={id} role="tab" aria-selected={infoTab === id}
                onClick={() => setInfoTab(id)}
                style={TAB_STYLE(infoTab === id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "16px 24px 32px", flex: 1 }}>
          <AnimatePresence mode="wait">

            {/* Overview */}
            {infoTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Label>Plain-English Summary</Label>
                {loadingSummary ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {[1, 0.8, 0.6].map((w, i) => (
                      <div key={i} className="skeleton" style={{ height: 13, width: `${w * 100}%`, borderRadius: 4 }} />
                    ))}
                    <div className="skeleton" style={{ height: 52, borderRadius: 10, marginTop: 4 }} />
                    <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
                  </div>
                ) : summary ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#334155",
                      fontFamily: "var(--font-dm-sans)", margin: 0 }}>
                      {summary.plainEnglish}
                    </p>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fdf3d7",
                      border: "1.5px solid #e8c96a", fontSize: 13, lineHeight: 1.65 }}>
                      <strong style={{ color: "#b8830e" }}>What this means for you — </strong>
                      <span style={{ color: "#6b4f0a" }}>{summary.whatItMeans}</span>
                    </div>
                    {summary.districtImpact && (
                      <div style={{ padding: "12px 14px", borderRadius: 10, background: "#dce8f8",
                        border: "1.5px solid #b3cff0", fontSize: 13, lineHeight: 1.65 }}>
                        <strong style={{ color: "#1e4080" }}>District impact — </strong>
                        <span style={{ color: "#1e3a6e" }}>{summary.districtImpact}</span>
                      </div>
                    )}
                  </div>
                ) : null}

                <Label>Pass Likelihood</Label>
                {likelihood
                  ? <LikelihoodMeter data={likelihood} />
                  : <div className="skeleton" style={{ height: 90, borderRadius: 12, marginBottom: 12 }} />}

                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <a href={bill.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                      color: "#1e4080", textDecoration: "none", fontFamily: "var(--font-dm-sans)" }}>
                    <BookOpen size={13} strokeWidth={2} /> Read full bill on Congress.gov
                  </a>
                </div>
              </motion.div>
            )}

            {/* Perspectives */}
            {infoTab === "perspectives" && (
              <motion.div key="perspectives" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Label>Balanced Perspectives</Label>
                {prosCons
                  ? <ProsConsPanel data={prosCons} />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[1,1,1,1,1,1].map((_,i) => <div key={i} className="skeleton" style={{ height: 14, width: `${90-i*6}%`, borderRadius: 4 }} />)}
                    </div>}
                <p style={{ fontSize: 11, color: "#9ba8ba", textAlign: "center", marginTop: 12,
                  fontStyle: "italic", fontFamily: "var(--font-dm-sans)" }}>
                  AI-generated perspectives. Nonpartisan — not CivicSpark&apos;s views.
                </p>
              </motion.div>
            )}

            {/* Ask AI */}
            {infoTab === "ask" && (
              <motion.div key="ask" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Label>Ask about this bill</Label>

                {/* Message stream */}
                <div ref={askScrollRef}
                  style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12,
                    maxHeight: 320, overflowY: "auto", paddingRight: 2 }}>
                  {askMsgs.length === 0 && !askLoading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#64748b",
                        fontFamily: "var(--font-dm-sans)", margin: "0 0 4px" }}>
                        Get answers grounded in this bill&apos;s official record. Try:
                      </p>
                      {[
                        "What problem is this bill trying to solve?",
                        "Who would this affect the most?",
                        "What stage is it at, and what happens next?",
                      ].map(s => (
                        <button key={s} onClick={() => handleAsk(s)}
                          style={{ textAlign: "left", padding: "9px 12px", borderRadius: 10,
                            border: "1.5px solid #e2ddd2", background: "white", cursor: "pointer",
                            fontSize: 12.5, color: "#334155", fontFamily: "var(--font-dm-sans)",
                            fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                          <Sparkles size={12} strokeWidth={2} color="#b8830e" /> {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {askMsgs.map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%", padding: "10px 13px", borderRadius: 13,
                      fontSize: 13, lineHeight: 1.6, fontFamily: "var(--font-dm-sans)",
                      whiteSpace: "pre-wrap",
                      background: m.role === "user" ? "#0d1f3c" : "white",
                      color: m.role === "user" ? "white" : "#334155",
                      border: m.role === "user" ? "none" : "1.5px solid #e2ddd2",
                      borderBottomRightRadius: m.role === "user" ? 4 : 13,
                      borderBottomLeftRadius: m.role === "assistant" ? 4 : 13,
                    }}>
                      {m.content}
                    </div>
                  ))}

                  {askLoading && (
                    <div style={{ alignSelf: "flex-start", padding: "10px 13px", borderRadius: 13,
                      background: "white", border: "1.5px solid #e2ddd2", display: "flex",
                      alignItems: "center", gap: 7, color: "#9ba8ba", fontSize: 12.5,
                      fontFamily: "var(--font-dm-sans)" }}>
                      <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Thinking…
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={e => { e.preventDefault(); handleAsk(askInput); }}
                  style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <input value={askInput} onChange={e => setAskInput(e.target.value)}
                    placeholder="Ask anything about this bill…"
                    aria-label="Ask a question about this bill"
                    style={{ flex: 1, padding: "11px 14px", borderRadius: 11, border: "1.5px solid #e2ddd2",
                      fontSize: 13, fontFamily: "var(--font-dm-sans)", background: "white",
                      color: "#0d1f3c", outline: "none" }} />
                  <button type="submit" disabled={!askInput.trim() || askLoading}
                    aria-label="Send question"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center",
                      width: 44, borderRadius: 11, border: "none", flexShrink: 0,
                      background: !askInput.trim() || askLoading ? "#c5cdd8" : "#0d1f3c",
                      color: "white", cursor: !askInput.trim() || askLoading ? "default" : "pointer",
                      transition: "background 0.15s" }}>
                    <Send size={16} strokeWidth={2} />
                  </button>
                </form>
                <p style={{ fontSize: 11, color: "#9ba8ba", textAlign: "center", marginTop: 10,
                  fontStyle: "italic", fontFamily: "var(--font-dm-sans)" }}>
                  AI answers are grounded in this bill&apos;s record — verify details on Congress.gov.
                </p>
              </motion.div>
            )}

            {/* Take Action */}
            {infoTab === "act" && (
              <motion.div key="act" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Rep selector */}
                {reps.length > 0 ? (
                  <div>
                    <Label>Contact</Label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {reps.map(r => {
                        const active = actionRep?.name === r.name;
                        const party = r.party === "R" ? "#ef4444" : r.party === "D" ? "#3b82f6" : "#94a3b8";
                        return (
                          <motion.button key={r.name} onClick={() => setActionRep(r)}
                            aria-pressed={active}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "10px 13px", borderRadius: 10, cursor: "pointer",
                              border: `2px solid ${active ? "#1e4080" : "#e6e2d8"}`,
                              background: active ? "#dce8f8" : "white",
                              fontFamily: "var(--font-dm-sans)", transition: "all 0.14s",
                            }}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: party, flexShrink: 0 }} />
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0d1f3c" }}>
                                  {r.chamber === "Senate" ? "Sen." : "Rep."} {r.name}
                                </div>
                                <div style={{ fontSize: 11, color: "#7a8699" }}>
                                  {r.party === "R" ? "Republican" : r.party === "D" ? "Democrat" : "Independent"}
                                  {" · "}{r.chamber}{r.district ? ` · District ${r.district}` : ""}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {r.phone && (
                                <a href={`tel:${r.phone}`} onClick={e => e.stopPropagation()}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
                                    borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: "none",
                                    background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
                                  <Phone size={10} strokeWidth={2.5} /> {r.phone}
                                </a>
                              )}
                              {active && (
                                <div style={{ width: 20, height: 20, borderRadius: "50%",
                                  background: "#0d1f3c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Check size={10} color="white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "#fdf3d7",
                    border: "1.5px solid #e8c96a", fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ margin: 0, color: "#6b4f0a" }}>
                      <strong style={{ color: "#b8830e" }}>Find your representatives first.</strong>{" "}
                      <a href="/representatives" style={{ color: "#1e4080", fontWeight: 600 }}>
                        Enter your ZIP code →
                      </a>{" "}
                      to see who represents you and contact them directly.
                    </p>
                  </div>
                )}

                {/* Position */}
                <div>
                  <Label>Your Position</Label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["support", "oppose"] as const).map(p => {
                      const active = position === p;
                      return (
                        <motion.button key={p} onClick={() => setPosition(p)} aria-pressed={active}
                          style={{
                            flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13,
                            fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-dm-sans)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "all 0.14s",
                            border: `2px solid ${active ? (p === "support" ? "#86efac" : "#fca5a5") : "#e6e2d8"}`,
                            background: active ? (p === "support" ? "#f0fdf4" : "#fef2f2") : "white",
                            color: active ? (p === "support" ? "#15803d" : "#b91c1c") : "#7a8699",
                          }}
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
                  <Label optional>Personal Note</Label>
                  <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                    placeholder="A personal story makes your message far more persuasive."
                    style={{
                      width: "100%", padding: "10px 13px", borderRadius: 10, fontSize: 13,
                      lineHeight: 1.6, resize: "none", outline: "none", border: "1.5px solid #e6e2d8",
                      background: "white", color: "#0d1f3c", fontFamily: "var(--font-dm-sans)",
                    }}
                    onFocus={e => { e.target.style.borderColor = "#1e4080"; }}
                    onBlur={e => { e.target.style.borderColor = "#e6e2d8"; }} />
                </div>

                {/* Contact tabs */}
                <div>
                  <div role="tablist" style={{ display: "flex", gap: 2, padding: 4, borderRadius: 10,
                    background: "#e8e4db", marginBottom: 10 }}>
                    {([
                      { id: "letter", Icon: Mail, label: "Letter" },
                      { id: "call", Icon: Phone, label: "Call Script" },
                      { id: "share", Icon: Share2, label: "Share" },
                    ] as { id: ContactTab; Icon: ElementType; label: string }[]).map(({ id, Icon, label }) => (
                      <button key={id} role="tab" aria-selected={contactTab === id}
                        onClick={() => setContactTab(id)}
                        style={{
                          ...TAB_STYLE(contactTab === id),
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        }}>
                        <Icon size={12} strokeWidth={2} /> {label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {contactTab === "letter" && (
                      <motion.div key="letter" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <motion.button onClick={handleLetter} disabled={!actionRep || genLetter}
                          style={{
                            padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            border: "none", cursor: !actionRep || genLetter ? "not-allowed" : "pointer",
                            opacity: !actionRep || genLetter ? 0.6 : 1,
                            background: "linear-gradient(135deg, #0d1f3c, #1e4080 60%, #b8830e 140%)",
                            color: "white", fontFamily: "var(--font-dm-sans)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                          }}
                          whileHover={actionRep && !genLetter ? { scale: 1.01 } : {}} whileTap={{ scale: 0.98 }}>
                          {genLetter ? <><Loader2 size={15} className="animate-spin" /> Crafting letter…</> : <><Mail size={14} strokeWidth={2} /> Generate Letter</>}
                        </motion.button>
                        {letter && <OutputBox text={letter} copied={copied} onCopy={() => handleCopy(letter)} rep={actionRep} />}
                      </motion.div>
                    )}

                    {contactTab === "call" && (
                      <motion.div key="call" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {actionRep?.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px",
                            borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                            <Phone size={14} color="#15803d" strokeWidth={2} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Office phone</div>
                              <a href={`tel:${actionRep.phone}`}
                                style={{ fontSize: 15, fontWeight: 700, color: "#0d1f3c", textDecoration: "none" }}>
                                {actionRep.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        <motion.button onClick={handleScript} disabled={!actionRep || genScript}
                          style={{
                            padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            border: "none", cursor: !actionRep || genScript ? "not-allowed" : "pointer",
                            opacity: !actionRep || genScript ? 0.6 : 1,
                            background: "#0d1f3c", color: "white", fontFamily: "var(--font-dm-sans)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                          }}
                          whileHover={actionRep && !genScript ? { scale: 1.01 } : {}} whileTap={{ scale: 0.98 }}>
                          {genScript ? <><Loader2 size={15} className="animate-spin" /> Writing script…</> : <><Phone size={14} strokeWidth={2} /> Generate Call Script</>}
                        </motion.button>
                        {script && <OutputBox text={script} copied={copied} onCopy={() => handleCopy(script)} rep={actionRep} />}
                      </motion.div>
                    )}

                    {contactTab === "share" && (
                      <motion.div key="share" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ padding: "13px 15px", borderRadius: 10, background: "white",
                          border: "1.5px solid #e6e2d8", fontSize: 13, lineHeight: 1.7, color: "#334155" }}>
                          <strong style={{ color: "#0d1f3c" }}>{bill.type} {bill.number} — {bill.title}</strong>
                          <p style={{ marginTop: 6, color: "#7a8699", marginBottom: 6 }}>{bill.latestAction}</p>
                          <span style={{ color: "#1e4080", fontWeight: 600 }}>civicspark.vercel.app</span>
                        </div>
                        <motion.button
                          onClick={async () => {
                            const text = `${bill.type} ${bill.number} — ${bill.title}\n\n${bill.latestAction}\n\nLearn more: https://civicspark.vercel.app/bills`;
                            await navigator.clipboard.writeText(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                            border: "none", cursor: "pointer", background: "#0d1f3c", color: "white",
                            fontFamily: "var(--font-dm-sans)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                          }}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                          {copied ? <><Check size={14} strokeWidth={2.5} /> Copied!</> : <><Share2 size={14} strokeWidth={2} /> Copy Shareable Summary</>}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}

function OutputBox({ text, copied, onCopy, rep }: {
  text: string; copied: boolean; onCopy: () => void; rep: Representative | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7 }}>
        <button onClick={onCopy}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
            padding: "4px 11px", borderRadius: 7, cursor: "pointer", border: "1.5px solid #e6e2d8",
            background: copied ? "#f0fdf4" : "white", color: copied ? "#15803d" : "#7a8699",
            fontFamily: "var(--font-dm-sans)", transition: "all 0.18s" }}>
          {copied ? <><Check size={11} strokeWidth={3} /> Copied</> : <><Copy size={11} strokeWidth={2} /> Copy</>}
        </button>
        {rep?.contactUrl && (
          <a href={rep.contactUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
              padding: "4px 11px", borderRadius: 7, textDecoration: "none",
              background: "#0d1f3c", color: "white", fontFamily: "var(--font-dm-sans)" }}>
            <ExternalLink size={11} strokeWidth={2} /> Send
          </a>
        )}
      </div>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.7, padding: "14px 16px",
        borderRadius: 10, fontFamily: "var(--font-dm-sans)", background: "white",
        border: "1.5px solid #e6e2d8", color: "#334155", margin: 0 }}>
        {text}
      </pre>
    </div>
  );
}

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "#b8830e", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
      {children}
      {optional && <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11,
        color: "#9ba8ba", letterSpacing: 0 }}>(optional)</span>}
    </p>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* Main page                                                                    */
/* ════════════════════════════════════════════════════════════════════════════ */

/* ── Reusable filter panel content (used in both sidebar + mobile drawer) ─── */
function FilterPanelContent({
  chamber, setChamber, stages, toggleStage, policies, togglePolicy, policyAreas,
}: {
  chamber: "all" | "house" | "senate";
  setChamber: (v: "all" | "house" | "senate") => void;
  stages: Set<number>;
  toggleStage: (s: number) => void;
  policies: Set<string>;
  togglePolicy: (p: string) => void;
  policyAreas: [string, number][];
}) {
  const SECTION = { marginBottom: 24 };
  const TITLE = {
    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#7a8699",
    textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "var(--font-dm-sans)",
  };
  return (
    <>
      <div style={SECTION}>
        <p style={TITLE}>Chamber</p>
        {([
          { val: "all", label: "All chambers" },
          { val: "house", label: "House (HR/HRES)" },
          { val: "senate", label: "Senate (S/SRES)" },
        ] as { val: typeof chamber; label: string }[]).map(({ val, label }) => (
          <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            cursor: "pointer", fontSize: 13, color: "#334155", fontFamily: "var(--font-dm-sans)" }}>
            <input type="radio" name="chamber-filter" checked={chamber === val}
              onChange={() => setChamber(val)} style={{ accentColor: "#1e4080" }} />
            {label}
          </label>
        ))}
      </div>
      <div style={SECTION}>
        <p style={TITLE}>Legislative Stage</p>
        {STAGES.map((label, i) => (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            cursor: "pointer", fontSize: 13, color: "#334155", fontFamily: "var(--font-dm-sans)" }}>
            <input type="checkbox" checked={stages.has(i + 1)}
              onChange={() => toggleStage(i + 1)} style={{ accentColor: "#1e4080" }} />
            {label}
          </label>
        ))}
      </div>
      {policyAreas.length > 0 && (
        <div>
          <p style={TITLE}>Policy Area</p>
          {policyAreas.map(([area, count]) => (
            <label key={area} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              cursor: "pointer", fontSize: 12.5, color: "#334155", fontFamily: "var(--font-dm-sans)" }}>
              <input type="checkbox" checked={policies.has(area)}
                onChange={() => togglePolicy(area)} style={{ accentColor: "#1e4080", flexShrink: 0 }} />
              <span style={{ flex: 1, lineHeight: 1.35 }}>
                {POLICY_ICONS[area] ?? "📋"} {area}
              </span>
              <span style={{ fontSize: 11, color: "#9ba8ba", fontWeight: 600 }}>{count}</span>
            </label>
          ))}
        </div>
      )}
    </>
  );
}

const POLICY_ICONS: Record<string, string> = {
  "Housing and Community Development": "🏠",
  "Environmental Protection": "🌿",
  "Health": "❤️",
  "Education": "📚",
  "Economics and Public Finance": "💼",
  "Taxation": "💼",
  "Armed Forces and National Security": "🛡️",
  "Science, Technology, Communications": "💻",
  "Transportation and Public Works": "🚌",
  "Agriculture and Food": "🌾",
  "Energy": "⚡",
  "Immigration": "🗺️",
  "Crime and Law Enforcement": "⚖️",
  "Social Welfare": "🤝",
  "Finance and Financial Sector": "🏦",
  "Government Operations and Politics": "🏛️",
  "International Affairs": "🌐",
  "Labor and Employment": "👷",
};

type SortOption = "recent" | "stage-asc" | "stage-desc" | "cosponsors";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Bill[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [chamber, setChamber] = useState<"all" | "house" | "senate">("all");
  const [stages, setStages] = useState<Set<number>>(new Set());
  const [policies, setPolicies] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortOption>("recent");
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/api/bills/all")
      .then(r => r.json())
      .then(d => { setBills(d.bills); setLive(d.live); })
      .finally(() => setLoading(false));

    // Load reps from sessionStorage
    try {
      const saved = sessionStorage.getItem("civicspark_reps");
      if (saved) {
        const d = JSON.parse(saved);
        setReps(d.representatives ?? []);
      }
    } catch { /* ignore */ }

    // Load watchlist from localStorage
    try {
      const wl = localStorage.getItem("civicspark_watchlist");
      if (wl) setWatchlist(new Set(JSON.parse(wl)));
    } catch { /* ignore */ }
  }, []);

  // Debounced server-side search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (search.length >= 3) {
      setSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/bills/search?q=${encodeURIComponent(search)}&limit=30`);
          const d = await res.json();
          setSearchResults(d.bills ?? []);
          if (d.live) setLive(true);
        } catch { /* ignore */ } finally {
          setSearching(false);
        }
      }, 500);
    } else {
      setSearchResults(null);
      setSearching(false);
    }

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("civicspark_watchlist", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Compute policy area counts from the base pool
  const policyAreas = useMemo(() => {
    const map = new Map<string, number>();
    bills.forEach(b => {
      if (b.policyArea) map.set(b.policyArea, (map.get(b.policyArea) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [bills]);

  // Determine base pool: server search results, watchlist, or full bill list
  const basePool = useMemo(() => {
    if (showWatchlist) return bills.filter(b => watchlist.has(b.id));
    if (searchResults !== null) return searchResults;
    return bills;
  }, [bills, showWatchlist, searchResults, watchlist]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = basePool.filter(b => {
      // Client-side text filter only when NOT using server search results
      if (search && searchResults === null && !showWatchlist) {
        const q = search.toLowerCase();
        if (!b.title.toLowerCase().includes(q) &&
            !`${b.type} ${b.number}`.toLowerCase().includes(q) &&
            !(b.policyArea ?? "").toLowerCase().includes(q)) return false;
      }
      if (chamber === "house" && b.type.startsWith("S")) return false;
      if (chamber === "senate" && !b.type.startsWith("S")) return false;
      if (stages.size > 0 && !stages.has(b.stage ?? 1)) return false;
      if (policies.size > 0 && !policies.has(b.policyArea ?? "")) return false;
      return true;
    });
    if (sort === "stage-asc") result = [...result].sort((a, b) => (a.stage ?? 1) - (b.stage ?? 1));
    if (sort === "stage-desc") result = [...result].sort((a, b) => (b.stage ?? 1) - (a.stage ?? 1));
    if (sort === "cosponsors") result = [...result].sort((a, b) => (b.cosponsors ?? 0) - (a.cosponsors ?? 0));
    return result;
  }, [basePool, search, searchResults, showWatchlist, chamber, stages, policies, sort]);

  function toggleStage(s: number) {
    setStages(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }
  function togglePolicy(p: string) {
    setPolicies(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content">
      {/* Page header */}
      <div style={{ background: "#0d1f3c", padding: isMobile ? "20px 16px" : "24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700,
            color: "white", marginBottom: 10 }}>
            Bills &amp; Legislation
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, color: "#8da4c4", fontFamily: "var(--font-dm-sans)" }}>
                119th Congress · 2nd Session
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#8da4c4",
                fontFamily: "var(--font-dm-sans)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
                {live ? "Live — Congress.gov" : "Sample data"}
              </div>
              <span style={{ fontSize: 12.5, color: "#8da4c4", fontFamily: "var(--font-dm-sans)" }}>
                {loading ? "Loading…" : `${bills.length} bills tracked`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Watchlist toggle */}
              <motion.button
                onClick={() => { setShowWatchlist(v => !v); setSearch(""); setSearchResults(null); }}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${showWatchlist ? "#e8c96a" : "rgba(255,255,255,0.18)"}`,
                  cursor: "pointer",
                  background: showWatchlist ? "rgba(184,131,14,0.15)" : "transparent",
                  color: showWatchlist ? "#fde68a" : "#8da4c4",
                  fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: 6,
                }}
                whileHover={{ borderColor: "#e8c96a", color: "#fde68a" }} whileTap={{ scale: 0.97 }}
              >
                <Star size={13} fill={showWatchlist ? "#fde68a" : "none"} strokeWidth={2} />
                Watchlist {watchlist.size > 0 && `(${watchlist.size})`}
              </motion.button>
              <motion.button
                onClick={() => setActiveBill(filtered[0] ?? null)}
                style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer", background: "#b8830e", color: "white",
                  fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 10px rgba(184,131,14,0.3)" }}>
                Take Action →
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: "white", borderBottom: "1px solid #e6e2d8", padding: isMobile ? "0 16px" : "0 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
            {searching
              ? <Loader2 size={16} color="#9ba8ba" strokeWidth={2} style={{ flexShrink: 0, animation: "spin 1s linear infinite" }} />
              : <Search size={16} color="#9ba8ba" strokeWidth={2} style={{ flexShrink: 0 }} />
            }
            <input
              type="text" value={search}
              onChange={e => { setSearch(e.target.value); if (showWatchlist) setShowWatchlist(false); }}
              placeholder="Search all bills by title, bill number, or policy area — powered by Congress.gov"
              style={{ flex: 1, fontSize: 14, border: "none", outline: "none", background: "transparent",
                color: "#0d1f3c", fontFamily: "var(--font-dm-sans)" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setSearchResults(null); }}
                aria-label="Clear search"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ba8ba" }}>
                <X size={14} strokeWidth={2} />
              </button>
            )}
            {search.length > 0 && search.length < 3 && (
              <span style={{ fontSize: 11, color: "#9ba8ba", fontFamily: "var(--font-dm-sans)", whiteSpace: "nowrap" }}>
                Type {3 - search.length} more…
              </span>
            )}
            {searchResults !== null && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1e4080",
                fontFamily: "var(--font-dm-sans)", whiteSpace: "nowrap" }}>
                Congress.gov ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: isMobile ? "16px 16px" : "24px 28px",
        flex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
        gap: isMobile ? 16 : 28,
        alignItems: "start",
      }}>

        {/* Mobile filter button */}
        {isMobile && (
          <motion.button
            onClick={() => setFiltersOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: "1.5px solid #e6e2d8", background: "white", color: "#334155",
              fontFamily: "var(--font-dm-sans)", width: "100%",
            }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal size={14} strokeWidth={2} color="#1e4080" />
            Filters
            {(stages.size > 0 || policies.size > 0 || chamber !== "all") && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px",
                borderRadius: 99, background: "#0d1f3c", color: "white" }}>
                {stages.size + policies.size + (chamber !== "all" ? 1 : 0)} active
              </span>
            )}
          </motion.button>
        )}

        {/* Mobile filter drawer overlay */}
        <AnimatePresence>
          {isMobile && filtersOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setFiltersOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(6,14,31,0.5)", zIndex: 200 }} />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
                  background: "white", borderRadius: "16px 16px 0 0",
                  padding: "20px 20px 40px", maxHeight: "80vh", overflowY: "auto",
                  boxShadow: "0 -8px 40px rgba(6,14,31,0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#0d1f3c",
                    fontFamily: "var(--font-dm-sans)", margin: 0 }}>Filter Results</p>
                  <button onClick={() => setFiltersOpen(false)}
                    aria-label="Close filters"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ba8ba" }}>
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
                <FilterPanelContent
                  chamber={chamber} setChamber={setChamber}
                  stages={stages} toggleStage={toggleStage}
                  policies={policies} togglePolicy={togglePolicy}
                  policyAreas={policyAreas}
                />
                <motion.button
                  onClick={() => setFiltersOpen(false)}
                  style={{ width: "100%", marginTop: 20, padding: "12px", borderRadius: 10,
                    fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                    background: "#0d1f3c", color: "white", fontFamily: "var(--font-dm-sans)" }}
                  whileTap={{ scale: 0.98 }}>
                  Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar filters — desktop only */}
        {!isMobile && (
          <aside style={{ background: "white", borderRadius: 14, padding: "20px",
            border: "1.5px solid #e6e2d8", position: "sticky", top: 110 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#0d1f3c",
              textTransform: "uppercase", marginBottom: 20, fontFamily: "var(--font-dm-sans)" }}>
              Filter Results
            </p>
            <FilterPanelContent
              chamber={chamber} setChamber={setChamber}
              stages={stages} toggleStage={toggleStage}
              policies={policies} togglePolicy={togglePolicy}
              policyAreas={policyAreas}
            />
          </aside>
        )}

        {/* Bill list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#334155",
                fontFamily: "var(--font-dm-sans)" }}>
                {loading ? "Loading bills…" : showWatchlist
                  ? `${filtered.length} saved bill${filtered.length !== 1 ? "s" : ""}`
                  : searchResults !== null
                    ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} from Congress.gov`
                    : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                }
              </span>
              {showWatchlist && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99,
                  background: "#fdf3d7", color: "#b8830e", border: "1px solid #e8c96a",
                  fontWeight: 600, fontFamily: "var(--font-dm-sans)" }}>
                  ★ Watchlist
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>Sort:</span>
              <div style={{ position: "relative" }}>
                <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
                  style={{ fontSize: 12.5, fontWeight: 600, color: "#0d1f3c", border: "1.5px solid #e6e2d8",
                    borderRadius: 8, padding: "5px 28px 5px 10px", background: "white", cursor: "pointer",
                    outline: "none", fontFamily: "var(--font-dm-sans)", appearance: "none" }}>
                  <option value="recent">Most Recent</option>
                  <option value="stage-desc">Most Advanced</option>
                  <option value="stage-asc">Earliest Stage</option>
                  <option value="cosponsors">Most Cosponsors</option>
                </select>
                <ChevronDown size={13} strokeWidth={2} color="#7a8699"
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
              ))}
            </div>
          ) : showWatchlist && filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8699",
              fontFamily: "var(--font-dm-sans)" }}>
              <Star size={36} strokeWidth={1.5} color="#d1d9e6" style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Your watchlist is empty</p>
              <p style={{ fontSize: 13 }}>Click the ★ on any bill to save it here for quick access.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8699",
              fontFamily: "var(--font-dm-sans)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No bills match your filters</p>
              <p style={{ fontSize: 13 }}>Try adjusting your search or clearing some filters</p>
            </div>
          ) : (
            filtered.map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                onAction={setActiveBill}
                starred={watchlist.has(bill.id)}
                onStar={toggleWatchlist}
              />
            ))
          )}
        </div>
      </div>
      </main>

      {/* Action drawer */}
      <AnimatePresence>
        {activeBill && (
          <ActionDrawer
            bill={activeBill}
            reps={reps}
            onClose={() => setActiveBill(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

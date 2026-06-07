"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, ExternalLink, ArrowRight, Loader2,
  ChevronDown, ChevronUp, BookOpen, Landmark, Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Representative, Bill, MemberDetail } from "@/lib/types";

function partyColor(party: string) {
  if (party === "R") return "#ef4444";
  if (party === "D") return "#3b82f6";
  return "#94a3b8";
}

function partyLabel(party: string) {
  if (party === "R") return "Republican";
  if (party === "D") return "Democrat";
  return "Independent";
}

/* ── Mini stage bar ──────────────────────────────────────────────────────── */
const STAGES = ["Intro", "Cmte", "Floor", "Passed", "Law"];
function MiniStageBar({ stage }: { stage: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {STAGES.map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < stage ? "#1e4080" : "#d1d9e6",
        }} />
      ))}
    </div>
  );
}

/* ── Recent legislation mini card ────────────────────────────────────────── */
function MiniLegislationCard({ bill }: { bill: Bill }) {
  return (
    <a
      href={bill.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <motion.div
        whileHover={{ borderColor: "#c8d8f0", background: "#f9f8f6" }}
        style={{
          padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e6e2d8",
          background: "white", marginBottom: 6, cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 4,
            background: "#0d1f3c", color: "white", letterSpacing: "0.04em",
          }}>
            {bill.type} {bill.number}
          </span>
          {bill.urgency === "urgent" && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "#b91c1c",
              background: "#fef2f2", border: "1px solid #fca5a5",
              padding: "1px 5px", borderRadius: 4 }}>URGENT</span>
          )}
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#0d1f3c", lineHeight: 1.4,
          margin: "0 0 6px", fontFamily: "var(--font-dm-sans)" }}>
          {bill.title}
        </p>
        <div style={{ marginBottom: 4 }}>
          <MiniStageBar stage={bill.stage ?? 1} />
        </div>
        <p style={{ fontSize: 11, color: "#9ba8ba", margin: 0, fontFamily: "var(--font-dm-sans)" }}>
          {bill.latestActionDate || "—"} · {bill.policyArea ?? "General"}
        </p>
      </motion.div>
    </a>
  );
}

/* ── Rep Card ────────────────────────────────────────────────────────────── */
function RepCard({ rep }: { rep: Representative }) {
  const [showLegislation, setShowLegislation] = useState(false);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailLoaded, setDetailLoaded] = useState(false);

  async function handleToggleLegislation() {
    if (!showLegislation && !detailLoaded && rep.bioguideId) {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/member/${rep.bioguideId}`);
        if (res.ok) {
          const data: MemberDetail = await res.json();
          setMemberDetail(data);
        }
      } catch { /* ignore */ } finally {
        setLoadingDetail(false);
        setDetailLoaded(true);
      }
    }
    setShowLegislation(v => !v);
  }

  const pc = partyColor(rep.party);
  const hasPhoto = !!rep.photoUrl;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "white", borderRadius: 16, padding: "24px 28px",
        border: "1.5px solid #e6e2d8", boxShadow: "0 2px 8px rgba(13,31,60,0.06)" }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Photo or letter avatar */}
          <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, overflow: "hidden",
            border: `2px solid ${pc}44`, position: "relative" }}>
            {hasPhoto ? (
              <img
                src={rep.photoUrl}
                alt={rep.name}
                width={56}
                height={56}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.style.background = `linear-gradient(135deg, ${pc}22, ${pc}44)`;
                    parent.style.display = "flex";
                    parent.style.alignItems = "center";
                    parent.style.justifyContent = "center";
                    parent.innerHTML = `<span style="font-size:22px;font-weight:700;color:${pc};font-family:var(--font-playfair)">${rep.name.split(" ").pop()?.charAt(0) ?? "?"}</span>`;
                  }
                }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: `linear-gradient(135deg, ${pc}22, ${pc}44)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: pc,
                  fontFamily: "var(--font-playfair)" }}>
                  {rep.name.split(" ").pop()?.charAt(0) ?? "?"}
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 19, fontWeight: 700,
              color: "#0d1f3c", marginBottom: 4 }}>
              {rep.chamber === "Senate" ? "Sen." : "Rep."} {rep.name}
            </h3>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 5,
                background: `${pc}18`, color: pc }}>
                {partyLabel(rep.party)}
              </span>
              <span style={{ fontSize: 12, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
                {rep.chamber} · {rep.state}{rep.district ? ` · District ${rep.district}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Congress.gov profile link */}
        {rep.bioguideId && (
          <a
            href={`https://www.congress.gov/member/${rep.name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ +/g, "-")}/${rep.bioguideId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#7a8699", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-dm-sans)" }}
          >
            <Landmark size={11} strokeWidth={2} /> Profile
          </a>
        )}
      </div>

      {/* Action links */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {rep.phone && (
          <a href={`tel:${rep.phone}`} style={{ display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none",
            background: "#f0fdf4", border: "1.5px solid #86efac", color: "#15803d",
            fontFamily: "var(--font-dm-sans)" }}>
            <Phone size={13} strokeWidth={2} /> {rep.phone}
          </a>
        )}
        <a href={rep.contactUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none",
            background: "#0d1f3c", color: "white", fontFamily: "var(--font-dm-sans)" }}>
          <ExternalLink size={13} strokeWidth={2} /> Contact Page
        </a>
        <a href="/bills" style={{ display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none",
          background: "#f4f2ee", border: "1.5px solid #e6e2d8", color: "#1e4080",
          fontFamily: "var(--font-dm-sans)" }}>
          <ArrowRight size={13} strokeWidth={2} /> Browse bills
        </a>

        {/* Recent legislation toggle — only show if bioguideId exists */}
        {rep.bioguideId && (
          <motion.button
            onClick={handleToggleLegislation}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${showLegislation ? "#1e4080" : "#e6e2d8"}`,
              background: showLegislation ? "#dce8f8" : "white",
              color: showLegislation ? "#1e4080" : "#7a8699",
              cursor: "pointer", fontFamily: "var(--font-dm-sans)",
            }}
            whileHover={{ borderColor: "#1e4080", color: "#1e4080" }}
            whileTap={{ scale: 0.97 }}
          >
            {loadingDetail ? (
              <><Loader2 size={13} className="animate-spin" strokeWidth={2} /> Loading…</>
            ) : (
              <>
                <BookOpen size={13} strokeWidth={2} />
                Recent legislation
                {showLegislation ? <ChevronUp size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Recent legislation expandable section */}
      <AnimatePresence>
        {showLegislation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1.5px solid #e6e2d8", paddingTop: 14, marginTop: 2 }}>
              {memberDetail ? (
                <>
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Users size={12} strokeWidth={2} color="#9ba8ba" />
                      <span style={{ fontSize: 12, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
                        <strong style={{ color: "#0d1f3c" }}>{memberDetail.sponsoredCount.toLocaleString()}</strong> bills sponsored
                      </span>
                    </div>
                    {memberDetail.website && (
                      <a href={memberDetail.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#1e4080", fontFamily: "var(--font-dm-sans)",
                          textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        <ExternalLink size={11} strokeWidth={2} /> Official website
                      </a>
                    )}
                  </div>

                  {/* Recent bills */}
                  {memberDetail.recentBills.length > 0 ? (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                        color: "#9ba8ba", textTransform: "uppercase",
                        marginBottom: 8, fontFamily: "var(--font-dm-sans)" }}>
                        Recently sponsored
                      </p>
                      {memberDetail.recentBills.map(bill => (
                        <MiniLegislationCard key={bill.id} bill={bill} />
                      ))}
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
                      No recent legislation data available.
                    </p>
                  )}
                </>
              ) : detailLoaded ? (
                <p style={{ fontSize: 13, color: "#7a8699", fontFamily: "var(--font-dm-sans)", padding: "8px 0" }}>
                  Legislation data requires a Congress API key. Add CONGRESS_API_KEY to .env.local.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 70, borderRadius: 8 }} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Inner component that uses useSearchParams — must be inside Suspense ─── */
function RepresentativesContent() {
  const params = useSearchParams();
  const initialZip = params.get("zip") ?? "";
  const [zip, setZip] = useState(initialZip);
  const [input, setInput] = useState(initialZip);
  const [reps, setReps] = useState<Representative[]>([]);
  const [state, setState] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialZip) {
      fetchReps(initialZip);
    } else {
      try {
        const saved = sessionStorage.getItem("civicspark_reps");
        if (saved) {
          const d = JSON.parse(saved);
          setReps(d.representatives ?? []);
          setState(d.state ?? "");
          setZip(d.zip ?? "");
          setInput(d.zip ?? "");
          setLive(d.live ?? false);
          setSearched(true);
        }
      } catch { /* ignore */ }
    }
  }, [initialZip]);

  async function fetchReps(z: string) {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: z }),
      });
      const d = await r.json();
      setReps(d.representatives ?? []);
      setState(d.state ?? "");
      setZip(z);
      setLive(d.live ?? false);
      sessionStorage.setItem("civicspark_reps", JSON.stringify({ ...d, zip: z }));
      setSearched(true);
    } catch {
      setError("Couldn't look up that ZIP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(input.trim())) { setError("Enter a valid 5-digit ZIP."); return; }
    fetchReps(input.trim());
  }

  return (
    <>
      {/* ZIP form header */}
      <div style={{ background: "#0d1f3c", padding: "28px 28px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700,
            color: "white", marginBottom: 6 }}>
            My Representatives
          </h1>
          <p style={{ fontSize: 13, color: "#6b84a0", marginBottom: 18, fontFamily: "var(--font-dm-sans)" }}>
            Enter your ZIP code to find your House representative and two U.S. Senators.
          </p>
          <form onSubmit={handleSubmit}
            style={{ display: "flex", gap: 10, maxWidth: 420, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                color: "#4b6b9e", pointerEvents: "none" }}>
                <MapPin size={16} strokeWidth={1.8} />
              </div>
              <input type="text" inputMode="numeric" maxLength={5} placeholder="ZIP code"
                value={input} onChange={e => { setInput(e.target.value.replace(/\D/g, "")); setError(""); }}
                style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                  fontSize: 14, borderRadius: 9, outline: "none",
                  background: "rgba(255,255,255,0.08)", border: `1.5px solid ${error ? "#fca5a5" : "rgba(255,255,255,0.14)"}`,
                  color: "white", fontFamily: "var(--font-dm-sans)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(184,131,14,0.6)"; }}
                onBlur={e => { e.target.style.borderColor = error ? "#fca5a5" : "rgba(255,255,255,0.14)"; }} />
            </div>
            <button type="submit" disabled={loading || input.length < 5}
              style={{ padding: "11px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                border: "none", cursor: loading || input.length < 5 ? "not-allowed" : "pointer",
                opacity: loading || input.length < 5 ? 0.65 : 1,
                background: "#b8830e", color: "white", fontFamily: "var(--font-dm-sans)",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Looking up…</>
                : "Find My Reps"}
            </button>
          </form>
          {error && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px", flex: 1, width: "100%" }}>
        {!searched && !loading && (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "#7a8699",
            fontFamily: "var(--font-dm-sans)" }}>
            <MapPin size={40} strokeWidth={1.5} color="#d1d9e6" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Enter your ZIP code above</p>
            <p style={{ fontSize: 13 }}>We&apos;ll find your House rep and two Senators instantly.</p>
          </div>
        )}
        {searched && reps.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#7a8699", fontFamily: "var(--font-dm-sans)", margin: 0 }}>
                Showing {reps.length} representative{reps.length !== 1 ? "s" : ""} for ZIP {zip}{state ? ` (${state})` : ""}
              </p>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                fontFamily: "var(--font-dm-sans)",
                background: live ? "#f0fdf4" : "#f8f7f4",
                color: live ? "#15803d" : "#7a8699",
                border: `1px solid ${live ? "#86efac" : "#e6e2d8"}`,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%",
                  background: live ? "#22c55e" : "#94a3b8" }} />
                {live ? "Live from Congress.gov" : "Curated data"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reps.map(r => <RepCard key={r.name} rep={r} />)}
            </div>

            {/* Tip box */}
            <div style={{ marginTop: 28, padding: "16px 20px", borderRadius: 12,
              background: "#fdf3d7", border: "1.5px solid #e8c96a",
              display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Landmark size={18} color="#b8830e" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0d1f3c", marginBottom: 4 }}>
                  Ready to contact them?
                </p>
                <p style={{ fontSize: 12.5, color: "#6b4f0a", lineHeight: 1.6, margin: 0 }}>
                  Browse bills on the{" "}
                  <a href="/bills" style={{ color: "#1e4080", fontWeight: 600 }}>Bills &amp; Legislation</a>{" "}
                  page and use the <strong>Take Action</strong> button to generate a personalized letter
                  or call script addressed directly to your representatives.
                </p>
              </div>
            </div>
          </>
        )}
        {searched && reps.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8699",
            fontFamily: "var(--font-dm-sans)" }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No representatives found for that ZIP.</p>
            <p style={{ fontSize: 13 }}>Try a different ZIP code or check back later.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function RepresentativesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <Suspense fallback={
        <div style={{ background: "#0d1f3c", padding: "28px", flex: 1 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="skeleton" style={{ height: 32, width: 280, borderRadius: 8, marginBottom: 16,
              background: "rgba(255,255,255,0.08)" }} />
            <div className="skeleton" style={{ height: 44, width: 360, borderRadius: 9,
              background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      }>
        <RepresentativesContent />
      </Suspense>
    </div>
  );
}

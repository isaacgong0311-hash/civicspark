"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Phone, ExternalLink, ArrowRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Representative } from "@/lib/types";

function partyColor(party: string) {
  if (party === "R") return "#ef4444";
  if (party === "D") return "#3b82f6";
  return "#94a3b8";
}

function RepCard({ rep }: { rep: Representative }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "white", borderRadius: 16, padding: "24px 28px",
        border: "1.5px solid #e6e2d8", boxShadow: "0 2px 8px rgba(13,31,60,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12,
            background: `linear-gradient(135deg, ${partyColor(rep.party)}22, ${partyColor(rep.party)}44)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${partyColor(rep.party)}44`, flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: partyColor(rep.party),
              fontFamily: "var(--font-playfair)" }}>
              {rep.name.split(" ").pop()?.charAt(0) ?? "?"}
            </span>
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700,
              color: "#0d1f3c", marginBottom: 4 }}>
              {rep.chamber === "Senate" ? "Sen." : "Rep."} {rep.name}
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                background: `${partyColor(rep.party)}18`, color: partyColor(rep.party) }}>
                {rep.party === "R" ? "Republican" : rep.party === "D" ? "Democrat" : "Independent"}
              </span>
              <span style={{ fontSize: 12, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
                {rep.chamber} · {rep.state}{rep.district ? ` · District ${rep.district}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
      </div>
    </motion.div>
  );
}

/* Inner component that uses useSearchParams — must be inside Suspense */
function RepresentativesContent() {
  const params = useSearchParams();
  const initialZip = params.get("zip") ?? "";
  const [zip, setZip] = useState(initialZip);
  const [input, setInput] = useState(initialZip);
  const [reps, setReps] = useState<Representative[]>([]);
  const [state, setState] = useState("");
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
            color: "white", marginBottom: 18 }}>
            My Representatives
          </h1>
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
                : "Find"}
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
            <p style={{ fontSize: 13, color: "#7a8699", marginBottom: 20, fontFamily: "var(--font-dm-sans)" }}>
              Showing representatives for ZIP {zip}{state ? ` (${state})` : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reps.map(r => <RepCard key={r.name} rep={r} />)}
            </div>
          </>
        )}
        {searched && reps.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8699",
            fontFamily: "var(--font-dm-sans)" }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No representatives found for that ZIP.</p>
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
            <div className="skeleton" style={{ height: 32, width: 240, borderRadius: 8, marginBottom: 16,
              background: "rgba(255,255,255,0.08)" }} />
          </div>
        </div>
      }>
        <RepresentativesContent />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Shield, Zap, Database, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import type { Bill } from "@/lib/types";
import { MOCK_BILLS } from "@/lib/congress";

const STAGE_LABELS = ["Intro", "Cmte", "Floor", "Passed", "Law"];
const STAGE_COLORS = ["#4b6bab", "#2d5fa6", "#1e4080", "#b8830e", "#15803d"];

function MiniStageBar({ stage }: { stage: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {STAGE_LABELS.map((label, i) => {
        const filled = i < stage;
        const current = i === stage - 1;
        return (
          <div key={label} style={{ flex: 1, position: "relative" }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: filled ? (current ? "#1e4080" : "#b8830e") : "#e2ddd4",
            }} />
            {current && (
              <div style={{
                position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)",
                fontSize: 7.5, fontWeight: 700, color: "#1e4080",
                letterSpacing: "0.04em", textTransform: "uppercase",
                whiteSpace: "nowrap", fontFamily: "var(--font-dm-sans)",
              }}>
                {STAGE_LABELS[i]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FeaturedBillCard({ bill }: { bill: Bill }) {
  const router = useRouter();
  const isNew = bill.urgency === "new";
  const isUrgent = bill.urgency === "urgent";

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(13,31,60,0.12)" }}
      onClick={() => router.push(`/bills?highlight=${bill.id}`)}
      style={{
        background: "white", borderRadius: 14, padding: "18px 20px",
        border: "1.5px solid #e6e2d8", cursor: "pointer",
        boxShadow: "0 2px 8px rgba(13,31,60,0.06)", transition: "all 0.18s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
            background: "#0d1f3c", color: "white", letterSpacing: "0.04em",
          }}>
            {bill.type} {bill.number}
          </span>
          <span style={{ fontSize: 11, color: "#7a8699" }}>
            {bill.type.startsWith("S") ? "Senate" : "House"}
          </span>
        </div>
        {(isNew || isUrgent) && (
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
            background: isUrgent ? "#fef2f2" : "#f0fdf4",
            color: isUrgent ? "#b91c1c" : "#15803d",
            border: `1px solid ${isUrgent ? "#fca5a5" : "#86efac"}`,
            letterSpacing: "0.04em",
          }}>
            ✦ {isUrgent ? "URGENT" : "NEW"}
          </span>
        )}
      </div>
      <p style={{
        fontSize: 13.5, fontWeight: 700, color: "#0d1f3c", lineHeight: 1.45,
        marginBottom: 14, fontFamily: "var(--font-dm-sans)",
      }}>
        {bill.title}
      </p>
      <div style={{ marginBottom: 10 }}>
        <MiniStageBar stage={bill.stage ?? 1} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <span style={{ fontSize: 11, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
          Last action: {bill.latestActionDate || "—"}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: "#1e4080",
          fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: 3,
        }}>
          Take Action <ChevronRight size={12} strokeWidth={2.5} />
        </span>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleZip(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip.trim())) { setError("Enter a valid 5-digit ZIP code."); return; }
    setError("");
    setLoading(true);
    try {
      const r = await fetch("/api/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: zip.trim() }),
      });
      const d = await r.json();
      // Store reps in sessionStorage, navigate to representatives page
      sessionStorage.setItem("civicspark_reps", JSON.stringify(d));
      router.push(`/representatives?zip=${zip.trim()}`);
    } catch {
      setError("Couldn't look up that ZIP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show 4 featured bills from mock data for the preview
  const featured = MOCK_BILLS.slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, #060e1f 0%, #0d1f3c 60%, #0f2548 100%)",
        padding: "72px 28px 80px", position: "relative", overflow: "hidden",
      }}>
        {/* Ambient orbs */}
        <div style={{
          position: "absolute", top: -100, right: -100, width: 500, height: 500,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(184,131,14,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80, width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(30,64,128,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center",
        }}>
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px",
              borderRadius: 99, background: "rgba(184,131,14,0.12)", border: "1px solid rgba(184,131,14,0.3)",
              marginBottom: 24,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c",
                letterSpacing: "0.08em", fontFamily: "var(--font-dm-sans)", textTransform: "uppercase" }}>
                Live from Congress.gov
              </span>
            </div>

            <h1 style={{
              fontFamily: "var(--font-playfair)", fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: 16,
            }}>
              Know what Congress<br />is voting on.
            </h1>
            <h2 style={{
              fontFamily: "var(--font-playfair)", fontSize: "clamp(36px, 4.5vw, 58px)",
              fontWeight: 700, color: "#b8830e", lineHeight: 1.1, marginBottom: 28,
              fontStyle: "italic",
            }}>
              Do something about it.
            </h2>
            <p style={{
              fontSize: 17, color: "#8da4c4", lineHeight: 1.7, maxWidth: 480,
              fontFamily: "var(--font-dm-sans)", marginBottom: 32,
            }}>
              CivicSpark pulls live bills from Congress.gov, explains them in plain English,
              and connects you to the three federal representatives who vote on your behalf.
              Enter a ZIP code to get started.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Nonpartisan", "Live from Congress.gov", "All 50 states"].map(label => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 7,
                  fontSize: 13, color: "#8da4c4", fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#b8830e", flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: ZIP card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 20, padding: "32px 28px", minWidth: 340, maxWidth: 380,
              backdropFilter: "blur(12px)",
            }}
          >
            <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 22,
              fontWeight: 700, color: "white", marginBottom: 6 }}>
              Find your representatives
            </h3>
            <p style={{ fontSize: 13, color: "#6b7e9c", marginBottom: 24,
              fontFamily: "var(--font-dm-sans)", lineHeight: 1.6 }}>
              Your House rep and two Senators, identified by ZIP.
            </p>

            <form onSubmit={handleZip} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: "#4b6b9e", pointerEvents: "none",
                }}>
                  <MapPin size={16} strokeWidth={1.8} />
                </div>
                <input
                  type="text" inputMode="numeric" maxLength={5}
                  placeholder="e.g. 10001, 90210, 78701"
                  value={zip}
                  onChange={e => { setZip(e.target.value.replace(/\D/g, "")); setError(""); }}
                  style={{
                    width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 13, paddingBottom: 13,
                    fontSize: 15, borderRadius: 10, outline: "none",
                    background: "rgba(255,255,255,0.07)", border: `1.5px solid ${error ? "#fca5a5" : "rgba(255,255,255,0.13)"}`,
                    color: "white", fontFamily: "var(--font-dm-sans)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(184,131,14,0.6)"; }}
                  onBlur={e => { e.target.style.borderColor = error ? "#fca5a5" : "rgba(255,255,255,0.13)"; }}
                />
              </div>
              {error && (
                <p style={{ color: "#fca5a5", fontSize: 12, margin: 0 }}>{error}</p>
              )}
              <motion.button
                type="submit"
                disabled={loading || zip.length < 5}
                style={{
                  padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: "none", cursor: loading || zip.length < 5 ? "not-allowed" : "pointer",
                  opacity: loading || zip.length < 5 ? 0.6 : 1,
                  background: "linear-gradient(135deg, #b8830e, #d4a030)",
                  color: "white", fontFamily: "var(--font-dm-sans)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 16px rgba(184,131,14,0.35)",
                }}
                whileHover={zip.length === 5 ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Looking up…" : <>Find My Representatives <ArrowRight size={16} strokeWidth={2.5} /></>}
              </motion.button>
            </form>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1, marginTop: 24, background: "rgba(255,255,255,0.07)",
              borderRadius: 10, overflow: "hidden",
            }}>
              {[
                { n: "3", label: "federal reps" },
                { n: "50", label: "states" },
                { n: "Free", label: "always" },
              ].map(({ n, label }) => (
                <div key={label} style={{
                  padding: "14px 8px", textAlign: "center",
                  background: "rgba(255,255,255,0.03)",
                }}>
                  <div style={{ fontFamily: "var(--font-playfair)", fontSize: 22,
                    fontWeight: 700, color: "white", marginBottom: 2 }}>{n}</div>
                  <div style={{ fontSize: 10.5, color: "#6b7e9c",
                    fontFamily: "var(--font-dm-sans)", letterSpacing: "0.03em" }}>{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#0d1f3c", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "14px 28px",
          display: "flex", gap: 32, alignItems: "center", justifyContent: "center",
        }}>
          {[
            { Icon: Shield, text: "100% nonpartisan — no political agenda" },
            { Icon: Database, text: "Live data from Congress.gov API" },
            { Icon: Zap, text: "AI summaries powered by Groq" },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#5b6e8c", fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>
              <Icon size={13} strokeWidth={2} color="#b8830e" /> {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured bills ────────────────────────────────────────────────── */}
      <section style={{ background: "#f4f2ee", padding: "60px 28px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline",
            justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 30,
                fontWeight: 700, color: "#0d1f3c", marginBottom: 6 }}>
                Currently before the 119th Congress
              </h2>
              <p style={{ fontSize: 13.5, color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
                Live from Congress.gov — enter your ZIP to see bills matched to your interests
              </p>
            </div>
            <a href="/bills" style={{
              fontSize: 13, fontWeight: 700, color: "#1e4080",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
              fontFamily: "var(--font-dm-sans)", flexShrink: 0,
            }}>
              Browse all bills <ChevronRight size={14} strokeWidth={2.5} />
            </a>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
          }}>
            {featured.map(bill => (
              <FeaturedBillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section style={{ background: "white", padding: "64px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 28,
            fontWeight: 700, color: "#0d1f3c", textAlign: "center", marginBottom: 48 }}>
            Your voice in Congress — made simple
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { n: "01", title: "Enter your ZIP", desc: "We identify your House representative and two Senators — the three people who vote on federal laws in your name." },
              { n: "02", title: "Explore live bills", desc: "Browse legislation matched to your interests. Plain-English summaries, balanced perspectives, and pass likelihood estimates — all AI-powered." },
              { n: "03", title: "Take action", desc: "Generate a personalized letter or call script for your representatives. Share bills with friends. Make your voice heard." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ padding: "28px 24px", borderRadius: 16, background: "#f4f2ee",
                border: "1.5px solid #e6e2d8" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: 36, fontWeight: 700,
                  color: "#e6e2d8", marginBottom: 12 }}>{n}</div>
                <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 19,
                  fontWeight: 700, color: "#0d1f3c", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: "#7a8699", lineHeight: 1.7,
                  fontFamily: "var(--font-dm-sans)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#060e1f", padding: "24px 28px", marginTop: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6,
              background: "linear-gradient(135deg, #1e4080, #2563c4)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            </div>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 14,
              fontWeight: 700, color: "white" }}>CivicSpark</span>
            <span style={{ fontSize: 11, color: "#4b5f7a",
              fontFamily: "var(--font-dm-sans)" }}>· Congressional App Challenge 2025–26</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#4b5f7a",
            fontFamily: "var(--font-dm-sans)" }}>
            <span>AI by Groq</span>
            <span>·</span>
            <span>Data: Congress.gov</span>
            <span>·</span>
            <span>Nonpartisan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

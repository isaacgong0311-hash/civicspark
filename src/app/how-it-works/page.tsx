"use client";

import { motion } from "framer-motion";
import {
  MapPin, BookOpen, Mail, BarChart2, Scale, Users,
  Code2, Database, Cpu, Globe, Layers, Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

const STEPS = [
  {
    n: "01", Icon: MapPin,
    title: "Enter your ZIP",
    desc: "We query the Congress.gov Members API by state and district to return your House representative and two Senators with live profile data, party affiliation, and official contact information.",
  },
  {
    n: "02", Icon: BookOpen,
    title: "Explore live bills",
    desc: "Bills are fetched in real time from the Congress.gov REST API (v3), sorted by update date, and enriched with legislative stage inference, sponsor data, cosponsor counts, and policy area classification.",
  },
  {
    n: "03", Icon: BarChart2,
    title: "AI pass likelihood",
    desc: "A large language model (Llama 3.3-70B via Groq) analyzes each bill's stage, policy area, sponsor history, and cosponsor count to estimate its probability of becoming law with a rationale.",
  },
  {
    n: "04", Icon: Scale,
    title: "Balanced perspectives",
    desc: "The same LLM generates three arguments for and three against every bill, plus representative quotes from supporters and critics — all designed to be strictly nonpartisan.",
  },
  {
    n: "05", Icon: Mail,
    title: "AI-drafted contact",
    desc: "Enter your position and an optional personal note. The model drafts a constituent letter or phone call script specifically addressed to your selected representative — no form-letter language.",
  },
  {
    n: "06", Icon: Users,
    title: "Share & engage",
    desc: "Copy a shareable plain-English summary of any bill to your clipboard. Star bills to your watchlist (saved in localStorage). Every feature works without creating an account.",
  },
];

const TECH_STACK = [
  {
    Icon: Layers,
    name: "Next.js 16 (App Router)",
    desc: "Full-stack React framework with server components, API routes, Turbopack bundler, and edge-ready deployment on Vercel.",
  },
  {
    Icon: Code2,
    name: "TypeScript (strict)",
    desc: "Strict-mode TypeScript throughout — shared types across API routes and React components, zero any-casts.",
  },
  {
    Icon: Database,
    name: "Congress.gov API v3",
    desc: "Official U.S. Congress REST API providing live bill data, member profiles, sponsored legislation, cosponsor counts, and full-text search.",
  },
  {
    Icon: Cpu,
    name: "Groq + Llama 3.3-70B",
    desc: "Meta's Llama 3.3 (70B) served via Groq's low-latency inference API. Powers summaries, pros/cons, pass likelihood, letters, and call scripts — all in parallel via Promise.allSettled.",
  },
  {
    Icon: Zap,
    name: "Framer Motion",
    desc: "Spring-physics animations for the action drawer, page transitions, skeleton loaders, and micro-interactions throughout the UI.",
  },
  {
    Icon: Globe,
    name: "Vercel",
    desc: "Production deployment with edge CDN, automatic HTTPS, environment variable management, and preview deployments per commit.",
  },
];

export default function HowItWorksPage() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content">
      {/* Header */}
      <div style={{ background: "#0d1f3c", padding: isMobile ? "36px 20px 44px" : "48px 28px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: isMobile ? 30 : 40, fontWeight: 700,
            color: "white", marginBottom: 14 }}>
            How CivicSpark Works
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "#8da4c4", maxWidth: 520, margin: "0 auto",
            lineHeight: 1.7, fontFamily: "var(--font-dm-sans)" }}>
            From ZIP code to constituent letter in under a minute.
            No account required. Always free. Always nonpartisan.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "36px 20px" : "56px 28px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 24,
        }}>
          {STEPS.map(({ n, Icon, title, desc }, i) => (
            <motion.div key={n}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: "easeOut" }}
              style={{ background: "white", borderRadius: 16, padding: "28px 26px",
                border: "1.5px solid #e6e2d8", boxShadow: "0 2px 8px rgba(13,31,60,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, #0d1f3c, #1e4080)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color="white" strokeWidth={1.8} />
                </div>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 32, fontWeight: 700,
                  color: "#e6e2d8" }}>{n}</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 19, fontWeight: 700,
                color: "#0d1f3c", marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: "#7a8699", lineHeight: 1.7,
                fontFamily: "var(--font-dm-sans)", margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Tech Stack ───────────────────────────────────────────────────── */}
        <div style={{ marginTop: isMobile ? 48 : 72 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px",
              borderRadius: 99, background: "#dce8f8", border: "1px solid #b3cff0",
              marginBottom: 14,
            }}>
              <Code2 size={13} strokeWidth={2} color="#1e4080" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1e4080",
                letterSpacing: "0.08em", fontFamily: "var(--font-dm-sans)", textTransform: "uppercase" }}>
                Technical Stack
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: isMobile ? 24 : 28,
              fontWeight: 700, color: "#0d1f3c", marginBottom: 10 }}>
              Built for complexity, designed for clarity
            </h2>
            <p style={{ fontSize: 14, color: "#7a8699", maxWidth: 520, margin: "0 auto",
              lineHeight: 1.7, fontFamily: "var(--font-dm-sans)" }}>
              Six technologies working together — real government data, live AI inference,
              and a full-stack TypeScript application deployed at the edge.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}>
            {TECH_STACK.map(({ Icon, name, desc }, i) => (
              <motion.div key={name}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                style={{
                  background: "white", borderRadius: 14, padding: "22px 22px",
                  border: "1.5px solid #e6e2d8",
                  display: "flex", alignItems: "flex-start", gap: 14,
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #dce8f8, #b3cff0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color="#1e4080" strokeWidth={1.8} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13.5, fontWeight: 700,
                    color: "#0d1f3c", marginBottom: 5 }}>{name}</h4>
                  <p style={{ fontSize: 12.5, color: "#7a8699", lineHeight: 1.65,
                    fontFamily: "var(--font-dm-sans)", margin: 0 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 56, padding: isMobile ? "36px 20px" : "48px 28px",
          background: "#0d1f3c", borderRadius: 20 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: isMobile ? 22 : 28, fontWeight: 700,
            color: "white", marginBottom: 14 }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: 14, color: "#8da4c4", marginBottom: 28,
            fontFamily: "var(--font-dm-sans)" }}>
            Find your representatives and explore live legislation in under 30 seconds.
          </p>
          <Link href="/bills" style={{ display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            textDecoration: "none", background: "#b8830e", color: "white",
            fontFamily: "var(--font-dm-sans)", boxShadow: "0 4px 18px rgba(184,131,14,0.35)" }}>
            Browse Bills →
          </Link>
        </div>
      </div>
      </main>
    </div>
  );
}

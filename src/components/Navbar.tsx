"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, BookMarked } from "lucide-react";

const NAV_LINKS = [
  { href: "/bills", label: "Bills & Legislation" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/representatives", label: "My Representatives" },
];

export default function Navbar() {
  const path = usePathname();

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {/* Ticker */}
      <div style={{ background: "#030c1a", borderBottom: "1px solid rgba(184,131,14,0.25)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "5px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontSize: 10, letterSpacing: "0.12em", color: "#6b7a96",
            fontFamily: "var(--font-dm-sans)", textTransform: "uppercase",
          }}>
            119th Congress · 2nd Session · Washington, D.C.
          </span>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "#6b7a96",
              fontFamily: "var(--font-dm-sans)", textTransform: "uppercase" }}>
              Nonpartisan
            </span>
            <span style={{ color: "rgba(184,131,14,0.4)", fontSize: 10 }}>|</span>
            <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 10, letterSpacing: "0.1em", color: "#6b7a96",
                fontFamily: "var(--font-dm-sans)", textTransform: "uppercase", textDecoration: "none" }}>
              Congress.gov ↗
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background: "#0d1f3c", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 28px",
          display: "flex", alignItems: "center", height: 60, gap: 32,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #1e4080, #2563c4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Landmark size={16} color="white" strokeWidth={1.9} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 700, color: "white", lineHeight: 1.1 }}>
                CivicSpark
              </div>
              <div style={{ fontSize: 8.5, color: "#5b6e8c", letterSpacing: "0.07em",
                textTransform: "uppercase", fontFamily: "var(--font-dm-sans)" }}>
                Congressional App Challenge 2025–26
              </div>
            </div>
          </Link>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 2 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link key={href} href={href} style={{
                  padding: "6px 13px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                  textDecoration: "none", fontFamily: "var(--font-dm-sans)",
                  color: active ? "white" : "#7a8fa8",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  transition: "all 0.15s",
                  borderBottom: active ? "2px solid #b8830e" : "2px solid transparent",
                }}>
                  {label}
                </Link>
              );
            })}
            <Link href="/bills" style={{
              padding: "6px 13px", borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              textDecoration: "none", fontFamily: "var(--font-dm-sans)", color: "#7a8fa8",
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
              borderBottom: "2px solid transparent",
            }}>
              <BookMarked size={13} strokeWidth={2} /> Watchlist
            </Link>
          </div>

          {/* CTA */}
          <Link href="/bills" style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            textDecoration: "none", background: "#b8830e", color: "white",
            fontFamily: "var(--font-dm-sans)", flexShrink: 0,
            boxShadow: "0 2px 10px rgba(184,131,14,0.35)",
          }}>
            Get Started →
          </Link>
        </div>
      </nav>
    </header>
  );
}

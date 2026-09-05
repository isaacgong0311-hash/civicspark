import Seal from "@/components/Seal";
import { useIsMobile } from "@/hooks/useIsMobile";

/* Shared site footer — attribution (data/AI sources) + brand mark. Rendered at
   the bottom of every top-level page so it's not just a homepage-only detail. */
export default function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer style={{ background: "#060e1f", padding: "24px 20px", marginTop: "auto" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Seal size={22} />
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 14,
            fontWeight: 700, color: "white" }}>CivicSpark</span>
          <span style={{ fontSize: 11, color: "#4b5f7a",
            fontFamily: "var(--font-dm-sans)" }}>· Congressional App Challenge 2025–26</span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#4b5f7a",
          fontFamily: "var(--font-dm-sans)", flexWrap: "wrap" }}>
          <span>AI by Groq (GPT-OSS-120B)</span>
          <span>·</span>
          <span>Data: Congress.gov API v3</span>
          <span>·</span>
          <span>Built with Next.js 16 &amp; TypeScript</span>
        </div>
      </div>
    </footer>
  );
}

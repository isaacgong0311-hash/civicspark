import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f2ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 18,
          border: "1.5px solid #e6e2d8",
          boxShadow: "0 4px 24px rgba(13,31,60,0.08)",
          padding: "40px 36px",
          maxWidth: 460,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            margin: "0 auto 20px",
            background: "linear-gradient(135deg, #1e4080, #2563c4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Compass size={26} color="white" strokeWidth={2} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 44,
            fontWeight: 800,
            color: "#e6e2d8",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 24,
            fontWeight: 700,
            color: "#0d1f3c",
            marginBottom: 10,
          }}
        >
          We couldn&apos;t find that page
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#7a8699",
            lineHeight: 1.7,
            fontFamily: "var(--font-dm-sans)",
            marginBottom: 28,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Let&apos;s get you back to exploring legislation.
        </p>
        <Link
          href="/bills"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            background: "#b8830e",
            color: "white",
            fontFamily: "var(--font-dm-sans)",
            boxShadow: "0 4px 18px rgba(184,131,14,0.35)",
          }}
        >
          Browse Bills <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging without crashing the app.
    console.error("CivicSpark caught an error:", error);
  }, [error]);

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
            background: "linear-gradient(135deg, #b8830e, #d49a1f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={26} color="white" strokeWidth={2} />
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
          Something went wrong
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
          We hit an unexpected error — this can happen if a live data source is
          briefly unavailable. You can try again, or head back home.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: "#0d1f3c",
              color: "white",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            <RotateCcw size={15} strokeWidth={2.2} /> Try again
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              background: "#efece4",
              color: "#0d1f3c",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            <Home size={15} strokeWidth={2.2} /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

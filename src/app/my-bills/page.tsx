"use client";

import { useState, useEffect, useMemo, useCallback, type ElementType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, BookOpen, Mail, Phone, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Bill } from "@/lib/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  getImpact, getWatchlist, toggleWatchlistId, getWatchlistUpdateDetails,
  type ImpactStats,
} from "@/lib/activity";
import { STAGE_LABELS, stageName } from "@/lib/stages";
import { postJSON } from "@/lib/fetchJSON";

function StageTimeline({ stage }: { stage?: number }) {
  const current = stage ?? 1;
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {STAGE_LABELS.map((label, i) => {
        const filled = i < current;
        const isCurrent = i === current - 1;
        return (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 5, borderRadius: 3,
              background: filled ? (isCurrent ? "#1e4080" : "#4b7cc4") : "#d1d9e6",
            }} />
            <div style={{
              fontSize: 8.5, marginTop: 4, textAlign: "center",
              fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#1e4080" : "#9ba8ba",
              fontFamily: "var(--font-dm-sans)",
            }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImpactStat({ icon: Icon, value, label }: { icon: ElementType; value: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: "white",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} strokeWidth={2} color="#1e4080" />
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "#0d1f3c", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 10.5, color: "#5b6577", fontFamily: "var(--font-dm-sans)" }}>{label}</div>
      </div>
    </div>
  );
}

export default function MyBillsPage() {
  const isMobile = useIsMobile();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [impact, setImpact] = useState<ImpactStats>({ letters: 0, calls: 0, billsExplored: [] });

  useEffect(() => {
    // Resolve tracked bills directly by id rather than filtering a paginated
    // "recent bills" pool — otherwise a bill starred from search (or simply
    // pushed off the recent page by newer bills) would silently vanish here.
    const ids = [...getWatchlist()];
    setWatchlist(new Set(ids));
    setImpact(getImpact());

    if (ids.length === 0) {
      setBills([]);
      setLoading(false);
      return;
    }
    postJSON<{ bills: Bill[] }>("/api/bills/by-ids", { ids })
      .then(d => setBills(d?.bills ?? []))
      .finally(() => setLoading(false));
  }, []);

  const trackedBills = useMemo(() => bills.filter(b => watchlist.has(b.id)), [bills, watchlist]);
  const updates = useMemo(() => getWatchlistUpdateDetails(bills, watchlist), [bills, watchlist]);
  const updatesByBillId = useMemo(() => new Map(updates.map(u => [u.bill.id, u])), [updates]);

  const removeFromTracking = useCallback((id: string) => {
    setWatchlist(prev => toggleWatchlistId(id, prev));
  }, []);

  const hasActivity = impact.letters > 0 || impact.calls > 0 || impact.billsExplored.length > 0 || watchlist.size > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main id="main-content">
        {/* Header */}
        <div style={{ background: "#0d1f3c", padding: isMobile ? "20px 16px" : "24px 28px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, fontWeight: 700, color: "white", marginBottom: 8 }}>
              My Bills
            </h1>
            <p style={{ fontSize: 13.5, color: "#8da4c4", fontFamily: "var(--font-dm-sans)", margin: 0 }}>
              Bills you&apos;re tracking, and the civic actions you&apos;ve taken — stored in this browser, nothing shared.
            </p>
          </div>
        </div>

        {/* Impact strip — always visible, with an inviting empty state */}
        <div style={{ background: "#eef3fb", borderBottom: "1px solid #d7e3f5" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "16px" : "20px 28px" }}>
            {hasActivity ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 16 : 28 }}>
                <ImpactStat icon={Star} value={watchlist.size} label={`bill${watchlist.size !== 1 ? "s" : ""} watched`} />
                <ImpactStat icon={BookOpen} value={impact.billsExplored.length} label={`bill${impact.billsExplored.length !== 1 ? "s" : ""} explored`} />
                <ImpactStat icon={Mail} value={impact.letters} label={`letter${impact.letters !== 1 ? "s" : ""} sent`} />
                <ImpactStat icon={Phone} value={impact.calls} label={`call script${impact.calls !== 1 ? "s" : ""}`} />
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: "#1e4080", fontFamily: "var(--font-dm-sans)", margin: 0 }}>
                You haven&apos;t taken any civic action yet.{" "}
                <Link href="/bills" style={{ fontWeight: 700, color: "#0d1f3c" }}>Browse bills →</Link>{" "}
                and star one to start tracking it here.
              </p>
            )}
          </div>
        </div>

        {/* Tracked bills */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "20px 16px 60px" : "28px 28px 72px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />)}
            </div>
          ) : trackedBills.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#7a8699", fontFamily: "var(--font-dm-sans)" }}>
              <Star size={40} strokeWidth={1.5} color="#d1d9e6" style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#0d1f3c" }}>
                You&apos;re not tracking any bills yet
              </p>
              <p style={{ fontSize: 13.5, marginBottom: 20 }}>
                Star a bill on the Bills page and it&apos;ll show up here with its progress.
              </p>
              <Link href="/bills" style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px",
                borderRadius: 10, background: "#0d1f3c", color: "white", textDecoration: "none",
                fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-dm-sans)",
              }}>
                Browse Bills <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {trackedBills.map(bill => {
                const update = updatesByBillId.get(bill.id);
                return (
                  <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "white", borderRadius: 14, padding: "20px 22px",
                      border: `1.5px solid ${update ? "#e8c96a" : "#e6e2d8"}`,
                      boxShadow: update ? "0 2px 10px rgba(184,131,14,0.12)" : "0 1px 4px rgba(13,31,60,0.04)",
                    }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 5,
                            background: "#0d1f3c", color: "white", letterSpacing: "0.04em",
                          }}>
                            {bill.type} {bill.number}
                          </span>
                          {update && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
                              background: "#fdf3d7", color: "#8a5f00", border: "1px solid #e8c96a",
                              display: "flex", alignItems: "center", gap: 3,
                            }}>
                              <TrendingUp size={9} strokeWidth={2.5} /> {stageName(update.fromStage)} → {stageName(bill.stage)}
                            </span>
                          )}
                        </div>
                        <p style={{
                          fontFamily: "var(--font-dm-sans)", fontSize: 14.5, fontWeight: 700,
                          color: "#0d1f3c", lineHeight: 1.4, margin: 0,
                        }}>
                          {bill.title}
                        </p>
                        {bill.sponsorName && (
                          <p style={{ fontSize: 12, color: "#7a8699", marginTop: 5, fontFamily: "var(--font-dm-sans)" }}>
                            Sponsored by {bill.sponsorName}
                          </p>
                        )}
                      </div>
                      <button onClick={() => removeFromTracking(bill.id)}
                        aria-label={`Remove ${bill.type} ${bill.number} from tracking`}
                        title="Remove from tracking"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#b8830e", flexShrink: 0 }}>
                        <Star size={17} fill="#b8830e" strokeWidth={2} />
                      </button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <StageTimeline stage={bill.stage} />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#9ba8ba", fontFamily: "var(--font-dm-sans)" }}>
                        <Calendar size={11} strokeWidth={2} /> {bill.latestAction}
                      </div>
                      <Link href={`/bills?open=${encodeURIComponent(bill.id)}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700,
                          padding: "7px 16px", borderRadius: 8, background: "#0d1f3c", color: "white",
                          textDecoration: "none", fontFamily: "var(--font-dm-sans)", flexShrink: 0,
                        }}>
                        Open &amp; Take Action <ArrowRight size={12} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

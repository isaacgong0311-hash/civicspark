import type { Bill, BillStage } from "./types";

/* Client-only helpers backing two honest, no-backend features:
   1. Watchlist alerts — did a bill you're tracking advance since you last opened it?
   2. Personal civic-impact tracker — how many letters/calls/bills YOU have engaged
      with, read straight from this browser's own history. No aggregate or
      community-wide numbers are fabricated here. */

const IMPACT_KEY = "civicspark_impact";
const SEEN_STAGES_KEY = "civicspark_seen_stages";
const WATCHLIST_KEY = "civicspark_watchlist";

export interface ImpactStats {
  letters: number;
  calls: number;
  billsExplored: string[];
}

function readImpact(): ImpactStats {
  try {
    const raw = localStorage.getItem(IMPACT_KEY);
    if (!raw) return { letters: 0, calls: 0, billsExplored: [] };
    const parsed = JSON.parse(raw);
    return {
      letters: typeof parsed.letters === "number" ? parsed.letters : 0,
      calls: typeof parsed.calls === "number" ? parsed.calls : 0,
      billsExplored: Array.isArray(parsed.billsExplored) ? parsed.billsExplored : [],
    };
  } catch {
    return { letters: 0, calls: 0, billsExplored: [] };
  }
}

function writeImpact(stats: ImpactStats) {
  try { localStorage.setItem(IMPACT_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
}

export function getImpact(): ImpactStats {
  return readImpact();
}

export function recordLetter(): ImpactStats {
  const stats = readImpact();
  stats.letters += 1;
  writeImpact(stats);
  return stats;
}

export function recordCall(): ImpactStats {
  const stats = readImpact();
  stats.calls += 1;
  writeImpact(stats);
  return stats;
}

export function recordBillExplored(billId: string): ImpactStats {
  const stats = readImpact();
  if (!stats.billsExplored.includes(billId)) stats.billsExplored.push(billId);
  writeImpact(stats);
  return stats;
}

/* ── Watchlist stage-change alerts ────────────────────────────────────────
   We remember the stage a bill was at the last time the user opened its
   action drawer. If a watched bill's current stage differs from that
   snapshot, it has moved since they last looked — surface that. */

function readSeenStages(): Record<string, BillStage> {
  try {
    const raw = localStorage.getItem(SEEN_STAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSeenStages(map: Record<string, BillStage>) {
  try { localStorage.setItem(SEEN_STAGES_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

export function markBillSeen(billId: string, stage: BillStage) {
  const map = readSeenStages();
  map[billId] = stage;
  writeSeenStages(map);
}

export interface WatchlistUpdate {
  bill: Bill;
  fromStage: BillStage;
}

/** Watched bills that moved stage since the user last opened them, with the
   stage they moved from (so the UI can show "Committee → Floor Ready"). */
export function getWatchlistUpdateDetails(bills: Bill[], watchlist: Set<string>): WatchlistUpdate[] {
  const seen = readSeenStages();
  const updates: WatchlistUpdate[] = [];
  for (const b of bills) {
    if (!watchlist.has(b.id)) continue;
    const prev = seen[b.id];
    if (prev != null && b.stage != null && prev !== b.stage) {
      updates.push({ bill: b, fromStage: prev });
    }
  }
  return updates;
}

export function getWatchlistUpdates(bills: Bill[], watchlist: Set<string>): Bill[] {
  return getWatchlistUpdateDetails(bills, watchlist).map(u => u.bill);
}

/* ── Watchlist membership ─────────────────────────────────────────────────
   Centralized here (rather than duplicated per page) since both the bills
   browser and the My Bills dashboard read/write the same localStorage key. */

export function getWatchlist(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function setWatchlistIds(ids: Set<string>) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

export function toggleWatchlistId(id: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  setWatchlistIds(next);
  return next;
}

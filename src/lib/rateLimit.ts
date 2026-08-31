/* In-memory per-IP rate limiting for the AI-generation routes. Fluid Compute
   reuses function instances, so a simple Map survives across requests within
   an instance — enough to stop a single client from burning Groq quota
   during the judging window without needing Redis/Vercel KV. */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;

const hits = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Returns true if the request is within its rate limit and should proceed. */
export function checkRateLimit(req: Request): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey !== undefined) hits.delete(oldestKey);
    }
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;
  entry.count += 1;
  return true;
}

export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests — please wait a moment and try again." }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
  );
}

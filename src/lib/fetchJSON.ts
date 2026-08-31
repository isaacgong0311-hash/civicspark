/* Client-side fetch wrapper that never hangs forever and never throws into
   the caller — pages should treat a null return as "show a fallback state"
   rather than needing their own try/catch around every call. */

export async function fetchJSON<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 15000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      console.error(`fetchJSON: ${url} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`fetchJSON: ${url} failed`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function postJSON<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T | null> {
  return fetchJSON<T>(
    url,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    timeoutMs,
  );
}

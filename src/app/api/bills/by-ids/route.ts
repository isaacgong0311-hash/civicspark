import { NextResponse } from "next/server";
import { getBillsByIds } from "@/lib/congress";

// Resolves specific bills by id, independent of pagination — keeps starred /
// watchlisted bills (and deep links like /bills?open=<id>) resolvable even
// when they've scrolled out of the paginated "browse" pool.
export async function POST(req: Request) {
  const { ids } = (await req.json()) as { ids?: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ bills: [], live: false, missing: [] });
  }
  const capped = ids.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 50);
  const result = await getBillsByIds(capped);
  return NextResponse.json(result);
}

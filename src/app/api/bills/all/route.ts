import { NextResponse } from "next/server";
import { getRelevantBills } from "@/lib/congress";

// Returns a page of bills without issue filtering — used by the bills browser,
// My Bills, and the homepage. Supports ?offset=&limit= for pagination so
// "browse all bills" isn't capped at whatever the first page happens to be.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? "25") || 25), 100);
  const result = await getRelevantBills([], { offset, limit });
  return NextResponse.json(result);
}

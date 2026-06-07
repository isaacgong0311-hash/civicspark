import { NextResponse } from "next/server";
import { searchBills } from "@/lib/congress";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 40);

  if (!q.trim()) {
    return NextResponse.json({ bills: [], live: false });
  }

  const result = await searchBills(q, limit);
  return NextResponse.json(result);
}

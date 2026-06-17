import { NextResponse } from "next/server";
import { getBillVote } from "@/lib/congress";
import type { Bill } from "@/lib/types";

export async function POST(req: Request) {
  const { bill, bioguideIds } = await req.json() as {
    bill: Bill;
    bioguideIds?: string[];
  };
  const vote = await getBillVote(
    bill.congress,
    bill.type,
    bill.number,
    Array.isArray(bioguideIds) ? bioguideIds.filter(Boolean) : [],
  );
  return NextResponse.json({ vote });
}

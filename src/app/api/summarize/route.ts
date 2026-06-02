import { NextResponse } from "next/server";
import { summarizeBill } from "@/lib/ai";
import type { Bill } from "@/lib/types";

export async function POST(req: Request) {
  const { bill, state, district } = await req.json() as {
    bill: Bill;
    state?: string;
    district?: string;
  };
  const summary = await summarizeBill(bill, state, district);
  return NextResponse.json(summary);
}

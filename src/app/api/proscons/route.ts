import { NextResponse } from "next/server";
import { generateProsCons } from "@/lib/ai";
import type { Bill } from "@/lib/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!checkRateLimit(req)) return rateLimitResponse();
  const bill = (await req.json()) as Bill;
  const data = await generateProsCons(bill);
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { predictPassLikelihood } from "@/lib/ai";
import type { Bill } from "@/lib/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!checkRateLimit(req)) return rateLimitResponse();
  const bill = (await req.json()) as Bill;
  const data = await predictPassLikelihood(bill);
  return NextResponse.json(data);
}

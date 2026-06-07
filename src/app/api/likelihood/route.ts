import { NextResponse } from "next/server";
import { predictPassLikelihood } from "@/lib/ai";
import type { Bill } from "@/lib/types";

export async function POST(req: Request) {
  const bill = (await req.json()) as Bill;
  const data = await predictPassLikelihood(bill);
  return NextResponse.json(data);
}

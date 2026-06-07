import { NextResponse } from "next/server";
import { generateProsCons } from "@/lib/ai";
import type { Bill } from "@/lib/types";

export async function POST(req: Request) {
  const bill = (await req.json()) as Bill;
  const data = await generateProsCons(bill);
  return NextResponse.json(data);
}

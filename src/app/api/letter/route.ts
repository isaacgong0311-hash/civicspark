import { NextResponse } from "next/server";
import { generateLetter } from "@/lib/ai";
import type { Bill, Representative } from "@/lib/types";

export async function POST(req: Request) {
  const { bill, rep, position, personalNote } = (await req.json()) as {
    bill: Bill;
    rep: Representative;
    position: "support" | "oppose";
    personalNote: string;
  };
  const letter = await generateLetter(bill, rep, position, personalNote);
  return NextResponse.json({ letter });
}

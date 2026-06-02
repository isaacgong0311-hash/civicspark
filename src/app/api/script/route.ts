import { NextResponse } from "next/server";
import { generateCallScript } from "@/lib/ai";
import type { Bill, Representative } from "@/lib/types";

export async function POST(req: Request) {
  const { bill, rep, position, personalNote } = await req.json() as {
    bill: Bill;
    rep: Representative;
    position: "support" | "oppose";
    personalNote: string;
  };
  const script = await generateCallScript(bill, rep, position, personalNote);
  return NextResponse.json({ script });
}

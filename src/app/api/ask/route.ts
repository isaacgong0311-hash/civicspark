import { NextResponse } from "next/server";
import { askBill, type AskTurn } from "@/lib/ai";
import type { Bill } from "@/lib/types";

export async function POST(req: Request) {
  const { bill, question, history } = await req.json() as {
    bill: Bill;
    question: string;
    history?: AskTurn[];
  };
  const answer = await askBill(bill, question, Array.isArray(history) ? history : []);
  return NextResponse.json({ answer });
}

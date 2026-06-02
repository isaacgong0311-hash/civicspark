import { NextResponse } from "next/server";
import { getRelevantBills } from "@/lib/congress";

export async function POST(req: Request) {
  const { issues } = await req.json();
  if (!Array.isArray(issues) || issues.length === 0) {
    return NextResponse.json({ error: "Select at least one issue." }, { status: 400 });
  }
  const result = await getRelevantBills(issues as string[]);
  return NextResponse.json(result);
}

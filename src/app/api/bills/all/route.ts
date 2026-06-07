import { NextResponse } from "next/server";
import { getRelevantBills } from "@/lib/congress";

// Returns all bills without issue filtering — used by the bills browser
export async function GET() {
  const result = await getRelevantBills([]);
  return NextResponse.json(result);
}

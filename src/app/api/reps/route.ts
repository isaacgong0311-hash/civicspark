import { NextResponse } from "next/server";
import { lookupByZip } from "@/lib/representatives";

export async function POST(req: Request) {
  const { zip } = await req.json();
  if (!zip || typeof zip !== "string" || !/^\d{5}$/.test(zip.trim())) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
  }
  return NextResponse.json(lookupByZip(zip));
}

import { NextResponse } from "next/server";
import { getMemberDetail } from "@/lib/congress";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bioguideId: string }> },
) {
  const { bioguideId } = await params;
  if (!bioguideId || !/^[A-Z]\d{6}$/.test(bioguideId)) {
    return NextResponse.json({ error: "Invalid bioguide ID" }, { status: 400 });
  }
  const detail = await getMemberDetail(bioguideId);
  if (!detail) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

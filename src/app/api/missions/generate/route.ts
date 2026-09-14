import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { generateMissionContent } from "@/features/missions/generate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const billSchema = z.object({
  id: z.string(), congress: z.number().int(), type: z.string(), number: z.string(), title: z.string().min(3), latestAction: z.string(), latestActionDate: z.string(), url: z.string().url(), policyArea: z.string().optional(), matchedIssues: z.array(z.string()), stage: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(), urgency: z.enum(["urgent", "new", "active"]).optional(), sponsorName: z.string().optional(), sponsorParty: z.string().optional(), cosponsors: z.number().optional(), introducedDate: z.string().optional(),
});
const inputSchema = z.object({ bill: billSchema, gradeBand: z.enum(["6–8", "9–10", "11–12"]) });

export async function POST(request: Request) {
  if (!checkRateLimit(request)) return rateLimitResponse();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request", issues: parsed.error.flatten() }, { status: 400 });
  const content = await generateMissionContent(parsed.data.bill, parsed.data.gradeBand);
  return NextResponse.json(content, { headers: { "Cache-Control": "no-store" } });
}

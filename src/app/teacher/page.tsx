import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import MissionDashboard from "@/features/missions/components/MissionDashboard";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Teacher Studio" };

export default async function TeacherPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/teacher/sign-in");
  }

  return <><Navbar /><MissionDashboard /></>;
}

import type { Metadata } from "next";
import MissionRunner from "@/features/missions/components/MissionRunner";

export const metadata: Metadata = {
  title: "Student Mission",
  description: "Investigate a real bill, weigh official evidence, and make your voice heard.",
};

export default async function MissionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <MissionRunner initialCode={code} />;
}

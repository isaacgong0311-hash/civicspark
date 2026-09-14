"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { DEMO_MISSION } from "@/features/missions/demo-data";
import { validateCitations } from "@/features/missions/citations";
import { missionCreateSchema } from "@/features/missions/schemas";
import { saveCustomMission } from "@/features/missions/storage";
import type { CivicMission, EvidenceCard, MissionQuestion, MissionSource } from "@/features/missions/types";

type GeneratedDraft = {
  evidence: EvidenceCard[];
  questions: MissionQuestion[];
  sources: MissionSource[];
  generatedByAI: boolean;
};

export default function NewMissionPage() {
  const router = useRouter();
  const [title, setTitle] = useState(DEMO_MISSION.title);
  const [gradeBand, setGradeBand] = useState<CivicMission["gradeBand"]>("9–10");
  const [objective, setObjective] = useState(DEMO_MISSION.learningObjective);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft>({ evidence: DEMO_MISSION.evidence, questions: DEMO_MISSION.questions, sources: DEMO_MISSION.sources, generatedByAI: false });
  const [error, setError] = useState("");

  async function generate() {
    const valid = missionCreateSchema.safeParse({ billId: DEMO_MISSION.id, title, gradeBand, learningObjective: objective });
    if (!valid.success) { setError(valid.error.issues[0].message); return; }
    setError(""); setGenerating(true);
    try {
      const response = await fetch("/api/missions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeBand,
          bill: {
            id: DEMO_MISSION.id,
            congress: DEMO_MISSION.bill.congress,
            type: DEMO_MISSION.bill.type.replace(".", ""),
            number: DEMO_MISSION.bill.number,
            title: DEMO_MISSION.bill.title,
            latestAction: DEMO_MISSION.bill.latestAction,
            latestActionDate: "2025-01-28",
            url: DEMO_MISSION.bill.url,
            policyArea: DEMO_MISSION.bill.policyArea,
            matchedIssues: ["Technology", "Youth"],
          },
        }),
      });
      if (!response.ok) throw new Error("generation_failed");
      const next = await response.json() as GeneratedDraft;
      setDraft(next);
      setGenerated(true);
    } catch {
      setError("The source service could not build this draft. Your selections are preserved—try again.");
    } finally {
      setGenerating(false);
    }
  }

  function publish() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "7");
    const mission: CivicMission = { ...DEMO_MISSION, id: `mission-${crypto.randomUUID()}`, code, title, gradeBand, learningObjective: objective, sources: draft.sources, evidence: draft.evidence, questions: draft.questions, status: "published", publishedAt: new Date().toISOString() };
    const citations = validateCitations(mission.sources, [...mission.evidence, ...mission.questions]);
    if (!citations.valid) { setError("Every factual card and question must cite an official source."); return; }
    saveCustomMission(mission);
    router.push(`/mission/${code}`);
  }

  return (
    <><Navbar /><main className="builder-shell" id="main-content"><div className="builder-wrap">
      <Link href="/teacher" className="builder-back"><ArrowLeft size={15} /> Teacher studio</Link>
      <div className="mission-eyebrow"><Sparkles size={14} /> New mission</div>
      <h1>Turn a live bill into<br /><em>a civic story.</em></h1>
      <div className="builder-grid">
        <section className="builder-form">
          <div className="builder-step"><span>01</span><div><small>Official bill</small><strong>S. 278 · Kids Off Social Media Act</strong><p>119th Congress · Referred to Senate Commerce Committee</p></div><Check size={17} /></div>
          <label>Mission title<input value={title} maxLength={90} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Grade band<select value={gradeBand} onChange={(event) => setGradeBand(event.target.value as CivicMission["gradeBand"])}><option>6–8</option><option>9–10</option><option>11–12</option></select></label>
          <label>Learning objective<textarea value={objective} maxLength={240} onChange={(event) => setObjective(event.target.value)} /></label>
          {error && <p className="mission-error" role="alert">{error}</p>}
          {!generated ? <button className="mission-primary" onClick={generate} disabled={generating}>{generating ? <><Loader2 className="animate-spin" size={17} /> Building cited draft…</> : <>Generate mission draft <ArrowRight size={17} /></>}</button> : <><div className="builder-editor"><span>Review every card before publishing</span>{draft.evidence.map((card, index) => <fieldset key={card.id}><legend>Evidence {index + 1} · {card.perspective}</legend><input aria-label={`Evidence ${index + 1} heading`} value={card.heading} onChange={(event) => setDraft((current) => ({ ...current, evidence: current.evidence.map((item) => item.id === card.id ? { ...item, heading: event.target.value } : item) }))} /><textarea aria-label={`Evidence ${index + 1} explanation`} value={card.explanation} onChange={(event) => setDraft((current) => ({ ...current, evidence: current.evidence.map((item) => item.id === card.id ? { ...item, explanation: event.target.value } : item) }))} /><small>Sources: {card.sourceIds.join(", ")}</small></fieldset>)}{draft.questions.map((question, index) => <fieldset key={question.id}><legend>Question {index + 1}</legend><textarea aria-label={`Question ${index + 1} prompt`} value={question.prompt} onChange={(event) => setDraft((current) => ({ ...current, questions: current.questions.map((item) => item.id === question.id ? { ...item, prompt: event.target.value } : item) }))} /><small>Correct answer: {question.choices[question.correctChoice]} · Sources: {question.sourceIds.join(", ")}</small></fieldset>)}</div><button className="mission-primary" onClick={publish}>Publish &amp; preview <ArrowRight size={17} /></button></>}
        </section>
        <aside className="builder-preview">
          <span>Source integrity</span><ShieldCheck size={34} /><h2>{generated ? "Draft ready for review" : "Every claim earns its citation."}</h2><p>{generated ? `${draft.evidence.length} evidence cards and ${draft.questions.length} questions validated against ${draft.sources.length} official sources${draft.generatedByAI ? " with structured AI output" : " with the safe fallback generator"}.` : "CivicSpark freezes the official record, generates one classroom draft, and blocks publication when a factual card loses its source."}</p>
          <div>{draft.sources.map((source) => <p key={source.id}><BookOpen size={14} /><span><strong>{source.label}</strong><small>{source.publisher}</small></span>{generated && <Check size={14} />}</p>)}</div>
        </aside>
      </div>
    </div></main></>
  );
}

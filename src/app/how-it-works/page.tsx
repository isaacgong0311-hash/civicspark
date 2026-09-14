"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, FileCheck2, GraduationCap, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DEMO_MISSION } from "@/features/missions/demo-data";

const chapters = [
  ["01", "Meet the decision", "A relatable scenario makes a live bill concrete before introducing legislative detail."],
  ["02", "Record a first take", "Students privately choose a position and confidence level. No viewpoint earns points."],
  ["03", "Follow the sources", "Four to six evidence cards distinguish official facts from arguments and link to Congress.gov."],
  ["04", "Hold two ideas", "Students consider strong supporting and opposing cases before settling on a conclusion."],
  ["05", "Check understanding", "A short quiz explains every answer and cites the record behind it."],
  ["06", "Write from experience", "Structured reflection protects the student’s voice while grounding factual claims."],
  ["07", "Join the class packet", "The teacher reviews each letter before approved work enters the congressional PDF."],
];

export default function HowItWorksPage() {
  return <div className="home-shell"><Navbar /><main id="main-content" className="how-shell">
    <section className="how-hero">
      <div className="mission-eyebrow"><Sparkles size={14} /> How CivicSpark works</div>
      <h1>One bill.<br />Seven chapters.<br /><em>A measurable change.</em></h1>
      <p>CivicSpark is not a chatbot with a civics theme. It is a teacher-reviewed learning loop that begins with an instinct and ends with an evidence-based act.</p>
      <div><Link className="mission-primary compact" href={`/mission/${DEMO_MISSION.code}`}>Try the student mission <ArrowRight size={17} /></Link><Link className="how-text-link" href="/teacher">Open Teacher Studio</Link></div>
    </section>

    <section className="how-chapters" aria-labelledby="journey-title">
      <header><span>The student journey</span><h2 id="journey-title">Every chapter earns the next.</h2></header>
      <ol>{chapters.map(([number, title, description]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div><CheckCircle2 size={18} /></li>)}</ol>
    </section>

    <section className="how-system">
      <div><span>Under the surface</span><h2>Trust is part of the architecture.</h2><p>The technical system is designed around provenance, privacy, and recovery—not around making the most AI calls.</p></div>
      <div className="how-system-grid">
        <article><Database size={23} /><strong>Capture once</strong><p>Official metadata, actions, summaries, and text references are frozen with each mission.</p></article>
        <article><FileCheck2 size={23} /><strong>Validate every claim</strong><p>Structured generation is rejected when an evidence card or answer explanation lacks a valid source ID.</p></article>
        <article><GraduationCap size={23} /><strong>Review before release</strong><p>Teachers edit mission content before publication and approve letters before export.</p></article>
        <article><LockKeyhole size={23} /><strong>Collect less</strong><p>Students need only a nickname. The data model has no student email, home address, ZIP, or school field.</p></article>
      </div>
    </section>

    <section className="how-close"><ShieldCheck size={30} /><div><span>Nonpartisan by construction</span><h2>CivicSpark measures learning—not agreement.</h2><p>Completion, source-based knowledge, confidence change, and approved letters are outcomes. A student’s political position is never a score.</p></div><Link href="/teacher/missions/new">Create a mission <ArrowRight size={16} /></Link></section>
  </main><Footer /></div>;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, ExternalLink, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DEMO_MISSION } from "@/features/missions/demo-data";
import { joinCodeSchema } from "@/features/missions/schemas";

export default function LandingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function join(event: React.FormEvent) {
    event.preventDefault();
    const parsed = joinCodeSchema.safeParse(code);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    router.push(`/mission/${parsed.data}`);
  }

  return <div className="home-shell"><Navbar /><main id="main-content">
    <section className="home-hero">
      <div className="home-grid-lines" aria-hidden="true" />
      <motion.div className="home-hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
        <div className="home-kicker"><span /> Built for classrooms · Powered by the official record</div>
        <h1>Don’t just learn<br />about democracy.<br /><em>Enter the conversation.</em></h1>
        <p>CivicSpark turns one real bill into a guided investigation—and each student’s informed perspective into a letter Congress can read.</p>
        <form className="home-join" onSubmit={join}>
          <label htmlFor="home-code">Join your class mission</label>
          <div><input id="home-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={6} placeholder="ENTER CODE" /><button>Begin <ArrowRight size={18} /></button></div>
          {error && <span role="alert">{error}</span>}
        </form>
        <div className="home-demo-line"><span>No code?</span><Link href={`/mission/${DEMO_MISSION.code}`}>Try the live sample mission <ArrowRight size={13} /></Link></div>
      </motion.div>

      <motion.div className="home-story-card" initial={reduceMotion ? false : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .12 }}>
        <div className="home-card-top"><span>Mission 01</span><i>10 min</i></div>
        <div className="home-card-orbit" aria-hidden="true"><span /><span /><b>YOUR<br />VOICE</b></div>
        <div className="home-card-content"><small>LIVE SENATE BILL · DIGITAL LIFE</small><h2>{DEMO_MISSION.title}</h2><p>Follow the evidence. Challenge your first take. Write from experience.</p><Link href={`/mission/${DEMO_MISSION.code}`}>Open mission <ArrowRight size={16} /></Link></div>
        <div className="home-card-steps"><span className="active" /><span /><span /><span /><span /><span /><span /></div>
      </motion.div>
    </section>

    <section className="home-promise">
      <div><span>One classroom loop</span><h2>From distant policy<br />to a voice that matters.</h2></div>
      <ol>
        <li><span>01</span><BookOpen size={22} /><div><strong>Investigate</strong><p>Students examine official sources, not secondhand talking points.</p></div></li>
        <li><span>02</span><Sparkles size={22} /><div><strong>Deliberate</strong><p>They weigh competing arguments and explain what shaped their view.</p></div></li>
        <li><span>03</span><GraduationCap size={22} /><div><strong>Act together</strong><p>A teacher reviews each letter and prepares one credible class packet.</p></div></li>
      </ol>
    </section>

    <section className="home-trust">
      <div className="home-trust-copy"><span>Designed for trust</span><h2>AI helps students think.<br />It never thinks for them.</h2><p>Every factual card links to the official record. Political positions are private and never scored. AI can organize a student’s words, but it cannot invent their experience.</p><div><span><ShieldCheck size={17} /> No student email or address</span><span><ExternalLink size={17} /> Citation on every factual claim</span><span><CheckCircle2 size={17} /> Teacher review before export</span></div></div>
      <div className="home-source-stack">
        {DEMO_MISSION.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id} style={{ transform: `translateY(${index * -5}px) rotate(${index % 2 ? 1 : -1}deg)` }}><span>Official source 0{index + 1}</span><strong>{source.label}</strong><p>{source.excerpt}</p><small>{source.publisher} <ExternalLink size={11} /></small></a>)}
      </div>
    </section>

    <section className="home-teacher-cta"><div><span><Users size={15} /> For educators</span><h2>Build tomorrow’s civic<br />conversation today.</h2><p>Select a live bill, generate a cited classroom draft, review student thinking, and export approved letters—without creating student accounts.</p></div><div><Link href="/teacher">Open teacher studio <ArrowRight size={17} /></Link><Link href="/bills">Explore Congress <ExternalLink size={15} /></Link></div></section>
  </main><Footer /></div>;
}

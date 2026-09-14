"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Check, Clipboard, Download, ExternalLink, FileText, GraduationCap, MessageSquareText, Plus, RefreshCw, Users } from "lucide-react";
import { DEMO_MISSION } from "../demo-data";
import { calculateMetrics } from "../metrics";
import { getTeacherResponses, saveResponse } from "../storage";
import type { LetterReviewStatus, MissionResponse } from "../types";

export default function MissionDashboard() {
  const [responses, setResponses] = useState<MissionResponse[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refresh = () => setResponses(getTeacherResponses(DEMO_MISSION.id));
    queueMicrotask(refresh);
    window.addEventListener("civicspark:mission-saved", refresh);
    return () => window.removeEventListener("civicspark:mission-saved", refresh);
  }, []);

  const metrics = useMemo(() => calculateMetrics(DEMO_MISSION, responses), [responses]);

  function review(participantId: string, status: LetterReviewStatus) {
    setResponses((current) => current.map((response) => {
      if (response.participantId !== participantId) return response;
      const next = { ...response, reviewStatus: status, updatedAt: new Date().toISOString() };
      if (!response.participantId.startsWith("27e") && !response.participantId.startsWith("d523")) saveResponse(next);
      return next;
    }));
  }

  async function copyCode() {
    await navigator.clipboard.writeText(`${window.location.origin}/mission/${DEMO_MISSION.code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main id="main-content" className="teacher-shell">
      <header className="teacher-header">
        <div>
          <div className="mission-eyebrow"><GraduationCap size={14} /> Teacher studio · Demo workspace</div>
          <h1>Good evening, educator.</h1>
          <p>Turn current legislation into a source-backed learning experience—and student insight into a message Congress can read.</p>
        </div>
        <Link href="/teacher/missions/new" className="teacher-create"><Plus size={17} /> Create a mission</Link>
      </header>

      <section className="teacher-mission-hero">
        <div>
          <span className="teacher-live"><i /> Live mission</span>
          <p>{DEMO_MISSION.kicker}</p>
          <h2>{DEMO_MISSION.title}</h2>
          <div className="teacher-code-row">
            <span>Join code</span><strong>{DEMO_MISSION.code}</strong>
            <button type="button" onClick={copyCode}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy link"}</button>
            <Link href={`/mission/${DEMO_MISSION.code}`}>Preview <ExternalLink size={14} /></Link>
          </div>
        </div>
        <div className="teacher-hero-art" aria-hidden="true"><span>01</span><span>02</span><span>03</span><b>CIVIC<br />MISSION</b></div>
      </section>

      <section className="teacher-stats" aria-label="Mission metrics">
        <article><Users size={18} /><small>Participants</small><strong>{metrics.participants}</strong><span>{metrics.completed} finished</span></article>
        <article><BarChart3 size={18} /><small>Completion</small><strong>{metrics.completionRate}%</strong><span>Target: 80%</span></article>
        <article><GraduationCap size={18} /><small>Knowledge</small><strong>{metrics.averageKnowledgeScore}%</strong><span>Current check score</span></article>
        <article><MessageSquareText size={18} /><small>Approved voices</small><strong>{metrics.review.approved}</strong><span>{metrics.review.submitted} awaiting review</span></article>
      </section>

      <div className="teacher-grid">
        <section className="teacher-panel teacher-outcomes">
          <header><div><span>Learning signal</span><h2>Where the class landed</h2></div><RefreshCw size={16} /></header>
          <div className="teacher-position-bars">
            {(["support", "unsure", "oppose"] as const).map((position) => {
              const count = metrics.positions[position];
              const width = metrics.completed ? Math.round((count / metrics.completed) * 100) : 0;
              return <div key={position}><span>{position === "unsure" ? "Still weighing" : position}</span><div><i style={{ width: `${width}%` }} /></div><strong>{count}</strong></div>;
            })}
          </div>
          <div className="teacher-confidence"><small>Average confidence shift</small><strong>{metrics.averageConfidenceShift >= 0 ? "+" : ""}{metrics.averageConfidenceShift}</strong><span>points after evidence</span></div>
          <p>Political positions are anonymous and never scored. The dashboard measures whether students can explain their view with evidence.</p>
        </section>

        <section className="teacher-panel teacher-queue">
          <header><div><span>Review queue</span><h2>Student letters</h2></div><a href={`/api/missions/${DEMO_MISSION.id}/export`}><Download size={15} /> Export approved</a></header>
          <div className="teacher-letter-list">
            {responses.filter((response) => response.letter).map((response) => (
              <article key={response.participantId}>
                <div className="teacher-letter-icon"><FileText size={17} /></div>
                <div><strong>{response.nickname}</strong><p>{response.reflection}</p><span className={`review-${response.reviewStatus}`}>{response.reviewStatus}</span></div>
                <div className="teacher-review-actions">
                  <button type="button" title="Approve" onClick={() => review(response.participantId, "approved")}><Check size={15} /></button>
                  <button type="button" title="Return" onClick={() => review(response.participantId, "returned")}><MessageSquareText size={15} /></button>
                </div>
              </article>
            ))}
            {responses.every((response) => !response.letter) && <p className="teacher-empty">Submitted letters will appear here.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

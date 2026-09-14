"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ExternalLink, FileText, Quote, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { findMission, loadResponse, saveResponse } from "../storage";
import type { CivicMission, MissionResponse, StudentPosition } from "../types";
import { joinCodeSchema, nicknameSchema } from "../schemas";
import MissionProgress from "./MissionProgress";

const POSITION_OPTIONS: Array<{ value: StudentPosition; label: string; copy: string }> = [
  { value: "support", label: "Support", copy: "I currently lean toward this proposal." },
  { value: "unsure", label: "Still weighing it", copy: "I need more evidence before deciding." },
  { value: "oppose", label: "Oppose", copy: "I currently lean against this proposal." },
];

function freshResponse(mission: CivicMission, nickname: string): MissionResponse {
  return {
    participantId: crypto.randomUUID(),
    missionId: mission.id,
    nickname,
    currentChapter: 0,
    evidenceRatings: {},
    answers: {},
    reviewStatus: "draft",
    updatedAt: new Date().toISOString(),
  };
}

function draftLetter(mission: CivicMission, response: MissionResponse): string {
  const position = response.finalPosition ?? response.initialPosition ?? "unsure";
  const positionLine = position === "support"
    ? `I support ${mission.bill.type} ${mission.bill.number}, the ${mission.bill.title}.`
    : position === "oppose"
      ? `I oppose ${mission.bill.type} ${mission.bill.number}, the ${mission.bill.title}.`
      : `I am still weighing ${mission.bill.type} ${mission.bill.number}, the ${mission.bill.title}.`;
  const ask = position === "support"
    ? "Please support this proposal while protecting young people’s privacy."
    : position === "oppose"
      ? "Please oppose this proposal and pursue a solution that better protects both safety and individual choice."
      : "Please carefully examine how this proposal would protect young people without creating new privacy risks.";
  return `Dear ${mission.representative.title} ${mission.representative.name},\n\nI am a student in ${mission.representative.district}. ${positionLine}\n\n${response.personalConnection?.trim() ?? "This issue affects how students communicate, learn, and spend time online."}\n\n${response.reflection?.trim() ?? "I believe students should be included when Congress makes decisions about our digital lives."}\n\n${ask}\n\nRespectfully,\nA student constituent`;
}

function PositionPicker({ value, onChange }: { value?: StudentPosition; onChange: (value: StudentPosition) => void }) {
  return (
    <div className="mission-choice-grid" role="radiogroup" aria-label="Your position">
      {POSITION_OPTIONS.map((option) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`mission-choice-card ${value === option.value ? "is-selected" : ""}`}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          <span className="mission-choice-check">{value === option.value && <Check size={16} />}</span>
          <strong>{option.label}</strong>
          <small>{option.copy}</small>
        </button>
      ))}
    </div>
  );
}

function SourceLinks({ mission, sourceIds }: { mission: CivicMission; sourceIds: string[] }) {
  return (
    <div className="mission-source-links">
      {sourceIds.map((id) => {
        const source = mission.sources.find((item) => item.id === id);
        if (!source) return null;
        return <a href={source.url} target="_blank" rel="noreferrer" key={id}>{source.publisher} <ExternalLink size={11} /></a>;
      })}
    </div>
  );
}

export default function MissionRunner({ initialCode }: { initialCode: string }) {
  const reduceMotion = useReducedMotion();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [mission, setMission] = useState<CivicMission | null>(null);
  const [response, setResponse] = useState<MissionResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [joinError, setJoinError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const found = findMission(initialCode);
      setMission(found);
      if (found) {
        const existing = loadResponse(found.id);
        if (existing) {
          setResponse(existing);
          setNickname(existing.nickname);
        }
      }
    });
  }, [initialCode]);

  const chapter = response?.currentChapter ?? 0;
  const answeredCount = useMemo(() => mission?.questions.filter((question) => response?.answers[question.id] !== undefined).length ?? 0, [mission, response]);
  const score = useMemo(() => {
    if (!mission || !response) return 0;
    return mission.questions.filter((question) => response.answers[question.id] === question.correctChoice).length;
  }, [mission, response]);

  function update(patch: Partial<MissionResponse>, persist = true) {
    setResponse((current) => {
      if (!current) return current;
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      if (persist) {
        saveResponse(next);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
      }
      return next;
    });
  }

  function join() {
    const validCode = joinCodeSchema.safeParse(code);
    const validNickname = nicknameSchema.safeParse(nickname);
    if (!validCode.success) return setJoinError(validCode.error.issues[0].message);
    if (!validNickname.success) return setJoinError(validNickname.error.issues[0].message);
    const found = findMission(validCode.data);
    if (!found || found.status !== "published") return setJoinError("That mission is unavailable or has closed.");
    const next = loadResponse(found.id) ?? freshResponse(found, validNickname.data);
    setMission(found);
    setResponse(next);
    saveResponse(next);
    setJoinError("");
  }

  function go(next: number) {
    update({ currentChapter: Math.max(0, Math.min(6, next)) });
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function submitLetter() {
    if (!mission || !response) return;
    const letter = draftLetter(mission, response);
    update({ letter, reviewStatus: "submitted", currentChapter: 6, completedAt: new Date().toISOString() });
  }

  if (!mission || !response) {
    return (
      <main id="main-content" className="mission-join-shell">
        <div className="mission-glow" aria-hidden="true" />
        <section className="mission-join-card">
          <div className="mission-eyebrow"><Sparkles size={14} /> CivicSpark Mission</div>
          <h1>One real bill.<br /><em>Your informed voice.</em></h1>
          <p>Join a teacher-led investigation using evidence from Congress.gov. No student account, email, or address required.</p>
          <label htmlFor="mission-code">Mission code</label>
          <input id="mission-code" value={code} maxLength={6} autoCapitalize="characters" onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="SPARK6" />
          <label htmlFor="mission-nickname">Class nickname</label>
          <input id="mission-nickname" value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} placeholder="Example: Bluebonnet" onKeyDown={(event) => event.key === "Enter" && join()} />
          {joinError && <p className="mission-error" role="alert">{joinError}</p>}
          <button className="mission-primary" type="button" onClick={join}>Begin mission <ArrowRight size={18} /></button>
          <div className="mission-privacy"><ShieldCheck size={16} /><span>Your nickname exists only inside this mission.</span></div>
        </section>
      </main>
    );
  }

  const canContinue = chapter === 0
    || (chapter === 1 && Boolean(response.initialPosition && response.initialConfidence))
    || (chapter === 2 && Object.keys(response.evidenceRatings).length === mission.evidence.length)
    || chapter === 3
    || (chapter === 4 && answeredCount === mission.questions.length)
    || (chapter === 5 && Boolean(response.finalPosition && response.finalConfidence && response.reflection?.trim() && response.personalConnection?.trim()));

  return (
    <main id="main-content" className="mission-shell">
      <header className="mission-topbar">
        <Link href="/" className="mission-wordmark">Civic<span>Spark</span></Link>
        <div className="mission-save-state"><span className={saved ? "pulse" : ""} />{saved ? "Saved" : "Progress saves automatically"}</div>
        <span className="mission-student">{response.nickname}</span>
      </header>
      <MissionProgress current={chapter} />
      <div className="mission-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={chapter}
            className="mission-chapter"
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -28 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {chapter === 0 && (
              <>
                <div className="mission-eyebrow">Chapter 1 · Why this matters</div>
                <h1>{mission.title}</h1>
                <p className="mission-lede">{mission.scenario}</p>
                <div className="mission-bill-strip">
                  <span>{mission.bill.type} {mission.bill.number}</span>
                  <div><strong>{mission.bill.title}</strong><small>{mission.bill.latestAction}</small></div>
                  <a href={mission.bill.url} target="_blank" rel="noreferrer" aria-label="Open the official bill"><ExternalLink size={18} /></a>
                </div>
                <div className="mission-objective"><BookOpen size={22} /><div><small>Your mission</small><strong>{mission.learningObjective}</strong></div><span>{mission.estimatedMinutes} min</span></div>
              </>
            )}

            {chapter === 1 && (
              <>
                <div className="mission-eyebrow">Chapter 2 · Before the evidence</div>
                <h1>What’s your first take?</h1>
                <p className="mission-lede">This is private. There is no “correct” political position—we want to see whether evidence changes your understanding.</p>
                <PositionPicker value={response.initialPosition} onChange={(value) => update({ initialPosition: value }, false)} />
                <fieldset className="mission-confidence">
                  <legend>How confident are you right now?</legend>
                  <div>{[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`Confidence ${value} of 5`} className={response.initialConfidence === value ? "is-selected" : ""} onClick={() => update({ initialConfidence: value }, false)} key={value}>{value}</button>)}</div>
                  <span><small>Just a hunch</small><small>Very certain</small></span>
                </fieldset>
              </>
            )}

            {chapter === 2 && (
              <>
                <div className="mission-eyebrow">Chapter 3 · Follow the evidence</div>
                <h1>What does the proposal actually do?</h1>
                <p className="mission-lede">Rate how each source-backed fact affects your thinking. Open the source whenever you want to inspect the official record.</p>
                <div className="mission-evidence-list">
                  {mission.evidence.map((card, index) => (
                    <article className="mission-evidence-card" key={card.id}>
                      <div className="mission-card-index">0{index + 1}</div>
                      <div><span className={`mission-perspective ${card.perspective}`}>{card.perspective === "fact" ? "Official record" : `${card.perspective} perspective`}</span><h2>{card.heading}</h2><p>{card.explanation}</p><SourceLinks mission={mission} sourceIds={card.sourceIds} /></div>
                      <div className="mission-evidence-rating" role="group" aria-label={`How ${card.heading} affects your view`}>
                        {[-2, -1, 0, 1, 2].map((value) => <button type="button" className={response.evidenceRatings[card.id] === value ? "is-selected" : ""} onClick={() => update({ evidenceRatings: { ...response.evidenceRatings, [card.id]: value } }, false)} key={value}>{value > 0 ? `+${value}` : value}</button>)}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {chapter === 3 && (
              <>
                <div className="mission-eyebrow">Chapter 4 · Hold two ideas</div>
                <h1>A strong opinion can survive a fair challenge.</h1>
                <p className="mission-lede">These are arguments derived from the proposal—not facts guaranteed by it. Read the best version of each case.</p>
                <div className="mission-perspective-grid">
                  <article><span>Case for the bill</span><Quote size={28} /><h2>{mission.evidence.find((card) => card.perspective === "supporting")?.heading}</h2><p>{mission.evidence.find((card) => card.perspective === "supporting")?.explanation}</p></article>
                  <article><span>Questioning the bill</span><Quote size={28} /><h2>{mission.evidence.find((card) => card.perspective === "opposing")?.heading}</h2><p>{mission.evidence.find((card) => card.perspective === "opposing")?.explanation}</p></article>
                </div>
                <div className="mission-note"><ShieldCheck size={18} /> CivicSpark never rewards a political position. It rewards careful use of evidence.</div>
              </>
            )}

            {chapter === 4 && (
              <>
                <div className="mission-eyebrow">Chapter 5 · Check your understanding</div>
                <h1>Separate the record from the rhetoric.</h1>
                <div className="mission-quiz">
                  {mission.questions.map((question, questionIndex) => {
                    const answer = response.answers[question.id];
                    return <fieldset key={question.id}><legend><span>0{questionIndex + 1}</span>{question.prompt}</legend><div>{question.choices.map((choice, choiceIndex) => <button type="button" className={`${answer === choiceIndex ? "is-selected" : ""} ${answer !== undefined && choiceIndex === question.correctChoice ? "is-correct" : ""}`} onClick={() => update({ answers: { ...response.answers, [question.id]: choiceIndex } }, false)} key={choice}>{choice}</button>)}</div>{answer !== undefined && <p className={answer === question.correctChoice ? "correct" : "incorrect"}>{answer === question.correctChoice ? "Correct. " : "Take another look. "}{question.explanation}</p>}<SourceLinks mission={mission} sourceIds={question.sourceIds} /></fieldset>;
                  })}
                </div>
              </>
            )}

            {chapter === 5 && (
              <>
                <div className="mission-eyebrow">Chapter 6 · Make it yours</div>
                <h1>Your experience is evidence Congress can’t get from a spreadsheet.</h1>
                <p className="mission-lede">CivicSpark will organize your words, but it will not invent a story or choose your position.</p>
                <label className="mission-text-label">Where does this issue show up in your life?<textarea value={response.personalConnection ?? ""} maxLength={800} onChange={(event) => update({ personalConnection: event.target.value }, false)} placeholder="Describe one real moment, habit, concern, or observation…" /></label>
                <label className="mission-text-label">What tradeoff should Congress pay attention to?<textarea value={response.reflection ?? ""} maxLength={800} onChange={(event) => update({ reflection: event.target.value }, false)} placeholder="Use something you learned from the evidence…" /></label>
                <h2 className="mission-subhead">Where do you land now?</h2>
                <PositionPicker value={response.finalPosition} onChange={(value) => update({ finalPosition: value }, false)} />
                <fieldset className="mission-confidence"><legend>How confident are you after reviewing the evidence?</legend><div>{[1, 2, 3, 4, 5].map((value) => <button type="button" className={response.finalConfidence === value ? "is-selected" : ""} onClick={() => update({ finalConfidence: value }, false)} key={value}>{value}</button>)}</div><span><small>Still exploring</small><small>Ready to explain</small></span></fieldset>
              </>
            )}

            {chapter === 6 && (
              <>
                <div className="mission-complete-icon"><CheckCircle2 size={36} /></div>
                <div className="mission-eyebrow">Mission complete · Submitted for review</div>
                <h1>Your voice is now part of the record.</h1>
                <p className="mission-lede">Your teacher can review your letter before including it in the class packet for {mission.representative.title} {mission.representative.name}.</p>
                <div className="mission-change-card"><div><small>Before</small><strong>{response.initialPosition ?? "—"}</strong><span>Confidence {response.initialConfidence ?? "—"}/5</span></div><ArrowRight size={24} /><div><small>After evidence</small><strong>{response.finalPosition ?? "—"}</strong><span>Confidence {response.finalConfidence ?? "—"}/5</span></div><div className="mission-score"><small>Knowledge check</small><strong>{score}/{mission.questions.length}</strong></div></div>
                <article className="mission-letter"><header><FileText size={18} /><strong>Letter awaiting teacher review</strong><span>{response.reviewStatus}</span></header><pre>{response.letter}</pre></article>
                <button className="mission-secondary" type="button" onClick={() => { localStorage.removeItem(`civicspark:mission-response:${mission.id}`); setResponse(null); setNickname(""); }}><RotateCcw size={16} /> Restart demo</button>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {chapter < 6 && (
        <footer className="mission-controls">
          <button className="mission-back" type="button" onClick={() => go(chapter - 1)} disabled={chapter === 0}><ArrowLeft size={17} /> Back</button>
          <span>Chapter {chapter + 1} of 7</span>
          {chapter === 5
            ? <button className="mission-primary compact" type="button" onClick={submitLetter} disabled={!canContinue}>Submit for review <ArrowRight size={17} /></button>
            : <button className="mission-primary compact" type="button" onClick={() => go(chapter + 1)} disabled={!canContinue}>Continue <ArrowRight size={17} /></button>}
        </footer>
      )}
    </main>
  );
}

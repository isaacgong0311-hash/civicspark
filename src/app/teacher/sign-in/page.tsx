"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function TeacherSignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } });
      setMessage(error ? error.message : "Check your inbox for a secure sign-in link.");
    } catch {
      setMessage("Teacher sign-in is not configured in this preview. Use the demo studio from the homepage.");
    } finally { setPending(false); }
  }

  return <main className="mission-join-shell"><section className="mission-join-card"><Link href="/" className="builder-back" style={{ color: "#aebed1" }}><ArrowLeft size={14} /> Back home</Link><div className="mission-eyebrow"><Mail size={14} /> Teacher access</div><h1>Your classroom,<br /><em>without passwords.</em></h1><p>We’ll email a one-time link. Students never need an account.</p><form onSubmit={signIn}><label htmlFor="teacher-email">Email address</label><input id="teacher-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teacher@example.org" /><button className="mission-primary" disabled={pending}>{pending ? "Sending…" : "Email my sign-in link"}</button></form>{message && <p role="status" style={{ margin: "16px 0 0", fontSize: 12 }}>{message}</p>}<div className="mission-privacy"><ShieldCheck size={16} /> Passwordless access powered by Supabase Auth.</div></section></main>;
}

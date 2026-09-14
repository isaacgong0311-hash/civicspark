"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, GraduationCap, Menu, Sparkles, X } from "lucide-react";

const links = [
  { href: "/teacher", label: "Teach", icon: GraduationCap },
  { href: "/bills", label: "Explore Congress", icon: Compass },
  { href: "/how-it-works", label: "How it works", icon: Sparkles },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><a href="#main-content" className="skip-link">Skip to main content</a><nav className="site-nav">
    <Link href="/" className="site-logo"><span className="site-logo-mark">C</span><span><strong>CivicSpark</strong><small>Classroom missions</small></span></Link>
    <div className={`site-links ${open ? "is-open" : ""}`}>
      {links.map(({ href, label, icon: Icon }) => <Link className={path === href || path.startsWith(`${href}/`) ? "is-active" : ""} href={href} key={href} onClick={() => setOpen(false)}><Icon size={14} />{label}</Link>)}
      <Link className="site-join-link" href="/mission/SPARK6" onClick={() => setOpen(false)}>Join a mission <span>→</span></Link>
    </div>
    <button className="site-menu" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</button>
  </nav></header>;
}

"use client";
import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // Use matchMedia against the layout viewport rather than window.innerWidth.
    // innerWidth can report scaled/incorrect values under mobile rendering, which
    // would wrongly treat a phone as desktop and render an overflowing layout.
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const check = () => setIsMobile(mql.matches);
    check();
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, [breakpoint]);
  return isMobile;
}

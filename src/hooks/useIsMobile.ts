"use client";
import { useState, useEffect, useLayoutEffect } from "react";

// useLayoutEffect on the server both does nothing and logs a warning; alias to
// useEffect there. The condition is fixed per environment (never changes
// between renders of a given app instance), so this doesn't violate the
// rules of hooks — the same pattern libraries like Framer Motion use.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useIsMobile(breakpoint = 768) {
  // Always start `false` so the client's first (hydration) render matches
  // what the server rendered — a lazy client-only initializer here would
  // mismatch the server markup and throw a hydration error.
  const [isMobile, setIsMobile] = useState(false);

  // useLayoutEffect (rather than useEffect) runs synchronously before the
  // browser paints, so the corrected value lands before the user ever sees
  // the wrong layout — this fixes the flicker without breaking hydration.
  useIsomorphicLayoutEffect(() => {
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

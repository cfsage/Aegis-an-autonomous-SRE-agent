"use client";

import { useEffect, useState } from "react";

/**
 * Detect user's `prefers-reduced-motion` preference.
 * Returns true when reduced motion is requested; UI should avoid
 * translate/scale/path-draw and snap values to final positions.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

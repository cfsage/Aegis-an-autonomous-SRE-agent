"use client";

import { useEffect, useState } from "react";

interface Options {
  count: number;
  stagger?: number;
  startDelay?: number;
  enabled?: boolean;
}

/**
 * Reveal N items in sequence. Returns an array of booleans
 * where `revealed[i]` flips true at `startDelay + i*stagger` ms.
 */
export function useStaggeredReveal({
  count,
  stagger = 80,
  startDelay = 0,
  enabled = true,
}: Options): boolean[] {
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array.from({ length: count }, () => false),
  );

  useEffect(() => {
    if (!enabled) {
      setRevealed(Array.from({ length: count }, () => true));
      return;
    }
    setRevealed(Array.from({ length: count }, () => false));
    const timeouts: number[] = [];
    for (let i = 0; i < count; i++) {
      const id = window.setTimeout(
        () => {
          setRevealed((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        },
        startDelay + i * stagger,
      );
      timeouts.push(id);
    }
    return () => {
      for (const t of timeouts) clearTimeout(t);
    };
  }, [count, stagger, startDelay, enabled]);

  return revealed;
}

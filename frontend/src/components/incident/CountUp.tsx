"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  /** Target value in seconds (e.g. 287 → "04:47"). */
  toSeconds: number;
  /** Duration of count-up in ms. */
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animated MTTR count-up. 0 → target in 1100ms ease-out-quint.
 * Uses Framer Motion's animate() + motion value so it's
 * frame-perfect at 60fps. Snaps to final on reduced motion.
 */
export function CountUp({ toSeconds, durationMs = 1100, className, style }: Props) {
  const reduced = useReducedMotion();
  const count = useMotionValue(reduced ? toSeconds : 0);
  const display = useTransform(count, (v) => {
    const total = Math.round(v);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (reduced) {
      count.set(toSeconds);
      return;
    }
    const controls = animate(count, toSeconds, {
      duration: durationMs / 1000,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [toSeconds, durationMs, count, reduced]);

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  );
}

"use client";

import { motion } from "framer-motion";
import { AgentStep } from "./AgentStep";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AgentEvent } from "@/types/agent-event";

interface Props {
  events: AgentEvent[];
  currentSeq: number;
}

/**
 * AgentTimeline — vertical list of AgentSteps with a hairline rail
 * on the left. The rail scaleY-reveals from origin top on load.
 */
export function AgentTimeline({ events, currentSeq }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className="surface relative">
      <div className="eyebrow px-5 pt-4 pb-2">agent timeline</div>

      <div className="relative">
        {/* Rail */}
        <motion.span
          aria-hidden
          className="absolute left-[18px] top-0 bottom-0 w-px bg-[color:var(--hairline-mid)] origin-top"
          initial={reduced ? { scaleY: 1 } : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
        <ul className="relative">
          {events.map((event, idx) => {
            const state =
              event.seq < currentSeq
                ? ("completed" as const)
                : event.seq === currentSeq
                  ? ("current" as const)
                  : ("pending" as const);
            return (
              <motion.div
                key={event.seq}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: 0.7 + idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <AgentStep
                  event={event}
                  state={state}
                  defaultExpanded={
                    event.step === "hypothesize" || event.step === "propose"
                  }
                />
                {idx < events.length - 1 && (
                  <span
                    aria-hidden
                    className="block h-px ml-9 mr-4 bg-[color:var(--hairline-soft)]"
                  />
                )}
              </motion.div>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

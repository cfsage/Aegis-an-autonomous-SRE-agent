import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import type { Severity } from "@/types/incident";

interface SeverityChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
  /** Optional label override (default = severity literal). */
  label?: string;
}

const severityColor: Record<Severity, string> = {
  P0: "var(--sev-p0)",
  P1: "var(--sev-p1)",
  P2: "var(--sev-p2)",
  P3: "var(--sev-p3)",
};

const severityBg: Record<Severity, string> = {
  P0: "oklch(58% 0.24 22 / 0.14)",
  P1: "oklch(70% 0.20 35 / 0.14)",
  P2: "oklch(75% 0.10 80 / 0.14)",
  P3: "oklch(65% 0.04 250 / 0.14)",
};

/**
 * Skewed parallelogram severity chip with clipped lower-right corner.
 * NOT a rounded pill. Counter-skewed label inside.
 */
export const SeverityChip = forwardRef<HTMLSpanElement, SeverityChipProps>(
  ({ severity, label, className, ...rest }, ref) => {
    const color = severityColor[severity];
    const bg = severityBg[severity];
    return (
      <span
        ref={ref}
        className={cn(
          "severity-chip inline-flex items-center",
          "relative isolate",
          "px-3 py-1",
          "font-mono text-[11px] font-medium tracking-[0.18em]",
          "transition-shadow duration-200 ease-out",
          className,
        )}
        style={{
          transform: "skewX(-6deg)",
          clipPath: "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
          background: bg,
          color,
          boxShadow:
            severity === "P0" || severity === "P1"
              ? "0 12px 32px -10px var(--ember-glow), inset 0 0 0 1px oklch(100% 0 0 / 0.06)"
              : "inset 0 0 0 1px oklch(100% 0 0 / 0.06)",
        }}
        {...rest}
      >
        <span
          className="inline-flex items-center gap-1.5"
          style={{ transform: "skewX(6deg)" }}
        >
          <span
            aria-hidden
            className="inline-block w-1 h-1 rounded-full"
            style={{ background: color }}
          />
          {label ?? severity}
        </span>
      </span>
    );
  },
);
SeverityChip.displayName = "SeverityChip";

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "open" | "investigating" | "proposing" | "awaiting" | "resolved";
  showDot?: boolean;
}

/**
 * Status pill — a thin underlined label, not a rounded pill.
 * Investigating uses ember; resolved uses ice cyan; everything else slate.
 */
export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, showDot = true, className, ...rest }, ref) => {
    const color =
      status === "investigating"
        ? "var(--ember-400)"
        : status === "resolved"
          ? "var(--ice-400)"
          : status === "open"
            ? "var(--sev-p0)"
            : "var(--oyster)";
    const label = status.toUpperCase();
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2",
          "font-mono text-[10.5px] uppercase tracking-[0.18em]",
          "border-b border-current pb-[2px]",
          className,
        )}
        style={{ color }}
        {...rest}
      >
        {showDot && (
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: color,
              boxShadow:
                status === "investigating"
                  ? "0 0 10px var(--ember-glow)"
                  : status === "resolved"
                    ? "0 0 10px var(--ice-glow)"
                    : "none",
              animation:
                status === "investigating"
                  ? "aegis-pulse-dot 1.8s var(--ease-in-out-soft) infinite"
                  : undefined,
            }}
          />
        )}
        {label}
      </span>
    );
  },
);
StatusPill.displayName = "StatusPill";

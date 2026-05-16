import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "ember" | "ice" | "muted";
}

/**
 * Aegis Badge — small mono label with a hairline border.
 * Used for chip-like metadata (deploy id, service name).
 * NOT a rounded pill — square 2px corners.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", ...rest }, ref) => {
    const toneClass =
      tone === "ember"
        ? "text-[color:var(--ember-400)] border-[color:var(--ember-edge)]"
        : tone === "ice"
          ? "text-[color:var(--ice-400)] border-[color:var(--ice-glow)]"
          : tone === "muted"
            ? "text-[color:var(--grave)] border-[color:var(--hairline-soft)]"
            : "text-[color:var(--oyster)] border-[color:var(--hairline-mid)]";
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5",
          "font-mono text-[10.5px]",
          "px-1.5 py-0.5 rounded-[2px]",
          "border",
          "uppercase tracking-[0.06em]",
          toneClass,
          className,
        )}
        {...rest}
      />
    );
  },
);
Badge.displayName = "Badge";

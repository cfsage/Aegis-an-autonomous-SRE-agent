/**
 * Formatting helpers — Aegis editorial voice.
 * Timestamps must always render with millisecond precision.
 */

export interface TimestampParts {
  /** "14:23:11" */
  primary: string;
  /** ".247Z" — dimmed sub-second portion */
  sub: string;
}

/**
 * Split an ISO timestamp into a primary HH:MM:SS portion and a dimmed
 * sub-second `.247Z` tail. Used by <Timestamp/> to render dimmed seconds.
 */
export function splitTimestamp(iso: string): TimestampParts {
  // Support both ISO ("2026-05-16T14:23:11.247Z") and bare time ("14:23:11.247Z").
  const time = iso.includes("T") ? iso.split("T")[1] : iso;
  const dotIdx = time.indexOf(".");
  if (dotIdx === -1) {
    return { primary: time.replace(/Z$/, ""), sub: "Z" };
  }
  return {
    primary: time.slice(0, dotIdx),
    sub: time.slice(dotIdx),
  };
}

/**
 * Format a duration in seconds as `mm:ss` (e.g. 287 → "04:47").
 */
export function formatMttr(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Format a percent value to 1 decimal (12.4%, not 12%).
 */
export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/**
 * Render an integer with thousands separators (4847 → "4,847").
 */
export function formatThousands(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Convert milliseconds to seconds with 1 decimal (1247 → "1.2s").
 */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Compute MTTR from incident detection time (ISO) to now-ish.
 * Returns whole seconds — never NaN.
 */
export function mttrSeconds(detectedAtIso: string, until?: Date): number {
  const start = new Date(detectedAtIso).getTime();
  const end = (until ?? new Date()).getTime();
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  // Cap demo value sensibly: spec wires the value to 287s (04:47).
  return Number.isFinite(diff) ? diff : 0;
}

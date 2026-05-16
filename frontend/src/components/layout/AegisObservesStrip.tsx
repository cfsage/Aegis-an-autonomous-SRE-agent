import { formatPct, formatThousands } from "@/lib/format";
import type { SelfMetrics } from "@/types/incident";

interface Props {
  metrics: SelfMetrics;
}

/**
 * "Aegis observes Aegis" — a dogfood telemetry strip.
 * Inline numerical run of the agent's own RPM, p95, error rate, status.
 * Mono numbers with intentional whitespace — reads like a ticker rule.
 */
export function AegisObservesStrip({ metrics }: Props) {
  return (
    <div className="px-6 md:px-10 py-2.5 border-b border-[color:var(--hairline-soft)]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px]">
        <span className="uppercase tracking-[0.22em] text-[color:var(--slate)]">
          aegis observes aegis
        </span>
        <Metric label="req/min" value={formatThousands(metrics.rpm)} />
        <Metric label="p95" value={`${metrics.p95Ms}ms`} />
        <Metric label="err" value={formatPct(metrics.errRatePct, 2)} />
        <Status status={metrics.status} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[color:var(--grave)]">{label}</span>
      <span
        data-num
        className="text-[color:var(--oyster)]"
      >
        {value}
      </span>
    </span>
  );
}

function Status({ status }: { status: SelfMetrics["status"] }) {
  const color =
    status === "healthy"
      ? "var(--status-healthy)"
      : status === "degraded"
        ? "var(--sev-p2)"
        : "var(--sev-p0)";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span className="uppercase tracking-[0.2em]" style={{ color }}>
        {status}
      </span>
    </span>
  );
}

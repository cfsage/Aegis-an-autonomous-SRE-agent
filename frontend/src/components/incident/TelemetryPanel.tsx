import { TelemetryChart } from "./TelemetryChart";
import type { MetricSeries } from "@/types/incident";

interface Props {
	metrics: MetricSeries;
}

/**
 * TelemetryPanel — three small-multiple charts in a vertical stack:
 * p95 latency (ember), error rate (ember), throughput (oyster, dropping).
 * Anomaly band drawn over the spike region (indices 40..52).
 */
export function TelemetryPanel({ metrics }: Props) {
	return (
		<aside className="surface" aria-labelledby="telemetry-eyebrow">
			<div id="telemetry-eyebrow" className="eyebrow px-5 pt-4 pb-2">
				telemetry · last 60s
			</div>
			<div className="px-5 pb-5 space-y-5">
				<TelemetryChart
					label="p95 latency"
					unit="ms"
					values={metrics.latencyP95Ms}
					anomalyBand={[40, 54]}
					tone="ember"
					peakCallout
				/>
				<TelemetryChart
					label="error rate"
					unit="%"
					values={metrics.errorRatePct}
					anomalyBand={[40, 54]}
					tone="ember"
				/>
				<TelemetryChart
					label="throughput rps"
					values={metrics.throughputRps}
					anomalyBand={[40, 54]}
					tone="neutral"
				/>
			</div>
			<div className="px-5 pt-3 pb-4 border-t border-[color:var(--hairline-soft)]">
				<p className="font-mono text-[11px] text-[color:var(--grave)] num">
					anomaly window · t-22s → t-9s
				</p>
			</div>
		</aside>
	);
}

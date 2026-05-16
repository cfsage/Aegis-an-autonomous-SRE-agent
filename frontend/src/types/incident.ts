/**
 * Incident type — the data shape that drives the war-room demo.
 * This mirrors the SSE event schema the backend will emit later;
 * the frontend is forward-compatible by design.
 */

import type { AgentEvent } from "./agent-event";

export type Severity = "P0" | "P1" | "P2" | "P3";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "proposing"
  | "awaiting"
  | "resolved";

export interface SelfMetrics {
  rpm: number;
  p95Ms: number;
  errRatePct: number;
  status: "healthy" | "degraded" | "down";
}

export interface MetricSeries {
  /** 60 datapoints of p95 latency in ms */
  latencyP95Ms: number[];
  /** 60 datapoints of error rate in % */
  errorRatePct: number[];
  /** 60 datapoints of throughput in rps */
  throughputRps: number[];
}

export interface ProposedRemediation {
  action: "rollback" | "scale" | "feature_flag" | "restart";
  target: string;
  summary: string;
  blastRadius: string;
  estDowntimeSec: number;
  rollbackMethod?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  detectedAt: string;
  detectedBy: string;
  affectedServices: string[];
  /** Decimal — 0.124 means 12.4% */
  affectedTraffic: number;
  selfMetrics: SelfMetrics;
  metrics: MetricSeries;
  agentEvents: AgentEvent[];
  proposedRemediation: ProposedRemediation;
  /** MTTR target in seconds for the demo count-up animation. */
  mttrSec: number;
}

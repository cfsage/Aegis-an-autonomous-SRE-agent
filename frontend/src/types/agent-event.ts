/**
 * Agent event types — emitted as the Aegis agent works the incident.
 * Each event has the same envelope (seq, step, ts, duration) plus a
 * payload variant determined by `step`.
 */

export type AgentStepKind =
  | "classify"
  | "gather"
  | "correlate"
  | "hypothesize"
  | "verify"
  | "propose";

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface Hypothesis {
  id: string;
  text: string;
  confidence: number;
  evidence: string[];
}

export interface ProposedAction {
  action: "rollback" | "scale" | "feature_flag" | "restart";
  target: string;
  from_version?: string;
  to_version?: string;
  blast_radius: string;
  est_downtime_sec: number;
  rollback_method?: string;
}

export interface AgentEventBase {
  seq: number;
  step: AgentStepKind;
  ts: string;
  duration_ms: number;
}

export interface ClassifyEvent extends AgentEventBase {
  step: "classify";
  summary: string;
}

export interface GatherEvent extends AgentEventBase {
  step: "gather";
  tool_call: ToolCall;
}

export interface CorrelateEvent extends AgentEventBase {
  step: "correlate";
  summary: string;
}

export interface HypothesizeEvent extends AgentEventBase {
  step: "hypothesize";
  payload: { hypotheses: Hypothesis[] };
}

export interface VerifyEvent extends AgentEventBase {
  step: "verify";
  summary: string;
  confidence: number;
}

export interface ProposeEvent extends AgentEventBase {
  step: "propose";
  payload: ProposedAction;
}

export type AgentEvent =
  | ClassifyEvent
  | GatherEvent
  | CorrelateEvent
  | HypothesizeEvent
  | VerifyEvent
  | ProposeEvent;

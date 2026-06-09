"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { AgentTimeline } from "@/components/incident/AgentTimeline";
import { ApprovalBar } from "@/components/incident/ApprovalBar";
import { IncidentHeader } from "@/components/incident/IncidentHeader";
import { TelemetryPanel } from "@/components/incident/TelemetryPanel";
import { PersimmonStrip } from "@/components/layout/PersimmonStrip";
import { EmberLoader } from "@/components/incident/EmberLoader";
import { Badge } from "@/components/ui/badge";
import { mockIncident } from "@/lib/mock-incident";
import {
	useIncident,
	useAgentStream,
	useApproveRemediation,
	useBackendStatus,
} from "@/hooks/useAegis";
import type { IncidentStatus } from "@/types/incident";

/**
 * /incidents/[id] — the war-room.
 * Tries to load real data from the backend; falls back to mockIncident
 * for demo mode. SSE events stream in real-time when live.
 */
export default function IncidentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const connected = useBackendStatus();
	const { data: liveIncident, loading, refetch } = useIncident(id ?? null);
	const { events } = useAgentStream(connected && id ? id : null);
	const { approve, loading: approving } = useApproveRemediation();

	// Determine if we're in live mode or demo mode
	const isLive = connected && liveIncident != null;

	// Map backend data into the shape the existing components expect
	const incident = isLive ? mapBackendToFrontend(liveIncident!) : mockIncident;
	const [status, setStatus] = useState<IncidentStatus>(incident.status);

	// Sync status when live incident updates
	useEffect(() => {
		if (isLive && liveIncident) {
			setStatus(mapStatus(liveIncident.status));
		}
	}, [isLive, liveIncident?.status]);

	const resolved = status === "resolved";
	const currentSeq = resolved
		? Number.POSITIVE_INFINITY
		: incident.agentEvents.length + 1;

	const handleApprove = async () => {
		if (!id) return;
		if (isLive) {
			const ok = await approve(id, true);
			if (ok) {
				setStatus("resolved");
				setTimeout(() => refetch(), 2000);
			}
		} else {
			setStatus("resolved");
		}
	};

	const handleReject = async () => {
		if (isLive && id) {
			await approve(id, false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh] gap-3">
				<EmberLoader />
				<span className="text-[14px] text-[color:var(--slate)]">
					Loading incident…
				</span>
			</div>
		);
	}

	return (
		<>
			<PersimmonStrip active={!resolved} />

			{/* Live/Demo indicator */}
			<div className="px-6 md:px-10 pt-2 flex justify-end">
				{isLive ? (
					<Badge tone="ember">
						<span
							className="inline-block size-1.5 rounded-full bg-[color:var(--status-healthy)] mr-1.5"
							style={{ boxShadow: "0 0 6px var(--status-healthy)" }}
						/>
						Live{events.length > 0 ? ` · ${events.length} events` : ""}
					</Badge>
				) : (
					<Badge tone="muted">Demo Mode</Badge>
				)}
			</div>

			<IncidentHeader incident={incident} status={status} />

			<div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 px-6 md:px-10 pb-32">
				<AgentTimeline events={incident.agentEvents} currentSeq={currentSeq} />
				<TelemetryPanel metrics={incident.metrics} />
			</div>

			<ApprovalBar
				remediation={incident.proposedRemediation}
				onApprove={handleApprove}
				resolved={resolved}
			/>
		</>
	);
}

// ── Mappers ──────────────────────────────────────────────────────

function mapStatus(s: string): IncidentStatus {
	const m: Record<string, IncidentStatus> = {
		open: "open",
		investigating: "investigating",
		identified: "proposing",
		monitoring: "awaiting",
		resolved: "resolved",
	};
	return m[s] ?? "investigating";
}

function mapBackendToFrontend(b: any) {
	// Convert backend steps to the AgentEvent shape the existing components expect
	const agentEvents = (b.steps ?? []).map((step: any, i: number) => {
		const ev: any = {
			seq: i + 1,
			step: step.step_type,
			ts: step.timestamp ?? new Date().toISOString(),
			duration_ms: step.duration_ms ?? 0,
			summary: step.reasoning || step.title,
		};

		// Map tool calls
		if (step.tool_calls?.length > 0) {
			const tc = step.tool_calls[0];
			ev.tool_call = {
				name: tc.tool_name,
				input: { summary: tc.input_summary },
				output: { summary: tc.output_summary },
			};
		}

		// Map hypotheses
		if (step.hypotheses?.length > 0) {
			ev.payload = {
				hypotheses: step.hypotheses.map((h: any) => ({
					id: h.id,
					text: h.description,
					confidence: h.confidence,
					evidence: h.evidence ?? [],
				})),
			};
		}

		// Confidence from verify steps
		if (step.step_type === "verify" && b.confidence) {
			ev.confidence = b.confidence;
		}

		// Propose step
		if (step.step_type === "propose" && b.remediation) {
			ev.payload = {
				action: b.remediation.type,
				target: b.affected_services?.[0] ?? "affected-service",
				blast_radius: b.remediation.blast_radius,
				rollback_method: b.remediation.rollback_plan,
			};
		}

		return ev;
	});

	return {
		...mockIncident,
		id: b.id,
		title: b.title,
		severity: b.severity,
		status: mapStatus(b.status),
		detectedAt: b.created_at,
		affectedServices: b.affected_services ?? [],
		mttrSec: b.mttr_seconds ?? 0,
		agentEvents,
		proposedRemediation: b.remediation
			? {
					action: b.remediation.type as any,
					target: b.affected_services?.[0] ?? "service",
					summary: b.remediation.description,
					blastRadius: b.remediation.blast_radius,
					estDowntimeSec: 0,
					rollbackMethod: b.remediation.rollback_plan,
				}
			: mockIncident.proposedRemediation,
	};
}

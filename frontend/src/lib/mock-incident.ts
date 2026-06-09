import type { Incident } from "@/types/incident";

/**
 * Realistic latency p95 series — 60 points, spike around index 42.
 * Asymmetric values. No round numbers.
 */
const latencyP95Ms = [
	87, 91, 88, 92, 89, 86, 90, 93, 88, 87, 91, 89, 92, 90, 88, 91, 87, 89, 92,
	90, 86, 88, 91, 89, 87, 90, 88, 92, 89, 87, 91, 88, 90, 87, 89, 92, 88, 91,
	89, 86, 88, 124, 247, 312, 408, 511, 587, 542, 498, 461, 432, 387, 318, 264,
	218, 187, 162, 142, 121, 108,
];

const errorRatePct = [
	0.02, 0.03, 0.02, 0.03, 0.02, 0.02, 0.03, 0.02, 0.03, 0.02, 0.03, 0.02, 0.02,
	0.03, 0.02, 0.03, 0.02, 0.02, 0.03, 0.02, 0.03, 0.02, 0.02, 0.03, 0.02, 0.03,
	0.02, 0.02, 0.03, 0.02, 0.03, 0.02, 0.02, 0.03, 0.02, 0.03, 0.02, 0.02, 0.03,
	0.02, 0.04, 0.34, 1.21, 2.43, 3.78, 4.72, 4.41, 3.89, 3.21, 2.47, 1.84, 1.21,
	0.78, 0.42, 0.21, 0.11, 0.06, 0.04, 0.03, 0.03,
];

const throughputRps = [
	124, 127, 121, 123, 125, 122, 126, 128, 124, 121, 127, 123, 125, 124, 122,
	126, 128, 124, 121, 127, 123, 125, 124, 122, 126, 128, 124, 121, 127, 123,
	125, 124, 122, 126, 128, 124, 121, 127, 123, 125, 121, 108, 96, 84, 78, 71,
	74, 81, 89, 97, 104, 112, 117, 121, 124, 126, 124, 123, 125, 124,
];

export const mockIncident: Incident = {
	id: "INC-2026-0042",
	title: "Checkout latency spike on shopping-cart-service",
	severity: "P1",
	status: "investigating",
	detectedAt: "2026-05-16T14:23:11.247Z",
	detectedBy: "Dynatrace · davis-anomaly",
	affectedServices: ["checkout-api", "cart-service", "payment-orchestrator"],
	affectedTraffic: 0.124,
	mttrSec: 287, // 04:47

	selfMetrics: {
		rpm: 4847,
		p95Ms: 84,
		errRatePct: 0.02,
		status: "healthy",
	},

	metrics: {
		latencyP95Ms,
		errorRatePct,
		throughputRps,
	},

	agentEvents: [
		{
			seq: 1,
			step: "classify",
			ts: "14:23:11.247Z",
			duration_ms: 312,
			summary:
				"P1 — checkout path, 12.4% of traffic, 3 services affected (checkout-api, cart-service, payment-orchestrator).",
		},
		{
			seq: 2,
			step: "gather",
			ts: "14:23:11.559Z",
			duration_ms: 1247,
			tool_call: {
				name: "dynatrace.problems.get",
				input: { window: "5m" },
				output: {
					problem_id: "PRB-7af3",
					entities: ["cart-service-7c9d"],
					severity: "AVAILABILITY",
				},
			},
		},
		{
			seq: 3,
			step: "gather",
			ts: "14:23:12.806Z",
			duration_ms: 1622,
			tool_call: {
				name: "dynatrace.traces.search",
				input: { service: "cart-service", limit: 200 },
				output: { count: 187, slow_pct: 41.2 },
			},
		},
		{
			seq: 4,
			step: "gather",
			ts: "14:23:14.428Z",
			duration_ms: 894,
			tool_call: {
				name: "dynatrace.deployments.list",
				input: { service: "cart-service", window: "1h" },
				output: {
					deployments: [
						{
							id: "abc1234",
							author: "Maya Chen",
							at: "14:18:42Z",
							message: "feat(cart): inline session cache",
						},
					],
				},
			},
		},
		{
			seq: 5,
			step: "correlate",
			ts: "14:23:15.322Z",
			duration_ms: 1108,
			summary:
				"Latency rose 3.2× starting 14:18:51Z — 9s after Maya Chen's deploy abc1234 'feat(cart): inline session cache'.",
		},
		{
			seq: 6,
			step: "hypothesize",
			ts: "14:23:16.430Z",
			duration_ms: 1947,
			payload: {
				hypotheses: [
					{
						id: "h1",
						text: "Unbounded session cache → memory pressure → GC pauses",
						confidence: 78,
						evidence: [
							"heap usage +180% post-deploy",
							"GC pause p95 47ms → 312ms",
							"no rise in upstream request volume",
						],
					},
					{
						id: "h2",
						text: "Downstream payment-svc slowdown",
						confidence: 31,
						evidence: [
							"payment-svc p95 nominal at 41ms",
							"but dependency call count unchanged",
						],
					},
				],
			},
		},
		{
			seq: 7,
			step: "verify",
			ts: "14:23:18.377Z",
			duration_ms: 1421,
			summary:
				"Confirmed h1. Heap on cart-service-7c9d sits at 87% (norm: 31%). GC pauses 6× normal cadence.",
			confidence: 92,
		},
		{
			seq: 8,
			step: "propose",
			ts: "14:23:19.798Z",
			duration_ms: 0,
			payload: {
				action: "rollback",
				target: "shopping-cart-service",
				from_version: "abc1234",
				to_version: "abc1233",
				blast_radius:
					"Single deployment, no schema change, no downstream contract change.",
				est_downtime_sec: 0,
				rollback_method: "kubectl rollout undo deployment/cart-service",
			},
		},
	],

	proposedRemediation: {
		action: "rollback",
		target: "shopping-cart-service",
		summary:
			"Rollback shopping-cart-service to abc1233 (Maya Chen, 4m ago — feat(cart): inline session cache).",
		blastRadius:
			"Single deployment, no schema change. Cart traffic re-routes to abc1233 via standard rolling restart.",
		estDowntimeSec: 0,
		rollbackMethod: "kubectl rollout undo deployment/cart-service",
	},
};

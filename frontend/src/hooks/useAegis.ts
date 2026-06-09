"use client";

/**
 * useAegis — Hooks for connecting the frontend to the FastAPI backend.
 * Provides real-time data fetching, SSE streaming, and graceful
 * fallback to mock data when the backend is unreachable.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Backend connectivity ─────────────────────────────────────────

export function useBackendStatus(pollMs = 20_000) {
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		let active = true;
		const check = async () => {
			try {
				const res = await fetch(`${API}/health`, {
					signal: AbortSignal.timeout(3000),
				});
				if (active) setConnected(res.ok);
			} catch {
				if (active) setConnected(false);
			}
		};
		check();
		const id = setInterval(check, pollMs);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, [pollMs]);

	return connected;
}

// ── Generic fetcher ──────────────────────────────────────────────

function useApiFetch<T>(path: string, fallback: T, refreshMs = 0) {
	const [data, setData] = useState<T>(fallback);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			const res = await fetch(`${API}${path}`, {
				signal: AbortSignal.timeout(8000),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setData(json);
			setError(null);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}, [path]);

	useEffect(() => {
		fetchData();
		if (refreshMs > 0) {
			const id = setInterval(fetchData, refreshMs);
			return () => clearInterval(id);
		}
	}, [fetchData, refreshMs]);

	return { data, loading, error, refetch: fetchData };
}

// ── Dashboard metrics ────────────────────────────────────────────

export interface DashboardMetrics {
	total_incidents: number;
	open_incidents: number;
	resolved_incidents: number;
	avg_mttr_seconds: number;
	p0_count: number;
	p1_count: number;
	p2_count: number;
	p3_count: number;
	severity_distribution: Record<string, number>;
}

const EMPTY_METRICS: DashboardMetrics = {
	total_incidents: 0,
	open_incidents: 0,
	resolved_incidents: 0,
	avg_mttr_seconds: 0,
	p0_count: 0,
	p1_count: 0,
	p2_count: 0,
	p3_count: 0,
	severity_distribution: {},
};

export function useDashboardMetrics() {
	return useApiFetch<DashboardMetrics>(
		"/api/incidents/metrics",
		EMPTY_METRICS,
		10_000,
	);
}

// ── Incidents list ───────────────────────────────────────────────

export interface IncidentSummary {
	id: string;
	title: string;
	severity: string;
	status: string;
	root_cause: string | null;
	confidence: number | null;
	created_at: string;
	resolved_at: string | null;
	mttr_seconds: number | null;
	step_count: number;
}

export function useIncidents(status?: string) {
	const qs = status ? `?status=${status}` : "";
	return useApiFetch<IncidentSummary[]>(`/api/incidents${qs}`, [], 8_000);
}

// ── Single incident ──────────────────────────────────────────────

export interface BackendIncident {
	id: string;
	title: string;
	severity: string;
	status: string;
	steps: any[];
	hypotheses: any[];
	root_cause: string | null;
	confidence: number | null;
	remediation: any | null;
	affected_services: string[];
	created_at: string;
	resolved_at: string | null;
	mttr_seconds: number | null;
	rca_report: string | null;
}

export function useIncident(id: string | null) {
	return useApiFetch<BackendIncident | null>(
		id ? `/api/incidents/${id}` : "",
		null,
		5_000,
	);
}

// ── SSE Agent Stream ─────────────────────────────────────────────

export interface AgentSSEEvent {
	event_type: string;
	step_type?: string;
	data: Record<string, any>;
	timestamp: string;
}

export function useAgentStream(incidentId: string | null) {
	const [events, setEvents] = useState<AgentSSEEvent[]>([]);
	const [live, setLive] = useState(false);
	const esRef = useRef<EventSource | null>(null);

	useEffect(() => {
		if (!incidentId) return;
		const es = new EventSource(`${API}/api/stream/${incidentId}`);
		esRef.current = es;
		setLive(true);

		es.onmessage = (e) => {
			try {
				const parsed: AgentSSEEvent = JSON.parse(e.data);
				setEvents((prev) => [...prev, parsed]);
			} catch {
				/* skip malformed */
			}
		};

		es.onerror = () => {
			setLive(false);
			es.close();
		};

		return () => {
			es.close();
			esRef.current = null;
			setLive(false);
		};
	}, [incidentId]);

	return { events, live };
}

// ── Approval action ──────────────────────────────────────────────

export function useApproveRemediation() {
	const [loading, setLoading] = useState(false);

	const approve = async (incidentId: string, approved: boolean) => {
		setLoading(true);
		try {
			const res = await fetch(`${API}/api/approve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ incident_id: incidentId, approved }),
			});
			return res.ok;
		} catch {
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { approve, loading };
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
	useBackendStatus,
	useDashboardMetrics,
	useIncidents,
} from "@/hooks/useAegis";
import { Badge } from "@/components/ui/badge";
import { SeverityChip, StatusPill } from "@/components/ui/tag";
import { EmberLoader } from "@/components/incident/EmberLoader";
import type { Severity } from "@/types/incident";

const spring = { type: "spring" as const, stiffness: 300, damping: 28 };

function MetricCard({
	label,
	value,
	sub,
}: { label: string; value: string | number; sub?: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={spring}
			className="surface px-5 py-4"
		>
			<div className="eyebrow mb-1">{label}</div>
			<div
				className="font-display italic text-[color:var(--bone)]"
				style={{
					fontSize: "clamp(2rem, 1.5rem + 2vw, 3rem)",
					lineHeight: 1.05,
					fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
				}}
			>
				{value}
			</div>
			{sub && (
				<div className="font-mono text-[11px] text-[color:var(--slate)] mt-1 num">
					{sub}
				</div>
			)}
		</motion.div>
	);
}

function SeverityBar({
	severity,
	count,
	total,
}: { severity: string; count: number; total: number }) {
	const pct = total > 0 ? (count / total) * 100 : 0;
	const isHot = severity === "P0" || severity === "P1";
	return (
		<div className="flex items-center gap-3">
			<span className="font-mono text-[11px] text-[color:var(--slate)] w-6">
				{severity}
			</span>
			<div className="flex-1 h-2 rounded-full bg-[color:var(--ink-elevated)] overflow-hidden">
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
					className="h-full rounded-full"
					style={{
						background: isHot ? "var(--ember-400)" : "var(--oyster)",
						boxShadow: isHot ? "0 0 12px var(--ember-glow)" : "none",
					}}
				/>
			</div>
			<span className="font-mono text-[11px] text-[color:var(--bone)] w-6 text-right num">
				{count}
			</span>
		</div>
	);
}

export default function DashboardPage() {
	const connected = useBackendStatus();
	const { data: metrics, loading: mLoading } = useDashboardMetrics();
	const { data: incidents, loading: iLoading } = useIncidents();

	const mttrDisplay =
		metrics.avg_mttr_seconds > 0
			? `${Math.floor(metrics.avg_mttr_seconds / 60)}:${String(Math.floor(metrics.avg_mttr_seconds % 60)).padStart(2, "0")}`
			: "—";

	return (
		<div className="px-6 md:px-10 py-8 space-y-8">
			{/* ── Header ── */}
			<div className="flex items-center justify-between">
				<div>
					<h1
						className="font-display italic text-[color:var(--bone)]"
						style={{
							fontSize: "clamp(1.75rem, 1rem + 2vw, 2.5rem)",
							lineHeight: 1.08,
							fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
						}}
					>
						Command Center
					</h1>
					<p className="text-[13px] text-[color:var(--oyster)] mt-1">
						Autonomous SRE agent overview — powered by Gemini + Dynatrace MCP
					</p>
				</div>
				<div className="flex items-center gap-3">
					{connected ? (
						<Badge tone="ember">
							<span
								className="inline-block size-1.5 rounded-full bg-[color:var(--status-healthy)] mr-1.5"
								style={{ boxShadow: "0 0 6px var(--status-healthy)" }}
							/>
							Live — API Connected
						</Badge>
					) : (
						<Badge tone="muted">Demo Mode</Badge>
					)}
				</div>
			</div>

			{/* ── Metric cards ── */}
			{mLoading ? (
				<div className="flex items-center gap-3 py-8">
					<EmberLoader />
					<span className="text-[13px] text-[color:var(--slate)]">
						Fetching metrics…
					</span>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<MetricCard label="total incidents" value={metrics.total_incidents} />
					<MetricCard
						label="open"
						value={metrics.open_incidents}
						sub={`${metrics.resolved_incidents} resolved`}
					/>
					<MetricCard
						label="avg mttr"
						value={mttrDisplay}
						sub="minutes:seconds"
					/>
					<MetricCard
						label="ai confidence"
						value={
							incidents.length > 0 && incidents[0].confidence
								? `${incidents[0].confidence}%`
								: "—"
						}
					/>
				</div>
			)}

			{/* ── Severity distribution ── */}
			<section>
				<div className="eyebrow mb-4">severity distribution</div>
				<div className="surface px-5 py-4 space-y-3 max-w-md">
					{["P0", "P1", "P2", "P3"].map((s) => (
						<SeverityBar
							key={s}
							severity={s}
							count={(metrics as any)[`${s.toLowerCase()}_count`] ?? 0}
							total={metrics.total_incidents || 1}
						/>
					))}
				</div>
			</section>

			{/* ── Recent incidents ── */}
			<section>
				<div className="flex items-center justify-between mb-4">
					<div className="eyebrow">recent incidents</div>
					<Link
						href="/incidents"
						className="font-mono text-[11px] text-[color:var(--ember-400)] hover:text-[color:var(--ember-300)] transition-colors"
					>
						view all →
					</Link>
				</div>
				{iLoading ? (
					<div className="flex items-center gap-3 py-6">
						<EmberLoader />
						<span className="text-[13px] text-[color:var(--slate)]">
							Loading…
						</span>
					</div>
				) : incidents.length === 0 ? (
					<div className="surface px-5 py-8 text-center">
						<p className="text-[14px] text-[color:var(--oyster)]">
							No incidents yet. Trigger one via the Dynatrace webhook.
						</p>
						<p className="font-mono text-[11px] text-[color:var(--grave)] mt-2">
							POST /api/webhooks/dynatrace
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{incidents.slice(0, 5).map((inc, i) => (
							<motion.div
								key={inc.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: i * 0.06 }}
							>
								<Link
									href={`/incidents/${inc.id}`}
									className="surface flex items-center gap-4 px-5 py-3.5 hover:bg-[color:var(--ink-elevated)] transition-colors group"
								>
									<SeverityChip severity={inc.severity as Severity} />
									<div className="flex-1 min-w-0">
										<div className="text-[14px] text-[color:var(--bone)] truncate group-hover:text-[color:var(--ember-400)] transition-colors">
											{inc.title}
										</div>
										<div className="font-mono text-[11px] text-[color:var(--slate)] mt-0.5">
											{inc.root_cause ?? "Investigating…"}
										</div>
									</div>
									<div className="text-right shrink-0">
										{inc.confidence != null && (
											<div className="font-mono text-[12px] text-[color:var(--ember-400)] num">
												{inc.confidence}%
											</div>
										)}
										<div className="font-mono text-[10px] text-[color:var(--grave)] mt-0.5">
											{inc.step_count}/10 steps
										</div>
									</div>
									<StatusPill status={inc.status as any} />
								</Link>
							</motion.div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

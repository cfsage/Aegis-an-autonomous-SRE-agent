"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useBackendStatus, useIncidents } from "@/hooks/useAegis";
import { Badge } from "@/components/ui/badge";
import { SeverityChip, StatusPill } from "@/components/ui/tag";
import { EmberLoader } from "@/components/incident/EmberLoader";
import type { Severity } from "@/types/incident";

const filters = [
	"all",
	"open",
	"investigating",
	"identified",
	"monitoring",
	"resolved",
] as const;
const spring = { type: "spring" as const, stiffness: 300, damping: 28 };

export default function IncidentsListPage() {
	const connected = useBackendStatus();
	const [filter, setFilter] = useState<string>("all");
	const { data: incidents, loading } = useIncidents(
		filter === "all" ? undefined : filter,
	);

	const timeAgo = (iso: string) => {
		const d = Date.now() - new Date(iso).getTime();
		if (d < 60_000) return "just now";
		if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
		if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
		return `${Math.floor(d / 86_400_000)}d ago`;
	};

	return (
		<div className="px-6 md:px-10 py-8 space-y-6">
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
						Incidents
					</h1>
					<p className="text-[13px] text-[color:var(--oyster)] mt-1">
						{incidents.length} total incidents
					</p>
				</div>
				<div className="flex items-center gap-3">
					{connected ? (
						<Badge tone="ember">
							<span
								className="inline-block size-1.5 rounded-full bg-[color:var(--status-healthy)] mr-1.5"
								style={{ boxShadow: "0 0 6px var(--status-healthy)" }}
							/>
							Live
						</Badge>
					) : (
						<Badge tone="muted">Demo</Badge>
					)}
				</div>
			</div>

			{/* ── Filter tabs ── */}
			<div className="flex items-center gap-1.5 flex-wrap">
				{filters.map((f) => (
					<button
						key={f}
						type="button"
						onClick={() => setFilter(f)}
						className={[
							"px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] rounded-[3px] transition-colors",
							filter === f
								? "bg-[color:var(--ember-400)] text-[color:var(--ink-canvas)]"
								: "text-[color:var(--oyster)] hover:text-[color:var(--bone)] hover:bg-[color:var(--ink-elevated)]",
						].join(" ")}
					>
						{f}
					</button>
				))}
			</div>

			{/* ── Incident list ── */}
			{loading ? (
				<div className="flex items-center gap-3 py-12">
					<EmberLoader />
					<span className="text-[13px] text-[color:var(--slate)]">
						Loading incidents…
					</span>
				</div>
			) : incidents.length === 0 ? (
				<div className="surface px-6 py-12 text-center">
					<p className="text-[15px] text-[color:var(--oyster)]">
						No incidents found.
					</p>
					<p className="font-mono text-[11px] text-[color:var(--grave)] mt-2">
						Trigger one with a Dynatrace webhook → POST /api/webhooks/dynatrace
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{incidents.map((inc, i) => (
						<motion.div
							key={inc.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...spring, delay: i * 0.04 }}
						>
							<Link
								href={`/incidents/${inc.id}`}
								className="surface flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--ink-elevated)] transition-colors group"
							>
								<SeverityChip severity={inc.severity as Severity} />

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<StatusPill status={inc.status as any} />
										<span className="font-mono text-[10px] text-[color:var(--grave)]">
											{inc.id.slice(0, 8)}
										</span>
										<span className="font-mono text-[10px] text-[color:var(--grave)]">
											· {timeAgo(inc.created_at)}
										</span>
									</div>
									<div className="text-[14px] text-[color:var(--bone)] mt-1 truncate group-hover:text-[color:var(--ember-400)] transition-colors">
										{inc.title}
									</div>
									{inc.root_cause && (
										<div className="font-mono text-[11px] text-[color:var(--slate)] mt-0.5 truncate">
											Root cause: {inc.root_cause}
										</div>
									)}
								</div>

								<div className="text-right shrink-0">
									{inc.confidence != null && (
										<div className="font-mono text-[13px] text-[color:var(--ember-400)] num font-medium">
											{inc.confidence}%
										</div>
									)}
									<div className="font-mono text-[10px] text-[color:var(--grave)] mt-0.5">
										{inc.step_count}/10 steps
									</div>
								</div>
							</Link>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}

"use client";

import { motion } from "framer-motion";
import { Timestamp } from "./Timestamp";
import { CountUp } from "./CountUp";
import { SeverityChip, StatusPill } from "@/components/ui/tag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Incident, IncidentStatus } from "@/types/incident";
import { formatPct } from "@/lib/format";

interface Props {
	incident: Incident;
	status: IncidentStatus;
}

/**
 * IncidentHeader — the broadsheet headline of the war-room.
 * Left ember bar (blockquote stripe from print), serif italic title
 * with character-by-character mask reveal, MTTR + severity + status row.
 */
export function IncidentHeader({ incident, status }: Props) {
	const reduced = useReducedMotion();
	const chars = incident.title.split("");
	return (
		<section
			aria-labelledby="incident-title"
			className="relative px-6 md:px-10 py-10 md:py-14"
		>
			{/* Left ember bar (the print blockquote stripe) */}
			<span
				aria-hidden
				className="absolute left-0 top-10 bottom-10 w-[2px]"
				style={{
					background:
						"linear-gradient(180deg, var(--ember-400) 0%, var(--ember-400) 40%, transparent 100%)",
				}}
			/>

			<motion.div
				className="eyebrow mb-6"
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.28, delay: 0.16, ease: "easeOut" }}
			>
				<span>incident · {incident.id} · </span>
				<span className="ts inline-block">
					<Timestamp iso={incident.detectedAt} />
				</span>
			</motion.div>

			<h1
				id="incident-title"
				className="incident-title font-display italic text-[color:var(--bone)]"
				style={{
					fontSize: "var(--text-title)",
					lineHeight: 1.05,
					letterSpacing: "var(--tracking-title)",
					fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
				}}
			>
				{reduced ? (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2, delay: 0.2 }}
					>
						{incident.title}
					</motion.span>
				) : (
					<span aria-label={incident.title}>
						{chars.map((ch, i) => (
							<motion.span
								key={i}
								aria-hidden
								className="inline-block"
								initial={{ opacity: 0, y: 14 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.42,
									delay: 0.22 + i * 0.012,
									ease: [0.22, 1, 0.36, 1],
								}}
								style={{ whiteSpace: ch === " " ? "pre" : "normal" }}
							>
								{ch}
							</motion.span>
						))}
					</span>
				)}
			</h1>

			<motion.div
				className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.32, delay: 0.46, ease: "easeOut" }}
			>
				<div>
					<div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)] mb-1">
						MTTR
					</div>
					<CountUp
						toSeconds={incident.mttrSec}
						className="block font-display text-[color:var(--bone)] num"
						style={{
							fontSize: "clamp(2.5rem, 1.5rem + 4vw, 4rem)",
							lineHeight: 0.95,
							letterSpacing: "-0.04em",
							fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 144",
							fontWeight: 400,
						}}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
						severity · status
					</div>
					<div className="flex items-center gap-3">
						<motion.span
							initial={{ scale: 0.92, opacity: 0 }}
							animate={{ scale: [0.92, 1.04, 1], opacity: 1 }}
							transition={{
								duration: 0.7,
								delay: 0.52,
								ease: [0.22, 1, 0.36, 1],
							}}
							className="inline-block"
						>
							<SeverityChip severity={incident.severity} />
						</motion.span>
						<StatusPill status={status} />
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
						detected by
					</div>
					<div className="font-mono text-[12px] text-[color:var(--oyster)]">
						{incident.detectedBy}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
						blast radius
					</div>
					<div className="font-mono text-[12px] text-[color:var(--oyster)] num">
						{formatPct(incident.affectedTraffic * 100)} of traffic ·{" "}
						{incident.affectedServices.length} services
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
						audit ledger
					</div>
					<button
						type="button"
						onClick={() => {
							const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(incident, null, 2))}`;
							const downloadAnchor = document.createElement("a");
							downloadAnchor.setAttribute("href", dataStr);
							downloadAnchor.setAttribute(
								"download",
								`aegis-audit-incident-${incident.id}.json`,
							);
							document.body.appendChild(downloadAnchor);
							downloadAnchor.click();
							downloadAnchor.remove();
						}}
						className="px-3 py-1 border border-[color:var(--hairline-mid)] hover:border-[color:var(--ember-400)] hover:text-[color:var(--ember-400)] text-[11px] font-mono uppercase tracking-[0.1em] transition-all rounded bg-elevated cursor-pointer"
					>
						Export JSON ↓
					</button>
				</div>
			</motion.div>
		</section>
	);
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { EmberLoader } from "./EmberLoader";
import { Timestamp } from "./Timestamp";
import { ToolCallCard } from "./ToolCallCard";
import { HypothesisCard } from "./HypothesisCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AgentEvent } from "@/types/agent-event";
import { cn } from "@/lib/cn";

interface Props {
	event: AgentEvent;
	state: "completed" | "current" | "pending";
	defaultExpanded?: boolean;
}

const stepLabels: Record<AgentEvent["step"], string> = {
	classify: "classify",
	gather: "gather",
	correlate: "correlate",
	hypothesize: "hypothesize",
	verify: "verify",
	propose: "propose",
};

/**
 * AgentStep — a single row in the agent timeline.
 * - Diamond marker (◆) bordered with hairline; ember when current; ice when resolved.
 * - Expandable body shows tool call / hypotheses / structured payload.
 * - Hover fades the background to elevated.
 */
export function AgentStep({ event, state, defaultExpanded = false }: Props) {
	const reduced = useReducedMotion();
	const [open, setOpen] = useState(defaultExpanded || state === "current");
	const isCurrent = state === "current";

	const expandable = hasExpandableBody(event);

	return (
		<li
			className={cn(
				"relative pl-9 pr-4 py-3 transition-colors duration-200 ease-out",
				"hover:bg-[color:var(--ink-elevated)]",
			)}
		>
			{/* Diamond marker */}
			<span
				aria-hidden
				className="absolute left-3 top-4 size-3 rotate-45"
				style={{
					background:
						state === "completed"
							? "var(--ink-canvas)"
							: isCurrent
								? "var(--ember-400)"
								: "transparent",
					border:
						state === "pending"
							? "1px dashed var(--grave)"
							: `1px solid ${isCurrent ? "var(--ember-400)" : "var(--oyster)"}`,
					boxShadow: isCurrent ? "0 0 12px var(--ember-glow)" : undefined,
				}}
			/>

			<button
				type="button"
				onClick={() => expandable && setOpen((v) => !v)}
				disabled={!expandable}
				className={cn(
					"w-full flex items-baseline justify-between gap-4 text-left",
					expandable ? "cursor-pointer" : "cursor-default",
				)}
				aria-expanded={open}
			>
				<div className="flex items-baseline gap-3 min-w-0">
					<span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)] shrink-0">
						<Timestamp iso={event.ts} />
					</span>
					<span
						className="font-display italic text-[15px] text-[color:var(--bone)]"
						style={{ fontVariationSettings: "'SOFT' 60, 'opsz' 24" }}
					>
						{stepLabels[event.step]}
					</span>
					{isCurrent && <EmberLoader />}
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{event.duration_ms > 0 && (
						<span className="font-mono text-[10.5px] text-[color:var(--grave)] num">
							{event.duration_ms}ms
						</span>
					)}
					{expandable && (
						<ChevronRight
							className={cn(
								"size-3 text-[color:var(--slate)] transition-transform duration-200 ease-out",
								open && "rotate-90",
							)}
						/>
					)}
				</div>
			</button>

			<StepSummary event={event} />

			<AnimatePresence initial={false}>
				{open && expandable && (
					<motion.div
						key="body"
						layout
						initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
						animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
						exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
						transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
					>
						<ExpandedBody event={event} />
					</motion.div>
				)}
			</AnimatePresence>
		</li>
	);
}

function hasExpandableBody(event: AgentEvent): boolean {
	return (
		event.step === "gather" ||
		event.step === "hypothesize" ||
		event.step === "propose"
	);
}

function StepSummary({ event }: { event: AgentEvent }) {
	if (event.step === "classify" || event.step === "correlate") {
		return (
			<p className="mt-1 text-[13.5px] text-[color:var(--oyster)] max-w-[60ch]">
				{event.summary}
			</p>
		);
	}
	if (event.step === "verify") {
		return (
			<p className="mt-1 text-[13.5px] text-[color:var(--oyster)] max-w-[60ch]">
				{event.summary}{" "}
				<span className="font-mono text-[color:var(--ember-400)] num">
					({event.confidence}% confidence)
				</span>
			</p>
		);
	}
	if (event.step === "gather") {
		return (
			<p className="mt-1 font-mono text-[12px] text-[color:var(--oyster)]">
				▸ {event.tool_call.name}
			</p>
		);
	}
	if (event.step === "hypothesize") {
		return (
			<p className="mt-1 text-[13.5px] text-[color:var(--oyster)]">
				{event.payload.hypotheses.length} hypotheses · leading:{" "}
				<span className="text-[color:var(--bone)]">
					{event.payload.hypotheses[0].text}
				</span>
			</p>
		);
	}
	if (event.step === "propose") {
		return (
			<p className="mt-1 text-[13.5px] text-[color:var(--oyster)]">
				{event.payload.action} · {event.payload.target}
			</p>
		);
	}
	return null;
}

function ExpandedBody({ event }: { event: AgentEvent }) {
	if (event.step === "gather") {
		return (
			<ToolCallCard tool={event.tool_call} durationMs={event.duration_ms} />
		);
	}
	if (event.step === "hypothesize") {
		return (
			<div className="space-y-0">
				{event.payload.hypotheses.map((h, i) => (
					<HypothesisCard key={h.id} hypothesis={h} rank={i} />
				))}
			</div>
		);
	}
	if (event.step === "propose") {
		const p = event.payload;
		return (
			<div className="surface mt-3 px-4 py-3 bg-[color:var(--ink-elevated)]">
				<div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
					<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
						action
					</span>
					<span className="font-mono text-[color:var(--bone)]">{p.action}</span>
					<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
						target
					</span>
					<span className="font-mono text-[color:var(--bone)]">{p.target}</span>
					{p.from_version && (
						<>
							<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
								from
							</span>
							<span className="font-mono text-[color:var(--oyster)]">
								{p.from_version}
							</span>
						</>
					)}
					{p.to_version && (
						<>
							<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
								to
							</span>
							<span className="font-mono text-[color:var(--ember-400)]">
								{p.to_version}
							</span>
						</>
					)}
					<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
						blast
					</span>
					<span className="text-[color:var(--oyster)]">{p.blast_radius}</span>
					{p.rollback_method && (
						<>
							<span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
								cmd
							</span>
							<code className="font-mono text-[12px] text-[color:var(--bone)]">
								{p.rollback_method}
							</code>
						</>
					)}
				</div>
			</div>
		);
	}
	return null;
}

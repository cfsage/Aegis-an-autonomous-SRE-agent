"use client";

import { motion } from "framer-motion";
import type { Hypothesis } from "@/types/agent-event";

interface Props {
	hypothesis: Hypothesis;
	rank: number;
}

/**
 * HypothesisCard — the agent's reasoning made tactile.
 * Confidence is a hairline bar with ember fill — not a progress ring.
 * Evidence renders as bulleted mono lines, indented with a half-em rule.
 */
export function HypothesisCard({ hypothesis, rank }: Props) {
	const isLeading = rank === 0;
	const color = isLeading ? "var(--ember-400)" : "var(--slate)";
	return (
		<div
			className="surface mt-3 px-4 py-3"
			style={{
				background: isLeading
					? "linear-gradient(180deg, var(--ember-wash) 0%, transparent 100%)"
					: "var(--ink-elevated)",
			}}
		>
			<div className="flex items-baseline justify-between gap-3 mb-2">
				<span
					className="font-mono text-[10.5px] uppercase tracking-[0.18em]"
					style={{ color }}
				>
					h{rank + 1}
					{isLeading && (
						<span className="text-[color:var(--slate)] tracking-normal normal-case ml-2">
							leading
						</span>
					)}
				</span>
				<span className="font-mono text-[11px] num" style={{ color }}>
					{hypothesis.confidence}% confidence
				</span>
			</div>

			<p className="text-[14px] text-[color:var(--bone)] mb-3">
				{hypothesis.text}
			</p>

			{/* Confidence bar — hairline track + ember fill */}
			<div className="relative h-px mb-3 bg-[color:var(--hairline-soft)]">
				<motion.div
					className="absolute inset-y-0 left-0 origin-left"
					style={{
						background: color,
						boxShadow: isLeading ? "0 0 6px var(--ember-glow)" : undefined,
						width: `${hypothesis.confidence}%`,
					}}
					initial={{ scaleX: 0 }}
					animate={{ scaleX: 1 }}
					transition={{
						duration: 0.6,
						ease: [0.22, 1, 0.36, 1],
						delay: 0.1 + rank * 0.08,
					}}
				/>
			</div>

			<ul className="space-y-1">
				{hypothesis.evidence.map((line) => (
					<li
						key={line}
						className="font-mono text-[11.5px] text-[color:var(--oyster)] pl-3 relative before:content-['—'] before:absolute before:left-0 before:top-0 before:text-[color:var(--grave)]"
					>
						{line}
					</li>
				))}
			</ul>
		</div>
	);
}

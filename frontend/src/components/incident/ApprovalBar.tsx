"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ProposedRemediation } from "@/types/incident";

interface Props {
	remediation: ProposedRemediation;
	/** Called after the user clicks Approve. Receives the resolved status. */
	onApprove: () => void;
	/** Called after Reject. Optional; default just shakes. */
	onReject?: () => void;
	resolved: boolean;
}

/**
 * ApprovalBar — asymmetric 7:3 sticky footer.
 * Left 70% = remediation card with full detail.
 * Right 30% = action stack (Approve / Reject / Modify).
 */
export function ApprovalBar({
	remediation,
	onApprove,
	onReject,
	resolved,
}: Props) {
	const reduced = useReducedMotion();
	const [rejectShake, setRejectShake] = useState(0);

	const handleReject = () => {
		setRejectShake((c) => c + 1);
		onReject?.();
	};

	return (
		<motion.section
			role="region"
			aria-label="Proposed remediation"
			initial={reduced ? { opacity: 0 } : { y: "100%" }}
			animate={reduced ? { opacity: 1 } : { y: 0 }}
			transition={{
				duration: 0.48,
				delay: 1.1,
				type: reduced ? undefined : "spring",
				stiffness: 380,
				damping: 32,
			}}
			className="surface sticky bottom-0 z-30 bg-[color:var(--ink-surface)]"
			style={{
				// Asymmetric 7:3 — broadsheet column proportions
				backdropFilter: "blur(2px)",
			}}
		>
			<div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-x-8 gap-y-5 px-6 md:px-10 py-5">
				<div>
					<div className="eyebrow mb-2">proposed remediation</div>
					<p className="text-[15px] text-[color:var(--bone)] mb-3 max-w-[70ch]">
						{remediation.summary}
					</p>
					<dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-[12px]">
						<div>
							<dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)] mb-0.5">
								blast radius
							</dt>
							<dd className="text-[color:var(--oyster)] leading-snug">
								{remediation.blastRadius}
							</dd>
						</div>
						<div>
							<dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)] mb-0.5">
								est downtime
							</dt>
							<dd className="font-mono text-[color:var(--bone)] num">
								{remediation.estDowntimeSec}s
							</dd>
						</div>
						{remediation.rollbackMethod && (
							<div>
								<dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)] mb-0.5">
									method
								</dt>
								<dd className="font-mono text-[11px] text-[color:var(--oyster)]">
									{remediation.rollbackMethod}
								</dd>
							</div>
						)}
					</dl>
				</div>

				<div className="flex flex-col gap-2 justify-center min-w-0">
					<div className="eyebrow mb-1">action</div>
					<AnimatePresence mode="wait">
						{resolved ? (
							<motion.div
								key="resolved"
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.32 }}
								className="inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em]"
								style={{ color: "var(--ice-400)" }}
							>
								<span
									aria-hidden
									className="inline-block size-1.5 rounded-full"
									style={{
										background: "var(--ice-400)",
										boxShadow: "0 0 10px var(--ice-glow)",
									}}
								/>
								resolved · 04:47 mttr
							</motion.div>
						) : (
							<motion.div
								key="actions"
								initial={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="flex flex-col gap-2"
							>
								<Button onClick={onApprove} variant="primary">
									Approve
								</Button>
								<motion.div
									animate={
										reduced
											? undefined
											: { x: rejectShake ? [0, -2, 2, -2, 2, 0] : 0 }
									}
									transition={{ duration: 0.28, ease: "easeInOut" }}
									key={`shake-${rejectShake}`}
								>
									<Button onClick={handleReject} variant="ghost">
										Reject
									</Button>
								</motion.div>
								<Button variant="subtle" trailing="↗">
									Modify
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</motion.section>
	);
}

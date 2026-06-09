"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
	/** When true: ember + breathing. When false: ice cyan, static. */
	active: boolean;
}

/**
 * 2px fixed-position strip at the top of the viewport.
 * Ember + breathing while investigating; ice cyan static when resolved.
 */
export function PersimmonStrip({ active }: Props) {
	const reduced = useReducedMotion();
	const color = active ? "var(--ember-400)" : "var(--ice-400)";
	const glow = active ? "var(--ember-glow)" : "var(--ice-glow)";

	const breatheAnim =
		active && !reduced
			? { opacity: [1, 0.55, 1] }
			: { opacity: active ? 1 : 0.9 };

	return (
		<motion.div
			role="status"
			aria-label={active ? "Aegis is investigating" : "Incident resolved"}
			initial={{ x: "-100%" }}
			animate={{ x: 0 }}
			transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
			className="fixed inset-x-0 top-0 z-50 h-[2px] pointer-events-none"
			style={{
				background: color,
				boxShadow: `0 0 14px ${glow}`,
			}}
		>
			<motion.div
				className="h-full w-full"
				animate={breatheAnim}
				transition={{
					duration: 2.8,
					repeat: active && !reduced ? Infinity : 0,
					ease: [0.65, 0, 0.35, 1],
				}}
				style={{ background: color }}
			/>
		</motion.div>
	);
}

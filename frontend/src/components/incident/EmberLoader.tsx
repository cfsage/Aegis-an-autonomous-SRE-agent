"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The Ember Loader — 40×2px horizontal bar, scaleX-pulsing 0.3→1→0.7
 * over 1.4s. Replaces all spinners. Calm, technical, distinctive.
 */
export function EmberLoader() {
	const reduced = useReducedMotion();
	return (
		<span
			role="status"
			aria-label="Aegis is thinking"
			className="inline-block relative align-middle"
			style={{ width: 40, height: 2 }}
		>
			<span
				aria-hidden
				className="absolute inset-0"
				style={{
					background: "var(--hairline-soft)",
				}}
			/>
			{reduced ? (
				<span
					aria-hidden
					className="absolute left-0 top-0 h-full"
					style={{
						width: 6,
						background: "var(--ember-400)",
						boxShadow: "0 0 8px var(--ember-glow)",
					}}
				/>
			) : (
				<motion.span
					aria-hidden
					className="absolute inset-0 origin-center"
					style={{
						background:
							"linear-gradient(90deg, transparent, var(--ember-400), transparent)",
						boxShadow: "0 0 12px var(--ember-glow)",
					}}
					animate={{ scaleX: [0.3, 1, 0.7] }}
					transition={{
						duration: 1.4,
						repeat: Infinity,
						ease: [0.65, 0, 0.35, 1],
					}}
				/>
			)}
		</span>
	);
}

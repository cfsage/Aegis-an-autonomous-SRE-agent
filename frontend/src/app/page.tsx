"use client";

import Link from "next/link";
import { AegisLogo } from "@/components/layout/AegisLogo";
import { Logo } from "@/components/layout/Logo";
import { GrainOverlay } from "@/components/layout/GrainOverlay";
import { useBackendStatus } from "@/hooks/useAegis";
import { motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 200, damping: 22 };

export default function LandingPage() {
	const connected = useBackendStatus();

	return (
		<>
			<GrainOverlay opacity={0.035} />
			<div className="min-h-screen bg-canvas text-oyster flex flex-col font-sans selection:bg-ember-500/30 selection:text-bone">
				{/* --- Header / Top Bar --- */}
				<header className="px-6 md:px-10 py-6 border-b border-hairline-mid flex items-center justify-between bg-surface relative z-10">
					<Logo />
					<div className="flex items-center gap-4">
						<span className="hidden md:inline-block font-mono text-[10.5px] uppercase tracking-[0.2em] text-slate-text">
							System Status:
						</span>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline-bright bg-elevated font-mono text-[10.5px] text-bone">
							<span
								className="inline-block size-2 rounded-full animate-pulse"
								style={{
									background: connected
										? "var(--status-healthy)"
										: "var(--oyster)",
									boxShadow: connected
										? "0 0 8px var(--status-healthy)"
										: "0 0 8px var(--oyster)",
									animationDuration: "2s",
								}}
							/>
							{connected ? "LIVE · CONNECTED" : "DEMO MODE"}
						</div>
					</div>
				</header>

				{/* --- Main Hero Section --- */}
				<main className="flex-1 flex flex-col relative z-10">
					<section className="px-6 md:px-10 py-16 md:py-24 text-center max-w-4xl mx-auto flex flex-col items-center">
						{/* Pulsing Shield Logo */}
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={spring}
							className="mb-8"
						>
							<AegisLogo
								size={120}
								className="hover:scale-105 transition-transform duration-300 ease-out cursor-pointer"
							/>
						</motion.div>

						{/* Main Headline */}
						<motion.h1
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...spring, delay: 0.1 }}
							className="font-display italic text-bone mb-6"
							style={{
								fontSize: "clamp(2.25rem, 1.25rem + 4vw, 4.5rem)",
								lineHeight: 1.05,
								fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
							}}
						>
							Your Autonomous SRE Agent
						</motion.h1>

						{/* Sub-headline */}
						<motion.p
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...spring, delay: 0.2 }}
							className="text-[17px] md:text-[20px] text-oyster mb-10 max-w-2xl font-display italic"
							style={{
								lineHeight: 1.4,
								fontVariationSettings: "'SOFT' 30, 'WONK' 0.5, 'opsz' 48",
							}}
						>
							It takes the 3 AM page so you don't have to. Aegis detects latency
							spikes, correlates telemetry, performs rollback remediation, and
							writes post-incident RCAs — in seconds.
						</motion.p>

						{/* Call-to-Actions */}
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...spring, delay: 0.3 }}
							className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md"
						>
							<Link
								id="cta-dashboard"
								href="/dashboard"
								className="flex-1 px-6 py-3.5 bg-ember-500 hover:bg-ember-400 text-bone font-mono text-[12px] uppercase tracking-[0.16em] rounded-md transition-all duration-200 ease-out text-center shadow-lg hover:shadow-ember-500/20"
								style={{
									boxShadow: "0 0 16px var(--ember-glow)",
								}}
							>
								Enter Command Center
							</Link>
							<Link
								id="cta-warroom"
								href="/incidents/demo"
								className="flex-1 px-6 py-3.5 border border-hairline-bright hover:border-bone hover:bg-elevated text-bone font-mono text-[12px] uppercase tracking-[0.16em] rounded-md transition-all duration-200 ease-out text-center"
							>
								Launch War Room
							</Link>
						</motion.div>
					</section>

					{/* --- Metrics Highlights Section --- */}
					<section className="px-6 md:px-10 py-12 border-t border-b border-hairline-mid bg-surface">
						<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
							<div className="space-y-2 md:pr-6 md:border-r border-hairline-soft">
								<div className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-text">
									Autonomous Resolution
								</div>
								<div className="font-display italic text-[42px] text-bone font-semibold leading-none">
									Under 60s
								</div>
								<p className="text-[13px] text-slate-text mt-2">
									Reduces Mean Time to Resolution (MTTR) from an industry
									average of 47 minutes down to a sub-minute autonomous loop.
								</p>
							</div>

							<div className="space-y-2 md:px-6 md:border-r border-hairline-soft">
								<div className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-text">
									Gemini + Dynatrace MCP
								</div>
								<div className="font-display italic text-[42px] text-bone font-semibold leading-none">
									10-Step Loop
								</div>
								<p className="text-[13px] text-slate-text mt-2">
									Uses the Model Context Protocol to fetch active telemetry,
									query logs, detect anomaly events, and formulate verified
									hypotheses.
								</p>
							</div>

							<div className="space-y-2 md:pl-6">
								<div className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-text">
									Safety & Compliance
								</div>
								<div className="font-display italic text-[42px] text-bone font-semibold leading-none">
									Policy Guard
								</div>
								<p className="text-[13px] text-slate-text mt-2">
									Human-in-the-Loop protection gates P0 and P1 remediations. All
									actions are logged to an exportable, tamper-proof audit trail.
								</p>
							</div>
						</div>
					</section>

					{/* --- The 10-Step Autonomous Loop Section --- */}
					<section className="px-6 md:px-10 py-20 max-w-6xl mx-auto w-full">
						<h2 className="font-display italic text-[28px] text-bone mb-12 text-center">
							The 10-Step Autonomous Diagnostic Loop
						</h2>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
							{[
								{
									step: "01",
									name: "Classify",
									desc: "Assesses incident severity, blast radius, and impacted users.",
								},
								{
									step: "02",
									name: "Gather",
									desc: "Queries Dynatrace MCP for relevant metrics, logs, and trace signals.",
								},
								{
									step: "03",
									name: "Correlate",
									desc: "Cross-references timeline events with recent production deployments.",
								},
								{
									step: "04",
									name: "Hypothesize",
									desc: "Enumerates candidate root causes ranked by AI confidence scores.",
								},
								{
									step: "05",
									name: "Verify",
									desc: "Validates hypotheses by performing targeted diagnostic queries.",
								},
								{
									step: "06",
									name: "Propose",
									desc: "Forms structured remediation actions (e.g., automated rollback).",
								},
								{
									step: "07",
									name: "Await",
									desc: "Requests SRE engineer confirmation for critical severity levels.",
								},
								{
									step: "08",
									name: "Execute",
									desc: "Safely runs approved remediation plans using Cloud and Dynatrace APIs.",
								},
								{
									step: "09",
									name: "Verify Fix",
									desc: "Monitors response times and error rates to confirm system health.",
								},
								{
									step: "10",
									name: "RCA",
									desc: "Compiles a comprehensive post-incident report with full audit trails.",
								},
							].map((s) => (
								<div
									key={s.step}
									className="surface border border-hairline-mid p-5 flex flex-col justify-between hover:border-ember-400/50 transition-all duration-300 ease-out group"
								>
									<div>
										<span className="font-mono text-[10px] text-ember-400 font-semibold tracking-wider">
											{s.step}
										</span>
										<h3 className="font-display italic text-[18px] text-bone mt-2 group-hover:text-ember-300 transition-colors">
											{s.name}
										</h3>
									</div>
									<p className="text-[12px] text-slate-text mt-4 leading-normal">
										{s.desc}
									</p>
								</div>
							))}
						</div>
					</section>
				</main>

				{/* --- Footer --- */}
				<footer className="px-6 md:px-10 py-8 border-t border-hairline-mid bg-surface relative z-10">
					<div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-grave">
						<span>Aegis Ops System · Built for Google Agent Hackathon</span>
						<div className="flex items-center gap-4">
							<Link
								href="https://github.com"
								className="hover:text-oyster transition-colors"
							>
								GitHub
							</Link>
							<span>·</span>
							<span className="text-[10px]">GMT+0</span>
						</div>
					</div>
				</footer>
			</div>
		</>
	);
}

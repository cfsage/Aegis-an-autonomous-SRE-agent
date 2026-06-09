import { AegisObservesStrip } from "@/components/layout/AegisObservesStrip";
import { AppNav } from "@/components/layout/AppNav";
import { GrainOverlay } from "@/components/layout/GrainOverlay";
import { mockIncident } from "@/lib/mock-incident";

/**
 * App shell — masthead, dogfood strip, content.
 * The persimmon strip is rendered per-incident (it knows the status).
 */
export default function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<GrainOverlay opacity={0.035} />
			<div className="min-h-screen flex flex-col">
				<AppNav />
				<AegisObservesStrip metrics={mockIncident.selfMetrics} />
				<main className="flex-1">{children}</main>
				<footer className="px-6 md:px-10 py-4 border-t border-[color:var(--hairline-soft)] flex items-center justify-between font-mono text-[10.5px] text-[color:var(--grave)]">
					<span>aegis-ops · {mockIncident.id} · gmt+0</span>
					<span className="inline-flex items-center gap-2">
						<span
							aria-hidden
							className="inline-block size-1.5 rounded-full"
							style={{
								background: "var(--status-healthy)",
								boxShadow: "0 0 8px var(--status-healthy)",
							}}
						/>
						dogfood · live
					</span>
				</footer>
			</div>
		</>
	);
}

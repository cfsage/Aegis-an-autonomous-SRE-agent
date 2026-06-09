/**
 * Aegis wordmark — Fraunces italic with a hairline divider and a small
 * mono department badge. Not a generic logo; reads like a masthead.
 */
export function Logo() {
	return (
		<div className="flex items-baseline gap-2.5 select-none">
			<span
				className="font-display italic text-[20px] leading-none"
				style={{
					fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 24",
					letterSpacing: "-0.02em",
				}}
			>
				Aegis
			</span>
			<span
				aria-hidden
				className="block h-3 w-px bg-[color:var(--hairline-mid)]"
			/>
			<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
				ops · v0.1
			</span>
		</div>
	);
}

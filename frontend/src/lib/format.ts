/**
 * Formatting helpers — Aegis editorial voice.
 * Timestamps must always render with millisecond precision.
 */

export interface TimestampParts {
	/** "14:23:11" */
	primary: string;
	/** ".247Z" — dimmed sub-second portion */
	sub: string;
}

/**
 * Split an ISO timestamp into a primary HH:MM:SS portion and a dimmed
 * sub-second `.247Z` tail. Used by <Timestamp/> to render dimmed seconds.
 */
export function splitTimestamp(iso: string): TimestampParts {
	// Support both ISO ("2026-05-16T14:23:11.247Z") and bare time ("14:23:11.247Z").
	const time = iso.includes("T") ? iso.split("T")[1] : iso;
	const dotIdx = time.indexOf(".");
	if (dotIdx === -1) {
		return { primary: time.replace(/Z$/, ""), sub: "Z" };
	}
	return {
		primary: time.slice(0, dotIdx),
		sub: time.slice(dotIdx),
	};
}

/**
 * Format a percent value to 1 decimal (12.4%, not 12%).
 */
export function formatPct(value: number, digits = 1): string {
	return `${value.toFixed(digits)}%`;
}

/**
 * Render an integer with thousands separators (4847 → "4,847").
 */
export function formatThousands(value: number): string {
	return new Intl.NumberFormat("en-US").format(value);
}

import { splitTimestamp } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
	iso: string;
}

/**
 * Tabular timestamp with dimmed sub-second segment.
 * `14:23:11.247Z` — the `.247Z` portion sits at 50% opacity.
 */
export function Timestamp({ iso, className, ...rest }: Props) {
	const { primary, sub } = splitTimestamp(iso);
	return (
		<span className={cn("ts", className)} {...rest}>
			{primary}
			<span className="ts-sub">{sub}</span>
		</span>
	);
}

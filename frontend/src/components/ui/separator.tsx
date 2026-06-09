import * as RadixSeparator from "@radix-ui/react-separator";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type SeparatorProps = React.ComponentPropsWithoutRef<
	typeof RadixSeparator.Root
>;

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
	(
		{ className, orientation = "horizontal", decorative = true, ...rest },
		ref,
	) => (
		<RadixSeparator.Root
			ref={ref}
			orientation={orientation}
			decorative={decorative}
			className={cn(
				"bg-[color:var(--hairline-soft)] shrink-0",
				orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
				className,
			)}
			{...rest}
		/>
	),
);
Separator.displayName = "Separator";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Aegis Card — NOT a default shadcn rounded-lg + border.
 * - Square-ish 3px radius (intentional, broadsheet not SaaS)
 * - Hairline gradient on top edge via ::before (in base.css `.surface`)
 * - Soft bottom hairline for depth
 * - No drop shadow (replaced by hairline highlight)
 */
const cardBaseClass = [
	"surface relative isolate",
	"border border-[color:var(--hairline-soft)]",
	"border-t-transparent",
	"rounded-[3px]",
].join(" ");

export const Card = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
	<div ref={ref} className={cn("card", cardBaseClass, className)} {...rest} />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex items-center justify-between gap-3 px-5 pt-4 pb-3",
			"border-b border-[color:var(--hairline-soft)]",
			className,
		)}
		{...rest}
	/>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
	<div ref={ref} className={cn("eyebrow", className)} {...rest} />
));
CardTitle.displayName = "CardTitle";

export const CardBody = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...rest }, ref) => (
	<div ref={ref} className={cn("px-5 py-4", className)} {...rest} />
));
CardBody.displayName = "CardBody";

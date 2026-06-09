"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Aegis Button — NOT a shadcn primary. Three variants only:
 * - primary  (Approve): solid ember fill + outer ember glow
 * - ghost    (Reject):  bone-on-canvas, hairline border, no fill
 * - subtle   (Modify):  text-only with a downward chevron rule
 *
 * All variants: square-ish radius (3px), uppercase tracked label,
 * a thin trailing forward-tick mark, and a press scale of 0.97.
 */
const buttonVariants = cva(
	[
		"relative inline-flex items-center justify-between gap-3",
		"select-none isolate",
		"h-11 px-4",
		"font-sans font-medium text-[12.5px]",
		"uppercase tracking-[0.14em]",
		"transition-[color,background-color,border-color,box-shadow]",
		"duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
		"focus-visible:outline-2 focus-visible:outline-offset-[3px]",
		"focus-visible:outline-[color:var(--ember-400)]",
		"disabled:cursor-not-allowed disabled:opacity-50",
	].join(" "),
	{
		variants: {
			variant: {
				primary: [
					"rounded-[3px]",
					"bg-[color:var(--ember-400)] text-[color:var(--ink-canvas)]",
					"shadow-[0_12px_32px_-10px_var(--ember-glow),inset_0_1px_0_0_oklch(100%_0_0/0.18)]",
					"hover:bg-[color:var(--ember-300)]",
					"hover:shadow-[0_18px_40px_-8px_var(--ember-glow-strong),inset_0_1px_0_0_oklch(100%_0_0/0.22)]",
				].join(" "),
				ghost: [
					"rounded-[3px] bg-transparent text-[color:var(--bone)]",
					"border border-[color:var(--hairline-mid)]",
					"hover:border-[color:var(--hairline-bright)]",
					"hover:bg-[color:var(--ink-elevated)]",
				].join(" "),
				subtle: [
					"rounded-[3px] bg-transparent text-[color:var(--oyster)]",
					"px-2 hover:text-[color:var(--bone)]",
				].join(" "),
			},
			size: {
				md: "h-11 px-4",
				sm: "h-8 px-3 text-[11px]",
				lg: "h-12 px-5 text-[13px]",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	/** Decorative trailing glyph (default: ▸). Set to false to hide. */
	trailing?: React.ReactNode | false;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild: _asChild,
			trailing = "▸",
			children,
			onDrag: _d,
			onDragStart: _ds,
			onDragEnd: _de,
			onAnimationStart: _as,
			...rest
		},
		ref,
	) => {
		const reduced = useReducedMotion();
		const press = reduced ? {} : { scale: 0.97 };
		return (
			<motion.button
				ref={ref}
				whileTap={press}
				whileHover={reduced ? undefined : { y: -1 }}
				transition={{
					type: "spring",
					stiffness: 380,
					damping: 32,
				}}
				className={cn(buttonVariants({ variant, size }), className)}
				{...(rest as any)}
			>
				<span>{children}</span>
				{trailing !== false && (
					<span
						aria-hidden
						className="text-[10px] opacity-70 translate-y-[-1px]"
					>
						{trailing}
					</span>
				)}
			</motion.button>
		);
	},
);
Button.displayName = "Button";

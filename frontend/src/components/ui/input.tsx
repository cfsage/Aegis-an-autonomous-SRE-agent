import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, ...rest }, ref) => (
		<input
			ref={ref}
			className={cn(
				"h-10 px-3 w-full",
				"bg-transparent text-[color:var(--bone)]",
				"border-b border-[color:var(--hairline-mid)]",
				"rounded-none font-mono text-[13px]",
				"placeholder:text-[color:var(--grave)]",
				"transition-colors duration-200 ease-out",
				"focus:border-[color:var(--ember-400)] focus:outline-none",
				className,
			)}
			{...rest}
		/>
	),
);
Input.displayName = "Input";

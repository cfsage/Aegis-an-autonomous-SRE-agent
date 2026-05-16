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
  "relative isolate",
  "bg-[color:var(--ink-surface)]",
  "border border-[color:var(--hairline-soft)]",
  "border-t-transparent",
  "rounded-[3px]",
  "before:content-['']",
  "before:absolute before:inset-x-0 before:top-0 before:h-px",
  "before:bg-[linear-gradient(90deg,transparent_0%,var(--hairline-mid)_20%,var(--hairline-bright)_50%,var(--hairline-mid)_80%,transparent_100%)]",
  "before:pointer-events-none",
].join(" ");

export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn(cardBaseClass, className)} {...rest} />
  ),
);
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

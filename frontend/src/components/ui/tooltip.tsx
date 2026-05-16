"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export const TooltipContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 6, ...rest }, ref) => (
  <RadixTooltip.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 px-2.5 py-1.5",
      "bg-[color:var(--ink-elevated)] text-[color:var(--bone)]",
      "border border-[color:var(--hairline-mid)] rounded-[3px]",
      "font-mono text-[11px]",
      "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
      className,
    )}
    {...rest}
  />
));
TooltipContent.displayName = "TooltipContent";

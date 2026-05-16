"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Select = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(({ className, children, ...rest }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-between gap-2",
      "h-10 px-3 min-w-[120px]",
      "bg-transparent text-[color:var(--bone)]",
      "border-b border-[color:var(--hairline-mid)]",
      "font-mono text-[12px] uppercase tracking-[0.14em]",
      "focus:outline-none focus:border-[color:var(--ember-400)]",
      className,
    )}
    {...rest}
  >
    {children}
    <RadixSelect.Icon>
      <ChevronDown className="size-3.5 opacity-60" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, ...rest }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={cn(
        "z-50",
        "bg-[color:var(--ink-elevated)] text-[color:var(--bone)]",
        "border border-[color:var(--hairline-mid)] rounded-[3px]",
        "min-w-[var(--radix-select-trigger-width)] p-1",
        className,
      )}
      {...rest}
    >
      <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...rest }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "px-2 py-1.5 font-mono text-[12px] cursor-pointer",
      "data-[highlighted]:outline-none data-[highlighted]:bg-[color:var(--ink-surface)]",
      className,
    )}
    {...rest}
  >
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = "SelectItem";

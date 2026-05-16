"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export const DialogContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, children, ...rest }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay
      className="fixed inset-0 z-40 bg-[color:var(--ink-overlay)]/70 backdrop-blur-[2px]"
    />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "w-[min(640px,92vw)] max-h-[85vh] overflow-auto",
        "bg-[color:var(--ink-surface)]",
        "border border-[color:var(--hairline-soft)] rounded-[3px]",
        "p-6 surface",
        className,
      )}
      {...rest}
    >
      {children}
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

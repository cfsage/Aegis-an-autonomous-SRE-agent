"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...rest }, ref) => (
	<RadixTabs.List
		ref={ref}
		className={cn(
			"inline-flex items-center gap-1",
			"border-b border-[color:var(--hairline-soft)]",
			className,
		)}
		{...rest}
	/>
));
TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...rest }, ref) => (
	<RadixTabs.Trigger
		ref={ref}
		className={cn(
			"px-3 py-2",
			"font-sans text-[12px] uppercase tracking-[0.14em]",
			"text-[color:var(--slate)] hover:text-[color:var(--bone)]",
			"border-b-2 border-transparent",
			"transition-[color,border-color] duration-200 ease-out",
			"data-[state=active]:text-[color:var(--bone)]",
			"data-[state=active]:border-[color:var(--ember-400)]",
			"focus-visible:outline-none focus-visible:text-[color:var(--bone)]",
			className,
		)}
		{...rest}
	/>
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...rest }, ref) => (
	<RadixTabs.Content
		ref={ref}
		className={cn("py-4 focus-visible:outline-none", className)}
		{...rest}
	/>
));
TabsContent.displayName = "TabsContent";

import React from "react";

interface AegisLogoProps {
	className?: string;
	size?: number;
}

export function AegisLogo({ className, size = 120 }: AegisLogoProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 120 120"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			role="img"
			aria-label="Aegis Shield Logo"
		>
			<title>Aegis Shield Logo</title>
			<defs>
				<linearGradient
					id="shieldGrad"
					x1="60"
					y1="10"
					x2="60"
					y2="110"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0%" stopColor="var(--ember-300)" />
					<stop offset="50%" stopColor="var(--ember-400)" stopOpacity="0.8" />
					<stop offset="100%" stopColor="var(--ember-500)" stopOpacity="0.3" />
				</linearGradient>
				<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="6" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>

			{/* Outermost border shield outline */}
			<path
				d="M60 10 C85 20, 100 25, 100 45 C100 75, 80 95, 60 110 C40 95, 20 75, 20 45 C20 25, 35 20, 60 10 Z"
				stroke="var(--hairline-bright)"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Main glowing shield body */}
			<path
				d="M60 16 C80 25, 92 29, 92 46 C92 70, 76 88, 60 101 C44 88, 28 70, 28 46 C28 29, 40 25, 60 16 Z"
				fill="url(#shieldGrad)"
				stroke="var(--ember-400)"
				strokeWidth="1"
				style={{ filter: "url(#glow)" }}
			/>

			{/* Inner geometric core emblem */}
			<path
				d="M60 35 L75 52 L60 69 L45 52 Z"
				fill="var(--bone)"
				opacity="0.95"
			/>
			<circle cx="60" cy="52" r="3" fill="var(--ink-canvas)" />

			{/* Downward target radar line */}
			<line
				x1="60"
				y1="69"
				x2="60"
				y2="92"
				stroke="var(--bone)"
				strokeWidth="1.5"
				strokeDasharray="3 3"
				opacity="0.8"
			/>
		</svg>
	);
}

"use client";

/**
 * Fixed-position SVG grain at ≈3% opacity.
 * Breaks the flatness of dark UI without taking color or layout.
 */

interface Props {
	opacity?: number;
}

const noiseSvg = encodeURIComponent(
	`<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>
      <feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#n)' opacity='1'/>
  </svg>`,
);

export function GrainOverlay({ opacity = 0.035 }: Props) {
	return (
		<div
			aria-hidden
			data-grain
			className="fixed inset-0 pointer-events-none"
			style={{
				zIndex: 40,
				opacity,
				mixBlendMode: "overlay",
				backgroundImage: `url("data:image/svg+xml,${noiseSvg}")`,
				backgroundSize: "256px 256px",
			}}
		/>
	);
}

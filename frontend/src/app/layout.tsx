import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Onest } from "next/font/google";
import "./globals.css";

/* ============================================================
   Fonts — Fraunces (display, with SOFT + WONK axes), Onest (UI),
   JetBrains Mono (data). Self-hosted by next/font. NEVER Inter.
   ============================================================ */

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // When `axes` is set, `weight` must be omitted (next/font treats it as variable).
  style: ["normal", "italic"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aegis · INC-2026-0042",
  description:
    "Aegis — an autonomous Site Reliability Engineer. Diagnoses production incidents while you sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={[
        fraunces.variable,
        onest.variable,
        jetbrainsMono.variable,
      ].join(" ")}
    >
      <body className="antialiased">
        <style>{`
          @keyframes aegis-pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}

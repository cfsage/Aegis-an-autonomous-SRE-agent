import Link from "next/link";
import { Logo } from "./Logo";

const navItems = [
  { label: "Dashboard", href: "#" },
  { label: "Incidents", href: "/incidents/demo", active: true },
  { label: "Runbooks", href: "#" },
  { label: "Post-mortems", href: "#" },
];

/**
 * AppNav — broadsheet masthead with Aegis logo, primary nav, and a
 * tiny operator pill on the right. Left-aligned by intention.
 */
export function AppNav() {
  return (
    <header
      className="surface relative px-6 md:px-10 py-4"
      role="banner"
    >
      <div className="flex items-center justify-between gap-6">
        <Logo />

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "px-3 py-1.5",
                "font-sans text-[12px] uppercase tracking-[0.16em]",
                "transition-colors duration-200 ease-out",
                item.active
                  ? "text-[color:var(--bone)]"
                  : "text-[color:var(--slate)] hover:text-[color:var(--oyster)]",
              ].join(" ")}
            >
              {item.label}
              {item.active && (
                <span
                  aria-hidden
                  className="block h-px mt-1 bg-[color:var(--ember-400)]"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-block font-mono text-[10.5px] uppercase tracking-[0.2em] text-[color:var(--slate)]">
            on-call · y@aegis.dev
          </span>
          <span
            aria-hidden
            className="inline-block size-6 rounded-full border border-[color:var(--hairline-mid)] bg-[color:var(--ink-elevated)] grid place-items-center font-mono text-[10px] text-[color:var(--oyster)]"
          >
            yb
          </span>
        </div>
      </div>
    </header>
  );
}

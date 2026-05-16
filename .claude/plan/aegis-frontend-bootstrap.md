# Implementation Plan: Aegis Frontend Bootstrap

> Parent project: [aegis-sre-agent.md](./aegis-sre-agent.md)
> Scope: Bootstrap the Next.js app, design system tokens, customized shadcn primitives, `/_style` showcase, and a fully-designed `/incidents/demo` reference page driven by mock data.
> Out of scope: Backend, auth wiring, real Dynatrace integration, marketing landing, dashboard, settings.

---

## 1. Outcome

By end of this plan, running `pnpm dev` in `frontend/` shows:
1. `/` — placeholder route that redirects to `/incidents/demo` (until landing exists).
2. `/_style` — design-system showcase: tokens, type scale, color, spacing, motion easing, every customized primitive (Button, Card, Badge, Dialog, Input, Select, Tabs, Tooltip, Toggle, Tag).
3. `/incidents/demo` — fully designed Incident Detail page driven by mock JSON. This is the demo-video hero screen. Includes:
   - Header strip: incident title, severity, status, time-to-detect, time-to-resolve.
   - Left column: **AgentTimeline** with streamed-style step entrance animation, expandable tool-call cards, confidence badges.
   - Right column: **TelemetryPanel** with 2–3 Recharts series (latency, error rate, throughput) marked with anomaly band.
   - Footer: **ApprovalBar** with proposed remediation, blast-radius preview, Approve/Reject.
   - "Aegis observes Aegis" mini-strip in nav showing the dogfood telemetry.
4. Lighthouse > 95 on `/incidents/demo` desktop, accessible at 320/768/1440 widths.

---

## 2. Stack & Versions

| Layer | Choice | Pin |
|-------|--------|-----|
| Framework | Next.js | 15 (App Router, Turbopack) |
| Language | TypeScript | 5 (strict) |
| Styling | Tailwind | v4 (CSS-first config) |
| Primitives | shadcn/ui | latest (Radix-based) |
| Motion | Framer Motion | 11 |
| Data | TanStack Query | 5 (configured even though mock-only for now) |
| Charts | Recharts | 2 |
| Icons | Lucide | latest |
| Type — UI | Inter | via `next/font/google` |
| Type — Display | Instrument Serif | via `next/font/google` |
| Package mgr | pnpm | latest |
| Linting | Biome | latest (replaces ESLint+Prettier — faster, no config) |

Rationale for Biome over ESLint+Prettier: one tool, ~10× faster, opinionated defaults match our code style.

---

## 3. Design Tokens (the source of truth)

All tokens live in `frontend/src/styles/tokens.css` as CSS custom properties on `:root`. Tailwind v4 references them via `@theme`. Two layers: **primitives** (raw values) and **semantics** (named roles).

### 3.1 Color (oklch, dark-only for now)

```css
:root {
  /* Primitive palette */
  --gray-0:  oklch(99% 0 0);
  --gray-50: oklch(96% 0.002 270);
  --gray-100:oklch(88% 0.004 270);
  --gray-300:oklch(68% 0.008 270);
  --gray-500:oklch(48% 0.010 270);
  --gray-700:oklch(28% 0.012 270);
  --gray-800:oklch(20% 0.012 270);
  --gray-900:oklch(14% 0.012 270);
  --gray-950:oklch(9%  0.012 270);

  --amber-300:oklch(82% 0.16 78);
  --amber-400:oklch(76% 0.18 70);   /* primary incident accent */
  --amber-500:oklch(68% 0.19 60);
  --amber-600:oklch(58% 0.18 50);

  --red-400:  oklch(70% 0.20 27);   /* P0 severity */
  --green-400:oklch(72% 0.16 145);  /* resolved */
  --blue-400: oklch(72% 0.12 240);  /* info */

  /* Semantic roles */
  --bg-canvas:     var(--gray-950);
  --bg-surface:    var(--gray-900);
  --bg-elevated:   var(--gray-800);
  --bg-overlay:    color-mix(in oklch, var(--gray-950) 80%, transparent);

  --text-primary:  var(--gray-50);
  --text-secondary:var(--gray-300);
  --text-muted:    var(--gray-500);

  --border-subtle: color-mix(in oklch, var(--gray-100) 8%, transparent);
  --border-default:color-mix(in oklch, var(--gray-100) 14%, transparent);
  --border-strong: color-mix(in oklch, var(--gray-100) 24%, transparent);

  --accent:        var(--amber-400);
  --accent-text:   oklch(20% 0.04 70);
  --accent-soft:   color-mix(in oklch, var(--amber-400) 14%, transparent);

  --severity-p0:   var(--red-400);
  --severity-p1:   var(--amber-400);
  --severity-p2:   var(--blue-400);
  --status-ok:     var(--green-400);
}
```

### 3.2 Typography

```css
:root {
  --font-sans:  "Inter", system-ui, sans-serif;
  --font-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-mono:  "JetBrains Mono", ui-monospace, monospace;

  /* Fluid scale */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-display: clamp(2.5rem, 1.5rem + 4vw, 4.5rem);    /* serif headlines */
  --text-hero:    clamp(3.5rem, 1.5rem + 7vw, 7rem);      /* marketing */

  --leading-tight: 1.1;
  --leading-snug:  1.3;
  --leading-base:  1.5;
  --leading-loose: 1.7;

  --tracking-tight: -0.02em;
  --tracking-base:  0;
}
```

Display headlines (incident title, marketing hero) use `font-serif` with `tracking-tight` — that's the "editorial" voice. Body and UI stay in Inter.

### 3.3 Spacing & Radius

```css
:root {
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-section: clamp(4rem, 3rem + 5vw, 9rem);

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 14px;
  --radius-pill: 999px;
}
```

### 3.4 Motion

```css
:root {
  --duration-instant: 80ms;
  --duration-fast:    150ms;
  --duration-base:    220ms;
  --duration-slow:    420ms;

  --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quint:  cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-soft:cubic-bezier(0.65, 0, 0.35, 1);
}
```

All custom motion uses `transform` + `opacity` only (per `web/coding-style.md`).

---

## 4. File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout — fonts, providers
│   │   ├── page.tsx                   # Temp redirect → /incidents/demo
│   │   ├── _style/
│   │   │   └── page.tsx               # Design system showcase
│   │   ├── (app)/
│   │   │   ├── layout.tsx             # App shell — nav, "Aegis observes Aegis" strip
│   │   │   └── incidents/
│   │   │       └── [id]/
│   │   │           └── page.tsx       # Incident detail (uses mock data for demo)
│   │   └── globals.css                # Imports tokens + base layer
│   ├── components/
│   │   ├── ui/                        # Customized shadcn primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── separator.tsx
│   │   │   └── tag.tsx
│   │   ├── incident/
│   │   │   ├── IncidentHeader.tsx     # Title, severity, time metrics
│   │   │   ├── AgentTimeline.tsx      # Animated step list
│   │   │   ├── AgentStep.tsx          # Single step (collapsed/expanded)
│   │   │   ├── ToolCallCard.tsx       # Renders one MCP call
│   │   │   ├── HypothesisCard.tsx     # Hypothesis with confidence
│   │   │   ├── TelemetryPanel.tsx     # Chart container
│   │   │   ├── TelemetryChart.tsx     # Single Recharts series
│   │   │   └── ApprovalBar.tsx        # Footer approval flow
│   │   ├── layout/
│   │   │   ├── AppNav.tsx
│   │   │   ├── AegisObservesStrip.tsx # Dogfood mini-strip
│   │   │   └── Logo.tsx
│   │   └── style/
│   │       └── TokenSwatch.tsx        # Shows a token + value (for /_style)
│   ├── lib/
│   │   ├── cn.ts                      # Tailwind class merger
│   │   ├── format.ts                  # Date / duration formatters
│   │   └── mock-incident.ts           # Mock data for /incidents/demo
│   ├── hooks/
│   │   ├── useReducedMotion.ts
│   │   └── useStaggeredReveal.ts      # Animates AgentTimeline entrance
│   ├── styles/
│   │   ├── tokens.css                 # All custom properties
│   │   └── base.css                   # Reset + element defaults
│   └── types/
│       ├── incident.ts
│       └── agent-event.ts
├── public/
│   └── og-image.png
├── biome.json
├── components.json                    # shadcn config
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts                 # v4 @theme bridge
└── tsconfig.json
```

---

## 5. Mock Data Shape

`src/lib/mock-incident.ts` exports a complete realistic incident driving the demo page:

```ts
export const mockIncident: Incident = {
  id: "INC-2026-0042",
  title: "Checkout latency spike on shopping-cart-service",
  severity: "P1",
  status: "investigating",
  detectedAt: "2026-05-16T14:23:11Z",
  affectedServices: ["checkout-api", "cart-service"],
  metrics: {
    latencyP95Ms: [/* 60 points */],
    errorRatePct: [/* 60 points */],
    throughputRps: [/* 60 points */],
  },
  agentEvents: [
    { step: "classify", t: 0,    summary: "P1 — checkout path, ~12% of traffic affected" },
    { step: "gather", t: 1200,   tool: "dynatrace.problems.get", input: {...}, output: {...} },
    { step: "gather", t: 2400,   tool: "dynatrace.traces.search", ...},
    { step: "correlate", t: 4100,summary: "Latency rose 3.2× after deploy abc123 at 14:18Z" },
    { step: "hypothesize", t: 5800, hypotheses: [
        { id: "h1", text: "Memory leak in deploy abc123", confidence: 78 },
        { id: "h2", text: "Downstream payment-svc slowdown", confidence: 31 },
    ]},
    { step: "verify", t: 7600,  summary: "Heap usage +180% on cart-service pods since deploy" },
    { step: "propose", t: 9200, remediation: {
        action: "rollback",
        target: "shopping-cart-service",
        toVersion: "abc122",
        estDowntimeSec: 0,
        blastRadius: "Single deployment, no schema change",
    }},
  ],
};
```

This shape mirrors what the real backend SSE stream will emit later, so the UI is forward-compatible.

---

## 6. Step-by-step Execution

Each step is a discrete commit. Each commit deploys cleanly to Vercel.

### Step 1 — Init Next.js (15 min)
```
cd Google_Agent_Hackathon
pnpm create next-app frontend --typescript --tailwind --app --no-eslint --turbopack
cd frontend
pnpm dlx @biomejs/biome init
```
Commit: `chore: bootstrap next.js 15 + tailwind v4`

### Step 2 — Tokens + base styles (30 min)
- Create `src/styles/tokens.css` and `src/styles/base.css` with Section 3 content.
- Update `src/app/globals.css` to import them + define Tailwind `@theme` mappings.
- Configure fonts in `src/app/layout.tsx` via `next/font/google` (Inter, Instrument Serif), expose as CSS variables.
Commit: `feat(design): define dark editorial token system`

### Step 3 — Customized primitives (90 min)
- `pnpm dlx shadcn@latest init`
- Add Button, Card, Badge, Dialog, Input, Select, Tabs, Tooltip, Separator.
- Override each to use our semantic tokens (no shadcn defaults remain visible).
- Add custom `Tag` primitive (severity pill).
Commit: `feat(ui): add and theme primitives`

### Step 4 — /_style showcase route (45 min)
- `src/app/_style/page.tsx` renders sections: Colors, Typography (display, headings, body, mono, captions), Spacing scale, Radius scale, Motion easings (animated demos), Primitives gallery.
- `TokenSwatch` component shows color/token/value triple.
Commit: `feat(style): /_style showcase route`

### Step 5 — App shell + dogfood strip (45 min)
- `(app)/layout.tsx` with `AppNav` (logo, primary nav, profile pill) and `AegisObservesStrip` showing 4 mock self-metrics: requests/min, p95 latency, error rate, status. Pulses subtly.
Commit: `feat(layout): app shell + Aegis-observes-Aegis strip`

### Step 6 — Mock incident + types (30 min)
- `src/types/incident.ts` and `src/types/agent-event.ts` with full Pydantic-mirror shapes.
- `src/lib/mock-incident.ts` with realistic data (Section 5).
Commit: `feat(data): mock incident fixture`

### Step 7 — IncidentHeader + TelemetryPanel (90 min)
- `IncidentHeader`: serif title, severity tag, time-detected, MTTR running counter, status badge.
- `TelemetryPanel`: 3 Recharts series in a 1×3 stacked grid, with anomaly band highlighted in amber.
- Theme Recharts to match tokens (custom tick/axis colors via SVG style).
Commit: `feat(incident): header + telemetry panel`

### Step 8 — AgentTimeline + cards (120 min)
- `AgentTimeline`: ordered list of `AgentStep`. Staggered Framer Motion entrance.
- `AgentStep`: step icon (lucide), label, summary, expandable detail. Expand reveals `ToolCallCard` or `HypothesisCard`.
- `ToolCallCard`: tool name, input (JSON, collapsed by default), output preview.
- `HypothesisCard`: text + confidence bar + supporting evidence.
- Honor `prefers-reduced-motion`.
Commit: `feat(incident): animated agent timeline`

### Step 9 — ApprovalBar (45 min)
- Sticky footer bar with proposed action card, blast-radius preview, Approve / Reject buttons.
- Approve triggers a confetti-free success state (a green status pill animates in; demo only — no backend yet).
Commit: `feat(incident): approval bar with blast-radius preview`

### Step 10 — Page composition + responsive pass (60 min)
- `(app)/incidents/[id]/page.tsx` assembles all of the above.
- Reads mock data when `id === "demo"`.
- Layout: 12-col grid, `md:` collapses to single column.
- Verify at 320, 768, 1024, 1440.
Commit: `feat(incident): demo page composition + responsive`

### Step 11 — A11y + perf pass (45 min)
- Keyboard nav through timeline.
- Focus rings using `--accent-soft`.
- All charts have `aria-label` summaries.
- Lighthouse on dev build, fix anything < 95.
- Verify reduced-motion variant.
Commit: `chore(a11y): keyboard, contrast, reduced-motion`

### Step 12 — Vercel deploy + README (30 min)
- Push to GitHub.
- Connect Vercel project, deploy.
- `frontend/README.md`: stack, design tokens summary, run instructions, screenshot of `/incidents/demo`.
Commit: `docs: frontend readme + first deploy`

**Total: ~10 focused hours / 1.5 working days.**

---

## 7. Key Files (where the design system lives)

| File | Purpose |
|------|---------|
| `src/styles/tokens.css` | Single source of truth — every visual decision is a token here |
| `src/styles/base.css` | Reset + element baseline |
| `src/app/globals.css` | Imports tokens, defines Tailwind `@theme` bridge |
| `src/app/layout.tsx` | Loads Inter + Instrument Serif as CSS variables |
| `src/components/ui/*` | Themed primitives — must not look like default shadcn |
| `src/components/incident/AgentTimeline.tsx` | The visual centerpiece of the demo video |
| `src/components/incident/ApprovalBar.tsx` | The "humans in control" moment of the demo |
| `src/lib/mock-incident.ts` | Mirror of forthcoming backend SSE event schema |
| `src/app/_style/page.tsx` | Living style guide — anyone joining the project starts here |

---

## 8. Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Tailwind v4 token bridging is still new — config bugs | Pin Tailwind v4 stable; have a v3 fallback config ready (CSS variables work the same either way) |
| Recharts looks generic without heavy theming | Spend 20 min styling axis/grid/tooltip explicitly with token colors; consider Visx as plan-B if Recharts fights us |
| shadcn primitives still look like shadcn after "customization" | Don't leave any default radius, color, or shadow untouched. Cross-check `/_style` showcase against a Linear screenshot — different enough? |
| Animated AgentTimeline is jerky on demo laptop | Only animate `transform`/`opacity`; debounce reduced-motion check; pre-warm `will-change` for entrance, drop it after |
| Instrument Serif loads slow, causes layout shift | `next/font` handles `font-display: optional` + subset; preload only the weight we use |
| Dark theme contrast fails WCAG AA | Set `--text-primary` and `--accent` against `--bg-canvas` to AA 4.5:1 minimum; verify with axe-core during a11y pass |
| Page looks great desktop, broken on mobile | Mobile-first review at Step 10 before claiming done; demo video must work on a phone preview too |

---

## 9. Validation checklist (definition of done)

- [ ] `pnpm dev` starts cleanly on a fresh clone.
- [ ] `/_style` renders every token, primitive, motion easing.
- [ ] `/incidents/demo` looks like a real product on first impression — no template smell.
- [ ] Lighthouse desktop ≥ 95 across all 5 categories.
- [ ] Lighthouse mobile ≥ 90.
- [ ] Full keyboard nav of `/incidents/demo` works.
- [ ] Responsive at 320, 768, 1024, 1440 with no overflow.
- [ ] `prefers-reduced-motion` honored on AgentTimeline entrance.
- [ ] Deployed to Vercel preview URL.
- [ ] Frontend README documents stack, tokens, dev commands.

---

## 10. Hand-off to backend

The mock data shape in `src/lib/mock-incident.ts` becomes the contract for the backend SSE stream. When the backend lands, the only swap is:

```ts
// Before (this plan):
const events = mockIncident.agentEvents;

// After (backend plan):
const events = useAgentStream(incidentId); // SSE consumer
```

No component changes required. The frontend is forward-compatible by design.

---

## 11. SESSION_ID

- **GEMINI_SESSION:** _(not generated — codeagent wrapper not installed locally; analysis synthesized inline by Claude playing the frontend-specialist role)_
